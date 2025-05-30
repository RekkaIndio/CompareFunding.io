import React from 'react';
import { 
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Eye, Loader2 } from 'lucide-react';

interface ApplicationViewDetailsProps {
  application: any;
  isDeductingCredits: boolean;
  getCreditCost: (amount: number) => number;
  handleViewFullDetails: () => void;
}

const ApplicationViewDetails: React.FC<ApplicationViewDetailsProps> = ({
  application,
  isDeductingCredits,
  getCreditCost,
  handleViewFullDetails
}) => {
  return (
    <Card className="mb-6 bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="bg-[#212936] text-white rounded-t-lg">
        <CardTitle className="flex items-center">
          <Eye className="mr-2 h-5 w-5 text-[#ff8000]" />
          <span className="text-white">View Application Details</span>
        </CardTitle>
        <CardDescription className="text-gray-200">
          Unlock full application details including financial information and business profile
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-medium text-[#212936]">Credit Cost</div>
            <div className="text-sm text-slate-500">
              {getCreditCost(application.loan_amount)} credits required to view
            </div>
          </div>
          <Button 
            onClick={handleViewFullDetails}
            disabled={isDeductingCredits}
            className="bg-[#212936] hover:bg-[#212936]/90 border-b-2 border-[#ff8000] text-white"
          >
            {isDeductingCredits ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'View Details'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ApplicationViewDetails;
