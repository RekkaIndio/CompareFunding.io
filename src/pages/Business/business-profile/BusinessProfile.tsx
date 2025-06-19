import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useNavbar } from '@/contexts/NavbarContext';
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
import { Building2, Image as ImageIcon, Loader2, ChevronRight, BadgePoundSterling, MailIcon, PhoneIcon, Mail, Phone, User, Briefcase } from 'lucide-react';

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
  // Personal information fields from signup
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  personal_email: z.string().email('Invalid email address').optional().or(z.literal('')),
  mobile: z.string().optional(),
  role: z.string().optional(),
  social_media: z.object({
    linkedin: z.string().optional(),
    twitter: z.string().optional(),
    facebook: z.string().optional()
  }).optional()
});

type BusinessProfileFormValues = z.infer<typeof businessProfileSchema>;

// Helper function to get a default logo for service
const getDefaultLogoForService = (domain: string): string | null => {
  if (domain.includes('firebaseapp.com') || domain.includes('firebase.google.com')) {
    return 'https://www.gstatic.com/devrel-devsite/prod/v2210deb8920cd4a55bd580441aa58e7853afc04b39a9d9ac4198e1cd7fbe04ef/firebase/images/touchicon-180.png';
  }
  if (domain.includes('netlify.app') || domain.includes('netlify.com')) {
    return 'https://www.netlify.com/favicon.ico';
  }
  if (domain.includes('vercel.app') || domain.includes('vercel.com')) {
    return 'https://assets.vercel.com/image/upload/front/favicon/vercel/180x180.png';
  }
  if (domain.includes('github.io') || domain.includes('github.com')) {
    return 'https://github.githubassets.com/favicons/favicon.svg';
  }
  if (domain.includes('herokuapp.com')) {
    return 'https://www.herokucdn.com/favicons/favicon.ico';
  }
  if (domain.includes('wordpress.com')) {
    return 'https://s0.wp.com/i/favicon.ico';
  }
  if (domain.includes('wix.com')) {
    return 'https://static.wixstatic.com/media/favicon.ico';
  }
  if (domain.includes('squarespace.com')) {
    return 'https://static1.squarespace.com/static/ta/5134cbefe4b0c6fb04df8065/10515/assets/favicon.ico';
  }
  return null;
};

