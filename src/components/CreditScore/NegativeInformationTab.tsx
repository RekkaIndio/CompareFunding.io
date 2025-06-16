import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, AlertCircle, Info, FileText } from "lucide-react";

interface NegativeInformationTabProps {
  creditReport: any;
}

export const NegativeInformationTab: React.FC<NegativeInformationTabProps> = ({ creditReport }) => {
  // Extract negative information from various possible locations in the credit report
  const negativeInfo = creditReport.report?.additionalInformation?.negativeInformation ||
                      creditReport.report?.negativeInformation ||
                      creditReport.report?.negativeInfo ||
                      creditReport.report?.adverseInfo ||
                      null;

  const warnings = creditReport.report?.warnings || [];
  const ccjSummary = creditReport.report?.additionalInformation?.ccjSummary;

  // Helper function to check if CCJ data indicates actual negative information
  const hasActualNegativeInfo = (data: any): boolean => {
    if (!data) return false;
    
    // If it's a string and not empty, consider it negative
    if (typeof data === 'string' && data.trim().length > 0) {
      return true;
    }
    
    // If it's an object, check for non-zero values
    if (typeof data === 'object') {
      const checkForNonZeroValues = (obj: any): boolean => {
        if (Array.isArray(obj)) {
          return obj.some(item => checkForNonZeroValues(item));
        }
        
        if (obj && typeof obj === 'object') {
          // Check if it's a CCJ summary object
          const summary = obj.ccjSummary || obj;
          
          // Check specific CCJ fields for non-zero values
          if (summary.hasOwnProperty('exactRegistered') || 
              summary.hasOwnProperty('numberOfSatisfied') || 
              summary.hasOwnProperty('numberOfExact') || 
              summary.hasOwnProperty('numberOfWrits') ||
              summary.hasOwnProperty('possibleRegistered') ||
              summary.hasOwnProperty('numberOfPossible')) {
            
            // Check if any of these specific values are greater than 0
            const ccjValues = [
              summary.exactRegistered,
              summary.numberOfSatisfied,
              summary.numberOfExact,
              summary.numberOfWrits,
              summary.possibleRegistered,
              summary.numberOfPossible
            ];
            
            return ccjValues.some(value => {
              const numValue = typeof value === 'string' ? parseFloat(value) : value;
              return !isNaN(numValue) && numValue > 0;
            });
          }
          
          // Generic check for other object types
          return Object.values(obj).some(value => {
            if (typeof value === 'number' && value > 0) return true;
            if (typeof value === 'string' && value.trim().length > 0 && value !== '0') return true;
            if (typeof value === 'object') return checkForNonZeroValues(value);
            return false;
          });
        }
        
        return false;
      };
      
      return checkForNonZeroValues(data);
    }
    
    return false;
  };

  // Helper function to format CCJ data nicely
  const formatCCJData = (data: any) => {
    if (!data) return null;
    
    if (typeof data === 'string') {
      return <p className="leading-relaxed">{data}</p>;
    }
    
    // Check if data is a CCJ summary object (either directly or nested)
    const summary = data.ccjSummary || data;
    
    if (typeof summary === 'object' && (
      summary.hasOwnProperty('exactRegistered') || 
      summary.hasOwnProperty('numberOfSatisfied') || 
      summary.hasOwnProperty('numberOfExact') || 
      summary.hasOwnProperty('numberOfWrits') ||
      summary.hasOwnProperty('possibleRegistered') ||
      summary.hasOwnProperty('numberOfPossible')
    )) {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <h5 className="text-sm font-semibold text-slate-600 mb-1">Exact Registered</h5>
              <p className="text-lg font-bold text-slate-900">{summary.exactRegistered || 0}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <h5 className="text-sm font-semibold text-slate-600 mb-1">Number of Satisfied</h5>
              <p className="text-lg font-bold text-slate-900">{summary.numberOfSatisfied || 0}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <h5 className="text-sm font-semibold text-slate-600 mb-1">Number of Exact</h5>
              <p className="text-lg font-bold text-slate-900">{summary.numberOfExact || 0}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <h5 className="text-sm font-semibold text-slate-600 mb-1">Number of Writs</h5>
              <p className="text-lg font-bold text-slate-900">{summary.numberOfWrits || 0}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <h5 className="text-sm font-semibold text-slate-600 mb-1">Possible Registered</h5>
              <p className="text-lg font-bold text-slate-900">{summary.possibleRegistered || 0}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <h5 className="text-sm font-semibold text-slate-600 mb-1">Number of Possible</h5>
              <p className="text-lg font-bold text-slate-900">{summary.numberOfPossible || 0}</p>
            </div>
          </div>
          {summary.currency && (
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <h5 className="text-sm font-semibold text-slate-600 mb-1">Currency</h5>
              <p className="text-lg font-bold text-slate-900">{summary.currency}</p>
            </div>
          )}
        </div>
      );
    }
    
    // Fallback to formatted JSON
    return (
      <pre className="whitespace-pre-wrap font-mono text-sm bg-white p-4 rounded-lg border border-slate-200">
        {JSON.stringify(data, null, 2)}
      </pre>
    );
  };

  // Determine the overall status
  const hasNegativeInfo = hasActualNegativeInfo(negativeInfo);
  const hasCCJIssues = hasActualNegativeInfo(ccjSummary);
  const hasWarnings = warnings && warnings.length > 0;
  
  const overallNegative = hasNegativeInfo || hasCCJIssues || hasWarnings;

  return (
    <div className="p-8 space-y-8 bg-gradient-to-br from-white to-slate-50/50">
      {/* Risk Analysis Header */}
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-slate-900 mb-3">Risk Analysis & Negative Information</h3>
        <p className="text-slate-600 max-w-2xl mx-auto">
          Comprehensive analysis of potential risks and adverse information that may impact business decisions.
        </p>
      </div>

      {/* Negative Information Section */}
      {overallNegative ? (
        <Card className="bg-white rounded-2xl border border-red-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-6 border-b border-red-100 bg-gradient-to-r from-red-50 to-red-100/50">
            <CardTitle className="flex items-center text-xl font-bold text-red-800">
              <div className="p-2 bg-red-200/50 rounded-xl mr-3">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              Negative Information Detected
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-8">
            <Alert className="bg-gradient-to-r from-red-50 to-red-100/50 border-red-200 rounded-xl mb-6">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <AlertTitle className="text-red-800 font-semibold">Risk Alert</AlertTitle>
              <AlertDescription className="text-red-700 mt-2">
                This company has negative information on file that may affect creditworthiness and business reliability.
              </AlertDescription>
            </Alert>
            
            <div className="bg-slate-50 rounded-xl p-6">
              <h4 className="font-semibold text-slate-900 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-slate-600" />
                Detailed Information
              </h4>
              <div className="text-slate-700">
                {hasNegativeInfo && (
                  <div className="mb-4">
                    <h5 className="font-semibold text-red-800 mb-2">Negative Information:</h5>
                    {typeof negativeInfo === 'string' ? (
                      <p className="leading-relaxed">{negativeInfo}</p>
                    ) : (
                      formatCCJData(negativeInfo)
                    )}
                  </div>
                )}
                {hasCCJIssues && (
                  <div className="mb-4">
                    <h5 className="font-semibold text-red-800 mb-2">County Court Judgments:</h5>
                    {formatCCJData(ccjSummary)}
                  </div>
                )}
                {hasWarnings && (
                  <div>
                    <h5 className="font-semibold text-red-800 mb-2">Warnings:</h5>
                    <div className="space-y-2">
                      {warnings.map((warning: any, index: number) => (
                        <div key={index} className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                          {typeof warning === 'string' ? warning : JSON.stringify(warning, null, 2)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (negativeInfo || ccjSummary || (warnings && warnings.length > 0)) ? (
        <Card className="bg-white rounded-2xl border border-emerald-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-6 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-emerald-100/50">
            <CardTitle className="flex items-center text-xl font-bold text-emerald-800">
              <div className="p-2 bg-emerald-200/50 rounded-xl mr-3">
                <Info className="w-6 h-6 text-emerald-600" />
              </div>
              Clean Financial Record
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-8">
            <Alert className="bg-gradient-to-r from-emerald-50 to-emerald-100/50 border-emerald-200 rounded-xl mb-6">
              <Info className="h-5 w-5 text-emerald-600" />
              <AlertTitle className="text-emerald-800 font-semibold">Excellent Status</AlertTitle>
              <AlertDescription className="text-emerald-700 mt-2">
                While financial data is present on file, all negative indicators show zero values, indicating a clean credit record with no adverse information.
              </AlertDescription>
            </Alert>
            
            <div className="bg-slate-50 rounded-xl p-6">
              <h4 className="font-semibold text-slate-900 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-slate-600" />
                Credit Record Summary
              </h4>
              <div className="text-slate-700">
                {ccjSummary && (
                  <div className="mb-4">
                    <h5 className="font-semibold text-emerald-800 mb-3">County Court Judgments - Clean Record</h5>
                    {formatCCJData(ccjSummary)}
                  </div>
                )}
                {negativeInfo && !ccjSummary && (
                  <div className="mb-4">
                    <h5 className="font-semibold text-emerald-800 mb-3">Financial Information Review</h5>
                    {formatCCJData(negativeInfo)}
                  </div>
                )}
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mt-4">
                  <p className="text-emerald-800 font-medium">
                    ✅ All financial risk indicators show zero values
                  </p>
                  <p className="text-emerald-700 text-sm mt-1">
                    This indicates no county court judgments, writs, or other adverse financial records.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className={`bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 ${
          hasCCJIssues 
            ? 'border border-amber-200/50' 
            : 'border border-emerald-200/50'
        }`}>
          <CardHeader className={`pb-6 border-b ${
            hasCCJIssues 
              ? 'border-amber-100 bg-gradient-to-r from-amber-50 to-amber-100/50' 
              : 'border-emerald-100 bg-gradient-to-r from-emerald-50 to-emerald-100/50'
          }`}>
            <CardTitle className={`flex items-center text-xl font-bold ${
              hasCCJIssues ? 'text-amber-800' : 'text-emerald-800'
            }`}>
              <div className={`p-2 rounded-xl mr-3 ${
                hasCCJIssues 
                  ? 'bg-amber-200/50' 
                  : 'bg-emerald-200/50'
              }`}>
                {hasCCJIssues ? (
                  <AlertTriangle className="w-6 h-6 text-amber-600" />
                ) : (
                  <Info className="w-6 h-6 text-emerald-600" />
                )}
              </div>
              County Court Judgments (CCJ) {hasCCJIssues ? 'Review' : 'Summary'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-8">
            {hasCCJIssues && (
              <Alert className="bg-gradient-to-r from-amber-50 to-amber-100/50 border-amber-200 rounded-xl mb-6">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <AlertTitle className="text-amber-800 font-semibold">CCJ Records Found</AlertTitle>
                <AlertDescription className="text-amber-700 mt-2">
                  This company has County Court Judgment records that may impact credit decisions.
                </AlertDescription>
              </Alert>
            )}
            
            {!hasCCJIssues && (
              <Alert className="bg-gradient-to-r from-emerald-50 to-emerald-100/50 border-emerald-200 rounded-xl mb-6">
                <Info className="h-5 w-5 text-emerald-600" />
                <AlertTitle className="text-emerald-800 font-semibold">No Active CCJ Issues</AlertTitle>
                <AlertDescription className="text-emerald-700 mt-2">
                  All CCJ indicators show zero values, indicating no current County Court Judgment concerns.
                </AlertDescription>
              </Alert>
            )}
            
            <div className="bg-slate-50 rounded-xl p-6">
              <h4 className="font-semibold text-slate-900 mb-4">CCJ Summary Details</h4>
              <div className="text-slate-700">
                {formatCCJData(ccjSummary)}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overall Status Card - only show if no individual sections shown */}
      {!negativeInfo && !ccjSummary && (!warnings || warnings.length === 0) && (
        <Card className="bg-white rounded-2xl border border-emerald-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-12">
            <div className="text-center">
              <div className="bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6 border border-emerald-300 shadow-inner">
                <Info className="h-12 w-12 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-semibold text-emerald-900 mb-3">Excellent Risk Profile</h3>
              <p className="text-emerald-700 max-w-md mx-auto text-lg leading-relaxed">
                No negative information, warnings, or adverse indicators found. This company demonstrates a clean and positive credit history.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NegativeInformationTab;
