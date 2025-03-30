
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, BarChart, LineChart, PoundSterling, Clock } from 'lucide-react';

const HeroSection = () => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-white to-fundhub-light-blue pt-28 pb-20 md:pt-32 md:pb-28">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 right-0 h-[500px] overflow-hidden opacity-10 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-fundhub-blue rounded-full filter blur-3xl opacity-20 -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-fundhub-navy rounded-full filter blur-3xl opacity-10 translate-x-1/2 -translate-y-1/2"></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-white shadow-sm border border-gray-100 mb-6 animate-fade-in">
              <span className="h-2 w-2 rounded-full bg-fundhub-success mr-2"></span>
              <span className="text-sm text-muted-foreground">UK Debt Financing Made Simple</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-fundhub-navy mb-6 animate-slide-up">
              Business Funding <br className="hidden sm:block" />
              <span className="text-fundhub-blue">Made Simple</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
              Connect directly with lenders through our transparent financing platform. Lower costs, faster funding, better rates.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start space-y-4 sm:space-y-0 sm:space-x-4 animate-slide-up" style={{ animationDelay: '200ms' }}>
              <Button 
                size="lg" 
                className={`bg-fundhub-blue hover:bg-fundhub-blue/90 text-white px-8 transition-all duration-500 ${isHovered ? 'shadow-lg shadow-fundhub-blue/20' : ''}`}
                asChild
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                <Link to="/signup">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              
              <Button variant="outline" size="lg" asChild>
                <Link to="/how-it-works">
                  How It Works
                </Link>
              </Button>
            </div>
            
            <div className="flex flex-wrap justify-center lg:justify-start mt-10 gap-6 animate-slide-up" style={{ animationDelay: '300ms' }}>
              <div className="flex items-center">
                <div className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm">
                  <BarChart className="h-5 w-5 text-fundhub-blue" />
                </div>
                <p className="ml-3 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">£250M+</span> Facilitated
                </p>
              </div>
              
              <div className="flex items-center">
                <div className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm">
                  <PoundSterling className="h-5 w-5 text-fundhub-blue" />
                </div>
                <p className="ml-3 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">120+</span> Lenders
                </p>
              </div>
              
              <div className="flex items-center">
                <div className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm">
                  <Clock className="h-5 w-5 text-fundhub-blue" />
                </div>
                <p className="ml-3 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">24hr</span> Average Decision
                </p>
              </div>
            </div>
          </div>
          
          <div className="relative h-[500px] hidden lg:block">
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Dashboard mockup */}
              <div className="relative w-full max-w-lg aspect-[4/3] bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200 animate-slide-in-right">
                <div className="absolute inset-0 p-4 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium">Dashboard</h3>
                    <div className="w-8 h-8 rounded-full bg-fundhub-light-blue flex items-center justify-center">
                      <span className="text-sm font-medium text-fundhub-blue">JS</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-fundhub-light-blue rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Total Funding</p>
                      <p className="text-lg font-semibold">£164,750</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Applications</p>
                      <p className="text-lg font-semibold">3</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Offers</p>
                      <p className="text-lg font-semibold">5</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg flex-1 p-4 mb-4">
                    <p className="text-sm font-medium mb-3">Recent Activity</p>
                    <div className="space-y-2">
                      <div className="bg-white rounded p-2 flex justify-between items-center">
                        <div>
                          <p className="text-xs font-medium">Invoice Finance</p>
                          <p className="text-xs text-muted-foreground">Approved</p>
                        </div>
                        <p className="text-sm font-medium">£48,500</p>
                      </div>
                      <div className="bg-white rounded p-2 flex justify-between items-center">
                        <div>
                          <p className="text-xs font-medium">Equipment Finance</p>
                          <p className="text-xs text-muted-foreground">Pending</p>
                        </div>
                        <p className="text-sm font-medium">£35,000</p>
                      </div>
                      <div className="bg-white rounded p-2 flex justify-between items-center">
                        <div>
                          <p className="text-xs font-medium">Working Capital Loan</p>
                          <p className="text-xs text-muted-foreground">Completed</p>
                        </div>
                        <p className="text-sm font-medium">£75,000</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <button className="text-xs text-fundhub-blue px-3 py-1 rounded-full bg-fundhub-light-blue">New Application</button>
                    <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-fundhub-blue"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-200"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-200"></div>
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
