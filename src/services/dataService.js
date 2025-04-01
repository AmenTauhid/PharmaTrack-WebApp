import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  updateDoc, 
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from './firebase';

// Get all patients
export const getPatients = async () => {
  const snapshot = await getDocs(collection(db, 'patients'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Get prescriptions for a patient
export const getPatientPrescriptions = async (patientId) => {
  const q = query(
    collection(db, 'prescriptions'), 
    where('forUser', '==', patientId),
    where('status', '==', 'completed'),
    orderBy('prescribedDate', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Get all conversations for a user
export const getUserConversations = async (userId) => {
  const q = query(
    collection(db, 'conversations'),
    where('participants', 'array-contains', userId),
    orderBy('lastMessageTime', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Subscribe to user conversations in real-time
export const subscribeToConversations = (userId, callback) => {
  console.log(`Setting up conversations subscription for user: ${userId}`);
  
  try {
    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('participants', 'array-contains', userId),
      orderBy('lastMessageTime', 'desc')
    );
    
    // Verify query
    console.log(`Subscribing to conversations for ${userId}`);
    
    return onSnapshot(q, 
      (snapshot) => {
        console.log(`Conversations snapshot received with ${snapshot.docs.length} docs`);
        const conversations = snapshot.docs.map(doc => {
          const data = doc.data();
          console.log("Conversation data:", data);
          return { 
            id: doc.id, 
            ...data 
          };
        });
        callback(conversations);
      },
      (error) => {
        console.error("Error in conversations subscription:", error);
      }
    );
  } catch (error) {
    console.error("Failed to set up conversations subscription:", error);
    return () => {}; // Return empty function as unsubscribe
  }
};

// Get messages for a specific conversation
export const getConversationMessages = async (conversationId) => {
  const q = query(
    collection(db, 'conversations', conversationId, 'messages'),
    orderBy('timestamp', 'asc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Subscribe to messages real-time updates
export const subscribeToMessages = (conversationId, callback) => {
  console.log(`Setting up subscription for conversation: ${conversationId}`);
  
  try {
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));
    
    // Verify collection path is valid
    console.log(`Subscribing to: ${messagesRef.path}`);
    
    return onSnapshot(q, 
      (snapshot) => {
        console.log(`Snapshot received with ${snapshot.docs.length} docs`);
        const messages = snapshot.docs.map(doc => {
          const data = doc.data();
          // Add debugging info
          console.log("Message data:", data);
          
          // Ensure message has the expected structure
          return { 
            id: doc.id, // Use document ID as message ID
            sender: data.sender,
            text: data.text,
            timestamp: data.timestamp,
            ...data  // Include any other fields
          };
        });
        console.log("Processed messages:", messages);
        callback(messages);
      },
      (error) => {
        console.error("Error in messages subscription:", error);
      }
    );
  } catch (error) {
    console.error("Failed to set up messages subscription:", error);
    return () => {}; // Return empty function as unsubscribe
  }
};

// Send a message in a conversation
export const sendMessage = async (conversationId, senderId, text) => {
  console.log(`Sending message to conversation ${conversationId} from ${senderId}: ${text}`);
  
  try {
    // First, add the message to the subcollection
    const messageData = {
      sender: senderId,
      text: text,
      timestamp: serverTimestamp()
    };
    
    console.log("Message data to save:", messageData);
    
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    console.log(`Writing to collection: ${messagesRef.path}`);
    
    const docRef = await addDoc(messagesRef, messageData);
    console.log(`Message written with ID: ${docRef.id}`);
    
    // Then update the conversation with the last message
    const conversationRef = doc(db, 'conversations', conversationId);
    await updateDoc(conversationRef, {
      lastMessage: text,
      lastMessageTime: serverTimestamp()
    });
    
    console.log("Conversation updated with last message");
    return true;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};

// Create a new conversation
export const createConversation = async (pharmacistId, patientId, initialMessage) => {
  // Try to get patient name to include in the conversation
  let patientName = null;
  try {
    const patientDoc = await getDoc(doc(db, 'patients', patientId));
    if (patientDoc.exists()) {
      const patientData = patientDoc.data();
      patientName = `${patientData.firstName} ${patientData.lastName}`;
    }
  } catch (error) {
    console.error('Error getting patient name for conversation:', error);
  }
  
  const conversationData = {
    participants: [pharmacistId, patientId],
    createdAt: serverTimestamp(),
    lastMessage: initialMessage || '',
    lastMessageTime: serverTimestamp(),
    patientName: patientName || 'Patient' // Include patient name in conversation data
  };
  
  console.log(`Creating conversation with data:`, conversationData);
  
  const docRef = await addDoc(collection(db, 'conversations'), conversationData);
  return docRef.id;
};

// Get single patient
export const getPatient = async (patientId) => {
  const docRef = doc(db, 'patients', patientId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
};
// Add this function to your dataService.js file
// Add this function to your dataService.js file

// Get all prescription requests from Firestore (not just completed ones)
// In dataService.js - modify getPatientPrescriptionRequests
export const getPatientPrescriptionRequests = async (patientId) => {
  try {
    // Simplified query without orderBy to avoid index requirement
    const q = query(
      collection(db, 'prescriptions'), 
      where('forUser', '==', patientId)
      // Removed orderBy to avoid index requirement for now
    );
    
    const snapshot = await getDocs(q);
    
    // Sort the results in memory instead
    const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return results.sort((a, b) => {
      // Convert to dates if they're timestamps
      const dateA = a.prescribedDate?.toDate?.() || new Date(a.prescribedDate);
      const dateB = b.prescribedDate?.toDate?.() || new Date(b.prescribedDate);
      return dateB - dateA; // Sort descending
    });
  } catch (error) {
    console.error("Error fetching patient prescriptions:", error);
    return [];
  }
};

// Similarly update getAllPendingPrescriptionRequests

// Get all pending prescription requests for all patients
export const getAllPendingPrescriptionRequests = async () => {
  // Query for prescriptions with status 'requestReceived' or similar statuses that indicate pending
  const q = query(
    collection(db, 'prescriptions'),
    where('status', 'in', ['requestReceived', 'entered', 'pharmacistCheck']),
    orderBy('prescribedDate', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Update prescription status 
export const updatePrescriptionStatus = async (prescriptionId, newStatus, message = null) => {
  const prescriptionRef = doc(db, 'prescriptions', prescriptionId);
  
  // First get the current prescription
  const prescriptionDoc = await getDoc(prescriptionRef);
  
  if (!prescriptionDoc.exists()) {
    throw new Error('Prescription not found');
  }
  
  const prescriptionData = prescriptionDoc.data();
  
  // Create a status update with a JavaScript Date instead of serverTimestamp
  // This works because Firebase automatically converts JS Date objects to Firestore Timestamps
  const statusUpdate = {
    status: newStatus,
    timestamp: new Date(), // Use JavaScript Date instead of serverTimestamp()
    message: message || `Status updated to ${newStatus}`
  };
  
  // Update the prescription with new status and add to history
  await updateDoc(prescriptionRef, {
    status: newStatus,
    statusHistory: [...(prescriptionData.statusHistory || []), statusUpdate],
    notifiedOnStatusChange: true
  });
  
  console.log(`Prescription ${prescriptionId} status updated to: ${newStatus}`);
  return true;
};

// Add a message from pharmacist to a prescription
export const addPharmacistMessage = async (prescriptionId, message) => {
  const prescriptionRef = doc(db, 'prescriptions', prescriptionId);
  
  // First get the current prescription
  const prescriptionDoc = await getDoc(prescriptionRef);
  
  if (!prescriptionDoc.exists()) {
    throw new Error('Prescription not found');
  }
  
  // Create chat message
  const chatMessage = {
    id: Date.now().toString(), // Simple ID generation
    content: message,
    timestamp: serverTimestamp(),
    isFromUser: false
  };
  
  // Update the prescription with the new message
  const prescriptionData = prescriptionDoc.data();
  const pharmacistMessages = prescriptionData.pharmacistMessages || [];
  
  await updateDoc(prescriptionRef, {
    pharmacistMessage: message, // For backward compatibility
    pharmacistMessages: [...pharmacistMessages, chatMessage]
  });
  
  return true;
};