import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { FinancialsTable } from '@/pages/Business/Documents/FinancialsTable';
import { Badge } from '@/components/ui/badge';

const DOCUMENT_STEPS = [
  { key: 'pl', label: 'Profit and Loss' },
  { key: 'bs', label: 'Balance Sheet' },
  { key: 'tb', label: 'Trial Balance' },
  { key: 'ap', label: 'Aged Payables' },
  { key: 'ar', label: 'Aged Receivables' }
] as const;

interface FinancialDocumentsSectionProps {
  application: any;
}

const FinancialDocumentsSection: React.FC<FinancialDocumentsSectionProps> = ({ application }) => {
  if (!application) return null;

  // Helper function to extract summary text from complex structures
  const extractSummaryText = (summaryContent, documentType) => {
    if (typeof summaryContent !== 'string' || !summaryContent.trim()) {
      return "No summary available";
    }
    
    // Check if the summary content is actually JSON
    if (summaryContent.startsWith('{') && summaryContent.endsWith('}')) {
      try {
        const parsedSummary = JSON.parse(summaryContent);
        if (parsedSummary.summary && typeof parsedSummary.summary === 'string') {
          return parsedSummary.summary;
        }
      } catch (e) {
        console.error("Failed to parse summary as JSON:", e);
      }
    }
    
    // If it contains markdown JSON with a nested summary field, extract that
    if (summaryContent.includes('```json')) {
      try {
        const match = summaryContent.match(/"summary"\s*:\s*"([^"]+)"/);
        if (match && match[1]) {
          // We found the actual summary text!
          return match[1].replace(/\\n/g, ' ')
                       .replace(/\\"/g, '"')
                       .trim();
        }
      } catch (e) {
        console.error("Failed to extract nested summary:", e);
      }
    }
    
    // Special handling for Trial Balance and Balance Sheet
    if (documentType === 'tb' || documentType === 'bs') {
      // Try to extract the summary from JSON format
      const summaryMatch = summaryContent.match(/"summary"\s*:\s*"([^"]+)"/);
      if (summaryMatch && summaryMatch[1]) {
        return summaryMatch[1]
          .replace(/\\n/g, ' ')
          .replace(/\\"/g, '"')
          .trim();
      }
      
      // Look for a "summary" field in the JSON
      try {
        // Try to find a summary directly in the content if it's a JSON object
        const jsonData = JSON.parse(summaryContent);
        if (jsonData && jsonData.summary && typeof jsonData.summary === 'string') {
          return jsonData.summary;
        }
      } catch (e) {
        console.error(`Failed to parse ${documentType} summary as JSON:`, e);
      }
    }
    
    // If we couldn't extract a nested summary, check for JSON strings in the content
    if (summaryContent.includes('"summary"')) {
      const matches = summaryContent.match(/"summary"\s*:\s*"([^"]+)"/);
      if (matches && matches[1]) {
        return matches[1]
          .replace(/\\n/g, ' ')
          .replace(/\\"/g, '"')
          .trim();
      }
    }
    
    // If we couldn't extract a summary using any method, return a clean version of the original
    // For Trial Balance and Balance Sheet, provide a fallback if everything fails
    if (documentType === 'tb' || documentType === 'bs') {
      if (summaryContent.includes('{') && summaryContent.includes('}')) {
        return documentType === 'tb' 
          ? "Trial Balance summary showing account balances."
          : "Balance Sheet summary showing assets, liabilities and equity.";
      }
    }
    
    return summaryContent;
  };

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-semibold mb-4">Financial Documents</h2>
      <Tabs defaultValue="pl" className="w-full">
        <TabsList className="flex flex-wrap mb-4 bg-[#1d2432] rounded-lg p-1">
          {DOCUMENT_STEPS.map((step) => (
            <TabsTrigger 
              key={step.key} 
              value={step.key} 
              className="px-4 py-2 data-[state=active]:bg-[#ff8000] data-[state=active]:text-white data-[state=inactive]:text-white rounded-md"
            >
              {step.label}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {DOCUMENT_STEPS.map((step) => (
          <TabsContent key={step.key} value={step.key} className="p-0">
            <Card className="border-0 shadow-lg overflow-hidden rounded-lg">
              {/* Header section with document type */}
              <div className="bg-[#1d2432] text-white p-4 border-b border-[#ff8000] flex items-center justify-between">
                <h3 className="font-medium">{step.label}</h3>
                <Badge className="bg-[#ff8000] text-white hover:bg-orange-600 border-0">
                  Financial Data
                </Badge>
              </div>

              {/* Financial Summary Section */}
              {application?.financialSummaries?.[step.key] && (
                <div className="bg-white p-4 border-b">
                  <div className="flex items-center mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <strong className="text-gray-800">Financial Summary</strong>
                  </div>
                  <div className="mt-1 text-sm text-gray-700 pl-7 leading-relaxed">
                    {extractSummaryText(application.financialSummaries[step.key], step.key)}
                  </div>
                </div>
              )}
              
              {/* Financial Metrics Table */}
              <div className="bg-white">
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#ff8000] mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                    <h4 className="text-lg font-semibold text-gray-800">Financial Metrics</h4>
                  </div>
                </div>
                <div className="px-4 py-4">
                  <FinancialsTable
                    data={(() => {
                      // Get the data for this document type
                      let data = application?.financialDocuments?.[step.key] || null;
                      
                      // If data is empty or null, check if we can extract it from the summary
                      if (!data || Object.keys(data).length === 0) {
                        try {
                          const summaryContent = application?.financialSummaries?.[step.key];
                          if (summaryContent) {
                            // Try to parse the summary as JSON
                            if (typeof summaryContent === 'string' && summaryContent.startsWith('{')) {
                              const parsed = JSON.parse(summaryContent);
                              // Look for the data in common locations
                              if (parsed.json && Object.keys(parsed.json).length > 0) {
                                data = parsed.json;
                              } else if (parsed.data && Object.keys(parsed.data).length > 0) {
                                data = parsed.data;
                              }
                            }
                          }
                        } catch (e) {
                          console.error(`Failed to extract data from summary for ${step.key}:`, e);
                        }
                      }
                      
                      // Special handling for Trial Balance
                      if (step.key === 'tb' && data) {
                        // Make sure accounts data is properly exposed
                        if (data.accounts) {
                          return data;
                        } else if (Array.isArray(data) && data.length > 0) {
                          return { accounts: data };
                        } else if (data.lineItems && Array.isArray(data.lineItems)) {
                          return { accounts: data.lineItems };
                        }
                      }
                      
                      return data;
                    })()}
                  />
                </div>
              </div>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default FinancialDocumentsSection;
