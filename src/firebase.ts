// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc,
  getDocs, 
  setDoc, 
  updateDoc, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  deleteDoc,
  Timestamp,
  serverTimestamp,
  Query,
  DocumentData,
  DocumentReference,
  DocumentSnapshot,
  limit // Added limit import
} from "firebase/firestore";

// Add BusinessProfile interface at the top with other interfaces
interface BusinessProfile {
  id?: string;
  business_name?: string;
  logo_url?: string;
  industry_sector?: string;
  company_size?: string;
  description?: string;
  website?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    postal_code?: string;
    country?: string;
  };
  theme_colors?: string[];
  created_at?: any;
  updated_at?: any;
}

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const firestore = getFirestore(app);

auth.useDeviceLanguage();

// Helper functions for authentication
const createUser = async (email: string, password: string) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

const loginUser = async (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password);
};

const logoutUser = async () => {
  return firebaseSignOut(auth);
};

const updateUserProfile = async (user: FirebaseUser, data: { displayName?: string; photoURL?: string }) => {
  return updateProfile(user, data);
};

const sendSignInEmail = async (email: string) => {
  const actionCodeSettings = {
    url: 'http://localhost:3000', // Replace with your app's URL
    handleCodeInApp: true,
  };

  try {
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    window.localStorage.setItem('emailForSignIn', email);
    console.log('Sign-in email sent!');
  } catch (error) {
    console.error('Error sending sign-in email:', error);
  }
};

const completeSignInWithEmailLink = async (email?: string) => {
  if (isSignInWithEmailLink(auth, window.location.href)) {
    try {
      const storedEmail = email || window.localStorage.getItem('emailForSignIn');
      if (!storedEmail) throw new Error('No email found for sign-in.');

      const result = await signInWithEmailLink(auth, storedEmail, window.location.href);
      window.localStorage.removeItem('emailForSignIn');
      console.log('Successfully signed in:', result.user);
    } catch (error) {
      console.error('Error completing sign-in:', error);
    }
  }
};

// Helper functions for Firestore database operations
const getDocument = async (collectionName: string, documentId: string) => {
  try {
    const docRef = doc(firestore, collectionName, documentId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { data: { ...docSnap.data(), id: docSnap.id }, error: null };
    } else {
      return { data: null, error: { message: "Document not found" } };
    }
  } catch (error: any) {
    return { data: null, error: { message: error.message } };
  }
};

