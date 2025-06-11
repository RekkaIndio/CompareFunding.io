import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNavbar } from '@/contexts/NavbarContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SignUpLayout from '@/components/SignUpLayout';
import { 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Calculator, 
  Building, 
  Receipt,
  PoundSterling,
  Calendar,
  Clock
} from 'lucide-react';

interface TaxDetails {
  amount: string;
  timeToPay: string;
  details: string;
}

const HMRCStatus = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showNavbar, hideNavbar } = useNavbar();
  const [userInfo, setUserInfo] = useState(location.state || {});
  
  // HMRC form data
  const [isUpToDate, setIsUpToDate] = useState<string>('');
  const [vatDetails, setVatDetails] = useState<TaxDetails>({
    amount: '',
    timeToPay: '',
    details: ''
  });
  const [corpTaxDetails, setCorpTaxDetails] = useState<TaxDetails>({
    amount: '',
    timeToPay: '',
    details: ''
  });
  const [payeDetails, setPayeDetails] = useState<TaxDetails>({
    amount: '',
    timeToPay: '',
    details: ''
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
  const currentStep = 4;

  useEffect(() => {
    hideNavbar();
    
    // Try to restore form data from session storage
    const currentSession = sessionStorage.getItem('currentSignupSession');
    if (currentSession) {
      const savedFormData = sessionStorage.getItem('hmrcStatusFormData');
      if (savedFormData) {
        try {
          const parsedData = JSON.parse(savedFormData);
          setIsUpToDate(parsedData.isUpToDate || '');
          setVatDetails(parsedData.vatDetails || { amount: '', timeToPay: '', details: '' });
          setCorpTaxDetails(parsedData.corpTaxDetails || { amount: '', timeToPay: '', details: '' });
          setPayeDetails(parsedData.payeDetails || { amount: '', timeToPay: '', details: '' });
        } catch (error) {
          console.error('Error parsing saved HMRC status form data:', error);
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
      isUpToDate,
      vatDetails: isUpToDate === 'no' ? vatDetails : { amount: '', timeToPay: '', details: '' },
      corpTaxDetails: isUpToDate === 'no' ? corpTaxDetails : { amount: '', timeToPay: '', details: '' },
      payeDetails: isUpToDate === 'no' ? payeDetails : { amount: '', timeToPay: '', details: '' }
    };
    
    if (currentSession && (isUpToDate !== '' || 
        vatDetails.amount !== '' || vatDetails.timeToPay !== '' || vatDetails.details !== '' ||
        corpTaxDetails.amount !== '' || corpTaxDetails.timeToPay !== '' || corpTaxDetails.details !== '' ||
        payeDetails.amount !== '' || payeDetails.timeToPay !== '' || payeDetails.details !== '')) {
      sessionStorage.setItem('hmrcStatusFormData', JSON.stringify(formData));
    }
  }, [isUpToDate, vatDetails, corpTaxDetails, payeDetails]);

  const handlePrevious = () => {
    navigate('/signup-journey/current-funding', { 
      state: { 
        ...userInfo, 
        isUpToDate,
        vatDetails,
        corpTaxDetails,
        payeDetails
      } 
    });
  };

  const handleNext = () => {
    if (isFormValid()) {
      navigate('/signup-journey/document-upload', { 
        state: { 
          ...userInfo, 
          isUpToDate,
          vatDetails: isUpToDate === 'no' ? vatDetails : { amount: '', timeToPay: '', details: '' },
          corpTaxDetails: isUpToDate === 'no' ? corpTaxDetails : { amount: '', timeToPay: '', details: '' },
          payeDetails: isUpToDate === 'no' ? payeDetails : { amount: '', timeToPay: '', details: '' }
        } 
      });
    }
  };

  const handleStepNavigation = (stepIndex: number) => {
    if (stepIndex > currentStep) return; // Prevent jumping ahead
    
    const currentFormData = {
      isUpToDate,
      vatDetails: isUpToDate === 'no' ? vatDetails : { amount: '', timeToPay: '', details: '' },
      corpTaxDetails: isUpToDate === 'no' ? corpTaxDetails : { amount: '', timeToPay: '', details: '' },
      payeDetails: isUpToDate === 'no' ? payeDetails : { amount: '', timeToPay: '', details: '' }
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
        navigate('/signup-journey/hmrc-status', { state: userInfo });
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
    if (isUpToDate === '') return false;
    
    if (isUpToDate === 'no') {
      // At least one tax type should have some details if they're not up to date
      const hasVatDetails = vatDetails.amount !== '' || vatDetails.timeToPay !== '' || vatDetails.details !== '';
      const hasCorpTaxDetails = corpTaxDetails.amount !== '' || corpTaxDetails.timeToPay !== '' || corpTaxDetails.details !== '';
      const hasPayeDetails = payeDetails.amount !== '' || payeDetails.timeToPay !== '' || payeDetails.details !== '';
      
      return hasVatDetails || hasCorpTaxDetails || hasPayeDetails;
    }
    
    return true; // Up to date, form is valid
  };

  // Handle radio change
  const handleStatusChange = (value: string) => {
    setIsUpToDate(value);
    if (value === 'yes') {
      // Clear all details if switching to "yes"
      setVatDetails({ amount: '', timeToPay: '', details: '' });
      setCorpTaxDetails({ amount: '', timeToPay: '', details: '' });
      setPayeDetails({ amount: '', timeToPay: '', details: '' });
    }
  };

  // Update tax details
  const updateTaxDetails = (
    type: 'vat' | 'corpTax' | 'paye',
    field: keyof TaxDetails,
    value: string
  ) => {
    switch (type) {
      case 'vat':
        setVatDetails(prev => ({ ...prev, [field]: value }));
        break;
      case 'corpTax':
        setCorpTaxDetails(prev => ({ ...prev, [field]: value }));
        break;
      case 'paye':
        setPayeDetails(prev => ({ ...prev, [field]: value }));
        break;
    }
  };

  const timeToPayOptions = [
    { label: 'Immediately', value: 'immediately' },
    { label: 'Within 30 days', value: '30_days' },
    { label: 'Within 3 months', value: '3_months' },
    { label: 'Within 6 months', value: '6_months' },
    { label: 'More than 6 months', value: '6_months_plus' },
    { label: 'Payment plan in place', value: 'payment_plan' },
  ];

  const sidebarProps = {
    title: "HMRC Tax Status",
    description: "We need to understand your current tax position with HMRC to ensure compliance and assess your funding eligibility accurately.",
    highlight: "Required for all UK business funding",
    tips: [
      "Being up to date with HMRC is crucial for funding approval",
      "If you have outstanding liabilities, provide accurate details",
      "Payment plans with HMRC are acceptable if formally agreed",
      "This information helps us find suitable funding options"
    ]
  };

  const TaxDetailsCard = ({ 
    type, 
    title, 
    icon: Icon, 
    details, 
    onUpdate 
  }: {
    type: 'vat' | 'corpTax' | 'paye';
    title: string;
    icon: any;
    details: TaxDetails;
    onUpdate: (field: keyof TaxDetails, value: string) => void;
  }) => (
    <Card className="border border-gray-200">
      <CardHeader className="pb-4">
        <CardTitle className="text-base flex items-center gap-2">
          <Icon className="h-5 w-5 text-red-600" />
          {title}
        </CardTitle>
        <CardDescription>
          Provide details about any outstanding {title.toLowerCase()} liabilities
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={`${type}-amount`} className="flex items-center gap-2">
              <PoundSterling className="h-4 w-4" />
              Amount Outstanding
            </Label>
            <Input
              id={`${type}-amount`}
              value={details.amount}
              onChange={(e) => onUpdate('amount', e.target.value)}
              placeholder="e.g., £5,000"
              className="bg-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${type}-timeframe`} className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Time to Pay
            </Label>
            <Select value={details.timeToPay} onValueChange={(value) => onUpdate('timeToPay', value)}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Select timeframe" />
              </SelectTrigger>
              <SelectContent>
                {timeToPayOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${type}-details`}>Additional Details</Label>
          <Textarea
            id={`${type}-details`}
            value={details.details}
            onChange={(e) => onUpdate('details', e.target.value)}
            placeholder="Any additional information about payment arrangements, disputes, or circumstances"
            className="bg-white min-h-[80px]"
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );

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
            HMRC Tax Status
          </h1>
          <p className="text-gray-600 text-sm sm:text-base md:text-lg animate-fadeIn delay-100">
            Tell us about your current position with HMRC
          </p>
        </div>

        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6 sm:p-8">
            <div className="space-y-6">
              {/* Main Question */}
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <FileText className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Are you up to date with HMRC?
                </h3>
                <p className="text-sm text-gray-600">
                  This includes VAT, Corporation Tax, PAYE, and any other tax obligations
                </p>
              </div>

              {/* Radio Selection */}
              <div className="flex justify-center">
                <RadioGroup
                  value={isUpToDate}
                  onValueChange={handleStatusChange}
                  className="flex space-x-8"
                >
                  <div className="flex items-center space-x-2 p-4 border-2 border-gray-200 rounded-lg hover:border-green-300 transition-colors cursor-pointer">
                    <RadioGroupItem value="yes" id="yes" />
                    <Label 
                      htmlFor="yes" 
                      className="text-lg font-medium cursor-pointer text-gray-700 hover:text-green-600 flex items-center gap-2"
                    >
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      Yes
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-4 border-2 border-gray-200 rounded-lg hover:border-red-300 transition-colors cursor-pointer">
                    <RadioGroupItem value="no" id="no" />
                    <Label 
                      htmlFor="no" 
                      className="text-lg font-medium cursor-pointer text-gray-700 hover:text-red-600 flex items-center gap-2"
                    >
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      No
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Up to Date Message */}
              {isUpToDate === 'yes' && (
                <div className="text-center p-6 bg-green-50 border border-green-200 rounded-lg animate-fadeIn">
                  <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-medium text-green-800 mb-2">Excellent!</h3>
                  <p className="text-green-700">
                    Being up to date with HMRC strengthens your funding application and shows good financial management.
                  </p>
                </div>
              )}

              {/* Outstanding Liabilities Section */}
              {isUpToDate === 'no' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="border-t pt-6">
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        Provide Details
                      </h3>
                      
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <h4 className="font-medium text-amber-800 mb-2">Required Information:</h4>
                        <p className="text-sm text-amber-700 mb-3">
                          Please provide details for any outstanding tax liabilities. Fill in sections that apply to your situation.
                        </p>
                        <ul className="text-sm text-amber-700 space-y-1">
                          <li>• Outstanding amount</li>
                          <li>• Expected payment timeframe</li>
                          <li>• Any payment arrangements or disputes</li>
                        </ul>
                      </div>
                    </div>

                    {/* Tax Details Forms */}
                    <div className="space-y-6">
                      <TaxDetailsCard
                        type="vat"
                        title="VAT"
                        icon={PoundSterling}
                        details={vatDetails}
                        onUpdate={(field, value) => updateTaxDetails('vat', field, value)}
                      />

                      <TaxDetailsCard
                        type="corpTax"
                        title="Corporation Tax"
                        icon={Building}
                        details={corpTaxDetails}
                        onUpdate={(field, value) => updateTaxDetails('corpTax', field, value)}
                      />

                      <TaxDetailsCard
                        type="paye"
                        title="PAYE"
                        icon={Calculator}
                        details={payeDetails}
                        onUpdate={(field, value) => updateTaxDetails('paye', field, value)}
                      />
                    </div>

                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-700">
                        <strong>Note:</strong> Having outstanding HMRC liabilities doesn't automatically disqualify you from funding. 
                        Many lenders can work with businesses that have payment plans in place or are actively resolving tax issues.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </SignUpLayout>
  );
};

export default HMRCStatus;
