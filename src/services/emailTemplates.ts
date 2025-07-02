// Email templates - now using modular structure
// This file re-exports everything from the emailTemplates folder for backward compatibility

export * from './emailTemplates/main';
import EmailTemplatesClass from './emailTemplates/main';
export default EmailTemplatesClass;
