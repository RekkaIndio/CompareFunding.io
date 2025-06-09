import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { formatCurrency } from '../utils';
import { formatApplicationNumber } from '@/lib/applicationUtils';

interface ApplicationDetailsCardProps {
  offer: any;
}

export const ApplicationDetailsCard: React.FC<ApplicationDetailsCardProps> = ({ offer }) => {
  const application = offer.applications;
  
  if (!application) return null;

  return (
    <Card className="bg-white/95 backdrop-blur-sm border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl">
      <CardHeader className="bg-gradient-to-br from-[#212936] to-[#2c3c53] text-white rounded-t-xl">
        <CardTitle>Application Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-600">Application Number</p>
            <p className="text-lg font-semibold text-[#212936]">
              {formatApplicationNumber(application, offer.application_id)}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Requested Amount</p>
            <p className="text-lg font-semibold text-[#212936]">
              {formatCurrency(application.loan_amount)}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Purpose</p>
            <p className="text-lg font-semibold text-[#212936]">{application.purpose}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Term Requested</p>
            <p className="text-lg font-semibold text-[#212936]">
              {application.loan_term_months} months
            </p>
          </div>
        </div>
        
        {application.business_description && (
          <div className="mt-4 p-3 bg-slate-50 rounded-lg border">
            <p className="text-sm font-medium text-gray-600 mb-2">Business Description</p>
            <p className="text-sm text-gray-700">{application.business_description}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
