import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PageLayout from '@/components/PageLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const FundingMatches = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [userInfo] = useState(location.state || {});
  
  // Simplified matches data - just counts
  const [matches] = useState({
    loans: Array(10).fill({}),
    equity: Array(2).fill({}),
    grants: Array(2).fill({})
  });
  
  // Function to navigate back
  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-white">
      <PageLayout className="bg-transparent">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-5xl mx-auto">
            <div className="mb-16">
              <h1 className="flex items-center text-3xl md:text-4xl font-bold text-[#2a3441] mb-6">
                <button 
                  onClick={handleGoBack} 
                  className="text-[#ff8000] mr-3 text-4xl hover:text-[#e67300] transition-colors"
                  aria-label="Go back"
                >
                  ←
                </button>
                Here are your potential matches
              </h1>
            </div>
            
            {/* Summary Cards - Styled with orange accents */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
              <Card className="p-8 bg-white shadow-xl rounded-lg border-none text-center overflow-hidden transform transition-transform hover:translate-y-[-5px]">
                <div className="flex flex-col items-center">
                  <h2 className="text-7xl font-bold text-[#ff8000] mb-3">{matches.loans.length}</h2>
                  <p className="text-xl text-[#2a3441]">Loans</p>
                </div>
              </Card>
              
              <Card className="p-8 bg-white shadow-xl rounded-lg border-none text-center overflow-hidden transform transition-transform hover:translate-y-[-5px]">
                <div className="flex flex-col items-center">
                  <h2 className="text-7xl font-bold text-[#ff8000] mb-3">{matches.equity.length}</h2>
                  <p className="text-xl text-[#2a3441]">Equity</p>
                </div>
              </Card>
              
              <Card className="p-8 bg-white shadow-xl rounded-lg border-none text-center overflow-hidden transform transition-transform hover:translate-y-[-5px]">
                <div className="flex flex-col items-center">
                  <h2 className="text-7xl font-bold text-[#ff8000] mb-3">{matches.grants.length}</h2>
                  <p className="text-xl text-[#2a3441]">Grants</p>
                </div>
              </Card>
            </div>
            
            {/* Single CTA Button - Updated to match orange theme */}
            <div className="text-center mb-24">
              <Button 
                onClick={handleGoBack}
                className="bg-[#ff8000] hover:bg-[#e67300] text-white px-14 py-5 text-lg h-auto rounded-full font-medium shadow-md transition-all hover:shadow-lg hover:scale-[1.02]"
              >
                Go Back
              </Button>
            </div>
            
            {/* Disclaimer Text */}
            <div className="max-w-3xl mx-auto text-center text-sm text-[#2a3441]/70">
              <p className="mb-4">
                Compare Funding is a credit broker and does not provide capital. We work with a range of companies to offer clear 
                comparisons that allow customers to make choices on financial products & services.
              </p>
              <p>
                Compare Funding may receive a commission, which may vary by product but typically in the form of a fixed percentage of the 
                loan amount. For certain lenders, we do have influence over the interest rate, and this can impact the 
                amount you pay under the agreement.
              </p>
            </div>
          </div>
        </div>
      </PageLayout>
    </div>
  );
};

export default FundingMatches;
