import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useNavbar } from '@/contexts/NavbarContext';
import PageLayout from '@/components/PageLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import cflogowhiteUrl from '@/assets/cflogowhite.png';
import { Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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

            <div className="lg:col-span-4 flex flex-col h-full p-0 m-0">
              <div
                className="flex flex-col items-center bg-[#2a3441] h-[100vh] fixed right-0 top-0 bottom-0 w-full lg:w-[33.333333%] z-10 p-0 m-0"
              >
                <div className="flex flex-col items-center justify-center w-full h-full" style={{ flex: 1 }}>
                  <img src={cflogowhiteUrl} alt="Compare Funding Logo" className="h-20 mb-12" style={{ maxWidth: '220px' }} />
                  <div className="flex flex-col justify-center w-full" style={{ flex: 1 }}>
                    <Card className="bg-white p-6 shadow-md border border-gray-100 mb-6">
                      <h3 className="text-xl font-bold text-[#2a3441] mb-4">Business funding options. Simplified.</h3>
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                            <Check className="h-4 w-4 text-primary" />
                          </div>
                          <p className="text-[#2a3441]">1 application unlimited options</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                            <Check className="h-4 w-4 text-primary" />
                          </div>
                          <p className="text-[#2a3441]">Fast track your access to funds</p>
                        </div>
                      </div>
                    </Card>
                    <Card className="bg-white p-6 border border-primary">
                      <div className="text-center">
                        <h3 className="text-xl font-bold mb-3 text-[#2a3441]">Trust Pilot</h3>
                        <div className="flex justify-center mb-2">
                          {[...Array(5)].map((_, i) => (
                            <svg key={i} className="w-5 h-5 text-primary fill-current" viewBox="0 0 24 24">
                              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                            </svg>
                          ))}
                        </div>
                        <p className="font-semibold text-[#2a3441]">4.8/5 rating</p>
                      </div>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageLayout>
    </div>
  );
};

export default EmailPasswordPage;
