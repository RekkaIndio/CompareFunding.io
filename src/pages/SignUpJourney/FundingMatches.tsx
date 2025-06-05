import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Check, Users } from 'lucide-react';
import { useNavbar } from '@/contexts/NavbarContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import SignUpLayout from '@/components/SignUpLayout';
import '../../styles/animations.css';

// Import logo images
import metroLogo from '../../assets/lenderlogos/metro_bank_logo.png';
import natwestLogo from '../../assets/lenderlogos/natwestlogo.png';
import lloydsLogo from '../../assets/lenderlogos/lloydslogo.png';

const FundingMatches = () => {
  const { showNavbar, hideNavbar } = useNavbar();
  const location = useLocation();
  const navigate = useNavigate();
  const [userInfo] = useState(location.state || {});
  
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
  const currentStep = 2;

  const handleStepNavigation = (stepIndex: number) => {
    switch (stepIndex) {
      case 0:
        navigate('/signup-journey/email-password', { state: userInfo });
        break;
      case 1:
        navigate('/signup-journey/apply', { state: userInfo });
        break;
      case 2:
        navigate('/signup-journey/funding-matches', { state: userInfo });
        break;
      case 3:
        navigate('/signup-journey/business-details', { state: userInfo });
        break;
      case 4:
        navigate('/signup-journey/eligibility', { state: userInfo });
        break;
    }
  };

  const handlePrevious = () => {
    navigate('/signup-journey/apply', { state: userInfo });
  };

  const handleNext = () => {
    navigate('/signup-journey/business-details', { state: userInfo });
  };

  // Enhanced matches data with realistic funding options
  // const [matches] = useState({
  //   loans: [
  //     { name: 'Business Growth Loan', rate: '5.9%', amount: '£10k-£500k', term: '1-5 years' },
  //     { name: 'Equipment Finance', rate: '4.2%', amount: '£5k-£250k', term: '2-7 years' },
  //     { name: 'Working Capital Loan', rate: '6.8%', amount: '£5k-£100k', term: '6 months-3 years' },
  //     { name: 'Commercial Mortgage', rate: '3.5%', amount: '£100k-£5M', term: '5-25 years' },
  //     { name: 'Invoice Finance', rate: '1.5%', amount: '£10k-£1M', term: 'Ongoing' },
  //   ],
  //   equity: [
  //     { name: 'Angel Investment', equity: '10-25%', amount: '£50k-£500k', stage: 'Seed/Series A' },
  //     { name: 'Venture Capital', equity: '15-40%', amount: '£250k-£10M', stage: 'Series A+' },
  //   ],
  //   grants: [
  //     { name: 'Innovation Grant', amount: '£5k-£100k', eligibility: 'Tech startups', repayment: 'None' },
  //     { name: 'Regional Development', amount: '£10k-£250k', eligibility: 'SMEs', repayment: 'None' },
  //   ]
  // });

  const sidebarProps = {
    title: "Your Funding Partners",
    description: "We've identified three trusted banking partners who can provide competitive funding solutions for your business needs.",
    highlight: "3 pre-qualified lenders",
    tips: [
      "These partners offer a range of business funding options",
      "Competitive rates and flexible terms available", 
      "Complete your profile to get personalised offers",
      "Fast approval process with established lenders"
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
      canGoNext={true}
      sidebarProps={sidebarProps}
    >
      <div className="space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#2a3441] mb-3 animate-fadeIn">
            We've Found Your Perfect Matches
          </h1>
          <p className="text-gray-600 text-lg animate-fadeIn delay-100">
            These trusted banking partners are ready to provide competitive funding for your business
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-fadeIn delay-200">
          <Card className="p-8 text-center border-2 border-gray-200 hover:border-[#ff8000] bg-white hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-center h-16 mb-4">
              <img 
                src={metroLogo} 
                alt="Metro Bank" 
                className="max-h-12 max-w-full object-contain"
              />
            </div>
            <h3 className="text-lg font-semibold text-[#2a3441]">Metro Bank</h3>
          </Card>

          <Card className="p-8 text-center border-2 border-gray-200 hover:border-[#ff8000] bg-white hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-center h-16 mb-4">
              <img 
                src={natwestLogo} 
                alt="NatWest" 
                className="max-h-12 max-w-full object-contain"
              />
            </div>
            <h3 className="text-lg font-semibold text-[#2a3441]">NatWest</h3>
          </Card>

          <Card className="p-8 text-center border-2 border-gray-200 hover:border-[#ff8000] bg-white hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-center h-16 mb-4">
              <img 
                src={lloydsLogo} 
                alt="Lloyds Bank" 
                className="max-h-12 max-w-full object-contain"
              />
            </div>
            <h3 className="text-lg font-semibold text-[#2a3441]">Lloyds Bank</h3>
          </Card>
        </div>

        <div className="text-center py-8 animate-fadeIn delay-300">
          <h3 className="text-xl font-semibold text-[#2a3441] mb-4">
            Your Funding Partners
          </h3>
          <p className="text-gray-600 text-lg mb-6">
            We've connected you with trusted lenders who are ready to provide competitive funding options for your business.
          </p>
          <div className="flex justify-center items-center gap-2 text-sm text-gray-500">
            <Check className="w-4 h-4 text-green-500" />
            <span>Pre-qualified matches based on your requirements</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-xl border border-blue-200 text-center animate-fadeIn delay-400">
          <Users className="w-8 h-8 text-blue-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-[#2a3441] mb-2">
            Ready to Get Detailed Offers?
          </h3>
          <p className="text-gray-600 mb-4">
            Complete your business profile to receive personalised rates, terms, and pre-approval decisions from our partner lenders.
          </p>
          <Button
            onClick={handleNext}
            className="bg-gradient-to-r from-[#ff8000] to-[#ff6000] hover:from-[#e67300] hover:to-[#e55a00] text-white font-semibold px-8 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
          >
            Continue to Business Details
          </Button>
        </div>
      </div>
    </SignUpLayout>
  );
};

export default FundingMatches;
