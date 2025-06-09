import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import PageLayout from '@/components/PageLayout';
import { getDocument, getDocuments, updateDocument, createDocument, serverTimestamp } from '@/firebase';
import { formatApplicationNumber } from '@/lib/applicationUtils';
import { formatCurrency, formatRepaymentFrequency } from './components';
import { 
  LoanDetailsCard,
  CostBreakdownCard,
  ActionCard,
  BusinessInfoCard,
  DocumentsCard,
  MessagingCard,
  LenderProfileModal,
  ApplicationDetailsCard
} from './components';

const OfferDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [declineReason, setDeclineReason] = useState('');
  const [isDeclineDialogOpen, setIsDeclineDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [isLenderProfileModalOpen, setIsLenderProfileModalOpen] = useState(false);
  const isLender = user?.role === 'lender';
  
  // Fetch offer details using Firebase
  const { data: offer, isLoading: isLoadingOffer } = useQuery({
    queryKey: ['offer', id],
    queryFn: async () => {
      if (!id) {
        throw new Error('Offer ID is missing');
      }
      
      // Get offer data
      const { data: offerData, error: offerError } = await getDocument('offers', id);
      
      if (offerError) {
        toast.error('Failed to load offer details');
        throw offerError;
      }
      
      if (!offerData) {
        throw new Error('Offer not found');
      }
      
      // Get the associated application
      let applicationData = null;
      if (offerData.application_id) {
        const { data: appData } = await getDocument('applications', offerData.application_id);
        if (appData) {
          applicationData = appData;
        }
      }
      
      // Get lender details if not already in offer
      let lenderData = null;
      if (offerData.lender_id && (!offerData.lender_name || offerData.lender_name === 'Unnamed Lender')) {
        try {
          // Try to get from lender_profiles collection
          const { data: lenderProfile } = await getDocument('lender_profiles', offerData.lender_id);
          if (lenderProfile) {
            lenderData = {
              lender_name: lenderProfile.lender_name || lenderProfile.company_name || 'Unnamed Lender',
              company_logo: lenderProfile.logo_url || ''
            };
          } else {
            // Fallback: try to get from users collection
            const { data: userData } = await getDocument('users', offerData.lender_id);
            if (userData) {
              lenderData = {
                lender_name: userData.company_name || userData.name || 'Unnamed Lender',
                company_logo: userData.logo_url || userData.logo || ''
              };
            }
          }
        } catch (error) {
          console.warn('Could not fetch lender details:', error);
        }
      }
      
      // Get business details if we're the lender viewing our offer
      let businessData = null;
      if (isLender && applicationData && applicationData.business_id) {
        const { data: busData } = await getDocument('businesses', applicationData.business_id);
        if (busData) {
          businessData = busData;
        }
      }

      // Return combined data (similar to Supabase join)
      return {
        ...offerData,
        // Override with fetched lender data if available
        ...(lenderData && {
          lender_name: lenderData.lender_name,
          company_logo: lenderData.company_logo
        }),
        applications: applicationData,
        business: businessData
      };
    },
    enabled: !!id && !!user,
  });

  // Fetch messages for this specific application/offer
  const { data: messages, refetch: refetchMessages } = useQuery({
    queryKey: ['messages', offer?.application_id, user?.uid],
    queryFn: async () => {
      if (!offer?.application_id || !user?.uid) return [];
      
      try {
        const { data: messageData } = await getDocuments('messages', [
          { field: 'application_id', operator: '==', value: offer.application_id }
        ]);
        
        if (!messageData) return [];
        
        // Filter messages for this specific conversation (business <-> lender for this offer)
        return messageData
          .filter(msg => 
            (msg.sender_id === user.uid && msg.recipient_id === (isLender ? offer.applications?.user_id : offer.lender_id)) ||
            (msg.sender_id === (isLender ? offer.applications?.user_id : offer.lender_id) && msg.recipient_id === user.uid)
          )
          .sort((a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime());
      } catch (error) {
        console.error('Error fetching messages:', error);
        return [];
      }
    },
    enabled: !!offer?.application_id && !!user?.uid && activeTab === 'messages',
  });

  // Accept offer
  const handleAcceptOffer = async () => {
    try {
      if (!id || !offer || !offer.application_id) {
        toast.error('Missing required information');
        return;
      }
      
      // Update offer status with detailed information
      const { error: offerError } = await updateDocument('offers', id, { 
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true,
        acceptance_date: new Date().toISOString(),
        acceptance_status: 'completed'
      });
      
      if (offerError) throw offerError;
      
      // Update application status with necessary flags for lender visibility
      const { error: applicationError } = await updateDocument(
        'applications', 
        offer.application_id,
        { 
          status: 'approved',
          status_updated_at: new Date().toISOString(),
          has_accepted_offer: true,
          accepted_offer_id: id,
          accepted_at: new Date().toISOString(),
          lender_id: offer.lender_id,
          is_visible_to_lender: true,
          application_stage: 'accepted',
          last_activity_date: new Date().toISOString(),
          // Ensure the lender is in matched_lenders array for messaging
          matched_lenders: [offer.lender_id] // This enables messaging between business and lender
        }
      );
      
      if (applicationError) throw applicationError;
      
      // Create detailed notification for the lender
      await createDocument('notifications', {
        recipient_id: offer.lender_id,
        type: 'offer_accepted',
        title: 'Offer Accepted',
        message: `Your offer for ${formatCurrency(offer.offered_amount)} has been accepted by the business.`,
        related_entity_id: id,
        related_entity_type: 'offer',
        application_id: offer.application_id,
        business_id: offer.applications?.business_id,
        business_name: offer.applications?.business_name,
        offer_amount: offer.offered_amount,
        status: 'accepted',
        requires_action: true,
        priority: 'high',
        category: 'offer_acceptance',
        read: false,
        sent_at: new Date().toISOString(),
        action_url: `/business/${offer.application_id}`
      });
      
      // Create a welcome message to kickstart the conversation
      try {
        const { error: messageError } = await createDocument('messages', {
          application_id: offer.application_id,
          sender_id: user.uid,
          recipient_id: offer.lender_id,
          content: `Hello! I've accepted your financing offer. Looking forward to working with you on this application.`,
          sent_at: serverTimestamp(),
          read: false,
        });
        
        if (messageError) {
          console.error('Error creating welcome message:', messageError);
        }
      } catch (messageError) {
        console.error('Error creating welcome message:', messageError);
      }
      
      toast.success('Offer accepted successfully! The lender has been notified.');
      
      // Refresh the page after successful acceptance
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (err) {
      console.error('Error accepting offer:', err);
      toast.error('Failed to accept offer');
    }
  };

  // Decline offer
  const handleDeclineOffer = async () => {
    try {
      if (!id || !offer) {
        toast.error('Missing offer ID');
        return;
      }
      
      // Update offer status
      const { error } = await updateDocument('offers', id, { 
        status: 'declined',
        decline_reason: declineReason || 'No reason provided',
        updated_at: new Date().toISOString()
      });
      
      if (error) throw error;
      
      // Create notification for the lender
      await createDocument('notifications', {
        recipient_id: offer.lender_id,
        type: 'offer_declined',
        title: 'Offer Declined',
        message: `Your offer for ${formatCurrency(offer.offered_amount)} has been declined by the business.`,
        related_entity_id: id,
        related_entity_type: 'offer',
        application_id: offer.application_id,
        decline_reason: declineReason || 'No reason provided',
        read: false,
        sent_at: new Date().toISOString()
      });
      
      setIsDeclineDialogOpen(false);
      toast.success('Offer declined. The lender has been notified.');
      
      // Refresh the page after successful decline
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (err) {
      console.error('Error declining offer:', err);
      toast.error('Failed to decline offer');
    }
  };

  // Withdraw offer (for lenders)
  const handleWithdrawOffer = async () => {
    try {
      if (!id || !offer) {
        toast.error('Missing offer ID');
        return;
      }
      
      // Update offer status
      const { error } = await updateDocument('offers', id, { 
        status: 'withdrawn',
        updated_at: new Date().toISOString()
      });
      
      if (error) throw error;
      
      // Create notification for the business
      if (offer.applications && offer.applications.business_id) {
        await createDocument('notifications', {
          recipient_id: offer.applications.business_id,
          type: 'offer_withdrawn',
          title: 'Offer Withdrawn',
          message: `A financing offer for ${formatCurrency(offer.offered_amount)} has been withdrawn by the lender.`,
          related_entity_id: id,
          related_entity_type: 'offer',
          application_id: offer.application_id,
          read: false,
          sent_at: new Date().toISOString()
        });
      }
      
      toast.success('Offer withdrawn successfully.');
      
      // Refresh the page after withdrawal
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (err) {
      console.error('Error withdrawing offer:', err);
      toast.error('Failed to withdraw offer');
    }
  };

  // Message handlers
  const handleSendMessage = async (applicationId: string, recipientId: string, content: string) => {
    try {
      await createDocument('messages', {
        application_id: applicationId,
        sender_id: user.uid,
        recipient_id: recipientId,
        content: content.trim(),
        sent_at: serverTimestamp(),
        read: false,
      });
      
      refetchMessages();
      toast.success('Message sent successfully!');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  if (isLoadingOffer) {
    return (
      <PageLayout>
        <div className="container py-8">
          <div className="max-w-4xl mx-auto">
            <div className="h-96 animate-pulse bg-gray-100 rounded-xl"></div>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!offer) {
    return (
      <PageLayout>
        <div className="container py-8">
          <div className="max-w-4xl mx-auto">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Offer not found</AlertTitle>
              <AlertDescription>
                The offer you're looking for doesn't exist or you don't have permission to view it.
              </AlertDescription>
            </Alert>
            <Button 
              className="mt-4"
              variant="outline" 
              onClick={() => navigate('/offers')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Offers
            </Button>
          </div>
        </div>
      </PageLayout>
    );
  }

  // Check expiry date and status
  const isExpired = new Date(offer.expiry_date || offer.expires_at) < new Date();
  const isAccepted = offer.status === 'accepted';
  const isDeclined = offer.status === 'declined';
  const isPending = offer.status === 'pending';
  const isNegotiating = offer.status === 'negotiating';
  const isWithdrawn = offer.status === 'withdrawn';

  // Early check for business ID visibility
  const businessName = offer.business?.business_name || 
    (offer.applications?.business_name || 'Business');

  // Create conversation data for ConversationsUI
  const conversation = offer ? {
    id: `${offer.application_id}-${offer.lender_id}`,
    userId: isLender ? offer.applications?.user_id || '' : user?.uid || '',
    lenderId: isLender ? user?.uid || '' : offer.lender_id,
    lenderName: isLender ? (offer.business?.business_name || 'Business') : offer.lender_name,
    lenderAvatar: isLender ? '' : (offer.company_logo || ''),
    applicationId: offer.application_id,
    applicationPurpose: offer.applications?.purpose || 'Business Funding',
    lastMessage: messages?.[messages.length - 1]?.content || 'No messages yet',
    lastMessageTime: messages?.[messages.length - 1]?.sent_at ? new Date(messages[messages.length - 1].sent_at) : new Date(),
    unreadCount: 0,
    applicationAmount: offer.offered_amount,
    offerStatus: offer.status,
    businessName: offer.business?.business_name,
    businessId: offer.applications?.business_id,
  } : null;

  return (
    <PageLayout>
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
        <div className="container py-8">
          <Button
            variant="ghost"
            className="mb-6 flex items-center hover:bg-[#212936]/10 text-[#212936]"
            onClick={() => navigate(isLender ? '/matched-applications' : '/offers')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to {isLender ? 'Applications' : 'Offers'}
          </Button>
          
          <div className="max-w-10xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold mb-1 text-slate-900">
                  {isLender ? `Offer to ${businessName}` : `Offer from ${offer.lender_name}`}
                </h1>
                <p className="text-slate-800">
                  {isLender 
                    ? `Application #${formatApplicationNumber(offer.applications, offer.application_id)}`
                    : `For loan application #${formatApplicationNumber(offer.applications, offer.application_id)}`
                  }
                </p>
              </div>
              <div className="mt-2 md:mt-0">
                {isExpired ? (
                  <Badge variant="outline" className="text-orange-500 bg-orange-50">Expired</Badge>
                ) : isAccepted ? (
                  <Badge variant="outline" className="text-green-500 bg-green-50">Accepted</Badge>
                ) : isDeclined ? (
                  <Badge variant="outline" className="text-red-500 bg-red-50">Declined</Badge>
                ) : isWithdrawn ? (
                  <Badge variant="outline" className="text-gray-500 bg-gray-50">Withdrawn</Badge>
                ) : isPending ? (
                  <Badge variant="outline" className="text-blue-500 bg-blue-50">Pending Response</Badge>
                ) : isNegotiating ? (
                  <Badge variant="outline" className="text-purple-500 bg-purple-50">In Negotiation</Badge>
                ) : (
                  <Badge variant="outline">{offer.status}</Badge>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
              {/* Main content - 3/5 width on desktop for more space */}
              <div className="lg:col-span-3 space-y-10">
                <LoanDetailsCard offer={offer} />
                <CostBreakdownCard offer={offer} />
                {isLender && offer.applications && (
                  <ApplicationDetailsCard offer={offer} />
                )}
              </div>
              
              {/* Sidebar - 2/5 width on desktop for better messaging space */}
              <div className="lg:col-span-2 space-y-8">
                <ActionCard 
                  offer={offer}
                  isLender={isLender}
                  isExpired={isExpired}
                  isAccepted={isAccepted}
                  isDeclined={isDeclined}
                  isWithdrawn={isWithdrawn}
                  isPending={isPending}
                  onAccept={handleAcceptOffer}
                  onDecline={handleDeclineOffer}
                  onWithdraw={handleWithdrawOffer}
                  declineReason={declineReason}
                  setDeclineReason={setDeclineReason}
                  isDeclineDialogOpen={isDeclineDialogOpen}
                  setIsDeclineDialogOpen={setIsDeclineDialogOpen}
                />
                
                <BusinessInfoCard 
                  offer={offer}
                  isLender={isLender}
                  onOpenLenderProfile={() => setIsLenderProfileModalOpen(true)}
                />
                
                <DocumentsCard />
                
                {/* Messaging Card - Contextual to this offer */}
                {(isAccepted || (isLender && isPending) || isNegotiating) && conversation && (
                  <MessagingCard 
                    conversation={conversation}
                    messages={messages || []}
                    isLender={isLender}
                    onSendMessage={handleSendMessage}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <LenderProfileModal 
        isOpen={isLenderProfileModalOpen}
        onClose={() => setIsLenderProfileModalOpen(false)}
        offer={offer}
        isLender={isLender}
      />
    </PageLayout>
  );
};

export default OfferDetails;
