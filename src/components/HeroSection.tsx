import { Link } from 'react-router-dom';
import { useNavbar } from '@/contexts/NavbarContext';
import { useEffect, useState } from 'react';

const HeroSection = () => {
  // State to track viewport size for dynamic responsive adjustments
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  // Update state based on window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
      setIsTablet(window.innerWidth >= 640 && window.innerWidth < 1024);
    };

    // Set initial state
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <section className="relative min-h-[90vh] sm:min-h-screen overflow-hidden">
      {/* Enhanced background with gradient overlay */}
      <div className="absolute inset-0">
        <img 
          src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1920&auto=format&fit=crop&q=80"
          alt="Business owners working together in a modern restaurant kitchen"
          className="w-full h-full object-cover"
        />
        {/* Professional gradient overlay matching theme */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#212936]/60 via-[#212936]/40 to-[#2c3c53]/30"></div>
      </div>
      
      {/* Content overlay */}
      <div className="relative z-10 min-h-[90vh] sm:min-h-screen flex items-center py-10 sm:py-0">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center w-full gap-8 lg:gap-0">
            {/* Enhanced hero content card with professional styling */}
            <div className="w-full lg:max-w-lg">
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#212936] mb-6 sm:mb-8 leading-tight">
                  Find The Funding For Your Business
                </h1>
                
                {/* Enhanced feature list with professional styling */}
                <div className="space-y-4 md:space-y-5 mb-6 sm:mb-8">
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#ff8000] to-[#ff9500] flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-[#2c3c53] text-sm font-medium leading-relaxed">Find the funding fit for your business</span>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#ff8000] to-[#ff9500] flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-[#2c3c53] text-sm font-medium leading-relaxed">The comparison site for commercial funding options, 1 application many options</span>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#ff8000] to-[#ff9500] flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-[#2c3c53] text-sm font-medium leading-relaxed">Access funding faster, completely transparently with support every step of the way</span>
                  </div>
                </div>
                
                {/* Enhanced CTA Options with professional styling */}
                <div className="space-y-5 mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-[#212936] mb-5">
                    Know what you're looking for?
                  </h2>
                  
                  {/* Three professional option cards */}
                  <div className="space-y-4">
                    {/* Option 1: Explore All Products */}
                    <Link 
                      to="/products"
                      className="group block bg-gradient-to-br from-blue-50 to-blue-100/80 hover:from-blue-100 hover:to-blue-200/80 border border-blue-200/60 rounded-xl p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 backdrop-blur-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-bold text-[#212936] text-base mb-2">
                            Know what you are looking for
                          </h3>
                          <p className="text-[#2c3c53]/80 text-sm font-medium">
                            Explore loans, cashflow finance, asset finance & more
                          </p>
                        </div>
                        <div className="bg-gradient-to-br from-[#212936] to-[#2c3c53] rounded-full p-2 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                          <svg className="w-4 h-4 text-[#ff8000]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </Link>

                    {/* Option 2: Quick Application */}
                    <Link 
                      to="/funding-needs"
                      className="group block bg-gradient-to-br from-[#ff8000]/10 to-[#ff9500]/10 hover:from-[#ff8000]/20 hover:to-[#ff9500]/20 border border-[#ff8000]/30 rounded-xl p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 backdrop-blur-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-bold text-[#212936] text-base mb-2">
                            Have a need
                          </h3>
                          <p className="text-[#2c3c53]/80 text-sm font-medium">
                            Get matched with suitable funding in minutes
                          </p>
                        </div>
                        <div className="bg-gradient-to-br from-[#ff8000] to-[#ff9500] rounded-full p-2 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </Link>

                    {/* Option 3: Expert Consultation */}
                    <Link 
                      to="/support-flow"
                      className="group block bg-gradient-to-br from-slate-50 to-slate-100/80 hover:from-slate-100 hover:to-slate-200/80 border border-slate-200/60 rounded-xl p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 backdrop-blur-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-bold text-[#212936] text-base mb-2">
                            Need Support
                          </h3>
                          <p className="text-[#2c3c53]/80 text-sm font-medium">
                            Free advice from our funding specialists
                          </p>
                        </div>
                        <div className="bg-gradient-to-br from-[#212936] to-[#2c3c53] rounded-full p-2 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                          <svg className="w-4 h-4 text-[#ff8000]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </Link>
                  </div>
                </div>
                
                {/* Enhanced learn more link */}
                <div className="text-sm">
                  <span className="text-[#2c3c53]/70 font-medium">Want to learn more about funding options? </span>
                  <Link to="/learn" className="text-[#ff8000] hover:text-[#ff9500] font-bold transition-colors duration-200">Learn now</Link>
                </div>
              </div>
            </div>
            
            {/* Professional trust indicators */}
            <div className="space-y-4 lg:mr-8 flex flex-col sm:flex-row lg:flex-col sm:space-x-6 lg:space-x-0">
              {/* Network Size Indicator */}
              <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 sm:p-5 shadow-xl border border-white/20 w-full sm:max-w-[220px] md:max-w-[240px] hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-7 h-7 bg-gradient-to-br from-[#ff8000] to-[#ff9500] rounded-lg flex items-center justify-center shadow-lg">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <span className="text-[#212936] font-bold text-lg">Lender Network</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#2c3c53] font-medium">Active Lenders</span>
                    <span className="text-lg font-bold text-[#ff8000]">50+</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#2c3c53] font-medium">Funding Products</span>
                    <span className="text-lg font-bold text-[#ff8000]">200+</span>
                  </div>
                </div>
              </div>
              
              {/* Time Savings Badge */}
              <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 sm:p-5 shadow-xl border border-white/20 w-full sm:max-w-[220px] md:max-w-[240px] hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="font-bold text-[#212936] text-lg">Save Time</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#2c3c53] font-medium">vs. Traditional search</span>
                    <span className="text-lg font-bold text-blue-600">90%</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-[#2c3c53] font-medium">Minutes not weeks</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-[#2c3c53] font-medium">One application, many options</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
