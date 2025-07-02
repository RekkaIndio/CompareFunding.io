import FormData from "form-data";
import Mailgun from "mailgun.js";
import EmailTemplates, { EmailTemplateData } from "./emailTemplates";

// Interface for email options
interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
}

class MailgunService {
  private mg: any;
  private domain: string;
  private defaultFrom: string;

  constructor() {
    const mailgun = new Mailgun(FormData);
    
    // Initialize Mailgun client
    this.mg = mailgun.client({
      username: "api",
      key: import.meta.env.VITE_MAILGUN_API_KEY || "",
      // If you have an EU domain, uncomment the line below:
      // url: "https://api.eu.mailgun.net"
    });

    // Set your Mailgun domain (you'll need to update this with your actual domain)
    this.domain = "sandboxf2f0c984027c49578c790323dcaa3174.mailgun.org";
    this.defaultFrom = `Compare Funding <noreply@comparefunding.io>`;
  }

  /**
   * Send a simple test email
   */
  async sendTestEmail(to: string = "jamie@comparefunding.io"): Promise<any> {
    try {
      const data = await this.mg.messages.create(this.domain, {
        from: this.defaultFrom,
        to: [to],
        subject: "Test Email from Compare Funding",
        text: "Congratulations! You just sent a test email with Mailgun from Compare Funding. The integration is working correctly!",
        html: `
          <h2>🎉 Test Email Successful!</h2>
          <p>Congratulations! You just sent a test email with Mailgun from Compare Funding.</p>
          <p><strong>The integration is working correctly!</strong></p>
          <hr>
          <p><small>This is a test email sent from the Compare Funding application.</small></p>
        `
      });

      console.log("✅ Email sent successfully:", data);
      return { success: true, data };
    } catch (error: any) {
      console.error("❌ Error sending email:", error);
      return this.handleEmailError(error);
    }
  }

  /**
   * Send a custom email
   */
  async sendEmail(options: EmailOptions): Promise<any> {
    try {
      const emailData = {
        from: options.from || this.defaultFrom,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        ...(options.text && { text: options.text }),
        ...(options.html && { html: options.html })
      };

      const data = await this.mg.messages.create(this.domain, emailData);
      
      console.log("✅ Email sent successfully:", data);
      return { success: true, data };
    } catch (error: any) {
      console.error("❌ Error sending email:", error);
      return this.handleEmailError(error);
    }
  }

  /**
   * Send welcome email to new users
   */
  async sendWelcomeEmail(data: {
    to: string;
    firstName: string;
    role: 'business' | 'lender';
    loginUrl?: string;
  }): Promise<any> {
    try {
      const template = EmailTemplates.getWelcomeEmail({
        firstName: data.firstName,
        role: data.role,
        loginUrl: data.loginUrl
      });

      const emailData = {
        from: this.defaultFrom,
        to: [data.to],
        subject: template.subject,
        html: template.html,
        text: template.text
      };

      const result = await this.mg.messages.create(this.domain, emailData);
      console.log("✅ Welcome email sent successfully:", result);
      return { success: true, data: result };
    } catch (error: any) {
      console.error("❌ Error sending welcome email:", error);
      return this.handleEmailError(error);
    }
  }

  /**
   * Send application submitted confirmation email
   */
  async sendApplicationSubmittedEmail(data: {
    to: string;
    firstName: string;
    businessName: string;
    applicationNumber: string;
    loanAmount: number;
    dashboardUrl?: string;
  }): Promise<any> {
    try {
      const template = EmailTemplates.getApplicationSubmittedEmail(data);

      const emailData = {
        from: this.defaultFrom,
        to: [data.to],
        subject: template.subject,
        html: template.html,
        text: template.text
      };

      const result = await this.mg.messages.create(this.domain, emailData);
      console.log("✅ Application submitted email sent successfully:", result);
      return { success: true, data: result };
    } catch (error: any) {
      console.error("❌ Error sending application submitted email:", error);
      return this.handleEmailError(error);
    }
  }

