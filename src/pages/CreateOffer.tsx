import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { getDocument, getDocuments, createDocument, updateDocument } from '@/firebase';
import { toast } from 'sonner';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import PageLayout from '@/components/PageLayout';
import OfferConfirmationModal from '@/components/OfferConfirmationModal';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  ArrowLeft,
  PoundSterling,
  CalendarDays,
  PlusCircle,
  MinusCircle,
  Calculator,
  InfoIcon,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

// Form schema for loan offer
const offerFormSchema = z.object({
  offered_amount: z.coerce.number().min(1000, "Amount must be at least £1,000"),
  term_length: z.coerce.number().min(1, "Term must be at least 1 month"),
  interest_rate: z.coerce.number().min(0.1, "Interest rate must be at least 0.1%"),
  apr: z.coerce.number().min(0.1, "APR must be at least 0.1%"),
  arrangement_fee: z.coerce.number(),
  repayment_frequency: z.enum(["monthly", "bi_weekly", "weekly"]),
  early_repayment_fee: z.coerce.number(),
  has_early_repayment_fee: z.boolean(),
  conditions: z.array(z.string()).optional(),
  business_notes: z.string().optional(),
  expiry_days: z.coerce.number().min(1, "Expiry must be at least 1 day")
});

const formInputStyles = "bg-white/90 border-slate-200 focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50";

