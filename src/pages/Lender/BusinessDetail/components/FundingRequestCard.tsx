import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { Application } from '../types';
import { useNavigate } from 'react-router-dom';

interface FundingRequestCardProps {
  application: Application | null | undefined;
  isLenderMatched: boolean;
}

export const FundingRequestCard: React.FC<FundingRequestCardProps> = ({
  application,
  isLenderMatched,
}) => {
  const navigate = useNavigate();

  const getFinancialMetric = (value?: number) => {
    if (!value) return '£0';
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Get action button based on match status
  const getActionButton = () => {
    if (!application) return null;
    
    const applicationId = application.id || application.application_number;

    // If lender is matched, show the make offer button
    if (isLenderMatched) {
      return (
        <Button className="bg-[#212936] hover:bg-[#212936]/90 text-white shadow-lg w-full">
          <FileText className="mr-2 h-4 w-4" />
          Make Offer
        </Button>
      );
    }

    // Default: show Create Offer button
    return (
      <Button 
        onClick={() => navigate(`/create-offer/${applicationId}`)} 
        className="bg-[#ff8000] hover:bg-[#ff8000]/90 text-white shadow-lg w-full"
      >
        <FileText className="mr-2 h-4 w-4" />
        Create Offer
      </Button>
    );
  };

  return (
    <Card className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col h-full">
      <CardHeader className="bg-[#212936] text-white rounded-t-xl border-b-2 border-[#ff8000]">
        <CardTitle className="text-white">Funding Request</CardTitle>
        <CardDescription className="text-gray-200">
          Current application details
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-6 flex-1">
        <div>
          <div className="text-sm text-muted-foreground mb-1">Amount Requested</div>
          <div className="text-2xl font-bold text-[#212936]">
            {getFinancialMetric(application?.loan_amount)}
          </div>
        </div>
        <Separator />
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-slate-500">Term</span>
            <span className="font-medium text-slate-700">{application?.loan_term_months || 0} months</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-slate-500">Purpose</span>
            <span className="font-medium capitalize text-slate-700">{application?.purpose || 'Not specified'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-slate-500">Security</span>
            <span className="font-medium text-slate-700">{application?.security_offered || 'None'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-slate-500">Personal Guarantee</span>
            <span className="font-medium text-slate-700">{application?.personal_guarantee ? 'Yes' : 'No'}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex-col items-stretch gap-2 bg-slate-50 rounded-b-xl p-4 mt-auto">
        {getActionButton()}
        <Button variant="outline" className="w-full border-slate-200 hover:bg-slate-100 shadow-sm">
          <FileText className="mr-2 h-4 w-4" />
          Download Application
        </Button>
      </CardFooter>
    </Card>
  );
};
