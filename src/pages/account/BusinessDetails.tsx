import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getDocument } from '../../firebase';
import { toast } from 'sonner';
import PageLayout from '../../components/PageLayout';

interface BusinessProfile {
  business_name?: string;
  company_number?: string;
  industry_sector?: string;
  company_size?: string;
  description?: string;
  website?: string;
  business_email?: string;
  business_phone?: string;
  annual_revenue?: string;
  logo_url?: string;
  address?: {
    line1?: string;
    city?: string;
    postal_code?: string;
    country?: string;
  };
  trading_address?: {
    line1?: string;
    city?: string;
    postal_code?: string;
    country?: string;
  };
  incorporation_date?: string;
  vat_number?: string;
}

const BusinessDetails = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch business profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        const { data, error } = await getDocument('businesses', user.uid);

        if (error) {
          console.error('Error fetching business profile:', error);
          toast.error('Failed to load business profile');
          return;
        }

        if (data) {
          setProfile(data);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        toast.error('Failed to load business profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  if (isLoading) {
    return (
      <PageLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading business details...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-r from-blue-900 to-purple-900 text-white py-16 overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-20"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')"
            }}
          />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="flex items-center justify-center mb-6">
                {profile?.logo_url && (
                  <img
                    src={profile.logo_url}
                    alt={profile.business_name || 'Business Logo'}
                    className="w-16 h-16 rounded-full object-cover border-4 border-white/20 mr-4"
                  />
                )}
                <h1 className="text-4xl md:text-5xl font-bold">
                  {profile?.business_name || 'Business Details'}
                </h1>
              </div>
              <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
                {profile?.description || 'Manage your company information and keep your business profile up to date'}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {!profile ? (
            // No profile found state
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">No Business Profile Found</h3>
              <p className="text-gray-600 mb-6">Please complete your business profile to view your details here.</p>
              <button
                onClick={() => window.location.href = '/business/profile'}
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Complete Business Profile
              </button>
            </div>
          ) : (
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Company Information Card */}
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Company Information</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                    <div className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50">
                      {profile.business_name || 'Not specified'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company Number</label>
                    <div className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50">
                      {profile.company_number || 'Not specified'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
                    <div className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50">
                      {profile.industry_sector || 'Not specified'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company Size</label>
                    <div className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50">
                      {profile.company_size || 'Not specified'}
                    </div>
                  </div>
                  {profile.website && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                      <div className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50">
                        <a
                          href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          {profile.website}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact & Address Information Card */}
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Contact & Address</h2>
                </div>
                <div className="space-y-4">
                  {profile.business_email && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Business Email</label>
                      <div className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50">
                        <a href={`mailto:${profile.business_email}`} className="text-blue-600 hover:text-blue-800 transition-colors">
                          {profile.business_email}
                        </a>
                      </div>
                    </div>
                  )}
                  {profile.business_phone && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Business Phone</label>
                      <div className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50">
                        <a href={`tel:${profile.business_phone}`} className="text-blue-600 hover:text-blue-800 transition-colors">
                          {profile.business_phone}
                        </a>
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Registered Address</label>
                    <div className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50">
                      {profile.address ? (
                        <div>
                          {profile.address.line1 && <div>{profile.address.line1}</div>}
                          {profile.address.city && profile.address.postal_code && (
                            <div>{profile.address.city}, {profile.address.postal_code}</div>
                          )}
                          {profile.address.country && <div>{profile.address.country}</div>}
                        </div>
                      ) : (
                        'Not specified'
                      )}
                    </div>
                  </div>
                  {profile.trading_address && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Trading Address</label>
                      <div className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50">
                        <div>
                          {profile.trading_address.line1 && <div>{profile.trading_address.line1}</div>}
                          {profile.trading_address.city && profile.trading_address.postal_code && (
                            <div>{profile.trading_address.city}, {profile.trading_address.postal_code}</div>
                          )}
                          {profile.trading_address.country && <div>{profile.trading_address.country}</div>}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="mt-12 flex justify-center space-x-4">
            <button
              onClick={() => window.location.href = '/business/profile'}
              className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
            >
              {profile ? 'Update Details' : 'Complete Profile'}
            </button>
            {profile?.company_number && (
              <button
                onClick={() => window.location.href = '/business/credit-score'}
                className="px-8 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              >
                View Credit Report
              </button>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default BusinessDetails;
