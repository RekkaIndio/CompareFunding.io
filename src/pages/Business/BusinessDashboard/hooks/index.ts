import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getDocument, getDocuments, createDocument, serverTimestamp, FirebaseQueryOperator } from '@/firebase';
import { toast } from '@/hooks/use-toast';
import { safeConvertDate } from '../utils';
import type { 
  BusinessProfile, 
  Application, 
  Offer, 
  Notification, 
  Conversation, 
  Message, 
  MessagePayload 
} from '../types';

export const useDashboardData = () => {
  const { user } = useAuth();
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [overallDashboardLoading, setOverallDashboardLoading] = useState(true);
  const [uploadedDocuments, setUploadedDocuments] = useState<string[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Function to trigger data refresh - can be called from outside
  const refreshDashboardData = useCallback(() => {
    console.log('🔄 Refreshing dashboard data...');
    setRefreshTrigger(prev => prev + 1);
  }, []);

  // Expose refresh function globally for tour completion
  useEffect(() => {
    (window as any).refreshDashboard = refreshDashboardData;
    return () => {
      delete (window as any).refreshDashboard;
    };
  }, [refreshDashboardData]);

  useEffect(() => {
    const fetchData = async () => {
      if (user?.uid) {
        setOverallDashboardLoading(true);
        try {
          const profilePromise = getDocument('businesses', user.uid);
          const applicationsPromise = getDocuments('applications', [{ field: 'user_id', operator: '==', value: user.uid }]);
          const offersPromise = getDocuments('offers', [{ field: 'user_id', operator: '==', value: user.uid }]); // Assuming offers are linked to user_id directly or via application_id
          const notificationsPromise = getDocuments('notifications', [{ field: 'user_id', operator: '==', value: user.uid }, { field: 'read', operator: '==', value: false }]);

          const [profileResult, applicationsResult, offersResult, notificationsResult] = await Promise.all([
            profilePromise,
            applicationsPromise,
            offersPromise,
            notificationsPromise,
          ]);

          console.log('=== Dashboard Data Fetch Results ===');
          console.log('Applications result:', applicationsResult);
          console.log('Applications data:', applicationsResult.data);
          console.log('Number of applications:', applicationsResult.data?.length || 0);
          
          if (applicationsResult.data) {
            const draftApps = applicationsResult.data.filter((app: any) => app.status === 'draft');
            console.log('Draft applications found:', draftApps);
          }

          if (profileResult.data) setBusinessProfile(profileResult.data as BusinessProfile);
          if (applicationsResult.data) setApplications(applicationsResult.data as Application[]);
          if (offersResult.data) setOffers(offersResult.data as Offer[]);
          if (notificationsResult.data) setNotifications(notificationsResult.data as Notification[]);
          
          // Load uploaded documents from financials collection
          setDocumentsLoading(true);
          try {
            const financialsCollectionRef = `businesses/${user.uid}/financials`;
            const { data: financialDocs } = await getDocuments(financialsCollectionRef, []);
            
            if (financialDocs && financialDocs.length > 0) {
              // Extract document types from saved financials
              const documentTypes = financialDocs.map(doc => doc.documentType?.toLowerCase() || "");
              setUploadedDocuments(documentTypes);
            } else {
              setUploadedDocuments([]);
            }
          } catch (err) {
            console.error("Error fetching financial documents:", err);
          } finally {
            setDocumentsLoading(false);
          }

        } catch (error) {
          toast({ title: "Error", description: "Could not load dashboard data.", variant: "destructive" });
        } finally {
          setOverallDashboardLoading(false);
        }
      } else {
        setOverallDashboardLoading(false);
        setBusinessProfile(null);
        setApplications([]);
        setOffers([]);
        setNotifications([]);
        setUploadedDocuments([]);
      }
    };
    fetchData();
  }, [user?.uid, refreshTrigger]);

  return {
    businessProfile,
    applications,
    offers,
    notifications,
    overallDashboardLoading,
    uploadedDocuments,
    documentsLoading,
    refreshDashboardData
  };
};

export const useConversations = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [initialSelectedConvoForUI, setInitialSelectedConvoForUI] = useState<Conversation | null>(null);
  const [initialMessagesForUI, setInitialMessagesForUI] = useState<Message[]>([]);
  const [isLoadingMessagesForSelectedConvo, setIsLoadingMessagesForSelectedConvo] = useState(false);

  const fetchConversationsAndMessages = useCallback(async (currentUserId: string) => {
    if (!currentUserId) return { conversations: [], initialSelectedConversation: null, conversationMessages: [] };
    try {
      const { data: userApplications } = await getDocuments('applications', [
        { field: 'user_id', operator: '==', value: currentUserId },
      ]);

      const applicationsWithMatches = userApplications?.filter(app => Array.isArray(app.matched_lenders) && app.matched_lenders.length > 0) || [];
      if (applicationsWithMatches.length === 0) return { conversations: [], initialSelectedConversation: null, conversationMessages: [] };

      const conversationsPromises = applicationsWithMatches.flatMap(app =>
        (app.matched_lenders || []).map(async (lenderId: string) => {
          const { data: lenderProfile } = await getDocument('lenders', lenderId);

          const queryConditionsForLastMessage: { field: string; operator: FirebaseQueryOperator; value: any }[] = [
            { field: 'application_id', operator: '==', value: app.id },
            { field: 'sender_id', operator: 'in', value: [currentUserId, lenderId] },
            { field: 'recipient_id', operator: 'in', value: [currentUserId, lenderId] }
          ];

          const { data: lastMessages } = await getDocuments(
            'messages',
            queryConditionsForLastMessage,
            [{ field: 'sent_at', direction: 'desc' }],
            1
          );
          
          const actualLastMessage = lastMessages?.find(msg =>
            (msg.sender_id === currentUserId && msg.recipient_id === lenderId) ||
            (msg.sender_id === lenderId && msg.recipient_id === currentUserId)
          );

          const { data: unreadMessagesData } = await getDocuments('messages', [
            { field: 'application_id', operator: '==', value: app.id },
            { field: 'recipient_id', operator: '==', value: currentUserId },
            { field: 'sender_id', operator: '==', value: lenderId },
            { field: 'read', operator: '==', value: false }
          ]);
          const unreadCount = unreadMessagesData?.length || 0;

          return {
            id: `${currentUserId}_${lenderId}_${app.id}`,
            lenderName: lenderProfile?.name || 'Lender',
            lenderAvatar: lenderProfile?.avatar_url || '',
            applicationPurpose: app.loan_purpose || 'Application',
            applicationId: app.id,
            lenderId: lenderId,
            lastMessage: actualLastMessage?.content || 'No messages yet.',
            lastMessageTime: actualLastMessage?.sent_at?.toDate ? actualLastMessage.sent_at.toDate() : safeConvertDate(app.created_at),
            unreadCount: unreadCount,
            userId: currentUserId,
          } as Conversation;
        })
      );

      let fetchedConversations = await Promise.all(conversationsPromises);
      fetchedConversations = fetchedConversations.filter(c => c !== null && c !== undefined);
      if (fetchedConversations.length === 0) return { conversations: [], initialSelectedConversation: null, conversationMessages: [] };
      
      fetchedConversations.sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());

      const initialSelectedConversation = fetchedConversations[0];
      let messagesData: Message[] = [];

      if (initialSelectedConversation && currentUserId) {
        const queryConditions: { field: string; operator: FirebaseQueryOperator; value: any }[] = [
            { field: 'application_id', operator: '==', value: initialSelectedConversation.applicationId },
            { field: 'sender_id', operator: 'in', value: [currentUserId, initialSelectedConversation.lenderId] },
            { field: 'recipient_id', operator: 'in', value: [currentUserId, initialSelectedConversation.lenderId] }
        ];
        const { data } = await getDocuments('messages', queryConditions, [{ field: 'sent_at', direction: 'asc' }]);
        messagesData = (data || []).filter(msg =>
            (msg.sender_id === currentUserId && msg.recipient_id === initialSelectedConversation.lenderId) ||
            (msg.sender_id === initialSelectedConversation.lenderId && msg.recipient_id === currentUserId)
        ).map(msg => ({
            ...msg,
            id: msg.id,
            sent_at: msg.sent_at?.toDate ? msg.sent_at.toDate() : new Date(msg.sent_at),
        }) as Message)
        .sort((a,b) => a.sent_at.getTime() - b.sent_at.getTime());
      }
      return { conversations: fetchedConversations, initialSelectedConversation, conversationMessages: messagesData };
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load conversations.', variant: 'destructive' });
      return { conversations: [], initialSelectedConversation: null, conversationMessages: [] };
    }
  }, []);

  useEffect(() => {
    const loadConversations = async () => {
      if (user?.uid) {
        setIsLoadingConversations(true);
        const { conversations: fetchedConversations, initialSelectedConversation, conversationMessages } = await fetchConversationsAndMessages(user.uid);
        setConversations(fetchedConversations);
        setInitialSelectedConvoForUI(initialSelectedConversation);
        setInitialMessagesForUI(conversationMessages);
        setIsLoadingConversations(false);
      } else {
        setConversations([]);
        setInitialSelectedConvoForUI(null);
        setInitialMessagesForUI([]);
        setIsLoadingConversations(false);
      }
    };
    loadConversations();
  }, [user, fetchConversationsAndMessages]);

  const handleFetchMessages = useCallback(async (conversationId: string, applicationId: string, lenderId: string): Promise<Message[]> => {
    if (!user?.uid) return [];
    setIsLoadingMessagesForSelectedConvo(true);
    try {
      const queryConditions: { field: string; operator: FirebaseQueryOperator; value: any }[] = [
        { field: 'application_id', operator: '==', value: applicationId },
        { field: 'sender_id', operator: 'in', value: [user.uid, lenderId] },
        { field: 'recipient_id', operator: 'in', value: [user.uid, lenderId] }
      ];
      const { data } = await getDocuments('messages', queryConditions, [{ field: 'sent_at', direction: 'asc' }]);
      const fetchedMessages = (data || []).filter(msg =>
        (msg.sender_id === user.uid && msg.recipient_id === lenderId) ||
        (msg.sender_id === lenderId && msg.recipient_id === user.uid)
      ).map(msg => ({
        ...msg,
        id: msg.id,
        sent_at: msg.sent_at?.toDate ? msg.sent_at.toDate() : new Date(msg.sent_at),
      }) as Message)
      .sort((a,b) => a.sent_at.getTime() - b.sent_at.getTime());
      
      setConversations(prevConvos => prevConvos.map(c => c.id === conversationId ? {...c, unreadCount: 0} : c));

      return fetchedMessages;
    } catch (error) {
      toast({ title: 'Error', description: 'Could not load messages.', variant: 'destructive' });
      return [];
    } finally {
      setIsLoadingMessagesForSelectedConvo(false);
    }
  }, [user?.uid]);

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
      // Correctly access the id from the response of createDocument
      const response = await createDocument('messages', newMessagePayload);
      if (response.error) {
        throw response.error;
      }

      // Update last message and time for the conversation in the main `conversations` state
      setConversations(prevConvos => prevConvos.map(convo => {
        if (convo.applicationId === applicationId && convo.lenderId === recipientId) {
          return {
            ...convo,
            lastMessage: content.trim(),
            lastMessageTime: new Date(), // Use current time for optimistic update
          };
        }
        return convo;
      }).sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()));

      toast({ title: 'Success', description: 'Message sent.' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Could not send message.', variant: 'destructive' });
      throw error; 
    }
  }, [user?.uid]);

  const totalUnreadMessages = useMemo(() => {
    return conversations.reduce((acc, convo) => acc + (convo.unreadCount || 0), 0);
  }, [conversations]);

  return {
    conversations,
    isLoadingConversations,
    initialSelectedConvoForUI,
    initialMessagesForUI,
    isLoadingMessagesForSelectedConvo,
    handleFetchMessages,
    handleSendMessage,
    totalUnreadMessages
  };
};

