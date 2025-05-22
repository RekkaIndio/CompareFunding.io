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
  const currentStep = 2; // Ensure this is a number type for comparison
  const goToStep = (stepIdx: number) => {
    if (stepIdx === 0) navigate('/signup-journey/apply', { state: location.state });
    if (stepIdx === 1) navigate('/signup-journey/business-details', { state: location.state });
    if (stepIdx === 3) navigate('/signup-journey/funding-matches', { state: { ...userInfo, matches } });
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
                <div className="grid grid-cols-4 text-center text-sm font-medium text-[#2a3441]">
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

              <div className="space-y-8">
                <div className="mb-8">
                  <h1 className="text-3xl md:text-4xl font-bold text-[#2a3441] mb-2">Customize Your Funding Options</h1>
                  <p className="text-lg text-[#2a3441]">Tailor your funding search to match your specific business needs</p>
                </div>
                
                <form onSubmit={handleSubmit}>
                  {/* Business Details Section */}
                  <Card className="p-6 mb-8 border border-[#ff8000] bg-white">
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
                        <Select
                          value={industry}
                          onValueChange={setIndustry}
                        >
                          <SelectTrigger id="industry" className="mt-1 bg-white border-2 border-[#ff8000] focus:border-[#ff8000] focus:ring-1 focus:ring-[#ff8000] text-[#2a3441]">
                            <SelectValue placeholder="Select an industry" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border border-[#ff8000] text-[#2a3441]">
                            <SelectItem value="retail">Retail</SelectItem>
                            <SelectItem value="technology">Technology</SelectItem>
                            <SelectItem value="manufacturing">Manufacturing</SelectItem>
                            <SelectItem value="healthcare">Healthcare</SelectItem>
                            <SelectItem value="finance">Financial Services</SelectItem>
                            <SelectItem value="hospitality">Hospitality</SelectItem>
                            <SelectItem value="construction">Construction</SelectItem>
                            <SelectItem value="professional">Professional Services</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="revenue" className="text-[#2a3441]">Annual Revenue</Label>
                        <Input 
                          id="revenue"
                          value={formatCurrency(revenue)}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9]/g, '');
                            setRevenue(value);
                          }}
                          className="mt-1 bg-white border-2 border-[#ff8000] focus:border-[#ff8000] focus:ring-1 focus:ring-[#ff8000] text-[#2a3441]"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="yearsTrading" className="text-[#2a3441]">Years Trading</Label>
                        <Input 
                          id="yearsTrading"
                          type="number"
                          value={yearsTrading}
                          onChange={(e) => setYearsTrading(e.target.value)}
                          className="mt-1 bg-white border-2 border-[#ff8000] focus:border-[#ff8000] focus:ring-1 focus:ring-[#ff8000] text-[#2a3441]"
                        />
                      </div>
                    </div>
                  </Card>
                  
                  {/* Loan Preferences Section */}
                  <Card className="p-6 mb-8 border border-[#ff8000] bg-white">
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
                          <div className="flex justify-between mb-2">
                            <Label className="text-[#2a3441]">Loan Amount</Label>
                            <span className="text-[#2a3441]">{formatCurrency(loanAmount[0])}</span>
                          </div>
                          <Slider
                            value={loanAmount}
                            onValueChange={setLoanAmount}
                            max={1000000}
                            step={5000}
                            className="[&>span]:bg-[#ff8000]"
                          />
                          <div className="flex justify-between mt-1">
                            <span className="text-xs text-[#2a3441]">£10,000</span>
                            <span className="text-xs text-[#2a3441]">£1,000,000</span>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-2">
                            <Label className="text-[#2a3441]">Loan Term</Label>
                            <span className="text-[#2a3441]">{formatTerm(loanTerm[0])}</span>
                          </div>
                          <Slider
                            value={loanTerm}
                            onValueChange={setLoanTerm}
                            max={84}
                            step={1}
                            className="[&>span]:bg-[#ff8000]"
                          />
                          <div className="flex justify-between mt-1">
                            <span className="text-xs text-[#2a3441]">3 months</span>
                            <span className="text-xs text-[#2a3441]">7 years</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                  
                  {/* Equity Preferences Section */}
                  <Card className="p-6 mb-8 border border-[#ff8000] bg-white">
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
                          <div className="flex justify-between mb-2">
                            <Label className="text-[#2a3441]">Investment Amount</Label>
                            <span className="text-[#2a3441]">{formatCurrency(equityAmount[0])}</span>
                          </div>
                          <Slider
                            value={equityAmount}
                            onValueChange={setEquityAmount}
                            max={2000000}
                            step={50000}
                            className="[&>span]:bg-[#ff8000]"
                          />
                          <div className="flex justify-between mt-1">
                            <span className="text-xs text-[#2a3441]">£50,000</span>
                            <span className="text-xs text-[#2a3441]">£2,000,000</span>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-2">
                            <Label className="text-[#2a3441]">Equity Stake</Label>
                            <span className="text-[#2a3441]">{equityStake[0]}%</span>
                          </div>
                          <Slider
                            value={equityStake}
                            onValueChange={setEquityStake}
                            max={49}
                            step={1}
                            className="[&>span]:bg-[#ff8000]"
                          />
                          <div className="flex justify-between mt-1">
                            <span className="text-xs text-[#2a3441]">5%</span>
                            <span className="text-xs text-[#2a3441]">49%</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                  
                  {/* Grant Preferences Section */}
                  <Card className="p-6 mb-8 border border-[#ff8000] bg-white">
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
                  
                  <div className="flex justify-center mt-8">
                    <Button 
                      type="submit" 
                      className="bg-[#ff8000] hover:bg-[#e67300] text-white px-14 py-5 text-lg h-auto rounded-full font-medium shadow-md transition-all hover:shadow-lg hover:scale-[1.02]"
                    >
                      Find My Matches
                    </Button>
                  </div>
                </form>
              </div>

              {/* Sidebar Column */}
              <div className="lg:col-span-4 flex flex-col h-full p-0 m-0">
                <div
                  className="flex flex-col items-center bg-[#2a3441] h-[100vh] fixed right-0 top-0 bottom-0 w-full lg:w-[33.333333%] z-10 p-0 m-0"
                >
                  <div className="flex flex-col items-center justify-center w-full h-full" style={{ flex: 1 }}>
                    <img src="/path/to/cflogowhite.png" alt="Compare Funding Logo" className="h-20 mb-12" style={{ maxWidth: '220px' }} />
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
                            {/* Star rating */}
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
        </div>
      </PageLayout>
    </div>
  );
};

export default CustomizeOffers;
