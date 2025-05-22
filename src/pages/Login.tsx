import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
import { getDoc, doc } from 'firebase/firestore';
import { firestore } from '@/firebase';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

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
      
      try {
        // Fetch the user's role from Firestore
        const userRef = doc(firestore, "users", userId);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const userRole = userData.role;
          
          // Redirect based on user role
          if (userRole === 'business') {
            navigate('/business/dashboard');
          } else if (userRole === 'lender') {
            navigate('/lender/dashboard');
          } else {
            // Default redirect if role is not specified
            navigate('/applications');
          }
        } else {
          // User document doesn't exist, use default redirect
          navigate('/applications');
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
        // Fall back to default redirect
        navigate('/applications');
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred during login');
    } finally {
      setIsLoading(false);
    }
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

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
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
                      <FormLabel>Password</FormLabel>
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
