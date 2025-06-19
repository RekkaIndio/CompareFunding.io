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
  Check,
  Search,
  Building2
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

interface LenderWithLogo {
  id: string;
  name: string;
  logo: string;
}

interface LenderInList {
  id: string;
  name: string;
  category: string;
  hasLogo?: boolean;
}

// Available lenders with their logos
const availableLenders: LenderWithLogo[] = [
  { id: 'barclays', name: 'Barclays', logo: barclyaysLogo },
  { id: 'hsbc', name: 'HSBC', logo: hsbcLogo },
  { id: 'lloyds', name: 'Lloyds Banking Group', logo: lloydsLogo },
  { id: 'metro', name: 'Metro Bank', logo: metroLogo },
  { id: 'natwest', name: 'NatWest Group', logo: natwestLogo },
  { id: 'santander', name: 'Santander', logo: santanderLogo },
];

// Comprehensive list of lenders (including those with logos and many others)
const allLenders: LenderInList[] = [
  // Major Banks (with logos)
  { id: 'barclays', name: 'Barclays', category: 'Major Bank', hasLogo: true },
  { id: 'hsbc', name: 'HSBC', category: 'Major Bank', hasLogo: true },
  { id: 'lloyds', name: 'Lloyds Banking Group', category: 'Major Bank', hasLogo: true },
  { id: 'metro', name: 'Metro Bank', category: 'Major Bank', hasLogo: true },
  { id: 'natwest', name: 'NatWest Group', category: 'Major Bank', hasLogo: true },
  { id: 'santander', name: 'Santander', category: 'Major Bank', hasLogo: true },
  
  // Other Major Banks
  { id: 'nationwide', name: 'Nationwide Building Society', category: 'Building Society' },
  { id: 'tesco', name: 'Tesco Bank', category: 'Retail Bank' },
  { id: 'firstdirect', name: 'first direct', category: 'Digital Bank' },
  { id: 'halifax', name: 'Halifax', category: 'Major Bank' },
  { id: 'bankofscotland', name: 'Bank of Scotland', category: 'Major Bank' },
  
  // Challenger Banks
  { id: 'monzo', name: 'Monzo', category: 'Challenger Bank' },
  { id: 'starling', name: 'Starling Bank', category: 'Challenger Bank' },
  { id: 'revolut', name: 'Revolut', category: 'Challenger Bank' },
  { id: 'atom', name: 'Atom Bank', category: 'Challenger Bank' },
  { id: 'marcus', name: 'Marcus by Goldman Sachs', category: 'Digital Bank' },
  { id: 'chase', name: 'Chase UK', category: 'Challenger Bank' },
  { id: 'virgin', name: 'Virgin Money', category: 'Challenger Bank' },
  { id: 'oaknorth', name: 'OakNorth Bank', category: 'Challenger Bank' },
  { id: 'aldermore', name: 'Aldermore Bank', category: 'Challenger Bank' },
  { id: 'shawbrook', name: 'Shawbrook Bank', category: 'Challenger Bank' },
  
  // Alternative Lenders
  { id: 'funding_circle', name: 'Funding Circle', category: 'P2P Lending' },
  { id: 'iwoca', name: 'iwoca', category: 'Alternative Lender' },
  { id: 'capitalstackcast', name: 'CapitalStackCast', category: 'Alternative Lender' },
  { id: 'lending_crowd', name: 'Lending Crowd', category: 'P2P Lending' },
  { id: 'funding_options', name: 'Funding Options', category: 'Marketplace' },
  { id: 'business_finance_compared', name: 'Business Finance Compared', category: 'Marketplace' },
  { id: 'fleximize', name: 'Fleximize', category: 'Alternative Lender' },
  { id: 'liberis', name: 'Liberis', category: 'Alternative Lender' },
  { id: 'kabbage', name: 'Kabbage', category: 'Alternative Lender' },
  { id: 'lending_works', name: 'Lending Works', category: 'P2P Lending' },
  { id: 'zopa', name: 'Zopa', category: 'P2P Lending' },
  { id: 'ratesetter', name: 'RateSetter', category: 'P2P Lending' },
  { id: 'assetz_capital', name: 'Assetz Capital', category: 'P2P Lending' },
  { id: 'folk2folk', name: 'Folk2Folk', category: 'P2P Lending' },
  { id: 'rebuilding_society', name: 'The Rebuilding Society', category: 'P2P Lending' },
  
  // Asset Finance & Equipment Finance
  { id: 'close_leasing', name: 'Close Brothers Asset Finance', category: 'Asset Finance' },
  { id: 'aldermore_asset', name: 'Aldermore Asset Finance', category: 'Asset Finance' },
  { id: 'hitachi_capital', name: 'Hitachi Capital', category: 'Asset Finance' },
  { id: 'lombard', name: 'Lombard', category: 'Asset Finance' },
  { id: 'hsbc_asset', name: 'HSBC Asset Finance', category: 'Asset Finance' },
  { id: 'santander_asset', name: 'Santander Asset Finance', category: 'Asset Finance' },
  
  // Invoice Finance
  { id: 'marketinvoice', name: 'MarketInvoice', category: 'Invoice Finance' },
  { id: 'lloyds_invoice', name: 'Lloyds Invoice Finance', category: 'Invoice Finance' },
  { id: 'hsbc_invoice', name: 'HSBC Invoice Finance', category: 'Invoice Finance' },
  { id: 'santander_invoice', name: 'Santander Invoice Finance', category: 'Invoice Finance' },
  { id: 'ultimate_finance', name: 'Ultimate Finance', category: 'Invoice Finance' },
  { id: 'bibby_financial', name: 'Bibby Financial Services', category: 'Invoice Finance' },
  
  // Property & Development Finance
  { id: 'precise_mortgages', name: 'Precise Mortgages', category: 'Property Finance' },
  { id: 'paragon_bank', name: 'Paragon Bank', category: 'Property Finance' },
  { id: 'kent_reliance', name: 'Kent Reliance', category: 'Property Finance' },
  { id: 'together_money', name: 'Together Money', category: 'Property Finance' },
  { id: 'specialist_lending', name: 'Specialist Lending', category: 'Property Finance' },
  
  // Trade Finance
  { id: 'export_finance', name: 'UK Export Finance', category: 'Trade Finance' },
  { id: 'trade_finance_global', name: 'Trade Finance Global', category: 'Trade Finance' },
  
  // Government Schemes
  { id: 'british_business_bank', name: 'British Business Bank', category: 'Government' },
  { id: 'recovery_loan_scheme', name: 'Recovery Loan Scheme', category: 'Government' },
  { id: 'bounce_back_loans', name: 'Bounce Back Loan Scheme', category: 'Government' },
  { id: 'start_up_loans', name: 'Start Up Loans', category: 'Government' },
  
  // Credit Unions
  { id: 'credit_union_london', name: 'London Mutual Credit Union', category: 'Credit Union' },
  { id: 'credit_union_manchester', name: 'Manchester Credit Union', category: 'Credit Union' },
  { id: 'credit_union_glasgow', name: 'Glasgow Credit Union', category: 'Credit Union' },
  
  // Other Financial Institutions
  { id: 'amc_bank', name: 'AMC Bank', category: 'Specialist Bank' },
  { id: 'recognise_bank', name: 'Recognise Bank', category: 'Specialist Bank' },
  { id: 'secure_trust', name: 'Secure Trust Bank', category: 'Specialist Bank' },
  { id: 'utb', name: 'United Trust Bank', category: 'Specialist Bank' },
  { id: 'cynergy_bank', name: 'Cynergy Bank', category: 'Specialist Bank' },
  { id: 'cambridge_mercantile', name: 'Cambridge Mercantile', category: 'Specialist Lender' },
].sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically

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
  
  // Search state for lender list
  const [lenderSearchTerm, setLenderSearchTerm] = useState<string>('');

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
          setLenderSearchTerm(parsedData.lenderSearchTerm || '');
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
      lenderReasons,
      lenderSearchTerm
    };
    
    if (currentSession && (shouldAvoidLenders !== '' || selectedLendersToAvoid.length > 0)) {
      sessionStorage.setItem('lenderPreferencesFormData', JSON.stringify(formData));
    }
  }, [shouldAvoidLenders, selectedLendersToAvoid, lenderReasons, lenderSearchTerm]);

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
        const lender = availableLenders.find(l => l.id === lenderId) || 
                      allLenders.find(l => l.id === lenderId);
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

  // Filter lenders based on search term
  const filteredLenders = allLenders.filter(lender => 
    lender.name.toLowerCase().includes(lenderSearchTerm.toLowerCase()) ||
    lender.category.toLowerCase().includes(lenderSearchTerm.toLowerCase())
  );

  // Get categories for grouping
  const categories = [...new Set(allLenders.map(lender => lender.category))].sort();

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

                    {/* Major Lenders with Logos */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-bold text-[#2a3441] flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Major Lenders
                      </h4>
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
                    </div>

                    {/* All Lenders List */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-bold text-[#2a3441] flex items-center gap-2">
                        <Search className="h-5 w-5" />
                        All Lenders
                      </h4>
                      
                      {/* Search Input */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          type="text"
                          placeholder="Search lenders by name or category..."
                          value={lenderSearchTerm}
                          onChange={(e) => setLenderSearchTerm(e.target.value)}
                          className="pl-10 bg-white border-2 border-gray-200 focus:border-[#ff8000] focus:ring-2 focus:ring-[#ff8000]/20 text-[#2a3441] rounded-lg sm:rounded-xl"
                        />
                      </div>

                      {/* Lenders List */}
                      <div className="bg-white border-2 border-gray-200 rounded-xl sm:rounded-2xl max-h-96 overflow-y-auto">
                        <div className="p-4 space-y-2">
                          {filteredLenders.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              <p>No lenders found matching your search.</p>
                            </div>
                          ) : (
                            filteredLenders.map((lender) => {
                              const isSelected = selectedLendersToAvoid.includes(lender.id);
                              return (
                                <div
                                  key={lender.id}
                                  onClick={() => toggleLenderSelection(lender.id)}
                                  className={`flex items-center justify-between p-3 sm:p-4 rounded-lg cursor-pointer transition-all duration-200 group ${
                                    isSelected 
                                      ? 'bg-red-50 border-2 border-red-200 shadow-sm' 
                                      : 'hover:bg-gray-50 border-2 border-transparent'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                      isSelected 
                                        ? 'bg-red-500 border-red-500' 
                                        : 'border-gray-300 group-hover:border-red-300'
                                    }`}>
                                      {isSelected && <Check className="h-4 w-4 text-white" />}
                                    </div>
                                    <div>
                                      <h6 className="font-medium text-[#2a3441] text-sm sm:text-base">
                                        {lender.name}
                                        {lender.hasLogo && (
                                          <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                                            Featured
                                          </span>
                                        )}
                                      </h6>
                                      <p className="text-xs sm:text-sm text-gray-500">{lender.category}</p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Summary of selections */}
                    {selectedLendersToAvoid.length > 0 && (
                      <div className="p-4 sm:p-6 bg-red-50 border-2 border-red-200 rounded-xl sm:rounded-2xl">
                        <h5 className="font-semibold text-[#2a3441] mb-2">
                          Selected Lenders to Avoid ({selectedLendersToAvoid.length})
                        </h5>
                        <div className="flex flex-wrap gap-2">
                          {selectedLendersToAvoid.map((lenderId) => {
                            const lender = allLenders.find(l => l.id === lenderId);
                            if (!lender) return null;
                            
                            return (
                              <span
                                key={lenderId}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full"
                              >
                                {lender.name}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleLenderSelection(lenderId);
                                  }}
                                  className="ml-1 hover:bg-red-200 rounded-full p-0.5"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Reasons for selected lenders */}
                    {selectedLendersToAvoid.length > 0 && (
                      <div className="space-y-4">
                        <h4 className="text-lg font-bold text-[#2a3441]">Additional Information (Optional)</h4>
                        <p className="text-sm text-gray-600 mb-4">
                          You can provide reasons for avoiding these lenders to help us better understand your preferences.
                        </p>
                        
                        {selectedLendersToAvoid.map((lenderId) => {
                          const lenderFromList = allLenders.find(l => l.id === lenderId);
                          const lenderWithLogo = availableLenders.find(l => l.id === lenderId);
                          
                          if (!lenderFromList) return null;
                          
                          return (
                            <div key={lenderId} className="p-4 sm:p-6 bg-white border-2 border-gray-200 rounded-xl sm:rounded-2xl">
                              <div className="flex items-center gap-3 mb-4">
                                {lenderWithLogo ? (
                                  <div className="w-10 h-10 flex items-center justify-center">
                                    <img 
                                      src={lenderWithLogo.logo} 
                                      alt={`${lenderFromList.name} logo`}
                                      className="max-w-full max-h-full object-contain"
                                    />
                                  </div>
                                ) : (
                                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                    <Building2 className="h-5 w-5 text-gray-400" />
                                  </div>
                                )}
                                <div>
                                  <h5 className="font-semibold text-[#2a3441]">{lenderFromList.name}</h5>
                                  <p className="text-xs text-gray-500">{lenderFromList.category}</p>
                                </div>
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
