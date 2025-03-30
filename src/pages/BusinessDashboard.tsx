import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getDocument, getDocuments, createDocument } from '@/firebase';
import { toast } from 'sonner';
import PageLayout from '@/components/PageLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, ArrowRight, CheckCircle, CreditCard, FileText, MessageSquare, Plus, Send, Settings, Star, Wallet, Building2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import StatusBadge from '@/components/StatusBadge';
import { Application } from './Applications';
import ApplicationCard from '@/components/ApplicationCard';

// Sample review data for demonstration
const sampleReviews = [
  {
    id: 'review1',
    lender_name: 'Capital Growth Finance',
    rating: 5,
    feedback: 'Excellent service and quick approval process. The terms were favorable and transparent. Would definitely work with them again for future financing needs.',
    business_name: 'Tech Innovations Ltd',
    created_at: '2025-02-15T10:30:00Z',
    loan_amount: 150000
  },
  {
    id: 'review2',
    lender_name: 'Business Boost Lenders',
    rating: 4,
    feedback: 'Overall good experience with minor delays in the final disbursement. Their customer service team was responsive and helpful throughout the process.',
    business_name: 'Green Solutions Inc',
    created_at: '2025-01-28T14:15:00Z',
    loan_amount: 75000
  },
  {
    id: 'review3',
    lender_name: 'NexGen Financial',
    rating: 3,
    feedback: 'Average experience. Documentation requirements were extensive and the process took longer than expected. Fair rates though.',
    business_name: 'Urban Retail Group',
    created_at: '2025-03-05T09:45:00Z',
    loan_amount: 200000
  }
];

const BusinessDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [businessProfile, setBusinessProfile] = useState<any>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [hasAccountingConnection, setHasAccountingConnection] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeTab, setActiveTab] = useState('applications');

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      
      setIsLoading(true);
      
      try {
        // Fetch business profile using Firebase
        const { data: profileData, error: profileError } = await getDocument('business_profiles', user.uid);
          
        if (profileError) {
          console.error('Error fetching business profile:', profileError);
          toast.error('Failed to load business profile');
        }
        
        if (profileData) {
          setBusinessProfile(profileData);
        }
        
        // Fetch applications using Firebase
        const { data: applicationsData, error: applicationsError } = await getDocuments(
          'applications',
          [{ field: 'user_id', operator: '==', value: user.uid }]
        );
          
        if (applicationsError) {
          console.error('Error fetching applications:', applicationsError);
          toast.error('Failed to load applications');
        }
        
        console.log('Raw applications data:', applicationsData);
        
        // Sort and process applications
        if (applicationsData) {
          const sortedApplications = applicationsData
            .map(app => ({
              ...app,
              application_date: app.application_date || app.created_at || new Date().toISOString()
            }))
            .sort((a, b) => new Date(b.application_date).getTime() - new Date(a.application_date).getTime());

          console.log('Processed applications:', sortedApplications);
          setApplications(sortedApplications);
        } else {
          setApplications([]);
        }

        // Fetch offers related to this business using Firebase
        if (applicationsData && applicationsData.length > 0) {
          const appIds = applicationsData.map(app => app.id);
          
          // Since Firebase doesn't support direct "in" queries like Supabase,
          // we need to make separate queries for each application ID
          const allOffers = [];
          
          for (const appId of appIds) {
            const { data: appOffers, error: offerError } = await getDocuments(
              'offers',
              [{ field: 'application_id', operator: '==', value: appId }],
              [{ field: 'created_at', direction: 'desc' }]
            );
            
            if (appOffers && !offerError) {
              allOffers.push(...appOffers);
            }
            
            if (offerError) {
              console.error('Error fetching offers for application:', appId, offerError);
            }
          }
          
          // Sort by created_at and limit to 5
          allOffers.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          
          setOffers(allOffers.slice(0, 5));
        }
        
        // Check for accounting connections
        const { data: accountingData, error: accountingError } = await getDocuments(
          'accounting_integrations',
          [{ field: 'business_id', operator: '==', value: user.uid }]
        );
          
        if (accountingError) {
          console.error('Error fetching accounting integration:', accountingError);
        }
        
        // Check if any accounting integration is connected
        const connectedIntegration = accountingData?.find(
          integration => integration.auth_status === 'connected'
        );
        setHasAccountingConnection(!!connectedIntegration);
        
        // Fetch notifications
        const { data: notificationsData, error: notificationsError } = await getDocuments(
          'notifications',
          [{ field: 'recipient_id', operator: '==', value: user.uid }]
          // Removed sorting to avoid index error
          // [{ field: 'sent_at', direction: 'desc' }]
        );
          
        if (notificationsError) {
          console.error('Error fetching notifications:', notificationsError);
          
          // Check if it's an index error and provide instructions
          if (notificationsError.message?.includes('requires an index')) {
            console.warn(
              'Firebase requires an index for this query. Please create the index by clicking the link in the error message above, ' +
              'or modify your queries to avoid complex sorting/filtering.'
            );
            
            toast.error(
              'Notification display requires a Firebase index. Please check console for details.',
              { duration: 8000 }
            );
          }
        }
        
        if (notificationsData) {
          // Sort client-side instead of in the query
          const sortedNotifications = [...notificationsData].sort((a, b) => {
            return new Date(b.sent_at || 0).getTime() - new Date(a.sent_at || 0).getTime();
          });
          setNotifications(sortedNotifications.slice(0, 10));
        }

        // Fetch messages
        const { data: messagesData, error: messagesError } = await getDocuments(
          'messages',
          [{ field: 'recipient_id', operator: '==', value: user.uid }],
          [{ field: 'sent_at', direction: 'desc' }]
        );

        if (messagesError) {
          console.error('Error fetching messages:', messagesError);
        }

        if (messagesData) {
          setMessages(messagesData);
        }
        
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        toast.error('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [user]);

  const getProfileCompletionPercentage = () => {
    if (!businessProfile) return 0;
    
    const requiredFields = [
      'business_name', 
      'industry_sector', 
      'company_size'
    ];
    
    const optionalFields = [
      'company_number', 
      'description', 
      'website',
      'city', 
      'postal_code', 
      'incorporation_date'
    ];
    
    let completedRequired = 0;
    requiredFields.forEach(field => {
      if (businessProfile[field]) completedRequired++;
    });
    
    let completedOptional = 0;
    optionalFields.forEach(field => {
      if (businessProfile[field]) completedOptional++;
    });
    
    // Required fields account for 60% of completion, optional for 40%
    const requiredPercentage = (completedRequired / requiredFields.length) * 60;
    const optionalPercentage = (completedOptional / optionalFields.length) * 40;
    
    return Math.round(requiredPercentage + optionalPercentage);
  };

  const getRecentApplications = () => {
    if (isLoading) {
      return (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="h-48 animate-pulse bg-gray-100" />
          ))}
        </div>
      );
    }

    if (!applications || applications.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Applications Yet</h3>
          <p className="text-muted-foreground text-center mb-4">
            Start by creating your first funding application
          </p>
          <Button 
            className="bg-fundhub-blue hover:bg-fundhub-blue/90"
            onClick={() => navigate('/applications/new')}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Application
          </Button>
        </div>
      );
    }
    
    return (
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {applications.map((application) => (
          <ApplicationCard
            key={application.id}
            id={application.id}
            amount={application.loan_amount}
            purpose={application.purpose}
            status={application.status}
            dateApplied={new Date(application.application_date).toLocaleDateString()}
            term={`${application.loan_term_months} months`}
            offersCount={application.matched_lenders?.length || 0}
          />
        ))}
      </div>
    );
  };

  const getRecentOffers = () => {
    if (offers.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8">
          <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Offers Yet</h3>
          <p className="text-muted-foreground text-center">
            Offers from lenders will appear here once received
          </p>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {offers.map((offer) => {
          const matchingApp = applications.find(app => app.id === offer.application_id);
          const isAccepted = offer.status === 'accepted';
          const isPending = offer.status === 'pending';
          const isExpired = new Date(offer.expires_at) < new Date();
          const isDeclined = offer.status === 'declined';
          
          return (
            <div key={offer.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{offer.lender_name}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    isAccepted ? 'bg-green-100 text-green-800' :
                    isPending ? 'bg-blue-100 text-blue-800' :
                    isDeclined ? 'bg-red-100 text-red-800' :
                    isExpired ? 'bg-orange-100 text-orange-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {isAccepted ? 'Accepted' :
                     isPending ? 'Pending' :
                     isDeclined ? 'Declined' :
                     isExpired ? 'Expired' : 
                     offer.status}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  £{offer.offered_amount?.toLocaleString()} · 
                  {offer.interest_rate}% · 
                  {offer.offered_term_months || offer.term_months} months
                </div>
                {matchingApp && (
                  <div className="text-xs text-muted-foreground">
                    For application {matchingApp.application_number || matchingApp.id.substring(0, 8)}
                  </div>
                )}
              </div>
              <div className="space-x-2">
                {isAccepted && (
                  <Button
                    size="sm"
                    className="bg-fundhub-blue hover:bg-fundhub-blue/90"
                    onClick={() => setActiveTab('messages')}
                  >
                    <MessageSquare className="mr-1 h-4 w-4" />
                    Message
                  </Button>
                )}
                <Button
                  variant={isPending ? "default" : "outline"} 
                  size="sm"
                  className={isPending ? "bg-fundhub-blue hover:bg-fundhub-blue/90" : ""}
                  onClick={() => navigate(`/offers/${offer.id}`)}
                >
                  View Details
                  {isPending && <ArrowRight className="ml-1 h-4 w-4" />}
                </Button>
              </div>
            </div>
          );
        })}
        
        <div className="pt-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate('/offers')}
          >
            View All Offers
          </Button>
        </div>
      </div>
    );
  };

  const getRecentReviews = () => {
    return (
      <div className="space-y-4">
        {sampleReviews.map((review) => (
          <div key={review.id} className="p-4 border rounded-lg">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-medium">{review.lender_name}</h4>
              <div className="flex">
                {Array(5).fill(0).map((_, index) => (
                  <Star
                    key={index}
                    className={`h-4 w-4 ${
                      index < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
            <p className="text-sm mb-3">{review.feedback}</p>
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>Loan: £{review.loan_amount.toLocaleString()}</span>
              <span>{new Date(review.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
        
        <div className="pt-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate('/reviews')}
          >
            View All Reviews
          </Button>
        </div>
      </div>
    );
  };

  const fetchConversationsAndMessages = async () => {
    if (!user) return;
    
    try {
      // First, get all applications with matched lenders
      const { data: applications } = await getDocuments('applications', [
        { field: 'user_id', operator: '==', value: user.uid },
      ]);

      // Get all matched applications (with non-empty matched_lenders array)
      const applicationsWithMatches = applications?.filter(app => 
        Array.isArray(app.matched_lenders) && app.matched_lenders.length > 0
      ) || [];

      if (applicationsWithMatches.length === 0) {
        return {
          conversations: [],
          selectedConversation: null,
          conversationMessages: []
        };
      }

      // For each application, get the matched lenders' details
      const conversations = [];
      
      for (const app of applicationsWithMatches) {
        const matchedLenders = app.matched_lenders || [];
        
        for (const lenderId of matchedLenders) {
          // Get lender details (if they've expressed interest, they'll be in the interested_lenders array)
          const lender = app.interested_lenders?.find(l => l.lender_id === lenderId);
          
          if (lender) {
            conversations.push({
              id: lender.offer_id || lenderId, // Use offer ID if available as conversation ID
              lenderId: lenderId,
              lenderName: lender.lender_name || 'Lender',
              lenderCompany: lender.lender_company || '',
              applicationId: app.id,
              applicationNumber: app.application_number,
              loanAmount: app.loan_amount,
              lastMessageTime: new Date().toISOString(), // This will be updated with actual data
            });
          }
        }
      }
      
      // If no conversations, return early
      if (conversations.length === 0) {
        return {
          conversations: [],
          selectedConversation: null,
          conversationMessages: []
        };
      }

      // Sort conversations by most recent message (we'll update this later)
      conversations.sort((a, b) => 
        new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
      );

      // Return the first conversation and fetch its messages
      const selectedConversation = conversations[0];
      
      // Get messages for the selected conversation
      const { data: messagesData } = await getDocuments(
        'messages',
        [{ field: 'conversation_id', operator: '==', value: selectedConversation.id }],
        [{ field: 'timestamp', direction: 'asc' }]
      );
      
      return {
        conversations,
        selectedConversation,
        conversationMessages: messagesData || []
      };
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast.error('Failed to load conversations');
      return {
        conversations: [],
        selectedConversation: null,
        conversationMessages: []
      };
    }
  };

  const getConversationsUI = () => {
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [conversationMessages, setConversationMessages] = useState([]);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [newConversationMessage, setNewConversationMessage] = useState('');

    // Load conversations on initial render
    useEffect(() => {
      const loadConversations = async () => {
        const result = await fetchConversationsAndMessages();
        setConversations(result.conversations);
        setSelectedConversation(result.selectedConversation);
        setConversationMessages(result.conversationMessages);
      };
      
      loadConversations();
    }, []);

    // Function to select a conversation
    const selectConversation = async (conversation) => {
      console.log('Selected conversation:', conversation);
      setSelectedConversation(conversation);
      setIsLoadingMessages(true);
      
      try {
        // Make sure we're using exactly the same conversation ID format as the lender side
        // This should be the offer ID
        const conversationId = conversation.id;
        console.log('Fetching messages for conversation ID:', conversationId);
        
        // Get messages for this conversation - using just the conversation_id filter
        const { data: messagesData } = await getDocuments(
          'messages',
          [{ field: 'conversation_id', operator: '==', value: conversationId }]
        );
        
        console.log('Fetched messages:', messagesData);
        
        // Sort messages client-side by timestamp
        const sortedMessages = messagesData ? 
          [...messagesData].sort((a, b) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          ) : [];
        
        console.log('Sorted messages:', sortedMessages);
        setConversationMessages(sortedMessages);
      } catch (error) {
        console.error('Error fetching messages:', error);
        toast.error('Failed to load messages');
      } finally {
        setIsLoadingMessages(false);
      }
    };

    // Function to send a new message
    const sendMessage = async (e) => {
      e.preventDefault();
      
      if (!newConversationMessage.trim() || !selectedConversation) return;
      
      try {
        // Use the direct message creation method for more reliable messaging
        const { forceCreateMessage } = await import('@/firebase');
        
        // Create message data
        const messageParams = {
          conversationId: selectedConversation.id,
          applicationId: selectedConversation.applicationId,
          senderId: user.uid,
          senderType: 'business',
          recipientId: selectedConversation.lenderId,
          message: newConversationMessage.trim()
        };
        
        console.log("Business sending message with params:", messageParams);
        
        // Force create the message directly in Firebase
        const result = await forceCreateMessage(messageParams);
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to send message');
        }
        
        console.log("Message sent successfully:", result);
        
        // Create a notification for the lender
        await createDocument('notifications', {
          recipient_id: selectedConversation.lenderId,
          type: 'new_message',
          title: 'New message',
          message: `New message from ${businessProfile?.business_name || 'a business'}`,
          related_entity_id: selectedConversation.id,
          related_entity_type: 'conversation',
          read: false,
          sent_at: new Date().toISOString()
        });
        
        // Add the message to the UI immediately for better UX
        setConversationMessages([...conversationMessages, result.data]);
        
        // Clear the input
        setNewConversationMessage('');
        
        // Show success message
        toast.success('Message sent');
      } catch (error) {
        console.error('Error sending message:', error);
        toast.error('Failed to send message');
      }
    };

    if (isLoading) {
      return (
        <div className="space-y-4">
          <div className="h-12 bg-gray-100 rounded-lg animate-pulse"></div>
          <div className="h-64 bg-gray-100 rounded-lg animate-pulse"></div>
        </div>
      );
    }
    
    if (conversations.length === 0) {
      return (
        <div className="text-center py-8">
          <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Messages Yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            When your application is matched with lenders, you'll be able to communicate with them here.
          </p>
          <Button 
            className="mt-4 bg-fundhub-blue hover:bg-fundhub-blue/90"
            onClick={() => navigate('/applications/new')}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Application
          </Button>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1">
          <h3 className="font-medium mb-4">Lenders</h3>
          <div className="space-y-2">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer ${
                  selectedConversation?.id === conversation.id ? 'bg-gray-50' : ''
                }`}
                onClick={() => selectConversation(conversation)}
              >
                <div>
                  <div className="font-medium">{conversation.lenderName}</div>
                  <div className="text-sm text-muted-foreground">
                    £{conversation.loanAmount?.toLocaleString()}
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            ))}
          </div>
        </div>
        
        <div className="col-span-2">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle>Messages</CardTitle>
              <CardDescription>
                {selectedConversation 
                  ? `Conversation with ${selectedConversation.lenderName}` 
                  : 'Select a lender to view messages'}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow overflow-y-auto">
              {isLoadingMessages ? (
                <div className="animate-pulse space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-14 bg-gray-100 rounded"></div>
                  ))}
                </div>
              ) : conversationMessages.length > 0 ? (
                <div className="space-y-4">
                  {conversationMessages.map((msg) => (
                    <div 
                      key={msg.id} 
                      className={`flex items-start p-4 rounded-lg ${
                        msg.sender_id === user.uid ? 'bg-blue-50 ml-auto max-w-[80%]' : 'bg-gray-50 max-w-[80%]'
                      }`}
                    >
                      <Avatar className="mr-3 h-8 w-8">
                        <AvatarFallback>
                          {msg.sender_type === 'business' ? 'B' : 'L'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {msg.sender_id === user.uid ? 'You' : selectedConversation.lenderName}
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
                <div className="text-center py-6 text-muted-foreground">
                  <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p>No messages yet</p>
                  <p className="text-sm">Start a conversation by sending a message</p>
                  <div className="text-xs text-muted-foreground mt-4">
                    Conversation ID: {selectedConversation?.id || "None selected"}
                  </div>
                </div>
              )}
            </CardContent>
            {selectedConversation && (
              <div className="p-4 border-t mt-auto">
                <form onSubmit={sendMessage} className="flex gap-2">
                  <Textarea 
                    value={newConversationMessage}
                    onChange={(e) => setNewConversationMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1"
                  />
                  <Button type="submit" className="bg-fundhub-blue hover:bg-fundhub-blue/90">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            )}
          </Card>
        </div>
      </div>
    );
  };

  // Replace the existing getMessages function with our new implementation
  const getMessages = () => getConversationsUI();

  return (
    <PageLayout>
      <div className="container py-8">
        <div className="flex items-center gap-4 mb-6">
          {businessProfile?.logo_url ? (
            <img 
              src={businessProfile.logo_url} 
              alt="Company Logo" 
              className="h-12 w-12 rounded-lg object-contain bg-white border"
            />
          ) : (
            <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center border">
              <Building2 className="h-6 w-6 text-gray-400" />
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold">{businessProfile?.business_name || 'Dashboard'}</h1>
            <p className="text-muted-foreground">Welcome back</p>
          </div>
        </div>

        {!businessProfile && !isLoading ? (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Complete Your Profile</CardTitle>
              <CardDescription>
                Set up your business profile to get started with FundHub
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Before you can apply for funding, you need to complete your business profile with essential details about your company.
              </p>
            </CardContent>
            <CardFooter>
              <Button 
                className="bg-fundhub-blue hover:bg-fundhub-blue/90"
                onClick={() => navigate('/business/profile')}
              >
                Complete Profile
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
              {/* Profile Completion Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Profile Completion</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-muted-foreground text-sm">Completion</span>
                    <span className="font-medium">{getProfileCompletionPercentage()}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
                    <div 
                      className="h-full bg-fundhub-blue rounded-full" 
                      style={{ width: `${getProfileCompletionPercentage()}%` }}
                    ></div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => navigate('/business/profile')}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Update Profile
                  </Button>
                </CardContent>
              </Card>

              {/* Accounting Connection Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Accounting Integration</CardTitle>
                </CardHeader>
                <CardContent>
                  {hasAccountingConnection ? (
                    <div className="flex flex-col items-center justify-center py-2">
                      <div className="flex items-center mb-4">
                        <CheckCircle className="text-green-600 mr-2 h-5 w-5" />
                        <span className="text-sm font-medium">Connected</span>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => navigate('/business/accounting/connect')}
                      >
                        Manage Connection
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-2">
                      <div className="flex items-center mb-4">
                        <AlertTriangle className="text-amber-500 mr-2 h-5 w-5" />
                        <span className="text-sm font-medium">Not Connected</span>
                      </div>
                      <Button 
                        className="w-full bg-fundhub-blue hover:bg-fundhub-blue/90"
                        size="sm"
                        onClick={() => navigate('/business/accounting/connect')}
                      >
                        Connect Accounting
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Create Application */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Need Funding?</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-2">
                    <Wallet className="mb-4 h-8 w-8 text-fundhub-blue" />
                    <Button 
                      className="w-full bg-fundhub-blue hover:bg-fundhub-blue/90 mb-2"
                      onClick={() => navigate('/applications/new')}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create New Application
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => navigate('/applications')}
                    >
                      View Applications
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="mb-8">
              <TabsList className="mb-6">
                <TabsTrigger value="applications">Recent Applications</TabsTrigger>
                <TabsTrigger value="offers">Recent Offers</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
                <TabsTrigger value="reviews">Recent Reviews</TabsTrigger>
                <TabsTrigger value="messages">Messages</TabsTrigger>
              </TabsList>
              
              <TabsContent value="applications" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Your Applications</CardTitle>
                    <CardDescription>Recent financing applications and their current status</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {getRecentApplications()}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="offers">
                <Card>
                  <CardHeader>
                    <CardTitle>Your Offers</CardTitle>
                    <CardDescription>Financing offers from lenders for your applications</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {getRecentOffers()}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="notifications">
                <Card>
                  <CardHeader>
                    <CardTitle>Notifications</CardTitle>
                    <CardDescription>Recent updates and alerts</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8">
                        <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">No Notifications</h3>
                        <p className="text-muted-foreground text-center">
                          You're all caught up!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {notifications.map((notification) => (
                          <div key={notification.id} className="p-4 border rounded-lg">
                            <h4 className="font-medium">{notification.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {notification.message}
                            </p>
                            <div className="text-xs text-muted-foreground mt-2">
                              {new Date(notification.sent_at).toLocaleString()}
                            </div>
                          </div>
                        ))}
                        
                        <div className="pt-2">
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => navigate('/notifications')}
                          >
                            View All Notifications
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reviews">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Reviews</CardTitle>
                    <CardDescription>Feedback from businesses on their financing experiences</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {getRecentReviews()}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="messages">
                <Card>
                  <CardHeader>
                    <CardTitle>Messages</CardTitle>
                    <CardDescription>Communicate with the FundHub team</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {getMessages()}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </PageLayout>
  );
};

export default BusinessDashboard;