// Helper function to generate a letter-based logo
const generateLetterLogo = (name: string, simplified = false): string => {
  if (!name) return '';
  
  // Get initials from business name (first letter of each word, max 2 characters)
  const words = name.trim().split(/\s+/);
  let initials = '';
  
  if (words.length === 1) {
    // Single word: take first 1-2 characters
    initials = name.trim().substring(0, simplified ? 1 : 2).toUpperCase();
  } else {
    // Multiple words: take first letter of first two words
    initials = words.slice(0, 2).map(word => word.charAt(0)).join('').toUpperCase();
  }
  
  // Professional color palette
  const colors = [
    '#1f2937', // slate-800
    '#0f766e', // teal-700  
    '#0369a1', // sky-700
    '#7c3aed', // violet-600
    '#dc2626', // red-600
    '#ea580c', // orange-600
    '#059669', // emerald-600
    '#4338ca', // indigo-600
    '#9333ea', // purple-600
    '#be185d'  // pink-600
  ];
  
  // Use a deterministic color based on the name
  const colorIndex = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  const bgColor = colors[colorIndex];
  
  // Create a simpler SVG if simplified is true
  if (simplified) {
    const simpleSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
      <rect width="64" height="64" fill="${bgColor}" rx="8"/>
      <text x="50%" y="50%" font-size="28" font-family="system-ui, -apple-system, sans-serif" font-weight="600" fill="white" text-anchor="middle" dominant-baseline="central">${initials}</text>
    </svg>`;
    return `data:image/svg+xml;base64,${btoa(simpleSvg)}`;
  }
  
  // Create a professional SVG logo
  const svgTemplate = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
    <defs>
      <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${bgColor};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${adjustColorBrightness(bgColor, -20)};stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="128" height="128" fill="url(#grad1)" rx="16"/>
    <text x="50%" y="50%" font-size="48" font-family="system-ui, -apple-system, sans-serif" font-weight="600" 
          fill="white" text-anchor="middle" dominant-baseline="central">${initials}</text>
  </svg>`;
  
  return `data:image/svg+xml;base64,${btoa(svgTemplate)}`;
};

// Helper function to adjust color brightness
const adjustColorBrightness = (hex: string, percent: number): string => {
  // Remove the hash if present
  hex = hex.replace('#', '');
  
  // Parse the hex color
  const num = parseInt(hex, 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  
  return `#${(0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1)}`;
};

const BusinessProfile = () => {
  const { user } = useAuth();
  const { showNavbar } = useNavbar();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileExists, setProfileExists] = useState(false);
  const [profile, setProfile] = useState<BusinessProfileFormValues | null>(null);
  const navigate = useNavigate();

  // Ensure navbar is visible when component mounts
  useEffect(() => {
    showNavbar();
  }, [showNavbar]);

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
      first_name: '',
      last_name: '',
      personal_email: '',
      mobile: '',
      role: '',
    },
  });

  // Consolidated function to fetch and populate business profile data
  const fetchAndPopulateProfile = async () => {
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

        // Try to get saved credit report data to extract address and incorporation date information
        let creditReportAddress = null;
        let creditReportIncorporationDate = null;
        try {
          // Check for credit report data in the credit_score subcollection
          const creditScoreDoc = await getDocument('businesses', `${user.uid}/credit_score/latest`);
          
          if (creditScoreDoc?.data) {
            // Extract address from raw credit report
            const rawReport = creditScoreDoc.data.raw_report;
            
            // Extract address
            if (rawReport?.contactInformation?.mainAddress?.simpleValue) {
              creditReportAddress = rawReport.contactInformation.mainAddress.simpleValue;
            } else if (rawReport?.companyIdentification?.basicInformation?.contactAddress?.simpleValue) {
              creditReportAddress = rawReport.companyIdentification.basicInformation.contactAddress.simpleValue;
            } else if (creditScoreDoc.data.contact_address) {
              creditReportAddress = creditScoreDoc.data.contact_address;
            }

            // Extract incorporation date from raw credit report
            if (rawReport?.companyIdentification?.basicInformation?.companyRegistrationDate) {
              creditReportIncorporationDate = rawReport.companyIdentification.basicInformation.companyRegistrationDate;
            } else if (creditScoreDoc.data.incorporation_date) {
              creditReportIncorporationDate = creditScoreDoc.data.incorporation_date;
            } else if (creditScoreDoc.data.registration_date) {
              creditReportIncorporationDate = creditScoreDoc.data.registration_date;
            }
          }
          
          // If not found in credit_score subcollection, try the main document's credit_info
          if (!creditReportAddress && data.credit_info?.contact_address) {
            creditReportAddress = data.credit_info.contact_address;
          }
          
          if (!creditReportIncorporationDate && data.credit_info?.incorporation_date) {
            creditReportIncorporationDate = data.credit_info.incorporation_date;
          } else if (!creditReportIncorporationDate && data.credit_info?.registration_date) {
            creditReportIncorporationDate = data.credit_info.registration_date;
          }
        } catch (creditError) {
          // Silently continue with saved data if credit report data is not available
        }

        // Parse credit report address if available
        let parsedCreditAddress = null;
        if (creditReportAddress) {
          // Parse the credit report address string
          // Typical format: "Street Address, City, Postal Code" or variations
          const addressParts = creditReportAddress.split(',').map(part => part.trim());
          
          if (addressParts.length >= 2) {
            parsedCreditAddress = {
              line1: addressParts[0] || '',
              city: addressParts[addressParts.length - 2] || '',
              postal_code: addressParts[addressParts.length - 1] || '',
              country: 'United Kingdom'
            };
          }
        }

        // Extract incorporation date - prefer credit report date (most authoritative)
        let incorporationDate = creditReportIncorporationDate || data.incorporation_date || '';
        
        // If still no incorporation date, check credit_info in multiple locations as fallback
        if (!incorporationDate && data.credit_info) {
          incorporationDate = data.credit_info.incorporation_date || 
                            data.credit_info.registration_date || 
                            data.credit_info.details?.incorporation_date ||
                            data.credit_info.details?.registration_date ||
                            data.credit_info.company?.incorporation_date ||
                            data.credit_info.company?.registration_date ||
                            '';
        }

        setProfileExists(true);
        setProfile(data);

        // Always prefer credit report address if available (it's more authoritative)
        // Fall back to saved address data if no credit report address
        const finalAddress = parsedCreditAddress || addressData;

        // Update form values with all available data
        form.reset({
          business_name: data.business_name || data.name || '',
          industry_sector: data.industry_sector || data.industry || '',
          company_size: data.company_size || '',
          company_number: data.company_number || '',
          description: data.description || data.businessDescription || data.website_summary || '',
          website: data.website || '',
          business_email: data.business_email || '',
          business_phone: data.business_phone || '',
          address_line1: finalAddress.line1 || finalAddress.street || '',
          city: finalAddress.city || '',
          postal_code: finalAddress.postal_code || '',
          country: finalAddress.country || 'United Kingdom',
          trading_address_different: !!data.trading_address,
          trading_address_line1: tradingAddressData.line1 || '',
          trading_address_city: tradingAddressData.city || '',
          trading_address_postal_code: tradingAddressData.postal_code || '',
          trading_address_country: tradingAddressData.country || 'United Kingdom',
          incorporation_date: incorporationDate
            ? (() => {
                try {
                  // Handle different date formats from credit reports
                  let dateToFormat = incorporationDate;
                  
                  // If date is in DD/MM/YYYY format (common in UK credit reports), convert to ISO
                  if (typeof dateToFormat === 'string' && dateToFormat.includes('/')) {
                    const dateParts = dateToFormat.split('/');
                    if (dateParts.length === 3) {
                      // Convert DD/MM/YYYY to YYYY-MM-DD
                      const [day, month, year] = dateParts;
                      dateToFormat = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                    }
                  }
                  
                  return new Date(dateToFormat).toISOString().split('T')[0];
                } catch (dateError) {
                  return '';
                }
              })()
            : '',
          logo_url: data.logo_url || '',
          vat_number: data.vat_number || '',
          annual_revenue: data.forecastRevenue || data.annual_revenue || '',
          first_name: data.firstName || data.first_name || '',
          last_name: data.lastName || data.last_name || '',
          personal_email: data.email || data.personal_email || '',
          mobile: data.mobile || '',
          role: data.role || '',
        });
      }
    } catch (err) {
      toast.error('Failed to load business profile');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch profile data when component mounts
  useEffect(() => {
    fetchAndPopulateProfile();
  }, [user, form]);

  const onSubmit = async (values: BusinessProfileFormValues) => {
    if (!user) return;

    setIsSubmitting(true);

    try {
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
        // Personal information from signup
        firstName: values.first_name,
        first_name: values.first_name,
        lastName: values.last_name,
        last_name: values.last_name,
        email: values.personal_email,
        personal_email: values.personal_email,
        mobile: values.mobile,
        role: values.role,
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
        toast.error('Failed to save business profile');
        return;
      }

      toast.success('Business profile saved successfully');
    } catch (err) {
      toast.error('Failed to save business profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add logo fetching function
  const fetchWebsiteLogo = async (websiteUrl: string) => {
    if (!websiteUrl) return;
    
    try {
      // Extract domain from URL
      let domain = websiteUrl;
      // Make sure we have a proper URL with protocol
      if (!domain.startsWith('http://') && !domain.startsWith('https://')) {
        domain = 'https://' + domain;
      }
      
      try {
        const url = new URL(domain);
        domain = url.hostname;
      } catch (e) {
        // Try to extract domain manually for simple cases
        domain = websiteUrl.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
      }
      
      if (!domain) {
        return;
      }

      // Check if it's a Firebase hosting URL or similar service that might not have favicon
      const isHostingService = 
        domain.includes('firebaseapp.com') || 
        domain.includes('netlify.app') || 
        domain.includes('vercel.app') ||
        domain.includes('github.io');
        
      if (isHostingService) {
        // Use a default logo for known hosting services
        const logo = getDefaultLogoForService(domain);
        if (logo) {
          form.setValue('logo_url', logo);
          saveLogo(logo);
          return;
        }
      }

      // Try multiple favicon sources in order of preference
      const faviconSources = [
        `https://${domain}/favicon.ico`,
        `https://${domain}/favicon.png`,
        `https://${domain}/apple-touch-icon.png`,
        `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
        `https://icons.duckduckgo.com/ip3/${domain}.ico`,
        `https://api.faviconkit.com/${domain}/64`
      ];

      // Test each favicon source
      for (const faviconUrl of faviconSources) {
        try {
          const isValid = await testImageUrl(faviconUrl);
          if (isValid) {
            form.setValue('logo_url', faviconUrl);
            saveLogo(faviconUrl);
            return;
          }
        } catch (e) {
          // Continue to next source
          continue;
        }
      }

      // If all favicon sources fail, generate a letter-based logo
      if (form.getValues('business_name')) {
        const letterLogo = generateLetterLogo(form.getValues('business_name'));
        form.setValue('logo_url', letterLogo);
        saveLogo(letterLogo);
      } else {
        toast.error('Could not fetch logo for this website');
      }
      
    } catch (error) {
      // Fallback to generated logo
      if (form.getValues('business_name')) {
        const letterLogo = generateLetterLogo(form.getValues('business_name'));
        form.setValue('logo_url', letterLogo);
        saveLogo(letterLogo);
        toast.info('Using generated logo as fallback');
      } else {
        toast.error('Failed to fetch logo');
      }
    }
  };

  // Helper function to test if an image URL is valid
  const testImageUrl = (url: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        // Additional check to ensure it's not a generic/default favicon
        if (img.width > 0 && img.height > 0) {
          resolve(true);
        } else {
          resolve(false);
        }
      };
      img.onerror = () => resolve(false);
      
      // Set a timeout to avoid hanging
      const timeout = setTimeout(() => {
        resolve(false);
      }, 5000);
      
      img.onload = () => {
        clearTimeout(timeout);
        resolve(img.width > 0 && img.height > 0);
      };
      
      img.src = url;
    });
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
        toast.error('Failed to save logo');
        return false;
      }

      // Store colors in localStorage
      localStorage.setItem('theme_colors', JSON.stringify(colors));

      toast.success('Logo and theme colors saved successfully');
      return true;
    } catch (err) {
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
      if (newWebsite && newWebsite.length > 3) {
        fetchWebsiteLogo(newWebsite);
      }
    }, 1500); // Increased delay to 1.5 seconds
  };

  // Function to fetch and save logo from website URL
  const fetchAndSaveLogo = async (website: string) => {
    if (!website) return;

    try {
      await fetchWebsiteLogo(website);
      // The logo URL is set inside fetchWebsiteLogo and saved via saveLogo.
    } catch (error) {
      toast.error('Failed to fetch or save logo');
    }
  };

  // Call fetchAndSaveLogo when the website field changes
  useEffect(() => {
    const website = form.getValues('website');
    if (website && website.length > 3) {
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
          <Card className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/50 overflow-hidden" data-tour="business-profile-main">
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
                    <div className="flex items-center gap-4 mt-2" data-tour="business-profile-logo">
                      <div className="border rounded-md p-2 h-20 w-20 flex items-center justify-center bg-muted/20">
                        {form.watch('logo_url') ? (
                          <img
                            src={form.watch('logo_url')}
                            alt="Company Logo"
                            className="max-h-full max-w-full object-contain"
                            onError={(e) => {
                              // Generate fallback logo if the current one fails to load
                              const businessName = form.getValues('business_name');
                              if (businessName) {
                                const fallbackLogo = generateLetterLogo(businessName, true);
                                form.setValue('logo_url', fallbackLogo);
                              }
                            }}
                          />
                        ) : (
                          <div className="text-center">
                            <ImageIcon className="h-8 w-8 text-muted-foreground mb-1" />
                            {form.getValues('business_name') && (
                              <button
                                type="button"
                                onClick={() => {
                                  const generatedLogo = generateLetterLogo(form.getValues('business_name'));
                                  form.setValue('logo_url', generatedLogo);
                                  saveLogo(generatedLogo);
                                }}
                                className="text-xs text-[#ff8800] hover:text-[#ff9900] font-medium"
                              >
                                Generate
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground mb-1">
                          {form.watch('logo_url') ? 'Company logo detected' : 'No logo detected'}
                        </p>
                        <p className="text-xs text-muted-foreground mb-2">
                          {form.watch('logo_url')
                            ? 'Logo will be saved with your profile'
                            : 'Enter your company website URL to automatically fetch your logo'
                          }
                        </p>
                        {form.watch('website') && form.watch('website').length > 3 && (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => fetchWebsiteLogo(form.getValues('website'))}
                              className="text-xs bg-[#ff8800] hover:bg-[#ff9900] text-white px-3 py-1 rounded transition-colors"
                            >
                              Fetch Logo
                            </button>
                            {form.watch('logo_url') && (
                              <button
                                type="button"
                                onClick={() => form.setValue('logo_url', '')}
                                className="text-xs text-red-600 hover:text-red-700 px-3 py-1 rounded border border-red-200 hover:bg-red-50 transition-colors"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        )}
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

                  {/* Personal Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                      <User className="h-5 w-5 text-slate-700" />
                      Personal Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-slate-900">
                      <FormField
                        control={form.control}
                        name="first_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input className="bg-white text-slate-900" type="text" placeholder="John" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="last_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input className="bg-white text-slate-900" type="text" placeholder="Smith" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="personal_email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Personal Email</FormLabel>
                            <FormControl>
                              <div className="flex">
                                <MailIcon className="w-4 h-4 text-muted-foreground absolute mt-2.5 ml-2.5" />
                                <Input className="pl-8 bg-white text-slate-900" type="email" placeholder="john@example.com" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="mobile"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mobile Number</FormLabel>
                            <FormControl>
                              <div className="flex">
                                <PhoneIcon className="w-4 h-4 text-muted-foreground absolute mt-2.5 ml-2.5" />
                                <Input className="pl-8 bg-white text-slate-900" type="tel" placeholder="+44 7XXX XXXXXX" {...field} />
                              </div>
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
                            <FormLabel>Role</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-white text-slate-900">
                                  <SelectValue placeholder="Select your role" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="business_owner">Business Owner</SelectItem>
                                <SelectItem value="finance_director">Finance Director</SelectItem>
                                <SelectItem value="personal_assistant">Personal Assistant</SelectItem>
                                <SelectItem value="accountant">Accountant</SelectItem>
                                <SelectItem value="manager">Manager</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
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

