import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import PageLayout from '@/components/PageLayout';
import { useNavbar } from '@/contexts/NavbarContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import SignUpSidebar from '@/components/SignUpSidebar';
import '../../styles/animations.css';

type FundingMatch = {
  id: string;
  type: 'loan' | 'equity' | 'grant';
  provider: string;
  amount: string;
  term?: string;
  rate?: string;
  description: string;
};

const CustomizeOffers = () => {
  const { showNavbar, hideNavbar } = useNavbar();
  const location = useLocation();
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(location.state?.userInfo || {});
  const [matches, setMatches] = useState<any>(location.state?.matches || { loans: [], equity: [], grants: [] });
  const [currentStep] = useState(4); // This is step 4 in the sign up journey
  
  // For Loan Preferences
  const [loanAmount, setLoanAmount] = useState([100000]);
  const [loanTerm, setLoanTerm] = useState([24]); // in months
  const [includeLoans, setIncludeLoans] = useState(true);
  
  // For Equity Preferences
  const [equityAmount, setEquityAmount] = useState([500000]);
  const [equityStake, setEquityStake] = useState([15]); // percentage
  const [includeEquity, setIncludeEquity] = useState(true);
  
  // For Grant Preferences
  const [includeGrants, setIncludeGrants] = useState(true);
  const [grantPurpose, setGrantPurpose] = useState('any');
  
  // For Business Details
  const [businessName, setBusinessName] = useState(userInfo.businessName || '');
  const [industry, setIndustry] = useState(userInfo.industry || '');
  const [revenue, setRevenue] = useState(userInfo.revenue || '100000');
  const [yearsTrading, setYearsTrading] = useState(userInfo.yearsTrading || '2');
  

  useEffect(() => {
    hideNavbar();
    return () => {
      showNavbar();
    };
  }, [hideNavbar, showNavbar]);

  // Progress bar and navigation steps config
  const steps = [
    { label: 'Funding Amount', path: '/signup-journey/apply' },
    { label: 'Business Details', path: '/signup-journey/business-details' },
    { label: 'Matches', path: '/signup-journey/funding-matches' },
  ];
  
  const goToStep = (stepIdx: number) => {
    if (stepIdx === 0) navigate('/signup-journey/apply', { state: location.state });
    if (stepIdx === 1) navigate('/signup-journey/business-details', { state: location.state });
    if (stepIdx === 2) navigate('/signup-journey/funding-matches', { state: { ...userInfo, matches } });
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // In a real app, you would filter the matches based on preferences
    // For demo purposes, we'll navigate to the matches page with the same matches
    navigate('/signup-journey/funding-matches', {
      state: {
        matches,
        userInfo: {
          ...userInfo,
          businessName,
          industry,
          revenue,
          yearsTrading,
          preferences: {
            loan: {
              include: includeLoans,
              amount: loanAmount[0],
              term: loanTerm[0]
            },
            equity: {
              include: includeEquity,
              amount: equityAmount[0],
              stake: equityStake[0]
            },
            grants: {
              include: includeGrants,
              purpose: grantPurpose
            }
          }
        }
      }
    });
  };
  
  // Format numbers as currency
  const formatCurrency = (value: string | number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      maximumFractionDigits: 0
    }).format(Number(value));
  };
  
  // Format term (convert months to years and months)
  const formatTerm = (months: number) => {
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    
    if (years === 0) {
      return `${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
    } else if (remainingMonths === 0) {
      return `${years} year${years !== 1 ? 's' : ''}`;
    } else {
      return `${years} year${years !== 1 ? 's' : ''} ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
    }
  };

  return (
    <div className="bg-white min-h-screen">
      <PageLayout className="bg-white">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8">
              {/* Progress Bar & Steps */}
              <div className="mb-6 sm:mb-8 md:mb-10">
                <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                  {steps.map((step, idx) => (
                    <div
                      key={step.label}
                      className={`flex-1 h-1.5 sm:h-2 rounded ${idx <= currentStep ? 'bg-[#ff8000]' : 'bg-gray-300'}`}
                    ></div>
                  ))}
                </div>
                <div className="grid grid-cols-3 text-center text-xs sm:text-sm font-medium text-[#2a3441]">
                  {steps.map((step, idx) => {
                    // Display abbreviated labels on mobile
                    const mobileLabel = step.label.split(' ')[0];
                    return (
                      <span key={step.label} className={idx === currentStep ? 'font-bold text-[#ff8000]' : ''}>
                        <span className="hidden sm:inline">{step.label}</span>
                        <span className="sm:hidden">{mobileLabel}</span>
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Navigation Arrows */}
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <button
                  type="button"
                  onClick={() => goToStep(currentStep - 1)}
                  disabled={currentStep === 0}
                  className={`flex items-center gap-1 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-full border border-gray-200 bg-white text-[#2a3441] hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  <ArrowLeft className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Back</span>
                </button>
                <div className="text-xs sm:text-sm text-gray-500">
                  Step {currentStep + 1} of {steps.length}
                </div>
                <button
                  type="button"
                  onClick={() => goToStep(currentStep + 1)}
                  disabled={currentStep === steps.length - 1}
                  className={`flex items-center gap-1 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-full border border-gray-200 bg-white text-[#2a3441] hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  <span className="hidden sm:inline">Next</span>
                  <ArrowRight className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                </button>
              </div>

              <div className="space-y-6 sm:space-y-8 animate-fadeIn">
                <div className="mb-6 sm:mb-8">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#2a3441] mb-1 sm:mb-2">Customize Your Funding</h1>
                  <p className="text-sm sm:text-base md:text-lg text-[#2a3441]">Tailor your funding search to match your specific business needs</p>
                </div>
                
                <form onSubmit={handleSubmit}>
                  {/* Business Details Section */}
                  <Card className="p-6 mb-8 border border-[#ff8000] bg-white animate-fadeIn delay-100">
                    <h2 className="text-xl font-semibold text-[#2a3441] mb-4">Business Details</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="businessName" className="text-[#2a3441]">Business Name</Label>
                        <Input 
                          id="businessName"
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          className="mt-1 bg-white border-2 border-[#ff8000] focus:border-[#ff8000] focus:ring-1 focus:ring-[#ff8000] text-[#2a3441]"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="industry" className="text-[#2a3441]">Industry</Label>
                        <Select value={industry} onValueChange={setIndustry}>
                          <SelectTrigger id="industry" className="mt-1 bg-white border-2 border-[#ff8000] focus:border-[#ff8000] focus:ring-1 focus:ring-[#ff8000] text-[#2a3441]">
                            <SelectValue placeholder="Select an industry" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border border-[#ff8000] text-[#2a3441]">
                            <SelectItem value="retail">Retail</SelectItem>
                            <SelectItem value="technology">Technology</SelectItem>
                            <SelectItem value="manufacturing">Manufacturing</SelectItem>
                            <SelectItem value="healthcare">Healthcare</SelectItem>
                            <SelectItem value="hospitality">Hospitality</SelectItem>
                            <SelectItem value="construction">Construction</SelectItem>
                            <SelectItem value="professional">Professional Services</SelectItem>
                            <SelectItem value="agriculture">Agriculture</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="revenue" className="text-[#2a3441]">Annual Revenue</Label>
                        <Select value={revenue} onValueChange={setRevenue}>
                          <SelectTrigger id="revenue" className="mt-1 bg-white border-2 border-[#ff8000] focus:border-[#ff8000] focus:ring-1 focus:ring-[#ff8000] text-[#2a3441]">
                            <SelectValue placeholder="Select revenue" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border border-[#ff8000] text-[#2a3441]">
                            <SelectItem value="50000">Less than £50,000</SelectItem>
                            <SelectItem value="100000">£50,000 - £100,000</SelectItem>
                            <SelectItem value="250000">£100,001 - £250,000</SelectItem>
                            <SelectItem value="500000">£250,001 - £500,000</SelectItem>
                            <SelectItem value="1000000">£500,001 - £1,000,000</SelectItem>
                            <SelectItem value="5000000">£1,000,001 - £5,000,000</SelectItem>
                            <SelectItem value="10000000">More than £5,000,000</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="yearsTrading" className="text-[#2a3441]">Years in Business</Label>
                        <Select value={yearsTrading} onValueChange={setYearsTrading}>
                          <SelectTrigger id="yearsTrading" className="mt-1 bg-white border-2 border-[#ff8000] focus:border-[#ff8000] focus:ring-1 focus:ring-[#ff8000] text-[#2a3441]">
                            <SelectValue placeholder="Select years trading" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border border-[#ff8000] text-[#2a3441]">
                            <SelectItem value="0">Less than 1 year</SelectItem>
                            <SelectItem value="1">1 year</SelectItem>
                            <SelectItem value="2">2 years</SelectItem>
                            <SelectItem value="3">3 years</SelectItem>
                            <SelectItem value="5">4-5 years</SelectItem>
                            <SelectItem value="10">6-10 years</SelectItem>
                            <SelectItem value="11">More than 10 years</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </Card>
                  
                  {/* Loan Preferences Section */}
                  <Card className="p-6 mb-8 border border-[#ff8000] bg-white animate-fadeIn delay-200">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold text-[#2a3441]">Loan Preferences</h2>
                      <div className="flex items-center">
                        <Label htmlFor="includeLoans" className="mr-2 text-[#2a3441]">Include Loans</Label>
                        <Switch 
                          id="includeLoans" 
                          checked={includeLoans} 
                          onCheckedChange={setIncludeLoans} 
                          className="data-[state=checked]:bg-[#ff8000]"
                        />
                      </div>
                    </div>
                    
                    {includeLoans && (
                      <div className="space-y-6">
                        <div>
                          <div className="flex justify-between mb-1 sm:mb-2">
                            <Label className="text-[#2a3441] text-xs sm:text-sm">Loan Amount</Label>
                            <span className="text-[#2a3441] text-xs sm:text-sm font-medium">{formatCurrency(loanAmount[0])}</span>
                          </div>
                          <Slider
                            value={loanAmount}
                            onValueChange={setLoanAmount}
                            max={1000000}
                            step={10000}
                            className="[&>span]:bg-[#ff8000]"
                          />
                          <div className="flex justify-between mt-1">
                            <span className="text-[10px] sm:text-xs text-[#2a3441]">£10,000</span>
                            <span className="text-[10px] sm:text-xs text-[#2a3441]">£1,000,000</span>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-1 sm:mb-2">
                            <Label className="text-[#2a3441] text-xs sm:text-sm">Loan Term</Label>
                            <span className="text-[#2a3441] text-xs sm:text-sm font-medium">{formatTerm(loanTerm[0])}</span>
                          </div>
                          <Slider
                            value={loanTerm}
                            onValueChange={setLoanTerm}
                            min={3}
                            max={120}
                            step={3}
                            className="[&>span]:bg-[#ff8000]"
                          />
                          <div className="flex justify-between mt-1">
                            <span className="text-xs text-[#2a3441]">3 months</span>
                            <span className="text-xs text-[#2a3441]">10 years</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                  
                  {/* Equity Preferences Section */}
                  <Card className="p-6 mb-8 border border-[#ff8000] bg-white animate-fadeIn delay-300">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold text-[#2a3441]">Equity Preferences</h2>
                      <div className="flex items-center">
                        <Label htmlFor="includeEquity" className="mr-2 text-[#2a3441]">Include Equity</Label>
                        <Switch 
                          id="includeEquity" 
                          checked={includeEquity} 
                          onCheckedChange={setIncludeEquity} 
                          className="data-[state=checked]:bg-[#ff8000]"
                        />
                      </div>
                    </div>
                    
                    {includeEquity && (
                      <div className="space-y-6">
                        <div>
                          <div className="flex justify-between mb-1 sm:mb-2">
                            <Label className="text-[#2a3441] text-xs sm:text-sm">Investment Amount</Label>
                            <span className="text-[#2a3441] text-xs sm:text-sm font-medium">{formatCurrency(equityAmount[0])}</span>
                          </div>
                          <Slider
                            value={equityAmount}
                            onValueChange={setEquityAmount}
                            max={2000000}
                            step={50000}
                            className="[&>span]:bg-[#ff8000]"
                          />
                          <div className="flex justify-between mt-1">
                            <span className="text-[10px] sm:text-xs text-[#2a3441]">£50,000</span>
                            <span className="text-[10px] sm:text-xs text-[#2a3441]">£2,000,000</span>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-1 sm:mb-2">
                            <Label className="text-[#2a3441] text-xs sm:text-sm">Equity Stake</Label>
                            <span className="text-[#2a3441] text-xs sm:text-sm font-medium">{equityStake[0]}%</span>
                          </div>
                          <Slider
                            value={equityStake}
                            onValueChange={setEquityStake}
                            max={49}
                            step={1}
                            className="[&>span]:bg-[#ff8000]"
                          />
                          <div className="flex justify-between mt-1">
                            <span className="text-[10px] sm:text-xs text-[#2a3441]">5%</span>
                            <span className="text-[10px] sm:text-xs text-[#2a3441]">49%</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                  
                  {/* Grant Preferences Section */}
                  <Card className="p-6 mb-8 border border-[#ff8000] bg-white animate-fadeIn delay-400">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold text-[#2a3441]">Grant Preferences</h2>
                      <div className="flex items-center">
                        <Label htmlFor="includeGrants" className="mr-2 text-[#2a3441]">Include Grants</Label>
                        <Switch 
                          id="includeGrants" 
                          checked={includeGrants} 
                          onCheckedChange={setIncludeGrants} 
                          className="data-[state=checked]:bg-[#ff8000]"
                        />
                      </div>
                    </div>
                    
                    {includeGrants && (
                      <div>
                        <Label htmlFor="grantPurpose" className="text-[#2a3441]">Grant Purpose</Label>
                        <Select
                          value={grantPurpose}
                          onValueChange={setGrantPurpose}
                        >
                          <SelectTrigger id="grantPurpose" className="mt-1 bg-white border-2 border-[#ff8000] focus:border-[#ff8000] focus:ring-1 focus:ring-[#ff8000] text-[#2a3441]">
                            <SelectValue placeholder="Select a purpose" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border border-[#ff8000] text-[#2a3441]">
                            <SelectItem value="any">Any Purpose</SelectItem>
                            <SelectItem value="innovation">Research & Innovation</SelectItem>
                            <SelectItem value="expansion">Business Expansion</SelectItem>
                            <SelectItem value="sustainability">Sustainability</SelectItem>
                            <SelectItem value="digital">Digital Transformation</SelectItem>
                            <SelectItem value="export">Export & International Trade</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </Card>
                  
                  <div className="flex justify-center mt-6 sm:mt-8">
                    <Button 
                      type="submit" 
                      className="bg-[#ff8000] hover:bg-[#e67300] text-white px-8 sm:px-14 py-3 sm:py-4 md:py-5 text-sm sm:text-base md:text-lg h-auto rounded-xl sm:rounded-full font-medium shadow-md transition-all hover:shadow-lg hover:scale-[1.02] animate-fadeIn delay-500 w-full sm:w-auto"
                    >
                      Find My Matches
                    </Button>
                  </div>
                </form>
              </div>
            </div>
            
            {/* Sidebar Column - Modular and tailored for this step */}
            <div className="lg:col-span-4 flex flex-col h-full p-0 m-0">
              <SignUpSidebar
                title="Customize Your Perfect Funding Solution"
                description="Tell us your preferences to find the perfect funding match for your business."
                highlight="The more details you provide, the better we can tailor your funding options."
                tips={[
                  "Different funding types (loans, equity, grants) suit different business goals",
                  "Consider the amount of funding you're comfortable managing",
                  "Think about your timeline - how quickly do you need the funds?",
                  "Balance control and investment - equity means giving up some ownership"
                ]}
                step={currentStep}
              />
            </div>
          </div>
        </div>
      </PageLayout>
    </div>
  );
};

export default CustomizeOffers;
