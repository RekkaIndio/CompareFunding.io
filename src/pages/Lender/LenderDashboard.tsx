import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getDocument, getDocuments, createDocument, getLenderApplications } from '@/firebase';
import { toast } from 'sonner';
import PageLayout from '@/components/PageLayout';
import { useAuth } from '@/contexts/AuthContext';
import { BarChart, CreditCard, Users, DollarSign, ArrowUp, ArrowDown, Loader2, MessageCircle } from 'lucide-react';
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
      
      console.log('Fetched lender applications:', data);
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
      console.log('Fetching accepted offers for user:', user?.uid);
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
      
      console.log('Found accepted offers:', data?.length || 0);
      
      // Fetch business details for each offer
      if (data && data.length > 0) {
        const offersWithBusinesses = await Promise.all(
          data.map(async (offer) => {
            try {
              // Get application data
              const appResponse = await getDocument('applications', offer.application_id);
              const applicationData = appResponse.data;
              const businessId = applicationData?.business_id || applicationData?.user_id;
              
              console.log(`Offer ${offer.id} - Application ${offer.application_id} - Business ID: ${businessId}`);
              
              let businessData = null;
              // If we have a business ID, fetch the business details
              if (businessId) {
                const businessResponse = await getDocument('businesses', businessId);
                businessData = businessResponse.data;
                console.log(`Fetched business data for ${businessId}:`, businessData?.business_name || 'No name');
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
        
        console.log('Processed offers with business details:', offersWithBusinesses);
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
      
      console.log('===== MESSAGE DEBUGGING =====');
      console.log('Selected conversation:', selectedConversation);
      
      try {
        // First, check if messages collection exists and what's in it
        const allMessagesResult = await getDocuments('messages', []);
        console.log('All messages in database:', allMessagesResult.data);
        
        // Then try to fetch messages for this specific conversation
        console.log('Fetching messages for conversation ID:', selectedConversation.id);
        
        const { data, error } = await getDocuments(
          'messages',
          [{ field: 'conversation_id', operator: '==', value: selectedConversation.id }]
        );
        
        if (error) {
          console.error('Error fetching messages:', error);
          toast.error('Error loading messages');
          throw error;
        }
        
        console.log('Messages found for this conversation:', data);
        
        // Sort messages client-side by timestamp
        const sortedMessages = data ? 
          [...data].sort((a, b) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          ) : [];
        
        console.log('Sorted messages:', sortedMessages);
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
      
      console.log("Sending message with params:", messageParams);
      
      // Force create the message directly in Firebase
      const result = await forceCreateMessage(messageParams);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to send message');
      }
      
      console.log("Message sent successfully:", result);

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
    console.log('Selected offer for conversation:', offer);
    
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
    
    console.log('Set conversation with businessId:', businessId);
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
      <div className="container py-8">
        <div className="flex items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold">Lender Dashboard</h1>
          <div className="flex items-center gap-2">
            {stats.logo_url && (
              <img 
                src={stats.logo_url} 
                alt={`${stats.company_name || 'Lender'} logo`} 
                className="h-8 w-8 rounded object-contain"
              />
            )}
            <span className="font-medium">{stats.company_name || 'Welcome'}</span>
          </div>
        </div>

        {/* Dashboard Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {/* Stats Cards */}
          <div className="bg-white rounded-lg shadow p-5 border border-gray-200">
            <div className="text-sm text-gray-500 mb-1">Available Credits</div>
            <div className="text-2xl font-bold">{billingData?.credits_balance || 0}</div>
            <div className="mt-2 text-xs text-gray-400">
              Used: {billingData?.credits_used || 0} credits
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-5 border border-gray-200">
            <div className="text-sm text-gray-500 mb-1">Applications</div>
            <div className="text-2xl font-bold">{stats.totalApplicationsAvailable}</div>
            <div className="mt-2 text-xs text-gray-400">
              {stats.prospects} new prospects
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-5 border border-gray-200">
            <div className="text-sm text-gray-500 mb-1">Offers Extended</div>
            <div className="text-2xl font-bold">{stats.offersExtended}</div>
            <div className="mt-2 text-xs">
              <span className="text-green-600 font-medium">{stats.offersAccepted} accepted</span>
              <span className="text-gray-400 ml-1">({stats.offersExtended - stats.offersAccepted} pending)</span>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-5 border border-gray-200">
            <div className="text-sm text-gray-500 mb-1">Conversion Rate</div>
            <div className="text-2xl font-bold">{stats.conversionRate}%</div>
            <div className="mt-2 text-xs text-gray-400">
              Total funded: £{stats.totalLoanAmount.toLocaleString()}
            </div>
          </div>
        </div>
        
        {/* Tabs Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <div className="flex -mb-px">
            <button
              onClick={() => setActiveTab('overview')}
              className={`mr-8 py-4 px-1 ${
                activeTab === 'overview'
                  ? 'border-b-2 border-[#ff8000] text-[#ff8000]'
                  : 'text-gray-500'
              } font-medium`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('applications')}
              className={`mr-8 py-4 px-1 ${
                activeTab === 'applications'
                  ? 'border-b-2 border-[#ff8000] text-[#ff8000]'
                  : 'text-gray-500'
              } font-medium`}
            >
              Applications
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={`mr-8 py-4 px-1 ${
                activeTab === 'messages'
                  ? 'border-b-2 border-[#ff8000] text-[#ff8000]'
                  : 'text-gray-500'
              } font-medium`}
            >
              Messages
            </button>
          </div>
        </div>
        
        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Accepted Offers */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow border border-gray-200 mb-6">
                <div className="px-6 py-5 border-b border-gray-200">
                  <h2 className="font-semibold">Accepted Offers</h2>
                  <p className="text-sm text-slate-500">Applications with accepted funding offers</p>
                </div>
                <div className="p-6">
                  {acceptedOffersLoading ? (
                    <div className="text-center py-4 text-gray-500">Loading accepted offers...</div>
                  ) : acceptedOffers && acceptedOffers.length > 0 ? (
                    <div className="space-y-4">
                      {acceptedOffers.map(offer => (
                        <div 
                          key={offer.id}
                          className="p-4 border border-green-100 rounded-lg bg-green-50/50 hover:bg-green-50 cursor-pointer transition-colors"
                          onClick={() => navigate(`/business/${offer.application_id}`)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium text-slate-900">
                                {getBusinessDisplayName(offer.application, offer.business)}
                              </div>
                              <div className="text-sm text-slate-600 mt-1">
                                Offer Amount: {new Intl.NumberFormat('en-GB', {
                                  style: 'currency',
                                  currency: 'GBP'
                                }).format(offer.offered_amount || 0)}
                              </div>
                              <div className="text-xs text-slate-500 mt-1">
                                Accepted on {new Date(offer.accepted_at).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                                Accepted
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      No accepted offers yet
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Applications */}
              <div className="bg-white rounded-lg shadow border border-gray-200">
                <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="font-semibold">Recent Applications</h2>
                  <button 
                    className="text-sm text-[#ff8000]"
                    onClick={() => navigate('/matched-applications')}
                  >
                    View All
                  </button>
                </div>
                <div className="p-6">
                  {applicationsLoading ? (
                    <div className="text-center py-10 text-gray-500">Loading applications...</div>
                  ) : lenderApplications && lenderApplications.length > 0 ? (
                    <div className="space-y-4">
                      {lenderApplications.slice(0, 5).map(app => (
                        <div 
                          key={app.id} 
                          className="p-4 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer"
                          onClick={() => navigate(`/lender/applications/${app.id}`)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">{app.company_name || 'Business'}</div>
                              <div className="text-sm text-gray-500">
                                {new Intl.NumberFormat('en-GB', {
                                  style: 'currency',
                                  currency: 'GBP'
                                }).format(app.loan_amount || 0)} - {app.loan_purpose || 'Funding'}
                              </div>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              app.isMatched 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {app.isMatched ? 'Matched' : 'New'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-gray-500">
                      No applications available at the moment.
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Monthly Performance */}
            <div>
              <div className="bg-white rounded-lg shadow border border-gray-200 h-full">
                <div className="px-6 py-5 border-b border-gray-200">
                  <h2 className="font-semibold">Monthly Performance</h2>
                </div>
                <div className="p-6">
                  <div className="mb-6">
                    <div className="text-sm text-gray-500 mb-1">Offers Extended</div>
                    <div className="text-xl font-bold">{stats.monthlyConversion.total}</div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                      <div 
                        className="bg-[#ff8000] h-2.5 rounded-full" 
                        style={{ width: `${stats.monthlyConversion.total ? (stats.monthlyConversion.accepted / stats.monthlyConversion.total) * 100 : 0}%` }}
                      ></div>
                    </div>
                    <div className="mt-1 text-xs text-gray-400">
                      {stats.monthlyConversion.accepted} accepted ({stats.monthlyConversion.total ? 
                        Math.round((stats.monthlyConversion.accepted / stats.monthlyConversion.total) * 100) : 0}% conversion)
                    </div>
                  </div>
                  
                  <button 
                    className="w-full py-2 bg-[#ff8000] text-white rounded-md hover:bg-[#ff8000]/90"
                    onClick={() => navigate('/lender/billing')}
                  >
                    Purchase More Credits
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'applications' && (
          <div className="bg-white rounded-lg shadow border border-gray-200">
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="font-semibold">All Applications</h2>
            </div>
            <div className="p-6">
              {applicationsLoading ? (
                <div className="text-center py-10 text-gray-500">Loading applications...</div>
              ) : lenderApplications && lenderApplications.length > 0 ? (
                <div className="space-y-4">
                  {lenderApplications.map(app => (
                    <div 
                      key={app.id} 
                      className="p-4 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/lender/applications/${app.id}`)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{app.company_name || 'Business'}</div>
                          <div className="text-sm text-gray-500">
                            {new Intl.NumberFormat('en-GB', {
                              style: 'currency',
                              currency: 'GBP'
                            }).format(app.loan_amount || 0)} - {app.loan_purpose || 'Funding'}
                          </div>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          app.isMatched 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {app.isMatched ? 'Matched' : 'New'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-500">
                  No applications available at the moment.
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'messages' && (
          <div className="bg-white rounded-lg shadow border border-gray-200">
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="font-semibold">Conversations</h2>
            </div>
            <div className="p-6">
              {acceptedOffersLoading ? (
                <div className="text-center py-10 text-gray-500">Loading conversations...</div>
              ) : acceptedOffers && acceptedOffers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-1 border-r border-gray-200 pr-4">
                    <h3 className="font-medium text-gray-500 mb-4">Businesses</h3>
                    {acceptedOffers.map(offer => (
                      <div 
                        key={offer.id}
                        onClick={() => selectConversation(offer)}
                        className={`p-3 rounded-lg mb-2 cursor-pointer ${
                          selectedConversation?.id === offer.id
                            ? 'bg-[#ff8000]/10 border border-[#ff8000]/30'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="font-medium">
                          {offer.application?.company_name || 'Business'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Intl.NumberFormat('en-GB', {
                            style: 'currency',
                            currency: 'GBP'
                          }).format(offer.offered_amount || 0)}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="md:col-span-2">
                    {selectedConversation ? (
                      <div className="h-[500px] flex flex-col">
                        <div className="bg-gray-50 p-3 border-b border-gray-200">
                          <div className="font-medium">{selectedConversation.businessName}</div>
                          <div className="text-sm text-gray-500">
                            {new Intl.NumberFormat('en-GB', {
                              style: 'currency',
                              currency: 'GBP'
                            }).format(selectedConversation.amount || 0)}
                          </div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                          {messagesLoading ? (
                            <div className="text-center text-gray-500">Loading messages...</div>
                          ) : messages && messages.length > 0 ? (
                            messages.map(msg => (
                              <div 
                                key={msg.id}
                                className={`max-w-[80%] p-3 rounded-lg ${
                                  msg.sender_id === user.uid
                                    ? 'bg-[#ff8000]/10 ml-auto'
                                    : 'bg-gray-100 mr-auto'
                                }`}
                              >
                                <div className="text-sm">{msg.message}</div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {new Date(msg.timestamp).toLocaleString()}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center text-gray-500">
                              No messages yet. Start the conversation!
                            </div>
                          )}
                        </div>
                        
                        <form onSubmit={sendMessage} className="p-3 border-t border-gray-200 flex gap-2">
                          <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type your message..."
                            className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#ff8000]"
                          />
                          <button
                            type="submit"
                            className="bg-[#ff8000] text-white px-4 py-2 rounded-md hover:bg-[#ff8000]/90"
                            disabled={!newMessage.trim()}
                          >
                            Send
                          </button>
                        </form>
                      </div>
                    ) : (
                      <div className="text-center py-20 text-gray-500">
                        Select a conversation to start messaging
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-gray-500">
                  No active conversations yet. Accept offers to start messaging businesses.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default LenderDashboard;
