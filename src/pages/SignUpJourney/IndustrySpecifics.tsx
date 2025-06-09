import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SignUpLayout from '@/components/SignUpLayout';
import { useNavbar } from '@/contexts/NavbarContext';
import '../../styles/animations.css';

const IndustrySpecifics = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showNavbar, hideNavbar } = useNavbar();
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
    { label: 'Business Details', path: '/signup-journey/business-details' },
    { label: 'Industry Specifics', path: '/signup-journey/industry-specifics' },
  ];
  const currentStep = 3;

  const handleStepNavigation = (stepIndex: number) => {
    const state = { ...userInfo };
    
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
    navigate('/signup-journey/business-details', { state: userInfo });
  };

  const handleNext = () => {
    navigate('/dashboard', { 
      state: userInfo 
    });
  };

  const sidebarProps = {
    title: "Industry Specialization",
    description: "Help us understand the specific areas of your industry so we can match you with the most relevant funding opportunities.",
    highlight: "Specialized funding often has better terms",
    tips: [
      "This section will be customized for your industry",
      "Industry-specific funding often offers better rates",
      "Specialized lenders understand your sector better",
      "You can always update these selections later"
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
      <div className="space-y-6 sm:space-y-8">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#2a3441] mb-2 sm:mb-3 animate-fadeIn">
            Industry Specifics
          </h1>
          <p className="text-gray-600 text-sm sm:text-base md:text-lg animate-fadeIn delay-100">
            This page will be customized based on your industry selection
          </p>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center animate-fadeIn delay-200">
          <div className="w-16 h-16 bg-gray-300 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Building className="h-8 w-8 text-gray-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Coming Soon
          </h2>
          <p className="text-gray-600 mb-6">
            Industry-specific options and requirements will be displayed here based on your business type.
          </p>
          <p className="text-sm text-gray-500">
            For now, you can continue to complete your profile setup.
          </p>
        </div>

        <Button
          onClick={handleNext}
          className="w-full h-10 sm:h-12 bg-gradient-to-r from-[#ff8000] to-[#ff6000] hover:from-[#e67300] hover:to-[#e55a00] text-white text-sm sm:text-base font-semibold rounded-lg sm:rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg mt-2"
        >
          Continue to Dashboard
        </Button>
      </div>
    </SignUpLayout>
  );
};

export default IndustrySpecifics;
