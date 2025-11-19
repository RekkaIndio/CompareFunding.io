import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

const HeroSection = () => {
  // State to track viewport size for dynamic responsive adjustments
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', amount: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

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
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center w-full gap-8 lg:gap-8">
            {/* Enhanced hero content card with professional styling */}
            <div className="w-full lg:max-w-lg">
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#212936] mb-4 sm:mb-6 leading-tight">
                  Funding made simple — compare offers from 50+ lenders
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
                
                {/* CTAs + Microform */}
                <div className="mb-6 sm:mb-8">
                  <h2 className="text-lg sm:text-xl font-semibold text-[#212936] mb-4">
                    Get matched to the best options for your business
                  </h2>
                  <div className="flex flex-col sm:flex-row gap-3 md:gap-4 items-center">
                    <Link to="/signup" className="inline-flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-5 rounded-lg transition-shadow shadow-md text-sm">
                      Apply Now
                    </Link>
                    <Link to="/products" className="inline-flex items-center justify-center bg-white border border-gray-200 hover:shadow-md text-[#212936] font-medium py-3 px-4 rounded-lg text-sm">
                      Compare Products
                    </Link>
                    <Link to="/support-flow" className="inline-flex items-center justify-center text-[#212936] hover:text-orange-500 font-medium py-3 px-3 rounded-lg text-sm">
                      Need Advice? Book a call →
                    </Link>
                  </div>

                  <form
                    className="mt-4"
                    aria-label="Quick funding form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      setIsSubmitting(true);
                      const params = new URLSearchParams({
                        name: form.name,
                        email: form.email,
                        amount: form.amount,
                        source: 'hero'
                      }).toString();
                      // Small delay to indicate submission
                      setTimeout(() => {
                        setIsSubmitting(false);
                        navigate(`/signup?${params}`);
                      }, 400);
                    }}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input aria-label="Full name" placeholder="Full name" className="w-full rounded-lg border border-gray-200 p-2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                      <input aria-label="Email address" type="email" placeholder="Email" className="w-full rounded-lg border border-gray-200 p-2" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                      <input aria-label="Funding required" placeholder="Funding amount" className="w-full rounded-lg border border-gray-200 p-2" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <button type="submit" disabled={isSubmitting} className="bg-blue-900 hover:bg-blue-800 text-white font-semibold py-2 px-4 rounded-lg text-sm">{isSubmitting ? 'Getting offers...' : 'Get indicative offers'}</button>
                      <button type="button" onClick={() => setForm({ name: '', email: '', amount: '' })} className="text-sm text-gray-600 hover:text-gray-800">Reset</button>
                    </div>
                  </form>
                </div>
                
                {/* Trusted logos */}
                <div className="mt-6 text-sm">
                  <span className="text-[#2c3c53]/80 font-medium">Trusted by businesses and lenders.</span>
                  <div className="flex items-center gap-3 mt-3 flex-wrap">
                    <img src="/src/assets/lenderlogos/barclyays.png" alt="Barclays" className="h-6 opacity-80" />
                    <img src="/src/assets/lenderlogos/hsbclogo.png" alt="HSBC" className="h-6 opacity-80" />
                    <img src="/src/assets/lenderlogos/lloydslogo.png" alt="Lloyds" className="h-6 opacity-80" />
                    <img src="/src/assets/lenderlogos/natwestlogo.png" alt="NatWest" className="h-6 opacity-80" />
                    <img src="/src/assets/lenderlogos/santanderlogo.png" alt="Santander" className="h-6 opacity-80" />
                    <img src="/src/assets/lenderlogos/metro_bank_logo.png" alt="Metro Bank" className="h-6 opacity-80" />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right column: image card + stats */}
            <div className="flex-1 lg:max-w-[520px] lg:mr-8 sm:mr-0">
              <div className="rounded-3xl overflow-hidden shadow-2xl border border-white/20 bg-white/80">
                <div className="relative h-96 lg:h-[420px]">
                  <img 
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=1200&auto=format&fit=crop&q=80"
                    alt="Business owners working together"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>

                  <div className="absolute left-6 bottom-6 right-6">
                    <div className="bg-white/95 rounded-2xl p-4 border border-white/30 shadow-md">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-700">Average response time</p>
                          <p className="text-xl font-bold text-gray-900">Under 24 hours</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-700">Lenders</p>
                          <p className="text-xl font-bold text-orange-500">50+</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-700">Products</p>
                          <p className="text-xl font-bold text-blue-900">200+</p>
                        </div>
                      </div>
                    </div>
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
