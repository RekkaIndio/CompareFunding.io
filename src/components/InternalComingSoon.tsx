import React from 'react';
import { Clock, ArrowLeft, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import PageLayout from '@/components/PageLayout';

interface InternalComingSoonProps {
  title: string;
  description?: string;
  expectedLaunch?: string;
  features?: string[];
  showBackButton?: boolean;
  backPath?: string;
}

const InternalComingSoon: React.FC<InternalComingSoonProps> = ({
  title,
  description = "We're working hard to bring you this feature.",
  expectedLaunch,
  features = [],
  showBackButton = true,
  backPath = '/business/dashboard'
}) => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(backPath);
  };

  return (
    <PageLayout fullWidth>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center py-12 px-4">
        <div className="text-center max-w-2xl mx-auto">
          {/* Icon */}
          <div className="mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-[#ff8800] to-[#ffaa00] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Clock className="text-white" size={48} />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-6">
            {title}
          </h1>
          
          {/* Coming Soon Badge */}
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#ff8800] to-[#ffaa00] text-white px-6 py-3 rounded-full text-lg font-semibold mb-8 shadow-lg">
            <Bell size={20} />
            Coming Soon
          </div>

          {/* Description */}
          <p className="text-xl text-slate-600 mb-8 leading-relaxed">
            {description}
          </p>
          
          {/* Expected Launch */}
          {expectedLaunch && (
            <p className="text-lg text-slate-500 mb-8">
              Expected launch: <span className="font-semibold text-slate-700">{expectedLaunch}</span>
            </p>
          )}

          {/* Features Preview */}
          {features.length > 0 && (
            <div className="mb-12">
              <h3 className="text-xl font-semibold text-slate-800 mb-4">What's coming:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto">
                {features.map((feature, index) => (
                  <div key={index} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                    <p className="text-slate-600">{feature}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {showBackButton && (
              <Button 
                onClick={handleGoBack}
                variant="outline"
                className="inline-flex items-center gap-2 px-6 py-3 text-lg border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                <ArrowLeft size={20} />
                Go Back
              </Button>
            )}
            
            <Button
              onClick={() => navigate('/support-flow')}
              className="bg-gradient-to-r from-[#ff8800] to-[#ffaa00] hover:from-[#ff9900] hover:to-[#ffbb00] text-white px-6 py-3 text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              Get Notified When Available
            </Button>
          </div>

          {/* Additional Help */}
          <p className="text-sm text-slate-500 mt-8">
            Need help with something else? Contact our support team for assistance.
          </p>
        </div>
      </div>
    </PageLayout>
  );
};

export default InternalComingSoon;
