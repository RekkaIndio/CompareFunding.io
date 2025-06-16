/**
 * Custom Magic Link Email Service using SendGrid
 * This would replace the default Firebase email sending
 */

import { sendMagicLink as firebaseSendMagicLink } from '@/firebase';

interface EmailTemplate {
  subject: string;
  htmlContent: string;
  textContent: string;
}

class CustomMagicLinkService {
  private sendGridApiKey: string;
  
  constructor(apiKey: string) {
    this.sendGridApiKey = apiKey;
  }

  private getEmailTemplate(magicLink: string, email: string): EmailTemplate {
    const subject = 'Sign in to Compare Funding - Secure Link Inside';
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #2a3441;
            max-width: 600px;
            margin: 0 auto;
            background-color: #f8fafc;
            padding: 20px;
          }
          
          .email-container {
            background-color: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          
          .header {
            background: linear-gradient(135deg, #ff8000 0%, #ff6b35 100%);
            padding: 40px 30px;
            text-align: center;
            color: white;
          }
          
          .logo {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
          }
          
          .tagline {
            font-size: 14px;
            opacity: 0.9;
          }
          
          .content {
            padding: 40px 30px;
          }
          
          .greeting {
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 20px;
            color: #2a3441;
          }
          
          .message {
            font-size: 16px;
            margin-bottom: 30px;
            color: #64748b;
          }
          
          .cta-container {
            text-align: center;
            margin: 40px 0;
          }
          
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #ff8000 0%, #ff6b35 100%);
            color: white;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            transition: transform 0.2s ease;
          }
          
          .cta-button:hover {
            transform: translateY(-2px);
          }
          
          .alternative-link {
            margin-top: 30px;
            padding: 20px;
            background-color: #f1f5f9;
            border-radius: 8px;
            border-left: 4px solid #ff8000;
          }
          
          .alternative-link p {
            margin: 0 0 10px 0;
            font-size: 14px;
            color: #64748b;
          }
          
          .link-text {
            word-break: break-all;
            font-family: monospace;
            font-size: 12px;
            color: #475569;
            background-color: white;
            padding: 8px;
            border-radius: 4px;
          }
          
          .security-info {
            background-color: #fef3c7;
            border: 1px solid #fbbf24;
            border-radius: 8px;
            padding: 20px;
            margin: 30px 0;
          }
          
          .security-info h4 {
            margin: 0 0 10px 0;
            color: #92400e;
            font-size: 16px;
            font-weight: 600;
          }
          
          .security-info ul {
            margin: 10px 0 0 0;
            padding-left: 20px;
            color: #92400e;
          }
          
          .security-info li {
            margin-bottom: 5px;
            font-size: 14px;
          }
          
          .footer {
            background-color: #f8fafc;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
          }
          
          .footer p {
            margin: 5px 0;
            font-size: 12px;
            color: #64748b;
          }
          
          .social-links {
            margin: 20px 0;
          }
          
          .social-links a {
            display: inline-block;
            margin: 0 10px;
            color: #64748b;
            text-decoration: none;
          }
          
          @media (max-width: 600px) {
            body { padding: 10px; }
            .content, .header, .footer { padding: 20px; }
            .greeting { font-size: 20px; }
            .cta-button { padding: 14px 28px; font-size: 14px; }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <div class="logo">Compare Funding</div>
            <div class="tagline">Your Business Funding Partner</div>
          </div>
          
          <div class="content">
            <h1 class="greeting">Welcome back! 👋</h1>
            
            <p class="message">
              You requested to sign in to your Compare Funding account. We've created a secure link just for you.
            </p>
            
            <div class="cta-container">
              <a href="${magicLink}" class="cta-button">
                🔐 Sign In to Compare Funding
              </a>
            </div>
            
            <div class="alternative-link">
              <p><strong>Can't click the button?</strong> Copy and paste this link into your browser:</p>
              <div class="link-text">${magicLink}</div>
            </div>
            
            <div class="security-info">
              <h4>🛡️ Security Information</h4>
              <ul>
                <li>This link will expire in <strong>1 hour</strong></li>
                <li>This link can only be used <strong>once</strong></li>
                <li>If you didn't request this, please ignore this email</li>
                <li>Never share this link with anyone</li>
              </ul>
            </div>
            
            <p style="margin-top: 30px; font-size: 14px; color: #64748b;">
              Need help? Our support team is here for you at 
              <a href="mailto:support@comparefunding.com" style="color: #ff8000;">support@comparefunding.com</a>
            </p>
          </div>
          
          <div class="footer">
            <div class="social-links">
              <a href="https://twitter.com/comparefunding">Twitter</a>
              <a href="https://linkedin.com/company/comparefunding">LinkedIn</a>
              <a href="https://comparefunding.com/blog">Blog</a>
            </div>
            <p>&copy; 2025 Compare Funding Ltd. All rights reserved.</p>
            <p>This email was sent to ${email}</p>
            <p>
              <a href="https://comparefunding.com/unsubscribe" style="color: #64748b;">Unsubscribe</a> | 
              <a href="https://comparefunding.com/privacy" style="color: #64748b;">Privacy Policy</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const textContent = `
Welcome back to Compare Funding!

You requested to sign in to your account. Click the link below to complete your sign-in:

${magicLink}

SECURITY INFORMATION:
- This link will expire in 1 hour
- This link can only be used once
- If you didn't request this, please ignore this email
- Never share this link with anyone

Need help? Contact our support team at support@comparefunding.com

© 2025 Compare Funding Ltd. All rights reserved.
This email was sent to ${email}
    `;
    
    return { subject, htmlContent, textContent };
  }

  async sendCustomMagicLink(email: string): Promise<{success: boolean, error: any}> {
    try {
      // First, get the magic link from Firebase
      const result = await firebaseSendMagicLink(email);
      
      if (!result.success) {
        return result;
      }
      
      // In a real implementation, you would:
      // 1. Generate the magic link using Firebase Admin SDK
      // 2. Send the custom email using SendGrid/Mailgun/etc.
      // 3. Store the link temporarily for verification
      
      console.log('Custom magic link email would be sent here');
      console.log('Email template generated for:', email);
      
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error };
    }
  }
}

export default CustomMagicLinkService;
