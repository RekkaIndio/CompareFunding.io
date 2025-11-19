import { EmailTemplate, createEmailWrapper } from './types';

// Document request notification
export const getDocumentRequestEmail = (data: {
  firstName: string;
  businessName: string;
  lenderName: string;
  documentList: string[];
  dueDate?: string;
  dashboardUrl?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}): EmailTemplate => {
  const { 
    firstName, 
    businessName, 
    lenderName, 
    documentList,
    dueDate,
    dashboardUrl = 'http://localhost:8080/dashboard',
    priority = 'medium'
  } = data;
  
  const subject = `📄 Documents Requested - ${lenderName} (${businessName})`;
  
  const priorityConfig = {
    low: { color: '#6c757d', icon: '📋', urgency: 'Standard Request' },
    medium: { color: '#007bff', icon: '📄', urgency: 'Action Required' },
    high: { color: '#fd7e14', icon: '⚡', urgency: 'High Priority' },
    urgent: { color: '#dc3545', icon: '🚨', urgency: 'URGENT' }
  };

  const config = priorityConfig[priority];
  
  const styles = `
    .header { background: linear-gradient(135deg, ${config.color} 0%, ${config.color}dd 100%); padding: 40px 30px; text-align: center; }
    .priority-banner { background: ${config.color}20; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid ${config.color}; }
    .document-list { background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; }
    .document-item { margin: 8px 0; padding: 8px 12px; background: white; border-radius: 4px; border-left: 3px solid #007bff; }
    .due-date { background: #fff3cd; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #ffc107; }
  `;

  const content = `
    <div class="header">
      <h1>${config.icon} Documents Requested</h1>
    </div>
    <div class="content">
      <div class="priority-banner">
        <strong>${config.urgency}:</strong> ${lenderName} has requested additional documents for your application.
      </div>
      
      <h2>Hi ${firstName},</h2>
      <p><strong>${lenderName}</strong> needs additional documentation to continue processing your funding application for <strong>${businessName}</strong>.</p>
      
      ${dueDate ? `
        <div class="due-date">
          <strong>⏰ Due Date:</strong> Please submit these documents by ${dueDate} to keep your application on track.
        </div>
      ` : ''}
      
      <div class="document-list">
        <h3>📋 Required Documents:</h3>
        ${documentList.map(doc => `<div class="document-item">✓ ${doc}</div>`).join('')}
      </div>
      
      <h3>📤 How to Submit:</h3>
      <ol>
        <li>Log into your Compare Funding dashboard</li>
        <li>Navigate to your application with ${lenderName}</li>
        <li>Upload the requested documents in the designated section</li>
        <li>Click "Submit Documents" to send them directly to the lender</li>
      </ol>
      
      <a href="${dashboardUrl}" class="btn">Upload Documents Now</a>
      
      <h3>📄 Document Submission Tips:</h3>
      <ul>
        <li>🔍 Ensure documents are clear and legible</li>
        <li>📱 Use high-quality scans or photos</li>
        <li>✅ Double-check that all requested items are included</li>
        <li>📁 Use PDF format when possible</li>
        <li>🏷️ Name files clearly (e.g., "BusinessName_BankStatements_Jan2025.pdf")</li>
      </ul>
      
      <p><strong>Need Help Finding These Documents?</strong><br>
      Our support team can guide you on where to find specific documents or acceptable alternatives. Contact us at support@comparefunding.io</p>
      
      <p><strong>Questions About This Request?</strong><br>
      You can also contact ${lenderName} directly through your dashboard messaging system for any clarifications.</p>
      
      <p>The faster you submit these documents, the quicker your application can move forward!</p>
      
      <p>Best regards,<br>The Compare Funding Team</p>
    </div>
    <div class="footer">
      <p>&copy; 2025 Compare Funding. All rights reserved.</p>
      <p>This email was sent because a lender requested additional documents for your application.</p>
    </div>
  `;

  const html = createEmailWrapper(content, styles);

  const text = `
${config.icon} Documents Requested

${config.urgency}: ${lenderName} has requested additional documents for your application.

Hi ${firstName},

${lenderName} needs additional documentation to continue processing your funding application for ${businessName}.

${dueDate ? `⏰ Due Date: Please submit these documents by ${dueDate} to keep your application on track.` : ''}

Required Documents:
${documentList.map(doc => `- ${doc}`).join('\n')}

How to Submit:
1. Log into your Compare Funding dashboard
2. Navigate to your application with ${lenderName}
3. Upload the requested documents in the designated section
4. Click "Submit Documents" to send them directly to the lender

Upload documents: ${dashboardUrl}

Document Submission Tips:
- Ensure documents are clear and legible
- Use high-quality scans or photos
- Double-check that all requested items are included
- Use PDF format when possible
- Name files clearly (e.g., "BusinessName_BankStatements_Jan2025.pdf")

Need Help Finding These Documents?
Our support team can guide you on where to find specific documents or acceptable alternatives. Contact us at support@comparefunding.io

Questions About This Request?
You can also contact ${lenderName} directly through your dashboard messaging system for any clarifications.

The faster you submit these documents, the quicker your application can move forward!

Best regards,
The Compare Funding Team

---
© 2025 Compare Funding. All rights reserved.
This email was sent because a lender requested additional documents for your application.
  `;

  return { subject, html, text };
};

