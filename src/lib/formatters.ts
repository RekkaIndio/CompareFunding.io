/**
 * Utility functions for formatting data consistently across the application
 */

/**
 * Formats an address object into a string
 * Handles cases where address might be a string or object with varying field names
 */
export const formatAddress = (address: any): string => {
  if (!address) return 'Address not available';
  
  // If address is a string, return it directly
  if (typeof address === 'string') return address;
  
  // If address is an object, format it
  if (typeof address === 'object') {
    const parts = [];
    
    // Handle different field naming styles for addresses
    if (address.line1) parts.push(address.line1);
    if (address.street) parts.push(address.street);
    if (address.city) parts.push(address.city);
    if (address.postal_code) parts.push(address.postal_code);
    if (address.country) parts.push(address.country);
    
    return parts.length > 0 ? parts.join(', ') : 'Address not available';
  }
  
  return 'Address not available';
};

/**
 * Creates a display-friendly business name from application and business data
 */
export const getBusinessDisplayName = (
  application: any, 
  business?: any, 
  fallback = 'Business'
): string => {
  // Try to get name from business object first
  if (business?.business_name) return business.business_name;
  if (business?.company_name) return business.company_name;
  
  // Then try application
  if (application?.business_name) return application.business_name;
  if (application?.company_name) return application.company_name;
  
  // If we have an application number, use that
  if (application?.application_number) {
    return `Application #${application.application_number}`;
  }
  
  // Fallback to ID or default text
  if (application?.id) {
    return `Application #${application.id.substring(0, 8)}`;
  }
  
  return fallback;
};

/**
 * Format currency values consistently
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount || 0);
};
