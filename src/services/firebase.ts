import { getFirestore, doc, setDoc, updateDoc, getDoc } from 'firebase/firestore';
import { initializeApp, getApps, getApp } from 'firebase/app';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

// Function to save funding application data
export const saveFundingApplication = async (userId: string, data: Record<string, any>) => {
  if (!userId) {
    throw new Error('User ID is required to save the funding application.');
  }

  if (!data || typeof data !== 'object') {
    throw new Error('Valid data is required to save the funding application.');
  }

  console.log('Saving funding application for user:', userId, 'with data:', data);

  const docRef = doc(db, 'users', userId);
  await setDoc(docRef, { fundingApplication: data }, { merge: true });
};

// Function to update a document in Firestore
export const updateDocument = async (collectionName: string, documentId: string, data: Record<string, any>) => {
  if (!collectionName || !documentId || !data) {
    throw new Error('Collection name, document ID, and data are required to update a document.');
  }

  console.log(`Updating document in collection: ${collectionName}, ID: ${documentId}, with data:`, data);

  const docRef = doc(db, collectionName, documentId);
  await updateDoc(docRef, data);
};

// Function to create a document in Firestore
export const createDocument = async (collectionName: string, data: Record<string, any>, documentId?: string) => {
  if (!collectionName || !data) {
    throw new Error('Collection name and data are required to create a document.');
  }

  console.log(`Creating document in collection: ${collectionName}, with data:`, data);

  const docRef = documentId
    ? doc(db, collectionName, documentId)
    : doc(db, collectionName);

  await setDoc(docRef, data);
};

// Function to get a document from Firestore
export const getDocument = async (collectionName: string, documentId: string) => {
  if (!collectionName || !documentId) {
    throw new Error('Collection name and document ID are required to get a document.');
  }

  console.log(`Fetching document from collection: ${collectionName}, ID: ${documentId}`);

  const docRef = doc(db, collectionName, documentId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, data: docSnap.data() };
  } else {
    console.log('No such document!');
    return null;
  }
};
