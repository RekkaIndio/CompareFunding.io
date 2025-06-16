import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { getDocument, getDocuments, createDocument, updateDocument } from '../../../firebase';
import { toast } from 'sonner';
import PageLayout from '../../../components/PageLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { ArrowLeft, ArrowRight, Loader2, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Form } from '../../../components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { LoanDetailsCard } from './LoanDetailsCard';
import { AdditionalDetailsCard } from './AdditionalDetailsCard';
import { fetchSignupFundingData, mapSignupDataToApplication } from '../../../lib/signupDataUtils';
import { generateApplicationNumber } from '../../../lib/applicationUtils';

const applicationSchema = z.object({
  loan_amount: z.coerce.number()
    .min(1000, 'Minimum loan amount is £10,000')
    .max(10000000, 'Maximum loan amount is £10,000,000'),
  loan_term_months: z.coerce.number()
    .min(3, 'Minimum term is 3 months'),
  loan_type: z.string()
    .min(1, 'Loan type is required'),
  purpose_category: z.string()
    .min(1, 'Loan purpose is required'),
  purpose: z.string()
    .min(10, 'Please provide a brief description (minimum 10 characters)')
    .max(500, 'Description is too long (maximum 500 characters)'),
  has_personal_guarantee: z.boolean().optional(),
  is_secured: z.boolean().optional(),
});

type ApplicationFormValues = z.infer<typeof applicationSchema>;

