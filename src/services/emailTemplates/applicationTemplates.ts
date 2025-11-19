import { EmailTemplate, createEmailWrapper } from './types';

// Original application submitted email (from existing codebase)
export const getApplicationSubmittedEmail = (data: {
  firstName: string;
  businessName: string;
  applicationNumber: string;
  loanAmount: number;
  dashboardUrl?: string;
}): EmailTemplate => {
  const { firstName, businessName, applicationNumber, loanAmount, dashboardUrl = 'https://comparefunding.io/applications' } = data;
  
  const subject = `Application Submitted Successfully - ${businessName}`;
  
  const styles = `
    .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 40px 30px; text-align: center; }
    .details { background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; margin: 8px 0; }
  `;

  const content = `
    <div class="header">
      <h1>🎉 Application Submitted!</h1>
    </div>
    <div class="content">
      <h2>Hi ${firstName},</h2>
      <p>Great news! Your funding application has been successfully submitted and is now being reviewed by our network of lenders.</p>
      
      <div class="details">
        <h3>📋 Application Details:</h3>
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
      <ol>
        <li><strong>Lender Review</strong> - Our qualified lenders will review your application</li>
        <li><strong>Interest Notification</strong> - You'll be notified when lenders express interest</li>
        <li><strong>Offers Received</strong> - Compare competitive offers from multiple lenders</li>
        <li><strong>Choose & Connect</strong> - Select your preferred offer and connect directly</li>
      </ol>
      
      <a href="${dashboardUrl}" class="btn">Track Your Application</a>
      
      <p>We'll keep you updated on your application progress via email and in your dashboard.</p>
      
      <p>Best regards,<br>The Compare Funding Team</p>
    </div>
    <div class="footer">
      <p>&copy; 2025 Compare Funding. All rights reserved.</p>
    </div>
  `;

  const html = createEmailWrapper(content, styles);

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
};

// Application submission confirmation for businesses (enhanced version)
export const getApplicationSubmissionEmail = (data: {
  firstName: string;
  businessName: string;
  applicationId: string;
  dashboardUrl?: string;
  estimatedReviewTime?: string;
}): EmailTemplate => {
  const { 
    firstName, 
    businessName, 
    applicationId, 
    dashboardUrl = 'http://localhost:8080/dashboard',
    estimatedReviewTime = '1-2 business days'
  } = data;
  
  const subject = `Application Submitted Successfully - ${businessName}`;
  
  const styles = `
    .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 40px 30px; text-align: center; }
    .app-details { background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; }
    .timeline { background: #e7f3ff; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #007bff; }
  `;

  const content = `
    <div class="header">
      <h1>✅ Application Submitted!</h1>
    </div>
    <div class="content">
      <h2>Hi ${firstName},</h2>
      <p>Great news! Your funding application for <strong>${businessName}</strong> has been successfully submitted to our network of lenders.</p>
      
      <div class="app-details">
        <h3>📋 Application Details</h3>
        <p><strong>Application ID:</strong> ${applicationId}</p>
        <p><strong>Business Name:</strong> ${businessName}</p>
        <p><strong>Submitted:</strong> ${new Date().toLocaleDateString()}</p>
        <p><strong>Status:</strong> Under Review</p>
      </div>
      
      <div class="timeline">
        <h3>⏱️ What Happens Next?</h3>
        <p><strong>Review Time:</strong> ${estimatedReviewTime}</p>
        <p>Our team will review your application and match you with suitable lenders. You'll receive notifications as offers come in.</p>
      </div>
      
      <p><strong>📱 Track Your Progress</strong><br>
      You can monitor your application status and view any offers in real-time through your dashboard.</p>
      
      <a href="${dashboardUrl}" class="btn">View Dashboard</a>
      
      <h3>💡 Pro Tips While You Wait:</h3>
      <ul>
        <li>📄 Have your financial documents ready for quick submission</li>
        <li>📞 Keep your contact information updated</li>
        <li>💬 Respond promptly to any lender inquiries</li>
        <li>🔍 Review offers carefully before accepting</li>
      </ul>
      
      <p><strong>Questions?</strong><br>
      Our support team is here to help throughout the process. Contact us at support@comparefunding.io or through your dashboard.</p>
      
      <p>We're excited to help you secure the funding your business needs!</p>
      
      <p>Best regards,<br>The Compare Funding Team</p>
    </div>
    <div class="footer">
      <p>&copy; 2025 Compare Funding. All rights reserved.</p>
      <p>This email was sent because you submitted a funding application.</p>
    </div>
  `;

  const html = createEmailWrapper(content, styles);

  const text = `
Application Submitted Successfully!

Hi ${firstName},

Great news! Your funding application for ${businessName} has been successfully submitted to our network of lenders.

Application Details:
- Application ID: ${applicationId}
- Business Name: ${businessName}
- Submitted: ${new Date().toLocaleDateString()}
- Status: Under Review

What Happens Next?
Review Time: ${estimatedReviewTime}
Our team will review your application and match you with suitable lenders. You'll receive notifications as offers come in.

Track Your Progress:
You can monitor your application status and view any offers in real-time through your dashboard: ${dashboardUrl}

Pro Tips While You Wait:
- Have your financial documents ready for quick submission
- Keep your contact information updated
- Respond promptly to any lender inquiries
- Review offers carefully before accepting

Questions?
Our support team is here to help throughout the process. Contact us at support@comparefunding.io or through your dashboard.

We're excited to help you secure the funding your business needs!

Best regards,
The Compare Funding Team

---
© 2025 Compare Funding. All rights reserved.
This email was sent because you submitted a funding application.
  `;

  return { subject, html, text };
};

