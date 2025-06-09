import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '../utils';

interface CostBreakdownCardProps {
  offer: any;
}

export const CostBreakdownCard: React.FC<CostBreakdownCardProps> = ({ offer }) => {
  const loanAmount = offer.offered_amount;
  const interestRate = offer.interest_rate;
  const termMonths = offer.offered_term_months;
  const monthlyRate = interestRate / 100 / 12;
  
  // Use provided monthly payment if available, otherwise calculate it
  const monthlyPayment = offer.monthly_payment || (
    (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
    (Math.pow(1 + monthlyRate, termMonths) - 1)
  );
  
  // Use provided total repayment if available, otherwise calculate it
  const totalPayment = offer.total_repayment || (monthlyPayment * termMonths);
  const totalInterest = totalPayment - loanAmount;
  
  // Get arrangement fee information
  const arrangementFeePercent = offer.arrangement_fee || 0;
  const arrangementFeeAmount = offer.arrangement_fee_amount || 
    ((loanAmount * arrangementFeePercent) / 100);
  
  // Early repayment fee
  const earlyRepaymentFee = offer.early_repayment_fee || 0;

  return (
    <Card className="bg-white/95 backdrop-blur-sm border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl">
      <CardHeader className="bg-gradient-to-br from-[#212936] to-[#2c3c53] text-white rounded-t-xl">
        <CardTitle>Cost Breakdown</CardTitle>
        <CardDescription className="text-gray-200">Detailed view of total loan costs</CardDescription>
      </CardHeader>
      <CardContent className="p-10 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200 shadow-sm">
            <p className="text-sm font-medium text-green-700">Principal Amount</p>
            <p className="text-xl font-bold text-green-800">{formatCurrency(loanAmount)}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200 shadow-sm">
            <p className="text-sm font-medium text-blue-700">Total Interest</p>
            <p className="text-xl font-bold text-blue-800">{formatCurrency(totalInterest)}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200 shadow-sm">
            <p className="text-sm font-medium text-purple-700">Total Repayment</p>
            <p className="text-xl font-bold text-purple-800">{formatCurrency(totalPayment)}</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-slate-800">Payment Schedule</h4>
          
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between py-2 border-b border-slate-200">
                <span className="text-gray-600">Monthly Payment:</span>
                <span className="font-semibold text-[#212936]">{formatCurrency(monthlyPayment)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-200">
                <span className="text-gray-600">Total Payments:</span>
                <span className="font-semibold text-[#212936]">{termMonths}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-200">
                <span className="text-gray-600">First Payment:</span>
                <span className="font-semibold text-[#212936]">
                  {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB')}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-200">
                <span className="text-gray-600">Final Payment:</span>
                <span className="font-semibold text-[#212936]">
                  {new Date(Date.now() + termMonths * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB')}
                </span>
              </div>
            </div>
          </div>
          
          {(arrangementFeeAmount > 0 || earlyRepaymentFee > 0) && (
            <>
              <Separator />
              <div className="space-y-3">
                <h5 className="font-medium text-slate-800">Additional Fees</h5>
                {arrangementFeeAmount > 0 && (
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Arrangement Fee ({arrangementFeePercent}%)</span>
                    <span className="font-semibold text-[#212936]">{formatCurrency(arrangementFeeAmount)}</span>
                  </div>
                )}
                {earlyRepaymentFee > 0 && (
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Early Repayment Fee</span>
                    <span className="font-semibold text-[#212936]">{earlyRepaymentFee}% of outstanding balance</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
