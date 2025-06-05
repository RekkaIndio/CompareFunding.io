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
import { Building2, Image as ImageIcon, Loader2, ChevronRight, BadgePoundSterling, MailIcon, PhoneIcon, Mail, Phone } from 'lucide-react';

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
  description: z.string().min(1, 'Business description is required'),
  website: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  logo_url: z.string().optional(),
  address_line1: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  postal_code: z.string().min(1, 'Postal code is required'),
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
      business_email: '',
      business_phone: '',
      vat_number: '',
      annual_revenue: '',
      logo_url: '',
      trading_address_different: false,
      trading_address_line1: '',
      trading_address_city: '',
      trading_address_postal_code: '',
      trading_address_country: 'United Kingdom',
    },
  });

  // Fetch existing profile data if available
  useEffect(() => {
    const fetchBusinessProfile = async () => {
      if (!user) return;

      setIsLoading(true);

      try {
        // First try to fetch from 'businesses' collection (which is where BusinessDetailsForm.tsx saves data)
        let { data, error } = await getDocument('businesses', user.uid);

        // If no data in businesses, try the business_profiles collection as fallback
        if (error || !data) {
          const businessProfilesResult = await getDocument('business_profiles', user.uid);
          data = businessProfilesResult.data;
          error = businessProfilesResult.error;
        }

        if (error) {
          // Not an error if document doesn't exist yet
          setIsLoading(false);
          return;
        }

        if (data) {
          // Extract address fields from the address object
          const addressData = data.address || {};
          const tradingAddressData = data.trading_address || {};

          setProfileExists(true);
          setProfile(data);

          // Update form values with the extracted address fields, logo URL, and website summary
          form.reset({
            business_name: data.business_name || data.name || '',
            industry_sector: data.industry_sector || data.industry || '',
            company_size: data.company_size || '',
            company_number: data.company_number || '',
            description: data.description || data.businessDescription || data.website_summary || '', // Use description or website summary
            website: data.website || '',
            business_email: data.business_email || '',
            business_phone: data.business_phone || '',
            address_line1: addressData.line1 || addressData.street || '',
            city: addressData.city || '',
            postal_code: addressData.postal_code || '',
            country: addressData.country || 'United Kingdom',
            trading_address_different: !!data.trading_address,
            trading_address_line1: tradingAddressData.line1 || '',
            trading_address_city: tradingAddressData.city || '',
            trading_address_postal_code: tradingAddressData.postal_code || '',
            trading_address_country: tradingAddressData.country || 'United Kingdom',
            incorporation_date: data.incorporation_date
              ? new Date(data.incorporation_date).toISOString().split('T')[0]
              : '',
            logo_url: data.logo_url || '',
            vat_number: data.vat_number || '',
            annual_revenue: data.forecastRevenue || data.annual_revenue || '',
          });
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        toast.error('Failed to load business profile');
      } finally {
        setIsLoading(false);
      }
    };

    // Fetch profile data when component mounts
    const fetchProfile = async () => {
      if (!user) return;

      setIsLoading(true);

      try {
        // First try to fetch from 'businesses' collection (which is where BusinessDetailsForm.tsx saves data)
        let { data, error } = await getDocument('businesses', user.uid);

        // If no data in businesses, try the business_profiles collection as fallback
        if (error || !data) {
          const businessProfilesResult = await getDocument('businesses', user.uid);
          data = businessProfilesResult.data;
          error = businessProfilesResult.error;
        }

        if (error) {
          // Not an error if document doesn't exist yet
          setIsLoading(false);
          return;
        }

        if (data) {
          // Extract address fields from the address object
          const addressData = data.address || {};
          const tradingAddressData = data.trading_address || {};

          setProfileExists(true);
          setProfile(data);

          // Update form values with the extracted address fields, logo URL, and website summary
          form.reset({
            business_name: data.business_name || data.name || '',
            industry_sector: data.industry_sector || data.industry || '',
            company_size: data.company_size || '',
            company_number: data.company_number || '',
            description: data.description || data.businessDescription || data.website_summary || '', // Use description or website summary
            website: data.website || '',
            business_email: data.business_email || '',
            business_phone: data.business_phone || '',
            address_line1: addressData.line1 || addressData.street || '',
            city: addressData.city || '',
            postal_code: addressData.postal_code || '',
            country: addressData.country || 'United Kingdom',
            trading_address_different: !!data.trading_address,
            trading_address_line1: tradingAddressData.line1 || '',
            trading_address_city: tradingAddressData.city || '',
            trading_address_postal_code: tradingAddressData.postal_code || '',
            trading_address_country: tradingAddressData.country || 'United Kingdom',
            incorporation_date: data.incorporation_date
              ? new Date(data.incorporation_date).toISOString().split('T')[0]
              : '',
            logo_url: data.logo_url || '',
            vat_number: data.vat_number || '',
            annual_revenue: data.forecastRevenue || data.annual_revenue || '',
          });
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        toast.error('Failed to load business profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user, form]);

  // Call updateFormWithBusinessData when component mounts
  useEffect(() => {
    if (user && !isLoading) {
      updateFormWithBusinessData();
    }
  }, [user, isLoading]);    // Add a function to update form values with business data
  const updateFormWithBusinessData = async () => {
    if (!user) return;

    try {
      // First check the businesses collection
      const { data: businessData, error: businessError } = await getDocument('businesses', user.uid);

      if (businessData) {


        // Get current form values
        const currentValues = form.getValues();

        // Extract relevant fields
        const websiteSummary = businessData.website_summary || '';
        const businessDescription = businessData.businessDescription || '';
        const logoUrl = businessData.logo_url || '';
        const addressData = businessData.address || {};

        // Update form if the field is currently empty
        if (!currentValues.description) {
          form.setValue('description', businessDescription || websiteSummary);
        }

        if (!currentValues.logo_url && logoUrl) {
          form.setValue('logo_url', logoUrl);
        }

        if (!currentValues.business_name && businessData.business_name) {
          form.setValue('business_name', businessData.business_name);
        }

        if (!currentValues.company_number && businessData.company_number) {
          form.setValue('company_number', businessData.company_number);
        }

        if (!currentValues.industry_sector && businessData.industry) {
          form.setValue('industry_sector', businessData.industry);
        }

        if (!currentValues.company_size && businessData.company_size) {
          form.setValue('company_size', businessData.company_size);
        }

        if (!currentValues.website && businessData.website) {
          form.setValue('website', businessData.website);
        }

        // Update address fields if they're empty
        if (!currentValues.address_line1 && addressData.street) {
          form.setValue('address_line1', addressData.street);
        }

        if (!currentValues.city && addressData.city) {
          form.setValue('city', addressData.city);
        }

        if (!currentValues.postal_code && addressData.postal_code) {
          form.setValue('postal_code', addressData.postal_code);
        }

        if (addressData.country && !currentValues.country) {
          form.setValue('country', addressData.country);
        }

        toast.success('Loaded business details from your profile');
      }
    } catch (err) {
      console.error('Error checking for business data:', err);
    }
  };

  const onSubmit = async (values: BusinessProfileFormValues) => {
    if (!user) return;

    setIsSubmitting(true);

    try {
      console.log('Form values:', values); // Debug log

      // Format incorporation date
      const incorporationDate = values.incorporation_date ? new Date(values.incorporation_date).toISOString() : null;

      // Create a complete address object
      const address = {
        line1: values.address_line1,
        street: values.address_line1, // Include both for compatibility
        city: values.city,
        postal_code: values.postal_code,
        country: values.country || 'United Kingdom',
      };

      // Create trading address if different
      const tradingAddress = values.trading_address_different ? {
        line1: values.trading_address_line1,
        street: values.trading_address_line1,
        city: values.trading_address_city,
        postal_code: values.trading_address_postal_code,
        country: values.trading_address_country || 'United Kingdom',
      } : null;

      // Utility to remove undefined values (Firestore does not allow undefined)
      function cleanObject(obj: any) {
        if (obj === undefined) return null;
        if (obj === null || typeof obj !== 'object') return obj;
        const cleaned: any = Array.isArray(obj) ? [] : {};
        for (const key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = obj[key];
            if (value !== undefined) {
              cleaned[key] = cleanObject(value);
            }
          }
        }
        return cleaned;
      }

      const profileDataRaw = {
        business_name: values.business_name,
        name: values.business_name, // For compatibility with businesses collection
        industry_sector: values.industry_sector,
        industry: values.industry_sector, // For compatibility with businesses collection
        company_size: values.company_size,
        company_number: values.company_number,
        description: values.description,
        website: values.website,
        business_email: values.business_email,
        business_phone: values.business_phone,
        vat_number: values.vat_number,
        annual_revenue: values.annual_revenue,
        forecastRevenue: values.annual_revenue, // For compatibility with businesses collection
        address: address,
        trading_address: tradingAddress,
        incorporation_date: incorporationDate,
        updatedAt: new Date(),
      };
      const profileData = cleanObject(profileDataRaw);

      // Save to businesses collection
      let businessProfilesResult;
      if (profileExists) {
        // Update existing profile
        businessProfilesResult = await updateDocument('businesses', user.uid, profileData);
      } else {
        // Insert new profile
        businessProfilesResult = await createDocument('businesses', profileData, user.uid);
      }

      // Also save to businesses collection for consistency
      const businessesResult = await updateDocument('businesses', user.uid, {
        ...profileData,
        updatedAt: new Date()
      });

      if (businessProfilesResult.error && businessesResult.error) {
        console.error('Error saving business profile:', businessProfilesResult.error);
        toast.error('Failed to save business profile');
        return;
      }

      toast.success('Business profile saved successfully');
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
      // No longer extracting colors from logo
      const colors = [];

      // Update the profile with both logo and colors
      const { error } = await updateDocument('businesses', user.uid, {
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

  // Add logo fetching and saving logic
  useEffect(() => {
    // This functionality is now handled in the first useEffect
    const fetchAndSaveLogo = () => {
      const website = form.getValues('website');
      if (website) {
        fetchWebsiteLogo(website);
      }
    };

    // No need to call fetchBusinessProfile here as it's handled elsewhere
  }, [user, form]);

  const fetchAndSaveLogo = async (website: string) => {
    if (!website) return;

    try {
      await fetchWebsiteLogo(website);
      // The logo URL is set inside fetchWebsiteLogo and saved via saveLogo.
    } catch (error) {
      console.error('Error fetching or saving logo:', error);
      toast.error('Failed to fetch or save logo');
    }
  };

  // Call fetchAndSaveLogo when the website field changes
  useEffect(() => {
    const website = form.getValues('website');
    if (website) {
      fetchAndSaveLogo(website);
    }
  }, [form.watch('website')]);

  if (isLoading) {
    return (
      <PageLayout showSidebar={true}>
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
    <PageLayout showSidebar={true}>
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
        {/* Professional Header */}
        <header className="bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm">
          <div className="max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8 py-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Business Profile</h1>
                <p className="text-slate-600 mt-1">Complete your business profile to help lenders understand your financing needs</p>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8 py-8">
          <Card className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/50 overflow-hidden">
            <div className="bg-slate-800 px-6 py-4">
              <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Business Details
              </CardTitle>
              <CardDescription className="text-slate-300 mt-1">
                Provide accurate information to improve matching with the right lenders
              </CardDescription>
            </div>
            <CardContent className="p-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-slate-900" >
                    <FormField
                      control={form.control}
                      name="business_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your business name" className="bg-white text-slate-900" {...field} />
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
                            <Input placeholder="e.g. 12345678" className="bg-white text-slate-900" {...field} />
                          </FormControl>
                          <FormDescription>
                            UK Companies House registration number if applicable
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-slate-900">
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
                              <SelectTrigger className="bg-white text-slate-900">
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
                              <SelectTrigger className="bg-white text-slate-900">
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
                        <FormLabel className="text-slate-900">Business Description</FormLabel>
                        <FormControl>
                          <Textarea
                            value={field.value || ''}
                            onChange={field.onChange}
                            placeholder="Briefly describe your business activities and services"
                            className="resize-none min-h-[100px] bg-white text-slate-900"
                          />
                        </FormControl>
                        <FormDescription>
                          Provide a clear description of your business activities
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-slate-900">
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
                                className="flex-grow bg-white text-slate-900"
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
                              className="whitespace-nowrap text-white"
                            >
                              <ImageIcon className="h-4 w-4 mr-2 text-white" />
                              <span className="text-white">Fetch Logo</span>
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
                            <Input type="date" className="bg-white text-slate-900" {...field} />
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
                    <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                      <Mail className="h-5 w-5 text-slate-700" />
                      Address Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-slate-900">
                      <FormField
                        control={form.control}
                        name="address_line1"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address Line</FormLabel>
                            <FormControl>
                              <Input placeholder="Street address" className="bg-white text-slate-900" {...field} />
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
                              <Input placeholder="City" className="bg-white text-slate-900" {...field} />
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
                              <Input placeholder="Postal code" className="bg-white text-slate-900" {...field} />
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
                              <Input placeholder="Country" className="bg-white text-slate-900" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                      <Phone className="h-5 w-5 text-slate-700" />
                      Contact Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-slate-900">
                      <FormField
                        control={form.control}
                        name="business_email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Business Email</FormLabel>
                            <FormControl>
                              <div className="flex">
                                <MailIcon className="w-4 h-4 text-muted-foreground absolute mt-2.5 ml-2.5" />
                                <Input className="pl-8 bg-white text-slate-900" type="email" placeholder="contact@business.com" {...field} />
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
                                <Input className="pl-8 bg-white text-slate-900" type="tel" placeholder="+44" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <CardFooter className="px-0 pt-6 flex justify-end gap-2 border-t border-slate-200">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate('/business/dashboard')}
                      className="px-6 py-2.5"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-gradient-to-r from-[#ff8800] to-[#ffaa00] hover:from-[#ff9900] hover:to-[#ffbb00] text-slate-900 font-semibold px-6 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                      disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin text-white" />
                          <span className="text-white">Saving...</span>
                        </>
                        ) : (
                        <span className="text-white">Save Profile</span>
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

