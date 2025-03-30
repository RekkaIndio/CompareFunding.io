import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageLayout from '@/components/PageLayout';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2, Search, CreditCard, Award, BarChart4, Users, ShieldCheck } from 'lucide-react';
import FeatureCard from '@/components/FeatureCard';

const ForLenders = () => {
  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const features = [
    {
      title: 'Lower Acquisition Costs',
      description: 'Our credit-based system dramatically reduces your customer acquisition costs.',
      icon: <CreditCard className="h-6 w-6" />
    },
    {
      title: 'Qualified Leads',
      description: 'Access pre-screened, verified businesses that match your lending criteria.',
      icon: <Award className="h-6 w-6" />
    },
    {
      title: 'Detailed Analytics',
      description: 'Track your performance, conversion rates, and ROI with advanced analytics.',
      icon: <BarChart4 className="h-6 w-6" />
    },
    {
      title: 'Direct Communication',
      description: 'Connect directly with businesses, without intermediary interference.',
      icon: <Users className="h-6 w-6" />
    },
  ];

  return (
    <PageLayout>
      <section className="py-8">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-6 animate-slide-up">For Lenders</h1>
          <p className="text-xl text-muted-foreground mb-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
            Connect with qualified businesses seeking funding at a fraction of traditional acquisition costs.
            Our transparent platform aligns incentives around quality connections, not just transaction size.
          </p>
          <Button 
            size="lg" 
            className="bg-fundhub-blue hover:bg-fundhub-blue/90 animate-slide-up" 
            style={{ animationDelay: '200ms' }}
            asChild
          >
            <Link to="/signup">
              Join as a Lender
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <section className="py-12">
        <h2 className="text-2xl font-bold mb-8 text-center">Benefits for Lenders</h2>
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
          <div className="order-2 lg:order-1 rounded-xl overflow-hidden shadow-lg border border-gray-100">
            <img 
              src="https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800&auto=format&fit=crop&q=80" 
              alt="Lender dashboard" 
              className="w-full h-auto" 
            />
          </div>
          
          <div className="order-1 lg:order-2">
            <h2 className="text-2xl font-bold mb-6">How It Works For Lenders</h2>
            <div className="space-y-6">
              <div className="flex">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-fundhub-blue/10 flex items-center justify-center text-fundhub-blue font-medium mr-4">
                  1
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-2">Create Your Profile</h3>
                  <p className="text-muted-foreground">
                    Set up your lender profile with details about your funding products, criteria, and preferences.
                  </p>
                </div>
              </div>

              <div className="flex">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-fundhub-blue/10 flex items-center justify-center text-fundhub-blue font-medium mr-4">
                  2
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-2">Purchase Credits</h3>
                  <p className="text-muted-foreground">
                    Select a subscription plan or pay-as-you-go package to acquire credits for making offers.
                  </p>
                </div>
              </div>

              <div className="flex">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-fundhub-blue/10 flex items-center justify-center text-fundhub-blue font-medium mr-4">
                  3
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-2">Review Matched Applications</h3>
                  <p className="text-muted-foreground">
                    Receive notifications for funding applications that match your criteria and review their details.
                  </p>
                </div>
              </div>

              <div className="flex">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-fundhub-blue/10 flex items-center justify-center text-fundhub-blue font-medium mr-4">
                  4
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-2">Make Offers & Close Deals</h3>
                  <p className="text-muted-foreground">
                    Use credits to submit funding offers to businesses and communicate directly to close deals.
                  </p>
                </div>
              </div>
            </div>
            
            <Button className="mt-8 bg-fundhub-blue hover:bg-fundhub-blue/90" asChild>
              <Link to="/signup">
                Register as a Lender
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-12">
        <h2 className="text-2xl font-bold mb-8">Our Pricing Model</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              name: 'Starter',
              price: '£100',
              period: 'per month',
              credits: '10 credits monthly',
              features: [
                'Access to all business applications',
                'Basic matching algorithm',
                'Standard analytics dashboard',
                'Email support'
              ],
              featured: false
            },
            {
              name: 'Professional',
              price: '£250',
              period: 'per month',
              credits: '30 credits monthly',
              features: [
                'Advanced matching algorithm',
                'Comprehensive analytics',
                'Priority application access',
                'Dedicated account manager',
                'Phone & email support'
              ],
              featured: true
            },
            {
              name: 'Enterprise',
              price: 'Custom',
              period: '',
              credits: 'Custom credit packages',
              features: [
                'White-labeled portal option',
                'API integration capabilities',
                'Custom matching parameters',
                'Advanced risk analytics',
                'Executive business reviews',
                '24/7 premium support'
              ],
              featured: false
            }
          ].map((plan, index) => (
            <div 
              key={index} 
              className={`rounded-xl overflow-hidden transition-all duration-300 ${
                plan.featured 
                  ? 'border-2 border-fundhub-blue shadow-lg relative scale-105 z-10 bg-white' 
                  : 'border border-gray-100 shadow-sm bg-white hover:shadow-md'
              }`}
            >
              {plan.featured && (
                <div className="bg-fundhub-blue text-white text-center py-1 text-xs font-medium">
                  MOST POPULAR
                </div>
              )}
              
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  {plan.period && <span className="text-muted-foreground ml-1">{plan.period}</span>}
                </div>
                <p className="text-sm text-fundhub-blue font-medium mb-4">{plan.credits}</p>
                
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start text-sm">
                      <CheckCircle2 className="h-5 w-5 text-fundhub-blue mr-2 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className={`w-full ${plan.featured ? 'bg-fundhub-blue hover:bg-fundhub-blue/90' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
                  asChild
                >
                  <Link to="/signup?plan=lender">
                    {plan.name === 'Enterprise' ? 'Contact Sales' : 'Select Plan'}
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-8 text-sm text-muted-foreground">
          All plans include a 14-day free trial. No credit card required to start.
        </div>
      </section>

      <section className="py-10 my-10 bg-fundhub-navy rounded-xl text-white text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6">Ready to transform your lending business?</h2>
          <p className="text-lg text-white/80 mb-8">
            Join our network of lenders and connect with qualified businesses at a fraction of traditional acquisition costs.
          </p>
          <Button 
            size="lg" 
            className="bg-white text-fundhub-navy hover:bg-white/90" 
            asChild
          >
            <Link to="/signup">
              Join as a Lender
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </PageLayout>
  );
};

export default ForLenders;
