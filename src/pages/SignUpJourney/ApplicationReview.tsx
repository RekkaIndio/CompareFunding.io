import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNavbar } from '@/contexts/NavbarContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import SignUpLayout from '@/components/SignUpLayout';
import { createDocument, getDocument } from '@/firebase';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { generateApplicationNumber } from '@/lib/applicationUtils';
import mailgunService from '@/services/mailgunService';
import { 
  CheckCircle, 
  AlertTriangle,
  FileText,
  Building2,
  PoundSterling,
  User,
  Shield,
  BarChart4,
  PieChart,
  Loader2,
  ArrowLeft,
  Receipt,
  Calculator
} from 'lucide-react';

const ApplicationReview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showNavbar, hideNavbar } = useNavbar();
  const { user } = useAuth();
  const [userInfo, setUserInfo] = useState(location.state || {});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [creditData, setCreditData] = useState<any>(null);
  const [companyAge, setCompanyAge] = useState<number | null>(null);
  
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
  const currentStep = 7;

  useEffect(() => {
    hideNavbar();
    
    // Load all saved form data from session storage to ensure complete data
    const currentSession = sessionStorage.getItem('currentSignupSession');
    if (currentSession) {
      let mergedData = { ...userInfo };
      
      // Load business details
      const businessData = sessionStorage.getItem('businessDetailsFormData');
      if (businessData) {
        try {
          mergedData = { ...mergedData, ...JSON.parse(businessData) };
        } catch (error) {
          console.error('Error parsing business details data:', error);
        }
      }
      
      // Load additional details
      const additionalData = sessionStorage.getItem('additionalDetailsFormData');
      if (additionalData) {
        try {
          mergedData = { ...mergedData, ...JSON.parse(additionalData) };
        } catch (error) {
          console.error('Error parsing additional details data:', error);
        }
      }
      
      // Load current funding data
      const fundingData = sessionStorage.getItem('currentFundingFormData');
      if (fundingData) {
        try {
          mergedData = { ...mergedData, ...JSON.parse(fundingData) };
        } catch (error) {
          console.error('Error parsing funding data:', error);
        }
      }
      
      // Load HMRC status data
      const hmrcData = sessionStorage.getItem('hmrcStatusFormData');
      if (hmrcData) {
        try {
          mergedData = { ...mergedData, ...JSON.parse(hmrcData) };
        } catch (error) {
          console.error('Error parsing HMRC data:', error);
        }
      }
      
      // Load document upload data
      const documentData = sessionStorage.getItem('documentUploadFormData');
      if (documentData) {
        try {
          mergedData = { ...mergedData, ...JSON.parse(documentData) };
        } catch (error) {
          console.error('Error parsing document data:', error);
        }
      }
      
      // Load lender preferences data
      const lenderData = sessionStorage.getItem('lenderPreferencesFormData');
      if (lenderData) {
        try {
          mergedData = { ...mergedData, ...JSON.parse(lenderData) };
        } catch (error) {
          console.error('Error parsing lender preferences data:', error);
        }
      }
      
      setUserInfo(mergedData);
    }
    
    // Fetch credit data to get company age
    const fetchCreditData = async () => {
      if (!user?.uid) return;
      
      try {
        // Try to get credit data from the credit_score subcollection first
        const creditScoreDoc = await getDocument('businesses', `${user.uid}/credit_score/latest`);
        
        if (creditScoreDoc?.data) {
          setCreditData(creditScoreDoc.data);
          
          // Calculate company age from incorporation date
          const incorporationDate = 
            creditScoreDoc.data.raw_data?.report?.companyIdentification?.basicInformation?.companyRegistrationDate ||
            creditScoreDoc.data.data?.incorporation_date ||
            creditScoreDoc.data.data?.registration_date ||
            creditScoreDoc.data.incorporation_date ||
            creditScoreDoc.data.registration_date;
            
          if (incorporationDate) {
            const incorpDate = new Date(incorporationDate);
            const now = new Date();
            const ageInYears = Math.floor((now.getTime() - incorpDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
            setCompanyAge(ageInYears);
          }
        } else {
          // Fallback to businesses collection
          const businessDoc = await getDocument('businesses', user.uid);
          if (businessDoc?.data?.credit_info) {
            setCreditData(businessDoc.data.credit_info);
            
            const incorporationDate = 
              businessDoc.data.credit_info.incorporation_date ||
              businessDoc.data.credit_info.registration_date;
              
            if (incorporationDate) {
              const incorpDate = new Date(incorporationDate);
              const now = new Date();
              const ageInYears = Math.floor((now.getTime() - incorpDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
              setCompanyAge(ageInYears);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching credit data:', error);
      }
    };
    
    fetchCreditData();
    
    return () => {
      showNavbar();
    };
  }, [hideNavbar, showNavbar, user?.uid]);

  const handlePrevious = () => {
    navigate('/signup-journey/lender-preferences', { state: userInfo });
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
        // Current page
        break;
    }
  };

  const submitApplication = async () => {
    // Show the confirmation modal instead of submitting directly
    setShowSubmitModal(true);
  };



  // Create new function for actual submission that gets called from the modal
  const processApplicationSubmit = async () => {
    if (!user || !userInfo) {
      toast.error("Missing user information. Please try again or log in again.");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Clean and validate data before submission to prevent undefined values
      const cleanAndValidate = (value: any, defaultValue: any) => {
        // Check for undefined/null
        if (value === undefined || value === null) {
          return defaultValue;
        }
        
        // Check for File objects (not supported by Firestore)
        if (value instanceof File) {
          return { 
            fileName: value.name,
            fileType: value.type,
            fileSize: value.size,
            lastModified: value.lastModified
          };
        }
        
        // Check for arrays with possible File objects
        if (Array.isArray(value)) {
          return value.map(item => cleanAndValidate(item, {}));
        }
        
        // Check for objects that might contain File objects
        if (typeof value === 'object' && value !== null) {
          const cleanedObj: any = {};
          Object.keys(value).forEach(key => {
            if (key !== 'file' && key !== 'raw_data') { // Skip 'file' and 'raw_data' properties entirely
              cleanedObj[key] = cleanAndValidate(value[key], value[key] instanceof Object ? {} : '');
            }
          });
          return cleanedObj;
        }
        
        return value;
      };
      
      // Format the application data from signup journey
      const applicationData = {
        user_id: user.uid,
        business_id: user.uid, // Using the user's ID as the business ID
        application_number: generateApplicationNumber(userInfo.companyNumber), // Generate unique application number with company number
        status: 'submitted', // Setting as submitted directly
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        
        // Business information
        business_name: cleanAndValidate(userInfo.companyName || userInfo.businessName, ''),
        company_number: cleanAndValidate(userInfo.companyNumber, ''),
        industry: cleanAndValidate(userInfo.industry, ''),
        company_size: cleanAndValidate(userInfo.companySize, ''),
        annual_revenue: cleanAndValidate(parseFloat(userInfo.forecastRevenue || userInfo.annualRevenue || '0'), 0),
        website: cleanAndValidate(userInfo.website, ''),
        years_trading: cleanAndValidate(companyAge !== null ? companyAge : parseInt(userInfo.yearsTrading || userInfo.companyAge || '0', 10), 0),
        
        // Contact information
        contact_name: cleanAndValidate(userInfo.fullName || user.displayName, ''),
        contact_email: cleanAndValidate(user.email, ''),
        contact_phone: cleanAndValidate(userInfo.phoneNumber, ''),
        contact_role: cleanAndValidate(userInfo.role, ''),
        
        // Funding requirements
        product_type: cleanAndValidate(userInfo.selectedProduct, ''),
        purpose: cleanAndValidate(userInfo.fundingPurpose, ''),
        loan_amount: cleanAndValidate(parseFloat(userInfo.fundingAmount || '0'), 0),
        loan_term_months: cleanAndValidate(parseInt(userInfo.fundingTimeframe || '12', 10), 12),
        
        // Additional information
        additional_info: cleanAndValidate(userInfo.additionalInfo, ''),
        
        // HMRC status - properly map the collected data structure
        hmrc_status: {
          isUpToDate: cleanAndValidate(userInfo.isUpToDate, ''),
          vatDetails: cleanAndValidate(userInfo.vatDetails, { amount: '', timeToPay: '', details: '' }),
          corpTaxDetails: cleanAndValidate(userInfo.corpTaxDetails, { amount: '', timeToPay: '', details: '' }),
          payeDetails: cleanAndValidate(userInfo.payeDetails, { amount: '', timeToPay: '', details: '' })
        },

        // Current funding details
        current_funding: {
          hasCurrentFunding: cleanAndValidate(userInfo.hasCurrentFunding, ''),
          fundingDetails: cleanAndValidate(userInfo.fundingDetails, [])
        },
        
        // Lender preferences
        lender_preferences: {
          shouldAvoidLenders: cleanAndValidate(userInfo.shouldAvoidLenders, 'no'),
          lendersToAvoid: cleanAndValidate(userInfo.lendersToAvoid, [])
        },
        
        // Documents - Strip out File objects which can't be stored in Firestore
        documents: Array.isArray(userInfo.documents) 
          ? userInfo.documents.map(doc => {
              if (!doc) return null;
              return {
                id: doc.id || '',
                name: doc.name || '',
                required: !!doc.required,
                description: doc.description || '',
                uploaded: !!doc.uploaded,
                fileName: doc.file && doc.file.name ? doc.file.name : null
                // file property is intentionally excluded as it can't be stored in Firestore
              };
            }).filter(Boolean)
          : [],
        document_sharing: {
          invitedColleague: cleanAndValidate(userInfo.shouldInviteColleague === 'yes', false),
          colleagueEmail: cleanAndValidate(userInfo.colleagueEmail, ''),
          colleagueMessage: cleanAndValidate(userInfo.colleagueMessage, '')
        },
        
        // Set completeness to 100%
        completeness_percentage: 100
      };
      
      // Log the application data for debugging (remove in production)
      console.log("Application data being submitted:", applicationData);
      
      // Final safety check - stringify and parse to remove any non-serializable objects
      const safeApplicationData = JSON.parse(JSON.stringify(applicationData));
      
      // Create the application in Firestore
      const { data: newApplication, error } = await createDocument('applications', safeApplicationData);
      
      if (error) {
        console.error("Error from createDocument:", error);
        throw new Error(`Failed to create application: ${error.message}`);
      }

      // Also save the complete application data to the user's profile for future reference
      const db = getFirestore();
      await setDoc(doc(db, 'users', user.uid), {
        // Only save clean, serializable data (no userInfo spread which contains File objects)
        email: user.email,
        displayName: user.displayName,
        // Application submission data
        latestApplication: {
          applicationId: newApplication.id,
          applicationNumber: safeApplicationData.application_number,
          submittedAt: new Date().toISOString(),
          status: 'submitted'
        },
        // Complete business profile from the safe application data
        businessProfile: {
          businessName: safeApplicationData.business_name,
          companyNumber: safeApplicationData.company_number,
          industry: safeApplicationData.industry,
          companySize: safeApplicationData.company_size,
          annualRevenue: safeApplicationData.annual_revenue,
          website: safeApplicationData.website,
          yearsTrading: safeApplicationData.years_trading,
          contactName: safeApplicationData.contact_name,
          contactPhone: safeApplicationData.contact_phone,
          contactRole: safeApplicationData.contact_role
        },
        profileComplete: true,
        profileCompletedAt: new Date().toISOString()
      }, { merge: true });

      // Also update the businesses collection with complete data
      await setDoc(doc(db, 'businesses', user.uid), {
        // Business application data
        latestApplication: {
          applicationId: newApplication.id,
          applicationNumber: safeApplicationData.application_number,
          submittedAt: new Date().toISOString(),
          status: 'submitted'
        },
        // Clean business profile data
        businessProfile: {
          businessName: safeApplicationData.business_name,
          companyNumber: safeApplicationData.company_number,
          industry: safeApplicationData.industry,
          companySize: safeApplicationData.company_size,
          annualRevenue: safeApplicationData.annual_revenue,
          website: safeApplicationData.website,
          yearsTrading: safeApplicationData.years_trading
        },
        profileComplete: true,
        profileCompletedAt: new Date().toISOString()
      }, { merge: true });
      
      // This is handled below, removing duplicate call

      // Close the modal
      setShowSubmitModal(false);
      
      // Show success message
      toast.success("Your application has been successfully submitted!");
      
      // Send application submitted confirmation email
      try {
        await mailgunService.sendApplicationSubmittedEmail({
          to: user.email || '',
          firstName: userInfo.firstName || user.displayName?.split(' ')[0] || 'Valued Customer',
          businessName: safeApplicationData.business_name || 'Your Business',
          applicationNumber: safeApplicationData.application_number,
          loanAmount: safeApplicationData.loan_amount || 0,
          dashboardUrl: 'https://comparefunding.io/applications'
        });
        console.log('Application submitted email sent successfully');
      } catch (emailError) {
        console.error('Failed to send application submitted email:', emailError);
        // Don't fail the application submission if email sending fails
      }
      
      // Navigate to the applications page to show the newly created application
      navigate('/applications', { 
        state: { 
          message: 'Application submitted successfully! We\'ll start matching you with lenders.',
          newApplicationId: newApplication.id
        }
      });
      
    } catch (error: any) {
      console.error("Error creating application:", error);
      
      // Get a more detailed error message for troubleshooting
      const errorMsg = error.message || "Unknown error";
      console.error("Detailed error:", errorMsg);
      
      toast.error(`Failed to submit your application: ${errorMsg}`);
      setErrorMessage(`There was an issue submitting your application: ${errorMsg}`);
      
      // Don't close the modal on error so the user can try again
      // setShowSubmitModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const sidebarProps = {
    title: "Application Review",
    description: "Review your funding application details before submitting.",
    highlight: "Almost there!",
    tips: [
      "Double-check all your information is accurate",
      "Once submitted, we'll match you with suitable lenders",
      "You can track your application status in your dashboard"
    ]
  };

  return (
    <SignUpLayout
      steps={steps}
      currentStep={currentStep}
      onStepNavigation={handleStepNavigation}
      onPrevious={handlePrevious}
      onNext={submitApplication}
      canGoBack={true}
      canGoNext={true}
      sidebarProps={sidebarProps}
    >
      <div className="space-y-8">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#2a3441] mb-2 sm:mb-3 animate-fadeIn">
            Application Review
          </h1>
          <p className="text-gray-600 text-sm sm:text-base md:text-lg animate-fadeIn delay-100">
            Please review your application details before submitting
          </p>
        </div>

        <Card className="border-2 border-blue-100 bg-blue-50 animate-fadeIn delay-200">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="bg-white rounded-full p-3 border border-blue-200">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-blue-900 mb-2">Application Summary</h2>
                <p className="text-blue-800">
                  This is a summary of what will be shared with suitable lenders. Please verify all information is correct.
                </p>
                
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200">
                    {userInfo.companySize || 'Company Size'}
                  </Badge>
                  <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-200">
                    £{userInfo.fundingAmount || 'Funding Size'}
                  </Badge>
                  <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200">
                    {userInfo.selectedProduct || 'Product Type'}
                  </Badge>
                  
                  {(userInfo.documents || []).filter(doc => doc.uploaded)?.length > 0 && (
                    <Badge className="bg-violet-100 text-violet-800 border-violet-200 hover:bg-violet-200">
                      <FileText className="h-3 w-3 mr-1" />
                      {(userInfo.documents || []).filter(doc => doc.uploaded).length} Document(s)
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business Information */}
        <Card className="border-2 border-gray-200 bg-white animate-fadeIn delay-300">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-[#2a3441]">
              <Building2 className="h-5 w-5 text-blue-600" />
              Business Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Company Name</p>
              <p className="font-medium text-[#2a3441]">
                {userInfo.companyName || userInfo.businessName || 'Not provided'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Company Number</p>
              <p className="font-medium text-[#2a3441]">
                {userInfo.companyNumber || 'Not provided'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Company Age</p>
              <p className="font-medium text-[#2a3441]">
                {companyAge !== null ? `${companyAge} years` : 
                 userInfo.companyAge || userInfo.yearsTrading ? 
                 `${userInfo.companyAge || userInfo.yearsTrading} years` : 
                 'Not available'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Company Size</p>
              <p className="font-medium text-[#2a3441]">
                {userInfo.companySize || 'Not provided'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Industry</p>
              <p className="font-medium capitalize text-[#2a3441]">
                {userInfo.industry || 'Not provided'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Forecast Annual Revenue</p>
              <p className="font-medium text-[#2a3441]">
                £{userInfo.forecastRevenue || userInfo.annualRevenue || 'Not provided'}
              </p>
            </div>
          </CardContent>
        </Card>
            
        {/* Financial Overview */}
        <Card className="border-2 border-gray-200 bg-white animate-fadeIn delay-400">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-[#2a3441]">
              <BarChart4 className="h-5 w-5 text-green-600" />
              Financial Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">Credit Score</p>
              <div className="flex items-center gap-3">
                <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-200">
                  Credit Score Available
                </Badge>
                {creditData && (
                  <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 font-bold">
                    Score: {creditData.raw_data?.report?.creditScore?.currentCreditRating?.providerValue?.value || 
                           creditData.data?.score || 
                           creditData.score || 
                           'N/A'}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
            
        {/* Funding Requirements */}
        <Card className="border-2 border-gray-200 bg-white animate-fadeIn delay-500">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-[#2a3441]">
              <PoundSterling className="h-5 w-5 text-green-600" />
              Funding Requirements
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Product Type</p>
              <p className="font-medium capitalize text-[#2a3441]">
                {userInfo.selectedProduct?.replace(/-/g, ' ') || 'Not provided'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Purpose</p>
              <p className="font-medium capitalize text-[#2a3441]">
                {userInfo.fundingPurpose || 'Not provided'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Amount Required</p>
              <p className="font-medium text-[#2a3441]">
                £{userInfo.fundingAmount || 'Not provided'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Timeframe</p>
              <p className="font-medium text-[#2a3441]">
                {userInfo.fundingTimeframe ? 
                 userInfo.fundingTimeframe.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 
                 'Not provided'}
              </p>
            </div>
          </CardContent>
        </Card>
            
        {/* HMRC Status */}
        <Card className="border-2 border-gray-200 bg-white animate-fadeIn delay-550">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-[#2a3441]">
              <Receipt className="h-5 w-5 text-blue-600" />
              HMRC Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">Are you up to date with HMRC payments?</p>
              <p className="font-medium text-[#2a3441]">
                {userInfo.isUpToDate === 'yes' ? 'Yes - All payments are up to date' : 
                 userInfo.isUpToDate === 'no' ? 'No - There are outstanding payments' : 
                 'Not specified'}
              </p>
            </div>
            
            {userInfo.isUpToDate === 'no' && (
              <div className="space-y-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm font-medium text-amber-800 mb-3">Outstanding Tax Details:</p>
                
                {/* VAT Details */}
                {userInfo.vatDetails && (userInfo.vatDetails.amount || userInfo.vatDetails.timeToPay || userInfo.vatDetails.details) && (
                  <div className="space-y-2">
                    <h5 className="font-medium text-[#2a3441] flex items-center gap-2">
                      <PoundSterling className="h-4 w-4" />
                      VAT
                    </h5>
                    {userInfo.vatDetails.amount && (
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Amount:</span> £{userInfo.vatDetails.amount}
                      </p>
                    )}
                    {userInfo.vatDetails.timeToPay && (
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Time to Pay Arrangement:</span> {userInfo.vatDetails.timeToPay}
                      </p>
                    )}
                    {userInfo.vatDetails.details && (
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Details:</span> {userInfo.vatDetails.details}
                      </p>
                    )}
                  </div>
                )}
                
                {/* Corporation Tax Details */}
                {userInfo.corpTaxDetails && (userInfo.corpTaxDetails.amount || userInfo.corpTaxDetails.timeToPay || userInfo.corpTaxDetails.details) && (
                  <div className="space-y-2">
                    <h5 className="font-medium text-[#2a3441] flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Corporation Tax
                    </h5>
                    {userInfo.corpTaxDetails.amount && (
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Amount:</span> £{userInfo.corpTaxDetails.amount}
                      </p>
                    )}
                    {userInfo.corpTaxDetails.timeToPay && (
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Time to Pay Arrangement:</span> {userInfo.corpTaxDetails.timeToPay}
                      </p>
                    )}
                    {userInfo.corpTaxDetails.details && (
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Details:</span> {userInfo.corpTaxDetails.details}
                      </p>
                    )}
                  </div>
                )}
                
                {/* PAYE Details */}
                {userInfo.payeDetails && (userInfo.payeDetails.amount || userInfo.payeDetails.timeToPay || userInfo.payeDetails.details) && (
                  <div className="space-y-2">
                    <h5 className="font-medium text-[#2a3441] flex items-center gap-2">
                      <Calculator className="h-4 w-4" />
                      PAYE
                    </h5>
                    {userInfo.payeDetails.amount && (
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Amount:</span> £{userInfo.payeDetails.amount}
                      </p>
                    )}
                    {userInfo.payeDetails.timeToPay && (
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Time to Pay Arrangement:</span> {userInfo.payeDetails.timeToPay}
                      </p>
                    )}
                    {userInfo.payeDetails.details && (
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Details:</span> {userInfo.payeDetails.details}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
            
        {/* Documents Uploaded */}
        <Card className="border-2 border-gray-200 bg-white animate-fadeIn delay-600">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-[#2a3441]">
              <FileText className="h-5 w-5 text-violet-600" />
              Document Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userInfo.shouldInviteColleague === 'yes' ? (
              <Alert className="bg-blue-50 border-blue-200">
                <AlertDescription>
                  You've chosen to invite <span className="font-medium">{userInfo.colleagueEmail || 'a colleague'}</span> to provide documents for this application.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-3">Documents included in application:</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {(userInfo.documents || []).filter(doc => doc.uploaded).map((doc, idx) => (
                    <Badge key={idx} className="bg-green-100 text-green-800 border-green-200 hover:bg-green-200">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {doc.name}
                    </Badge>
                  ))}
                  
                  {/* Handle case when no documents are uploaded */}
                  {(!userInfo.documents || userInfo.documents.filter(doc => doc.uploaded).length === 0) && (
                    <Badge variant="outline" className="text-amber-600 border-amber-200">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      No documents uploaded
                    </Badge>
                  )}
                </div>
                
                {/* Missing documents warning */}
                {userInfo.documents && userInfo.documents.some(doc => !doc.uploaded) && (
                  <Alert className="bg-amber-50 border-amber-200">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800">
                      Some recommended documents are missing. You can still submit your application, but providing all documents may improve your funding chances.
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Lender Preferences */}
        <Card className="border-2 border-gray-200 bg-white animate-fadeIn delay-700">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-[#2a3441]">
              <Shield className="h-5 w-5 text-amber-600" />
              Lender Preferences
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-2">Are there lenders we should avoid?</p>
            <p className="font-medium mb-4 text-[#2a3441]">
              {userInfo.shouldAvoidLenders === 'yes' ? 'Yes' : 
               userInfo.shouldAvoidLenders === 'no' ? 'No' : 'Not specified'}
            </p>
            
            {userInfo.shouldAvoidLenders === 'yes' && userInfo.lendersToAvoid && userInfo.lendersToAvoid.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-gray-600 mb-2">Lenders to avoid:</p>
                <ul className="list-disc pl-5 space-y-1">
                  {(userInfo.lendersToAvoid || []).map((lender, index) => (
                    <li key={index} className="text-sm">
                      <span className="font-medium text-[#2a3441]">{lender.name}</span>
                      {lender.reason && <span className="text-gray-600"> - {lender.reason}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit Modal */}
        <Dialog open={showSubmitModal} onOpenChange={setShowSubmitModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-white text-xl font-bold">Submit Application</DialogTitle>
              <DialogDescription className="text-white">
                Are you sure you want to submit this application? Once submitted, it will be shared with compatible lenders.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowSubmitModal(false)}
                className="mr-2 border-gray-300 text-white hover:text-gray-900 hover:bg-gray-100"
              >
                Cancel
              </Button>
              <Button 
                onClick={processApplicationSubmit} 
                disabled={isSubmitting}
                className="bg-gradient-to-r from-[#ff8000] to-[#ff6000] hover:from-[#e67300] hover:to-[#e55a00] text-white font-medium"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Submit
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </SignUpLayout>
  );
};

export default ApplicationReview;
