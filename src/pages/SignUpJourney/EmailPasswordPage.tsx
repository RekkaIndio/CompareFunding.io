import { useEffect, useState } from 'react';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useNavbar } from '@/contexts/NavbarContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SignUpLayout from '@/components/SignUpLayout';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import '../../styles/animations.css';

const EmailPasswordPage = () => {
  const navigate = useNavigate();
  const { showNavbar, hideNavbar } = useNavbar();
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

  const handleStepNavigation = (stepIndex: number) => {
    if (stepIndex > currentStep) return; // Prevent jumping ahead
    
    switch (stepIndex) {
      case 0:
        navigate('/signup-journey/email-password');
        break;
      case 1:
        navigate('/signup-journey/apply');
        break;
      case 2:
        navigate('/signup-journey/funding-matches');
        break;
      case 3:
        navigate('/signup-journey/business-details');
        break;
      case 4:
        navigate('/signup-journey/eligibility');
        break;
    }
  };

  const handleNext = () => {
    navigate('/signup-journey/apply');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);

    try {
      const userData = {
        email,
        role: 'business',
      };

      const { error, data } = await signUp(email, password, userData, false);

      if (error) {
        throw new Error(error.message);
      }

      toast.success('Account created successfully!');
      navigate('/signup-journey/apply', { state: { userId: data.user.uid } });
    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error(error.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const sidebarProps = {
    title: "Create Your Account",
    description: "Start your funding journey by creating a secure account. We'll help you find the best funding options for your business.",
    highlight: "Trusted by 10,000+ businesses",
    tips: [
      "Use a business email address if possible",
      "Choose a strong password with at least 6 characters",
      "Your information is encrypted and secure",
      "Account setup takes less than 2 minutes"
    ]
  };

  return (
    <SignUpLayout
      steps={steps}
      currentStep={currentStep}
      onStepNavigation={handleStepNavigation}
      onNext={handleNext}
      canGoBack={false}
      canGoNext={email && password && password.length >= 6}
      sidebarProps={sidebarProps}
    >
      <div className="space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#2a3441] mb-3 animate-fadeIn">
            Create Your Account
          </h1>
          <p className="text-gray-600 text-lg animate-fadeIn delay-100">
            Start your funding journey with a secure business account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 animate-fadeIn delay-200">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-[#2a3441] font-medium flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#ff8000]" />
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your business email"
              className="h-12 bg-white border-2 border-gray-200 focus:border-[#ff8000] focus:ring-1 focus:ring-[#ff8000] text-[#2a3441] placeholder:text-gray-400 transition-all duration-300"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-[#2a3441] font-medium flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#ff8000]" />
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a secure password"
                className="h-12 bg-white border-2 border-gray-200 focus:border-[#ff8000] focus:ring-1 focus:ring-[#ff8000] text-[#2a3441] placeholder:text-gray-400 transition-all duration-300 pr-12"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#ff8000] transition-colors duration-200"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {password && password.length < 6 && (
              <p className="text-sm text-amber-600">Password must be at least 6 characters long</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isLoading || !email || !password || password.length < 6}
            className="w-full h-12 bg-gradient-to-r from-[#ff8000] to-[#ff6000] hover:from-[#e67300] hover:to-[#e55a00] text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Creating Account...
              </div>
            ) : (
              'Create Account & Continue'
            )}
          </Button>

          <div className="text-center text-sm text-gray-500 space-y-2">
            <p>By creating an account, you agree to our Terms of Service and Privacy Policy</p>
            <p className="flex items-center justify-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Your data is encrypted and secure
            </p>
          </div>
        </form>
      </div>
    </SignUpLayout>
  );
};

export default EmailPasswordPage;
