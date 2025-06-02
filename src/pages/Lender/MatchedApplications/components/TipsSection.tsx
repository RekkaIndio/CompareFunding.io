import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Lightbulb } from 'lucide-react';

const TipsSection: React.FC = () => {
  return (
    <Card className="mb-8 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-xl text-blue-900">
          <Lightbulb className="mr-2 h-5 w-5 text-amber-500" />
          Quick Tips for Lenders
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/70 rounded-lg p-4 border border-blue-100">
            <h3 className="font-medium text-blue-800 mb-1">Express Interest</h3>
            <p className="text-sm text-slate-600">
              When you express interest in an application, the business receives a notification and can choose to connect with you.
            </p>
          </div>
          <div className="bg-white/70 rounded-lg p-4 border border-blue-100">
            <h3 className="font-medium text-blue-800 mb-1">Credit Usage</h3>
            <p className="text-sm text-slate-600">
              Credits are only deducted when you view the full application details after being matched.
            </p>
          </div>
          <div className="bg-white/70 rounded-lg p-4 border border-blue-100">
            <h3 className="font-medium text-blue-800 mb-1">Making Offers</h3>
            <p className="text-sm text-slate-600">
              Once matched, you can communicate with the business and make formal offers directly.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TipsSection;
