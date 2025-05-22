import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getDocument, getDocuments, createDocument, getLenderApplications } from '@/firebase';
import { toast } from 'sonner';
import PageLayout from '@/components/PageLayout';
import { useAuth } from '@/contexts/AuthContext';

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
            // You can add any logic here if you want to do something when businessId exists
            // For now, just return the offer with the application data
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
    <PageLayout showSidebar={true}>
      <div className="container py-8">
        <div className="flex items-center gap-4 mb-6">
        </div>
      </div>
    </PageLayout>
  );
};

export default LenderDashboard;
