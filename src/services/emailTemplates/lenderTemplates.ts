import { EmailTemplate, createEmailWrapper } from './types';

// Lender invitation email (matches existing mailgunService.ts signature)
export const getLenderInvitationEmail = (data: {
  to: string;
  firstName: string;
  lastName: string;
  organizationName: string;
  inviterName: string;
  role: string;
  acceptUrl: string;
}): EmailTemplate => {
  const { 
    firstName, 
    lastName,
    organizationName,
    inviterName,
    role,
    acceptUrl
  } = data;
  
  const subject = `Lender Invitation - ${organizationName}`;
  
  const styles = `
    .header { background: linear-gradient(135deg, #6f42c1 0%, #5a32a3 100%); padding: 40px 30px; text-align: center; }
    .invitation-details { background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; margin: 8px 0; }
    .cta-section { background: #e7f3ff; padding: 20px; border-radius: 6px; margin: 20px 0; text-align: center; }
  `;

  const content = `
    <div class="header">
      <h1>🤝 Lender Invitation</h1>
    </div>
    <div class="content">
      <h2>Hi ${firstName} ${lastName},</h2>
      <p><strong>${inviterName}</strong> has invited you to join <strong>${organizationName}</strong> as a ${role} on Compare Funding.</p>
      
      <div class="invitation-details">
        <h3>📋 Invitation Details</h3>
        <div class="detail-row">
          <strong>Organization:</strong>
          <span>${organizationName}</span>
        </div>
        <div class="detail-row">
          <strong>Invited by:</strong>
          <span>${inviterName}</span>
        </div>
        <div class="detail-row">
          <strong>Role:</strong>
          <span>${role}</span>
        </div>
      </div>
      
      <div class="cta-section">
        <h3>🚀 Ready to Get Started?</h3>
        <p>Accept this invitation to join the platform and start connecting with quality business opportunities.</p>
        <a href="${acceptUrl}" class="btn">Accept Invitation</a>
      </div>
      
      <h3>💡 What You'll Get:</h3>
      <ul>
        <li>✅ <strong>Quality Applications:</strong> Pre-screened business funding applications</li>
        <li>📊 <strong>Complete Profiles:</strong> Full business and financial information</li>
        <li>⚡ <strong>Direct Connection:</strong> Connect directly with business owners</li>
        <li>🎯 <strong>Better Matching:</strong> Applications tailored to your lending criteria</li>
      </ul>
      
      <p><strong>Questions or Support?</strong><br>
      Contact our lender success team at lenders@comparefunding.io</p>
      
      <p>Best regards,<br>The Compare Funding Team</p>
    </div>
    <div class="footer">
      <p>&copy; 2025 Compare Funding. All rights reserved.</p>
      <p>This invitation was sent by ${inviterName} from ${organizationName}.</p>
    </div>
  `;

  const html = createEmailWrapper(content, styles);

  const text = `
Lender Invitation - ${organizationName}

Hi ${firstName} ${lastName},

${inviterName} has invited you to join ${organizationName} as a ${role} on Compare Funding.

Invitation Details:
- Organization: ${organizationName}
- Invited by: ${inviterName}
- Role: ${role}

Accept this invitation to join the platform and start connecting with quality business opportunities.

Accept Invitation: ${acceptUrl}

What You'll Get:
✅ Quality Applications: Pre-screened business funding applications
📊 Complete Profiles: Full business and financial information
⚡ Direct Connection: Connect directly with business owners
🎯 Better Matching: Applications tailored to your lending criteria

Questions or Support?
Contact our lender success team at lenders@comparefunding.io

Best regards,
The Compare Funding Team

---
© 2025 Compare Funding. All rights reserved.
This invitation was sent by ${inviterName} from ${organizationName}.
  `;

  return { subject, html, text };
};

