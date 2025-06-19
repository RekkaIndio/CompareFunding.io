import { mailgunService } from '@/services/mailgunService';

/**
 * Test function for lender prospect notification email
 * This demonstrates the email notification flow without PDF complexity
 */
export async function testLenderProspectNotification() {
  console.log('🚀 Testing Lender Prospect Notification Email...');

  // Mock application data (similar to what would come from LenderMarketplace)
  const mockApplication = {
    id: 'test-app-123',
    application_number: 'APP-TEST-001',
    business_name: 'Test Business Ltd',
    product_type: 'invoice_finance',
    loan_amount: 150000,
    loan_term_months: 12,
    purpose: 'Cash flow support',
    industry: 'Manufacturing',
    years_trading: 5,
    annual_revenue: 500000,
    company_number: 'TEST123456',
    status: 'active'
  };

  // Mock lender data
  const mockLender = {
    id: 'test-lender-123',
    lender_name: 'Test Funding Solutions',
    company_name: 'Test Funding Solutions Ltd',
    email: 'jamie@comparefunding.io', // Use a test email
    logo_url: null,
    established_year: 2015
  };

  try {
    console.log('� Sending lender prospect notification email...');

    // Prepare email data
    const emailData = {
      lenderName: mockLender.lender_name,
      lenderEmail: mockLender.email,
      businessName: mockApplication.business_name,
      applicationNumber: mockApplication.application_number,
      productType: mockApplication.product_type,
      loanAmount: mockApplication.loan_amount,
      annualRevenue: mockApplication.annual_revenue,
      yearsTrading: mockApplication.years_trading,
      industry: mockApplication.industry,
      connectionUrl: 'https://comparefunding.io/lender/connections',
      businessDetailUrl: `https://comparefunding.io/lender/business-details/${mockApplication.id}`
    };

    // Import and send the email
    const { mailgunService } = await import('@/services/mailgunService');
    const result = await mailgunService.sendLenderProspectNotificationEmail(emailData);

    if (result.success) {
      console.log('✅ Email sent successfully!');
      console.log('📧 Email details:', {
        to: mockLender.email,
        subject: `🎯 New Prospect: ${mockApplication.business_name} - £${mockApplication.loan_amount.toLocaleString()} ${mockApplication.product_type}`,
        lenderName: mockLender.lender_name,
        businessName: mockApplication.business_name
      });
      return { success: true, result };
    } else {
      console.error('❌ Email sending failed:', result.error);
      return { success: false, error: result.error, helpMessage: result.helpMessage };
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return { success: false, error };
  }
}

/**
 * Simple test without PDF to verify basic email functionality
 */
export async function testLenderNotificationWithoutPDF() {
  console.log('🚀 Testing Lender Notification Email (without PDF)...');

  const emailData = {
    lenderName: 'Test Funding Solutions',
    lenderEmail: 'jamie@comparefunding.io',
    businessName: 'Sample Business Ltd',
    applicationNumber: 'APP-SIMPLE-001',
    productType: 'Business Loan',
    loanAmount: 100000,
    annualRevenue: 350000,
    yearsTrading: 3,
    industry: 'Retail',
    connectionUrl: 'https://comparefunding.io/lender/connections',
    businessDetailUrl: 'https://comparefunding.io/lender/business-details/test-123'
  };

  try {
    const result = await mailgunService.sendLenderProspectNotificationEmail(emailData);
    
    if (result.success) {
      console.log('✅ Simple email test successful!');
      return { success: true, result };
    } else {
      console.error('❌ Simple email test failed:', result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('❌ Simple email test failed with error:', error);
    return { success: false, error };
  }
}

// Export for easy testing
export default {
  testLenderProspectNotification,
  testLenderNotificationWithoutPDF
};