// Document submission confirmation
export const getDocumentSubmissionConfirmationEmail = (data: {
  firstName: string;
  businessName: string;
  lenderName: string;
  documentCount: number;
  submissionTime?: string;
  dashboardUrl?: string;
}): EmailTemplate => {
  const { 
    firstName, 
    businessName, 
    lenderName, 
    documentCount,
    submissionTime = new Date().toLocaleString(),
    dashboardUrl = 'http://localhost:8080/dashboard'
  } = data;
  
  const subject = `✅ Documents Submitted to ${lenderName} - ${businessName}`;
  
  const styles = `
    .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 40px 30px; text-align: center; }
    .success-banner { background: #d4edda; padding: 20px; border-radius: 6px; margin: 20px 0; border: 2px solid #28a745; text-align: center; }
    .submission-details { background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; }
    .next-steps { background: #e7f3ff; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #007bff; }
  `;

  const content = `
    <div class="header">
      <h1>✅ Documents Submitted!</h1>
    </div>
    <div class="content">
      <div class="success-banner">
        <h2>📤 Successfully Submitted!</h2>
        <p>Your documents have been sent to ${lenderName}</p>
      </div>
      
      <h2>Hi ${firstName},</h2>
      <p>Great job! You've successfully submitted the requested documents for your <strong>${businessName}</strong> funding application to <strong>${lenderName}</strong>.</p>
      
      <div class="submission-details">
        <h3>📋 Submission Summary</h3>
        <p><strong>Lender:</strong> ${lenderName}</p>
        <p><strong>Business:</strong> ${businessName}</p>
        <p><strong>Documents Submitted:</strong> ${documentCount} ${documentCount === 1 ? 'file' : 'files'}</p>
        <p><strong>Submission Time:</strong> ${submissionTime}</p>
        <p><strong>Status:</strong> ✅ Delivered to Lender</p>
      </div>
      
      <div class="next-steps">
        <h3>🚀 What Happens Next?</h3>
        <p><strong>${lenderName}</strong> will review your submitted documents. Here's what to expect:</p>
        <ul>
          <li>📄 <strong>Document Review:</strong> The lender will verify and process your documents</li>
          <li>📞 <strong>Possible Follow-up:</strong> They may contact you if they need clarification or additional items</li>
          <li>⏱️ <strong>Review Timeline:</strong> Most document reviews are completed within 1-3 business days</li>
          <li>📧 <strong>Status Updates:</strong> You'll receive notifications about any status changes</li>
        </ul>
      </div>
      
      <p><strong>📱 Track Your Progress</strong><br>
      You can monitor your application status and view all communication with the lender in your dashboard.</p>
      
      <a href="${dashboardUrl}" class="btn">View Application Status</a>
      
      <h3>💡 While You Wait:</h3>
      <ul>
        <li>📞 Keep your contact information updated</li>
        <li>📱 Check your dashboard regularly for updates</li>
        <li>⚡ Respond quickly to any additional requests</li>
        <li>📋 Have backup copies of your documents ready</li>
      </ul>
      
      <p><strong>Questions or Concerns?</strong><br>
      If you have any questions about your submission or need assistance, contact our support team at support@comparefunding.io</p>
      
      <p>You're making great progress toward securing your funding!</p>
      
      <p>Best regards,<br>The Compare Funding Team</p>
    </div>
    <div class="footer">
      <p>&copy; 2025 Compare Funding. All rights reserved.</p>
      <p>This email was sent because you submitted documents for your funding application.</p>
    </div>
  `;

  const html = createEmailWrapper(content, styles);

  const text = `
✅ Documents Submitted Successfully!

Hi ${firstName},

Great job! You've successfully submitted the requested documents for your ${businessName} funding application to ${lenderName}.

Submission Summary:
- Lender: ${lenderName}
- Business: ${businessName}
- Documents Submitted: ${documentCount} ${documentCount === 1 ? 'file' : 'files'}
- Submission Time: ${submissionTime}
- Status: ✅ Delivered to Lender

What Happens Next?
${lenderName} will review your submitted documents. Here's what to expect:

- Document Review: The lender will verify and process your documents
- Possible Follow-up: They may contact you if they need clarification or additional items
- Review Timeline: Most document reviews are completed within 1-3 business days
- Status Updates: You'll receive notifications about any status changes

Track Your Progress:
You can monitor your application status and view all communication with the lender in your dashboard: ${dashboardUrl}

While You Wait:
- Keep your contact information updated
- Check your dashboard regularly for updates
- Respond quickly to any additional requests
- Have backup copies of your documents ready

Questions or Concerns?
If you have any questions about your submission or need assistance, contact our support team at support@comparefunding.io

You're making great progress toward securing your funding!

Best regards,
The Compare Funding Team

---
© 2025 Compare Funding. All rights reserved.
This email was sent because you submitted documents for your funding application.
  `;

  return { subject, html, text };
};

