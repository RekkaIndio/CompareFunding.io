import { EmailTemplate, createEmailWrapper } from './types';

// Welcome email for new users
export const getWelcomeEmail = (data: {
  firstName: string;
  role: 'business' | 'lender';
  loginUrl?: string;
}): EmailTemplate => {
  const { firstName, role, loginUrl = 'http://localhost:8080/login' } = data;
  
  const subject = `Welcome to Compare Funding, ${firstName}!`;
  
  const styles = `
    .features { background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; }
    .feature { margin: 10px 0; }
    .header { background: linear-gradient(135deg, #ff8000 0%, #ff6000 100%); padding: 40px 30px; text-align: center; }
  `;

  const content = `
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
  `;

  const html = createEmailWrapper(content, styles);

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
};

// Password reset email
export const getPasswordResetEmail = (data: {
  firstName?: string;
  resetUrl: string;
  expiryTime?: string;
}): EmailTemplate => {
  const { firstName = 'User', resetUrl, expiryTime = '1 hour' } = data;
  
  const subject = 'Reset Your Compare Funding Password';
  
  const styles = `
    .header { background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); padding: 40px 30px; text-align: center; }
    .security-notice { background: #fff3cd; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #ffc107; }
  `;

  const content = `
    <div class="header">
      <h1>🔒 Password Reset Request</h1>
    </div>
    <div class="content">
      <h2>Hi ${firstName},</h2>
      <p>We received a request to reset your password for your Compare Funding account.</p>
      
      <p>Click the button below to create a new password:</p>
      
      <a href="${resetUrl}" class="btn">Reset My Password</a>
      
      <div class="security-notice">
        <strong>⏰ Important:</strong> This password reset link will expire in ${expiryTime}. If you don't reset your password within this time, you'll need to request a new reset link.
      </div>
      
      <p><strong>If you didn't request this password reset, please ignore this email.</strong> Your account remains secure and no changes have been made.</p>
      
      <p>For security reasons:</p>
      <ul>
        <li>Never share this reset link with anyone</li>
        <li>Make sure you're on the official Compare Funding website</li>
        <li>Choose a strong, unique password</li>
        <li>Contact our support team if you have questions</li>
      </ul>
      
      <p><strong>Need Help?</strong><br>
      If you're having trouble resetting your password or have any questions, our support team is here to help at support@comparefunding.io</p>
      
      <p>Best regards,<br>The Compare Funding Team</p>
    </div>
    <div class="footer">
      <p>&copy; 2025 Compare Funding. All rights reserved.</p>
      <p>This email was sent because a password reset was requested for your account.</p>
      <p>If you didn't make this request, you can safely ignore this email.</p>
    </div>
  `;

  const html = createEmailWrapper(content, styles);

  const text = `
Reset Your Compare Funding Password

Hi ${firstName},

We received a request to reset your password for your Compare Funding account.

Reset your password: ${resetUrl}

⏰ Important: This password reset link will expire in ${expiryTime}. If you don't reset your password within this time, you'll need to request a new reset link.

If you didn't request this password reset, please ignore this email. Your account remains secure and no changes have been made.

For security reasons:
- Never share this reset link with anyone
- Make sure you're on the official Compare Funding website
- Choose a strong, unique password
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
};
