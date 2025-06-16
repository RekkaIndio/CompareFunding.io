import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit3, PlusCircle, Calendar, Building, ArrowRight, Zap } from 'lucide-react';
import { safeConvertDate, formatCurrency } from '../utils';
import { formatApplicationNumber } from '@/lib/applicationUtils';
import type { Application } from '../types';

interface DraftApplicationsProps {
  applications: Application[];
}

export const DraftApplications: React.FC<DraftApplicationsProps> = ({ applications }) => {
  const navigate = useNavigate();

  // Filter to show only draft applications
  const draftApplications = applications.filter(application => 
    application.status === 'draft'
  );

  // Sort drafts by date, most recent first
  const sortedDrafts = draftApplications.sort((a, b) => 
    safeConvertDate(b.created_at).getTime() - safeConvertDate(a.created_at).getTime()
  );

  if (draftApplications.length === 0) {
    return (
      <Card className="bg-white border border-gray-200 shadow-sm rounded-xl">
        <CardContent className="pt-6 flex flex-col items-center justify-center text-center p-12 bg-white text-gray-600">
          <Edit3 className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Draft Applications</h3>
          <p className="text-gray-600 mb-6 max-w-md">
            You don't have any draft applications. Start creating your first application to connect with lenders.
          </p>
          <Button 
            onClick={() => navigate('/applications/new')}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Create New Application
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {sortedDrafts.map((application) => (
        <Card 
          key={application.id} 
          className="overflow-hidden transition-all duration-300 transform hover:-translate-y-1 rounded-xl shadow-lg hover:shadow-xl bg-white/95 backdrop-blur-sm border-slate-200/50 hover:shadow-2xl cursor-pointer"
          onClick={() => navigate(`/applications/new?draft=${application.id}`)}
        >
          {/* Draft status indicator bar */}
          <div className="h-3 w-full bg-gradient-to-r from-yellow-400 to-orange-500"></div>
          
          {/* Header */}
          <CardHeader className="relative overflow-hidden bg-gradient-to-br from-yellow-50 to-orange-50">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                    <Edit3 className="h-4 w-4" />
                    <span className="ml-1.5">Draft</span>
                  </div>
                  {application.is_prefilled && (
                    <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                      <Zap className="h-3 w-3 mr-1" />
                      Auto-filled
                    </div>
                  )}
                </div>
                <ArrowRight className="h-5 w-5 text-gray-500 hover:text-gray-700 transition-colors" />
              </div>
              
              <CardTitle className="text-xl font-bold text-gray-900 mb-2">
                Application #{formatApplicationNumber(application, application.id)}
              </CardTitle>
              
              <div className="flex items-center gap-6 text-gray-600 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Created {safeConvertDate(application.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  <span className="font-semibold">{application.company_name || 'Business'}</span>
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-6">
            {/* Simplified draft content - only funding amount and description */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Funding Amount */}
              <div className="text-center md:text-left">
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {formatCurrency(application.loan_amount)}
                </div>
                <div className="text-sm text-gray-600">Requested Amount</div>
              </div>
              
              {/* Purpose/Description */}
              <div className="text-center md:text-left">
                <h4 className="text-sm font-semibold text-gray-700 mb-1">Funding Purpose</h4>
                <p className="text-gray-900 font-medium">{application.loan_purpose}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