  /**
   * Send new offer received notification email
   */
  async sendOfferReceivedEmail(data: {
    to: string;
    firstName: string;
    businessName: string;
    lenderName: string;
    offerAmount: number;
    interestRate: number;
    termMonths: number;
    offerUrl?: string;
  }): Promise<any> {
    try {
      const template = EmailTemplates.getOfferReceivedEmail(data);

      const emailData = {
        from: this.defaultFrom,
        to: [data.to],
        subject: template.subject,
        html: template.html,
        text: template.text
      };

      const result = await this.mg.messages.create(this.domain, emailData);
      console.log("✅ Offer received email sent successfully:", result);
      return { success: true, data: result };
    } catch (error: any) {
      console.error("❌ Error sending offer received email:", error);
      return this.handleEmailError(error);
    }
  }

  /**
   * Send document upload invitation email
   */
  async sendDocumentInvitationEmail(data: {
    to: string;
    colleagueName?: string;
    businessName: string;
    inviterName: string;
    uploadUrl: string;
    message?: string;
  }): Promise<any> {
    try {
      const template = EmailTemplates.getDocumentInvitationEmail(data);

      const emailData = {
        from: this.defaultFrom,
        to: [data.to],
        subject: template.subject,
        html: template.html,
        text: template.text
      };

      const result = await this.mg.messages.create(this.domain, emailData);
      console.log("✅ Document invitation email sent successfully:", result);
      return { success: true, data: result };
    } catch (error: any) {
      console.error("❌ Error sending document invitation email:", error);
      return this.handleEmailError(error);
    }
  }

