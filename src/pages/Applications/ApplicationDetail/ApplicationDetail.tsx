import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { getDocument, updateDocument, getDocuments, createDocument, deductCredits } from '@/firebase';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { toast } from 'sonner';
import PageLayout from '@/components/PageLayout';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Alert,
  AlertTitle,
  AlertDescription 
} from "@/components/ui/alert";
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import LowCreditsDialog from '@/components/LowCreditsDialog';

// Import directly using absolute paths
import ApplicationHeader from '@/pages/Applications/ApplicationDetail/components/ApplicationHeader';
import ApplicationOverview from '@/pages/Applications/ApplicationDetail/components/ApplicationOverview';
import ApplicationStrengthCard from '@/pages/Applications/ApplicationDetail/components/ApplicationStrengthCard';
import ApplicationViewDetails from '@/pages/Applications/ApplicationDetail/components/ApplicationViewDetails';
import BusinessProfileCard from '@/pages/Applications/ApplicationDetail/components/BusinessProfileCard';
import CreditScoreCard from '@/pages/Applications/ApplicationDetail/components/CreditScoreCard';
import FinancialDocumentsSection from '@/pages/Applications/ApplicationDetail/components/FinancialDocumentsSection';
import OffersSection from '@/pages/Applications/ApplicationDetail/components/OffersSection';
import CommunicationSection from '@/pages/Applications/ApplicationDetail/components/CommunicationSection';
import { useApplicationData, useLenderCredits } from '@/pages/Applications/ApplicationDetail/hooks';

interface Conversation {
  id: string;
  lenderId: string;
  lenderName: string;
}

interface Message {
  id?: string;
  conversation_id: string;
  message: string;
  sender_id: string;
  timestamp: string;
  read: boolean;
  [key: string]: any;
}

const ApplicationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hasViewedDetails, setHasViewedDetails] = useState<boolean>(false);
  const [isDeductingCredits, setIsDeductingCredits] = useState<boolean>(false);
  const [showLowCreditsDialog, setShowLowCreditsDialog] = useState<boolean>(false);
  const [newMessage, setNewMessage] = useState<string>('');
  const [selectedLenderConversation, setSelectedLenderConversation] = useState<Conversation | null>(null);
  
  // Use our custom hooks
  const { 
    application, 
    isLoading, 
    errorMessage,
    refetchApplication, 
    calculateCompleteness,
    handleRespondToInterest,
  } = useApplicationData(id, user);
  
  const { 
    lenderData, 
    availableCredits, 
    getCreditCost,
    handleViewFullDetails 
  } = useLenderCredits(id, user, application, lenderData => {
    setIsDeductingCredits(true);
    const creditCost = getCreditCost(application?.loan_amount);
    
    if (availableCredits < creditCost) {
      setShowLowCreditsDialog(true);
      setIsDeductingCredits(false);
      return;
    }
    
    // Success callback
    return () => {
      setHasViewedDetails(true);
      setIsDeductingCredits(false);
    };
  });
  
  // Check if user is a matched lender for this application
  const isMatchedLender = application?.matched_lenders?.includes(user?.uid) || false;

  // Fetch messages for selected conversation
  const { data: messages, isLoading: messagesLoading, refetch: refetchMessages } = useQuery<Message[]>({
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
  const selectLenderConversation = (lenderId: string, lenderName: string, offerId?: string) => {
    setSelectedLenderConversation({
      id: offerId || lenderId, // Use offer ID if available, otherwise use lender ID
      lenderId: lenderId,
      lenderName: lenderName
    });
  };

  // Function to send a message
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedLenderConversation || !user || !id) return;

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

      const result = await createDocument('messages', messageData);
      if (result.error) throw result.error;

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

  return (
    <PageLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="w-full py-8 px-6">
          <Button
            variant="ghost"
            className="mb-6 hover:bg-white/60 text-slate-700 hover:text-slate-900 border border-slate-200/50 backdrop-blur-sm"
            onClick={() => {
              if (application?.isLender) {
                navigate('/matched-applications');
              } else {
                navigate('/applications');
              }
            }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {application?.isLender ? 'Back to Matched Applications' : 'Back to Applications'}
          </Button>
          
          <div className="w-full max-w-none">
            {/* Application Header */}
            <ApplicationHeader application={application} />
            
            {isLoading ? (
              <div className="h-64 animate-pulse bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/50 shadow-lg"></div>
            ) : application ? (
              <>
                {/* Draft Application Alert */}
                {application.status === 'draft' && (
                  <Alert className="mb-6 bg-white/90 backdrop-blur-sm border border-amber-200 shadow-lg">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                    <AlertTitle className="text-amber-800 font-medium">Draft Application</AlertTitle>
                    <AlertDescription className="flex items-center justify-between text-amber-700">
                      <span>This application hasn't been submitted yet. Submit it to start receiving offers from lenders.</span>
                      <Button 
                        className="bg-[#212936] hover:bg-[#212936]/90 border-b-2 border-[#ff8000]"
                        onClick={() => navigate(`/applications/${id}/review`)}
                      >
                        Continue to Review
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Credit Cost Section - Only show for lenders who haven't viewed yet */}
                {application?.isLender && 
                 !hasViewedDetails && 
                 !isMatchedLender && 
                 !application.viewed_by_lenders?.includes(user?.uid) && (
                  <ApplicationViewDetails 
                    application={application}
                    isDeductingCredits={isDeductingCredits}
                    getCreditCost={getCreditCost}
                    handleViewFullDetails={handleViewFullDetails}
                  />
                )}

                {/* Application Overview Section */}
                <ApplicationOverview application={application} />

                {/* Grid for strength cards and business info */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                  <ApplicationStrengthCard application={application} />
                  <BusinessProfileCard application={application} />
                  <CreditScoreCard application={application} />
                </div>

                {/* Financial Documents Section */}
                <FinancialDocumentsSection application={application} />

                {/* Offers Section */}
                {application.offers && application.offers.length > 0 && (
                  <OffersSection 
                    application={application} 
                    selectLenderConversation={selectLenderConversation}
                    handleRespondToInterest={handleRespondToInterest}
                  />
                )}

                {/* Communication Section */}
                <CommunicationSection
                  application={application}
                  user={user}
                  selectedLenderConversation={selectedLenderConversation}
                  selectLenderConversation={selectLenderConversation}
                  messages={messages}
                  newMessage={newMessage}
                  setNewMessage={setNewMessage}
                  sendMessage={sendMessage}
                />

                {/* Low Credits Dialog */}
                {showLowCreditsDialog && (
                  <LowCreditsDialog 
                    isOpen={showLowCreditsDialog}
                    onClose={() => setShowLowCreditsDialog(false)}
                    availableCredits={availableCredits}
                    requiredCredits={getCreditCost(application.loan_amount)}
                  />
                )}
              </>
            ) : (
              <Alert variant="destructive" className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Application Not Found</AlertTitle>
                <AlertDescription>
                  {errorMessage || "This application doesn't exist or you don't have permission to view it."}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default ApplicationDetail;
