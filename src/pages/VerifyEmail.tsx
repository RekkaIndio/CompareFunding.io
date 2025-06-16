import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PageLayout from '@/components/PageLayout';
import { getDoc, doc, setDoc } from 'firebase/firestore';
import { firestore } from '@/firebase';

const VerifyEmail = () => {
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error' | 'email_required'>('loading');
  const [email, setEmail] = useState('');
  const [emailFromUser, setEmailFromUser] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signInWithMagicLink, checkIfSignInWithEmailLink, getEmailFromStorage } = useAuth();

  // Utility function to validate user role and redirect
  const validateUserRole = async (userId: string): Promise<{role: string | null, valid: boolean}> => {
    try {
      // First check in the users collection
      const userRef = doc(firestore, "users", userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        return { role: userData.role, valid: true };
      }
      
      // If not found or role not set in users, check if it's a lender by checking lender_profiles
      const lenderRef = doc(firestore, "lender_profiles", userId);
      const lenderSnap = await getDoc(lenderRef);
      
      if (lenderSnap.exists()) {
        // If there's a lender profile, assign the lender role
        return { role: 'lender', valid: true };
      }
      
      // If not a lender, check if it's a business by checking business_profiles
      const businessRef = doc(firestore, "business_profiles", userId);
      const businessSnap = await getDoc(businessRef);
      
      if (businessSnap.exists()) {
        // If there's a business profile, assign the business role
        return { role: 'business', valid: true };
      }
      
      // No role information found
      return { role: null, valid: false };
    } catch (error) {
      console.error("Error validating user role:", error);
      return { role: null, valid: false };
    }
  };

  useEffect(() => {
    const verifyMagicLink = async () => {
      // Check if this is a sign-in with email link
      if (!checkIfSignInWithEmailLink()) {
        setVerificationStatus('error');
        setIsVerifying(false);
        toast.error('Invalid or expired magic link');
        return;
      }

      // Get email from storage
      let userEmail = getEmailFromStorage();
      
      if (!userEmail) {
        // If no email in storage, require user to enter it
        setVerificationStatus('email_required');
        setIsVerifying(false);
        return;
      }

      setEmail(userEmail);

      try {
        const { data, error } = await signInWithMagicLink(userEmail, window.location.href);
        
        if (error) {
          console.error('Magic link verification error:', error);
          setVerificationStatus('error');
          toast.error(error.message || 'Failed to verify magic link');
          return;
        }

        if (data?.user) {
          setVerificationStatus('success');
          toast.success('Successfully signed in with magic link!');
          
          // Get the user's role and redirect accordingly
          const { role, valid } = await validateUserRole(data.user.uid);
          
          // Update the user document with the role if it was found
          if (valid && role) {
            // Update users collection with role
            const userRef = doc(firestore, "users", data.user.uid);
            await setDoc(userRef, { role }, { merge: true });
            
            // Redirect based on user role with a delay to show success message
            setTimeout(() => {
              window.location.href = role === 'lender' ? '/lender/dashboard' : '/business/dashboard';
            }, 2000);
            return;
          }
          
          // Default redirect if role is not specified or invalid
          setTimeout(() => {
            navigate('/applications');
          }, 2000);
        }
      } catch (error: any) {
        console.error('Exception during magic link verification:', error);
        setVerificationStatus('error');
        toast.error(error.message || 'An error occurred during verification');
      } finally {
        setIsVerifying(false);
      }
    };

    verifyMagicLink();
  }, [signInWithMagicLink, checkIfSignInWithEmailLink, getEmailFromStorage, navigate]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailFromUser.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    setIsVerifying(true);
    setEmail(emailFromUser);

    try {
      const { data, error } = await signInWithMagicLink(emailFromUser, window.location.href);
      
      if (error) {
        console.error('Magic link verification error:', error);
        setVerificationStatus('error');
        toast.error(error.message || 'Failed to verify magic link');
        return;
      }

      if (data?.user) {
        setVerificationStatus('success');
        toast.success('Successfully signed in with magic link!');
        
        // Get the user's role and redirect accordingly
        const { role, valid } = await validateUserRole(data.user.uid);
        
        // Update the user document with the role if it was found
        if (valid && role) {
          // Update users collection with role
          const userRef = doc(firestore, "users", data.user.uid);
          await setDoc(userRef, { role }, { merge: true });
          
          // Redirect based on user role with a delay to show success message
          setTimeout(() => {
            window.location.href = role === 'lender' ? '/lender/dashboard' : '/business/dashboard';
          }, 2000);
          return;
        }
        
        // Default redirect if role is not specified or invalid
        setTimeout(() => {
          navigate('/applications');
        }, 2000);
      }
    } catch (error: any) {
      console.error('Exception during magic link verification:', error);
      setVerificationStatus('error');
      toast.error(error.message || 'An error occurred during verification');
    } finally {
      setIsVerifying(false);
    }
  };

  const renderContent = () => {
    switch (verificationStatus) {
      case 'loading':
        return (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <Loader2 className="w-16 h-16 text-[#ff8000] animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-[#2a3441]">Verifying your magic link...</h1>
            <p className="text-[#2a3441]">Please wait while we sign you in.</p>
          </div>
        );

      case 'email_required':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-3">
              <h1 className="text-2xl font-bold text-[#2a3441]">Confirm your email</h1>
              <p className="text-[#2a3441]">
                Please enter the email address you used to request the magic link.
              </p>
            </div>
            
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#2a3441] font-medium">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={emailFromUser}
                  onChange={(e) => setEmailFromUser(e.target.value)}
                  className="bg-white focus:outline-none focus:ring-0 focus:border-2 focus:border-[#ff8000]"
                  required
                />
              </div>
              
              <Button
                type="submit"
                className="w-full bg-[#ff8000] hover:bg-[#ff8000]/90 text-white font-semibold"
                disabled={isVerifying}
              >
                {isVerifying ? 'Verifying...' : 'Continue'}
              </Button>
            </form>
          </div>
        );

      case 'success':
        return (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-green-50 border-2 border-green-200 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-[#2a3441]">Successfully signed in!</h1>
            <p className="text-[#2a3441]">
              Welcome back{email ? ` ${email}` : ''}! You'll be redirected to your dashboard shortly.
            </p>
          </div>
        );

      case 'error':
        return (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-red-50 border-2 border-red-200 rounded-full flex items-center justify-center">
                <XCircle className="w-10 h-10 text-red-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-[#2a3441]">Verification failed</h1>
            <p className="text-[#2a3441]">
              The magic link is invalid or has expired. Please request a new one.
            </p>
            
            <div className="space-y-3">
              <Button
                onClick={() => navigate('/login')}
                className="w-full bg-[#ff8000] hover:bg-[#ff8000]/90 text-white font-semibold"
              >
                Back to login
              </Button>
              <Button
                onClick={() => navigate('/signup')}
                variant="outline"
                className="w-full border-[#ff8000] text-[#ff8000] hover:bg-[#ff8000] hover:text-white transition-all duration-200"
              >
                Create account
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <PageLayout>
      <div className="container flex items-center justify-center min-h-[calc(100vh-200px)] py-12">
        <div className="w-full max-w-md space-y-6 bg-white rounded-lg card-shadow p-8 border border-[#ff8000]">
          {renderContent()}
        </div>
      </div>
    </PageLayout>
  );
};

export default VerifyEmail;
