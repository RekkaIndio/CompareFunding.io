import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShieldCheck, AlertCircle, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

// CircularProgress component for credit score
interface CircularProgressProps {
  value: number | string;
  max?: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  valueClassName?: string;
  valueSize?: string;
  riskLevel: 'very-low' | 'low' | 'moderate' | 'high' | 'very-high' | 'not-scored';
  label?: React.ReactNode;
}

const getColorForRisk = (risk: string): string => {
  switch (risk) {
    case 'very-low': return 'stroke-emerald-500';
    case 'low': return 'stroke-green-500';
    case 'moderate': return 'stroke-green-500';
    case 'high': return 'stroke-red-500';
    case 'very-high': return 'stroke-red-600';
    default: return 'stroke-slate-400';
  }
};

const getTextColorForRisk = (risk: string): string => {
  switch (risk) {
    case 'very-low': return 'text-emerald-500';
    case 'low': return 'text-green-500';
    case 'moderate': return 'text-green-500';
    case 'high': return 'text-red-500';
    case 'very-high': return 'text-red-600';
    default: return 'text-slate-400';
  }
};

const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  max = 100,
  size = 180,
  strokeWidth = 12,
  className,
  valueClassName,
  valueSize = 'text-6xl',
  riskLevel,
  label
}) => {
  // CSS variables for risk level colors
  const riskColors = {
    'very-low': 'rgb(16, 185, 129)', // emerald-500
    'low': 'rgb(34, 197, 94)', // green-500
    'moderate': 'rgb(34, 197, 94)', // green-500
    'high': 'rgb(239, 68, 68)', // red-500
    'very-high': 'rgb(220, 38, 38)', // red-600
    'not-scored': 'rgb(100, 116, 139)' // slate-600
  };
  // Calculate percentage and angle for the arc
  const numericValue = typeof value === 'number' ? value : 0;
  const percentage = max > 0 ? (numericValue / max) * 100 : 0;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = ((100 - percentage) / 100) * circumference;

  // Get color based on risk level
  const strokeColor = getColorForRisk(riskLevel);
  
  // Handle special display for text values (like "Unknown")
  const isTextValue = typeof value === 'string' && isNaN(Number(value));

  // Get matching text color based on risk level (for the number)
  const textColor = getTextColorForRisk(riskLevel);
  
  return (
    <div 
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{
        '--very-low-color': riskColors['very-low'],
        '--low-color': riskColors['low'],
        '--moderate-color': riskColors['moderate'],
        '--high-color': riskColors['high'],
        '--very-high-color': riskColors['very-high'],
        '--not-scored-color': riskColors['not-scored'],
      } as React.CSSProperties}
    >
      {/* SVG for the circle */}
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke="#e5e7eb"
          fill="white"
        />
        
        {/* Foreground circle (progress) - only show for numeric values */}
        {!isTextValue && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            stroke="currentColor"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={strokeColor}
          />
        )}
      </svg>
      
      {/* Central text with value */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span 
          className={cn(
            "font-bold", 
            isTextValue ? "text-2xl" : valueSize,
            valueClassName
          )}
          style={{color: riskColors[riskLevel]}}
        >
          {value}
        </span>
        {label && (
          <div className="mt-1">{label}</div>
        )}
      </div>
    </div>
  );
};

interface CreditScoreCardProps {
  creditScore: {
    score: number | string;
    provider?: string;
    status?: string;
    lastUpdated?: string | number | Date;
    details?: any;
    businessType?: 'established' | 'new' | 'international';
  } | null;
}

