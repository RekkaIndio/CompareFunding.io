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
    <Card className="bg-white rounded-none">
      <CardHeader className="bg-[#212936]">
        <CardTitle className="text-white">Risk Factors Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Risk Factors */}
        <div className="mb-8">
          <h4 className="font-medium text-gray-700 mb-2">Main Risk Factors:</h4>
          
          {riskFactors && riskFactors.length > 0 ? (
            <div className="space-y-3">
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
                    className={`p-4 rounded-md border ${
                      isNegative 
                        ? 'bg-red-50 border-red-200' 
                        : 'bg-green-50 border-green-200'
                    }`}
                  >
                    <div className="flex items-start">
                      <div className={`p-1.5 rounded-full ${
                        isNegative ? 'bg-red-100' : 'bg-green-100'
                      } mr-3 mt-0.5`}>
                        <AlertCircle className={`h-4 w-4 ${
                          isNegative ? 'text-red-600' : 'text-green-600'
                        }`} />
                      </div>
                      <div>
                        <p className={`font-medium ${
                          isNegative ? 'text-red-700' : 'text-green-700'
                        }`}>
                          {factor.title || factor.type || 'Risk Factor'}
                        </p>
                        <p className={`text-sm mt-1 ${
                          isNegative ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {factor.description || factor.text || factor.value || 'No detailed description available.'}
                        </p>
                        {factor.impact && (
                          <p className="text-xs mt-1 italic">
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
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>No specific risk factors</AlertTitle>
              <AlertDescription>
                No specific risk factors have been identified for this company.
              </AlertDescription>
            </Alert>
          )}
        </div>
        
        {/* Risk Drivers */}
        {riskDrivers && riskDrivers.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Risk Drivers:</h4>
            <div className="border rounded-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Driver
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Impact
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {riskDrivers.map((driver: any, index: number) => {
                    const impact = driver.impact || driver.weight || '';
                    const isNegative = 
                      (typeof impact === 'string' && impact.toLowerCase().includes('negative')) ||
                      impact < 0;
                    
                    return (
                      <tr key={`driver-${index}`}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {driver.name || driver.type || `Driver ${index + 1}`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            isNegative
                              ? 'bg-red-100 text-red-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {impact}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
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
      </CardContent>
    </Card>
  );
};

export default RiskFactorsTab;
