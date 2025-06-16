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
            
            {/* Professional trust badges with enhanced styling */}
            <div className="space-y-4 lg:mr-8 flex flex-col sm:flex-row lg:flex-col sm:space-x-6 lg:space-x-0">
              {/* Enhanced Trustpilot badge */}
              <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 sm:p-5 shadow-xl border border-white/20 w-full sm:max-w-[220px] md:max-w-[240px] hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-7 h-7 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-lg">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                  <span className="text-[#212936] font-bold text-lg">Trustpilot</span>
                </div>
                <div className="flex items-center space-x-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm text-[#2c3c53] font-bold">4.7/5 • 2,871 reviews</span>
              </div>
              
              {/* Enhanced Google reviews badge */}
              <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 sm:p-5 shadow-xl border border-white/20 w-full sm:max-w-[220px] md:max-w-[240px] hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-7 h-7 rounded-lg overflow-hidden shadow-lg">
                    <svg viewBox="0 0 24 24" className="w-full h-full">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  </div>
                  <span className="font-bold text-[#212936] text-lg">Google</span>
                </div>
                <div className="flex items-center space-x-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm text-[#2c3c53] font-bold">4.9/5 • 1,423 reviews</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
