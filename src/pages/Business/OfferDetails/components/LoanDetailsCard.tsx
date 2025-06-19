import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { formatCurrency, formatRepaymentFrequency } from '../utils';

interface LoanDetailsCardProps {
  offer: any;
  conversation?: any;
  onNavigateToMessages?: () => void;
}

export const LoanDetailsCard: React.FC<LoanDetailsCardProps> = ({ offer, conversation, onNavigateToMessages }) => {
  const loanAmount = offer.offered_amount;
  const interestRate = offer.interest_rate;
  const termMonths = offer.offered_term_months;
  const monthlyRate = interestRate / 100 / 12;
  
  // Use provided monthly payment if available, otherwise calculate it
  const monthlyPayment = offer.monthly_payment || (
    (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
    (Math.pow(1 + monthlyRate, termMonths) - 1)
  );

  return (
    <Card className="bg-white/95 backdrop-blur-sm border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl">
      <CardHeader className="bg-gradient-to-br from-[#212936] to-[#2c3c53] text-white rounded-t-xl">
        <CardTitle className="text-white text-xl">Loan Details</CardTitle>
        <CardDescription className="text-gray-200">Terms and conditions for this funding offer</CardDescription>
      </CardHeader>
      <CardContent className="p-10 space-y-10">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">Loan Amount</p>
            <p className="text-2xl font-bold text-[#212936]">{formatCurrency(loanAmount)}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">Interest Rate</p>
            <p className="text-2xl font-bold text-[#212936]">{interestRate}%</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">Term</p>
            <p className="text-2xl font-bold text-[#212936]">{termMonths} months</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">Monthly Payment</p>
            <p className="text-2xl font-bold text-[#212936]">{formatCurrency(monthlyPayment)}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">Payment Frequency</p>
            <p className="text-lg font-semibold text-[#212936]">{formatRepaymentFrequency(offer.repayment_frequency)}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">APR</p>
            <p className="text-lg font-semibold text-[#212936]">{offer.apr || interestRate}%</p>
          </div>
        </div>
        
        <Separator className="my-6 bg-gray-200" />
        
        <div className="group bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200 shadow-md hover:shadow-lg transition-all duration-200">
          <h4 className="font-semibold text-slate-800 mb-3">Fees & Charges</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Arrangement Fee</span>
              <span className="font-medium text-[#212936]">
                {offer.arrangement_fee ? `${offer.arrangement_fee}%` : 'None'}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Early Repayment Fee</span>
              <span className="font-medium text-[#212936]">
                {offer.early_repayment_fee ? `${offer.early_repayment_fee}%` : 'None'}
              </span>
            </div>
          </div>
        </div>
        
        <Separator className="my-6 bg-gray-200" />
        
        <div className="group bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200 shadow-md hover:shadow-lg transition-all duration-200">
          <h4 className="font-semibold text-slate-800 mb-3">Conditions</h4>
          {offer.conditions && offer.conditions.length > 0 ? (
            <ul className="space-y-2">
              {offer.conditions.map((condition: string, index: number) => (
                <li key={index} className="flex items-start">
                  <span className="inline-block w-2 h-2 bg-[#212936] rounded-full mr-3 mt-2 flex-shrink-0"></span>
                  <span className="text-gray-700">{condition}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600 italic">No specific conditions attached to this offer.</p>
          )}
        </div>
        
        {offer.business_notes && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Additional Notes</h4>
            <p className="text-blue-800">{offer.business_notes}</p>
          </div>
        )}

        {/* Messaging Section */}
        {conversation && (
          <div className="mt-6">
            <Button 
              onClick={onNavigateToMessages} 
              className="w-full flex items-center justify-center bg-[#ff8000] text-white rounded-lg py-3 hover:bg-[#e76b00] transition-all duration-200"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Message lender
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
