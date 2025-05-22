import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import PageLayout from '@/components/PageLayout';
import { useNavbar } from '@/contexts/NavbarContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import cflogowhiteUrl from '@/assets/cflogowhite.png';
import { Check } from 'lucide-react';
import { fetchCreditData, summarizeWebsite, fetchWebsiteLogo } from '@/lib/businessDetailsUtils';
import { saveFundingApplication, updateDocument, getDocument, createDocument } from '@/services/firebase'; // Import getDocument and createDocument
import { useAuth } from '@/contexts/AuthContext'; // Import authentication context
import OpenAI from "openai";

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

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
      const creditData = await fetchCreditData(formData.companyName) as { connectId?: string; address?: string; [key: string]: any };

      console.log('Credit data fetched:', creditData);

      // Log the full creditData to verify its structure
      console.log('Full creditData:', creditData);

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

      // Extract credit information from creditData
      const creditInfo = {
        credit_score: creditData?.report?.creditScore?.currentCreditRating?.providerValue?.value || null,
        risk: creditData?.report?.creditScore?.currentCreditRating?.commonDescription || null,
        status: creditData?.report?.companyIdentification?.basicInformation?.companyStatus?.description || null,
        international_value: creditData?.report?.creditScore?.currentCreditRating?.internationalScore?.value || null,
        credit_limit: creditData?.report?.creditScore?.currentCreditRating?.creditLimit?.value || null,
        negative_information: creditData?.report?.additionalInformation?.negativeInformation || null,
      };

      // Include credit information in the business profile data
      const businessProfileData = {
        business_name: formData.companyName,
        company_number: formData.companyNumber,
        company_size: formData.companySize,
        address: {
          street: mainAddress.street || '',
          house_number: mainAddress.houseNumber || '',
          city: mainAddress.city || '',
          postal_code: mainAddress.postalCode || '',
          country: mainAddress.country || '',
        },
        website: formData.website,
        logo_url: websiteLogo, // Include the logo URL
        website_summary: websiteSummary, // Include the website summary
        credit_info: creditInfo, // Include the credit information
      };

      // Log the businessProfileData to verify the address mapping
      console.log('Business profile data to be saved:', businessProfileData);

      // Check if the document exists
      console.log('Checking if business profile document exists for user ID:', userInfo.userId);
      const existingProfile = await getDocument('business_profiles', userInfo.userId);
      console.log('getDocument response for user ID:', userInfo.userId, existingProfile);

      if (existingProfile && existingProfile.data) {
        console.log('Existing business profile found:', existingProfile.data);
        await updateDocument('business_profiles', userInfo.userId, businessProfileData);
        console.log('Business profile updated successfully.');
      } else {
        console.log('No existing business profile found. Creating a new one.');
        await createDocument('business_profiles', businessProfileData, userInfo.userId);
        console.log('Business profile created successfully.');
      }

      // Save a flag in sessionStorage to indicate we're coming from the business form
      // This will be used when the user later visits the credit score page
      sessionStorage.setItem('from_business_form', 'true');
      
      // Store the company information in sessionStorage for later use in credit score page
      sessionStorage.setItem('credit_search_company_name', formData.companyName);
      sessionStorage.setItem('credit_search_company_number', formData.companyNumber);

      // Continue with the sign-up journey by navigating to the eligibility page
      navigate('/signup-journey/eligibility', {
        state: {
          ...userInfo,
          businessDetails: formData,
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
    if (stepIdx === 4) navigate('/signup-journey/eligibility', { state: userInfo });
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
                      {/* Fields */}
                      {[
                        ['Company Name', 'companyName'],
                        ['Company Number', 'companyNumber'],
                        ['Website', 'website'],
                        ['Forecast Revenue', 'forecastRevenue'],
                      ].map(([label, key]) => (
                        <div key={key} className="flex flex-col gap-2">
                          <Label htmlFor={key} className="text-[#2a3441] font-medium">
                            {label}:
                          </Label>
                          <Input
                            id={key}
                            value={key === 'forecastRevenue' ? `£${Number(formData[key]).toLocaleString()}` : formData[key]}
                            onChange={(e) =>
                              handleChange(
                                key,
                                key === 'forecastRevenue'
                                  ? e.target.value.replace(/[^0-9]/g, '')
                                  : e.target.value
                              )
                            }
                            className="bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-[#ff8000] text-[#2a3441]"
                            required={key !== 'website'}
                          />
                        </div>
                      ))}

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

                    {/* Submit */}
                    <div className="flex justify-center">
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

            {/* Sidebar Column */}
            <div className="lg:col-span-4 flex flex-col h-full p-0 m-0">
              <div
                className="flex flex-col items-center bg-[#2a3441] h-[100vh] fixed right-0 top-0 bottom-0 w-full lg:w-[33.333333%] z-10 p-0 m-0"
              >
                <div className="flex flex-col items-center justify-center w-full h-full" style={{ flex: 1 }}>
                  <img src={cflogowhiteUrl} alt="Compare Funding Logo" className="h-20 mb-12" style={{ maxWidth: '220px' }} />
                  <div className="flex flex-col justify-center w-full" style={{ flex: 1 }}>
                    <Card className="bg-white p-6 shadow-md border border-gray-100 mb-6">
                      <h3 className="text-xl font-bold text-[#2a3441] mb-4">Business funding options. Simplified.</h3>
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                            <Check className="h-4 w-4 text-primary" />
                          </div>
                          <p className="text-[#2a3441]">1 application unlimited options</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                            <Check className="h-4 w-4 text-primary" />
                          </div>
                          <p className="text-[#2a3441]">Fast track your access to funds</p>
                        </div>
                      </div>
                    </Card>
                    <Card className="bg-white p-6 border border-primary">
                      <div className="text-center">
                        <h3 className="text-xl font-bold mb-3 text-[#2a3441]">Trust Pilot</h3>
                        <div className="flex justify-center mb-2">
                          {[...Array(5)].map((_, i) => (
                            <svg key={i} className="w-5 h-5 text-primary fill-current" viewBox="0 0 24 24">
                              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                            </svg>
                          ))}
                        </div>
                        <p className="font-semibold text-[#2a3441]">4.8/5 rating</p>
                      </div>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageLayout>
    </div>
  );
};

export default BusinessDetailsForm;