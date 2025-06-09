/**
 * Utility functions for application handling
 */

/**
 * Formats application number consistently across the application
 * @param application - Application object with potential application_number field
 * @param applicationId - Fallback application ID if application_number is not available
 * @returns Formatted application number string
 */
export const formatApplicationNumber = (application: any, applicationId?: string): string => {
  // First priority: use application_number if it exists
  if (application?.application_number) {
    return application.application_number;
  }
  
  // Second priority: use provided applicationId
  if (applicationId) {
    return applicationId.slice(-8).toUpperCase();
  }
  
  // Third priority: use application.id if available
  if (application?.id) {
    return application.id.slice(-8).toUpperCase();
  }
  
  // Fallback
  return 'Unknown';
};

/**
 * Formats application display title with number
 * @param application - Application object
 * @param applicationId - Fallback application ID
 * @param includeStatus - Whether to include status in the title
 * @param status - Status to include in title
 * @returns Formatted application title
 */
export const formatApplicationTitle = (
  application: any, 
  applicationId?: string, 
  includeStatus: boolean = false, 
  status?: string
): string => {
  const appNumber = formatApplicationNumber(application, applicationId);
  
  if (includeStatus && status) {
    return `Application #${appNumber} - ${status}`;
  }
  
  return `Application #${appNumber}`;
};
