// This script is for populating sample data in your Firebase instance for testing
// Run with: node scripts/populateSampleData.js

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  serverTimestamp 
} = require('firebase/firestore');
const { 
  getAuth, 
  createUserWithEmailAndPassword 
} = require('firebase/auth');

// Load environment variables
require('dotenv').config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function createPharmacistUser() {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, 'pharmacist@example.com', 'password123');
    const uid = userCredential.user.uid;
    
    await setDoc(doc(db, 'pharmacists', uid), {
      name: 'John Pharmacist',
      email: 'pharmacist@example.com',
      role: 'pharmacist',
      createdAt: serverTimestamp()
    });
    
    console.log('Created pharmacist user with ID:', uid);
    return uid;
  } catch (error) {
    console.error('Error creating pharmacist user:', error);
    if (error.code === 'auth/email-already-in-use') {
      console.log('Pharmacist user already exists, continuing...');
    } else {
      throw error;
    }
  }
}

async function createSamplePatients() {
  const patients = [
    {
      firstName: 'Jane',
      lastName: 'Doe',
      dateOfBirth: '1985-04-15',
      phone: '555-123-4567',
      email: 'jane.doe@example.com',
      medicalId: 'MED-12345',
      primaryDoctor: 'Dr. Smith',
      allergies: ['Penicillin', 'Peanuts'],
      createdAt: serverTimestamp()
    },
    {
      firstName: 'Bob',
      lastName: 'Johnson',
      dateOfBirth: '1970-10-23',
      phone: '555-987-6543',
      email: 'bob.johnson@example.com',
      medicalId: 'MED-67890',
      primaryDoctor: 'Dr. Wilson',
      allergies: ['Sulfa Drugs'],
      createdAt: serverTimestamp()
    },
    {
      firstName: 'Alice',
      lastName: 'Smith',
      dateOfBirth: '1992-07-08',
      phone: '555-456-7890',
      email: 'alice.smith@example.com',
      medicalId: 'MED-24680',
      primaryDoctor: 'Dr. Martinez',
      allergies: [],
      createdAt: serverTimestamp()
    }
  ];
  
  const patientIds = [];
  
  for (const patient of patients) {
    const docRef = await addDoc(collection(db, 'patients'), patient);
    console.log('Created patient with ID:', docRef.id);
    patientIds.push(docRef.id);
  }
  
  return patientIds;
}

async function createSamplePrescriptions(patientIds) {
  const prescriptions = [
    {
      patientId: patientIds[0],
      prescriptionNumber: 'RX-12345',
      doctorName: 'Dr. Smith',
      status: 'Ready',
      notes: 'Take with food',
      createdAt: serverTimestamp(),
      medications: [
        {
          name: 'Lisinopril',
          dosage: '10mg',
          frequency: 'Once daily',
          instructions: 'Take in the morning with food'
        },
        {
          name: 'Metformin',
          dosage: '500mg',
          frequency: 'Twice daily',
          instructions: 'Take with breakfast and dinner'
        }
      ]
    },
    {
      patientId: patientIds[1],
      prescriptionNumber: 'RX-67890',
      doctorName: 'Dr. Wilson',
      status: 'Pending',
      notes: 'Patient requested delivery',
      createdAt: serverTimestamp(),
      medications: [
        {
          name: 'Atorvastatin',
          dosage: '20mg',
          frequency: 'Once daily',
          instructions: 'Take at bedtime'
        }
      ]
    },
    {
      patientId: patientIds[2],
      prescriptionNumber: 'RX-24680',
      doctorName: 'Dr. Martinez',
      status: 'Ready',
      notes: '',
      createdAt: serverTimestamp(),
      medications: [
        {
          name: 'Amoxicillin',
          dosage: '500mg',
          frequency: 'Three times daily',
          instructions: 'Take until finished, even if symptoms improve'
        },
        {
          name: 'Ibuprofen',
          dosage: '400mg',
          frequency: 'As needed',
          instructions: 'Take for pain, not more than 3 times per day'
        }
      ]
    }
  ];
  
  for (const prescription of prescriptions) {
    const docRef = await addDoc(collection(db, 'prescriptions'), prescription);
    console.log('Created prescription with ID:', docRef.id);
  }
}

async function createSampleConversations(pharmacistId, patientIds) {
  const conversations = [
    {
      participants: [pharmacistId, patientIds[0]],
      createdAt: serverTimestamp(),
      lastMessage: 'Your prescription is ready for pickup',
      lastMessageTime: serverTimestamp(),
      patientName: 'Jane Doe'
    },
    {
      participants: [pharmacistId, patientIds[1]],
      createdAt: serverTimestamp(),
      lastMessage: 'Do you offer delivery options?',
      lastMessageTime: serverTimestamp(),
      patientName: 'Bob Johnson'
    }
  ];
  
  const conversationIds = [];
  
  for (const conversation of conversations) {
    const docRef = await addDoc(collection(db, 'conversations'), conversation);
    console.log('Created conversation with ID:', docRef.id);
    conversationIds.push(docRef.id);
  }
  
  return conversationIds;
}

async function createSampleMessages(conversationIds, pharmacistId, patientIds) {
  // Messages for first conversation
  const messages1 = [
    {
      conversationId: conversationIds[0],
      sender: pharmacistId,
      text: 'Hello Jane, your prescription for Lisinopril and Metformin is ready for pickup.',
      timestamp: serverTimestamp()
    },
    {
      conversationId: conversationIds[0],
      sender: patientIds[0],
      text: 'Thank you! What are your hours today?',
      timestamp: serverTimestamp()
    },
    {
      conversationId: conversationIds[0],
      sender: pharmacistId,
      text: 'We are open until 8pm today.',
      timestamp: serverTimestamp()
    },
    {
      conversationId: conversationIds[0],
      sender: patientIds[0],
      text: 'Great, I will stop by after work.',
      timestamp: serverTimestamp()
    },
    {
      conversationId: conversationIds[0],
      sender: pharmacistId,
      text: 'Your prescription is ready for pickup',
      timestamp: serverTimestamp()
    }
  ];
  
  // Messages for second conversation
  const messages2 = [
    {
      conversationId: conversationIds[1],
      sender: patientIds[1],
      text: 'Hello, do you offer delivery options for prescriptions?',
      timestamp: serverTimestamp()
    },
    {
      conversationId: conversationIds[1],
      sender: pharmacistId,
      text: 'Yes, we do offer delivery within a 10-mile radius. There is a $5 delivery fee.',
      timestamp: serverTimestamp()
    },
    {
      conversationId: conversationIds[1],
      sender: patientIds[1],
      text: 'Do you offer delivery options?',
      timestamp: serverTimestamp()
    }
  ];
  
  const allMessages = [...messages1, ...messages2];
  
  for (const message of allMessages) {
    const docRef = await addDoc(collection(db, 'messages'), message);
    console.log('Created message with ID:', docRef.id);
  }
}

async function populateSampleData() {
  try {
    console.log('Starting to populate sample data...');
    
    const pharmacistId = await createPharmacistUser();
    const patientIds = await createSamplePatients();
    await createSamplePrescriptions(patientIds);
    const conversationIds = await createSampleConversations(pharmacistId, patientIds);
    await createSampleMessages(conversationIds, pharmacistId, patientIds);
    
    console.log('Sample data population complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error populating sample data:', error);
    process.exit(1);
  }
}

populateSampleData();