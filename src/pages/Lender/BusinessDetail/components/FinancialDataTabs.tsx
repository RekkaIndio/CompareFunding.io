import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Lock, Shield, ThumbsUp, TrendingUp } from 'lucide-react';
import { FinancialData } from '../types';
import FinancialsTable from '@/pages/Business/Documents/FinancialsTable';

interface FinancialDataTabsProps {
  financialData: FinancialData | undefined;
  isLenderMatched?: boolean;
}

// Helper function to check if a financial data section exists
const hasFinancialData = (financialData: FinancialData | undefined, section: keyof FinancialData): boolean => {
  return Boolean(financialData && section in financialData);
}

// Helper function to extract summary text from complex structures
const extractSummary = (summaryContent: any, documentType: string = ''): string => {
  if (typeof summaryContent !== 'string' || !summaryContent.trim()) {
    return "No summary available";
  }

  // Extra handling for backtick-quoted JSON (```json { ... } ```)
  if (summaryContent.includes('```') && summaryContent.includes('json')) {
    const jsonPattern = /```(?:json)?\s*({[\s\S]*?})\s*```/;
    const jsonMatch = summaryContent.match(jsonPattern);
    if (jsonMatch && jsonMatch[1]) {
      try {
        // Try to parse the JSON inside the backticks
        const jsonContent = jsonMatch[1];
        const parsed = JSON.parse(jsonContent);
        if (parsed.summary) {
          return typeof parsed.summary === 'string' ? parsed.summary : JSON.stringify(parsed.summary);
        }
        
        // If there's no summary field but there's a json object, look deeper
        if (parsed.json && parsed.json.summary) {
          return parsed.json.summary;
        }
      } catch (e) {
        console.error("Failed to parse JSON from backticks:", e);
      }
    }
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
  return summaryContent;
};

export const FinancialDataTabs: React.FC<FinancialDataTabsProps> = ({
  financialData,
  isLenderMatched
}) => {
  // Check if we should show full financial data (matched or offer accepted)
  const showFullFinancialData = isLenderMatched;
  return (
    <Card className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-xl hover:shadow-2xl transition-all duration-300 mb-8">
      <CardHeader className="bg-[#212936] text-white rounded-t-xl border-b-2 border-[#ff8000]">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-white">Financial Data</h2>
            <p className="text-sm text-slate-300">Review business financial documents</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {!showFullFinancialData && (
          <Alert className="rounded-none border-x-0 border-t-0 bg-blue-50 text-blue-800 border-blue-100">
            <AlertDescription className="text-xs">
              These are anonymous financial metrics. Express interest to see full business details and company information.
            </AlertDescription>
          </Alert>
        )}
        {showFullFinancialData && (
          <Alert className="rounded-none border-x-0 border-t-0 bg-green-50 text-green-800 border-green-100">
            <AlertDescription className="text-xs">
              Full financial details are available. These are the actual business financial documents.
            </AlertDescription>
          </Alert>
        )}
        <Tabs defaultValue="signed-accounts" className="w-full">
          <TabsList className="flex flex-wrap mb-4 bg-[#1d2432] rounded-lg p-1">
            <TabsTrigger 
              value="signed-accounts" 
              className="px-4 py-2 data-[state=active]:bg-[#ff8000] data-[state=active]:text-white data-[state=inactive]:text-white rounded-md"
            >
              Signed Accounts
            </TabsTrigger>
            <TabsTrigger 
              value="management-accounts" 
              className="px-4 py-2 data-[state=active]:bg-[#ff8000] data-[state=active]:text-white data-[state=inactive]:text-white rounded-md"
            >
              Management Accounts
            </TabsTrigger>
            <TabsTrigger 
              value="aged-debtors" 
              className="px-4 py-2 data-[state=active]:bg-[#ff8000] data-[state=active]:text-white data-[state=inactive]:text-white rounded-md"
            >
              Aged Debtors
            </TabsTrigger>
            <TabsTrigger 
              value="aged-creditors" 
              className="px-4 py-2 data-[state=active]:bg-[#ff8000] data-[state=active]:text-white data-[state=inactive]:text-white rounded-md"
            >
              Aged Creditors
            </TabsTrigger>
          </TabsList>
          
          {/* Signed Accounts Tab */}
          <TabsContent value="signed-accounts" className="p-6 m-0">
            {financialData && 'signed-accounts' in financialData ? (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-[#212936] flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2 text-[#ff8000]" />
                    Signed Accounts
                  </h3>
                  <Badge variant="secondary" className="text-xs">
                    Last updated: {new Date(financialData['signed-accounts']!.createdAt).toLocaleDateString()}
                  </Badge>
                </div>
                
                {financialData['signed-accounts']?.summary && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-[#212936] mb-2 flex items-center">
                      <FileText className="h-4 w-4 mr-2 text-blue-500" />
                      Financial Summary
                    </h4>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <p className="text-sm text-blue-800">
                        {extractSummary(financialData['signed-accounts'].summary, 'signed-accounts')}
                      </p>
                    </div>
                  </div>
                )}
                
                <FinancialsTable 
                  data={financialData['signed-accounts']?.data}
                  title="Signed Accounts"
                  summary={financialData['signed-accounts']?.summary}
                />
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                <h3 className="text-lg font-medium text-slate-700 mb-1">No Signed Accounts Data</h3>
                <p className="text-sm text-slate-500">This business hasn't uploaded Signed Accounts yet.</p>
              </div>
            )}
          </TabsContent>
          
          {/* Management Accounts Tab */}
          <TabsContent value="management-accounts" className="p-6 m-0">
            {financialData && 'management-accounts' in financialData ? (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-[#212936] flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2 text-[#ff8000]" />
                    Management Accounts
                  </h3>
                  <Badge variant="secondary" className="text-xs">
                    Last updated: {new Date(financialData['management-accounts']!.createdAt).toLocaleDateString()}
                  </Badge>
                </div>
                
                {financialData['management-accounts']?.summary && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-[#212936] mb-2 flex items-center">
                      <FileText className="h-4 w-4 mr-2 text-blue-500" />
                      Financial Summary
                    </h4>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <p className="text-sm text-blue-800">
                        {extractSummary(financialData['management-accounts'].summary, 'management-accounts')}
                      </p>
                    </div>
                  </div>
                )}
                
                <FinancialsTable 
                  data={financialData['management-accounts']?.data}
                  title="Management Accounts"
                  summary={financialData['management-accounts']?.summary}
                />
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                <h3 className="text-lg font-medium text-slate-700 mb-1">No Management Accounts Data</h3>
                <p className="text-sm text-slate-500">This business hasn't uploaded Management Accounts yet.</p>
              </div>
            )}
          </TabsContent>
          
          {/* Aged Debtors Tab */}
          <TabsContent value="aged-debtors" className="p-6 m-0">
            {financialData && 'aged-debtors' in financialData ? (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-[#212936] flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2 text-[#ff8000]" />
                    Aged Debtors
                  </h3>
                  <Badge variant="secondary" className="text-xs">
                    Last updated: {new Date(financialData['aged-debtors']!.createdAt).toLocaleDateString()}
                  </Badge>
                </div>
                
                {financialData['aged-debtors']?.summary && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-[#212936] mb-2 flex items-center">
                      <FileText className="h-4 w-4 mr-2 text-blue-500" />
                      Financial Summary
                    </h4>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <p className="text-sm text-blue-800">
                        {extractSummary(financialData['aged-debtors'].summary, 'aged-debtors')}
                      </p>
                    </div>
                  </div>
                )}
                
                <FinancialsTable 
                  data={financialData['aged-debtors']?.data || {}}
                  title="Aged Debtors"
                  summary={financialData['aged-debtors']?.summary}
                />
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                <h3 className="text-lg font-medium text-slate-700 mb-1">No Aged Debtors Data</h3>
                <p className="text-sm text-slate-500">This business hasn't uploaded Aged Debtors data yet.</p>
              </div>
            )}
          </TabsContent>
          
          {/* Aged Creditors Tab */}
          <TabsContent value="aged-creditors" className="p-6 m-0">
            {financialData && 'aged-creditors' in financialData ? (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-[#212936] flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2 text-[#ff8000]" />
                    Aged Creditors
                  </h3>
                  <Badge variant="secondary" className="text-xs">
                    Last updated: {new Date(financialData['aged-creditors']!.createdAt).toLocaleDateString()}
                  </Badge>
                </div>
                
                {financialData['aged-creditors']?.summary && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-[#212936] mb-2 flex items-center">
                      <FileText className="h-4 w-4 mr-2 text-blue-500" />
                      Financial Summary
                    </h4>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <p className="text-sm text-blue-800">
                        {extractSummary(financialData['aged-creditors'].summary, 'aged-creditors')}
                      </p>
                    </div>
                  </div>
                )}
                
                <FinancialsTable 
                  data={financialData['aged-creditors']?.data || {}}
                  title="Aged Creditors"
                  summary={financialData['aged-creditors']?.summary}
                />
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                <h3 className="text-lg font-medium text-slate-700 mb-1">No Aged Creditors Data</h3>
                <p className="text-sm text-slate-500">This business hasn't uploaded Aged Creditors data yet.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
