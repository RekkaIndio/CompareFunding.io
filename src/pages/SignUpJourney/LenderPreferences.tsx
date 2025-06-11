import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNavbar } from '@/contexts/NavbarContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import SignUpLayout from '@/components/SignUpLayout';
import { 
  AlertTriangle, 
  X,
  Plus,
  Shield
} from 'lucide-react';

interface LenderToAvoid {
  name: string;
  reason: string;
}

const LenderPreferences = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showNavbar, hideNavbar } = useNavbar();
  const [userInfo, setUserInfo] = useState(location.state || {});
  
  // Lender avoidance state
  const [shouldAvoidLenders, setShouldAvoidLenders] = useState<string>('');
  const [lendersToAvoid, setLendersToAvoid] = useState<LenderToAvoid[]>([
    { name: '', reason: '' }
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
  const currentStep = 6;

  useEffect(() => {
    hideNavbar();
    
    // Try to restore form data from session storage
    const currentSession = sessionStorage.getItem('currentSignupSession');
    if (currentSession) {
      const savedFormData = sessionStorage.getItem('lenderPreferencesFormData');
      if (savedFormData) {
        try {
          const parsedData = JSON.parse(savedFormData);
          setShouldAvoidLenders(parsedData.shouldAvoidLenders || '');
          setLendersToAvoid(parsedData.lendersToAvoid || [{ name: '', reason: '' }]);
        } catch (error) {
          console.error('Error parsing saved lender preferences form data:', error);
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
      shouldAvoidLenders,
      lendersToAvoid: shouldAvoidLenders === 'yes' ? lendersToAvoid.filter(l => l.name.trim() !== '') : []
    };
    
    if (currentSession && (shouldAvoidLenders !== '' || lendersToAvoid.some(l => l.name.trim() !== ''))) {
      sessionStorage.setItem('lenderPreferencesFormData', JSON.stringify(formData));
    }
  }, [shouldAvoidLenders, lendersToAvoid]);

  const handlePrevious = () => {
    navigate('/signup-journey/document-upload', { state: userInfo });
  };

  const handleNext = () => {
    if (isFormValid()) {
      navigate('/signup-journey/application-review', { 
        state: { 
          ...userInfo, 
          shouldAvoidLenders,
          lendersToAvoid: shouldAvoidLenders === 'yes' ? lendersToAvoid.filter(l => l.name.trim() !== '') : []
        } 
      });
    }
  };

  const handleStepNavigation = (stepIndex: number) => {
    if (stepIndex > currentStep) return; // Prevent jumping ahead
    
    const currentFormData = {
      shouldAvoidLenders,
      lendersToAvoid: shouldAvoidLenders === 'yes' ? lendersToAvoid.filter(l => l.name.trim() !== '') : []
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
        navigate('/signup-journey/document-upload', { state: userInfo });
        break;
      case 6:
        // Current page
        break;
      case 7:
        navigate('/signup-journey/application-review', { state: { ...userInfo, ...currentFormData } });
        break;
    }
  };

  // Check if form is valid
  const isFormValid = () => {
    // Check lender avoidance question is answered
    const lenderQuestionAnswered = shouldAvoidLenders !== '';
    
    // If avoiding lenders, check that at least one has a name
    const lendersValid = shouldAvoidLenders === 'no' || 
      (shouldAvoidLenders === 'yes' && lendersToAvoid.some(l => l.name.trim() !== ''));

    return lenderQuestionAnswered && lendersValid;
  };

  // Add new lender to avoid
  const addLenderToAvoid = () => {
    setLendersToAvoid(prev => [...prev, { name: '', reason: '' }]);
  };

  // Remove lender to avoid
  const removeLenderToAvoid = (index: number) => {
    setLendersToAvoid(prev => prev.filter((_, i) => i !== index));
  };

  // Update lender to avoid
  const updateLenderToAvoid = (index: number, field: 'name' | 'reason', value: string) => {
    setLendersToAvoid(prev => prev.map((lender, i) => 
      i === index ? { ...lender, [field]: value } : lender
    ));
  };

  // Clear lenders when "No" is selected
  const handleShouldAvoidLendersChange = (value: string) => {
    setShouldAvoidLenders(value);
    if (value === 'no') {
      setLendersToAvoid([{ name: '', reason: '' }]);
    }
  };

  const sidebarProps = {
    title: "Lender Preferences",
    description: "Let us know if there are any lenders you'd prefer us not to approach on your behalf.",
    highlight: "Your preferences matter",
    tips: [
      "We respect your existing relationships and preferences",
      "You can specify lenders to avoid for any reason",
      "This helps us target the most suitable options for you",
      "All preferences are kept confidential"
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
      <div className="space-y-8">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#2a3441] mb-2 sm:mb-3 animate-fadeIn">
            Lender Preferences
          </h1>
          <p className="text-gray-600 text-sm sm:text-base md:text-lg animate-fadeIn delay-100">
            Help us understand your lender preferences to provide the best service
          </p>
        </div>

        <div className="space-y-6">
          {/* Lender Avoidance Section */}
          <Card className="border-2 border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-[#2a3441]">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                Lender Restrictions
              </CardTitle>
              <CardDescription className="text-gray-600">
                Are there any lenders we shouldn't approach on your behalf?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup 
                value={shouldAvoidLenders} 
                onValueChange={handleShouldAvoidLendersChange}
                className="space-y-3"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="avoid-no" />
                  <Label htmlFor="avoid-no" className="text-sm font-medium text-[#2a3441]">
                    No - You can approach any suitable lenders
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="avoid-yes" />
                  <Label htmlFor="avoid-yes" className="text-sm font-medium text-[#2a3441]">
                    Yes - There are specific lenders to avoid
                  </Label>
                </div>
              </RadioGroup>

              {shouldAvoidLenders === 'yes' && (
                <div className="mt-4 space-y-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-sm text-amber-700 mb-2 font-medium">
                      <AlertTriangle className="h-4 w-4 inline mr-1" />
                      Lender Restrictions
                    </p>
                    <p className="text-sm text-amber-600">
                      We'll ensure these lenders are not approached as part of your funding search. 
                      This information is kept strictly confidential.
                    </p>
                  </div>

                  {lendersToAvoid.map((lender, index) => (
                    <div key={index} className="border-2 border-gray-200 rounded-lg p-4 bg-white">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-[#2a3441]">Lender {index + 1}</h4>
                        {lendersToAvoid.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeLenderToAvoid(index)}
                            className="text-red-600 hover:text-red-700 border-2 border-gray-200 hover:border-red-300"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor={`lender-name-${index}`} className="text-sm sm:text-base font-medium text-[#2a3441]">Lender Name</Label>
                          <Input
                            id={`lender-name-${index}`}
                            value={lender.name}
                            onChange={(e) => updateLenderToAvoid(index, 'name', e.target.value)}
                            placeholder="Enter lender name"
                            className="h-10 sm:h-12 bg-white border-2 border-gray-200 focus:border-[#ff8000] focus:ring-1 focus:ring-[#ff8000] text-[#2a3441] placeholder:text-gray-400 rounded-lg sm:rounded-xl"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor={`lender-reason-${index}`} className="text-sm sm:text-base font-medium text-[#2a3441]">Reason (Optional)</Label>
                          <Textarea
                            id={`lender-reason-${index}`}
                            value={lender.reason}
                            onChange={(e) => updateLenderToAvoid(index, 'reason', e.target.value)}
                            placeholder="Why should we avoid this lender? (Optional - helps us understand your preferences)"
                            className="bg-white border-2 border-gray-200 focus:border-[#ff8000] focus:ring-1 focus:ring-[#ff8000] text-[#2a3441] placeholder:text-gray-400 rounded-lg sm:rounded-xl"
                            rows={2}
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={addLenderToAvoid}
                    className="w-full border-2 border-dashed border-gray-300 text-white bg-[#2a3441] hover:text-white hover:bg-[#ff8000] hover:border-[#ff8000] h-10 sm:h-12 rounded-lg sm:rounded-xl transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Another Lender
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Privacy Note */}
          <Card className="border-2 border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-green-800">
                <Shield className="h-5 w-5" />
                Privacy & Confidentiality
              </CardTitle>
              <CardDescription className="text-green-600">
                Your lender preferences are kept strictly confidential
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-green-700 space-y-2">
                <li>• Your lender restrictions are never shared with the lenders themselves</li>
                <li>• We use this information solely to optimise your funding search</li>
                <li>• You can update these preferences at any time</li>
                <li>• All data is encrypted and securely stored</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </SignUpLayout>
  );
};

export default LenderPreferences;
