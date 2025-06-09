import React from "react";
import PageLayout from '@/components/PageLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Shield, Building, CheckCircle, ArrowRight, Users, Zap, TrendingUp, Calculator, Crown, AlertTriangle } from 'lucide-react';

const HMRCIntegrationPage: React.FC = () => {
  const benefits = [
    {
      icon: <Shield className="text-[#ff8000]" size={24} />,
      title: "Tax Compliance Verification",
      description: "Demonstrate your business is up-to-date with tax obligations to increase lender confidence"
    },
    {
      icon: <TrendingUp className="text-[#ff8000]" size={24} />,
      title: "Revenue Validation",
      description: "Your VAT returns provide independent verification of your business turnover and growth"
    },
    {
      icon: <Users className="text-[#ff8000]" size={24} />,
      title: "Enhanced Credibility",
      description: "HMRC data integration shows lenders you operate a legitimate, compliant business"
    }
  ];

  const dataTypes = [
    {
      icon: <FileText className="text-[#ff8000]" size={24} />,
      title: "VAT Returns",
      description: "Quarterly VAT submissions showing sales, purchases, and VAT calculations",
      includes: ["Box 1: VAT due on sales", "Box 6: Total value of sales", "Box 7: Total value of purchases", "Submission dates and status"]
    },
    {
      icon: <Calculator className="text-[#ff8000]" size={24} />,
      title: "Corporation Tax",
      description: "Annual corporation tax returns and payment history",
      includes: ["Total turnover", "Total tax payable", "Filing dates", "Payment status"]
    },
    {
      icon: <Building className="text-[#ff8000]" size={24} />,
      title: "PAYE Information",
      description: "Payroll data showing employee numbers and wage costs",
      includes: ["Employee count", "Total payroll costs", "PAYE submissions", "RTI data"]
    }
  ];

  const lenderBenefits = [
    "Verify business legitimacy and trading history",
    "Confirm revenue figures independently",
    "Check tax compliance status",
    "Assess business growth trends",
    "Validate employment costs",
    "Understand seasonal patterns"
  ];

  const requirements = [
    {
      title: "Government Gateway Account",
      description: "You'll need an active Government Gateway account with digital access to your tax records",
      status: "Required"
    },
    {
      title: "VAT Registration",
      description: "Your business must be VAT registered to share VAT return data",
      status: "For VAT Data"
    },
    {
      title: "Corporation Tax",
      description: "Limited companies can share corporation tax return information",
      status: "Limited Companies"
    },
    {
      title: "PAYE Scheme",
      description: "Businesses with employees can share payroll information",
      status: "With Employees"
    }
  ];

  return (
    <PageLayout fullWidth>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="mb-16 text-center max-w-4xl mx-auto">
          <div className="mb-8">
            <img 
              src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80" 
              alt="HMRC tax integration" 
              className="w-full max-w-2xl mx-auto rounded-xl shadow-xl"
            />
          </div>
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-gradient-to-br from-[#212936] to-[#2c3c53] rounded-full shadow-lg">
              <Crown className="text-[#ff8000]" size={48} />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-[#212936] mb-6">
            HMRC Integration
          </h1>
          <p className="text-xl text-slate-600 mb-8">
            Connect your HMRC tax records to provide lenders with official verification of your business 
            revenue, tax compliance, and trading history. Strengthen your funding applications with government data.
          </p>
          <Button className="bg-gradient-to-r from-[#ff8800] to-[#ffaa00] hover:from-[#ff9900] hover:to-[#ffbb00] text-white px-8 py-3 text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            Connect HMRC Records
            <ArrowRight className="ml-2" size={20} />
          </Button>
        </div>

        {/* Benefits Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-[#212936] text-center mb-12">
            Why Connect Your HMRC Data?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {benefits.map((benefit, index) => (
              <Card key={index} className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="h-1.5 w-full bg-gradient-to-r from-[#212936] to-[#ff8000]"></div>
                <div className="p-8 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-gradient-to-br from-[#212936] to-[#2c3c53] rounded-full shadow-lg">
                      {benefit.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-[#212936] mb-3">
                    {benefit.title}
                  </h3>
                  <p className="text-slate-600">
                    {benefit.description}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Data Types Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-[#212936] text-center mb-12">
            HMRC Data We Can Access
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {dataTypes.map((dataType, index) => (
              <Card key={index} className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="h-1.5 w-full bg-gradient-to-r from-[#212936] to-[#ff8000]"></div>
                <div className="p-8">
                  <div className="flex justify-center mb-6">
                    <div className="p-3 bg-gradient-to-br from-[#212936] to-[#2c3c53] rounded-full shadow-lg">
                      {dataType.icon}
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-[#212936] mb-4 text-center">
                    {dataType.title}
                  </h3>
                  <p className="text-slate-600 mb-6 text-center">
                    {dataType.description}
                  </p>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-[#212936] mb-3">Includes:</h4>
                    {dataType.includes.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex items-start">
                        <CheckCircle className="text-[#ff8000] mr-2 mt-0.5 flex-shrink-0" size={16} />
                        <span className="text-sm text-slate-600">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* What Lenders See Section */}
        <div className="mb-16 bg-gradient-to-br from-slate-50 to-slate-100 py-16 px-8 rounded-xl shadow-lg">
          <h2 className="text-3xl font-bold text-[#212936] text-center mb-4">
            How This Helps Lenders Assess Your Application
          </h2>
          <p className="text-lg text-slate-600 text-center mb-8 max-w-3xl mx-auto">
            Official government data provides independent verification of your business performance
          </p>
          
          {/* Government Data Visual */}
          <div className="mb-12 text-center">
            <img 
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" 
              alt="Government building and official documentation representing HMRC data verification" 
              className="rounded-xl shadow-xl w-full max-w-4xl mx-auto h-[300px] object-cover"
            />
          </div>
          
          <div className="max-w-4xl mx-auto">
            <Card className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="h-1.5 w-full bg-gradient-to-r from-[#212936] to-[#ff8000]"></div>
              <div className="p-8">
                <div className="text-center mb-8">
                  <div className="p-4 bg-gradient-to-br from-[#212936] to-[#2c3c53] rounded-full shadow-lg inline-block mb-4">
                    <Building className="text-[#ff8000] mx-auto" size={48} />
                  </div>
                  <h3 className="text-2xl font-semibold text-[#212936] mb-4">
                    Official Government Verification
                  </h3>
                  <p className="text-slate-600">
                    HMRC data provides independent, authoritative confirmation of your business metrics
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-semibold text-[#212936] mb-4">Lenders can verify:</h4>
                    <ul className="space-y-2">
                      {lenderBenefits.map((benefit, index) => (
                        <li key={index} className="flex items-start">
                          <CheckCircle className="text-[#ff8000] mr-2 mt-0.5 flex-shrink-0" size={16} />
                          <span className="text-sm text-slate-600">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#212936] mb-4">This can lead to:</h4>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <CheckCircle className="text-[#ff8000] mr-2 mt-0.5 flex-shrink-0" size={16} />
                        <span className="text-sm text-slate-600">Faster application processing</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="text-[#ff8000] mr-2 mt-0.5 flex-shrink-0" size={16} />
                        <span className="text-sm text-slate-600">More competitive interest rates</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="text-[#ff8000] mr-2 mt-0.5 flex-shrink-0" size={16} />
                        <span className="text-sm text-slate-600">Higher funding amounts</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="text-[#ff8000] mr-2 mt-0.5 flex-shrink-0" size={16} />
                        <span className="text-sm text-slate-600">Reduced documentation requirements</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Requirements Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-[#212936] text-center mb-12">
            Requirements for HMRC Integration
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {requirements.map((requirement, index) => (
              <Card key={index} className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="h-1.5 w-full bg-gradient-to-r from-[#212936] to-[#ff8000]"></div>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-[#212936]">
                      {requirement.title}
                    </h3>
                    <span className="bg-gradient-to-r from-[#ff8800] to-[#ffaa00] text-white px-3 py-1 rounded-full text-xs font-medium shadow-sm">
                      {requirement.status}
                    </span>
                  </div>
                  <p className="text-slate-600">
                    {requirement.description}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Security and Privacy Section */}
        <div className="mb-16 bg-gradient-to-br from-slate-50 to-slate-100 py-16 px-8 rounded-xl shadow-lg">
          <h2 className="text-3xl font-bold text-[#212936] text-center mb-12">
            Security and Privacy
          </h2>
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="h-1.5 w-full bg-gradient-to-r from-[#212936] to-[#ff8000]"></div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-[#212936] mb-4 flex items-center">
                    <div className="p-2 bg-gradient-to-br from-[#212936] to-[#2c3c53] rounded-lg mr-3">
                      <Shield className="text-[#ff8000]" size={24} />
                    </div>
                    Data Security
                  </h3>
                  <ul className="space-y-2">
                    <li className="flex items-center text-slate-600">
                      <CheckCircle className="text-[#ff8000] mr-2" size={16} />
                      Government-grade security protocols
                    </li>
                    <li className="flex items-center text-slate-600">
                      <CheckCircle className="text-[#ff8000] mr-2" size={16} />
                      End-to-end encryption
                    </li>
                    <li className="flex items-center text-slate-600">
                      <CheckCircle className="text-[#ff8000] mr-2" size={16} />
                      No sensitive data stored locally
                    </li>
                    <li className="flex items-center text-slate-600">
                      <CheckCircle className="text-[#ff8000] mr-2" size={16} />
                      GDPR compliant data handling
                    </li>
                  </ul>
                </div>
              </Card>
              <Card className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="h-1.5 w-full bg-gradient-to-r from-[#212936] to-[#ff8000]"></div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-[#212936] mb-4 flex items-center">
                    <div className="p-2 bg-gradient-to-br from-[#212936] to-[#2c3c53] rounded-lg mr-3">
                      <Users className="text-[#ff8000]" size={24} />
                    </div>
                    Your Control
                  </h3>
                  <ul className="space-y-2">
                    <li className="flex items-center text-slate-600">
                      <CheckCircle className="text-[#ff8000] mr-2" size={16} />
                      You control what data to share
                    </li>
                    <li className="flex items-center text-slate-600">
                      <CheckCircle className="text-[#ff8000] mr-2" size={16} />
                      Revoke access at any time
                    </li>
                    <li className="flex items-center text-slate-600">
                      <CheckCircle className="text-[#ff8000] mr-2" size={16} />
                      Choose which lenders see data
                    </li>
                    <li className="flex items-center text-slate-600">
                      <CheckCircle className="text-[#ff8000] mr-2" size={16} />
                      Full audit trail of data access
                    </li>
                  </ul>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Important Notice */}
        <div className="mb-16">
          <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-l-4 border-l-[#ff8000] border border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="p-8">
              <div className="flex items-start">
                <div className="p-2 bg-gradient-to-br from-[#212936] to-[#2c3c53] rounded-lg mr-4 flex-shrink-0">
                  <AlertTriangle className="text-[#ff8000]" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#212936] mb-2">
                    Important Information
                  </h3>
                  <p className="text-slate-700 mb-4">
                    HMRC integration requires your explicit consent and uses official government APIs. 
                    This is not a third-party scraping service - it's a direct, secure connection to HMRC systems.
                  </p>
                  <ul className="space-y-1 text-sm text-slate-600">
                    <li className="flex items-center">
                      <CheckCircle className="text-[#ff8000] mr-2 flex-shrink-0" size={14} />
                      You must have online access to your HMRC account
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="text-[#ff8000] mr-2 flex-shrink-0" size={14} />
                      All tax submissions must be up to date
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="text-[#ff8000] mr-2 flex-shrink-0" size={14} />
                      Connection requires two-factor authentication
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="text-[#ff8000] mr-2 flex-shrink-0" size={14} />
                      Data is only shared with lenders you approve
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-br from-[#212936] to-[#2c3c53] py-16 px-8 rounded-xl text-white shadow-2xl">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Connect Your HMRC Data?
            </h2>
            <p className="text-xl mb-8 text-slate-300">
              Strengthen your funding applications with official government verification
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="bg-gradient-to-r from-[#ff8800] to-[#ffaa00] hover:from-[#ff9900] hover:to-[#ffbb00] text-white px-8 py-3 text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                Connect HMRC Records
              </Button>
              <Button variant="outline" className="border-white text-white hover:bg-white hover:text-[#212936] px-8 py-3 text-lg transition-all duration-300">
                Check Requirements
              </Button>
            </div>
          </div>
        </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default HMRCIntegrationPage;
