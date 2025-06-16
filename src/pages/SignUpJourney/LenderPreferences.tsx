import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNavbar } from '@/contexts/NavbarContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import SignUpLayout from '@/components/SignUpLayout';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { 
  AlertTriangle, 
  X,
  Plus,
  Shield,
  Check
} from 'lucide-react';

// Import lender logos
import barclyaysLogo from '@/assets/lenderlogos/barclyays.png';
import hsbcLogo from '@/assets/lenderlogos/hsbclogo.png';
import lloydsLogo from '@/assets/lenderlogos/lloydslogo.png';
import metroLogo from '@/assets/lenderlogos/metro_bank_logo.png';
import natwestLogo from '@/assets/lenderlogos/natwestlogo.png';
import santanderLogo from '@/assets/lenderlogos/santanderlogo.png';

interface LenderToAvoid {
  name: string;
  reason?: string;
}

// Available lenders with their logos
const availableLenders = [
  { id: 'barclays', name: 'Barclays', logo: barclyaysLogo },
  { id: 'hsbc', name: 'HSBC', logo: hsbcLogo },
  { id: 'lloyds', name: 'Lloyds Banking Group', logo: lloydsLogo },
  { id: 'metro', name: 'Metro Bank', logo: metroLogo },
  { id: 'natwest', name: 'NatWest Group', logo: natwestLogo },
  { id: 'santander', name: 'Santander', logo: santanderLogo },
];

