import { EmailTemplate, createEmailWrapper } from './types';

// Original offer received email (renamed from getOfferReceivedEmail)
export const getOfferReceivedEmail = (data: {
  firstName: string;
  businessName: string;
  lenderName: string;
  offerAmount: number;
  interestRate: number;
  termMonths: number;
  offerUrl?: string;
}): EmailTemplate => {
  const { firstName, businessName, lenderName, offerAmount, interestRate, termMonths, offerUrl = 'http://localhost:8080/offers' } = data;
  
  const subject = `🎉 New Funding Offer - £${offerAmount.toLocaleString()} from ${lenderName}`;
  
  const styles = `
    .header { background: linear-gradient(135deg, #ff8000 0%, #ff6000 100%); padding: 40px 30px; text-align: center; }
    .offer-details { background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #ff8000; }
    .detail-row { display: flex; justify-content: space-between; margin: 8px 0; }
    .highlight { background: #fff3cd; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #ffc107; }
  `;

  const content = `
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
      
      <h3>🚀 Next Steps:</h3>
      <ol>
        <li>Review the complete offer terms and conditions</li>
        <li>Compare with any other offers you may have received</li>
        <li>Accept the offer if it meets your requirements</li>
        <li>Connect directly with ${lenderName} to finalize details</li>
      </ol>
      
      <p><strong>💡 Remember:</strong> You can always negotiate terms or ask questions before accepting.</p>
      
      <p>Best regards,<br>The Compare Funding Team</p>
    </div>
    <div class="footer">
      <p>&copy; 2025 Compare Funding. All rights reserved.</p>
    </div>
  `;

  const html = createEmailWrapper(content, styles);

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

💡 Remember: You can always negotiate terms or ask questions before accepting.

Best regards,
The Compare Funding Team

---
© 2025 Compare Funding. All rights reserved.
  `;

  return { subject, html, text };
};

// New offer notification for businesses (enhanced version)
export const getOfferNotificationEmail = (data: {
  firstName: string;
  businessName: string;
  lenderName: string;
  offerAmount: string;
  interestRate: string;
  term: string;
  dashboardUrl?: string;
  expiryDate?: string;
}): EmailTemplate => {
  const { 
    firstName, 
    businessName, 
    lenderName, 
    offerAmount, 
    interestRate, 
    term,
    dashboardUrl = 'http://localhost:8080/dashboard',
    expiryDate
  } = data;
  
  const subject = `🎯 New Funding Offer for ${businessName} - ${offerAmount}`;
  
  const styles = `
    .header { background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); padding: 40px 30px; text-align: center; }
    .offer-details { background: #e7f3ff; padding: 20px; border-radius: 6px; margin: 20px 0; border: 2px solid #007bff; }
    .offer-highlight { background: #28a745; color: white; padding: 15px; border-radius: 6px; text-align: center; margin: 15px 0; }
    .urgency { background: #fff3cd; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #ffc107; }
  `;

  const content = `
    <div class="header">
      <h1>🎯 New Funding Offer!</h1>
    </div>
    <div class="content">
      <h2>Exciting News, ${firstName}!</h2>
      <p>You've received a new funding offer for <strong>${businessName}</strong> from <strong>${lenderName}</strong>.</p>
      
      <div class="offer-highlight">
        <h3>💰 Offer Amount: ${offerAmount}</h3>
      </div>
      
      <div class="offer-details">
        <h3>📊 Offer Details</h3>
        <p><strong>Lender:</strong> ${lenderName}</p>
        <p><strong>Funding Amount:</strong> ${offerAmount}</p>
        <p><strong>Interest Rate:</strong> ${interestRate}</p>
        <p><strong>Term:</strong> ${term}</p>
        <p><strong>Business:</strong> ${businessName}</p>
      </div>
      
      ${expiryDate ? `
        <div class="urgency">
          <strong>⏰ Time Sensitive:</strong> This offer expires on ${expiryDate}. Don't miss out on this opportunity!
        </div>
      ` : ''}
      
      <h3>🚀 Next Steps:</h3>
      <ol>
        <li><strong>Review the full offer details</strong> in your dashboard</li>
        <li><strong>Compare with other offers</strong> you may have received</li>
        <li><strong>Ask questions</strong> directly to the lender if needed</li>
        <li><strong>Accept or decline</strong> the offer through your dashboard</li>
      </ol>
      
      <a href="${dashboardUrl}" class="btn">Review Offer Now</a>
      
      <h3>💡 Review Tips:</h3>
      <ul>
        <li>📋 Compare all terms, not just the interest rate</li>
        <li>📞 Contact the lender directly with any questions</li>
        <li>⚖️ Consider the total cost of funding over the full term</li>
        <li>🕒 Review repayment schedules and requirements</li>
        <li>📄 Read all terms and conditions carefully</li>
      </ul>
      
      <p><strong>Questions About This Offer?</strong><br>
      Contact our support team at support@comparefunding.io - we're here to help you make the best decision for your business.</p>
      
      <p>Congratulations on receiving this offer, and best of luck with your funding decision!</p>
      
      <p>Best regards,<br>The Compare Funding Team</p>
    </div>
    <div class="footer">
      <p>&copy; 2025 Compare Funding. All rights reserved.</p>
      <p>This email was sent because you received a new funding offer.</p>
    </div>
  `;

  const html = createEmailWrapper(content, styles);

  const text = `
🎯 New Funding Offer!

Exciting News, ${firstName}!

You've received a new funding offer for ${businessName} from ${lenderName}.

Offer Details:
- Lender: ${lenderName}
- Funding Amount: ${offerAmount}
- Interest Rate: ${interestRate}
- Term: ${term}
- Business: ${businessName}

${expiryDate ? `⏰ Time Sensitive: This offer expires on ${expiryDate}. Don't miss out on this opportunity!` : ''}

Next Steps:
1. Review the full offer details in your dashboard
2. Compare with other offers you may have received
3. Ask questions directly to the lender if needed
4. Accept or decline the offer through your dashboard

Review offer: ${dashboardUrl}

Review Tips:
- Compare all terms, not just the interest rate
- Contact the lender directly with any questions
- Consider the total cost of funding over the full term
- Review repayment schedules and requirements
- Read all terms and conditions carefully

Questions About This Offer?
Contact our support team at support@comparefunding.io - we're here to help you make the best decision for your business.

Congratulations on receiving this offer, and best of luck with your funding decision!

Best regards,
The Compare Funding Team

---
© 2025 Compare Funding. All rights reserved.
This email was sent because you received a new funding offer.
  `;

  return { subject, html, text };
};

// Offer accepted confirmation
export const getOfferAcceptedEmail = (data: {
  firstName: string;
  businessName: string;
  lenderName: string;
  offerAmount: string;
  lenderContact?: string;
  dashboardUrl?: string;
}): EmailTemplate => {
  const { 
    firstName, 
    businessName, 
    lenderName, 
    offerAmount,
    lenderContact,
    dashboardUrl = 'http://localhost:8080/dashboard'
  } = data;
  
  const subject = `✅ Offer Accepted - ${offerAmount} from ${lenderName}`;
  
  const styles = `
    .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 40px 30px; text-align: center; }
    .success-banner { background: #d4edda; padding: 20px; border-radius: 6px; margin: 20px 0; border: 2px solid #28a745; text-align: center; }
    .contact-info { background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; }
    .next-steps { background: #e7f3ff; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #007bff; }
  `;

  const content = `
    <div class="header">
      <h1>🎉 Congratulations!</h1>
    </div>
    <div class="content">
      <div class="success-banner">
        <h2>✅ Offer Accepted Successfully!</h2>
        <p>You've successfully accepted the funding offer for <strong>${businessName}</strong></p>
      </div>
      
      <h2>Hi ${firstName},</h2>
      <p>Great news! Your acceptance of the funding offer from <strong>${lenderName}</strong> has been confirmed.</p>
      
      <div class="contact-info">
        <h3>📋 Offer Summary</h3>
        <p><strong>Lender:</strong> ${lenderName}</p>
        <p><strong>Funding Amount:</strong> ${offerAmount}</p>
        <p><strong>Business:</strong> ${businessName}</p>
        <p><strong>Status:</strong> ✅ Accepted</p>
        ${lenderContact ? `<p><strong>Lender Contact:</strong> ${lenderContact}</p>` : ''}
      </div>
      
      <div class="next-steps">
        <h3>🚀 What Happens Next?</h3>
        <p><strong>The lender will contact you directly</strong> to begin the final funding process. This typically includes:</p>
        <ul>
          <li>📄 Final document collection and verification</li>
          <li>📋 Loan agreement review and signing</li>
          <li>🏦 Bank account verification for fund transfer</li>
          <li>⏱️ Final underwriting and approval</li>
          <li>💰 Fund disbursement</li>
        </ul>
      </div>
      
      <h3>📞 Stay Connected</h3>
      <p>Keep an eye on your email and phone for communication from ${lenderName}. Respond promptly to any requests to keep the process moving smoothly.</p>
      
      <a href="${dashboardUrl}" class="btn">View Dashboard</a>
      
      <h3>💡 Final Funding Tips:</h3>
      <ul>
        <li>📱 Keep your contact information current</li>
        <li>📄 Have all requested documents ready</li>
        <li>❓ Ask questions if anything is unclear</li>
        <li>⏰ Respond quickly to lender requests</li>
        <li>🔍 Review all final agreements carefully</li>
      </ul>
      
      <p><strong>Need Support?</strong><br>
      Our team remains available to help throughout the final funding process. Contact us at support@comparefunding.io if you need assistance.</p>
      
      <p>Congratulations on taking this important step for your business!</p>
      
      <p>Best regards,<br>The Compare Funding Team</p>
    </div>
    <div class="footer">
      <p>&copy; 2025 Compare Funding. All rights reserved.</p>
      <p>This email was sent because you accepted a funding offer.</p>
    </div>
  `;

  const html = createEmailWrapper(content, styles);

  const text = `
🎉 Congratulations! Offer Accepted Successfully!

Hi ${firstName},

Great news! Your acceptance of the funding offer from ${lenderName} has been confirmed.

Offer Summary:
- Lender: ${lenderName}
- Funding Amount: ${offerAmount}
- Business: ${businessName}
- Status: ✅ Accepted
${lenderContact ? `- Lender Contact: ${lenderContact}` : ''}

What Happens Next?
The lender will contact you directly to begin the final funding process. This typically includes:

- Final document collection and verification
- Loan agreement review and signing
- Bank account verification for fund transfer
- Final underwriting and approval
- Fund disbursement

Stay Connected:
Keep an eye on your email and phone for communication from ${lenderName}. Respond promptly to any requests to keep the process moving smoothly.

View dashboard: ${dashboardUrl}

Final Funding Tips:
- Keep your contact information current
- Have all requested documents ready
- Ask questions if anything is unclear
- Respond quickly to lender requests
- Review all final agreements carefully

Need Support?
Our team remains available to help throughout the final funding process. Contact us at support@comparefunding.io if you need assistance.

Congratulations on taking this important step for your business!

Best regards,
The Compare Funding Team

---
© 2025 Compare Funding. All rights reserved.
This email was sent because you accepted a funding offer.
  `;

  return { subject, html, text };
};
