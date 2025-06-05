import React from 'react';
import PageLayout from '@/components/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, TrendingUp, Users, FileText, CheckCircle, ArrowRight } from 'lucide-react';

const BusinessInsurance = () => {
  const insuranceTypes = [
    {
      title: "Public Liability Insurance",
      description: "Protect your business against claims from third parties for injury or property damage",
      icon: <Shield className="h-8 w-8 text-blue-600" />,
      features: ["Up to £10M coverage", "Instant quotes", "24/7 claim support"]
    },
    {
      title: "Professional Indemnity",
      description: "Coverage for claims arising from professional advice or services",
      icon: <FileText className="h-8 w-8 text-green-600" />,
      features: ["Tailored coverage", "Legal expense cover", "Retroactive protection"]
    },
    {
      title: "Employers' Liability",
      description: "Mandatory coverage for businesses with employees",
      icon: <Users className="h-8 w-8 text-purple-600" />,
      features: ["Legal requirement", "Unlimited coverage", "Employee protection"]
    },
    {
      title: "Commercial Property",
      description: "Protect your business premises, stock, and equipment",
      icon: <TrendingUp className="h-8 w-8 text-orange-600" />,
      features: ["Buildings & contents", "Business interruption", "Theft protection"]
    }
  ];

  const benefits = [
    "Competitive rates from leading insurers",
    "Quick and easy online application",
    "Expert advice from insurance specialists",
    "Flexible payment options",
    "24/7 claims support",
    "Risk management resources"
  ];

  return (
    <PageLayout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <img 
                src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" 
                alt="Business Insurance Protection" 
                className="w-full h-64 object-cover rounded-xl shadow-lg"
              />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Business Insurance Solutions
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Protect your business with comprehensive insurance coverage. Get instant quotes 
              from leading insurers and secure the protection your business needs to thrive.
            </p>
          </div>

          {/* Insurance Types Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {insuranceTypes.map((insurance, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-3 text-xl mb-2">
                        {insurance.icon}
                        {insurance.title}
                      </CardTitle>
                      <CardDescription className="text-gray-600">
                        {insurance.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {insurance.features.map((feature, idx) => (
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

          {/* Benefits Section */}
          <div className="bg-white rounded-xl p-8 shadow-lg mb-12">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
              Why Choose Our Insurance Partners?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  <span className="text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* How It Works Section */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
              How It Works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-blue-600">1</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Tell Us About Your Business</h3>
                <p className="text-gray-600">
                  Complete our simple online form with details about your business and insurance needs.
                </p>
              </div>
              <div className="text-center">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-green-600">2</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Compare Quotes</h3>
                <p className="text-gray-600">
                  Receive instant quotes from multiple leading insurers and compare coverage options.
                </p>
              </div>
              <div className="text-center">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-purple-600">3</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Get Protected</h3>
                <p className="text-gray-600">
                  Choose your preferred policy and get instant cover with immediate documentation.
                </p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-center text-white">
            <h2 className="text-3xl font-bold mb-4">
              Get Your Business Insurance Quote Today
            </h2>
            <p className="text-xl mb-6 opacity-90">
              Compare quotes from leading insurers and protect your business in minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="text-blue-600">
                Get Instant Quote
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-blue-600">
                Speak to an Expert
              </Button>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default BusinessInsurance;
