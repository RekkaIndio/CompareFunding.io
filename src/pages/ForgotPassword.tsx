import { useState } from 'react';
import { Link } from 'react-router-dom';
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
import { CheckCircle, ArrowLeft } from 'lucide-react';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

const ForgotPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sentToEmail, setSentToEmail] = useState('');
  const { sendPasswordReset } = useAuth();

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setIsLoading(true);
    try {
      const { success, error } = await sendPasswordReset(values.email);
      
      if (error) {
        toast.error(error.message);
        setIsLoading(false);
        return;
      }
      
      if (success) {
        setSentToEmail(values.email);
        setEmailSent(true);
        toast.success("Password reset email sent!");
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!sentToEmail) return;
    
    setIsLoading(true);
    try {
      const { success, error } = await sendPasswordReset(sentToEmail);
      
      if (error) {
        toast.error(error.message);
        return;
      }
      
      if (success) {
        toast.success("Password reset email sent again!");
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToForm = () => {
    setEmailSent(false);
    setSentToEmail('');
    form.reset();
  };

  if (emailSent) {
    return (
      <PageLayout>
        <div className="container flex items-center justify-center min-h-[calc(100vh-200px)] py-12">
          <div className="w-full max-w-md space-y-6 bg-white rounded-lg card-shadow p-8 border border-[#ff8000]">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              <h1 className="text-3xl font-bold text-fundhub-orange">Check your email</h1>
              <p className="text-[#2a3441]">
                We've sent a password reset link to:
              </p>
              <p className="font-semibold text-[#ff8000]">{sentToEmail}</p>
              <p className="text-sm text-[#2a3441]">
                Click the link in the email to reset your password. 
                If you don't see the email, check your spam folder.
              </p>
            </div>

            <div className="space-y-4">
              <Button
                onClick={handleResendEmail}
                disabled={isLoading}
                variant="outline"
                className="w-full border-[#ff8000] text-[#ff8000] hover:bg-[#ff8000] hover:text-white"
              >
                {isLoading ? 'Sending...' : 'Resend email'}
              </Button>

              <Button
                onClick={handleBackToForm}
                variant="ghost"
                className="w-full text-[#2a3441] hover:bg-gray-100"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Try a different email
              </Button>
            </div>

            <div className="text-center pt-4">
              <p className="text-sm text-[#2a3441]">
                Remember your password?{' '}
                <Link to="/login" className="text-[#ff8000] hover:underline font-medium">
                  Back to login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="container flex items-center justify-center min-h-[calc(100vh-200px)] py-12">
        <div className="w-full max-w-md space-y-6 bg-white rounded-lg card-shadow p-8 border border-[#ff8000]">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-fundhub-orange">Reset your password</h1>
            <p className="text-[#2a3441]">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#2a3441] font-medium">Email</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="name@example.com" 
                        type="email" 
                        {...field} 
                        className="bg-white focus:outline-none focus:ring-0 focus:border-2 focus:border-[#ff8000]" 
                      />
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
                {isLoading ? 'Sending...' : 'Send reset link'}
              </Button>
            </form>
          </Form>

          <div className="text-center pt-4 space-y-2">
            <p className="text-sm text-[#2a3441]">
              <Link to="/login" className="text-[#ff8000] hover:underline font-medium">
                <ArrowLeft className="h-4 w-4 inline mr-1" />
                Back to login
              </Link>
            </p>
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

export default ForgotPassword;