const NewApplication = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [businessProfile, setBusinessProfile] = useState<any>(null);
  const [hasAccountingConnection, setHasAccountingConnection] = useState(false);
  const [wasDataPrefilled, setWasDataPrefilled] = useState(false);
  const [draftApplicationId, setDraftApplicationId] = useState<string | null>(null);
  const [applicationNumber, setApplicationNumber] = useState<string | null>(null);
  
  // Get draft ID from URL parameters
  const draftId = searchParams.get('draft');
  
  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      loan_amount: 25000,
      loan_term_months: 12,
      loan_type: 'term_loan',
      purpose_category: '',
      purpose: '',
      has_personal_guarantee: false,
      is_secured: false,
    },
  });
  
  useEffect(() => {
    const fetchBusinessInfo = async () => {
      if (!user) return;
      
      setIsLoading(true);
      
      try {
        // Try to fetch from businesses collection first
        let profileData = null;
        let profileError = null;
        
        // First check the businesses collection where BusinessDetailsForm.tsx saves data
        const businessesResult = await getDocument('businesses', user.uid);
        
        if (businessesResult.error || !businessesResult.data) {
          // If not found, check business_profiles collection as fallback
          const profilesResult = await getDocument('business_profiles', user.uid);
          profileData = profilesResult.data;
          profileError = profilesResult.error;
        } else {
          // We found business data in the businesses collection
          profileData = businessesResult.data;
          profileError = businessesResult.error;
        }
          
        if (profileError) {
          console.error('Error fetching business profile:', profileError);
        } else if (profileData) {
          setBusinessProfile(profileData);
        }
        
        const { data: accountingData, error: accountingError } = await getDocument('accounting_integrations', user.uid);
          
        if (accountingError) {
          console.error('Error fetching accounting integration:', accountingError);
        }
        
        setHasAccountingConnection(!!accountingData && accountingData.auth_status === 'connected');
        
        // Load existing draft application if editing
        if (draftId) {
          console.log('📝 Loading existing draft application:', draftId);
          try {
            const { data: draftData, error: draftError } = await getDocument('applications', draftId);
            if (draftError) {
              console.error('Error loading draft application:', draftError);
              toast.error('Failed to load draft application');
            } else if (draftData) {
              console.log('📄 Draft data loaded:', draftData);
              setDraftApplicationId(draftId);
              setApplicationNumber(draftData.application_number);
              
              // Pre-fill form with draft data
              form.reset({
                loan_amount: draftData.loan_amount || 25000,
                loan_term_months: draftData.loan_term_months || 12,
                loan_type: draftData.loan_type || 'term_loan',
                purpose_category: draftData.purpose_category || '',
                purpose: draftData.purpose || '',
                has_personal_guarantee: draftData.has_personal_guarantee || false,
                is_secured: draftData.is_secured || false,
              });
              
              setWasDataPrefilled(true);
              toast.success('Draft application loaded');
            }
          } catch (error) {
            console.error('Error loading draft:', error);
            toast.error('Failed to load draft application');
          }
        } else {
          // Only try to prefill from signup data if not editing an existing draft
          // Try to prefill form with signup journey data
          try {
          console.log('=== Starting prefill process ===');
          console.log('User ID:', user.uid);
          
          const signupData = await fetchSignupFundingData(user.uid);
          console.log('Signup data retrieved:', signupData);
          
          if (signupData && profileData) {
            console.log('Profile data exists:', profileData);
            const mappedData = mapSignupDataToApplication(signupData);
            console.log('Mapped data:', mappedData);
            
            // Check if a draft application with prefilled data already exists
            console.log('Checking for existing drafts...');
            const existingDrafts = await getDocuments('applications', [
              { field: 'user_id', operator: '==', value: user.uid },
              { field: 'status', operator: '==', value: 'draft' },
              { field: 'is_prefilled', operator: '==', value: true }
            ]);
            
            console.log('Existing drafts query result:', existingDrafts);
            
            let shouldCreateDraft = true;
            let existingDraftId = null;
            
            if (existingDrafts.data && existingDrafts.data.length > 0) {
              console.log('Found existing drafts:', existingDrafts.data);
              // Check if any existing draft has similar data
              const similarDraft = existingDrafts.data.find((draft: any) => 
                draft.loan_amount === mappedData.loan_amount &&
                draft.purpose_category === mappedData.purpose_category
              );
              
              if (similarDraft) {
                shouldCreateDraft = false;
                existingDraftId = similarDraft.id;
                setDraftApplicationId(existingDraftId);
                console.log('Found similar existing draft:', existingDraftId);
              }
            }
            
            // Create draft application if one doesn't exist
            if (shouldCreateDraft) {
              console.log('Creating new draft application...');
              const draftId = await createDraftApplication(mappedData, profileData);
              if (draftId) {
                setDraftApplicationId(draftId);
                setApplicationNumber(generateApplicationNumber(businessProfile?.company_number));
                console.log('Draft application created with ID:', draftId);
              } else {
                console.log('Failed to create draft application');
              }
            }
            
            // Update form with mapped data, but only for fields that are currently default
            const currentValues = form.getValues();
            const updatedValues = { ...currentValues };
            
            if (mappedData.loan_amount && currentValues.loan_amount === 25000) {
              updatedValues.loan_amount = mappedData.loan_amount;
            }
            if (mappedData.loan_term_months && currentValues.loan_term_months === 12) {
              updatedValues.loan_term_months = mappedData.loan_term_months;
            }
            if (mappedData.purpose_category && !currentValues.purpose_category) {
              updatedValues.purpose_category = mappedData.purpose_category;
            }
            if (mappedData.purpose && !currentValues.purpose) {
              updatedValues.purpose = mappedData.purpose;
            }
            
            // Reset form with prefilled data
            form.reset(updatedValues);
            setWasDataPrefilled(true);
            
            console.log('Application form prefilled with signup data:', mappedData);
            if (shouldCreateDraft) {
              console.log('Draft application created for user');
            } else {
              console.log('Using existing draft application:', existingDraftId);
            }
          } else {
            console.log('No signup data found or missing profile data');
            console.log('Signup data:', signupData);
            console.log('Profile data:', profileData);
          }
          } catch (prefillError) {
            console.error('Error prefilling from signup data:', prefillError);
            // Don't show error to user as this is a nice-to-have feature
          }
        } // End of else block for draft loading vs signup prefilling
        

        
      } catch (err) {
        console.error('Error loading business data:', err);
        toast.error('Failed to load business data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBusinessInfo();
  }, [user, form]);
  
  // Add debugging log to help identify if a profile is found
  useEffect(() => {
    if (businessProfile) {
      console.log('Business profile found:', businessProfile);
      console.log('Profile source:', businessProfile._source || 'unknown');
    } else if (!isLoading) {
      console.log('No business profile found after loading completed');
    }
  }, [businessProfile, isLoading]);
  

  
  const onSubmit = async (values: ApplicationFormValues) => {
    if (!user) return;
    
    if (!businessProfile) {
      toast.error('Please complete your business profile before applying');
      navigate('/business/profile');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Check if we're editing an existing draft
      if (draftId) {
        console.log('📝 Updating existing draft application:', draftId);
        
        // Update existing draft with new values
        const updateData = {
          loan_amount: values.loan_amount,
          loan_term_months: values.loan_term_months,
          loan_type: values.loan_type,
          purpose_category: values.purpose_category,
          purpose: values.purpose,
          has_personal_guarantee: values.has_personal_guarantee || false,
          is_secured: values.is_secured || false,
          status: 'submitted', // Change status to submitted
          status_updated_at: new Date().toISOString(),
          completeness_percentage: 100,
        };
        
        const { error: updateError } = await updateDocument('applications', draftId, updateData);
        
        if (updateError) {
          console.error('Error updating draft application:', updateError);
          toast.error('Failed to submit application');
          return;
        }
        
        toast.success('Application submitted successfully');
        
        // Trigger dashboard refresh to hide the submitted draft
        if (typeof (window as any).refreshDashboard === 'function') {
          (window as any).refreshDashboard();
        }
        
        navigate(`/applications/${draftId}/review`);
      } else {
        // Create new application
        console.log('📝 Creating new application');
        
        const applicationData = {
          application_number: generateApplicationNumber(businessProfile?.company_number),
          user_id: user.uid,
          business_id: user.uid,
          loan_amount: values.loan_amount,
          loan_term_months: values.loan_term_months,
          loan_type: values.loan_type,
          purpose_category: values.purpose_category,
          purpose: values.purpose,
          has_personal_guarantee: values.has_personal_guarantee || false,
          is_secured: values.is_secured || false,
          status: 'draft',
          application_date: new Date().toISOString(),
          status_updated_at: new Date().toISOString(),
          matched_lenders: [],
          completeness_percentage: 90,
        };
        
        const { data, error } = await createDocument('applications', applicationData);
          
        if (error) {
          console.error('Error creating application:', error);
          toast.error('Failed to create application');
          return;
        }
        
        if (data && data.id) {
          toast.success('Application draft created successfully');
          navigate(`/applications/${data.id}/review`);
        }
      }
      
    } catch (err) {
      console.error('Error submitting application:', err);
      toast.error('Failed to submit application');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to create a draft application from prefilled data
  const createDraftApplication = async (mappedData: any, businessProfile: any) => {
    try {
      // Get company name from various possible sources
      const companyName = businessProfile?.business_name || 
                         businessProfile?.companyName || 
                         businessProfile?.name || 
                         'Your Business';
      
      const applicationData = {
        application_number: generateApplicationNumber(businessProfile?.company_number),
        user_id: user!.uid,
        business_id: user!.uid,
        company_name: companyName,
        loan_amount: mappedData.loan_amount || 25000,
        loan_term_months: mappedData.loan_term_months || 12,
        loan_type: mappedData.loan_type || 'term_loan',
        purpose_category: mappedData.purpose_category || '',
        purpose: mappedData.purpose || '',
        has_personal_guarantee: false,
        is_secured: false,
        status: 'draft',
        application_date: new Date().toISOString(),
        status_updated_at: new Date().toISOString(),
        matched_lenders: [],
        is_prefilled: true, // Flag to indicate this was auto-created from signup data
        prefill_source: 'signup_journey', // Track where the data came from
      };
      
      const { data, error } = await createDocument('applications', applicationData);
      
      if (error) {
        console.error('Error creating draft application:', error);
        return null;
      }
      
      if (data && data.id) {
        console.log('Draft application created successfully:', data.id);
        return data.id;
      }
      
    } catch (err) {
      console.error('Error creating draft application:', err);
      return null;
    }
    
    return null;
  };

  useEffect(() => {
    // Load existing draft application if editing
    if (draftId) {
      console.log('📝 Loading existing draft application:', draftId);
      try {
        const fetchDraftData = async () => {
          const { data: draftData, error: draftError } = await getDocument('applications', draftId);
          if (draftError) {
            console.error('Error loading draft application:', draftError);
            toast.error('Failed to load draft application');
          } else if (draftData) {
            console.log('📄 Draft data loaded:', draftData);
            setDraftApplicationId(draftId);
            setApplicationNumber(draftData.application_number);
            
            // Pre-fill form with draft data
            form.reset({
              loan_amount: draftData.loan_amount || 25000,
              loan_term_months: draftData.loan_term_months || 12,
              loan_type: draftData.loan_type || 'term_loan',
              purpose_category: draftData.purpose_category || '',
              purpose: draftData.purpose || '',
              has_personal_guarantee: draftData.has_personal_guarantee || false,
              is_secured: draftData.is_secured || false,
            });
            
            setWasDataPrefilled(true);
            toast.success('Draft application loaded');
          }
        };
        
        fetchDraftData();
      } catch (error) {
        console.error('Error loading draft:', error);
        toast.error('Failed to load draft application');
      }
    } else {
      // ...existing prefill logic...
    }
  }, [draftId, form]);
  

  if (isLoading) {
    return (
      <PageLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
          <div className="container py-12 flex items-center justify-center min-h-[calc(100vh-200px)]">
            <div className="flex flex-col items-center gap-4">
              <div className="bg-gradient-to-br from-[#212936] to-[#2c3c53] rounded-full p-4 shadow-lg">
                <Loader2 className="h-8 w-8 animate-spin text-[#ff8000]" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-[#212936] font-semibold text-lg">Loading application form...</p>
                <p className="text-slate-600 text-sm">Checking for your business profile data...</p>
              </div>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!businessProfile) {
    return (
      <PageLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
          <div className="container py-8">
            <div className="max-w-4xl mx-auto">
              <Card className="relative overflow-hidden bg-white hover:shadow-2xl border transition-all duration-300 border-slate-200/80 rounded-xl shadow-lg">
                {/* Premium status indicator bar */}
                <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 to-amber-600"></div>
                
                <CardHeader className="text-center pb-6">
                  <div className="mx-auto bg-gradient-to-br from-[#212936] to-[#2c3c53] rounded-full p-4 shadow-lg w-fit mb-4">
                    <svg className="h-8 w-8 text-[#ff8000]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <CardTitle className="text-2xl font-bold text-[#212936] mb-2">Complete Your Profile First</CardTitle>
                  <CardDescription className="text-slate-600 text-lg">
                    You need to complete your business profile before applying for funding
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                    <p className="text-slate-700 leading-relaxed">
                      To provide lenders with the necessary information for evaluating your application,
                      please complete your business profile with essential details about your company.
                    </p>
                  </div>
                  
                  <Alert className="border-amber-200 bg-amber-50">
                    <AlertDescription className="text-sm text-amber-800">
                      We couldn't find your business profile in our system. If you've already completed
                      your profile, there might be an issue with accessing your data.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <p className="text-sm text-slate-600 font-mono">
                      User ID: {user?.uid || 'Not available'}
                    </p>
                  </div>
                </CardContent>
                
                <CardFooter className="pt-6">
                  <Button
                    className="w-full h-12 bg-gradient-to-r from-[#ff8000] to-[#ffaa00] hover:from-[#ff9900] hover:to-[#ffbb00] text-white font-semibold shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5"
                    onClick={() => navigate('/business/profile')}
                  >
                    Complete Profile
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="container py-8 max-w-[1400px] mx-auto px-4">
          <div>
            <Button
              variant="ghost"
              className="mb-6 text-[#212936] hover:text-[#ff8000] hover:bg-slate-50 transition-all duration-200"
              onClick={() => navigate('/applications')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Applications
            </Button>
            
            <div className="mb-8 text-center">
              <h1 className="text-4xl font-bold mb-4 text-[#212936] bg-gradient-to-r from-[#212936] to-[#2c3c53] bg-clip-text text-transparent">
                New Loan Application
              </h1>
              <p className="text-slate-600 text-lg max-w-2xl mx-auto">
                Complete the form below to start your funding application. Our premium application process ensures the best matching with suitable lenders.
              </p>
            </div>
            
            {/* Prefilled data notification */}
            {wasDataPrefilled && (
              <Alert className="mb-6 border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Great news!</strong> We've prefilled some fields based on your signup information and saved a draft application for you. 
                  You can review and modify any details as needed, then submit when ready.
                  {draftApplicationId && (
                    <div className="mt-2 space-y-1">
                      <div className="text-sm">
                        <strong>Application Number:</strong> {applicationNumber || 'Generating...'}
                      </div>
                      <div className="text-sm">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2 h-7 text-xs border-green-300 text-green-700 hover:bg-green-100"
                          onClick={() => navigate('/dashboard')}
                        >
                          View on Dashboard
                        </Button>
                      </div>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                  <LoanDetailsCard form={form} />
                  <AdditionalDetailsCard form={form} />
                </div>
                
                {/* Enhanced action buttons with premium styling */}
                <div className="flex flex-col sm:flex-row justify-center gap-4 mt-12">
                    <Button
                    type="button"
                    variant="outline"
                    className="px-8 py-3 border-2 border-slate-300 hover:border-[#212936] hover:bg-slate-50 text-white font-semibold transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
                    onClick={() => navigate('/applications')}
                    >
                    Cancel
                    </Button>
                  <Button 
                    type="submit" 
                    className="px-8 py-3 bg-gradient-to-r from-[#ff8000] to-[#ffaa00] hover:from-[#ff9900] hover:to-[#ffbb00] text-white font-semibold shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Application...
                      </>
                    ) : (
                      <>
                        Continue to Review
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default NewApplication;
