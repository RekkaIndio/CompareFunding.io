import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { getDocument, updateDocument, getDocuments, createDocument, deductCredits } from '@/firebase';
import { toast } from 'sonner';
import PageLayout from '@/components/PageLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import StatusBadge from '@/components/StatusBadge';
import {
  ArrowLeft,
  PoundSterling,
  CalendarDays,
  Briefcase,
  ChevronRight,
  FileText,
  CheckCircle,
  AlertTriangle,
  Eye,
  Shield,
  BarChart4,
  PieChart,
  ArrowUpRight,
  Lightbulb,
  HandCoins,
  ThumbsUp,
  MessageSquare,
  Loader2
} from 'lucide-react';
import LowCreditsDialog from '@/components/LowCreditsDialog';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send } from 'lucide-react';

const ApplicationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hasViewedDetails, setHasViewedDetails] = useState(false);
  const [isDeductingCredits, setIsDeductingCredits] = useState(false);
  const [showLowCreditsDialog, setShowLowCreditsDialog] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [selectedLenderConversation, setSelectedLenderConversation] = useState(null);
  
  // Fetch application data
  const { data: application, isLoading } = useQuery({
    queryKey: ['applicationDetail', id],
    queryFn: async () => {
      if (!id) throw new Error('Application ID is required');
      
      // Get application details
      const { data, error } = await getDocument('applications', id);
      
      if (error) {
        toast.error('Failed to load application details');
        throw error;
      }
      
      // Check if the user is either the owner of the application or a matched lender
      const isOwner = data.user_id === user?.uid;
      const isMatchedLender = data.matched_lenders && Array.isArray(data.matched_lenders) && data.matched_lenders.includes(user?.uid);
      const hasPermission = isOwner || isMatchedLender;
      
      if (!hasPermission) {
        toast.error('You do not have permission to view this application');
        if (isOwner) {
          navigate('/applications');
        } else {
          navigate('/matched-applications');
        }
        throw new Error('Unauthorized');
      }
      
      // Get business details - for application owners only
      let businessData = null;
      if (isOwner) {
        const businessResponse = await getDocument('business_profiles', user.uid);
        businessData = businessResponse.data;
      } else if (data.business_id) {
        // For lenders, get the business profile using business_id from the application
        const businessResponse = await getDocument('business_profiles', data.business_id);
        businessData = businessResponse.data;
      }
      
      return {
        ...data,
        business: businessData,
        isOwner,
        isLender: !isOwner
      };
    },
    enabled: !!id && !!user?.uid,
  });
  
  // Fetch lender's available credits
  const { data: lenderData } = useQuery({
    queryKey: ['lenderBilling', user?.uid],
    queryFn: async () => {
      if (!user?.uid) throw new Error('User ID is required');
      
      const { data, error } = await getDocument('lender_billing', user.uid);
      
      if (error) {
        // Not an error if document doesn't exist yet - just provide default values
        return { 
          total_credits: 25, 
          used_credits: 10
        };
      }
      
      return data || { 
        total_credits: 25, 
        used_credits: 10
      };
    },
    enabled: !!user?.uid,
  });
  
  // Calculate available credits
  const availableCredits = lenderData 
    ? lenderData.total_credits - lenderData.used_credits 
    : 0;
    
  // Calculate credit cost based on loan amount
  const getCreditCost = (loanAmount) => {
    if (!loanAmount) return 1;
    const amount = Number(loanAmount);
    // £100 = 1 credit, so divide by 100 and round up
    return Math.ceil(amount / 100);
  };
  
  const handleViewFullDetails = async () => {
    if (!id || !user || !application) return;
    
    try {
      setIsDeductingCredits(true);
      const creditCost = getCreditCost(application.loan_amount);
      const availableCredits = lenderData 
        ? lenderData.total_credits - (lenderData.credits_used || 0) 
        : 0;

      if (availableCredits < creditCost) {
        setShowLowCreditsDialog(true);
        return;
      }
      
      // Deduct credits from lender's account
      await deductCredits(user.uid, creditCost);
      
      // Record that this lender has viewed this application
      const viewedByLenders = application.viewed_by_lenders || [];
      
      if (!viewedByLenders.includes(user.uid)) {
        const updatedViewers = [...viewedByLenders, user.uid];
        await updateDocument('applications', id, {
          viewed_by_lenders: updatedViewers
        });
      }
      
      setHasViewedDetails(true);
      toast.success(`${creditCost} credits used to view details`);
    } catch (error: any) {
      console.error('Error viewing application details:', error);
      if (error.message === 'Insufficient credits') {
        toast.error('You do not have enough credits to view this application. Please purchase more credits.');
        navigate('/lender/billing');
      } else {
        toast.error('Failed to unlock application details');
      }
    } finally {
      setIsDeductingCredits(false);
    }
  };

  // Respond to lender interest (accept or reject)
  const handleRespondToInterest = async (lender: any, response: 'accepted' | 'rejected') => {
    if (!id || !user || !application) return;
    
    try {
      // Find the interested lender in the array
      const interestedLenders = application.interested_lenders || [];
      const updatedLenders = interestedLenders.map(l => {
        if (l.lender_id === lender.lender_id) {
          return {
            ...l,
            status: response,
            responded_at: new Date()
          };
        }
        return l;
      });
      
      // Update the application with the new status
      await updateDocument('applications', id, {
        interested_lenders: updatedLenders
      });
      
      // Create a notification for the lender
      const notificationData = {
        user_id: lender.lender_id,
        type: response === 'accepted' ? 'interest_accepted' : 'interest_declined',
        title: response === 'accepted' ? 'Interest Accepted' : 'Interest Declined',
        message: response === 'accepted' 
          ? `Application #${application.application_number || id?.substring(0, 8)} has accepted your interest` 
          : `Application #${application.application_number || id?.substring(0, 8)} has declined your interest`,
        application_id: id,
        read: false,
        created_at: new Date()
      };
      
      await createDocument('notifications', notificationData);
      
      // If accepted, match the lender with the application
      if (response === 'accepted') {
        // Add this lender to matched_lenders array if not already there
        const matchedLenders = application.matched_lenders || [];
        if (!matchedLenders.includes(lender.lender_id)) {
          await updateDocument('applications', id, {
            matched_lenders: [...matchedLenders, lender.lender_id]
          });
        }
      }
      
      toast.success(
        response === 'accepted'
          ? 'You have accepted this lender\'s interest. They will be notified.'
          : 'You have declined this lender\'s interest. They will be notified.'
      );
      
      // Refresh the application data
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('Error responding to lender interest:', error);
      toast.error('Failed to respond to lender interest');
    }
  };

  // Fetch messages for selected conversation
  const { data: messages, isLoading: messagesLoading, refetch: refetchMessages } = useQuery({
    queryKey: ['messages', selectedLenderConversation?.id],
    queryFn: async () => {
      if (!selectedLenderConversation?.id) return [];
      
      const { data } = await getDocuments(
        'messages',
        [{ field: 'conversation_id', operator: '==', value: selectedLenderConversation.id }],
        [{ field: 'timestamp', direction: 'asc' }]
      );
      
      return data || [];
    },
    enabled: !!selectedLenderConversation?.id
  });

  // Function to select a lender for conversation
  const selectLenderConversation = (lenderId, lenderName, offerId) => {
    setSelectedLenderConversation({
      id: offerId || lenderId, // Use offer ID if available, otherwise use lender ID
      lenderId: lenderId,
      lenderName: lenderName
    });
  };

  // Function to send a message
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedLenderConversation) return;

    try {
      // Create the message
      const messageData = {
        conversation_id: selectedLenderConversation.id,
        offer_id: selectedLenderConversation.id, // If using offer ID as conversation ID
        application_id: id,
        sender_id: user.uid,
        sender_type: 'business',
        recipient_id: selectedLenderConversation.lenderId,
        message: newMessage.trim(),
        timestamp: new Date().toISOString(),
        read: false
      };

      const { error } = await createDocument('messages', messageData);
      if (error) throw error;

      // Create a notification for the lender
      await createDocument('notifications', {
        recipient_id: selectedLenderConversation.lenderId,
        type: 'new_message',
        title: 'New message',
        message: `New message from Application #${application.application_number || id?.substring(0, 8)}`,
        related_entity_id: selectedLenderConversation.id,
        related_entity_type: 'conversation',
        read: false,
        sent_at: new Date().toISOString()
      });

      setNewMessage('');
      refetchMessages();
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error('Failed to send message');
    }
  };

  // Function to get display name based on permissions
  const getBusinessDisplayName = (businessData, isOwner, isMatched) => {
    if (isOwner || isMatched) {
      return businessData?.business_name || 'Unnamed Business';
    }
    return `Application #${application.application_number || id?.substring(0, 8)}`;
  };

  return (
    <PageLayout>
      <div className="container py-8">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => {
            if (application?.isLender) {
              navigate('/matched-applications');
            } else {
              navigate('/applications');
            }
          }}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {application?.isLender ? 'Back to Lender Applications' : 'Back to Applications'}
        </Button>
        
        <div className="max-w-4xl mx-auto">
          {isLoading ? (
            <div className="space-y-6 animate-pulse">
              <div className="h-8 bg-gray-100 rounded w-3/4"></div>
              <div className="h-4 bg-gray-100 rounded w-1/2"></div>
              <div className="h-[300px] bg-gray-100 rounded"></div>
            </div>
          ) : application ? (
            <>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-2xl font-bold">
                      {application.isLender 
                        ? `Application #${application.application_number || id?.substring(0, 8)}`
                        : 'Application Details'
                      }
                    </h1>
                    <StatusBadge status={application.status} />
                  </div>
                  <p className="text-muted-foreground">
                    Application #{application.application_number || id?.substring(0, 8)}
                  </p>
                </div>
              </div>

              {application.status === 'draft' && (
                <Alert className="mb-6">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Draft Application</AlertTitle>
                  <AlertDescription className="flex items-center justify-between">
                    <span>This application hasn't been submitted yet. Submit it to start receiving offers from lenders.</span>
                    <Button 
                      className="bg-fundhub-blue hover:bg-fundhub-blue/90"
                      onClick={() => navigate(`/applications/${id}/review`)}
                    >
                      Continue to Review
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {application?.isLender && !hasViewedDetails ? (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>View Application Details</CardTitle>
                    <CardDescription>
                      Unlock full application details including financial information and business profile
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-lg font-medium">Credit Cost</div>
                        <div className="text-sm text-muted-foreground">
                          {getCreditCost(application.loan_amount)} credits required to view
                        </div>
                      </div>
                      <Button 
                        onClick={handleViewFullDetails}
                        disabled={isDeductingCredits}
                        className="bg-fundhub-blue hover:bg-fundhub-blue/90"
                      >
                        {isDeductingCredits ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          'View Details'
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : null}

              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center">
                    <Briefcase className="mr-2 h-5 w-5 text-fundhub-blue" />
                    Application Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Amount</div>
                        <div className="font-medium flex items-center">
                          <PoundSterling className="h-4 w-4 text-fundhub-blue" />
                          £{application.loan_amount?.toLocaleString() || 'Not specified'}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Term</div>
                        <div className="font-medium flex items-center">
                          <CalendarDays className="h-4 w-4 text-fundhub-blue mr-1" />
                          {application.loan_term_months || 'Not specified'} months
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Type</div>
                        <div className="font-medium capitalize">
                          {application.loan_type?.replace('_', ' ') || 'Not specified'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Purpose</div>
                    <div className="font-medium">
                      {application.purpose || 'Not specified'}
                    </div>
                    {application.purpose_details && (
                      <div className="text-sm mt-1 text-muted-foreground">
                        {application.purpose_details}
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div>
                    <div className="text-lg font-medium mb-3">Additional Details</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Security Offered</div>
                        <div className="font-medium">
                          {application.is_secured ? 'Yes' : 'No'}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Personal Guarantee</div>
                        <div className="font-medium">
                          {application.has_personal_guarantee ? 'Yes' : 'No'}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Application Date</div>
                        <div className="font-medium">
                          {new Date(application.application_date).toLocaleDateString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Last Updated</div>
                        <div className="font-medium">
                          {new Date(application.status_updated_at || application.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {application.offers && application.offers.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center">
                      <HandCoins className="mr-2 h-5 w-5 text-fundhub-blue" />
                      Received Offers
                    </CardTitle>
                    <CardDescription>
                      Compare and review offers from lenders
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {application.offers.map((offer: any) => (
                        <div key={offer.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-medium">{offer.lender_name}</h3>
                              <div className="text-2xl font-bold mt-1">
                                £{offer.amount?.toLocaleString()}
                              </div>
                            </div>
                            <Button
                              onClick={() => navigate(`/applications/${id}/offers/${offer.id}`)}
                            >
                              View Offer
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Interest Rate: </span>
                              <span className="font-medium">{offer.interest_rate}%</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Term: </span>
                              <span className="font-medium">{offer.term_months} months</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : application.interested_lenders && application.interested_lenders.length > 0 && application.isOwner ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center">
                      <ThumbsUp className="mr-2 h-5 w-5 text-fundhub-blue" />
                      Interested Lenders
                    </CardTitle>
                    <CardDescription>
                      These lenders have expressed interest in your application
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {application.interested_lenders.map((lender: any, index: number) => (
                        <div key={lender.lender_id || index} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-medium">{lender.lender_name || 'Lender'}</h3>
                              <div className="text-sm text-muted-foreground mt-1">
                                {lender.lender_company || 'Financial Institution'}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                Interest expressed on {lender.expressed_at ? new Date(lender.expressed_at.seconds * 1000).toLocaleDateString() : 'recently'}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {lender.status === 'pending' ? (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 border-red-600"
                                    onClick={() => handleRespondToInterest(lender, 'rejected')}
                                  >
                                    Decline
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="bg-fundhub-blue hover:bg-fundhub-blue/90"
                                    onClick={() => handleRespondToInterest(lender, 'accepted')}
                                  >
                                    Accept
                                  </Button>
                                </>
                              ) : (
                                <Badge variant={lender.status === 'accepted' ? 'default' : 'destructive'}>
                                  {lender.status === 'accepted' ? 'Accepted' : 'Declined'}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-sm mt-2">
                            <p>By accepting, you'll connect with this lender to discuss potential financing options.</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : application.status === 'submitted' ? (
                <Card>
                  <CardContent className="py-12">
                    <div className="text-center">
                      <BarChart4 className="h-12 w-12 mx-auto text-fundhub-blue mb-4" />
                      <h3 className="text-lg font-medium mb-2">
                        Application Under Review
                      </h3>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        Your application is being reviewed by matching lenders. 
                        You'll be notified when you receive offers.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : null}

              {/* Add messaging section when there are matched lenders */}
              {application && application.matched_lenders && application.matched_lenders.length > 0 && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center">
                      <MessageSquare className="mr-2 h-5 w-5 text-fundhub-blue" />
                      Messages with Lenders
                    </CardTitle>
                    <CardDescription>
                      Communicate directly with matched lenders
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="col-span-1">
                        <h3 className="font-medium mb-4">Matched Lenders</h3>
                        <div className="space-y-2">
                          {application.matched_lenders.map(lenderId => {
                            const lender = application.interested_lenders?.find(l => l.lender_id === lenderId);
                            if (!lender) return null;

                            return (
                              <div
                                key={lender.lender_id}
                                className={`flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer ${
                                  selectedLenderConversation?.lenderId === lender.lender_id ? 'bg-gray-50' : ''
                                }`}
                                onClick={() => selectLenderConversation(lender.lender_id, lender.lender_name, lender.offer_id)}
                              >
                                <div>
                                  <div className="font-medium">{lender.lender_name}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {lender.lender_company || 'Financial Institution'}
                                  </div>
                                </div>
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="col-span-2">
                        <Card>
                          <CardHeader>
                            <CardTitle>Messages</CardTitle>
                            <CardDescription>
                              {selectedLenderConversation 
                                ? `Conversation with ${selectedLenderConversation.lenderName}` 
                                : 'Select a lender to view messages'}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="min-h-[300px] flex flex-col">
                            <div className="flex-1 space-y-4">
                              {messagesLoading ? (
                                <div className="animate-pulse space-y-3">
                                  {[1, 2, 3].map(i => (
                                    <div key={i} className="h-14 bg-gray-100 rounded" />
                                  ))}
                                </div>
                              ) : messages && messages.length > 0 ? (
                                <div className="space-y-4">
                                  {messages.map(msg => (
                                    <div
                                      key={msg.id}
                                      className={`flex items-start gap-3 p-3 rounded-lg ${
                                        msg.sender_id === user.uid ? 'bg-blue-50 ml-auto' : 'bg-gray-50'
                                      }`}
                                    >
                                      <Avatar>
                                        <AvatarImage src={msg.sender_type === 'business' ? user.photoURL : '/path/to/lender/avatar'} />
                                        <AvatarFallback>
                                          {msg.sender_type === 'business' ? 'B' : 'L'}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1">
                                        <div className="font-medium">
                                          {msg.sender_id === user.uid ? 'You' : selectedLenderConversation.lenderName}
                                        </div>
                                        <div className="text-sm">
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
                                  <p className="text-sm">
                                    {selectedLenderConversation 
                                      ? 'Start the conversation by sending a message' 
                                      : 'Select a lender to start messaging'}
                                  </p>
                                </div>
                              )}
                            </div>

                            {selectedLenderConversation && (
                              <form onSubmit={sendMessage} className="mt-4 flex items-center gap-2">
                                <Textarea
                                  value={newMessage}
                                  onChange={e => setNewMessage(e.target.value)}
                                  placeholder="Type your message..."
                                  className="flex-1"
                                />
                                <Button type="submit" className="bg-fundhub-blue hover:bg-fundhub-blue/90">
                                  <Send className="h-4 w-4" />
                                </Button>
                              </form>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Application not found</AlertTitle>
              <AlertDescription>
                The application you're looking for doesn't exist or you don't have permission to view it.
              </AlertDescription>
            </Alert>
          )}
        </div>
        <LowCreditsDialog
          isOpen={showLowCreditsDialog}
          onClose={() => setShowLowCreditsDialog(false)}
          requiredCredits={getCreditCost(application?.loan_amount)}
          availableCredits={lenderData ? lenderData.total_credits - (lenderData.credits_used || 0) : 0}
        />
      </div>
    </PageLayout>
  );
};

export default ApplicationDetail;
