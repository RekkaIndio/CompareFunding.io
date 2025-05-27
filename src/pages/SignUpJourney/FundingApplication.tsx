import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import PageLayout from '@/components/PageLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import cflogowhiteUrl from '@/assets/cflogowhite.png';
import { useNavbar } from '@/contexts/NavbarContext'; // Add this line
import { saveFundingApplication } from '@/services/firebase'; // Import Firebase service
import { toast } from 'react-toastify'; // Import toast for notifications
import SignUpSidebar from '@/components/SignUpSidebar';
import '../../styles/animations.css'; // Import animations

// Custom styles for input fields
const inputStyles = "bg-white border-2 border-primary focus:border-primary focus:ring-1 focus:ring-primary text-[#2a3441]";

const FundingApplication = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showNavbar, hideNavbar } = useNavbar(); // Add this line
  const [fundingPurpose, setFundingPurpose] = useState('expansion');
  const [amount, setAmount] = useState('100000');
  const [timeframe, setTimeframe] = useState('1 Week');
  const [duration, setDuration] = useState('');
  const [marketingConsent, setMarketingConsent] = useState(false);

  useEffect(() => { // Add this block
    hideNavbar();
    return () => {
      showNavbar();
    };
  }, [hideNavbar, showNavbar]);


  // Progress bar and navigation steps config
  const steps = [
    { label: 'Email & Password', path: '/signup-journey/email-password' },
    { label: 'Funding Amount', path: '/signup-journey/apply' },
    { label: 'Funding Matches', path: '/signup-journey/funding-matches' },
    { label: 'Business Details', path: '/signup-journey/business-details' },
    { label: 'Eligibility', path: '/signup-journey/eligibility' },
  ];
  const [currentStep, setCurrentStep] = useState<number>(1); // Updated to reflect the new step order
  // Ensure state is passed correctly to the next steps
  const goToStep = (stepIdx: number) => {
    setCurrentStep(stepIdx);
    if (stepIdx === 0) navigate('/signup-journey/email-password', { state: { fundingPurpose, amount, timeframe, duration, marketingConsent } });
    if (stepIdx === 1) navigate('/signup-journey/funding-matches', { state: { fundingPurpose, amount, timeframe, duration, marketingConsent } });
    if (stepIdx === 2) navigate('/signup-journey/business-details', { state: { fundingPurpose, amount, timeframe, duration, marketingConsent } });
    if (stepIdx === 3) navigate('/signup-journey/eligibility', { state: { fundingPurpose, amount, timeframe, duration, marketingConsent } });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const userId = location.state?.userId; // Retrieve userId from navigation state
      if (!userId) {
        toast.error('User ID is missing. Please restart the signup process.');
        return;
      }

      // Save data to Firebase
      await saveFundingApplication(userId, { fundingPurpose, amount, timeframe, duration, marketingConsent });

      // Show success message
      toast.success('Funding application saved successfully!');

      // Go to next step
      goToStep(currentStep + 1);
    } catch (error) {
      // Show error message
      toast.error('Failed to save funding application. Please try again.');
    }
  };

  return (
    <div className="bg-white min-h-screen">
      <PageLayout className="bg-white">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Main Form Section */}
            <div className="lg:col-span-8">
              {/* Progress Bar & Steps */}
              <div className="mb-10">
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

              {/* Navigation Arrows */}
              <div className="flex justify-between items-center mb-6">
                <button
                  type="button"
                  onClick={() => goToStep(currentStep - 1)}
                  disabled={currentStep === 0}
                  className={`flex items-center gap-1 px-4 py-2 rounded-full border border-gray-200 bg-white text-[#2a3441] hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => goToStep(currentStep + 1)}
                  disabled={currentStep === steps.length - 1}
                  className={`flex items-center gap-1 px-4 py-2 rounded-full border border-gray-200 bg-white text-[#2a3441] hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  Next
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-[#2a3441] mb-3">
                Compare Funding
              </h1>
              
              <h2 className="text-2xl font-semibold text-[#2a3441] mb-2">
                Let's get started
              </h2>
              
              <p className="text-lg text-[#2a3441] mb-8">
                Your are one step closer to understanding your funding options
              </p>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="fundingPurpose" className="text-base text-[#2a3441] font-medium">
                    What are you looking for funds for?
                  </Label>
                  <Select
                    value={fundingPurpose}
                    onValueChange={setFundingPurpose}
                  >
                    <SelectTrigger id="fundingPurpose" className={`mt-2 h-12 ${inputStyles}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white text-[#2a3441]">
                      <SelectItem value="expansion" className="text-[#2a3441]">Business expansion</SelectItem>
                      <SelectItem value="startup" className="text-[#2a3441]">Start a business</SelectItem>
                      <SelectItem value="cashflow" className="text-[#2a3441]">Improve cashflow</SelectItem>
                      <SelectItem value="stock" className="text-[#2a3441]">Purchase stock</SelectItem>
                      <SelectItem value="grant" className="text-[#2a3441]">Find a grant</SelectItem>
                      <SelectItem value="asset" className="text-[#2a3441]">Asset finance</SelectItem>
                      <SelectItem value="property" className="text-[#2a3441]">Property finance</SelectItem>
                      <SelectItem value="research" className="text-[#2a3441]">Research & Development</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="amount" className="text-base text-[#2a3441] font-medium">
                    How much are you looking for?
                  </Label>
                  <Input
                    id="amount"
                    type="text"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className={`mt-2 h-12 ${inputStyles}`}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="timeframe" className="text-base text-[#2a3441] font-medium">
                    How quickly do you need the funds?
                  </Label>
                  <Select
                    value={timeframe}
                    onValueChange={setTimeframe}
                  >
                    <SelectTrigger id="timeframe" className={`mt-2 h-12 ${inputStyles}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white text-[#2a3441]">
                      <SelectItem value="1 Week" className="text-[#2a3441]">1 Week</SelectItem>
                      <SelectItem value="2 Weeks" className="text-[#2a3441]">2 Weeks</SelectItem>
                      <SelectItem value="1 Month" className="text-[#2a3441]">1 Month</SelectItem>
                      <SelectItem value="3 Months" className="text-[#2a3441]">3 Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="duration" className="text-base text-[#2a3441] font-medium">
                    How long do you need the funds for?
                  </Label>
                  <Input
                    id="duration"
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className={`mt-2 h-12 ${inputStyles}`}
                    required
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="marketing" 
                    checked={marketingConsent}
                    onCheckedChange={(checked) => setMarketingConsent(checked as boolean)}
                    className="border-2 border-primary data-[state=checked]:bg-primary data-[state=checked]:text-white"
                  />
                  <label
                    htmlFor="marketing"
                    className="text-sm font-medium leading-none text-[#2a3441] peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Marketing Tick Box (Opt In)
                  </label>
                </div>
                
                <Button type="submit" className="bg-[#003856] hover:bg-[#003856]/90 text-white h-12 px-8 rounded-full">
                  Apply Now
                </Button>
              </form>
            </div>
            
            {/* Sidebar Column */}
            <div className="lg:col-span-4 flex flex-col h-full p-0 m-0">
              <SignUpSidebar
                title="Funding Requirements"
                description="Tell us what you need funding for and we'll match you with the most suitable options."
                highlight="We work with over 100 lenders to find the best terms for your business."
                step={1}
                tips={[
                  "Being specific about your funding needs helps us find better matches.",
                  "The amount and timeframe affect which lenders we can match you with.",
                  "Many lenders specialize in specific funding purposes like expansion or cash flow.",
                  "Your funding duration preference helps us negotiate better interest rates."
                ]}
              />
            </div>
          </div>
        </div>
      </PageLayout>
    </div>
  );
};

export default FundingApplication;
