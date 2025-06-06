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
      {/* Full background image with responsive optimization */}
      <div className="absolute inset-0">
        <img 
          src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1920&auto=format&fit=crop&q=80"
          alt="Business owners working together in a modern restaurant kitchen"
          className="w-full h-full object-cover"
        />
        {/* Dark overlay to improve text readability on mobile */}
        <div className="absolute inset-0 bg-black/30 sm:bg-black/20 lg:bg-black/10"></div>
      </div>
      
      {/* Content overlay */}
      <div className="relative z-10 min-h-[90vh] sm:min-h-screen flex items-center py-10 sm:py-0">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center w-full gap-8 lg:gap-0">
            {/* Hero content card */}
            <div className="w-full lg:max-w-md">
              <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 shadow-xl">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 lg:mb-8 leading-tight">
                  Find The Funding For Your Business
                </h1>
                
                {/* Feature list with checkmarks */}
                <div className="space-y-3 md:space-y-4 mb-5 sm:mb-6 lg:mb-8">
                  <div className="flex items-start space-x-2 sm:space-x-3">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-2 h-2 sm:w-3 sm:h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-gray-700 text-xs sm:text-sm leading-relaxed">Find the funding fit for your business</span>
                  </div>
                  
                  <div className="flex items-start space-x-2 sm:space-x-3">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-2 h-2 sm:w-3 sm:h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-gray-700 text-xs sm:text-sm leading-relaxed">The comparison site for commercial funding options, 1 application many options</span>
                  </div>
                  
                  <div className="flex items-start space-x-2 sm:space-x-3">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-2 h-2 sm:w-3 sm:h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-gray-700 text-xs sm:text-sm leading-relaxed">Access funding faster, completely transparently with support every step of the way</span>
                  </div>
                </div>
                
                {/* CTA Buttons */}
                <div className="flex flex-wrap sm:flex-nowrap gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <Link 
                    to="/signup-journey/email-password"
                    className="bg-blue-900 hover:bg-blue-800 text-white font-semibold py-2 sm:py-3 px-4 sm:px-6 rounded-lg transition-colors text-xs sm:text-sm w-full sm:w-auto text-center"
                  >
                    Apply Now
                  </Link>
                  <Link 
                    to="/contact"
                    className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 sm:py-3 px-4 sm:px-6 rounded-lg transition-colors text-xs sm:text-sm w-full sm:w-auto text-center"
                  >
                    Book Free Consultation
                  </Link>
                </div>
                
                {/* Learn more link */}
                <div className="text-xs sm:text-sm">
                  <span className="text-gray-600">Want to learn more about funding options? </span>
                  <Link to="/learn" className="text-orange-500 hover:text-orange-600 font-medium">Learn now</Link>
                </div>
              </div>
            </div>
            
            {/* Trust badges - responsive layout */}
            <div className="space-y-3 sm:space-y-4 lg:mr-8 flex flex-col sm:flex-row lg:flex-col sm:space-x-4 lg:space-x-0">
              {/* Trustpilot badge */}
              <div className="bg-white rounded-lg p-3 sm:p-4 shadow-lg w-full sm:max-w-[180px] md:max-w-[200px]">
                <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-600 rounded flex items-center justify-center">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                  <span className="text-green-600 font-bold text-sm sm:text-base">Trustpilot</span>
                </div>
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                  <span className="text-xs sm:text-sm text-gray-600 ml-1 sm:ml-2 font-medium">4.7/5 2,871 reviews</span>
                </div>
              </div>
              
              {/* Google reviews badge */}
              <div className="bg-white rounded-lg p-3 sm:p-4 shadow-lg w-full sm:max-w-[180px] md:max-w-[200px]">
                <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
                  <div className="w-5 h-5 sm:w-6 sm:h-6">
                    <svg viewBox="0 0 24 24" className="w-full h-full">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  </div>
                  <span className="font-bold text-gray-700 text-sm sm:text-base">Google</span>
                </div>
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                  <span className="text-xs sm:text-sm text-gray-600 ml-1 sm:ml-2 font-medium">4.9/5 1,423 reviews</span>
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