// Lender prospect notification (matches existing mailgunService.ts signature)
export const getLenderProspectNotificationEmail = (data: {
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
}): EmailTemplate => {
  const { 
    lenderName,
    businessName, 
    applicationNumber,
    productType,
    loanAmount,
    annualRevenue,
    yearsTrading,
    industry,
    connectionUrl,
    businessDetailUrl
  } = data;
  
  const subject = `🎯 New Prospect: ${businessName} - ${productType}`;
  
  const styles = `
    .header { background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); padding: 40px 30px; text-align: center; }
    .prospect-highlight { background: #f8d7da; padding: 20px; border-radius: 6px; margin: 20px 0; border: 2px solid #dc3545; text-align: center; }
    .prospect-details { background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; margin: 8px 0; }
    .action-section { background: #d4edda; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #28a745; }
  `;

  const content = `
    <div class="header">
      <h1>🎯 New Prospect Alert!</h1>
    </div>
    <div class="content">
      <div class="prospect-highlight">
        <h2>💼 ${businessName}</h2>
        <p><strong>Product Type:</strong> ${productType}</p>
      </div>
      
      <h2>Hi ${lenderName},</h2>
      <p>We have a new prospect for you! <strong>${businessName}</strong> is seeking ${productType} funding.</p>
      
      <div class="prospect-details">
        <h3>🏢 Prospect Details</h3>
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
          <strong>Loan Amount:</strong>
          <span>£${loanAmount.toLocaleString()}</span>
        </div>
        ${annualRevenue ? `
        <div class="detail-row">
          <strong>Annual Revenue:</strong>
          <span>£${annualRevenue.toLocaleString()}</span>
        </div>
        ` : ''}
        ${yearsTrading ? `
        <div class="detail-row">
          <strong>Years Trading:</strong>
          <span>${yearsTrading} years</span>
        </div>
        ` : ''}
        ${industry ? `
        <div class="detail-row">
          <strong>Industry:</strong>
          <span>${industry}</span>
        </div>
        ` : ''}
      </div>
      
      <div class="action-section">
        <h3>⚡ Take Action</h3>
        <p><strong>Don't miss this opportunity!</strong> Review the full business profile and make your move.</p>
        
        ${connectionUrl ? `<a href="${connectionUrl}" class="btn">Connect Now</a>` : ''}
        ${businessDetailUrl ? `<a href="${businessDetailUrl}" class="btn-secondary">View Full Profile</a>` : ''}
      </div>
      
      <h3>💡 Why This Matters:</h3>
      <ul>
        <li>🔥 <strong>Fresh Lead:</strong> New business application in your area</li>
        <li>💰 <strong>Qualified Prospect:</strong> Has specific funding needs and amount</li>
        <li>⏰ <strong>First Mover Advantage:</strong> Early contact increases success rates</li>
        <li>🎯 <strong>Good Match:</strong> Fits your lending criteria</li>
      </ul>
      
      <p><strong>Questions or Support?</strong><br>
      Our lender success team is here to help. Contact us at lenders@comparefunding.io</p>
      
      <p>Good luck with this prospect!</p>
      
      <p>Best regards,<br>The Compare Funding Team</p>
    </div>
    <div class="footer">
      <p>&copy; 2025 Compare Funding. All rights reserved.</p>
      <p>This email was sent because we found a new prospect matching your criteria.</p>
    </div>
  `;

  const html = createEmailWrapper(content, styles);

  const text = `
🎯 New Prospect: ${businessName} - ${productType}

Hi ${lenderName},

We have a new prospect for you! ${businessName} is seeking ${productType} funding.

Prospect Details:
- Business Name: ${businessName}
- Application Number: ${applicationNumber}
- Product Type: ${productType}
- Loan Amount: £${loanAmount.toLocaleString()}
${annualRevenue ? `- Annual Revenue: £${annualRevenue.toLocaleString()}` : ''}
${yearsTrading ? `- Years Trading: ${yearsTrading} years` : ''}
${industry ? `- Industry: ${industry}` : ''}

⚡ Take Action
Don't miss this opportunity! Review the full business profile and make your move.

${connectionUrl ? `Connect Now: ${connectionUrl}` : ''}
${businessDetailUrl ? `View Full Profile: ${businessDetailUrl}` : ''}

Why This Matters:
🔥 Fresh Lead: New business application in your area
💰 Qualified Prospect: Has specific funding needs and amount
⏰ First Mover Advantage: Early contact increases success rates
🎯 Good Match: Fits your lending criteria

Questions or Support?
Our lender success team is here to help. Contact us at lenders@comparefunding.io

Good luck with this prospect!

Best regards,
The Compare Funding Team

---
© 2025 Compare Funding. All rights reserved.
This email was sent because we found a new prospect matching your criteria.
  `;

  return { subject, html, text };
};
