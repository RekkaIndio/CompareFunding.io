import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import PageLayout from '@/components/PageLayout';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createDocument, sendSignInEmail } from '@/firebase';

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

const companySizeOptions = [
  { label: '1-10 employees', value: '1-10' },
  { label: '11-50 employees', value: '11-50' },
  { label: '51-200 employees', value: '51-200' },
  { label: '201-500 employees', value: '201-500' },
  { label: '501+ employees', value: '501+' },
];

// Create separate schemas for business and lender
const baseSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  accountType: z.enum(['business', 'lender']),
});

const businessSchema = baseSchema.extend({
  business_name: z.string().min(2, 'Business name is required'),
  industry_sector: z.string().optional(),
  company_size: z.string().optional(),
  description: z.string().optional(),
});

const lenderSchema = baseSchema.extend({
  organization_name: z.string().min(2, 'Organization name is required'),
  job_title: z.string().optional(),
  is_new_organization: z.boolean().default(true),
  organization_id: z.string().optional(),
  role: z.enum(['admin', 'user']).default('admin'),
});

// Combined schema with conditional validation based on account type
const signUpSchema = z.discriminatedUnion('accountType', [
  z.object({
    accountType: z.literal('business'),
    firstName: z.string().min(2, 'First name is required'),
    lastName: z.string().min(2, 'Last name is required'),
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    business_name: z.string().min(2, 'Business name is required'),
    industry_sector: z.string().optional(),
    company_size: z.string().optional(),
    description: z.string().optional(),
  }),
  z.object({
    accountType: z.literal('lender'),
    firstName: z.string().min(2, 'First name is required'),
    lastName: z.string().min(2, 'Last name is required'),
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    organization_name: z.string().min(2, 'Organization name is required'),
    job_title: z.string().optional(),
    is_new_organization: z.boolean().default(true),
    organization_id: z.string().optional(),
    role: z.enum(['admin', 'user']).default('admin'),
  }),
]);

type SignUpFormValues = z.infer<typeof signUpSchema>;

