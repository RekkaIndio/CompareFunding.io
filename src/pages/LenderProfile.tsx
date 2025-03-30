import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { getDocument, updateDocument } from '@/firebase';
import { toast } from 'sonner';
import PageLayout from '@/components/PageLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Building2, BadgePoundSterling, Image as ImageIcon } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar } from '@/components/ui/avatar';

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
        // Use URL constructor to properly parse the domain
        const url = new URL(domain);
        domain = url.hostname;
      } catch (e) {
        console.error('Invalid URL format:', domain);
        toast.error('Please enter a valid website URL');
        return;
      }

      if (!domain) return;
      
      // Check if it's a Firebase hosting URL or similar service that might not have favicon
      const isHostingService = 
        domain.includes('firebaseapp.com') || 
        domain.includes('netlify.app') || 
        domain.includes('vercel.app') ||
        domain.includes('github.io');
        
      if (isHostingService) {
        // For hosting services, we can try to use a default logo based on the service
        const logoUrl = getDefaultLogoForService(domain);
        if (logoUrl) {
          setFormData(prev => ({ ...prev, logo_url: logoUrl }));
          toast.success('Default logo set for hosting service');
          saveLogo(logoUrl); // Save the logo immediately
          return;
        }
      }

      console.log('Fetching logo for domain:', domain);
      
      // First try favicon.ico directly (most reliable for many sites)
      const directFaviconUrl = `https://${domain}/favicon.ico`;
      console.log('Trying direct favicon URL:', directFaviconUrl);
      
      const directImg = new Image();
      directImg.onload = () => {
        setFormData(prev => ({ ...prev, logo_url: directFaviconUrl }));
        toast.success('Logo fetched successfully');
        saveLogo(directFaviconUrl); // Save the logo immediately
      };
      
      directImg.onerror = () => {
        // If direct favicon fails, try Google's service
        const googleLogoUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
        console.log('Trying Google favicon service:', googleLogoUrl);
        
        const googleImg = new Image();
        googleImg.onload = () => {
          // Check if it's the default Google favicon (gray globe)
          checkIfDefaultFavicon(googleLogoUrl, (isDefault) => {
            if (isDefault) {
              // If Google returned default icon, try DuckDuckGo
              tryDuckDuckGoFavicon();
            } else {
              setFormData(prev => ({ ...prev, logo_url: googleLogoUrl }));
              toast.success('Logo fetched successfully');
              saveLogo(googleLogoUrl); // Save the logo immediately
            }
          });
        };
        
        googleImg.onerror = tryDuckDuckGoFavicon;
        googleImg.src = googleLogoUrl;
      };
      
      // Helper function to try DuckDuckGo favicon service
      function tryDuckDuckGoFavicon() {
        const ddgLogoUrl = `https://icons.duckduckgo.com/ip3/${domain}.ico`;
        console.log('Trying DuckDuckGo favicon service:', ddgLogoUrl);
        
        const ddgImg = new Image();
        ddgImg.onload = () => {
          setFormData(prev => ({ ...prev, logo_url: ddgLogoUrl }));
          toast.success('Logo fetched successfully');
          saveLogo(ddgLogoUrl); // Save the logo immediately
        };
        
        ddgImg.onerror = () => {
          // If all favicon services fail, try to generate a letter logo
          const letterLogo = generateLetterLogo(formData.company_name || domain);
          setFormData(prev => ({ ...prev, logo_url: letterLogo }));
          toast.info('Generated a placeholder logo for your company');
          saveLogo(letterLogo); // Save the logo immediately
        };
        
        ddgImg.src = ddgLogoUrl;
      }
      
      // Start the favicon fetch chain
      directImg.src = directFaviconUrl;
    } catch (error) {
      console.error('Error fetching logo:', error);
      toast.error('Failed to fetch logo');
      
      // Fallback to generated logo
      if (formData.company_name) {
        const letterLogo = generateLetterLogo(formData.company_name);
        setFormData(prev => ({ ...prev, logo_url: letterLogo }));
        saveLogo(letterLogo); // Save the logo immediately
      }
    }
  };
  
  // Function to save the logo URL and extract colors
  const saveLogo = async (logoUrl: string) => {
    if (!user?.uid) return;
    
    try {
      // Extract colors from the logo
      const colors = await extractColors(logoUrl);
      
      // Update the profile with both logo and colors
      const { error } = await updateDocument('lender_profiles', user.uid, {
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

  // Helper function to check if an image is the default Google favicon
  const checkIfDefaultFavicon = (imageUrl: string, callback: (isDefault: boolean) => void) => {
    // This is a simplified check - in a real app, you might use canvas to compare pixel data
    // Here we're just checking if the URL contains specific patterns
    if (imageUrl.includes('google.com/s2/favicons')) {
      callback(false); // Assume it's not default for this demo
    } else {
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
        console.log('Fetching logo for website:', newWebsite);
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
      if (!user?.uid) {
        toast.error('You must be logged in to update your profile');
        return;
      }
      
      // Ensure logo_url is included in the profile data
      console.log('Saving profile with logo URL:', formData.logo_url);
      
      const profileData = {
        company_name: formData.company_name,
        company_type: formData.company_type,
        description: formData.description,
        website: formData.website,
        logo_url: formData.logo_url, // Make sure this is included
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
      
      if (error) throw error;
      
      toast.success('Profile updated successfully');
      navigate('/lender/dashboard');
      
    } catch (err) {
      console.error('Error updating profile:', err);
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
    return (
      <PageLayout>
        <div className="container py-8">
          <div className="max-w-3xl mx-auto">
            <div className="h-[600px] animate-pulse bg-gray-100 rounded-xl"></div>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="container py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Lender Profile</h1>
          <p className="text-muted-foreground mb-8">
            Set up your lender profile and lending criteria
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Company Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Company Information
                </CardTitle>
                <CardDescription>Basic information about your lending institution</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="company_name">Company Name</Label>
                    <Input
                      id="company_name"
                      value={formData.company_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="company_type">Company Type</Label>
                    <Select
                      value={formData.company_type}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, company_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select company type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="bank">Bank</SelectItem>
                          <SelectItem value="credit_union">Credit Union</SelectItem>
                          <SelectItem value="alternative_lender">Alternative Lender</SelectItem>
                          <SelectItem value="peer_to_peer">Peer-to-Peer Platform</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description of your lending institution"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="website">Website</Label>
                    <div className="flex gap-2 items-center">
                      <Input
                        id="website"
                        type="url"
                        value={formData.website}
                        onChange={handleWebsiteChange}
                        placeholder="https://example.com"
                        className="flex-grow"
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleManualLogoFetch}
                        className="whitespace-nowrap"
                      >
                        Fetch Logo
                      </Button>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <Label>Company Logo</Label>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="border rounded-md p-2 h-20 w-20 flex items-center justify-center bg-muted/20">
                        {formData.logo_url ? (
                          <img 
                            src={formData.logo_url} 
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
                          {formData.logo_url ? 'Company logo detected' : 'No logo detected'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formData.logo_url 
                            ? 'Logo will be saved with your profile' 
                            : 'Enter your company website URL to automatically fetch your logo, or click "Fetch Logo"'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Address */}
            <Card>
              <CardHeader>
                <CardTitle>Address</CardTitle>
                <CardDescription>Your company's registered address</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="address_line1">Address Line 1</Label>
                    <Input
                      id="address_line1"
                      value={formData.address_line1}
                      onChange={(e) => setFormData(prev => ({ ...prev, address_line1: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="address_line2">Address Line 2</Label>
                    <Input
                      id="address_line2"
                      value={formData.address_line2}
                      onChange={(e) => setFormData(prev => ({ ...prev, address_line2: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="postal_code">Postal Code</Label>
                    <Input
                      id="postal_code"
                      value={formData.postal_code}
                      onChange={(e) => setFormData(prev => ({ ...prev, postal_code: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lending Criteria */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BadgePoundSterling className="h-5 w-5" />
                  Lending Criteria
                </CardTitle>
                <CardDescription>Define your lending parameters and requirements</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="min_loan_amount">Minimum Facility (£)</Label>
                    <Input
                      id="min_loan_amount"
                      type="number"
                      value={formData.min_loan_amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, min_loan_amount: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="max_loan_amount">Maximum Facility (£)</Label>
                    <Input
                      id="max_loan_amount"
                      type="number"
                      value={formData.max_loan_amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, max_loan_amount: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="min_business_age">Minimum Business Age (months)</Label>
                    <Input
                      id="min_business_age"
                      type="number"
                      value={formData.min_business_age_months}
                      onChange={(e) => setFormData(prev => ({ ...prev, min_business_age_months: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="min_annual_revenue">Minimum Annual Revenue (£)</Label>
                    <Input
                      id="min_annual_revenue"
                      type="number"
                      value={formData.min_annual_revenue}
                      onChange={(e) => setFormData(prev => ({ ...prev, min_annual_revenue: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label>Preferred Industries</Label>
                  <Select
                    value={formData.preferred_industries[0]}
                    onValueChange={(value) => setFormData(prev => ({
                      ...prev,
                      preferred_industries: [value]
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select preferred industries" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="retail">Retail</SelectItem>
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="manufacturing">Manufacturing</SelectItem>
                        <SelectItem value="services">Professional Services</SelectItem>
                        <SelectItem value="hospitality">Hospitality</SelectItem>
                        <SelectItem value="healthcare">Healthcare</SelectItem>
                        <SelectItem value="construction">Construction</SelectItem>
                        <SelectItem value="agriculture">Agriculture</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Excluded Industries</Label>
                  <Select
                    value={formData.excluded_industries[0]}
                    onValueChange={(value) => setFormData(prev => ({
                      ...prev,
                      excluded_industries: [value]
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select excluded industries" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="retail">Retail</SelectItem>
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="manufacturing">Manufacturing</SelectItem>
                        <SelectItem value="services">Professional Services</SelectItem>
                        <SelectItem value="hospitality">Hospitality</SelectItem>
                        <SelectItem value="healthcare">Healthcare</SelectItem>
                        <SelectItem value="construction">Construction</SelectItem>
                        <SelectItem value="agriculture">Agriculture</SelectItem>
                        <SelectItem value="gambling">Gambling</SelectItem>
                        <SelectItem value="adult">Adult Entertainment</SelectItem>
                        <SelectItem value="weapons">Weapons & Defense</SelectItem>
                        <SelectItem value="tobacco">Tobacco</SelectItem>
                        <SelectItem value="cannabis">Cannabis</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    These criteria will be used to match you with relevant applications.
                  </AlertDescription>
                </Alert>
              </CardFooter>
            </Card>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/lender/dashboard')}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="bg-fundhub-blue hover:bg-fundhub-blue/90"
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
