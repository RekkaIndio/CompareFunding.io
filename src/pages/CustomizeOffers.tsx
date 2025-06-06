import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PageLayout from '@/components/PageLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Check, Info } from 'lucide-react';

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
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // In a real app, you would filter the matches based on preferences
    // For demo purposes, we'll navigate to the matches page with the same matches
    navigate('/funding-matches', {
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
        <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 md:py-12">
          <div className="max-w-4xl mx-auto">
            <div className="mb-5 sm:mb-8">
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-[#2a3441] mb-1 sm:mb-2">Customize Your Funding Options</h1>
              <p className="text-sm sm:text-base md:text-lg text-[#2a3441]">Tailor your funding search to match your specific business needs</p>
            </div>
            
            <form onSubmit={handleSubmit}>
              {/* Business Details Section */}
              <Card className="p-4 sm:p-6 mb-5 sm:mb-8 border border-[#ff8000] bg-white rounded-lg sm:rounded-xl">
                <h2 className="text-base sm:text-lg md:text-xl font-semibold text-[#2a3441] mb-3 sm:mb-4">Business Details</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <Label htmlFor="businessName" className="text-sm sm:text-base text-[#2a3441]">Business Name</Label>
                    <Input 
                      id="businessName"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="mt-1 bg-white border-2 border-[#ff8000] focus:border-[#ff8000] focus:ring-1 focus:ring-[#ff8000] text-[#2a3441] h-10 sm:h-12 text-sm sm:text-base rounded-lg sm:rounded-xl"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="industry" className="text-sm sm:text-base text-[#2a3441]">Industry</Label>
                    <Select
                      value={industry}
                      onValueChange={setIndustry}
                    >
                      <SelectTrigger id="industry" className="mt-1 bg-white border-2 border-[#ff8000] focus:border-[#ff8000] focus:ring-1 focus:ring-[#ff8000] text-[#2a3441] h-10 sm:h-12 text-sm sm:text-base rounded-lg sm:rounded-xl">
                        <SelectValue placeholder="Select an industry" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-[#ff8000] text-[#2a3441]">
                        <SelectItem value="retail" className="text-sm sm:text-base">Retail</SelectItem>
                        <SelectItem value="technology" className="text-sm sm:text-base">Technology</SelectItem>
                        <SelectItem value="manufacturing" className="text-sm sm:text-base">Manufacturing</SelectItem>
                        <SelectItem value="healthcare" className="text-sm sm:text-base">Healthcare</SelectItem>
                        <SelectItem value="finance" className="text-sm sm:text-base">Financial Services</SelectItem>
                        <SelectItem value="hospitality" className="text-sm sm:text-base">Hospitality</SelectItem>
                        <SelectItem value="construction" className="text-sm sm:text-base">Construction</SelectItem>
                        <SelectItem value="professional" className="text-sm sm:text-base">Professional Services</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="revenue" className="text-sm sm:text-base text-[#2a3441]">Annual Revenue</Label>
                    <Input 
                      id="revenue"
                      value={formatCurrency(revenue)}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        setRevenue(value);
                      }}
                      className="mt-1 bg-white border-2 border-[#ff8000] focus:border-[#ff8000] focus:ring-1 focus:ring-[#ff8000] text-[#2a3441] h-10 sm:h-12 text-sm sm:text-base rounded-lg sm:rounded-xl"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="yearsTrading" className="text-sm sm:text-base text-[#2a3441]">Years Trading</Label>
                    <Input 
                      id="yearsTrading"
                      type="number"
                      value={yearsTrading}
                      onChange={(e) => setYearsTrading(e.target.value)}
                      className="mt-1 bg-white border-2 border-[#ff8000] focus:border-[#ff8000] focus:ring-1 focus:ring-[#ff8000] text-[#2a3441] h-10 sm:h-12 text-sm sm:text-base rounded-lg sm:rounded-xl"
                    />
                  </div>
                </div>
              </Card>
              
              {/* Loan Preferences Section */}
              <Card className="p-4 sm:p-6 mb-5 sm:mb-8 border border-[#ff8000] bg-white rounded-lg sm:rounded-xl">
                <div className="flex flex-wrap items-center justify-between mb-3 sm:mb-4">
                  <h2 className="text-base sm:text-lg md:text-xl font-semibold text-[#2a3441] mb-1 sm:mb-0">Loan Preferences</h2>
                  <div className="flex items-center mt-1 sm:mt-0">
                    <Label htmlFor="includeLoans" className="mr-2 text-sm sm:text-base text-[#2a3441]">Include Loans</Label>
                    <Switch 
                      id="includeLoans" 
                      checked={includeLoans} 
                      onCheckedChange={setIncludeLoans} 
                      className="data-[state=checked]:bg-[#ff8000]"
                    />
                  </div>
                </div>
                
                {includeLoans && (
                  <div className="space-y-4 sm:space-y-6">
                    <div>
                      <div className="flex flex-wrap items-center justify-between mb-1 sm:mb-2">
                        <Label className="text-sm sm:text-base text-[#2a3441]">Loan Amount</Label>
                        <span className="text-sm sm:text-base text-[#2a3441]">{formatCurrency(loanAmount[0])}</span>
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
                      <div className="flex flex-wrap items-center justify-between mb-1 sm:mb-2">
                        <Label className="text-sm sm:text-base text-[#2a3441]">Loan Term</Label>
                        <span className="text-sm sm:text-base text-[#2a3441]">{formatTerm(loanTerm[0])}</span>
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
              <Card className="p-4 sm:p-6 mb-5 sm:mb-8 border border-[#ff8000] bg-white rounded-lg sm:rounded-xl">
                <div className="flex flex-wrap items-center justify-between mb-3 sm:mb-4">
                  <h2 className="text-base sm:text-lg md:text-xl font-semibold text-[#2a3441] mb-1 sm:mb-0">Equity Preferences</h2>
                  <div className="flex items-center mt-1 sm:mt-0">
                    <Label htmlFor="includeEquity" className="mr-2 text-sm sm:text-base text-[#2a3441]">Include Equity</Label>
                    <Switch 
                      id="includeEquity" 
                      checked={includeEquity} 
                      onCheckedChange={setIncludeEquity} 
                      className="data-[state=checked]:bg-[#ff8000]"
                    />
                  </div>
                </div>
                
                {includeEquity && (
                  <div className="space-y-4 sm:space-y-6">
                    <div>
                      <div className="flex flex-wrap items-center justify-between mb-1 sm:mb-2">
                        <Label className="text-sm sm:text-base text-[#2a3441]">Investment Amount</Label>
                        <span className="text-sm sm:text-base text-[#2a3441]">{formatCurrency(equityAmount[0])}</span>
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
                      <div className="flex flex-wrap items-center justify-between mb-1 sm:mb-2">
                        <Label className="text-sm sm:text-base text-[#2a3441]">Equity Stake</Label>
                        <span className="text-sm sm:text-base text-[#2a3441]">{equityStake[0]}%</span>
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
              <Card className="p-4 sm:p-6 mb-5 sm:mb-8 border border-[#ff8000] bg-white rounded-lg sm:rounded-xl">
                <div className="flex flex-wrap items-center justify-between mb-3 sm:mb-4">
                  <h2 className="text-base sm:text-lg md:text-xl font-semibold text-[#2a3441] mb-1 sm:mb-0">Grant Preferences</h2>
                  <div className="flex items-center mt-1 sm:mt-0">
                    <Label htmlFor="includeGrants" className="mr-2 text-sm sm:text-base text-[#2a3441]">Include Grants</Label>
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
                    <Label htmlFor="grantPurpose" className="text-sm sm:text-base text-[#2a3441]">Grant Purpose</Label>
                    <Select
                      value={grantPurpose}
                      onValueChange={setGrantPurpose}
                    >
                      <SelectTrigger id="grantPurpose" className="mt-1 bg-white border-2 border-[#ff8000] focus:border-[#ff8000] focus:ring-1 focus:ring-[#ff8000] text-[#2a3441] h-10 sm:h-12 text-sm sm:text-base rounded-lg sm:rounded-xl">
                        <SelectValue placeholder="Select a purpose" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-[#ff8000] text-[#2a3441]">
                        <SelectItem value="any" className="text-sm sm:text-base">Any Purpose</SelectItem>
                        <SelectItem value="innovation" className="text-sm sm:text-base">Research & Innovation</SelectItem>
                        <SelectItem value="expansion" className="text-sm sm:text-base">Business Expansion</SelectItem>
                        <SelectItem value="sustainability" className="text-sm sm:text-base">Sustainability</SelectItem>
                        <SelectItem value="digital" className="text-sm sm:text-base">Digital Transformation</SelectItem>
                        <SelectItem value="export" className="text-sm sm:text-base">Export & International Trade</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </Card>
              
              <div className="flex justify-center mt-6 sm:mt-8">
                <Button 
                  type="submit" 
                  className="w-full sm:w-auto bg-[#ff8000] hover:bg-[#e67300] text-white px-8 sm:px-14 py-3 sm:py-5 text-sm sm:text-base md:text-lg h-auto rounded-lg sm:rounded-full font-medium shadow-md transition-all hover:shadow-lg hover:scale-[1.02]"
                >
                  Find My Matches
                </Button>
              </div>
            </form>
          </div>
        </div>
      </PageLayout>
    </div>
  );
};

export default CustomizeOffers;