// Helper function to handle Firebase index errors with clear guidance
const handleIndexError = (error: any) => {
  if (error?.code === 'failed-precondition' && error.message?.includes('requires an index')) {
    // Extract the index creation URL from the error message if available
    const indexUrlMatch = error.message.match(/https:\/\/console\.firebase\.google\.com\/[^\s"]*/);
    const indexUrl = indexUrlMatch ? indexUrlMatch[0] : null;
    
    console.error(`
    ========== FIREBASE INDEX ERROR ==========
    You need to create a composite index for this query.
    ${indexUrl ? `Click this link to create it: ${indexUrl}` : 'Check the Firebase error message for the link'}
    
    After clicking the link:
    1. Sign in to your Firebase account
    2. Click "Create index" on the page that opens
    3. Wait for the index to be created (this may take a few minutes)
    4. Try your query again
    =========================================
    `);
    
    return {
      message: 'This query requires a Firebase index. Please check the console for instructions.',
      code: 'needs-index',
      indexUrl: indexUrl
    };
  }
  return {
    message: error.message || 'Unknown error',
    code: error.code || 'unknown',
    details: error.details || error.stack
  };
};

// Define a more comprehensive operator type
type FirebaseQueryOperator = 
  | "==" | "!=" | ">" | ">=" | "<" | "<=" 
  | "in" | "not-in" | "array-contains" | "array-contains-any";

// Export the type
export type { FirebaseQueryOperator };

const getDocuments = async (
  collectionName: string, 
  conditions?: { field: string; operator: FirebaseQueryOperator; value: any }[],
  sortOptions?: { field: string; direction: "asc" | "desc" }[],
  limitCount?: number // Added limitCount parameter
) => {
  try {
    console.log(`Fetching documents from ${collectionName} with conditions:`, conditions, "sortOptions:", sortOptions, "limit:", limitCount);
    
    let q: Query<DocumentData> = collection(firestore, collectionName);
    const queryConstraintsArray: any[] = [];
    
    if (conditions && conditions.length > 0) {
      conditions.forEach(condition => {
        console.log('Adding condition:', condition);
        queryConstraintsArray.push(where(condition.field, condition.operator as any, condition.value)); // Use 'as any' for operator due to Firebase SDK typing nuances with custom type
      });
    }
    
    if (sortOptions && sortOptions.length > 0) {
      sortOptions.forEach(option => {
        console.log('Adding sort option:', option);
        queryConstraintsArray.push(orderBy(option.field, option.direction));
      });
    }

    if (limitCount !== undefined && limitCount > 0) {
      console.log('Adding limit:', limitCount);
      queryConstraintsArray.push(limit(limitCount));
    }
    
    if (queryConstraintsArray.length > 0) {
      q = query(q, ...queryConstraintsArray);
    }
    
    console.log('Executing Firestore query...');
    const querySnapshot = await getDocs(q);
    
    const documents = querySnapshot.docs.map(doc => {
      const data = doc.data();
      console.log(`Document ${doc.id}:`, data);
      return {
        ...data,
        id: doc.id
      };
    });
    
    console.log(`Found ${documents.length} documents`);
    return { data: documents, error: null };
  } catch (error: any) {
    console.error('Error in getDocuments:', error);
    const formattedError = handleIndexError(error);
    
    return { 
      data: null, 
      error: formattedError
    };
  }
};

const createDocument = async (collectionName: string, data: any, documentId?: string) => {
  try {
    let docRef;
    
    // Add timestamps
    const dataWithTimestamps = {
      ...data,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    };
    
    if (documentId) {
      // Use the provided ID
      docRef = doc(firestore, collectionName, documentId);
      await setDoc(docRef, dataWithTimestamps);
    } else {
      // Let Firestore generate an ID
      docRef = await addDoc(collection(firestore, collectionName), dataWithTimestamps);
    }
    
    return { data: { id: documentId || docRef.id }, error: null };
  } catch (error: any) {
    return { data: null, error: { message: error.message } };
  }
};

const updateDocument = async (collectionName: string, documentId: string, data: any) => {
  try {
    const docRef = doc(firestore, collectionName, documentId);
    
    // Add updated timestamp
    const dataWithTimestamp = {
      ...data,
      updated_at: serverTimestamp()
    };
    
    await updateDoc(docRef, dataWithTimestamp);
    return { data: { id: documentId }, error: null };
  } catch (error: any) {
    return { data: null, error: { message: error.message } };
  }
};

const deleteDocument = async (collectionName: string, documentId: string) => {
  try {
    const docRef = doc(firestore, collectionName, documentId);
    await deleteDoc(docRef);
    return { error: null };
  } catch (error: any) {
    return { error: { message: error.message } };
  }
};

// Helper function to match applications with lenders based on criteria
const matchApplicationWithLenders = async (applicationId: string, lenderIds: string[]) => {
  try {
    const docRef = doc(firestore, 'applications', applicationId);
    
    // Update the application with matched lenders
    await updateDoc(docRef, {
      matched_lenders: lenderIds,
      status: 'matched',
      updated_at: serverTimestamp()
    });
    
    return { data: { id: applicationId }, error: null };
  } catch (error: any) {
    return { data: null, error: { message: error.message } };
  }
};

// Get all applications available for a lender
const getLenderApplications = async (lenderId: string) => {
  try {
    // Get matched applications first
    const matchedSnap = await getDocs(query(
      collection(firestore, 'applications'),
      where('matched_lenders', 'array-contains', lenderId)
    ));
    
    // Process matched applications and get business data
    const matchedApplications = await Promise.all(matchedSnap.docs.map(async docSnap => {
      const appData = docSnap.data();
      const businessRef = doc(firestore, 'businesses', appData.user_id);
      const businessSnap = await getDoc(businessRef);
      const businessData = businessSnap.data() as BusinessProfile | undefined;
      
      return {
        ...appData,
        id: docSnap.id,
        user_id: appData.user_id,
        business_id: appData.user_id,
        isMatched: true,
        business: businessSnap.exists() ? {
          business_name: businessData?.business_name || 'Unnamed Business',
          logo_url: businessData?.logo_url,
          industry_sector: businessData?.industry_sector
        } : null
      };
    }));

    // Get available applications
    const availableSnap = await getDocs(query(
      collection(firestore, 'applications'),
      where('status', '==', 'submitted')
    ));
    
    const availableApplications = (await Promise.all(availableSnap.docs
      .filter(docSnap => !docSnap.data().matched_lenders?.includes(lenderId))
      .map(async docSnap => {
        const appData = docSnap.data();
        const businessRef = doc(firestore, 'businesses', appData.user_id);
        const businessSnap = await getDoc(businessRef);
        const businessData = businessSnap.data() as BusinessProfile | undefined;
        
        return {
          ...appData,
          id: docSnap.id,
          user_id: appData.user_id,
          business_id: appData.user_id,
          isMatched: false,
          business: businessSnap.exists() ? {
            business_name: businessData?.business_name || 'Unnamed Business',
            logo_url: businessData?.logo_url,
            industry_sector: businessData?.industry_sector
          } : null
        };
      })));
    
    return { 
      data: [...matchedApplications, ...availableApplications], 
      error: null 
    };
  } catch (error: any) {
    console.error('Error in getLenderApplications:', error);
    return { 
      data: null, 
      error: { 
        message: error.message,
        code: error.code,
        details: error.details || error.stack
      } 
    };
  }
};

// Express interest in an application
const expressInterestInApplication = async (applicationId: string, lenderId: string, lenderProfile: any) => {
  try {
    // Get the current application data
    const { data: application, error } = await getDocument('applications', applicationId);
    
    if (error) {
      return { data: null, error };
    }
    
    // Add the lender to the interested_lenders array if they're not already there
    const interestedLenders = application.interested_lenders || [];
    
    if (interestedLenders.some((l: any) => l.lender_id === lenderId)) {
      return { 
        data: { already_interested: true }, 
        error: null 
      };
    }
    
    // Create an interest record with a regular Date object instead of serverTimestamp()
    // because serverTimestamp() is not supported inside arrays in Firestore
    const interestData = {
      lender_id: lenderId,
      lender_name: lenderProfile?.lender_name || 'Unnamed Lender',
      lender_company: lenderProfile?.company_name || '',
      expressed_at: new Date(),  // Use regular JavaScript Date instead of serverTimestamp()
      status: 'pending', // pending, accepted, rejected
    };
    
    // Update the application document with the new interested lender
    await updateDoc(doc(firestore, 'applications', applicationId), {
      interested_lenders: [...interestedLenders, interestData],
      updated_at: serverTimestamp()  // serverTimestamp is fine for top-level fields
    });
    
    // Create a notification for the business owner
    const notificationData = {
      user_id: application.user_id,
      type: 'new_interest',
      title: 'New lender interest',
      message: `${lenderProfile?.lender_name || 'A lender'} has expressed interest in your application`,
      application_id: applicationId,
      lender_id: lenderId,
      read: false,
      created_at: serverTimestamp()
    };
    
    await createDocument('notifications', notificationData);
    
    return { 
      data: { success: true }, 
      error: null 
    };
  } catch (error: any) {
    console.error('Error expressing interest:', error);
    return { 
      data: null, 
      error: { 
        message: error.message,
        code: error.code || 'unknown',
        details: error.details || error.stack
      } 
    };
  }
};

// Credit system functions
const deductCredits = async (userId: string, amount: number) => {
  const { data: billingData, error: fetchError } = await getDocument('lender_billing', userId);
  if (fetchError) throw fetchError;

  const availableCredits = (billingData?.credits_balance || 0) - (billingData?.credits_used || 0);
  if (availableCredits < amount) {
    throw new Error('Insufficient credits');
  }

  const { error: updateError } = await updateDocument('lender_billing', userId, {
    credits_used: (billingData?.credits_used || 0) + amount
  });

  if (updateError) throw updateError;

  // Record the credit transaction
  const { error: transactionError } = await createDocument('credit_transactions', {
    lender_id: userId,
    amount: -amount,
    transaction_type: 'use',
    description: 'Credits used for application view',
    balance_after: availableCredits - amount,
    created_at: new Date().toISOString()
  });

  if (transactionError) throw transactionError;

  return { availableCredits: availableCredits - amount };
};

const refundCredits = async (userId: string, amount: number) => {
  const { data: billingData, error: fetchError } = await getDocument('lender_billing', userId);
  if (fetchError) throw fetchError;

  const { error: updateError } = await updateDocument('lender_billing', userId, {
    credits_used: Math.max(0, (billingData?.credits_used || 0) - amount)
  });

  if (updateError) throw updateError;

  // Record the credit refund transaction
  const { error: transactionError } = await createDocument('credit_transactions', {
    lender_id: userId,
    amount: amount,
    transaction_type: 'refund',
    description: 'Credits refunded',
    balance_after: (billingData?.credits_balance || 0) - ((billingData?.credits_used || 0) - amount),
    created_at: new Date().toISOString()
  });

  if (transactionError) throw transactionError;
};

// Credits purchase request functions
const approveCreditPurchase = async (userId: string, requestId: string) => {
  const { data: request, error: fetchError } = await getDocument('credit_purchase_requests', requestId);
  if (fetchError) throw fetchError;

  // Get current billing data
  const { data: billingData, error: billingError } = await getDocument('lender_billing', userId);
  if (billingError) throw billingError;

  // Update request status
  const { error: updateRequestError } = await updateDocument('credit_purchase_requests', requestId, {
    status: 'approved',
    approved_at: new Date().toISOString()
  });
  if (updateRequestError) throw updateRequestError;

  // Update credit balance
  const { error: updateBalanceError } = await updateDocument('lender_billing', userId, {
    credits_balance: (billingData?.credits_balance || 0) + request.credits
  });
  if (updateBalanceError) throw updateBalanceError;

  // Record the credit purchase transaction
  const { error: transactionError } = await createDocument('credit_transactions', {
    lender_id: userId,
    amount: request.credits,
    transaction_type: 'purchase',
    description: `Purchased ${request.credits} credit${request.credits === 1 ? '' : 's'} via ${request.payment_method}`,
    balance_after: (billingData?.credits_balance || 0) + request.credits,
    created_at: new Date().toISOString()
  });
  if (transactionError) throw transactionError;

  return { success: true };
};

const rejectCreditPurchase = async (requestId: string, reason: string) => {
  const { error } = await updateDocument('credit_purchase_requests', requestId, {
    status: 'rejected',
    rejected_at: new Date().toISOString(),
    rejection_reason: reason
  });

  if (error) throw error;
  return { success: true };
};

// Stripe-related functions
const createStripePaymentIntent = async (userId: string, amount: number, metadata: any = {}) => {
  const { data: paymentIntent, error } = await createDocument('stripe_payment_intents', {
    amount,
    currency: 'gbp',
    lender_id: userId,
    metadata: {
      ...metadata,
      userId
    }
  });

  if (error) throw error;
  return paymentIntent;
};

const updateStripePaymentMethod = async (userId: string, paymentMethodId: string) => {
  const { error } = await updateDocument('lender_billing', userId, {
    payment_method_id: paymentMethodId,
    updated_at: new Date().toISOString()
  });

  if (error) throw error;
};

// Create first message in a conversation
const createFirstMessage = async (data: {
  conversation_id: string,
  application_id: string,
  sender_id: string,
  sender_type: 'lender' | 'business',
  recipient_id: string,
  message: string
}) => {
  try {
    const messageDoc = {
      ...data,
      timestamp: new Date().toISOString(),
      read: false,
      // Add metadata that might be useful for future features
      metadata: {
        first_message: true,
        sender_deleted: false,
        recipient_deleted: false
      }
    };

    const { error } = await createDocument('messages', messageDoc);
    if (error) throw error;

    // Create a notification for the recipient
    const notificationData = {
      recipient_id: data.recipient_id,
      type: 'new_message',
      title: 'New conversation started',
      message: `New message from ${data.sender_type === 'lender' ? 'a lender' : 'a business'}`,
      related_entity_id: data.conversation_id,
      related_entity_type: 'conversation',
      read: false,
      sent_at: new Date().toISOString()
    };

    await createDocument('notifications', notificationData);

    return { success: true };
  } catch (error: any) {
    console.error('Error creating first message:', error);
    return { error };
  }
};

// Add this function to create a test message between lender and business
const createTestMessageBetweenUsers = async (lenderId: string, businessId: string, applicationId: string, offerId: string) => {
  try {
    console.log('Creating test message with parameters:', { lenderId, businessId, applicationId, offerId });
    
    // Use the offer ID as the conversation ID
    const conversation_id = offerId;
    
    // Create a test message from lender to business
    const messageData = {
      conversation_id,
      application_id: applicationId,
      sender_id: lenderId,
      sender_type: 'lender',
      recipient_id: businessId,
      message: "This is a test message from the lender to verify messaging works.",
      timestamp: new Date().toISOString(),
      read: false
    };
    
    const { data, error } = await createDocument('messages', messageData);
    
    if (error) {
      console.error('Error creating test message:', error);
      return { error };
    }
    
    console.log('Test message created successfully with ID:', data.id);
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error('Exception creating test message:', error);
    return { error };
  }
};

// Force create a message in Firebase (direct creation bypassing potential issues)
const forceCreateMessage = async ({
  conversationId,
  applicationId,
  senderId,
  senderType,
  recipientId,
  message
}) => {
  try {
    console.log('Force creating message with data:', {
      conversationId,
      applicationId, 
      senderId,
      senderType,
      recipientId,
      message
    });
    
    // Use a straightforward document structure that will work without complex indexes
    const messageData = {
      conversation_id: conversationId,
      application_id: applicationId,
      sender_id: senderId,
      sender_type: senderType,
      recipient_id: recipientId,
      message: message,
      timestamp: new Date().toISOString(),
      read: false
    };
    
    // Direct document creation instead of using the createDocument helper
    const messagesCollection = collection(firestore, 'messages');
    const docRef = await addDoc(messagesCollection, messageData);
    
    console.log('Message created with ID:', docRef.id);
    
    return { 
      success: true, 
      messageId: docRef.id,
      data: {
        ...messageData,
        id: docRef.id
      }
    };
  } catch (error) {
    console.error('Error force creating message:', error);
    return { error };
  }
};

// Function to send invoice email
const sendInvoiceEmail = async (userId: string, credits: number, amount: number) => {
  try {
    // Get user data and lender profile
    const { data: billingData } = await getDocument('lender_billing', userId);
    const { data: lenderProfile } = await getDocument('lender_profiles', userId);
    
    // Create email data
    const emailData = {
      to: billingData?.billing_email || lenderProfile?.email,
      subject: 'FundHub - Credit Purchase Invoice',
      template: 'invoice_email',
      data: {
        companyName: lenderProfile?.company_name || 'Valued Customer',
        credits: credits,
        amount: amount,
        invoiceNumber: `INV-${Date.now()}-${userId.substring(0, 6)}`,
        date: new Date().toISOString(),
      }
    };

    // Create an email request document
    const { error } = await createDocument('email_requests', {
      ...emailData,
      status: 'pending',
      created_at: new Date().toISOString(),
      userId: userId
    });

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('Error sending invoice email:', error);
    return { error };
  }
};

// Export everything together
export {
  app,
  analytics,
  auth,
  firestore,
  createUser,
  loginUser,
  logoutUser,
  updateUserProfile,
  sendSignInEmail,
  completeSignInWithEmailLink,
  getDocument,
  getDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
  matchApplicationWithLenders,
  getLenderApplications,
  expressInterestInApplication,
  createStripePaymentIntent,
  updateStripePaymentMethod,
  deductCredits,
  refundCredits,
  createFirstMessage,
  createTestMessageBetweenUsers,
  forceCreateMessage,
  sendInvoiceEmail,
  serverTimestamp,
  // FirebaseQueryOperator // Remove from here if it was previously, ensure it's exported with \'export type\'
};