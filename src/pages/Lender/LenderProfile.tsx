import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getDocument, updateDocument, createDocument } from '@/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import PageLayout from '@/components/PageLayout';
import { Building, Mail, ImageIcon, PoundSterling } from 'lucide-react';
import { 
  
  FileText, 
  CreditCard, 
  Truck, 
  Home, 
  Package, 
  TrendingUp, 
  Banknote, 
  RefreshCw, 
  Factory, 
  Users, 
  Calendar,
  Shield,
  Award,
  Phone,
  Globe
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// If you have a color extraction utility, import it:
// import { extractColors } from '@/lib/colorUtils';

// Define the type for the window object extension
declare global {
  interface Window {
    logoFetchTimer?: number;
  }
}

const LenderProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    company_name: '',
    company_type: '',
    description: '',
    website: '',
    logo_url: '',
    phone: '',
    email: '',
    established_year: '',
    team_size: '',
    regulatory_licenses: [] as string[],
    accreditations: [] as string[],
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    min_loan_amount: '',
    max_loan_amount: '',
    preferred_industries: [] as string[],
    excluded_industries: [] as string[],
    min_business_age_months: '',
    min_annual_revenue: '',
    funding_speed_days: '',
    interest_rate_range: {
      min: '',
      max: ''
    },
    funding_types: {
      invoice_finance: false,
      factoring: false,
      asset_finance: false,
      business_loans: false,
      commercial_property_loans: false,
      commercial_property_bridging_loans: false,
      commercial_property_vat_funding: false,
      supply_chain_finance: false,
      stock_funding: false,
      revolving_credit_facilities: false
    },
    funding_type_criteria: {
      invoice_finance: {
        min_amount: '',
        max_amount: '',
        interest_rate_min: '',
        interest_rate_max: '',
        max_advance_percentage: '',
        min_business_age_months: '',
        required_turnover: '',
        processing_time_days: ''
      },
      factoring: {
        min_amount: '',
        max_amount: '',
        interest_rate_min: '',
        interest_rate_max: '',
        advance_percentage: '',
        min_business_age_months: '',
        required_turnover: '',
        processing_time_days: ''
      },
      asset_finance: {
        min_amount: '',
        max_amount: '',
        interest_rate_min: '',
        interest_rate_max: '',
        max_ltv_percentage: '',
        min_business_age_months: '',
        asset_types: [] as string[],
        processing_time_days: ''
      },
      business_loans: {
        min_amount: '',
        max_amount: '',
        interest_rate_min: '',
        interest_rate_max: '',
        max_term_months: '',
        min_business_age_months: '',
        required_turnover: '',
        processing_time_days: ''
      },
      commercial_property_loans: {
        min_amount: '',
        max_amount: '',
        interest_rate_min: '',
        interest_rate_max: '',
        max_ltv_percentage: '',
        max_term_months: '',
        property_types: [] as string[],
        processing_time_days: ''
      },
      commercial_property_bridging_loans: {
        min_amount: '',
        max_amount: '',
        interest_rate_min: '',
        interest_rate_max: '',
        max_ltv_percentage: '',
        max_term_months: '',
        processing_time_days: ''
      },
      commercial_property_vat_funding: {
        min_amount: '',
        max_amount: '',
        interest_rate_min: '',
        interest_rate_max: '',
        max_advance_percentage: '',
        processing_time_days: ''
      },
      supply_chain_finance: {
        min_amount: '',
        max_amount: '',
        interest_rate_min: '',
        interest_rate_max: '',
        max_advance_percentage: '',
        min_business_age_months: '',
        required_turnover: '',
        processing_time_days: ''
      },
      stock_funding: {
        min_amount: '',
        max_amount: '',
        interest_rate_min: '',
        interest_rate_max: '',
        max_advance_percentage: '',
        min_business_age_months: '',
        stock_types: [] as string[],
        processing_time_days: ''
      },
      revolving_credit_facilities: {
        min_amount: '',
        max_amount: '',
        interest_rate_min: '',
        interest_rate_max: '',
        min_business_age_months: '',
        required_turnover: '',
        processing_time_days: ''
      }
    }
  });

  // Fetch lender profile using Firebase
  const { data: profile, isLoading } = useQuery({
    queryKey: ['lender-profile', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return null;
      
      const { data, error } = await getDocument('lender_profiles', user.uid);
      
      if (error) {
        toast.error('Failed to load profile');
        throw error;
      }
      
      return data;
    },
    enabled: !!user,
  });

  // Update form data when profile is loaded
  useEffect(() => {
    if (profile) {
      setFormData({
        company_name: profile.company_name || '',
        company_type: profile.company_type || '',
        description: profile.description || '',
        website: profile.website || '',
        logo_url: profile.logo_url || '',
        phone: profile.phone || '',
        email: profile.email || '',
        established_year: profile.established_year?.toString() || '',
        team_size: profile.team_size?.toString() || '',
        regulatory_licenses: profile.regulatory_licenses || [],
        accreditations: profile.accreditations || [],
        address_line1: profile.address?.line1 || '',
        address_line2: profile.address?.line2 || '',
        city: profile.city || '',
        state: profile.state || '',
        postal_code: profile.postal_code || '',
        country: profile.country || '',
        min_loan_amount: profile.product_type?.min_loan_amount?.toString() || '',
        max_loan_amount: profile.product_type?.max_loan_amount?.toString() || '',
        preferred_industries: profile.product_type?.preferred_industries || [],
        excluded_industries: profile.product_type?.excluded_industries || [],
        min_business_age_months: profile.product_type?.min_business_age_months?.toString() || '',
        min_annual_revenue: profile.product_type?.min_annual_revenue?.toString() || '',
        funding_speed_days: profile.product_type?.funding_speed_days?.toString() || '',
        interest_rate_range: {
          min: profile.product_type?.interest_rate_range?.min?.toString() || '',
          max: profile.product_type?.interest_rate_range?.max?.toString() || ''
        },
        funding_types: {
          invoice_finance: profile.product_type?.funding_types?.invoice_finance || false,
          factoring: profile.product_type?.funding_types?.factoring || false,
          asset_finance: profile.product_type?.funding_types?.asset_finance || false,
          business_loans: profile.product_type?.funding_types?.business_loans || false,
          commercial_property_loans: profile.product_type?.funding_types?.commercial_property_loans || false,
          commercial_property_bridging_loans: profile.product_type?.funding_types?.commercial_property_bridging_loans || false,
          commercial_property_vat_funding: profile.product_type?.funding_types?.commercial_property_vat_funding || false,
          supply_chain_finance: profile.product_type?.funding_types?.supply_chain_finance || false,
          stock_funding: profile.product_type?.funding_types?.stock_funding || false,
          revolving_credit_facilities: profile.product_type?.funding_types?.revolving_credit_facilities || false
        },
        funding_type_criteria: {
          invoice_finance: profile.product_type?.funding_type_criteria?.invoice_finance || {
            min_amount: '', max_amount: '', interest_rate_min: '', interest_rate_max: '',
            max_advance_percentage: '', min_business_age_months: '', required_turnover: '', processing_time_days: ''
          },
          factoring: profile.product_type?.funding_type_criteria?.factoring || {
            min_amount: '', max_amount: '', interest_rate_min: '', interest_rate_max: '',
            advance_percentage: '', min_business_age_months: '', required_turnover: '', processing_time_days: ''
          },
          asset_finance: profile.product_type?.funding_type_criteria?.asset_finance || {
            min_amount: '', max_amount: '', interest_rate_min: '', interest_rate_max: '',
            max_ltv_percentage: '', min_business_age_months: '', asset_types: [], processing_time_days: ''
          },
          business_loans: profile.product_type?.funding_type_criteria?.business_loans || {
            min_amount: '', max_amount: '', interest_rate_min: '', interest_rate_max: '',
            max_term_months: '', min_business_age_months: '', required_turnover: '', processing_time_days: ''
          },
          commercial_property_loans: profile.product_type?.funding_type_criteria?.commercial_property_loans || {
            min_amount: '', max_amount: '', interest_rate_min: '', interest_rate_max: '',
            max_ltv_percentage: '', max_term_months: '', property_types: [], processing_time_days: ''
          },
          commercial_property_bridging_loans: profile.product_type?.funding_type_criteria?.commercial_property_bridging_loans || {
            min_amount: '', max_amount: '', interest_rate_min: '', interest_rate_max: '',
            max_ltv_percentage: '', max_term_months: '', processing_time_days: ''
          },
          commercial_property_vat_funding: profile.product_type?.funding_type_criteria?.commercial_property_vat_funding || {
            min_amount: '', max_amount: '', interest_rate_min: '', interest_rate_max: '',
            max_advance_percentage: '', processing_time_days: ''
          },
          supply_chain_finance: profile.product_type?.funding_type_criteria?.supply_chain_finance || {
            min_amount: '', max_amount: '', interest_rate_min: '', interest_rate_max: '',
            max_advance_percentage: '', min_business_age_months: '', required_turnover: '', processing_time_days: ''
          },
          stock_funding: profile.product_type?.funding_type_criteria?.stock_funding || {
            min_amount: '', max_amount: '', interest_rate_min: '', interest_rate_max: '',
            max_advance_percentage: '', min_business_age_months: '', stock_types: [], processing_time_days: ''
          },
          revolving_credit_facilities: profile.product_type?.funding_type_criteria?.revolving_credit_facilities || {
            min_amount: '', max_amount: '', interest_rate_min: '', interest_rate_max: '',
            min_business_age_months: '', required_turnover: '', processing_time_days: ''
          }
        }
      });
    }
  }, [profile]);

  // Function to fetch website logo (CORS-free approach)
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
        console.warn('Invalid URL format:', websiteUrl);
        // Try to extract domain manually for simple cases
        domain = websiteUrl.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
      }
      
      if (!domain) {
        console.warn('Could not extract domain from URL:', websiteUrl);
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
          setFormData(prev => ({ ...prev, logo_url: logo }));
          toast.success('Logo set for hosting service');
          return;
        }
      }

      // Instead of trying to test images (which causes CORS issues),
      // let's just construct the most common favicon URLs and let the browser handle it
      const commonFaviconUrls = [
        `https://${domain}/favicon.ico`,
        `https://${domain}/favicon.png`,
        `https://${domain}/apple-touch-icon.png`
      ];

      // For most websites, favicon.ico is the standard
      // Let's just set it and let the browser handle the loading
      const primaryFaviconUrl = `https://${domain}/favicon.ico`;
      
      // Set the logo URL directly - the browser will handle loading it when displaying
      setFormData(prev => ({ ...prev, logo_url: primaryFaviconUrl }));
      
      // Show user feedback
      toast.success('Logo URL set! If it doesn\'t appear, we\'ll generate a custom one.');
      
      // Optional: Set a fallback after a delay to check if the logo loaded
      setTimeout(() => {
        // Check if we still have the same logo URL and if it failed to load
        const logoElement = document.querySelector('img[alt="Company Logo"]') as HTMLImageElement;
        if (logoElement && logoElement.src === primaryFaviconUrl) {
          // If the image failed to load, the browser might show a broken image
          // We can check the naturalWidth property
          if (logoElement.naturalWidth === 0) {
            // Image failed to load, generate a letter logo
            if (formData.company_name) {
              const letterLogo = generateLetterLogo(formData.company_name);
              setFormData(prev => ({ ...prev, logo_url: letterLogo }));
              toast.info('Generated a custom logo as fallback');
            }
          }
        }
      }, 3000); // Check after 3 seconds
      
    } catch (error) {
      console.error('Error setting logo URL:', error);
      // Fallback to generated logo
      if (formData.company_name) {
        const letterLogo = generateLetterLogo(formData.company_name);
        setFormData(prev => ({ ...prev, logo_url: letterLogo }));
        toast.info('Generated a custom logo');
      } else {
        toast.error('Please enter a company name to generate a logo');
      }
    }
  };

  // Function to save the logo URL and extract colors
  const saveLogo = async (logoUrl: string) => {
    if (!user?.uid) return;
    
    try {
      // If you have a color extraction utility, use it here
      // const colors = await extractColors(logoUrl);
      const colors = [];
      // Update the profile with both logo and colors
      const { error } = await updateDocument('lender_profiles', user.uid, {
        logo_url: logoUrl,
        theme_colors: colors
      });
      if (error) {
        toast.error('Failed to save logo and theme colors');
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

  // Helper function to check if an image is the default Google favicon
  const checkIfDefaultFavicon = (imageUrl: string, callback: (isDefault: boolean) => void) => {
    // This is a simplified check - in a real app, you might use canvas to compare pixel data
    // Here we're just checking if the URL contains specific patterns
    if (imageUrl.includes('google.com/s2/favicons')) {
      callback(false);    } else {
      callback(true);
    }
  };
  
  // Helper function to get a default logo for known hosting services
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
  
  // Helper function to generate a letter-based logo for companies without favicon
  const generateLetterLogo = (name: string, simplified = false): string => {
    if (!name) return '';
    
    // Get initials from company name (first letter of each word, max 2 characters)
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

  // Handle website input change with debounce
  const handleWebsiteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newWebsite = e.target.value;
    setFormData(prev => ({ ...prev, website: newWebsite }));
    
    // Clear any existing timers
    if (window.logoFetchTimer) {
      clearTimeout(window.logoFetchTimer);
    }
    
    // Set a new timer to fetch the logo after typing stops
    window.logoFetchTimer = window.setTimeout(() => {
      if (newWebsite && newWebsite.length > 3) {
        fetchWebsiteLogo(newWebsite);
      }
    }, 1500); // Increased delay to 1.5 seconds
  };

  // Add a manual fetch button as a fallback
  const handleManualLogoFetch = async () => {
    if (formData.website) {
      try {
        await fetchWebsiteLogo(formData.website);
      } catch (error) {
        console.error('Manual logo fetch failed:', error);
        toast.error('Failed to fetch logo manually');
      }
    } else {
      toast.error('Please enter a website URL first');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (!user?.uid) return;
      // Ensure logo_url is included in the profile data


      // Check if logo_url is too large (if it's an SVG data URL)
      let logoUrl = formData.logo_url;
      if (logoUrl && logoUrl.startsWith('data:image/svg+xml;base64,') && logoUrl.length > 1000000) {
        console.warn('Logo URL is too large, truncating or using fallback...');
        // Use a simpler fallback logo or store it in a different way
        logoUrl = generateLetterLogo(formData.company_name, true);
      }
      
      // Validate numeric fields before parsing to avoid NaN or Infinity
      const validateNumber = (value: string): number => {
        const num = parseFloat(value);
        // Check if the number is valid and not too large
        return (!isNaN(num) && isFinite(num)) ? num : 0;
      };

      // Create a clean profile data object with validated fields
      const profileData = {
        company_name: formData.company_name || '',
        company_type: formData.company_type || '',
        description: formData.description || '',
        website: formData.website || '',
        logo_url: logoUrl || '',
        phone: formData.phone || '',
        email: formData.email || '',
        established_year: formData.established_year ? parseInt(formData.established_year) : null,
        team_size: formData.team_size || '',
        regulatory_licenses: Array.isArray(formData.regulatory_licenses) ? formData.regulatory_licenses : [],
        accreditations: Array.isArray(formData.accreditations) ? formData.accreditations : [],
        address: {
          line1: formData.address_line1 || '',
          line2: formData.address_line2 || ''
        },
        city: formData.city || '',
        state: formData.state || '',
        postal_code: formData.postal_code || '',
        country: formData.country || '',
        product_type: {
          min_loan_amount: validateNumber(formData.min_loan_amount),
          max_loan_amount: validateNumber(formData.max_loan_amount),
          preferred_industries: Array.isArray(formData.preferred_industries) ? formData.preferred_industries : [],
          excluded_industries: Array.isArray(formData.excluded_industries) ? formData.excluded_industries : [],
          min_business_age_months: Number.isInteger(parseInt(formData.min_business_age_months)) 
                                  ? parseInt(formData.min_business_age_months) 
                                  : 0,
          min_annual_revenue: validateNumber(formData.min_annual_revenue),
          funding_speed_days: Number.isInteger(parseInt(formData.funding_speed_days)) 
                             ? parseInt(formData.funding_speed_days) 
                             : 0,
          interest_rate_range: {
            min: validateNumber(formData.interest_rate_range.min),
            max: validateNumber(formData.interest_rate_range.max)
          },
          funding_types: formData.funding_types || {},
          funding_type_criteria: formData.funding_type_criteria || {}
        }
        // Let Firebase handle the updated_at timestamp
      };


      
      // First check if the document exists by getting it
      const { data: existingProfile } = await getDocument('lender_profiles', user.uid);
      let result;
      
      if (existingProfile) {
        // Document exists, update it

        result = await updateDocument('lender_profiles', user.uid, profileData);
      } else {
        // Document doesn't exist, create it

        result = await createDocument('lender_profiles', profileData, user.uid);
      }
      
      if (result.error) {
        console.error('Error details:', result.error);
        toast.error(`Failed to save profile: ${result.error.message || 'Unknown error'}`);
        return;
      }
      
      toast.success('Profile updated successfully');
      navigate('/lender/dashboard');
    } catch (err) {
      console.error('Failed to update profile', err);
      toast.error(`Failed to update profile: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Helper function for handling checkbox changes
  const handleFundingTypeChange = (fundingType: keyof typeof formData.funding_types) => {
    setFormData(prev => ({
      ...prev,
      funding_types: {
        ...prev.funding_types,
        [fundingType]: !prev.funding_types[fundingType]
      }
    }));
  };

  // Funding type configurations with icons and labels
  const fundingTypeConfigs = {
    invoice_finance: {
      icon: FileText,
      label: 'Invoice Finance',
      description: 'Advance funds against outstanding invoices'
    },
    factoring: {
      icon: TrendingUp,
      label: 'Factoring',
      description: 'Purchase and collect customer invoices'
    },
    asset_finance: {
      icon: Truck,
      label: 'Asset Finance',
      description: 'Financing for business equipment and assets'
    },
    business_loans: {
      icon: Banknote,
      label: 'Business Loans',
      description: 'Traditional term loans for business growth'
    },
    commercial_property_loans: {
      icon: Home,
      label: 'Commercial Property Loans',
      description: 'Financing for commercial real estate purchases'
    },
    commercial_property_bridging_loans: {
      icon: RefreshCw,
      label: 'Commercial Property Bridging',
      description: 'Short-term property finance solutions'
    },
    commercial_property_vat_funding: {
      icon: CreditCard,
      label: 'Commercial Property VAT Funding',
      description: 'VAT funding for commercial property transactions'
    },
    supply_chain_finance: {
      icon: Factory,
      label: 'Supply Chain Finance',
      description: 'Finance for supply chain optimization'
    },
    stock_funding: {
      icon: Package,
      label: 'Stock Funding',
      description: 'Financing for inventory and stock purchases'
    },
    revolving_credit_facilities: {
      icon: RefreshCw,
      label: 'Revolving Credit Facilities',
      description: 'Flexible credit lines for working capital'
    }
  };

  // Helper function for handling funding type criteria changes
  const handleFundingTypeCriteriaChange = (
    fundingType: keyof typeof formData.funding_type_criteria,
    field: string,
    value: string | string[]
  ) => {
    setFormData(prev => ({
      ...prev,
      funding_type_criteria: {
        ...prev.funding_type_criteria,
        [fundingType]: {
          ...prev.funding_type_criteria[fundingType],
          [field]: value
        }
      }
    }));
  };

  if (isLoading) {
    return (
      <PageLayout>
        <div className="container mx-auto p-4">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
        {/* Professional Header */}
        <header className="bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm">
          <div className="max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8 py-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Lender Profile</h1>
                <p className="text-slate-600 mt-1">Manage your lending criteria and company information</p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/lender/dashboard')}
                className="flex items-center gap-2 px-4 py-2"
              >
                <span className="text-white hover:text-[#ff8800] transition-colors">Back to Dashboard</span>
              </Button>
            </div>
          </div>
        </header>

        <div className="max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8 py-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Company Information */}
            <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/50 overflow-hidden">
              <div className="bg-slate-800 px-6 py-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Company Information
                </h2>
                <p className="text-sm text-slate-300 mt-1">Basic details about your lending company</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-slate-700" htmlFor="company_name">
                      Company Name
                    </label>
                    <input
                      type="text"
                      id="company_name"
                      className="w-full p-3 bg-white border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-[#ff8800]/30 focus:border-[#ff8800] transition duration-200 shadow-sm"
                      value={formData.company_name}
                      onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-slate-700" htmlFor="company_type">
                      Company Type
                    </label>
                    <select
                      id="company_type"
                      className="w-full p-3 bg-white border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-[#ff8800]/30 focus:border-[#ff8800] transition duration-200 shadow-sm"
                      value={formData.company_type}
                      onChange={(e) => setFormData({...formData, company_type: e.target.value})}
                    >
                      <option value="">Select Type</option>
                      <option value="Bank">Bank</option>
                      <option value="Alternative Lender">Alternative Lender</option>
                      <option value="Platform">Platform</option>
                      <option value="Credit Union">Credit Union</option>
                      <option value="Asset Finance Provider">Asset Finance Provider</option>
                      <option value="Private Equity">Private Equity</option>
                    </select>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold mb-2 text-slate-700" htmlFor="description">
                      Company Description
                    </label>
                    <textarea
                      id="description"
                      rows={4}
                      className="w-full p-3 bg-white border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-[#ff8800]/30 focus:border-[#ff8800] transition duration-200 shadow-sm resize-none"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Tell us about your lending company..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-slate-700" htmlFor="phone">
                      <Phone className="h-4 w-4 inline mr-1" />
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      className="w-full p-3 bg-white border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-[#ff8800]/30 focus:border-[#ff8800] transition duration-200 shadow-sm"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="+44 20 1234 5678"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-slate-700" htmlFor="email">
                      <Mail className="h-4 w-4 inline mr-1" />
                      Contact Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      className="w-full p-3 bg-white border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-[#ff8800]/30 focus:border-[#ff8800] transition duration-200 shadow-sm"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="contact@yourcompany.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-slate-700" htmlFor="established_year">
                      <Calendar className="h-4 w-4 inline mr-1" />
                      Year Established
                    </label>
                    <input
                      type="number"
                      id="established_year"
                      min="1800"
                      max={new Date().getFullYear()}
                      className="w-full p-3 bg-white border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-[#ff8800]/30 focus:border-[#ff8800] transition duration-200 shadow-sm"
                      value={formData.established_year}
                      onChange={(e) => setFormData({...formData, established_year: e.target.value})}
                      placeholder="2020"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-slate-700" htmlFor="team_size">
                      <Users className="h-4 w-4 inline mr-1" />
                      Team Size
                    </label>
                    <select
                      id="team_size"
                      className="w-full p-3 bg-white border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-[#ff8800]/30 focus:border-[#ff8800] transition duration-200 shadow-sm"
                      value={formData.team_size}
                      onChange={(e) => setFormData({...formData, team_size: e.target.value})}
                    >
                      <option value="">Select Size</option>
                      <option value="1-10">1-10 employees</option>
                      <option value="11-50">11-50 employees</option>
                      <option value="51-200">51-200 employees</option>
                      <option value="201-500">201-500 employees</option>
                      <option value="500+">500+ employees</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Regulatory & Credentials */}
            <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/50 overflow-hidden">
              <div className="bg-slate-800 px-6 py-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Regulatory & Credentials
                </h2>
                <p className="text-sm text-slate-300 mt-1">Licenses, accreditations, and regulatory information</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-slate-700">
                      <Shield className="h-4 w-4 inline mr-1" />
                      Regulatory Licenses
                    </label>
                    <div className="space-y-2">
                      {['FCA Authorised', 'Consumer Credit License', 'Commercial Finance Association Member', 'Asset Based Finance Association Member'].map((license) => (
                        <label key={license} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.regulatory_licenses.includes(license)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData(prev => ({
                                  ...prev,
                                  regulatory_licenses: [...prev.regulatory_licenses, license]
                                }));
                              } else {
                                setFormData(prev => ({
                                  ...prev,
                                  regulatory_licenses: prev.regulatory_licenses.filter(l => l !== license)
                                }));
                              }
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-[#ff8800] focus:ring-[#ff8800]/30 mr-2"
                          />
                          <span className="text-sm text-slate-700">{license}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-slate-700">
                      <Award className="h-4 w-4 inline mr-1" />
                      Industry Accreditations
                    </label>
                    <div className="space-y-2">
                      {['ISO 27001', 'Cyber Essentials', 'Better Business Bureau', 'Trustpilot Verified', 'Trade Association Member'].map((accreditation) => (
                        <label key={accreditation} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.accreditations.includes(accreditation)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData(prev => ({
                                  ...prev,
                                  accreditations: [...prev.accreditations, accreditation]
                                }));
                              } else {
                                setFormData(prev => ({
                                  ...prev,
                                  accreditations: prev.accreditations.filter(a => a !== accreditation)
                                }));
                              }
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-[#ff8800] focus:ring-[#ff8800]/30 mr-2"
                          />
                          <span className="text-sm text-slate-700">{accreditation}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Branding */}
            <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/50 overflow-hidden">
              <div className="bg-slate-800 px-6 py-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Branding
                </h2>
                <p className="text-sm text-slate-300 mt-1">Company logo and website information</p>
              </div>
              <div className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <label className="block text-sm font-semibold mb-2 text-slate-700" htmlFor="website">
                      Website
                    </label>
                    <div className="flex">
                      <input
                        type="text"
                        id="website"
                        className="w-full p-3 bg-white border border-slate-200 rounded-l-lg text-slate-900 focus:ring-2 focus:ring-[#ff8800]/30 focus:border-[#ff8800] transition duration-200 shadow-sm"
                        value={formData.website}
                        onChange={handleWebsiteChange}
                        placeholder="e.g., www.yourcompany.com"
                      />
                      <button 
                        type="button"
                        onClick={handleManualLogoFetch}
                        disabled={!formData.website}
                        className="bg-gradient-to-r from-[#ff8800] to-[#ffaa00] hover:from-[#ff9900] hover:to-[#ffbb00] disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed text-white font-semibold px-4 rounded-r-lg transition-all duration-200 shadow-md hover:shadow-lg"
                      >
                        Fetch Logo
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex-none">
                    <label className="block text-sm font-semibold mb-2 text-slate-700">
                      Logo Preview
                    </label>
                    <div className="h-24 w-24 border border-slate-200 rounded-lg overflow-hidden flex items-center justify-center bg-slate-50 shadow-sm">
                      {formData.logo_url ? (
                        <img 
                          src={formData.logo_url} 
                          alt="Company Logo" 
                          className="max-h-full max-w-full object-contain"
                          onError={(e) => {
                            console.warn('Logo failed to load:', formData.logo_url);
                            // Generate fallback logo if the current one fails to load
                            if (formData.company_name && !formData.logo_url.startsWith('data:')) {
                              const fallbackLogo = generateLetterLogo(formData.company_name, true);
                              setFormData(prev => ({ ...prev, logo_url: fallbackLogo }));
                              toast.info('Logo failed to load, generated custom fallback');
                            }
                          }}
                          onLoad={() => {
                            // If this is a favicon URL and it loaded successfully, show success message
                            if (formData.logo_url.includes('/favicon.') && !formData.logo_url.startsWith('data:')) {
                              console.log('Favicon loaded successfully');
                            }
                          }}
                        />
                      ) : (
                        <div className="text-center">
                          <div className="text-sm text-slate-400 mb-1">No Logo</div>
                          {formData.company_name && (
                            <button
                              type="button"
                              onClick={() => {
                                const generatedLogo = generateLetterLogo(formData.company_name);
                                setFormData(prev => ({ ...prev, logo_url: generatedLogo }));
                              }}
                              className="text-xs text-[#ff8800] hover:text-[#ff9900] font-medium"
                            >
                              Generate
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    {formData.logo_url && (
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, logo_url: '' }))}
                        className="text-xs text-red-600 hover:text-red-700 mt-1 block"
                      >
                        Remove Logo
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Location */}
            <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/50 overflow-hidden">
              <div className="bg-slate-800 px-6 py-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Location
                </h2>
                <p className="text-sm text-slate-300 mt-1">Company address and location details</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold mb-2 text-slate-700" htmlFor="address_line1">
                      Address Line 1
                    </label>
                    <input
                      type="text"
                      id="address_line1"
                      className="w-full p-3 bg-white border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-[#ff8800]/30 focus:border-[#ff8800] transition duration-200 shadow-sm"
                      value={formData.address_line1}
                      onChange={(e) => setFormData({...formData, address_line1: e.target.value})}
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold mb-2 text-slate-700" htmlFor="address_line2">
                      Address Line 2
                    </label>
                    <input
                      type="text"
                      id="address_line2"
                      className="w-full p-3 bg-white border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-[#ff8800]/30 focus:border-[#ff8800] transition duration-200 shadow-sm"
                      value={formData.address_line2}
                      onChange={(e) => setFormData({...formData, address_line2: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-slate-700" htmlFor="city">
                      City
                    </label>
                    <input
                      type="text"
                      id="city"
                      className="w-full p-3 bg-white border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-[#ff8800]/30 focus:border-[#ff8800] transition duration-200 shadow-sm"
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-slate-700" htmlFor="state">
                      State/Province
                    </label>
                    <input
                      type="text"
                      id="state"
                      className="w-full p-3 bg-white border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-[#ff8800]/30 focus:border-[#ff8800] transition duration-200 shadow-sm"
                      value={formData.state}
                      onChange={(e) => setFormData({...formData, state: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-slate-700" htmlFor="postal_code">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      id="postal_code"
                      className="w-full p-3 bg-white border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-[#ff8800]/30 focus:border-[#ff8800] transition duration-200 shadow-sm"
                      value={formData.postal_code}
                      onChange={(e) => setFormData({...formData, postal_code: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-slate-700" htmlFor="country">
                      Country
                    </label>
                    <input
                      type="text"
                      id="country"
                      className="w-full p-3 bg-white border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-[#ff8800]/30 focus:border-[#ff8800] transition duration-200 shadow-sm"
                      value={formData.country}
                      onChange={(e) => setFormData({...formData, country: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Lending Criteria */}
            <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/50 overflow-hidden">
              <div className="bg-slate-800 px-6 py-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <PoundSterling className="h-5 w-5" />
                  Lending Criteria
                </h2>
                <p className="text-sm text-slate-300 mt-1">Define your lending requirements and terms</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-slate-700" htmlFor="min_loan_amount">
                      Minimum Loan Amount (£)
                    </label>
                    <input
                      type="number"
                      id="min_loan_amount"
                      className="w-full p-3 bg-white border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-[#ff8800]/30 focus:border-[#ff8800] transition duration-200 shadow-sm"
                      value={formData.min_loan_amount}
                      onChange={(e) => setFormData({...formData, min_loan_amount: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-slate-700" htmlFor="max_loan_amount">
                      Maximum Loan Amount (£)
                    </label>
                    <input
                      type="number"
                      id="max_loan_amount"
                      className="w-full p-3 bg-white border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-[#ff8800]/30 focus:border-[#ff8800] transition duration-200 shadow-sm"
                      value={formData.max_loan_amount}
                      onChange={(e) => setFormData({...formData, max_loan_amount: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-slate-700" htmlFor="min_business_age_months">
                      Minimum Business Age (Months)
                    </label>
                    <input
                      type="number"
                      id="min_business_age_months"
                      className="w-full p-3 bg-white border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-[#ff8800]/30 focus:border-[#ff8800] transition duration-200 shadow-sm"
                      value={formData.min_business_age_months}
                      onChange={(e) => setFormData({...formData, min_business_age_months: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-slate-700" htmlFor="min_annual_revenue">
                      Minimum Annual Revenue (£)
                    </label>
                    <input
                      type="number"
                      id="min_annual_revenue"
                      className="w-full p-3 bg-white border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-[#ff8800]/30 focus:border-[#ff8800] transition duration-200 shadow-sm"
                      value={formData.min_annual_revenue}
                      onChange={(e) => setFormData({...formData, min_annual_revenue: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-slate-700" htmlFor="funding_speed_days">
                      Funding Speed (Days)
                    </label>
                    <input
                      type="number"
                      id="funding_speed_days"
                      className="w-full p-3 bg-white border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-[#ff8800]/30 focus:border-[#ff8800] transition duration-200 shadow-sm"
                      value={formData.funding_speed_days}
                      onChange={(e) => setFormData({...formData, funding_speed_days: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-slate-700">
                      Interest Rate Range (%)
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        placeholder="Min"
                        className="w-full p-3 bg-white border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-[#ff8800]/30 focus:border-[#ff8800] transition duration-200 shadow-sm"
                        value={formData.interest_rate_range.min}
                        onChange={(e) => setFormData({
                          ...formData,
                          interest_rate_range: {
                            ...formData.interest_rate_range,
                            min: e.target.value
                          }
                        })}
                      />
                      <span className="text-slate-500 font-medium">to</span>
                      <input
                        type="number"
                        placeholder="Max"
                        className="w-full p-3 bg-white border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-[#ff8800]/30 focus:border-[#ff8800] transition duration-200 shadow-sm"
                        value={formData.interest_rate_range.max}
                        onChange={(e) => setFormData({
                          ...formData,
                          interest_rate_range: {
                            ...formData.interest_rate_range,
                            max: e.target.value
                          }
                        })}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Funding Types & Individual Criteria</h3>
                  <p className="text-sm text-slate-600 mb-6">Select the funding types you offer and configure specific criteria for each</p>
                  
                  <div className="space-y-6">
                    {Object.entries(fundingTypeConfigs).map(([key, config]) => {
                      const Icon = config.icon;
                      const isSelected = formData.funding_types[key as keyof typeof formData.funding_types];
                      
                      return (
                        <Card key={key} className={`transition-all duration-200 ${isSelected ? 'ring-2 ring-[#ff8800]/30 bg-orange-50/80 shadow-md' : 'hover:shadow-md bg-white'}`}>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`p-3 rounded-lg transition-colors ${isSelected ? 'bg-[#ff8800] text-white shadow-sm' : 'bg-slate-900 text-[#ff8800]'}`}>
                                  <Icon className="h-6 w-6" />
                                </div>
                                <div>
                                  <CardTitle className={`text-lg font-semibold ${isSelected ? 'text-slate-900' : 'text-slate-900'}`}>{config.label}</CardTitle>
                                  <p className={`text-sm mt-1 ${isSelected ? 'text-slate-700' : 'text-slate-600'}`}>{config.description}</p>
                                </div>
                              </div>
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  id={`funding_type_${key}`}
                                  checked={isSelected}
                                  onChange={() => handleFundingTypeChange(key as keyof typeof formData.funding_types)}
                                  className="h-5 w-5 rounded border-slate-300 text-[#ff8800] focus:ring-[#ff8800]/30"
                                />
                              </div>
                            </div>
                          </CardHeader>
                          
                          {isSelected && (
                            <CardContent className="bg-white/90">
                              <div className="pt-4 border-t border-slate-200">
                                <h4 className="text-md font-semibold text-slate-900 mb-4">Specific Criteria for {config.label}</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {/* Common fields for all funding types */}
                                  <div>
                                    <label className="block text-sm font-medium mb-1 text-slate-700">Min Amount (£)</label>
                                    <input
                                      type="number"
                                      className="w-full p-2 border border-slate-200 rounded-md text-sm text-slate-900 bg-white focus:ring-2 focus:ring-[#ff8800]/30 focus:border-[#ff8800]"
                                      value={formData.funding_type_criteria[key as keyof typeof formData.funding_type_criteria].min_amount}
                                      onChange={(e) => handleFundingTypeCriteriaChange(key as keyof typeof formData.funding_type_criteria, 'min_amount', e.target.value)}
                                      placeholder="1000"
                                    />
                                  </div>
                                  
                                  <div>
                                    <label className="block text-sm font-medium mb-1 text-slate-700">Max Amount (£)</label>
                                    <input
                                      type="number"
                                      className="w-full p-2 border border-slate-200 rounded-md text-sm text-slate-900 bg-white focus:ring-2 focus:ring-[#ff8800]/30 focus:border-[#ff8800]"
                                      value={formData.funding_type_criteria[key as keyof typeof formData.funding_type_criteria].max_amount}
                                      onChange={(e) => handleFundingTypeCriteriaChange(key as keyof typeof formData.funding_type_criteria, 'max_amount', e.target.value)}
                                      placeholder="1000000"
                                    />
                                  </div>
                                  
                                  <div>
                                    <label className="block text-sm font-medium mb-1 text-slate-700">Min Interest Rate (%)</label>
                                    <input
                                      type="number"
                                      step="0.1"
                                      className="w-full p-2 border border-slate-200 rounded-md text-sm text-slate-900 bg-white focus:ring-2 focus:ring-[#ff8800]/30 focus:border-[#ff8800]"
                                      value={formData.funding_type_criteria[key as keyof typeof formData.funding_type_criteria].interest_rate_min}
                                      onChange={(e) => handleFundingTypeCriteriaChange(key as keyof typeof formData.funding_type_criteria, 'interest_rate_min', e.target.value)}
                                      placeholder="3.5"
                                    />
                                  </div>
                                  
                                  <div>
                                    <label className="block text-sm font-medium mb-1 text-slate-700">Max Interest Rate (%)</label>
                                    <input
                                      type="number"
                                      step="0.1"
                                      className="w-full p-2 border border-slate-200 rounded-md text-sm text-slate-900 bg-white focus:ring-2 focus:ring-[#ff8800]/30 focus:border-[#ff8800]"
                                      value={formData.funding_type_criteria[key as keyof typeof formData.funding_type_criteria].interest_rate_max}
                                      onChange={(e) => handleFundingTypeCriteriaChange(key as keyof typeof formData.funding_type_criteria, 'interest_rate_max', e.target.value)}
                                      placeholder="15.0"
                                    />
                                  </div>
                                  
                                  <div>
                                    <label className="block text-sm font-medium mb-1 text-slate-700">Processing Time (Days)</label>
                                    <input
                                      type="number"
                                      className="w-full p-2 border border-slate-200 rounded-md text-sm text-slate-900 bg-white focus:ring-2 focus:ring-[#ff8800]/30 focus:border-[#ff8800]"
                                      value={formData.funding_type_criteria[key as keyof typeof formData.funding_type_criteria].processing_time_days}
                                      onChange={(e) => handleFundingTypeCriteriaChange(key as keyof typeof formData.funding_type_criteria, 'processing_time_days', e.target.value)}
                                      placeholder="7"
                                    />
                                  </div>
                                  
                                  {/* Conditional fields based on funding type */}
                                  {(key === 'invoice_finance' || key === 'factoring' || key === 'supply_chain_finance' || key === 'commercial_property_vat_funding' || key === 'stock_funding') && (
                                    <div>
                                      <label className="block text-sm font-medium mb-1 text-slate-700">
                                        {key === 'factoring' ? 'Advance Percentage (%)' : 'Max Advance Percentage (%)'}
                                      </label>
                                      <input
                                        type="number"
                                        min="1"
                                        max="100"
                                        className="w-full p-2 border border-slate-200 rounded-md text-sm text-slate-900 bg-white focus:ring-2 focus:ring-[#ff8800]/30 focus:border-[#ff8800]"
                                        value={key === 'factoring' 
                                          ? (formData.funding_type_criteria[key] as any).advance_percentage 
                                          : (formData.funding_type_criteria[key as keyof typeof formData.funding_type_criteria] as any).max_advance_percentage}
                                        onChange={(e) => handleFundingTypeCriteriaChange(
                                          key as keyof typeof formData.funding_type_criteria, 
                                          key === 'factoring' ? 'advance_percentage' : 'max_advance_percentage', 
                                          e.target.value
                                        )}
                                        placeholder="80"
                                      />
                                    </div>
                                  )}
                                  
                                  {(key === 'asset_finance' || key === 'commercial_property_loans' || key === 'commercial_property_bridging_loans') && (
                                    <div>
                                      <label className="block text-sm font-medium mb-1 text-slate-700">Max LTV Percentage (%)</label>
                                      <input
                                        type="number"
                                        min="1"
                                        max="100"
                                        className="w-full p-2 border border-slate-200 rounded-md text-sm text-slate-900 bg-white focus:ring-2 focus:ring-[#ff8800]/30 focus:border-[#ff8800]"
                                        value={(formData.funding_type_criteria[key as keyof typeof formData.funding_type_criteria] as any).max_ltv_percentage}
                                        onChange={(e) => handleFundingTypeCriteriaChange(key as keyof typeof formData.funding_type_criteria, 'max_ltv_percentage', e.target.value)}
                                        placeholder="75"
                                      />
                                    </div>
                                  )}
                                  
                                  {(key === 'business_loans' || key === 'commercial_property_loans' || key === 'commercial_property_bridging_loans') && (
                                    <div>
                                      <label className="block text-sm font-medium mb-1 text-slate-700">Max Term (Months)</label>
                                      <input
                                        type="number"
                                        className="w-full p-2 border border-slate-200 rounded-md text-sm text-slate-900 bg-white focus:ring-2 focus:ring-[#ff8800]/30 focus:border-[#ff8800]"
                                        value={(formData.funding_type_criteria[key as keyof typeof formData.funding_type_criteria] as any).max_term_months}
                                        onChange={(e) => handleFundingTypeCriteriaChange(key as keyof typeof formData.funding_type_criteria, 'max_term_months', e.target.value)}
                                        placeholder="60"
                                      />
                                    </div>
                                  )}
                                  
                                  {(key !== 'commercial_property_vat_funding' && key !== 'commercial_property_bridging_loans') && (
                                    <div>
                                      <label className="block text-sm font-medium mb-1 text-slate-700">Min Business Age (Months)</label>
                                      <input
                                        type="number"
                                        className="w-full p-2 border border-slate-200 rounded-md text-sm text-slate-900 bg-white focus:ring-2 focus:ring-[#ff8800]/30 focus:border-[#ff8800]"
                                        value={(formData.funding_type_criteria[key as keyof typeof formData.funding_type_criteria] as any).min_business_age_months}
                                        onChange={(e) => handleFundingTypeCriteriaChange(key as keyof typeof formData.funding_type_criteria, 'min_business_age_months', e.target.value)}
                                        placeholder="12"
                                      />
                                    </div>
                                  )}
                                  
                                  {(key === 'factoring' || key === 'business_loans' || key === 'supply_chain_finance' || key === 'revolving_credit_facilities') && (
                                    <div>
                                      <label className="block text-sm font-medium mb-1 text-slate-700">Required Turnover (£)</label>
                                      <input
                                        type="number"
                                        className="w-full p-2 border border-slate-200 rounded-md text-sm text-slate-900 bg-white focus:ring-2 focus:ring-[#ff8800]/30 focus:border-[#ff8800]"
                                        value={(formData.funding_type_criteria[key as keyof typeof formData.funding_type_criteria] as any).required_turnover}
                                        onChange={(e) => handleFundingTypeCriteriaChange(key as keyof typeof formData.funding_type_criteria, 'required_turnover', e.target.value)}
                                        placeholder="500000"
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-end gap-4 mt-8">
              <Button
                type="button"
                variant="outline"
                className="px-6 py-2.5"
                onClick={() => navigate('/lender/dashboard')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-[#ff8800] to-[#ffaa00] hover:from-[#ff9900] hover:to-[#ffbb00] text-white font-semibold px-6 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
              >
                Save Profile
              </Button>
            </div>
          </form>
        </div>
      </div>
    </PageLayout>
  );
};

export default LenderProfile;
