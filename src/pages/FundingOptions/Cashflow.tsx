import React from "react";
import PageLayout from '@/components/PageLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, Clock, Link2, CheckCircle, ArrowRight, Users, Building2, Zap } from 'lucide-react';

const CashflowPage: React.FC = () => {
  const benefits = [
    {
      icon: <Link2 className="text-blue-600" size={24} />,
      title: "Direct Connections",
      description: "We connect you directly with specialist invoice finance lenders - no middleman markups"
    },
    {
      icon: <Clock className="text-emerald-600" size={24} />,
      title: "Pre-Vetted Network",
      description: "All lenders in our network are thoroughly vetted for credibility and competitive terms"
    },
    {
      icon: <Users className="text-orange-500" size={24} />,
      title: "Expert Matching",
      description: "Our platform matches you with lenders who specialise in your industry and business size"
    }
  ];

  const lenderTypes = [
    {
      title: "Invoice Finance Specialists",
      description: "Dedicated invoice financing companies with deep market expertise and competitive terms",
      features: ["Up to 90% of invoice value", "Same day funding available", "Industry expertise", "Flexible recourse options"],
      highlight: "Best for regular invoice flow",
      badge: "Most Popular"
    },
    {
      title: "Asset-Based Lenders",
      description: "Lenders who understand invoice portfolios as valuable business assets for larger facilities",
      features: ["Higher funding limits", "Portfolio approach", "Growth financing", "Relationship banking"],
      highlight: "Ideal for larger facilities",
      badge: "Enterprise"
    },
    {
      title: "Fintech Platforms",
      description: "Technology-driven lenders offering streamlined digital processes and rapid decisions",
      features: ["Digital-first process", "AI-powered decisions", "Real-time tracking", "Mobile management"],
      highlight: "Perfect for tech-savvy businesses",
      badge: "Innovation"
    }
  ];

  const steps = [
    { step: "1", title: "Share Your Needs", description: "Tell us about your business and cashflow requirements" },
    { step: "2", title: "Upload Documents", description: "Provide recent invoices and basic trading information" },
    { step: "3", title: "Get Matched", description: "Receive curated matches from our specialist lender network" },
    { step: "4", title: "Compare & Connect", description: "Review terms and connect directly with your preferred lenders" },
    { step: "5", title: "Arrange Funding", description: "Complete your funding arrangement independently with your chosen lender" }
  ];

  return (
    <PageLayout fullWidth>
      <div className="py-12 px-4 w-full max-w-none mx-0">
        {/* Hero Section */}
        <div className="mb-16 text-center max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-left lg:text-left">
              <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Building2 size={16} />
                Connect with Cashflow Finance Specialists
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6">
                Cashflow Finance <span className="text-orange-500">Connections</span>
              </h1>
              <p className="text-xl text-slate-600 mb-8 leading-relaxed">
                We connect growing businesses with specialist invoice finance and factoring lenders. 
                Access the working capital locked in your unpaid invoices through our curated network of pre-vetted lenders.
              </p>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all">
                Connect with Lenders
                <ArrowRight className="ml-2" size={20} />
              </Button>
            </div>
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                alt="Business professionals reviewing financial documents and invoices" 
                className="rounded-xl shadow-2xl w-full h-[400px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 to-orange-500/20 rounded-xl"></div>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            Why Use Our Connection Platform?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {benefits.map((benefit, index) => (
              <Card key={index} className="p-8 text-center bg-white border border-slate-200 shadow-sm hover:shadow-lg transition-shadow">
                <div className="flex justify-center mb-4">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">
                  {benefit.title}
                </h3>
                <p className="text-slate-600">
                  {benefit.description}
                </p>
              </Card>
            ))}
          </div>
        </div>

        {/* Lender Types Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-4">
            Types of Cashflow Lenders in Our Network
          </h2>
          <p className="text-lg text-slate-600 text-center mb-8 max-w-3xl mx-auto">
            We work with a diverse range of specialist lenders, each offering unique advantages for different business needs.
          </p>
          
          {/* Lender Network Visual */}
          <div className="mb-12 text-center">
            <img 
              src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" 
              alt="Business professionals in financial sector and lending industry" 
              className="rounded-xl shadow-xl w-full max-w-4xl mx-auto h-[300px] object-cover"
            />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {lenderTypes.map((type, index) => (
              <Card key={index} className="p-8 bg-white border border-slate-200 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 relative">
                <div className="absolute top-4 right-4">
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    type.badge === 'Most Popular' ? 'bg-orange-100 text-orange-700' :
                    type.badge === 'Enterprise' ? 'bg-blue-100 text-blue-700' :
                    'bg-emerald-100 text-emerald-700'
                  }`}>
                    {type.badge}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">
                  {type.title}
                </h3>
                <p className="text-slate-600 mb-6">
                  {type.description}
                </p>
                <div className="mb-6">
                  <div className={`p-3 rounded-lg mb-4 ${
                    type.badge === 'Most Popular' ? 'bg-orange-50' :
                    type.badge === 'Enterprise' ? 'bg-blue-50' :
                    'bg-emerald-50'
                  }`}>
                    <p className={`font-semibold text-sm ${
                      type.badge === 'Most Popular' ? 'text-orange-700' :
                      type.badge === 'Enterprise' ? 'text-blue-700' :
                      'text-emerald-700'
                    }`}>
                      {type.highlight}
                    </p>
                  </div>
                  <ul className="space-y-2">
                    {type.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        <CheckCircle className="text-emerald-500 mr-2 mt-0.5 flex-shrink-0" size={16} />
                        <span className="text-sm text-slate-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Button className="w-full bg-slate-900 text-white hover:bg-slate-800 transition-colors">
                  View Lenders
                </Button>
              </Card>
            ))}
          </div>
        </div>

        {/* How It Works Section */}
        <div className="mb-16 bg-slate-50 py-16 px-8 rounded-xl">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-4">
            How Our Connection Process Works
          </h2>
          <p className="text-lg text-slate-600 text-center mb-12 max-w-3xl mx-auto">
            Getting connected with the right lender is simple and transparent. We guide you through each step.
          </p>
          
          {/* Process Visual */}
          <div className="mb-12 text-center">
            <img 
              src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" 
              alt="Professional business process flow and consultation" 
              className="rounded-xl shadow-xl w-full max-w-4xl mx-auto h-[300px] object-cover"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 max-w-7xl mx-auto">
            {steps.map((step, index) => (
              <div key={index} className="text-center relative">
                <div className="w-16 h-16 bg-orange-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-lg">
                  {step.step}
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-slate-600 text-sm">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Trust & Transparency Section */}
        <div className="mb-16">
          <div className="bg-white border border-slate-200 rounded-xl p-8 max-w-4xl mx-auto text-center">
            <Zap className="text-orange-500 mx-auto mb-4" size={48} />
            <h3 className="text-2xl font-bold text-slate-900 mb-4">
              Transparent. Independent. Effective.
            </h3>
            <p className="text-slate-600 mb-6">
              We don't take commissions from lenders, so you get unbiased connections. 
              Our platform is designed to help you find the best fit for your specific needs.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-orange-500 mb-1">100+</div>
                <div className="text-sm text-slate-600">Vetted Lenders</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600 mb-1">24hrs</div>
                <div className="text-sm text-slate-600">Average Connection Time</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-600 mb-1">95%</div>
                <div className="text-sm text-slate-600">Success Rate</div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-slate-900 py-16 px-8 rounded-xl text-white">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Connect with Cashflow Lenders?
          </h2>
          <p className="text-xl mb-8 text-slate-300">
            Get matched with specialist lenders who understand your business needs
          </p>
          <div className="space-x-4">
            <Button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 text-lg font-semibold shadow-lg">
              Start Connection Process
            </Button>
            <Button variant="outline" className="border-white text-white hover:bg-white hover:text-slate-900 px-8 py-4 text-lg font-medium">
              Learn More
            </Button>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default CashflowPage;