// Helper to format date
const formatDate = (dateInput: string | number | Date | undefined) => {
  if (!dateInput) return 'N/A';
  
  // If it's a date string, convert it to a more readable format
  try {
    const date = new Date(dateInput);
    return date.toLocaleDateString('en-GB', { 
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return String(dateInput);
  }
};

export const CreditScoreCard: React.FC<CreditScoreCardProps> = ({ creditScore }) => {
  // Extract the score value from credit details
  let scoreValue;
  
  // Try to get score from different possible locations in the data structure
  if (creditScore?.details?.credit_score) {
    // If score exists in details.credit_score
    scoreValue = creditScore.details.credit_score;
  } else if (creditScore?.details?.score) {
    // If score exists in details.score
    scoreValue = creditScore.details.score;
  } else if (creditScore?.score) {
    // Fallback to the top-level score property
    scoreValue = creditScore.score;
  }
  
  // Convert string scores to numbers when possible
  const numericScore = scoreValue && !isNaN(Number(scoreValue)) ? Number(scoreValue) : null;
  
  // Get the letter score if it's international
  const letterScore = typeof scoreValue === 'string' && 
                      isNaN(Number(scoreValue)) && 
                      scoreValue !== "Unknown" ? scoreValue : null;
                      
  // Handle unknown score
  const isUnknown = scoreValue === "Unknown" || scoreValue === undefined || scoreValue === null;

  const provider = creditScore?.provider || 'Credit Provider';
  const lastUpdated = formatDate(creditScore?.lastUpdated);
  
  // Determine business type based on status or explicit businessType
  const companyStatus = creditScore?.details?.company_status || creditScore?.status;
  
  const isNewlyIncorporated = creditScore?.businessType === 'new' || 
    companyStatus?.toLowerCase().includes('new') || 
    companyStatus?.toLowerCase().includes('incorporated') ||
    companyStatus?.toLowerCase().includes('active - newly');
  
  const isInternational = creditScore?.businessType === 'international' ||
    creditScore?.details?.international_score ||
    creditScore?.details?.international_value ||
    letterScore !== null;
  
  // Function to get score data based on the business type and score
  const getScoreData = () => {
    // For international scores (A-E)
    if (isInternational && letterScore) {
      switch(letterScore.toUpperCase()) {
        case 'A': return { text: 'Very Low Risk', riskLevel: 'very-low' as const, badge: 'A - Very Low Risk' };
        case 'B': return { text: 'Low Risk', riskLevel: 'low' as const, badge: 'B - Low Risk' };
        case 'C': return { text: 'Moderate Risk', riskLevel: 'moderate' as const, badge: 'C - Moderate Risk' };
        case 'D': return { text: 'High Risk', riskLevel: 'high' as const, badge: 'D - High Risk' };
        case 'E': return { text: 'Not Scored', riskLevel: 'not-scored' as const, badge: 'E - Not Scored' };
        default: return { text: 'Unknown', riskLevel: 'not-scored' as const, badge: 'Unknown' };
      }
    }
    
    // No score available
    if (numericScore === null) {
      return { text: 'Not Scored', riskLevel: 'not-scored' as const, badge: 'Not Scored' };
    }

    // Newly incorporated businesses
    if (isNewlyIncorporated) {
      if (numericScore >= 51 && numericScore <= 100)
        return { text: 'Low Risk', riskLevel: 'low' as const, badge: 'Low Risk' };
      if (numericScore >= 30 && numericScore <= 50)
        return { text: 'Moderate Risk', riskLevel: 'moderate' as const, badge: 'Moderate Risk' };
      if (numericScore >= 1 && numericScore <= 29)
        return { text: 'Caution - High Risk', riskLevel: 'high' as const, badge: 'Caution - High Risk' };
      return { text: 'Not Scored', riskLevel: 'not-scored' as const, badge: 'Not Scored' };
    }
    
    // Established businesses with financials filed
    if (numericScore >= 71 && numericScore <= 100)
      return { text: 'Very Low Risk', riskLevel: 'very-low' as const, badge: 'Very Low Risk' };
    if (numericScore >= 51 && numericScore <= 70)
      return { text: 'Low Risk', riskLevel: 'low' as const, badge: 'Low Risk' };
    if (numericScore >= 30 && numericScore <= 50)
      return { text: 'Moderate Risk', riskLevel: 'moderate' as const, badge: 'Moderate Risk' };
    if (numericScore >= 21 && numericScore <= 29)
      return { text: 'High Risk', riskLevel: 'high' as const, badge: 'High Risk' };
    if (numericScore >= 1 && numericScore <= 20)
      return { text: 'Very High Risk', riskLevel: 'very-high' as const, badge: 'Very High Risk' };
    
    // Fallback
    return { text: 'Not Scored', riskLevel: 'not-scored' as const, badge: 'Not Scored' };
  };

  const scoreData = getScoreData();
  const businessCategory = isNewlyIncorporated 
    ? 'Newly Incorporated' 
    : isInternational 
      ? 'International Business' 
      : 'Established Business';

  // Get badge color based on risk level
  const getBadgeColor = () => {
    switch(scoreData.riskLevel) {
      case 'very-low':
      case 'low':
      case 'moderate':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'high':
      case 'very-high':
        return 'bg-red-100 text-red-800 hover:bg-red-100';
      default:
        return 'bg-slate-100 text-slate-800 hover:bg-slate-100';
    }
  };

  return (
    <Card className="bg-[#1d2432] shadow-lg rounded-xl overflow-hidden border-0">
      <CardHeader className="bg-[#1d2432] text-white p-5">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl font-semibold text-white">Credit Score</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-5 w-5 text-slate-400 hover:text-white cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-sm">
                <div className="text-xs">
                  <p className="font-medium mb-1">Score Range Information:</p>
                  {isNewlyIncorporated ? (
                    <div className="space-y-1">
                      <p className="font-medium">Newly Incorporated:</p>
                      <p>51-100: Low Risk</p>
                      <p>30-50: Moderate Risk</p>
                      <p>1-29: Caution - High Risk</p>
                    </div>
                  ) : isInternational ? (
                    <div className="space-y-1">
                      <p className="font-medium">International Business:</p>
                      <p>A: Very Low Risk</p>
                      <p>B: Low Risk</p>
                      <p>C: Moderate Risk</p>
                      <p>D: High Risk</p>
                      <p>E: Not Scored</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="font-medium">Established Business:</p>
                      <p>71-100: Very Low Risk</p>
                      <p>51-70: Low Risk</p>
                      <p>30-50: Moderate Risk</p>
                      <p>21-29: High Risk</p>
                      <p>1-20: Very High Risk</p>
                    </div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent className="p-6 flex flex-col items-center pb-8">
        {creditScore ? (
          <>
            <div className="flex flex-col items-center justify-center mb-4">
              {isUnknown ? (
                <CircularProgress
                  value="Unknown"
                  riskLevel="not-scored"
                  valueSize="text-2xl"
                  className="mb-3"
                  label={
                    <span className="mt-1 text-sm text-slate-400">•</span>
                  }
                />
              ) : isInternational && letterScore ? (
                <CircularProgress
                  value={letterScore}
                  riskLevel={scoreData.riskLevel}
                  valueSize="text-7xl"
                  className="mb-3"
                  label={
                    <Badge className={cn("mt-1 font-medium border-0", getBadgeColor())}>
                      {scoreData.text}
                    </Badge>
                  }
                />
              ) : (
                <CircularProgress
                  value={numericScore}
                  riskLevel={scoreData.riskLevel}
                  valueSize="text-7xl"
                  className="mb-3"
                  label={
                    <Badge className={cn("mt-1 font-medium border-0", getBadgeColor())}>
                      {scoreData.text}
                    </Badge>
                  }
                />
              )}
              <div className="text-slate-300 text-sm mt-4">
                Last updated: {lastUpdated}
              </div>
            </div>
            
            <div className="w-full mt-6 border-t border-gray-700 pt-4">
              <h4 className="text-base font-medium mb-3 text-slate-300">Credit Details:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Business Status */}
                <div className="bg-[#1a2030] p-4 rounded-md border border-slate-700/50">
                  <h5 className="text-xs uppercase tracking-wider text-slate-400 mb-1">Business Status</h5>
                  <p className="text-sm text-white font-medium">{companyStatus || 'Unknown'}</p>
                </div>

                {/* Credit Limit */}
                <div className="bg-[#1a2030] p-4 rounded-md border border-slate-700/50">
                  <h5 className="text-xs uppercase tracking-wider text-slate-400 mb-1">Credit Limit</h5>
                  <p className="text-sm text-white font-medium">
                    {creditScore?.details?.credit_limit ? `£${creditScore.details.credit_limit}` : 'N/A'}
                  </p>
                </div>
                
                {/* Business Category */}
                <div className="bg-[#1a2030] p-4 rounded-md border border-slate-700/50">
                  <h5 className="text-xs uppercase tracking-wider text-slate-400 mb-1">Business Category</h5>
                  <p className="text-sm text-white font-medium">{businessCategory}</p>
                </div>
                
                {/* Risk Level */}
                <div className="bg-[#1a2030] p-4 rounded-md border border-slate-700/50">
                  <h5 className="text-xs uppercase tracking-wider text-slate-400 mb-1">Risk Level</h5>
                  <Badge className={cn("mt-1 font-medium border-0", getBadgeColor())}>
                    {scoreData.text}
                  </Badge>
                </div>
                
                {/* Last Updated */}
                <div className="bg-[#1a2030] p-4 rounded-md border border-slate-700/50 col-span-full">
                  <h5 className="text-xs uppercase tracking-wider text-slate-400 mb-1">Last Updated</h5>
                  <p className="text-sm text-white font-medium">{lastUpdated}</p>
                </div>

                {/* Additional Info (If Available) */}
                {creditScore?.details?.negative_information !== undefined && (
                  <div className="bg-[#1a2030] p-4 rounded-md border border-slate-700/50 col-span-full">
                    <h5 className="text-xs uppercase tracking-wider text-slate-400 mb-1">Negative Information</h5>
                    <p className="text-sm text-white">
                      {creditScore.details.negative_information ? 
                        'Yes - This business has negative credit information' : 
                        'No negative information reported'}
                    </p>
                  </div>
                )}
                
                {/* Commentaries (If Available) */}
                {creditScore?.details?.details?.commentaries && (
                  <div className="bg-[#1a2030] p-4 rounded-md border border-slate-700/50 col-span-full">
                    <h5 className="text-xs uppercase tracking-wider text-slate-400 mb-1">Credit Commentary</h5>
                    <ul className="text-sm text-white list-disc pl-4 space-y-2 mt-1">
                      {Array.isArray(creditScore.details.details.commentaries) ? 
                        creditScore.details.details.commentaries.map((comment: any, idx: number) => (
                          <li key={idx}>{comment.commentaryText || 'No details provided'}</li>
                        )) : 
                        <li>No commentary available</li>
                      }
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-10">
            <AlertCircle className="mx-auto h-16 w-16 text-slate-600 mb-4" />
            <p className="text-slate-300 font-medium text-lg">Credit Score Not Available</p>
            <p className="text-sm text-slate-400">This business has not provided credit score information yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}