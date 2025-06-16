/**
 * Example Firebase Function for custom magic link emails
 * Place this in your Firebase Functions directory
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

// Configure your email service (example with Gmail)
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: functions.config().gmail.email,
    pass: functions.config().gmail.password,
  },
});

export const sendCustomMagicLink = functions.https.onCall(async (data, context) => {
  const { email } = data;
  
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  try {
    // Generate custom magic link
    const link = await admin.auth().generateSignInWithEmailLink(email, {
      url: 'https://yourdomain.com/auth/verify-email',
      handleCodeInApp: true,
    });

    // Custom email template
    const emailTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Sign in to Compare Funding</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; }
          .header { background-color: #ff8000; padding: 20px; text-align: center; }
          .logo { color: white; font-size: 24px; font-weight: bold; }
          .content { padding: 30px 20px; }
          .button { 
            display: inline-block; 
            background-color: #ff8000; 
            color: white; 
            padding: 15px 30px; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0;
          }
          .footer { background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">Compare Funding</div>
        </div>
        
        <div class="content">
          <h2>Welcome back!</h2>
          <p>Hello,</p>
          <p>You requested to sign in to your Compare Funding account. Click the button below to complete your sign-in:</p>
          
          <div style="text-align: center;">
            <a href="${link}" class="button">Sign In to Compare Funding</a>
          </div>
          
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${link}</p>
          
          <p><strong>Important:</strong></p>
          <ul>
            <li>This link will expire in 1 hour</li>
            <li>This link can only be used once</li>
            <li>If you didn't request this, please ignore this email</li>
          </ul>
          
          <p>Need help? Contact our support team at support@comparefunding.com</p>
        </div>
        
        <div class="footer">
          <p>&copy; 2025 Compare Funding. All rights reserved.</p>
          <p>This email was sent to ${email}</p>
        </div>
      </body>
      </html>
    `;

    // Send email
    await transporter.sendMail({
      from: '"Compare Funding" <noreply@comparefunding.com>',
      to: email,
      subject: 'Sign in to Compare Funding',
      html: emailTemplate,
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending custom magic link:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send magic link');
  }
});

/**
 * Alternative: Use a trigger to customize emails automatically
 */
export const customizeAuthEmails = functions.auth.user().beforeCreate((user, context) => {
  // You can modify user properties or trigger custom emails here
  return {
    customClaims: {
      role: 'business' // default role
    }
  };
});
