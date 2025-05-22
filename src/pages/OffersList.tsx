import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDocuments } from '@/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import PageLayout from '@/components/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, ChevronRight, Download, InboxIcon, MessageSquare, Star, ArrowRight, RefreshCcw, Edit } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import LenderReviewDialog from '@/components/LenderReviewDialog';

type Offer = {
  id: string;
  application_id: string;
  lender_id: string;
  lender_name: string;
  interest_rate: number;
  offer_amount: number;
  term_months: number;
  status: string;
  offer_date: string;
  expires_at: string;
  fees: Record<string, number>;
  conditions: string[];
  created_at: string;
  // For lender view
  business_name?: string;
  business_id?: string;
};

const OffersList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('active');
  const isLender = user?.role === 'lender';

  // Fetch offers data using Firebase - adapted to handle both business and lender roles
  const { data: offers, isLoading } = useQuery({
    queryKey: ['offers', user?.uid, isLender],
    queryFn: async () => {
      if (!user?.uid) {
        throw new Error('User not authenticated');
      }

      if (isLender) {
        // For lenders: Get all offers created by this lender
        const { data: lenderOffers, error: offerError } = await getDocuments(
          'offers',
          [{ field: 'lender_id', operator: '==', value: user.uid }],
          [{ field: 'created_at', direction: 'desc' }]
        );
        
        if (offerError) {
          toast.error('Failed to load your offers');
          throw offerError;
        }
        
        // Enhance with business and application details
        if (lenderOffers && lenderOffers.length > 0) {
          const enhancedOffers = await Promise.all(
            lenderOffers.map(async (offer) => {
              // Get application details
              const { data: application } = await getDocuments(
                'applications',
                [{ field: 'id', operator: '==', value: offer.application_id }]
              );
              
              let businessName = 'Unknown business';
              let businessId = '';
              
              // Get business details if we have application
              if (application && application[0]) {
                const appBusinessId = application[0].business_id || application[0].user_id;
                if (appBusinessId) {
                  const { data: business } = await getDocuments(
                    'business_profiles',
                    [{ field: 'id', operator: '==', value: appBusinessId }]
                  );
                  
                  if (business && business[0]) {
                    businessName = business[0].business_name;
                    businessId = business[0].id;
                  }
                }
              }
              
              return {
                ...offer,
                business_name: businessName,
                business_id: businessId,
                application: application?.[0] || null
              };
            })
          );
          
          return enhancedOffers as Offer[];
        }
        
        return lenderOffers as Offer[];
      } else {
        // For businesses: Get offers for this business's applications
        const { data: applications, error: appError } = await getDocuments(
          'applications',
          [{ field: 'user_id', operator: '==', value: user?.uid }]
        );
        
        if (appError) {
          toast.error('Failed to load applications');
          throw appError;
        }
        
        if (!applications || applications.length === 0) {
          // No applications, so no offers
          return [];
        }
        
        // Get application IDs
        const applicationIds = applications.map(app => app.id);
        
        // Get offers for these applications
        const allOffers: any[] = [];
        
        for (const appId of applicationIds) {
          const { data: appOffers, error: offersError } = await getDocuments(
            'offers',
            [{ field: 'application_id', operator: '==', value: appId }],
            [{ field: 'created_at', direction: 'desc' }]
          );
          
          if (offersError) {
            console.error('Error fetching offers for application:', appId, offersError);
            continue;
          }
          
          if (appOffers) {
            // Add application details to each offer
            const app = applications.find(a => a.id === appId);
            
            const offersWithAppDetails = appOffers.map(offer => ({
              ...offer,
              // Mimic the Supabase nested structure
              applications: app ? {
                id: app.id,
                loan_amount: app.loan_amount,
                loan_term_months: app.loan_term_months,
                purpose: app.purpose,
                status: app.status
              } : null
            }));
            
            allOffers.push(...offersWithAppDetails);
          }
        }
        
        // Sort by created_at date
        allOffers.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        
        return allOffers as Offer[];
      }
    },
    enabled: !!user,
  });
  
  // Group offers
  const activeOffers = offers?.filter(offer => 
    ['pending', 'accepted', 'negotiating'].includes(offer.status)
  ) || [];
  
  const historicalOffers = offers?.filter(offer => 
    ['expired', 'declined', 'withdrawn', 'completed'].includes(offer.status)
  ) || [];
  
  const isEmptyActiveOffers = activeOffers.length === 0;
  const isEmptyHistoricalOffers = historicalOffers.length === 0;
  
  // Get the title and description based on user role
  const getTitle = () => {
    return isLender ? "Offers Extended" : "Your Funding Offers";
  };
  
  const getDescription = () => {
    return isLender 
      ? "Manage financing offers you've extended to businesses" 
      : "Compare and manage loan offers from lenders";
  };

  // Get empty state message based on user role
  const getEmptyActiveOffersContent = () => {
    if (isLender) {
      return (
        <CardContent className="pt-6 flex flex-col items-center justify-center text-center p-12">
          <InboxIcon className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Active Offers</h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            You haven't extended any offers to businesses yet. Find a suitable application to create your first offer.
          </p>
          <Button asChild className="bg-fundhub-blue hover:bg-fundhub-blue/90">
            <Link to="/matched-applications">Browse Applications</Link>
          </Button>
        </CardContent>
      );
    } else {
      return (
        <CardContent className="pt-6 flex flex-col items-center justify-center text-center p-12">
          <InboxIcon className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Active Offers</h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            You don't have any active financing offers at the moment. Create a new application to receive offers from lenders.
          </p>
          <Button asChild className="bg-fundhub-blue hover:bg-fundhub-blue/90">
            <Link to="/applications/new">Create New Application</Link>
          </Button>
        </CardContent>
      );
    }
  };
  
  return (
    <PageLayout>
      <div className="container py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{getTitle()}</h1>
            <p className="text-muted-foreground">
              {getDescription()}
            </p>
          </div>
          
          {isLender && (
            <Button 
              className="bg-fundhub-blue hover:bg-fundhub-blue/90"
              onClick={() => navigate('/matched-applications')}
            >
              <ArrowRight className="mr-2 h-4 w-4" />
              Find Applications
            </Button>
          )}
        </div>
        
        <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="active">Active Offers</TabsTrigger>
            <TabsTrigger value="history">Past Offers</TabsTrigger>
          </TabsList>
          
          <TabsContent value="active">
            {isLoading ? (
              <div className="grid gap-4 grid-cols-1">
                {[1, 2].map((i) => (
                  <Card key={i} className="h-40 animate-pulse bg-gray-100"></Card>
                ))}
              </div>
            ) : isEmptyActiveOffers ? (
              <Card>
                {getEmptyActiveOffersContent()}
              </Card>
            ) : (
              <div className="space-y-4">
                {activeOffers.map((offer) => (
                  <Card key={offer.id} className="overflow-hidden">
                    <CardHeader className="bg-fundhub-light-blue/50 pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>
                            {isLender ? offer.business_name : offer.lender_name}
                          </CardTitle>
                          <CardDescription>
                            Offer expires: {new Date(offer.expires_at).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-medium text-fundhub-blue">
                            {offer.status === 'pending' ? 'Awaiting Response' : 
                             offer.status === 'accepted' ? 'Accepted' : 
                             offer.status === 'negotiating' ? 'In Negotiation' : offer.status}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Loan Amount</p>
                          <p className="font-semibold text-lg">
                            £{typeof offer.offer_amount === 'number' ? offer.offer_amount.toLocaleString() : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Interest Rate</p>
                          <p className="font-semibold text-lg">
                            {typeof offer.interest_rate === 'number' ? offer.interest_rate : 'N/A'}%
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Term</p>
                          <p className="font-semibold text-lg">{offer.term_months} months</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Total Cost</p>
                          <p className="font-semibold text-lg">
                            £{typeof offer.offer_amount === 'number' && typeof offer.interest_rate === 'number' ? Math.round(offer.offer_amount * (1 + (offer.interest_rate / 100))).toLocaleString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                      
                      <Separator className="my-3" />
                      
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-muted-foreground">
                          {isLender ? 
                            `For application: ${offer.application_id.substring(0, 8)}...` :
                            `From lender: ${offer.lender_name}`
                          }
                        </div>
                        <div className="space-x-2">
                          {isLender && offer.status === 'pending' && (
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4 mr-1" /> Edit
                            </Button>
                          )}
                          {isLender && offer.status === 'accepted' && (
                            <Button size="sm" className="bg-fundhub-blue hover:bg-fundhub-blue/90">
                              <MessageSquare className="h-4 w-4 mr-1" /> Message
                            </Button>
                          )}
                          <Button 
                            asChild
                            size="sm" 
                            className="bg-fundhub-blue hover:bg-fundhub-blue/90"
                          >
                            <Link to={`/offers/${offer.id}`}>
                              View Offer <ChevronRight className="h-4 w-4 ml-1" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="history">
            {isLoading ? (
              <div className="grid gap-4 grid-cols-1">
                {[1, 2].map((i) => (
                  <Card key={i} className="h-40 animate-pulse bg-gray-100"></Card>
                ))}
              </div>
            ) : isEmptyHistoricalOffers ? (
              <Card>
                <CardContent className="pt-6">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {isLender 
                        ? "You don't have any historical offers yet. Past offers will appear here after they expire or are declined by businesses."
                        : "You don't have any historical offers yet. Past offers will appear here after they expire or are declined."
                      }
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {historicalOffers.map((offer) => (
                  <Card key={offer.id} className="overflow-hidden border-muted/60">
                    <CardHeader className="bg-gray-50 pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-muted-foreground">
                            {isLender ? offer.business_name : offer.lender_name}
                          </CardTitle>
                          <CardDescription>
                            {offer.status === 'expired' ? 'Expired on: ' : 
                             offer.status === 'declined' ? 'Declined on: ' : 
                             offer.status === 'withdrawn' ? 'Withdrawn on: ' : 
                             'Completed on: '}
                            {new Date(offer.expires_at).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-medium capitalize text-muted-foreground">
                            {offer.status}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4 opacity-80">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Loan Amount</p>
                          <p className="font-semibold">£{offer.offer_amount.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Interest Rate</p>
                          <p className="font-semibold">{offer.interest_rate}%</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Term</p>
                          <p className="font-semibold">{offer.term_months} months</p>
                        </div>
                        <div className="flex justify-end md:justify-start space-x-2">
                          <Button 
                            asChild
                            variant="outline" 
                            size="sm"
                          >
                            <Link to={`/offers/${offer.id}`}>
                              View Details
                            </Link>
                          </Button>
                          
                          {!isLender && offer.status === 'completed' && (
                            <LenderReviewDialog
                              lenderId={offer.lender_id}
                              lenderName={offer.lender_name}
                              offerId={offer.id}
                              offerAmount={offer.offer_amount}
                              trigger={
                                <Button size="sm" variant="secondary" className="flex items-center gap-1">
                                  <Star className="h-4 w-4" />
                                  Leave Feedback
                                </Button>
                              }
                              onReviewSubmitted={() => {
                                toast.success("Thank you for your feedback!");
                              }}
                            />
                          )}
                          
                          {isLender && offer.status === 'expired' && (
                            <Button 
                              size="sm"
                              className="bg-fundhub-blue hover:bg-fundhub-blue/90"
                              onClick={() => {
                                // Logic to renew or recreate the offer
                                navigate(`/create-offer/${offer.application_id}`, { 
                                  state: { renewOffer: offer.id } 
                                });
                              }}
                            >
                              <RefreshCcw className="h-4 w-4 mr-1" />
                              Renew
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default OffersList;
