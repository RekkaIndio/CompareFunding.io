import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Shield } from 'lucide-react';

interface CreditScoreDisplayProps {
  creditScore: number | string;
  getCreditScoreRisk: (score: number | string) => string;
}

const CreditScoreDisplay: React.FC<CreditScoreDisplayProps> = ({ 
  creditScore, 
  getCreditScoreRisk 
}) => {
  // Convert credit score to number if it's a string that contains a number
  const numScore = typeof creditScore === 'string' ? 
    parseFloat(creditScore) : 
    creditScore;
  
  // Determine the color based on the score and reference document
  let color = '#A3A3A3'; // default gray for Not Scored
  if (numScore !== null && !isNaN(numScore)) {
    if (numScore >= 71) color = '#4CAF50'; // green for Very Low Risk
    else if (numScore >= 51) color = '#4CAF50'; // green for Low Risk
    else if (numScore >= 30) color = '#4CAF50'; // green for Moderate Risk
    else if (numScore >= 21) color = '#F44336'; // red for High Risk
    else if (numScore >= 1) color = '#F44336'; // red for Very High Risk
  }
  
  // Get risk level text
  const riskLevel = getCreditScoreRisk(creditScore);
  
  // Get explanation text based on score
  const getExplanationText = () => {
    if (numScore !== null && !isNaN(numScore)) {
      if (numScore >= 71) return 'Minimal risk, excellent financials and credit history.';
      if (numScore >= 51) return 'Low risk, strong financial performance metrics.';
      if (numScore >= 30) return 'Moderate risk, satisfactory financial indicators.';
      if (numScore >= 21) return 'Higher than average risk factors to consider.';
      if (numScore >= 1) return 'Significant risk factors requiring careful evaluation.';
    }
    return 'Not fully assessed for creditworthiness.';
  };
  
  return (
    <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-4 rounded-xl border border-slate-200 shadow-md hover:shadow-lg transition-all">
      {/* Credit score header with icon */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="bg-gradient-to-br from-[#212936] to-[#2c3c53] rounded-full p-2 shadow-md mr-2.5">
            <Shield className="h-4 w-4 text-[#ff8000]" />
          </div>
          <h3 className="font-semibold text-base text-[#212936]">Credit Assessment</h3>
        </div>
        
        {/* Risk level indicator badge */}
        <Badge 
          className={`text-xs px-1.5 py-0.5 ${
            numScore >= 30 ? 'bg-green-100 text-green-700 border-green-200' : 
            numScore >= 1 ? 'bg-red-100 text-red-700 border-red-200' :
            'bg-gray-100 text-gray-700 border-gray-200'
          }`}
        >
          {numScore >= 30 ? 
            'POSITIVE ASSESSMENT' : 
            numScore >= 1 ? 
            'CAUTION ADVISED' :
            'NOT ASSESSED'
          }
        </Badge>
      </div>
      
      <div className="flex items-center">
        {/* Credit score circle */}
        <div className="relative flex-shrink-0 mr-4">
          {/* Outer ring with glow effect */}
          <div className={`absolute inset-0 rounded-full ${
            numScore >= 30 ? 'bg-green-200/30' : 
            numScore >= 1 ? 'bg-red-200/30' : 
            'bg-gray-200/30'
          } blur-md`}></div>
          
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center shadow-md relative">
            <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-inner border" style={{ borderColor: `${color}30` }}>
              <span className="text-xl font-bold" style={{ color }}>
                {numScore !== null && !isNaN(numScore) ? Math.round(numScore) : '?'}
              </span>
            </div>
          </div>
          
          {/* Circular Progress with thicker stroke and animation */}
          <svg 
            className="absolute inset-0 -rotate-90" 
            width="64" 
            height="64" 
            viewBox="0 0 64 64"
          >
            <circle
              cx="32" cy="32" r="30"
              fill="none"
              stroke={color}
              strokeWidth="4"
              strokeDasharray={2 * Math.PI * 30}
              strokeDashoffset={2 * Math.PI * 30 * (1 - (
                numScore !== null && !isNaN(numScore) ? numScore / 100 : 0.5
              ))}
              strokeLinecap="round"
              style={{ 
                transition: 'stroke-dashoffset 1s ease-in-out',
                filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.2))'
              }}
            />
          </svg>
        </div>
        
        {/* Credit score info */}
        <div>
          <div className="mb-1.5">
            <span className="text-lg font-bold text-[#212936]">
              {riskLevel}
            </span>
          </div>
          
          {/* Credit score explanation */}
          <p className="text-xs text-slate-600 leading-tight">
            {getExplanationText()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CreditScoreDisplay;
