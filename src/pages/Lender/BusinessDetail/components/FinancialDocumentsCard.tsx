import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DownloadCloud, FileText, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { FinancialData } from '../types';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useEffect } from 'react';
import FinancialsTable from '@/pages/Business/Documents/FinancialsTable';

interface FinancialDocumentsCardProps {
  financialData: FinancialData | undefined;
  isLenderMatched?: boolean;
}

export const FinancialDocumentsCard: React.FC<FinancialDocumentsCardProps> = ({
  financialData,
  isLenderMatched = false
}) => {
  // Debug logging
  useEffect(() => {

  }, [isLenderMatched]);

  // Helper function to determine if we have file URLs or processed data for any financial document
  const hasDocuments = () => {
    if (!financialData) return false;
    
    return Object.values(financialData).some((doc) => 
      doc && (doc.fileUrl || doc.documentUrl || doc.url || (doc.data && Object.keys(doc.data).length > 0))
    );
  };
  
  // Count available documents (either with files or processed data)
  const countAvailableDocuments = () => {
    if (!financialData) return 0;
    
    return Object.values(financialData).filter(doc => 
      doc && (doc.fileUrl || doc.documentUrl || doc.url || (doc.data && Object.keys(doc.data).length > 0))
    ).length;
  };
  
  // Helper function to get a friendly name for document types
  const getDocumentTypeName = (key: string): string => {
    switch (key) {
      case 'profitLoss':
      case 'pl':
      case 'profit-loss':
        return 'Profit & Loss Statement';
      case 'balanceSheet':
      case 'bs':
      case 'balance-sheet':
        return 'Balance Sheet';
      case 'trialBalance':
      case 'tb':
      case 'trial-balance':
        return 'Trial Balance';
      case 'agedPayables':
      case 'ap':
      case 'aged-payables':
      case 'aged-creditors':
        return 'Aged Payables';
      case 'agedReceivables':
      case 'ar':
      case 'aged-receivables':
      case 'aged-debtors':
        return 'Aged Receivables';
      case 'signed-accounts':
        return 'Signed Accounts';
      case 'management-accounts':
        return 'Management Accounts';
      default: 
        return key.replace(/([A-Z])/g, ' $1').replace(/-/g, ' ').trim()
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
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
          <div className="space-y-6">
            <Alert variant="default" className="bg-green-50 border-green-100 text-green-800 mb-4">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                As a matched lender, you can now view the processed financial data and download the original documents for this business.
              </AlertDescription>
            </Alert>
            
            {/* Display financial data in structured tables */}
            {Object.entries(financialData).map(([key, document]) => {
              if (!document) return null;
              
              const documentUrl = document?.fileUrl || document?.documentUrl || document?.url;
              const hasData = document?.data && Object.keys(document.data).length > 0;
              
              // Only show documents that have either a file URL or processed data
              if (!documentUrl && !hasData) return null;
              
              return (
                <div key={key} className="space-y-4">
                  {/* Document Header with Download Button */}
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-[#ff8000] mr-3" />
                      <div>
                        <p className="font-medium text-slate-900">{getDocumentTypeName(key)}</p>
                        <p className="text-xs text-slate-500">
                          {document?.documentName || document?.fileName || 'Financial document'}
                        </p>
                      </div>
                    </div>
                    {documentUrl && (
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
                    )}
                  </div>
                  
                  {/* Display financial data table if available */}
                  {hasData ? (
                    <div className="bg-white rounded-lg border border-slate-200">
                      <FinancialsTable 
                        data={document.data}
                        title={getDocumentTypeName(key)}
                      />
                    </div>
                  ) : (
                    <div className="bg-slate-50 rounded-lg p-4 text-center text-slate-500 text-sm">
                      Document uploaded but data processing is still in progress
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
