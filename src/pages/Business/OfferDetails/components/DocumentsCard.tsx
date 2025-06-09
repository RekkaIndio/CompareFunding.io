import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Eye } from 'lucide-react';

export const DocumentsCard: React.FC = () => {
  return (
    <Card className="bg-white/95 backdrop-blur-sm border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl">
      <CardHeader className="bg-gradient-to-br from-[#212936] to-[#2c3c53] text-white rounded-t-xl">
        <CardTitle className="text-white flex items-center gap-3">
          <FileText className="h-5 w-5" />
          Documents & Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <div className="space-y-3">
          <Button variant="outline" className="w-full justify-start">
            <Eye className="mr-2 h-4 w-4" />
            View Loan Agreement (Preview)
          </Button>
          
          <Button variant="outline" className="w-full justify-start">
            <Download className="mr-2 h-4 w-4" />
            Download Terms & Conditions
          </Button>
          
          <Button variant="outline" className="w-full justify-start">
            <FileText className="mr-2 h-4 w-4" />
            View Application Details
          </Button>
        </div>
        
        <div className="text-xs text-gray-500 text-center pt-4 border-t border-gray-200">
          All documents are available for download once the offer is accepted
        </div>
      </CardContent>
    </Card>
  );
};
