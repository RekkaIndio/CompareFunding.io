import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavbar } from '@/contexts/NavbarContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDocuments, createDocument, updateDocument, getDocument, serverTimestamp } from '@/firebase';
import PageLayout from '@/components/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  MessageSquare, 
  Send, 
  Paperclip, 
  FileText, 
  Download,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  ArrowLeft,
  Building2,
  User,
  Calendar,
  PoundSterling,
  X,
  Handshake
} from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { 
  shareDocument, 
  getSharedDocuments, 
  getAllSharedDocuments, 
  markDocumentAsViewed, 
  markDocumentAsDownloaded, 
  validateFile, 
  SharedDocument 
} from '@/services/documentService';
import { sendMessageNotification } from '@/services/messageNotificationService';

// Custom hook for delayed loading state to prevent flashing
const useDelayedLoading = (isLoading: boolean, delay: number = 300) => {
  const [showLoading, setShowLoading] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (isLoading) {
      timeoutId = setTimeout(() => setShowLoading(true), delay);
    } else {
      setShowLoading(false);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isLoading, delay]);

  return showLoading;
};

// Type definitions
interface Conversation {
  id: string;
  userId: string;
  lenderId: string;
  businessId: string;
  lenderName: string;
  businessName: string;
  lenderAvatar: string;
  businessAvatar: string;
  applicationId: string;
  applicationNumber: string;
  applicationPurpose: string;
  applicationAmount: number;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  offerStatus?: string;
  connectionStatus: string;
}

interface Message {
  id: string;
  application_id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  sent_at: Date;
  read: boolean;
  message_type?: 'text' | 'document_request' | 'document_upload' | 'system';
  metadata?: any;
}

interface InformationRequest {
  id: string;
  application_id: string;
  business_id: string;
  lender_id: string;
  lender_name: string;
  request_title: string;
  request_message: string;
  requested_categories: string[];
  custom_requests: string[];
  urgency: 'low' | 'medium' | 'high';
  due_date?: string;
  status: 'pending' | 'fulfilled' | 'overdue';
  created_at: string;
  responses?: any[];
}

