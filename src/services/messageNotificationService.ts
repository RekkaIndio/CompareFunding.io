import { getDocument } from '@/firebase';
import { mailgunService } from '@/services/mailgunService';

export interface MessageNotificationData {
  senderId: string;
  recipientId: string;
  senderRole: 'business' | 'lender';
  applicationId: string;
  messageContent: string;
  messagesUrl?: string;
  applicationData?: {
    application_number: string;
    purpose: string;
    loan_amount: number;
    business_name: string;
  };
}

/**
 * Send email notification when a new message is sent between business and lender
 */
export const sendMessageNotification = async (data: MessageNotificationData): Promise<{ success: boolean; error?: any }> => {
  try {
    console.log('📧 Sending message notification:', {
      senderId: data.senderId,
      recipientId: data.recipientId,
      senderRole: data.senderRole,
      applicationId: data.applicationId
    });

    // Get application data if not provided
    let applicationData = data.applicationData;
    if (!applicationData) {
      const { data: application, error: appError } = await getDocument('applications', data.applicationId);
      if (appError || !application) {
        console.error('Error fetching application data:', appError);
        return { success: false, error: 'Failed to fetch application data' };
      }
      applicationData = {
        application_number: application.application_number || 'N/A',
        purpose: application.purpose || 'Business Funding',
        loan_amount: application.loan_amount || 0,
        business_name: application.business_name || 'Business'
      };
    }

    // Get sender and recipient details
    const [senderProfile, recipientProfile] = await Promise.all([
      getSenderProfile(data.senderId, data.senderRole),
      getRecipientProfile(data.recipientId, data.senderRole === 'business' ? 'lender' : 'business')
    ]);

    if (!senderProfile || !recipientProfile) {
      console.error('Failed to fetch sender or recipient profile');
      return { success: false, error: 'Failed to fetch user profiles' };
    }

    // Prepare message preview (truncate if necessary)
    const messagePreview = data.messageContent.length > 150 
      ? data.messageContent.substring(0, 150) + '...'
      : data.messageContent;

    // Send appropriate notification based on recipient role
    if (data.senderRole === 'business') {
      // Business sent message to lender
      const emailData = {
        to: recipientProfile.email,
        lenderName: recipientProfile.company_name || recipientProfile.lender_name || 'Lender',
        lenderContactName: recipientProfile.first_name || recipientProfile.contact_name || 'Valued Partner',
        businessName: applicationData.business_name,
        applicationNumber: applicationData.application_number,
        applicationPurpose: applicationData.purpose,
        applicationAmount: applicationData.loan_amount,
        messagePreview,
        messagesUrl: data.messagesUrl || 'https://comparefunding.io/messages'
      };

      const result = await mailgunService.sendNewMessageNotificationLender(emailData);
      return result;
      
    } else {
      // Lender sent message to business
      const emailData = {
        to: recipientProfile.email,
        businessName: applicationData.business_name,
        businessOwnerName: recipientProfile.first_name || recipientProfile.business_owner || 'Business Owner',
        lenderName: senderProfile.company_name || senderProfile.lender_name || 'Lender',
        applicationNumber: applicationData.application_number,
        applicationPurpose: applicationData.purpose,
        applicationAmount: applicationData.loan_amount,
        messagePreview,
        messagesUrl: data.messagesUrl || 'https://comparefunding.io/messages'
      };

      const result = await mailgunService.sendNewMessageNotificationBusiness(emailData);
      return result;
    }

  } catch (error: any) {
    console.error('Error sending message notification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get sender profile based on role
 */
const getSenderProfile = async (senderId: string, senderRole: 'business' | 'lender') => {
  try {
    if (senderRole === 'business') {
      // Try business profile first, fallback to user profile
      const { data: businessProfile } = await getDocument('businesses', senderId);
      if (businessProfile) return businessProfile;
      
      const { data: userProfile } = await getDocument('users', senderId);
      return userProfile;
    } else {
      // Try lender profile first, fallback to user profile
      const { data: lenderProfile } = await getDocument('lender_profiles', senderId);
      if (lenderProfile) return lenderProfile;
      
      const { data: userProfile } = await getDocument('users', senderId);
      return userProfile;
    }
  } catch (error) {
    console.error('Error fetching sender profile:', error);
    return null;
  }
};

/**
 * Get recipient profile based on role
 */
const getRecipientProfile = async (recipientId: string, recipientRole: 'business' | 'lender') => {
  try {
    if (recipientRole === 'business') {
      // Try business profile first, fallback to user profile
      const { data: businessProfile } = await getDocument('businesses', recipientId);
      if (businessProfile) return businessProfile;
      
      const { data: userProfile } = await getDocument('users', recipientId);
      return userProfile;
    } else {
      // Try lender profile first, fallback to user profile
      const { data: lenderProfile } = await getDocument('lender_profiles', recipientId);
      if (lenderProfile) return lenderProfile;
      
      const { data: userProfile } = await getDocument('users', recipientId);
      return userProfile;
    }
  } catch (error) {
    console.error('Error fetching recipient profile:', error);
    return null;
  }
};

export default { sendMessageNotification };
