import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getDocument, updateDocument, createDocument } from '@/firebase';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import PageLayout from '@/components/PageLayout';
import { Building2, Image as ImageIcon, Loader2, ChevronRight, BadgePoundSterling, MailIcon, PhoneIcon } from 'lucide-react';

// Add window type definition for logo fetch timer
declare global {
  interface Window {
    logoFetchTimer?: number;
  }
}

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

const businessProfileSchema = z.object({
  business_name: z.string().min(2, 'Business name is required'),
  industry_sector: z.string().min(1, 'Industry is required'),
  company_size: z.string().min(1, 'Company size is required'),
  company_number: z.string().optional(),
  description: z.string().optional(),
  website: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  logo_url: z.string().optional(),
  address_line1: z.string().optional(),
  city: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().optional(),
  incorporation_date: z.string().optional(),
  // Additional business fields
  vat_number: z.string().optional(),
  business_email: z.string().email('Invalid email address').optional().or(z.literal('')),
  business_phone: z.string().optional(),
  annual_revenue: z.string().optional(),
  number_of_employees: z.string().optional(),
  trading_address_different: z.boolean().optional(),
  trading_address_line1: z.string().optional(),
  trading_address_city: z.string().optional(),
  trading_address_postal_code: z.string().optional(),
  trading_address_country: z.string().optional(),
  social_media: z.object({
    linkedin: z.string().optional(),
    twitter: z.string().optional(),
    facebook: z.string().optional()
  }).optional()
});

type BusinessProfileFormValues = z.infer<typeof businessProfileSchema>;

// Helper function to get a default logo for service
const getDefaultLogoForService = (domain: string): string | null => {
  if (domain.includes('firebaseapp.com')) {
    return 'https://www.gstatic.com/devrel-devsite/prod/v2210deb8920cd4a55bd580441aa58e7853afc04b39a9d9ac4198e1cd7fbe04ef/firebase/images/touchicon-180.png';
  }
  if (domain.includes('netlify.app')) {
    return 'https://www.netlify.com/favicon.ico';
  }
  if (domain.includes('vercel.app')) {
    return 'https://assets.vercel.com/image/upload/front/favicon/vercel/180x180.png';
  }
  if (domain.includes('github.io')) {
    return 'https://github.githubassets.com/favicons/favicon.svg';
  }
  return null;
};

// Helper function to generate a letter-based logo
const generateLetterLogo = (name: string): string => {
  if (!name) return '';
  
  const initials = name.trim().substring(0, 2).toUpperCase();
  const colors = [
    '#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6',
    '#1abc9c', '#d35400', '#34495e', '#16a085', '#c0392b'
  ];
  
  const colorIndex = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  const bgColor = colors[colorIndex];
  
  const svgTemplate = `
    <svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
      <rect width="128" height="128" fill="${bgColor}"/>
      <text x="50%" y="50%" font-size="64" font-family="Arial, sans-serif" 
            fill="white" text-anchor="middle" dominant-baseline="central">
        ${initials}
      </text>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svgTemplate)}`;
};

