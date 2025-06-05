import { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, ArrowRight, Search, Check, Loader2, CheckCircle2 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useNavbar } from '@/contexts/NavbarContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SignUpLayout from '@/components/SignUpLayout';
import { fetchCreditData, summarizeWebsite, fetchWebsiteLogo, searchCompanies } from '@/lib/businessDetailsUtils';
import { normalizeCreditScoreData, createFinancialsCreditScoreDocument } from '@/lib/creditScoreUtils';
import { useAuth } from '@/contexts/AuthContext';
import { getFirestore, doc, setDoc, serverTimestamp, collection } from 'firebase/firestore';
import OpenAI from "openai";
import '../../styles/animations.css';
import debounce from 'lodash.debounce';

// Industry options
const industryOptions = [
  { label: 'Technology', value: 'technology' },
  { label: 'Healthcare', value: 'healthcare' },
  { label: 'Finance', value: 'finance' },
  { label: 'Retail', value: 'retail' },
  { label: 'Manufacturing', value: 'manufacturing' },
  { label: 'Construction', value: 'construction' },
  { label: 'Hospitality', value: 'hospitality' },
  { label: 'Education', value: 'education' },
  { label: 'Real Estate', value: 'real_estate' },
  { label: 'Transportation', value: 'transportation' },
  { label: 'Other', value: 'other' },
];

// Company size options
const companySizeOptions = [
  { label: '1-10 employees', value: '1-10' },
  { label: '11-50 employees', value: '11-50' },
  { label: '51-200 employees', value: '51-200' },
  { label: '201-500 employees', value: '201-500' },
  { label: '501+ employees', value: '501+' },
];

const openAIClient = new OpenAI({ apiKey: import.meta.env.VITE_OPEN_AI_API_KEY, dangerouslyAllowBrowser: true });

