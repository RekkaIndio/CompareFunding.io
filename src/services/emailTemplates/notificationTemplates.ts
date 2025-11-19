import { EmailTemplate, createEmailWrapper } from './types';

// General notification email template
export const getGeneralNotificationEmail = (data: {
  firstName: string;
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
  priority?: 'low' | 'medium' | 'high';
}): EmailTemplate => {
  const { 
    firstName, 
    title, 
    message,
    actionUrl,
    actionText = 'View Details',
    priority = 'medium'
  } = data;
  
  const subject = title;
  
  const priorityColors = {
    low: '#6c757d',
    medium: '#007bff', 
    high: '#fd7e14'
  };
  
  const styles = `
    .header { background: linear-gradient(135deg, ${priorityColors[priority]} 0%, ${priorityColors[priority]}dd 100%); padding: 40px 30px; text-align: center; }
    .notification-content { background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; }
  `;

  const content = `
    <div class="header">
      <h1>🔔 ${title}</h1>
    </div>
    <div class="content">
      <h2>Hi ${firstName},</h2>
      
      <div class="notification-content">
        <p>${message}</p>
      </div>
      
      ${actionUrl ? `<a href="${actionUrl}" class="btn">${actionText}</a>` : ''}
      
      <p>If you have any questions, our support team is here to help at support@comparefunding.io</p>
      
      <p>Best regards,<br>The Compare Funding Team</p>
    </div>
    <div class="footer">
      <p>&copy; 2025 Compare Funding. All rights reserved.</p>
      <p>This email was sent as a notification update.</p>
    </div>
  `;

  const html = createEmailWrapper(content, styles);

  const text = `
${title}

Hi ${firstName},

${message}

${actionUrl ? `${actionText}: ${actionUrl}` : ''}

If you have any questions, our support team is here to help at support@comparefunding.io

Best regards,
The Compare Funding Team

---
© 2025 Compare Funding. All rights reserved.
This email was sent as a notification update.
  `;

  return { subject, html, text };
};

// New message notification for businesses (matches existing mailgunService.ts signature)
export const getNewMessageNotificationBusinessEmail = (data: {
  businessName: string;
  businessOwnerName: string;
  lenderName: string;
  applicationNumber: string;
  applicationPurpose: string;
  applicationAmount: number;
  messagePreview: string;
  messagesUrl?: string;
}): EmailTemplate => {
  const { 
    businessName,
    businessOwnerName, 
    lenderName, 
    applicationNumber,
    applicationPurpose,
    applicationAmount,
    messagePreview,
    messagesUrl = 'http://localhost:8080/messages'
  } = data;
  
  const subject = `💬 New Message from ${lenderName}`;
  
  const styles = `
    .header { background: linear-gradient(135deg, #17a2b8 0%, #138496 100%); padding: 40px 30px; text-align: center; }
    .message-preview { background: #e1f5fe; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #17a2b8; }
    .app-details { background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; margin: 8px 0; }
  `;

  const content = `
    <div class="header">
      <h1>💬 New Message</h1>
    </div>
    <div class="content">
      <h2>Hi ${businessOwnerName},</h2>
      <p>You have received a new message from <strong>${lenderName}</strong> regarding your funding application for <strong>${businessName}</strong>.</p>
      
      <div class="app-details">
        <h3>📋 Application Details</h3>
        <div class="detail-row">
          <strong>Business Name:</strong>
          <span>${businessName}</span>
        </div>
        <div class="detail-row">
          <strong>Application Number:</strong>
          <span>${applicationNumber}</span>
        </div>
        <div class="detail-row">
          <strong>Purpose:</strong>
          <span>${applicationPurpose}</span>
        </div>
        <div class="detail-row">
          <strong>Amount:</strong>
          <span>£${applicationAmount.toLocaleString()}</span>
        </div>
      </div>

      <div class="message-preview">
        <h3>💬 Message Preview:</h3>
        <p><em>"${messagePreview.length > 150 ? messagePreview.substring(0, 150) + '...' : messagePreview}"</em></p>
      </div>
      
      <a href="${messagesUrl}" class="btn">View Full Message</a>
      
      <p><strong>💡 Quick Response Tip:</strong> Prompt communication with lenders often leads to faster approvals and better offer terms. Consider responding quickly to maintain momentum.</p>
      
      <p>Questions about this message or need support? Contact our support team at support@comparefunding.io</p>
      
      <p>Best regards,<br>The Compare Funding Team</p>
    </div>
    <div class="footer">
      <p>&copy; 2025 Compare Funding. All rights reserved.</p>
      <p>This message was sent because you have an active funding application.</p>
    </div>
  `;

  const html = createEmailWrapper(content, styles);

  const text = `
💬 New Message from ${lenderName}

Hi ${businessOwnerName},

You have received a new message from ${lenderName} regarding your funding application for ${businessName}.

Application Details:
- Business Name: ${businessName}
- Application Number: ${applicationNumber}
- Purpose: ${applicationPurpose}
- Amount: £${applicationAmount.toLocaleString()}

Message Preview:
"${messagePreview.length > 150 ? messagePreview.substring(0, 150) + '...' : messagePreview}"

View full message: ${messagesUrl}

💡 Quick Response Tip: Prompt communication with lenders often leads to faster approvals and better offer terms. Consider responding quickly to maintain momentum.

Questions about this message or need support? Contact our support team at support@comparefunding.io

Best regards,
The Compare Funding Team

---
© 2025 Compare Funding. All rights reserved.
This message was sent because you have an active funding application.
  `;

  return { subject, html, text };
};

