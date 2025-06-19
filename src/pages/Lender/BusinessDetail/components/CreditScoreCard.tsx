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
        {/* Define gradients for each risk level */}
        <defs>
          <radialGradient id={`gradient-${riskLevel}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="70%" stopColor="white" stopOpacity="0.95" />
            <stop offset="100%" stopColor={riskColors[riskLevel]} stopOpacity="0.1" />
          </radialGradient>
        </defs>
        
        {/* Background circle with gradient fill */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke="#e5e7eb"
          fill={`url(#gradient-${riskLevel})`}
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
    last_updated?: string | number | Date; // normalized format
    updatedAt?: string | number | Date; // additional date field
    createdAt?: string | number | Date; // additional date field
    details?: any;
    businessType?: 'established' | 'new' | 'international';
    risk_level?: string; // normalized format
    credit_limit?: string | number; // normalized format
    negative_information?: boolean; // normalized format
    credit_score?: number | string; // raw Firebase field
    risk?: string; // raw Firebase field
  } | null;
  hmrcStatus?: {
    isUpToDate?: string;
    vatDetails?: {
      amount?: string;
      timeToPay?: string;
      details?: string;
    };
    corpTaxDetails?: {
      amount?: string;
      timeToPay?: string;
      details?: string;
    };
    payeDetails?: {
      amount?: string;
      timeToPay?: string;
      details?: string;
    };
    updatedAt?: any;
  } | null;
}

