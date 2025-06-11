import { useState } from 'react';
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
      
      const { data, error } = await getLenderConnectionRequests(user.uid);
      
      if (error) {
        console.error('Error loading connection requests:', error);
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
        console.error('Error loading connected applications:', error);
        return [];
      }
      
      return data || [];
    },
    enabled: !!user?.uid,
  });

  // Fetch matched applications using our new function
  const { 
    data: lenderApplications, 
    isLoading: applicationsLoading 
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

  // Separate matched from available applications
  const matchedApplications = lenderApplications?.filter(app => app.isMatched) || [];
  const availableApplications = lenderApplications?.filter(app => !app.isMatched) || [];

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
        console.error('Error loading accepted offers:', error);
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
              console.error(`Error fetching data for offer ${offer.id}:`, err);
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
          console.error('Error fetching notifications:', error);
          
          // Check if it's an index error and provide instructions
          // Optionally, handle index error here if needed
          return [];
        }
        
        // Sort client-side instead of in the query
        return data ? 
          [...data].sort((a, b) => new Date(b.sent_at || 0).getTime() - new Date(a.sent_at || 0).getTime()) 
          : [];
      } catch (err) {
        console.error('Error fetching notifications:', err);
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
        console.error('Error loading pending connections:', error);
        return [];
      }
      
      return data || [];
    },
    enabled: !!user?.uid,
    refetchInterval: 5000, // Refetch every 5 seconds to catch new connections
  });

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
      console.error(`Error ${action}ing connection:`, error);
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
        <div className="max-w-8xl mx-auto py-8 px-6 space-y-8">
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

        {/* Key Metrics Cards */}
  
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
                {stats.prospects > 0 && (
                  <span className="ml-1 px-2 py-0.5 text-xs bg-[#ff8000] text-white rounded-full">
                    {stats.prospects}
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
                          <h2 className="text-lg font-semibold text-white">Active Loans</h2>
                          <p className="text-sm text-slate-300">Funded applications with ongoing relationships</p>
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
                          <div 
                            key={offer.id}
                            className="group p-4 border border-gray-200 rounded-xl hover:border-green-300 hover:shadow-md cursor-pointer transition-all duration-200 bg-gradient-to-r from-gray-50 to-green-50/30"
                            onClick={() => navigate(`/business/${offer.application_id}`)}
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-4">
                                <div className="h-12 w-12 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center">
                                  <Building2 className="h-6 w-6 text-green-600" />
                                </div>
                                <div>
                                  <div className="font-semibold text-gray-900 group-hover:text-green-700 transition-colors">
                                    {getBusinessDisplayName(offer.application, offer.business)}
                                  </div>
                                  <div className="text-sm text-gray-600 mt-1">
                                    Loan Amount: {new Intl.NumberFormat('en-GB', {
                                      style: 'currency',
                                      currency: 'GBP'
                                    }).format(offer.offered_amount || 0)}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                                    <Calendar className="h-3 w-3" />
                                    Funded {new Date(offer.accepted_at).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-800 font-medium">
                                  Active
                                </span>
                              </div>
                            </div>
                          </div>
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
                    {applicationsLoading ? (
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
                          <div 
                            key={app.id}
                            className="group p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md cursor-pointer transition-all duration-200 bg-gradient-to-r from-gray-50 to-blue-50/30"
                            onClick={() => navigate(`/business/${app.id}`)}
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-4">
                                <div className="h-12 w-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                                  <Building2 className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                  <div className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                                    {app.company_name || app.business_name || 'Business'}
                                  </div>
                                  <div className="text-sm text-gray-600 mt-1">
                                    Loan Amount: {new Intl.NumberFormat('en-GB', {
                                      style: 'currency',
                                      currency: 'GBP'
                                    }).format(app.loan_amount || 0)}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                                    <Calendar className="h-3 w-3" />
                                    Applied {new Date(app.created_at || app.application_date).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-800 font-medium">
                                  New
                                </span>
                                <div className="p-2 text-gray-400 group-hover:text-blue-600 transition-colors">
                                  <Eye className="h-4 w-4" />
                                </div>
                              </div>
                            </div>
                          </div>
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
                    <div className="text-2xl font-bold text-orange-900">{stats.prospects}</div>
                  </div>
                  <AlertCircle className="h-8 w-8 text-orange-500" />
                </div>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-purple-700">In Review</div>
                    <div className="text-2xl font-bold text-purple-900">{Math.max(0, stats.totalApplicationsAvailable - stats.prospects)}</div>
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
                    {lenderApplications?.length || 0} total applications
                  </span>
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {applicationsLoading ? (
                  <div className="p-6">
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
                  </div>
                ) : lenderApplications && lenderApplications.length > 0 ? (
                  <>
                    {lenderApplications.map(app => (
                      <div 
                        key={app.id} 
                        className="group p-6 hover:bg-gray-50 cursor-pointer transition-all duration-200"
                        onClick={() => navigate(`/business/${app.id}`)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-16 w-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center group-hover:shadow-md transition-shadow">
                            <Building2 className="h-8 w-8 text-orange-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <h4 className="font-semibold text-gray-900 group-hover:text-orange-700 transition-colors">
                                {app.company_name || 'Business'}
                              </h4>
                              {!app.isViewed && (
                                <span className="px-2 py-0.5 text-xs bg-orange-500 text-white rounded-full animate-pulse">
                                  New
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 mb-2">
                              <span className="font-medium">
                                {new Intl.NumberFormat('en-GB', {
                                  style: 'currency',
                                  currency: 'GBP'
                                }).format(app.loan_amount || 0)}
                              </span>
                              <span className="mx-2">•</span>
                              <span>{app.loan_purpose || 'Business funding'}</span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Applied {new Date(app.created_at || Date.now()).toLocaleDateString()}
                              </div>
                              {app.credit_score && (
                                <div className="flex items-center gap-1">
                                  <BarChart3 className="h-3 w-3" />
                                  Credit Score: {app.credit_score}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className={`px-3 py-1 text-sm rounded-full font-medium ${
                                app.isMatched 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {app.isMatched ? 'Matched' : 'Available'}
                              </div>
                              {app.isMatched && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Review to make offer
                                </div>
                              )}
                            </div>
                            <div className="text-gray-400 group-hover:text-orange-500 transition-colors">
                              <ArrowUpRight className="h-5 w-5" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
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
                    <div className="text-2xl font-bold text-orange-900">{stats.pendingConnectionRequests}</div>
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
                    <div className="text-2xl font-bold text-blue-900">{connectionRequests?.length || 0}</div>
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
            {!connectionsLoading && connectionRequests?.filter(req => req.status === 'pending').length > 0 && (
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
                
                <div className="divide-y divide-gray-200">
                  {connectionRequests.filter(req => req.status === 'pending').map((connection) => (
                    <div key={connection.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#212936] to-[#2a3441] flex items-center justify-center">
                              <Building2 className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {connection.application_data?.business_name || 'Business Name'}
                              </h3>
                              <p className="text-sm text-gray-600">
                                Application #{connection.application_data?.application_number || connection.application_id?.slice(-8).toUpperCase() || 'Unknown'}
                              </p>
                              <p className="text-xs text-gray-500">
                                Connected on {new Date(connection.connected_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                            <div className="bg-blue-50 p-3 rounded-lg">
                              <div className="text-xs font-medium text-blue-700 mb-1">Product Type</div>
                              <div className="text-sm font-bold text-blue-900">
                                {connection.application_data?.product_type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'N/A'}
                              </div>
                            </div>
                            <div className="bg-green-50 p-3 rounded-lg">
                              <div className="text-xs font-medium text-green-700 mb-1">Loan Amount</div>
                              <div className="text-sm font-bold text-green-900">
                                £{connection.application_data?.loan_amount?.toLocaleString() || 'N/A'}
                              </div>
                            </div>
                            <div className="bg-purple-50 p-3 rounded-lg">
                              <div className="text-xs font-medium text-purple-700 mb-1">Term</div>
                              <div className="text-sm font-bold text-purple-900">
                                {connection.application_data?.loan_term_months || 'N/A'} months
                              </div>
                            </div>
                            <div className="bg-amber-50 p-3 rounded-lg">
                              <div className="text-xs font-medium text-amber-700 mb-1">Industry</div>
                              <div className="text-sm font-bold text-amber-900">
                                {connection.application_data?.industry || 'N/A'}
                              </div>
                            </div>
                          </div>
                          
                          {connection.application_data?.purpose && (
                            <div className="mb-4">
                              <div className="text-sm font-medium text-gray-700 mb-1">Purpose</div>
                              <p className="text-gray-600 text-sm">{connection.application_data.purpose}</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-3 ml-6">
                          <Button
                            variant="outline"
                            onClick={() => handleConnectionRequest(connection.id, 'decline')}
                            className="border-red-300 text-red-700 hover:bg-red-50"
                          >
                            Decline
                          </Button>
                          <Button
                            onClick={() => {
                              // First accept the connection
                              handleConnectionRequest(connection.id, 'accept');
                              // Then navigate to business detail page after a short delay
                              setTimeout(() => {
                                navigate(`/business/${connection.application_id}`);
                              }, 1000);
                            }}
                            className="bg-[#ff8000] hover:bg-[#e6720e] text-white"
                          >
                            Accept & Review
                          </Button>
                        </div>
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
                
                <div className="divide-y divide-gray-200">
                  {connectedApplications.slice(0, 5).map((application) => (
                    <div key={application.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                              <Building2 className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                {application.business_profile?.business_name || application.business_name || 'Business'}
                              </h3>
                              <p className="text-sm text-gray-600">
                                Application #{application.application_number || application.id?.slice(-8).toUpperCase()}
                              </p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="text-sm">
                              <span className="text-gray-500">Amount:</span>
                              <span className="ml-1 font-medium">£{application.loan_amount?.toLocaleString() || 'N/A'}</span>
                            </div>
                            <div className="text-sm">
                              <span className="text-gray-500">Term:</span>
                              <span className="ml-1 font-medium">{application.loan_term_months || 'N/A'} months</span>
                            </div>
                            <div className="text-sm">
                              <span className="text-gray-500">Purpose:</span>
                              <span className="ml-1 font-medium">{application.purpose || 'N/A'}</span>
                            </div>
                            <div className="text-sm">
                              <span className="text-gray-500">Connected:</span>
                              <span className="ml-1 font-medium">{new Date(application.connected_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 ml-6">
                          <Button
                            variant="outline"
                            onClick={() => navigate(`/business/${application.id}`)}
                            className="text-gray-700 hover:bg-gray-50"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Review
                          </Button>
                        </div>
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
            {!connectionsLoading && !connectedAppsLoading && (!connectionRequests || connectionRequests.length === 0) && (!connectedApplications || connectedApplications.length === 0) && (
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
