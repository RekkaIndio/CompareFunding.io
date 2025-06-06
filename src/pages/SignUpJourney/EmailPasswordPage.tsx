import { useEffect, useState } from 'react';
import { Eye, EyeOff, Mail, Lock, Check, X } from 'lucide-react';
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
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Password criteria state
  const [passwordCriteria, setPasswordCriteria] = useState({
    length: false,
    lowercase: false,
    uppercase: false,
    number: false,
    special: false
  });

  // Update password criteria whenever password changes
  useEffect(() => {
    setPasswordCriteria({
      length: password.length >= 6,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    });
  }, [password]);

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

  // Calculate if all required criteria are met
  const isPasswordStrong = () => {
    return passwordCriteria.length && 
           (passwordCriteria.lowercase || passwordCriteria.uppercase) && 
           passwordCriteria.number;
  };

  // Calculate if passwords match
  const doPasswordsMatch = () => {
    return password === confirmPassword && confirmPassword !== '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (!isPasswordStrong()) {
      toast.error('Password does not meet security requirements');
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
      "Include uppercase letters, numbers, and special characters",
      "Make sure your passwords match before submitting"
    ]
  };

  // Render a criteria item with check or X icon - Mobile optimized
  const CriteriaItem = ({ met, label }: { met: boolean; label: string }) => (
    <div className="flex items-center gap-1 sm:gap-2">
      {met ? (
        <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
      ) : (
        <X className="w-3 h-3 sm:w-4 sm:h-4 text-amber-600 flex-shrink-0" />
      )}
      <span className={`text-xs sm:text-sm ${met ? 'text-green-600' : 'text-amber-600'}`}>{label}</span>
    </div>
  );

  return (
    <SignUpLayout
      steps={steps}
      currentStep={currentStep}
      onStepNavigation={handleStepNavigation}
      onNext={handleNext}
      canGoBack={false}
      canGoNext={email && isPasswordStrong() && doPasswordsMatch()}
      sidebarProps={sidebarProps}
    >
      <div className="space-y-8">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#2a3441] mb-2 sm:mb-3 animate-fadeIn">
            Create Your Account
          </h1>
          <p className="text-gray-600 text-sm sm:text-base md:text-lg animate-fadeIn delay-100">
            Start your funding journey with a secure business account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 animate-fadeIn delay-200">
          <div className="space-y-1 sm:space-y-2">
            <Label htmlFor="email" className="text-[#2a3441] text-sm sm:text-base font-medium flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#ff8000]" />
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your business email"
              className="h-10 sm:h-12 bg-white border-2 border-gray-200 focus:border-[#ff8000] focus:ring-1 focus:ring-[#ff8000] text-sm sm:text-base text-[#2a3441] placeholder:text-gray-400 transition-all duration-300 rounded-lg sm:rounded-xl"
              required
            />
          </div>

          <div className="space-y-1 sm:space-y-2">
            <Label htmlFor="password" className="text-[#2a3441] text-sm sm:text-base font-medium flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#ff8000]" />
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a secure password"
                className="h-10 sm:h-12 bg-white border-2 border-gray-200 focus:border-[#ff8000] focus:ring-1 focus:ring-[#ff8000] text-sm sm:text-base text-[#2a3441] placeholder:text-gray-400 transition-all duration-300 pr-10 sm:pr-12 rounded-lg sm:rounded-xl"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#ff8000] transition-colors duration-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
            </div>
            
            {/* Password criteria list - Mobile optimized */}
            {password && (
              <div className="mt-1.5 sm:mt-2 space-y-0.5 sm:space-y-1 p-2 sm:p-3 bg-gray-50 rounded-md sm:rounded-lg border border-gray-200 animate-fadeIn">
                <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Password requirements:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2">
                  <CriteriaItem met={passwordCriteria.length} label="At least 6 characters" />
                  <CriteriaItem met={passwordCriteria.lowercase} label="One lowercase letter" />
                  <CriteriaItem met={passwordCriteria.uppercase} label="One uppercase letter" />
                  <CriteriaItem met={passwordCriteria.number} label="One number" />
                  <CriteriaItem met={passwordCriteria.special} label="One special char (!@#$%^&*)" />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1 sm:space-y-2">
            <Label htmlFor="confirmPassword" className="text-[#2a3441] text-sm sm:text-base font-medium flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#ff8000]" />
              Confirm Password
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className="h-10 sm:h-12 bg-white border-2 border-gray-200 focus:border-[#ff8000] focus:ring-1 focus:ring-[#ff8000] text-sm sm:text-base text-[#2a3441] placeholder:text-gray-400 transition-all duration-300 pr-10 sm:pr-12 rounded-lg sm:rounded-xl"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#ff8000] transition-colors duration-200"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
            </div>
            
            {/* Password matching indicator */}
            {confirmPassword && (
              <div className="flex items-center gap-1.5 sm:gap-2 mt-1">
                {doPasswordsMatch() ? (
                  <>
                    <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" />
                    <span className="text-xs sm:text-sm text-green-600">Passwords match</span>
                  </>
                ) : (
                  <>
                    <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600" />
                    <span className="text-xs sm:text-sm text-amber-600">Passwords don't match</span>
                  </>
                )}
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={isLoading || !email || !isPasswordStrong() || !doPasswordsMatch()}
            className="w-full h-10 sm:h-12 bg-gradient-to-r from-[#ff8000] to-[#ff6000] hover:from-[#e67300] hover:to-[#e55a00] text-white text-sm sm:text-base font-semibold rounded-lg sm:rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mt-2 sm:mt-4"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Creating Account...</span>
              </div>
            ) : (
              'Create Account & Continue'
            )}
          </Button>

          <div className="text-center text-xs sm:text-sm text-gray-500 space-y-1 sm:space-y-2 mt-4 sm:mt-6">
            <p>By creating an account, you agree to our Terms of Service and Privacy Policy</p>
            <p className="flex items-center justify-center gap-1">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full"></span>
              Your data is encrypted and secure
            </p>
          </div>
        </form>
      </div>
    </SignUpLayout>
  );
};

export default EmailPasswordPage;
