import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Info } from "lucide-react";

interface RiskFactorsTabProps {
  creditReport: any;
}

export const RiskFactorsTab: React.FC<RiskFactorsTabProps> = ({ creditReport }) => {
  // Extract risk factors from the report
  const riskFactors = creditReport.report?.creditScore?.riskFactors || 
                     creditReport.report?.additionalInformation?.riskFactors ||
                     [];
  
  // Extract risk drivers from the report                   
  const riskDrivers = creditReport.report?.additionalInformation?.riskDrivers ||
                     creditReport.report?.creditScore?.riskDrivers ||
                     [];

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-slate-800 to-slate-900">
      {/* Risk Factors */}
      <div className="mb-8">
        <h4 className="font-medium text-white mb-4">Main Risk Factors:</h4>
        
        {riskFactors && riskFactors.length > 0 ? (
          <div className="space-y-4">
            {riskFactors.map((factor: any, index: number) => {
              // Determine if the factor has a positive or negative impact
              const isNegative = 
                (typeof factor.impact === 'string' && factor.impact.toLowerCase().includes('negative')) ||
                factor.type?.toLowerCase().includes('negative') ||
                factor.description?.toLowerCase().includes('concern') ||
                factor.description?.toLowerCase().includes('risk');

              return (
                <div 
                  key={`risk-factor-${index}`} 
                  className={`p-4 rounded-lg border ${
                    isNegative 
                      ? 'bg-red-500/20 border-red-500/30' 
                      : 'bg-emerald-500/20 border-emerald-500/30'
                  }`}
                >
                  <div className="flex items-start">
                    <div className={`p-1.5 rounded-full ${
                      isNegative ? 'bg-red-500/30' : 'bg-emerald-500/30'
                    } mr-3 mt-0.5`}>
                      <AlertCircle className={`h-4 w-4 ${
                        isNegative ? 'text-red-400' : 'text-emerald-400'
                      }`} />
                    </div>
                    <div>
                      <p className={`font-medium ${
                        isNegative ? 'text-red-300' : 'text-emerald-300'
                      }`}>
                        {factor.title || factor.type || 'Risk Factor'}
                      </p>
                      <p className={`text-sm mt-1 ${
                        isNegative ? 'text-red-200' : 'text-emerald-200'
                      }`}>
                        {factor.description || factor.text || factor.value || 'No detailed description available.'}
                      </p>
                      {factor.impact && (
                        <p className="text-xs mt-1 italic text-slate-300">
                          Impact: {factor.impact}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <Alert className="bg-blue-500/20 border-blue-500/30">
            <Info className="h-4 w-4 text-blue-400" />
            <AlertTitle className="text-blue-300">No specific risk factors</AlertTitle>
            <AlertDescription className="text-blue-200">
              No specific risk factors have been identified for this company.
            </AlertDescription>
          </Alert>
        )}
      </div>
      
      {/* Risk Drivers */}
      {riskDrivers && riskDrivers.length > 0 && (
        <div>
          <h4 className="font-medium text-white mb-4">Risk Drivers:</h4>
          <div className="border border-slate-600 rounded-lg overflow-hidden bg-slate-700/50">
            <table className="min-w-full divide-y divide-slate-600">
              <thead className="bg-slate-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Driver
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Impact
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-slate-800/50 divide-y divide-slate-600">
                {riskDrivers.map((driver: any, index: number) => {
                  const impact = driver.impact || driver.weight || '';
                  const isNegative = 
                    (typeof impact === 'string' && impact.toLowerCase().includes('negative')) ||
                    impact < 0;
                  
                  return (
                    <tr key={`driver-${index}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                        {driver.name || driver.type || `Driver ${index + 1}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          isNegative
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {impact}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">
                        {driver.description || driver.text || driver.details || 'No details available'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiskFactorsTab;
