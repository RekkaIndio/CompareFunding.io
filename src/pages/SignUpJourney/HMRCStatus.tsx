import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNavbar } from '@/contexts/NavbarContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SignUpLayout from '@/components/SignUpLayout';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Calculator, 
  Building, 
  Receipt,
  PoundSterling,
  Calendar,
  Clock,
  Shield
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
  const { user } = useAuth();
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

  const handleNext = async () => {
    if (!isFormValid()) {
      toast.error('Please complete all required fields before continuing.');
      return;
    }

    try {
      // Save HMRC status data to user profile
      if (user?.uid) {
        const db = getFirestore();
        const hmrcData = {
          isUpToDate,
          vatDetails: isUpToDate === 'no' ? vatDetails : { amount: '', timeToPay: '', details: '' },
          corpTaxDetails: isUpToDate === 'no' ? corpTaxDetails : { amount: '', timeToPay: '', details: '' },
          payeDetails: isUpToDate === 'no' ? payeDetails : { amount: '', timeToPay: '', details: '' },
          updatedAt: serverTimestamp()
        };

        // Save to users collection
        await setDoc(doc(db, 'users', user.uid), {
          ...userInfo,
          hmrcStatus: hmrcData
        }, { merge: true });

        // Also save to businesses collection for consistency
        await setDoc(doc(db, 'businesses', user.uid), {
          hmrcStatus: hmrcData
        }, { merge: true });
      }

      // Navigate to next step with updated data
      navigate('/signup-journey/document-upload', { 
        state: { 
          ...userInfo, 
          isUpToDate,
          vatDetails: isUpToDate === 'no' ? vatDetails : { amount: '', timeToPay: '', details: '' },
          corpTaxDetails: isUpToDate === 'no' ? corpTaxDetails : { amount: '', timeToPay: '', details: '' },
          payeDetails: isUpToDate === 'no' ? payeDetails : { amount: '', timeToPay: '', details: '' }
        } 
      });
    } catch (error) {
      console.error('Error saving HMRC status data:', error);
      toast.error('There was an error saving your information. Please try again.');
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
    <div className="p-6 sm:p-8 bg-white border-2 border-gray-200 rounded-xl sm:rounded-2xl hover:border-gray-300 transition-all duration-300 shadow-sm hover:shadow-md">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-[#ff8000] to-[#ff6000] rounded-full flex items-center justify-center">
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <h4 className="text-lg font-bold text-[#2a3441]">{title}</h4>
          <p className="text-sm text-gray-600">
            Provide details about any outstanding {title.toLowerCase()} liabilities
          </p>
        </div>
      </div>
      
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-2">
            <Label htmlFor={`${type}-amount`} className="text-sm sm:text-base font-medium text-[#2a3441] flex items-center gap-2">
              <PoundSterling className="h-4 w-4 text-gray-500" />
              Amount Outstanding
            </Label>
            <Input
              id={`${type}-amount`}
              value={details.amount}
              onChange={(e) => onUpdate('amount', e.target.value)}
              placeholder="e.g., £5,000"
              className="h-10 sm:h-12 bg-white border-2 border-gray-200 focus:border-[#ff8000] focus:ring-2 focus:ring-[#ff8000]/20 text-[#2a3441] rounded-lg sm:rounded-xl transition-all"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${type}-timeframe`} className="text-sm sm:text-base font-medium text-[#2a3441] flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              Time to Pay
            </Label>
            <Select value={details.timeToPay} onValueChange={(value) => onUpdate('timeToPay', value)}>
              <SelectTrigger className="h-10 sm:h-12 bg-white border-2 border-gray-200 focus:border-[#ff8000] focus:ring-2 focus:ring-[#ff8000]/20 text-[#2a3441] rounded-lg sm:rounded-xl">
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
          <Label htmlFor={`${type}-details`} className="text-sm sm:text-base font-medium text-[#2a3441]">
            Additional Details
          </Label>
          <Textarea
            id={`${type}-details`}
            value={details.details}
            onChange={(e) => onUpdate('details', e.target.value)}
            placeholder="Provide any additional context, payment arrangements, or disputes..."
            className="min-h-[100px] bg-white border-2 border-gray-200 focus:border-[#ff8000] focus:ring-2 focus:ring-[#ff8000]/20 text-[#2a3441] rounded-lg sm:rounded-xl resize-none transition-all"
          />
        </div>
      </div>
    </div>
  );

  // Save user profile data
  const saveUserProfile = async () => {
    if (!user) return;

    const db = getFirestore();
    const userRef = doc(db, 'users', user.uid);

    try {
      await setDoc(userRef, {
        hmrcStatus: {
          isUpToDate,
          vatDetails: isUpToDate === 'no' ? vatDetails : { amount: '', timeToPay: '', details: '' },
          corpTaxDetails: isUpToDate === 'no' ? corpTaxDetails : { amount: '', timeToPay: '', details: '' },
          payeDetails: isUpToDate === 'no' ? payeDetails : { amount: '', timeToPay: '', details: '' }
        },
        updatedAt: serverTimestamp()
      }, { merge: true });

      toast.success('Your HMRC status has been saved successfully.');
    } catch (error) {
      console.error('Error saving user profile:', error);
      toast.error('Failed to save HMRC status. Please try again.');
    }
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
      <div className="space-y-8">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#2a3441] mb-2 sm:mb-3 animate-fadeIn">
            HMRC Tax Status
          </h1>
          <p className="text-gray-600 text-sm sm:text-base md:text-lg animate-fadeIn delay-100">
            Tell us about your current position with HMRC
          </p>
        </div>

        <div className="space-y-6 sm:space-y-8">
          {/* Main Question Card */}
          <div className="text-center p-6 sm:p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl sm:rounded-2xl border-2 border-blue-100 animate-fadeIn delay-200">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-[#2a3441] mb-3">
              Are you up to date with HMRC?
            </h3>
            <p className="text-sm sm:text-base text-gray-600 max-w-md mx-auto">
              This includes VAT, Corporation Tax, PAYE, and any other tax obligations
            </p>
          </div>

          {/* Radio Selection */}
          <div className="animate-fadeIn delay-300">
            <RadioGroup
              value={isUpToDate}
              onValueChange={handleStatusChange}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6"
            >
              <div className="relative">
                <RadioGroupItem value="yes" id="yes" className="peer sr-only" />
                <Label 
                  htmlFor="yes" 
                  className="flex items-center justify-center p-6 sm:p-8 border-2 border-gray-200 rounded-xl sm:rounded-2xl cursor-pointer transition-all duration-300 hover:border-green-300 hover:bg-green-50 peer-checked:border-green-500 peer-checked:bg-green-50 peer-checked:shadow-lg group"
                >
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-green-200 transition-colors">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="text-lg font-semibold text-[#2a3441] mb-1">Yes</div>
                    <div className="text-sm text-gray-600">Up to date with all tax obligations</div>
                  </div>
                </Label>
              </div>
              
              <div className="relative">
                <RadioGroupItem value="no" id="no" className="peer sr-only" />
                <Label 
                  htmlFor="no" 
                  className="flex items-center justify-center p-6 sm:p-8 border-2 border-gray-200 rounded-xl sm:rounded-2xl cursor-pointer transition-all duration-300 hover:border-amber-300 hover:bg-amber-50 peer-checked:border-amber-500 peer-checked:bg-amber-50 peer-checked:shadow-lg group"
                >
                  <div className="text-center">
                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-amber-200 transition-colors">
                      <AlertTriangle className="h-6 w-6 text-amber-600" />
                    </div>
                    <div className="text-lg font-semibold text-[#2a3441] mb-1">No</div>
                    <div className="text-sm text-gray-600">Outstanding tax liabilities</div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Up to Date Message */}
          {isUpToDate === 'yes' && (
            <div className="text-center p-6 sm:p-8 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl sm:rounded-2xl animate-fadeIn">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-green-800 mb-3">Excellent!</h3>
              <p className="text-green-700 text-sm sm:text-base max-w-md mx-auto">
                Being up to date with HMRC strengthens your funding application and shows good financial management.
              </p>
            </div>
          )}

          {/* Outstanding Liabilities Section */}
          {isUpToDate === 'no' && (
            <div className="space-y-6 sm:space-y-8 animate-fadeIn">
              <div className="p-6 sm:p-8 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl sm:rounded-2xl">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-[#2a3441] mb-2">Required Information</h4>
                    <p className="text-sm sm:text-base text-amber-700 mb-4">
                      Please provide details for any outstanding tax liabilities. Fill in sections that apply to your situation.
                    </p>
                    <ul className="text-sm text-amber-700 space-y-2">
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-amber-600 rounded-full"></div>
                        Outstanding amount
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-amber-600 rounded-full"></div>
                        Expected payment timeframe
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-amber-600 rounded-full"></div>
                        Any payment arrangements or disputes
                      </li>
                    </ul>
                  </div>
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

              <div className="p-6 sm:p-8 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl sm:rounded-2xl">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Shield className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#2a3441] mb-2">Important Note</h4>
                    <p className="text-sm sm:text-base text-blue-700">
                      Having outstanding HMRC liabilities doesn't automatically disqualify you from funding. 
                      Many lenders can work with businesses that have payment plans in place or are actively resolving tax issues.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </SignUpLayout>
  );
};

export default HMRCStatus;
