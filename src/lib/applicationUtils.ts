/**
 * Utility functions for application handling
 */

/**
 * Generates a structured application number
 * @param companyNumber - Company number (e.g., "GB-0-15908176" or "15908176")
 * @returns Formatted application number (e.g., "APP-15908176-247")
 * 
 * Examples:
 * - generateApplicationNumber("GB-0-15908176") → "APP-15908176-247"
 * - generateApplicationNumber("15908176") → "APP-15908176-891"
 * - generateApplicationNumber("SC-123456") → "APP-123456-634"
 * - generateApplicationNumber() → "APP-156789-432" (timestamp-based fallback)
 */
export const generateApplicationNumber = (companyNumber?: string): string => {
  // Extract numeric part from company number
  let cleanCompanyNumber = '';
  
  if (companyNumber) {
    // Remove prefixes like "GB-", "UK-", spaces, hyphens, and extract numbers
    cleanCompanyNumber = companyNumber.replace(/^(GB|UK|EN|SC|NI)-?/i, '')
                                     .replace(/[^0-9]/g, '')
                                     .slice(-8); // Take last 8 digits max
  }
  
  // If no company number or it's too short, use a timestamp-based fallback
  if (!cleanCompanyNumber || cleanCompanyNumber.length < 4) {
    const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
    cleanCompanyNumber = timestamp;
  }
  
  // Generate 3 random digits
  const randomDigits = Math.floor(100 + Math.random() * 900); // 100-999
  
  return `APP-${cleanCompanyNumber}-${randomDigits}`;
};

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