const SignUp = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [useEmailLink, setUseEmailLink] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      accountType: 'business',
      business_name: '',
      industry_sector: '',
      company_size: '',
      description: '',
      organization_name: '',
      job_title: '',
      is_new_organization: true,
      organization_id: '',
      role: 'admin'
    },
    mode: 'onChange',
  });

  // Watch accountType to conditionally render business fields
  const accountType = form.watch('accountType');

  // Debug function to check form validity
  const checkFormValidity = () => {
    const formState = form.getValues();
    console.log('Current form values:', formState);
    console.log('Form errors:', form.formState.errors);
    
    // Manual validation check for lender
    if (formState.accountType === 'lender') {
      const requiredFields = ['firstName', 'lastName', 'email', 'password'];
      const missingFields = requiredFields.filter(field => !formState[field]);
      
      if (missingFields.length > 0) {
        console.log('Missing required fields for lender:', missingFields);
        return false;
      }
      
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formState.email)) {
        console.log('Invalid email format');
        return false;
      }
      
      // Password validation
      if (formState.password.length < 6) {
        console.log('Password too short');
        return false;
      }
      
      return true;
    }
    
    return form.formState.isValid;
  };

  const onSubmit = async (values: SignUpFormValues) => {
    console.log('Form submission started with values:', values);
    
    // Check form validity before submitting
    const isFormValid = checkFormValidity();
    console.log('Is form valid?', isFormValid);
    
    if (!isFormValid) {
      console.error('Form validation failed');
      toast.error('Please fill out all required fields correctly');
      return;
    }
    
    setIsLoading(true);

    try {
      if (useEmailLink) {
        console.log('Using email link for signup');
        await sendSignInEmail(values.email);
        toast.success("Sign-in link has been sent to your email.");
        setIsLoading(false);
        return;
      }

      // Clean form data based on account type
      const userData = {
        first_name: values.firstName,
        last_name: values.lastName,
        role: values.accountType,
      };
      
      console.log('Calling signUp with data:', { email: values.email, userData });

      // Call Firebase Auth signup through our context
      const { error, data } = await signUp(values.email, values.password, userData);
      
      console.log('SignUp response:', { error, data });

      if (error) {
        console.error('SignUp error:', error);
        toast.error(error.message);
        setIsLoading(false);
        return;
      }

      // If user is a business, create business profile
      if (values.accountType === 'business' && data?.user) {
        console.log('Creating business profile');
        const businessData = {
          business_name: values.business_name,
          industry_sector: values.industry_sector,
          company_size: values.company_size,
          description: values.description,
        };

        const profileResult = await createDocument('business_profiles', businessData, data.user.uid);
        console.log('Business profile creation result:', profileResult);
        
        if (profileResult.error) {
          console.error('Error creating business profile:', profileResult.error);
          toast.error('Account created, but failed to save business details');
          navigate('/login');
          return;
        }
      }
      
      // If user is a lender, handle organization and profile creation
      if (values.accountType === 'lender' && data?.user) {
        console.log('Creating lender profile');
        
        try {
          let organizationId = '';
          
          // Handle organization creation/joining
          if (values.is_new_organization) {
            // Create a new organization
            const orgData = {
              name: values.organization_name,
              created_at: new Date().toISOString(),
              created_by: data.user.uid,
              status: 'active',
              members_count: 1,
              admin_count: 1
            };
            
            const orgResult = await createDocument('lender_organizations', orgData);
            
            if (orgResult.error) {
              throw new Error(`Failed to create organization: ${orgResult.error.message}`);
            }
            
            organizationId = orgResult.data.id;
            console.log('Created new organization with ID:', organizationId);
          } else {
            // Verify existing organization exists
            if (!values.organization_id) {
              throw new Error('Organization ID is required when joining an existing organization');
            }
            
            // Here you would typically verify the organization exists and the user is allowed to join
            // This might involve checking an invitations collection or similar
            // For now, we'll just assume the ID is valid
            organizationId = values.organization_id;
            console.log('Joining existing organization with ID:', organizationId);
          }
          
          // Create lender profile linked to organization
          const lenderData = {
            user_id: data.user.uid,
            organization_id: organizationId,
            display_name: `${values.firstName} ${values.lastName}`,
            job_title: values.job_title || '',
            role: values.is_new_organization ? 'admin' : values.role,
            created_at: new Date().toISOString(),
            status: 'active'
          };
          
          const profileResult = await createDocument('lender_profiles', lenderData, data.user.uid);
          console.log('Lender profile creation result:', profileResult);
          
          if (profileResult.error) {
            throw new Error(`Failed to create lender profile: ${profileResult.error.message}`);
          }
          
        } catch (profileError: any) {
          console.error('Exception during lender profile creation:', profileError);
          toast.error(`Account created, but failed to save lender details: ${profileError.message}`);
          navigate('/login');
          return;
        }
      }

      // Show success message
      toast.success("Account created successfully! You can now log in.");
      
      // Navigate to login
      navigate('/login');
    } catch (error: any) {
      console.error('Form submission error:', error);
      toast.error(error.message || 'An error occurred during sign up');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageLayout>
      <div className="container flex items-center justify-center min-h-[calc(100vh-200px)] py-12">
        <div className="w-full max-w-md space-y-6 bg-white rounded-lg shadow-lg p-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Create your account</h1>
            <p className="text-muted-foreground">
              Sign up to start using CompareFunding's services
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="name@example.com" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!useEmailLink && (
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input placeholder="Create a password" type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="accountType"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>Account Type</FormLabel>
                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        type="button"
                        variant={field.value === 'business' ? 'default' : 'outline'}
                        className={field.value === 'business' ? 'bg-fundhub-blue hover:bg-fundhub-blue/90' : ''}
                        onClick={() => form.setValue('accountType', 'business')}
                      >
                        Business
                      </Button>
                      <Button
                        type="button"
                        variant={field.value === 'lender' ? 'default' : 'outline'}
                        className={field.value === 'lender' ? 'bg-fundhub-blue hover:bg-fundhub-blue/90' : ''}
                        onClick={() => form.setValue('accountType', 'lender')}
                      >
                        Lender
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Business details fields - only show if account type is business */}
              {accountType === 'business' && (
                <div className="space-y-4 pt-4 border-t">
                  <h2 className="font-medium">Business Details</h2>
                  
                  <FormField
                    control={form.control}
                    name="business_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your business name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="industry_sector"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Industry Sector</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select an industry" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {industryOptions.map((option) => (
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
                      name="company_size"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Size</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select company size" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {companySizeOptions.map((option) => (
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
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Briefly describe your business activities and services" 
                            className="resize-none"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Lender details fields - only show if account type is lender */}
              {accountType === 'lender' && (
                <div className="space-y-4 pt-4 border-t">
                  <h2 className="font-medium">Lender Organization Details</h2>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <FormField
                      control={form.control}
                      name="is_new_organization"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>Organization Type</FormLabel>
                          <div className="grid grid-cols-2 gap-4">
                            <Button
                              type="button"
                              variant={field.value ? 'default' : 'outline'}
                              className={field.value ? 'bg-fundhub-blue hover:bg-fundhub-blue/90' : ''}
                              onClick={() => {
                                form.setValue('is_new_organization', true);
                                form.setValue('organization_id', '');
                                form.setValue('role', 'admin');
                              }}
                            >
                              New Organization
                            </Button>
                            <Button
                              type="button"
                              variant={!field.value ? 'default' : 'outline'}
                              className={!field.value ? 'bg-fundhub-blue hover:bg-fundhub-blue/90' : ''}
                              onClick={() => {
                                form.setValue('is_new_organization', false);
                                form.setValue('role', 'user');
                              }}
                            >
                              Join Existing
                            </Button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {form.watch('is_new_organization') ? (
                      <>
                        <FormField
                          control={form.control}
                          name="organization_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Organization Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter your lending organization name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    ) : (
                      <FormField
                        control={form.control}
                        name="organization_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Organization ID</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter the organization ID you were invited to" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={form.control}
                      name="job_title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Job Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Your position within the organization" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role in Organization</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            value={field.value}
                            disabled={form.watch('is_new_organization')}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select your role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="admin">Administrator</SelectItem>
                              <SelectItem value="user">Standard User</SelectItem>
                            </SelectContent>
                          </Select>
                          {form.watch('is_new_organization') && (
                            <div className="text-xs text-muted-foreground mt-1">
                              As the creator, you will automatically be an administrator
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center pt-2">
                <input
                  type="checkbox"
                  id="useEmailLink"
                  checked={useEmailLink}
                  onChange={(e) => setUseEmailLink(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-fundhub-blue focus:ring-fundhub-blue"
                />
                <label htmlFor="useEmailLink" className="ml-2 block text-sm text-gray-600">
                  Sign up with email link (passwordless)
                </label>
              </div>

              <Button
                type="submit"
                className="w-full bg-fundhub-blue hover:bg-fundhub-blue/90"
                disabled={isLoading}
                onClick={() => {
                  // Direct submit handler in case form submission isn't triggering properly
                  if (!form.formState.isSubmitting) {
                    console.log('Direct button click - triggering form submission');
                    form.handleSubmit(onSubmit)();
                  }
                }}
              >
                {isLoading ? 'Creating account...' : useEmailLink ? 'Send sign-in link' : 'Create account'}
              </Button>
            </form>
          </Form>

          <div className="text-center pt-4">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-fundhub-blue hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default SignUp;
