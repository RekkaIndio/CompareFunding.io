import { Application, Business } from '@/pages/Lender/BusinessDetail/types';

/**
 * Generate PDF filename for matched applications
 */
export function generateMatchedPdfFilename(application: Application, business?: Business): string {
  const businessName = business?.business_name || 'Unknown Business';
  const applicationNumber = application.application_number || 'Unknown';
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  
  // Sanitize business name for filename
  const sanitizedBusinessName = businessName
    .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .substring(0, 50); // Limit length
  
  return `Application_${sanitizedBusinessName}_${applicationNumber}_${date}.pdf`;
}

/**
 * Generate PDF filename for unmatched applications
 */
export function generateUnmatchedPdfFilename(application: Application): string {
  const applicationNumber = application.application_number || 'Unknown';
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  
  return `Application_Preview_${applicationNumber}_${date}.pdf`;
}
