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
import { Github, Linkedin } from 'lucide-react'; // Assuming these icons are suitable placeholders

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
    },
    mode: 'onChange',
  });

  const accountType = form.watch('accountType');

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

        const profileResult = await createDocument('businesses', businessData, data.user.uid);
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
    <PageLayout showSidebar={false}>
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center bg-white px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-5xl rounded-lg bg-white p-6">
          <div className="flex flex-col items-center w-full">
            {/* Heading Section */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold tracking-tight text-fundhub-orange mb-2">
                Welcome to Compare Funding
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Select your account type to get started.
              </p>
            </div>
            {/* Cards Section */}
            <div className="flex flex-col md:flex-row gap-8 w-full justify-center items-center">
              {/* Business Card */}
              <div className="card-shadow p-8 flex flex-col items-center w-full md:w-[360px] h-[520px] max-w-[400px]">
                <h3 className="text-xl font-bold mb-2" style={{ color: '#ff8000' }}>Business</h3>
                <div className="flex flex-col flex-1 w-full justify-center items-center">
                  <p className="mb-8 text-gray-700 text-center">Sign up as a business to access funding options and manage your applications.</p>
                  <div className="flex items-center justify-center w-full">
                    <Button
                      className="bg-[#ff8000] text-white w-[180px] mx-auto"
                      onClick={() => {
                        navigate('/signup-journey/email-password');
                      }}
                    >
                      Sign Up
                    </Button>
                  </div>
                </div>
                <Button
                  className="bg-fundhub-orange text-white w-full mt-auto"
                  onClick={() => {
                    navigate('/signup-journey/email-password');
                  }}
                  style={{ display: 'none' }}
                >
                  Start Business Sign Up
                </Button>
              </div>
              {/* Lender Card */}
              <div className="card-shadow p-8 flex flex-col items-center w-full md:w-[360px] h-[520px] max-w-[400px]">
                <h3 className="text-xl font-bold mb-2" style={{ color: '#ff8000' }}>Lender</h3>
                <p className="mb-6 text-gray-700 text-center">Are you a lender? Book a call to get started and we’ll onboard you manually.</p>
                {/* Calendly Embed */}
                <div className="w-full flex-1 flex items-center justify-center">
                  <iframe
                    src="https://calendly.com/jamie-comparefunding/30min"
                    title="Book a call with Compare Funding"
                    width="100%"
                    height="340"
                    frameBorder="0"
                    style={{ minWidth: '220px', height: '340px', border: 'none', borderRadius: '12px' }}
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            </div>
        </div>
        {/* Login Section */}
        <p className="mt-10 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </p>
          </div>
        </div>
    </PageLayout>
  );
};

export default SignUp;
