import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Briefcase, BadgeCheck, PoundSterling, ChevronRight } from 'lucide-react';

interface StatsCardsProps {
  isLoading: boolean;
  sanitizedApplications: any[];
  matchedApplications: any[];
  lenderApplications: any[];
}

const StatsCards: React.FC<StatsCardsProps> = ({
  isLoading,
  sanitizedApplications,
  matchedApplications,
  lenderApplications,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
      {/* Total Applications Card */}
      <Card className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="bg-[#212936] p-3 rounded-full shadow-sm">
              <Briefcase className="h-6 w-6 text-[#ff8000]" />
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-slate-600">Total Applications</p>
              <h3 className="text-2xl font-bold text-[#212936]">
                {isLoading ? (
                  <span className="animate-pulse">...</span>
                ) : (
                  sanitizedApplications?.length || 0
                )}
              </h3>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Matched Applications Card */}
      <Card className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="bg-[#212936] p-3 rounded-full shadow-sm">
              <BadgeCheck className="h-6 w-6 text-[#ff8000]" />
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-slate-600">Matched Applications</p>
              <h3 className="text-2xl font-bold text-[#212936]">
                {isLoading ? (
                  <span className="animate-pulse">...</span>
                ) : (
                  matchedApplications?.length || 0
                )}
              </h3>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Total Value Card */}
      <Card className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="bg-[#212936] p-3 rounded-full shadow-sm">
              <PoundSterling className="h-6 w-6 text-[#ff8000]" />
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-slate-600">Total Loan Value</p>
              <h3 className="text-2xl font-bold text-[#212936]">
                {isLoading ? (
                  <span className="animate-pulse">...</span>
                ) : (
                  `£${(sanitizedApplications?.reduce((sum, app) => sum + (app.loan_amount || 0), 0) || 0).toLocaleString()}`
                )}
              </h3>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* New Applications Card */}
      <Card className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="bg-[#212936] p-3 rounded-full shadow-sm">
              <ChevronRight className="h-6 w-6 text-[#ff8000]" />
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-slate-600">New Applications</p>
              <h3 className="text-2xl font-bold text-[#212936]">
                {isLoading ? (
                  <span className="animate-pulse">...</span>
                ) : (
                  lenderApplications?.filter(app => app.status === 'submitted').length || 0
                )}
              </h3>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsCards;
