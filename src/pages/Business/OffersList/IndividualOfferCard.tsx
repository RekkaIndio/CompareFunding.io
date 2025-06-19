import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  PoundSterling, Calendar, TrendingUp, Target, Clock, BarChart3, 
  Award, Shield, TrendingDown, Star 
} from 'lucide-react';
import { toast } from 'sonner';
import { Offer } from './types';
import { 
  formatCurrency, 
  calculateTotalCost, 
  calculateMonthlyPayment, 
  calculateTotalInterest, 
  formatRepaymentFrequency, 
  getStatusStyling 
} from './utils';
import { formatApplicationNumber } from '@/lib/applicationUtils';
import LenderReviewDialog from '@/components/LenderReviewDialog';

interface IndividualOfferCardProps {
  offer: Offer;
  isHistorical?: boolean;
}

export const IndividualOfferCard: React.FC<IndividualOfferCardProps> = ({ 
  offer, 
  isHistorical = false
}) => {
  const statusStyling = getStatusStyling(offer.status);
  const totalCost = calculateTotalCost(offer);
  const monthlyPayment = calculateMonthlyPayment(offer);
  const totalInterest = calculateTotalInterest(offer);
  const repaymentFrequency = formatRepaymentFrequency(offer.repayment_frequency || 'monthly');
  
  return (
    <Card className={`relative overflow-hidden bg-white/95 backdrop-blur-sm border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 rounded-xl cursor-pointer ${
      isHistorical ? 'opacity-75 hover:opacity-90' : ''
    }`}>
      {/* Premium status indicator bar */}
      <div className={`h-3 w-full ${
        isHistorical ? 'bg-gradient-to-r from-gray-400 to-gray-500' : 
        `bg-gradient-to-r ${statusStyling.gradient}`
      }`}></div>
      
      {/* Enhanced header with sophisticated styling */}
      <CardHeader className="relative overflow-hidden bg-gradient-to-br from-[#212936] to-[#2c3c53] text-white">
        <div className={`absolute -top-8 -right-8 w-32 h-32 bg-gradient-to-br from-[#ff8000]/20 to-[#ffaa00]/20 rounded-full ${isHistorical ? 'opacity-30' : 'opacity-50'}`}></div>
        <div className={`absolute -bottom-6 -left-6 w-20 h-20 bg-gradient-to-br from-[#ff8000]/10 to-[#ffaa00]/10 rounded-full ${isHistorical ? 'opacity-30' : 'opacity-40'}`}></div>
        <div className="flex justify-between items-start relative z-10">
          <div className="flex-1">
            <CardTitle className={`text-xl mb-3 ${isHistorical ? 'text-gray-200' : 'text-white'} flex items-center gap-3`}>
              <div className="bg-gradient-to-br from-[#ff8000] to-[#ffaa00] rounded-lg p-2.5 shadow-lg">
                <PoundSterling className="h-5 w-5 text-white" />
              </div>
              Offer from {offer.lender_name}
            </CardTitle>
            <div className="flex items-center gap-4 text-white/80 text-sm">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20">
                <Calendar className="h-4 w-4 text-white" />
                <span className="font-semibold text-white">Received {new Date(offer.created_at).toLocaleDateString()}</span>
              </div>
              {offer.expires_at && (
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20">
                  <Clock className="h-4 w-4 text-white" />
                  <span className="font-semibold text-white">Expires {new Date(offer.expires_at).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold shadow-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white`}>
              <Target className="h-4 w-4 mr-2" />
              {getStatusStyling(offer.status).label}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className={`p-6 space-y-6 ${isHistorical ? 'bg-gray-50/50' : 'bg-white'}`}>
        {/* Enhanced lender information section */}
        <div className="flex items-center gap-4 mb-6">
          {offer.company_logo ? (
            <div className="w-16 h-16 rounded-lg bg-white border border-slate-100 shadow-lg flex items-center justify-center p-2 overflow-hidden hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5">
              <img 
                src={offer.company_logo} 
                alt={`${offer.lender_name} logo`}
                className="max-w-full max-h-full object-contain"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  img.style.display = 'none';
                  const fallback = img.parentElement?.querySelector('.logo-fallback') as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              <div className="logo-fallback hidden w-full h-full bg-gradient-to-br from-[#212936] to-[#2c3c53] flex items-center justify-center rounded">
                <div className="text-white font-bold text-lg">{offer.lender_name?.charAt(0) || 'L'}</div>
              </div>
            </div>
          ) : (
            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-[#212936] to-[#2c3c53] flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5">
              <div className="text-white font-bold text-lg">{offer.lender_name?.charAt(0) || 'L'}</div>
            </div>
          )}
          <div className="flex-1">
            <h3 className={`text-lg font-semibold ${isHistorical ? 'text-gray-700' : 'text-[#212936]'}`}>
              {offer.lender_name || 'Unknown Lender'}
            </h3>
            <p className="text-sm text-slate-600">Offer ID: #{offer.id?.substring(0, 8)}</p>
          </div>
        </div>
        
        {/* Enhanced offer details in clean card layout */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          {/* Amount Card */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-xl border border-slate-200 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
            <div className="flex justify-between items-start mb-3">
              <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Amount</p>
              <div className="bg-gradient-to-br from-[#212936] to-[#2c3c53] rounded-full p-1.5 shadow-sm">
                <PoundSterling className="h-4 w-4 text-white" />
              </div>
            </div>
            <p className={`font-bold text-xl ${isHistorical ? 'text-gray-700' : 'text-[#212936]'}`}>
              {formatCurrency(offer.offered_amount)}
            </p>
          </div>
          
          {/* Rate Card */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-xl border border-slate-200 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
            <div className="flex justify-between items-start mb-3">
              <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Rate</p>
              <div className="bg-gradient-to-br from-[#212936] to-[#2c3c53] rounded-full p-1.5 shadow-sm">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
            </div>
            <p className={`font-bold text-xl ${isHistorical ? 'text-gray-700' : 'text-[#212936]'}`}>
              {offer.interest_rate ? `${offer.interest_rate}%` : 'Not set'}
            </p>
          </div>
          
          {/* Term Card */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-xl border border-slate-200 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
            <div className="flex justify-between items-start mb-3">
              <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Term</p>
              <div className="bg-gradient-to-br from-[#212936] to-[#2c3c53] rounded-full p-1.5 shadow-sm">
                <Clock className="h-4 w-4 text-white" />
              </div>
            </div>
            <p className={`font-bold text-xl ${isHistorical ? 'text-gray-700' : 'text-[#212936]'}`}>
              {offer.offered_term_months ? `${offer.offered_term_months}m` : 'Not set'}
            </p>
          </div>
          
          {/* Monthly Payment Card */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-xl border border-slate-200 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
            <div className="flex justify-between items-start mb-3">
              <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Monthly</p>
              <div className="bg-gradient-to-br from-[#212936] to-[#2c3c53] rounded-full p-1.5 shadow-sm">
                <Calendar className="h-4 w-4 text-white" />
              </div>
            </div>
            <p className={`font-bold text-xl ${isHistorical ? 'text-gray-700' : 'text-[#212936]'}`}>
              {formatCurrency(monthlyPayment)}
            </p>
          </div>
          
          {/* Total Cost Card */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-xl border border-slate-200 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
            <div className="flex justify-between items-start mb-3">
              <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Total Cost</p>
              <div className="bg-gradient-to-br from-[#212936] to-[#2c3c53] rounded-full p-1.5 shadow-sm">
                <BarChart3 className="h-4 w-4 text-white" />
              </div>
            </div>
            <p className={`font-bold text-xl ${isHistorical ? 'text-gray-700' : 'text-[#212936]'}`}>
              {formatCurrency(totalCost)}
            </p>
          </div>
          
          {/* Total Interest Card */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-xl border border-slate-200 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
            <div className="flex justify-between items-start mb-3">
              <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Interest</p>
              <div className="bg-gradient-to-br from-[#212936] to-[#2c3c53] rounded-full p-1.5 shadow-sm">
                <TrendingDown className="h-4 w-4 text-white" />
              </div>
            </div>
            <p className={`font-bold text-xl ${isHistorical ? 'text-gray-700' : 'text-[#212936]'}`}>
              {formatCurrency(totalInterest)}
            </p>
          </div>
        </div>
        
        {/* Enhanced fees section with premium styling */}
        {(offer.fees && Object.keys(offer.fees).length > 0) && (
          <div className="bg-gradient-to-r from-[#e8f4ff] to-[#f0f9ff] p-4 rounded-xl border border-[#d1e9ff] shadow-sm hover:shadow-md transition-all duration-200">
            <h4 className="font-semibold text-[#212936] text-sm mb-3 flex items-center gap-2">
              <div className="bg-gradient-to-br from-[#ff8000] to-[#ff9a44] rounded-full p-1.5 shadow-sm">
                <PoundSterling className="h-3.5 w-3.5 text-white" />
              </div>
              Additional Fees
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              {Object.entries(offer.fees).map(([feeType, amount]) => (
                <div key={feeType} className="flex justify-between items-center bg-white/60 p-2.5 rounded-lg border border-blue-100/50">
                  <span className="text-gray-600 capitalize font-medium">{feeType.replace(/_/g, ' ')}</span>
                  <span className="font-bold text-[#212936]">{formatCurrency(amount as number)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Enhanced conditions section with premium styling */}
        {(offer.conditions && offer.conditions.length > 0) && (
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-4 rounded-xl border border-amber-100 shadow-sm hover:shadow-md transition-all duration-200">
            <h4 className="font-semibold text-[#212936] text-sm mb-3 flex items-center gap-2">
              <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-full p-1.5 shadow-sm">
                <Shield className="h-3.5 w-3.5 text-white" />
              </div>
              Offer Conditions
            </h4>
            <ul className="space-y-2 text-sm text-gray-700">
              {offer.conditions.map((condition, index) => (
                <li key={index} className="flex items-start gap-3 bg-white/60 p-2.5 rounded-lg border border-amber-100/50">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 mt-1.5 flex-shrink-0 shadow-sm"></div>
                  <span className="font-medium">{condition}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Enhanced action buttons section */}
        <div className="flex flex-col gap-3 pt-6 border-t border-slate-200">
          <Button 
            asChild
            variant="default" 
            size="sm"
            className="w-full bg-[#212936] text-white hover:bg-[#394355] transition-all duration-200 py-3 font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            <Link to={`/offers/${offer.id}`} className="text-white">
              <Award className="mr-2 h-4 w-4" />
              View Details
            </Link>
          </Button>
          
          {isHistorical && offer.status === 'completed' && (
            <LenderReviewDialog
              lenderId={offer.lender_id}
              lenderName={offer.lender_name}
              offerId={offer.id}
              offerAmount={offer.offered_amount}
              trigger={
                <Button size="sm" variant="secondary" className="w-full flex items-center gap-2 py-3 shadow-md hover:shadow-lg transition-all duration-200">
                  <Star className="h-4 w-4" />
                  Leave Review
                </Button>
              }
              onReviewSubmitted={() => {
                toast.success("Thank you for your feedback!");
              }}
            />
          )}
          
          {/* Application info */}
          <div className="bg-gradient-to-b from-slate-50 to-slate-100 rounded-lg p-3 border border-slate-200 mt-2">
            <div className="text-center">
              <p className="text-xs text-slate-600 mb-1 font-mono">
                Application #{formatApplicationNumber(offer.applications || offer.application, offer.application_id)}
              </p>
              {offer.applications && (
                <div className="text-xs text-slate-500">
                  {formatCurrency(offer.applications.loan_amount)} • {offer.applications.purpose}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
