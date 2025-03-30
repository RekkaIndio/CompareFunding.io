import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageLayout from '@/components/PageLayout';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2, BarChart4, PiggyBank, Clock, BarChart, PoundSterling, ShieldCheck } from 'lucide-react';
import FeatureCard from '@/components/FeatureCard';

const ForBusinesses = () => {
  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const features = [
    {
      title: 'Lower Interest Rates',
      description: 'With no broker commissions to pay, lenders can offer you more competitive rates.',
      icon: <PiggyBank className="h-6 w-6" />
    },
    {
      title: 'Faster Decisions',
      description: 'Receive funding offers from multiple lenders in as little as 24 hours.',
      icon: <Clock className="h-6 w-6" />
    },
    {
      title: 'Multiple Offers',
      description: 'Compare side-by-side offers from various lenders to find your best match.',
      icon: <BarChart className="h-6 w-6" />
    },
    {
      title: 'No Fees',
      description: 'Our platform is completely free for businesses seeking funding.',
      icon: <PoundSterling className="h-6 w-6" />
    },
  ];

  return (
    <PageLayout>
      <section className="py-8">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-6 animate-slide-up">For Businesses</h1>
          <p className="text-xl text-muted-foreground mb-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
            Access the funding you need without the traditional broker fees and complexity.
            Our platform connects you directly with lenders ready to compete for your business.
          </p>
          <Button 
            size="lg" 
            className="bg-fundhub-blue hover:bg-fundhub-blue/90 animate-slide-up" 
            style={{ animationDelay: '200ms' }}
            asChild
          >
            <Link to="/signup">
              Create Free Account
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <section className="py-12">
        <h2 className="text-2xl font-bold mb-8 text-center">Why Choose FundHub</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <FeatureCard 
              key={index}
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
              className="animate-fade-in"
            />
          ))}
        </div>
      </section>

      <section className="py-12 bg-fundhub-light-gray rounded-xl my-12 p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-2xl font-bold mb-6">How It Works For Businesses</h2>
            <div className="space-y-6">
              <div className="flex">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-fundhub-blue/10 flex items-center justify-center text-fundhub-blue font-medium mr-4">
                  1
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-2">Create Your Profile</h3>
                  <p className="text-muted-foreground">
                    Set up your business profile with details about your company, industry, and financial information.
                  </p>
                </div>
              </div>

              <div className="flex">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-fundhub-blue/10 flex items-center justify-center text-fundhub-blue font-medium mr-4">
                  2
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-2">Connect Accounting</h3>
                  <p className="text-muted-foreground">
                    Securely link your accounting software to verify your financial data and streamline your application.
                  </p>
                </div>
              </div>

              <div className="flex">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-fundhub-blue/10 flex items-center justify-center text-fundhub-blue font-medium mr-4">
                  3
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-2">Submit Application</h3>
                  <p className="text-muted-foreground">
                    Specify your funding needs, amount, and purpose to get matched with suitable lenders.
                  </p>
                </div>
              </div>

              <div className="flex">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-fundhub-blue/10 flex items-center justify-center text-fundhub-blue font-medium mr-4">
                  4
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-2">Compare & Accept Offers</h3>
                  <p className="text-muted-foreground">
                    Review multiple funding offers side-by-side and accept the one that best meets your needs.
                  </p>
                </div>
              </div>
            </div>
            
            <Button className="mt-8 bg-fundhub-blue hover:bg-fundhub-blue/90" asChild>
              <Link to="/signup">
                Get Started Now
              </Link>
            </Button>
          </div>
          
          <div className="rounded-xl overflow-hidden shadow-lg border border-gray-100">
            <img 
              src="https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800&auto=format&fit=crop&q=80" 
              alt="Business dashboard" 
              className="w-full h-auto" 
            />
          </div>
        </div>
      </section>

      <section className="py-12">
        <h2 className="text-2xl font-bold mb-8">Funding Options Available</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: 'Invoice Finance',
              description: 'Unlock cash tied up in unpaid invoices to improve your cash flow.',
              features: ['Up to 90% of invoice value', 'Flexible terms', 'Quick approval']
            },
            {
              title: 'Business Loans',
              description: 'Secure term loans for growth, expansion, or working capital.',
              features: ['Fixed or variable rates', 'Terms from 3 months to 5 years', 'Unsecured options available']
            },
            {
              title: 'Asset Finance',
              description: 'Fund equipment, machinery, or vehicles with asset-backed financing.',
              features: ['Preserve working capital', 'Spread cost over asset lifetime', 'Potential tax advantages']
            },
            {
              title: 'Trade Finance',
              description: 'Finance your supply chain and international trade operations.',
              features: ['Cover supplier payments', 'Bridge cash flow gaps', 'Support import/export operations']
            },
            {
              title: 'Commercial Mortgages',
              description: 'Purchase or refinance business premises with competitive rates.',
              features: ['High loan-to-value ratios', 'Long-term financing', 'Fixed and variable options']
            },
            {
              title: 'Growth Capital',
              description: 'Specialized funding for high-growth businesses with proven traction.',
              features: ['Flexible repayment structures', 'Minimal dilution', 'Quick access to capital']
            }
          ].map((option, index) => (
            <div 
              key={index} 
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-md"
            >
              <h3 className="text-xl font-semibold mb-3">{option.title}</h3>
              <p className="text-muted-foreground mb-4">{option.description}</p>
              <ul className="space-y-2">
                {option.features.map((feature, i) => (
                  <li key={i} className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-fundhub-blue mr-2 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="py-10 my-10 bg-fundhub-navy rounded-xl text-white text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6">Ready to transform your business funding?</h2>
          <p className="text-lg text-white/80 mb-8">
            Join thousands of businesses already using FundHub to access better financing terms.
          </p>
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
        </div>
      </section>
    </PageLayout>
  );
};

export default ForBusinesses;
