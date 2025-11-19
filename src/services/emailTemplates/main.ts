// Main export file for all email templates
// This maintains backward compatibility with the original EmailTemplates class

// Import all templates from individual files
export * from './authTemplates';
export * from './applicationTemplates';
export * from './offerTemplates';
export * from './documentTemplates';
export * from './lenderTemplates';
export * from './notificationTemplates';
export * from './types';

// Import specific templates for class-based export
import { getWelcomeEmail, getPasswordResetEmail } from './authTemplates';
import { getApplicationSubmittedEmail, getApplicationSubmissionEmail, getApplicationApprovedEmail } from './applicationTemplates';
import { getOfferReceivedEmail, getOfferNotificationEmail, getOfferAcceptedEmail } from './offerTemplates';
import { getDocumentRequestEmail, getDocumentSubmissionConfirmationEmail, getDocumentInvitationEmail } from './documentTemplates';
import { getLenderInvitationEmail, getLenderProspectNotificationEmail } from './lenderTemplates';
import { getGeneralNotificationEmail, getNewMessageNotificationBusinessEmail, getNewMessageNotificationLenderEmail } from './notificationTemplates';

// Maintain backward compatibility with the original class-based approach
class EmailTemplates {
  // Authentication templates
  static getWelcomeEmail = getWelcomeEmail;
  static getPasswordResetEmail = getPasswordResetEmail;

  // Application templates
  static getApplicationSubmittedEmail = getApplicationSubmittedEmail;
  static getApplicationSubmissionEmail = getApplicationSubmissionEmail;
  static getApplicationApprovedEmail = getApplicationApprovedEmail;

  // Offer templates
  static getOfferReceivedEmail = getOfferReceivedEmail;
  static getOfferNotificationEmail = getOfferNotificationEmail;
  static getOfferAcceptedEmail = getOfferAcceptedEmail;

  // Document templates
  static getDocumentRequestEmail = getDocumentRequestEmail;
  static getDocumentSubmissionConfirmationEmail = getDocumentSubmissionConfirmationEmail;
  static getDocumentInvitationEmail = getDocumentInvitationEmail;

  // Lender templates
  static getLenderInvitationEmail = getLenderInvitationEmail;
  static getLenderProspectNotificationEmail = getLenderProspectNotificationEmail;

  // Notification templates
  static getGeneralNotificationEmail = getGeneralNotificationEmail;
  static getNewMessageNotificationBusinessEmail = getNewMessageNotificationBusinessEmail;
  static getNewMessageNotificationLenderEmail = getNewMessageNotificationLenderEmail;
}

// Export the class as default to maintain existing import patterns
export default EmailTemplates;

// Also export types for convenience
export type { EmailTemplate, EmailTemplateData } from './types';
