import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Info, Shield, TrendingUp } from "lucide-react";

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
    <div className="p-8 space-y-8 bg-gradient-to-br from-white to-slate-50/50">
      {/* Risk Factors Header */}
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-slate-900 mb-3">Risk Factors & Credit Analysis</h3>
        <p className="text-slate-600 max-w-2xl mx-auto">
          Detailed breakdown of factors influencing the credit rating and risk assessment for informed decision making.
        </p>
      </div>

      {/* Risk Factors */}
      <div className="mb-8">
        <Card className="bg-white rounded-2xl border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-6 border-b border-slate-100">
            <CardTitle className="flex items-center text-xl font-bold text-slate-900">
              <div className="p-2 bg-gradient-to-br from-[#ff8800]/10 to-[#ff8800]/5 rounded-xl mr-3">
                <Shield className="w-6 h-6 text-[#ff8800]" />
              </div>
              Main Risk Factors
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-8">
            {riskFactors && riskFactors.length > 0 ? (
              <div className="space-y-6">
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
                      className={`p-6 rounded-xl border transition-all duration-200 hover:shadow-md ${
                        isNegative 
                          ? 'bg-gradient-to-r from-red-50 to-red-100/50 border-red-200/50 hover:border-red-300' 
                          : 'bg-gradient-to-r from-emerald-50 to-emerald-100/50 border-emerald-200/50 hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex items-start">
                        <div className={`p-2 rounded-xl ${
                          isNegative ? 'bg-red-200/50' : 'bg-emerald-200/50'
                        } mr-4 mt-1`}>
                          <AlertCircle className={`h-5 w-5 ${
                            isNegative ? 'text-red-600' : 'text-emerald-600'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <h5 className={`font-semibold mb-2 ${
                            isNegative ? 'text-red-800' : 'text-emerald-800'
                          }`}>
                            {factor.title || factor.name || factor.type || `Risk Factor ${index + 1}`}
                          </h5>
                          <p className={`leading-relaxed ${
                            isNegative ? 'text-red-700' : 'text-emerald-700'
                          }`}>
                            {factor.description || factor.detail || JSON.stringify(factor)}
                          </p>
                          {factor.impact && (
                            <div className="mt-3">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                isNegative 
                                  ? 'bg-red-100 text-red-800 border border-red-200' 
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}>
                                Impact: {factor.impact}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 border border-slate-300">
                  <Shield className="h-10 w-10 text-slate-500" />
                </div>
                <h4 className="text-lg font-semibold text-slate-900 mb-2">No Risk Factors Available</h4>
                <p className="text-slate-600">
                  No specific risk factors were identified in this credit report analysis.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Risk Drivers */}
      {riskDrivers && riskDrivers.length > 0 && (
        <Card className="bg-white rounded-2xl border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-6 border-b border-slate-100">
            <CardTitle className="flex items-center text-xl font-bold text-slate-900">
              <div className="p-2 bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-xl mr-3">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              Risk Drivers
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-8">
            <div className="space-y-6">
              {riskDrivers.map((driver: any, index: number) => (
                <div key={`risk-driver-${index}`} className="bg-gradient-to-r from-blue-50 to-blue-100/50 border border-blue-200/50 rounded-xl p-6 hover:shadow-md transition-all duration-200">
                  <div className="flex items-start">
                    <div className="p-2 bg-blue-200/50 rounded-xl mr-4 mt-1">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h5 className="font-semibold text-blue-800 mb-2">
                        {driver.title || driver.name || driver.type || `Risk Driver ${index + 1}`}
                      </h5>
                      <p className="text-blue-700 leading-relaxed">
                        {driver.description || driver.detail || JSON.stringify(driver)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Additional Risk Information */}
      <Card className="bg-white rounded-2xl border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="pb-6 border-b border-slate-100">
          <CardTitle className="flex items-center text-xl font-bold text-slate-900">
            <div className="p-2 bg-gradient-to-br from-amber-500/10 to-amber-600/5 rounded-xl mr-3">
              <Info className="w-6 h-6 text-amber-600" />
            </div>
            Risk Assessment Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-8">
          <Alert className="bg-gradient-to-r from-blue-50 to-blue-100/50 border-blue-200 rounded-xl">
            <Info className="h-5 w-5 text-blue-600" />
            <AlertTitle className="text-blue-800 font-semibold">Understanding Risk Factors</AlertTitle>
            <AlertDescription className="text-blue-700 mt-2">
              Risk factors are elements that may influence the creditworthiness and financial stability of a business. 
              They help lenders and partners make informed decisions about credit limits, terms, and business relationships.
              {(riskFactors && riskFactors.length > 0) ? 
                ` This analysis identified ${riskFactors.length} specific risk factor${riskFactors.length !== 1 ? 's' : ''} for consideration.` :
                ' No specific risk factors were identified, which may indicate a stable risk profile.'
              }
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default RiskFactorsTab;
