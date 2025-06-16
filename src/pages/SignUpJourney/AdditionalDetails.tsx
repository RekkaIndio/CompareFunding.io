import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNavbar } from '@/contexts/NavbarContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import SignUpLayout from '@/components/SignUpLayout';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { ArrowRight, FileText, Globe, PoundSterling, Clock, Info } from 'lucide-react';

const AdditionalDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showNavbar, hideNavbar } = useNavbar();
  const { user } = useAuth();
  const [userInfo, setUserInfo] = useState(location.state || {});
  
  // Additional details form data
  const [formData, setFormData] = useState({
    fundingPurpose: 'expansion',
    fundingAmount: '100000',
    fundingTimeframe: '1_week',
    additionalInfo: '',
    // Product-specific fields will be added here based on selected product
    exportBusiness: '',
    contractType: '',
    billOnAcceptance: '',
    currencyRequirement: '',
    overseasCompanies: '',
    overseasLocation: '',
    standardTradingTerms: '',
  });

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
  const currentStep = 2;

  useEffect(() => {
    hideNavbar();
    
    // Try to restore form data from session storage
    const currentSession = sessionStorage.getItem('currentSignupSession');
    if (currentSession) {
      const savedFormData = sessionStorage.getItem('additionalDetailsFormData');
      if (savedFormData) {
        try {
          const parsedData = JSON.parse(savedFormData);
          setFormData(parsedData);
        } catch (error) {
          console.error('Error parsing saved additional details form data:', error);
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
    const hasFormData = Object.values(formData).some(value => 
      value !== '' && value !== 'expansion' && value !== '100000' && value !== '1_week'
    );
    
    if (hasFormData && currentSession) {
      sessionStorage.setItem('additionalDetailsFormData', JSON.stringify(formData));
    }
  }, [formData]);

  const handlePrevious = () => {
    navigate('/signup-journey/business-details', { state: { ...userInfo, ...formData } });
  };

  const handleNext = async () => {
    if (!isFormValid()) {
      toast.error('Please complete all required fields before continuing.');
      return;
    }

    try {
      // Save additional details data to user profile
      if (user?.uid) {
        const db = getFirestore();
        const additionalDetailsData = {
          ...formData,
          updatedAt: serverTimestamp()
        };

        // Save to users collection
        await setDoc(doc(db, 'users', user.uid), {
          ...userInfo,
          additionalDetails: additionalDetailsData,
          // Also save individual fields for easier access
          fundingPurpose: formData.fundingPurpose,
          fundingAmount: formData.fundingAmount,
          fundingTimeframe: formData.fundingTimeframe,
          additionalInfo: formData.additionalInfo
        }, { merge: true });

        // Also save to businesses collection for consistency
        await setDoc(doc(db, 'businesses', user.uid), {
          additionalDetails: additionalDetailsData,
          fundingPurpose: formData.fundingPurpose,
          fundingAmount: formData.fundingAmount,
          fundingTimeframe: formData.fundingTimeframe,
          additionalInfo: formData.additionalInfo
        }, { merge: true });
      }

      // Navigate to next step with updated data
      navigate('/signup-journey/current-funding', { state: { ...userInfo, ...formData } });
    } catch (error) {
      console.error('Error saving additional details data:', error);
      toast.error('There was an error saving your information. Please try again.');
    }
  };

  const handleStepNavigation = (stepIndex: number) => {
    if (stepIndex > currentStep) return; // Prevent jumping ahead
    
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
        navigate('/signup-journey/hmrc-status', { state: userInfo });
        break;
      case 5:
        navigate('/signup-journey/document-upload', { state: userInfo });
        break;
      case 6:
        navigate('/signup-journey/lender-preferences', { state: userInfo });
        break;
      case 7:
        navigate('/signup-journey/application-review', { state: userInfo });
        break;
    }
  };

  // Check if form is valid
  const isFormValid = () => {
    return (
      formData.fundingPurpose !== '' &&
      formData.fundingAmount !== '' &&
      formData.fundingTimeframe !== ''
    );
  };

  // Get dynamic content based on selected product and industry
  const getDynamicContent = () => {
    const selectedProduct = userInfo.selectedProduct || '';
    const industry = userInfo.industry || '';

    // Example content for Invoice Finance in Recruitment industry
    if (selectedProduct === 'invoice-finance' && industry === 'recruitment') {
      return {
        title: 'Invoice Finance - Recruitment Details',
        description: 'Additional information needed for your recruitment business invoice finance application.',
        fields: [
          {
            id: 'exportBusiness',
            label: 'Any Export business or just UK?',
            type: 'select',
            options: [
              { label: 'UK Only', value: 'uk_only' },
              { label: 'Export Business', value: 'export' },
              { label: 'Both', value: 'both' }
            ]
          },
          {
            id: 'contractType',
            label: 'Split between Contract/Perm/Retained?',
            type: 'select',
            options: [
              { label: 'Contract Only', value: 'contract' },
              { label: 'Permanent Only', value: 'permanent' },
              { label: 'Retained Only', value: 'retained' },
              { label: 'Mixed', value: 'mixed' }
            ]
          },
          {
            id: 'billOnAcceptance',
            label: 'Any Bill on acceptance?',
            type: 'select',
            options: [
              { label: 'Yes', value: 'yes' },
              { label: 'No', value: 'no' }
            ]
          },
          {
            id: 'currencyRequirement',
            label: 'Any Currency Requirement? If so which',
            type: 'select',
            options: [
              { label: 'GBP Only', value: 'gbp' },
              { label: 'USD', value: 'usd' },
              { label: 'EUR', value: 'eur' },
              { label: 'Multiple Currencies', value: 'multiple' }
            ]
          },
          {
            id: 'overseasCompanies',
            label: 'Any overseas companies requiring funding? If so where?',
            type: 'textarea'
          },
          {
            id: 'standardTradingTerms',
            label: 'Standard Trading Terms?',
            type: 'select',
            options: [
              { label: '30 Days', value: '30_days' },
              { label: '60 Days', value: '60_days' },
              { label: '90 Days', value: '90_days' },
              { label: 'Other', value: 'other' }
            ]
          }
        ]
      };
    }

    // Default content for other products/industries
    return {
      title: 'Additional Business Details',
      description: 'Help us understand your specific funding requirements and business needs.',
      fields: []
    };
  };

  const dynamicContent = getDynamicContent();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid()) {
      alert('Please fill in all required fields');
      return;
    }

    // Save user profile with additional details
    if (user) {
      const db = getFirestore();
      try {
        await setDoc(doc(db, 'users', user.uid), {
          additionalDetails: {
            ...formData,
            updatedAt: serverTimestamp()
          },
          // Ensure other user data is not overwritten
          ...(userInfo.email && { email: userInfo.email }),
          ...(userInfo.businessName && { businessName: userInfo.businessName }),
          ...(userInfo.selectedProduct && { selectedProduct: userInfo.selectedProduct }),
          ...(userInfo.industry && { industry: userInfo.industry }),
        }, { merge: true });

        toast.success('Additional details saved successfully!');
      } catch (error) {
        console.error('Error saving additional details:', error);
        toast.error('Failed to save additional details. Please try again.');
      }
    }

    // Continue to review page
    handleNext();
  };

  const sidebarProps = {
    title: "Additional Information",
    description: "These details help us provide more accurate funding recommendations tailored to your business needs.",
    highlight: "Customised for your industry & product",
    tips: [
      "Questions are tailored to your selected product and industry",
      "Providing detailed information improves funding match accuracy",
      "You can update these details later in your profile"
    ]
  };

  return (
    <SignUpLayout
      steps={steps}
      currentStep={currentStep}
      onStepNavigation={handleStepNavigation}
      onPrevious={handlePrevious}
      onNext={handleNext}
      canGoNext={isFormValid()}
      sidebarProps={sidebarProps}
    >
      <div className="space-y-8">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#2a3441] mb-2 sm:mb-3 animate-fadeIn">
            {dynamicContent.title}
          </h1>
          <p className="text-gray-600 text-sm sm:text-base md:text-lg animate-fadeIn delay-100">
            {dynamicContent.description}
          </p>
          
          {userInfo.selectedProduct && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                Product: <span className="font-semibold capitalize">{userInfo.selectedProduct.replace(/-/g, ' ')}</span>
                {userInfo.industry && (
                  <span className="ml-2">| Industry: <span className="font-semibold capitalize">{userInfo.industry}</span></span>
                )}
              </p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
          {/* Funding Requirements Section */}
          <Card className="border-2 border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-[#2a3441]">
                <PoundSterling className="h-5 w-5 text-[#ff8000]" />
                Funding Requirements
              </CardTitle>
              <CardDescription className="text-gray-600">
                Tell us about your funding needs and timeline
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fundingPurpose" className="text-sm sm:text-base font-medium text-[#2a3441]">
                    Funding Purpose <span className="text-red-500">*</span>
                  </Label>
                  <Select 
                    value={formData.fundingPurpose} 
                    onValueChange={(value) => setFormData({ ...formData, fundingPurpose: value })}
                  >
                    <SelectTrigger className="h-10 sm:h-12 bg-white border-2 border-gray-200 focus:border-[#ff8000] focus:ring-1 focus:ring-[#ff8000] text-[#2a3441] rounded-lg sm:rounded-xl">
                      <SelectValue placeholder="Select funding purpose" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expansion">Business Expansion</SelectItem>
                      <SelectItem value="cashflow">Cash Flow Management</SelectItem>
                      <SelectItem value="equipment">Equipment Purchase</SelectItem>
                      <SelectItem value="inventory">Inventory Financing</SelectItem>
                      <SelectItem value="property">Property Investment</SelectItem>
                      <SelectItem value="working_capital">Working Capital</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fundingAmount" className="text-sm sm:text-base font-medium text-[#2a3441]">
                    Funding Amount <span className="text-red-500">*</span>
                  </Label>
                  <Select 
                    value={formData.fundingAmount} 
                    onValueChange={(value) => setFormData({ ...formData, fundingAmount: value })}
                  >
                    <SelectTrigger className="h-10 sm:h-12 bg-white border-2 border-gray-200 focus:border-[#ff8000] focus:ring-1 focus:ring-[#ff8000] text-[#2a3441] rounded-lg sm:rounded-xl">
                      <SelectValue placeholder="Select amount range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25000">£5k - £25k</SelectItem>
                      <SelectItem value="50000">£25k - £50k</SelectItem>
                      <SelectItem value="100000">£50k - £100k</SelectItem>
                      <SelectItem value="250000">£100k - £250k</SelectItem>
                      <SelectItem value="500000">£250k - £500k</SelectItem>
                      <SelectItem value="1000000">£500k - £1M</SelectItem>
                      <SelectItem value="5000000">£1M+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fundingTimeframe" className="text-sm sm:text-base font-medium text-[#2a3441] flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  When do you need the funding? <span className="text-red-500">*</span>
                </Label>
                <Select 
                  value={formData.fundingTimeframe} 
                  onValueChange={(value) => setFormData({ ...formData, fundingTimeframe: value })}
                >
                  <SelectTrigger className="h-10 sm:h-12 bg-white border-2 border-gray-200 focus:border-[#ff8000] focus:ring-1 focus:ring-[#ff8000] text-[#2a3441] rounded-lg sm:rounded-xl">
                    <SelectValue placeholder="Select timeframe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediately">Immediately</SelectItem>
                    <SelectItem value="1_week">Within 1 week</SelectItem>
                    <SelectItem value="1_month">Within 1 month</SelectItem>
                    <SelectItem value="3_months">Within 3 months</SelectItem>
                    <SelectItem value="6_months">Within 6 months</SelectItem>
                    <SelectItem value="no_rush">No immediate rush</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Dynamic Product-Specific Fields */}
          {dynamicContent.fields.length > 0 && (
            <Card className="border-2 border-blue-200 bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-[#2a3441]">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Product-Specific Information
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Additional details specific to your selected funding product
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {dynamicContent.fields.map((field) => (
                  <div key={field.id} className="space-y-2">
                    <Label htmlFor={field.id} className="text-sm sm:text-base font-medium text-[#2a3441]">
                      {field.label}
                    </Label>
                    
                    {field.type === 'select' && field.options && (
                      <Select 
                        value={formData[field.id as keyof typeof formData] as string} 
                        onValueChange={(value) => setFormData({ ...formData, [field.id]: value })}
                      >
                        <SelectTrigger className="h-10 sm:h-12 bg-white border-2 border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-[#2a3441] rounded-lg sm:rounded-xl">
                          <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {field.type === 'textarea' && (
                      <Textarea
                        id={field.id}
                        value={formData[field.id as keyof typeof formData] as string}
                        onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                        className="min-h-[80px] bg-white border-2 border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-[#2a3441] placeholder:text-gray-400 rounded-lg sm:rounded-xl"
                      />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Additional Information */}
          <Card className="border-2 border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-[#2a3441]">
                <Info className="h-5 w-5 text-gray-600" />
                Additional Information
              </CardTitle>
              <CardDescription className="text-gray-600">
                Any other details that might help us find the best funding options for you
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="additionalInfo" className="text-sm sm:text-base font-medium text-[#2a3441]">
                  Additional Comments (Optional)
                </Label>
                <Textarea
                  id="additionalInfo"
                  value={formData.additionalInfo}
                  onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
                  placeholder="Tell us anything else that might be relevant to your funding requirements..."
                  className="min-h-[100px] bg-white border-2 border-gray-200 focus:border-[#ff8000] focus:ring-1 focus:ring-[#ff8000] text-[#2a3441] placeholder:text-gray-400 rounded-lg sm:rounded-xl"
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-center sm:justify-end pt-4 sm:pt-6">
            <Button
              type="submit"
              disabled={!isFormValid()}
              className="w-full sm:w-auto bg-gradient-to-r from-[#ff8000] to-[#ff6000] hover:from-[#e67300] hover:to-[#e55a00] text-white px-6 py-3 text-base rounded-xl font-medium shadow-md transition-all hover:shadow-lg hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none h-10 sm:h-12"
            >
              Continue to current funding
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </SignUpLayout>
  );
};

export default AdditionalDetails;
