// Email templates for various user events
export interface EmailTemplateData {
  [key: string]: any;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

class EmailTemplates {
  // Welcome email for new users
  static getWelcomeEmail(data: {
    firstName: string;
    role: 'business' | 'lender';
    loginUrl?: string;
  }): EmailTemplate {
    const { firstName, role, loginUrl = 'http://localhost:8080/login' } = data;
    
    const subject = `Welcome to Compare Funding, ${firstName}!`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Compare Funding</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .header { background: linear-gradient(135deg, #ff8000 0%, #ff6000 100%); padding: 40px 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 28px; font-weight: bold; }
          .content { padding: 40px 30px; }
          .btn { display: inline-block; background: #ff8000; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
          .btn:hover { background: #e67300; }
          .features { background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; }
          .feature { margin: 10px 0; }
          .footer { background: #f8f9fa; padding: 30px; text-align: center; color: #6c757d; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Compare Funding!</h1>
          </div>
          <div class="content">
            <h2>Hi ${firstName},</h2>
            <p>Welcome to Compare Funding! We're excited to have you join our platform that connects ${role === 'business' ? 'businesses with the perfect funding opportunities' : 'lenders with quality business applications'}.</p>
            
            ${role === 'business' ? `
              <div class="features">
                <h3>🚀 What you can do now:</h3>
                <div class="feature">✅ Complete your business profile</div>
                <div class="feature">✅ Browse funding options</div>
                <div class="feature">✅ Connect with pre-qualified lenders</div>
                <div class="feature">✅ Receive competitive offers</div>
              </div>
              <p>Ready to find your perfect funding match?</p>
            ` : `
              <div class="features">
                <h3>💼 What you can do now:</h3>
                <div class="feature">✅ Browse quality business applications</div>
                <div class="feature">✅ View detailed business profiles</div>
                <div class="feature">✅ Make competitive offers</div>
                <div class="feature">✅ Connect directly with business owners</div>
              </div>
              <p>Ready to discover your next lending opportunity?</p>
            `}
            
            <a href="${loginUrl}" class="btn">Access Your Dashboard</a>
            
            <p>If you have any questions, our support team is here to help. Simply reply to this email or contact us at support@comparefunding.io</p>
            
            <p>Best regards,<br>The Compare Funding Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 Compare Funding. All rights reserved.</p>
            <p>This email was sent because you created an account on Compare Funding.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Welcome to Compare Funding!

Hi ${firstName},

Welcome to Compare Funding! We're excited to have you join our platform that connects ${role === 'business' ? 'businesses with the perfect funding opportunities' : 'lenders with quality business applications'}.

${role === 'business' ? `
What you can do now:
- Complete your business profile
- Browse funding options  
- Connect with pre-qualified lenders
- Receive competitive offers

Ready to find your perfect funding match?
` : `
What you can do now:
- Browse quality business applications
- View detailed business profiles
- Make competitive offers
- Connect directly with business owners

Ready to discover your next lending opportunity?
`}

Access your dashboard: ${loginUrl}

If you have any questions, our support team is here to help. Simply reply to this email or contact us at support@comparefunding.io

Best regards,
The Compare Funding Team

---
© 2025 Compare Funding. All rights reserved.
This email was sent because you created an account on Compare Funding.
    `;

    return { subject, html, text };
  }

  // Application submitted confirmation
  static getApplicationSubmittedEmail(data: {
    firstName: string;
    businessName: string;
    applicationNumber: string;
    loanAmount: number;
    dashboardUrl?: string;
  }): EmailTemplate {
    const { firstName, businessName, applicationNumber, loanAmount, dashboardUrl = 'https://comparefunding.io/applications' } = data;
    
    const subject = `Application Submitted Successfully - ${businessName}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Application Submitted</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 40px 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 28px; font-weight: bold; }
          .content { padding: 40px 30px; }
          .btn { display: inline-block; background: #ff8000; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
          .details { background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; margin: 8px 0; }
          .footer { background: #f8f9fa; padding: 30px; text-align: center; color: #6c757d; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Application Submitted!</h1>
          </div>
          <div class="content">
            <h2>Hi ${firstName},</h2>
            <p>Great news! Your funding application has been successfully submitted and is now being reviewed by our network of lenders.</p>
            
            <div class="details">
              <h3>Application Details:</h3>
              <div class="detail-row">
                <strong>Application Number:</strong>
                <span>${applicationNumber}</span>
              </div>
              <div class="detail-row">
                <strong>Business Name:</strong>
                <span>${businessName}</span>
              </div>
              <div class="detail-row">
                <strong>Funding Amount:</strong>
                <span>£${loanAmount.toLocaleString()}</span>
              </div>
              <div class="detail-row">
                <strong>Status:</strong>
                <span>Under Review</span>
              </div>
            </div>
            
            <h3>🎯 What happens next?</h3>
            <p>1. <strong>Lender Review</strong> - Our qualified lenders will review your application<br>
            2. <strong>Interest Notification</strong> - You'll be notified when lenders express interest<br>
            3. <strong>Offers Received</strong> - Compare competitive offers from multiple lenders<br>
            4. <strong>Choose & Connect</strong> - Select your preferred offer and connect directly</p>
            
            <a href="${dashboardUrl}" class="btn">Track Your Application</a>
            
            <p>We'll keep you updated on your application progress via email and in your dashboard.</p>
            
            <p>Best regards,<br>The Compare Funding Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 Compare Funding. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Application Submitted Successfully!

Hi ${firstName},

Great news! Your funding application has been successfully submitted and is now being reviewed by our network of lenders.

Application Details:
- Application Number: ${applicationNumber}
- Business Name: ${businessName}
- Funding Amount: £${loanAmount.toLocaleString()}
- Status: Under Review

What happens next?
1. Lender Review - Our qualified lenders will review your application
2. Interest Notification - You'll be notified when lenders express interest  
3. Offers Received - Compare competitive offers from multiple lenders
4. Choose & Connect - Select your preferred offer and connect directly

Track your application: ${dashboardUrl}

We'll keep you updated on your application progress via email and in your dashboard.

Best regards,
The Compare Funding Team

---
© 2025 Compare Funding. All rights reserved.
    `;

    return { subject, html, text };
  }

  // New offer received notification
  static getOfferReceivedEmail(data: {
    firstName: string;
    businessName: string;
    lenderName: string;
    offerAmount: number;
    interestRate: number;
    termMonths: number;
    offerUrl?: string;
  }): EmailTemplate {
    const { firstName, businessName, lenderName, offerAmount, interestRate, termMonths, offerUrl = 'http://localhost:8080/offers' } = data;
    
    const subject = `🎉 New Funding Offer - £${offerAmount.toLocaleString()} from ${lenderName}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Funding Offer</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .header { background: linear-gradient(135deg, #ff8000 0%, #ff6000 100%); padding: 40px 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 28px; font-weight: bold; }
          .content { padding: 40px 30px; }
          .btn { display: inline-block; background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
          .offer-details { background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #ff8000; }
          .detail-row { display: flex; justify-content: space-between; margin: 8px 0; }
          .highlight { background: #fff3cd; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #ffc107; }
          .footer { background: #f8f9fa; padding: 30px; text-align: center; color: #6c757d; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 New Funding Offer!</h1>
          </div>
          <div class="content">
            <h2>Hi ${firstName},</h2>
            <p>Excellent news! <strong>${lenderName}</strong> has submitted a funding offer for <strong>${businessName}</strong>.</p>
            
            <div class="offer-details">
              <h3>📋 Offer Summary:</h3>
              <div class="detail-row">
                <strong>Lender:</strong>
                <span>${lenderName}</span>
              </div>
              <div class="detail-row">
                <strong>Offer Amount:</strong>
                <span>£${offerAmount.toLocaleString()}</span>
              </div>
              <div class="detail-row">
                <strong>Interest Rate:</strong>
                <span>${interestRate}% per annum</span>
              </div>
              <div class="detail-row">
                <strong>Term:</strong>
                <span>${termMonths} months</span>
              </div>
            </div>
            
            <div class="highlight">
              <strong>⏰ Time Sensitive:</strong> This offer is available for a limited time. Review the full terms and respond promptly to secure this opportunity.
            </div>
            
            <a href="${offerUrl}" class="btn">Review Full Offer</a>
            
            <p><strong>Next Steps:</strong></p>
            <p>1. Review the complete offer terms and conditions<br>
            2. Compare with any other offers you may have received<br>
            3. Accept the offer if it meets your requirements<br>
            4. Connect directly with ${lenderName} to finalize details</p>
            
            <p>Remember: You can always negotiate terms or ask questions before accepting.</p>
            
            <p>Best regards,<br>The Compare Funding Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 Compare Funding. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
New Funding Offer!

Hi ${firstName},

Excellent news! ${lenderName} has submitted a funding offer for ${businessName}.

Offer Summary:
- Lender: ${lenderName}
- Offer Amount: £${offerAmount.toLocaleString()}
- Interest Rate: ${interestRate}% per annum
- Term: ${termMonths} months

⏰ Time Sensitive: This offer is available for a limited time. Review the full terms and respond promptly to secure this opportunity.

Review full offer: ${offerUrl}

Next Steps:
1. Review the complete offer terms and conditions
2. Compare with any other offers you may have received
3. Accept the offer if it meets your requirements
4. Connect directly with ${lenderName} to finalize details

Remember: You can always negotiate terms or ask questions before accepting.

Best regards,
The Compare Funding Team

---
© 2025 Compare Funding. All rights reserved.
    `;

    return { subject, html, text };
  }

  // Document upload invitation
  static getDocumentInvitationEmail(data: {
    colleagueName?: string;
    businessName: string;
    inviterName: string;
    uploadUrl: string;
    message?: string;
  }): EmailTemplate {
    const { colleagueName, businessName, inviterName, uploadUrl, message } = data;
    
    const subject = `Document Upload Request - ${businessName} Funding Application`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Document Upload Request</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .header { background: linear-gradient(135deg, #6f42c1 0%, #007bff 100%); padding: 40px 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 28px; font-weight: bold; }
          .content { padding: 40px 30px; }
          .btn { display: inline-block; background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
          .message-box { background: #e3f2fd; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #2196f3; }
          .requirements { background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 30px; text-align: center; color: #6c757d; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📄 Document Upload Request</h1>
          </div>
          <div class="content">
            <h2>${colleagueName ? `Hi ${colleagueName}` : 'Hello'},</h2>
            <p><strong>${inviterName}</strong> has invited you to help upload financial documents for <strong>${businessName}</strong>'s funding application on Compare Funding.</p>
            
            ${message ? `
              <div class="message-box">
                <h3>📝 Message from ${inviterName}:</h3>
                <p><em>"${message}"</em></p>
              </div>
            ` : ''}
            
            <div class="requirements">
              <h3>📋 Required Documents:</h3>
              <ul>
                <li>Bank statements (last 6 months)</li>
                <li>Profit & Loss statements</li>
                <li>Balance sheet</li>
                <li>Aged debtors report</li>
                <li>Aged creditors report</li>
              </ul>
            </div>
            
            <p><strong>🔒 Security:</strong> Our platform uses bank-level encryption to keep all financial information completely secure and confidential.</p>
            
            <a href="${uploadUrl}" class="btn">Upload Documents Securely</a>
            
            <p><strong>What to expect:</strong></p>
            <p>1. Click the secure upload link above<br>
            2. Follow the guided upload process<br>
            3. Upload the required financial documents<br>
            4. We'll notify ${inviterName} when complete</p>
            
            <p>If you have any questions about this request, please contact ${inviterName} directly or our support team at support@comparefunding.io</p>
            
            <p>Thank you for your assistance!</p>
            
            <p>Best regards,<br>The Compare Funding Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 Compare Funding. All rights reserved.</p>
            <p>This invitation was sent by ${inviterName} for ${businessName}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Document Upload Request

${colleagueName ? `Hi ${colleagueName}` : 'Hello'},

${inviterName} has invited you to help upload financial documents for ${businessName}'s funding application on Compare Funding.

${message ? `Message from ${inviterName}: "${message}"` : ''}

Required Documents:
- Bank statements (last 6 months)
- Profit & Loss statements  
- Balance sheet
- Aged debtors report
- Aged creditors report

🔒 Security: Our platform uses bank-level encryption to keep all financial information completely secure and confidential.

Upload documents securely: ${uploadUrl}

What to expect:
1. Click the secure upload link above
2. Follow the guided upload process
3. Upload the required financial documents
4. We'll notify ${inviterName} when complete

If you have any questions about this request, please contact ${inviterName} directly or our support team at support@comparefunding.io

Thank you for your assistance!

Best regards,
The Compare Funding Team

---
© 2025 Compare Funding. All rights reserved.
This invitation was sent by ${inviterName} for ${businessName}
    `;

    return { subject, html, text };
  }

  // Password reset email
  static getPasswordResetEmail(data: {
    firstName?: string;
    resetUrl: string;
    expiryTime?: string;
  }): EmailTemplate {
    const { firstName, resetUrl, expiryTime = '1 hour' } = data;
    
    const subject = 'Reset Your Compare Funding Password';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .header { background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); padding: 40px 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 28px; font-weight: bold; }
          .content { padding: 40px 30px; }
          .btn { display: inline-block; background: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; text-align: center; }
          .btn:hover { background: #c82333; }
          .security-notice { background: #fff3cd; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #ffc107; }
          .expiry-info { background: #f8d7da; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #dc3545; }
          .footer { background: #f8f9fa; padding: 30px; text-align: center; color: #6c757d; font-size: 14px; }
          .link-style { word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 4px; font-family: monospace; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset</h1>
          </div>
          <div class="content">
            <h2>${firstName ? `Hi ${firstName}` : 'Hello'},</h2>
            <p>We received a request to reset your password for your Compare Funding account. If you made this request, click the button below to create a new password.</p>
            
            <a href="${resetUrl}" class="btn">Reset Your Password</a>
            
            <div class="expiry-info">
              <strong>⏰ Time Sensitive:</strong> This password reset link will expire in <strong>${expiryTime}</strong> for security reasons.
            </div>
            
            <p>If the button above doesn't work, you can copy and paste this link into your browser:</p>
            <div class="link-style">${resetUrl}</div>
            
            <div class="security-notice">
              <h3>🛡️ Security Notice</h3>
              <p><strong>If you didn't request this password reset:</strong></p>
              <ul>
                <li>Your account is still secure - no action is needed</li>
                <li>You can safely ignore this email</li>
                <li>Consider changing your password if you're concerned</li>
                <li>Contact our support team if you have questions</li>
              </ul>
            </div>
            
            <p><strong>Need Help?</strong><br>
            If you're having trouble resetting your password or have any questions, our support team is here to help at support@comparefunding.io</p>
            
            <p>Best regards,<br>The Compare Funding Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 Compare Funding. All rights reserved.</p>
            <p>This email was sent because a password reset was requested for your account.</p>
            <p>If you didn't make this request, you can safely ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Reset Your Compare Funding Password

${firstName ? `Hi ${firstName}` : 'Hello'},

We received a request to reset your password for your Compare Funding account. If you made this request, click the link below to create a new password.

Reset your password: ${resetUrl}

⏰ Time Sensitive: This password reset link will expire in ${expiryTime} for security reasons.

🛡️ Security Notice
If you didn't request this password reset:
- Your account is still secure - no action is needed
- You can safely ignore this email  
- Consider changing your password if you're concerned
- Contact our support team if you have questions

Need Help?
If you're having trouble resetting your password or have any questions, our support team is here to help at support@comparefunding.io

Best regards,
The Compare Funding Team

---
© 2025 Compare Funding. All rights reserved.
This email was sent because a password reset was requested for your account.
If you didn't make this request, you can safely ignore this email.
    `;

    return { subject, html, text };
  }

  // Lender invitation email
  static getLenderInvitationEmail(data: {
    firstName: string;
    lastName: string;
    organizationName: string;
    inviterName: string;
    role: string;
    acceptUrl: string;
  }): EmailTemplate {
    const { firstName, lastName, organizationName, inviterName, role, acceptUrl } = data;
    
    const subject = `Invitation to Join ${organizationName} on Compare Funding`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Team Invitation</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .header { background: linear-gradient(135deg, #343a40 0%, #495057 100%); padding: 40px 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 28px; font-weight: bold; }
          .content { padding: 40px 30px; }
          .btn { display: inline-block; background: #ff8000; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
          .role-info { background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #ff8000; }
          .footer { background: #f8f9fa; padding: 30px; text-align: center; color: #6c757d; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🤝 Team Invitation</h1>
          </div>
          <div class="content">
            <h2>Hi ${firstName},</h2>
            <p><strong>${inviterName}</strong> has invited you to join <strong>${organizationName}</strong> on Compare Funding as a <strong>${role}</strong>.</p>
            
            <div class="role-info">
              <h3>👤 Your Role: ${role}</h3>
              <p>As a ${role}, you'll have access to:</p>
              <ul>
                ${role === 'admin' ? `
                  <li>Full platform access</li>
                  <li>User management capabilities</li>
                  <li>Application review and approval</li>
                  <li>Analytics and reporting</li>
                ` : role === 'manager' ? `
                  <li>Application review and approval</li>
                  <li>Team collaboration tools</li>
                  <li>Analytics and reporting</li>
                ` : role === 'analyst' ? `
                  <li>Application analysis and review</li>
                  <li>Reporting and analytics</li>
                  <li>Team collaboration tools</li>
                ` : `
                  <li>View applications and reports</li>
                  <li>Team collaboration tools</li>
                `}
              </ul>
            </div>
            
            <p>Compare Funding connects lenders with high-quality business applications, streamlining the lending process for everyone involved.</p>
            
            <a href="${acceptUrl}" class="btn">Accept Invitation</a>
            
            <p><strong>Getting Started:</strong></p>
            <p>1. Click "Accept Invitation" above<br>
            2. Complete your profile setup<br>
            3. Start collaborating with your team<br>
            4. Access quality business applications</p>
            
            <p>If you have any questions, feel free to reach out to ${inviterName} or our support team at support@comparefunding.io</p>
            
            <p>Welcome to the team!</p>
            
            <p>Best regards,<br>The Compare Funding Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 Compare Funding. All rights reserved.</p>
            <p>This invitation was sent by ${inviterName} from ${organizationName}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Team Invitation

Hi ${firstName},

${inviterName} has invited you to join ${organizationName} on Compare Funding as a ${role}.

Your Role: ${role}
As a ${role}, you'll have access to team collaboration tools and platform features appropriate to your role.

Compare Funding connects lenders with high-quality business applications, streamlining the lending process for everyone involved.

Accept invitation: ${acceptUrl}

Getting Started:
1. Click "Accept Invitation" above
2. Complete your profile setup  
3. Start collaborating with your team
4. Access quality business applications

If you have any questions, feel free to reach out to ${inviterName} or our support team at support@comparefunding.io

Welcome to the team!

Best regards,
The Compare Funding Team

---
© 2025 Compare Funding. All rights reserved.
This invitation was sent by ${inviterName} from ${organizationName}
    `;

    return { subject, html, text };
  }

  // New prospect notification for lenders
  static getLenderProspectNotificationEmail(data: {
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
  }): EmailTemplate {
    const { 
      lenderName, 
      businessName, 
      applicationNumber, 
      productType, 
      loanAmount, 
      annualRevenue,
      yearsTrading,
      industry,
      connectionUrl = 'https://comparefunding.io/lender/connections',
      businessDetailUrl = 'https://comparefunding.io/lender/business-details'
    } = data;
    
    const subject = `🎯 New Prospect: ${businessName} - £${loanAmount.toLocaleString()} ${productType}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Business Prospect</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .header { background: linear-gradient(135deg, #ff8000 0%, #ff6000 100%); padding: 40px 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 28px; font-weight: bold; }
          .content { padding: 40px 30px; }
          .btn { display: inline-block; background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 10px 5px; text-align: center; }
          .btn-secondary { background: #6c757d; }
          .prospect-details { background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #ff8000; }
          .detail-row { display: flex; justify-content: space-between; margin: 8px 0; }
          .highlight { background: #d4edda; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #28a745; }
          .attachment-notice { background: #fff3cd; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #ffc107; }
          .footer { background: #f8f9fa; padding: 30px; text-align: center; color: #6c757d; font-size: 14px; }
          .action-buttons { text-align: center; margin: 25px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎯 New Business Prospect</h1>
          </div>
          <div class="content">
            <h2>Hi ${lenderName},</h2>
            <p>Great news! A new business has connected with you on Compare Funding and is actively seeking ${productType} funding.</p>
            
            <div class="prospect-details">
              <h3>📋 Business Overview:</h3>
              <div class="detail-row">
                <strong>Business Name:</strong>
                <span>${businessName}</span>
              </div>
              <div class="detail-row">
                <strong>Application Number:</strong>
                <span>${applicationNumber}</span>
              </div>
              <div class="detail-row">
                <strong>Product Type:</strong>
                <span>${productType}</span>
              </div>
              <div class="detail-row">
                <strong>Funding Amount:</strong>
                <span>£${loanAmount.toLocaleString()}</span>
              </div>
              ${industry ? `
              <div class="detail-row">
                <strong>Industry:</strong>
                <span>${industry}</span>
              </div>
              ` : ''}
              ${yearsTrading ? `
              <div class="detail-row">
                <strong>Years Trading:</strong>
                <span>${yearsTrading} years</span>
              </div>
              ` : ''}
              ${annualRevenue ? `
              <div class="detail-row">
                <strong>Annual Revenue:</strong>
                <span>£${annualRevenue.toLocaleString()}</span>
              </div>
              ` : ''}
            </div>

            <div class="attachment-notice">
              <strong>� Business Details Available:</strong> Full business profile with comprehensive financial information and application details is available in your lender dashboard.
            </div>
            
            <div class="highlight">
              <strong>🚀 Ready to Review:</strong> This business has completed their application and is ready for lender review. All required documents and financial information are included.
            </div>
            
            <div class="action-buttons">
              <a href="${businessDetailUrl}" class="btn">View Full Business Details</a>
              <a href="${connectionUrl}" class="btn btn-secondary">Manage All Connections</a>
            </div>
            
            <p><strong>Next Steps:</strong></p>
            <p>1. <strong>Review the attached business profile</strong> for detailed financial analysis<br>
            2. <strong>Assess the opportunity</strong> against your lending criteria<br>
            3. <strong>Submit an offer</strong> if the business is a good fit<br>
            4. <strong>Connect directly</strong> with the business owner to discuss terms</p>
            
            <p><strong>Why this business connected with you:</strong></p>
            <p>• Product offering matches their funding needs<br>
            • Loan amount falls within your lending range<br>
            • Business meets your basic criteria requirements<br>
            • Industry alignment with your preferences</p>
            
            <p><strong>💡 Tip:</strong> Businesses that receive quick responses and competitive offers are more likely to proceed. This is a time-sensitive opportunity!</p>
            
            <p>Questions about this prospect or need support? Contact our lender success team at lenders@comparefunding.io</p>
            
            <p>Best regards,<br>The Compare Funding Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 Compare Funding. All rights reserved.</p>
            <p>This notification was sent because ${businessName} connected with your lending profile.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
New Business Prospect!

Hi ${lenderName},

Great news! A new business has connected with you on Compare Funding and is actively seeking ${productType} funding.

Business Overview:
- Business Name: ${businessName}
- Application Number: ${applicationNumber}
- Product Type: ${productType}
- Funding Amount: £${loanAmount.toLocaleString()}
${industry ? `- Industry: ${industry}` : ''}
${yearsTrading ? `- Years Trading: ${yearsTrading} years` : ''}
${annualRevenue ? `- Annual Revenue: £${annualRevenue.toLocaleString()}` : ''}

� Business Details Available: Full business profile with comprehensive financial information and application details is available in your lender dashboard.

🚀 Ready to Review: This business has completed their application and is ready for lender review. All required documents and financial information are included.

View full business details: ${businessDetailUrl}
Manage all connections: ${connectionUrl}

Next Steps:
1. Review the attached business profile for detailed financial analysis
2. Assess the opportunity against your lending criteria
3. Submit an offer if the business is a good fit
4. Connect directly with the business owner to discuss terms

Why this business connected with you:
• Product offering matches their funding needs
• Loan amount falls within your lending range  
• Business meets your basic criteria requirements
• Industry alignment with your preferences

💡 Tip: Businesses that receive quick responses and competitive offers are more likely to proceed. This is a time-sensitive opportunity!

Questions about this prospect or need support? Contact our lender success team at lenders@comparefunding.io

Best regards,
The Compare Funding Team

---
© 2025 Compare Funding. All rights reserved.
This notification was sent because ${businessName} connected with your lending profile.
    `;

    return { subject, html, text };
  }
}

export default EmailTemplates;
