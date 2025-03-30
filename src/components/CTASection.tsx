
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const CTASection = () => {
  return (
    <section className="py-16 md:py-24 bg-fundhub-navy relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
        <div className="absolute -right-64 -top-64 w-[600px] h-[600px] rounded-full bg-fundhub-blue opacity-20 blur-3xl"></div>
        <div className="absolute -left-64 -bottom-64 w-[600px] h-[600px] rounded-full bg-fundhub-blue opacity-20 blur-3xl"></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to transform how you finance your business?
          </h2>
          <p className="text-lg text-white/80 mb-8">
            Join thousands of businesses and lenders already using FundHub to streamline 
            funding processes, reduce costs, and build valuable connections.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Button 
              size="lg" 
              className="bg-white text-fundhub-navy hover:bg-white/90" 
              asChild
            >
              <Link to="/signup">
                Create Free Account
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            
            <Button 
              variant="outline" 
              size="lg" 
              className="border-white text-white hover:bg-white/10" 
              asChild
            >
              <Link to="/contact">
                Contact Sales
              </Link>
            </Button>
          </div>
          
          <p className="text-sm text-white/60 mt-6">
            No credit card required. Free plan available for businesses.
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
