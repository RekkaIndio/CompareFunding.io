import React from "react";
import PageLayout from '@/components/PageLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Truck, Building, Wrench, CheckCircle, ArrowRight, Shield, Users, Building2, Target, Zap } from 'lucide-react';

const AssetFinancePage: React.FC = () => {
  const benefits = [
    {
      icon: <Target className="text-blue-600" size={24} />,
      title: "Specialist Matching",
      description: "We connect you with lenders who specialize in your specific asset type and industry"
    },
    {
      icon: <Shield className="text-emerald-600" size={24} />,
      title: "Competitive Terms",
      description: "Access to a network of vetted lenders offering competitive rates and flexible terms"
    },
    {
      icon: <Users className="text-orange-500" size={24} />,
      title: "Expert Guidance",
      description: "Get connected with lenders who understand your business needs and asset requirements"
    }
  ];

  const assetTypes = [
    {
      title: "Vehicle Finance Specialists",
      description: "Lenders specialising in commercial vehicles, fleets, and transportation assets",
      icon: <Truck className="text-blue-600" size={32} />,
      features: ["Commercial vehicle specialists", "Fleet financing experts", "Flexible deposit options", "Competitive rates"],
      highlight: "Perfect for transport businesses",
      badge: "Popular"
    },
    {
      title: "Equipment Finance Lenders",
      description: "Specialised lenders for machinery, technology, and industrial equipment financing",
      icon: <Wrench className="text-emerald-600" size={32} />,
      features: ["Industry-specific expertise", "Technology financing", "Flexible terms", "Quick decisions"],
      highlight: "Ideal for manufacturing & tech",
      badge: "Specialist"
    },
    {
      title: "Property Finance Partners",
      description: "Commercial property lenders and development finance specialists in our network",
      icon: <Building className="text-orange-500" size={32} />,
      features: ["Commercial mortgages", "Development finance", "Bridging loans", "Investment property"],
      highlight: "Best for property investors",
      badge: "Premium"
    }
  ];

  const financeOptions = [
    {
      title: "Hire Purchase Lenders",
      description: "Connect with lenders offering hire purchase agreements for asset ownership",
      pros: ["Own the asset at term end", "Fixed payment schedules", "Capital allowances", "Predictable budgeting"],
      best: "Best for: Essential equipment you want to own"
    },
    {
      title: "Finance Lease Providers",
      description: "Access lenders offering finance leases with flexible end-of-term options",
      pros: ["Lower monthly payments", "Upgrade flexibility", "Maintenance packages", "Tax efficiency"],
      best: "Best for: Equipment that may need upgrading"
    },
    {
      title: "Operating Lease Specialists",
      description: "Connect with providers offering all-inclusive lease packages",
      pros: ["All costs included", "No ownership risks", "Easy upgrades", "Maintenance included"],
      best: "Best for: Non-core equipment with high maintenance"
    }
  ];

  const steps = [
    { step: "1", title: "Define Your Needs", description: "Tell us about the assets you need to finance and your business requirements" },
    { step: "2", title: "Submit Details", description: "Provide asset specifications and your preferred financing structure" },
    { step: "3", title: "Get Matched", description: "Receive connections to specialist lenders in our network" },
    { step: "4", title: "Compare Options", description: "Review different lenders and their terms side by side" },
    { step: "5", title: "Arrange Finance", description: "Work directly with your chosen lender to finalize the agreement" }
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
                Connect with Asset Finance Specialists
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6">
                Asset Finance <span className="text-orange-500">Connections</span>
              </h1>
              <p className="text-xl text-slate-600 mb-8 leading-relaxed">
                We connect businesses with specialist asset finance lenders for vehicles, equipment, and property. 
                Find the right financing partner for your business assets through our curated network.
              </p>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all">
                Connect with Lenders
                <ArrowRight className="ml-2" size={20} />
              </Button>
            </div>
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1581094794329-c8112a89af12?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                alt="Modern commercial vehicles, machinery and business equipment" 
                className="rounded-xl shadow-2xl w-full h-[400px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 to-orange-500/20 rounded-xl"></div>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            Why Use Our Asset Finance Network?
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

        {/* Asset Types Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-4">
            Specialist Asset Finance Lenders
          </h2>
          <p className="text-lg text-slate-600 text-center mb-8 max-w-3xl mx-auto">
            Our network includes specialist lenders for every type of business asset, from vehicles to equipment to property.
          </p>
          
          {/* Asset Finance Visual */}
          <div className="mb-12 text-center">
            <img 
              src="https://images.unsplash.com/photo-1586953208448-b95a79798f07?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" 
              alt="Various business assets including vehicles, equipment, and commercial property" 
              className="rounded-xl shadow-xl w-full max-w-4xl mx-auto h-[300px] object-cover"
            />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {assetTypes.map((type, index) => (
              <Card key={index} className="p-8 bg-white border border-slate-200 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 relative">
                <div className="absolute top-4 right-4">
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    type.badge === 'Popular' ? 'bg-orange-100 text-orange-700' :
                    type.badge === 'Specialist' ? 'bg-emerald-100 text-emerald-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {type.badge}
                  </span>
                </div>
                <div className="flex justify-center mb-4">
                  {type.icon}
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4 text-center">
                  {type.title}
                </h3>
                <p className="text-slate-600 mb-6 text-center">
                  {type.description}
                </p>
                <div className="mb-6">
                  <div className={`p-3 rounded-lg mb-4 ${
                    type.badge === 'Popular' ? 'bg-orange-50' :
                    type.badge === 'Specialist' ? 'bg-emerald-50' :
                    'bg-blue-50'
                  }`}>
                    <p className={`font-semibold text-sm text-center ${
                      type.badge === 'Popular' ? 'text-orange-700' :
                      type.badge === 'Specialist' ? 'text-emerald-700' :
                      'text-blue-700'
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

        {/* Finance Options Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-4">
            Types of Asset Finance Available
          </h2>
          <p className="text-lg text-slate-600 text-center mb-12 max-w-3xl mx-auto">
            Different financing structures for different business needs. Our lenders offer flexible options.
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {financeOptions.map((option, index) => (
              <Card key={index} className="p-8 bg-white border border-slate-200 shadow-sm hover:shadow-lg transition-shadow">
                <h3 className="text-2xl font-bold text-slate-900 mb-4">
                  {option.title}
                </h3>
                <p className="text-slate-600 mb-6">
                  {option.description}
                </p>
                <div className="mb-6">
                  <ul className="space-y-2 mb-4">
                    {option.pros.map((pro, proIndex) => (
                      <li key={proIndex} className="flex items-start">
                        <CheckCircle className="text-emerald-500 mr-2 mt-0.5 flex-shrink-0" size={16} />
                        <span className="text-sm text-slate-600">{pro}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-slate-700">
                      {option.best}
                    </p>
                  </div>
                </div>
                <Button className="w-full bg-slate-900 text-white hover:bg-slate-800 transition-colors">
                  Find Lenders
                </Button>
              </Card>
            ))}
          </div>
        </div>

        {/* How It Works Section */}
        <div className="mb-16 bg-slate-50 py-16 px-8 rounded-xl">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-4">
            How Our Asset Finance Connection Works
          </h2>
          <p className="text-lg text-slate-600 text-center mb-12 max-w-3xl mx-auto">
            Simple and transparent process to connect you with the right asset finance lenders.
          </p>
          
          {/* Process Visual */}
          <div className="mb-12 text-center">
            <img 
              src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" 
              alt="Professional business team discussing asset financing and equipment" 
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

        {/* CTA Section */}
        <div className="text-center bg-slate-900 py-16 px-8 rounded-xl text-white">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Finance Your Next Asset?
          </h2>
          <p className="text-xl mb-8 text-slate-300">
            Get connected with specialist asset finance lenders who understand your needs
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

export default AssetFinancePage;
