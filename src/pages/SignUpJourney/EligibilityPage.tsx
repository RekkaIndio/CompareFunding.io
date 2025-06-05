import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Check, Shield, TrendingUp, Clock, Award, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import SignUpLayout from '@/components/SignUpLayout';
import { useState, useEffect } from 'react';
import { useNavbar } from '@/contexts/NavbarContext';
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
  const [currentStep] = useState(4); // This is step 4 in the sign up journey
  
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
    navigate('/business/documents');
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
      <div className="space-y-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-fadeIn">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-[#2a3441] mb-3 animate-fadeIn delay-100">
            Profile Complete! Ready for Documents
          </h1>
          <p className="text-gray-600 text-lg animate-fadeIn delay-200">
            Your funding profile is complete. Upload your documents to unlock funding offers
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-fadeIn delay-300">
          <Card className="p-6 text-center border-2 border-green-500 bg-gradient-to-br from-green-500 to-green-600">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-green-500" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Secure & Verified</h3>
            <p className="text-green-100 text-sm">Your business profile has been verified and secured</p>
          </Card>

          <Card className="p-6 text-center border-2 border-[#ff8000] bg-gradient-to-br from-[#ff8000] to-[#ff6000]">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-6 h-6 text-[#ff8000]" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Credit Assessed</h3>
            <p className="text-orange-100 text-sm">Your credit score has been evaluated for optimal matches</p>
          </Card>

          <Card className="p-6 text-center border-2 border-blue-500 bg-gradient-to-br from-blue-500 to-blue-600">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-6 h-6 text-blue-500" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Fast Matching</h3>
            <p className="text-blue-100 text-sm">Real-time matching with our partner lenders</p>
          </Card>
        </div>

        <Card className="p-6 animate-fadeIn delay-400">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-green-500" />
            Eligibility Status
          </h3>
          <div className="space-y-3">
            {eligibilityChecks.map((check, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <Check className="w-5 h-5 text-green-600" />
                <span className="text-[#2a3441] font-medium">{check.label}</span>
                <span className="ml-auto text-green-600 text-sm font-semibold">Complete</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 animate-fadeIn delay-500">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Award className="w-6 h-6 text-[#ff8000]" />
            Partner Lenders Ready to Review
          </h3>
          <p className="text-white mb-4">
            Your profile will be automatically shared with our trusted lending partners who match your criteria.
          </p>
          <div className="flex flex-wrap items-center gap-4 justify-center">
            {partnerLenders.map((lender, idx) => (
              <div key={idx} className="bg-white p-3 rounded-lg border border-gray-200 hover:border-[#ff8000] transition-colors duration-200">
                <img
                  src={lender.logo}
                  alt={lender.name}
                  className="h-8 w-auto object-contain"
                />
              </div>
            ))}
          </div>
        </Card>

        <div className="bg-gradient-to-r from-[#ff8000] to-[#ff6000] p-8 rounded-xl text-white text-center animate-fadeIn delay-600">
          <h3 className="text-2xl font-bold mb-4 text-white">Ready to Upload Your Documents?</h3>
          <p className="text-lg mb-6 text-orange-100">
            Complete your application by uploading the required business documents. This final step will unlock access to funding offers from our partner lenders.
          </p>
          <Button
            onClick={handleNext}
            className="bg-white text-[#ff8000] hover:bg-gray-100 font-semibold px-8 py-4 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg text-lg"
          >
            Upload Documents
            <ArrowRight className="w-6 h-6 ml-2" />
          </Button>
        </div>
      </div>
    </SignUpLayout>
  );
};

export default EligibilityPage;