const LenderPreferences = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showNavbar, hideNavbar } = useNavbar();
  const { user } = useAuth();
  const [userInfo, setUserInfo] = useState(location.state || {});
  
  // Lender avoidance state
  const [shouldAvoidLenders, setShouldAvoidLenders] = useState<string>('');
  const [selectedLendersToAvoid, setSelectedLendersToAvoid] = useState<string[]>([]);
  const [lenderReasons, setLenderReasons] = useState<Record<string, string>>({});

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
          setSelectedLendersToAvoid(parsedData.selectedLendersToAvoid || []);
          setLenderReasons(parsedData.lenderReasons || {});
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
      selectedLendersToAvoid,
      lenderReasons
    };
    
    if (currentSession && (shouldAvoidLenders !== '' || selectedLendersToAvoid.length > 0)) {
      sessionStorage.setItem('lenderPreferencesFormData', JSON.stringify(formData));
    }
  }, [shouldAvoidLenders, selectedLendersToAvoid, lenderReasons]);

  const handlePrevious = () => {
    navigate('/signup-journey/document-upload', { state: userInfo });
  };

  const handleNext = async () => {
    if (!isFormValid()) {
      toast.error('Please complete all required fields before continuing.');
      return;
    }

    try {
      // Format lenders to avoid with only name and reason (no File objects)
      const lendersToAvoidData = selectedLendersToAvoid.map(lenderId => {
        const lender = availableLenders.find(l => l.id === lenderId);
        return {
          name: lender?.name || '',
          reason: lenderReasons[lenderId] || ''
        };
      });

      // Save lender preferences data to user profile
      if (user?.uid) {
        const db = getFirestore();

        const lenderPreferencesData = {
          shouldAvoidLenders,
          lendersToAvoid: lendersToAvoidData, // Only save clean data
          updatedAt: serverTimestamp()
        };

        // Save to users collection (only lender preferences, not userInfo which may contain File objects)
        await setDoc(doc(db, 'users', user.uid), {
          lenderPreferences: lenderPreferencesData
        }, { merge: true });

        // Also save to businesses collection for consistency
        await setDoc(doc(db, 'businesses', user.uid), {
          lenderPreferences: lenderPreferencesData
        }, { merge: true });
      }

      // Navigate to next step with updated data (clean data only)
      navigate('/signup-journey/application-review', { 
        state: { 
          ...userInfo, 
          shouldAvoidLenders,
          lendersToAvoid: lendersToAvoidData // Pass the clean data structure
        } 
      });
    } catch (error) {
      console.error('Error saving lender preferences data:', error);
      toast.error('There was an error saving your information. Please try again.');
    }
  };

  const handleStepNavigation = (stepIndex: number) => {
    if (stepIndex > currentStep) return; // Prevent jumping ahead
    
    const currentFormData = {
      shouldAvoidLenders,
      selectedLendersToAvoid,
      lenderReasons
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
    
    // If avoiding lenders, check that at least one is selected
    const lendersValid = shouldAvoidLenders === 'no' || 
      (shouldAvoidLenders === 'yes' && selectedLendersToAvoid.length > 0);

    return lenderQuestionAnswered && lendersValid;
  };

  // Toggle lender selection
  const toggleLenderSelection = (lenderId: string) => {
    setSelectedLendersToAvoid(prev => {
      if (prev.includes(lenderId)) {
        // Remove lender and its reason
        const newReasons = { ...lenderReasons };
        delete newReasons[lenderId];
        setLenderReasons(newReasons);
        return prev.filter(id => id !== lenderId);
      } else {
        // Add lender
        return [...prev, lenderId];
      }
    });
  };

  // Update lender reason
  const updateLenderReason = (lenderId: string, reason: string) => {
    setLenderReasons(prev => ({
      ...prev,
      [lenderId]: reason
    }));
  };

  // Clear lenders when "No" is selected
  const handleShouldAvoidLendersChange = (value: string) => {
    setShouldAvoidLenders(value);
    if (value === 'no') {
      setSelectedLendersToAvoid([]);
      setLenderReasons({});
    }
  };

  // Save user profile to Firestore (legacy function - can be removed)
  const saveUserProfile = async () => {
    // This function is no longer needed as saving is handled in handleNext
    return;
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
                <div className="mt-6 space-y-6">
                  <div className="p-6 sm:p-8 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl sm:rounded-2xl">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="h-6 w-6 text-amber-600" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-[#2a3441] mb-2">Select Lenders to Avoid</h4>
                        <p className="text-sm sm:text-base text-amber-700 mb-4">
                          Choose the lenders you'd prefer us not to approach on your behalf. This information is kept strictly confidential.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Lender Selection Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                    {availableLenders.map((lender) => {
                      const isSelected = selectedLendersToAvoid.includes(lender.id);
                      return (
                        <div
                          key={lender.id}
                          onClick={() => toggleLenderSelection(lender.id)}
                          className={`relative p-4 sm:p-6 border-2 rounded-xl sm:rounded-2xl cursor-pointer transition-all duration-300 hover:shadow-lg group ${
                            isSelected 
                              ? 'border-red-500 bg-red-50 shadow-lg' 
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          {/* Selection indicator */}
                          {isSelected && (
                            <div className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                              <Check className="h-4 w-4 text-white" />
                            </div>
                          )}
                          
                          {/* Lender logo */}
                          <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 mb-3 flex items-center justify-center">
                              <img 
                                src={lender.logo} 
                                alt={`${lender.name} logo`}
                                className="max-w-full max-h-full object-contain"
                              />
                            </div>
                            <h5 className="font-semibold text-sm sm:text-base text-[#2a3441] leading-tight">
                              {lender.name}
                            </h5>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Reasons for selected lenders */}
                  {selectedLendersToAvoid.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-lg font-bold text-[#2a3441]">Additional Information (Optional)</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        You can provide reasons for avoiding these lenders to help us better understand your preferences.
                      </p>
                      
                      {selectedLendersToAvoid.map((lenderId) => {
                        const lender = availableLenders.find(l => l.id === lenderId);
                        if (!lender) return null;
                        
                        return (
                          <div key={lenderId} className="p-4 sm:p-6 bg-white border-2 border-gray-200 rounded-xl sm:rounded-2xl">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-10 h-10 flex items-center justify-center">
                                <img 
                                  src={lender.logo} 
                                  alt={`${lender.name} logo`}
                                  className="max-w-full max-h-full object-contain"
                                />
                              </div>
                              <h5 className="font-semibold text-[#2a3441]">{lender.name}</h5>
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor={`reason-${lenderId}`} className="text-sm sm:text-base font-medium text-[#2a3441]">
                                Reason for avoiding (Optional)
                              </Label>
                              <Textarea
                                id={`reason-${lenderId}`}
                                value={lenderReasons[lenderId] || ''}
                                onChange={(e) => updateLenderReason(lenderId, e.target.value)}
                                placeholder="e.g., Previous poor experience, existing relationship conflicts, etc."
                                className="min-h-[80px] bg-white border-2 border-gray-200 focus:border-[#ff8000] focus:ring-2 focus:ring-[#ff8000]/20 text-[#2a3441] rounded-lg sm:rounded-xl resize-none transition-all"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
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
