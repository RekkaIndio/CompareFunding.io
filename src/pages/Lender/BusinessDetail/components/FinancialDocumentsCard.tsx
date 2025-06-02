import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DownloadCloud, FileText, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { FinancialData } from '../types';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FinancialDocumentsCardProps {
  financialData: FinancialData | undefined;
  isLenderMatched?: boolean;
}

export const FinancialDocumentsCard: React.FC<FinancialDocumentsCardProps> = ({
  financialData,
  isLenderMatched = false
}) => {
  // Helper function to determine if we have file URLs for any financial document
  const hasDocuments = () => {
    if (!financialData) return false;
    
    return Object.values(financialData).some((doc) => 
      doc && (doc.fileUrl || doc.documentUrl || doc.url)
    );
  };
  
  // Count available documents
  const countAvailableDocuments = () => {
    if (!financialData) return 0;
    
    return Object.values(financialData).filter(doc => 
      doc && (doc.fileUrl || doc.documentUrl || doc.url)
    ).length;
  };
  
  // Helper function to get a friendly name for document types
  const getDocumentTypeName = (key: string): string => {
    switch (key) {
      case 'profitLoss': return 'Profit & Loss Statement';
      case 'balanceSheet': return 'Balance Sheet';
      case 'trialBalance': return 'Trial Balance';
      case 'agedPayables': return 'Aged Payables';
      case 'agedReceivables': return 'Aged Receivables';
      default: return key.replace(/([A-Z])/g, ' $1').trim();
    }
  };
  
  return (
    <Card className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-xl hover:shadow-2xl transition-all duration-300 mb-8">
      <CardHeader className={`${isLenderMatched ? 'bg-green-800' : 'bg-[#212936]'} text-white rounded-t-xl border-b-2 border-[#ff8000]`}>
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center">
              <h2 className="text-xl font-semibold text-white">Financial Documents</h2>
              {isLenderMatched && hasDocuments() && (
                <Badge variant="outline" className="ml-2 bg-green-700 text-white border-green-600">
                  {countAvailableDocuments()} Available
                </Badge>
              )}
            </div>
            <p className="text-sm text-slate-300">
              {isLenderMatched 
                ? "Download original financial documents" 
                : "Match with business to access documents"}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {!isLenderMatched ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Lock className="h-12 w-12 text-slate-400 mb-3" />
            <h3 className="text-lg font-medium text-slate-700 mb-2">Documents Locked</h3>
            <p className="text-sm text-slate-500 max-w-md mb-4">
              Financial documents are only available to lenders who are matched with this business.
            </p>
            <Alert variant="default" className="bg-blue-50 border-blue-100 text-blue-800 mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Express interest or create an offer to match with this business and access full documents.
              </AlertDescription>
            </Alert>
          </div>
        ) : !financialData || !hasDocuments() ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <FileText className="h-12 w-12 text-slate-400 mb-3" />
            <h3 className="text-lg font-medium text-slate-700 mb-2">No Documents Available</h3>
            <p className="text-sm text-slate-500 max-w-md mb-4">
              This business hasn't uploaded any downloadable financial documents yet.
            </p>
            <Alert variant="default" className="bg-amber-50 border-amber-100 text-amber-800 mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You're matched with this business, but they haven't uploaded any documents yet.
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <div className="space-y-4">
            <Alert variant="default" className="bg-green-50 border-green-100 text-green-800 mb-4">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                As a matched lender, you can now download the original financial documents for this business.
              </AlertDescription>
            </Alert>
            
            {Object.entries(financialData).map(([key, document]) => {
              // Get the URL from wherever it might be stored
              const documentUrl = document?.fileUrl || document?.documentUrl || document?.url;
              
              if (!documentUrl) return null;
              
              return (
                <div 
                  key={key} 
                  className="flex items-center justify-between border-b border-slate-200 pb-3 last:border-0 hover:bg-slate-50 transition-colors p-2 rounded-md"
                >
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-[#ff8000] mr-3" />
                    <div>
                      <p className="font-medium text-slate-900">{getDocumentTypeName(key)}</p>
                      <p className="text-xs text-slate-500">
                        {document?.documentName || document?.fileName || 'Financial document'}
                      </p>
                    </div>
                  </div>
                  <a 
                    href={documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="no-underline"
                    download
                  >
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex items-center gap-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      <DownloadCloud className="h-4 w-4" />
                      <span>Download</span>
                    </Button>
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
