import { toast } from 'sonner';
import { updateDocument, createDocument, deleteDocument, serverTimestamp } from '@/firebase';
import { useQueryClient } from '@tanstack/react-query';
import { Offer } from './types';
import { formatCurrency } from './utils';
import { cleanupDeclinedOffers } from '@/utils/cleanupDeclinedOffers';

/**
 * IMPORTANT: If you're seeing declined offers still appearing after implementing this change,
 * you may need to clean up existing declined offers from the database.
 * 
 * To do this, you can run the cleanup utility:
 * 
 * import { cleanupDeclinedOffers } from '@/utils/cleanupDeclinedOffers';
 * 
 * // Call this once to remove existing declined offers
 * cleanupDeclinedOffers().then(result => {
 *   console.log('Cleanup result:', result);
 * });
 */

export const useOfferActions = (user: any) => {
  const queryClient = useQueryClient();
  
  // Accept offer handler
  const handleAcceptOffer = async (offer: Offer) => {
    try {
      if (!offer.id || !offer.application_id) {
        toast.error('Missing required information');
        return;
      }
      
      // Update offer status with detailed information
      const { error: offerError } = await updateDocument('offers', offer.id, { 
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
          accepted_offer_id: offer.id,
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
        related_entity_id: offer.id,
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
          sender_id: user?.uid,
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
      
      // Invalidate relevant queries to refresh data smoothly
      queryClient.invalidateQueries({ queryKey: ['offer'] });
      queryClient.invalidateQueries({ queryKey: ['offers'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      
    } catch (err) {
      console.error('Error accepting offer:', err);
      toast.error('Failed to accept offer');
    }
  };

  // Decline offer handler - removes the offer completely from the application
  const handleDeclineOffer = async (offer: Offer, declineReason: string) => {
    try {
      if (!offer?.id) {
        toast.error('Missing offer ID');
        return;
      }
      
      // Store offer details for notification before deletion
      const offerAmount = offer.offered_amount;
      const lenderId = offer.lender_id;
      const applicationId = offer.application_id;
      
      // Delete the offer completely instead of just marking as declined
      const { error } = await deleteDocument('offers', offer.id);
      
      if (error) throw error;
      
      // Create notification for the lender
      await createDocument('notifications', {
        recipient_id: lenderId,
        type: 'offer_declined',
        title: 'Offer Declined',
        message: `Your offer for ${formatCurrency(offerAmount)} has been declined and removed by the business.`,
        related_entity_id: offer.id,
        related_entity_type: 'offer',
        application_id: applicationId,
        decline_reason: declineReason || 'No reason provided',
        read: false,
        sent_at: new Date().toISOString()
      });
      
      toast.success('Offer declined and removed. The lender has been notified.');
      
      // Invalidate relevant queries to refresh data smoothly
      queryClient.invalidateQueries({ queryKey: ['offer'] });
      queryClient.invalidateQueries({ queryKey: ['offers'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      
    } catch (err) {
      console.error('Error declining offer:', err);
      toast.error('Failed to decline offer');
    }
  };

  return {
    handleAcceptOffer,
    handleDeclineOffer
  };
};
