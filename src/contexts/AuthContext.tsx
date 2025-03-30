import { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, createUser, loginUser, logoutUser, updateUserProfile } from '@/firebase';
import { useNavigate } from 'react-router-dom';
import { collection, doc, setDoc, getDoc } from 'firebase/firestore';
import { firestore } from '@/firebase';

// Define a custom user type that includes role information
type UserWithRole = FirebaseUser & {
  role?: 'business' | 'lender';
};

type AuthContextType = {
  user: UserWithRole | null;
  isLoading: boolean;
  signUp: (email: string, password: string, userData?: any) => Promise<{ error: any | null; data: any | null; }>;
  signIn: (email: string, password: string) => Promise<{ error: any | null; data: any | null; }>;
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
      const userRef = doc(firestore, "users", currentUser.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        // Enhance user object with role
        const enhancedUser = {
          ...currentUser,
          role: userData.role as 'business' | 'lender'
        };
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

  const signUp = async (email: string, password: string, userData?: any) => {
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

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isLoading, 
        signUp, 
        signIn, 
        signOut 
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