const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  const { showNavbar } = useNavbar();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Document functionality state
  const [showDocumentRequest, setShowDocumentRequest] = useState(false);
  const [showDocumentShare, setShowDocumentShare] = useState(false);
  const [documentRequestForm, setDocumentRequestForm] = useState({
    title: '',
    message: '',
    categories: [] as string[],
    customRequests: [] as string[],
    urgency: 'medium' as 'low' | 'medium' | 'high',
    dueDate: ''
  });

  // Document sharing state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [shareDescription, setShareDescription] = useState('');
  const [shareCategory, setShareCategory] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Deal closure state
  const [showCloseDeal, setShowCloseDeal] = useState(false);
  const [closeDealForm, setCloseDealForm] = useState({
    reason: '',
    outcome: 'completed' as 'completed' | 'closed',
    notes: ''
  });

  // Ensure navbar is visible
  useEffect(() => {
    showNavbar();
  }, [showNavbar]);

  // Check if we have a specific conversation to open from navigation state
  useEffect(() => {
    if (location.state?.conversation) {
      setSelectedConversation(location.state.conversation);
    }
  }, [location.state]);

  // Fetch conversations based on user role
  const { data: conversations, isLoading: isLoadingConversations, refetch: refetchConversations } = useQuery({
    queryKey: ['conversations', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];

      try {
        const currentUserId = user.uid;
        const allConversations: Conversation[] = [];

        if (user.role === 'business' || user.role === 'business_owner') {
          // For business users, get conversations with connected lenders who have accepted offers
          const { data: userApplications } = await getDocuments('applications', [
            { field: 'user_id', operator: '==', value: currentUserId }
          ]);

          if (!userApplications || userApplications.length === 0) return [];

          // Get all accepted offers for this business's applications from the offers collection
          const applicationIds = userApplications.map(app => app.id);
          const acceptedOffersPromises = applicationIds.map(async (appId) => {
            const { data: offers } = await getDocuments('offers', [
              { field: 'application_id', operator: '==', value: appId },
              { field: 'status', operator: '==', value: 'accepted' }
            ]);
            return offers || [];
          });

          const allAcceptedOffers = (await Promise.all(acceptedOffersPromises)).flat();

          // Also check for embedded offers in applications (for backward compatibility)
          const applicationsWithEmbeddedOffers = userApplications.filter(app => 
            Array.isArray(app.offers) && app.offers.some(offer => offer.status === 'accepted')
          );

          // Process offers from the offers collection
          for (const offer of allAcceptedOffers) {
            const app = userApplications.find(a => a.id === offer.application_id);
            if (!app) continue;

            // Get lender details
            const { data: lenderProfile } = await getDocument('lender_profiles', offer.lender_id);
            
            // Get business details
            const { data: businessProfile } = await getDocument('businesses', currentUserId);
            
            // Get recent messages for this conversation
            const { data: recentMessages } = await getDocuments('messages', [
              { field: 'application_id', operator: '==', value: app.id }
            ], [{ field: 'sent_at', direction: 'desc' }], 1);

            const lastMessage = recentMessages?.[0];
            const unreadCount = await getUnreadMessageCount(app.id, offer.lender_id, currentUserId);

            allConversations.push({
              id: `${app.id}-${offer.lender_id}`,
              userId: currentUserId, // Business user ID
              lenderId: offer.lender_id,
              businessId: currentUserId, // Same as userId for business
              lenderName: lenderProfile?.company_name || offer.lender_name || 'Lender',
              businessName: businessProfile?.business_name || app.business_name || 'Business',
              lenderAvatar: lenderProfile?.logo_url || '',
              businessAvatar: businessProfile?.logo_url || '',
              applicationId: app.id,
              applicationNumber: app.application_number || 'N/A',
              applicationPurpose: app.purpose || 'Business Funding',
              applicationAmount: offer.offered_amount || offer.loan_amount || app.loan_amount || 0,
              lastMessage: lastMessage?.content || 'No messages yet',
              lastMessageTime: lastMessage?.sent_at?.toDate ? lastMessage.sent_at.toDate() : new Date(),
              unreadCount,
              offerStatus: offer.status,
              connectionStatus: 'connected'
            });
          }

          // Process embedded offers (for backward compatibility)
          for (const app of applicationsWithEmbeddedOffers) {
            const acceptedOffers = app.offers.filter(offer => offer.status === 'accepted');
            
            for (const offer of acceptedOffers) {
              // Skip if we already added this conversation from the offers collection
              const alreadyAdded = allConversations.some(conv => 
                conv.applicationId === app.id && conv.lenderId === offer.lender_id
              );
              if (alreadyAdded) continue;

              // Get lender details
              const { data: lenderProfile } = await getDocument('lender_profiles', offer.lender_id);
              
              // Get business details
              const { data: businessProfile } = await getDocument('businesses', currentUserId);
              
              // Get recent messages for this conversation
              const { data: recentMessages } = await getDocuments('messages', [
                { field: 'application_id', operator: '==', value: app.id }
              ], [{ field: 'sent_at', direction: 'desc' }], 1);

              const lastMessage = recentMessages?.[0];
              const unreadCount = await getUnreadMessageCount(app.id, offer.lender_id, currentUserId);

              const conversation = {
                id: `${app.id}-${offer.lender_id}`,
                userId: currentUserId, // Business user ID
                lenderId: offer.lender_id,
                businessId: currentUserId, // Same as userId for business
                lenderName: lenderProfile?.company_name || offer.lender_name || 'Lender',
                businessName: businessProfile?.business_name || app.business_name || 'Business',
                lenderAvatar: lenderProfile?.logo_url || '',
                businessAvatar: businessProfile?.logo_url || '',
                applicationId: app.id,
                applicationNumber: app.application_number || 'N/A',
                applicationPurpose: app.purpose || 'Business Funding',
                applicationAmount: offer.offered_amount || app.loan_amount || 0,
                lastMessage: lastMessage?.content || 'No messages yet',
                lastMessageTime: lastMessage?.sent_at?.toDate ? lastMessage.sent_at.toDate() : new Date(),
                unreadCount,
                offerStatus: offer.status,
                connectionStatus: 'connected'
              };

              allConversations.push(conversation);
            }
          }
        } else if (user.role === 'lender') {
          // For lenders, get conversations with businesses who have accepted their offers
          const { data: lenderOffers } = await getDocuments('offers', [
            { field: 'lender_id', operator: '==', value: currentUserId },
            { field: 'status', operator: '==', value: 'accepted' }
          ]);

          if (!lenderOffers || lenderOffers.length === 0) return [];

          for (const offer of lenderOffers) {
            // Get application details
            const { data: application } = await getDocument('applications', offer.application_id);
            if (!application) continue;

            // Get business details
            const { data: businessProfile } = await getDocument('businesses', application.user_id);
            
            // Get lender details
            const { data: lenderProfile } = await getDocument('lender_profiles', currentUserId);

            // Get recent messages for this conversation
            const { data: recentMessages } = await getDocuments('messages', [
              { field: 'application_id', operator: '==', value: offer.application_id }
            ], [{ field: 'sent_at', direction: 'desc' }], 1);

            const lastMessage = recentMessages?.[0];
            const unreadCount = await getUnreadMessageCount(offer.application_id, application.user_id, currentUserId);

            const conversation = {
              id: `${offer.application_id}-${application.user_id}`,
              userId: currentUserId, // Lender user ID  
              lenderId: currentUserId, // Same as userId for lender
              businessId: application.user_id,
              lenderName: lenderProfile?.company_name || offer.lender_name || 'Lender',
              businessName: businessProfile?.business_name || application.business_name || 'Business',
              lenderAvatar: lenderProfile?.logo_url || '',
              businessAvatar: businessProfile?.logo_url || '',
              applicationId: offer.application_id,
              applicationNumber: application.application_number || 'N/A',
              applicationPurpose: application.purpose || 'Business Funding',
              applicationAmount: offer.offered_amount || 0,
              lastMessage: lastMessage?.content || 'No messages yet',
              lastMessageTime: lastMessage?.sent_at?.toDate ? lastMessage.sent_at.toDate() : new Date(),
              unreadCount,
              offerStatus: offer.status,
              connectionStatus: 'connected'
            };

            allConversations.push(conversation);
          }
        }

        // Sort conversations by last message time
        const sortedConversations = allConversations.sort((a, b) => 
          new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
        );
        
        return sortedConversations;

      } catch (error) {
        console.error('Error fetching conversations:', error);
        toast.error('Failed to load conversations');
        return [];
      }
    },
    enabled: !!user?.uid,
    refetchInterval: 30000, // Keep 30 seconds for conversations
    refetchOnWindowFocus: false, // Prevent refetch on window focus
    staleTime: 10000, // Consider conversation list fresh for 10 seconds
  });

  // Helper function to get unread message count
  const getUnreadMessageCount = async (applicationId: string, otherUserId: string, currentUserId: string): Promise<number> => {
    try {
      const { data: messages } = await getDocuments('messages', [
        { field: 'application_id', operator: '==', value: applicationId },
        { field: 'sender_id', operator: '==', value: otherUserId },
        { field: 'recipient_id', operator: '==', value: currentUserId },
        { field: 'read', operator: '==', value: false }
      ]);
      const count = messages?.length || 0;
      return count;
    } catch (error) {
      console.error('Error getting unread message count:', error);
      return 0;
    }
  };

  // Fetch messages for selected conversation
  const { data: messages, refetch: refetchMessages, isInitialLoading } = useQuery({
    queryKey: ['messages', selectedConversation?.applicationId, selectedConversation?.id],
    queryFn: async () => {
      if (!selectedConversation || !user?.uid) return [];

      try {
        // First try with sorting, fall back to no sorting if index doesn't exist
        let data;
        try {
          const result = await getDocuments('messages', [
            { field: 'application_id', operator: '==', value: selectedConversation.applicationId }
          ], [{ field: 'sent_at', direction: 'asc' }]);
          data = result.data;
        } catch (indexError) {
          const result = await getDocuments('messages', [
            { field: 'application_id', operator: '==', value: selectedConversation.applicationId }
          ]);
          data = result.data;
        }

        const conversationMessages = (data || [])
          .filter(msg => {
            // For business users: show messages between business and lender
            if (user.role === 'business' || user.role === 'business_owner') {
              return (
                (msg.sender_id === user.uid && msg.recipient_id === selectedConversation.lenderId) ||
                (msg.sender_id === selectedConversation.lenderId && msg.recipient_id === user.uid)
              );
            }
            // For lender users: show messages between lender and business
            else if (user.role === 'lender') {
              return (
                (msg.sender_id === user.uid && msg.recipient_id === selectedConversation.businessId) ||
                (msg.sender_id === selectedConversation.businessId && msg.recipient_id === user.uid)
              );
            }
            return false;
          })
          .map(msg => ({
            ...msg,
            sent_at: msg.sent_at?.toDate ? msg.sent_at.toDate() : new Date(msg.sent_at),
          }) as Message)
          .sort((a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime()); // Manual sort by timestamp

        // Mark messages as read
        for (const msg of conversationMessages) {
          if (!msg.read && msg.recipient_id === user.uid) {
            await updateDocument('messages', msg.id, { read: true });
          }
        }

        return conversationMessages;
      } catch (error) {
        console.error('Error fetching messages:', error);
        toast.error('Failed to load messages');
        return [];
      }
    },
    enabled: !!selectedConversation && !!user?.uid,
    refetchInterval: 10000, // Refetch every 10 seconds - more reasonable for production
    refetchOnWindowFocus: false, // Prevent refetch on window focus to reduce flashing
    staleTime: 5000, // Consider data fresh for 5 seconds
  });

  // Use delayed loading to prevent flashing
  const shouldShowLoading = isInitialLoading && (!messages || messages.length === 0);
  const showLoadingMessages = useDelayedLoading(shouldShowLoading);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, recipientId }: { content: string; recipientId: string }) => {
      if (!user?.uid || !selectedConversation) throw new Error('Missing required data');

      const messageData = {
        application_id: selectedConversation.applicationId,
        sender_id: user.uid,
        recipient_id: recipientId,
        content: content.trim(),
        sent_at: serverTimestamp(),
        read: false,
        message_type: 'text',
        created_at: new Date().toISOString() // Add fallback timestamp for debugging
      };

      const result = await createDocument('messages', messageData);
      if (result.error) {
        console.error('Error creating message document:', result.error);
        throw new Error(result.error.message);
      }

      // Send email notification asynchronously (don't wait for it to complete)
      const senderRole = (user.role === 'business' || user.role === 'business_owner') ? 'business' : 'lender';
      
      sendMessageNotification({
        senderId: user.uid,
        recipientId,
        senderRole,
        applicationId: selectedConversation.applicationId,
        messageContent: content.trim(),
        messagesUrl: `${window.location.origin}/messages`,
        applicationData: {
          application_number: selectedConversation.applicationNumber,
          purpose: selectedConversation.applicationPurpose,
          loan_amount: selectedConversation.applicationAmount,
          business_name: selectedConversation.businessName
        }
      }).then((notificationResult) => {
        if (notificationResult.success) {
          console.log('✅ Email notification sent successfully');
        } else {
          console.warn('⚠️ Email notification failed:', notificationResult.error);
        }
      }).catch((error) => {
        console.warn('⚠️ Email notification error (non-blocking):', error);
      });

      return result.data;
    },
    onSuccess: () => {
      setNewMessage('');
      
      // Only refetch messages for this conversation
      refetchMessages();
      
      // Only invalidate conversations to update last message, not all message queries
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      
      toast.success('Message sent');
    },
    onError: (error: any) => {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    },
  });

  // Fetch information requests for selected conversation
  const { data: informationRequests, refetch: refetchInformationRequests } = useQuery({
    queryKey: ['informationRequests', selectedConversation?.applicationId],
    queryFn: async () => {
      if (!selectedConversation || !user?.uid) return [];
      
      try {
        const { data } = await getDocuments('information_requests', [
          { field: 'application_id', operator: '==', value: selectedConversation.applicationId }
        ]);
        return (data || []).map(req => ({
          ...req,
          created_at: req.created_at ? new Date(req.created_at) : new Date(),
          due_date: req.due_date ? new Date(req.due_date) : null
        })) as InformationRequest[];
      } catch (error) {
        console.error('Error fetching information requests:', error);
        return [];
      }
    },
    enabled: !!selectedConversation && !!user?.uid,
    refetchInterval: 30000,
    refetchOnWindowFocus: false,
    staleTime: 10000,
  });

  // Fetch shared documents for selected conversation
  const { data: sharedDocuments, refetch: refetchSharedDocuments, error: sharedDocumentsError } = useQuery({
    queryKey: ['sharedDocuments', selectedConversation?.applicationId],
    queryFn: async () => {
      if (!selectedConversation || !user?.uid) return [];
      
      console.log('Fetching shared documents for application:', selectedConversation.applicationId);
      try {
        const documents = await getAllSharedDocuments(selectedConversation.applicationId);
        console.log('Fetched shared documents:', documents);
        return documents;
      } catch (error) {
        console.error('Error fetching shared documents:', error);
        toast.error('Failed to load shared documents');
        throw error;
      }
    },
    enabled: !!selectedConversation && !!user?.uid,
    refetchInterval: 30000,
    refetchOnWindowFocus: false,
    staleTime: 10000,
  });

  // Fetch current offer for the selected conversation (to show deal closure options)
  const { data: currentOffer, refetch: refetchOffer } = useQuery({
    queryKey: ['currentOffer', selectedConversation?.applicationId, selectedConversation?.lenderId],
    queryFn: async () => {
      if (!selectedConversation || !user?.uid) return null;
      
      try {
        const { data: offers } = await getDocuments('offers', [
          { field: 'application_id', operator: '==', value: selectedConversation.applicationId },
          { field: 'lender_id', operator: '==', value: selectedConversation.lenderId },
          { field: 'status', operator: '==', value: 'accepted' }
        ]);
        
        // Return the first accepted offer between this business and lender
        return offers && offers.length > 0 ? offers[0] : null;
      } catch (error) {
        console.error('Error fetching current offer:', error);
        return null;
      }
    },
    enabled: !!selectedConversation && !!user?.uid,
    refetchInterval: 30000,
    refetchOnWindowFocus: false,
    staleTime: 10000,
  });

  // Document share mutation
  const documentShareMutation = useMutation({
    mutationFn: async () => {
      if (!user?.uid || !selectedConversation || selectedFiles.length === 0) {
        throw new Error('Missing required data for sharing documents');
      }

      const recipientId = (user?.role === 'business' || user?.role === 'business_owner')
        ? selectedConversation.lenderId 
        : selectedConversation.businessId;

      console.log('Starting document share process:', {
        selectedFiles: selectedFiles.map(f => ({ name: f.name, size: f.size, type: f.type })),
        applicationId: selectedConversation.applicationId,
        businessId: selectedConversation.businessId,
        lenderId: selectedConversation.lenderId,
        recipientId,
        userId: user.uid
      });

      const uploadPromises = selectedFiles.map(async (file, index) => {
        try {
          console.log(`Uploading file ${index + 1}/${selectedFiles.length}:`, file.name);
          const result = await shareDocument(
            file,
            selectedConversation.applicationId,
            selectedConversation.businessId,
            selectedConversation.lenderId,
            recipientId,
            shareDescription || `Shared ${file.name}`,
            shareCategory || 'Other'
          );
          console.log(`Successfully uploaded file ${index + 1}:`, result);
          return result;
        } catch (error) {
          console.error(`Error uploading file ${file.name}:`, error);
          throw new Error(`Failed to upload ${file.name}: ${error.message}`);
        }
      });

      const sharedDocs = await Promise.all(uploadPromises);
      console.log('All documents uploaded successfully:', sharedDocs);

      // Send a message about the shared documents
      const fileNames = selectedFiles.map(f => f.name).join(', ');
      const messageContent = `📎 Shared ${selectedFiles.length} document(s): ${fileNames}${shareDescription ? `\n\n${shareDescription}` : ''}`;
      const messageData = {
        application_id: selectedConversation.applicationId,
        sender_id: user.uid,
        recipient_id: recipientId,
        content: messageContent,
        sent_at: serverTimestamp(),
        read: false,
        message_type: 'document_upload',
        metadata: { 
          shared_document_ids: sharedDocs.map(doc => doc.id),
          file_count: selectedFiles.length
        }
      };

      try {
        await createDocument('messages', messageData);
        console.log('Message about shared documents sent successfully');

        // Send email notification for document sharing
        const senderRole = (user.role === 'business' || user.role === 'business_owner') ? 'business' : 'lender';
        
        sendMessageNotification({
          senderId: user.uid,
          recipientId,
          senderRole,
          applicationId: selectedConversation.applicationId,
          messageContent,
          messagesUrl: `${window.location.origin}/messages`,
          applicationData: {
            application_number: selectedConversation.applicationNumber,
            purpose: selectedConversation.applicationPurpose,
            loan_amount: selectedConversation.applicationAmount,
            business_name: selectedConversation.businessName
          }
        }).then((notificationResult) => {
          if (notificationResult.success) {
            console.log('✅ Document sharing email notification sent successfully');
          } else {
            console.warn('⚠️ Document sharing email notification failed:', notificationResult.error);
          }
        }).catch((error) => {
          console.warn('⚠️ Document sharing email notification error (non-blocking):', error);
        });

      } catch (error) {
        console.error('Error sending message about shared documents:', error);
        // Don't throw here as the documents were uploaded successfully
      }

      return sharedDocs;
    },
    onSuccess: (sharedDocs) => {
      console.log('Document share mutation succeeded:', sharedDocs);
      setShowDocumentShare(false);
      setSelectedFiles([]);
      setShareDescription('');
      setShareCategory('');
      setIsUploading(false);
      
      // Force refresh of shared documents
      refetchMessages();
      refetchSharedDocuments();
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['sharedDocuments'] });
      
      toast.success(`Successfully shared ${sharedDocs.length} document(s)`);
    },
    onError: (error: any) => {
      console.error('Document share mutation failed:', error);
      setIsUploading(false);
      toast.error(`Failed to share documents: ${error.message}`);
    },
  });
  const documentRequestMutation = useMutation({
    mutationFn: async (requestData: typeof documentRequestForm) => {
      if (!user?.uid || !selectedConversation) throw new Error('Missing required data');

      const recipientId = (user?.role === 'business' || user?.role === 'business_owner')
        ? selectedConversation.lenderId 
        : selectedConversation.businessId;

      // Create the information request document
      const informationRequest = {
        application_id: selectedConversation.applicationId,
        business_id: selectedConversation.businessId,
        lender_id: selectedConversation.lenderId,
        lender_name: selectedConversation.lenderName,
        request_title: requestData.title,
        request_message: requestData.message,
        requested_categories: requestData.categories,
        custom_requests: requestData.customRequests,
        urgency: requestData.urgency,
        due_date: requestData.dueDate || null,
        status: 'pending',
        created_at: new Date().toISOString(),
        responses: []
      };

      const result = await createDocument('information_requests', informationRequest);
      if (result.error) throw new Error(result.error.message);

      // Also send a message about the document request
      const messageData = {
        application_id: selectedConversation.applicationId,
        sender_id: user.uid,
        recipient_id: recipientId,
        content: `📄 Document Request: ${requestData.title}\n\n${requestData.message}`,
        sent_at: serverTimestamp(),
        read: false,
        message_type: 'document_request',
        metadata: { information_request_id: result.data.id }
      };

      await createDocument('messages', messageData);

      // Send email notification for document request
      const senderRole = (user.role === 'business' || user.role === 'business_owner') ? 'business' : 'lender';
      
      sendMessageNotification({
        senderId: user.uid,
        recipientId,
        senderRole,
        applicationId: selectedConversation.applicationId,
        messageContent: `📄 Document Request: ${requestData.title}\n\n${requestData.message}`,
        messagesUrl: `${window.location.origin}/messages`,
        applicationData: {
          application_number: selectedConversation.applicationNumber,
          purpose: selectedConversation.applicationPurpose,
          loan_amount: selectedConversation.applicationAmount,
          business_name: selectedConversation.businessName
        }
      }).then((notificationResult) => {
        if (notificationResult.success) {
          console.log('✅ Document request email notification sent successfully');
        } else {
          console.warn('⚠️ Document request email notification failed:', notificationResult.error);
        }
      }).catch((error) => {
        console.warn('⚠️ Document request email notification error (non-blocking):', error);
      });

      return result.data;
    },
    onSuccess: () => {
      setShowDocumentRequest(false);
      setDocumentRequestForm({
        title: '',
        message: '',
        categories: [],
        customRequests: [],
        urgency: 'medium',
        dueDate: ''
      });
      refetchMessages();
      refetchInformationRequests();
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast.success('Document request sent');
    },
    onError: (error: any) => {
      console.error('Error sending document request:', error);
      toast.error('Failed to send document request');
    },
  });

  // Close deal mutation
  const closeDealMutation = useMutation({
    mutationFn: async (dealData: typeof closeDealForm) => {
      if (!user?.uid || !selectedConversation || !currentOffer) {
        throw new Error('Missing required data for closing deal');
      }

      const recipientId = (user?.role === 'business' || user?.role === 'business_owner')
        ? selectedConversation.lenderId 
        : selectedConversation.businessId;

      // Update the offer with deal closure information
      const offerUpdateData = {
        deal_status: dealData.outcome === 'completed' ? 'completed' : 'closed',
        closed_at: new Date().toISOString(),
        closed_by: user.uid,
        closure_reason: dealData.reason,
        closure_notes: dealData.notes
      };

      const { error: offerError } = await updateDocument('offers', currentOffer.id, offerUpdateData);
      if (offerError) throw offerError;

      // Send a message about the deal closure
      const actionText = dealData.outcome === 'completed' ? 'completed' : 'closed';
      const messageContent = `🤝 Deal ${actionText}: ${dealData.reason}${dealData.notes ? `\n\nNotes: ${dealData.notes}` : ''}`;
      
      const messageData = {
        application_id: selectedConversation.applicationId,
        sender_id: user.uid,
        recipient_id: recipientId,
        content: messageContent,
        sent_at: serverTimestamp(),
        read: false,
        message_type: 'system',
        metadata: { 
          type: 'deal_closure',
          deal_status: dealData.outcome,
          offer_id: currentOffer.id
        }
      };

      await createDocument('messages', messageData);

      // Create notification for the other party
      await createDocument('notifications', {
        recipient_id: recipientId,
        type: 'deal_closed',
        title: `Deal ${actionText}`,
        message: `The deal for this application has been ${actionText}.`,
        related_entity_id: currentOffer.id,
        related_entity_type: 'offer',
        application_id: selectedConversation.applicationId,
        read: false,
        sent_at: new Date().toISOString()
      });

      return offerUpdateData;
    },
    onSuccess: () => {
      setShowCloseDeal(false);
      setCloseDealForm({
        reason: '',
        outcome: 'completed',
        notes: ''
      });
      refetchMessages();
      refetchOffer();
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['offers'] });
      toast.success('Deal status updated successfully');
    },
    onError: (error: any) => {
      console.error('Error closing deal:', error);
      toast.error('Failed to update deal status');
    },
  });

  // Handle sending a message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    const recipientId = (user?.role === 'business' || user?.role === 'business_owner')
      ? selectedConversation.lenderId 
      : selectedConversation.businessId;

    sendMessageMutation.mutate({ 
      content: newMessage, 
      recipientId 
    });
  };

  // Document categories for requests
  const documentCategories = [
    'Financial Statements',
    'Bank Statements',
    'Tax Returns',
    'Business Registration',
    'Insurance Documents',
    'Asset Valuations',
    'Management Accounts',
    'Cash Flow Projections',
    'Credit Reports',
    'Legal Documents',
    'Compliance Certificates',
    'Other'
  ];

  // Handle document request submission
  const handleDocumentRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!documentRequestForm.title.trim()) {
      toast.error('Please enter a request title');
      return;
    }
    if (documentRequestForm.categories.length === 0 && documentRequestForm.customRequests.length === 0) {
      toast.error('Please select at least one document category or add a custom request');
      return;
    }
    documentRequestMutation.mutate(documentRequestForm);
  };

  // Toggle document category selection
  const toggleDocumentCategory = (category: string) => {
    setDocumentRequestForm(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  // Add custom document request
  const addCustomRequest = (request: string) => {
    if (request.trim() && !documentRequestForm.customRequests.includes(request.trim())) {
      setDocumentRequestForm(prev => ({
        ...prev,
        customRequests: [...prev.customRequests, request.trim()]
      }));
    }
  };

  // Handle file selection for sharing
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles: File[] = [];
    const errors: string[] = [];

    files.forEach(file => {
      const validation = validateFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        errors.push(`${file.name}: ${validation.message}`);
      }
    });

    if (errors.length > 0) {
      toast.error(`Some files were rejected:\n${errors.join('\n')}`);
    }

    setSelectedFiles(validFiles);
  };

  // Remove file from selection
  const removeFile = (index: number) => {
    setSelectedFiles(files => files.filter((_, i) => i !== index));
  };

  // Handle document sharing
  const handleDocumentShare = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one file to share');
      return;
    }
    setIsUploading(true);
    documentShareMutation.mutate();
  };

  // Handle deal closure
  const handleCloseDeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!closeDealForm.reason.trim()) {
      toast.error('Please provide a reason for closing the deal');
      return;
    }
    closeDealMutation.mutate(closeDealForm);
  };

  // Handle document download
  const handleDocumentDownload = async (document: SharedDocument) => {
    try {
      // Mark as downloaded
      await markDocumentAsDownloaded(document.id);
      
      // Create a temporary link to download the file
      const link = window.document.createElement('a');
      link.href = document.file_url;
      link.download = document.file_name;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      
      toast.success('Download started');
      refetchSharedDocuments();
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Failed to download document');
    }
  };

  // Remove custom document request
  const removeCustomRequest = (index: number) => {
    setDocumentRequestForm(prev => ({
      ...prev,
      customRequests: prev.customRequests.filter((_, i) => i !== index)
    }));
  };

  // Filter conversations based on search term with memoization
  const filteredConversations = useMemo(() => {
    return conversations?.filter(conv =>
      (conv.lenderName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (conv.businessName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (conv.applicationNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (conv.applicationPurpose || '').toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];
  }, [conversations, searchTerm]);

  if (!user) {
    return (
      <PageLayout>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
          <Card className="max-w-md mx-auto bg-white/95 backdrop-blur-sm border-slate-200/50 shadow-lg rounded-xl">
            <CardContent className="p-8 text-center">
              <div className="bg-gradient-to-br from-[#212936] to-[#2c3c53] rounded-full p-6 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-[#ff8000]" />
              </div>
              <h3 className="text-lg font-semibold text-[#212936] mb-2">Authentication Required</h3>
              <p className="text-slate-600">Please log in to access messages.</p>
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4 py-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  onClick={() => navigate(-1)}
                  className="flex items-center hover:bg-[#ff8000]/10"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <div>
                  <h1 className="text-3xl font-bold text-[#212936]">Messages</h1>
                  <p className="text-slate-600 mt-1">
                    Communicate with {(user.role === 'business' || user.role === 'business_owner') ? 'lenders' : 'businesses'} about your applications
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Chat Interface */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[80vh]">
            {/* Conversations List */}
            <div className="lg:col-span-3">
              <Card className="h-full flex flex-col bg-white/95 backdrop-blur-sm border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl">
                <CardHeader className="pb-3 bg-gradient-to-br from-[#212936] to-[#2c3c53] text-white rounded-t-xl">
                  <CardTitle className="flex items-center">
                    <MessageSquare className="mr-2 h-5 w-5 text-[#ff8000]" />
                    <span className="text-white">Conversations</span>
                  </CardTitle>
                  
                  {/* Search */}
                  <div className="relative mt-3">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search conversations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-300"
                    />
                  </div>
                </CardHeader>
                
                <CardContent className="flex-1 overflow-y-auto p-0">
                  {isLoadingConversations ? (
                    <div className="p-4 text-center text-slate-500">
                      Loading conversations...
                    </div>
                  ) : filteredConversations.length === 0 ? (
                    <div className="p-6 text-center text-slate-500">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                      <p className="text-sm font-medium">No conversations yet</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Conversations will appear here after offers are accepted
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredConversations.map((conversation) => (
                        <div
                          key={`${conversation.id}-${conversation.lastMessageTime?.getTime?.() || conversation.lastMessageTime}`}
                          className={`p-4 cursor-pointer border-l-4 transition-all duration-200 hover:bg-gradient-to-r hover:from-[#ff8000]/5 hover:to-transparent ${
                            selectedConversation?.id === conversation.id
                              ? 'bg-gradient-to-r from-[#ff8000]/10 to-[#ff8000]/5 border-[#ff8000] shadow-sm'
                              : 'border-transparent hover:border-[#ff8000]/30'
                          }`}
                          onClick={() => setSelectedConversation(conversation)}
                        >
                          <div className="flex items-start space-x-3">
                            <Avatar className="h-12 w-12 border-2 border-slate-200 shadow-sm">
                              <AvatarImage 
                                src={(user.role === 'business' || user.role === 'business_owner')
                                  ? conversation.lenderAvatar 
                                  : conversation.businessAvatar
                                } 
                                alt={`${(user.role === 'business' || user.role === 'business_owner') ? (conversation.lenderName || 'Lender') : (conversation.businessName || 'Business')} logo`}
                              />
                              <AvatarFallback className="bg-[#212936] text-white font-semibold">
                                {(user.role === 'business' || user.role === 'business_owner')
                                  ? (conversation.lenderName || 'L').charAt(0).toUpperCase()
                                  : (conversation.businessName || 'B').charAt(0).toUpperCase()
                                }
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex-1 min-w-0">
                                  {(user.role === 'business' || user.role === 'business_owner') && (
                                    <p className="text-xs text-slate-500 font-medium mb-0.5">LENDER</p>
                                  )}
                                  <h3 className="text-sm font-semibold text-[#212936] truncate">
                                    {(user.role === 'business' || user.role === 'business_owner')
                                      ? (conversation.lenderName || 'Lender') 
                                      : (conversation.businessName || 'Business')
                                    }
                                  </h3>
                                </div>
                                {conversation.unreadCount > 0 && (
                                  <Badge className="bg-[#ff8000] text-white text-xs px-2 py-0.5">
                                    {conversation.unreadCount}
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="flex items-center space-x-1 mb-2">
                                <Badge variant="outline" className="text-xs px-2 py-0.5 bg-slate-50 text-slate-600 border-slate-200">
                                  {conversation.applicationNumber}
                                </Badge>
                                <span className="text-xs text-slate-400">•</span>
                                <span className="text-xs font-semibold text-[#ff8000]">
                                  {formatCurrency(conversation.applicationAmount)}
                                </span>
                              </div>
                              
                              <p className="text-sm text-slate-600 truncate mb-1">
                                {conversation.lastMessage}
                              </p>
                              
                              <p className="text-xs text-slate-400">
                                {new Date(conversation.lastMessageTime).toLocaleDateString('en-GB', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Application Details & Documents Section */}
            <div className="lg:col-span-3">
              {selectedConversation ? (
                <div className="space-y-6 h-full">
                  {/* Application Details Card */}
                  <Card className="bg-white/95 backdrop-blur-sm border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center text-[#212936]">
                        <Building2 className="mr-2 h-5 w-5 text-[#ff8000]" />
                        Application
                      </CardTitle>
                      <div className="bg-[#ff8000]/10 px-2 py-1 rounded text-sm font-medium text-[#ff8000]">
                        {selectedConversation.applicationNumber}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">Amount:</span>
                          <span className="font-semibold text-[#212936]">{formatCurrency(selectedConversation.applicationAmount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">Term:</span>
                          <span className="font-semibold text-[#212936]">36 months</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">Purpose:</span>
                          <span className="font-semibold text-[#212936]">{selectedConversation.applicationPurpose}</span>
                        </div>
                      </div>
                      
                      <Button 
                        variant="outline" 
                        className="w-full mt-4 border-[#ff8000] text-[#ff8000] hover:bg-[#ff8000] hover:text-white"
                        onClick={() => {
                          if (user?.role === 'lender') {
                            // For lenders, navigate to business details page
                            navigate(`/business/${selectedConversation.applicationId}`);
                          } else {
                            // For businesses, navigate to specific offer details if available
                            if (currentOffer?.id) {
                              navigate(`/offers/${currentOffer.id}`);
                            } else {
                              // Fallback to offers page for this application
                              navigate(`/offers?application=${selectedConversation.applicationId}`);
                            }
                          }
                        }}
                      >
                        View Full Application
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Shared Documents Card */}
                  <Card className="bg-white/95 backdrop-blur-sm border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl flex-1 flex flex-col">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center justify-between text-[#212936]">
                        <div className="flex items-center">
                          <FileText className="mr-2 h-5 w-5 text-[#ff8000]" />
                          Shared Documents
                        </div>
                        <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                          {sharedDocuments?.length || 0}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto">
                      {sharedDocumentsError && (
                        <Alert className="mb-4">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Error loading documents: {sharedDocumentsError.message}
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      {!sharedDocuments || sharedDocuments.length === 0 ? (
                        <div className="text-center text-slate-500 py-4">
                          <FileText className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                          <p className="text-xs">No documents shared yet</p>
                          {process.env.NODE_ENV === 'development' && (
                            <p className="text-xs mt-2 text-slate-400">
                              Debug: Application ID - {selectedConversation?.applicationId}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {sharedDocuments.slice(0, 3).map((doc) => (
                            <div key={doc.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-[#212936] truncate">{doc.file_name}</p>
                                <div className="flex items-center space-x-1 text-xs text-slate-500">
                                  <span>{(doc.file_size / 1024 / 1024).toFixed(1)} MB</span>
                                  <span>•</span>
                                  <span>{new Date(doc.shared_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })}</span>
                                  <span>•</span>
                                  <span className="capitalize">{doc.status}</span>
                                </div>
                              </div>
                              <div className="flex space-x-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDocumentDownload(doc)}
                                  className="text-[#ff8000] hover:bg-[#ff8000]/10 h-6 w-6 p-0"
                                  title="Download document"
                                >
                                  <Download className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(doc.file_url, '_blank')}
                                  className="text-blue-600 hover:bg-blue-100 h-6 w-6 p-0"
                                  title="View document"
                                >
                                  <FileText className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                          {sharedDocuments.length > 3 && (
                            <p className="text-xs text-slate-400 text-center">
                              +{sharedDocuments.length - 3} more documents
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Document Requests Card */}
                  <Card className="bg-white/95 backdrop-blur-sm border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center justify-between text-[#212936]">
                        <div className="flex items-center">
                          <Clock className="mr-2 h-5 w-5 text-[#ff8000]" />
                          Document Requests
                        </div>
                        <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                          {informationRequests?.filter(req => req.status === 'pending').length || 0}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {!informationRequests || informationRequests.length === 0 ? (
                        <div className="text-center text-slate-500 py-4">
                          <Clock className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                          <p className="text-xs">No document requests</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {informationRequests.slice(0, 2).map((request) => (
                            <div key={request.id} className="p-2 bg-slate-50 rounded-lg">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-xs font-medium text-[#212936] truncate">{request.request_title}</p>
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs px-1 py-0 ${
                                    request.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                    request.status === 'fulfilled' ? 'bg-green-50 text-green-700 border-green-200' :
                                    'bg-red-50 text-red-700 border-red-200'
                                  }`}
                                >
                                  {request.status}
                                </Badge>
                              </div>
                              <div className="flex items-center space-x-1 text-xs text-slate-500">
                                <span className={`${
                                  request.urgency === 'high' ? 'text-red-600' :
                                  request.urgency === 'medium' ? 'text-yellow-600' :
                                  'text-green-600'
                                }`}>
                                  {request.urgency} priority
                                </span>
                                {request.due_date && (
                                  <>
                                    <span>•</span>
                                    <span>Due {new Date(request.due_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                          {informationRequests.length > 2 && (
                            <p className="text-xs text-slate-400 text-center">
                              +{informationRequests.length - 2} more requests
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Close Deal Button - Show only for accepted offers that haven't been closed */}
                  {currentOffer && currentOffer.status === 'accepted' && currentOffer.deal_status !== 'closed' && currentOffer.deal_status !== 'completed' && (
                    <Card className="bg-white/95 backdrop-blur-sm border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl">
                      <CardContent className="p-4">
                        <Button
                          onClick={() => setShowCloseDeal(true)}
                          className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-md transition-all duration-200"
                        >
                          <Handshake className="h-4 w-4 mr-2" />
                          Close Deal
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <Card className="bg-white/95 backdrop-blur-sm border-slate-200/50 shadow-lg rounded-xl p-8">
                    <div className="text-center text-slate-500">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                      <p className="text-sm">Select a conversation to view application details</p>
                    </div>
                  </Card>
                </div>
              )}
            </div>

            {/* Chat Area */}
            <div className="lg:col-span-6">
              {selectedConversation ? (
                <Card className="h-full flex flex-col bg-white/95 backdrop-blur-sm border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl">
                  {/* Chat Header */}
                  <CardHeader className="pb-3 border-b bg-gradient-to-br from-[#212936] to-[#2c3c53] text-white rounded-t-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-12 w-12 border-2 border-white/20">
                          <AvatarImage 
                            src={(user.role === 'business' || user.role === 'business_owner')
                              ? selectedConversation.lenderAvatar 
                              : selectedConversation.businessAvatar
                            } 
                            alt={`${(user.role === 'business' || user.role === 'business_owner') ? (selectedConversation.lenderName || 'Lender') : (selectedConversation.businessName || 'Business')} logo`}
                          />
                          <AvatarFallback className="bg-white/10 text-white font-semibold">
                            {(user.role === 'business' || user.role === 'business_owner')
                              ? (selectedConversation.lenderName || 'L').charAt(0).toUpperCase()
                              : (selectedConversation.businessName || 'B').charAt(0).toUpperCase()
                            }
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            {(user.role === 'business' || user.role === 'business_owner') && (
                              <Badge className="bg-[#ff8000]/20 text-[#ff8000] border-[#ff8000]/30 text-xs px-2 py-0.5 font-medium">
                                LENDER
                              </Badge>
                            )}
                            <h3 className="font-semibold text-lg text-white">
                              {(user.role === 'business' || user.role === 'business_owner')
                                ? (selectedConversation.lenderName || 'Lender') 
                                : (selectedConversation.businessName || 'Business')
                              }
                            </h3>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-200">
                            <span>Application {selectedConversation.applicationNumber}</span>
                            <span>•</span>
                            <span className="text-[#ff8000] font-medium">{selectedConversation.applicationPurpose}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-white/10 text-white border-white/20 text-sm px-3 py-1">
                          {formatCurrency(selectedConversation.applicationAmount)}
                        </Badge>
                        {selectedConversation.offerStatus && (
                          <Badge 
                            className={`text-sm px-3 py-1 ${
                              selectedConversation.offerStatus === 'accepted' 
                                ? 'bg-green-500/20 text-green-300 border-green-400/30' 
                                : 'bg-white/10 text-white border-white/20'
                            }`}
                          >
                            {selectedConversation.offerStatus}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  {/* Messages Area */}
                  <CardContent className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-br from-slate-50/50 to-white">
                    {showLoadingMessages ? (
                      <div className="text-center text-slate-500 py-8">
                        <div className="animate-spin h-8 w-8 border-2 border-[#ff8000] border-t-transparent rounded-full mx-auto mb-2"></div>
                        Loading messages...
                      </div>
                    ) : messages && messages.length > 0 ? (
                      messages.map((message) => (
                        <div
                          key={`${message.id}-${message.sent_at?.getTime?.() || message.sent_at}`}
                          className={`flex ${
                            message.sender_id === user.uid ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          {message.message_type === 'document_request' ? (
                            // Document Request Message
                            <div
                              className={`max-w-xs lg:max-w-md p-4 rounded-2xl shadow-sm border-l-4 ${
                                message.sender_id === user.uid
                                  ? 'bg-gradient-to-r from-[#ff8000]/10 to-[#ff9500]/10 border-l-[#ff8000] text-slate-900'
                                  : 'bg-blue-50 border-l-blue-400 text-slate-900'
                              }`}
                            >
                              <div className="flex items-start space-x-2 mb-2">
                                <FileText className="h-5 w-5 text-[#ff8000] mt-0.5" />
                                <div className="flex-1">
                                  <p className="text-sm font-semibold text-[#212936] mb-1">
                                    Document Request
                                  </p>
                                  <p className="text-sm leading-relaxed text-slate-700">{message.content}</p>
                                </div>
                              </div>
                              <p className="text-xs text-slate-500 mt-2">
                                {new Date(message.sent_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          ) : message.message_type === 'document_upload' ? (
                            // Document Upload Message
                            <div
                              className={`max-w-xs lg:max-w-md p-4 rounded-2xl shadow-sm border-l-4 ${
                                message.sender_id === user.uid
                                  ? 'bg-gradient-to-r from-green-100 to-green-50 border-l-green-500 text-slate-900'
                                  : 'bg-green-50 border-l-green-400 text-slate-900'
                              }`}
                            >
                              <div className="flex items-start space-x-2 mb-2">
                                <Paperclip className="h-5 w-5 text-green-600 mt-0.5" />
                                <div className="flex-1">
                                  <p className="text-sm font-semibold text-[#212936] mb-1">
                                    Documents Shared
                                  </p>
                                  <p className="text-sm leading-relaxed text-slate-700">{message.content}</p>
                                </div>
                              </div>
                              {message.metadata?.file_count && (
                                <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                                  {message.metadata.file_count} file{message.metadata.file_count === 1 ? '' : 's'}
                                </Badge>
                              )}
                              <p className="text-xs text-slate-500 mt-2">
                                {new Date(message.sent_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          ) : (
                            // Regular Text Message
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                                message.sender_id === user.uid
                                  ? 'bg-gradient-to-r from-[#ff8000] to-[#ff9500] text-white'
                                  : 'bg-white border border-slate-200 text-slate-900'
                              }`}
                            >
                              <p className="text-sm leading-relaxed">{message.content}</p>
                              <p
                                className={`text-xs mt-1.5 ${
                                  message.sender_id === user.uid ? 'text-orange-100' : 'text-slate-500'
                                }`}
                              >
                                {new Date(message.sent_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-slate-500 py-12">
                        <MessageSquare className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                        <h3 className="text-lg font-medium text-slate-600 mb-2">No messages yet</h3>
                        <p className="text-sm text-slate-400">Start the conversation by sending a message!</p>
                      </div>
                    )}
                  </CardContent>

                  {/* Message Input */}
                  <div className="border-t bg-white p-4 rounded-b-xl">
                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2 mb-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-[#ff8000] border-[#ff8000]/30 hover:bg-[#ff8000]/10 hover:border-[#ff8000] transition-all duration-200"
                        onClick={() => setShowDocumentShare(true)}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Share Documents
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-[#ff8000] border-[#ff8000]/30 hover:bg-[#ff8000]/10 hover:border-[#ff8000] transition-all duration-200"
                        onClick={() => setShowDocumentRequest(true)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Request Documents
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-[#ff8000] border-[#ff8000]/30 hover:bg-[#ff8000]/10 hover:border-[#ff8000] transition-all duration-200"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Offer Template
                      </Button>
                    </div>
                    
                    {/* Message Input */}
                    <form onSubmit={handleSendMessage} className="flex space-x-3">
                      <div className="relative flex-1">
                        <Input
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type your message..."
                          className="flex-1 border-slate-200 focus:border-[#ff8000] focus:ring-[#ff8000]/20 pr-10"
                          disabled={sendMessageMutation.isPending}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          <Paperclip className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button 
                        type="submit" 
                        disabled={!newMessage.trim() || sendMessageMutation.isPending}
                        className="bg-gradient-to-r from-[#ff8000] to-[#ff9500] hover:from-[#ff7000] hover:to-[#ff8500] shadow-md px-6"
                      >
                        {sendMessageMutation.isPending ? (
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </form>
                  </div>
                </Card>
              ) : (
                <Card className="h-full flex items-center justify-center bg-white/95 backdrop-blur-sm border-slate-200/50 shadow-lg rounded-xl">
                  <div className="text-center text-slate-500 py-12">
                    <div className="bg-gradient-to-br from-[#212936] to-[#2c3c53] rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                      <MessageSquare className="h-10 w-10 text-[#ff8000]" />
                    </div>
                    <h3 className="text-xl font-semibold text-[#212936] mb-2">Select a conversation</h3>
                    <p className="text-sm text-slate-400">Choose a conversation from the list to start messaging</p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Document Request Dialog */}
      <Dialog open={showDocumentRequest} onOpenChange={setShowDocumentRequest}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-sm border-slate-200/50 shadow-xl rounded-xl">
          <DialogHeader className="border-b border-slate-100 pb-4">
            <DialogTitle className="text-xl font-semibold text-[#212936] flex items-center">
              <Download className="h-5 w-5 mr-2 text-[#ff8000]" />
              Request Documents
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              Request specific documents from {user?.role === 'business' || user?.role === 'business_owner' 
                ? selectedConversation?.lenderName 
                : selectedConversation?.businessName}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleDocumentRequest} className="space-y-6 pt-4">
            {/* Request Title */}
            <div className="space-y-2">
              <Label htmlFor="request-title" className="text-sm font-medium text-[#212936]">
                Request Title *
              </Label>
              <Input
                id="request-title"
                value={documentRequestForm.title}
                onChange={(e) => setDocumentRequestForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Financial Documents for Loan Application"
                className="border-slate-200 focus:border-[#ff8000] focus:ring-[#ff8000]/20 bg-white"
                required
              />
            </div>

            {/* Request Message */}
            <div className="space-y-2">
              <Label htmlFor="request-message" className="text-sm font-medium text-[#212936]">
                Message
              </Label>
              <Textarea
                id="request-message"
                value={documentRequestForm.message}
                onChange={(e) => setDocumentRequestForm(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Please provide additional details about what you need..."
                className="border-slate-200 focus:border-[#ff8000] focus:ring-[#ff8000]/20 bg-white"
                rows={3}
              />
            </div>

            {/* Document Categories */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-[#212936]">
                Document Categories *
              </Label>
              <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                {documentCategories.map((category) => (
                  <div key={category} className="flex items-center space-x-2">
                    <Checkbox
                      id={`category-${category}`}
                      checked={documentRequestForm.categories.includes(category)}
                      onCheckedChange={() => toggleDocumentCategory(category)}
                      className="border-slate-300 data-[state=checked]:bg-[#ff8000] data-[state=checked]:border-[#ff8000]"
                    />
                    <Label 
                      htmlFor={`category-${category}`}
                      className="text-sm text-slate-700 cursor-pointer"
                    >
                      {category}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Requests */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-[#212936]">
                Custom Document Requests
              </Label>
              <div className="flex space-x-2">
                <Input
                  placeholder="Enter custom document request..."
                  className="flex-1 border-slate-200 focus:border-[#ff8000] focus:ring-[#ff8000]/20 bg-white"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomRequest(e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const input = document.querySelector('input[placeholder="Enter custom document request..."]') as HTMLInputElement;
                    if (input?.value) {
                      addCustomRequest(input.value);
                      input.value = '';
                    }
                  }}
                  className="text-[#ff8000] border-[#ff8000]/30 hover:bg-[#ff8000]/10 hover:border-[#ff8000] transition-all duration-200"
                >
                  Add
                </Button>
              </div>
              
              {/* Display Custom Requests */}
              {documentRequestForm.customRequests.length > 0 && (
                <div className="space-y-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  {documentRequestForm.customRequests.map((request, index) => (
                    <div key={index} className="flex items-center justify-between bg-white p-3 rounded-md border border-slate-200">
                      <span className="text-sm text-slate-700">{request}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCustomRequest(index)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 h-6 w-6 p-0"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Urgency and Due Date */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  Urgency
                </Label>
                <Select
                  value={documentRequestForm.urgency}
                  onValueChange={(value: 'low' | 'medium' | 'high') => 
                    setDocumentRequestForm(prev => ({ ...prev, urgency: value }))
                  }
                >
                  <SelectTrigger className="border-slate-200 focus:border-[#ff8000] focus:ring-[#ff8000]/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="due-date" className="text-sm font-medium text-slate-700">
                  Due Date (Optional)
                </Label>
                <Input
                  id="due-date"
                  type="date"
                  value={documentRequestForm.dueDate}
                  onChange={(e) => setDocumentRequestForm(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="border-slate-200 focus:border-[#ff8000] focus:ring-[#ff8000]/20"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDocumentRequest(false)}
                className="border-slate-200 text-slate-600 hover:bg-slate-50 px-6"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={documentRequestMutation.isPending}
                className="bg-gradient-to-r from-[#ff8000] to-[#ff9500] hover:from-[#ff7000] hover:to-[#ff8500] text-white shadow-md px-6"
              >
                {documentRequestMutation.isPending ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    <span>Sending...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Send className="h-4 w-4" />
                    <span>Send Request</span>
                  </div>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Close Deal Dialog */}
      <Dialog open={showCloseDeal} onOpenChange={setShowCloseDeal}>
        <DialogContent className="max-w-md bg-white border-slate-200">
          <DialogHeader className="pb-4 border-b border-slate-100">
            <DialogTitle className="text-xl font-semibold text-[#212936] flex items-center">
              <Handshake className="mr-2 h-5 w-5 text-green-600" />
              Close Deal
            </DialogTitle>
            <DialogDescription className="text-slate-600 mt-2">
              Mark this deal as completed or closed. This action will end the deal for this specific lender-business relationship.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCloseDeal} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">
                Deal Outcome
              </Label>
              <Select
                value={closeDealForm.outcome}
                onValueChange={(value: 'completed' | 'closed') => 
                  setCloseDealForm(prev => ({ ...prev, outcome: value }))
                }
              >
                <SelectTrigger className="border-slate-200 focus:border-green-600 focus:ring-green-600/20">
                  <SelectValue placeholder="Select outcome" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completed">Deal Completed Successfully</SelectItem>
                  <SelectItem value="closed">Deal Closed (Not Completed)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="close-reason" className="text-sm font-medium text-slate-700">
                Reason/Notes
              </Label>
              <Textarea
                id="close-reason"
                value={closeDealForm.reason}
                onChange={(e) => setCloseDealForm(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Please provide a reason for closing this deal..."
                className="border-slate-200 focus:border-green-600 focus:ring-green-600/20 min-h-[100px]"
                required
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCloseDeal(false)}
                className="border-slate-200 text-slate-600 hover:bg-slate-50 px-6"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={closeDealMutation.isPending || !closeDealForm.reason.trim()}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-md px-6"
              >
                {closeDealMutation.isPending ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    <span>Closing...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Handshake className="h-4 w-4" />
                    <span>Close Deal</span>
                  </div>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Document Share Dialog */}
      <Dialog open={showDocumentShare} onOpenChange={setShowDocumentShare}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white border-slate-200">
          <DialogHeader className="pb-4 border-b border-slate-100">
            <DialogTitle className="text-xl font-semibold text-[#212936] flex items-center">
              <FileText className="mr-2 h-5 w-5 text-[#ff8000]" />
              Share Documents
            </DialogTitle>
            <DialogDescription className="text-slate-600 mt-2">
              Share documents with {user?.role === 'business' || user?.role === 'business_owner' 
                ? selectedConversation?.lenderName 
                : selectedConversation?.businessName}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleDocumentShare} className="space-y-6 pt-6">
            {/* File Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-[#212936]">
                Select Files *
              </Label>
              <div className="border-2 border-dashed border-[#ff8000]/30 rounded-lg p-8 text-center hover:border-[#ff8000]/50 transition-all duration-200 bg-gradient-to-br from-[#ff8000]/5 to-white hover:from-[#ff8000]/10 hover:to-white group">
                <input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                  accept=".pdf,.csv,.xls,.xlsx,.doc,.docx,.jpg,.jpeg,.png,.tiff"
                />
                <label htmlFor="file-upload" className="cursor-pointer block">
                  <div className="bg-gradient-to-br from-[#ff8000]/10 to-[#ff8000]/5 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center group-hover:from-[#ff8000]/20 group-hover:to-[#ff8000]/10 transition-all duration-200">
                    <Paperclip className="h-8 w-8 text-[#ff8000] group-hover:scale-110 transition-transform duration-200" />
                  </div>
                  <p className="text-sm font-medium text-[#212936] mb-2 group-hover:text-[#ff8000] transition-colors duration-200">
                    Click to select files or drag and drop
                  </p>
                  <p className="text-xs text-slate-500">
                    PDF, Excel, Word, CSV, or Image files (max 20MB each)
                  </p>
                </label>
              </div>

              {/* Selected Files */}
              {selectedFiles.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-[#212936]">
                    Selected Files ({selectedFiles.length})
                  </Label>
                  <div className="space-y-2 max-h-32 overflow-y-auto bg-slate-50 rounded-lg p-3">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-white p-3 rounded-md border border-slate-200 shadow-sm">
                        <div className="flex-1 flex items-center space-x-3">
                          <div className="bg-[#ff8000]/10 rounded p-2">
                            <FileText className="h-4 w-4 text-[#ff8000]" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[#212936] truncate">{file.name}</p>
                            <p className="text-xs text-slate-500">
                              {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type.split('/')[1]?.toUpperCase() || 'FILE'}
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 ml-2"
                        >
                          <span className="text-lg">×</span>
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="share-description" className="text-sm font-medium text-[#212936]">
                Description (Optional)
              </Label>
              <Textarea
                id="share-description"
                value={shareDescription}
                onChange={(e) => setShareDescription(e.target.value)}
                placeholder="Add a description for the shared documents..."
                className="border-slate-200 focus:border-[#ff8000] focus:ring-[#ff8000]/20 bg-white"
                rows={3}
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#212936]">
                Category
              </Label>
              <Select value={shareCategory} onValueChange={setShareCategory}>
                <SelectTrigger className="border-slate-200 focus:border-[#ff8000] focus:ring-[#ff8000]/20 bg-white">
                  <SelectValue placeholder="Select a category (optional)" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200">
                  {documentCategories.map((category) => (
                    <SelectItem key={category} value={category} className="hover:bg-[#ff8000]/10">
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowDocumentShare(false);
                  setSelectedFiles([]);
                  setShareDescription('');
                  setShareCategory('');
                }}
                className="border-slate-200 text-slate-600 hover:bg-slate-50 px-6"
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={selectedFiles.length === 0 || isUploading || documentShareMutation.isPending}
                className="bg-gradient-to-r from-[#ff8000] to-[#ff9500] hover:from-[#ff7000] hover:to-[#ff8500] text-white shadow-md px-6"
              >
                {isUploading || documentShareMutation.isPending ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    <span>Uploading...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span>Share {selectedFiles.length} Document{selectedFiles.length === 1 ? '' : 's'}</span>
                  </div>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
};

export default MessagesPage;
