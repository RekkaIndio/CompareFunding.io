import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, ArrowRight, Search, Check, Loader2, CheckCircle2 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import PageLayout from '@/components/PageLayout';
import { useNavbar } from '@/contexts/NavbarContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import SignUpSidebar from '@/components/SignUpSidebar';
import cflogowhiteUrl from '@/assets/cflogowhite.png';
import { fetchCreditData, summarizeWebsite, fetchWebsiteLogo, searchCompanies } from '@/lib/businessDetailsUtils';
import { normalizeCreditScoreData, createFinancialsCreditScoreDocument } from '@/lib/creditScoreUtils';
import { saveFundingApplication, updateDocument, getDocument, createDocument } from '@/services/firebase'; // Import getDocument and createDocument
import { useAuth } from '@/contexts/AuthContext'; // Import authentication context
import { getFirestore, doc, setDoc, collection, serverTimestamp } from 'firebase/firestore';
import OpenAI from "openai";
import '../../styles/animations.css'; // Import animations
import { 
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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

// We're now using the imported normalizeCreditScoreData function from creditScoreUtils.ts

const BusinessDetailsForm = () => {
  const { user } = useAuth(); // Get user from authentication context
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
    businessDescription: '',
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

  useEffect(() => {
    hideNavbar();
    return () => {
      showNavbar();
    };
  }, [hideNavbar, showNavbar]);

  useEffect(() => {
    if (!userInfo.userId && user?.uid) {
      setUserInfo((prev) => ({ ...prev, userId: user.uid })); // Safely update userInfo
    }
  }, [userInfo, user]);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (searchValue: string) => {
      if (searchValue.length >= 3) {
        setIsLoading(true);
        try {
          const result = await searchCompanies(searchValue);
          setSearchResults(result.companies || []);
        } catch (error) {
          console.error('Error searching for companies:', error);
          setSearchResults([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 500),
    []
  );

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    debouncedSearch(value);
  };

  // Handle company selection
  const handleCompanySelect = (company: {
    name: string;
    connectId?: string;
    id?: string;
    registrationNumber?: string;
    address?: { simpleValue?: string };
  }) => {
    setFormData(prev => ({
      ...prev,
      companyName: company.name,
      companyNumber: company.registrationNumber || '' // Store company number from selection
    }));
    setSearchTerm(company.name);
    setIsCompanyPopoverOpen(false);
    
    console.log('Selected company:', company);
    console.log('Company registration number:', company.registrationNumber || 'Not available');
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Function to view credit report in a new tab
  const viewCreditReport = () => {
    // Only proceed if we have a company name
    if (!formData.companyName) {
      alert("Please enter a company name first");
      return;
    }
    
    // Make sure we have the flags set for the credit report page to know the context
    sessionStorage.setItem('from_business_form', 'true');
    sessionStorage.setItem('credit_search_company_name', formData.companyName);
    sessionStorage.setItem('credit_search_company_number', formData.companyNumber || '');
    
    // Open credit score page in a new tab
    window.open('/credit-score?companyName=' + encodeURIComponent(formData.companyName), '_blank');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      console.log('Submitting business details with formData:', formData);
      console.log('User info:', userInfo);

      if (!userInfo.userId) {
        throw new Error('User ID is missing. Please ensure you are logged in.');
      }

      // Fetch credit data
      const creditData = await fetchCreditData(formData.companyName) as { 
        error?: string; 
        connectId?: string; 
        address?: string; 
        report?: any;
        company?: any;
        [key: string]: any 
      };

      console.log('Credit data fetched:', creditData);

      // Log the full creditData to verify its structure
      console.log('Full creditData:', creditData);
      
      // Try to extract company registration number if not already set
      let companyNumber = formData.companyNumber;
      if (!companyNumber || companyNumber.trim() === '') {
        // Try to get it from credit report
        companyNumber = creditData?.report?.companyIdentification?.basicInformation?.companyRegistrationNumber || 
                         creditData?.report?.companySummary?.companyRegistrationNumber ||
                         creditData?.company?.registrationNumber || '';
                         
        if (companyNumber) {
          console.log('Retrieved company number from credit report:', companyNumber);
          setFormData(prev => ({
            ...prev,
            companyNumber: companyNumber
          }));
        }
      }

      // Initialize credit info with default values
      let creditInfo = {
        credit_score: null,
        risk: null,
        status: null,
        international_value: null,
        credit_limit: null,
        negative_information: null,
        error: creditData.error || null
      };

      // If we successfully got credit data without errors, extract the information
      if (!creditData.error && creditData.report) {
        creditInfo = {
          credit_score: creditData.report?.creditScore?.currentCreditRating?.providerValue?.value || null,
          risk: creditData.report?.creditScore?.currentCreditRating?.commonDescription || null,
          status: creditData.report?.companyIdentification?.basicInformation?.companyStatus?.description || null,
          international_value: creditData.report?.creditScore?.currentCreditRating?.internationalScore?.value || null,
          credit_limit: creditData.report?.creditScore?.currentCreditRating?.creditLimit?.value || null,
          negative_information: creditData.report?.additionalInformation?.negativeInformation || null,
          error: null
        };
      }
      
      console.log('Credit info prepared:', creditInfo);

      // Summarize website content using OpenAI
      let websiteSummary = '';
      if (formData.website) {
        try {
          const completion = await openAIClient.chat.completions.create({
            model: "gpt-4o-search-preview",
            web_search_options: {},
            messages: [{
              role: "user",
              content: `Summarise what this website does and what the business does: ${formData.website}`,
            }],
          });
          websiteSummary = completion.choices[0].message.content;
          console.log('Website summary fetched:', websiteSummary);
        } catch (error) {
          console.error('Error summarizing website:', error);
        }
      }

      // Fetch website logo
      const websiteLogo = await fetchWebsiteLogo(formData.website);
      console.log('Website logo fetched:', websiteLogo);

      // Extract mainAddress from the correct path in creditData
      const mainAddress = creditData?.report?.contactInformation?.mainAddress || {};
      console.log('Extracted mainAddress:', mainAddress);
      
      // creditInfo is already defined above, no need to redefine it

      // Prepare address data for storage
      const addressData = {
        street: mainAddress.street || '',
        house_number: mainAddress.houseNumber || '',
        city: mainAddress.city || '',
        postal_code: mainAddress.postalCode || '',
        country: mainAddress.country || '',
      };

      // Log address data for debugging
      console.log('Address data prepared:', addressData);

      // Only save to businesses collection under the userId
      const db = getFirestore();
      try {
        // Normalize credit info for consistent structure
        const normalizedCreditInfo = normalizeCreditScoreData(creditInfo);

        // Create or update the main business document with all the business profile data
        const businessDocRef = doc(db, "businesses", userInfo.userId);
        await setDoc(businessDocRef, {
          name: formData.companyName,
          business_name: formData.companyName,
          company_number: companyNumber, // Use the companyNumber variable that might have been updated from the credit report
          company_size: formData.companySize,
          website: formData.website,
          website_summary: websiteSummary,
          logo_url: websiteLogo,
          address: addressData,
          credit_info: normalizedCreditInfo, // Embed normalized credit info directly in the document
          user_id: userInfo.userId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          active: true,
          _dataVersion: '1.0'
        }, { merge: true });
        console.log('Business document updated successfully in businesses collection.');

        // Save detailed credit score in the credit_score subcollection (not financials!)
        const creditScoreDocRef = doc(db, "businesses", userInfo.userId, "credit_score", "latest");
        await setDoc(creditScoreDocRef, {
          ...normalizedCreditInfo,
          raw_report: creditData.report || null,
          company_name: formData.companyName,
          company_number: companyNumber,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        console.log('Credit score data saved to businesses/{userId}/credit_score/latest document.');
      } catch (error) {
        console.error('Error saving to businesses collection:', error);
        // Continue with the process even if this part fails
      }

      // Save a flag in sessionStorage to indicate we're coming from the business form
      // This will be used when the user later visits the credit score page
      sessionStorage.setItem('from_business_form', 'true');
      
      // Store the company information in sessionStorage for later use in credit score page
      sessionStorage.setItem('credit_search_company_name', formData.companyName);
      sessionStorage.setItem('credit_search_company_number', companyNumber);

      // Continue with the sign-up journey by navigating to the eligibility page
      navigate('/signup-journey/eligibility', {
        state: {
          ...userInfo,
          businessDetails: formData,
          fromBusinessDetails: true // Flag to indicate navigation from BusinessDetailsForm
        },
      });
    } catch (error) {
      console.error('Error submitting business details:', error);
      alert('An error occurred while submitting your business details. Please try again.');
    }
  };

  // Progress bar and navigation steps config
  const steps = [
    { label: 'Email & Password', path: '/signup-journey/email-password' },
    { label: 'Funding Amount', path: '/signup-journey/apply' },
    { label: 'Funding Matches', path: '/signup-journey/funding-matches' },
    { label: 'Business Details', path: '/signup-journey/business-details' },
    { label: 'Eligibility', path: '/signup-journey/eligibility' },
  ];
  const [currentStep] = useState<number>(3); // Updated to reflect the new step order

  // Navigation handlers
  const goToStep = (stepIdx: number) => {
    if (stepIdx === 0) navigate('/signup-journey/email-password', { state: userInfo });
    if (stepIdx === 1) navigate('/signup-journey/apply', { state: userInfo });
    if (stepIdx === 2) navigate('/signup-journey/funding-matches', { state: userInfo });
    if (stepIdx === 4) navigate('/signup-journey/eligibility', { 
      state: {
        ...userInfo,
        fromBusinessDetails: true // Flag to indicate navigation from BusinessDetailsForm
      }
    });
  };

  return (
    <div className="bg-white min-h-screen">
      <PageLayout>
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Main Form Section */}
            <div className="lg:col-span-8">
              {/* Progress Bar & Steps */}
              <div className="mb-10">
                <div className="flex items-center gap-2 mb-2">
                  {steps.map((step, idx) => (
                    <div
                      key={step.label}
                      className={`flex-1 h-2 rounded ${idx <= currentStep ? 'bg-[#ff8000]' : 'bg-gray-300'}`}
                    ></div>
                  ))}
                </div>
                <div className="grid grid-cols-5 text-center text-sm font-medium text-[#2a3441]">
                  {steps.map((step, idx) => (
                    <span key={step.label} className={idx === currentStep ? 'font-bold text-[#ff8000]' : ''}>{step.label}</span>
                  ))}
                </div>
              </div>

              {/* Navigation Arrows */}
              <div className="flex justify-between items-center mb-6">
                <button
                  type="button"
                  onClick={() => goToStep(currentStep - 1)}
                  disabled={currentStep === 0}
                  className={`flex items-center gap-1 px-4 py-2 rounded-full border border-gray-200 bg-white text-[#2a3441] hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => goToStep(currentStep + 1)}
                  disabled={currentStep === steps.length - 1}
                  className={`flex items-center gap-1 px-4 py-2 rounded-full border border-gray-200 bg-white text-[#2a3441] hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  Next
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>

              {/* Form Card */}
              <div className="max-w-4xl mx-auto">
                <Card className="p-8 border border-[#e5e7eb] shadow-sm rounded-2xl bg-white">
                  <h2 className="text-xl font-semibold text-[#2a3441] mb-6">
                    Provide your business details:
                  </h2>
                  <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      {/* Company Name with Autocomplete */}
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="companyName" className="text-[#2a3441] font-medium">
                          Company Name:
                        </Label>
                        <Popover open={isCompanyPopoverOpen} onOpenChange={setIsCompanyPopoverOpen}>
                          <PopoverTrigger asChild>
                            <div className="relative">
                              <Input
                                id="companyName"
                                value={searchTerm}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setSearchTerm(value);
                                  handleSearchChange(value);
                                  handleChange('companyName', value);
                                  if (value.length >= 3) {
                                    setIsCompanyPopoverOpen(true);
                                  }
                                }}
                                className="bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-[#ff8000] text-[#2a3441]"
                                placeholder="Start typing company name..."
                                required
                              />
                              {searchTerm.length >= 3 && (
                                <button 
                                  type="button"
                                  className="absolute right-3 top-1/2 transform -translate-y-1/2" 
                                  onClick={() => setIsCompanyPopoverOpen(!isCompanyPopoverOpen)}
                                >
                                  {isLoading ? (
                                    <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
                                  ) : (
                                    <Search className="h-5 w-5 text-gray-400" />
                                  )}
                                </button>
                              )}
                            </div>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0" align="start">
                            <Command>
                              <CommandList>
                                {searchResults.length === 0 && !isLoading ? (
                                  <CommandEmpty>No companies found.</CommandEmpty>
                                ) : (
                                  <CommandGroup heading="Companies">
                                    {isLoading ? (
                                      <div className="flex items-center justify-center py-6">
                                        <Loader2 className="h-6 w-6 text-[#ff8000] animate-spin" />
                                      </div>
                                    ) : (
                                      searchResults.map((company, index) => (
                                        <CommandItem
                                          key={company.id || company.connectId || index}
                                          value={company.name}
                                          onSelect={() => handleCompanySelect(company)}
                                          className="flex items-start py-2"
                                        >
                                          <div>
                                            <p className="font-medium">{company.name}</p>
                                            {company.registrationNumber && (
                                              <p className="text-sm text-gray-500">Reg: {company.registrationNumber}</p>
                                            )}
                                            {company.address?.simpleValue && (
                                              <p className="text-xs text-gray-400 truncate max-w-[300px]">
                                                {company.address.simpleValue}
                                              </p>
                                            )}
                                          </div>
                                        </CommandItem>
                                      ))
                                    )}
                                  </CommandGroup>
                                )}
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* Company Number (Read only, displayed when company is selected) */}
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="companyNumberDisplay" className="text-[#2a3441] font-medium flex items-center">
                          Company Number:
                          {formData.companyNumber && (
                            <span className="ml-2 text-xs text-green-600 flex items-center">
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Auto-retrieved
                            </span>
                          )}
                        </Label>
                        <div className="relative">
                          <Input
                            id="companyNumberDisplay"
                            value={formData.companyNumber || "Auto-retrieved from company search"}
                            className={`bg-gray-50 border ${formData.companyNumber ? 'border-green-300' : 'border-gray-300'} rounded-md text-[#2a3441] cursor-not-allowed`}
                            readOnly
                            disabled
                          />
                          {formData.companyNumber && (
                            <CheckCircle2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-600" />
                          )}
                        </div>
                      </div>

                      {/* Website */}
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="website" className="text-[#2a3441] font-medium">
                          Website:
                        </Label>
                        <Input
                          id="website"
                          value={formData.website}
                          onChange={(e) => handleChange('website', e.target.value)}
                          className="bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-[#ff8000] text-[#2a3441]"
                        />
                      </div>

                      {/* Forecast Revenue */}
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="forecastRevenue" className="text-[#2a3441] font-medium">
                          Forecast Revenue:
                        </Label>
                        <Input
                          id="forecastRevenue"
                          value={`£${Number(formData.forecastRevenue).toLocaleString()}`}
                          onChange={(e) => handleChange('forecastRevenue', e.target.value.replace(/[^0-9]/g, ''))}
                          className="bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-[#ff8000] text-[#2a3441]"
                          required
                        />
                      </div>

                      {/* Industry */}
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="industry" className="text-[#2a3441] font-medium">
                          Industry:
                        </Label>
                        <Select
                          value={formData.industry}
                          onValueChange={(value) => handleChange('industry', value)}
                        >
                          <SelectTrigger className="bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-[#ff8000] text-[#2a3441]">
                            <SelectValue placeholder="Select industry" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border border-[#ff8000]">
                            {industryOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Company Size */}
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="companySize" className="text-[#2a3441] font-medium">
                          Company Size:
                        </Label>
                        <Select
                          value={formData.companySize}
                          onValueChange={(value) => handleChange('companySize', value)}
                        >
                          <SelectTrigger className="bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-[#ff8000] text-[#2a3441]">
                            <SelectValue placeholder="Select size" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border border-[#ff8000]">
                            {companySizeOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Business Description */}
                    <div className="mb-10">
                      <Label htmlFor="businessDescription" className="text-[#2a3441] font-medium block mb-2">
                        Business Description:
                      </Label>
                      <Textarea
                        id="businessDescription"
                        value={formData.businessDescription}
                        onChange={(e) => handleChange('businessDescription', e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded-md p-4 text-[#2a3441] focus:ring-2 focus:ring-[#ff8000]"
                        placeholder="Tell us about your business..."
                        required
                      />
                    </div>

                    {/* Submit and View Credit Report Buttons */}
                    <div className="flex justify-between items-center">
                      <Button
                        type="button"
                        onClick={viewCreditReport}
                        className="bg-white border border-[#ff8000] text-[#ff8000] hover:bg-[#fff8f0] px-6 py-3 text-lg rounded-full font-medium shadow transition-transform hover:scale-[1.02]"
                      >
                        View Credit Report
                      </Button>
                      <Button
                        type="submit"
                        className="bg-[#ff8000] hover:bg-[#e67300] text-white px-10 py-4 text-lg rounded-full font-medium shadow transition-transform hover:scale-[1.02]"
                      >
                        Submit
                      </Button>
                    </div>
                  </form>
                </Card>
              </div>
            </div>

            {/* Sidebar Column - Modular and tailored for this step */}
            <div className="lg:col-span-4 flex flex-col h-full p-0 m-0">
              <SignUpSidebar
                title="Why Business Details?"
                description="We ask for your business details to match you with the most relevant funding options. Accurate information helps us find the best offers tailored to your business profile."
                highlight="Your details are secure and only shared with trusted lenders."
                tips={[
                  'Filling out all fields increases your chances of better matches.',
                  'We use this information to pre-fill future applications and save you time.',
                  'You can update your business profile at any time.'
                ]}
              />
            </div>
          </div>
        </div>
      </PageLayout>
    </div>
  );
};

export default BusinessDetailsForm;