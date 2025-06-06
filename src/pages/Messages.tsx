import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ConversationsUI from '../components/ConversationsUI';
import PageLayout from '../components/PageLayout';
import { getDocuments, getDocument, createDocument, serverTimestamp } from '../firebase';
import { toast } from 'sonner';

// Type definitions
interface Conversation {
  id: string;
  userId: string;
  lenderId: string;  // Note: For lenders, this contains the business ID they're talking to
  lenderName: string;
  lenderAvatar: string;
  applicationId: string;
  applicationPurpose: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  // Additional fields for enhanced display
  applicationAmount?: number;
  applicationStatus?: string;
  applicationDate?: string;
  lenderOffer?: number;
  offerStatus?: string;
  businessName?: string;
  businessId?: string;  // Added to explicitly track business ID for proper routing
}

interface Message {
  id: string;
  application_id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  sent_at: Date;
  read: boolean;
}

type FirebaseQueryOperator = '==' | '!=' | '<' | '<=' | '>' | '>=' | 'array-contains' | 'array-contains-any' | 'in' | 'not-in';

interface MessagePayload {
  application_id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  sent_at: any; // Firestore serverTimestamp()
  read: boolean;
}

const Messages: React.FC = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [initialSelectedConversation, setInitialSelectedConversation] = useState<Conversation | null>(null);
  const [initialMessages, setInitialMessages] = useState<Message[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Fetch conversations based on user role
  const fetchConversationsAndMessages = useCallback(async () => {
    if (!user?.uid) return;

    try {
      setIsLoadingConversations(true);
      const currentUserId = user.uid;

      if (user.role === 'business') {
        // For business users, get conversations with matched lenders
        const { data: userApplications } = await getDocuments('applications', [{ field: 'user_id', operator: '==', value: currentUserId }]);
        const applicationsWithMatches = userApplications?.filter(app => Array.isArray(app.matched_lenders) && app.matched_lenders.length > 0) || [];
        
        if (applicationsWithMatches.length === 0) {
          setConversations([]);
          setInitialSelectedConversation(null);
          setInitialMessages([]);
          return;
        }

        const conversationsPromises = applicationsWithMatches.flatMap(app =>
          (app.matched_lenders || []).map(async (lenderId: string) => {
            const { data: lenderProfile } = await getDocument('lender_profiles', lenderId);

            // Get last message for this conversation
            const queryConditionsForLastMessage: { field: string; operator: FirebaseQueryOperator; value: any }[] = [
              { field: 'application_id', operator: '==', value: app.id }
            ];

            const { data: messagesForLastMessage } = await getDocuments('messages', queryConditionsForLastMessage, [{ field: 'sent_at', direction: 'desc' }], 1);
            const actualLastMessage = messagesForLastMessage?.filter(msg =>
              (msg.sender_id === currentUserId && msg.recipient_id === lenderId) ||
              (msg.sender_id === lenderId && msg.recipient_id === currentUserId)
            )[0] || null;

            // Get the offer details if available
            const { data: offersData } = await getDocuments('offers', [
              { field: 'application_id', operator: '==', value: app.id },
              { field: 'lender_id', operator: '==', value: lenderId }
            ], [{ field: 'created_at', direction: 'desc' }], 1);
            
            const latestOffer = offersData && offersData.length > 0 ? offersData[0] : null;
            
            return {
              id: `${currentUserId}_${lenderId}_${app.id}`,
              lenderName: lenderProfile?.lender_name || 'Lender',
              lenderAvatar: lenderProfile?.avatar_url || '',
              applicationPurpose: app.loan_purpose || app.purpose || 'Application',
              applicationId: app.id,
              lenderId: lenderId,
              lastMessage: actualLastMessage?.content || 'No messages yet.',
              lastMessageTime: actualLastMessage?.sent_at?.toDate ? actualLastMessage.sent_at.toDate() : new Date(app.application_date as string),
              unreadCount: 0,
              userId: currentUserId,
              // Add enhanced information
              applicationAmount: app.desired_amount || app.loan_amount || app.amount,
              applicationStatus: app.status || 'pending',
              applicationDate: app.application_date || app.created_at,
              lenderOffer: latestOffer?.offered_amount,
              offerStatus: latestOffer?.status,
            } as Conversation;
          })
        );

        let fetchedConversations = await Promise.all(conversationsPromises);
        fetchedConversations = fetchedConversations.filter(c => c !== null && c !== undefined);
        
        if (fetchedConversations.length === 0) {
          setConversations([]);
          setInitialSelectedConversation(null);
          setInitialMessages([]);
          return;
        }
        
        fetchedConversations.sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());

        const initialSelectedConversation = fetchedConversations[0];
        let messagesData: Message[] = [];

        // Fetch initial messages for the first conversation
        if (initialSelectedConversation && currentUserId) {
          // Get messages for this specific conversation - more straightforward approach
          const { data: allMessages } = await getDocuments('messages', [
            { field: 'application_id', operator: '==', value: initialSelectedConversation.applicationId }
          ], [{ field: 'sent_at', direction: 'asc' }]);
          
          messagesData = (allMessages || []).filter(msg =>
            (msg.sender_id === currentUserId && msg.recipient_id === initialSelectedConversation.lenderId) ||
            (msg.sender_id === initialSelectedConversation.lenderId && msg.recipient_id === currentUserId)
          ).map(msg => ({
            ...msg,
            id: msg.id,
            sent_at: msg.sent_at?.toDate ? msg.sent_at.toDate() : new Date(msg.sent_at),
          }) as Message)
          .sort((a,b) => a.sent_at.getTime() - b.sent_at.getTime());
        }

        setConversations(fetchedConversations);
        setInitialSelectedConversation(initialSelectedConversation);
        setInitialMessages(messagesData);
      } else {
        // For lender users, get conversations from accepted offers
        const { data: acceptedOffers } = await getDocuments('offers', [
          { field: 'lender_id', operator: '==', value: currentUserId }, 
          { field: 'status', operator: 'in', value: ['accepted', 'completed'] }
        ]);
        
        if (!acceptedOffers || acceptedOffers.length === 0) {
          setConversations([]);
          setInitialSelectedConversation(null);
          setInitialMessages([]);
          return;
        }

        const conversationsPromises = acceptedOffers.map(async (offer: any) => {
          // Get application details
          const { data: application } = await getDocument('applications', offer.application_id);
          if (!application) return null;

          // Get business details
          const businessId = application.business_id || application.user_id;
          const { data: business } = await getDocument('businesses', businessId);

          // Get last message for this conversation
          const queryConditionsForLastMessage: { field: string; operator: FirebaseQueryOperator; value: any }[] = [
            { field: 'application_id', operator: '==', value: offer.application_id }
          ];

          const { data: messagesForLastMessage } = await getDocuments('messages', queryConditionsForLastMessage, [{ field: 'sent_at', direction: 'desc' }], 1);
          const actualLastMessage = messagesForLastMessage?.filter(msg =>
            (msg.sender_id === currentUserId && msg.recipient_id === businessId) ||
            (msg.sender_id === businessId && msg.recipient_id === currentUserId)
          )[0] || null;

          return {
            id: `${businessId}_${currentUserId}_${offer.application_id}`,
            lenderName: business?.business_name || business?.company_name || 'Business',
            lenderAvatar: business?.logo_url || '',
            applicationPurpose: application?.loan_purpose || application?.purpose || 'Application',
            applicationId: offer.application_id,
            lenderId: businessId, // For lenders, this represents the business they're talking to
            businessId: businessId, // Explicitly set business ID for proper routing
            lastMessage: actualLastMessage?.content || 'No messages yet.',
            lastMessageTime: actualLastMessage?.sent_at?.toDate ? actualLastMessage.sent_at.toDate() : new Date(offer.created_at || Date.now()),
            unreadCount: 0,
            userId: currentUserId,
            // Add enhanced information
            applicationAmount: application?.desired_amount || application?.loan_amount || application?.amount,
            applicationStatus: application?.status || 'pending',
            applicationDate: application?.application_date || application?.created_at,
            lenderOffer: offer.offered_amount,
            offerStatus: offer.status,
            businessName: business?.business_name || business?.company_name || 'Business',
          } as Conversation;
        });

        let fetchedConversations = (await Promise.all(conversationsPromises)).filter(Boolean);
        
        if (fetchedConversations.length === 0) {
          setConversations([]);
          setInitialSelectedConversation(null);
          setInitialMessages([]);
          return;
        }
        
        fetchedConversations.sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());

        const initialSelectedConversation = fetchedConversations[0];
        let messagesData: Message[] = [];

        // Fetch initial messages for the first conversation
        if (initialSelectedConversation && currentUserId) {
          // Get messages for this specific conversation - more straightforward approach
          const { data: allMessages } = await getDocuments('messages', [
            { field: 'application_id', operator: '==', value: initialSelectedConversation.applicationId }
          ], [{ field: 'sent_at', direction: 'asc' }]);
          
          messagesData = (allMessages || []).filter(msg =>
            (msg.sender_id === currentUserId && msg.recipient_id === initialSelectedConversation.lenderId) ||
            (msg.sender_id === initialSelectedConversation.lenderId && msg.recipient_id === currentUserId)
          ).map(msg => ({
            ...msg,
            id: msg.id,
            sent_at: msg.sent_at?.toDate ? msg.sent_at.toDate() : new Date(msg.sent_at),
          }) as Message)
          .sort((a,b) => a.sent_at.getTime() - b.sent_at.getTime());
        }

        setConversations(fetchedConversations);
        setInitialSelectedConversation(initialSelectedConversation);
        setInitialMessages(messagesData);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setIsLoadingConversations(false);
    }
  }, [user]);

  // Fetch messages for a specific conversation
  const handleFetchMessages = useCallback(async (conversationId: string, applicationId: string, lenderId: string): Promise<Message[]> => {
    if (!user?.uid) return [];
    setIsLoadingMessages(true);
    try {
      // Simplified query - just get all messages for this application
      const { data } = await getDocuments('messages', [
        { field: 'application_id', operator: '==', value: applicationId }
      ], [{ field: 'sent_at', direction: 'asc' }]);
      
      const fetchedMessages = (data || []).filter(msg =>
        (msg.sender_id === user.uid && msg.recipient_id === lenderId) ||
        (msg.sender_id === lenderId && msg.recipient_id === user.uid)
      ).map(msg => ({
        ...msg,
        id: msg.id,
        sent_at: msg.sent_at?.toDate ? msg.sent_at.toDate() : new Date(msg.sent_at),
      }) as Message)
      .sort((a,b) => a.sent_at.getTime() - b.sent_at.getTime());
      
      // Mark messages as read
      setConversations(prevConvos => prevConvos.map(c => c.id === conversationId ? {...c, unreadCount: 0} : c));

      return fetchedMessages;
    } catch (error) {
      toast.error('Could not load messages');
      return [];
    } finally {
      setIsLoadingMessages(false);
    }
  }, [user?.uid]);

  // Send a message
  const handleSendMessage = useCallback(async (applicationId: string, recipientId: string, content: string) => {
    if (!user?.uid || !content.trim()) return;
    try {
      const newMessagePayload: MessagePayload = {
        application_id: applicationId,
        sender_id: user.uid,
        recipient_id: recipientId,
        content: content.trim(),
        sent_at: serverTimestamp(),
        read: false,
      };

      const response = await createDocument('messages', newMessagePayload);
      if (response.error) {
        throw response.error;
      }

      // Update last message and time for the conversation
      setConversations(prevConvos => prevConvos.map(convo => {
        if (convo.applicationId === applicationId && convo.lenderId === recipientId) {
          return {
            ...convo,
            lastMessage: content.trim(),
            lastMessageTime: new Date(),
          };
        }
        return convo;
      }).sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()));

      toast.success('Message sent');
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  }, [user?.uid]);

  // Load conversations on mount
  useEffect(() => {
    fetchConversationsAndMessages();
  }, [fetchConversationsAndMessages]);

  if (!user) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-slate-600">Please log in to view messages.</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="container mx-auto px-4 py-8" onClick={(e) => e.preventDefault()}>
          <div className="bg-white rounded-xl shadow-lg border border-slate-200">
            <div className="p-6 border-b border-slate-200">
              <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
              <p className="text-slate-600 mt-1">
                {user.role === 'business'
                  ? 'Communicate with lenders about your applications'
                  : 'Communicate with businesses about their applications'}
              </p>
            </div>
            <ConversationsUI 
              conversations={conversations}
              initialSelectedConversation={initialSelectedConversation}
              initialMessages={initialMessages}
              currentUserId={user.uid}
              userRole={user.role as 'business' | 'lender'}
              onSendMessage={handleSendMessage}
              onFetchMessages={handleFetchMessages}
              isLoadingConversations={isLoadingConversations}
              isLoadingMessages={isLoadingMessages}
            />
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Messages;