// New message notification for lenders (matches existing mailgunService.ts signature)
export const getNewMessageNotificationLenderEmail = (data: {
  lenderName: string;
  lenderContactName: string;
  businessName: string;
  applicationNumber: string;
  applicationPurpose: string;
  applicationAmount: number;
  messagePreview: string;
  messagesUrl?: string;
}): EmailTemplate => {
  const { 
    lenderName,
    lenderContactName, 
    businessName, 
    applicationNumber,
    applicationPurpose,
    applicationAmount,
    messagePreview,
    messagesUrl = 'http://localhost:8080/messages'
  } = data;
  
  const subject = `💼 New Message from ${businessName}`;
  
  const styles = `
    .header { background: linear-gradient(135deg, #6f42c1 0%, #5a32a3 100%); padding: 40px 30px; text-align: center; }
    .message-preview { background: #f3e8ff; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #6f42c1; }
    .app-details { background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; margin: 8px 0; }
  `;

  const content = `
    <div class="header">
      <h1>💼 New Message</h1>
    </div>
    <div class="content">
      <h2>Hi ${lenderContactName},</h2>
      <p>You have received a new message from <strong>${businessName}</strong> regarding their funding application.</p>
      
      <div class="app-details">
        <h3>📋 Application Details</h3>
        <div class="detail-row">
          <strong>Business Name:</strong>
          <span>${businessName}</span>
        </div>
        <div class="detail-row">
          <strong>Application Number:</strong>
          <span>${applicationNumber}</span>
        </div>
        <div class="detail-row">
          <strong>Purpose:</strong>
          <span>${applicationPurpose}</span>
        </div>
        <div class="detail-row">
          <strong>Amount:</strong>
          <span>£${applicationAmount.toLocaleString()}</span>
        </div>
      </div>

      <div class="message-preview">
        <h3>💬 Message Preview:</h3>
        <p><em>"${messagePreview.length > 150 ? messagePreview.substring(0, 150) + '...' : messagePreview}"</em></p>
      </div>
      
      <a href="${messagesUrl}" class="btn">View Full Message</a>
      
      <p><strong>Opportunity Alert:</strong> Active communication with prospects often leads to successful deals. Consider responding promptly to maintain engagement.</p>
      
      <p>Questions about this application or need support? Contact our lender success team at lenders@comparefunding.io</p>
      
      <p>Best regards,<br>The Compare Funding Team</p>
    </div>
    <div class="footer">
      <p>&copy; 2025 Compare Funding. All rights reserved.</p>
      <p>This message was sent because you have an active connection with this business.</p>
    </div>
  `;

  const html = createEmailWrapper(content, styles);

  const text = `
💼 New Message from ${businessName}

Hi ${lenderContactName},

You have received a new message from ${businessName} regarding their funding application.

Application Details:
- Business Name: ${businessName}
- Application Number: ${applicationNumber}
- Purpose: ${applicationPurpose}
- Amount: £${applicationAmount.toLocaleString()}

Message Preview:
"${messagePreview.length > 150 ? messagePreview.substring(0, 150) + '...' : messagePreview}"

View full message: ${messagesUrl}

Opportunity Alert: Active communication with prospects often leads to successful deals. Consider responding promptly to maintain engagement.

Questions about this application or need support? Contact our lender success team at lenders@comparefunding.io

Best regards,
The Compare Funding Team

---
© 2025 Compare Funding. All rights reserved.
This message was sent because you have an active connection with this business.
  `;

  return { subject, html, text };
};
