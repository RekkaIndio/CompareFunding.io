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
import { AlertCircle, ChevronRight, Download, InboxIcon, MessageSquare, Star, ArrowRight, RefreshCcw, Edit, 
  PoundSterling, Calendar, TrendingUp, Target, Users, Clock, ChevronDown, ChevronUp, BarChart3, 
  Award, Building2, Shield, TrendingDown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import LenderReviewDialog from '@/components/LenderReviewDialog';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

// Import lender logos
import santanderLogo from '@/assets/lenderlogos/santanderlogo.png';
import barclaysLogo from '@/assets/lenderlogos/barclyays.png';
import natwestLogo from '@/assets/lenderlogos/natwestlogo.png';

type Offer = {
  id: string;
  application_id: string;
  lender_id: string;
  lender_name: string;
  lender_logo?: string;
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
  // For business view - application details
  applications?: {
    id: string;
    loan_amount: number;
    loan_term_months: number;
    purpose: string;
    status: string;
  };
};

type GroupedOffers = {
  [applicationId: string]: {
    application_details: {
      id: string;
      loan_amount: number;
      loan_term_months: number;
      purpose: string;
      status: string;
    };
    offers: Offer[];
  };
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
                    'businesses',
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
        
        // Add sample offers for testing - find any application to demonstrate multi-offer functionality
        const targetApplication = applications.find(app => 
          app.status === 'waiting for a response' || 
          app.status === 'submitted' || 
          app.status === 'under_review' ||
          app.status === 'pending'
        ) || applications[0]; // Use first application if no matching status found
        



        
        if (targetApplication) {
          // Remove existing offers for this application to replace with our samples
          const existingOfferIndex = allOffers.findIndex(offer => offer.application_id === targetApplication.id);
          if (existingOfferIndex !== -1) {
            allOffers.splice(existingOfferIndex, 1);
          }
          const sampleOffers: Offer[] = [
            {
              id: 'sample-offer-1',
              application_id: targetApplication.id,
              lender_id: 'sample-lender-1',
              lender_name: 'Santander',
              lender_logo: santanderLogo,
              interest_rate: 8.5,
              offer_amount: targetApplication.loan_amount,
              term_months: targetApplication.loan_term_months,
              status: 'pending',
              offer_date: new Date().toISOString(),
              expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
              fees: {
                'arrangement_fee': 2500,
                'early_repayment_fee': 1000
              },
              conditions: [
                'Personal guarantee required',
                'Monthly financial reporting',
                'Minimum cash flow of £50,000 per month'
              ],
              created_at: new Date().toISOString(),
              applications: {
                id: targetApplication.id,
                loan_amount: targetApplication.loan_amount,
                loan_term_months: targetApplication.loan_term_months,
                purpose: targetApplication.purpose,
                status: targetApplication.status
              }
            },
            {
              id: 'sample-offer-2',
              application_id: targetApplication.id,
              lender_id: 'sample-lender-2',
              lender_name: 'Barclays',
              lender_logo: barclaysLogo,
              interest_rate: 7.2,
              offer_amount: targetApplication.loan_amount * 0.95, // Slightly lower amount
              term_months: targetApplication.loan_term_months,
              status: 'pending',
              offer_date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
              expires_at: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(), // 21 days from now
              fees: {
                'arrangement_fee': 1800,
                'valuation_fee': 500,
                'legal_fee': 750
              },
              conditions: [
                'Property security required',
                'Quarterly business reviews',
                'Directors\' personal guarantees'
              ],
              created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
              applications: {
                id: targetApplication.id,
                loan_amount: targetApplication.loan_amount,
                loan_term_months: targetApplication.loan_term_months,
                purpose: targetApplication.purpose,
                status: targetApplication.status
              }
            },
            {
              id: 'sample-offer-3',
              application_id: targetApplication.id,
              lender_id: 'sample-lender-3',
              lender_name: 'NatWest',
              lender_logo: natwestLogo,
              interest_rate: 9.8,
              offer_amount: targetApplication.loan_amount * 1.1, // Higher amount available
              term_months: targetApplication.loan_term_months + 12, // Longer term available
              status: 'pending',
              offer_date: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
              expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
              fees: {
                'arrangement_fee': 3200,
                'broker_fee': 1500
              },
              conditions: [
                'No early repayment penalties',
                'Flexible repayment schedule',
                'Business assets as security'
              ],
              created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
              applications: {
                id: targetApplication.id,
                loan_amount: targetApplication.loan_amount,
                loan_term_months: targetApplication.loan_term_months,
                purpose: targetApplication.purpose,
                status: targetApplication.status
              }
            }
          ];
          
          // Add sample offers to the array
          allOffers.push(...sampleOffers);


          
          // Re-sort after adding sample offers
          allOffers.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        }
        
        return allOffers as Offer[];
      }
    },
    enabled: !!user,
  });
  
  // Group offers by application_id for businesses, or keep individual for lenders
  const groupOffersByApplication = (offersList: Offer[]) => {
    if (isLender) {
      // For lenders, return individual offers as before
      return offersList;
    }
    
    // For businesses, group offers by application_id
    const grouped: GroupedOffers = {};
    
    offersList.forEach(offer => {
      const appId = offer.application_id;
      if (!grouped[appId]) {
        grouped[appId] = {
          application_details: offer.applications ? {
            id: offer.applications.id,
            loan_amount: offer.applications.loan_amount,
            loan_term_months: offer.applications.loan_term_months,
            purpose: offer.applications.purpose,
            status: offer.applications.status
          } : {
            id: appId,
            loan_amount: 0,
            loan_term_months: 0,
            purpose: 'Unknown',
            status: 'unknown'
          },
          offers: []
        };
      }
      grouped[appId].offers.push(offer);
    });
    
    // Sort offers within each group by interest rate (best rate first)
    Object.values(grouped).forEach(group => {
      group.offers.sort((a, b) => (a.interest_rate || 999) - (b.interest_rate || 999));
    });
    
    return grouped;
  };

  const activeOffers = offers?.filter(offer => 
    ['pending', 'accepted', 'negotiating'].includes(offer.status)
  ) || [];
  
  const historicalOffers = offers?.filter(offer => 
    ['expired', 'declined', 'withdrawn', 'completed'].includes(offer.status)
  ) || [];

  // Group offers for businesses
  const groupedActiveOffers = groupOffersByApplication(activeOffers);
  const groupedHistoricalOffers = groupOffersByApplication(historicalOffers);
  
  const isEmptyActiveOffers = isLender ? activeOffers.length === 0 : Object.keys(groupedActiveOffers).length === 0;
  const isEmptyHistoricalOffers = isLender ? historicalOffers.length === 0 : Object.keys(groupedHistoricalOffers).length === 0;
  
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
        <CardContent className="pt-6 flex flex-col items-center justify-center text-center p-12 bg-white text-gray-600">
          <InboxIcon className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2 text-gray-900">No Active Offers</h3>
          <p className="text-gray-600 mb-6 max-w-md">
            You haven't extended any offers to businesses yet. Find a suitable application to create your first offer.
          </p>
          <Button asChild className="bg-gradient-to-r from-[#ff8800] to-[#ffaa00] hover:from-[#ff9900] hover:to-[#ffbb00] text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200">
            <Link to="/matched-applications">Browse Applications</Link>
          </Button>
        </CardContent>
      );
    } else {
      return (
        <CardContent className="pt-6 flex flex-col items-center justify-center text-center p-12 bg-white text-gray-600">
          <InboxIcon className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2 text-gray-900">No Active Offers</h3>
          <p className="text-gray-600 mb-6 max-w-md">
            You don't have any active financing offers at the moment. Create a new application to receive offers from lenders.
          </p>
          <Button asChild className="bg-gradient-to-r from-[#ff8800] to-[#ffaa00] hover:from-[#ff9900] hover:to-[#ffbb00] text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200">
            <Link to="/applications/new">Create New Application</Link>
          </Button>
        </CardContent>
      );
    }
  };
  
  // Helper function to format currency
  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return '£0';
    return `£${amount.toLocaleString('en-GB')}`;
  };

  // Helper function to calculate total cost
  const calculateTotalCost = (amount: number, interestRate: number, termMonths: number) => {
    if (!amount || !interestRate || !termMonths) return 0;
    const monthlyRate = interestRate / 100 / 12;
    const totalPayments = amount * monthlyRate * termMonths / (1 - Math.pow(1 + monthlyRate, -termMonths));
    return Math.round(totalPayments);
  };

  // Helper function to get status styling
  const getStatusStyling = (status: string) => {
    const statusStyles = {
      'pending': { 
        gradient: 'from-amber-500 to-amber-600', 
        bgClass: 'bg-amber-50', 
        textClass: 'text-amber-700',
        label: 'Awaiting Response'
      },
      'accepted': { 
        gradient: 'from-emerald-500 to-emerald-600', 
        bgClass: 'bg-emerald-50', 
        textClass: 'text-emerald-700',
        label: 'Accepted'
      },
      'negotiating': { 
        gradient: 'from-blue-500 to-blue-600', 
        bgClass: 'bg-blue-50', 
        textClass: 'text-blue-700',
        label: 'In Negotiation'
      },
      'expired': { 
        gradient: 'from-gray-500 to-gray-600', 
        bgClass: 'bg-gray-50', 
        textClass: 'text-gray-700',
        label: 'Expired'
      },
      'declined': { 
        gradient: 'from-red-500 to-red-600', 
        bgClass: 'bg-red-50', 
        textClass: 'text-red-700',
        label: 'Declined'
      },
      'withdrawn': { 
        gradient: 'from-purple-500 to-purple-600', 
        bgClass: 'bg-purple-50', 
        textClass: 'text-purple-700',
        label: 'Withdrawn'
      },
      'completed': { 
        gradient: 'from-emerald-500 to-emerald-600', 
        bgClass: 'bg-emerald-50', 
        textClass: 'text-emerald-700',
        label: 'Completed'
      }
    };
    
    return statusStyles[status as keyof typeof statusStyles] || statusStyles['pending'];
  };

  // Component to render grouped offers for businesses
  const GroupedOffersCard = ({ applicationId, groupData, isHistorical = false }: { 
    applicationId: string; 
    groupData: GroupedOffers[string]; 
    isHistorical?: boolean;
  }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const { application_details, offers } = groupData;
    const displayOffers = offers.slice(0, 3); // Show max 3 offers
    const hasMoreOffers = offers.length > 3;
    
    // Get the best offer (first one since they're sorted by interest rate)
    const bestOffer = offers[0];
    const statusStyling = getStatusStyling(bestOffer.status);
    
    return (
      <Card className={`overflow-hidden ${isHistorical ? 'bg-gray-50 opacity-75 hover:opacity-90' : 'bg-white hover:shadow-xl'} border border-gray-200 transition-all duration-300`}>
        {/* Header with application details */}
        <CardHeader className="relative overflow-hidden">
          <div className={`absolute -top-6 -right-6 w-20 h-20 bg-gradient-to-br ${statusStyling.gradient} rounded-full ${isHistorical ? 'opacity-10' : 'opacity-20'}`}></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <CardTitle className={`text-xl mb-2 ${isHistorical ? 'text-gray-700' : 'text-gray-900'}`}>
                Funding Application
              </CardTitle>
              <CardDescription className="text-gray-600 flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <PoundSterling className="h-4 w-4" />
                  {formatCurrency(application_details.loan_amount)} requested
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {application_details.loan_term_months} months
                </div>
                <div className="flex items-center gap-1">
                  <Target className="h-4 w-4" />
                  {application_details.purpose}
                </div>
              </CardDescription>
            </div>
            <div className="text-right">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mb-2 ${
                isHistorical ? 'bg-gray-200 text-gray-700' : `${statusStyling.bgClass} ${statusStyling.textClass}`
              }`}>
                {offers.length} Offer{offers.length !== 1 ? 's' : ''} Available
              </div>
              <div className="absolute top-2 right-2">
                <div className={`p-2 ${isHistorical ? 'bg-gray-200' : `bg-gradient-to-br ${statusStyling.gradient}`} rounded-lg shadow-md`}>
                  <BarChart3 className={`h-5 w-5 ${isHistorical ? 'text-gray-600' : 'text-white'}`} />
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className={`pt-6 ${isHistorical ? 'bg-gray-50' : 'bg-white'}`}>
          {/* Offer comparison */}
          <div className="space-y-4">
            {displayOffers.map((offer, index) => {
              const offerStatusStyling = getStatusStyling(offer.status);
              const totalCost = calculateTotalCost(offer.offer_amount, offer.interest_rate, offer.term_months);
              const isBestOffer = index === 0;
              
              return (
                <div 
                  key={offer.id} 
                  className={`relative border-2 rounded-lg p-4 transition-all duration-200 ${
                    isBestOffer && !isHistorical
                      ? 'border-green-200 bg-green-50 shadow-md' 
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  {isBestOffer && !isHistorical && (
                    <div className="absolute -top-2 left-4">
                      <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                        <Award className="h-3 w-3" />
                        Best Rate
                      </div>
                    </div>
                  )}
                  
                  {/* Lender info and status */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      {offer.lender_logo && (
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-white shadow-sm border border-gray-200 flex items-center justify-center">
                          <img 
                            src={offer.lender_logo} 
                            alt={`${offer.lender_name} logo`}
                            className="w-10 h-8 object-contain"
                            onError={(e) => {
                              // Hide image if it fails to load
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      <div>
                        <h4 className={`font-semibold ${isHistorical ? 'text-gray-700' : 'text-gray-900'}`}>
                          {offer.lender_name || 'Unknown Lender'}
                        </h4>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          Expires: {offer.expires_at ? new Date(offer.expires_at).toLocaleDateString('en-GB') : 'Not set'}
                        </p>
                      </div>
                    </div>
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      isHistorical ? 'bg-gray-200 text-gray-700' : `${offerStatusStyling.bgClass} ${offerStatusStyling.textClass}`
                    }`}>
                      {offerStatusStyling.label}
                    </div>
                  </div>
                  
                  {/* Offer metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-sm text-gray-600">Amount</div>
                      <div className={`font-bold ${isHistorical ? 'text-gray-700' : 'text-gray-900'}`}>
                        {formatCurrency(offer.offer_amount)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-600">Rate</div>
                      <div className={`font-bold ${isHistorical ? 'text-gray-700' : 'text-gray-900'}`}>
                        {offer.interest_rate ? `${offer.interest_rate}%` : 'Not set'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-600">Term</div>
                      <div className={`font-bold ${isHistorical ? 'text-gray-700' : 'text-gray-900'}`}>
                        {offer.term_months ? `${offer.term_months}m` : 'Not set'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-600">Total Cost</div>
                      <div className={`font-bold ${isHistorical ? 'text-gray-700' : 'text-gray-900'}`}>
                        {formatCurrency(totalCost)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex justify-end mt-4 space-x-2">
                    <Button 
                      asChild
                      size="sm" 
                      variant="outline"
                      className="border-gray-300 text-white hover:bg-gray-100"
                    >
                      <Link to={`/offers/${offer.id}`}>
                        View Details
                      </Link>
                    </Button>
                    
                    {!isHistorical && ['pending', 'negotiating'].includes(offer.status) && (
                      <Button 
                        size="sm"
                        className="bg-gradient-to-r from-[#ff8800] to-[#ffaa00] hover:from-[#ff9900] hover:to-[#ffbb00] text-white font-semibold"
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Respond
                      </Button>
                    )}
                    
                    {isHistorical && offer.status === 'completed' && (
                      <LenderReviewDialog
                        lenderId={offer.lender_id}
                        lenderName={offer.lender_name}
                        offerId={offer.id}
                        offerAmount={offer.offer_amount}
                        trigger={
                          <Button size="sm" variant="secondary" className="flex items-center gap-1">
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
              );
            })}
            
            {hasMoreOffers && (
              <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full text-gray-600 hover:text-gray-900">
                    {isExpanded ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-1" />
                        Show Fewer Offers
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-1" />
                        Show {offers.length - 3} More Offers
                      </>
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 mt-4">
                  {offers.slice(3).map((offer) => {
                    const offerStatusStyling = getStatusStyling(offer.status);
                    const totalCost = calculateTotalCost(offer.offer_amount, offer.interest_rate, offer.term_months);
                    
                    return (
                      <div 
                        key={offer.id} 
                        className="border-2 border-gray-200 rounded-lg p-4 bg-white hover:border-gray-300 transition-all duration-200"
                      >
                        {/* Same structure as above offers */}
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            {offer.lender_logo && (
                              <div className="w-12 h-12 rounded-lg overflow-hidden bg-white shadow-sm border border-gray-200 flex items-center justify-center">
                                <img 
                                  src={offer.lender_logo} 
                                  alt={`${offer.lender_name} logo`}
                                  className="w-10 h-8 object-contain"
                                  onError={(e) => {
                                    // Hide image if it fails to load
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              </div>
                            )}
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {offer.lender_name || 'Unknown Lender'}
                              </h4>
                              <p className="text-sm text-gray-600 flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                Expires: {offer.expires_at ? new Date(offer.expires_at).toLocaleDateString('en-GB') : 'Not set'}
                              </p>
                            </div>
                          </div>
                          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${offerStatusStyling.bgClass} ${offerStatusStyling.textClass}`}>
                            {offerStatusStyling.label}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <div className="text-sm text-gray-600">Amount</div>
                            <div className="font-bold text-gray-900">
                              {formatCurrency(offer.offer_amount)}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm text-gray-600">Rate</div>
                            <div className="font-bold text-gray-900">
                              {offer.interest_rate ? `${offer.interest_rate}%` : 'Not set'}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm text-gray-600">Term</div>
                            <div className="font-bold text-gray-900">
                              {offer.term_months ? `${offer.term_months}m` : 'Not set'}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm text-gray-600">Total Cost</div>
                            <div className="font-bold text-gray-900">
                              {formatCurrency(totalCost)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex justify-end mt-4 space-x-2">
                          <Button 
                            asChild
                            size="sm" 
                            variant="outline"
                            className="border-gray-300 text-gray-600 hover:bg-gray-100"
                          >
                            <Link to={`/offers/${offer.id}`}>
                              View Details
                            </Link>
                          </Button>
                          
                          {['pending', 'negotiating'].includes(offer.status) && (
                            <Button 
                              size="sm"
                              className="bg-gradient-to-r from-[#ff8800] to-[#ffaa00] hover:from-[#ff9900] hover:to-[#ffbb00] text-white font-semibold"
                            >
                              <MessageSquare className="h-4 w-4 mr-1" />
                              Respond
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
          
          <Separator className="my-4 bg-gray-200" />
          
          {/* Summary section */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Application ID: {applicationId.substring(0, 8)}...
            </div>
            <div className="flex items-center space-x-3">
              {!isHistorical && (
                <Button 
                  asChild
                  className="bg-gradient-to-r from-[#ff8800] to-[#ffaa00] hover:from-[#ff9900] hover:to-[#ffbb00] text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <Link to={`/applications/${applicationId}`}>
                    View Application <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  return (
    <PageLayout>
      <div className="container py-8 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-gray-900">{getTitle()}</h1>
            <p className="text-gray-600">
              {getDescription()}
            </p>
          </div>
          
          {isLender && (
            <Button 
              className="bg-gradient-to-r from-[#ff8800] to-[#ffaa00] hover:from-[#ff9900] hover:to-[#ffbb00] text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
              onClick={() => navigate('/matched-applications')}
            >
              <ArrowRight className="mr-2 h-4 w-4" />
              Find Applications
            </Button>
          )}
        </div>
        
        <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6 bg-white border-gray-200">
            <TabsTrigger value="active" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 text-gray-600">Active Offers</TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 text-gray-600">Past Offers</TabsTrigger>
          </TabsList>
          
          <TabsContent value="active">
            {isLoading ? (
              <div className="grid gap-6 grid-cols-1">
                {[1, 2].map((i) => (
                  <Card key={i} className="h-48 animate-pulse bg-white border-gray-200">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        <div className="grid grid-cols-4 gap-4 mt-6">
                          <div className="h-12 bg-gray-200 rounded"></div>
                          <div className="h-12 bg-gray-200 rounded"></div>
                          <div className="h-12 bg-gray-200 rounded"></div>
                          <div className="h-12 bg-gray-200 rounded"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : isEmptyActiveOffers ? (
              <Card className="bg-white border-gray-200">
                {getEmptyActiveOffersContent()}
              </Card>
            ) : (
              <div className="space-y-6">
                {isLender ? (
                  // Lender view: Show individual offers
                  activeOffers.map((offer) => {
                    const statusStyling = getStatusStyling(offer.status);
                    const totalCost = calculateTotalCost(offer.offer_amount, offer.interest_rate, offer.term_months);
                    
                    return (
                      <Card key={offer.id} className="overflow-hidden bg-white border border-gray-200 hover:shadow-xl transition-all duration-300">
                        {/* Header with gradient background */}
                        <CardHeader className="relative overflow-hidden">
                          <div className={`absolute -top-6 -right-6 w-20 h-20 bg-gradient-to-br ${statusStyling.gradient} rounded-full opacity-20`}></div>
                          <div className="flex justify-between items-start relative z-10">
                            <div>
                              <CardTitle className="text-gray-900 text-xl mb-2">
                                {offer.business_name || 'Unknown Business'}
                              </CardTitle>
                              <CardDescription className="text-gray-600 flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Expires: {offer.expires_at ? new Date(offer.expires_at).toLocaleDateString('en-GB', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                }) : 'Date not set'}
                              </CardDescription>
                            </div>
                            <div className="text-right">
                              <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusStyling.bgClass} ${statusStyling.textClass}`}>
                                {statusStyling.label}
                              </div>
                              <div className="absolute top-2 right-2">
                                <div className={`p-2 bg-gradient-to-br ${statusStyling.gradient} rounded-lg shadow-md`}>
                                  <Target className="h-5 w-5 text-white" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="pt-6 bg-white">
                          {/* Metrics Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-gray-600 text-sm">
                                <PoundSterling className="h-4 w-4" />
                                Loan Amount
                              </div>
                              <div className="text-2xl font-bold text-gray-900">
                                {formatCurrency(offer.offer_amount)}
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-gray-600 text-sm">
                                <TrendingUp className="h-4 w-4" />
                                Interest Rate
                              </div>
                              <div className="text-2xl font-bold text-gray-900">
                                {offer.interest_rate ? `${offer.interest_rate}%` : 'Not set'}
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-gray-600 text-sm">
                                <Clock className="h-4 w-4" />
                                Term
                              </div>
                              <div className="text-2xl font-bold text-gray-900">
                                {offer.term_months ? `${offer.term_months} months` : 'Not set'}
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-gray-600 text-sm">
                                <Users className="h-4 w-4" />
                                Total Cost
                              </div>
                              <div className="text-2xl font-bold text-gray-900">
                                {formatCurrency(totalCost)}
                              </div>
                            </div>
                          </div>
                          
                          <Separator className="my-4 bg-gray-200" />
                          
                          {/* Bottom section with actions */}
                          <div className="flex justify-between items-center">
                            <div className="text-sm text-gray-600">
                              Application: {offer.application_id?.substring(0, 8)}...
                            </div>
                            <div className="flex items-center space-x-3">
                              {offer.status === 'pending' && (
                                <Button variant="outline" size="sm" className="border-gray-300 text-gray-600 hover:bg-gray-100">
                                  <Edit className="h-4 w-4 mr-1" /> 
                                  Edit
                                </Button>
                              )}
                              {offer.status === 'accepted' && (
                                <Button size="sm" className="bg-gradient-to-r from-[#ff8800] to-[#ffaa00] hover:from-[#ff9900] hover:to-[#ffbb00] text-white">
                                  <MessageSquare className="h-4 w-4 mr-1" /> 
                                  Message
                                </Button>
                              )}
                              <Button 
                                asChild
                                size="sm" 
                                className="bg-gradient-to-r from-[#ff8800] to-[#ffaa00] hover:from-[#ff9900] hover:to-[#ffbb00] text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                              >
                                <Link to={`/offers/${offer.id}`}>
                                  View Details <ChevronRight className="h-4 w-4 ml-1" />
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                ) : (
                  // Business view: Show grouped offers by application
                  Object.entries(groupedActiveOffers as GroupedOffers).map(([applicationId, groupData]) => (
                    <GroupedOffersCard 
                      key={applicationId} 
                      applicationId={applicationId} 
                      groupData={groupData} 
                      isHistorical={false}
                    />
                  ))
                )}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="history">
            {isLoading ? (
              <div className="grid gap-6 grid-cols-1">
                {[1, 2].map((i) => (
                  <Card key={i} className="h-48 animate-pulse bg-gray-100 border-gray-200">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        <div className="grid grid-cols-4 gap-4 mt-6">
                          <div className="h-12 bg-gray-200 rounded"></div>
                          <div className="h-12 bg-gray-200 rounded"></div>
                          <div className="h-12 bg-gray-200 rounded"></div>
                          <div className="h-12 bg-gray-200 rounded"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : isEmptyHistoricalOffers ? (
              <Card className="bg-white border-gray-200">
                <CardContent className="pt-6">
                  <Alert className="bg-gray-50 border-gray-200">
                    <AlertCircle className="h-4 w-4 text-gray-400" />
                    <AlertDescription className="text-gray-600">
                      {isLender 
                        ? "You don't have any historical offers yet. Past offers will appear here after they expire or are declined by businesses."
                        : "You don't have any historical offers yet. Past offers will appear here after they expire or are declined."
                      }
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {isLender ? (
                  // Lender view: Show individual historical offers
                  historicalOffers.map((offer) => {
                    const statusStyling = getStatusStyling(offer.status);
                    const totalCost = calculateTotalCost(offer.offer_amount, offer.interest_rate, offer.term_months);
                    
                    return (
                      <Card key={offer.id} className="overflow-hidden bg-gray-50 border border-gray-200 opacity-75 hover:opacity-90 transition-all duration-300">
                        {/* Header with muted gradient background */}
                        <CardHeader className="relative overflow-hidden">
                          <div className={`absolute -top-6 -right-6 w-20 h-20 bg-gradient-to-br ${statusStyling.gradient} rounded-full opacity-10`}></div>
                          <div className="flex justify-between items-start relative z-10">
                            <div>
                              <CardTitle className="text-gray-700 text-xl mb-2">
                                {offer.business_name || 'Unknown Business'}
                              </CardTitle>
                              <CardDescription className="text-gray-600 flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                {offer.status === 'expired' ? 'Expired: ' : 
                                 offer.status === 'declined' ? 'Declined: ' : 
                                 offer.status === 'withdrawn' ? 'Withdrawn: ' : 
                                 'Completed: '}
                                {offer.expires_at ? new Date(offer.expires_at).toLocaleDateString('en-GB', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                }) : 'Date not set'}
                              </CardDescription>
                            </div>
                            <div className="text-right">
                              <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-700`}>
                                {statusStyling.label}
                              </div>
                              <div className="absolute top-2 right-2">
                                <div className="p-2 bg-gray-200 rounded-lg shadow-md">
                                  <Target className="h-5 w-5 text-gray-600" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="pt-6 bg-gray-50">
                          {/* Metrics Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-gray-600 text-sm">
                                <PoundSterling className="h-4 w-4" />
                                Loan Amount
                              </div>
                              <div className="text-xl font-bold text-gray-700">
                                {formatCurrency(offer.offer_amount)}
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-gray-600 text-sm">
                                <TrendingUp className="h-4 w-4" />
                                Interest Rate
                              </div>
                              <div className="text-xl font-bold text-gray-700">
                                {offer.interest_rate ? `${offer.interest_rate}%` : 'Not set'}
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-gray-600 text-sm">
                                <Clock className="h-4 w-4" />
                                Term
                              </div>
                              <div className="text-xl font-bold text-gray-700">
                                {offer.term_months ? `${offer.term_months} months` : 'Not set'}
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-gray-600 text-sm">
                                <Users className="h-4 w-4" />
                                Total Cost
                              </div>
                              <div className="text-xl font-bold text-gray-700">
                                {formatCurrency(totalCost)}
                              </div>
                            </div>
                          </div>
                          
                          <Separator className="my-4 bg-gray-300" />
                          
                          {/* Bottom section with actions */}
                          <div className="flex justify-between items-center">
                            <div className="text-sm text-gray-600">
                              Application: {offer.application_id?.substring(0, 8)}...
                            </div>
                            <div className="flex items-center space-x-3">
                              <Button 
                                asChild
                                variant="outline" 
                                size="sm"
                                className="border-gray-300 text-gray-600 hover:bg-gray-100"
                              >
                                <Link to={`/offers/${offer.id}`}>
                                  View Details
                                </Link>
                              </Button>
                              
                              {offer.status === 'expired' && (
                                <Button 
                                  size="sm"
                                  className="bg-gradient-to-r from-[#ff8800] to-[#ffaa00] hover:from-[#ff9900] hover:to-[#ffbb00] text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
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
                    );
                  })
                ) : (
                  // Business view: Show grouped historical offers
                  Object.entries(groupedHistoricalOffers as GroupedOffers).map(([applicationId, groupData]) => (
                    <GroupedOffersCard 
                      key={applicationId} 
                      applicationId={applicationId} 
                      groupData={groupData} 
                      isHistorical={true}
                    />
                  ))
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default OffersList;
