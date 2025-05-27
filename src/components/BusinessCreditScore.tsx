import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, ArrowRight, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface BusinessCreditScoreProps {
  creditInfo: {
    credit_score?: number | string | null;
    risk?: string | null;
    status?: string | null;
    international_value?: number | string | null;
    credit_limit?: number | string | null;
    report_date?: string | null;
  } | null | undefined;
}

const BusinessCreditScore: React.FC<BusinessCreditScoreProps> = ({ creditInfo }) => {
  const navigate = useNavigate();
  
  if (!creditInfo || !creditInfo.credit_score) {
    return (
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Credit Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No credit information available</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t bg-gray-50 px-6 py-3">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => navigate('/credit-score')}
          >
            Get Credit Report
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Function to get color based on credit score
  const getCreditScoreColor = (score: number | string | null | undefined) => {
    if (!score) return 'bg-gray-200';
    
    // If score is a string that's not a number (like a grade), handle accordingly
    if (typeof score === 'string' && isNaN(Number(score))) {
      const lowerScore = score.toLowerCase();
      if (['a', 'a+', 'a-'].includes(lowerScore)) return 'bg-green-500';
      if (['b', 'b+', 'b-'].includes(lowerScore)) return 'bg-green-400';
      if (['c', 'c+', 'c-'].includes(lowerScore)) return 'bg-yellow-400';
      if (['d', 'd+', 'd-'].includes(lowerScore)) return 'bg-orange-500';
      if (['e', 'e+', 'e-'].includes(lowerScore)) return 'bg-red-500';
      return 'bg-gray-400';
    }
    
    // Convert to number if it's a string
    const numericScore = typeof score === 'string' ? parseInt(score) : score;
    
    // Handle numeric scores
    if (numericScore && numericScore >= 80) return 'bg-green-500';
    if (numericScore && numericScore >= 60) return 'bg-green-400';
    if (numericScore && numericScore >= 40) return 'bg-yellow-400';
    if (numericScore && numericScore >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  };

  // Format the report date
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Format credit limit as currency
  const formatCurrency = (amount: number | string | null | undefined) => {
    if (!amount) return 'N/A';
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0
    }).format(numAmount);
  };

  const scoreColor = getCreditScoreColor(creditInfo.credit_score);
  const risk = creditInfo.risk || 'Unknown';
  const reportDate = formatDate(creditInfo.report_date);
  const creditLimit = formatCurrency(creditInfo.credit_limit);

  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex justify-between items-center">
          <span>Credit Score</span>
          {creditInfo.status && (
            <Badge className={creditInfo.status.toLowerCase().includes('active') ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}>
              {creditInfo.status}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className={`rounded-full h-16 w-16 flex items-center justify-center ${scoreColor} text-white text-xl font-bold`}>
              {creditInfo.credit_score || '?'}
            </div>
            <div className="ml-4">
              <div className="text-sm text-gray-500">Risk Rating</div>
              <div className="font-semibold">{risk}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Credit Limit</div>
            <div className="font-semibold">{creditLimit}</div>
          </div>
        </div>
        
        <div className="text-sm text-gray-500 mt-3 flex items-center">
          <CheckCircle className="h-4 w-4 mr-1 text-gray-400" />
          Report date: {reportDate}
        </div>
      </CardContent>
      <CardFooter className="border-t bg-gray-50 px-6 py-3">
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => navigate('/credit-score')}
        >
          View Full Credit Report
          <ExternalLink className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default BusinessCreditScore;
