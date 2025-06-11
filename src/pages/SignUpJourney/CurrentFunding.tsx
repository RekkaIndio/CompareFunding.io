import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNavbar } from '@/contexts/NavbarContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import SignUpLayout from '@/components/SignUpLayout';
import { CreditCard, PlusCircle, MinusCircle, AlertCircle, PoundSterling, Calendar, Building } from 'lucide-react';

interface FundingDetails {
  provider: string;
  product: string;
  terms: string;
  expiryDate: string;
  currentBalance: string;
}

const CurrentFunding = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showNavbar, hideNavbar } = useNavbar();
  const [userInfo, setUserInfo] = useState(location.state || {});
  
  // Current funding form data
  const [hasCurrentFunding, setHasCurrentFunding] = useState<string>('');
  const [fundingDetails, setFundingDetails] = useState<FundingDetails[]>([
    {
      provider: '',
      product: '',
      terms: '',
      expiryDate: '',
      currentBalance: '',
    }
  ]);

  // Navigation steps
  const steps = [
    { label: 'Email & Password', path: '/signup-journey/email-password' },
    { label: 'Business Details', path: '/signup-journey/business-details' },
    { label: 'Additional Details', path: '/signup-journey/additional-details' },
    { label: 'Current Funding', path: '/signup-journey/current-funding' },
    { label: 'HMRC Status', path: '/signup-journey/hmrc-status' },
    { label: 'Document Upload', path: '/signup-journey/document-upload' },
    { label: 'Lender Preferences', path: '/signup-journey/lender-preferences' },
    { label: 'Review & Submit', path: '/signup-journey/application-review' },
  ];
  const currentStep = 3;

  useEffect(() => {
    hideNavbar();
    
    // Try to restore form data from session storage
    const currentSession = sessionStorage.getItem('currentSignupSession');
    if (currentSession) {
      const savedFormData = sessionStorage.getItem('currentFundingFormData');
      if (savedFormData) {
        try {
          const parsedData = JSON.parse(savedFormData);
          setHasCurrentFunding(parsedData.hasCurrentFunding || '');
          setFundingDetails(parsedData.fundingDetails || [{ provider: '', product: '', terms: '', expiryDate: '', currentBalance: '' }]);
        } catch (error) {
          console.error('Error parsing saved current funding form data:', error);
        }
      }
    }
    
    return () => {
      showNavbar();
    };
  }, [hideNavbar, showNavbar]);

  // Save form data to session storage whenever it changes
  useEffect(() => {
    const currentSession = sessionStorage.getItem('currentSignupSession');
    const formData = {
      hasCurrentFunding,
      fundingDetails: hasCurrentFunding === 'yes' ? fundingDetails : []
    };
    
    if (currentSession && (hasCurrentFunding !== '' || fundingDetails.some(d => d.provider !== ''))) {
      sessionStorage.setItem('currentFundingFormData', JSON.stringify(formData));
    }
  }, [hasCurrentFunding, fundingDetails]);

  const handlePrevious = () => {
    navigate('/signup-journey/additional-details', { 
      state: { 
        ...userInfo, 
        hasCurrentFunding,
        fundingDetails: hasCurrentFunding === 'yes' ? fundingDetails : []
      } 
    });
  };

  const handleNext = () => {
    if (isFormValid()) {
      navigate('/signup-journey/hmrc', { 
        state: { 
          ...userInfo, 
          hasCurrentFunding,
          fundingDetails: hasCurrentFunding === 'yes' ? fundingDetails : []
        } 
      });
    }
  };

  const handleStepNavigation = (stepIndex: number) => {
    if (stepIndex > currentStep) return; // Prevent jumping ahead
    
    const currentFormData = {
      hasCurrentFunding,
      fundingDetails: hasCurrentFunding === 'yes' ? fundingDetails : []
    };

    switch (stepIndex) {
      case 0:
        navigate('/signup-journey/email-password', { state: userInfo });
        break;
      case 1:
        navigate('/signup-journey/business-details', { state: userInfo });
        break;
      case 2:
        navigate('/signup-journey/additional-details', { state: userInfo });
        break;
      case 3:
        navigate('/signup-journey/current-funding', { state: userInfo });
        break;
      case 4:
        navigate('/signup-journey/hmrc', { state: { ...userInfo, ...currentFormData } });
        break;
      case 5:
        navigate('/signup-journey/document-upload', { state: { ...userInfo, ...currentFormData } });
        break;
      case 6:
        navigate('/signup-journey/lender-preferences', { state: { ...userInfo, ...currentFormData } });
        break;
      case 7:
        navigate('/signup-journey/application-review', { state: { ...userInfo, ...currentFormData } });
        break;
    }
  };

  // Check if form is valid
  const isFormValid = () => {
    if (hasCurrentFunding === '') return false;
    
    if (hasCurrentFunding === 'yes') {
      return fundingDetails.every(detail => 
        detail.provider !== '' && 
        detail.product !== '' && 
        detail.terms !== '' &&
        detail.currentBalance !== ''
      );
    }
    
    return true; // No funding required, form is valid
  };

  // Add new funding detail
  const addFundingDetail = () => {
    setFundingDetails([
      ...fundingDetails,
      {
        provider: '',
        product: '',
        terms: '',
        expiryDate: '',
        currentBalance: '',
      }
    ]);
  };

  // Remove funding detail
  const removeFundingDetail = (index: number) => {
    if (fundingDetails.length > 1) {
      setFundingDetails(fundingDetails.filter((_, i) => i !== index));
    }
  };

  // Update funding detail
  const updateFundingDetail = (index: number, field: keyof FundingDetails, value: string) => {
    const updated = [...fundingDetails];
    updated[index][field] = value;
    setFundingDetails(updated);
  };

  // Handle radio change
  const handleFundingChange = (value: string) => {
    setHasCurrentFunding(value);
    if (value === 'no') {
      setFundingDetails([{
        provider: '',
        product: '',
        terms: '',
        expiryDate: '',
        currentBalance: '',
      }]);
    }
  };

  const sidebarProps = {
    title: "Current Funding Information",
    description: "Help us understand your existing funding arrangements to provide better recommendations and avoid conflicts.",
    highlight: "Complete transparency helps us serve you better",
    tips: [
      "Include all current business funding and borrowing",
      "This helps us understand your funding capacity",
      "We'll ensure new funding complements existing arrangements",
      "Information is kept strictly confidential"
    ]
  };

  return (
    <SignUpLayout
      steps={steps}
      currentStep={currentStep}
      onStepNavigation={handleStepNavigation}
      onNext={handleNext}
      onPrevious={handlePrevious}
      canGoBack={true}
      canGoNext={isFormValid()}
      sidebarProps={sidebarProps}
    >
      <div className="space-y-6">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#2a3441] mb-2 sm:mb-3 animate-fadeIn">
            Current Funding & Borrowing
          </h1>
          <p className="text-gray-600 text-sm sm:text-base md:text-lg animate-fadeIn delay-100">
            Tell us about any existing funding or borrowing arrangements
          </p>
        </div>

        <Card className="border-2 border-gray-200 bg-white">
          <CardContent className="p-6 sm:p-8">
            {/* Main Question */}
            <div className="space-y-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <CreditCard className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-[#2a3441] mb-2">
                  Do you have any current funding / borrowing?
                </h3>
                <p className="text-sm text-gray-600">
                  This includes loans, credit facilities, invoice finance, asset finance, etc.
                </p>
              </div>

              {/* Radio Selection */}
              <div className="flex justify-center">
                <RadioGroup
                  value={hasCurrentFunding}
                  onValueChange={handleFundingChange}
                  className="flex space-x-8"
                >
                  <div className="flex items-center space-x-2 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-colors cursor-pointer">
                    <RadioGroupItem value="no" id="no" />
                    <Label 
                      htmlFor="no" 
                      className="text-lg font-medium cursor-pointer text-[#2a3441] hover:text-blue-600"
                    >
                      No
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-colors cursor-pointer">
                    <RadioGroupItem value="yes" id="yes" />
                    <Label 
                      htmlFor="yes" 
                      className="text-lg font-medium cursor-pointer text-[#2a3441] hover:text-blue-600"
                    >
                      Yes
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Funding Details Section - Only show if "Yes" is selected */}
              {hasCurrentFunding === 'yes' && (
                <div className="space-y-6 animate-fadeIn">                    <div className="border-t pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-[#2a3441] flex items-center gap-2">
                          <AlertCircle className="h-5 w-5 text-orange-500" />
                          Provide Details
                        </h3>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addFundingDetail}
                          className="flex items-center gap-2 border-2 border-gray-200 bg-[#2a3441] text-white hover:text-[#ff8000] hover:border-[#ff8000]"
                        >
                          <PlusCircle className="h-4 w-4" />
                          Add Another
                        </Button>
                      </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                      <h4 className="font-medium text-amber-800 mb-2">Information Needed:</h4>
                      <ul className="text-sm text-amber-700 space-y-1">
                        <li>• Current provider</li>
                        <li>• Current product</li>
                        <li>• Current terms</li>
                        <li>• Expiry date</li>
                        <li>• Current Balance</li>
                      </ul>
                      <p className="text-xs text-amber-600 mt-3 italic">
                        Repeat for as many different funding arrangements as you have
                      </p>
                    </div>

                    {/* Funding Details Forms */}
                    <div className="space-y-6">
                      {fundingDetails.map((detail, index) => (
                        <Card key={index} className="border-2 border-gray-200 bg-white">
                          <CardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base flex items-center gap-2 text-[#2a3441]">
                                <Building className="h-4 w-4 text-blue-600" />
                                Funding Arrangement {index + 1}
                              </CardTitle>
                              {fundingDetails.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFundingDetail(index)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <MinusCircle className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor={`provider-${index}`} className="text-sm sm:text-base font-medium text-[#2a3441]">Current Provider</Label>
                              <Input
                                id={`provider-${index}`}
                                value={detail.provider}
                                onChange={(e) => updateFundingDetail(index, 'provider', e.target.value)}
                                placeholder="e.g., Barclays, Santander, Metro Bank"
                                className="h-10 sm:h-12 bg-white border-2 border-gray-200 focus:border-[#ff8000] focus:ring-1 focus:ring-[#ff8000] text-[#2a3441] placeholder:text-gray-400 rounded-lg sm:rounded-xl"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`product-${index}`} className="text-sm sm:text-base font-medium text-[#2a3441]">Current Product</Label>
                              <Input
                                id={`product-${index}`}
                                value={detail.product}
                                onChange={(e) => updateFundingDetail(index, 'product', e.target.value)}
                                placeholder="e.g., Business Loan, Overdraft, Invoice Finance"
                                className="h-10 sm:h-12 bg-white border-2 border-gray-200 focus:border-[#ff8000] focus:ring-1 focus:ring-[#ff8000] text-[#2a3441] placeholder:text-gray-400 rounded-lg sm:rounded-xl"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`terms-${index}`} className="text-sm sm:text-base font-medium text-[#2a3441]">Current Terms</Label>
                              <Input
                                id={`terms-${index}`}
                                value={detail.terms}
                                onChange={(e) => updateFundingDetail(index, 'terms', e.target.value)}
                                placeholder="e.g., 5% APR, 24 months, £50k limit"
                                className="h-10 sm:h-12 bg-white border-2 border-gray-200 focus:border-[#ff8000] focus:ring-1 focus:ring-[#ff8000] text-[#2a3441] placeholder:text-gray-400 rounded-lg sm:rounded-xl"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`expiry-${index}`} className="text-sm sm:text-base font-medium text-[#2a3441] flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Expiry Date (if applicable)
                              </Label>
                              <Input
                                id={`expiry-${index}`}
                                type="date"
                                value={detail.expiryDate}
                                onChange={(e) => updateFundingDetail(index, 'expiryDate', e.target.value)}
                                className="h-10 sm:h-12 bg-white border-2 border-gray-200 focus:border-[#ff8000] focus:ring-1 focus:ring-[#ff8000] text-[#2a3441] rounded-lg sm:rounded-xl"
                              />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                              <Label htmlFor={`balance-${index}`} className="text-sm sm:text-base font-medium text-[#2a3441] flex items-center gap-2">
                                <PoundSterling className="h-4 w-4" />
                                Current Balance / Outstanding Amount
                              </Label>
                              <Input
                                id={`balance-${index}`}
                                value={detail.currentBalance}
                                onChange={(e) => updateFundingDetail(index, 'currentBalance', e.target.value)}
                                placeholder="e.g., £25,000 remaining, £10k outstanding"
                                className="h-10 sm:h-12 bg-white border-2 border-gray-200 focus:border-[#ff8000] focus:ring-1 focus:ring-[#ff8000] text-[#2a3441] placeholder:text-gray-400 rounded-lg sm:rounded-xl"
                              />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* No Current Funding Message */}
              {hasCurrentFunding === 'no' && (
                <div className="text-center p-6 bg-green-50 border border-green-200 rounded-lg animate-fadeIn">
                  <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-green-600 text-xl">✓</span>
                  </div>
                  <h3 className="text-lg font-medium text-green-800 mb-2">Great!</h3>
                  <p className="text-green-700">
                    Having no current funding gives us more flexibility in finding the perfect solution for your business.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </SignUpLayout>
  );
};

export default CurrentFunding;
