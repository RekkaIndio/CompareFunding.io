import { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, createUser, loginUser, logoutUser, updateUserProfile, signInWithGoogle, sendMagicLink, signInWithMagicLink, checkIfSignInWithEmailLink, getEmailFromStorage, sendPasswordReset } from '@/firebase';
import { useNavigate } from 'react-router-dom';
import { collection, doc, setDoc, getDoc } from 'firebase/firestore';
import { firestore } from '@/firebase';

// Define a custom user type that includes role information
type UserWithRole = FirebaseUser & {
  role?: 'business' | 'business_owner' | 'lender';
};

type AuthContextType = {
  user: UserWithRole | null;
  isLoading: boolean;
  signUp: (email: string, password: string, userData?: any, autoLogin?: boolean) => Promise<{ error: any | null; data: any | null; }>;
  signIn: (email: string, password: string) => Promise<{ error: any | null; data: any | null; }>;
  signInWithGoogle: () => Promise<{ error: any | null; data: any | null; }>;
  sendMagicLink: (email: string) => Promise<{ success: boolean; error: any | null; }>;
  signInWithMagicLink: (email: string, emailLink: string) => Promise<{ error: any | null; data: any | null; }>;
  checkIfSignInWithEmailLink: () => boolean;
  getEmailFromStorage: () => string | null;
  sendPasswordReset: (email: string) => Promise<{ success: boolean; error: any | null; }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserWithRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch user role from Firestore
  const fetchUserRole = async (currentUser: FirebaseUser | null) => {
    if (!currentUser) return null;
    
    try {
      // First check in users collection
      const userRef = doc(firestore, "users", currentUser.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        if (userData.role) {

          // Enhance user object with role
          const enhancedUser = {
            ...currentUser,
            role: userData.role as 'business' | 'business_owner' | 'lender'
          };
          return enhancedUser;
        }
      }
      
      // If no role in users, check lender_profiles
      const lenderRef = doc(firestore, "lender_profiles", currentUser.uid);
      const lenderSnap = await getDoc(lenderRef);
      
      if (lenderSnap.exists()) {

        // Enhance user object with lender role
        const enhancedUser = {
          ...currentUser,
          role: 'lender' as const
        };
        
        // Update the users collection with the role
        await setDoc(userRef, { role: 'lender' }, { merge: true });
        
        return enhancedUser;
      }
      
      // Check business_profiles or businesses
      const businessRef = doc(firestore, "business_profiles", currentUser.uid);
      const businessSnap = await getDoc(businessRef);
      
      if (businessSnap.exists() || (await getDoc(doc(firestore, "businesses", currentUser.uid))).exists()) {

        // Enhance user object with business role
        const enhancedUser = {
          ...currentUser,
          role: 'business' as const
        };
        
        // Update the users collection with the role
        await setDoc(userRef, { role: 'business' }, { merge: true });
        
        return enhancedUser;
      }
      
      return currentUser;
    } catch (error) {
      console.error("Error fetching user role:", error);
      return currentUser;
    }
  };

  useEffect(() => {
    // Set up Firebase auth state listener
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userWithRole = await fetchUserRole(currentUser);
        setUser(userWithRole);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });
    
    // Clean up subscription
    return () => unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, userData?: any, autoLogin: boolean = true) => {
    try {
      // Create user with Firebase Authentication
      const userCredential = await createUser(email, password);
      const user = userCredential.user;
      
      // Update profile with first name and last name
      if (userData && (userData.first_name || userData.last_name)) {
        const displayName = `${userData.first_name || ''} ${userData.last_name || ''}`.trim();
        await updateUserProfile(user, { displayName });
      }
      
      // Store additional user data in Firestore
      if (userData) {
        const userRef = doc(firestore, "users", user.uid);
        await setDoc(userRef, {
          email: user.email,
          firstName: userData.first_name || '',
          lastName: userData.last_name || '',
          role: userData.role || 'business',
          createdAt: new Date().toISOString(),
        });
      }

      // Skip setting the user if autoLogin is false
      if (autoLogin) {
        setUser({ ...user, role: userData?.role });
      }
      
      return { data: userCredential, error: null };
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const userCredential = await loginUser(email, password);
      
      // After successful login, we'll fetch the user's role for the calling component
      if (userCredential.user) {
        try {
          const userRef = doc(firestore, "users", userCredential.user.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const userData = userSnap.data();
            // We're not redirecting here to maintain separation of concerns
            // The Login component will handle the redirection based on the user role
            
            // Enhance the return data with the user's role for the calling component
            return { 
              data: {...userCredential, userRole: userData.role}, 
              error: null 
            };
          }
        } catch (error) {
          console.error("Error fetching user role during sign in:", error);
          // Continue with login even if role fetch fails
        }
      }
      
      return { data: userCredential, error: null };
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
  };

  const signOut = async () => {
    await logoutUser();
    navigate('/');
  };

  const signInWithGoogleSSO = async () => {
    try {
      const { data: userCredential, error } = await signInWithGoogle();
      
      if (error) {
        return { data: null, error };
      }

      if (userCredential?.user) {
        // Store user data in Firestore for SSO users
        const userRef = doc(firestore, "users", userCredential.user.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          // New user - create user document with business role (default for signup journey)
          await setDoc(userRef, {
            email: userCredential.user.email,
            firstName: userCredential.user.displayName?.split(' ')[0] || '',
            lastName: userCredential.user.displayName?.split(' ').slice(1).join(' ') || '',
            role: 'business',
            createdAt: new Date().toISOString(),
            provider: 'google',
          });
        }
        
        // Fetch user role for returning data
        const updatedUserSnap = await getDoc(userRef);
        const userData = updatedUserSnap.data();
        
        return { 
          data: { ...userCredential, userRole: userData?.role || 'business' }, 
          error: null 
        };
      }
      
      return { data: userCredential, error: null };
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
  };

  const sendMagicLinkToEmail = async (email: string) => {
    try {
      const result = await sendMagicLink(email);
      return result;
    } catch (error: any) {
      return { success: false, error: { message: error.message } };
    }
  };

  const signInWithMagicLinkAuth = async (email: string, emailLink: string) => {
    try {
      const { data: userCredential, error } = await signInWithMagicLink(email, emailLink);
      
      if (error) {
        return { data: null, error };
      }

      if (userCredential?.user) {
        // Store user data in Firestore for magic link users
        const userRef = doc(firestore, "users", userCredential.user.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          // New user - create user document with business role (default)
          await setDoc(userRef, {
            email: userCredential.user.email,
            firstName: userCredential.user.displayName?.split(' ')[0] || '',
            lastName: userCredential.user.displayName?.split(' ').slice(1).join(' ') || '',
            role: 'business',
            createdAt: new Date().toISOString(),
            provider: 'magic-link',
          });
        }
        
        // Fetch user role for returning data
        const updatedUserSnap = await getDoc(userRef);
        const userData = updatedUserSnap.data();
        
        return { 
          data: { ...userCredential, userRole: userData?.role || 'business' }, 
          error: null 
        };
      }
      
      return { data: userCredential, error: null };
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
  };

  const checkIfMagicLinkSignIn = () => {
    return checkIfSignInWithEmailLink();
  };

  const getStoredEmail = () => {
    return getEmailFromStorage();
  };

  const sendPasswordResetEmail = async (email: string) => {
    try {
      const result = await sendPasswordReset(email);
      return result;
    } catch (error: any) {
      return { success: false, error: { message: error.message } };
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isLoading, 
        signUp, 
        signIn, 
        signOut, 
        signInWithGoogle: signInWithGoogleSSO,
        sendMagicLink: sendMagicLinkToEmail,
        signInWithMagicLink: signInWithMagicLinkAuth,
        checkIfSignInWithEmailLink: checkIfMagicLinkSignIn,
        getEmailFromStorage: getStoredEmail,
        sendPasswordReset: sendPasswordResetEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
