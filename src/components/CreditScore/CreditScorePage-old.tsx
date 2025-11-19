import React, { useState } from "react";
import PageLayout from "@/components/PageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  Building2,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  AlertTriangle,
  Download,
  RefreshCw,
  Shield,
  BarChart3,
  Eye,
  Zap,
} from "lucide-react";
import CompanyHeader from "./CompanyHeader";
import OverviewTab from "./OverviewTab";
import NegativeInformationTab from "./NegativeInformationTab";
import RiskFactorsTab from "./RiskFactorsTab";
import { sampleCreditReport, sampleCompany } from "./sampleCreditData";

const CreditScorePage = () => {
  const [selectedCompany, setSelectedCompany] = useState(sampleCompany);
  const [creditReport, setCreditReport] = useState(sampleCreditReport);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [isSampleData] = useState(true);

  // Extract credit score - using correct data structure
  const creditScore = 75; // B rating = 75 score
  const creditRating = creditReport?.report?.creditScore?.currentCreditRating?.commonValue || "B";
  const creditLimit = creditReport?.report?.creditScore?.currentCreditRating?.creditLimit?.value || 50000;
  
  // Determine score color and description (Experian style)
  const getScoreColor = (score: number) => {
    if (score >= 80) return { bg: "bg-emerald-100", text: "text-emerald-900", badge: "bg-emerald-500", label: "Excellent" };
    if (score >= 70) return { bg: "bg-blue-100", text: "text-blue-900", badge: "bg-blue-500", label: "Good" };
    if (score >= 50) return { bg: "bg-amber-100", text: "text-amber-900", badge: "bg-amber-500", label: "Fair" };
    return { bg: "bg-red-100", text: "text-red-900", badge: "bg-red-500", label: "Poor" };
  };

  const scoreColor = getScoreColor(creditScore);

  return (
    <PageLayout showSidebar={true}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        {/* Top Hero Section with Gradient Background */}
        <div className="relative overflow-hidden bg-gradient-to-b from-blue-600 via-blue-700 to-blue-900 text-white">
          {/* Decorative background elements */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 left-20 w-72 h-72 bg-blue-300 rounded-full blur-3xl"></div>
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
              {/* Left: Company Info */}
              <div className="lg:col-span-2">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/30">
                    <Building2 className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                      {selectedCompany?.name || "Business Credit Report"}
                    </h1>
                    {selectedCompany?.registrationNumber && (
                      <p className="text-blue-100 mt-2 text-lg">
                        Companies House No. <span className="font-mono font-semibold">{selectedCompany.registrationNumber}</span>
                      </p>
                    )}
                    <div className="flex gap-3 mt-4 flex-wrap">
                      <Badge className="bg-white/20 text-white border border-white/40 hover:bg-white/30">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {selectedCompany?.status || "Active"}
                      </Badge>
                      {isSampleData && (
                        <Badge className="bg-amber-400/20 text-amber-200 border border-amber-300/40">
                          <Eye className="w-3 h-3 mr-1" />
                          Sample Data
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Quick Actions */}
              <div className="flex flex-col gap-3">
                <Button className="bg-white text-blue-700 hover:bg-blue-50 font-semibold py-2 h-auto">
                  <Download className="w-4 h-4 mr-2" />
                  Export Report
                </Button>
                <Button className="bg-blue-500/30 border border-white/30 text-white hover:bg-blue-500/50 font-semibold py-2 h-auto">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Data
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Credit Score Showcase - Premium Design */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {/* Main Score Card - Left (Larger) */}
            <div className="lg:col-span-2">
              <div className="relative bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
                {/* Card Background Accent */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"></div>

                <div className="relative p-8 md:p-12">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    {/* Score Visualization */}
                    <div className="flex flex-col items-center justify-center">
                      <p className="text-slate-500 text-sm uppercase font-semibold tracking-widest mb-4">
                        Your Credit Score
                      </p>
                      
                      {/* Circular Score Display */}
                      <div className="relative w-48 h-48 mb-6">
                        {/* Background circle */}
                        <svg className="w-full h-full" viewBox="0 0 200 200">
                          <circle cx="100" cy="100" r="90" fill="none" stroke="#e2e8f0" strokeWidth="12" />
                          <circle 
                            cx="100" 
                            cy="100" 
                            r="90" 
                            fill="none" 
                            stroke={scoreColor.badge}
                            strokeWidth="12"
                            strokeDasharray={`${(creditScore / 100) * 565} 565`}
                            strokeLinecap="round"
                            style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dasharray 1s ease' }}
                          />
                        </svg>
                        
                        {/* Center text */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <div className={`text-6xl font-black ${scoreColor.text}`}>
                            {creditScore}
                          </div>
                          <div className="text-slate-400 font-semibold mt-1">/100</div>
                        </div>
                      </div>

                      {/* Rating Badge */}
                      <Badge className={`${scoreColor.badge} text-white border-0 text-base px-6 py-2 mb-3`}>
                        {scoreColor.label} Rating
                      </Badge>
                      
                      <p className="text-sm text-slate-600 text-center">
                        Your credit profile shows a strong payment history
                      </p>
                    </div>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-1 gap-4">
                      <div className="bg-gradient-to-br from-emerald-50 to-emerald-50/50 rounded-xl p-5 border border-emerald-200">
                        <div className="flex items-start justify-between mb-2">
                          <p className="text-emerald-700 text-xs uppercase font-bold tracking-wider">
                            Credit Limit
                          </p>
                          <Zap className="w-4 h-4 text-emerald-600" />
                        </div>
                        <p className="text-3xl font-bold text-emerald-900">
                          £{creditLimit.toLocaleString()}
                        </p>
                        <p className="text-xs text-emerald-600 mt-2">
                          ↑ 8% from last quarter
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-blue-50 to-blue-50/50 rounded-xl p-5 border border-blue-200">
                        <div className="flex items-start justify-between mb-2">
                          <p className="text-blue-700 text-xs uppercase font-bold tracking-wider">
                            Credit Rating
                          </p>
                          <Shield className="w-4 h-4 text-blue-600" />
                        </div>
                        <p className="text-3xl font-bold text-blue-900">
                          {creditRating}
                        </p>
                        <p className="text-xs text-blue-600 mt-2">
                          Strong payment history
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-amber-50 to-amber-50/50 rounded-xl p-5 border border-amber-200">
                        <div className="flex items-start justify-between mb-2">
                          <p className="text-amber-700 text-xs uppercase font-bold tracking-wider">
                            Risk Level
                          </p>
                          <BarChart3 className="w-4 h-4 text-amber-600" />
                        </div>
                        <p className="text-3xl font-bold text-amber-900">
                          Medium
                        </p>
                        <p className="text-xs text-amber-600 mt-2">
                          Within acceptable range
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar Stats Cards */}
            <div className="flex flex-col gap-4">
              {/* Payment Status */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200 hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h3 className="font-bold text-slate-900">Payment Status</h3>
                </div>
                <p className="text-2xl font-bold text-emerald-600">Good</p>
                <p className="text-xs text-slate-600 mt-2">
                  0 missed or late payments
                </p>
              </div>

              {/* Companies Report */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200 hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="font-bold text-slate-900">Last Updated</h3>
                </div>
                <p className="text-2xl font-bold text-purple-600">
                  {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </p>
                <p className="text-xs text-slate-600 mt-2">
                  Data current this month
                </p>
              </div>

              {/* Comparison */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl shadow-lg p-6">
                <h3 className="font-bold mb-4">Industry Benchmark</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Your Score:</span>
                    <span className="font-bold">75</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Industry Avg:</span>
                    <span className="font-bold">62</span>
                  </div>
                  <div className="pt-2 border-t border-slate-700 flex justify-between items-center">
                    <span className="text-slate-300">Difference:</span>
                    <span className="text-emerald-400 font-bold">+13 points</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
              {/* Score Display */}
              <div className="flex flex-col items-center justify-center py-8">
                <p className="text-gray-600 text-sm uppercase font-semibold mb-2">
                  Credit Score
                </p>
                <div className="relative w-40 h-40 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-8 border-gray-300 opacity-20"></div>
                  <div className="absolute inset-0 rounded-full border-8" 
                       style={{
                         borderColor: 'transparent',
                         borderTopColor: scoreColor.badge,
                         borderRightColor: scoreColor.badge,
                         transform: `rotate(${(creditScore / 100) * 360}deg)`,
                         transition: 'transform 0.5s ease'
                       }}>
                  </div>
                  <div className="text-center">
                    <div className={`text-5xl font-bold ${scoreColor.text}`}>
                      {creditScore}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">/100</div>
                  </div>
                </div>
                <Badge className={`${scoreColor.badge} text-white border-0 mt-6 text-base px-4 py-1`}>
                  {scoreColor.label}
                </Badge>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white bg-opacity-60 rounded-lg p-4">
                  <p className="text-gray-600 text-xs uppercase font-semibold">
                    Credit Limit
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    £{creditLimit.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Available limit
                  </p>
                </div>

                <div className="bg-white bg-opacity-60 rounded-lg p-4">
                  <p className="text-gray-600 text-xs uppercase font-semibold">
                    Credit Rating
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {creditRating}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Current rating
                  </p>
                </div>

                <div className="bg-white bg-opacity-60 rounded-lg p-4">
                  <p className="text-gray-600 text-xs uppercase font-semibold">
                    Payment Status
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <span className="font-semibold text-gray-900">Good</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    No defaults
                  </p>
                </div>

                <div className="bg-white bg-opacity-60 rounded-lg p-4">
                  <p className="text-gray-600 text-xs uppercase font-semibold">
                    Risk Level
                  </p>
                  <p className="text-2xl font-bold text-amber-600 mt-2">
                    Medium
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Overall risk
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Alerts Section */}
          {creditReport?.report?.negativeInformation?.hasNegativeInfo && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900">Important Information</h3>
                <p className="text-sm text-red-800 mt-1">
                  This report contains information that may affect credit decisions. 
                  Review the details below for more information.
                </p>
              </div>
            </div>
          )}

          {/* Tabs Section */}
          <Card>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              {/* Tab Navigation */}
              <div className="border-b border-gray-200">
                <TabsList className="bg-transparent h-auto p-0 gap-0 rounded-none flex justify-start">
                  <TabsTrigger
                    value="overview"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 px-6 py-4 font-medium text-gray-600">
                    Credit Overview
                  </TabsTrigger>
                  <TabsTrigger
                    value="risk"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 px-6 py-4 font-medium text-gray-600">
                    Risk Factors
                  </TabsTrigger>
                  <TabsTrigger
                    value="negative"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 px-6 py-4 font-medium text-gray-600">
                    Negative Information
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                <TabsContent value="overview" className="mt-0">
                  {creditReport && (
                    <OverviewTab creditReport={creditReport} />
                  )}
                </TabsContent>

                <TabsContent value="risk" className="mt-0">
                  {creditReport && (
                    <RiskFactorsTab creditReport={creditReport} />
                  )}
                </TabsContent>

                <TabsContent value="negative" className="mt-0">
                  {creditReport && (
                    <NegativeInformationTab creditReport={creditReport} />
                  )}
                </TabsContent>
              </div>
            </Tabs>
          </Card>

          {/* Footer Information */}
          <div className="mt-8 bg-gray-100 rounded-lg p-6 text-center text-sm text-gray-600">
            <p>
              This credit report is provided for informational purposes. 
              For official credit decisions, consult with your lenders or credit providers.
            </p>
            <p className="mt-2 text-xs text-gray-500">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .tab-content {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </PageLayout>
  );
};

export default CreditScorePage;
