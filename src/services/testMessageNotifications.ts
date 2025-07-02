import { sendMessageNotification } from '@/services/messageNotificationService';

/**
 * Test function to verify message notification email functionality
 */
export const testMessageNotifications = async () => {
  console.log('🧪 Testing message notification emails...');

  // Test business to lender notification
  const businessToLenderTest = {
    senderId: 'test-business-id',
    recipientId: 'test-lender-id',
    senderRole: 'business' as const,
    applicationId: 'test-application-id',
    messageContent: 'Hello, I have some questions about the funding terms you proposed. Could we schedule a call to discuss?',
    messagesUrl: 'https://comparefunding.io/messages',
    applicationData: {
      application_number: 'APP-TEST-001',
      purpose: 'Business Expansion',
      loan_amount: 150000,
      business_name: 'Test Business Ltd'
    }
  };

  // Test lender to business notification
  const lenderToBusinessTest = {
    senderId: 'test-lender-id',
    recipientId: 'test-business-id',
    senderRole: 'lender' as const,
    applicationId: 'test-application-id',
    messageContent: 'Thank you for your application. We have reviewed your documents and would like to proceed with an offer. Please find the detailed terms attached.',
    messagesUrl: 'https://comparefunding.io/messages',
    applicationData: {
      application_number: 'APP-TEST-001',
      purpose: 'Business Expansion',
      loan_amount: 150000,
      business_name: 'Test Business Ltd'
    }
  };

  try {
    console.log('📧 Testing business to lender notification...');
    const businessResult = await sendMessageNotification(businessToLenderTest);
    
    if (businessResult.success) {
      console.log('✅ Business to lender notification test passed');
    } else {
      console.error('❌ Business to lender notification test failed:', businessResult.error);
    }

    console.log('📧 Testing lender to business notification...');
    const lenderResult = await sendMessageNotification(lenderToBusinessTest);
    
    if (lenderResult.success) {
      console.log('✅ Lender to business notification test passed');
    } else {
      console.error('❌ Lender to business notification test failed:', lenderResult.error);
    }

    console.log('🎉 Message notification tests completed!');
    
    return {
      businessToLender: businessResult.success,
      lenderToBusiness: lenderResult.success,
      overall: businessResult.success && lenderResult.success
    };

  } catch (error) {
    console.error('💥 Message notification test suite failed:', error);
    return {
      businessToLender: false,
      lenderToBusiness: false,
      overall: false,
      error: error.message
    };
  }
};

/**
 * Simple test to verify email templates are working
 */
export const testEmailTemplates = () => {
  console.log('🧪 Testing email templates...');
  
  try {
    const { EmailTemplates } = require('@/services/emailTemplates');
    
    // Test business notification template
    const businessTemplate = EmailTemplates.getNewMessageNotificationBusinessEmail({
      businessName: 'Test Business Ltd',
      businessOwnerName: 'John Smith',
      lenderName: 'Test Funding Solutions',
      applicationNumber: 'APP-TEST-001',
      applicationPurpose: 'Business Expansion',
      applicationAmount: 150000,
      messagePreview: 'Thank you for your application. We have reviewed your documents...',
      messagesUrl: 'https://comparefunding.io/messages'
    });

    // Test lender notification template
    const lenderTemplate = EmailTemplates.getNewMessageNotificationLenderEmail({
      lenderName: 'Test Funding Solutions',
      lenderContactName: 'Jane Doe',
      businessName: 'Test Business Ltd',
      applicationNumber: 'APP-TEST-001',
      applicationPurpose: 'Business Expansion',
      applicationAmount: 150000,
      messagePreview: 'Hello, I have some questions about the funding terms...',
      messagesUrl: 'https://comparefunding.io/messages'
    });

    console.log('✅ Business notification template:', {
      subject: businessTemplate.subject,
      hasHtml: !!businessTemplate.html,
      hasText: !!businessTemplate.text
    });

    console.log('✅ Lender notification template:', {
      subject: lenderTemplate.subject,
      hasHtml: !!lenderTemplate.html,
      hasText: !!lenderTemplate.text
    });

    console.log('🎉 Email template tests completed successfully!');
    return true;

  } catch (error) {
    console.error('💥 Email template test failed:', error);
    return false;
  }
};

export default {
  testMessageNotifications,
  testEmailTemplates
};
