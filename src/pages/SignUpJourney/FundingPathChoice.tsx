import { Link } from 'react-router-dom';
import PageLayout from '@/components/PageLayout';
import { ArrowRight, Building2, Users, Shield, Star, CheckCircle, Clock } from 'lucide-react';

const FundingPathChoice = () => {
  return (
    <PageLayout showSidebar={false}>
      {/* Hero Section */}
      <section className="relative min-h-screen overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1920&auto=format&fit=crop&q=80"
            alt="Business owners working together in a modern restaurant kitchen"
            className="w-full h-full object-cover"
          />
          {/* Professional gradient overlay matching theme */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#212936]/60 via-[#212936]/40 to-[#2c3c53]/30"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 min-h-screen flex items-center">
          <div className="container mx-auto px-4 py-16">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
              
              {/* Left Content */}
              <div className="flex-1 max-w-2xl text-white">
                <div className="mb-10">
                  <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white/90 text-sm font-medium mb-6">
                    <Star className="w-4 h-4 mr-2 text-yellow-400" />
                    Rated #1 Business Funding Platform
                  </div>
                  <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight">
                    Find The Funding 
                    <span className="text-[#ff8000]"> For Your Business</span>
                  </h1>
                  <p className="text-xl text-white/90 mb-8 leading-relaxed">
                    Join thousands of businesses already transforming how they access commercial funding. 
                    One platform, endless possibilities.
                  </p>
                </div>
                
                {/* Feature list with professional styling */}
                <div className="space-y-4 md:space-y-5 mb-8">
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#ff8000] to-[#ff9500] flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-white/90 text-lg font-medium leading-relaxed">Find the funding fit for your business</span>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#ff8000] to-[#ff9500] flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-white/90 text-lg font-medium leading-relaxed">The comparison site for commercial funding options, 1 application many options</span>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#ff8000] to-[#ff9500] flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-white/90 text-lg font-medium leading-relaxed">Access funding faster, completely transparently with support every step of the way</span>
                  </div>
                </div>
                
                {/* Trust Signals */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-[#ff8000]/20 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-[#ff8000]" />
                    </div>
                    <div>
                      <div className="font-semibold">Bank-Grade Security</div>
                      <div className="text-sm text-white/70">256-bit encryption</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-[#ff8000]/20 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-[#ff8000]" />
                    </div>
                    <div>
                      <div className="font-semibold">Fast Setup</div>
                      <div className="text-sm text-white/70">Ready in 2 minutes</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-[#ff8000]/20 flex items-center justify-center">
                      <Users className="w-5 h-5 text-[#ff8000]" />
                    </div>
                    <div>
                      <div className="font-semibold">10,000+ Users</div>
                      <div className="text-sm text-white/70">Trusted globally</div>
                    </div>
                  </div>
                </div>
                
                {/* Reviews */}
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <span className="text-sm font-medium">4.9/5</span>
                  </div>
                  <div className="text-sm text-white/70">
                    Based on 2,400+ reviews
                  </div>
                </div>
              </div>
              
              {/* Right Content - Funding Path Choice */}
              <div className="flex-1 max-w-2xl w-full">
                <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/20">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-[#ff8000] to-[#ff9500] rounded-2xl mb-4">
                      <Building2 className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                      Find The Funding For Your Business
                    </h2>
                    <p className="text-gray-600 text-lg mb-6">
                      Know what you're looking for?
                    </p>
                  </div>
                  
                  {/* Funding Path Options */}
                  <div className="space-y-6">
                    {/* Option 1: Know what you are looking for */}
                    <Link 
                      to="/products"
                      className="group block bg-gradient-to-br from-blue-50 to-blue-100/80 hover:from-blue-100 hover:to-blue-200/80 border border-blue-200/60 rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 backdrop-blur-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-bold text-[#212936] text-xl mb-3">
                            Know what you are looking for
                          </h3>
                          <p className="text-[#2c3c53]/80 text-base font-medium leading-relaxed">
                            Explore loans, cashflow finance, asset finance & more
                          </p>
                        </div>
                        <div className="bg-gradient-to-br from-[#212936] to-[#2c3c53] rounded-full p-3 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                          <ArrowRight className="w-5 h-5 text-[#ff8000]" />
                        </div>
                      </div>
                    </Link>

                    {/* Option 2: Have a need */}
                    <Link 
                      to="/signup-journey/email-password"
                      className="group block bg-gradient-to-br from-[#ff8000]/10 to-[#ff9500]/10 hover:from-[#ff8000]/20 hover:to-[#ff9500]/20 border border-[#ff8000]/30 rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 backdrop-blur-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-bold text-[#212936] text-xl mb-3">
                            Have a need
                          </h3>
                          <p className="text-[#2c3c53]/80 text-base font-medium leading-relaxed">
                            Get matched with suitable funding in minutes
                          </p>
                        </div>
                        <div className="bg-gradient-to-br from-[#ff8000] to-[#ff9500] rounded-full p-3 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                          <ArrowRight className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    </Link>

                    {/* Option 3: Need Support */}
                    <Link 
                      to="/contact"
                      className="group block bg-gradient-to-br from-slate-50 to-slate-100/80 hover:from-slate-100 hover:to-slate-200/80 border border-slate-200/60 rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 backdrop-blur-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-bold text-[#212936] text-xl mb-3">
                            Need Support
                          </h3>
                          <p className="text-[#2c3c53]/80 text-base font-medium leading-relaxed">
                            Free advice from our funding specialists
                          </p>
                        </div>
                        <div className="bg-gradient-to-br from-[#212936] to-[#2c3c53] rounded-full p-3 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                          <ArrowRight className="w-5 h-5 text-[#ff8000]" />
                        </div>
                      </div>
                    </Link>
                  </div>
                  
                  {/* Learn More Link */}
                  <div className="text-center mt-8 pt-6 border-t border-gray-200">
                    <p className="text-gray-600">
                      Want to learn more about funding options?{' '}
                      <Link to="/learn" className="font-semibold text-[#ff8000] hover:text-[#ff8000]/80 transition-colors underline decoration-2 underline-offset-2">
                        Learn now
                      </Link>
                    </p>
                  </div>
                  
                  {/* Login Link */}
                  <div className="text-center mt-4">
                    <p className="text-gray-600">
                      Already have an account?{' '}
                      <Link to="/login" className="font-semibold text-[#212936] hover:text-[#212936]/80 transition-colors underline decoration-2 underline-offset-2">
                        Sign in here
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default FundingPathChoice;
