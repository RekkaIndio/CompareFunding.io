import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  CreditCard, 
  TrendingUp, 
  Users, 
  PoundSterling, 
  MessageSquare, 
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
import { getDocument, getDocuments, createDocument, getLenderApplications } from '@/firebase';
import { toast } from 'sonner';
import PageLayout from '@/components/PageLayout';
import { useAuth } from '@/contexts/AuthContext';
import { formatAddress, getBusinessDisplayName } from '@/lib/formatters';

const LenderDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState('');

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

  // Fetch messages for selected conversation
  const { data: messages, isLoading: messagesLoading, refetch: refetchMessages } = useQuery({
    queryKey: ['messages', selectedConversation?.id],
    queryFn: async () => {
      if (!selectedConversation) return [];
      


      
      try {
        // First, check if messages collection exists and what's in it
        const allMessagesResult = await getDocuments('messages', []);

        
        // Then try to fetch messages for this specific conversation

        
        const { data, error } = await getDocuments(
          'messages',
          [{ field: 'conversation_id', operator: '==', value: selectedConversation.id }]
        );
        
        if (error) {
          console.error('Error fetching messages:', error);
          toast.error('Error loading messages');
          throw error;
        }
        

        
        // Sort messages client-side by timestamp
        const sortedMessages = data ? 
          [...data].sort((a, b) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          ) : [];
        

        return sortedMessages;
      } catch (err) {
        console.error('Exception in message fetching:', err);
        return [];
      }
    },
    enabled: !!selectedConversation,
    refetchInterval: 5000, // Check more frequently - every 5 seconds
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

  // Function to send a new message
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      // Import the forceCreateMessage function
      const { forceCreateMessage } = await import('@/firebase');
      
      // Create message data
      const messageParams = {
        conversationId: selectedConversation.id,
        applicationId: selectedConversation.applicationId,
        senderId: user.uid,
        senderType: 'lender',
        recipientId: selectedConversation.businessId,
        message: newMessage.trim()
      };
      

      
      // Force create the message directly in Firebase
      const result = await forceCreateMessage(messageParams);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to send message');
      }
      


      // Create a notification for the business
      await createDocument('notifications', {
        recipient_id: selectedConversation.businessId,
        type: 'new_message',
        title: 'New message',
        message: `New message from ${lenderProfile?.lender_name || 'your lender'}`,
        related_entity_id: selectedConversation.id,
        related_entity_type: 'conversation',
        read: false,
        sent_at: new Date().toISOString()
      });

      // Clear the input and refresh messages
      setNewMessage('');
      refetchMessages();
      
      // Show success message
      toast.success('Message sent');
    } catch (error) {
      toast.error('Failed to send message');
      console.error(error);
    }
  };

  // Function to start a new conversation or select existing one
  const selectConversation = (offer) => {

    
    // Check for valid business ID 
    const businessId = offer.application?.business_id;
    
    if (!businessId) {
      console.error('Missing business_id in application:', offer.application);
      toast.error('Could not load conversation: Missing business ID');
      return;
    }
    
    // Set selected conversation with proper IDs
    setSelectedConversation({
      id: offer.id, // Using offer ID as conversation ID for simplicity
      businessName: offer.business?.business_name || 'Business',
      businessId: businessId,
      applicationId: offer.application_id,
      amount: offer.offered_amount
    });
    

  };

  // Calculate statistics for dashboard
  const stats = {
    totalApplicationsMatched: matchedApplications?.length || 0,
    totalApplicationsAvailable: availableApplications?.length || 0,
    activeApplications: matchedApplications?.filter(app => app.status === 'matched').length || 0,
    offersExtended: lenderOffers?.length || 0,
    offersAccepted: lenderOffers?.filter(offer => 
      offer.status === 'accepted' || 
      (offer.status === 'completed' && offer.is_active)
    ).length || 0,
    prospects: availableApplications?.filter(app => !app.isViewed).length || 0,
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
                onClick={() => setActiveTab('messages')}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-all duration-200 ${
                  activeTab === 'messages'
                    ? 'border-b-2 border-[#ff8000] text-[#212936] bg-gradient-to-r from-[#ff8000]/5 to-[#212936]/5'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <MessageSquare className="h-4 w-4" />
                Messages
                {acceptedOffers && acceptedOffers.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 text-xs bg-emerald-500 text-white rounded-full">
                    {acceptedOffers.length}
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
                                <button 
                                  className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    selectConversation(offer);
                                    setActiveTab('messages');
                                  }}
                                >
                                  <MessageSquare className="h-4 w-4" />
                                </button>
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
        
        {activeTab === 'messages' && (
          <div className="p-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-5 bg-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <MessageSquare className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Business Conversations</h2>
                    <p className="text-sm text-slate-300">Communicate with funded businesses</p>
                  </div>
                </div>
              </div>
              
              {acceptedOffersLoading ? (
                <div className="p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-20 bg-gray-200 rounded-lg"></div>
                    <div className="h-20 bg-gray-200 rounded-lg"></div>
                    <div className="h-20 bg-gray-200 rounded-lg"></div>
                  </div>
                </div>
              ) : acceptedOffers && acceptedOffers.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 h-[600px]">
                  {/* Conversations List */}
                  <div className="lg:border-r border-gray-200 bg-gray-50">
                    <div className="p-4 bg-slate-800">
                      <h3 className="font-medium text-white">Active Conversations</h3>
                      <p className="text-sm text-slate-300">{acceptedOffers.length} businesses</p>
                    </div>
                    <div className="overflow-y-auto h-full">
                      {acceptedOffers.map(offer => (
                        <div 
                          key={offer.id}
                          onClick={() => selectConversation(offer)}
                          className={`p-4 border-b border-gray-200 cursor-pointer transition-all duration-200 ${
                            selectedConversation?.id === offer.id
                              ? 'bg-orange-50 border-l-4 border-l-orange-500'
                              : 'hover:bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                              <Building2 className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 truncate">
                                {offer.application?.company_name || offer.business?.business_name || 'Business'}
                              </div>
                              <div className="text-sm text-gray-500 truncate">
                                {new Intl.NumberFormat('en-GB', {
                                  style: 'currency',
                                  currency: 'GBP'
                                }).format(offer.offered_amount || 0)}
                              </div>
                              <div className="text-xs text-gray-400">
                                Active loan
                              </div>
                            </div>
                            {selectedConversation?.id === offer.id && (
                              <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Message Area */}
                  <div className="lg:col-span-2 flex flex-col">
                    {selectedConversation ? (
                      <>
                        {/* Chat Header */}
                        <div className="bg-slate-800 p-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                              <Building2 className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-semibold text-white">{selectedConversation.businessName}</div>
                              <div className="text-sm text-slate-300">
                                Loan: {new Intl.NumberFormat('en-GB', {
                                  style: 'currency',
                                  currency: 'GBP'
                                }).format(selectedConversation.amount || 0)}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                          {messagesLoading ? (
                            <div className="flex justify-center items-center h-full">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                            </div>
                          ) : messages && messages.length > 0 ? (
                            messages.map(msg => (
                              <div 
                                key={msg.id}
                                className={`flex ${msg.sender_id === user.uid ? 'justify-end' : 'justify-start'}`}
                              >
                                <div className={`max-w-[70%] rounded-lg p-3 ${
                                  msg.sender_id === user.uid
                                    ? 'bg-orange-500 text-white'
                                    : 'bg-white text-gray-900 border border-gray-200'
                                }`}>
                                  <div className="text-sm">{msg.message}</div>
                                  <div className={`text-xs mt-1 ${
                                    msg.sender_id === user.uid ? 'text-orange-100' : 'text-gray-500'
                                  }`}>
                                    {new Date(msg.timestamp).toLocaleString()}
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                              <div className="h-16 w-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                                <MessageSquare className="h-8 w-8 text-gray-400" />
                              </div>
                              <h3 className="text-lg font-medium text-gray-900 mb-2">Start the conversation</h3>
                              <p className="text-gray-600 max-w-sm">
                                Send a message to begin communicating with this business about their loan.
                              </p>
                            </div>
                          )}
                        </div>
                        
                        {/* Message Input */}
                        <form onSubmit={sendMessage} className="p-4 bg-white border-t border-gray-200">
                          <div className="flex gap-3">
                            <input
                              type="text"
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              placeholder="Type your message..."
                              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                            <button
                              type="submit"
                              className="flex items-center gap-2 bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={!newMessage.trim()}
                            >
                              <MessageSquare className="h-4 w-4" />
                              Send
                            </button>
                          </div>
                        </form>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center bg-gray-50">
                        <div className="h-20 w-20 bg-gray-200 rounded-full flex items-center justify-center mb-6">
                          <MessageSquare className="h-10 w-10 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-medium text-gray-900 mb-2">Select a conversation</h3>
                        <p className="text-gray-600 max-w-sm">
                          Choose a business from the list to start or continue a conversation.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center">
                  <div className="mx-auto h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <MessageSquare className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No active conversations</h3>
                  <p className="text-gray-600 mb-6">You'll be able to message businesses once you have accepted offers.</p>
                  <button 
                    className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                    onClick={() => setActiveTab('applications')}
                  >
                    <Eye className="h-4 w-4" />
                    Review Applications
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        
        </div>
      </div>
      </div>
    </PageLayout>
  );
};

export default LenderDashboard;
