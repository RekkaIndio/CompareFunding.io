import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  PoundSterling, Calendar, TrendingUp, Target, Clock, BarChart3, 
  Award, Shield, TrendingDown, Star, Eye, Search
} from 'lucide-react';
import { toast } from 'sonner';
import { Offer, GroupedOffers } from './types';
import { ApplicationLogo } from './ApplicationLogo';
import { 
  formatCurrency, 
  calculateTotalCost, 
  calculateMonthlyPayment, 
  calculateTotalInterest, 
  getStatusStyling 
} from './utils';
import { formatApplicationNumber } from '@/lib/applicationUtils';
import LenderReviewDialog from '@/components/LenderReviewDialog';

interface ApplicationOffersCardProps {
  applicationId: string;
  groupData: GroupedOffers[string];
  isHistorical?: boolean;
  id?: string;
}

export const ApplicationOffersCard: React.FC<ApplicationOffersCardProps> = ({ 
  applicationId, 
  groupData, 
  isHistorical = false, 
  id
}) => {
  const { application_details, offers } = groupData;
  const hasNoOffers = offers.length === 0 || (offers.length === 1 && offers[0].status === 'no-offers');
  
  // Filter out any no-offers placeholders to get real offers only
  const realOffers = offers.filter(offer => offer.status !== 'no-offers');
  
  const bestOffer = realOffers[0];
  const statusStyling = getStatusStyling(bestOffer?.status || 'pending');
  
  return (
    <Card 
      id={id}
      className={`relative overflow-hidden bg-white hover:shadow-2xl border transition-all duration-300 border-slate-200/80 rounded-xl shadow-lg transform hover:-translate-y-1 ${
      isHistorical 
        ? 'opacity-75 hover:opacity-90' 
        : hasNoOffers 
          ? 'opacity-60 bg-gradient-to-br from-gray-50 to-gray-100 hover:opacity-80' 
          : ''
    }`}>
      {/* Premium status indicator bar */}
      <div className={`h-1.5 w-full ${
        isHistorical ? 'bg-gradient-to-r from-gray-400 to-gray-500' : 
        hasNoOffers ? 'bg-gradient-to-r from-gray-300 to-gray-400' :
        'bg-gradient-to-r from-amber-400 to-amber-600'
      }`}></div>
      
      {/* Enhanced header with sophisticated styling matching dashboard cards */}
      <CardHeader className={`relative overflow-hidden text-white pb-6 ${
        hasNoOffers 
          ? 'bg-gradient-to-br from-gray-600 to-gray-700' 
          : 'bg-gradient-to-br from-[#212936] to-[#2c3c53]'
      }`}>
        <div className={`absolute -top-8 -right-8 w-32 h-32 bg-gradient-to-br rounded-full ${
          hasNoOffers 
            ? 'from-gray-500/20 to-gray-600/20 opacity-30' 
            : isHistorical 
              ? 'from-[#ff8000]/20 to-[#ffaa00]/20 opacity-30' 
              : 'from-[#ff8000]/20 to-[#ffaa00]/20 opacity-50'
        }`}></div>
        <div className={`absolute -bottom-6 -left-6 w-20 h-20 bg-gradient-to-br rounded-full ${
          hasNoOffers 
            ? 'from-gray-500/10 to-gray-600/10 opacity-30' 
            : isHistorical 
              ? 'from-[#ff8000]/10 to-[#ffaa00]/10 opacity-30' 
              : 'from-[#ff8000]/10 to-[#ffaa00]/10 opacity-40'
        }`}></div>
        <div className="flex justify-between items-start relative z-10">
          <div className="flex-1">
            <CardTitle className={`text-2xl mb-4 flex items-center gap-3 font-bold ${
              isHistorical ? 'text-gray-200' : hasNoOffers ? 'text-gray-100' : 'text-white'
            }`}>
              <ApplicationLogo 
                logoUrl={application_details.business_logo_url} 
                businessName={application_details.business_name}
              />
              Funding Application #{formatApplicationNumber(application_details, application_details.id)}
              {hasNoOffers && (
                <div className="ml-3 text-sm bg-gray-500/20 px-3 py-1 rounded-full border border-gray-400/30">
                  Awaiting Offers
                </div>
              )}
            </CardTitle>
            <CardDescription className="text-white/90 flex items-center gap-4 flex-wrap text-sm">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-full border border-white/20">
                <PoundSterling className="h-4 w-4 text-white" />
                <span className="font-semibold text-white">{formatCurrency(application_details.loan_amount)} requested</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-full border border-white/20">
                <Clock className="h-4 w-4 text-white" />
                <span className="font-semibold text-white">{application_details.loan_term_months} months</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-full border border-white/20">
                <Target className="h-4 w-4 text-white" />
                <span className="font-semibold text-white">{application_details.purpose}</span>
              </div>
            </CardDescription>
          </div>
          <div className="text-right">
            <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold shadow-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white`}>
              <BarChart3 className="h-4 w-4 mr-2" />
              {hasNoOffers 
                ? 'No Offers Yet' 
                : `${realOffers.length} Offer${realOffers.length !== 1 ? 's' : ''} Available`
              }
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className={`p-6 space-y-6 ${
        isHistorical ? 'bg-gray-50/50' : hasNoOffers ? 'bg-gray-50/30' : 'bg-white'
      }`}>
        {hasNoOffers ? (
          // Special content for applications with no offers
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                <Clock className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-3">Offers Coming Soon</h3>
              <p className="text-gray-600 mb-6">
                Your application is being reviewed by our lender network. Competitive offers typically arrive within 24-48 hours.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-500 rounded-full p-1 mt-0.5">
                    <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">What happens next?</p>
                    <ul className="space-y-1 text-blue-700">
                      <li>• Lenders are reviewing your application</li>
                      <li>• You'll receive email notifications for new offers</li>
                      <li>• Compare and choose the best terms for your business</li>
                    </ul>
                  </div>
                </div>
              </div>
              <Button 
                asChild
                className="bg-gradient-to-r from-[#ff8000] to-[#ffaa00] hover:from-[#ff9900] hover:to-[#ffbb00] text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
              >
                <Link to={`/applications/${applicationId}/review`}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Application Details
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          // Regular offers display
          <>
            {/* Display offers vertically with premium styling */}
            {realOffers.map((offer, index) => (
              <div key={offer.id}>
                {/* Actual offer content with premium dashboard styling */}
                <div className="relative border rounded-xl p-6 transition-all duration-200 group hover:shadow-xl border-slate-200/80 bg-gradient-to-br from-white to-slate-50/30 shadow-md backdrop-blur-sm hover:border-slate-300/80 hover:-translate-y-0.5">
                  {index === 0 && !isHistorical && (
                    <div className="absolute -top-3 left-6">
                      <div className="bg-gradient-to-r from-[#212936] to-[#2c3c53] text-white px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg">
                        <Award className="h-3.5 w-3.5 text-[#ff8000]" />
                        Best Rate
                      </div>
                    </div>
                  )}
                  
                  {/* Premium lender info and status */}
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      {/* Premium lender logo with enhanced styling */}
                      {offer.company_logo ? (
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-white shadow-lg border border-slate-200 flex items-center justify-center group-hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5">
                          <img 
                            src={offer.company_logo} 
                            alt={`${offer.lender_name} logo`}
                            className="max-w-full max-h-full object-contain p-1"
                            onError={(e) => {
                              const img = e.target as HTMLImageElement;
                              img.style.display = 'none';
                              const fallback = img.parentElement?.querySelector('.logo-fallback') as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                          <div className="logo-fallback hidden w-full h-full bg-gradient-to-br from-[#212936] to-[#2c3c53] flex items-center justify-center rounded-lg">
                            <div className="text-white font-bold text-lg">{offer.lender_name?.charAt(0) || 'L'}</div>
                          </div>
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-[#212936] to-[#2c3c53] flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5">
                          <div className="text-white font-bold text-lg">{offer.lender_name?.charAt(0) || 'L'}</div>
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className={`font-bold text-xl mb-2 ${isHistorical ? 'text-gray-700' : 'text-[#212936]'}`}>
                          {offer.lender_name || 'Unknown Lender'}
                        </h4>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-2 text-slate-600">
                            <Calendar className="h-4 w-4" />
                            <span>Expires: {offer.expires_at ? new Date(offer.expires_at).toLocaleDateString('en-GB') : 'Not set'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold shadow-lg ${
                      isHistorical ? 'bg-gray-200 text-gray-700' : `${getStatusStyling(offer.status).bgClass} ${getStatusStyling(offer.status).textClass}`
                    }`}>
                      {getStatusStyling(offer.status).label}
                    </div>
                  </div>
                  
                  {/* Enhanced offer metrics with clean styling */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
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
                    <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-xl border border-slate-200 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
                      <div className="flex justify-between items-start mb-3">
                        <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Monthly</p>
                        <div className="bg-gradient-to-br from-[#212936] to-[#2c3c53] rounded-full p-1.5 shadow-sm">
                          <Calendar className="h-4 w-4 text-white" />
                        </div>
                      </div>
                      <p className={`font-bold text-xl ${isHistorical ? 'text-gray-700' : 'text-[#212936]'}`}>
                        {formatCurrency(calculateMonthlyPayment(offer))}
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-xl border border-slate-200 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
                      <div className="flex justify-between items-start mb-3">
                        <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Total Cost</p>
                        <div className="bg-gradient-to-br from-[#212936] to-[#2c3c53] rounded-full p-1.5 shadow-sm">
                          <BarChart3 className="h-4 w-4 text-white" />
                        </div>
                      </div>
                      <p className={`font-bold text-xl ${isHistorical ? 'text-gray-700' : 'text-[#212936]'}`}>
                        {formatCurrency(calculateTotalCost(offer))}
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-xl border border-slate-200 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
                      <div className="flex justify-between items-start mb-3">
                        <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Interest</p>
                        <div className="bg-gradient-to-br from-[#212936] to-[#2c3c53] rounded-full p-1.5 shadow-sm">
                          <TrendingDown className="h-4 w-4 text-white" />
                        </div>
                      </div>
                      <p className={`font-bold text-xl ${isHistorical ? 'text-gray-700' : 'text-[#212936]'}`}>
                        {formatCurrency(calculateTotalInterest(offer))}
                      </p>
                    </div>
                  </div>
                  
                  {/* Fees and Conditions sections */}
                  {offer.fees && Object.keys(offer.fees).length > 0 && (
                    <div className="mb-4">
                      <h5 className="font-semibold text-sm text-gray-700 mb-2">Fees:</h5>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {Object.entries(offer.fees).map(([feeType, amount]) => (
                          <div key={feeType} className="bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                            <div className="text-xs text-gray-600 capitalize">{feeType.replace('_', ' ')}</div>
                            <div className="font-semibold text-gray-800">{formatCurrency(amount as number)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {offer.conditions && offer.conditions.length > 0 && (
                    <div className="mb-4">
                      <h5 className="font-semibold text-sm text-gray-700 mb-2">Conditions:</h5>
                      <ul className="space-y-1">
                        {offer.conditions.map((condition, idx) => (
                          <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                            {condition}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Enhanced action buttons with premium styling */}
                  <div className="flex justify-end mt-4 space-x-3">
                    <Button 
                      asChild
                      size="sm" 
                      variant="outline"
                      className="border-gray-300 text-gray-600 hover:bg-gray-100 shadow-sm hover:shadow-md transition-all duration-200"
                    >
                        <Link to={`/offers/${offer.id}`} className="text-white">
                        <Award className="h-4 w-4 mr-1.5" />
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
                          <Button size="sm" variant="secondary" className="flex items-center gap-1.5 shadow-sm hover:shadow-md transition-all duration-200">
                            <Star className="h-4 w-4" />
                            Review
                          </Button>
                        }
                        onReviewSubmitted={() => {
                          toast.success("Thank you for your feedback!");
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            <Separator className="my-6 bg-gray-200" />
            
            {/* Enhanced summary section with marketplace button */}
            <div className="flex flex-col items-center gap-4">
              <div className="text-sm text-gray-600">
                Application #{formatApplicationNumber(application_details, applicationId)}
              </div>
              
              {/* Lender Marketplace Button */}
              {!isHistorical && (
                <Button 
                  asChild
                  size="sm"
                  className="bg-gradient-to-r from-[#ff8000] to-[#ffaa00] hover:from-[#ff9900] hover:to-[#ffbb00] text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <Link to={`/lender-marketplace/${applicationId}`}>
                    <Search className="h-4 w-4 mr-2" />
                    Find More Lenders
                  </Link>
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