// Document invitation email for colleague/accountant uploads
export const getDocumentInvitationEmail = (data: {
  colleagueName?: string;
  businessName: string;
  inviterName: string;
  uploadUrl: string;
  message?: string;
}): EmailTemplate => {
  const { colleagueName, businessName, inviterName, uploadUrl, message } = data;
  
  const subject = `Document Upload Request - ${businessName} Funding Application`;
  
  const styles = `
    .header { background: linear-gradient(135deg, #6f42c1 0%, #007bff 100%); padding: 40px 30px; text-align: center; }
    .message-box { background: #e3f2fd; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #2196f3; }
    .requirements { background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; }
    .security-note { background: #d4edda; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #28a745; }
  `;

  const content = `
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
      
      <div class="security-note">
        <strong>🔒 Security:</strong> Our platform uses bank-level encryption to keep all financial information completely secure and confidential.
      </div>
      
      <a href="${uploadUrl}" class="btn">Upload Documents Securely</a>
      
      <h3>📤 What to Expect:</h3>
      <ol>
        <li>Click the secure upload link above</li>
        <li>Follow the guided upload process</li>
        <li>Upload the required financial documents</li>
        <li>We'll notify ${inviterName} when complete</li>
      </ol>
      
      <p>If you have any questions about this request, please contact ${inviterName} directly or our support team at support@comparefunding.io</p>
      
      <p>Thank you for your assistance!</p>
      
      <p>Best regards,<br>The Compare Funding Team</p>
    </div>
    <div class="footer">
      <p>&copy; 2025 Compare Funding. All rights reserved.</p>
      <p>This invitation was sent by ${inviterName} for ${businessName}</p>
    </div>
  `;

  const html = createEmailWrapper(content, styles);

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

What to Expect:
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
};
