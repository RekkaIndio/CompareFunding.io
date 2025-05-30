import React from 'react';
import { 
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { TrendingUp } from 'lucide-react';

interface CreditScoreCardProps {
  application: any;
}

const CreditScoreCard: React.FC<CreditScoreCardProps> = ({ application }) => {
  if (!application) return null;

  return (
    <Card className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="bg-[#212936] text-white rounded-t-lg">
        <CardTitle className="flex items-center">
          <TrendingUp className="mr-2 h-5 w-5 text-[#ff8000]" />
          <span className="text-white">Credit Assessment</span>
        </CardTitle>
        <CardDescription className="text-gray-200">
          Business credit score and risk assessment
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        {application?.business?.credit_info?.credit_score ? (
          <div className="text-center py-4">
            <div className="flex flex-col items-center justify-center mb-4">
              {/* Circular Credit Score Indicator */}
              <div className="relative w-24 h-24 flex items-center justify-center mb-2">
                <svg width="96" height="96" viewBox="0 0 96 96">
                  <circle
                    cx="48" cy="48" r="44"
                    fill="#fff"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                  />
                  <circle
                    cx="48" cy="48" r="44"
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="8"
                    strokeDasharray={2 * Math.PI * 44}
                    strokeDashoffset={2 * Math.PI * 44 * (1 - (Number(application.business.credit_info.credit_score) / 100))}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.5s' }}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-green-700">
                  {application.business.credit_info.credit_score}
                </span>
              </div>
              <p className="text-sm text-green-600">Business Credit Score</p>
              {application.business.credit_info.risk && (
                <p className="text-sm font-medium text-green-700 mt-1">{application.business.credit_info.risk}</p>
              )}
            </div>
            <Badge variant="default" className="bg-green-600 text-white shadow-sm">Score Available</Badge>
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="bg-orange-50/80 border border-orange-200/70 rounded-lg p-4 mb-4">
              <p className="font-medium text-orange-800">Credit score not available</p>
              <p className="text-sm text-orange-600 mt-1">Other factors will be used to evaluate this application</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CreditScoreCard;
