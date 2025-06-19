import { mailgunService } from './mailgunService';

export interface EmailDebugInfo {
  isSandboxDomain: boolean;
  domain: string;
  potentialIssues: string[];
  recommendations: string[];
  recipientStatus?: string;
}

export interface EmailDeliveryTest {
  apiTest: {
    success: boolean;
    message: string;
    details?: any;
  };
  configTest: {
    success: boolean;
    message: string;
    details?: any;
  };
  debugInfo: EmailDebugInfo;
}

class EmailDebugger {
  /**
   * Run comprehensive email delivery diagnostic
   */
  async diagnoseEmailDelivery(recipientEmail: string): Promise<EmailDeliveryTest> {
    console.log('🔍 Starting email delivery diagnosis...');
    
    const result: EmailDeliveryTest = {
      apiTest: { success: false, message: '' },
      configTest: { success: false, message: '' },
      debugInfo: this.getDebugInfo()
    };

    // Test configuration
    result.configTest = this.testConfiguration();
    
    // Test API connectivity
    result.apiTest = await this.testApiDelivery(recipientEmail);

    // Update debug info with recipient-specific information
    result.debugInfo = this.getDebugInfo(recipientEmail);

    this.logDiagnosisResults(result);
    
    return result;
  }

  /**
   * Test Mailgun configuration
   */
  private testConfiguration(): { success: boolean; message: string; details?: any } {
    const status = mailgunService.getStatus();
    
    if (!status.configured) {
      return {
        success: false,
        message: 'Mailgun is not properly configured',
        details: status
      };
    }

    return {
      success: true,
      message: 'Mailgun configuration is valid',
      details: status
    };
  }

  /**
   * Test actual email delivery via API
   */
  private async testApiDelivery(recipientEmail: string): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      const result = await mailgunService.sendTestEmail(recipientEmail);
      
      if (result.success) {
        return {
          success: true,
          message: 'Email API call succeeded',
          details: result.data
        };
      } else {
        return {
          success: false,
          message: 'Email API call failed',
          details: result.error
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Email API call threw an exception',
        details: error
      };
    }
  }

  /**
   * Get debug information about the current setup
   */
  private getDebugInfo(recipientEmail?: string): EmailDebugInfo {
    // Get the domain from the mailgun service (this requires accessing private property)
    const domain = 'sandboxf2f0c984027c49578c790323dcaa3174.mailgun.org'; // Known from code
    const isSandboxDomain = domain.includes('sandbox') || domain.includes('mailgun.org');
    
    const potentialIssues: string[] = [];
    const recommendations: string[] = [];

    if (isSandboxDomain) {
      potentialIssues.push('Using Mailgun sandbox domain - restricted delivery');
      potentialIssues.push('Emails only delivered to authorized recipients');
      
      recommendations.push('Add recipient email to Mailgun Authorized Recipients list');
      recommendations.push('Or upgrade to a verified custom domain for unrestricted delivery');
    }

    if (recipientEmail && !this.isLikelyAuthorizedRecipient(recipientEmail)) {
      potentialIssues.push(`Recipient ${recipientEmail} may not be authorized for sandbox delivery`);
    }

    return {
      isSandboxDomain,
      domain,
      potentialIssues,
      recommendations,
      recipientStatus: recipientEmail ? this.getRecipientStatus(recipientEmail) : undefined
    };
  }

  /**
   * Check if an email is likely to be an authorized recipient
   */
  private isLikelyAuthorizedRecipient(email: string): boolean {
    // Common patterns for authorized recipients
    const authorizedPatterns = [
      /.*@comparefunding\.io$/,
      /.*@mailgun\.org$/,
      /.*test.*@.*$/,
      /.*demo.*@.*$/
    ];

    return authorizedPatterns.some(pattern => pattern.test(email.toLowerCase()));
  }

  /**
   * Get recipient status for debugging
   */
  private getRecipientStatus(email: string): string {
    if (this.isLikelyAuthorizedRecipient(email)) {
      return 'Likely authorized recipient';
    } else {
      return 'May need to be added to authorized recipients';
    }
  }

  /**
   * Log diagnosis results in a user-friendly format
   */
  private logDiagnosisResults(result: EmailDeliveryTest): void {
    console.log('\n📊 EMAIL DELIVERY DIAGNOSIS RESULTS');
    console.log('=====================================');
    
    // Configuration Test
    console.log(`\n🔧 Configuration Test: ${result.configTest.success ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   ${result.configTest.message}`);
    
    // API Test
    console.log(`\n📡 API Delivery Test: ${result.apiTest.success ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   ${result.apiTest.message}`);
    
    // Debug Info
    console.log('\n🔍 Debug Information:');
    console.log(`   Domain: ${result.debugInfo.domain}`);
    console.log(`   Sandbox Domain: ${result.debugInfo.isSandboxDomain ? 'YES' : 'NO'}`);
    
    if (result.debugInfo.recipientStatus) {
      console.log(`   Recipient Status: ${result.debugInfo.recipientStatus}`);
    }
    
    // Issues
    if (result.debugInfo.potentialIssues.length > 0) {
      console.log('\n⚠️  Potential Issues:');
      result.debugInfo.potentialIssues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
    }
    
    // Recommendations
    if (result.debugInfo.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      result.debugInfo.recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
    }
    
    // Final verdict
    if (result.debugInfo.isSandboxDomain) {
      console.log('\n🏖️  SANDBOX DOMAIN DETECTED');
      console.log('   If emails are not arriving in your inbox, you need to:');
      console.log('   1. Log into your Mailgun dashboard');
      console.log('   2. Go to Sending > Authorized Recipients');
      console.log('   3. Add the recipient email address');
      console.log('   4. Or upgrade to a verified custom domain');
    }
    
    console.log('\n=====================================\n');
  }

  /**
   * Quick test for a specific email address
   */
  async quickTest(recipientEmail: string): Promise<boolean> {
    console.log(`🚀 Quick email test to: ${recipientEmail}`);
    
    try {
      const result = await mailgunService.sendTestEmail(recipientEmail);
      
      if (result.success) {
        console.log('✅ Email sent successfully!');
        
        if (this.getDebugInfo(recipientEmail).isSandboxDomain) {
          console.log('⚠️  Note: Using sandbox domain. Check authorized recipients if email doesn\'t arrive.');
        }
        
        return true;
      } else {
        console.log('❌ Email failed to send:', result.error?.message || 'Unknown error');
        return false;
      }
    } catch (error) {
      console.log('❌ Email test threw an error:', error);
      return false;
    }
  }

  /**
   * Get step-by-step instructions for fixing delivery issues
   */
  getDeliveryInstructions(): string[] {
    return [
      '1. 🔍 Check your spam/junk folder first',
      '2. 📧 Verify the recipient email address is correct',
      '3. 🏖️  For sandbox domains: Add recipient to Mailgun Authorized Recipients',
      '4. 🌐 For production: Use a verified custom domain',
      '5. ⏱️  Allow 5-10 minutes for delivery',
      '6. 📊 Check Mailgun logs in the dashboard for delivery status'
    ];
  }
}

export const emailDebugger = new EmailDebugger();
export default emailDebugger;
