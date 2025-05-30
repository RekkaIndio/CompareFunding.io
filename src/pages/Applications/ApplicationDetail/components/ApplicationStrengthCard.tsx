import React from 'react';
import { 
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from "@/components/ui/card";
import { Shield, Loader2 } from 'lucide-react';

interface ApplicationStrengthCardProps {
  application: any;
}

const ApplicationStrengthCard: React.FC<ApplicationStrengthCardProps> = ({ application }) => {
  if (!application) return null;

  return (
    <Card className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="bg-[#212936] text-white rounded-t-lg">
        <CardTitle className="flex items-center">
          <Shield className="mr-2 h-5 w-5 text-[#ff8000]" />
          <span className="text-white">Application Strength</span>
        </CardTitle>
        <CardDescription className="text-gray-200">
          Overall application strength assessment
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex flex-col items-center">
          {/* Circular Progress Indicator */}
          <div className="relative w-36 h-36 mb-4">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="8"
              />
              
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={
                  !application.completeness_percentage ? "#f97316" :
                  application.completeness_percentage < 50 ? "#f97316" : 
                  application.completeness_percentage < 75 ? "#facc15" : 
                  application.completeness_percentage < 100 ? "#22c55e" : 
                  "#10b981"
                } 
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - (application.completeness_percentage || 0) / 100)}`}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            
            {/* Percentage in Middle */}
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-4xl font-bold text-[#212936]">
                {application.completeness_percentage || 0}%
              </span>
              <span className="text-sm font-medium text-gray-500">Strength</span>
            </div>
          </div>
          
          <div className="text-center w-full">
            <div className="flex justify-center items-center mb-2">
              <div className="h-2 w-2 mr-1.5 rounded-full bg-[#ff8000]"></div>
              <span className="text-slate-700 text-sm font-medium">
                Application Strength Indicators
              </span>
            </div>
            
            {/* Missing items - only show if not 100% complete */}
            {application.completeness_percentage !== 100 && (
              <div className="mt-2 px-4">
                {!application.businesses && (
                  <div className="bg-amber-50 border border-amber-200/70 rounded-lg p-2 mb-2 flex items-center">
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500 mr-2"></div>
                    <p className="text-amber-800 text-xs font-medium">Business profile incomplete</p>
                  </div>
                )}
                {!application.credit_score && (
                  <div className="bg-amber-50 border border-amber-200/70 rounded-lg p-2 mb-2 flex items-center">
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500 mr-2"></div>
                    <p className="text-amber-800 text-xs font-medium">Credit score missing</p>
                  </div>
                )}
                {!application.has_documents && (
                  <div className="bg-amber-50 border border-amber-200/70 rounded-lg p-2 mb-2 flex items-center">
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500 mr-2"></div>
                    <p className="text-amber-800 text-xs font-medium">Financial documents missing</p>
                  </div>
                )}
              </div>
            )}
            
            {/* Complete application */}
            {application.completeness_percentage === 100 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-2 mx-4">
                <p className="text-green-800 text-sm font-medium">
                  ✓ Application complete
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ApplicationStrengthCard;