const CreateOffer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [conditions, setConditions] = useState(['']);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  
  // Fetch application data using Firebase
  const { data: application, isLoading, error: applicationError } = useQuery({
    queryKey: ['applicationForOffer', id],
    queryFn: async () => {
      if (!id) {
        throw new Error('Application ID is missing');
      }
      

      
      // Get application data
      const { data: appData, error: appError } = await getDocument('applications', id);
      
      if (appError) {
        console.error('Error fetching application:', appError);
        toast.error('Failed to load application details');
        throw appError;
      }
      
      if (!appData) {
        console.error('Application not found with ID:', id);
        toast.error('Application not found');
        throw new Error('Application not found');
      }
      
      // Get associated business data if needed
      let businessData = null;
      if (appData.business_id) {
        const { data: busData } = await getDocument('businesses', appData.business_id);
        if (busData) {
          businessData = busData;
        }
      }
      
      // Return combined data (similar to Supabase join)
      return {
        ...appData,
        businesses: businessData
      };
    },
    enabled: !!id,
  });
  
  // Set up form with defaults based on application
  const form = useForm<z.infer<typeof offerFormSchema>>({
    resolver: zodResolver(offerFormSchema),
    defaultValues: {
      offered_amount: application?.loan_amount || 0,
      term_length: application?.loan_term_months || 12,
      interest_rate: 7.5,
      apr: 9.5,
      arrangement_fee: 2.5,
      repayment_frequency: "monthly",
      early_repayment_fee: 2,
      has_early_repayment_fee: true,
      conditions: [],
      business_notes: "",
      expiry_days: 7
    },
  });
  
  // Update form defaults when application data loads
  useEffect(() => {
    if (application) {
      form.reset({
        offered_amount: application.loan_amount,
        term_length: application.loan_term_months,
        interest_rate: 7.5,
        apr: 9.5,
        arrangement_fee: 2.5,
        repayment_frequency: "monthly",
        early_repayment_fee: 2,
        has_early_repayment_fee: true,
        conditions: [],
        business_notes: "",
        expiry_days: 7
      });
    }
  }, [application, form]);
  
  // Calculate monthly payment based on loan details
  const calculateMonthlyPayment = (amount, rate, term) => {
    const monthlyRate = rate / 100 / 12;
    const payment = (amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -term));
    return payment.toFixed(2);
  };
  
  // Handle adding and removing conditions
  const addCondition = () => {
    setConditions([...conditions, '']);
  };
  
  const removeCondition = (index) => {
    const newConditions = [...conditions];
    newConditions.splice(index, 1);
    setConditions(newConditions);
  };
  
  const updateCondition = (index, value) => {
    const newConditions = [...conditions];
    newConditions[index] = value;
    setConditions(newConditions);
  };
  
  // Submit offer mutation using Firebase
  const submitOffer = useMutation({
    mutationFn: async (formData: z.infer<typeof offerFormSchema>) => {
      if (!user?.uid || !id || !application) {
        throw new Error('Missing required data to create offer');
      }
      
      // Get lender profile data
      const { data: lenderProfile, error: lenderError } = await getDocument('lender_profiles', user.uid);
      
      if (lenderError) {
        console.warn('Unable to fetch lender profile:', lenderError);
      }
      
      // If no lender profile or incomplete data, try to get from users collection
      let lenderName = lenderProfile?.company_name || '';
      let companyLogo = lenderProfile?.logo_url || '';
      
      if (!lenderName || lenderName.trim() === '') {
        try {
          const { data: userData } = await getDocument('users', user.uid);
          if (userData) {
            lenderName = userData.company_name || userData.name || userData.displayName || 'Unnamed Lender';
            if (!companyLogo) {
              companyLogo = userData.logo_url || userData.logo || '';
            }
          }
        } catch (error) {
          console.warn('Could not fetch user data for lender name:', error);
        }
      }
      
      // Final fallback
      if (!lenderName || lenderName.trim() === '') {
        lenderName = 'Unnamed Lender';
      }
      
      const filteredConditions = conditions.filter(c => c.trim() !== '');
      
      // Generate unique offer number
      const offerNumber = `OF-${Date.now().toString().substring(7)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
      
      // Calculate monthly payment
      const monthlyPayment = parseFloat(calculateMonthlyPayment(formData.offered_amount, formData.interest_rate, formData.term_length));
      const totalRepayment = monthlyPayment * formData.term_length;
      const arrangementFeeAmount = (formData.offered_amount * formData.arrangement_fee) / 100;
      
      const newOffer = {
        lender_id: user.uid,
        application_id: id,
        business_id: application.user_id,
        offer_number: offerNumber,
        offered_amount: formData.offered_amount,
        offered_term_months: formData.term_length,
        interest_rate: formData.interest_rate,
        apr: formData.apr,
        arrangement_fee: formData.arrangement_fee,
        arrangement_fee_amount: arrangementFeeAmount,
        monthly_payment: monthlyPayment,
        total_repayment: totalRepayment,
        repayment_frequency: formData.repayment_frequency,
        early_repayment_fee: formData.has_early_repayment_fee ? formData.early_repayment_fee : 0,
        conditions: filteredConditions,
        business_notes: formData.business_notes || '',
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        expiry_date: new Date(Date.now() + formData.expiry_days * 24 * 60 * 60 * 1000).toISOString(),
        lender_name: lenderName,
        company_name: lenderProfile?.company_name || lenderName,
        company_logo: companyLogo,
      };
      
      console.log('💾 Saving offer to Firebase:', newOffer);
      
      // Create the offer document in Firebase
      const { data: offerData, error: offerError } = await createDocument('offers', newOffer);
      
      console.log('✅ Firebase save result:', { offerData, offerError });
      
      if (offerError) throw offerError;
      
      // Update application status to include this offer
      const { error: updateError } = await updateDocument('applications', id, { 
        status: 'Has Offers',
        status_updated_at: new Date().toISOString(),
        has_pending_offers: true,
        offers_count: application.offers_count ? application.offers_count + 1 : 1
      });
      
      if (updateError) throw updateError;
      
      // Create a notification for the business
      const notificationData = {
        user_id: application.user_id,
        type: 'new_offer',
        title: 'New Financing Offer',
        message: `${lenderName !== 'Unnamed Lender' ? lenderName : 'A lender'} has submitted a financing offer of £${formData.offered_amount.toLocaleString()} for your application`,
        application_id: id,
        offer_id: offerData.id,
        read: false,
        created_at: new Date().toISOString()
      };
      
      await createDocument('notifications', notificationData);
        
      return offerData;
    },
    onSuccess: (data) => {
      console.log('🎉 Offer submitted successfully:', data);
      toast.success('Offer submitted successfully!');
      navigate('/matched-applications');
    },
    onError: (error) => {
      console.error('Error submitting offer:', error);
      toast.error('Failed to submit offer. Please try again.');
    },
  });
  
  const onSubmit = (data: z.infer<typeof offerFormSchema>) => {
    setShowConfirmationModal(true);
  };

  const handleConfirmSubmission = () => {
    const formData = form.getValues();
    console.log('🚀 Submitting offer with data:', formData);
    console.log('🔑 Current user UID:', user?.uid);
    setShowConfirmationModal(false);
    submitOffer.mutate(formData);
  };
  
  // Get calculated monthly payment based on current form values
  const watchedAmount = form.watch('offered_amount');
  const watchedRate = form.watch('interest_rate');
  const watchedTerm = form.watch('term_length');
  const calculatedMonthlyPayment = calculateMonthlyPayment(watchedAmount, watchedRate, watchedTerm);

  return (
    <PageLayout>
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
        <div className="container py-8">
          <Button
            variant="ghost"
            className="mb-6 flex items-center hover:bg-[#212936]/10 text-[#212936]"
            onClick={() => navigate(`/business/${id}`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Application
          </Button>
          <h1 className="text-3xl font-bold mb-2">Create Financing Offer</h1>
          <p className="text-slate-800 mb-8">
            Design a tailored financing proposal for this business application
          </p>
          
          {isLoading ? (
            <div className="space-y-6 animate-pulse">
              <div className="h-8 bg-white/50 rounded w-3/4"></div>
              <div className="h-4 bg-white/50 rounded w-1/2"></div>
              <div className="h-[600px] bg-white/50 rounded-xl shadow"></div>
            </div>
          ) : applicationError ? (
            <Alert variant="destructive" className="mb-6 bg-red-50 border-red-200 text-red-900">
              <AlertTriangle className="h-4 w-4 text-red-700" />
              <AlertTitle className="font-medium">Error</AlertTitle>
              <AlertDescription className="text-red-900">
                {applicationError instanceof Error 
                  ? applicationError.message 
                  : 'An error occurred while loading the application details. Please try again.'}
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <Card className="mb-6 bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg">
                <CardHeader className="bg-[#212936] text-white rounded-t-lg">
                  <CardTitle className="text-lg">Application Summary</CardTitle>
                  <CardDescription className="text-gray-200">
                    Review the business's financing request
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-slate-700">Industry</div>
                      <div className="font-medium text-slate-900">
                        {application?.businesses?.industry_sector || 'Industry not specified'}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-700">Requested Amount</div>
                      <div className="font-medium flex items-center text-slate-900">
                        <PoundSterling className="h-4 w-4 text-slate-600 mr-1" />
                        £{application?.loan_amount?.toLocaleString() || 'Not specified'}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-700">Requested Term</div>
                      <div className="font-medium flex items-center text-slate-900">
                        <CalendarDays className="h-4 w-4 text-slate-600 mr-1" />
                        {application?.loan_term_months || 'Not specified'} months
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-700">Purpose</div>
                    <div className="font-medium text-slate-900">
                      {application?.purpose || 'Not specified'}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 [&_input]:bg-white/90 [&_input]:border-slate-200 [&_input]:text-slate-800 [&_input]:focus:border-blue-300 [&_input]:focus:ring [&_input]:focus:ring-blue-200 [&_input]:focus:ring-opacity-50 [&_textarea]:bg-white/90 [&_textarea]:border-slate-200 [&_textarea]:text-slate-800 [&_textarea]:focus:border-blue-300 [&_textarea]:focus:ring [&_textarea]:focus:ring-blue-200 [&_textarea]:focus:ring-opacity-50 [&_label]:text-slate-800 [&_.text-muted-foreground]:text-slate-600">
                  <Card className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg">
                    <CardHeader className="bg-[#212936] text-white rounded-t-lg">
                      <CardTitle className="text-lg">Offer Details</CardTitle>
                      <CardDescription className="text-gray-200">
                        Configure your financing terms
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="offered_amount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Offered Amount (£)</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <PoundSterling className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  <Input type="number" className="pl-9" {...field} />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="term_length"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Term Length (months)</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <CalendarDays className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  <Input type="number" className="pl-9" {...field} />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="interest_rate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Interest Rate (%)</FormLabel>
                              <FormControl>
                                <div className="space-y-3">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm">{field.value}%</span>
                                    <div className="flex gap-2">
                                      <Button 
                                        type="button" 
                                        variant="outline" 
                                        size="icon" 
                                        className="h-6 w-6"
                                        onClick={() => form.setValue('interest_rate', Math.max(0.1, parseFloat((field.value - 0.25).toFixed(2))))}
                                      >
                                        <MinusCircle className="h-3 w-3" />
                                      </Button>
                                      <Button 
                                        type="button" 
                                        variant="outline" 
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() => form.setValue('interest_rate', parseFloat((field.value + 0.25).toFixed(2)))}
                                      >
                                        <PlusCircle className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                  <Slider 
                                    min={1} 
                                    max={20} 
                                    step={0.25} 
                                    value={[field.value]} 
                                    onValueChange={(value) => field.onChange(value[0])} 
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="apr"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>APR (%)</FormLabel>
                              <div className="flex items-center gap-2">
                                <FormControl>
                                  <Input type="number" step="0.1" {...field} />
                                </FormControl>
                                <Button 
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => form.setValue('apr', parseFloat((form.watch('interest_rate') * 1.2).toFixed(2)))}
                                >
                                  <Calculator className="h-3.5 w-3.5 mr-1" />
                                  Calc
                                </Button>
                              </div>
                              <FormDescription className="flex items-center gap-1 text-xs text-slate-700">
                                <InfoIcon className="h-3 w-3 text-slate-600" />
                                Annual Percentage Rate including all fees
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="arrangement_fee"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Arrangement Fee (%)</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.1" {...field} />
                              </FormControl>
                              <FormDescription className="text-xs text-slate-700">
                                One-time fee charged at loan origination
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="repayment_frequency"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Repayment Frequency</FormLabel>
                              <FormControl>
                                <RadioGroup 
                                  onValueChange={field.onChange} 
                                  value={field.value}
                                  className="flex flex-col space-y-1"
                                >
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="monthly" id="monthly" />
                                    <label htmlFor="monthly" className="text-sm font-normal cursor-pointer">Monthly</label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="bi_weekly" id="bi_weekly" />
                                    <label htmlFor="bi_weekly" className="text-sm font-normal cursor-pointer">Bi-weekly</label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="weekly" id="weekly" />
                                    <label htmlFor="weekly" className="text-sm font-normal cursor-pointer">Weekly</label>
                                  </div>
                                </RadioGroup>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <Separator />
                      
                      <div className="grid grid-cols-1 gap-6">
                        <FormField
                          control={form.control}
                          name="has_early_repayment_fee"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>
                                  Early Repayment Fee
                                </FormLabel>
                                <FormDescription>
                                  Apply a fee for early loan repayment
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                        
                        {form.watch('has_early_repayment_fee') && (
                          <FormField
                            control={form.control}
                            name="early_repayment_fee"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Early Repayment Fee (%)</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.1" {...field} />
                                </FormControl>
                                <FormDescription className="text-xs">
                                  Percentage of outstanding principal
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                        
                        <div>
                          <div className="font-medium mb-2">Conditions</div>
                          <div className="space-y-3 mb-3">
                            {conditions.map((condition, index) => (
                              <div key={index} className="flex items-start gap-2">
                                <Input
                                  value={condition}
                                  onChange={(e) => updateCondition(index, e.target.value)}
                                  placeholder="Add a condition..."
                                  className="flex-grow"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  onClick={() => removeCondition(index)}
                                >
                                  <MinusCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addCondition}
                            className="flex items-center gap-1 bg-blue-100 border-blue-300 text-blue-800 hover:bg-blue-200 hover:text-blue-900"
                          >
                            <PlusCircle className="h-3.5 w-3.5" />
                            Add Condition
                          </Button>
                        </div>
                        
                        <FormField
                          control={form.control}
                          name="business_notes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Notes to Business</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Add any additional information you want to share with the business..."
                                  className="min-h-[100px]"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="expiry_days"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Offer Validity (days)</FormLabel>
                              <FormControl>
                                <Input type="number" min="1" max="30" {...field} />
                              </FormControl>
                              <FormDescription className="text-xs text-slate-700">
                                Number of days this offer will remain valid
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg">
                    <CardHeader className="bg-[#212936] text-white rounded-t-lg">
                      <CardTitle className="text-lg">Payment Summary</CardTitle>
                      <CardDescription className="text-gray-200">
                        Estimated payments based on your offer terms
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-blue-100/80 border border-blue-200 p-4 rounded-lg shadow-sm">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <div className="text-sm text-muted-foreground">Monthly Payment</div>
                            <div className="text-xl font-bold">
                              £{calculatedMonthlyPayment}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Base payment excluding fees
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Total Repayment</div>
                            <div className="text-xl font-bold">
                              £{(parseFloat(calculatedMonthlyPayment) * watchedTerm).toFixed(2)}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Principal + Interest
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Arrangement Fee</div>
                            <div className="text-xl font-bold">
                              £{((watchedAmount * form.watch('arrangement_fee')) / 100).toFixed(2)}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {form.watch('arrangement_fee')}% of principal
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <Alert className="bg-blue-50 border-blue-200 text-blue-900">
                        <InfoIcon className="h-4 w-4 text-blue-700" />
                        <AlertTitle className="font-medium">Important</AlertTitle>
                        <AlertDescription className="text-blue-900">
                          Once submitted, this offer will be visible to the business. They may accept, reject, or request modifications.
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                    <CardFooter className="flex justify-between gap-4 bg-slate-50/50 border-t border-slate-100">
                      <Button 
                        type="button" 
                        variant="outline"
                        className="hover:bg-slate-100 border-slate-200"
                        onClick={() => navigate(`/business/${id}`)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        className="bg-[#ff8000] hover:bg-[#ff8000]/90 text-white shadow-lg hover:scale-105 transition-transform"
                        disabled={submitOffer.isPending}
                      >
                        {submitOffer.isPending ? 'Submitting...' : 'Submit Offer'}
                      </Button>
                    </CardFooter>
                  </Card>
                </form>
              </Form>
              
              {/* Confirmation Modal */}
              <OfferConfirmationModal
                isOpen={showConfirmationModal}
                onClose={() => setShowConfirmationModal(false)}
                onConfirm={handleConfirmSubmission}
                isLoading={submitOffer.isPending}
                offerAmount={form.watch('offered_amount') || 0}
              />
            </>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default CreateOffer;
