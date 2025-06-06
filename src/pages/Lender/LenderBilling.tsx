import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { getDocuments } from '@/firebase';
import PageLayout from '@/components/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Receipt, Building2, Calendar, PoundSterling, FileText, TrendingUp } from 'lucide-react';

function LenderBillingInner() {
  const { user } = useAuth();

  // Fetch offer history
  const { data: offers } = useQuery({
    queryKey: ['lenderOffers', user?.uid],
    queryFn: async () => {
      if (!user?.uid) {
        throw new Error('User not authenticated');
      }
      
      const { data, error } = await getDocuments('offers', [
        { field: 'lender_id', operator: '==', value: user.uid }
      ], [{ field: 'created_at', direction: 'desc' }]);
      
      if (error) {
        console.error('Error fetching offers:', error);
        return [];
      }
      
      return data || [];
    },
    enabled: !!user?.uid,
  });

  // Calculate billing statistics
  const totalOffers = offers?.length || 0;
  const totalOfferFees = totalOffers * 250; // £250 per offer
  const currentMonthOffers = offers?.filter(offer => {
    const offerDate = new Date(offer.created_at);
    const currentDate = new Date();
    return offerDate.getMonth() === currentDate.getMonth() && 
           offerDate.getFullYear() === currentDate.getFullYear();
  }).length || 0;
  const currentMonthFees = currentMonthOffers * 250;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'accepted': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'withdrawn': 'bg-gray-100 text-gray-800',
      'expired': 'bg-gray-100 text-gray-800'
    };
    
    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
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
          <h1 className="text-3xl font-bold mb-2">Billing & Usage</h1>
          <p className="text-muted-foreground mb-8">
            View your offer history and billing information
          </p>
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total Offers</CardTitle>
                <CardDescription>All time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-orange-600 mr-2" />
                  <div className="text-2xl font-bold">{totalOffers}</div>
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  £{totalOfferFees.toLocaleString()} total fees
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">This Month</CardTitle>
                <CardDescription>Current billing period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-green-600 mr-2" />
                  <div className="text-2xl font-bold">{currentMonthOffers}</div>
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  £{currentMonthFees.toLocaleString()} this month
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Avg Offer Amount</CardTitle>
                <CardDescription>Recent offers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <TrendingUp className="h-5 w-5 text-blue-600 mr-2" />
                  <div className="text-2xl font-bold">
                    £{offers && offers.length > 0 
                      ? Math.round(offers.reduce((sum, offer) => sum + (offer.offered_amount || 0), 0) / offers.length).toLocaleString()
                      : '0'
                    }
                  </div>
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  Based on {offers?.length || 0} offers
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Offer History */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Recent Offers</CardTitle>
              <CardDescription>
                Your submitted financing offers and associated fees
              </CardDescription>
            </CardHeader>
            <CardContent>
              {offers && offers.length > 0 ? (
                <div className="space-y-4">
                  {offers.slice(0, 10).map((offer) => (
                    <div key={offer.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="font-medium">Offer #{offer.offer_number}</div>
                            <div className="text-sm text-muted-foreground">
                              {formatDate(offer.created_at)}
                            </div>
                          </div>
                          {getStatusBadge(offer.status)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">£{offer.offered_amount?.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">
                          {offer.offered_term_months} months @ {offer.interest_rate}%
                        </div>
                      </div>
                      <div className="text-right ml-6">
                        <div className="font-medium text-orange-600">£250</div>
                        <div className="text-sm text-muted-foreground">Offer fee</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No offers submitted yet</p>
                  <p className="text-sm">Start reviewing applications to submit your first offer</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Payment Methods</CardTitle>
                <CardDescription>Available payment options</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Receipt className="h-5 w-5 text-orange-600 mr-2" />
                    <div>
                      <div className="font-medium">Monthly Invoice</div>
                      <div className="text-sm text-muted-foreground">
                        Receive a monthly invoice for all offer fees
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Building2 className="h-5 w-5 text-orange-600 mr-2" />
                    <div>
                      <div className="font-medium">Bank Transfer</div>
                      <div className="text-sm text-muted-foreground">
                        Pay invoices via bank transfer
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Pricing Information</CardTitle>
                <CardDescription>
                  Simple, transparent pricing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <PoundSterling className="h-5 w-5 text-orange-600" />
                    <span className="font-semibold text-orange-800">£250 per offer</span>
                  </div>
                  <p className="text-sm text-orange-700">
                    You only pay when you submit a financing offer to a business. No subscription fees, no hidden costs.
                  </p>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-orange-600 rounded-full mt-2"></div>
                    <div>
                      <span className="font-medium">Monthly Billing:</span> All offer fees are invoiced monthly
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-orange-600 rounded-full mt-2"></div>
                    <div>
                      <span className="font-medium">No Setup Fees:</span> Get started immediately with no upfront costs
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-orange-600 rounded-full mt-2"></div>
                    <div>
                      <span className="font-medium">Pay Only for Results:</span> Fees only apply when you make offers
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