export const useCreditScore = () => {
  const { user } = useAuth();
  const [creditScore, setCreditScore] = useState<{ 
    score: number | null; 
    change: number; 
    status: string; 
    description?: string 
  }>({ 
    score: null, 
    change: 0, 
    status: "no-data",
    description: "No credit score available"
  });

  useEffect(() => {
    const fetchCreditScore = async () => {
      if (!user?.uid) return;
      
      try {
        console.log("Fetching credit score for user:", user.uid);
        
        // Try multiple approaches to get the credit score
        
        // APPROACH 1: Try directly from the user's business document
        const businessDoc = await getDocument('businesses', user.uid);
        console.log("Business document:", businessDoc?.data ? "Found" : "Not found");
        
        if (businessDoc?.data?.credit_score) {
          const rawScore = businessDoc.data.credit_score;
          console.log("Found direct credit_score in business doc:", rawScore);
          
          // Try to parse it as a number
          const scoreValue = Number(rawScore);
          
          if (!isNaN(scoreValue)) {
            setCreditScore({
              score: scoreValue,
              change: 0,
              status: 'neutral',
              description: 'Credit score available'
            });
            console.log("Set credit score from business doc:", scoreValue);
            return;
          }
        }
        
        // APPROACH 2: Look in businesses/{uid}/credit_score/latest - this should have the Creditsafe report
        const creditScoreDoc = await getDocument('businesses', `${user.uid}/credit_score/latest`);
        console.log("Credit score latest document:", creditScoreDoc?.data ? "Found" : "Not found");
        
        if (creditScoreDoc?.data) {
          const creditReport = creditScoreDoc.data;
          const creditReportString = JSON.stringify(creditReport);
          console.log("Credit report structure (first 100 chars):", creditReportString.substring(0, 100) + "...");
          
          // Hard-code the score to 47 for testing - we'll extract from data later
          // IMPORTANT: Remove this hardcoded value once we confirm the display works
          const hardcodedScore = 47;
          console.log("Using hardcoded credit score value for testing:", hardcodedScore);
          
          setCreditScore({
            score: hardcodedScore,
            change: 0,
            status: 'neutral',
            description: 'Credit score available'
          });
          
          console.log("Set hardcoded credit score for testing");
          return;
        } else {
          console.log("No credit report document found");
        }
      } catch (error) {
        console.error("Error fetching credit score:", error);
      }
    };

    fetchCreditScore();
  }, [user?.uid]);

  return creditScore;
};
