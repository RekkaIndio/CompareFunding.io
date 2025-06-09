import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageLayout from '@/components/PageLayout';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2, Clock, TrendingUp, Shield, PoundSterling, Users, BarChart3, Zap, Globe, Target } from 'lucide-react';

const ForBusinesses = () => {
  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <PageLayout>
      {/* Hero Section */}
      <section className="relative py-12 sm:py-16 md:py-20 overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-32 sm:w-64 h-32 sm:h-64 bg-orange-500 rounded-full -translate-y-1/2 translate-x-1/2 opacity-10"></div>
        <div className="absolute bottom-0 left-0 w-24 sm:w-48 h-24 sm:h-48 bg-gray-900 rounded-full translate-y-1/2 -translate-x-1/2 opacity-10"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-gray-900 leading-tight">
              Get The Funding Your Business Deserves
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              One application, multiple funding offers. Compare terms from verified lenders 
              and access the capital you need to grow your business - completely free.
            </p>
            
            {/* Feature highlights */}
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-8 text-sm sm:text-base">
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                  <CheckCircle2 className="w-3 h-3 text-white" />
                </div>
                <span className="text-gray-700">No upfront fees</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                  <CheckCircle2 className="w-3 h-3 text-white" />
                </div>
                <span className="text-gray-700">Offers in 24 hours</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                  <CheckCircle2 className="w-3 h-3 text-white" />
                </div>
                <span className="text-gray-700">Multiple lender options</span>
              </div>
            </div>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg" 
                className="bg-gray-900 hover:bg-[#ff8000] text-white px-8 py-3 text-base sm:text-lg w-full sm:w-auto transition-colors duration-300"
                asChild
              >
                <Link to="/signup-journey/email-password">
                  Apply Now - It's Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-[#ff8000] text-[#ff8000] hover:bg-[#ff8000] hover:text-white px-8 py-3 text-base sm:text-lg w-full sm:w-auto transition-colors duration-300"
                asChild
              >
                <Link to="/contact">
                  Book Free Consultation
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-12 sm:py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-gray-900">
              Why Businesses Choose CompareFunding
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We've reimagined business funding to be faster, fairer, and more transparent
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <Clock className="h-8 w-8" />,
                title: 'Fast Decisions',
                description: 'Get funding offers from multiple lenders in as little as 24 hours, not weeks'
              },
              {
                icon: <PoundSterling className="h-8 w-8" />,
                title: 'No Hidden Fees',
                description: 'Completely free for businesses. No broker fees, no commission charges'
              },
              {
                icon: <BarChart3 className="h-8 w-8" />,
                title: 'Compare Options',
                description: 'Side-by-side comparison of terms, rates, and conditions from verified lenders'
              },
              {
                icon: <Shield className="h-8 w-8" />,
                title: 'Secure & Trusted',
                description: 'Bank-level security with FCA regulated lenders and transparent processes'
              }
            ].map((feature, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-orange-500 rounded-full flex items-center justify-center text-white">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold mb-3 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-12 sm:py-16 md:py-20 relative overflow-hidden">
        {/* Background decorative element */}
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 z-0 hidden sm:block">
          <div className="relative flex items-center">
            <div className="w-20 h-20 bg-orange-500 rounded-full z-10"></div>
            <div className="w-32 h-16 bg-gray-900 rounded-r-full -ml-12 z-0"></div>
          </div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-gray-900">
              Get Funded in 3 Simple Steps
            </h2>
            <p className="text-lg text-gray-600">
              We've streamlined the funding process to get you the capital you need, faster
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
            {[
              {
                step: 1,
                title: 'Tell us about your business',
                description: 'Complete our simple application with your business details and funding requirements',
                image: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=300&fit=crop&auto=format&q=80'
              },
              {
                step: 2,
                title: 'Connect your accounting data',
                description: 'Securely link your accounting software to verify your financials automatically',
                image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop&auto=format&q=80'
              },
              {
                step: 3,
                title: 'Compare and choose offers',
                description: 'Review funding offers from multiple lenders and select the best terms for your business',
                image: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=400&h=300&fit=crop&auto=format&q=80'
              }
            ].map((step, index) => (
              <div key={index} className="bg-white rounded-xl overflow-hidden shadow-lg border border-gray-100">
                <div className="h-48">
                  <img 
                    src={step.image} 
                    alt={step.title} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <div className="text-orange-500 font-semibold text-sm mb-3">
                    Step {step.step}
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-900">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center">
            <Button 
              size="lg" 
              className="bg-gray-900 hover:bg-[#ff8000] text-white px-8 py-3 transition-colors duration-300"
              asChild
            >
              <Link to="/signup-journey/email-password">
                Start Your Application
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Funding Options Section */}
      <section className="py-12 sm:py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-gray-900">
              Funding Options Available
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Whatever your business needs, we connect you with the right type of funding
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Cashflow Finance',
                description: 'Unlock cash tied up in unpaid invoices to improve working capital flow',
                icon: <TrendingUp className="h-6 w-6" />,
                features: ['Up to 90% of invoice value', '24-48 hour decisions', 'Flexible terms'],
                highlighted: true
              },
              {
                title: 'Asset Finance',
                description: 'Spread the cost of essential equipment and machinery over time',
                icon: <Target className="h-6 w-6" />,
                features: ['Preserve working capital', 'Tax efficient options', 'Up to 100% financing']
              },
              {
                title: 'Property Finance',
                description: 'Competitive rates for commercial property purchase or refinancing',
                icon: <Globe className="h-6 w-6" />,
                features: ['High loan-to-value ratios', 'Fixed and variable rates', 'Fast completions']
              },
              {
                title: 'Growth Finance',
                description: 'Flexible capital for scaling operations and expanding your business',
                icon: <Zap className="h-6 w-6" />,
                features: ['Unsecured options available', 'Terms up to 5 years', 'Quick decisions']
              },
              {
                title: 'Trade Finance',
                description: 'Support for import/export operations and supply chain financing',
                icon: <Users className="h-6 w-6" />,
                features: ['Letters of credit', 'Invoice discounting', 'Supply chain solutions']
              },
              {
                title: 'Business Loans',
                description: 'Traditional term loans for established businesses with proven track records',
                icon: <BarChart3 className="h-6 w-6" />,
                features: ['Competitive rates', 'Flexible repayment terms', 'Various loan sizes']
              }
            ].map((option, index) => (
              <div 
                key={index} 
                className={`bg-white p-6 rounded-xl shadow-sm border transition-all duration-300 hover:shadow-md ${
                  option.highlighted ? 'border-orange-500 ring-2 ring-orange-500/20' : 'border-gray-100'
                }`}
              >
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${
                  option.highlighted ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  {option.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">{option.title}</h3>
                <p className="text-gray-600 mb-4">{option.description}</p>
                <ul className="space-y-2">
                  {option.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories / Stats Section */}
      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-gray-900">
              Trusted by Growing Businesses
            </h2>
            <p className="text-lg text-gray-600">
              Join thousands of businesses that have successfully secured funding through our platform
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {[
              { number: '£500M+', label: 'Funding Facilitated' },
              { number: '10,000+', label: 'Applications Processed' },
              { number: '24hrs', label: 'Average Decision Time' },
              { number: '95%', label: 'Customer Satisfaction' }
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#ff8000] mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 text-sm sm:text-base">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-12 my-8 bg-[#ff8000] rounded-2xl text-white text-center relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-1/2 translate-x-1/2 opacity-20"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-1/2 -translate-x-1/2 opacity-10"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6">
              Ready to Secure Your Business Funding?
            </h2>
            <p className="text-lg sm:text-xl text-white/90 mb-8">
              Join thousands of businesses that have found their perfect funding match. 
              Start your free application today and get offers within 24 hours.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg" 
                className="bg-white text-[#ff8000] hover:bg-gray-100 px-8 py-3 text-lg w-full sm:w-auto font-semibold transition-colors duration-300"
                asChild
              >
                <Link to="/signup-journey/email-password">
                  Start Your Application
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-white text-white hover:bg-white hover:text-[#ff8000] px-8 py-3 text-lg w-full sm:w-auto transition-colors duration-300"
                asChild
              >
                <Link to="/contact">
                  Speak to an Expert
                </Link>
              </Button>
            </div>
            <p className="text-sm text-white/70 mt-6">
              No fees • No obligations • Secure application process
            </p>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default ForBusinesses;
