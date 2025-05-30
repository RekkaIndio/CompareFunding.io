import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { getDocument, createDocument } from '../../../firebase';
import { toast } from 'sonner';
import PageLayout from '../../../components/PageLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Form } from '../../../components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { LoanDetailsCard } from './LoanDetailsCard';
import { AdditionalDetailsCard } from './AdditionalDetailsCard';

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
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [businessProfile, setBusinessProfile] = useState<any>(null);
  const [hasAccountingConnection, setHasAccountingConnection] = useState(false);
  
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
        
      } catch (err) {
        console.error('Error loading business data:', err);
        toast.error('Failed to load business data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBusinessInfo();
  }, [user]);
  
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
      const applicationNumber = `APP-${Date.now().toString().slice(-8)}-${Math.floor(Math.random() * 1000)}`;
      
      const applicationData = {
        application_number: applicationNumber,
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
      
    } catch (err) {
      console.error('Error submitting application:', err);
      toast.error('Failed to create application');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <PageLayout>
        <div className="container py-12 flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-fundhub-blue" />
            <p className="text-muted-foreground">Loading application form...</p>
            <p className="text-sm text-gray-400">Checking for your business profile data...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!businessProfile) {
    return (
      <PageLayout>
        <div className="container py-8">
          <div className="max-w-3xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Complete Your Profile First</CardTitle>
                <CardDescription>
                  You need to complete your business profile before applying for funding
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-6">
                  To provide lenders with the necessary information for evaluating your application,
                  please complete your business profile with essential details about your company.
                </p>
                <Alert className="mb-4">
                  <AlertDescription className="text-sm">
                    We couldn't find your business profile in our system. If you've already completed
                    your profile, there might be an issue with accessing your data.
                  </AlertDescription>
                </Alert>
                <p className="text-sm text-gray-500 mb-4">
                  User ID: {user?.uid || 'Not available'}
                </p>
              </CardContent>
              <CardFooter>
                <Button
                  className="bg-fundhub-blue hover:bg-fundhub-blue/90"
                  onClick={() => navigate('/business/profile')}
                >
                  Complete Profile
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="container py-8 max-w-[1400px] mx-auto px-4 bg-white">
        <div>
          <Button
            variant="ghost"
            className="mb-6 text-gray-600 hover:text-gray-900"
            onClick={() => navigate('/applications')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Applications
          </Button>
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 text-gray-900">New Loan Application</h1>
            <p className="text-gray-600">
              Complete the form below to start your funding application. Each section has its own card below.
            </p>
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <LoanDetailsCard form={form} />
              <AdditionalDetailsCard form={form} />
            </div>
              
    
              <div className="flex justify-end space-x-4 mt-8">
                <Button
                  type="button"
                  variant="outline"
                  className="px-6 py-2 border border-gray-300 hover:bg-gray-50"
                  onClick={() => navigate('/applications')}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="px-6 py-2 bg-[#ff6b00] hover:bg-[#ff6b00]/90 text-white font-medium"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
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
    </PageLayout>
  );
};

export default NewApplication;
