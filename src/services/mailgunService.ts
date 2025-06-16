import FormData from "form-data";
import Mailgun from "mailgun.js";

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
    this.defaultFrom = `Mailgun Sandbox <postmaster@${this.domain}>`;
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
      
      // Provide specific guidance for common errors
      if (error.status === 403 && error.details?.includes('Sandbox subdomains')) {
        return { 
          success: false, 
          error, 
          helpMessage: "🏖️ Sandbox domain restriction: You need to add the recipient email to your Mailgun Authorized Recipients list, or use your own domain instead of the sandbox domain."
        };
      }
      
      return { success: false, error };
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
    } catch (error) {
      console.error("❌ Error sending email:", error);
      return { success: false, error };
    }
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