const BusinessDetailsForm = () => {
  const { user } = useAuth();
  const { showNavbar, hideNavbar } = useNavbar();
  const location = useLocation();
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(location.state || {});
  const [formData, setFormData] = useState({
    companyName: '',
    companyNumber: '',
    industry: '',
    website: '',
    forecastRevenue: '10000000',
    companySize: '',
  });
  
  // Company search state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{
    name: string;
    connectId?: string;
    id?: string;
    registrationNumber?: string;
    address?: { simpleValue?: string };
  }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCompanyPopoverOpen, setIsCompanyPopoverOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  // Define the signup steps
  const signupSteps = [
    { label: 'Email & Password', path: '/signup-journey/email-password' },
    { label: 'Funding Amount', path: '/signup-journey/apply' },
    { label: 'Funding Matches', path: '/signup-journey/funding-matches' },
    { label: 'Business Details', path: '/signup-journey/business-details' },
    { label: 'Eligibility', path: '/signup-journey/eligibility' },
  ];

  const currentStepIndex = 3; // Business Details is step 4 (0-indexed)

  // Helper function to check if form is valid
  const isFormValid = () => {
    return (
      searchTerm.trim() !== '' &&
      formData.website.trim() !== '' &&
      formData.industry !== '' &&
      formData.companySize !== '' &&
      formData.forecastRevenue !== ''
    );
  };

  // Sync searchTerm with formData.companyName on initial load
  useEffect(() => {
    if (formData.companyName && !searchTerm) {
      setSearchTerm(formData.companyName);
    }
  }, [formData.companyName]);

  useEffect(() => {
    hideNavbar();
    return () => {
      showNavbar();
    };
  }, [hideNavbar, showNavbar]);

  useEffect(() => {
    if (!userInfo.userId && user?.uid) {
      setUserInfo(prev => ({ ...prev, userId: user.uid }));
    }
  }, [user, userInfo.userId]);

  // Debounced search function with improved responsiveness
  const debouncedSearch = useCallback(
    debounce(async (term: string) => {
      if (term.length < 2) {
        setSearchResults([]);
        setIsCompanyPopoverOpen(false);
        return;
      }

      setIsLoading(true);
      try {
        const results = await searchCompanies(term);
        const companies = results.companies || [];
        setSearchResults(companies);
        // Only show popover if we have results and input is focused
        if (companies.length > 0 && document.activeElement === inputRef.current) {
          setIsCompanyPopoverOpen(true);
        }
      } catch (error) {
        console.error('Error searching companies:', error);
        setSearchResults([]);
        setIsCompanyPopoverOpen(false);
      } finally {
        setIsLoading(false);
      }
    }, 200), // Reduced debounce time for faster response
    []
  );

  const handleCompanySearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setFormData({ ...formData, companyName: value });
    setSelectedIndex(-1); // Reset selection when typing
    
    if (value.length >= 2) {
      debouncedSearch(value);
    } else {
      setIsCompanyPopoverOpen(false);
      setSearchResults([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isCompanyPopoverOpen || searchResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : searchResults.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
          selectCompany(searchResults[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsCompanyPopoverOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleInputFocus = () => {
    // Show results if we have them and search term is valid
    if (searchResults.length > 0 && searchTerm.length >= 2) {
      setIsCompanyPopoverOpen(true);
    }
  };

  const handleInputBlur = () => {
    // Delay closing to allow for clicking on results
    setTimeout(() => {
      setIsCompanyPopoverOpen(false);
    }, 200);
  };

  const selectCompany = (company: any) => {
    setSearchTerm(company.name);
    setFormData({
      ...formData,
      companyName: company.name,
      companyNumber: company.registrationNumber || company.id || ''
    });
    setIsCompanyPopoverOpen(false);
    setSearchResults([]);
    setSelectedIndex(-1);
    // Keep focus on input for better UX
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Background function to fetch and save credit score data
  const fetchAndSaveCreditDataBackground = async (companyName: string) => {
    if (!user?.uid) return;

    try {

      
      // Fetch credit data
      const creditResult = await fetchCreditData(companyName, 'GB');
      
      // Check if there was an error (creditResult could have an error property)
      if (creditResult && typeof creditResult === 'object' && 'error' in creditResult) {
        console.warn('Credit data fetch failed:', creditResult.error);
        return;
      }

      // Normalize and save credit data similar to CreditScorePage
      const normalizedCreditInfo = normalizeCreditScoreData(creditResult);
      const db = getFirestore();

      // Extract company info from the original credit result
      const companyNumber = creditResult && typeof creditResult === 'object' && 'company_number' in creditResult 
        ? String(creditResult.company_number) 
        : '';

      // Save to businesses collection
      const businessRef = doc(db, "businesses", user.uid);
      await setDoc(businessRef, {
        name: companyName,
        business_name: companyName,
        company_number: companyNumber,
        credit_info: normalizedCreditInfo,
        updatedAt: serverTimestamp(),
        active: true
      }, { merge: true });

      // Save detailed credit score to financials subcollection using existing utility
      const creditScoreRef = doc(collection(db, "businesses", user.uid, "financials"), "credit_score");
      await setDoc(creditScoreRef, createFinancialsCreditScoreDocument(
        creditResult,
        companyName,
        companyNumber,
        creditResult // Pass the full result as raw data
      ));

      // Set flags for CreditScorePage to know data is ready
      sessionStorage.setItem('credit_data_ready', 'true');
      sessionStorage.setItem('credit_search_company_name', companyName);
      

    } catch (error) {
      console.error('Background credit score fetch failed:', error);
      // Don't throw error to avoid interrupting sign-up flow
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid()) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const db = getFirestore();
      const combinedUserData = {
        ...userInfo,
        ...formData,
        companyName: searchTerm, // Use searchTerm as the final company name
        timestamp: serverTimestamp(),
      };

      if (user?.uid) {
        await setDoc(doc(db, 'users', user.uid), combinedUserData, { merge: true });
      }

      // Store company name for credit score auto-population
      sessionStorage.setItem('credit_search_company_name', searchTerm);
      
      // Trigger background credit score fetching (don't await it)
      fetchAndSaveCreditDataBackground(searchTerm).catch(error => {
        console.error('Background credit score fetch failed:', error);
        // Don't block the flow if credit score fetch fails
      });
      
      // Continue to the next step in the sign-up journey (Eligibility)
      navigate('/signup-journey/eligibility', {
        state: combinedUserData
      });
    } catch (error) {
      console.error('Error saving business details:', error);
      alert('There was an error saving your information. Please try again.');
    }
  };

  return (
    <SignUpLayout
      steps={signupSteps}
      currentStep={currentStepIndex}
      onStepNavigation={(stepIndex) => {
        if (stepIndex === 0) navigate('/signup-journey/email-password', { state: userInfo });
        if (stepIndex === 1) navigate('/signup-journey/apply', { state: userInfo });
        if (stepIndex === 2) navigate('/signup-journey/funding-matches', { state: userInfo });
        if (stepIndex === 3) navigate('/signup-journey/business-details', { state: userInfo });
        if (stepIndex === 4) navigate('/signup-journey/eligibility', { state: userInfo });
      }}
      sidebarProps={{
        title: "Business Information",
        description: "Help us understand your business better to find the most suitable funding options. Accurate information leads to better matches.",
        highlight: "Your information is secure and encrypted",
        tips: [
          "Complete all fields for better funding matches",
          "Your business registration number will be automatically retrieved",
          "We use this data to pre-fill future applications"
        ]
      }}
    >
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-[#2a3441] mb-2">
            Tell us about your business
          </h2>
          <p className="text-gray-600 text-lg">
            We'll use this information to find the best funding opportunities for you.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Company Name & Registration Number */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label htmlFor="companyName" className="text-base font-semibold text-gray-800">
                Company Name <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 z-10" />
                <Input
                  ref={inputRef}
                  type="text"
                  id="companyName"
                  value={searchTerm}
                  onChange={handleCompanySearch}
                  onKeyDown={handleKeyDown}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  placeholder="Search for your company..."
                  className="pl-12 py-3 h-12 text-base bg-white border-2 border-gray-200 rounded-xl focus:border-[#ff8000] focus:ring-2 focus:ring-[#ff8000]/20 transition-all"
                  required
                  autoComplete="off"
                />
                
                {/* Custom Dropdown Results */}
                {isCompanyPopoverOpen && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
                    {isLoading ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-6 w-6 animate-spin text-[#ff8000]" />
                        <span className="ml-2 text-gray-600">Searching companies...</span>
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div className="py-2">
                        {searchResults.map((company, index) => (
                          <div
                            key={index}
                            onClick={() => selectCompany(company)}
                            onMouseEnter={() => setSelectedIndex(index)}
                            className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors ${
                              index === selectedIndex 
                                ? 'bg-[#ff8000]/10 border-[#ff8000]/20' 
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <div>
                                <div className="font-medium text-gray-900">{company.name}</div>
                                {company.registrationNumber && (
                                  <div className="text-sm text-gray-500">Reg: {company.registrationNumber}</div>
                                )}
                                {company.address?.simpleValue && (
                                  <div className="text-sm text-gray-500 truncate">{company.address.simpleValue}</div>
                                )}
                              </div>
                              <CheckCircle2 className={`h-5 w-5 flex-shrink-0 ${
                                index === selectedIndex ? 'text-[#ff8000]' : 'text-green-500'
                              }`} />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : searchTerm.length >= 2 && !isLoading ? (
                      <div className="py-6 text-center text-gray-500">
                        No companies found. Try a different search term.
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="companyNumber" className="text-base font-semibold text-gray-800">
                Company Registration Number
              </Label>
              <Input
                type="text"
                id="companyNumber"
                value={formData.companyNumber}
                onChange={(e) => setFormData({ ...formData, companyNumber: e.target.value })}
                placeholder="Auto-filled from search"
                className="py-3 h-12 text-base bg-white border-2 border-gray-200 rounded-xl focus:border-[#ff8000] focus:ring-2 focus:ring-[#ff8000]/20 transition-all"
                readOnly
              />
            </div>
          </div>

          {/* Website */}
          <div className="space-y-3">
            <Label htmlFor="website" className="text-base font-semibold text-gray-800">
              Company Website <span className="text-red-500">*</span>
            </Label>
            <Input
              type="url"
              id="website"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://www.yourcompany.com"
              className="py-3 h-12 text-base bg-white border-2 border-gray-200 rounded-xl focus:border-[#ff8000] focus:ring-2 focus:ring-[#ff8000]/20 transition-all"
              required
            />
          </div>

          {/* Industry and Company Size */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label htmlFor="industry" className="text-base font-semibold text-gray-800">
                Industry <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.industry} onValueChange={(value) => setFormData({ ...formData, industry: value })}>
                <SelectTrigger className="py-3 h-12 text-base bg-white border-2 border-gray-200 rounded-xl focus:border-[#ff8000] focus:ring-2 focus:ring-[#ff8000]/20 transition-all">
                  <SelectValue placeholder="Select your industry" />
                </SelectTrigger>
                <SelectContent>
                  {industryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="py-2 text-base">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label htmlFor="companySize" className="text-base font-semibold text-gray-800">
                Company Size <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.companySize} onValueChange={(value) => setFormData({ ...formData, companySize: value })}>
                <SelectTrigger className="py-3 h-12 text-base bg-white border-2 border-gray-200 rounded-xl focus:border-[#ff8000] focus:ring-2 focus:ring-[#ff8000]/20 transition-all">
                  <SelectValue placeholder="Select company size" />
                </SelectTrigger>
                <SelectContent>
                  {companySizeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="py-2 text-base">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Forecast Revenue */}
          <div className="space-y-3">
            <Label htmlFor="forecastRevenue" className="text-base font-semibold text-gray-800">
              Annual Revenue Forecast <span className="text-red-500">*</span>
            </Label>
            <Select value={formData.forecastRevenue} onValueChange={(value) => setFormData({ ...formData, forecastRevenue: value })}>
              <SelectTrigger className="py-3 h-12 text-base bg-white border-2 border-gray-200 rounded-xl focus:border-[#ff8000] focus:ring-2 focus:ring-[#ff8000]/20 transition-all">
                <SelectValue placeholder="Select revenue range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="100000" className="py-2 text-base">Under £100k</SelectItem>
                <SelectItem value="500000" className="py-2 text-base">£100k - £500k</SelectItem>
                <SelectItem value="1000000" className="py-2 text-base">£500k - £1M</SelectItem>
                <SelectItem value="5000000" className="py-2 text-base">£1M - £5M</SelectItem>
                <SelectItem value="10000000" className="py-2 text-base">£5M - £10M</SelectItem>
                <SelectItem value="50000000" className="py-2 text-base">£10M+</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-6">
            <Button
              type="submit"
              disabled={!isFormValid()}
              className="bg-[#ff8000] hover:bg-[#e67300] text-white px-10 py-4 text-lg rounded-full font-medium shadow transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              Continue to Funding Application
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </form>
      </div>
    </SignUpLayout>
  );
};

export default BusinessDetailsForm;
