import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getDocument, getDocuments, getLenderApplications, createDocument } from '@/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import PageLayout from '@/components/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import FeedbackReviews from '@/components/FeedbackReviews';
import {
  BarChart,
  TrendingUp,
  Users,
  FileText,
  Clock,
  PoundSterling,
  Filter,
  Search,
  ChevronRight,
  BarChart4,
  LineChart,
  MessageSquare,
  Send,
  PlusCircle,
  BadgeCheck,
  PoundSterlingIcon,
  Building2
} from 'lucide-react';

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
        { field: 'status', operator: '==', value: 'accepted' }
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
            const appResponse = await getDocument('applications', offer.application_id);
            const businessId = appResponse.data?.business_id;
            console.log(`Offer ${offer.id} - Application ${offer.application_id} - Business ID: ${businessId}`);
            
            if (businessId) {
              const businessResponse = await getDocument('business_profiles', businessId);
              return {
                ...offer,
                application: appResponse.data,
                business: businessResponse.data
              };
            }
            
            return {
              ...offer,
              application: appResponse.data
            };
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
          if (error.message?.includes('requires an index')) {
            console.warn(
              'Firebase requires an index for this query. Please create the index by clicking the link in the error message above, ' +
              'or modify your queries to avoid complex sorting/filtering combinations.'
            );
            
            toast.error(
              'Notification display requires a Firebase index. Please check console for details.',
              { duration: 8000 }
            );
          }
          
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
    offersAccepted: lenderOffers?.filter(offer => offer.status === 'accepted').length || 0,
    prospects: availableApplications?.filter(app => !app.isViewed).length || 0,
    conversionRate: lenderOffers?.length 
      ? Math.round((lenderOffers.filter(offer => offer.status === 'accepted').length / lenderOffers.length) * 100) 
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
    <PageLayout>
      <div className="container py-8">
        <div className="flex items-center gap-4 mb-6">
          {stats.logo_url ? (
            <img 
              src={stats.logo_url} 
              alt="Company Logo" 
              className="h-12 w-12 rounded-lg object-contain bg-white border"
            />
          ) : (
            <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center border">
              <Building2 className="h-6 w-6 text-gray-400" />
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold">{stats.company_name || 'Dashboard'}</h1>
            <p className="text-muted-foreground">Welcome back</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Lender Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {lenderProfile?.lender_name || 'Lender'}
            </p>
          </div>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <div className="flex items-center">
              <div className="text-sm text-right mr-4">
                <div className="font-medium">Available Credits</div>
                <div className="text-muted-foreground">£100 per credit</div>
              </div>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => window.location.href = '/lender/billing'}
              >
                <BadgeCheck className="h-4 w-4 text-fundhub-blue" />
                {billingData?.total_credits ? (
                  `${billingData.total_credits - (billingData.credits_used || 0)} credits`
                ) : (
                  'Buy Credits'
                )}
              </Button>
            </div>
            <Button
              className="bg-fundhub-blue hover:bg-fundhub-blue/90 gap-2"
              onClick={() => window.location.href = '/matched-applications'}
            >
              View Matched Applications
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-5 w-full md:w-auto">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart className="h-4 w-4" />
              <span className="hidden md:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="applications" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden md:inline">Applications</span>
            </TabsTrigger>
            <TabsTrigger value="offers" className="flex items-center gap-2">
              <PoundSterling className="h-4 w-4" />
              <span className="hidden md:inline">Offers</span>
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden md:inline">Messages</span>
            </TabsTrigger>
            <TabsTrigger value="feedback" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden md:inline">Feedback</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab Content */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">New Prospects</CardTitle>
                  <CardDescription>Unviewed applications</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <Users className="h-6 w-6 text-fundhub-blue mr-2" />
                    <div className="text-3xl font-bold">{stats.prospects}</div>
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">
                    Needs your review
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Applications</CardTitle>
                  <CardDescription>Available opportunities</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <FileText className="h-6 w-6 text-fundhub-blue mr-2" />
                    <div className="text-3xl font-bold">{stats.totalApplicationsAvailable + stats.totalApplicationsMatched}</div>
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">
                    {stats.totalApplicationsMatched} matched · {stats.totalApplicationsAvailable} available
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Offers Extended</CardTitle>
                  <CardDescription>Conversion metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <TrendingUp className="h-6 w-6 text-fundhub-blue mr-2" />
                    <div className="text-3xl font-bold">{stats.offersExtended}</div>
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    <Progress value={stats.conversionRate} className="h-2" />
                    <span className="text-xs font-medium">{stats.conversionRate}%</span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {stats.offersAccepted} offers accepted
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Total Funded</CardTitle>
                  <CardDescription>Accepted offers</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <PoundSterling className="h-6 w-6 text-fundhub-blue mr-2" />
                    <div className="text-3xl font-bold">
                      {stats.totalLoanAmount.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">
                    Across {stats.offersAccepted} accepted offers
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                  <CardTitle>Monthly Report</CardTitle>
                  <CardDescription>
                    Performance summary for {new Date().toLocaleString('default', { month: 'long' })}
                  </CardDescription>
                  </div>
                  <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const reportData = {
                    month: new Date().toLocaleString('default', { month: 'long' }),
                    year: new Date().getFullYear(),
                    prospects: stats.prospects,
                    applications: stats.totalApplicationsAvailable + stats.totalApplicationsMatched,
                    offersExtended: stats.offersExtended,
                    offersAccepted: stats.offersAccepted,
                    conversionRate: stats.conversionRate,
                    monthlyConversion: stats.monthlyConversion,
                    totalFunded: stats.totalLoanAmount
                    };
                    
                    const blob = new Blob(
                    [JSON.stringify(reportData, null, 2)], 
                    { type: 'application/json' }
                    );
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `lender-report-${new Date().toISOString().slice(0,7)}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  >
                  <BarChart4 className="h-4 w-4 mr-2" />
                  Export Report
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                    <div className="text-sm font-medium">Monthly Prospects</div>
                    <div className="text-2xl font-bold">{stats.prospects}</div>
                    </div>
                    <div>
                    <div className="text-sm font-medium">Monthly Conversion</div>
                    <div className="text-2xl font-bold">
                      {stats.monthlyConversion.total ? 
                      Math.round((stats.monthlyConversion.accepted / stats.monthlyConversion.total) * 100) : 0}%
                    </div>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <div className="text-sm font-medium mb-2">Conversion Trend</div>
                    <div className="h-[200px] w-full">
                    {/* Example data for a chart */}
                    <ul className="space-y-2">
                      <li>January: 10%</li>
                      <li>February: 15%</li>
                      <li>March: 20%</li>
                      <li>April: 25%</li>
                      <li>May: 30%</li>
                    </ul>
                    </div>
                  </div>
                  </div>
                </CardContent>
                </Card>
              <Card className="col-span-1">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Recent Applications</CardTitle>
                    <CardDescription>
                      Latest business financing needs matched to your criteria
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = '/matched-applications'}
                  >
                    View All
                  </Button>
                </CardHeader>
                <CardContent>
                  {applicationsLoading ? (
                    <div className="animate-pulse space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-14 bg-gray-100 rounded"></div>
                      ))}
                    </div>
                  ) : lenderApplications && lenderApplications.length > 0 ? (
                    <div className="space-y-2">
                      {lenderApplications.slice(0, 5).map((app) => (
                        <div 
                          key={app.id} 
                          className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => navigate(`/business/${app.id}`)}
                        >
                          <div>
                            <div className="font-medium flex items-center">
                              {app.business_name || 'Business'} - £{app.loan_amount?.toLocaleString()}
                              {app.isMatched && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                  Matched
                                </span>
                              )}
                              {!app.isMatched && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  New
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {app.purpose || 'Business financing'} · {app.loan_term_months} months
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <FileText className="h-10 w-10 mx-auto mb-3 opacity-20" />
                      <p>No applications available yet.</p>
                      <p className="text-sm">Applications matching your criteria will appear here.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                  <CardDescription>
                    Your lending activity and efficiency
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-sm font-medium">Response Rate</div>
                      <div className="text-sm font-medium">
                        {stats.totalApplicationsMatched ? 
                          Math.round((stats.offersExtended / stats.totalApplicationsMatched) * 100) : 0}%
                      </div>
                    </div>
                    <Progress 
                      value={stats.totalApplicationsMatched ? 
                        (stats.offersExtended / stats.totalApplicationsMatched) * 100 : 0} 
                      className="h-2" 
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-sm font-medium">Conversion Rate</div>
                      <div className="text-sm font-medium">{stats.conversionRate}%</div>
                    </div>
                    <Progress value={stats.conversionRate} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-sm font-medium">Credit Utilization</div>
                      <div className="text-sm font-medium">68%</div>
                    </div>
                    <Progress value={68} className="h-2" />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-end">
                    <Button variant="outline" className="text-xs h-8 gap-1">
                      <BarChart4 className="h-3 w-3" />
                      View Full Analytics
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Applications Tab */}
          <TabsContent value="applications">
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>All Applications</CardTitle>
                      <CardDescription>
                        Business loan applications matched to your lending criteria
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="gap-2">
                        <Filter className="h-4 w-4" />
                        Filter
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Search className="h-4 w-4" />
                        Search
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {applicationsLoading ? (
                    <div className="animate-pulse space-y-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-16 bg-gray-100 rounded"></div>
                      ))}
                    </div>
                  ) : lenderApplications && lenderApplications.length > 0 ? (
                    <>
                      {matchedApplications.length > 0 && (
                        <div className="mb-6">
                          <h3 className="text-sm font-semibold text-muted-foreground mb-2">Matched Applications</h3>
                          <div className="space-y-2">
                            {matchedApplications.map((app) => (
                              <div 
                                key={app.id} 
                                className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer"
                                onClick={() => window.location.href = `/applications/${app.id}`}
                              >
                                <div>
                                  <div className="font-medium">
                                    {app.business_name || 'Business'} - £{app.loan_amount?.toLocaleString()}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {app.purpose || 'Business financing'} · {app.loan_term_months} months · {app.status}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button size="sm">View Details</Button>
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {availableApplications.length > 0 && (
                        <div>
                          <h3 className="text-sm font-semibold text-muted-foreground mb-2">Available Applications</h3>
                          <div className="space-y-2">
                            {availableApplications.map((app) => (
                              <div 
                                key={app.id} 
                                className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer"
                                onClick={() => window.location.href = `/applications/${app.id}`}
                              >
                                <div>
                                  <div className="font-medium flex items-center">
                                    {app.business_name || 'Business'} - £{app.loan_amount?.toLocaleString()}
                                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                      New
                                    </span>
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {app.purpose || 'Business financing'} · {app.loan_term_months}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button size="sm" className="bg-fundhub-blue hover:bg-fundhub-blue/90">
                                    <PlusCircle className="h-4 w-4 mr-1" /> Express Interest
                                  </Button>
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-10">
                      <FileText className="h-16 w-16 mx-auto mb-4 opacity-20" />
                      <h3 className="font-medium text-lg mb-2">No Applications Available</h3>
                      <p className="text-muted-foreground max-w-md mx-auto mb-6">
                        There are currently no business loan applications that match your lending criteria.
                        We'll notify you when new applications are available.
                      </p>
                      <Button 
                        variant="outline"
                        onClick={() => window.location.href = '/lender/profile#criteria'}
                      >
                        Update Lending Criteria
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="offers">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Your Offers</CardTitle>
                    <CardDescription>
                      Financing offers you've extended to businesses
                    </CardDescription>
                  </div>
                  <Button
                    className="bg-fundhub-blue hover:bg-fundhub-blue/90"
                    onClick={() => navigate('/matched-applications')}
                  >
                    Find Applications
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {offersLoading ? (
                  <div className="grid gap-4 grid-cols-1">
                    {[1, 2].map((i) => (
                      <div key={i} className="h-24 animate-pulse bg-gray-100 rounded-lg"></div>
                    ))}
                  </div>
                ) : lenderOffers && lenderOffers.length > 0 ? (
                  <div className="space-y-4">
                    {lenderOffers.map((offer) => (
                      <div key={offer.id} className="flex justify-between items-center p-4 border rounded-lg">
                        <div>
                          <div className="font-medium flex items-center">
                            {offer.business?.business_name || 'Business'} - £{offer.offered_amount?.toLocaleString()}
                            <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium 
                              ${offer.status === 'accepted' ? 'bg-green-100 text-green-800' : 
                                offer.status === 'pending' ? 'bg-blue-100 text-blue-800' :
                                offer.status === 'declined' ? 'bg-red-100 text-red-800' : 
                                'bg-gray-100 text-gray-800'}`}>
                              {offer.status === 'accepted' ? 'Accepted' :
                               offer.status === 'pending' ? 'Pending' :
                               offer.status === 'declined' ? 'Declined' : 
                               offer.status?.charAt(0).toUpperCase() + offer.status?.slice(1)}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {offer.interest_rate}% · {offer.term_months || offer.offered_term_months} months
                            {offer.application ? ` · ${offer.application.purpose || 'Business financing'}` : ''}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate(`/offers/${offer.id}`)}
                          >
                            View Details
                          </Button>
                          {offer.status === 'accepted' && (
                            <Button 
                              className="bg-fundhub-blue hover:bg-fundhub-blue/90"
                              size="sm"
                              onClick={() => {
                                const conversation = {
                                  id: offer.id,
                                  businessId: offer.business_id || offer.application?.user_id,
                                  businessName: offer.business?.business_name || 'Business',
                                  applicationId: offer.application_id,
                                }
                                selectConversation(conversation);
                                setActiveTab('messages');
                              }}
                            >
                              Message
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <FileText className="h-16 w-16 mx-auto mb-4 opacity-20" />
                    <h3 className="font-medium text-lg mb-2">No Offers Yet</h3>
                    <p className="text-muted-foreground max-w-md mx-auto mb-6">
                      You haven't created any offers yet. Express interest in applications to start creating offers.
                    </p>
                    <Button 
                      className="bg-fundhub-blue hover:bg-fundhub-blue/90"
                      onClick={() => navigate('/matched-applications')}
                    >
                      Browse Applications
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Feedback & Reviews Tab */}
          <TabsContent value="feedback">
            <Card>
              <CardHeader>
                <CardTitle>Business Feedback & Reviews</CardTitle>
                <CardDescription>
                  Reviews and feedback from businesses you've worked with
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Fetch and display lender reviews */}
                <FeedbackReviews lenderId={user?.uid} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Conversations</CardTitle>
                  <CardDescription>
                    Select a conversation to view messages
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {acceptedOffersLoading ? (
                    <div className="animate-pulse space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-14 bg-gray-100 rounded"></div>
                      ))}
                    </div>
                  ) : acceptedOffers && acceptedOffers.length > 0 ? (
                    <div className="space-y-2">
                      {acceptedOffers.map((offer) => (
                        <div 
                          key={offer.id} 
                          className={`flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer ${selectedConversation?.id === offer.id ? 'bg-gray-50' : ''}`}
                          onClick={() => selectConversation(offer)}
                        >
                          <div>
                            <div className="font-medium">
                              {offer.business?.business_name || 'Business'} - £{offer.offered_amount?.toLocaleString()}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {offer.application?.purpose || 'Business financing'}
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      ))}
                      
                      {/* Add test message button */}
                      {selectedConversation && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={async () => {
                            try {
                              const { createTestMessageBetweenUsers } = await import('@/firebase');
                              const result = await createTestMessageBetweenUsers(
                                user.uid, 
                                selectedConversation.businessId, 
                                selectedConversation.applicationId,
                                selectedConversation.id
                              );
                              
                              if (result.success) {
                                toast.success('Test message created! Refreshing...');
                                refetchMessages();
                              } else {
                                toast.error('Failed to create test message');
                                console.error(result.error);
                              }
                            } catch (err) {
                              console.error('Error creating test message:', err);
                              toast.error('Error creating test message');
                            }
                          }}
                        >
                          Send Test Message
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-20" />
                      <p>No conversations yet.</p>
                      <p className="text-sm">Accepted offers will appear here.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card className="col-span-2">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Messages</CardTitle>
                    <CardDescription>
                      {selectedConversation ? `Conversation with ${selectedConversation.businessName}` : 'Select a conversation to view messages'}
                    </CardDescription>
                  </div>
                  {selectedConversation && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => refetchMessages()}
                    >
                      Refresh Messages
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-6 min-h-[300px]">
                  {messagesLoading ? (
                    <div className="animate-pulse space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-14 bg-gray-100 rounded"></div>
                      ))}
                    </div>
                  ) : messages && messages.length > 0 ? (
                    <div className="space-y-4">
                      {messages.map((msg) => (
                        <div 
                          key={msg.id} 
                          className={`flex items-start p-4 rounded-lg ${msg.sender_id === user.uid ? 'bg-blue-50 ml-auto max-w-[80%]' : 'bg-gray-50 max-w-[80%]'}`}
                        >
                          <Avatar className="mr-3 h-8 w-8">
                            <AvatarFallback>{msg.sender_type === 'lender' ? 'L' : 'B'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {msg.sender_id === user.uid ? 'You' : selectedConversation.businessName}
                            </div>
                            <div className="mt-1">
                              {msg.message}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {new Date(msg.timestamp).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-20" />
                      <p>No messages yet.</p>
                      <p className="text-sm">Start a conversation by sending a message.</p>
                      <div className="text-xs text-muted-foreground mt-4">
                        Conversation ID: {selectedConversation?.id || "None selected"}
                      </div>
                      <div className="mt-4">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={async () => {
                            try {
                              const { createTestMessageBetweenUsers } = await import('@/firebase');
                              const result = await createTestMessageBetweenUsers(
                                user.uid, 
                                selectedConversation.businessId, 
                                selectedConversation.applicationId,
                                selectedConversation.id
                              );
                              
                              if (result.success) {
                                toast.success('Test message created! Refreshing...');
                                refetchMessages();
                              } else {
                                toast.error('Failed to create test message');
                                console.error(result.error);
                              }
                            } catch (err) {
                              console.error('Error creating test message:', err);
                              toast.error('Error creating test message');
                            }
                          }}
                        >
                          
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
                {selectedConversation && (
                  <form onSubmit={sendMessage} className="flex items-center gap-2 p-3 border-t">
                    <Textarea 
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1"
                    />
                    <Button type="submit" className="bg-fundhub-blue hover:bg-fundhub-blue/90">
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                )}
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default LenderDashboard;
