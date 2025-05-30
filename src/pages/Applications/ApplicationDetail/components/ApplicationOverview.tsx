import React from 'react';
import { 
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from "@/components/ui/card";
import { Separator } from '@/components/ui/separator';
import { Briefcase, PoundSterling, CalendarDays } from 'lucide-react';

interface ApplicationOverviewProps {
  application: any;
}

const ApplicationOverview: React.FC<ApplicationOverviewProps> = ({ application }) => {
  if (!application) return null;

  return (
    <Card className="mb-6 bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="bg-[#212936] text-white rounded-t-lg">
        <CardTitle className="flex items-center">
          <Briefcase className="mr-2 h-5 w-5 text-[#ff8000]" />
          <span className="text-white">Application Overview</span>
        </CardTitle>
        <CardDescription className="text-gray-200">
          Key details about your funding application
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-50/70 rounded-lg p-3 border border-slate-100">
            <p className="text-sm text-slate-500">Loan Amount</p>
            <p className="font-semibold text-slate-900 text-lg flex items-center">
              <PoundSterling className="h-4 w-4 text-[#ff8000] mr-1" />
              £{application.loan_amount?.toLocaleString() || 'Not specified'}
            </p>
          </div>
          <div className="bg-slate-50/70 rounded-lg p-3 border border-slate-100">
            <p className="text-sm text-slate-500">Loan Term</p>
            <p className="font-semibold text-slate-900 text-lg flex items-center">
              <CalendarDays className="h-4 w-4 text-[#ff8000] mr-1" />
              {application.loan_term_months || 'Not specified'} months
            </p>
          </div>
          <div className="bg-slate-50/70 rounded-lg p-3 border border-slate-100">
            <p className="text-sm text-slate-500">Type</p>
            <p className="font-semibold text-slate-900 text-lg capitalize">
              {application.loan_type?.replace('_', ' ') || 'Not specified'}
            </p>
          </div>
        </div>
        
        <Separator className="bg-slate-200" />
        
        <div>
          <div className="bg-slate-50/70 rounded-lg p-3 border border-slate-100 mb-4">
            <p className="text-sm text-slate-500">Purpose</p>
            <p className="font-semibold text-slate-900">
              {application.purpose || 'Not specified'}
            </p>
            {application.purpose_details && (
              <p className="text-sm mt-1 text-slate-600">
                {application.purpose_details}
              </p>
            )}
          </div>
        </div>

        <Separator className="bg-slate-200" />

        <div>
          <div className="text-lg font-medium mb-3 text-[#212936]">Additional Details</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50/70 rounded-lg p-3 border border-slate-100">
              <p className="text-sm text-slate-500">Security Offered</p>
              <p className="font-medium text-slate-900">
                {application.is_secured ? 'Yes' : 'No'}
              </p>
            </div>
            <div className="bg-slate-50/70 rounded-lg p-3 border border-slate-100">
              <p className="text-sm text-slate-500">Personal Guarantee</p>
              <p className="font-medium text-slate-900">
                {application.has_personal_guarantee ? 'Yes' : 'No'}
              </p>
            </div>
            <div className="bg-slate-50/70 rounded-lg p-3 border border-slate-100">
              <p className="text-sm text-slate-500">Application Date</p>
              <p className="font-medium text-slate-900">
                {application.application_date ? new Date(application.application_date).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div className="bg-slate-50/70 rounded-lg p-3 border border-slate-100">
              <p className="text-sm text-slate-500">Last Updated</p>
              <p className="font-medium text-slate-900">
                {application.status_updated_at ? new Date(application.status_updated_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ApplicationOverview;
