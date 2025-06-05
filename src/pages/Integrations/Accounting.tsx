import React from "react";
import PageLayout from '@/components/PageLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calculator, PieChart, BarChart3, CheckCircle, ArrowRight, Users, Building2, Zap, FileSpreadsheet, TrendingUp } from 'lucide-react';

const AccountingIntegrationPage: React.FC = () => {
  const benefits = [
    {
      icon: <FileSpreadsheet className="text-blue-600" size={24} />,
      title: "Real-Time Data",
      description: "Connect your accounting software to provide lenders with up-to-date financial information"
    },
    {
      icon: <Zap className="text-emerald-600" size={24} />,
      title: "Faster Decisions",
      description: "Automated data sharing means lenders can make faster, more informed lending decisions"
    },
    {
      icon: <Users className="text-orange-500" size={24} />,
      title: "Enhanced Trust",
      description: "Direct data access builds lender confidence and often leads to better terms"
    }
  ];

  const supportedPlatforms = [
    {
      title: "Xero",
      description: "The UK's most popular cloud accounting platform for small and medium businesses",
      features: ["Real-time P&L access", "Cash flow visibility", "Invoice aging reports", "Bank reconciliation data"],
      logo: "/src/assets/accountinglogos/xero.png",
      connectionTime: "2 minutes",
      popularity: "Most Popular"
    },
    {
      title: "QuickBooks",
      description: "Comprehensive accounting solution trusted by millions of businesses worldwide",
      features: ["Detailed financial reports", "Transaction history", "Tax preparation data", "Multi-currency support"],
      logo: "/src/assets/accountinglogos/quickbooks.png",
      connectionTime: "3 minutes",
      popularity: "Enterprise Choice"
    },
    {
      title: "Sage",
      description: "Established accounting software with strong presence in UK business community",
      features: ["Advanced reporting", "Industry-specific modules", "Compliance tracking", "Multi-company support"],
      logo: "/src/assets/accountinglogos/sage.png",
      connectionTime: "5 minutes",
      popularity: "Traditional Favorite"
    },
    {
      title: "FreeAgent",
      description: "Cloud-based accounting designed specifically for freelancers and small businesses",
      features: ["Time tracking integration", "Project profitability", "Tax timeline", "Expense management"],
      logo: "/src/assets/accountinglogos/freeagent.png",
      connectionTime: "2 minutes",
      popularity: "Freelancer Choice"
    }
  ];

  const lenderBenefits = [
    {
      icon: <BarChart3 className="text-slate-700" size={20} />,
      title: "Comprehensive View",
      description: "Lenders get a complete picture of your financial health"
    },
    {
      icon: <TrendingUp className="text-slate-700" size={20} />,
      title: "Performance Trends",
      description: "Historical data shows business growth and stability patterns"
    },
    {
      icon: <Calculator className="text-slate-700" size={20} />,
      title: "Accurate Assessment",
      description: "Real data eliminates guesswork in lending decisions"
    }
  ];

  return (
    <PageLayout fullWidth>
      <div className="py-12 px-4 w-full max-w-none mx-0 bg-white">
        {/* Hero Section */}
        <div className="mb-12 text-center max-w-4xl mx-auto">
          <div className="mb-8">
            <img 
              src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=800&q=80" 
              alt="Financial data integration" 
              className="w-full max-w-2xl mx-auto rounded-lg shadow-lg"
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-6">
            Accounting Integrations
          </h1>
          <p className="text-xl text-slate-600 mb-8">
            Connect your accounting software to give lenders direct access to your financial data. 
            Streamline applications and get faster decisions with automated data sharing.
          </p>
          <Button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 text-lg shadow-lg">
            Connect Your Accounting Software
            <ArrowRight className="ml-2" size={20} />
          </Button>
        </div>

        {/* Benefits Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-slate-800 text-center mb-12">
            Why Connect Your Accounting Software?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {benefits.map((benefit, index) => (
              <Card key={index} className="p-8 text-center border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
                <div className="flex justify-center mb-4">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-3">
                  {benefit.title}
                </h3>
                <p className="text-slate-600">
                  {benefit.description}
                </p>
              </Card>
            ))}
          </div>
        </div>

        {/* Supported Platforms Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-slate-800 text-center mb-12">
            Supported Accounting Platforms
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
            {supportedPlatforms.map((platform, index) => (
              <Card key={index} className="p-8 border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 bg-white relative">
                {platform.popularity && (
                  <div className="absolute top-4 right-4 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                    {platform.popularity}
                  </div>
                )}
                <div className="flex items-start mb-6">
                  <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center mr-4 border border-slate-200">
                    <img 
                      src={platform.logo} 
                      alt={`${platform.title} logo`}
                      className="w-12 h-12 object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">
                      {platform.title}
                    </h3>
                    <p className="text-slate-600">
                      {platform.description}
                    </p>
                  </div>
                </div>
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-slate-700">Connection Time:</span>
                    <span className="text-sm font-bold text-orange-500">{platform.connectionTime}</span>
                  </div>
                  <ul className="space-y-2">
                    {platform.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        <CheckCircle className="text-emerald-500 mr-2 mt-0.5 flex-shrink-0" size={16} />
                        <span className="text-sm text-slate-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Button className="w-full bg-slate-800 hover:bg-slate-900 text-white transition-colors">
                  Connect {platform.title}
                </Button>
              </Card>
            ))}
          </div>
        </div>

        {/* What Lenders See Section */}
        <div className="mb-16 bg-slate-50 py-16 px-8 rounded-lg">
          <h2 className="text-3xl font-bold text-slate-800 text-center mb-4">
            What Our Partner Lenders See
          </h2>
          <p className="text-lg text-slate-600 text-center mb-8 max-w-3xl mx-auto">
            Transparent financial data helps lenders make informed decisions faster
          </p>
          
          {/* Lender Benefits Visual */}
          <div className="mb-12 text-center">
            <img 
              src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" 
              alt="Financial data analytics and reporting dashboard" 
              className="rounded-xl shadow-xl w-full max-w-4xl mx-auto h-[300px] object-cover"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
            {lenderBenefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">
                  {benefit.title}
                </h3>
                <p className="text-slate-600">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
          <div className="bg-white p-8 rounded-lg shadow-md max-w-4xl mx-auto">
            <h4 className="text-xl font-semibold text-slate-800 mb-4">Key Financial Metrics Shared:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ul className="space-y-2">
                <li className="flex items-center text-slate-600">
                  <CheckCircle className="text-emerald-500 mr-2" size={16} />
                  Monthly revenue trends
                </li>
                <li className="flex items-center text-slate-600">
                  <CheckCircle className="text-emerald-500 mr-2" size={16} />
                  Profit & loss statements
                </li>
                <li className="flex items-center text-slate-600">
                  <CheckCircle className="text-emerald-500 mr-2" size={16} />
                  Cash flow patterns
                </li>
              </ul>
              <ul className="space-y-2">
                <li className="flex items-center text-slate-600">
                  <CheckCircle className="text-emerald-500 mr-2" size={16} />
                  Outstanding invoices
                </li>
                <li className="flex items-center text-slate-600">
                  <CheckCircle className="text-emerald-500 mr-2" size={16} />
                  Business expenses
                </li>
                <li className="flex items-center text-slate-600">
                  <CheckCircle className="text-emerald-500 mr-2" size={16} />
                  Account balances
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-slate-800 text-center mb-12">
            Your Data is Secure
          </h2>
          <div className="max-w-4xl mx-auto">
            <Card className="p-8 border border-slate-200 shadow-lg bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold text-slate-800 mb-4">Bank-Level Security</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center text-slate-600">
                      <CheckCircle className="text-emerald-500 mr-2" size={16} />
                      256-bit SSL encryption
                    </li>
                    <li className="flex items-center text-slate-600">
                      <CheckCircle className="text-emerald-500 mr-2" size={16} />
                      Read-only access only
                    </li>
                    <li className="flex items-center text-slate-600">
                      <CheckCircle className="text-emerald-500 mr-2" size={16} />
                      FCA regulated partners
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-800 mb-4">Your Control</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center text-slate-600">
                      <CheckCircle className="text-emerald-500 mr-2" size={16} />
                      Disconnect anytime
                    </li>
                    <li className="flex items-center text-slate-600">
                      <CheckCircle className="text-emerald-500 mr-2" size={16} />
                      Choose what to share
                    </li>
                    <li className="flex items-center text-slate-600">
                      <CheckCircle className="text-emerald-500 mr-2" size={16} />
                      Data deletion on request
                    </li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-slate-800 py-16 px-8 rounded-lg text-white">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Connect Your Accounting Software?
          </h2>
          <p className="text-xl mb-8 text-slate-300">
            Get faster funding decisions by connecting your financial data
          </p>
          <div className="space-x-4">
            <Button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 text-lg">
              Start Integration
            </Button>
            <Button variant="outline" className="border-white text-white hover:bg-white hover:text-slate-800 px-8 py-3 text-lg">
              View Supported Platforms
            </Button>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default AccountingIntegrationPage;
