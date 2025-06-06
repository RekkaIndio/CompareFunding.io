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
import { Building2, Users, Shield, CheckCircle, Star, TrendingUp, Zap, Clock, ArrowRight, CreditCard, ChevronDown } from 'lucide-react';

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
          <div className="absolute inset-0 bg-gradient-to-r from-fundhub-navy/95 via-fundhub-navy/85 to-fundhub-navy/70"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 min-h-screen flex items-center">
          <div className="container mx-auto px-4 py-16">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
              
              {/* Left Content */}
              <div className="flex-1 max-w-2xl text-white">
                <div className="mb-10">
                  <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white/90 text-sm font-medium mb-6">
                    <Star className="w-4 h-4 mr-2 text-yellow-400" />
                    Rated #1 Business Funding Platform
                  </div>
                  <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight">
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
                <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/20">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary to-blue-600 rounded-2xl mb-4">
                      <Users className="w-8 h-8 text-white" />
                    </div>
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
                    <div className="group relative overflow-hidden rounded-2xl border-2 border-gray-200 hover:border-primary hover:shadow-xl transition-all duration-300 cursor-pointer bg-gradient-to-br from-white to-gray-50/50"
                         onClick={() => navigate('/signup-journey/email-password')}>
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative p-6">
                        <div className="flex items-start space-x-4">
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center group-hover:from-primary/20 group-hover:to-primary/30 transition-all duration-300 shadow-lg">
                            <Building2 className="w-7 h-7 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="text-xl font-bold text-gray-900">For Businesses</h3>
                              <div className="px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">
                                Most Popular
                              </div>
                            </div>
                            <p className="text-gray-600 mb-4">
                              Access funding opportunities, compare options, and streamline your application process.
                            </p>
                            
                            {/* Benefits */}
                            <div className="space-y-3 mb-6">
                              <div className="flex items-center space-x-3 text-sm text-gray-700">
                                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                                  <CheckCircle className="w-3 h-3 text-green-600" />
                                </div>
                                <span className="font-medium">Compare 50+ funding options</span>
                              </div>
                              <div className="flex items-center space-x-3 text-sm text-gray-700">
                                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                                  <CheckCircle className="w-3 h-3 text-green-600" />
                                </div>
                                <span className="font-medium">One application, multiple lenders</span>
                              </div>
                              <div className="flex items-center space-x-3 text-sm text-gray-700">
                                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                                  <CheckCircle className="w-3 h-3 text-green-600" />
                                </div>
                                <span className="font-medium">Free credit score monitoring</span>
                              </div>
                            </div>
                            
                            <Button className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white shadow-lg group-hover:shadow-xl transition-all duration-300">
                              Start Your Application
                              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Lender Dropdown */}
                    <details className="group relative overflow-hidden rounded-2xl border-2 border-gray-200 hover:border-blue-500 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-blue-50/30">
                      <summary className="relative p-6 cursor-pointer list-none">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative flex items-center justify-between">
                          <div className="flex items-start space-x-4">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center group-hover:from-blue-100 group-hover:to-blue-200 transition-all duration-300 shadow-lg">
                              <CreditCard className="w-7 h-7 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-xl font-bold text-gray-900">For Lenders</h3>
                                <div className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                                  Enterprise
                                </div>
                              </div>
                              <p className="text-gray-600">
                                Connect with qualified businesses and streamline your lending process
                              </p>
                            </div>
                          </div>
                          <ChevronDown className="w-5 h-5 text-gray-400 transition-transform duration-200 group-open:rotate-180 flex-shrink-0" />
                        </div>
                      </summary>
                      
                      <div className="px-6 pb-6 border-t border-gray-100">
                        {/* Benefits */}
                        <div className="space-y-3 mb-6 mt-4">
                          <div className="flex items-center space-x-3 text-sm text-gray-700">
                            <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                              <CheckCircle className="w-3 h-3 text-blue-600" />
                            </div>
                            <span className="font-medium">Access pre-qualified leads</span>
                          </div>
                          <div className="flex items-center space-x-3 text-sm text-gray-700">
                            <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                              <CheckCircle className="w-3 h-3 text-blue-600" />
                            </div>
                            <span className="font-medium">Automated application processing</span>
                          </div>
                          <div className="flex items-center space-x-3 text-sm text-gray-700">
                            <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                              <CheckCircle className="w-3 h-3 text-blue-600" />
                            </div>
                            <span className="font-medium">Portfolio management tools</span>
                          </div>
                        </div>
                        
                        {/* Calendly Embed - More compact and styled */}
                        <div className="mb-4 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                                <Users className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">Jamie Mason-Wright</h4>
                                <p className="text-sm text-gray-600">30 Minute Compare Funding</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-1 text-sm text-gray-500">
                              <Clock className="w-4 h-4" />
                              <span>30 min</span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">
                            Web conferencing details provided upon confirmation.
                          </p>
                          <iframe
                            src="https://calendly.com/jamie-comparefunding/30min"
                            title="Book a call with Compare Funding"
                            width="100%"
                            height="320"
                            frameBorder="0"
                            className="rounded-lg border border-gray-300"
                            allowFullScreen
                          ></iframe>
                        </div>
                        
                        <Button variant="outline" className="w-full border-blue-300 hover:bg-blue-50 text-blue-700 hover:text-blue-800 transition-all duration-300">
                          <Users className="w-4 h-4 mr-2" />
                          Book a Demo Call
                        </Button>
                      </div>
                    </details>
                  </div>
                  
                  {/* Login Link */}
                  <div className="text-center mt-8 pt-6 border-t border-gray-200">
                    <p className="text-gray-600">
                      Already have an account?{' '}
                      <Link to="/login" className="font-semibold text-primary hover:text-primary/80 transition-colors underline decoration-2 underline-offset-2">
                        Sign in here
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
      <section className="py-20 bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary to-blue-600 rounded-2xl mb-6">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose Compare Funding?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              We're revolutionizing commercial finance by making it faster, more transparent, and more accessible for everyone.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="group text-center p-6 rounded-2xl hover:bg-white hover:shadow-xl transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Lightning Fast</h3>
              <p className="text-gray-600 leading-relaxed">Get funding decisions in hours, not weeks. Our streamlined process cuts through red tape.</p>
            </div>
            
            <div className="group text-center p-6 rounded-2xl hover:bg-white hover:shadow-xl transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Best Rates</h3>
              <p className="text-gray-600 leading-relaxed">Compare offers from 50+ lenders to ensure you get the most competitive rates available.</p>
            </div>
            
            <div className="group text-center p-6 rounded-2xl hover:bg-white hover:shadow-xl transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Secure & Trusted</h3>
              <p className="text-gray-600 leading-relaxed">Bank-grade security with full transparency. Your data is protected and never shared without consent.</p>
            </div>
            
            <div className="group text-center p-6 rounded-2xl hover:bg-white hover:shadow-xl transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Expert Support</h3>
              <p className="text-gray-600 leading-relaxed">Our team of funding experts guides you through every step of the process.</p>
            </div>
          </div>
          
          {/* Additional Trust Indicators */}
          <div className="mt-16 pt-12 border-t border-gray-200">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Trusted by Industry Leaders</h3>
              <p className="text-gray-600">Join thousands of satisfied businesses and lenders</p>
            </div>
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
              <div className="text-gray-400 font-semibold text-lg">50+ Lenders</div>
              <div className="w-px h-8 bg-gray-300"></div>
              <div className="text-gray-400 font-semibold text-lg">10,000+ Businesses</div>
              <div className="w-px h-8 bg-gray-300"></div>
              <div className="text-gray-400 font-semibold text-lg">£2B+ Funded</div>
              <div className="w-px h-8 bg-gray-300"></div>
              <div className="text-gray-400 font-semibold text-lg">4.9★ Rating</div>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default SignUp;