  /**
   * Send lender team invitation email
   */
  async sendLenderInvitationEmail(data: {
    to: string;
    firstName: string;
    lastName: string;
    organizationName: string;
    inviterName: string;
    role: string;
    acceptUrl: string;
  }): Promise<any> {
    try {
      const template = EmailTemplates.getLenderInvitationEmail(data);

      const emailData = {
        from: this.defaultFrom,
        to: [data.to],
        subject: template.subject,
        html: template.html,
        text: template.text
      };

      const result = await this.mg.messages.create(this.domain, emailData);
      console.log("✅ Lender invitation email sent successfully:", result);
      return { success: true, data: result };
    } catch (error: any) {
      console.error("❌ Error sending lender invitation email:", error);
      return this.handleEmailError(error);
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(data: {
    to: string;
    firstName?: string;
    resetUrl: string;
    expiryTime?: string;
  }): Promise<any> {
    try {
      const template = EmailTemplates.getPasswordResetEmail({
        firstName: data.firstName,
        resetUrl: data.resetUrl,
        expiryTime: data.expiryTime
      });

      const emailData = {
        from: this.defaultFrom,
        to: [data.to],
        subject: template.subject,
        html: template.html,
        text: template.text
      };

      const result = await this.mg.messages.create(this.domain, emailData);
      console.log("✅ Password reset email sent successfully:", result);
      return { success: true, data: result };
    } catch (error: any) {
      console.error("❌ Error sending password reset email:", error);
      return this.handleEmailError(error);
    }
  }

  /**
   * Send new prospect notification to lender
   */
  async sendLenderProspectNotificationEmail(data: {
    lenderName: string;
    lenderEmail: string;
    businessName: string;
    applicationNumber: string;
    productType: string;
    loanAmount: number;
    annualRevenue?: number;
    yearsTrading?: number;
    industry?: string;
    connectionUrl?: string;
    businessDetailUrl?: string;
  }): Promise<any> {
    try {
      // For sandbox testing, use authorized email address
      // TODO: Remove this override when using production domain
      const testEmail = data.lenderEmail.includes('@comparefunding.io') ? 'jamie@comparefunding.io' : data.lenderEmail;
      
      console.log('📧 Sending lender prospect notification to:', testEmail);
      if (testEmail !== data.lenderEmail) {
        console.log('📝 Note: Using test email due to sandbox restrictions. Original:', data.lenderEmail);
      }
      
      const template = EmailTemplates.getLenderProspectNotificationEmail(data);

      const emailPayload = {
        from: this.defaultFrom,
        to: [testEmail],
        subject: template.subject,
        html: template.html,
        text: template.text
      };

      const result = await this.mg.messages.create(this.domain, emailPayload);
      console.log("✅ Lender prospect notification email sent successfully:", result);
      return { success: true, data: result };
    } catch (error: any) {
      console.error("❌ Error sending lender prospect notification email:", error);
      return this.handleEmailError(error);
    }
  }

  /**
   * Send new message notification to business
   */
  async sendNewMessageNotificationBusiness(data: {
    to: string;
    businessName: string;
    businessOwnerName: string;
    lenderName: string;
    applicationNumber: string;
    applicationPurpose: string;
    applicationAmount: number;
    messagePreview: string;
    messagesUrl?: string;
  }): Promise<any> {
    try {
      const template = EmailTemplates.getNewMessageNotificationBusinessEmail({
        businessName: data.businessName,
        businessOwnerName: data.businessOwnerName,
        lenderName: data.lenderName,
        applicationNumber: data.applicationNumber,
        applicationPurpose: data.applicationPurpose,
        applicationAmount: data.applicationAmount,
        messagePreview: data.messagePreview,
        messagesUrl: data.messagesUrl
      });

      const emailData = {
        from: this.defaultFrom,
        to: [data.to],
        subject: template.subject,
        html: template.html,
        text: template.text
      };

      const result = await this.mg.messages.create(this.domain, emailData);
      console.log("✅ New message notification (business) sent successfully:", result);
      return { success: true, data: result };
    } catch (error: any) {
      console.error("❌ Error sending new message notification (business):", error);
      return this.handleEmailError(error);
    }
  }

  /**
   * Send new message notification to lender
   */
  async sendNewMessageNotificationLender(data: {
    to: string;
    lenderName: string;
    lenderContactName: string;
    businessName: string;
    applicationNumber: string;
    applicationPurpose: string;
    applicationAmount: number;
    messagePreview: string;
    messagesUrl?: string;
  }): Promise<any> {
    try {
      const template = EmailTemplates.getNewMessageNotificationLenderEmail({
        lenderName: data.lenderName,
        lenderContactName: data.lenderContactName,
        businessName: data.businessName,
        applicationNumber: data.applicationNumber,
        applicationPurpose: data.applicationPurpose,
        applicationAmount: data.applicationAmount,
        messagePreview: data.messagePreview,
        messagesUrl: data.messagesUrl
      });

      const emailData = {
        from: this.defaultFrom,
        to: [data.to],
        subject: template.subject,
        html: template.html,
        text: template.text
      };

      const result = await this.mg.messages.create(this.domain, emailData);
      console.log("✅ New message notification (lender) sent successfully:", result);
      return { success: true, data: result };
    } catch (error: any) {
      console.error("❌ Error sending new message notification (lender):", error);
      return this.handleEmailError(error);
    }
  }

  /**
   * Handle email errors consistently
   */
  private handleEmailError(error: any): any {
    // Provide specific guidance for common errors
    if (error.status === 403 && error.details?.includes('Sandbox subdomains')) {
      return { 
        success: false, 
        error, 
        helpMessage: "🏖️ Sandbox domain restriction: You need to add the recipient email to your Mailgun Authorized Recipients list, or use your own domain instead of the sandbox domain."
      };
    }
    
    if (error.status === 400) {
      return {
        success: false,
        error,
        helpMessage: "❌ Invalid email format or missing required fields. Please check the email address and try again."
      };
    }

    if (error.status === 401) {
      return {
        success: false,
        error,
        helpMessage: "🔐 Authentication failed. Please check your Mailgun API key configuration."
      };
    }
    
    return { success: false, error };
  }

  /**
   * Check if Mailgun is properly configured
   */
  isConfigured(): boolean {
    return !!(import.meta.env.VITE_MAILGUN_API_KEY && this.domain);
  }

  /**
   * Get configuration status
   */
  getStatus(): { configured: boolean; apiKey: boolean; domain: boolean } {
    return {
      configured: this.isConfigured(),
      apiKey: !!import.meta.env.VITE_MAILGUN_API_KEY,
      domain: !!this.domain
    };
  }
}

// Export a singleton instance
export const mailgunService = new MailgunService();
export default mailgunService;
