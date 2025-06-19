import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import PageLayout from '@/components/PageLayout';
import SSOButtons from '@/components/SSOButtons';
import MagicLinkAuth from '@/components/MagicLinkAuth';
import { getDoc, doc, setDoc } from 'firebase/firestore';
import { firestore } from '@/firebase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// Utility function to validate user role
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

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const { signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  // Check for password reset success message
  useEffect(() => {
    const passwordReset = searchParams.get('passwordReset');
    if (passwordReset === 'success') {
      toast.success('Password reset successfully! You can now sign in with your new password.');
      // Remove the query parameter from URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [searchParams]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    try {
      const { error, data } = await signIn(values.email, values.password);
      
      if (error) {
        toast.error(error.message);
        setIsLoading(false);
        return;
      }
      
      toast.success("Successfully logged in!");
      
      // Get the user's ID from the login response
      const userId = data.user.uid;
      
      // Validate user role and redirect accordingly
      const { role, valid } = await validateUserRole(userId);
      
      // Update the user document with the role if it was found
      if (valid && role) {
        // Update users collection with role
        const userRef = doc(firestore, "users", userId);
        await setDoc(userRef, { role }, { merge: true });
        
        // Force reload the page to ensure AuthContext picks up the role changes
        window.location.href = role === 'lender' ? '/lender/dashboard' : '/business/dashboard';
        return;
      }
      
      if (valid) {

        // Redirect based on user role
        if (role === 'business') {
          navigate('/business/dashboard');
        } else if (role === 'lender') {

          navigate('/lender/dashboard');
        } else {

          // Default redirect if role is not specified
          navigate('/applications');
        }
      } else {

        // No role information found, use default redirect
        navigate('/applications');
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle SSO success
  const handleSSOSuccess = async (userData: any) => {
    toast.success("Successfully logged in!");
    
    // Get the user's role and redirect accordingly
    const { role, valid } = await validateUserRole(userData.userId);
    
    if (valid && role) {
      // Force reload the page to ensure AuthContext picks up the role changes
      window.location.href = role === 'lender' ? '/lender/dashboard' : '/business/dashboard';
      return;
    }
    
    // Default redirect if role is not specified or invalid
    navigate('/applications');
  };

  // Handle SSO error
  const handleSSOError = (error: string) => {
    toast.error(error);
  };

  return (
    <PageLayout>
      <div className="container flex items-center justify-center min-h-[calc(100vh-200px)] py-12">
        <div className="w-full max-w-md space-y-6 bg-white rounded-lg card-shadow p-8 border border-[#ff8000]">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-fundhub-orange">Welcome back</h1>
            <p className="text-[#2a3441]">
              Sign in to your Compare Funding account
            </p>
          </div>

          <Tabs defaultValue="password" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100 rounded-lg p-1">
              <TabsTrigger 
                value="password" 
                className="data-[state=active]:bg-[#ff8000] data-[state=active]:text-white text-[#2a3441] font-medium rounded-md transition-all duration-200"
              >
                Password
              </TabsTrigger>
              <TabsTrigger 
                value="magic-link" 
                className="data-[state=active]:bg-[#ff8000] data-[state=active]:text-white text-[#2a3441] font-medium rounded-md transition-all duration-200"
              >
                Magic Link
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="password" className="space-y-4 mt-0">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  {/* SSO Buttons Section */}
                  <SSOButtons
                    onSuccess={handleSSOSuccess}
                    onError={handleSSOError}
                    isLoading={isLoading}
                    setIsLoading={setIsLoading}
                    signInWithGoogle={signInWithGoogle}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#2a3441] font-medium">Email</FormLabel>
                        <FormControl>
                          <Input placeholder="name@example.com" type="email" {...field} className="bg-white focus:outline-none focus:ring-0 focus:border-2 focus:border-[#ff8000]" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel className="text-[#2a3441] font-medium">Password</FormLabel>
                          <Link 
                            to="/forgot-password" 
                            className="text-xs text-[#ff8000] hover:underline"
                          >
                            Forgot password?
                          </Link>
                        </div>
                        <FormControl>
                          <Input placeholder="Enter your password" type="password" {...field} className="bg-white focus:outline-none focus:ring-0 focus:border-2 focus:border-[#ff8000]" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full bg-[#ff8000] hover:bg-[#ff8000]/90 text-white font-semibold"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Signing in...' : 'Sign in'}
                  </Button>
                </form>
              </Form>
            </TabsContent>
            
            <TabsContent value="magic-link" className="space-y-4 mt-0">
              <MagicLinkAuth 
                isLoading={isLoading}
                setIsLoading={setIsLoading}
              />
            </TabsContent>
          </Tabs>

          <div className="text-center pt-4">
            <p className="text-sm text-[#2a3441]">
              Don't have an account?{' '}
              <Link to="/signup" className="text-[#ff8000] hover:underline font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Login;
