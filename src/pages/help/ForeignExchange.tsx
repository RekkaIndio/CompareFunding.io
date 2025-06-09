import React from 'react';
import PageLayout from '@/components/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Globe, TrendingDown, Clock, Lock, CheckCircle, ArrowRight, PoundSterling } from 'lucide-react';

const ForeignExchange = () => {
  const services = [
    {
      title: "Spot Transactions",
      description: "Exchange currency at current market rates for immediate settlement",
      icon: <Globe className="h-8 w-8 text-blue-600" />,
      features: ["Real-time rates", "Same-day settlement", "Competitive pricing"]
    },
    {
      title: "Forward Contracts",
      description: "Lock in exchange rates for future transactions to manage currency risk",
      icon: <Lock className="h-8 w-8 text-green-600" />,
      features: ["Rate protection", "Up to 2 years", "Flexible delivery"]
    },
    {
      title: "Regular Payments",
      description: "Automated recurring international payments with preferential rates",
      icon: <Clock className="h-8 w-8 text-purple-600" />,
      features: ["Automated transfers", "Better rates", "Payment scheduling"]
    },
    {
      title: "Currency Options",
      description: "Protect against adverse currency movements while benefiting from favorable ones",
      icon: <TrendingDown className="h-8 w-8 text-orange-600" />,
      features: ["Downside protection", "Upside potential", "Flexible terms"]
    }
  ];

  const benefits = [
    "Save up to 4% vs high street banks",
    "Dedicated account manager",
    "Real-time market insights",
    "24/7 online platform access",
    "No hidden fees or charges",
    "Regulatory protection (FCA authorized)"
  ];

  const currencies = [
    { code: "USD", name: "US Dollar", flag: "🇺🇸" },
    { code: "EUR", name: "Euro", flag: "🇪🇺" },
    { code: "JPY", name: "Japanese Yen", flag: "🇯🇵" },
    { code: "AUD", name: "Australian Dollar", flag: "🇦🇺" },
    { code: "CAD", name: "Canadian Dollar", flag: "🇨🇦" },
    { code: "CHF", name: "Swiss Franc", flag: "🇨🇭" },
    { code: "CNY", name: "Chinese Yuan", flag: "🇨🇳" },
    { code: "SEK", name: "Swedish Krona", flag: "🇸🇪" }
  ];

  return (
    <PageLayout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <img 
                src="https://images.unsplash.com/photo-1559589689-577aabd1db4f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" 
                alt="Foreign Exchange Trading" 
                className="w-full h-64 object-cover rounded-xl shadow-lg"
              />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Foreign Exchange Solutions
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Optimize your international payments and currency management. Save money on 
              foreign exchange with competitive rates and expert guidance from our trusted partners.
            </p>
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {services.map((service, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-3 text-xl mb-2">
                        {service.icon}
                        {service.title}
                      </CardTitle>
                      <CardDescription className="text-gray-600">
                        {service.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {service.features.map((feature, idx) => (
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

          {/* Supported Currencies */}
          <div className="bg-white rounded-xl p-8 shadow-lg mb-12">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
              Major Currencies Supported
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {currencies.map((currency, index) => (
                <div key={index} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <span className="text-2xl">{currency.flag}</span>
                  <div>
                    <div className="font-semibold text-gray-900">{currency.code}</div>
                    <div className="text-sm text-gray-600">{currency.name}</div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-center text-gray-600 mt-6">
              And 100+ other currencies available
            </p>
          </div>

          {/* Benefits Section */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
              Why Choose Our FX Partners?
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

          {/* Savings Calculator Mock */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-8 mb-12">
            <div className="text-center mb-6">
              <PoundSterling className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Calculate Your Potential Savings
              </h2>
              <p className="text-gray-600">
                See how much you could save compared to traditional banks
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 max-w-md mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">Up to £2,400</div>
                <div className="text-gray-600">Annual savings on £100k transfers</div>
                <div className="text-sm text-gray-500 mt-2">
                  *Based on average 2.4% savings vs high street banks
                </div>
              </div>
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
                <h3 className="text-xl font-semibold mb-2">Get Your Quote</h3>
                <p className="text-gray-600">
                  Tell us about your currency needs and get a competitive quote instantly.
                </p>
              </div>
              <div className="text-center">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-green-600">2</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Secure Your Rate</h3>
                <p className="text-gray-600">
                  Lock in your rate and set up your transfer with our secure platform.
                </p>
              </div>
              <div className="text-center">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-purple-600">3</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Send & Track</h3>
                <p className="text-gray-600">
                  Send your funds and track the transfer in real-time until completion.
                </p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-xl p-8 text-center text-white">
            <h2 className="text-3xl font-bold mb-4">
              Start Saving on Foreign Exchange Today
            </h2>
            <p className="text-xl mb-6 opacity-90">
              Get competitive rates and expert support for all your currency needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="text-blue-600">
                Get Quote Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-blue-600">
                Speak to FX Expert
              </Button>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default ForeignExchange;
