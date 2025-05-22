import { useNavigate } from 'react-router-dom';
import PageLayout from '@/components/PageLayout';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const EligibilityPage = () => {
  const navigate = useNavigate();

  // Ensure navigation goes to the correct next step
  const handleNext = () => {
    navigate('/signup-journey/business-details', { state: {} });
  };

  return (
    <div className="bg-white min-h-screen">
      <PageLayout>
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-[#2a3441] mb-6">
              Congratulations!
            </h1>
            <p className="text-lg text-[#2a3441] mb-8">
              You are eligible for our funding options. Let’s proceed to customise your offers.
            </p>
            <Button
              onClick={handleNext}
              className="bg-[#ff8000] hover:bg-[#e67300] text-white px-10 py-4 text-lg rounded-full font-medium shadow transition-transform hover:scale-[1.02]"
            >
              Continue <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </PageLayout>
    </div>
  );
};

export default EligibilityPage;
