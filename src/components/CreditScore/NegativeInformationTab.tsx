import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2 } from "lucide-react";
import { tryParseJSON } from './utils';

interface NegativeInformationTabProps {
  creditReport: any;
}

export const NegativeInformationTab: React.FC<NegativeInformationTabProps> = ({ creditReport }) => {
  // Format JSON for display
  const formatNegativeInfo = (info: any) => {
    const parsed = tryParseJSON(info);
    if (typeof parsed === 'object' && parsed !== null) {
      return (
        <ul className="list-disc pl-5 space-y-2">
          {Object.entries(parsed).map(([key, value], i) => (
            <li key={`neg-item-${i}`} className="text-sm text-amber-300">
              <span className="font-medium">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>: {
                typeof value === 'object' && value !== null ? 
                  (Array.isArray(value) ? (
                    <ul className="list-disc pl-4 mt-1">
                      {value.map((item, idx) => (
                        <li key={idx} className="text-sm text-amber-300">
                          {typeof item === 'object' ? 
                            Object.entries(item).map(([itemKey, itemValue]) => (
                              <div key={itemKey}>
                                <span className="font-medium">{itemKey.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</span>: {String(itemValue)}
                              </div>
                            )) : 
                            String(item)
                          }
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="ml-4 mt-1 border-l-2 border-amber-500/30 pl-2">
                      {Object.entries(value).map(([nestedKey, nestedValue]) => (
                        <div key={nestedKey} className="text-sm">
                          <span className="font-medium">{nestedKey.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</span>: {
                            typeof nestedValue === 'object' && nestedValue !== null ? 
                              JSON.stringify(nestedValue) : 
                              String(nestedValue)
                          }
                        </div>
                      ))}
                    </div>
                  ))
                  : String(value)
              }
            </li>
          ))}
        </ul>
      );
    }
    return (
      <p className="text-sm text-amber-300">{String(info)}</p>
    );
  };

  // Negative Information display logic
  const renderNegativeInformation = () => {
    const legalEvents = creditReport.report?.additionalInformation?.negativeInformation?.legalEvents;
    const ccjs = creditReport.report?.additionalInformation?.negativeInformation?.ccjs;
    const otherEvents = creditReport.report?.additionalInformation?.negativeInformation?.otherEvents;
    
    let hasNegativeInfo = false;
    
    // Display CCJ Summary if available
    // Look for the summary in various possible locations
    const ccjSummary = 
      creditReport.report?.additionalInformation?.negativeInformation?.ccjSummary ||
      creditReport.report?.additionalInformation?.ccjSummary ||
      creditReport.report?.additionalInformation?.negativeInformation?.cciSummary || 
      creditReport.report?.additionalInformation?.cciSummary;
    
    if (ccjSummary && typeof ccjSummary === 'object') {
      hasNegativeInfo = true;
      return (
        <div className="space-y-4">
          {/* CCJ Summary */}
          <div className="p-4 border border-amber-500/30 bg-amber-500/20 rounded-lg">
            <h4 className="font-medium text-amber-300 mb-2">CCJ Summary:</h4>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
              {Object.entries(ccjSummary).map(([key, value]) => (
                <div key={key}>
                  <dt className="text-sm font-medium text-amber-200">
                    {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                  </dt>
                  <dd className="text-sm text-white">{String(value)}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Legal Events, CCJs and Other Events */}
          {legalEvents?.length > 0 && (
            <div className="p-4 border border-amber-500/30 bg-amber-500/20 rounded-lg">
              <p className="font-medium text-sm text-amber-300 mb-2">Legal Events:</p>
              <ul className="list-disc pl-5 space-y-1 mb-3">
                {legalEvents.map((event: any, index: number) => (
                  <li key={`legal-event-${index}`} className="text-sm text-amber-200">
                    {event.type}: {event.description} 
                    {event.date && ` (${new Date(event.date).toLocaleDateString()})`}
                    {event.status && ` - ${event.status}`}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {ccjs?.length > 0 && (
            <div className="p-4 border border-red-500/30 bg-red-500/20 rounded-lg">
              <p className="font-medium text-sm text-red-300 mb-2">County Court Judgments:</p>
              <ul className="list-disc pl-5 space-y-1 mb-3">
                {ccjs.map((ccj: any, index: number) => (
                  <li key={`ccj-${index}`} className="text-sm text-red-200">
                    Amount: {ccj.amount?.value} {ccj.amount?.currency}
                    {ccj.date && ` (${new Date(ccj.date).toLocaleDateString()})`}
                    {ccj.caseNumber && ` - Case: ${ccj.caseNumber}`}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {otherEvents?.length > 0 && (
            <div className="p-4 border border-red-500/30 bg-red-500/20 rounded-lg">
              <p className="font-medium text-sm text-red-300 mb-2">Other Events:</p>
              <ul className="list-disc pl-5 space-y-1">
                {otherEvents.map((event: any, index: number) => (
                  <li key={`other-event-${index}`} className="text-sm text-red-200">
                    {event.type}: {event.description}
                    {event.date && ` (${new Date(event.date).toLocaleDateString()})`}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    }

    if (legalEvents?.length || ccjs?.length || otherEvents?.length) {
      hasNegativeInfo = true;
      return (
        <div className="space-y-4">
          {legalEvents?.length > 0 && (
            <div className="p-4 border border-amber-500/30 bg-amber-500/20 rounded-lg">
              <p className="font-medium text-sm text-amber-300 mb-2">Legal Events:</p>
              <ul className="list-disc pl-5 space-y-1 mb-3">
                {legalEvents.map((event: any, index: number) => (
                  <li key={`legal-event-${index}`} className="text-sm text-amber-200">
                    {event.type}: {event.description}
                    {event.date && ` (${new Date(event.date).toLocaleDateString()})`}
                    {event.status && ` - ${event.status}`}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {ccjs?.length > 0 && (
            <div className="p-4 border border-red-500/30 bg-red-500/20 rounded-lg">
              <p className="font-medium text-sm text-red-300 mb-2">County Court Judgments:</p>
              <ul className="list-disc pl-5 space-y-1 mb-3">
                {ccjs.map((ccj: any, index: number) => (
                  <li key={`ccj-${index}`} className="text-sm text-red-200">
                    Amount: {ccj.amount?.value} {ccj.amount?.currency}
                    {ccj.date && ` (${new Date(ccj.date).toLocaleDateString()})`}
                    {ccj.caseNumber && ` - Case: ${ccj.caseNumber}`}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {otherEvents?.length > 0 && (
            <div className="p-4 border border-red-500/30 bg-red-500/20 rounded-lg">
              <p className="font-medium text-sm text-red-300 mb-2">Other Events:</p>
              <ul className="list-disc pl-5 space-y-1">
                {otherEvents.map((event: any, index: number) => (
                  <li key={`other-event-${index}`} className="text-sm text-red-200">
                    {event.type}: {event.description}
                    {event.date && ` (${new Date(event.date).toLocaleDateString()})`}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    } 
    
    // Fall back to more generic structure if specific structures aren't found
    const negativeInfo = 
      creditReport.report?.additionalInformation?.negativeInformation ||
      creditReport.report?.negativeInformation || 
      creditReport.report?.negativeInfo ||
      creditReport.report?.adverseInfo || 
      creditReport.report?.warnings ||
      creditReport.report?.riskFactors;
    
    if (negativeInfo && !hasNegativeInfo) {
      return (
        <div className="p-4 border border-amber-500/30 bg-amber-500/20 rounded-lg">
          {Array.isArray(negativeInfo) ? (
            <ul className="list-disc pl-5 space-y-2">
              {negativeInfo.map((item: any, index: number) => (
                <li key={`negative-${index}`} className="text-sm text-amber-200">
                  {formatNegativeInfo(item.text || item.value || item.description || item.warning || item)}
                </li>
              ))}
            </ul>
          ) : (
            formatNegativeInfo(negativeInfo)
          )}
        </div>
      );
    } else if (!hasNegativeInfo) {
      return (
        <Alert className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle className="text-emerald-200">No Negative Information</AlertTitle>
          <AlertDescription className="text-emerald-300">
            No negative information has been reported for this company.
          </AlertDescription>
        </Alert>
      );
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-slate-800 to-slate-900">
      {/* Credit Commentary Section */}
      <div className="mb-6">
        <h4 className="font-medium text-white mb-3">Credit Commentary:</h4>
        {creditReport.report?.creditScore?.commentary ? (
          <div className="p-4 border border-blue-500/30 bg-blue-500/20 rounded-lg">
            <p className="text-blue-100">
              {creditReport.report.creditScore.commentary}
            </p>
          </div>
        ) : (
          <p className="text-slate-300 mb-4">No credit commentary available.</p>
        )}
      </div>
      
      {/* Negative Information */}
      {renderNegativeInformation()}
    </div>
  );
};

export default NegativeInformationTab;
