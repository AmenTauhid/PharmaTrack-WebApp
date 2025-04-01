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
  serverTimestamp 
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

// Get messages for a specific conversation
export const getConversationMessages = async (conversationId) => {
  const q = query(
    collection(db, 'conversations', conversationId, 'messages'),
    orderBy('timestamp', 'asc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Send a message in a conversation
export const sendMessage = async (conversationId, senderId, text) => {
  // First, add the message to the subcollection
  const messageData = {
    sender: senderId,
    text: text,
    timestamp: serverTimestamp()
  };
  
  await addDoc(collection(db, 'conversations', conversationId, 'messages'), messageData);
  
  // Then update the conversation with the last message
  const conversationRef = doc(db, 'conversations', conversationId);
  await updateDoc(conversationRef, {
    lastMessage: text,
    lastMessageTime: serverTimestamp()
  });
  
  return true;
};

// Create a new conversation
export const createConversation = async (pharmacistId, patientId, initialMessage) => {
  const conversationData = {
    participants: [pharmacistId, patientId],
    createdAt: serverTimestamp(),
    lastMessage: initialMessage || '',
    lastMessageTime: serverTimestamp()
  };
  
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