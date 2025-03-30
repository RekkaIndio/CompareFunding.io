
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

const HowItWorksSection = () => {
  const steps = [
    {
      number: '01',
      title: 'Create Your Profile',
      description: 'Set up your business profile with key information about your company, financial needs, and funding preferences.',
      image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop&q=80'
    },
    {
      number: '02',
      title: 'Connect Accounting',
      description: 'Securely link your accounting software to pre-fill your application with verified financial data.',
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80'
    },
    {
      number: '03',
      title: 'Submit Application',
      description: 'Complete your funding application with details about your business, funding needs, and purpose.',
      image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format&fit=crop&q=80'
    },
    {
      number: '04',
      title: 'Receive Offers',
      description: 'Get matched with suitable lenders who review your application and provide competitive funding offers.',
      image: 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=800&auto=format&fit=crop&q=80'
    },
    {
      number: '05',
      title: 'Compare & Accept',
      description: 'Compare offers side-by-side and accept the one that best meets your needs.',
      image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&auto=format&fit=crop&q=80'
    }
  ];

  return (
    <section className="py-16 md:py-24 bg-fundhub-light-gray">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-fundhub-blue font-medium mb-3">How It Works</p>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Simple process, powerful results
          </h2>
          <p className="text-lg text-muted-foreground">
            Our streamlined process connects you with the right lenders in just a few steps. No unnecessary 
            complexity, no hidden costs.
          </p>
        </div>
        
        <div className="space-y-12 md:space-y-24">
          {steps.map((step, index) => (
            <div key={index} className={`flex flex-col ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-8 md:gap-12`}>
              <div className="w-full md:w-1/2 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 p-1 md:p-2">
                  <img 
                    src={step.image} 
                    alt={step.title} 
                    className="w-full h-auto rounded-lg object-cover"
                  />
                </div>
              </div>
              
              <div className="w-full md:w-1/2 animate-fade-in" style={{ animationDelay: `${index * 100 + 100}ms` }}>
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-fundhub-blue/10 flex items-center justify-center text-fundhub-blue font-medium">
                    {step.number}
                  </div>
                  <div className="h-0.5 flex-1 bg-fundhub-blue/10 ml-4"></div>
                </div>
                
                <h3 className="text-2xl font-bold mb-4">{step.title}</h3>
                <p className="text-muted-foreground mb-6">{step.description}</p>
                
                <ul className="space-y-2">
                  {[1, 2, 3].map((item) => (
                    <li key={item} className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-fundhub-blue mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">
                        {index === 0 && item === 1 && "Complete your profile in under 10 minutes"}
                        {index === 0 && item === 2 && "Verify your identity securely"}
                        {index === 0 && item === 3 && "Add team members and company details"}
                        
                        {index === 1 && item === 1 && "Connect to Xero, QuickBooks, or Sage"}
                        {index === 1 && item === 2 && "Automatically import financial statements"}
                        {index === 1 && item === 3 && "Share only the data you choose"}
                        
                        {index === 2 && item === 1 && "Specify loan amount, term, and purpose"}
                        {index === 2 && item === 2 && "Add supporting documents"}
                        {index === 2 && item === 3 && "Review and submit"}
                        
                        {index === 3 && item === 1 && "Receive notifications for new offers"}
                        {index === 3 && item === 2 && "Compare rates, terms, and conditions"}
                        {index === 3 && item === 3 && "Contact lenders with questions"}
                        
                        {index === 4 && item === 1 && "Side-by-side offer comparison"}
                        {index === 4 && item === 2 && "Digital documentation and signing"}
                        {index === 4 && item === 3 && "Funds directly to your account"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-16">
          <Button size="lg" className="bg-fundhub-blue hover:bg-fundhub-blue/90" asChild>
            <Link to="/signup">
              Get Started Now
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