// Application approved notification
export const getApplicationApprovedEmail = (data: {
  firstName: string;
  businessName: string;
  applicationId: string;
  dashboardUrl?: string;
}): EmailTemplate => {
  const { 
    firstName, 
    businessName, 
    applicationId,
    dashboardUrl = 'http://localhost:8080/dashboard'
  } = data;
  
  const subject = `🎉 Application Approved - ${businessName}`;
  
  const styles = `
    .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 40px 30px; text-align: center; }
    .celebration { background: #d4edda; padding: 20px; border-radius: 6px; margin: 20px 0; border: 2px solid #28a745; text-align: center; }
    .next-steps { background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; }
  `;

  const content = `
    <div class="header">
      <h1>🎉 Congratulations!</h1>
    </div>
    <div class="content">
      <div class="celebration">
        <h2>Your Application Has Been Approved!</h2>
        <p>🎊 Great news, ${firstName}! Your funding application for <strong>${businessName}</strong> has been approved and is now live in our lender marketplace.</p>
      </div>
      
      <div class="next-steps">
        <h3>📋 Application Details</h3>
        <p><strong>Application ID:</strong> ${applicationId}</p>
        <p><strong>Business Name:</strong> ${businessName}</p>
        <p><strong>Status:</strong> ✅ Approved & Active</p>
      </div>
      
      <h3>🚀 What Happens Next?</h3>
      <p>Your application is now visible to our network of qualified lenders. Here's what you can expect:</p>
      
      <ul>
        <li>🔍 <strong>Lender Review:</strong> Qualified lenders will review your application</li>
        <li>💼 <strong>Offers Incoming:</strong> You'll receive funding offers directly in your dashboard</li>
        <li>📧 <strong>Email Alerts:</strong> We'll notify you immediately when new offers arrive</li>
        <li>⚡ <strong>Quick Response:</strong> Most businesses receive their first offers within 24-48 hours</li>
      </ul>
      
      <p><strong>💡 Pro Tip:</strong> The faster you respond to lender inquiries and provide requested documents, the quicker you'll receive competitive offers!</p>
      
      <a href="${dashboardUrl}" class="btn">View Your Dashboard</a>
      
      <p><strong>Need Support?</strong><br>
      Our team is here to help you navigate the funding process. Contact us at support@comparefunding.io anytime.</p>
      
      <p>We're excited to help you secure the perfect funding for your business!</p>
      
      <p>Best regards,<br>The Compare Funding Team</p>
    </div>
    <div class="footer">
      <p>&copy; 2025 Compare Funding. All rights reserved.</p>
      <p>This email was sent because your funding application status changed.</p>
    </div>
  `;

  const html = createEmailWrapper(content, styles);

  const text = `
🎉 Congratulations! Your Application Has Been Approved!

Hi ${firstName},

Great news! Your funding application for ${businessName} has been approved and is now live in our lender marketplace.

Application Details:
- Application ID: ${applicationId}
- Business Name: ${businessName}
- Status: ✅ Approved & Active

What Happens Next?
Your application is now visible to our network of qualified lenders. Here's what you can expect:

- Lender Review: Qualified lenders will review your application
- Offers Incoming: You'll receive funding offers directly in your dashboard
- Email Alerts: We'll notify you immediately when new offers arrive
- Quick Response: Most businesses receive their first offers within 24-48 hours

💡 Pro Tip: The faster you respond to lender inquiries and provide requested documents, the quicker you'll receive competitive offers!

View your dashboard: ${dashboardUrl}

Need Support?
Our team is here to help you navigate the funding process. Contact us at support@comparefunding.io anytime.

We're excited to help you secure the perfect funding for your business!

Best regards,
The Compare Funding Team

---
© 2025 Compare Funding. All rights reserved.
This email was sent because your funding application status changed.
  `;

  return { subject, html, text };
};
