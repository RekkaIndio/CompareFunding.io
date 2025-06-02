import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Lock, Shield, ThumbsUp, TrendingUp } from 'lucide-react';
import { FinancialData } from '../types';
import { FinancialsTable } from '@/pages/Business/Documents/FinancialsTable';

interface FinancialDataTabsProps {
  financialData: FinancialData | undefined;
  handleExpressInterest: () => void;
  isLenderMatched?: boolean;
}

// Removed JsonDataView component in favor of FinancialsTable

// Helper function to check if a financial data section exists
const hasFinancialData = (financialData: FinancialData | undefined, section: keyof FinancialData): boolean => {
  return Boolean(financialData && section in financialData);
};

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
  handleExpressInterest,
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
        <Tabs defaultValue="profitLoss" className="w-full">
          <TabsList className="flex flex-wrap mb-4 bg-[#1d2432] rounded-lg p-1">
            <TabsTrigger 
              value="profitLoss" 
              className="px-4 py-2 data-[state=active]:bg-[#ff8000] data-[state=active]:text-white data-[state=inactive]:text-white rounded-md"
            >
              Profit & Loss
            </TabsTrigger>
            <TabsTrigger 
              value="balanceSheet" 
              className="px-4 py-2 data-[state=active]:bg-[#ff8000] data-[state=active]:text-white data-[state=inactive]:text-white rounded-md"
            >
              Balance Sheet
            </TabsTrigger>
            <TabsTrigger 
              value="trialBalance" 
              className="px-4 py-2 data-[state=active]:bg-[#ff8000] data-[state=active]:text-white data-[state=inactive]:text-white rounded-md"
            >
              Trial Balance
            </TabsTrigger>
            <TabsTrigger 
              value="agedPayables" 
              className="px-4 py-2 data-[state=active]:bg-[#ff8000] data-[state=active]:text-white data-[state=inactive]:text-white rounded-md"
            >
              Aged Payables
            </TabsTrigger>
            <TabsTrigger 
              value="agedReceivables" 
              className="px-4 py-2 data-[state=active]:bg-[#ff8000] data-[state=active]:text-white data-[state=inactive]:text-white rounded-md"
            >
              Aged Receivables
            </TabsTrigger>
          </TabsList>
          
          {/* Profit & Loss Tab */}
          <TabsContent value="profitLoss" className="p-6 m-0">
            {financialData && 'profitLoss' in financialData ? (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-[#212936] flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2 text-[#ff8000]" />
                    Profit & Loss
                  </h3>
                  <Badge variant="secondary" className="text-xs">
                    Last updated: {new Date(financialData.profitLoss!.createdAt).toLocaleDateString()}
                  </Badge>
                </div>
                
                {financialData.profitLoss?.summary && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-[#212936] mb-2 flex items-center">
                      <FileText className="h-4 w-4 mr-2 text-blue-500" />
                      Financial Summary
                    </h4>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <p className="text-sm text-blue-800">
                        {extractSummary(financialData.profitLoss.summary, 'pl')}
                      </p>
                    </div>
                  </div>
                )}
                
                <FinancialsTable 
                  data={financialData.profitLoss?.data}
                  title="Profit & Loss Statement"
                  summary={financialData.profitLoss?.summary}
                />
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                <h3 className="text-lg font-medium text-slate-700 mb-1">No Profit & Loss Data</h3>
                <p className="text-sm text-slate-500">This business hasn't uploaded a Profit & Loss statement yet.</p>
              </div>
            )}
          </TabsContent>
          
          {/* Balance Sheet Tab */}
          <TabsContent value="balanceSheet" className="p-6 m-0">
            {financialData && 'balanceSheet' in financialData ? (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-[#212936] flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2 text-[#ff8000]" />
                    Balance Sheet
                  </h3>
                  <Badge variant="secondary" className="text-xs">
                    Last updated: {new Date(financialData.balanceSheet!.createdAt).toLocaleDateString()}
                  </Badge>
                </div>
                
                {financialData.balanceSheet?.summary && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-[#212936] mb-2 flex items-center">
                      <FileText className="h-4 w-4 mr-2 text-blue-500" />
                      Financial Summary
                    </h4>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <p className="text-sm text-blue-800">
                        {extractSummary(financialData.balanceSheet.summary, 'bs')}
                      </p>
                    </div>
                  </div>
                )}
                
                <FinancialsTable 
                  data={financialData.balanceSheet?.data}
                  title="Balance Sheet"
                  summary={financialData.balanceSheet?.summary}
                />
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                <h3 className="text-lg font-medium text-slate-700 mb-1">No Balance Sheet Data</h3>
                <p className="text-sm text-slate-500">This business hasn't uploaded a Balance Sheet yet.</p>
              </div>
            )}
          </TabsContent>
          
          {/* Trial Balance Tab */}
          <TabsContent value="trialBalance" className="p-6 m-0">
            {financialData && 'trialBalance' in financialData ? (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-[#212936] flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2 text-[#ff8000]" />
                    Trial Balance
                  </h3>
                  <Badge variant="secondary" className="text-xs">
                    Last updated: {new Date(financialData.trialBalance!.createdAt).toLocaleDateString()}
                  </Badge>
                </div>
                
                {financialData.trialBalance?.summary && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-[#212936] mb-2 flex items-center">
                      <FileText className="h-4 w-4 mr-2 text-blue-500" />
                      Financial Summary
                    </h4>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <p className="text-sm text-blue-800">
                        {extractSummary(financialData.trialBalance.summary, 'tb')}
                      </p>
                    </div>
                  </div>
                )}
                
                <FinancialsTable 
                  data={financialData.trialBalance?.data || {}}
                  title="Trial Balance"
                  summary={financialData.trialBalance?.summary}
                />
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                <h3 className="text-lg font-medium text-slate-700 mb-1">No Trial Balance Data</h3>
                <p className="text-sm text-slate-500">This business hasn't uploaded a Trial Balance yet.</p>
              </div>
            )}
          </TabsContent>
          
          {/* Aged Payables Tab */}
          <TabsContent value="agedPayables" className="p-6 m-0">
            {financialData && 'agedPayables' in financialData ? (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-[#212936] flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2 text-[#ff8000]" />
                    Aged Payables
                  </h3>
                  <Badge variant="secondary" className="text-xs">
                    Last updated: {new Date(financialData.agedPayables!.createdAt).toLocaleDateString()}
                  </Badge>
                </div>
                
                {financialData.agedPayables?.summary && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-[#212936] mb-2 flex items-center">
                      <FileText className="h-4 w-4 mr-2 text-blue-500" />
                      Financial Summary
                    </h4>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <p className="text-sm text-blue-800">
                        {extractSummary(financialData.agedPayables.summary, 'ap')}
                      </p>
                    </div>
                  </div>
                )}
                
                <FinancialsTable 
                  data={financialData.agedPayables?.data || {}}
                  title="Aged Payables"
                  summary={financialData.agedPayables?.summary}
                />
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                <h3 className="text-lg font-medium text-slate-700 mb-1">No Aged Payables Data</h3>
                <p className="text-sm text-slate-500">This business hasn't uploaded Aged Payables data yet.</p>
              </div>
            )}
          </TabsContent>
          
          {/* Aged Receivables Tab */}
          <TabsContent value="agedReceivables" className="p-6 m-0">
            {financialData && 'agedReceivables' in financialData ? (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-[#212936] flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2 text-[#ff8000]" />
                    Aged Receivables
                  </h3>
                  <Badge variant="secondary" className="text-xs">
                    Last updated: {new Date(financialData.agedReceivables!.createdAt).toLocaleDateString()}
                  </Badge>
                </div>
                
                {financialData.agedReceivables?.summary && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-[#212936] mb-2 flex items-center">
                      <FileText className="h-4 w-4 mr-2 text-blue-500" />
                      Financial Summary
                    </h4>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <p className="text-sm text-blue-800">
                        {extractSummary(financialData.agedReceivables.summary, 'ar')}
                      </p>
                    </div>
                  </div>
                )}
                
                <FinancialsTable 
                  data={financialData.agedReceivables?.data || {}}
                  title="Aged Receivables"
                  summary={financialData.agedReceivables?.summary}
                />
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                <h3 className="text-lg font-medium text-slate-700 mb-1">No Aged Receivables Data</h3>
                <p className="text-sm text-slate-500">This business hasn't uploaded Aged Receivables data yet.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
