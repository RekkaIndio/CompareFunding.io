import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Landmark, Eye, Calendar, Building, ArrowRight, Star } from 'lucide-react';
import { safeConvertDate, formatCurrency, getApplicationStatusStyling, calculateMonthlyPayment, calculateTotalCost, calculateTotalInterest } from '../utils';
import { formatApplicationTitle } from '@/lib/applicationUtils';
import type { Application, Offer } from '../types';

interface ApplicationsWithOffersProps {
  applications: Application[];
  offers: Offer[];
}

export const ApplicationsWithOffers: React.FC<ApplicationsWithOffersProps> = ({ applications, offers }) => {
  const navigate = useNavigate();

  // Filter to show applications that have offers or are approved/offered
  const applicationsWithOffers = applications.filter(application => {
    const applicationOffers = offers.filter(offer => offer.application_id === application.id);
    const hasOffers = applicationOffers.length > 0;
    const isApprovedOrOffered = ['approved', 'offered', 'funded', 'accepted'].includes(application.status?.toLowerCase?.());
    return hasOffers || isApprovedOrOffered;
  });

  const sortedApplications = applicationsWithOffers.sort((a, b) => 
    safeConvertDate(b.created_at).getTime() - safeConvertDate(a.created_at).getTime()
  );

  if (applicationsWithOffers.length === 0) {
    return (
      <Card className="bg-white border border-gray-200 shadow-sm rounded-xl">
        <CardContent className="pt-6 flex flex-col items-center justify-center text-center p-12 bg-white text-gray-600">
          <Landmark className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Offers Yet</h3>
          <p className="text-gray-600 mb-6 max-w-md">
            Once lenders review your applications, their offers will appear here.
          </p>
          <Button 
            onClick={() => navigate('/lenders')}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
          >
            <Eye className="h-4 w-4 mr-2" />
            Browse Lenders
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-8">
      {sortedApplications.map((application) => {
        const statusStyling = getApplicationStatusStyling(application.status);
        const applicationOffers = offers.filter(offer => offer.application_id === application.id);
        const bestOffer = applicationOffers.length > 0 
          ? applicationOffers.sort((a, b) => a.interest_rate - b.interest_rate)[0]
          : null;
        
        const displayAmount = bestOffer?.offer_amount || application.loan_amount;
        const displayRate = bestOffer?.interest_rate || 8.5;
        const displayTerm = bestOffer?.term_months || 60;
        
        const monthlyPayment = calculateMonthlyPayment(displayAmount, displayRate, displayTerm);
        const totalCost = calculateTotalCost(displayAmount, displayRate, displayTerm);
        const totalInterest = calculateTotalInterest(displayAmount, displayRate, displayTerm);
        
        return (
          <Card 
            key={application.id} 
            className="overflow-hidden transition-all duration-300 transform hover:-translate-y-1 rounded-xl shadow-lg hover:shadow-xl bg-white/95 backdrop-blur-sm border-slate-200/50 hover:shadow-2xl cursor-pointer"
            onClick={() => navigate(`/offers?application=${application.id}`)}
          >
            {/* Enhanced status indicator bar with premium gradient - matching OffersList */}
            <div className={`h-3 w-full bg-gradient-to-r ${statusStyling.gradient}`}></div>
            
            {/* Enhanced header with sophisticated styling matching OffersList */}
            <CardHeader className="relative overflow-hidden bg-gradient-to-br from-[#212936] to-[#2c3c53] text-white">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm ${statusStyling.bgClass} ${statusStyling.textClass} border border-white/20`}>
                      {statusStyling.label}
                    </div>
                    {applicationOffers.length > 0 && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                        <Star className="h-3 w-3 mr-1" />
                        {applicationOffers.length} offer{applicationOffers.length > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                  <ArrowRight className="h-5 w-5 text-white/70 hover:text-white transition-colors" />
                </div>
                
                <CardTitle className="text-xl font-bold text-white mb-2">
                  {formatApplicationTitle(application, application.id)}
                </CardTitle>
                
                <div className="flex items-center gap-6 text-white/80 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Applied {safeConvertDate(application.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    <span className="font-semibold">{application.company_name || 'Business'}</span>
                  </div>
                </div>
              </div>
              
              {/* Background pattern matching OffersList */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
            </CardHeader>
            
            <CardContent className="p-6 bg-white">
              {/* Simplified application content - only funding amount and description */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                {/* Funding Amount */}
                <div className="text-center md:text-left">
                  <div className="text-3xl font-bold text-[#212936] mb-2">
                    {formatCurrency(application.loan_amount)}
                  </div>
                  <div className="text-sm text-gray-600">Requested Amount</div>
                </div>
                
                {/* Purpose/Description */}
                <div className="text-center md:text-left">
                  <div className="text-sm font-medium text-gray-700 mb-1">Purpose</div>
                  <div className="text-gray-600 text-sm line-clamp-2">
                    {application.loan_purpose || 'Business funding'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
