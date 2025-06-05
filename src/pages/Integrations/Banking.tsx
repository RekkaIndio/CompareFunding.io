import React from "react";
import PageLayout from '@/components/PageLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Landmark, Shield, Clock, CheckCircle, ArrowRight, Users, Building2, Zap, CreditCard, TrendingUp, Eye } from 'lucide-react';

const BankingIntegrationPage: React.FC = () => {
  const benefits = [
    {
      icon: <Eye className="text-blue-600" size={24} />,
      title: "Transaction Visibility",
      description: "Give lenders real-time access to your banking transactions and cash flow patterns"
    },
    {
      icon: <Clock className="text-emerald-600" size={24} />,
      title: "Instant Verification",
      description: "Eliminate manual bank statement uploads with direct, secure bank connections"
    },
    {
      icon: <Users className="text-orange-500" size={24} />,
      title: "Better Terms",
      description: "Transparent banking data often leads to more competitive lending offers"
    }
  ];

  const supportedBanks = [
    {
      category: "Major High Street Banks",
      banks: [
        { name: "Barclays", logo: "/src/assets/lenderlogos/barclyays.png", customers: "12M+", hasLogo: true },
        { name: "HSBC", logo: "/src/assets/lenderlogos/hsbclogo.png", customers: "14M+", hasLogo: true },
        { name: "Lloyds", logo: "/src/assets/lenderlogos/lloydslogo.png", customers: "26M+", hasLogo: true },
        { name: "NatWest", logo: "/src/assets/lenderlogos/natwestlogo.png", customers: "19M+", hasLogo: true },
        { name: "Santander", logo: "/src/assets/lenderlogos/santanderlogo.png", customers: "14M+", hasLogo: true }
      ]
    },
    {
      category: "Digital Banks",
      banks: [
        { name: "Monzo", logo: "monzo-logo.png", customers: "7M+", hasLogo: false },
        { name: "Starling", logo: "starling-logo.png", customers: "3M+", hasLogo: false },
        { name: "Revolut", logo: "revolut-logo.png", customers: "18M+", hasLogo: false },
        { name: "Tide", logo: "tide-logo.png", customers: "500K+", hasLogo: false }
      ]
    },
    {
      category: "Business Banks",
      banks: [
        { name: "Metro Bank", logo: "/src/assets/lenderlogos/metro_bank_logo.png", customers: "2M+", hasLogo: true },
        { name: "Virgin Money", logo: "virgin-logo.png", customers: "6M+", hasLogo: false },
        { name: "TSB", logo: "tsb-logo.png", customers: "5M+", hasLogo: false },
        { name: "First Direct", logo: "firstdirect-logo.png", customers: "1M+", hasLogo: false }
      ]
    }
  ];

  const dataTypes = [
    {
      icon: <TrendingUp className="text-slate-700" size={20} />,
      title: "Transaction History",
      description: "12 months of detailed transaction data showing spending patterns and income sources"
    },
    {
      icon: <CreditCard className="text-slate-700" size={20} />,
      title: "Account Balances",
      description: "Real-time current and available balances across all connected accounts"
    },
    {
      icon: <Landmark className="text-slate-700" size={20} />,
      title: "Direct Debits & Standing Orders",
      description: "Regular payment commitments that affect available cash flow"
    }
  ];

  const securityFeatures = [
    "FCA regulated Open Banking",
    "256-bit bank-level encryption",
    "Read-only access permissions",
    "Instant disconnect capability",
    "No password sharing required",
    "PCI DSS compliance"
  ];

  return (
    <PageLayout fullWidth>
      <div className="py-12 px-4 w-full max-w-none mx-0 bg-white">
        {/* Hero Section */}
        <div className="mb-12 text-center max-w-4xl mx-auto">
          <div className="mb-8">
            <img 
              src="https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=800&q=80" 
              alt="Secure banking connection" 
              className="w-full max-w-2xl mx-auto rounded-lg shadow-lg"
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-6">
            Banking Integrations
          </h1>
          <p className="text-xl text-slate-600 mb-8">
            Connect your business bank accounts securely using Open Banking. 
            Give our partner lenders instant access to verify your financial position and cash flow.
          </p>
          <Button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 text-lg shadow-lg">
            Connect Your Bank Account
            <ArrowRight className="ml-2" size={20} />
          </Button>
        </div>

        {/* Benefits Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-slate-800 text-center mb-12">
            Why Connect Your Bank Account?
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

        {/* Supported Banks Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-slate-800 text-center mb-12">
            Supported UK Banks
          </h2>
          <p className="text-center text-slate-600 mb-12 max-w-3xl mx-auto">
            We support all major UK banks through secure Open Banking connections. 
            No passwords required - just authorise the connection directly with your bank.
          </p>
          
          {supportedBanks.map((category, categoryIndex) => (
            <div key={categoryIndex} className="mb-12">
              <h3 className="text-2xl font-semibold text-slate-800 text-center mb-8">
                {category.category}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 max-w-6xl mx-auto">
                {category.banks.map((bank, bankIndex) => (
                  <Card key={bankIndex} className="p-6 text-center border border-slate-200 shadow-md hover:shadow-lg transition-all duration-300 bg-white">
                    <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                      {bank.hasLogo ? (
                        <img 
                          src={bank.logo} 
                          alt={`${bank.name} logo`}
                          className="w-12 h-12 object-contain"
                        />
                      ) : (
                        <Landmark className="text-slate-600" size={24} />
                      )}
                    </div>
                    <h4 className="font-semibold text-slate-800 mb-2">
                      {bank.name}
                    </h4>
                    <p className="text-sm text-slate-500">
                      {bank.customers} customers
                    </p>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Data Shared Section */}
        <div className="mb-16 bg-slate-50 py-16 px-8 rounded-lg">
          <h2 className="text-3xl font-bold text-slate-800 text-center mb-12">
            What Data is Shared with Lenders?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
            {dataTypes.map((dataType, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                  {dataType.icon}
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-3">
                  {dataType.title}
                </h3>
                <p className="text-slate-600">
                  {dataType.description}
                </p>
              </div>
            ))}
          </div>
          
          <div className="bg-white p-8 rounded-lg shadow-md max-w-4xl mx-auto">
            <h4 className="text-xl font-semibold text-slate-800 mb-6 text-center">
              This helps lenders understand:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <ul className="space-y-3">
                  <li className="flex items-start text-slate-600">
                    <CheckCircle className="text-emerald-500 mr-3 mt-0.5 flex-shrink-0" size={16} />
                    Your monthly revenue patterns
                  </li>
                  <li className="flex items-start text-slate-600">
                    <CheckCircle className="text-emerald-500 mr-3 mt-0.5 flex-shrink-0" size={16} />
                    Seasonal business fluctuations
                  </li>
                  <li className="flex items-start text-slate-600">
                    <CheckCircle className="text-emerald-500 mr-3 mt-0.5 flex-shrink-0" size={16} />
                    Cash flow predictability
                  </li>
                </ul>
              </div>
              <div>
                <ul className="space-y-3">
                  <li className="flex items-start text-slate-600">
                    <CheckCircle className="text-emerald-500 mr-3 mt-0.5 flex-shrink-0" size={16} />
                    Regular business expenses
                  </li>
                  <li className="flex items-start text-slate-600">
                    <CheckCircle className="text-emerald-500 mr-3 mt-0.5 flex-shrink-0" size={16} />
                    Financial stability indicators
                  </li>
                  <li className="flex items-start text-slate-600">
                    <CheckCircle className="text-emerald-500 mr-3 mt-0.5 flex-shrink-0" size={16} />
                    Available repayment capacity
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Open Banking Explanation */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-slate-800 text-center mb-12">
            Powered by Open Banking
          </h2>
          <div className="max-w-4xl mx-auto">
            <Card className="p-8 border border-slate-200 shadow-lg bg-white">
              <div className="text-center mb-8">
                <div className="mb-6">
                  <img 
                    src="https://images.unsplash.com/photo-1559526324-593bc073d938?auto=format&fit=crop&w=600&q=80" 
                    alt="Open Banking secure connection" 
                    className="w-full max-w-lg mx-auto rounded-lg shadow-md"
                  />
                </div>
                <Shield className="text-blue-600 mx-auto mb-4" size={48} />
                <h3 className="text-2xl font-semibold text-slate-800 mb-4">
                  Secure, Regulated, and Trustworthy
                </h3>
                <p className="text-slate-600 mb-6">
                  Open Banking is regulated by the Financial Conduct Authority (FCA) and requires all banks 
                  to provide secure access to customer data when authorised.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-blue-600 font-bold text-lg">1</span>
                  </div>
                  <h4 className="font-semibold text-slate-800 mb-2">You Authorise</h4>
                  <p className="text-sm text-slate-600">
                    Log in to your bank and authorise the connection
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-blue-600 font-bold text-lg">2</span>
                  </div>
                  <h4 className="font-semibold text-slate-800 mb-2">We Connect</h4>
                  <p className="text-sm text-slate-600">
                    Secure API connection established with your bank
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-blue-600 font-bold text-lg">3</span>
                  </div>
                  <h4 className="font-semibold text-slate-800 mb-2">Lenders Access</h4>
                  <p className="text-sm text-slate-600">
                    Partner lenders see your financial data instantly
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Security Section */}
        <div className="mb-16 bg-slate-50 py-16 px-8 rounded-lg">
          <h2 className="text-3xl font-bold text-slate-800 text-center mb-4">
            Your Security is Our Priority
          </h2>
          <p className="text-lg text-slate-600 text-center mb-8 max-w-3xl mx-auto">
            Bank-grade security and FCA-regulated Open Banking ensure your data is always protected
          </p>
          
          {/* Security Visual */}
          <div className="mb-12 text-center">
            <img 
              src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" 
              alt="Cybersecurity and data protection visualization" 
              className="rounded-xl shadow-xl w-full max-w-4xl mx-auto h-[300px] object-cover"
            />
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-slate-800 mb-6">Security Features</h3>
                <ul className="space-y-3">
                  {securityFeatures.map((feature, index) => (
                    <li key={index} className="flex items-center text-slate-600">
                      <CheckCircle className="text-emerald-500 mr-3" size={16} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-800 mb-6">Your Rights</h3>
                <ul className="space-y-3">
                  <li className="flex items-center text-slate-600">
                    <CheckCircle className="text-emerald-500 mr-3" size={16} />
                    Disconnect at any time
                  </li>
                  <li className="flex items-center text-slate-600">
                    <CheckCircle className="text-emerald-500 mr-3" size={16} />
                    Control data sharing preferences
                  </li>
                  <li className="flex items-center text-slate-600">
                    <CheckCircle className="text-emerald-500 mr-3" size={16} />
                    Request data deletion
                  </li>
                  <li className="flex items-center text-slate-600">
                    <CheckCircle className="text-emerald-500 mr-3" size={16} />
                    View connection activity
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-slate-800 py-16 px-8 rounded-lg text-white">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Connect Your Bank Account?
          </h2>
          <p className="text-xl mb-8 text-slate-300">
            Give lenders instant access to your financial data and get faster funding decisions
          </p>
          <div className="space-x-4">
            <Button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 text-lg">
              Connect Bank Account
            </Button>
            <Button variant="outline" className="border-white text-white hover:bg-white hover:text-slate-800 px-8 py-3 text-lg">
              Learn About Open Banking
            </Button>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default BankingIntegrationPage;
