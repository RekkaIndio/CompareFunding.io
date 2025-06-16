import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Mail, CheckCircle } from 'lucide-react';
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

const magicLinkSchema = z.object({
  email: z.string().email('Please enter a valid email'),
});

type MagicLinkFormValues = z.infer<typeof magicLinkSchema>;

interface MagicLinkAuthProps {
  isLoading?: boolean;
  setIsLoading?: (loading: boolean) => void;
}

const MagicLinkAuth = ({ isLoading = false, setIsLoading }: MagicLinkAuthProps) => {
  const [emailSent, setEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');
  const { sendMagicLink } = useAuth();

  const form = useForm<MagicLinkFormValues>({
    resolver: zodResolver(magicLinkSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (values: MagicLinkFormValues) => {
    if (setIsLoading) setIsLoading(true);
    
    try {
      const { success, error } = await sendMagicLink(values.email);
      
      if (error) {
        toast.error(error.message || 'Failed to send magic link');
        return;
      }
      
      if (success) {
        setEmailSent(true);
        setSentEmail(values.email);
        toast.success('Magic link sent! Check your email to sign in.');
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred while sending the magic link');
    } finally {
      if (setIsLoading) setIsLoading(false);
    }
  };

  const resendMagicLink = async () => {
    if (setIsLoading) setIsLoading(true);
    
    try {
      const { success, error } = await sendMagicLink(sentEmail);
      
      if (error) {
        toast.error(error.message || 'Failed to resend magic link');
        return;
      }
      
      if (success) {
        toast.success('Magic link resent! Check your email.');
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred while resending the magic link');
    } finally {
      if (setIsLoading) setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-green-50 border-2 border-green-200 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <div className="space-y-3">
          <h3 className="text-xl font-bold text-[#2a3441]">Check your email</h3>
          <p className="text-sm text-[#2a3441]">
            We've sent a magic link to <strong className="text-[#ff8000]">{sentEmail}</strong>
          </p>
          <p className="text-xs text-gray-500">
            Click the link in your email to sign in. The link will expire in 1 hour.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={resendMagicLink}
            disabled={isLoading}
            className="w-full border-[#ff8000] text-[#ff8000] hover:bg-[#ff8000] hover:text-white transition-all duration-200"
          >
            {isLoading ? 'Resending...' : 'Resend magic link'}
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setEmailSent(false);
              setSentEmail('');
              form.reset();
            }}
            className="w-full text-sm text-[#2a3441] hover:text-[#ff8000] hover:bg-orange-50 transition-all duration-200"
          >
            Use a different email
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-orange-50 border-2 border-[#ff8000]/20 rounded-full flex items-center justify-center">
            <Mail className="w-6 h-6 text-[#ff8000]" />
          </div>
        </div>
        <h3 className="text-lg font-bold text-[#2a3441]">Sign in with Magic Link</h3>
        <p className="text-sm text-[#2a3441]">
          Enter your email and we'll send you a secure link to sign in
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#2a3441] font-medium">Email address</FormLabel>
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
            {isLoading ? 'Sending...' : 'Send magic link'}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default MagicLinkAuth;