// Helper to format date
const formatDate = (dateInput: string | number | Date | undefined) => {
  if (!dateInput) return 'N/A';
  
  try {
    let date: Date;
    
    // Handle Firebase Timestamp objects
    if (dateInput && typeof dateInput === 'object' && 'seconds' in dateInput) {
      date = new Date((dateInput as any).seconds * 1000);
    }
    // Handle standard Date objects, ISO strings, or timestamps
    else {
      date = new Date(dateInput);
    }
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
    return date.toLocaleDateString('en-GB', { 
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  } catch (e) {
    return 'Invalid Date';
  }
};

export const CreditScoreCard: React.FC<CreditScoreCardProps> = ({ creditScore, hmrcStatus }) => {
  // Extract the score value from credit details
  let scoreValue;
  
  // Try to get score from different possible locations in the data structure
  if (creditScore?.score !== undefined && creditScore?.score !== null) {
    // First try the normalized data structure (top-level score)
    scoreValue = creditScore.score;
  } else if (creditScore?.details?.credit_score !== undefined && creditScore?.details?.credit_score !== null) {
    // If score exists in details.credit_score
    scoreValue = creditScore.details.credit_score;
  } else if (creditScore?.details?.score !== undefined && creditScore?.details?.score !== null) {
    // If score exists in details.score
    scoreValue = creditScore.details.score;
  } else if (creditScore?.details?.data?.credit_score !== undefined && creditScore?.details?.data?.credit_score !== null) {
    // Try Firebase subcollection format: details.data.credit_score
    scoreValue = creditScore.details.data.credit_score;
  } else if (creditScore?.details?.data?.score !== undefined && creditScore?.details?.data?.score !== null) {
    // Try Firebase subcollection format: details.data.score
    scoreValue = creditScore.details.data.score;
  } else if (creditScore?.credit_score !== undefined && creditScore?.credit_score !== null) {
    // Direct credit_score field (for raw Firebase data)
    scoreValue = creditScore.credit_score;
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
  
  // Enhanced last updated date extraction - check multiple possible fields
  let lastUpdatedValue = null;
  if (creditScore?.lastUpdated) {
    lastUpdatedValue = creditScore.lastUpdated;
  } else if (creditScore?.last_updated) {
    lastUpdatedValue = creditScore.last_updated;
  } else if (creditScore?.updatedAt) {
    lastUpdatedValue = creditScore.updatedAt;
  } else if (creditScore?.details?.updatedAt) {
    lastUpdatedValue = creditScore.details.updatedAt;
  } else if (creditScore?.details?.last_updated) {
    lastUpdatedValue = creditScore.details.last_updated;
  } else if (creditScore?.details?.data?.updatedAt) {
    lastUpdatedValue = creditScore.details.data.updatedAt;
  } else if (creditScore?.details?.data?.last_updated) {
    lastUpdatedValue = creditScore.details.data.last_updated;
  } else if (creditScore?.createdAt) {
    lastUpdatedValue = creditScore.createdAt;
  } else if (creditScore?.details?.createdAt) {
    lastUpdatedValue = creditScore.details.createdAt;
  }
  
  const lastUpdated = formatDate(lastUpdatedValue);
  
  // Enhanced credit limit extraction - check multiple possible paths
  let creditLimitValue = null;
  if (creditScore?.credit_limit !== undefined && creditScore?.credit_limit !== null && creditScore?.credit_limit !== '') {
    creditLimitValue = creditScore.credit_limit;
  } else if (creditScore?.details?.credit_limit !== undefined && creditScore?.details?.credit_limit !== null && creditScore?.details?.credit_limit !== '') {
    creditLimitValue = creditScore.details.credit_limit;
  } else if (creditScore?.details?.data?.credit_limit !== undefined && creditScore?.details?.data?.credit_limit !== null && creditScore?.details?.data?.credit_limit !== '') {
    creditLimitValue = creditScore.details.data.credit_limit;
  } else if (creditScore?.details?.report?.creditScore?.currentCreditRating?.creditLimit?.value) {
    // Extract from full credit report structure
    creditLimitValue = creditScore.details.report.creditScore.currentCreditRating.creditLimit.value;
  } else if (creditScore?.details?.raw_data?.report?.creditScore?.currentCreditRating?.creditLimit?.value) {
    // Extract from raw_data structure
    creditLimitValue = creditScore.details.raw_data.report.creditScore.currentCreditRating.creditLimit.value;
  }
  
  // Format credit limit for display
  const formatCreditLimit = (limit: any) => {
    if (!limit && limit !== 0) return 'N/A';
    
    // If it's already a formatted string (like "£5,000"), return as is
    if (typeof limit === 'string' && (limit.includes('£') || limit.includes('$') || limit.includes('€'))) {
      return limit;
    }
    
    // If it's a number or numeric string, format it as currency
    const numericLimit = typeof limit === 'string' ? parseFloat(limit.replace(/[^\d.-]/g, '')) : Number(limit);
    if (!isNaN(numericLimit)) {
      return new Intl.NumberFormat('en-GB', { 
        style: 'currency', 
        currency: 'GBP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(numericLimit);
    }
    
    return String(limit);
  };
  
  const formattedCreditLimit = formatCreditLimit(creditLimitValue);
  
  // Extract incorporation date from multiple possible paths
  let incorporationDateValue = null;
  if (creditScore?.details?.incorporation_date) {
    incorporationDateValue = creditScore.details.incorporation_date;
  } else if (creditScore?.details?.registration_date) {
    incorporationDateValue = creditScore.details.registration_date;
  } else if (creditScore?.details?.data?.incorporation_date) {
    incorporationDateValue = creditScore.details.data.incorporation_date;
  } else if (creditScore?.details?.data?.registration_date) {
    incorporationDateValue = creditScore.details.data.registration_date;
  } else if (creditScore?.details?.report?.companyIdentification?.basicInformation?.companyRegistrationDate) {
    incorporationDateValue = creditScore.details.report.companyIdentification.basicInformation.companyRegistrationDate;
  } else if (creditScore?.details?.raw_data?.report?.companyIdentification?.basicInformation?.companyRegistrationDate) {
    incorporationDateValue = creditScore.details.raw_data.report.companyIdentification.basicInformation.companyRegistrationDate;
  }
  
  const incorporationDate = formatDate(incorporationDateValue);
  
  // Calculate company age
  const calculateCompanyAge = (dateInput: string | number | Date | undefined) => {
    if (!dateInput) return 'N/A';
    
    try {
      let date: Date;
      
      // Handle Firebase Timestamp objects
      if (dateInput && typeof dateInput === 'object' && 'seconds' in dateInput) {
        date = new Date((dateInput as any).seconds * 1000);
      }
      // Handle standard Date objects, ISO strings, or timestamps
      else {
        date = new Date(dateInput);
      }
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return 'N/A';
      }
      
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const diffYears = Math.floor(diffDays / 365);
      const diffMonths = Math.floor((diffDays % 365) / 30);
      
      if (diffYears === 0) {
        if (diffMonths === 0) {
          return diffDays === 1 ? '1 day' : `${diffDays} days`;
        }
        return diffMonths === 1 ? '1 month' : `${diffMonths} months`;
      } else if (diffYears === 1 && diffMonths === 0) {
        return '1 year';
      } else if (diffMonths === 0) {
        return `${diffYears} years`;
      } else {
        return `${diffYears}y ${diffMonths}m`;
      }
    } catch (e) {
      return 'N/A';
    }
  };
  
  const companyAge = calculateCompanyAge(incorporationDateValue);
  
  // Extract company type from multiple possible paths
  let companyTypeValue = null;
  if (creditScore?.details?.company_type) {
    companyTypeValue = creditScore.details.company_type;
  } else if (creditScore?.details?.legal_form) {
    companyTypeValue = creditScore.details.legal_form;
  } else if (creditScore?.details?.data?.company_type) {
    companyTypeValue = creditScore.details.data.company_type;
  } else if (creditScore?.details?.data?.legal_form) {
    companyTypeValue = creditScore.details.data.legal_form;
  } else if (creditScore?.details?.report?.companyIdentification?.basicInformation?.legalForm?.description) {
    companyTypeValue = creditScore.details.report.companyIdentification.basicInformation.legalForm.description;
  } else if (creditScore?.details?.raw_data?.report?.companyIdentification?.basicInformation?.legalForm?.description) {
    companyTypeValue = creditScore.details.raw_data.report.companyIdentification.basicInformation.legalForm.description;
  }
  
  const companyType = companyTypeValue || 'Unknown';
  
  // Extract last rating change date from multiple possible paths
  let lastRatingChangeValue = null;
  if (creditScore?.details?.latest_rating_change) {
    lastRatingChangeValue = creditScore.details.latest_rating_change;
  } else if (creditScore?.details?.data?.latest_rating_change) {
    lastRatingChangeValue = creditScore.details.data.latest_rating_change;
  } else if (creditScore?.details?.report?.creditScore?.latestRatingChangeDate) {
    lastRatingChangeValue = creditScore.details.report.creditScore.latestRatingChangeDate;
  } else if (creditScore?.details?.raw_data?.report?.creditScore?.latestRatingChangeDate) {
    lastRatingChangeValue = creditScore.details.raw_data.report.creditScore.latestRatingChangeDate;
  }
  
  const lastRatingChange = formatDate(lastRatingChangeValue);
  
  // Determine business type based on status or explicit businessType
  const companyStatus = creditScore?.details?.company_status || 
                       creditScore?.status || 
                       creditScore?.details?.status ||
                       creditScore?.details?.data?.status ||
                       creditScore?.details?.data?.company_status ||
                       creditScore?.details?.report?.companyIdentification?.basicInformation?.companyStatus?.description ||
                       creditScore?.details?.raw_data?.report?.companyIdentification?.basicInformation?.companyStatus?.description ||
                       'Unknown';
  
  // Get risk level from normalized structure or raw Firebase data
  const riskLevel = creditScore?.risk_level || 
                   creditScore?.risk || // raw Firebase field
                   creditScore?.details?.data?.risk || // Firebase subcollection data.risk
                   creditScore?.details?.risk_level || 
                   creditScore?.details?.risk || 
                   creditScore?.details?.common_description ||
                   creditScore?.details?.data?.common_description; // Firebase subcollection data.common_description
  
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
    <Card className="bg-[#1d2432] shadow-lg rounded-xl overflow-hidden border-0 flex flex-col h-full">
      <CardHeader className="bg-[#1d2432] text-white p-4">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold text-white">Credit Score</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-slate-400 hover:text-white cursor-help" />
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
      <CardContent className="p-4 flex flex-col items-center flex-1 justify-center">
        {creditScore ? (
          <>
            <div className="flex flex-col items-center justify-center mb-4">
              {isUnknown ? (
                <CircularProgress
                  value="Unknown"
                  riskLevel="not-scored"
                  valueSize="text-lg"
                  size={120}
                  strokeWidth={8}
                  className="mb-2"
                  label={
                    <span className="mt-1 text-xs text-slate-400">•</span>
                  }
                />
              ) : isInternational && letterScore ? (
                <CircularProgress
                  value={letterScore}
                  riskLevel={scoreData.riskLevel}
                  valueSize="text-4xl"
                  size={120}
                  strokeWidth={8}
                  className="mb-2"
                  label={
                    <Badge className={cn("mt-1 font-medium border-0 text-xs", getBadgeColor())}>
                      {scoreData.text}
                    </Badge>
                  }
                />
              ) : (
                <CircularProgress
                  value={numericScore}
                  riskLevel={scoreData.riskLevel}
                  valueSize="text-4xl"
                  size={120}
                  strokeWidth={8}
                  className="mb-2"
                  label={
                    <Badge className={cn("mt-1 font-medium border-0 text-xs", getBadgeColor())}>
                      {scoreData.text}
                    </Badge>
                  }
                />
              )}
              <div className="text-slate-300 text-xs mt-2">
                Last updated: {lastUpdated}
              </div>
            </div>

            {/* HMRC Status Tags - Compact, Vertical, Centered */}
            {hmrcStatus && (
              <div className="flex flex-col items-center justify-center space-y-2 mb-4">
                {hmrcStatus.isUpToDate === 'yes' ? (
                  <>
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-sm px-3 py-1.5 border-0 w-[190px] justify-center">
                      <ShieldCheck className="w-3 h-3 mr-1.5" />
                      VAT Up to Date
                    </Badge>
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-sm px-3 py-1.5 border-0 w-[190px] justify-center">
                      <ShieldCheck className="w-3 h-3 mr-1.5" />
                      Corp Tax Up to Date
                    </Badge>
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-sm px-3 py-1.5 border-0 w-[190px] justify-center">
                      <ShieldCheck className="w-3 h-3 mr-1.5" />
                      PAYE Up to Date
                    </Badge>
                  </>
                ) : (
                  <>
                    {hmrcStatus.vatDetails && (hmrcStatus.vatDetails.amount || hmrcStatus.vatDetails.timeToPay) ? (
                      <Badge className="bg-red-100 text-red-800 hover:bg-red-100 text-sm px-3 py-1.5 border-0 w-[190px] justify-center">
                        <AlertCircle className="w-3 h-3 mr-1.5" />
                        VAT Outstanding
                      </Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-sm px-3 py-1.5 border-0 w-[190px] justify-center">
                        <ShieldCheck className="w-3 h-3 mr-1.5" />
                        VAT Up to Date
                      </Badge>
                    )}
                    
                    {hmrcStatus.corpTaxDetails && (hmrcStatus.corpTaxDetails.amount || hmrcStatus.corpTaxDetails.timeToPay) ? (
                      <Badge className="bg-red-100 text-red-800 hover:bg-red-100 text-sm px-3 py-1.5 border-0 w-[190px] justify-center">
                        <AlertCircle className="w-3 h-3 mr-1.5" />
                        Corp Tax Outstanding
                      </Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-sm px-3 py-1.5 border-0 w-[190px] justify-center">
                        <ShieldCheck className="w-3 h-3 mr-1.5" />
                        Corp Tax Up to Date
                      </Badge>
                    )}
                    
                    {hmrcStatus.payeDetails && (hmrcStatus.payeDetails.amount || hmrcStatus.payeDetails.timeToPay) ? (
                      <Badge className="bg-red-100 text-red-800 hover:bg-red-100 text-sm px-3 py-1.5 border-0 w-[190px] justify-center">
                        <AlertCircle className="w-3 h-3 mr-1.5" />
                        PAYE Outstanding
                      </Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-sm px-3 py-1.5 border-0 w-[190px] justify-center">
                        <ShieldCheck className="w-3 h-3 mr-1.5" />
                        PAYE Up to Date
                      </Badge>
                    )}
                  </>
                )}
              </div>
            )}
            
            <div className="w-full mt-4 border-t border-gray-700 pt-3 mt-auto">
              <div className="grid grid-cols-1 gap-3">
                {/* Credit Limit */}
                <div className="bg-[#1a2030] p-3 rounded-md border border-slate-700/50">
                  <h5 className="text-xs uppercase tracking-wider text-slate-400 mb-1">Credit Limit</h5>
                  <p className="text-sm text-white font-medium">
                    {formattedCreditLimit}
                  </p>
                </div>

                {/* Negative Information */}
                <div className="bg-[#1a2030] p-3 rounded-md border border-slate-700/50">
                  <h5 className="text-xs uppercase tracking-wider text-slate-400 mb-1">Negative Information</h5>
                  <div className="flex items-center gap-2">
                    {(() => {
                      // If we have credit score data, we should be able to determine negative info status
                      if (!creditScore || !creditScore.details) {
                        return <span className="text-sm text-slate-400 font-medium">Not Available</span>;
                      }

                      // Extract negative information from multiple possible paths
                      let negativeInfo = null;
                      let hasNegativeRecords = false;
                      
                      // Check for boolean flags first
                      if (creditScore?.negative_information !== undefined && creditScore?.negative_information !== null) {
                        negativeInfo = creditScore.negative_information;
                      } else if (creditScore?.details?.negative_information !== undefined && creditScore?.details?.negative_information !== null) {
                        negativeInfo = creditScore.details.negative_information;
                      } else if (creditScore?.details?.data?.negative_information !== undefined && creditScore?.details?.data?.negative_information !== null) {
                        negativeInfo = creditScore.details.data.negative_information;
                      } else if (creditScore?.details?.report?.creditScore?.currentCreditRating?.hasNegativeInformation !== undefined) {
                        negativeInfo = creditScore.details.report.creditScore.currentCreditRating.hasNegativeInformation;
                      } else if (creditScore?.details?.raw_data?.report?.creditScore?.currentCreditRating?.hasNegativeInformation !== undefined) {
                        negativeInfo = creditScore.details.raw_data.report.creditScore.currentCreditRating.hasNegativeInformation;
                      }
                      
                      // Check for specific negative record counts (CCJs, writs, etc.)
                      const checkNegativeRecords = (data: any): boolean => {
                        if (!data) return false;
                        
                        // Check various negative record fields
                        const negativeFields = [
                          'exact_registered', 'number_of_satisfied', 'number_of_exact', 'number_of_writs',
                          'possible_registered', 'number_of_possible', 'ccjs', 'judgments', 'defaults',
                          'bankruptcies', 'insolvencies', 'adverse_records'
                        ];
                        
                        for (const field of negativeFields) {
                          const value = data[field];
                          if (value && (typeof value === 'number' ? value > 0 : parseInt(value) > 0)) {
                            return true;
                          }
                        }
                        return false;
                      };
                      
                      // Check for negative records in various data structures
                      hasNegativeRecords = checkNegativeRecords(creditScore?.details) ||
                                          checkNegativeRecords(creditScore?.details?.data) ||
                                          checkNegativeRecords(creditScore?.details?.report) ||
                                          checkNegativeRecords(creditScore?.details?.raw_data?.report);

                      // Determine final status - if we have credit data, default to "no negative history" unless proven otherwise
                      if (negativeInfo === true || negativeInfo === 'true' || negativeInfo === 'yes' || hasNegativeRecords) {
                        return (
                          <>
                            <AlertCircle className="w-4 h-4 text-red-400" />
                            <span className="text-sm text-red-400 font-medium">Yes</span>
                          </>
                        );
                      } else {
                        // If we have credit score data but no explicit negative indicators, assume clean record
                        return (
                          <>
                            <ShieldCheck className="w-4 h-4 text-green-400" />
                            <span className="text-sm text-green-400 font-medium">No negative history</span>
                          </>
                        );
                      }
                    })()}
                  </div>
                </div>

                {/* Business Status */}
                <div className="bg-[#1a2030] p-3 rounded-md border border-slate-700/50">
                  <h5 className="text-xs uppercase tracking-wider text-slate-400 mb-1">Company Status</h5>
                  <p className="text-sm text-white font-medium">{companyStatus}</p>
                </div>

                {/* Incorporation Date & Age */}
                <div className="bg-[#1a2030] p-3 rounded-md border border-slate-700/50">
                  <h5 className="text-xs uppercase tracking-wider text-slate-400 mb-1">Incorporation Date</h5>
                  <p className="text-sm text-white font-medium">{incorporationDate}</p>
                  {companyAge !== 'N/A' && (
                    <p className="text-xs text-slate-400 mt-1">Age: {companyAge}</p>
                  )}
                </div>

                {/* Company Type */}
                <div className="bg-[#1a2030] p-3 rounded-md border border-slate-700/50">
                  <h5 className="text-xs uppercase tracking-wider text-slate-400 mb-1">Company Type</h5>
                  <p className="text-sm text-white font-medium">{companyType}</p>
                </div>

                {/* Last Rating Change */}
                <div className="bg-[#1a2030] p-3 rounded-md border border-slate-700/50">
                  <h5 className="text-xs uppercase tracking-wider text-slate-400 mb-1">Last Rating Change</h5>
                  <p className="text-sm text-white font-medium">{lastRatingChange}</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-6 flex-1 flex flex-col justify-center">
            <AlertCircle className="mx-auto h-12 w-12 text-slate-600 mb-3" />
            <p className="text-slate-300 font-medium">Credit Score Not Available</p>
            <p className="text-xs text-slate-400">No credit information provided yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}