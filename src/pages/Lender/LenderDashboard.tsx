import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  CreditCard, 
  TrendingUp, 
  Users, 
  PoundSterling, 
  Eye, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  BarChart3,
  Calendar,
  Download,
  Filter,
  Search,
  Bell,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  PieChart,
  Activity,
  FileText
} from 'lucide-react';
import { getDocument, getDocuments, createDocument, getLenderApplications, updateDocument } from '@/firebase';
import { getLenderConnectionRequests, getLenderConnectedApplications, acceptConnectionRequest, declineConnectionRequest } from '@/lib/lenderConnections';
import { toast } from 'sonner';
import PageLayout from '@/components/PageLayout';
import { useAuth } from '@/contexts/AuthContext';

import ApplicationCard from '@/pages/Lender/MatchedApplications/components/ApplicationCard';
import { formatAddress, getBusinessDisplayName } from '@/lib/formatters';

const LenderDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch billing data
  const { data: billingData } = useQuery({
    queryKey: ['lenderBilling', user?.uid],
    queryFn: async () => {
      if (!user?.uid) {
        throw new Error('User not authenticated');
      }
      
      const { data, error } = await getDocument('lender_billing', user.uid);
      
      if (error) {
        return {
          subscription_plan: 'free',
          subscription_status: 'active',
          total_credits: 25,
          credits_used: 0,
          credits_balance: 25,
          next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        };
      }
      
      return data;
    },
    enabled: !!user?.uid,
  });

  // Fetch lender profile
  const { data: lenderProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['lenderProfile', user?.uid],
    queryFn: async () => {
      const { data, error } = await getDocument('lender_profiles', user?.uid);
      
      if (error) {
        toast.error('Error loading profile data');
        throw error;
      }
      
      return data;
    },
    enabled: !!user?.uid,
  });

  // Fetch connection requests
  const { data: connectionRequests, isLoading: connectionsLoading, refetch: refetchConnections } = useQuery({
    queryKey: ['connectionRequests', user?.uid],
    queryFn: async () => {
      if (!user?.uid) throw new Error('User not authenticated');
      
      // Use the same direct query as pendingConnections for consistency
      const { data, error } = await getDocuments('lender_connections', [
        { field: 'lender_id', operator: '==', value: user.uid }
      ]);
      
      if (error) {
        return [];
      }
      
      return data || [];
    },
    enabled: !!user?.uid,
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });

  // Fetch connected applications
  const { data: connectedApplications, isLoading: connectedAppsLoading } = useQuery({
    queryKey: ['connectedApplications', user?.uid],
    queryFn: async () => {
      if (!user?.uid) throw new Error('User not authenticated');
      
      const { data, error } = await getLenderConnectedApplications(user.uid);
      
      if (error) {
        return [];
      }
      
      return data || [];
    },
    enabled: !!user?.uid,
  });

  // Fetch matched applications using our new function
  const { 
    data: lenderApplications, 
    isLoading: applicationsLoading,
    error: applicationsError 
  } = useQuery({
    queryKey: ['lenderApplications', user?.uid],
    queryFn: async () => {
      if (!user?.uid) {
        throw new Error('User not authenticated');
      }
      
      const { data, error } = await getLenderApplications(user.uid);
      
      if (error) {
        toast.error('Error loading applications');
        throw error;
      }
      
      return data || [];
    },
    enabled: !!user?.uid,
  });

  // Helper function to check if application is declined by current lender
  const isApplicationDeclinedByLender = (app: any) => {
    if (!user?.uid) return false;
    
    // Check interested_lenders array for declined status
    const interestedLenders = app.interested_lenders || [];
    const lenderEntry = interestedLenders.find((l: any) => l.lender_id === user.uid);
    
    return lenderEntry?.status === 'declined' || lenderEntry?.status === 'rejected';
  };

  // Helper function to check if current lender has made an offer on this application
  const hasLenderMadeOffer = (app: any) => {
    if (!user?.uid || !lenderOffers) return false;
    return lenderOffers.some(offer => offer.application_id === app.id);
  };

  // Fetch offers made by lender
  const { data: lenderOffers, isLoading: offersLoading } = useQuery({
    queryKey: ['lenderOffers', user?.uid],
    queryFn: async () => {
      const { data, error } = await getDocuments('offers', [
        { field: 'lender_id', operator: '==', value: user?.uid }
      ]);
      
      if (error) {
        toast.error('Error loading offers');
        throw error;
      }
      
      // Since we can't join applications directly like in Supabase,
      // we'll fetch the associated application data for each offer if needed
      
      return data || [];
    },
    enabled: !!user?.uid,
  });

  // Fetch offers with accepted status for messaging
  const { data: acceptedOffers, isLoading: acceptedOffersLoading } = useQuery({
    queryKey: ['acceptedOffers', user?.uid],
    queryFn: async () => {

      const { data, error } = await getDocuments('offers', [
        { field: 'lender_id', operator: '==', value: user?.uid },
        { 
          field: 'status', 
          operator: 'in', 
          value: ['accepted', 'completed'] // Include both accepted and completed statuses
        },
        { field: 'is_active', operator: '==', value: true }
      ]);
      
      if (error) {
        toast.error('Error loading accepted offers');
        throw error;
      }
      

      
      // Fetch business details for each offer
      if (data && data.length > 0) {
        const offersWithBusinesses = await Promise.all(
          data.map(async (offer) => {
            try {
              // Get application data
              const appResponse = await getDocument('applications', offer.application_id);
              const applicationData = appResponse.data;
              const businessId = applicationData?.business_id || applicationData?.user_id;
              

              
              let businessData = null;
              // If we have a business ID, fetch the business details
              if (businessId) {
                const businessResponse = await getDocument('businesses', businessId);
                businessData = businessResponse.data;

              }
              
              // Return combined data
              return {
                ...offer,
                application: {
                  ...applicationData,
                  // Add business name to application for easy access
                  business_name: businessData?.business_name || 
                                businessData?.company_name || 
                                applicationData?.business_name ||
                                'Business'
                },
                business: businessData
              };
            } catch (err) {
              // Return the offer with whatever data we have
              return offer;
            }
          })
        );
        

        return offersWithBusinesses;
      }
      
      return data || [];
    },
    enabled: !!user?.uid,
  });

  // Fetch notifications
  const { data: notifications, isLoading: notificationsLoading } = useQuery({
    queryKey: ['notifications', user?.uid],
    queryFn: async () => {
      try {
        // Get notifications without sorting in the query to avoid index error
        const { data, error } = await getDocuments(
          'notifications',
          [{ field: 'recipient_id', operator: '==', value: user?.uid }]
          // Removed sorting to avoid Firebase index error
          // [{ field: 'sent_at', direction: 'desc' }]
        );
        
        if (error) {
          // Check if it's an index error and provide instructions
          // Optionally, handle index error here if needed
          return [];
        }
        
        // Sort client-side instead of in the query
        return data ? 
          [...data].sort((a, b) => new Date(b.sent_at || 0).getTime() - new Date(a.sent_at || 0).getTime()) 
          : [];
      } catch (err) {
        return [];
      }
    },
    enabled: !!user?.uid,
  });

  // Fetch pending connections from businesses
  const { data: pendingConnections, isLoading: pendingConnectionsLoading } = useQuery({
    queryKey: ['pendingConnections', user?.uid],
    queryFn: async () => {
      if (!user?.uid) {
        throw new Error('User not authenticated');
      }
      
      const { data, error } = await getDocuments('lender_connections', [
        { field: 'lender_id', operator: '==', value: user.uid },
        { field: 'status', operator: '==', value: 'pending' }
      ]);
      
      if (error) {
        return [];
      }
      
      return data || [];
    },
    enabled: !!user?.uid,
    refetchInterval: 5000, // Refetch every 5 seconds to catch new connections
  });

  // Fetch applications related to connection requests that might not be in lenderApplications
  const { data: connectionApplications, isLoading: connectionAppsLoading } = useQuery({
    queryKey: ['connectionApplications', user?.uid, connectionRequests],
    queryFn: async () => {
      if (!user?.uid || !connectionRequests || connectionRequests.length === 0) {
        return [];
      }
      
      // Get unique application IDs from connection requests
      const applicationIds = [...new Set(connectionRequests.map(req => req.application_id))].filter(id => typeof id === 'string') as string[];
      
      if (applicationIds.length === 0) {
        return [];
      }
      
      // Fetch each application
      const applications = await Promise.all(
        applicationIds.map(async (appId) => {
          try {
            const { data: appData, error } = await getDocument('applications', appId);
            if (error || !appData) {
              return null;
            }
            
            // Get business details
            const { data: businessData } = await getDocument('businesses', appData.user_id || appData.business_id);
            
            return {
              ...appData,
              id: appId,
              business_id: appData.user_id || appData.business_id,
              isFromConnectionRequest: true,
              business: businessData ? {
                business_name: businessData.business_name || 'Unnamed Business',
                logo_url: businessData.logo_url,
                industry_sector: businessData.industry_sector
              } : null
            };
          } catch (error) {
            return null;
          }
        })
      );
      
      return applications.filter(app => app !== null);
    },
    enabled: !!user?.uid && !!connectionRequests && connectionRequests.length > 0,
  });

  // Separate matched from available applications and filter out declined ones
  const allNonDeclinedApplications = useMemo(() => {
    // Combine applications from different sources
    const mainApplications = lenderApplications?.filter(app => !isApplicationDeclinedByLender(app)) || [];
    const connectionApps = connectionApplications?.filter(app => !isApplicationDeclinedByLender(app)) || [];
    
    // Merge and deduplicate based on application ID
    const allApps = [...mainApplications];
    connectionApps.forEach(connApp => {
      if (!allApps.some(app => app.id === connApp.id)) {
        allApps.push(connApp);
      }
    });
    
    return allApps;
  }, [lenderApplications, connectionApplications, user?.uid]);
  
  const matchedApplications = allNonDeclinedApplications.filter(app => app.isMatched) || [];
  const availableApplications = allNonDeclinedApplications.filter(app => !app.isMatched) || [];

  // Handle accepting/declining connection requests
  const handleConnectionRequest = async (connectionId: string, action: 'accept' | 'decline') => {
    try {
      if (action === 'accept') {
        const { success, error } = await acceptConnectionRequest(connectionId);
        if (!success) throw error;
      } else {
        const { success, error } = await declineConnectionRequest(connectionId);
        if (!success) throw error;
      }
      
      toast.success(`Connection request ${action}ed successfully.`);
      
      // Refetch all related data
      refetchConnections();
      queryClient.invalidateQueries({ queryKey: ['connectedApplications', user?.uid] });
      queryClient.invalidateQueries({ queryKey: ['lenderApplications', user?.uid] });
    } catch (error) {
      toast.error(`Failed to ${action} connection request.`);
    }
  };

  // Calculate statistics for dashboard
  const stats = {
    totalApplicationsMatched: matchedApplications?.length || 0,
    totalApplicationsAvailable: availableApplications?.length || 0,
    connectedApplications: connectedApplications?.length || 0,
    pendingConnectionRequests: connectionRequests?.filter(req => req.status === 'pending')?.length || 0,
    acceptedConnections: connectionRequests?.filter(req => req.status === 'accepted')?.length || 0,
    activeApplications: matchedApplications?.filter(app => app.status === 'matched').length || 0,
    offersExtended: lenderOffers?.length || 0,
    offersAccepted: lenderOffers?.filter(offer => 
      offer.status === 'accepted' || 
      (offer.status === 'completed' && offer.is_active)
    ).length || 0,
    prospects: availableApplications?.filter(app => !app.isViewed).length || 0,
    applicationsWithoutOffers: allNonDeclinedApplications?.filter(app => {
      // Check if this lender has already made an offer on this application
      const hasOffer = lenderOffers?.some(offer => offer.application_id === app.id);
      return !hasOffer; // Applications where no offer has been made yet
    }).length || 0,
    pendingConnections: pendingConnections?.length || 0,
    conversionRate: lenderOffers?.length 
      ? Math.round((lenderOffers.filter(offer => 
          offer.status === 'accepted' || 
          (offer.status === 'completed' && offer.is_active)
        ).length / lenderOffers.length) * 100) 
      : 0,
    totalLoanAmount: lenderOffers
      ?.filter(offer => offer.status === 'accepted')
      .reduce((sum, offer) => sum + offer.offered_amount, 0) || 0,
    monthlyConversion: {
      total: lenderOffers?.filter(offer => {
        const offerDate = new Date(offer.created_at);
        const now = new Date();
        return offerDate.getMonth() === now.getMonth() && offerDate.getFullYear() === now.getFullYear();
      }).length || 0,
      accepted: lenderOffers?.filter(offer => {
        const offerDate = new Date(offer.created_at);
        const now = new Date();
        return offerDate.getMonth() === now.getMonth() && 
               offerDate.getFullYear() === now.getFullYear() && 
               offer.status === 'accepted';
      }).length || 0
    },
    logo_url: lenderProfile?.logo_url || '',
    company_name: lenderProfile?.company_name || ''
  };

  return (
    <PageLayout showSidebar={true}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="container px-6 py-8 mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-slate-200/50 shadow-lg p-6 flex-1">
            <div className="flex items-center gap-4">
              {stats.logo_url && (
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                  <img 
                    src={stats.logo_url} 
                    alt="Company Logo" 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                  Welcome back{lenderProfile?.lender_name ? `, ${lenderProfile.lender_name}` : ''}
                </h1>
                <p className="text-slate-600">
                  {stats.company_name && (
                    <span className="font-medium text-slate-800">{stats.company_name} • </span>
                  )}
                  Manage your funding opportunities and monitor your portfolio performance
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics Cards - Matched Applications Style */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {/* Total Applications Card */}
          <div className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl">
            <div className="pt-6 px-6 pb-4">
              <div className="flex items-center justify-between">
                <div className="bg-[#212936] p-3 rounded-full shadow-sm">
                  <BarChart3 className="h-6 w-6 text-[#ff8000]" />
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-600">Total Applications</p>
                  <h3 className="text-2xl font-bold text-[#212936]">
                    {allNonDeclinedApplications === undefined ? (
                      <span className="animate-pulse">...</span>
                    ) : (
                      allNonDeclinedApplications?.length || 0
                    )}
                  </h3>
                </div>
              </div>
            </div>
          </div>
          {/* Matched Applications Card */}
          <div className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl">
            <div className="pt-6 px-6 pb-4">
              <div className="flex items-center justify-between">
                <div className="bg-[#212936] p-3 rounded-full shadow-sm">
                  <CheckCircle className="h-6 w-6 text-[#ff8000]" />
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-600">Matched Applications</p>
                  <h3 className="text-2xl font-bold text-[#212936]">
                    {allNonDeclinedApplications === undefined ? (
                      <span className="animate-pulse">...</span>
                    ) : (
                      matchedApplications?.length || 0
                    )}
                  </h3>
                </div>
              </div>
            </div>
          </div>
          {/* Total Loan Value Card */}
          <div className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl">
            <div className="pt-6 px-6 pb-4">
              <div className="flex items-center justify-between">
                <div className="bg-[#212936] p-3 rounded-full shadow-sm">
                  <CreditCard className="h-6 w-6 text-[#ff8000]" />
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-600">Total Funding Value</p>
                  <h3 className="text-2xl font-bold text-[#212936]">
                    {allNonDeclinedApplications === undefined ? (
                      <span className="animate-pulse">...</span>
                    ) : (
                      `£${(allNonDeclinedApplications?.reduce((sum, app) => sum + (app.loan_amount || 0), 0) || 0).toLocaleString()}`
                    )}
                  </h3>
                </div>
              </div>
            </div>
          </div>
          {/* New Applications Card */}
          <div className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl">
            <div className="pt-6 px-6 pb-4">
              <div className="flex items-center justify-between">
                <div className="bg-[#212936] p-3 rounded-full shadow-sm">
                  <Users className="h-6 w-6 text-[#ff8000]" />
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-600">New Applications</p>
                  <h3 className="text-2xl font-bold text-[#212936]">
                    {allNonDeclinedApplications === undefined ? (
                      <span className="animate-pulse">...</span>
                    ) : (
                      allNonDeclinedApplications?.filter(app => {
                        // Check if this lender has already made an offer on this application
                        const hasOffer = lenderOffers?.some(offer => offer.application_id === app.id);
                        return !hasOffer; // Show as "new" if no offer has been made yet
                      }).length || 0
                    )}
                  </h3>
                </div>
              </div>
            </div>
          </div>
        </div>
  
        {/* Enhanced Tabs Navigation */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/50 overflow-hidden">
          <div className="border-b border-slate-200/50">
            <div className="flex">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-all duration-200 ${
                  activeTab === 'overview'
                    ? 'border-b-2 border-[#ff8000] text-[#212936] bg-gradient-to-r from-[#ff8000]/5 to-[#212936]/5'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                Overview
              </button>
              <button
                onClick={() => setActiveTab('applications')}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-all duration-200 ${
                  activeTab === 'applications'
                    ? 'border-b-2 border-[#ff8000] text-[#212936] bg-gradient-to-r from-[#ff8000]/5 to-[#212936]/5'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <Users className="h-4 w-4" />
                Applications
                {stats.applicationsWithoutOffers > 0 && (
                  <span className="ml-1 px-2 py-0.5 text-xs bg-[#ff8000] text-white rounded-full">
                    {stats.applicationsWithoutOffers}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('connections')}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-all duration-200 ${
                  activeTab === 'connections'
                    ? 'border-b-2 border-[#ff8000] text-[#212936] bg-gradient-to-r from-[#ff8000]/5 to-[#212936]/5'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <Building2 className="h-4 w-4" />
                Connection Requests
                {pendingConnections && pendingConnections.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 text-xs bg-blue-500 text-white rounded-full">
                    {pendingConnections.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        
        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="p-6 space-y-8">
            <div className="space-y-6">
              {/* Accepted Offers - Enhanced */}
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-6 py-5 bg-slate-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500 rounded-lg">
                          <CheckCircle className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold text-white">Active Funding</h2>
                          <p className="text-sm text-slate-300">Applications with ongoing relationships</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white">{acceptedOffers?.length || 0}</div>
                        <div className="text-sm text-slate-300">Active</div>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    {acceptedOffersLoading ? (
                      <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="animate-pulse">
                            <div className="flex items-center space-x-4">
                              <div className="h-12 w-12 bg-gray-200 rounded-lg"></div>
                              <div className="flex-1">
                                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                              </div>
                              <div className="h-6 w-16 bg-gray-200 rounded"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : acceptedOffers && acceptedOffers.length > 0 ? (
                      <div className="space-y-4">
                    {acceptedOffers.slice(0, 5).map(offer => (
                      <ApplicationCard
                        key={offer.id}
                        app={{
                          ...offer.application,
                          offered_amount: offer.offered_amount,
                          status: offer.status,
                          business: offer.business,
                          accepted_at: offer.accepted_at,
                        }}
                        user={user}
                        isApplicationDeclined={() => false}
                        canSeeBusinessDetails={() => true}
                        handleExpressInterest={() => {}}
                        navigate={navigate}
                        handleStartConversation={() => {}}
                        isLenderMatched={() => true}
                        getCreditScoreRisk={() => ''}
                        hasLenderMadeOffer={hasLenderMadeOffer}
                      />
                    ))}
                        {acceptedOffers.length > 5 && (
                          <div className="text-center pt-4">
                            <button 
                              className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                              onClick={() => setActiveTab('applications')}
                            >
                              View all {acceptedOffers.length} active loans →
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="mx-auto h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <CheckCircle className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No active loans yet</h3>
                        <p className="text-gray-600 mb-4">Start reviewing applications to build your portfolio</p>
                        <button 
                          className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                          onClick={() => setActiveTab('applications')}
                        >
                          <Eye className="h-4 w-4" />
                          Browse Applications
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* New Applications */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-6 py-5 bg-slate-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500 rounded-lg">
                          <FileText className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold text-white">New Applications</h2>
                          <p className="text-sm text-slate-300">Fresh funding opportunities available</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white">{availableApplications?.length || 0}</div>
                        <div className="text-sm text-slate-300">Available</div>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    {applicationsLoading || connectionAppsLoading ? (
                      <div className="space-y-4">
                        {[...Array(4)].map((_, i) => (
                          <div key={i} className="animate-pulse">
                            <div className="flex items-center space-x-4">
                              <div className="h-12 w-12 bg-gray-200 rounded-lg"></div>
                              <div className="flex-1">
                                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                              </div>
                              <div className="h-6 w-16 bg-gray-200 rounded"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : availableApplications && availableApplications.length > 0 ? (
                      <div className="space-y-4">
                    {availableApplications.slice(0, 5).map(app => (
                      <ApplicationCard
                        key={app.id}
                        app={app}
                        user={user}
                        isApplicationDeclined={() => false}
                        canSeeBusinessDetails={app => app.isMatched}
                        handleExpressInterest={() => {}}
                        navigate={navigate}
                        handleStartConversation={() => {}}
                        isLenderMatched={app => !!app.isMatched}
                        getCreditScoreRisk={() => ''}
                        hasLenderMadeOffer={hasLenderMadeOffer}
                      />
                    ))}
                        {availableApplications.length > 5 && (
                          <div className="text-center pt-4">
                            <button 
                              className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                              onClick={() => setActiveTab('applications')}
                            >
                              View all {availableApplications.length} new applications →
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="mx-auto h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <FileText className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No new applications</h3>
                        <p className="text-gray-600 mb-4">Check back later for new funding opportunities</p>
                        <button 
                          className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                          onClick={() => setActiveTab('applications')}
                        >
                          <Eye className="h-4 w-4" />
                          View All Applications
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'applications' && (
          <div className="p-6 space-y-6">
            {/* Applications Header with Search and Filters */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">All Applications</h2>
                <p className="text-gray-600">Review and manage funding applications</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search businesses..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <Filter className="h-4 w-4" />
                  Filter
                </button>
              </div>
            </div>

            {/* Application Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-blue-700">Total Available</div>
                    <div className="text-2xl font-bold text-blue-900">{stats.totalApplicationsAvailable}</div>
                  </div>
                  <Eye className="h-8 w-8 text-blue-500" />
                </div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-green-700">Matched</div>
                    <div className="text-2xl font-bold text-green-900">{stats.totalApplicationsMatched}</div>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-orange-700">New Prospects</div>
                    <div className="text-2xl font-bold text-orange-900">{stats.applicationsWithoutOffers}</div>
                  </div>
                  <AlertCircle className="h-8 w-8 text-orange-500" />
                </div>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-purple-700">In Review</div>
                    <div className="text-2xl font-bold text-purple-900">{Math.max(0, stats.totalApplicationsAvailable - stats.applicationsWithoutOffers)}</div>
                  </div>
                  <Clock className="h-8 w-8 text-purple-500" />
                </div>
              </div>
            </div>

            {/* Applications List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-slate-800">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-white">Applications</h3>
                  <span className="text-sm text-slate-300">
                    {allNonDeclinedApplications?.length || 0} total applications
                  </span>
                </div>
              </div>
              <div className="p-6">
                {applicationsLoading || connectionAppsLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="flex items-center space-x-4">
                          <div className="h-16 w-16 bg-gray-200 rounded-xl"></div>
                          <div className="flex-1">
                            <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                          </div>
                          <div className="h-8 w-20 bg-gray-200 rounded"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : allNonDeclinedApplications && allNonDeclinedApplications.length > 0 ? (
                  <div className="space-y-4">
                    {allNonDeclinedApplications.map(app => (
                      <ApplicationCard
                        key={app.id}
                        app={app}
                        user={user}
                        isApplicationDeclined={isApplicationDeclinedByLender}
                        canSeeBusinessDetails={app => app.isMatched}
                        handleExpressInterest={() => {}}
                        navigate={navigate}
                        handleStartConversation={() => {}}
                        isLenderMatched={app => !!app.isMatched}
                        getCreditScoreRisk={() => ''}
                        hasLenderMadeOffer={hasLenderMadeOffer}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <div className="mx-auto h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <Users className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No applications available</h3>
                    <p className="text-gray-600 mb-6">Check back later for new funding applications</p>
                    <button 
                      className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                      onClick={() => window.location.reload()}
                    >
                      <Activity className="h-4 w-4" />
                      Refresh Applications
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'connections' && (
          <div className="p-6 space-y-6">
            {/* Connection Requests Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-orange-700">Pending Requests</div>
                    <div className="text-2xl font-bold text-orange-900">{pendingConnections?.length || 0}</div>
                  </div>
                  <Clock className="h-8 w-8 text-orange-500" />
                </div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-green-700">Connected Applications</div>
                    <div className="text-2xl font-bold text-green-900">{stats.connectedApplications}</div>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-blue-700">Total Requests</div>
                    <div className="text-2xl font-bold text-blue-900">{(connectionRequests?.length || 0) + (pendingConnections?.length || 0)}</div>
                  </div>
                  <Building2 className="h-8 w-8 text-blue-500" />
                </div>
              </div>
            </div>

            {/* Loading state for connection requests */}
            {connectionsLoading && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff8000] mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading connection requests...</p>
                </div>
              </div>
            )}

            {/* Pending Connection Requests */}
            {!connectionsLoading && !pendingConnectionsLoading && pendingConnections && pendingConnections.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-5 bg-orange-500">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Clock className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-white">Pending Connection Requests</h2>
                      <p className="text-sm text-orange-100">Businesses waiting for your response</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 space-y-4">
                  {pendingConnections.map((connection) => (
                    <div key={connection.id} className="relative">
                      <ApplicationCard
                        app={{
                          ...connection.application_data,
                          id: connection.application_id,
                          company_name: connection.application_data?.business_name,
                          loan_amount: connection.application_data?.loan_amount,
                          loan_purpose: connection.application_data?.purpose,
                          created_at: connection.connected_at,
                          isMatched: false,
                          status: 'pending_connection'
                        }}
                        user={user}
                        isApplicationDeclined={() => false}
                        canSeeBusinessDetails={() => false}
                        handleExpressInterest={() => {}}
                        navigate={navigate}
                        handleStartConversation={() => {}}
                        isLenderMatched={() => false}
                        getCreditScoreRisk={() => ''}
                        hasLenderMadeOffer={hasLenderMadeOffer}
                      />
                      {/* Action buttons overlay */}
                      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleConnectionRequest(connection.id, 'decline');
                          }}
                          className="border-red-300 text-red-700 hover:bg-red-50 bg-white shadow-sm"
                        >
                          Decline
                        </Button>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            // First accept the connection
                            handleConnectionRequest(connection.id, 'accept');
                            // Then navigate to business detail page after a short delay
                            setTimeout(() => {
                              navigate(`/business/${connection.application_id}`);
                            }, 1000);
                          }}
                          className="bg-[#ff8000] hover:bg-[#e6720e] text-white shadow-sm"
                        >
                          Accept & Review
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Loading state for connected applications */}
            {connectedAppsLoading && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff8000] mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading connected applications...</p>
                </div>
              </div>
            )}

            {/* Connected Applications */}
            {!connectedAppsLoading && connectedApplications?.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-5 bg-green-500">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-white">Connected Applications</h2>
                      <p className="text-sm text-green-100">Applications you can review and make offers on</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 space-y-4">
                  {connectedApplications.slice(0, 5).map((application) => (
                    <div key={application.id} className="relative">
                      <ApplicationCard
                        app={{
                          ...application,
                          company_name: application.business_profile?.business_name || application.business_name,
                          loan_amount: application.loan_amount,
                          loan_purpose: application.purpose,
                          created_at: application.connected_at,
                          isMatched: true,
                          status: 'connected'
                        }}
                        user={user}
                        isApplicationDeclined={() => false}
                        canSeeBusinessDetails={() => true}
                        handleExpressInterest={() => {}}
                        navigate={navigate}
                        handleStartConversation={() => {}}
                        isLenderMatched={() => true}
                        getCreditScoreRisk={() => ''}
                        hasLenderMadeOffer={hasLenderMadeOffer}
                      />
                      {/* Review button overlay */}
                      <div className="absolute top-4 right-4 z-10">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/business/${application.id}`);
                          }}
                          className="text-gray-700 hover:bg-gray-50 bg-white shadow-sm"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Review
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {connectedApplications.length > 5 && (
                  <div className="px-6 py-4 bg-gray-50 border-t">
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab('applications')}
                      className="w-full"
                    >
                      View All Connected Applications ({connectedApplications.length})
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* No connections state */}
            {!connectionsLoading && !connectedAppsLoading && !pendingConnectionsLoading && 
             (!pendingConnections || pendingConnections.length === 0) && 
             (!connectedApplications || connectedApplications.length === 0) && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Building2 className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No connection requests yet</h3>
                  <p className="text-gray-600 mb-4">Businesses will appear here when they want to connect with you based on your lending criteria.</p>
                  <Button
                    onClick={() => navigate('/lender/profile')}
                    className="bg-[#ff8000] hover:bg-[#e6720e] text-white"
                  >
                    Review Your Lending Criteria
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        </div> {/* Close the tab navigation div */}
        </div>
      </div>
    </PageLayout>
  );
};

export default LenderDashboard;
