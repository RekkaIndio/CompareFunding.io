
import { ArrowRight, Layers, Zap, BarChart4, CreditCard, Calendar, LineChart, Users, Lock } from 'lucide-react';
import FeatureCard from './FeatureCard';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const FeaturesSection = () => {
  const features = [
    {
      title: 'Transparent Pricing',
      description: 'No hidden fees or commissions. Our credit-based system ensures you only pay for what you use.',
      icon: <CreditCard className="h-6 w-6" />
    },
    {
      title: 'Smart Matching',
      description: 'Our algorithm connects businesses with the most suitable lenders based on multiple criteria.',
      icon: <BarChart4 className="h-6 w-6" />
    },
    {
      title: 'Fast Decisions',
      description: 'Get funding offers in as little as 24 hours with our streamlined application process.',
      icon: <Zap className="h-6 w-6" />
    },
    {
      title: 'Direct Communication',
      description: 'Connect and negotiate directly with lenders, eliminating the middleman.',
      icon: <Users className="h-6 w-6" />
    },
    {
      title: 'Accounting Integration',
      description: 'Securely connect your accounting software to enhance your application with verified data.',
      icon: <Layers className="h-6 w-6" />
    },
    {
      title: 'Bank-Level Security',
      description: 'Your financial data is protected with enterprise-grade encryption and security protocols.',
      icon: <Lock className="h-6 w-6" />
    }
  ];

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-fundhub-blue font-medium mb-3">Features</p>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Everything you need to access better business funding
          </h2>
          <p className="text-lg text-muted-foreground">
            Our platform removes traditional barriers, creating direct connections between businesses 
            and lenders while eliminating broker commissions.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {features.map((feature, index) => (
            <FeatureCard 
              key={index}
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            />
          ))}
        </div>
        
        <div className="text-center">
          <Button size="lg" className="bg-fundhub-blue hover:bg-fundhub-blue/90" asChild>
            <Link to="/features">
              Explore All Features
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
