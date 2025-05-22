import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getDocument, updateDocument } from '@/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import PageLayout from '@/components/PageLayout';
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
        address_line1: profile.address?.line1 || '',
        address_line2: profile.address?.line2 || '',
        city: profile.city || '',
        state: profile.state || '',
        postal_code: profile.postal_code || '',
        country: profile.country || '',
        min_loan_amount: profile.lending_criteria?.min_loan_amount?.toString() || '',
        max_loan_amount: profile.lending_criteria?.max_loan_amount?.toString() || '',
        preferred_industries: profile.lending_criteria?.preferred_industries || [],
        excluded_industries: profile.lending_criteria?.excluded_industries || [],
        min_business_age_months: profile.lending_criteria?.min_business_age_months?.toString() || '',
        min_annual_revenue: profile.lending_criteria?.min_annual_revenue?.toString() || '',
        funding_speed_days: profile.lending_criteria?.funding_speed_days?.toString() || '',
        interest_rate_range: {
          min: profile.lending_criteria?.interest_rate_range?.min?.toString() || '',
          max: profile.lending_criteria?.interest_rate_range?.max?.toString() || ''
        },
        funding_types: {
          invoice_finance: profile.lending_criteria?.funding_types?.invoice_finance || false,
          factoring: profile.lending_criteria?.funding_types?.factoring || false,
          asset_finance: profile.lending_criteria?.funding_types?.asset_finance || false,
          business_loans: profile.lending_criteria?.funding_types?.business_loans || false,
          commercial_property_loans: profile.lending_criteria?.funding_types?.commercial_property_loans || false,
          commercial_property_bridging_loans: profile.lending_criteria?.funding_types?.commercial_property_bridging_loans || false,
          commercial_property_vat_funding: profile.lending_criteria?.funding_types?.commercial_property_vat_funding || false,
          supply_chain_finance: profile.lending_criteria?.funding_types?.supply_chain_finance || false,
          stock_funding: profile.lending_criteria?.funding_types?.stock_funding || false,
          revolving_credit_facilities: profile.lending_criteria?.funding_types?.revolving_credit_facilities || false
        }
      });
    }
  }, [profile]);

  // Function to fetch website logo
  const fetchWebsiteLogo = (websiteUrl: string) => {
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
        // If invalid URL, fallback to original string
      }
      if (!domain) return;
      // Check if it's a Firebase hosting URL or similar service that might not have favicon
      const isHostingService = 
        domain.includes('firebaseapp.com') || 
        domain.includes('netlify.app') || 
        domain.includes('vercel.app') ||
        domain.includes('github.io');
      if (isHostingService) {
        // Use a default logo for known hosting services
        const logo = getDefaultLogoForService(domain);
        if (logo) setFormData(prev => ({ ...prev, logo_url: logo }));
        return;
      }
      console.log('Fetching logo for domain:', domain);
      // First try favicon.ico directly (most reliable for many sites)
      const directFaviconUrl = `https://${domain}/favicon.ico`;
      console.log('Trying direct favicon URL:', directFaviconUrl);
      const directImg = new window.Image();
      directImg.onload = () => {
        setFormData(prev => ({ ...prev, logo_url: directFaviconUrl }));
      };
      directImg.onerror = () => {
        // Fallback: use DuckDuckGo favicon service
        const ddgFavicon = `https://icons.duckduckgo.com/ip3/${domain}.ico`;
        setFormData(prev => ({ ...prev, logo_url: ddgFavicon }));
      };
      directImg.src = directFaviconUrl;
    } catch (error) {
      console.error('Error fetching logo:', error);
      toast.error('Failed to fetch logo');
      // Fallback to generated logo
      if (formData.company_name) {
        setFormData(prev => ({ ...prev, logo_url: generateLetterLogo(formData.company_name) }));
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
  
  // Helper function to generate a letter-based logo for companies without favicon
  const generateLetterLogo = (name: string): string => {
    if (!name) return '';
    
    // Get first letter or first two letters
    const initials = name.trim().substring(0, 2).toUpperCase();
    const colors = [
      '#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6',
      '#1abc9c', '#d35400', '#34495e', '#16a085', '#c0392b'
    ];
    
    // Use a deterministic color based on the name
    const colorIndex = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    const bgColor = colors[colorIndex];
    
    // Create an SVG data URL for the logo
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
      if (newWebsite) {
        fetchWebsiteLogo(newWebsite);
      }
    }, 1000);
  };

  // Add a manual fetch button as a fallback
  const handleManualLogoFetch = () => {
    if (formData.website) {
      fetchWebsiteLogo(formData.website);
    } else {
      toast.error('Please enter a website URL first');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (!user?.uid) return;
      // Ensure logo_url is included in the profile data
      console.log('Saving profile with logo URL:', formData.logo_url);
      const profileData = {
        company_name: formData.company_name,
        company_type: formData.company_type,
        description: formData.description,
        website: formData.website,
        logo_url: formData.logo_url,
        address: {
          line1: formData.address_line1,
          line2: formData.address_line2
        },
        city: formData.city,
        state: formData.state,
        postal_code: formData.postal_code,
        country: formData.country,
        lending_criteria: {
          min_loan_amount: parseFloat(formData.min_loan_amount) || 0,
          max_loan_amount: parseFloat(formData.max_loan_amount) || 0,
          preferred_industries: formData.preferred_industries,
          excluded_industries: formData.excluded_industries,
          min_business_age_months: parseInt(formData.min_business_age_months) || 0,
          min_annual_revenue: parseFloat(formData.min_annual_revenue) || 0,
          funding_speed_days: parseInt(formData.funding_speed_days) || 0,
          interest_rate_range: {
            min: parseFloat(formData.interest_rate_range.min) || 0,
            max: parseFloat(formData.interest_rate_range.max) || 0
          },
          funding_types: formData.funding_types
        },
        updated_at: new Date().toISOString()
      };
      const { error } = await updateDocument('lender_profiles', user.uid, profileData);
      if (error) {
        toast.error('Failed to update profile');
        return;
      }
      toast.success('Profile updated successfully');
      navigate('/lender/dashboard');
    } catch (err) {
      console.error('Failed to update profile', err);
      toast.error('Failed to update profile');
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

  if (isLoading) {
    return null;
  }

  return (
    <PageLayout>
    </PageLayout>
  );
};

export default LenderProfile;
