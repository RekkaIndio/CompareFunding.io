import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useNavbar } from '@/contexts/NavbarContext';
import PageLayout from '@/components/PageLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SignUpSidebar from '@/components/SignUpSidebar';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import '../../styles/animations.css'; // Import animations

const EmailPasswordPage = () => {
  const navigate = useNavigate();
  const { showNavbar, hideNavbar } = useNavbar();
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    hideNavbar();
    return () => {
      showNavbar();
    };
  }, [hideNavbar, showNavbar]);

  const steps = [
    { label: 'Email & Password', path: '/signup-journey/email-password' },
    { label: 'Funding Amount', path: '/signup-journey/apply' },
    { label: 'Funding Matches', path: '/signup-journey/funding-matches' },
    { label: 'Business Details', path: '/signup-journey/business-details' },
    { label: 'Eligibility', path: '/signup-journey/eligibility' },
  ];
  const currentStep = 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const userData = {
        email,
        role: 'business', // Ensure role is always set to 'business'
      };

      const { error, data } = await signUp(email, password, userData, false); // Disable autoLogin

      if (error) {
        toast.error(error.message);
        setIsLoading(false);
        return;
      }

      toast.success('Account created successfully! Please complete the remaining steps.');
      navigate('/signup-journey/apply', { state: { userId: data.user.uid } });
    } catch (err) {
      toast.error('An error occurred during sign up.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white min-h-screen">
      <PageLayout className="bg-white">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 flex flex-col h-full min-h-screen">
              {/* Progress Bar & Steps pinned to top */}
              <div className="mb-10 sticky top-0 z-20 bg-white pt-8">
                <div className="flex items-center gap-2 mb-2">
                  {steps.map((step, idx) => (
                    <div
                      key={step.label}
                      className={`flex-1 h-2 rounded ${idx <= currentStep ? 'bg-[#ff8000]' : 'bg-gray-300'}`}
                    ></div>
                  ))}
                </div>
                <div className="grid grid-cols-5 text-center text-sm font-medium text-[#2a3441]">
                  {steps.map((step, idx) => (
                    <span key={step.label} className={idx === currentStep ? 'font-bold text-[#ff8000]' : ''}>{step.label}</span>
                  ))}
                </div>
              </div>

              {/* Move form up with margin instead of full vertical centering */}
              <div className="flex flex-col mt-8">
                <h1 className="text-3xl font-bold text-[#2a3441] mb-6">Create Your Account</h1>
                <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="email" className="text-base text-[#2a3441] font-medium">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-2 w-full bg-white border-2 border-[#ff8000] focus:border-[#ff8000] focus:ring-1 focus:ring-[#ff8000] text-[#2a3441]"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password" className="text-base text-[#2a3441] font-medium">
                    Create Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-2 w-full bg-white border-2 border-[#ff8000] focus:border-[#ff8000] focus:ring-1 focus:ring-[#ff8000] text-[#2a3441]"
                    required
                  />
                </div>
                <Button type="submit" className="bg-[#ff8000] hover:bg-[#e67300] text-white w-full py-3 rounded-full" disabled={isLoading}>
                  {isLoading ? 'Creating Account...' : 'Continue'}
                </Button>
                </form>
              </div>
            </div>

            {/* Sidebar Column - Tailored for Email & Password step */}
            <div className="lg:col-span-4 flex flex-col h-full p-0 m-0">
              <SignUpSidebar
                title="Welcome to Compare Funding"
                description="Creating an account is your first step to finding the perfect funding solution for your business."
                highlight="We'll guide you through a simple 5-step process to match you with lenders."
                step={0}
                tips={[
                  "Your email will be used to send important funding updates.",
                  "We take your security seriously - your password is encrypted.",
                  "Once registered, you'll have a personalised dashboard to track all your applications."
                ]}
              />
            </div>
          </div>
        </div>
      </PageLayout>
    </div>
  );
};

export default EmailPasswordPage;
