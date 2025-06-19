import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Landmark, Eye, Calendar, Building, ArrowRight, Star, Search, Filter, TrendingUp, CheckCircle, Clock, AlertCircle, CreditCard } from 'lucide-react';
import { safeConvertDate, formatCurrency, getApplicationStatusStyling, calculateMonthlyPayment, calculateTotalCost, calculateTotalInterest } from '../utils';
import { formatApplicationTitle } from '@/lib/applicationUtils';
import type { Application, Offer } from '../types';

interface ApplicationsWithOffersProps {
  applications: Application[];
  offers: Offer[];
}

export const ApplicationsWithOffers: React.FC<ApplicationsWithOffersProps> = ({ applications, offers }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  // Filter to show applications that have offers or are approved/offered
  const applicationsWithOffers = applications.filter(application => {
    const applicationOffers = offers.filter(offer => offer.application_id === application.id);
    const hasOffers = applicationOffers.length > 0;
    const isApprovedOrOffered = ['approved', 'offered', 'funded', 'accepted'].includes(application.status?.toLowerCase?.());
    return hasOffers || isApprovedOrOffered;
  });

  // Filter by search term
  const filteredApplications = applicationsWithOffers.filter(app => 
    !searchTerm || 
    app.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.loan_purpose?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    formatApplicationTitle(app, app.id).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedApplications = filteredApplications.sort((a, b) => 
    safeConvertDate(b.created_at).getTime() - safeConvertDate(a.created_at).getTime()
  );

  // Calculate stats
  const stats = {
    totalOffers: offers.length,
    acceptedOffers: offers.filter(offer => offer.status === 'accepted').length,
    pendingOffers: offers.filter(offer => offer.status === 'pending_acceptance').length,
    totalValue: offers.reduce((sum, offer) => sum + (offer.offer_amount || 0), 0),
  };

  if (applicationsWithOffers.length === 0) {
    return (
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-blue-700">Total Offers</div>
                <div className="text-2xl font-bold text-blue-900">0</div>
              </div>
              <Star className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-green-700">Accepted</div>
                <div className="text-2xl font-bold text-green-900">0</div>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-orange-700">Pending</div>
                <div className="text-2xl font-bold text-orange-900">0</div>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-purple-700">Total Value</div>
                <div className="text-2xl font-bold text-purple-900">£0</div>
              </div>
              <CreditCard className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>

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
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-blue-700">Total Offers</div>
              <div className="text-2xl font-bold text-blue-900">{stats.totalOffers}</div>
            </div>
            <Star className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-green-700">Accepted</div>
              <div className="text-2xl font-bold text-green-900">{stats.acceptedOffers}</div>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-orange-700">Pending</div>
              <div className="text-2xl font-bold text-orange-900">{stats.pendingOffers}</div>
            </div>
            <Clock className="h-8 w-8 text-orange-500" />
          </div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-purple-700">Total Value</div>
              <div className="text-2xl font-bold text-purple-900">{formatCurrency(stats.totalValue)}</div>
            </div>
            <CreditCard className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Search and Filter Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Applications with Offers</h3>
          <p className="text-gray-600">Review and manage your funding offers</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search applications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter className="h-4 w-4" />
            Filter
          </button>
        </div>
      </div>

      {/* Applications List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-slate-800">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-white">Applications with Offers</h4>
            <span className="text-sm text-slate-300">
              {sortedApplications.length} application{sortedApplications.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <div className="divide-y divide-gray-200">
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
            
            return (
              <div 
                key={application.id} 
                className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => navigate(`/offers?application=${application.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Header with status and offers count */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusStyling.bgClass} ${statusStyling.textClass}`}>
                        {statusStyling.label}
                      </div>
                      {applicationOffers.length > 0 && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                          <Star className="h-3 w-3 mr-1" />
                          {applicationOffers.length} offer{applicationOffers.length > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                    
                    {/* Application details */}
                    <h5 className="text-lg font-semibold text-gray-900 mb-2">
                      {formatApplicationTitle(application, application.id)}
                    </h5>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <div className="text-sm text-gray-500">Requested Amount</div>
                        <div className="text-lg font-semibold text-gray-900">{formatCurrency(application.loan_amount)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Purpose</div>
                        <div className="text-sm text-gray-900">{application.loan_purpose || 'Business funding'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Applied</div>
                        <div className="text-sm text-gray-900">{safeConvertDate(application.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>

                    {/* Best offer details if available */}
                    {bestOffer && (
                      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800">Best Offer Available</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-green-700">Amount: </span>
                            <span className="font-semibold text-green-900">{formatCurrency(bestOffer.offer_amount)}</span>
                          </div>
                          <div>
                            <span className="text-green-700">Rate: </span>
                            <span className="font-semibold text-green-900">{bestOffer.interest_rate}%</span>
                          </div>
                          <div>
                            <span className="text-green-700">Monthly: </span>
                            <span className="font-semibold text-green-900">{formatCurrency(monthlyPayment)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Action button */}
                  <div className="ml-6">
                    <ArrowRight className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
