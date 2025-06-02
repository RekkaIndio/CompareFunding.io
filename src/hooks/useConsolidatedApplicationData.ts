import { useEffect, useState } from 'react';
import { ApplicationData } from '@/types/application';

/**
 * Custom hook to extract and process consolidated data from an application
 * @param application The application data object
 * @returns Processed data and utility functions
 */
export function useConsolidatedApplicationData(application: ApplicationData | null | undefined) {
  const [businessProfile, setBusinessProfile] = useState<any>(null);
  const [creditInfo, setCreditInfo] = useState<any>(null);
  const [financialDocuments, setFinancialDocuments] = useState<Record<string, any>>({});
  const [financialSummaries, setFinancialSummaries] = useState<Record<string, string>>({});
  const [isConsolidated, setIsConsolidated] = useState<boolean>(false);
  
  useEffect(() => {
    if (!application) return;
    
    // Check if this application has consolidated data
    const hasConsolidatedData = application.data_consolidated === true;
    setIsConsolidated(hasConsolidatedData);
    
    // Extract business profile - use consolidated data if available, otherwise use nested business object
    const profileData = application.business_profile || application.business;
    setBusinessProfile(profileData || null);
    
    // Extract credit info - use consolidated data if available
    // Priority order: 
    // 1. Consolidated credit_info field
    // 2. Nested in business.credit_info
    const creditData = 
      application.credit_info || 
      (application.business?.credit_info || null);
    setCreditInfo(creditData);
    
    // Extract financial documents - use consolidated data if available
    const documentsData = application.financialDocuments || {};
    setFinancialDocuments(documentsData);
    
    // Extract financial summaries - use consolidated data if available
    const summariesData = application.financialSummaries || {};
    setFinancialSummaries(summariesData);
    
  }, [application]);
  
  // Helper function to check if financial documents exist
  const hasFinancialDocuments = (): boolean => {
    // Check if we have any financial documents
    return (
      // Check for financialDocuments object
      (Object.keys(financialDocuments || {}).length > 0) ||
      // Check for traditional financial_documents array
      (Array.isArray(application?.financial_documents) && application.financial_documents.length > 0)
    );
  };
  
  // Helper function to check if credit score exists
  const hasCreditScore = (): boolean => {
    if (!creditInfo) return false;
    return (
      (creditInfo.credit_score !== undefined && creditInfo.credit_score !== null) ||
      (creditInfo.score !== undefined && creditInfo.score !== null)
    );
  };
  
  // Helper function to get the credit score value
  const getCreditScore = (): number | null => {
    if (!creditInfo) return null;
    return creditInfo.credit_score || creditInfo.score || null;
  };
  
  // Helper function to get the credit risk level
  const getCreditRisk = (): string | null => {
    if (!creditInfo) return null;
    return creditInfo.risk || creditInfo.risk_level || creditInfo.common_description || null;
  };

  return {
    businessProfile,
    creditInfo,
    financialDocuments,
    financialSummaries,
    isConsolidated,
    hasFinancialDocuments,
    hasCreditScore,
    getCreditScore,
    getCreditRisk
  };
}