const BusinessProfile = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileExists, setProfileExists] = useState(false);
  const [profile, setProfile] = useState<BusinessProfileFormValues | null>(null);
  const navigate = useNavigate();

  const form = useForm<BusinessProfileFormValues>({
    resolver: zodResolver(businessProfileSchema),
    defaultValues: {
      business_name: '',
      industry_sector: '',
      company_size: '',
      company_number: '',
      description: '',
      website: '',
      address_line1: '',
      city: '',
      postal_code: '',
      country: 'United Kingdom',
      incorporation_date: '',
    },
  });

  // Fetch existing profile data if available
  useEffect(() => {
    const fetchBusinessProfile = async () => {
      if (!user) return;
      
      setIsLoading(true);
      
      try {
        const { data, error } = await getDocument('business_profiles', user.uid);
          
        if (error) {
          // Not an error if document doesn't exist yet
          setIsLoading(false);
          return;
        }
        
        if (data) {
          // Convert address from JSON to form fields if needed
          const addressData = data.address as any || {};
          
          setProfileExists(true);
          setProfile(data);
          
          // Update form values
          form.reset({
            business_name: data.business_name || '',
            industry_sector: data.industry_sector || '',
            company_size: data.company_size || '',
            company_number: data.company_number || '',
            description: data.description || '',
            website: data.website || '',
            address_line1: addressData.line1 || '',
            city: data.city || '',
            postal_code: data.postal_code || '',
            country: data.country || 'United Kingdom',
            incorporation_date: data.incorporation_date ? new Date(data.incorporation_date).toISOString().split('T')[0] : '',
          });
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        toast.error('Failed to load business profile');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBusinessProfile();
  }, [user, form]);

  const onSubmit = async (values: BusinessProfileFormValues) => {
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
      // Create address object
      const address = {
        line1: values.address_line1,
      };
      
      // Format incorporation date
      const incorporationDate = values.incorporation_date ? new Date(values.incorporation_date).toISOString() : null;
      
      const profileData = {
        business_name: values.business_name,
        industry_sector: values.industry_sector,
        company_size: values.company_size,
        company_number: values.company_number || null,
        description: values.description || null,
        website: values.website || null,
        address: address,
        city: values.city || null,
        postal_code: values.postal_code || null,
        country: values.country || 'United Kingdom',
        incorporation_date: incorporationDate,
      };
      
      let result;
      
      if (profileExists) {
        // Update existing profile
        result = await updateDocument('business_profiles', user.uid, profileData);
      } else {
        // Insert new profile
        result = await createDocument('business_profiles', profileData, user.uid);
      }
      
      if (result.error) {
        console.error('Error saving business profile:', result.error);
        toast.error('Failed to save business profile');
        return;
      }
      
      toast.success('Business profile saved successfully');
      
      // Navigate to dashboard or accounting connection
      navigate('/business/dashboard');
    } catch (err) {
      console.error('Error saving profile:', err);
      toast.error('Failed to save business profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add logo fetching function
  const fetchWebsiteLogo = (websiteUrl: string) => {
    if (!websiteUrl) return;

    try {
      let domain = websiteUrl;
      
      if (!domain.startsWith('http://') && !domain.startsWith('https://')) {
        domain = 'https://' + domain;
      }
      
      try {
        const url = new URL(domain);
        domain = url.hostname;
      } catch (e) {
        console.error('Invalid URL format:', domain);
        toast.error('Please enter a valid website URL');
        return;
      }

      if (!domain) return;
      
      const isHostingService = 
        domain.includes('firebaseapp.com') || 
        domain.includes('netlify.app') || 
        domain.includes('vercel.app') ||
        domain.includes('github.io');
        
      if (isHostingService) {
        const logoUrl = getDefaultLogoForService(domain);
        if (logoUrl) {
          form.setValue('logo_url', logoUrl);
          toast.success('Default logo set for hosting service');
          saveLogo(logoUrl);
          return;
        }
      }

      // Try direct favicon
      const directFaviconUrl = `https://${domain}/favicon.ico`;
      
      const directImg = new Image();
      directImg.onload = () => {
        form.setValue('logo_url', directFaviconUrl);
        toast.success('Logo fetched successfully');
        saveLogo(directFaviconUrl);
      };
      
      directImg.onerror = () => {
        // Try Google's service
        const googleLogoUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
        
        const googleImg = new Image();
        googleImg.onload = () => {
          checkIfDefaultFavicon(googleLogoUrl, (isDefault) => {
            if (isDefault) {
              tryDuckDuckGoFavicon();
            } else {
              form.setValue('logo_url', googleLogoUrl);
              toast.success('Logo fetched successfully');
              saveLogo(googleLogoUrl);
            }
          });
        };
        
        googleImg.onerror = tryDuckDuckGoFavicon;
        googleImg.src = googleLogoUrl;
      };
      
      function tryDuckDuckGoFavicon() {
        const ddgLogoUrl = `https://icons.duckduckgo.com/ip3/${domain}.ico`;
        
        const ddgImg = new Image();
        ddgImg.onload = () => {
          form.setValue('logo_url', ddgLogoUrl);
          toast.success('Logo fetched successfully');
          saveLogo(ddgLogoUrl);
        };
        
        ddgImg.onerror = () => {
          const letterLogo = generateLetterLogo(form.getValues('business_name') || domain);
          form.setValue('logo_url', letterLogo);
          toast.info('Generated a placeholder logo for your business');
          saveLogo(letterLogo);
        };
        
        ddgImg.src = ddgLogoUrl;
      }
      
      directImg.src = directFaviconUrl;
    } catch (error) {
      console.error('Error fetching logo:', error);
      toast.error('Failed to fetch logo');
      
      if (form.getValues('business_name')) {
        const letterLogo = generateLetterLogo(form.getValues('business_name'));
        form.setValue('logo_url', letterLogo);
        saveLogo(letterLogo);
      }
    }
  };

  // Function to save logo URL and extract colors
  const saveLogo = async (logoUrl: string) => {
    if (!user?.uid) return;
    
    try {
      // Extract colors from the logo
      const colors = await extractColors(logoUrl);
      
      // Update the profile with both logo and colors
      const { error } = await updateDocument('business_profiles', user.uid, {
        logo_url: logoUrl,
        theme_colors: colors
      });
      
      if (error) {
        console.error('Error saving logo:', error);
        toast.error('Failed to save logo');
        return false;
      }
      
      // Store colors in localStorage
      localStorage.setItem('theme_colors', JSON.stringify(colors));
      
      toast.success('Logo and theme colors saved successfully');
      return true;
    } catch (err) {
      console.error('Exception saving logo:', err);
      toast.error('Failed to save logo');
      return false;
    }
  };

  // Handle website input change with debounce
  const handleWebsiteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newWebsite = e.target.value;
    form.setValue('website', newWebsite);
    
    if (window.logoFetchTimer) {
      clearTimeout(window.logoFetchTimer);
    }
    
    window.logoFetchTimer = window.setTimeout(() => {
      if (newWebsite) {
        fetchWebsiteLogo(newWebsite);
      }
    }, 1000);
  };

  // Helper function to check if favicon is default
  const checkIfDefaultFavicon = (imageUrl: string, callback: (isDefault: boolean) => void) => {
    callback(false); // Simplified check for demo
  };

  if (isLoading) {
    return (
      <PageLayout>
        <div className="container py-12 flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-fundhub-blue" />
            <p className="text-muted-foreground">Loading business profile...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="container py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Business Profile</h1>
          <p className="text-muted-foreground mb-8">
            Complete your business profile to help lenders understand your financing needs
          </p>

          <Card>
            <CardHeader>
              <CardTitle>Business Details</CardTitle>
              <CardDescription>
                Provide accurate information to improve matching with the right lenders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="business_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your business name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="company_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Registration Number</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. 12345678" {...field} />
                          </FormControl>
                          <FormDescription>
                            UK Companies House registration number if applicable
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="industry_sector"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Industry Sector *</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
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
                          <FormLabel>Company Size *</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website</FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input 
                                placeholder="https://example.com" 
                                {...field} 
                                onChange={handleWebsiteChange}
                                className="flex-grow"
                              />
                            </FormControl>
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={() => {
                                if (field.value) {
                                  fetchWebsiteLogo(field.value);
                                } else {
                                  toast.error('Please enter a website URL first');
                                }
                              }}
                              className="whitespace-nowrap"
                            >
                              <ImageIcon className="h-4 w-4 mr-2" />
                              Fetch Logo
                            </Button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="incorporation_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Incorporation Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormDescription>
                            When was your business incorporated?
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="col-span-2">
                      <FormLabel>Company Logo</FormLabel>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="border rounded-md p-2 h-20 w-20 flex items-center justify-center bg-muted/20">
                          {form.watch('logo_url') ? (
                            <img 
                              src={form.watch('logo_url')} 
                              alt="Company Logo" 
                              className="max-h-full max-w-full object-contain"
                              onError={(e) => console.log('Logo failed to load:', e)}
                            />
                          ) : (
                            <ImageIcon className="h-8 w-8 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">
                            {form.watch('logo_url') ? 'Company logo detected' : 'No logo detected'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {form.watch('logo_url')
                              ? 'Logo will be saved with your profile'
                              : 'Enter your company website URL to automatically fetch your logo, or click "Fetch Logo"'
                            }
                          </p>
                        </div>
                      </div>
                    </div>

                  <div>
                    <h3 className="text-lg font-medium mb-4">Address Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="address_line1"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address Line</FormLabel>
                            <FormControl>
                              <Input placeholder="Street address" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input placeholder="City" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="postal_code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Postal Code</FormLabel>
                            <FormControl>
                              <Input placeholder="Postal code" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Country</FormLabel>
                            <FormControl>
                              <Input placeholder="Country" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Contact Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="business_email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Business Email</FormLabel>
                            <FormControl>
                              <div className="flex">
                                <MailIcon className="w-4 h-4 text-muted-foreground absolute mt-2.5 ml-2.5" />
                                <Input className="pl-8" type="email" placeholder="contact@business.com" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="business_phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Business Phone</FormLabel>
                            <FormControl>
                              <div className="flex">
                                <PhoneIcon className="w-4 h-4 text-muted-foreground absolute mt-2.5 ml-2.5" />
                                <Input className="pl-8" type="tel" placeholder="+44" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="vat_number"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>VAT Number</FormLabel>
                            <FormControl>
                              <Input placeholder="GB123456789" {...field} />
                            </FormControl>
                            <FormDescription>If your business is VAT registered</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="annual_revenue"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Annual Revenue</FormLabel>
                            <FormControl>
                              <div className="flex">
                                <BadgePoundSterling className="w-4 h-4 text-muted-foreground absolute mt-2.5 ml-2.5" />
                                <Input className="pl-8" placeholder="100000" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Trading Address */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <h3 className="text-lg font-medium">Trading Address</h3>
                      <FormField
                        control={form.control}
                        name="trading_address_different"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal">Different from registered address</FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>

                    {form.watch('trading_address_different') && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="trading_address_line1"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Trading Address Line</FormLabel>
                              <FormControl>
                                <Input placeholder="Street address" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="trading_address_city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City</FormLabel>
                              <FormControl>
                                <Input placeholder="City" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="trading_address_postal_code"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Postal Code</FormLabel>
                              <FormControl>
                                <Input placeholder="Postal code" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="trading_address_country"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Country</FormLabel>
                              <FormControl>
                                <Input placeholder="Country" {...field} defaultValue="United Kingdom" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </div>

                  <CardFooter className="px-0 pt-6 flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate('/business/dashboard')}
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
                        'Save Profile'
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
};

export default BusinessProfile;
