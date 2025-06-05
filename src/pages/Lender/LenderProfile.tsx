import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getDocument, updateDocument, createDocument } from '@/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import PageLayout from '@/components/PageLayout';
import { Building, Mail, ImageIcon, DollarSign } from 'lucide-react';
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

      // First try favicon.ico directly (most reliable for many sites)
      const directFaviconUrl = `https://${domain}/favicon.ico`;

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
  const generateLetterLogo = (name: string, simplified = false): string => {
    if (!name) return '';
    
    // Get first letter or first two letters
    const initials = name.trim().substring(0, simplified ? 1 : 2).toUpperCase();
    const colors = [
      '#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6',
      '#1abc9c', '#d35400', '#34495e', '#16a085', '#c0392b'
    ];
    
    // Use a deterministic color based on the name
    const colorIndex = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    const bgColor = colors[colorIndex];
    
    // Create a simpler SVG if simplified is true
    if (simplified) {
      const simpleSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" fill="${bgColor}"/><text x="50%" y="50%" font-size="32" font-family="Arial" fill="white" text-anchor="middle" dominant-baseline="central">${initials}</text></svg>`;
      return `data:image/svg+xml;base64,${btoa(simpleSvg)}`;
    }
    
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
        address: {
          line1: formData.address_line1 || '',
          line2: formData.address_line2 || ''
        },
        city: formData.city || '',
        state: formData.state || '',
        postal_code: formData.postal_code || '',
        country: formData.country || '',
        lending_criteria: {
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
          funding_types: formData.funding_types || {}
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
                <span>Back to Dashboard</span>
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
                        className="bg-gradient-to-r from-[#ff8800] to-[#ffaa00] hover:from-[#ff9900] hover:to-[#ffbb00] text-white font-semibold px-4 rounded-r-lg transition-all duration-200 shadow-md hover:shadow-lg"
                      >
                        Fetch Logo
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">Enter your website URL to automatically fetch your company logo</p>
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
                        />
                      ) : (
                        <div className="text-sm text-slate-400">No Logo</div>
                      )}
                    </div>
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
                  <DollarSign className="h-5 w-5" />
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
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Funding Types</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(formData.funding_types).map(([key, checked]) => (
                      <div key={key} className="flex items-center p-3 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors">
                        <input
                          type="checkbox"
                          id={`funding_type_${key}`}
                          checked={checked}
                          onChange={() => handleFundingTypeChange(key as keyof typeof formData.funding_types)}
                          className="h-4 w-4 rounded border-slate-300 text-[#ff8800] focus:ring-[#ff8800]/30 mr-3"
                        />
                        <label htmlFor={`funding_type_${key}`} className="text-sm font-medium text-slate-700 cursor-pointer">
                          {key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </label>
                      </div>
                    ))}
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
