import React from "react";
import PageLayout from '@/components/PageLayout';
import { Button } from '@/components/ui/button';
import { Landmark, Clock, Bell } from 'lucide-react';

const BankingIntegrationPage: React.FC = () => {
  return (
    <PageLayout fullWidth>
      <div className="min-h-screen py-12 px-4 w-full max-w-none mx-0 bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center max-w-4xl mx-auto">
          {/* Icon */}
          <div className="mb-8">
            <div className="w-24 h-24 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Landmark className="text-white" size={48} />
            </div>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl md:text-6xl font-bold text-slate-800 mb-6">
            Banking Integrations
          </h1>
          
          {/* Coming Soon Badge */}
          <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-6 py-3 rounded-full text-lg font-semibold mb-8 border border-orange-200">
            <Clock size={20} />
            Coming Soon
          </div>

          {/* Description */}
          <p className="text-xl md:text-2xl text-slate-600 mb-8 leading-relaxed">
            We're building secure Open Banking integrations to connect your business bank accounts directly with our partner lenders. 
          </p>
          
          <p className="text-lg text-slate-500 mb-12 max-w-2xl mx-auto">
            Soon you'll be able to share real-time financial data instantly, eliminating manual bank statements and getting faster funding decisions.
          </p>

          {/* Features Preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-3xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Landmark className="text-blue-600" size={24} />
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">All Major Banks</h3>
              <p className="text-sm text-slate-600">Connect with Barclays, HSBC, Lloyds, NatWest, and more</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="text-emerald-600" size={24} />
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">Instant Verification</h3>
              <p className="text-sm text-slate-600">Real-time transaction data and cash flow analysis</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="text-purple-600" size={24} />
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">Better Offers</h3>
              <p className="text-sm text-slate-600">Transparent data leads to more competitive terms</p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="space-y-4">
            <Button 
              disabled 
              className="bg-slate-400 text-white px-8 py-3 text-lg cursor-not-allowed"
            >
              Coming Soon - Banking Integrations
            </Button>
            
            <p className="text-sm text-slate-500">
              Want to be notified when this feature launches? Contact our support team.
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default BankingIntegrationPage;
