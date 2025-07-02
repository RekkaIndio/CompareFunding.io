import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageLayout from '@/components/PageLayout';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2, Target, Clock, PoundSterling, Shield, BarChart3, Users, Zap, TrendingUp, Search, Award, FileText, MessageSquare, HandHeart, Star } from 'lucide-react';

const ForLenders = () => {
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
              Connect With Quality Businesses Ready to Borrow
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Browse qualified business applications for free. Pay only £250 when you want to submit an offer and connect directly with a business owner.
            </p>
            
            {/* Feature highlights */}
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-8 text-sm sm:text-base">
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                  <CheckCircle2 className="w-3 h-3 text-white" />
                </div>
                <span className="text-gray-700">Browse applications free</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                  <CheckCircle2 className="w-3 h-3 text-white" />
                </div>
                <span className="text-gray-700">Pay £250 per offer only</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                  <CheckCircle2 className="w-3 h-3 text-white" />
                </div>
                <span className="text-gray-700">Direct business contact</span>
              </div>
            </div>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg" 
                className="bg-gray-900 hover:bg-[#ff8000] text-white px-8 py-3 text-base sm:text-lg w-full sm:w-auto transition-colors duration-300"
                asChild
              >
                <Link to="/signup">
                  Join as a Lender
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
                  Schedule Demo
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Our Platform?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Transform your lending business with access to high-quality, pre-qualified business applications
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-6">
                <Target className="w-6 h-6 text-orange-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Pre-Qualified Leads</h3>
              <p className="text-gray-600 leading-relaxed">
                Every business application goes through our rigorous pre-qualification process, ensuring you only see creditworthy opportunities.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-6">
                <PoundSterling className="w-6 h-6 text-orange-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Transparent Pricing</h3>
              <p className="text-gray-600 leading-relaxed">
                Simple, flat-rate pricing with no hidden fees. Know exactly what you're paying for quality business leads.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-6">
                <Clock className="w-6 h-6 text-orange-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Faster Processing</h3>
              <p className="text-gray-600 leading-relaxed">
                Reduce time-to-decision with comprehensive business data and credit assessments already completed.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-6">
                <BarChart3 className="w-6 h-6 text-orange-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Advanced Analytics</h3>
              <p className="text-gray-600 leading-relaxed">
                Get detailed insights into market trends, application volumes, and performance metrics to optimize your lending strategy.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-orange-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Risk Management</h3>
              <p className="text-gray-600 leading-relaxed">
                Built-in risk assessment tools and credit scoring help you make informed lending decisions with confidence.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-orange-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Direct Communication</h3>
              <p className="text-gray-600 leading-relaxed">
                Connect directly with business owners, eliminating brokers and building stronger lending relationships.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works For Lenders
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              A simple, transparent process designed to connect you with quality business applications efficiently
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
            <div className="order-2 lg:order-1">
              <div className="rounded-xl overflow-hidden shadow-lg border border-gray-100">
                <img 
                  src="https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800&auto=format&fit=crop&q=80" 
                  alt="Lender dashboard showing business applications and analytics" 
                  className="w-full h-auto" 
                />
              </div>
            </div>
            
            <div className="order-1 lg:order-2 space-y-8">
              <div className="flex items-start">
                <div className="flex-shrink-0 h-12 w-12 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-lg mr-6">
                  1
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Create Your Lender Profile</h3>
                  <p className="text-gray-600 leading-relaxed mb-3">
                    Set up your comprehensive lender profile with your funding products, criteria, and preferences. Define your target market, funding amounts, sectors, and risk appetite.
                  </p>
                  <ul className="text-gray-600 space-y-1 text-sm">
                    <li>• Configure funding criteria and parameters</li>
                    <li>• Set automated matching preferences</li>
                    <li>• Upload your lending products and rates</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 h-12 w-12 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-lg mr-6">
                  2
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Browse Applications for Free</h3>
                  <p className="text-gray-600 leading-relaxed mb-3">
                    Access and browse all qualified business applications at no cost. Search, filter, and review detailed business profiles completely free.
                  </p>
                  <ul className="text-gray-600 space-y-1 text-sm">
                    <li>• Free browsing of all applications</li>
                    <li>• Real-time notifications for new matches</li>
                    <li>• Advanced filtering and search tools</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 h-12 w-12 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-lg mr-6">
                  3
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Review & Analyse Applications</h3>
                  <p className="text-gray-600 leading-relaxed mb-3">
                    Access detailed business profiles, financial data, credit scores, and risk assessments for each application.
                  </p>
                  <ul className="text-gray-600 space-y-1 text-sm">
                    <li>• Complete financial statements and cash flow</li>
                    <li>• Credit scores and risk analysis</li>
                    <li>• Business sector and performance metrics</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 h-12 w-12 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-lg mr-6">
                  4
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Pay Per Offer & Close Deals</h3>
                  <p className="text-gray-600 leading-relaxed mb-3">
                    Pay only £250 when you want to submit an offer to a business. This gives you direct contact and exclusive communication rights.
                  </p>
                  <ul className="text-gray-600 space-y-1 text-sm">
                    <li>• Pay only £250 per offer submission</li>
                    <li>• Direct contact with business owner</li>
                    <li>• Exclusive communication during negotiation</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          {/* Stats Section */}
          <div className="bg-gray-900 rounded-2xl p-8 md:p-12 text-white">
            <div className="text-center mb-10">
              <h3 className="text-2xl md:text-3xl font-bold mb-4">Platform Performance</h3>
              <p className="text-gray-300">See how our lenders are succeeding</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-3xl md:text-4xl font-bold text-orange-500 mb-2">2.5x</div>
                <div className="text-gray-300 text-sm md:text-base">Higher Conversion Rate</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-orange-500 mb-2">60%</div>
                <div className="text-gray-300 text-sm md:text-base">Faster Processing</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-orange-500 mb-2">£50k+</div>
                <div className="text-gray-300 text-sm md:text-base">Average Deal Size</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-orange-500 mb-2">95%</div>
                <div className="text-gray-300 text-sm md:text-base">Application Quality</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Pay Only When You Make an Offer
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Browse all applications for free. Pay only £250 when you want to contact a business with an offer.
            </p>
          </div>
          
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg border-2 border-orange-500 overflow-hidden relative">
              <div className="bg-orange-500 text-white text-center py-3">
                <span className="font-semibold text-lg">Pay-Per-Offer Model</span>
              </div>
              
              <div className="p-8 md:p-12 text-center">
                <div className="mb-8">
                  <div className="text-5xl md:text-6xl font-bold text-gray-900 mb-2">£250</div>
                  <div className="text-xl text-gray-600">per offer submission</div>
                  <div className="text-sm text-orange-500 font-medium mt-2">Free browsing • Pay only to connect</div>
                </div>
                
                <div className="bg-gray-50 rounded-xl p-6 mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">How It Works</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="w-8 h-8 bg-green-500 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold">1</div>
                      <div className="font-medium text-gray-900">Browse Free</div>
                      <div className="text-gray-600">View all applications at no cost</div>
                    </div>
                    <div className="text-center">
                      <div className="w-8 h-8 bg-orange-500 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold">2</div>
                      <div className="font-medium text-gray-900">Pay to Offer</div>
                      <div className="text-gray-600">£250 to submit your offer</div>
                    </div>
                    <div className="text-center">
                      <div className="w-8 h-8 bg-blue-500 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold">3</div>
                      <div className="font-medium text-gray-900">Direct Contact</div>
                      <div className="text-gray-600">Negotiate directly with business</div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4 mb-10 text-left">
                  <div className="flex items-center">
                    <CheckCircle2 className="h-6 w-6 text-green-500 mr-4 flex-shrink-0" />
                    <span className="text-gray-700"><strong>Free registration</strong> and unlimited browsing of all applications</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle2 className="h-6 w-6 text-green-500 mr-4 flex-shrink-0" />
                    <span className="text-gray-700"><strong>Complete business profiles</strong> with financial data and credit scores</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle2 className="h-6 w-6 text-green-500 mr-4 flex-shrink-0" />
                    <span className="text-gray-700"><strong>Advanced search and filtering</strong> tools to find perfect matches</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle2 className="h-6 w-6 text-orange-500 mr-4 flex-shrink-0" />
                    <span className="text-gray-700"><strong>£250 per offer</strong> gives you direct business contact and negotiation rights</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle2 className="h-6 w-6 text-orange-500 mr-4 flex-shrink-0" />
                    <span className="text-gray-700"><strong>Exclusive communication</strong> during the offer and negotiation period</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle2 className="h-6 w-6 text-orange-500 mr-4 flex-shrink-0" />
                    <span className="text-gray-700"><strong>No monthly fees</strong> or ongoing subscription costs</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <Button 
                    size="lg"
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white text-lg py-4 transition-colors duration-300"
                    asChild
                  >
                    <Link to="/signup?plan=lender">
                      Register Free & Start Browsing
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="w-full border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white text-lg py-4 transition-colors duration-300"
                    asChild
                  >
                    <Link to="/contact">
                      Schedule a Demo
                    </Link>
                  </Button>
                </div>
                
                <div className="mt-8 text-center">
                  <div className="text-sm text-gray-500 mb-2">
                    <strong>Free registration</strong> • No setup fees • Pay only when you make offers
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Value Comparison */}
          <div className="mt-16 max-w-4xl mx-auto">
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                Compare Traditional vs. Our Platform
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 mb-4">Traditional Lead Generation</h4>
                  <div className="space-y-3 text-gray-600">
                    <div className="flex items-center">
                      <div className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center mr-3">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      </div>
                      <span>£500-2000+ per qualified lead</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center mr-3">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      </div>
                      <span>Monthly subscription fees</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center mr-3">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      </div>
                      <span>Limited application details</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center mr-3">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      </div>
                      <span>Competing with multiple lenders</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 mb-4">Compare Funding Platform</h4>
                  <div className="space-y-3 text-gray-600">
                    <div className="flex items-center">
                      <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center mr-3">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      </div>
                      <span>£250 per offer only</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center mr-3">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      </div>
                      <span>No monthly fees or subscriptions</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center mr-3">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      </div>
                      <span>Complete financial profiles</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center mr-3">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      </div>
                      <span>Exclusive contact when you pay</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="bg-gray-900 rounded-2xl p-8 md:p-12 text-white text-center relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500 rounded-full -translate-y-1/2 translate-x-1/2 opacity-20"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-500 rounded-full translate-y-1/2 -translate-x-1/2 opacity-20"></div>
            
            <div className="relative z-10 max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Ready to Find Your Next Deal?
              </h2>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                Register free and start browsing qualified business applications today. Pay only £250 when you find a business you want to make an offer to.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                <Button 
                  size="lg" 
                  className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 text-lg w-full sm:w-auto transition-colors duration-300" 
                  asChild
                >
                  <Link to="/signup?plan=lender">
                    Register Free & Browse
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="border-gray-300 text-gray-300 hover:bg-gray-300 hover:text-gray-900 px-8 py-4 text-lg w-full sm:w-auto transition-colors duration-300" 
                  asChild
                >
                  <Link to="/contact">
                    Book a Demo
                  </Link>
                </Button>
              </div>
              
              <div className="text-sm text-gray-400">
                Free registration • No monthly fees • Pay only per offer
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default ForLenders;
