// Simple exports for all document analysis functions
import { analyzeFinancialDocument } from './profitAndLoss';
import { analyzeBalanceSheet } from './balanceSheet';
import { analyzeTrialBalance } from './trialBalance';
import { analyzeAgedPayables } from './agedPayables';
import { analyzeAgedReceivables } from './agedReceivables';

export { analyzeFinancialDocument, analyzeBalanceSheet, analyzeTrialBalance, analyzeAgedPayables, analyzeAgedReceivables };

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
  
  if (lowerDocType === 'trial balance') {
    return await analyzeTrialBalance(file);
  }
  
  if (lowerDocType === 'aged payables') {
    return await analyzeAgedPayables(file);
  }
  
  if (lowerDocType === 'aged receivables') {
    return await analyzeAgedReceivables(file);
  }
  
  throw new Error(`Unsupported document type: ${docType}`);
}
