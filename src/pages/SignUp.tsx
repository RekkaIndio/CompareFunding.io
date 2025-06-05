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
import { Building2, Users, Shield, CheckCircle, Star, TrendingUp, Zap, Clock, ArrowRight, CreditCard } from 'lucide-react';

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


    
    // Manual validation check for lender
    if (formState.accountType === 'lender') {
      const requiredFields = ['firstName', 'lastName', 'email', 'password'];
      const missingFields = requiredFields.filter(field => !formState[field]);
      
      if (missingFields.length > 0) {

        return false;
      }
      
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formState.email)) {

        return false;
      }
      
      // Password validation
      if (formState.password.length < 6) {

        return false;
      }
      
      return true;
    }
    
    return form.formState.isValid;
  };

  const onSubmit = async (values: SignUpFormValues) => {

    
    // Check form validity before submitting
    const isFormValid = checkFormValidity();

    
    if (!isFormValid) {
      console.error('Form validation failed');
      toast.error('Please fill out all required fields correctly');
      return;
    }
    
    setIsLoading(true);

    try {
      if (useEmailLink) {

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
      


      // Call Firebase Auth signup through our context
      const { error, data } = await signUp(values.email, values.password, userData);
      


      if (error) {
        console.error('SignUp error:', error);
        toast.error(error.message);
        setIsLoading(false);
        return;
      }

      // If user is a business, create business profile
      if (values.accountType === 'business' && data?.user) {

        const businessData = {
          business_name: values.business_name,
          industry_sector: values.industry_sector,
          company_size: values.company_size,
          description: values.description,
        };

        const profileResult = await createDocument('businesses', businessData, data.user.uid);

        
        if (profileResult.error) {
          console.error('Error creating business profile:', profileResult.error);
          toast.error('Account created, but failed to save business details');
          navigate('/login');
          return;
        }
      }
      
      // If user is a lender, handle organization and profile creation
      if (values.accountType === 'lender' && data?.user) {

        
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

          } else {
            // Verify existing organization exists
            if (!values.organization_id) {
              throw new Error('Organization ID is required when joining an existing organization');
            }
            
            // Here you would typically verify the organization exists and the user is allowed to join
            // This might involve checking an invitations collection or similar
            // For now, we'll just assume the ID is valid
            organizationId = values.organization_id;

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
      {/* Hero Section */}
      <section className="relative min-h-screen overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1920&auto=format&fit=crop&q=80"
            alt="Business professionals collaborating"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-fundhub-navy/95 via-fundhub-navy/80 to-transparent"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 min-h-screen flex items-center">
          <div className="container mx-auto px-4 py-16">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
              
              {/* Left Content */}
              <div className="flex-1 max-w-2xl text-white">
                <div className="mb-8">
                  <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                    Choose Your Path to 
                    <span className="text-primary"> Success</span>
                  </h1>
                  <p className="text-xl text-white/90 mb-8 leading-relaxed">
                    Join thousands of businesses and lenders already transforming how they handle commercial funding. 
                    One platform, endless possibilities.
                  </p>
                </div>
                
                {/* Trust Signals */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold">Bank-Grade Security</div>
                      <div className="text-sm text-white/70">256-bit encryption</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold">Fast Setup</div>
                      <div className="text-sm text-white/70">Ready in 2 minutes</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold">10,000+ Users</div>
                      <div className="text-sm text-white/70">Trusted globally</div>
                    </div>
                  </div>
                </div>
                
                {/* Reviews */}
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <span className="text-sm font-medium">4.9/5</span>
                  </div>
                  <div className="text-sm text-white/70">
                    Based on 2,400+ reviews
                  </div>
                </div>
              </div>
              
              {/* Right Content - Account Selection */}
              <div className="flex-1 max-w-2xl w-full">
                <div className="bg-white rounded-3xl p-8 shadow-2xl">
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                      Get Started Today
                    </h2>
                    <p className="text-gray-600">
                      Choose the option that best describes you
                    </p>
                  </div>
                  
                  {/* Account Type Cards */}
                  <div className="space-y-6">
                    {/* Business Card */}
                    <div className="group relative overflow-hidden rounded-2xl border-2 border-gray-200 hover:border-primary transition-all duration-300 hover:shadow-lg cursor-pointer"
                         onClick={() => navigate('/signup-journey/email-password')}>
                      <div className="p-6">
                        <div className="flex items-start space-x-4">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                            <Building2 className="w-6 h-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">For Businesses</h3>
                            <p className="text-gray-600 mb-4">
                              Access funding opportunities, compare options, and streamline your application process.
                            </p>
                            
                            {/* Benefits */}
                            <div className="space-y-2 mb-4">
                              <div className="flex items-center space-x-2 text-sm text-gray-700">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span>Compare 50+ funding options</span>
                              </div>
                              <div className="flex items-center space-x-2 text-sm text-gray-700">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span>One application, multiple lenders</span>
                              </div>
                              <div className="flex items-center space-x-2 text-sm text-gray-700">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span>Free credit score monitoring</span>
                              </div>
                            </div>
                            
                            <Button className="w-full bg-primary hover:bg-primary/90 text-white group-hover:bg-primary/90">
                              Start Your Application
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Lender Card */}
                    <div className="group relative overflow-hidden rounded-2xl border-2 border-gray-200 hover:border-primary transition-all duration-300 hover:shadow-lg">
                      <div className="p-6">
                        <div className="flex items-start space-x-4">
                          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                            <CreditCard className="w-6 h-6 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">For Lenders</h3>
                            <p className="text-gray-600 mb-4">
                              Connect with qualified businesses and streamline your lending process with our platform.
                            </p>
                            
                            {/* Benefits */}
                            <div className="space-y-2 mb-4">
                              <div className="flex items-center space-x-2 text-sm text-gray-700">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span>Access pre-qualified leads</span>
                              </div>
                              <div className="flex items-center space-x-2 text-sm text-gray-700">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span>Automated application processing</span>
                              </div>
                              <div className="flex items-center space-x-2 text-sm text-gray-700">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span>Portfolio management tools</span>
                              </div>
                            </div>
                            
                            {/* Calendly Embed - Expanded */}
                            <div className="mb-4">
                              <iframe
                                src="https://calendly.com/jamie-comparefunding/30min"
                                title="Book a call with Compare Funding"
                                width="100%"
                                height="400"
                                frameBorder="0"
                                style={{ borderRadius: '12px', border: '1px solid #e5e7eb', minHeight: '835px' }}
                                allowFullScreen
                              ></iframe>
                            </div>
                            
                            <Button variant="outline" className="w-full border-gray-300 hover:bg-gray-50 text-white">
                              Book a Demo Call
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Login Link */}
                  <div className="text-center mt-8 pt-6 border-t border-gray-200">
                    <p className="text-gray-600">
                      Already have an account?{' '}
                      <Link to="/login" className="font-medium text-primary hover:text-primary/80 transition-colors">
                        Sign in
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose Compare Funding?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We're revolutionizing commercial finance by making it faster, more transparent, and more accessible for everyone.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Lightning Fast</h3>
              <p className="text-gray-600">Get funding decisions in hours, not weeks. Our streamlined process cuts through red tape.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Best Rates</h3>
              <p className="text-gray-600">Compare offers from 50+ lenders to ensure you get the most competitive rates available.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Secure & Trusted</h3>
              <p className="text-gray-600">Bank-grade security with full transparency. Your data is protected and never shared without consent.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Expert Support</h3>
              <p className="text-gray-600">Our team of funding experts guides you through every step of the process.</p>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default SignUp;
