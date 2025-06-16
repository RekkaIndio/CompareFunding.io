import React from 'react';
import { Loader2 } from 'lucide-react';
import PageLayout from '@/components/PageLayout';

export const DashboardLoading = () => {
  return (
    <PageLayout>
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
        <div className="flex flex-col justify-center items-center h-screen">
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200 p-8">
            <div className="text-center">
              <div className="relative mb-6">
                <div className="w-16 h-16 mx-auto">
                  <Loader2 className="h-16 w-16 text-[#ff8800] animate-spin" />
                </div>
                <div className="absolute inset-0 w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-[#ff8800]/20 to-[#ffaa00]/20 animate-pulse"></div>
              </div>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">Loading Dashboard</h2>
              <p className="text-slate-600">Preparing your business overview...</p>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};
