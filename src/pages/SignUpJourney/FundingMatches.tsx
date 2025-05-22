import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import PageLayout from '@/components/PageLayout';
import { useNavbar } from '@/contexts/NavbarContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import cflogowhiteUrl from '@/assets/cflogowhite.png';

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

  // Updated steps array to reflect the correct order
  const steps = [
    { label: 'Email & Password', path: '/signup-journey/email-password' },
    { label: 'Funding Amount', path: '/signup-journey/apply' },
    { label: 'Funding Matches', path: '/signup-journey/funding-matches' },
    { label: 'Business Details', path: '/signup-journey/business-details' },
    { label: 'Eligibility', path: '/signup-journey/eligibility' },
  ];
  // Explicitly define currentStep as a number
  const currentStep: number = 2; // Ensure this is a number type for comparison
  const isDisabled = currentStep === 0;
  const goToStep = (stepIdx: number) => {
    if (stepIdx === 0) navigate('/signup-journey/email-password', { state: userInfo });
    if (stepIdx === 1) navigate('/signup-journey/apply', { state: userInfo });
    if (stepIdx === 2) navigate('/signup-journey/funding-matches', { state: userInfo });
    if (stepIdx === 3) navigate('/signup-journey/business-details', { state: userInfo });
    if (stepIdx === 4) navigate('/signup-journey/eligibility', { state: userInfo });
  };

  // Simplified matches data - just counts
  const [matches] = useState({
    loans: Array(10).fill({}),
    equity: Array(2).fill({}),
    grants: Array(2).fill({})
  });
  
  // Function to navigate back
  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-white">
      <PageLayout className="bg-transparent" hideNavbar={true}>
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
                  disabled={isDisabled}
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

              <div className="max-w-5xl mx-auto">
                <div className="mb-16">
                  <h1 className="flex items-center text-3xl md:text-4xl font-bold text-[#2a3441] mb-6">
                    Here are your potential matches
                  </h1>
                </div>
                
                {/* Summary Cards - Styled with orange accents */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
                  <Card className="p-8 bg-white shadow-xl rounded-lg border-none text-center overflow-hidden transform transition-transform hover:translate-y-[-5px]">
                    <div className="flex flex-col items-center">
                      <h2 className="text-7xl font-bold text-[#ff8000] mb-3">{matches.loans.length}</h2>
                      <p className="text-xl text-[#2a3441]">Loans</p>
                    </div>
                  </Card>
                  
                  <Card className="p-8 bg-white shadow-xl rounded-lg border-none text-center overflow-hidden transform transition-transform hover:translate-y-[-5px]">
                    <div className="flex flex-col items-center">
                      <h2 className="text-7xl font-bold text-[#ff8000] mb-3">{matches.equity.length}</h2>
                      <p className="text-xl text-[#2a3441]">Equity</p>
                    </div>
                  </Card>
                  
                  <Card className="p-8 bg-white shadow-xl rounded-lg border-none text-center overflow-hidden transform transition-transform hover:translate-y-[-5px]">
                    <div className="flex flex-col items-center">
                      <h2 className="text-7xl font-bold text-[#ff8000] mb-3">{matches.grants.length}</h2>
                      <p className="text-xl text-[#2a3441]">Grants</p>
                    </div>
                  </Card>
                </div>
                
                {/* Single CTA Button - Updated to match orange theme */}
                <div className="text-center mb-24">
                  <Button 
                    onClick={handleGoBack}
                    className="bg-[#ff8000] hover:bg-[#e67300] text-white px-14 py-5 text-lg h-auto rounded-full font-medium shadow-md transition-all hover:shadow-lg hover:scale-[1.02]"
                  >
                    Customise your offers
                  </Button>
                </div>
                
                {/* Disclaimer Text */}
                <div className="max-w-3xl mx-auto text-center text-sm text-[#2a3441]/70">
                  <p className="mb-4">
                    Compare Funding is a not credit broker and does not provide capital. We work with a range of companies to offer clear 
                    comparisons that allow customers to make choices on financial products & services.
                  </p>
                  <p>
                    Compare Funding may receive a commission, which may vary by product but typically in the form of a fixed percentage of the 
                    loan amount. For certain lenders, we do have influence over the interest rate, and this can impact the 
                    amount you pay under the agreement.
                  </p>
                </div>
              </div>
            </div>

            {/* Sidebar Column */}
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

export default FundingMatches;
