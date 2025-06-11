// Simple exports for all document analysis functions
import { analyzeFinancialDocument } from './profitAndLoss';


export { analyzeFinancialDocument };

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
