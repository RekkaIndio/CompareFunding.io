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
    forecastRevenue: '250000',
    companySize: '',
    // Funding fields
    fundingPurpose: 'expansion',
    fundingAmount: '100000',
    fundingTimeframe: '1_week',
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
    { label: 'Business Details', path: '/signup-journey/business-details' },
    { label: 'Additional Details', path: '/signup-journey/additional-details' },
    { label: 'Current Funding', path: '/signup-journey/current-funding' },
    { label: 'HMRC Status', path: '/signup-journey/hmrc-status' },
    { label: 'Document Upload', path: '/signup-journey/document-upload' },
    { label: 'Lender Preferences', path: '/signup-journey/lender-preferences' },
    { label: 'Review & Submit', path: '/signup-journey/application-review' },
  ];

  const currentStepIndex = 1; // Business Details is now step 2 (0-indexed)
  
  // Navigation handlers
  const handlePrevious = () => {
    navigate('/signup-journey/email-password', { state: { ...userInfo, ...formData } });
  };
  
  const handleNext = () => {
    // Only allow next if the form is valid
    if (isFormValid()) {
      navigate('/signup-journey/additional-details', { state: { ...userInfo, ...formData } });
    }
  };

  // Helper function to check if form is valid
  const isFormValid = () => {
    return (
      searchTerm.trim() !== '' &&
      formData.website.trim() !== '' &&
      formData.industry !== '' &&
      formData.companySize !== '' &&
      formData.forecastRevenue !== '' &&
      formData.fundingPurpose !== '' &&
      formData.fundingAmount !== '' &&
      formData.fundingTimeframe !== ''
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
    
    // Check if we're coming from email-password page (fresh signup)
    // If userInfo has userId/email but no business data, it's a fresh signup
    const isFreshSignup = userInfo && (userInfo.userId || userInfo.email) && !userInfo.companyName;
    
    if (isFreshSignup) {
      // Clear any existing business form data for fresh signups
      sessionStorage.removeItem('businessDetailsFormData');
      // Set a session identifier for this signup session
      const signupSessionId = Date.now().toString();
      sessionStorage.setItem('currentSignupSession', signupSessionId);
      console.log('Fresh signup detected - cleared previous form data and started new session');
    } else {
      // Only restore form data if this is NOT a fresh signup (i.e., navigating back/forward)
      const savedFormData = sessionStorage.getItem('businessDetailsFormData');
      const currentSession = sessionStorage.getItem('currentSignupSession');
      
      if (savedFormData && currentSession) {
        try {
          const parsedData = JSON.parse(savedFormData);
          setFormData(parsedData);
          if (parsedData.companyName) {
            setSearchTerm(parsedData.companyName);
          }
        } catch (error) {
          console.error('Error parsing saved form data:', error);
        }
      }
    }
    
    return () => {
      showNavbar();
      // Save data when leaving the form (only if form has meaningful data)
      if (isFormValid()) {
        sessionStorage.setItem('businessDetailsFormData', JSON.stringify(formData));
      }
    };
  }, [hideNavbar, showNavbar]);

  // Save form data to session storage whenever it changes (but not for fresh signups initially)
  useEffect(() => {
    // Only save if we have meaningful form data and there's an active signup session
    const currentSession = sessionStorage.getItem('currentSignupSession');
    const hasFormData = Object.values(formData).some(value => value !== '' && value !== '250000' && value !== 'expansion' && value !== '100000' && value !== '1_week');
    
    if (hasFormData && currentSession) {
      sessionStorage.setItem('businessDetailsFormData', JSON.stringify(formData));
    }
  }, [formData]);

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

  // Fetch company address from Companies House API
  const fetchCompanyAddress = async (companyNumber: string) => {
    try {
      const results = await searchCompanies(companyNumber);
      const company = results.companies?.[0];
      
      if (company?.address?.simpleValue) {
        const addressParts = company.address.simpleValue.split(',').map(part => part.trim());
        return {
          line1: addressParts[0] || '',
          street: addressParts[0] || '',
          city: addressParts[1] || '',
          postal_code: addressParts[addressParts.length - 1] || '',
          country: 'United Kingdom'
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching company address:', error);
      return null;
    }
  };

  // Background function to fetch and save credit score data
  const fetchAndSaveCreditDataBackground = async (companyName: string) => {
    console.log('🔍 Starting background credit score fetch for:', companyName);
    
    if (!user?.uid) {
      console.warn('❌ No user UID available for credit score fetch');
      return;
    }

    try {
      console.log('📊 Fetching credit data from CreditSafe API...');
      
      // Fetch credit data
      const creditResult = await fetchCreditData(companyName, 'GB');
      console.log('📊 Credit data fetch result:', creditResult);
      
      // Check if there was an error (creditResult could have an error property)
      if (creditResult && typeof creditResult === 'object' && 'error' in creditResult) {
        console.warn('❌ Credit data fetch failed:', creditResult.error);
        return;
      }

      console.log('✅ Credit data fetched successfully, normalizing...');
      
      // Normalize and save credit data similar to CreditScorePage
      const normalizedCreditInfo = normalizeCreditScoreData(creditResult);
      console.log('📋 Normalized credit info:', normalizedCreditInfo);
      
      const db = getFirestore();

      // Extract company info from the original credit result
      const companyNumber = creditResult && typeof creditResult === 'object' && 'company_number' in creditResult 
        ? String(creditResult.company_number) 
        : '';

      console.log('💾 Saving to businesses collection...');
      
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

      console.log('✅ Saved to businesses collection successfully');

      // Create the credit score document for the financials subcollection
      const creditScoreDocument = createFinancialsCreditScoreDocument(
        creditResult,
        companyName,
        companyNumber,
        creditResult
      );
      
      console.log('📋 Credit score document to save:', creditScoreDocument);
      console.log('📋 Raw creditResult structure:', JSON.stringify(creditResult, null, 2));

      // Save detailed credit score to financials subcollection using existing utility
      const creditScoreRef = doc(collection(db, "businesses", user.uid, "financials"), "credit_score");
      console.log('💾 Saving to financials subcollection path:', creditScoreRef.path);
      
      await setDoc(creditScoreRef, creditScoreDocument);
      console.log('✅ Saved to financials subcollection successfully');

      // ALSO save to the location that CreditScorePage expects
      const creditScoreLatestRef = doc(collection(db, "businesses", user.uid, "credit_score"), "latest");
      console.log('💾 Also saving to expected path:', creditScoreLatestRef.path);
      
      await setDoc(creditScoreLatestRef, creditScoreDocument);
      console.log('✅ Saved to credit_score/latest path successfully');

      // Set flags for CreditScorePage to know data is ready
      sessionStorage.setItem('credit_data_ready', 'true');
      sessionStorage.setItem('credit_search_company_name', companyName);
      
      console.log('🎉 Background credit score fetch completed successfully!');

    } catch (error) {
      console.error('❌ Background credit score fetch failed:', error);
      console.error('❌ Error details:', error instanceof Error ? error.message : 'Unknown error');
      console.error('❌ Full error object:', error);
      // Don't throw error to avoid interrupting sign-up flow
    }
  };

  // Generate website summary using OpenAI based on URL
  const fetchWebsiteSummary = async (website: string): Promise<string> => {
    try {
      const websiteUrl = website.startsWith('http') ? website : `https://${website}`;
      
      // Extract domain name for additional context
      const domain = new URL(websiteUrl).hostname;
      
      // Use OpenAI to analyze the website URL and generate a summary
      const completion = await openAIClient.chat.completions.create({
        model: "gpt-4",
        messages: [{
          role: "system",
          content: "You are a business analyst. Create a concise, professional 2-3 sentence summary for this business based on their domain name and website URL. Focus on the type of business and its main offering. If the domain name contains descriptive words, use those to inform the summary."
        }, {
          role: "user",
          content: `Please provide a professional business summary based on this website URL: ${websiteUrl}\nDomain name: ${domain}`
        }],
        max_tokens: 150,
        temperature: 0.7
      });

      const summary = completion.choices[0]?.message?.content || '';
      
      if (!summary) {
        // Fallback to a generic summary based on the company name
        return `${searchTerm} is a registered business operating in the ${formData.industry.toLowerCase()} sector.`;
      }

      return summary;
    } catch (error) {
      console.error('Error generating website summary:', error);
      // Fallback to a generic summary if there's an error
      return `${searchTerm} is a registered business operating in the ${formData.industry.toLowerCase()} sector.`;
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
        // Save to users collection
        await setDoc(doc(db, 'users', user.uid), combinedUserData, { merge: true });

        // Prepare business profile data
        const address = formData.companyNumber ? await fetchCompanyAddress(formData.companyNumber) : null;
        
        // Fetch company logo from website
        let logoUrl = '';
        if (formData.website) {
          try {
            const websiteUrl = formData.website.startsWith('http') ? formData.website : `https://${formData.website}`;
            const domain = new URL(websiteUrl).hostname;
            
            // Try direct favicon first
            logoUrl = `https://${domain}/favicon.ico`;
            
            // Fallback to Google's service if direct favicon fails
            const img = new Image();
            img.onerror = () => {
              logoUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
            };
            img.src = logoUrl;
          } catch (error) {
            console.error('Error fetching logo:', error);
          }
        }

        // Generate website summary if website is provided
        let websiteSummary = '';
        if (formData.website) {
          websiteSummary = await fetchWebsiteSummary(formData.website);
        }

        // Save comprehensive business data
        await setDoc(doc(db, 'businesses', user.uid), {
          ...combinedUserData,
          business_name: searchTerm,
          name: searchTerm,
          company_number: formData.companyNumber,
          industry_sector: formData.industry,
          industry: formData.industry,
          company_size: formData.companySize,
          website: formData.website,
          website_summary: websiteSummary,
          description: websiteSummary, // Also save as description for compatibility
          businessDescription: websiteSummary, // Additional field for broader compatibility
          address: address || {},
          logo_url: logoUrl,
          forecastRevenue: formData.forecastRevenue,
          annual_revenue: formData.forecastRevenue,
          updatedAt: serverTimestamp(),
          active: true
        }, { merge: true });

        // Also save to business_profiles for consistency
        await setDoc(doc(db, 'business_profiles', user.uid), {
          business_name: searchTerm,
          company_number: formData.companyNumber,
          industry_sector: formData.industry,
          company_size: formData.companySize,
          website: formData.website,
          website_summary: websiteSummary,
          description: websiteSummary,
          address: address || {},
          logo_url: logoUrl,
          annual_revenue: formData.forecastRevenue,
          updatedAt: serverTimestamp()
        }, { merge: true });
      }

      // Store company name for credit score auto-population
      sessionStorage.setItem('credit_search_company_name', searchTerm);
      
      // Trigger background credit score fetching (don't await it)
      fetchAndSaveCreditDataBackground(searchTerm).catch(error => {
        console.error('Background credit score fetch failed:', error);
        // Don't block the flow if credit score fetch fails
      });
      
      // Continue to the next step in the sign-up journey (Additional Details)
      navigate('/signup-journey/additional-details', {
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
        if (stepIndex === 1) navigate('/signup-journey/business-details', { state: userInfo });
        if (stepIndex === 2) navigate('/signup-journey/additional-details', { state: userInfo });
        if (stepIndex === 3) navigate('/signup-journey/current-funding', { state: userInfo });
        if (stepIndex === 4) navigate('/signup-journey/hmrc-status', { state: userInfo });
        if (stepIndex === 5) navigate('/signup-journey/document-upload', { state: userInfo });
        if (stepIndex === 6) navigate('/signup-journey/lender-preferences', { state: userInfo });
        if (stepIndex === 7) navigate('/signup-journey/application-review', { state: userInfo });
      }}
      onPrevious={handlePrevious}
      onNext={handleNext}
      canGoNext={isFormValid()}
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
          <h2 className="text-xl sm:text-2xl font-bold text-[#2a3441] mb-2">
            Tell us about your business
          </h2>
          <p className="text-gray-600 text-sm sm:text-base md:text-lg">
            We'll use this information to find the best funding opportunities for you.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
          {/* Company Name & Registration Number */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-2 sm:space-y-3">
              <Label htmlFor="companyName" className="text-sm sm:text-base font-semibold text-gray-800">
                Company Name <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 sm:h-5 sm:w-5 z-10" />
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
                  className="pl-10 sm:pl-12 py-2 sm:py-3 h-10 sm:h-12 text-sm sm:text-base bg-white border-2 border-gray-200 rounded-lg sm:rounded-xl focus:border-[#ff8000] focus:ring-2 focus:ring-[#ff8000]/20 transition-all"
                  required
                  autoComplete="off"
                />
                
                {/* Custom Dropdown Results - More mobile friendly */}
                {isCompanyPopoverOpen && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-lg sm:rounded-xl shadow-lg max-h-40 sm:max-h-48 md:max-h-64 overflow-y-auto">
                    {isLoading ? (
                      <div className="flex items-center justify-center py-3 sm:py-4">
                        <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 animate-spin text-[#ff8000]" />
                        <span className="ml-2 text-xs sm:text-sm text-gray-600">Searching...</span>
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div className="py-1">
                        {searchResults.map((company, index) => (
                          <div
                            key={index}
                            onClick={() => selectCompany(company)}
                            onMouseEnter={() => setSelectedIndex(index)}
                            className={`px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-3 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors ${
                              index === selectedIndex 
                                ? 'bg-[#ff8000]/10 border-[#ff8000]/20' 
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full gap-2">
                              <div className="overflow-hidden flex-1">
                                <div className="font-medium text-gray-900 text-xs sm:text-sm md:text-base truncate">{company.name}</div>
                                {company.registrationNumber && (
                                  <div className="text-[10px] sm:text-xs text-gray-500">Reg: {company.registrationNumber}</div>
                                )}
                                {company.address?.simpleValue && (
                                  <div className="text-[10px] sm:text-xs text-gray-500 truncate max-w-[150px] sm:max-w-[200px] md:max-w-full">{company.address.simpleValue}</div>
                                )}
                              </div>
                              <CheckCircle2 className={`h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 ml-1 ${
                                index === selectedIndex ? 'text-[#ff8000]' : 'text-green-500'
                              }`} />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : searchTerm.length >= 2 && !isLoading ? (
                      <div className="py-3 sm:py-4 text-center text-xs sm:text-sm text-gray-500">
                        No companies found. Try a different search term.
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2 sm:space-y-3">
              <Label htmlFor="companyNumber" className="text-sm sm:text-base font-semibold text-gray-800">
                Company Registration Number
              </Label>
              <Input
                type="text"
                id="companyNumber"
                value={formData.companyNumber}
                onChange={(e) => setFormData({ ...formData, companyNumber: e.target.value })}
                placeholder="Auto-filled from search"
                className="py-2 sm:py-3 h-10 sm:h-12 text-sm sm:text-base bg-white border-2 border-gray-200 rounded-lg sm:rounded-xl focus:border-[#ff8000] focus:ring-2 focus:ring-[#ff8000]/20 transition-all"
                readOnly
              />
            </div>
          </div>

          {/* Website */}
          <div className="space-y-2 sm:space-y-3">
            <Label htmlFor="website" className="text-sm sm:text-base font-semibold text-gray-800">
              Company Website <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <div className="absolute left-0 top-0 bottom-0 flex items-center px-2 sm:px-4 bg-gray-100 border-r-2 border-gray-200 rounded-l-lg sm:rounded-l-xl pointer-events-none">
                <span className="text-xs sm:text-sm text-gray-500">https://</span>
              </div>
              <Input
                type="text"
                id="website"
                value={formData.website.replace('https://', '')}
                onChange={(e) => setFormData({ ...formData, website: 'https://' + e.target.value.replace('https://', '') })}
                placeholder="www.yourcompany.com"
                className="pl-[80px] sm:pl-[108px] py-2 sm:py-3 h-10 sm:h-12 text-sm sm:text-base bg-white border-2 border-gray-200 rounded-lg sm:rounded-xl focus:border-[#ff8000] focus:ring-2 focus:ring-[#ff8000]/20 transition-all"
                required
              />
            </div>
          </div>

          {/* Industry and Company Size */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-2 sm:space-y-3">
              <Label htmlFor="industry" className="text-sm sm:text-base font-semibold text-gray-800">
                Industry <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.industry} onValueChange={(value) => setFormData({ ...formData, industry: value })}>
                <SelectTrigger className="py-2 sm:py-3 h-10 sm:h-12 text-sm sm:text-base bg-white border-2 border-gray-200 rounded-lg sm:rounded-xl focus:border-[#ff8000] focus:ring-2 focus:ring-[#ff8000]/20 transition-all">
                  <SelectValue placeholder="Select your industry" />
                </SelectTrigger>
                <SelectContent>
                  {industryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="py-1 sm:py-2 text-sm sm:text-base">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 sm:space-y-3">
              <Label htmlFor="companySize" className="text-sm sm:text-base font-semibold text-gray-800">
                Company Size <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.companySize} onValueChange={(value) => setFormData({ ...formData, companySize: value })}>
                <SelectTrigger className="py-2 sm:py-3 h-10 sm:h-12 text-sm sm:text-base bg-white border-2 border-gray-200 rounded-lg sm:rounded-xl focus:border-[#ff8000] focus:ring-2 focus:ring-[#ff8000]/20 transition-all">
                  <SelectValue placeholder="Select company size" />
                </SelectTrigger>
                <SelectContent>
                  {companySizeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="py-1 sm:py-2 text-sm sm:text-base">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Forecast Revenue */}
          <div className="space-y-2 sm:space-y-3">
            <Label htmlFor="forecastRevenue" className="text-sm sm:text-base font-semibold text-gray-800">
              Annual Revenue Forecast <span className="text-red-500">*</span>
            </Label>
            <Select value={formData.forecastRevenue} onValueChange={(value) => setFormData({ ...formData, forecastRevenue: value })}>
              <SelectTrigger className="py-2 sm:py-3 h-10 sm:h-12 text-sm sm:text-base bg-white border-2 border-gray-200 rounded-lg sm:rounded-xl focus:border-[#ff8000] focus:ring-2 focus:ring-[#ff8000]/20 transition-all">
                <SelectValue placeholder="Select revenue range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50000" className="py-1 sm:py-2 text-sm sm:text-base">Under £50k</SelectItem>
                <SelectItem value="100000" className="py-1 sm:py-2 text-sm sm:text-base">£50k - £100k</SelectItem>
                <SelectItem value="250000" className="py-1 sm:py-2 text-sm sm:text-base">£100k - £250k</SelectItem>
                <SelectItem value="500000" className="py-1 sm:py-2 text-sm sm:text-base">£250k - £500k</SelectItem>
                <SelectItem value="1000000" className="py-1 sm:py-2 text-sm sm:text-base">£500k - £1M</SelectItem>
                <SelectItem value="2500000" className="py-1 sm:py-2 text-sm sm:text-base">£1M - £2.5M</SelectItem>
                <SelectItem value="5000000" className="py-1 sm:py-2 text-sm sm:text-base">£2.5M - £5M</SelectItem>
                <SelectItem value="10000000" className="py-1 sm:py-2 text-sm sm:text-base">£5M+</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center sm:justify-end pt-4 sm:pt-6">
            <Button
              type="submit"
              disabled={!isFormValid()}
              className="w-full sm:w-auto bg-gradient-to-r from-[#ff8000] to-[#ff6000] hover:from-[#e67300] hover:to-[#e55a00] text-white px-4 sm:px-6 md:px-10 py-2 sm:py-3 md:py-4 text-sm sm:text-base md:text-lg rounded-lg sm:rounded-xl md:rounded-full font-medium shadow-md transition-all hover:shadow-lg hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              Continue
              <ArrowRight className="ml-1 sm:ml-2 h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
            </Button>
          </div>
        </form>
      </div>
    </SignUpLayout>
  );
};

export default BusinessDetailsForm;
