import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getFirestore, collection, addDoc, query, where, getDocs, doc, updateDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const storage = getStorage();
const db = getFirestore();

// File validation utilities
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/tiff'
];

export interface SharedDocument {
  id: string;
  application_id: string;
  business_id: string;
  lender_id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  file_url: string;
  shared_by: string;
  shared_with: string;
  shared_at: Date;
  description?: string;
  category?: string;
  status: 'shared' | 'viewed' | 'downloaded';
  message_id?: string;
}

export const validateFile = (file: File): { valid: boolean; message?: string } => {
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      message: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)} MB.`
    };
  }
  
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return {
      valid: false,
      message: `File type ${file.type} not supported. Please upload a PDF, Excel, Word document or image file.`
    };
  }
  
  return { valid: true };
};

export const uploadDocumentToStorage = async (
  file: File,
  applicationId: string,
  userId: string
): Promise<string> => {
  const timestamp = Date.now();
  const filename = `${timestamp}_${file.name}`;
  const storageRef = ref(storage, `shared-documents/${applicationId}/${userId}/${filename}`);
  
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
};

export const shareDocument = async (
  file: File,
  applicationId: string,
  businessId: string,
  lenderId: string,
  sharedWith: string,
  description?: string,
  category?: string
): Promise<SharedDocument> => {
  const auth = getAuth();
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('User not authenticated');

  // Validate file
  const validation = validateFile(file);
  if (!validation.valid) {
    throw new Error(validation.message);
  }

  try {
    // Upload file to storage
    const fileUrl = await uploadDocumentToStorage(file, applicationId, currentUser.uid);

    // Create document record in Firestore
    const documentData = {
      application_id: applicationId,
      business_id: businessId,
      lender_id: lenderId,
      file_name: file.name,
      file_size: file.size,
      file_type: file.type,
      file_url: fileUrl,
      shared_by: currentUser.uid,
      shared_with: sharedWith,
      shared_at: serverTimestamp(),
      description: description || '',
      category: category || 'Other',
      status: 'shared',
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'shared_documents'), documentData);
    
    return {
      id: docRef.id,
      ...documentData,
      shared_at: new Date()
    } as SharedDocument;
  } catch (error) {
    console.error('Error sharing document:', error);
    throw error;
  }
};

export const getSharedDocuments = async (
  applicationId: string,
  userId: string
): Promise<SharedDocument[]> => {
  try {
    const q = query(
      collection(db, 'shared_documents'),
      where('application_id', '==', applicationId),
      where('shared_with', '==', userId),
      orderBy('shared_at', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      shared_at: doc.data().shared_at?.toDate() || new Date()
    })) as SharedDocument[];
  } catch (error) {
    console.error('Error fetching shared documents:', error);
    return [];
  }
};

export const getAllSharedDocuments = async (
  applicationId: string
): Promise<SharedDocument[]> => {
  try {
    // First try with sorting, fall back to no sorting if index doesn't exist
    let q;
    try {
      q = query(
        collection(db, 'shared_documents'),
        where('application_id', '==', applicationId),
        orderBy('shared_at', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data() as any;
        return {
          id: doc.id,
          ...data,
          shared_at: data.shared_at?.toDate() || new Date()
        };
      }) as SharedDocument[];
    } catch (indexError) {
      console.warn('Composite index not available, falling back to unsorted query:', indexError);
      
      // Fallback query without sorting
      q = query(
        collection(db, 'shared_documents'),
        where('application_id', '==', applicationId)
      );
      
      const querySnapshot = await getDocs(q);
      const documents = querySnapshot.docs.map(doc => {
        const data = doc.data() as any;
        return {
          id: doc.id,
          ...data,
          shared_at: data.shared_at?.toDate() || new Date()
        };
      }) as SharedDocument[];
      
      // Sort manually in JavaScript
      return documents.sort((a, b) => new Date(b.shared_at).getTime() - new Date(a.shared_at).getTime());
    }
  } catch (error) {
    console.error('Error fetching all shared documents:', error);
    return [];
  }
};

export const markDocumentAsViewed = async (documentId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'shared_documents', documentId), {
      status: 'viewed',
      viewed_at: serverTimestamp(),
      updated_at: serverTimestamp()
    });
  } catch (error) {
    console.error('Error marking document as viewed:', error);
  }
};

export const markDocumentAsDownloaded = async (documentId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'shared_documents', documentId), {
      status: 'downloaded',
      downloaded_at: serverTimestamp(),
      updated_at: serverTimestamp()
    });
  } catch (error) {
    console.error('Error marking document as downloaded:', error);
  }
};

export const deleteSharedDocument = async (
  documentId: string,
  fileUrl: string
): Promise<void> => {
  try {
    // Delete from storage
    const storageRef = ref(storage, fileUrl);
    await deleteObject(storageRef);
    
    // Delete from Firestore
    await updateDoc(doc(db, 'shared_documents', documentId), {
      status: 'deleted',
      deleted_at: serverTimestamp(),
      updated_at: serverTimestamp()
    });
  } catch (error) {
    console.error('Error deleting shared document:', error);
    throw error;
  }
};
