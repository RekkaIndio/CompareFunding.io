import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { auth } from '@/firebase';
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
import { CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';

const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isValidCode, setIsValidCode] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);
  const [email, setEmail] = useState('');

  const oobCode = searchParams.get('oobCode');
  const mode = searchParams.get('mode');

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    const validateResetCode = async () => {
      if (!oobCode || mode !== 'resetPassword') {
        setIsValidating(false);
        setIsValidCode(false);
        return;
      }

      try {
        // Verify the password reset code and get the email
        const userEmail = await verifyPasswordResetCode(auth, oobCode);
        setEmail(userEmail);
        setIsValidCode(true);
      } catch (error: any) {
        console.error('Invalid reset code:', error);
        setIsValidCode(false);
        toast.error('Invalid or expired password reset link');
      } finally {
        setIsValidating(false);
      }
    };

    validateResetCode();
  }, [oobCode, mode]);

  const onSubmit = async (values: ResetPasswordFormValues) => {
    if (!oobCode) {
      toast.error('Invalid reset code');
      return;
    }

    setIsLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode, values.password);
      setResetComplete(true);
      toast.success('Password reset successfully!');
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast.error(error.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  if (isValidating) {
    return (
      <PageLayout>
        <div className="container flex items-center justify-center min-h-[calc(100vh-200px)] py-12">
          <div className="w-full max-w-md space-y-6 bg-white rounded-lg card-shadow p-8 border border-[#ff8000]">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff8000] mx-auto"></div>
              <h1 className="text-2xl font-bold text-fundhub-orange">Validating Reset Link</h1>
              <p className="text-[#2a3441]">Please wait while we validate your password reset link...</p>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!isValidCode) {
    return (
      <PageLayout>
        <div className="container flex items-center justify-center min-h-[calc(100vh-200px)] py-12">
          <div className="w-full max-w-md space-y-6 bg-white rounded-lg card-shadow p-8 border border-red-500">
            <div className="text-center space-y-4">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
              <h1 className="text-3xl font-bold text-red-600">Invalid Reset Link</h1>
              <p className="text-[#2a3441]">
                This password reset link is invalid or has expired.
              </p>
              <p className="text-sm text-[#2a3441]">
                Password reset links expire after 1 hour for security reasons.
              </p>
            </div>

            <div className="space-y-4">
              <Link to="/forgot-password">
                <Button className="w-full bg-[#ff8000] hover:bg-[#ff8000]/90 text-white font-semibold">
                  Request New Reset Link
                </Button>
              </Link>

              <Button
                onClick={handleBackToLogin}
                variant="ghost"
                className="w-full text-[#2a3441] hover:bg-gray-100"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to login
              </Button>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (resetComplete) {
    return (
      <PageLayout>
        <div className="container flex items-center justify-center min-h-[calc(100vh-200px)] py-12">
          <div className="w-full max-w-md space-y-6 bg-white rounded-lg card-shadow p-8 border border-green-500">
            <div className="text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <h1 className="text-3xl font-bold text-green-600">Password Reset Complete!</h1>
              <p className="text-[#2a3441]">
                Your password has been successfully reset.
              </p>
              <p className="text-sm text-[#2a3441]">
                You can now sign in with your new password.
              </p>
            </div>

            <Button
              onClick={handleBackToLogin}
              className="w-full bg-[#ff8000] hover:bg-[#ff8000]/90 text-white font-semibold"
            >
              Sign In Now
            </Button>
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
            <h1 className="text-3xl font-bold text-fundhub-orange">Reset Your Password</h1>
            <p className="text-[#2a3441]">
              Enter your new password for: <strong>{email}</strong>
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#2a3441] font-medium">New Password</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter your new password" 
                        type="password" 
                        {...field} 
                        className="bg-white focus:outline-none focus:ring-0 focus:border-2 focus:border-[#ff8000]" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#2a3441] font-medium">Confirm Password</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Confirm your new password" 
                        type="password" 
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
                {isLoading ? 'Resetting Password...' : 'Reset Password'}
              </Button>
            </form>
          </Form>

          <div className="text-center pt-4">
            <p className="text-sm text-[#2a3441]">
              <Link to="/login" className="text-[#ff8000] hover:underline font-medium">
                <ArrowLeft className="h-4 w-4 inline mr-1" />
                Back to login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default ResetPassword;
