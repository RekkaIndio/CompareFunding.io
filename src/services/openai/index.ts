// Simple exports for all document analysis functions
import { analyzeFinancialDocument, FinancialDataResult } from './profitAndLoss';
import { analyzeManagementAccounts, ManagementAccountsResult } from './managementAccounts';
import { analyzeSignedAccounts, SignedAccountsResult } from './signedAccounts';

export { analyzeFinancialDocument, analyzeManagementAccounts, analyzeSignedAccounts };
export type { FinancialDataResult, ManagementAccountsResult, SignedAccountsResult };

// Legacy compatibility interface
export interface OpenAIExtractResult {
  json: any;
  summary: string;
}

// Simple function for backward compatibility
export async function analyzeDocumentWithVision({
  file,
  docType,
}: {
  file: File;
  docType: string;
}): Promise<OpenAIExtractResult> {
  // Direct routing without dynamic imports
  const lowerDocType = docType.toLowerCase();
  
  if (lowerDocType === 'profit and loss' || lowerDocType === 'profit & loss' || lowerDocType === 'p&l') {
    return await analyzeFinancialDocument(file);
  }
  
  if (lowerDocType === 'balance sheet') {
    // Use the comprehensive analyzer for balance sheets too since it extracts both P&L and Balance Sheet
    return await analyzeFinancialDocument(file);
  }
  
  throw new Error(`Unsupported document type: ${docType}`);
}

// New function to route documents based on the document key from the UI
export async function analyzeDocumentByKey({
  file,
  documentKey,
}: {
  file: File;
  documentKey: string;
}): Promise<OpenAIExtractResult> {
  console.log(`Routing document analysis for key: ${documentKey}`);
  
  switch (documentKey) {
    case 'signed-accounts':
      // Signed accounts need specialized standardized format with comparative data
      return await analyzeSignedAccounts(file);
      
    case 'management-accounts':
      // Management accounts need specialized standardized format
      return await analyzeManagementAccounts(file);
      
    case 'aged-debtors':
      // For now, use the comprehensive analyzer (will be specialized later)
      return await analyzeFinancialDocument(file);
      
    case 'aged-creditors':
      // For now, use the comprehensive analyzer (will be specialized later) 
      return await analyzeFinancialDocument(file);
      
    default:
      // Fallback to comprehensive analyzer
      console.warn(`Unknown document key: ${documentKey}, using default analyzer`);
      return await analyzeFinancialDocument(file);
  }
}
