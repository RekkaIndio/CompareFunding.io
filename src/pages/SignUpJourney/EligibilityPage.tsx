import { useNavigate } from 'react-router-dom';
import PageLayout from '@/components/PageLayout';
import { Button } from '@/components/ui/button';
import { ArrowRight, Check } from 'lucide-react';
import { Card } from '@/components/ui/card';

// Custom animations
const animationStyles = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.8s ease-out forwards;
  }
  
  @keyframes slideIn {
    from { transform: translateX(-20px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  .animate-slideIn {
    animation: slideIn 0.6s ease-out forwards;
  }
  
  .delay-100 { animation-delay: 0.1s; }
  .delay-200 { animation-delay: 0.2s; }
  .delay-300 { animation-delay: 0.3s; }
  .delay-400 { animation-delay: 0.4s; }
  .delay-500 { animation-delay: 0.5s; }
`;

// Import lender logos
import barclaysLogo from '@/assets/lenderlogos/barclyays.png';
import hsbcLogo from '@/assets/lenderlogos/hsbclogo.png';
import lloydsLogo from '@/assets/lenderlogos/lloydslogo.png';
import natwestLogo from '@/assets/lenderlogos/natwestlogo.png';
import santanderLogo from '@/assets/lenderlogos/santanderlogo.png';

const EligibilityPage = () => {
  const navigate = useNavigate();

  // Ensure navigation goes to the correct next step
  const handleNext = () => {
    navigate('/business/documents');
  };
  
  const lenders = [
    { name: 'Barclays', logo: barclaysLogo },
    { name: 'HSBC', logo: hsbcLogo },
    { name: 'Lloyds', logo: lloydsLogo },
    { name: 'NatWest', logo: natwestLogo },
    { name: 'Santander', logo: santanderLogo },
  ];

  return (
    <div className="bg-white min-h-screen">
      <style>{animationStyles}</style>
      <PageLayout>
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-6xl mx-auto">            
            <div className="animate-fadeIn">
              <h1 className="text-3xl md:text-5xl font-bold text-[#2a3441] mb-6 text-center">
                Excellent News!
              </h1>
              <div className="flex flex-col md:flex-row justify-center items-center mb-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mr-0 md:mr-4 mb-4 md:mb-0">
                  <Check className="w-8 h-8 text-green-500" />
                </div>
                <p className="text-xl text-[#2a3441] text-center md:text-left">
                  Your business qualifies for funding options from these trusted lenders.<br/>
                  <span className="text-[#ff8000] font-medium">You're just a few steps away from receiving offers.</span>
                </p>
              </div>
            </div>
            
            <div className="p-4 mb-10">
              <div className="flex flex-nowrap space-x-6 overflow-x-auto py-4 px-2 justify-between">
                {lenders.map((lender, index) => {
                  // Define lender-specific funding options
                  const lenderInfo = {
                    'Barclays': { products: ['Business Loans', 'Overdraft'], range: '£10,000 - £1M' },
                    'HSBC': { products: ['Trade Finance', 'Commercial Mortgage'], range: '£25,000 - £2M' },
                    'Lloyds': { products: ['Asset Finance', 'Working Capital'], range: '£15,000 - £3M' },
                    'NatWest': { products: ['Startup Loans', 'Invoice Finance'], range: '£5,000 - £500K' },
                    'Santander': { products: ['Growth Capital', 'Equipment Finance'], range: '£20,000 - £750K' },
                  };
                  
                  const info = lenderInfo[lender.name as keyof typeof lenderInfo];
                  
                  return (
                    <Card 
                      key={lender.name} 
                      className={`p-8 flex-shrink-0 w-[180px] flex flex-col items-center justify-center bg-white shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer border border-[#ff8000] hover:border-2 relative group overflow-hidden animate-slideIn delay-${(index + 1) * 100}`}
                    >
                      <div className="h-28 flex items-center justify-center mb-4 group-hover:opacity-30 transition-opacity duration-300">
                        <img 
                          src={lender.logo} 
                          alt={`${lender.name} logo`} 
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      <p className="font-medium text-center text-[#2a3441] text-lg group-hover:opacity-30 transition-opacity duration-300">{lender.name}</p>
                      
                      {/* Info overlay that appears on hover */}
                      <div className="absolute inset-0 bg-white p-4 flex flex-col justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <p className="font-bold text-[#ff8000] text-sm mb-2">Available Products:</p>
                        <ul className="text-xs text-center mb-2">
                          {info.products.map((product, idx) => (
                            <li key={idx} className="mb-1">{product}</li>
                          ))}
                        </ul>
                        <p className="text-xs font-medium">Funding Range:</p>
                        <p className="text-xs">{info.range}</p>
                      </div>
                    </Card>
                  );
                })}
              </div>
              
              <div className="mt-10 bg-gradient-to-r from-[#fff8f0] to-white p-6 rounded-lg border border-[#ff8000] shadow-sm">
                <div className="flex flex-col md:flex-row items-start md:items-center">
                  <div className="bg-[#ff8000] rounded-full p-3 text-white mr-0 md:mr-4 mb-4 md:mb-0 flex-shrink-0">
                    <ArrowRight className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-[#2a3441] font-bold text-xl mb-2">Complete Your Application</h3>
                    <p className="text-gray-700">
                      To receive personalized funding offers, we need a few business documents. This helps lenders make their best offers tailored to your specific situation.
                    </p>
                    <div className="mt-3 flex flex-wrap items-center">
                      <span className="bg-green-100 text-green-800 text-xs font-medium mr-2 mb-2 px-2.5 py-0.5 rounded-full flex items-center">
                        <Check className="w-3 h-3 mr-1" /> Fast process
                      </span>
                      <span className="bg-green-100 text-green-800 text-xs font-medium mr-2 mb-2 px-2.5 py-0.5 rounded-full flex items-center">
                        <Check className="w-3 h-3 mr-1" /> Secure upload
                      </span>
                      <span className="bg-green-100 text-green-800 text-xs font-medium mr-2 mb-2 px-2.5 py-0.5 rounded-full flex items-center">
                        <Check className="w-3 h-3 mr-1" /> Multiple offers
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-center justify-center mt-8">
              <Button
                onClick={handleNext}
                className="bg-[#ff8000] hover:bg-[#e67300] text-white px-10 py-6 text-xl rounded-full font-medium shadow-lg transition-all duration-300 hover:shadow-xl transform hover:scale-105 relative overflow-hidden group"
              >
                <span className="relative z-10">Continue to Documents <ArrowRight className="inline-block w-6 h-6 ml-2 transform group-hover:translate-x-1 transition-transform" /></span>
                <span className="absolute inset-0 bg-gradient-to-r from-[#ff8000] to-[#ff6000] opacity-0 group-hover:opacity-100 transition-opacity"></span>
              </Button>
              <p className="text-gray-500 mt-4 text-sm">Your information is secure and will only be shared with selected lenders.</p>
            </div>
          </div>
        </div>
      </PageLayout>
    </div>
  );
};

export default EligibilityPage;
