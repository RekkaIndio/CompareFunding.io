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
            <li key={`neg-item-${i}`} className="text-sm text-amber-700">
              <span className="font-medium">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>: {
                typeof value === 'object' && value !== null ? 
                  (Array.isArray(value) ? (
                    <ul className="list-disc pl-4 mt-1">
                      {value.map((item, idx) => (
                        <li key={idx} className="text-sm text-amber-700">
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
                    <div className="ml-4 mt-1 border-l-2 border-amber-200 pl-2">
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
      <p className="text-sm text-amber-700">{String(info)}</p>
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
          <div className="p-3 border border-orange-200 bg-orange-50 rounded-md">
            <h4 className="font-medium text-gray-700 mb-2">CCJ Summary:</h4>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
              {Object.entries(ccjSummary).map(([key, value]) => (
                <div key={key}>
                  <dt className="text-sm font-medium text-gray-700">
                    {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                  </dt>
                  <dd className="text-sm text-gray-600">{String(value)}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Legal Events, CCJs and Other Events */}
          {legalEvents?.length > 0 && (
            <div className="p-3 border border-orange-200 bg-orange-50 rounded-md">
              <p className="font-medium text-sm text-orange-700 mb-2">Legal Events:</p>
              <ul className="list-disc pl-5 space-y-1 mb-3">
                {legalEvents.map((event: any, index: number) => (
                  <li key={`legal-event-${index}`} className="text-sm text-orange-700">
                    {event.type}: {event.description} 
                    {event.date && ` (${new Date(event.date).toLocaleDateString()})`}
                    {event.status && ` - ${event.status}`}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {ccjs?.length > 0 && (
            <div className="p-3 border border-red-200 bg-red-50 rounded-md">
              <p className="font-medium text-sm text-red-700 mb-2">County Court Judgments:</p>
              <ul className="list-disc pl-5 space-y-1 mb-3">
                {ccjs.map((ccj: any, index: number) => (
                  <li key={`ccj-${index}`} className="text-sm text-red-700">
                    Amount: {ccj.amount?.value} {ccj.amount?.currency}
                    {ccj.date && ` (${new Date(ccj.date).toLocaleDateString()})`}
                    {ccj.caseNumber && ` - Case: ${ccj.caseNumber}`}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {otherEvents?.length > 0 && (
            <div className="p-3 border border-red-200 bg-red-50 rounded-md">
              <p className="font-medium text-sm text-red-700 mb-2">Other Events:</p>
              <ul className="list-disc pl-5 space-y-1">
                {otherEvents.map((event: any, index: number) => (
                  <li key={`other-event-${index}`} className="text-sm text-red-700">
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
            <div className="p-3 border border-orange-200 bg-orange-50 rounded-md">
              <p className="font-medium text-sm text-orange-700 mb-2">Legal Events:</p>
              <ul className="list-disc pl-5 space-y-1 mb-3">
                {legalEvents.map((event: any, index: number) => (
                  <li key={`legal-event-${index}`} className="text-sm text-orange-700">
                    {event.type}: {event.description}
                    {event.date && ` (${new Date(event.date).toLocaleDateString()})`}
                    {event.status && ` - ${event.status}`}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {ccjs?.length > 0 && (
            <div className="p-3 border border-red-200 bg-red-50 rounded-md">
              <p className="font-medium text-sm text-red-700 mb-2">County Court Judgments:</p>
              <ul className="list-disc pl-5 space-y-1 mb-3">
                {ccjs.map((ccj: any, index: number) => (
                  <li key={`ccj-${index}`} className="text-sm text-red-700">
                    Amount: {ccj.amount?.value} {ccj.amount?.currency}
                    {ccj.date && ` (${new Date(ccj.date).toLocaleDateString()})`}
                    {ccj.caseNumber && ` - Case: ${ccj.caseNumber}`}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {otherEvents?.length > 0 && (
            <div className="p-3 border border-red-200 bg-red-50 rounded-md">
              <p className="font-medium text-sm text-red-700 mb-2">Other Events:</p>
              <ul className="list-disc pl-5 space-y-1">
                {otherEvents.map((event: any, index: number) => (
                  <li key={`other-event-${index}`} className="text-sm text-red-700">
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
        <div className="p-3 border border-orange-200 bg-orange-50 rounded-md">
          {Array.isArray(negativeInfo) ? (
            <ul className="list-disc pl-5 space-y-2">
              {negativeInfo.map((item: any, index: number) => (
                <li key={`negative-${index}`} className="text-sm text-amber-700">
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
        <Alert className="bg-green-50 text-green-700 border-green-300">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>No Negative Information</AlertTitle>
          <AlertDescription>
            No negative information has been reported for this company.
          </AlertDescription>
        </Alert>
      );
    }
  };

  return (
    <Card className="bg-white rounded-none">
      <CardHeader className="bg-[#212936]">
        <CardTitle className="text-white">Negative Information</CardTitle>
        <CardDescription>
          <span className="text-gray-300">Legal events, CCJs, and other risk factors</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Credit Commentary Section */}
        <div className="mb-4">
          <h4 className="font-medium text-gray-700 mb-2">Credit Commentary:</h4>
          {creditReport.report?.creditScore?.commentary ? (
            <div className="p-3 border border-blue-100 bg-blue-50 rounded-md">
              <p className="text-gray-800">
                {creditReport.report.creditScore.commentary}
              </p>
            </div>
          ) : (
            <p className="text-gray-600 mb-4">No credit commentary available.</p>
          )}
        </div>
        
        {/* Negative Information */}
        {renderNegativeInformation()}
      </CardContent>
    </Card>
  );
};

export default NegativeInformationTab;
