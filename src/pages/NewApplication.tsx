import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getDocument, createDocument } from '@/firebase';
import { toast } from 'sonner';
import PageLayout from '@/components/PageLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Check, BadgePoundSterling, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const loanTypeOptions = [
  { value: 'term_loan', label: 'Term Loan' },
  { value: 'line_of_credit', label: 'Line of Credit' },
  { value: 'invoice_finance', label: 'Invoice Financing' },
  { value: 'asset_finance', label: 'Asset Finance' },
  { value: 'merchant_cash_advance', label: 'Merchant Cash Advance' },
];

const loanPurposeOptions = [
  { value: 'equipment', label: 'Equipment Purchase' },
  { value: 'expansion', label: 'Business Expansion' },
  { value: 'working_capital', label: 'Working Capital' },
  { value: 'inventory', label: 'Inventory Purchase' },
  { value: 'refinance', label: 'Debt Refinancing' },
  { value: 'marketing', label: 'Marketing and Advertising' },
  { value: 'real_estate', label: 'Real Estate Purchase' },
  { value: 'renovation', label: 'Renovation' },
  { value: 'hiring', label: 'Hiring and Staff' },
  { value: 'other', label: 'Other' },
];

const loanTermOptions = [
  { value: 3, label: '3 months' },
  { value: 6, label: '6 months' },
  { value: 12, label: '12 months' },
  { value: 24, label: '24 months' },
  { value: 36, label: '36 months' },
  { value: 48, label: '48 months' },
  { value: 60, label: '60 months' },
];

const applicationSchema = z.object({
  loan_amount: z.coerce.number()
    .min(1000, 'Minimum loan amount is £1,000')
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
        // Fetch business profile from Firebase
        const { data: profileData, error: profileError } = await getDocument('business_profiles', user.uid);
          
        if (profileError) {
          console.error('Error fetching business profile:', profileError);
        } else if (profileData) {
          setBusinessProfile(profileData);
        }
        
        // Check for accounting connections from Firebase
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
  
  const onSubmit = async (values: ApplicationFormValues) => {
    if (!user) return;
    
    if (!businessProfile) {
      toast.error('Please complete your business profile before applying');
      navigate('/business/profile');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Generate a unique application number
      const applicationNumber = `APP-${Date.now().toString().slice(-8)}-${Math.floor(Math.random() * 1000)}`;
      
      // Create the application record in Firebase
      const applicationData = {
        application_number: applicationNumber,
        user_id: user.uid,
        business_id: user.uid,  // Add this line to link application to business profile
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
        const applicationId = data.id;
        toast.success('Application draft created successfully');
        navigate(`/applications/${applicationId}/review`);
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
      <div className="container py-8">
        <div className="max-w-3xl mx-auto">
          <Button
            variant="ghost"
            className="mb-6"
            onClick={() => navigate('/applications')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Applications
          </Button>
          
          <h1 className="text-3xl font-bold mb-2">New Loan Application</h1>
          <p className="text-muted-foreground mb-8">
            Complete the form below to start your funding application
          </p>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Loan Details</CardTitle>
                  <CardDescription>
                    Provide information about your funding requirements
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="loan_amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Loan Amount (£) *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <BadgePoundSterling className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input className="pl-10" {...field} type="number" min="1000" />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Enter an amount between £1,000 and £10,000,000
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="loan_term_months"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Loan Term *</FormLabel>
                          <Select 
                            onValueChange={(value) => field.onChange(parseInt(value))} 
                            defaultValue={field.value.toString()}
                            value={field.value.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select term" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {loanTermOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value.toString()}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="loan_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Loan Type *</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select loan type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {loanTypeOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="purpose_category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Loan Purpose Category *</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select purpose category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {loanPurposeOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="purpose"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Purpose Description *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Please provide details about how you intend to use the funds..." 
                            className="resize-none min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Detailed explanation helps lenders better understand your funding needs
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
              
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Additional Details</CardTitle>
                  <CardDescription>
                    These details may affect your matching with certain lenders
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="is_secured"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-base">
                            Secured Loan
                          </FormLabel>
                          <FormDescription>
                            I'm willing to offer business assets as security for this loan
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="has_personal_guarantee"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-base">
                            Personal Guarantee
                          </FormLabel>
                          <FormDescription>
                            I'm willing to provide a personal guarantee for this loan
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
              
              {!hasAccountingConnection && (
                <Alert className="mb-6">
                  <BadgePoundSterling className="h-4 w-4" />
                  <AlertTitle>Enhance your application with accounting data</AlertTitle>
                  <AlertDescription>
                    <p className="mb-2">
                      Connecting your accounting software can increase your chances of approval 
                      and may result in better loan offers.
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate('/business/accounting/connect')}
                    >
                      Connect Accounting Software
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/applications')}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-fundhub-blue hover:bg-fundhub-blue/90"
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
