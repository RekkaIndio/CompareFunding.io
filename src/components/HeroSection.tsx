import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useNavbar } from '@/contexts/NavbarContext'; // Add this line
import { ArrowRight, Check, Clock, PoundSterling, Users } from 'lucide-react';

const HeroSection = () => {
  const [isApplyHovered, setIsApplyHovered] = useState(false);
  const [isCheckHovered, setIsCheckHovered] = useState(false);
  const { hideNavbar } = useNavbar(); // Add this line

  return (
    <section className="relative overflow-hidden bg-white pt-12 pb-16 md:pt-16 md:pb-20">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 right-0 h-[500px] overflow-hidden opacity-10 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-fundhub-blue rounded-full filter blur-3xl opacity-20 -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-fundhub-navy rounded-full filter blur-3xl opacity-10 translate-x-1/2 -translate-y-1/2"></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Main Content Section (Takes 7 columns) */}
          <div className="lg:col-span-7 z-10">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-[#2a3441] mb-3 animate-slide-up">
              Join the <span className="text-primary">25,000+</span> businesses 
              <br className="hidden md:block" /> approved for funding
            </h1>
            
            <h2 className="text-xl md:text-2xl text-[#2a3441] mb-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
              The comparison site for commercial funding options
            </h2>
            
            <p className="text-lg text-[#2a3441] mb-8 animate-slide-up" style={{ animationDelay: '150ms' }}>
              Borrow <span className="font-semibold">£5,000 - £2 million</span> to scale your operations, 
              invest in growth, or manage cash flow.
            </p>
            
            <div className="space-y-3 mb-8 animate-slide-up" style={{ animationDelay: '200ms' }}>
              <div className="flex items-center gap-2">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                  <Check className="h-4 w-4 text-primary" />
                </div>
                <p className="text-[#2a3441]">Find the funding fit for your business</p>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                  <Check className="h-4 w-4 text-primary" />
                </div>
                <p className="text-[#2a3441]">The comparison site for commercial funding options</p>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                  <Check className="h-4 w-4 text-primary" />
                </div>
                <p className="text-[#2a3441]">Access funding faster </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-4 animate-slide-up" style={{ animationDelay: '250ms' }}>
              <Button 
                size="lg" 
                className={`bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg transition-all duration-300 ${isApplyHovered ? 'shadow-lg shadow-primary/20' : ''}`}
                asChild
                onMouseEnter={() => setIsApplyHovered(true)}
                onMouseLeave={() => setIsApplyHovered(false)}
                onClick={hideNavbar} // Add this line
              >
                <Link to="/signup-journey/email-password">
                  Apply Now
                </Link>
              </Button>
              
              <Button 
                variant="outline" 
                size="lg"
                className={`border-primary text-primary hover:bg-primary/10 px-8 py-6 text-lg transition-all duration-300 ${isCheckHovered ? 'shadow-md' : ''}`}
                asChild
                onMouseEnter={() => setIsCheckHovered(true)}
                onMouseLeave={() => setIsCheckHovered(false)}
              >
                <Link to="/eligibility">
                  Check Eligibility
                </Link>
              </Button>
            </div>
            
            <p className="text-sm text-[#2a3441] mt-4 animate-slide-up" style={{ animationDelay: '300ms' }}>
              Applying won't affect your credit score
            </p>
          </div>
          
          {/* Hero Image and Trustpilot Section (Takes 5 columns) */}
          <div className="lg:col-span-5">
            {/* Hero Image */}
            <div className="relative rounded-xl overflow-hidden shadow-xl mb-6 animate-slide-in-right">
              <img 
                src="https://images.unsplash.com/photo-1556157382-97eda2d62296?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80" 
                alt="Business owners discussing funding options" 
                className="w-full h-auto object-cover rounded-xl"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-fundhub-navy/30 to-transparent"></div>
            </div>
            
            {/* Trustpilot Section */}
            <div className="bg-white rounded-lg p-5 shadow-md border border-gray-100 animate-slide-up flex" style={{ animationDelay: '350ms' }}>
              <div className="flex-1">
                <div className="flex mb-1">
                  {/* Trustpilot stars */}
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-[#00b67a] fill-current" viewBox="0 0 24 24">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                  ))}
                </div>
                <p className="font-bold text-lg text-[#2a3441]">Excellent 4.8/5</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-[#2a3441]">Based on</p>
                  <p className="text-sm font-semibold text-[#2a3441]">2,348 reviews</p>
                  <img src="https://cdn.trustpilot.net/brand-assets/4.1.0/logos/stars/stars-4.5.svg" alt="Trustpilot" className="h-5" />
                </div>
              </div>
              <div className="flex gap-8">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-1">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-xs font-medium text-[#2a3441]">Fast</p>
                  <p className="text-sm font-semibold text-[#2a3441]">Decisions</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-1">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-xs font-medium text-[#2a3441]">40+</p>
                  <p className="text-sm font-semibold text-[#2a3441]">Lenders</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Floating card with funding terms - similar to iwoca example */}
        <div className="mt-8 bg-white rounded-xl shadow-xl p-6 border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up" style={{ animationDelay: '400ms' }}>
          <div className="text-center">
            <h3 className="text-primary text-lg font-semibold mb-2">Direct access to lenders</h3>
            <p className="text-[#2a3441]">Our platfrom connects you directly with lenders, saving time and cost</p>
          </div>
          
          <div className="text-center">
            <h3 className="text-primary text-lg font-semibold mb-2">No broker fees</h3>
            <p className="text-[#2a3441]">YOu can save 1000's by being conencted directly with lenders.</p>
          </div>
          
          <div className="text-center">
            <h3 className="text-primary text-lg font-semibold mb-2">Automated lender access</h3>
            <p className="text-[#2a3441]">Compare Funding does all the work for you</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
