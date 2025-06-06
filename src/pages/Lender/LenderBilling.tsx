import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getDocuments } from '@/firebase';
import { useEffect } from 'react';
import PageLayout from '@/components/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  Receipt, 
  Building2, 
  Calendar, 
  PoundSterling, 
  FileText, 
  TrendingUp,
  CreditCard,
 
} from 'lucide-react';

function LenderBillingInner() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch offer history
  const { data: offers, isLoading, refetch } = useQuery({
    queryKey: ['lenderOffers', user?.uid],
    queryFn: async () => {
      if (!user?.uid) {
        throw new Error('User not authenticated');
      }
      
      console.log('🔍 Fetching offers for lender:', user.uid);
      
      const { data, error } = await getDocuments('offers', [
        { field: 'lender_id', operator: '==', value: user.uid }
      ], [{ field: 'created_at', direction: 'desc' }]);
      
      console.log('📊 Offers query result:', { data, error, count: data?.length });
      
      if (data && data.length > 0) {
        console.log('🔍 Raw offers data:', data);
        data.forEach((offer, index) => {
          console.log(`📄 Offer ${index + 1}:`, {
            id: offer.id,
            offer_number: offer.offer_number,
            lender_id: offer.lender_id,
            offered_amount: offer.offered_amount,
            created_at: offer.created_at,
            status: offer.status
          });
        });
      }
      
      if (error) {
        console.error('Error fetching offers:', error);
        return [];
      }
      
      return data || [];
    },
    enabled: !!user?.uid,
  });

  // Debug logging when component mounts and data changes
  useEffect(() => {
    console.log('🎬 LenderBilling component mounted/updated');
    console.log('👤 Current user:', user?.uid);
    console.log('📊 Current offers:', offers?.length || 0);
    console.log('⏰ Query enabled:', !!user?.uid);
    console.log('⌛ Is loading:', isLoading);
  }, [user?.uid, offers?.length, isLoading]);

  // Calculate billing statistics
  const totalOffers = offers?.length || 0;
  const totalOfferFees = totalOffers * 250; // £250 per offer
  const currentMonthOffers = offers?.filter(offer => {
    try {
      let offerDate;
      
      // Handle Firebase Timestamp objects
      if (offer.created_at && typeof offer.created_at === 'object' && offer.created_at.seconds) {
        offerDate = new Date(offer.created_at.seconds * 1000);
      } else if (offer.created_at && typeof offer.created_at === 'string') {
        offerDate = new Date(offer.created_at);
      } else {
        return false; // Skip invalid dates
      }
      
      const currentDate = new Date();
      return offerDate.getMonth() === currentDate.getMonth() && 
             offerDate.getFullYear() === currentDate.getFullYear();
    } catch (error) {
      console.error('Error parsing offer date:', error, offer.created_at);
      return false;
    }
  }).length || 0;
  const currentMonthFees = currentMonthOffers * 250;
  
  // Calculate current invoice amount (all unpaid offers)
  // For now, we'll assume all offers are unpaid since we don't have a payment tracking system yet
  // In the future, you could add a 'paid' or 'invoiced' field to track payment status
  const currentInvoiceAmount = totalOfferFees; // All offers are considered unpaid for now
  const currentInvoiceOffers = totalOffers;

  const formatDate = (dateValue: any) => {
    try {
      let date;
      
      // Handle Firebase Timestamp objects
      if (dateValue && typeof dateValue === 'object' && dateValue.seconds) {
        // Firebase Timestamp object
        date = new Date(dateValue.seconds * 1000);
      } else if (dateValue && typeof dateValue === 'string') {
        // ISO string
        date = new Date(dateValue);
      } else if (dateValue instanceof Date) {
        // Already a Date object
        date = dateValue;
      } else {
        // Fallback to current date if invalid
        console.warn('Invalid date value:', dateValue);
        date = new Date();
      }
      
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error, dateValue);
      return 'Invalid Date';
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'pending': { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
      'accepted': { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
      'rejected': { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
      'withdrawn': { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' },
      'expired': { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <Badge className={`${config.bg} ${config.text} ${config.border} border font-medium px-3 py-1 rounded-full text-xs`}>
        {status}
      </Badge>
    );
  };

  return (
    <PageLayout>
      <div className="container py-8">
        <Button
          variant="ghost"
          className="mb-6 flex items-center"
          onClick={() => window.location.href = '/lender/dashboard'}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
        
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-3">Billing & Usage</h1>
              <p className="text-lg text-slate-600">
                View your offer history and billing information
              </p>
            </div>
            <Button
              onClick={() => {
              console.log('🔄 Refreshing offers data...');
              refetch();
              }}
              variant="outline"
              className="flex items-center gap-2 bg-slate-900 text-white hover:text-[#ff8000] border-none"
            >
              <TrendingUp className="h-4 w-4" />
              Refresh
            </Button>
          </div>
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/50 overflow-hidden">
              <div className="bg-slate-900 px-6 py-4">
                <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Total Offers
                </CardTitle>
                <CardDescription className="text-slate-300">All time</CardDescription>
              </div>
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-slate-900 mb-2">{totalOffers}</div>
                <div className="text-sm text-slate-600">
                  £{totalOfferFees.toLocaleString()} total fees
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/50 overflow-hidden">
              <div className="bg-slate-900 px-6 py-4">
                <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  This Month
                </CardTitle>
                <CardDescription className="text-slate-300">Current billing period</CardDescription>
              </div>
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-slate-900 mb-2">{currentMonthOffers}</div>
                <div className="text-sm text-slate-600">
                  offers submitted
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/50 overflow-hidden">
              <div className="bg-slate-900 px-6 py-4">
                <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Current Invoice
                </CardTitle>
                <CardDescription className="text-slate-300">Total amount to be invoiced</CardDescription>
              </div>
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-slate-900 mb-2">£{currentInvoiceAmount.toLocaleString()}</div>
                <div className="text-sm text-slate-600">
                  {currentInvoiceOffers} × £250 per offer
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/50 overflow-hidden">
              <div className="bg-slate-900 px-6 py-4">
                <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Avg Offer Amount
                </CardTitle>
                <CardDescription className="text-slate-300">Recent offers</CardDescription>
              </div>
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-slate-900 mb-2">
                  £{offers && offers.length > 0 
                    ? Math.round(offers.reduce((sum, offer) => sum + (offer.offered_amount || 0), 0) / offers.length).toLocaleString()
                    : '0'
                  }
                </div>
                <div className="text-sm text-slate-600">
                  Based on {offers?.length || 0} offers
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Offer History */}
          <Card className="mb-8 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/50 overflow-hidden">
            <div className="bg-slate-800 px-6 py-4">
              <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Recent Offers
              </CardTitle>
              <CardDescription className="text-slate-300">
                Your submitted financing offers and associated fees
                <br />
                <span className="text-xs text-slate-400">
                  Debug: Found {offers?.length || 0} offers for user {user?.uid || 'N/A'}
                </span>
              </CardDescription>
            </div>
            <CardContent className="p-6">
              {offers && offers.length > 0 ? (
                <div className="space-y-4">
                  {offers.slice(0, 10).map((offer) => (
                    <div key={offer.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-orange-100 rounded-lg">
                            <FileText className="h-4 w-4 text-orange-600" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">Application #{offer.application_id || 'N/A'}</div>
                            <div className="text-sm text-slate-600">
                              {formatDate(offer.created_at)}
                            </div>
                          </div>
                          {getStatusBadge(offer.status)}
                        </div>
                      </div>
                      <div className="text-right mr-6">
                        <div className="font-bold text-lg text-slate-900">£{offer.offered_amount?.toLocaleString()}</div>
                        <div className="text-sm text-slate-600">
                          {offer.offered_term_months} months @ {offer.interest_rate}%
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg text-orange-600">£250</div>
                        <div className="text-sm text-slate-600">Offer fee</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="p-4 bg-slate-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <FileText className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No offers submitted yet</h3>
                  <p className="text-slate-600 mb-4">Start reviewing applications to submit your first offer</p>
                  <Button 
                    onClick={() => navigate('/lender/applications')}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                  >
                    Browse Applications
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/50 overflow-hidden">
              <div className="bg-slate-800 px-6 py-4">
                <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Methods
                </CardTitle>
                <CardDescription className="text-slate-300">Available payment options</CardDescription>
              </div>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="p-2 bg-orange-100 rounded-lg mr-4">
                      <Receipt className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">Monthly Invoice</div>
                      <div className="text-sm text-slate-600">
                        Receive a monthly invoice for all offer fees
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="p-2 bg-orange-100 rounded-lg mr-4">
                      <Building2 className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">Bank Transfer</div>
                      <div className="text-sm text-slate-600">
                        Pay invoices via bank transfer
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/50 overflow-hidden">
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
                <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                  <PoundSterling className="h-5 w-5" />
                  Pricing Information
                </CardTitle>
                <CardDescription className="text-orange-100">
                  Simple, transparent pricing
                </CardDescription>
              </div>
              <CardContent className="p-6 space-y-4">
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-orange-500 rounded-lg">
                      <PoundSterling className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-2xl font-bold text-orange-800">£250 per offer</span>
                  </div>
                  <p className="text-orange-700 font-medium">
                    You only pay when you submit a financing offer to a business. No subscription fees, no hidden costs.
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <div className="text-sm">
                      <span className="font-semibold text-slate-900">Monthly Billing:</span>
                      <span className="text-slate-600 ml-1">All offer fees are invoiced monthly</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <div className="text-sm">
                      <span className="font-semibold text-slate-900">No Setup Fees:</span>
                      <span className="text-slate-600 ml-1">Get started immediately with no upfront costs</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <div className="text-sm">
                      <span className="font-semibold text-slate-900">Pay Only for Results:</span>
                      <span className="text-slate-600 ml-1">Fees only apply when you make offers</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

export default LenderBillingInner;
