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

// Get single patient
export const getPatient = async (patientId) => {
  const docRef = doc(db, 'patients', patientId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
};

// Get prescriptions for a patient
export const getPatientPrescriptions = async (patientId) => {
  const q = query(
    collection(db, 'prescriptions'), 
    where('patientId', '==', patientId),
    orderBy('createdAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Get messages for a conversation
export const getConversationMessages = async (conversationId) => {
  const q = query(
    collection(db, 'messages'),
    where('conversationId', '==', conversationId),
    orderBy('timestamp', 'asc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Get all conversations for the current user
export const getUserConversations = async (userId) => {
  const q = query(
    collection(db, 'conversations'),
    where('participants', 'array-contains', userId)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Send a message
export const sendMessage = async (conversationId, userId, message) => {
  const messageData = {
    conversationId,
    sender: userId,
    text: message,
    timestamp: serverTimestamp()
  };
  
  const docRef = await addDoc(collection(db, 'messages'), messageData);
  
  // Update last message in conversation
  const conversationRef = doc(db, 'conversations', conversationId);
  await updateDoc(conversationRef, {
    lastMessage: message,
    lastMessageTime: serverTimestamp()
  });
  
  return docRef.id;
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