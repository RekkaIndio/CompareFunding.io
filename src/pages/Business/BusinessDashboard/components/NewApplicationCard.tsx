import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, FileText, ArrowRight } from 'lucide-react';

export const NewApplicationCard = () => {
  const navigate = useNavigate();

  return (
    <Card className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/50 overflow-hidden" data-tour="new-application-button">
      <div className="bg-slate-800 px-6 py-4">
        <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
          <PlusCircle className="h-5 w-5" />
          Start New Application
        </CardTitle>
      </div>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex flex-col items-center text-center p-4">
            <div className="p-3 bg-orange-100 rounded-full mb-4">
              <FileText className="h-8 w-8 text-[#ff8800]" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Need funding for your business?</h3>
            <p className="text-slate-600 mb-4">Quick application process with high approval rates and competitive terms</p>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
              <h4 className="font-semibold text-slate-800 text-sm">Fast Approval</h4>
              <p className="text-xs text-slate-600 mt-1">As quick as 24 hours</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
              <h4 className="font-semibold text-slate-800 text-sm">Tailored Options</h4>
              <p className="text-xs text-slate-600 mt-1">Multiple lender matches</p>
            </div>
          </div>
          <Button 
            className="w-full bg-gradient-to-r from-[#ff8800] to-[#ffaa00] hover:from-[#ff9900] hover:to-[#ffbb00] text-white font-semibold py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-200" 
            onClick={() => navigate('/applications/new')}
          >
            Apply Now
            <ArrowRight size={16} className="ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
