import React from 'react';
import PageLayout from '@/components/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, Users, FileText, Target, CheckCircle, ArrowRight, Lightbulb, BarChart } from 'lucide-react';

const RaisingEquity = () => {
  const equityTypes = [
    {
      title: "Angel Investment",
      description: "Connect with high-net-worth individuals looking to invest in early-stage businesses",
      icon: <Users className="h-8 w-8 text-blue-600" />,
      features: ["£10k - £250k typically", "Mentorship & expertise", "Quick decision process"],
      stage: "Seed/Early Stage"
    },
    {
      title: "Venture Capital",
      description: "Professional investment funds for high-growth potential businesses",
      icon: <TrendingUp className="h-8 w-8 text-green-600" />,
      features: ["£250k - £10M+", "Due diligence support", "Follow-on funding"],
      stage: "Series A/B/C"
    },
    {
      title: "Crowdfunding",
      description: "Raise capital from a large number of individual investors online",
      icon: <Target className="h-8 w-8 text-purple-600" />,
      features: ["Public fundraising", "Marketing exposure", "Customer validation"],
      stage: "Any Stage"
    },
    {
      title: "Private Equity",
      description: "Established businesses looking for growth capital or management buyouts",
      icon: <BarChart className="h-8 w-8 text-orange-600" />,
      features: ["£1M+ investments", "Operational expertise", "Exit strategy focus"],
      stage: "Growth/Mature"
    }
  ];

  const process = [
    {
      step: 1,
      title: "Business Assessment",
      description: "We evaluate your business model, financials, and growth potential"
    },
    {
      step: 2,
      title: "Investment Readiness",
      description: "Prepare your pitch deck, financial projections, and due diligence materials"
    },
    {
      step: 3,
      title: "Investor Matching",
      description: "Connect with pre-screened investors aligned with your sector and stage"
    },
    {
      step: 4,
      title: "Pitch & Negotiate",
      description: "Present to investors and negotiate terms with professional support"
    },
    {
      step: 5,
      title: "Close & Onboard",
      description: "Complete legal documentation and onboard your new investment partners"
    }
  ];

  const benefits = [
    "Access to pre-screened investor network",
    "Professional pitch deck development",
    "Valuation guidance and support",
    "Legal documentation assistance",
    "Ongoing investor relations support",
    "Success-based fee structure"
  ];

  const sectors = [
    "Technology & Software",
    "Healthcare & Life Sciences",
    "FinTech & Financial Services",
    "E-commerce & Retail",
    "Manufacturing & Industrial",
    "Food & Beverage",
    "Professional Services",
    "Clean Energy & Sustainability"
  ];

  return (
    <PageLayout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <img 
                src="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" 
                alt="Raising Equity Investment" 
                className="w-full h-64 object-cover rounded-xl shadow-lg"
              />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Raising Equity Capital
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Fuel your business growth with equity investment. Connect with angel investors, 
              VCs, and institutional funds through our experienced investment advisory partners.
            </p>
          </div>

          {/* Equity Types Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {equityTypes.map((equity, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-3 text-xl mb-2">
                        {equity.icon}
                        {equity.title}
                      </CardTitle>
                      <CardDescription className="text-gray-600 mb-2">
                        {equity.description}
                      </CardDescription>
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        {equity.stage}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {equity.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Investment Process */}
          <div className="bg-white rounded-xl p-8 shadow-lg mb-12">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
              Our Investment Process
            </h2>
            <div className="space-y-8">
              {process.map((item, index) => (
                <div key={index} className="flex items-start gap-6">
                  <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-bold text-blue-600">{item.step}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-gray-600">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sectors We Cover */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
              Sectors We Cover
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {sectors.map((sector, index) => (
                <div key={index} className="bg-white p-4 rounded-lg shadow-md text-center hover:shadow-lg transition-shadow">
                  <Lightbulb className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                  <span className="text-sm font-medium text-gray-700">{sector}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Benefits Section */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-8 mb-12">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
              Why Work With Our Partners?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Investment Readiness Checklist */}
          <div className="bg-white rounded-xl p-8 shadow-lg mb-12">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
              Are You Investment Ready?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <FileText className="h-6 w-6 text-blue-600" />
                  Business Documentation
                </h3>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Compelling pitch deck (10-15 slides)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">3-year financial projections</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Market research & competitive analysis</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Management team profiles</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Target className="h-6 w-6 text-purple-600" />
                  Business Fundamentals
                </h3>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Clear value proposition & business model</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Proven market traction or pilot customers</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Scalable growth strategy</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Clear use of investment funds</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-8 text-center text-white">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Raise Equity for Your Business?
            </h2>
            <p className="text-xl mb-6 opacity-90">
              Connect with our investment advisory partners and access their network of investors.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="text-purple-600">
                Start Your Journey
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-purple-600">
                Book Consultation
              </Button>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default RaisingEquity;
