
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageLayout from '@/components/PageLayout';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

const HowItWorks = () => {
  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const businessSteps = [
    {
      title: 'Create Your Profile',
      description: 'Set up your business profile with key information about your company, financial needs, and funding preferences.',
      image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop&q=80',
      bullets: [
        'Complete your profile in under 10 minutes',
        'Verify your identity securely',
        'Add team members and company details'
      ]
    },
    {
      title: 'Connect Accounting',
      description: 'Securely link your accounting software to pre-fill your application with verified financial data.',
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80',
      bullets: [
        'Connect to Xero, QuickBooks, or Sage',
        'Automatically import financial statements',
        'Share only the data you choose'
      ]
    },
    {
      title: 'Submit Application',
      description: 'Complete your funding application with details about your business, funding needs, and purpose.',
      image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format&fit=crop&q=80',
      bullets: [
        'Specify funding amount, term, and purpose',
        'Add supporting documents',
        'Review and submit'
      ]
    },
    {
      title: 'Receive Offers',
      description: 'Get matched with suitable lenders who review your application and provide competitive funding offers.',
      image: 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=800&auto=format&fit=crop&q=80',
      bullets: [
        'Receive notifications for new offers',
        'Compare rates, terms, and conditions',
        'Contact lenders with questions'
      ]
    },
    {
      title: 'Compare & Accept',
      description: 'Compare offers side-by-side and accept the one that best meets your needs.',
      image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&auto=format&fit=crop&q=80',
      bullets: [
        'Side-by-side offer comparison',
        'Digital documentation and signing',
        'Funds directly to your account'
      ]
    }
  ];

  const lenderSteps = [
    {
      title: 'Create Lender Profile',
      description: 'Set up your lender profile with details about your funding products, criteria, and preferences.',
      image: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&auto=format&fit=crop&q=80',
      bullets: [
        'Complete your lender profile',
        'Set your lending criteria',
        'Define your target businesses'
      ]
    },
    {
      title: 'Purchase Credits',
      description: 'Select a subscription plan or pay-as-you-go package to acquire credits for making offers.',
      image: 'https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?w=800&auto=format&fit=crop&q=80',
      bullets: [
        'Choose from flexible pricing plans',
        'No commission structure',
        'Credits only used when making offers'
      ]
    },
    {
      title: 'Review Applications',
      description: 'Receive notifications for funding applications that match your criteria and review their details.',
      image: 'https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?w=800&auto=format&fit=crop&q=80',
      bullets: [
        'Access verified financial data',
        'Filter applications by criteria',
        'View detailed business profiles'
      ]
    },
    {
      title: 'Make Offers',
      description: 'Use credits to submit funding offers to businesses and communicate directly to close deals.',
      image: 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=800&auto=format&fit=crop&q=80',
      bullets: [
        'Submit competitive offers',
        'Customize terms and conditions',
        'Direct communication with businesses'
      ]
    },
    {
      title: 'Close Deals',
      description: 'Finalize the funding agreement directly with the business through our secure platform.',
      image: 'https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?w=800&auto=format&fit=crop&q=80',
      bullets: [
        'Digital documentation',
        'Secure communication',
        'Track deal status and conversions'
      ]
    }
  ];

  return (
    <PageLayout>
      <section className="py-8">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-6 animate-slide-up">How It Works</h1>
          <p className="text-xl text-muted-foreground mb-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
            Our platform simplifies the debt financing process for both businesses and lenders,
            creating transparent connections without the traditional broker model.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="flex justify-center mb-12">
          <div className="inline-flex rounded-lg overflow-hidden">
            <a href="#for-businesses" className="px-6 py-3 bg-fundhub-blue text-white font-medium">
              For Businesses
            </a>
            <a href="#for-lenders" className="px-6 py-3 bg-fundhub-light-blue text-fundhub-blue font-medium">
              For Lenders
            </a>
          </div>
        </div>

        <div id="for-businesses">
          <h2 className="text-2xl font-bold mb-12 text-center">For Businesses</h2>
          
          <div className="space-y-20">
            {businessSteps.map((step, index) => (
              <div key={index} className={`flex flex-col ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-12`}>
                <div className="w-full md:w-1/2">
                  <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 p-2">
                    <img 
                      src={step.image} 
                      alt={step.title} 
                      className="w-full h-auto rounded-lg"
                    />
                  </div>
                </div>
                
                <div className="w-full md:w-1/2">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-fundhub-blue flex items-center justify-center text-white font-medium">
                      {index + 1}
                    </div>
                    <div className="h-0.5 flex-1 bg-fundhub-blue/10 ml-4"></div>
                  </div>
                  
                  <h3 className="text-2xl font-bold mb-4">{step.title}</h3>
                  <p className="text-muted-foreground mb-6">{step.description}</p>
                  
                  <ul className="space-y-3">
                    {step.bullets.map((bullet, i) => (
                      <li key={i} className="flex items-start">
                        <CheckCircle2 className="h-5 w-5 text-fundhub-blue mr-2 mt-0.5 flex-shrink-0" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Button size="lg" className="bg-fundhub-blue hover:bg-fundhub-blue/90" asChild>
              <Link to="/signup">
                Create Business Account
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="my-20 border-t border-gray-200"></div>

        <div id="for-lenders">
          <h2 className="text-2xl font-bold mb-12 text-center">For Lenders</h2>
          
          <div className="space-y-20">
            {lenderSteps.map((step, index) => (
              <div key={index} className={`flex flex-col ${index % 2 !== 0 ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-12`}>
                <div className="w-full md:w-1/2">
                  <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 p-2">
                    <img 
                      src={step.image} 
                      alt={step.title} 
                      className="w-full h-auto rounded-lg"
                    />
                  </div>
                </div>
                
                <div className="w-full md:w-1/2">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-fundhub-navy flex items-center justify-center text-white font-medium">
                      {index + 1}
                    </div>
                    <div className="h-0.5 flex-1 bg-fundhub-navy/10 ml-4"></div>
                  </div>
                  
                  <h3 className="text-2xl font-bold mb-4">{step.title}</h3>
                  <p className="text-muted-foreground mb-6">{step.description}</p>
                  
                  <ul className="space-y-3">
                    {step.bullets.map((bullet, i) => (
                      <li key={i} className="flex items-start">
                        <CheckCircle2 className="h-5 w-5 text-fundhub-navy mr-2 mt-0.5 flex-shrink-0" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Button size="lg" className="bg-fundhub-navy hover:bg-fundhub-navy/90" asChild>
              <Link to="/signup">
                Register as a Lender
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-10 my-10 bg-fundhub-light-blue rounded-xl text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-fundhub-navy mb-6">Ready to get started?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join our platform today and experience a transparent, efficient approach to business funding.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Button 
              size="lg" 
              className="bg-fundhub-blue hover:bg-fundhub-blue/90 text-white" 
              asChild
            >
              <Link to="/signup">
                Create Free Account
              </Link>
            </Button>
            
            <Button 
              variant="outline" 
              size="lg" 
              className="border-fundhub-blue text-fundhub-blue hover:bg-fundhub-blue/10" 
              asChild
            >
              <Link to="/contact">
                Contact Us
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default HowItWorks;
