import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Check, Shield, TrendingUp, Clock, Award, ArrowRight, CheckCircle2, X, Compass, Home } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import SignUpLayout from '@/components/SignUpLayout';
import { useState, useEffect } from 'react';
import { useNavbar } from '@/contexts/NavbarContext';
import { useTour } from '@/contexts/TourContext';
import '../../styles/animations.css';

// Import lender logos
import barclaysLogo from '@/assets/lenderlogos/barclyays.png';
import hsbcLogo from '@/assets/lenderlogos/hsbclogo.png';
import lloydsLogo from '@/assets/lenderlogos/lloydslogo.png';
import natwestLogo from '@/assets/lenderlogos/natwestlogo.png';
import santanderLogo from '@/assets/lenderlogos/santanderlogo.png';
import metroBankLogo from '@/assets/lenderlogos/metro_bank_logo.png';

const EligibilityPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showNavbar, hideNavbar } = useNavbar();
  const { startTour } = useTour();
  const [currentStep] = useState(4); // This is step 4 in the sign up journey
  const [showTourModal, setShowTourModal] = useState(false);
  
  // Hide navbar on mount and show on unmount
  useEffect(() => {
    hideNavbar();
    // Clean up function to show navbar when component unmounts
    return () => {
      showNavbar();
    };
  }, [hideNavbar, showNavbar]);

  // Force hide navbar on first render
  useEffect(() => {
    const timer = setTimeout(() => {
      hideNavbar();
    }, 0);
    return () => clearTimeout(timer);
  }, [hideNavbar]);

  const steps = [
    { label: 'Email & Password', path: '/signup-journey/email-password' },
    { label: 'Funding Amount', path: '/signup-journey/apply' },
    { label: 'Funding Matches', path: '/signup-journey/funding-matches' },
    { label: 'Business Details', path: '/signup-journey/business-details' },
    { label: 'Eligibility', path: '/signup-journey/eligibility' },
  ];

  const handleStepNavigation = (stepIndex: number) => {
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

  const handlePrevious = () => {
    navigate('/signup-journey/business-details');
  };

  const handleNext = () => {
    setShowTourModal(true);
  };

  const handleStartTour = () => {
    setShowTourModal(false);
    // Start the tour and navigate to dashboard
    navigate('/dashboard?tour=start');
  };

  const handleSkipTour = () => {
    setShowTourModal(false);
    navigate('/dashboard');
  };

  const sidebarProps = {
    title: "Profile Complete!",
    description: "Your funding profile is ready. Upload your business documents to complete the application process and start receiving offers from lenders.",
    highlight: "Profile completion: 100%",
    tips: [
      "Your credit score and business data are now secured",
      "Document upload is the final step to unlock funding offers",
      "Lenders will review your complete profile and documents",
      "You'll receive notifications for new funding opportunities"
    ]
  };

  const eligibilityChecks = [
    { label: "Business Registration Verified", status: "complete" },
    { label: "Credit Score Assessment", status: "complete" },
    { label: "Business Profile Complete", status: "complete" },
    { label: "Funding Requirements Set", status: "complete" },
    { label: "Lender Matching Active", status: "complete" }
  ];

  const partnerLenders = [
    { name: "Barclays", logo: barclaysLogo },
    { name: "HSBC", logo: hsbcLogo },
    { name: "Lloyds", logo: lloydsLogo },
    { name: "NatWest", logo: natwestLogo },
    { name: "Santander", logo: santanderLogo },
    { name: "Metro Bank", logo: metroBankLogo }
  ];

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
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 animate-fadeIn">
            <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#2a3441] mb-2 sm:mb-3 animate-fadeIn delay-100">
            Profile Complete!
          </h1>
          <p className="text-gray-600 text-sm sm:text-base md:text-lg animate-fadeIn delay-200">
            Your funding profile is complete. Upload your documents to unlock funding offers
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8 animate-fadeIn delay-300">
          <Card className="p-4 sm:p-6 text-center border-2 border-green-500 bg-gradient-to-br from-green-500 to-green-600">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white mb-1 sm:mb-2">Secure & Verified</h3>
            <p className="text-green-100 text-xs sm:text-sm">Your business profile has been verified and secured</p>
          </Card>

          <Card className="p-4 sm:p-6 text-center border-2 border-[#ff8000] bg-gradient-to-br from-[#ff8000] to-[#ff6000]">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-[#ff8000]" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white mb-1 sm:mb-2">Credit Assessed</h3>
            <p className="text-orange-100 text-xs sm:text-sm">Your credit score has been evaluated for optimal matches</p>
          </Card>

          <Card className="p-4 sm:p-6 text-center border-2 border-blue-500 bg-gradient-to-br from-blue-500 to-blue-600 sm:col-span-2 md:col-span-1">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white mb-1 sm:mb-2">Fast Matching</h3>
            <p className="text-blue-100 text-xs sm:text-sm">Real-time matching with our partner lenders</p>
          </Card>
        </div>

        <Card className="p-4 sm:p-6 animate-fadeIn delay-400">
          <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4 flex items-center gap-1.5 sm:gap-2">
            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
            Eligibility Status
          </h3>
          <div className="space-y-2 sm:space-y-3">
            {eligibilityChecks.map((check, idx) => (
              <div key={idx} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-green-50 rounded-md sm:rounded-lg border border-green-200">
                <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
                <span className="text-[#2a3441] font-medium text-xs sm:text-sm">{check.label}</span>
                <span className="ml-auto text-green-600 text-xs sm:text-sm font-semibold">Complete</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4 sm:p-6 animate-fadeIn delay-500">
          <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4 flex items-center gap-1.5 sm:gap-2">
            <Award className="w-5 h-5 sm:w-6 sm:h-6 text-[#ff8000]" />
            Partner Lenders Ready
          </h3>
          <p className="text-white mb-3 sm:mb-4 text-xs sm:text-sm">
            Your profile will be automatically shared with our trusted lending partners who match your criteria.
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-6 gap-2 sm:gap-3">
            {partnerLenders.map((lender, idx) => (
              <div key={idx} className="bg-white p-2 sm:p-3 rounded-md sm:rounded-lg border border-gray-200 hover:border-[#ff8000] transition-colors duration-200 flex items-center justify-center">
                <img
                  src={lender.logo}
                  alt={lender.name}
                  className="h-6 sm:h-8 w-auto object-contain"
                />
              </div>
            ))}
          </div>
        </Card>

        <div className="bg-gradient-to-r from-[#ff8000] to-[#ff6000] p-4 sm:p-6 md:p-8 rounded-lg sm:rounded-xl text-white text-center animate-fadeIn delay-600">
          <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-2 sm:mb-3 md:mb-4 text-white">Welcome to Your Funding Platform!</h3>
          <p className="text-sm sm:text-base md:text-lg mb-4 sm:mb-5 md:mb-6 text-orange-100">
            Your profile is complete! Let us show you around the platform and help you get started.
          </p>
          <Button
            onClick={handleNext}
            className="bg-white text-[#ff8000] hover:bg-gray-100 font-semibold px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 rounded-lg sm:rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg text-sm sm:text-base md:text-lg"
          >
            Let's Get Started
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 ml-2" />
          </Button>
        </div>

        {/* Tour Modal - Mobile Optimized */}
        <Dialog open={showTourModal} onOpenChange={setShowTourModal}>
          <DialogContent className="sm:max-w-md max-w-[90vw] p-4 sm:p-6">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-lg sm:text-xl font-bold text-white">
                  Welcome to Compare Funding!
                </DialogTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTourModal(false)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </DialogHeader>
            <div className="space-y-4 sm:space-y-6 py-2 sm:py-4">
              <div className="text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-[#ff8000] to-[#ff6000] rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Compass className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <p className="text-white mb-4 sm:mb-6 text-sm sm:text-base">
                  We'd love to show you around the platform and help you get the most out of your funding journey.
                </p>
              </div>

              <div className="space-y-2 sm:space-y-3">
                <Button
                  onClick={handleStartTour}
                  className="w-full bg-gradient-to-r from-[#ff8000] to-[#ff6000] hover:from-[#ff7000] hover:to-[#ff5000] text-white font-semibold py-2 sm:py-3 rounded-lg transition-all duration-300 text-sm sm:text-base"
                >
                  <Compass className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 text-white" />
                  Take the Platform Tour
                </Button>
                
                <Button
                  onClick={handleSkipTour}
                  variant="outline"
                  className="w-full border-gray-300 text-white hover:bg-gray-50 font-semibold py-2 sm:py-3 rounded-lg text-sm sm:text-base"
                >
                  <Home className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
                  Go to Dashboard
                </Button>
              </div>

              <div className="text-[10px] sm:text-xs text-white text-center">
                You can always access the tour later from your dashboard
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </SignUpLayout>
  );
};

export default EligibilityPage;
