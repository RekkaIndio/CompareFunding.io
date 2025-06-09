import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PoundSterling, Calendar, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import SignUpLayout from '@/components/SignUpLayout';
import { useNavbar } from '@/contexts/NavbarContext';
import { saveFundingApplication } from '@/services/firebase';
import { toast } from 'react-toastify';
import '../../styles/animations.css';

const FundingApplication = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showNavbar, hideNavbar } = useNavbar();
  const [fundingPurpose, setFundingPurpose] = useState('expansion');
  const [amount, setAmount] = useState('100000');
  const [timeframe, setTimeframe] = useState('1_week');
  const [marketingConsent, setMarketingConsent] = useState(false);
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
    { label: 'Business Details', path: '/signup-journey/business-details' },
    { label: 'Industry Specifics', path: '/signup-journey/industry-specifics' },
  ];
  const currentStep = 1;

  const handleStepNavigation = (stepIndex: number) => {
    const state = { fundingPurpose, amount, timeframe, marketingConsent };
    
    switch (stepIndex) {
      case 0:
        navigate('/signup-journey/email-password', { state });
        break;
      case 1:
        navigate('/signup-journey/apply', { state });
        break;
      case 2:
        navigate('/signup-journey/business-details', { state });
        break;
      case 3:
        navigate('/signup-journey/industry-specifics', { state });
        break;
    }
  };

  const handlePrevious = () => {
    navigate('/signup-journey/email-password');
  };

  const handleNext = () => {
    navigate('/signup-journey/business-details', { 
      state: { fundingPurpose, amount, timeframe, marketingConsent } 
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const userId = location.state?.userId;
      if (!userId) {
        toast.error('User ID is missing. Please restart the signup process.');
        return;
      }

      await saveFundingApplication(userId, { 
        fundingPurpose, 
        amount, 
        timeframe, 
        marketingConsent 
      });

      toast.success('Funding application saved successfully!');
      handleNext();
    } catch (error) {
      toast.error('Failed to save funding application. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const sidebarProps = {
    title: "Tell Us About Your Funding Needs",
    description: "Help us understand what type of funding you're looking for so we can match you with the best lenders.",
    highlight: "Average funding time: 7-14 days",
    tips: [
      "Be specific about your funding amount",
      "Choose a realistic timeframe for receiving funds",
      "The more accurate your needs, the better we can match you",
      "You can always adjust these details later"
    ]
  };

  return (
    <SignUpLayout
      steps={steps}
      currentStep={currentStep}
      onStepNavigation={handleStepNavigation}
      onPrevious={handlePrevious}
      onNext={handleNext}
      canGoBack={true}
      canGoNext={!!fundingPurpose && !!amount && !!timeframe}
      sidebarProps={sidebarProps}
    >
      <div className="space-y-6 sm:space-y-8">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#2a3441] mb-2 sm:mb-3 animate-fadeIn">
            What Funding Do You Need?
          </h1>
          <p className="text-gray-600 text-sm sm:text-base md:text-lg animate-fadeIn delay-100">
            Tell us about your funding requirements to get personalised matches
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8 animate-fadeIn delay-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-2">
              <Label className="text-[#2a3441] text-sm sm:text-base font-medium flex items-center gap-2">
                <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#ff8000]" />
                Funding Purpose
              </Label>
              <Select value={fundingPurpose} onValueChange={setFundingPurpose}>
                <SelectTrigger className="h-10 sm:h-12 bg-white border-2 border-gray-200 focus:border-[#ff8000] text-[#2a3441] text-sm sm:text-base rounded-lg sm:rounded-xl">
                  <SelectValue placeholder="Select funding purpose" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expansion" className="text-sm sm:text-base">Business Expansion</SelectItem>
                  <SelectItem value="equipment" className="text-sm sm:text-base">Equipment Purchase</SelectItem>
                  <SelectItem value="inventory" className="text-sm sm:text-base">Inventory/Stock</SelectItem>
                  <SelectItem value="cashflow" className="text-sm sm:text-base">Cash Flow</SelectItem>
                  <SelectItem value="marketing" className="text-sm sm:text-base">Marketing & Advertising</SelectItem>
                  <SelectItem value="renovation" className="text-sm sm:text-base">Property/Renovation</SelectItem>
                  <SelectItem value="debt" className="text-sm sm:text-base">Debt Consolidation</SelectItem>
                  <SelectItem value="startup" className="text-sm sm:text-base">Startup Capital</SelectItem>
                  <SelectItem value="other" className="text-sm sm:text-base">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[#2a3441] text-sm sm:text-base font-medium flex items-center gap-2">
                <PoundSterling className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#ff8000]" />
                Funding Amount (£)
              </Label>
              <Select value={amount} onValueChange={setAmount}>
                <SelectTrigger className="h-10 sm:h-12 bg-white border-2 border-gray-200 focus:border-[#ff8000] text-[#2a3441] text-sm sm:text-base rounded-lg sm:rounded-xl">
                  <SelectValue placeholder="Select amount needed" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10000" className="text-sm sm:text-base">£10,000 - £25,000</SelectItem>
                  <SelectItem value="25000" className="text-sm sm:text-base">£25,000 - £50,000</SelectItem>
                  <SelectItem value="50000" className="text-sm sm:text-base">£50,000 - £100,000</SelectItem>
                  <SelectItem value="100000" className="text-sm sm:text-base">£100,000 - £250,000</SelectItem>
                  <SelectItem value="250000" className="text-sm sm:text-base">£250,000 - £500,000</SelectItem>
                  <SelectItem value="500000" className="text-sm sm:text-base">£500,000+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[#2a3441] text-sm sm:text-base font-medium flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#ff8000]" />
                When Do You Need Funding?
              </Label>
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger className="h-10 sm:h-12 bg-white border-2 border-gray-200 focus:border-[#ff8000] text-[#2a3441] text-sm sm:text-base rounded-lg sm:rounded-xl">
                  <SelectValue placeholder="Select timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediately" className="text-sm sm:text-base">Immediately</SelectItem>
                  <SelectItem value="1_week" className="text-sm sm:text-base">Within 1 Week</SelectItem>
                  <SelectItem value="2_weeks" className="text-sm sm:text-base">Within 2 Weeks</SelectItem>
                  <SelectItem value="1_month" className="text-sm sm:text-base">Within 1 Month</SelectItem>
                  <SelectItem value="3_months" className="text-sm sm:text-base">Within 3 Months</SelectItem>
                  <SelectItem value="6_months" className="text-sm sm:text-base">Within 6 Months</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-gray-50 p-3 sm:p-4 md:p-6 rounded-lg sm:rounded-xl border border-gray-100">
            <div className="flex items-start space-x-2 sm:space-x-3">
              <Checkbox
                id="marketing"
                checked={marketingConsent}
                onCheckedChange={(checked) => setMarketingConsent(checked === true)}
                className="mt-0.5 sm:mt-1 h-4 w-4 sm:h-5 sm:w-5 data-[state=checked]:bg-[#ff8000] data-[state=checked]:border-[#ff8000]"
              />
              <div className="space-y-0.5 sm:space-y-1">
                <Label htmlFor="marketing" className="text-[#2a3441] text-sm sm:text-base font-medium cursor-pointer">
                  Marketing Communications
                </Label>
                <p className="text-xs sm:text-sm text-gray-600">
                  I agree to receive marketing communications about funding opportunities, 
                  industry insights, and relevant financial products via email and SMS.
                </p>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading || !fundingPurpose || !amount || !timeframe}
            className="w-full h-10 sm:h-12 bg-gradient-to-r from-[#ff8000] to-[#ff6000] hover:from-[#e67300] hover:to-[#e55a00] text-white text-sm sm:text-base font-semibold rounded-lg sm:rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mt-2"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Saving Application...</span>
              </div>
            ) : (
              'Continue to View Matches'
            )}
          </Button>
        </form>
      </div>
    </SignUpLayout>
  );
};

export default FundingApplication;
