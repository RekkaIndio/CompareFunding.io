import { serverTimestamp } from 'firebase/firestore';

/**
 * Normalizes credit score data to ensure consistent structure
 * across different parts of the application.
 * 
 * @param creditInfo The credit information data to normalize
 * @param includeRawData Whether to include raw report data (defaults to false)
 * @returns Normalized credit score data object
 */
export const normalizeCreditScoreData = (creditInfo: any) => {
  if (!creditInfo) return null;
  
  // Parse credit_score safely if it exists, ensuring we handle string or number types
  let score = null;
  if (creditInfo.credit_score !== undefined && creditInfo.credit_score !== null) {
    // First ensure we have a value to work with
    if (creditInfo.credit_score !== '' && creditInfo.credit_score !== 'N/A') {
      // Convert to number if it's a string or already a number
      score = typeof creditInfo.credit_score === 'string' 
        ? parseInt(creditInfo.credit_score, 10) 
        : Number(creditInfo.credit_score);
      
      // If conversion fails or results in NaN, set to null
      if (isNaN(score)) {
        score = null;
      }
    }
  }
  
  // Standard format we want to return
  const normalized = {
    score: score,
    risk_level: creditInfo.risk || creditInfo.common_description || '',
    company_status: creditInfo.status || creditInfo.company_status || '',
    international_score: creditInfo.international_score || creditInfo.international_value || '',
    credit_limit: creditInfo.credit_limit || '',
    negative_information: creditInfo.negative_information || '',
    last_updated: new Date().toISOString(),
    details: { ...creditInfo }, // Keep all original data in a details sub-object
    _dataVersion: '1.0',
    _createdAt: serverTimestamp()
  };
  
  return normalized;
};

/**
 * Creates the financials subcollection credit score document
 * 
 * @param creditInfo Normalized credit information
 * @param companyName Company name
 * @param companyNumber Company registration number
 * @param rawData Optional raw credit report data
 * @returns Document data to save to financials/credit_score
 */
export const createFinancialsCreditScoreDocument = (
  creditInfo: any, 
  companyName: string = '',
  companyNumber: string = '',
  rawData: any = null
) => {
  return {
    documentType: "credit_score",
    data: {
      ...normalizeCreditScoreData(creditInfo),
      company_name: companyName,
      company_number: companyNumber
    },
    raw_data: rawData, // Include the full credit report data if available
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    summary: `Credit score for ${companyName}: ${creditInfo.credit_score || 'N/A'}, Risk Level: ${creditInfo.risk || creditInfo.common_description || 'N/A'}`
  };
};
