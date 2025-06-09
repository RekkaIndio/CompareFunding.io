import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDocuments, getDocument } from '@/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import PageLayout from '@/components/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, ChevronRight, Download, InboxIcon, MessageSquare, Star, ArrowRight, RefreshCcw, Edit, 
  PoundSterling, Calendar, TrendingUp, Target, Users, Clock, BarChart3, 
  Award, Building2, Shield, TrendingDown, Filter, Archive } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import LenderReviewDialog from '@/components/LenderReviewDialog';
import { Badge } from '@/components/ui/badge';
import { formatApplicationNumber } from '@/lib/applicationUtils';

// Import lender logos
import santanderLogo from '@/assets/lenderlogos/santanderlogo.png';
import barclaysLogo from '@/assets/lenderlogos/barclyays.png';
import natwestLogo from '@/assets/lenderlogos/natwestlogo.png';

type Offer = {
  id: string;
  application_id: string;
  lender_id: string;
  lender_name: string;
  company_logo?: string; // Fixed: this is how it's stored in the database
  interest_rate: number;
  offered_amount: number; // Fixed field name to match OfferDetails
  offered_term_months: number; // Fixed field name to match OfferDetails
  status: string;
  offer_date: string;
  expires_at: string;
  fees: Record<string, number>;
  conditions: string[];
  created_at: string;
  // Additional financial fields from OfferDetails
  apr?: number;
  monthly_payment?: number;
  total_repayment?: number;
  repayment_frequency?: string;
  arrangement_fee?: number;
  arrangement_fee_amount?: number;
  early_repayment_fee?: number;
  // For lender view
  business_name?: string;
  business_id?: string;
  application?: {
    id: string;
    application_number?: string;
    loan_amount: number;
    loan_term_months: number;
    purpose: string;
    status: string;
  };
  // For business view - application details
  applications?: {
    id: string;
    application_number?: string;
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
      application_number?: string;
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
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('active');
  const isLender = user?.role === 'lender';
  
  // Get application parameter from URL for scrolling
  const targetApplicationId = searchParams.get('application');

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
          // Get lender's own details first
          let lenderName = 'Your Company';
          let lenderLogo = '';
          
          try {
            // Try to get from lenders collection first
            const { data: lenderData } = await getDocument('lenders', user.uid);
            if (lenderData) {
              lenderName = lenderData.company_name || lenderData.name || lenderName;
              lenderLogo = lenderData.logo_url || lenderData.logo || '';
            } else {
              // Fallback: try to get from users collection
              const { data: userData } = await getDocument('users', user.uid);
              if (userData) {
                lenderName = userData.company_name || userData.name || lenderName;
                lenderLogo = userData.logo_url || userData.logo || '';
              }
            }
          } catch (error) {
            console.warn('Could not fetch lender details:', error);
          }
          
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
                lender_name: lenderName,
                company_logo: lenderLogo,
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
            // Add application details and lender details to each offer
            const app = applications.find(a => a.id === appId);
            
            const offersWithDetails = await Promise.all(
              appOffers.map(async (offer) => {
                // Get lender details
                let lenderName = 'Unknown Lender';
                let lenderLogo = '';
                
                if (offer.lender_id) {
                  try {
                    // First try to get from lender_profiles collection
                    const { data: lenderData } = await getDocument('lender_profiles', offer.lender_id);
                    if (lenderData) {
                      lenderName = lenderData.lender_name || lenderData.company_name || lenderName;
                      lenderLogo = lenderData.logo_url || '';
                    } else {
                      // Fallback: try to get from users collection
                      const { data: userData } = await getDocument('users', offer.lender_id);
                      if (userData) {
                        lenderName = userData.company_name || userData.name || lenderName;
                        lenderLogo = userData.logo_url || userData.logo || '';
                      }
                    }
                  } catch (error) {
                    console.warn('Could not fetch lender details for:', offer.lender_id, error);
                  }
                }
                
                return {
                  ...offer,
                  lender_name: lenderName,
                  company_logo: lenderLogo,
                  // Mimic the Supabase nested structure
                  applications: app ? {
                    id: app.id,
                    application_number: app.application_number, // Added missing application_number field
                    loan_amount: app.loan_amount,
                    loan_term_months: app.loan_term_months,
                    purpose: app.purpose,
                    status: app.status
                  } : null
                };
              })
            );
            
            allOffers.push(...offersWithDetails);
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
            application_number: offer.applications.application_number,
            loan_amount: offer.applications.loan_amount,
            loan_term_months: offer.applications.loan_term_months,
            purpose: offer.applications.purpose,
            status: offer.applications.status
          } : {
            id: appId,
            application_number: undefined,
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
  
  // Scroll to target application if specified in URL parameters
  useEffect(() => {
    if (targetApplicationId && !isLoading && offers && offers.length > 0) {
      // Small delay to ensure the DOM is rendered
      const timer = setTimeout(() => {
        const targetElement = document.getElementById(`application-${targetApplicationId}`);
        if (targetElement) {
          // Get the header height for offset calculation (assume a fixed header of ~80px)
          const headerOffset = 80;
          
          // Get the element's position
          const elementPosition = targetElement.getBoundingClientRect().top;
          // Get the current scroll position
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
          
          // Scroll to the element with offset
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
          
          // Add a highlight effect
          targetElement.style.boxShadow = '0 0 20px 4px rgba(59, 130, 246, 0.5)';
          targetElement.style.transition = 'box-shadow 0.3s ease-in-out';
          
          // Remove highlight after 3 seconds
          setTimeout(() => {
            targetElement.style.boxShadow = '';
          }, 3000);
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [targetApplicationId, isLoading, offers]);
  
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
  const calculateTotalCost = (offer: Offer) => {
    // Use provided total_repayment if available
    if (offer.total_repayment && offer.total_repayment > 0) {
      return offer.total_repayment;
    }
    
    const amount = offer.offered_amount;
    const interestRate = offer.interest_rate;
    const termMonths = offer.offered_term_months;
    
    if (!amount || !interestRate || !termMonths) return 0;
    const monthlyRate = interestRate / 100 / 12;
    const totalPayments = amount * monthlyRate * termMonths / (1 - Math.pow(1 + monthlyRate, -termMonths));
    return Math.round(totalPayments);
  };

  // Helper function to calculate monthly payment
  const calculateMonthlyPayment = (offer: Offer) => {
    // Use provided monthly_payment if available
    if (offer.monthly_payment && offer.monthly_payment > 0) {
      return offer.monthly_payment;
    }
    
    const amount = offer.offered_amount;
    const interestRate = offer.interest_rate;
    const termMonths = offer.offered_term_months;
    
    if (!amount || !interestRate || !termMonths) return 0;
    const monthlyRate = interestRate / 100 / 12;
    const monthlyPayment = (amount * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
      (Math.pow(1 + monthlyRate, termMonths) - 1);
    return Math.round(monthlyPayment * 100) / 100; // Round to 2 decimal places
  };

  // Helper function to calculate total interest
  const calculateTotalInterest = (offer: Offer) => {
    const totalRepayment = calculateTotalCost(offer);
    return totalRepayment - offer.offered_amount;
  };

  // Helper function to format repayment frequency
  const formatRepaymentFrequency = (frequency?: string) => {
    const frequencies: Record<string, string> = {
      'monthly': 'Monthly',
      'weekly': 'Weekly',
      'fortnightly': 'Fortnightly',
      'quarterly': 'Quarterly',
      'annually': 'Annually'
    };
    return frequencies[frequency?.toLowerCase() || 'monthly'] || 'Monthly';
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
        gradient: 'from-slate-500 to-slate-600', 
        bgClass: 'bg-slate-50', 
        textClass: 'text-slate-700',
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
        gradient: 'from-slate-600 to-slate-700', 
        bgClass: 'bg-slate-100', 
        textClass: 'text-slate-800',
        label: 'Completed'
      }
    };
    
    return statusStyles[status as keyof typeof statusStyles] || statusStyles['pending'];
  };

  // Component to render individual offers with enhanced UI matching ApplicationCard quality
  const IndividualOfferCard = ({ offer, isHistorical = false }: { offer: Offer; isHistorical?: boolean }) => {
    const statusStyling = getStatusStyling(offer.status);
    const totalCost = calculateTotalCost(offer);
    const monthlyPayment = calculateMonthlyPayment(offer);
    const totalInterest = calculateTotalInterest(offer);
    const repaymentFrequency = formatRepaymentFrequency(offer.repayment_frequency || 'monthly');
    
    return (
      <Card className={`relative overflow-hidden ${isHistorical ? 'bg-gray-50 opacity-75 hover:opacity-90' : 'bg-white hover:shadow-2xl'} border transition-all duration-300 transform hover:-translate-y-1 ${
        isHistorical ? 'border-gray-200' : 'border-slate-200/80 hover:border-slate-300'
      } rounded-xl cursor-pointer`}>
        {/* Enhanced status indicator bar with better gradients */}
        <div className={`h-1.5 w-full ${
          isHistorical ? 'bg-gradient-to-r from-gray-400 to-gray-500' : 
          offer.status === 'pending' ? 'bg-gradient-to-r from-amber-400 to-amber-500' :
          offer.status === 'accepted' ? 'bg-gradient-to-r from-slate-400 to-slate-500' :
          offer.status === 'negotiating' ? 'bg-gradient-to-r from-blue-400 to-blue-500' :
          'bg-gradient-to-r from-gray-400 to-gray-500'
        }`}></div>
        
        <CardContent className="p-4 md:p-5">
          <div className="grid grid-cols-1 lg:grid-cols-[2.5fr,1.5fr] gap-6 items-start">
            {/* Left Column: Enhanced Lender Info */}
            <div className="space-y-4">
              {/* Enhanced lender header with better styling */}
              <div className="flex items-start gap-4">
                {/* Premium lender logo display */}
                <div>
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
                </div>
                
                <div className="flex-grow">
                  <div className="flex flex-col">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h3 className={`font-semibold text-lg ${isHistorical ? 'text-gray-700' : 'text-[#212936]'}`}>
                        {offer.lender_name || 'Unknown Lender'}
                      </h3>
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium shadow-sm ${
                        isHistorical ? 'bg-gray-200 text-gray-700' : `${statusStyling.bgClass} ${statusStyling.textClass}`
                      }`}>
                        {statusStyling.label}
                      </div>
                    </div>
                    <div className="flex items-center flex-wrap gap-2 text-sm text-slate-500 mt-1">
                      <span className="font-medium">#{offer.id?.substring(0, 8)}</span>
                      <span>•</span>
                      <span>{new Date(offer.created_at || Date.now()).toLocaleDateString('en-GB')}</span>
                      {offer.expires_at && (
                        <>
                          <span>•</span>
                          <span className="text-amber-600 font-medium">
                            Expires: {new Date(offer.expires_at).toLocaleDateString('en-GB')}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Enhanced offer details in premium card layout with unified dark theme */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {/* Amount Card with dark theme */}
                <div className="group bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-xl border border-slate-200 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Amount</p>
                    <div className="bg-gradient-to-br from-[#212936] to-[#2c3c53] rounded-full p-1.5 shadow-sm group-hover:shadow-md transition-shadow">
                      <PoundSterling className="h-3.5 w-3.5 text-white" />
                    </div>
                  </div>
                  <p className={`font-bold text-lg ${isHistorical ? 'text-gray-700' : 'text-[#212936]'}`}>
                    {formatCurrency(offer.offered_amount)}
                  </p>
                  <div className="w-full bg-slate-200/50 h-1 rounded-full mt-2">
                    <div className="bg-gradient-to-r from-[#212936] to-[#ff8000] h-1 rounded-full w-full"></div>
                  </div>
                </div>
                
                {/* Rate Card with dark theme */}
                <div className="group bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-xl border border-slate-200 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Rate</p>
                    <div className="bg-gradient-to-br from-[#212936] to-[#2c3c53] rounded-full p-1.5 shadow-sm group-hover:shadow-md transition-shadow">
                      <TrendingUp className="h-3.5 w-3.5 text-white" />
                    </div>
                  </div>
                  <p className={`font-bold text-lg ${isHistorical ? 'text-gray-700' : 'text-[#212936]'}`}>
                    {offer.interest_rate ? `${offer.interest_rate}%` : 'Not set'}
                  </p>
                  <div className="w-full bg-slate-200/50 h-1 rounded-full mt-2">
                    <div className="bg-gradient-to-r from-[#212936] to-[#ff8000] h-1 rounded-full w-4/5"></div>
                  </div>
                </div>
                
                {/* Term Card with dark theme */}
                <div className="group bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-xl border border-slate-200 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Term</p>
                    <div className="bg-gradient-to-br from-[#212936] to-[#2c3c53] rounded-full p-1.5 shadow-sm group-hover:shadow-md transition-shadow">
                      <Clock className="h-3.5 w-3.5 text-white" />
                    </div>
                  </div>
                  <p className={`font-bold text-lg ${isHistorical ? 'text-gray-700' : 'text-[#212936]'}`}>
                    {offer.offered_term_months ? `${offer.offered_term_months}m` : 'Not set'}
                  </p>
                  <div className="w-full bg-slate-200/50 h-1 rounded-full mt-2">
                    <div className="bg-gradient-to-r from-[#212936] to-[#ff8000] h-1 rounded-full w-3/5"></div>
                  </div>
                </div>
                
                {/* Monthly Payment Card with dark theme */}
                <div className="group bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-xl border border-slate-200 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Monthly</p>
                    <div className="bg-gradient-to-br from-[#212936] to-[#2c3c53] rounded-full p-1.5 shadow-sm group-hover:shadow-md transition-shadow">
                      <Calendar className="h-3.5 w-3.5 text-white" />
                    </div>
                  </div>
                  <p className={`font-bold text-lg ${isHistorical ? 'text-gray-700' : 'text-[#212936]'}`}>
                    {formatCurrency(monthlyPayment)}
                  </p>
                  <div className="w-full bg-slate-200/50 h-1 rounded-full mt-2">
                    <div className="bg-gradient-to-r from-[#212936] to-[#ff8000] h-1 rounded-full w-3/4"></div>
                  </div>
                </div>
                
                {/* Total Cost Card with dark theme */}
                <div className="group bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-xl border border-slate-200 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Total Cost</p>
                    <div className="bg-gradient-to-br from-[#212936] to-[#2c3c53] rounded-full p-1.5 shadow-sm group-hover:shadow-md transition-shadow">
                      <BarChart3 className="h-3.5 w-3.5 text-white" />
                    </div>
                  </div>
                  <p className={`font-bold text-lg ${isHistorical ? 'text-gray-700' : 'text-[#212936]'}`}>
                    {formatCurrency(totalCost)}
                  </p>
                  <div className="w-full bg-slate-200/50 h-1 rounded-full mt-2">
                    <div className="bg-gradient-to-r from-[#212936] to-[#ff8000] h-1 rounded-full w-full"></div>
                  </div>
                </div>
                
                {/* Total Interest Card with dark theme */}
                <div className="group bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-xl border border-slate-200 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Interest</p>
                    <div className="bg-gradient-to-br from-[#212936] to-[#2c3c53] rounded-full p-1.5 shadow-sm group-hover:shadow-md transition-shadow">
                      <TrendingDown className="h-3.5 w-3.5 text-white" />
                    </div>
                  </div>
                  <p className={`font-bold text-lg ${isHistorical ? 'text-gray-700' : 'text-[#212936]'}`}>
                    {formatCurrency(totalInterest)}
                  </p>
                  <div className="w-full bg-slate-200/50 h-1 rounded-full mt-2">
                    <div className="bg-gradient-to-r from-[#212936] to-[#ff8000] h-1 rounded-full w-2/3"></div>
                  </div>
                </div>
                
                {/* Repayment Frequency Card with dark theme */}
                <div className="group bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-xl border border-slate-200 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Frequency</p>
                    <div className="bg-gradient-to-br from-[#212936] to-[#2c3c53] rounded-full p-1.5 shadow-sm group-hover:shadow-md transition-shadow">
                      <RefreshCcw className="h-3.5 w-3.5 text-white" />
                    </div>
                  </div>
                  <p className={`font-bold text-lg ${isHistorical ? 'text-gray-700' : 'text-[#212936]'}`}>
                    {repaymentFrequency}
                  </p>
                  <div className="w-full bg-slate-200/50 h-1 rounded-full mt-2">
                    <div className="bg-gradient-to-r from-[#212936] to-[#ff8000] h-1 rounded-full w-1/2"></div>
                  </div>
                </div>
                
                {/* APR Card (if different from interest rate) with dark theme */}
                {offer.apr && offer.apr !== offer.interest_rate && (
                  <div className="group bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-xl border border-slate-200 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">APR</p>
                      <div className="bg-gradient-to-br from-[#212936] to-[#2c3c53] rounded-full p-1.5 shadow-sm group-hover:shadow-md transition-shadow">
                        <Target className="h-3.5 w-3.5 text-indigo-700" />
                      </div>
                    </div>
                    <p className={`font-bold text-lg ${isHistorical ? 'text-gray-700' : 'text-[#212936]'}`}>
                      {offer.apr}%
                    </p>
                    <div className="w-full bg-indigo-200/30 h-1 rounded-full mt-2">
                      <div className="bg-gradient-to-r from-indigo-400 to-indigo-500 h-1 rounded-full w-4/5"></div>
                    </div>
                  </div>
                )}
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
            </div>
            
            {/* Right Column: Enhanced Action buttons and info */}
            <div className="space-y-4">
              {/* Premium action buttons with better styling */}
              <div className="flex flex-col gap-3">
                {!isHistorical && ['pending', 'negotiating'].includes(offer.status) && (
                  <Button 
                    size="sm"
                    className="w-full bg-gradient-to-r from-[#ff8000] to-[#ffaa00] hover:from-[#ff9900] hover:to-[#ffbb00] text-white shadow-lg py-3 font-semibold transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5"
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Respond to Offer
                  </Button>
                )}
                
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
              </div>
              
              {/* Enhanced application info card */}
              <div className="bg-gradient-to-b from-white to-slate-50 rounded-xl p-4 border border-slate-200 shadow-md hover:shadow-lg transition-all duration-200">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <div className="bg-gradient-to-br from-[#212936] to-[#2c3c53] rounded-full p-2.5 shadow-lg">
                      <Target className="h-4 w-4 text-[#ff8000]" />
                    </div>
                    <p className="font-semibold text-[#212936] text-sm">Application Details</p>
                  </div>
                  <p className="text-xs text-slate-600 mb-3 font-mono bg-slate-100 px-2 py-1 rounded">
                    #{formatApplicationNumber(offer.applications || offer.application, offer.application_id)}
                  </p>
                  
                  {offer.applications && (
                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between items-center bg-white/70 p-2 rounded-lg border border-slate-100">
                        <span className="text-gray-600 font-medium">Requested:</span>
                        <span className="font-bold text-[#212936]">{formatCurrency(offer.applications.loan_amount)}</span>
                      </div>
                      <div className="flex justify-between items-center bg-white/70 p-2 rounded-lg border border-slate-100">
                        <span className="text-gray-600 font-medium">Purpose:</span>
                        <span className="font-medium text-[#212936] text-right flex-1 ml-2">{offer.applications.purpose}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Component to render offers underneath each application for businesses
  const ApplicationOffersCard = ({ applicationId, groupData, isHistorical = false, id }: { 
    applicationId: string; 
    groupData: GroupedOffers[string]; 
    isHistorical?: boolean;
    id?: string;
  }) => {
    const { application_details, offers } = groupData;
    
    // Create exactly 3 offer slots - actual offers + placeholders
    const maxOffers = 3;
    const offerSlots = [];
    
    // Add actual offers
    for (let i = 0; i < maxOffers; i++) {
      if (i < offers.length) {
        offerSlots.push({
          id: i.toString(),
          type: 'offer',
          offer: offers[i],
          isActive: true
        });
      } else {
        offerSlots.push({
          id: i.toString(),
          type: 'placeholder',
          offer: null,
          isActive: false
        });
      }
    }
    
    const bestOffer = offers[0];
    const statusStyling = getStatusStyling(bestOffer?.status || 'pending');
    
    return (
      <Card 
        id={id}
        className={`overflow-hidden transition-all duration-300 transform hover:-translate-y-1 rounded-xl shadow-lg hover:shadow-xl ${
        isHistorical 
          ? 'bg-white/60 backdrop-blur-sm border-gray-300/50 opacity-75 hover:opacity-90' 
          : 'bg-white/95 backdrop-blur-sm border-slate-200/50 hover:shadow-2xl'
      }`}>
        {/* Enhanced status indicator bar with premium gradient */}
        <div className={`h-3 w-full ${
          isHistorical ? 'bg-gradient-to-r from-gray-400 to-gray-500' : 
          `bg-gradient-to-r ${statusStyling.gradient}`
        }`}></div>
        
        {/* Enhanced header with sophisticated styling matching MatchedApplications */}
        <CardHeader className="relative overflow-hidden bg-gradient-to-br from-[#212936] to-[#2c3c53] text-white">
          <div className={`absolute -top-8 -right-8 w-32 h-32 bg-gradient-to-br from-[#ff8000]/20 to-[#ffaa00]/20 rounded-full ${isHistorical ? 'opacity-30' : 'opacity-50'}`}></div>
          <div className={`absolute -bottom-6 -left-6 w-20 h-20 bg-gradient-to-br from-[#ff8000]/10 to-[#ffaa00]/10 rounded-full ${isHistorical ? 'opacity-30' : 'opacity-40'}`}></div>
          <div className="flex justify-between items-start relative z-10">
            <div className="flex-1">
              <CardTitle className={`text-xl mb-3 ${isHistorical ? 'text-gray-200' : 'text-white'} flex items-center gap-3`}>
                <div className="bg-gradient-to-br from-[#ff8000] to-[#ffaa00] rounded-lg p-2.5 shadow-lg">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                Funding Application #{formatApplicationNumber(application_details, application_details.id)}
              </CardTitle>
              <CardDescription className="text-gray-200 flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20">
                  <PoundSterling className="h-4 w-4 text-white" />
                  <span className="font-semibold text-white">{formatCurrency(application_details.loan_amount)} requested</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20">
                  <Clock className="h-4 w-4 text-white" />
                  <span className="font-semibold text-white">{application_details.loan_term_months} months</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20">
                  <Target className="h-4 w-4 text-white" />
                  <span className="font-semibold text-white">{application_details.purpose}</span>
                </div>
              </CardDescription>
            </div>
            <div className="text-right">
              <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold mb-3 shadow-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white`}>
                <BarChart3 className="h-4 w-4 mr-2" />
                {offers.length} Offer{offers.length !== 1 ? 's' : ''} Available
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className={`p-6 space-y-6 ${isHistorical ? 'bg-gray-50/50' : 'bg-white'}`}>
          {/* Display offers vertically */}
          {offerSlots.map((slot, index) => (
            <div key={slot.id}>
              {slot.isActive && slot.offer ? (
                // Actual offer content with enhanced styling
                <div className="relative border-2 rounded-xl p-6 transition-all duration-200 group hover:shadow-xl border-slate-200/80 bg-gradient-to-br from-white to-slate-50/50 shadow-lg backdrop-blur-sm hover:border-slate-300/80">
                  {index === 0 && !isHistorical && (
                    <div className="absolute -top-3 left-6">
                      <div className="bg-gradient-to-r from-[#212936] to-[#2c3c53] text-white px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg">
                        <Award className="h-3.5 w-3.5 text-[#ff8000]" />
                        Best Rate
                      </div>
                    </div>
                  )}
                  
                  {/* Enhanced lender info and status with better spacing */}
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      {/* Premium lender logo display with enhanced styling */}
                      {slot.offer.company_logo ? (
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-white shadow-lg border border-gray-200 flex items-center justify-center group-hover:shadow-xl transition-shadow">
                          <img 
                            src={slot.offer.company_logo} 
                            alt={`${slot.offer.lender_name} logo`}
                            className="w-14 h-12 object-contain"
                            onError={(e) => {
                              const img = e.target as HTMLImageElement;
                              img.style.display = 'none';
                              const fallback = img.parentElement?.querySelector('.logo-fallback') as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                          <div className="logo-fallback hidden w-full h-full bg-gradient-to-br from-[#212936] to-[#2c3c53] flex items-center justify-center rounded-xl">
                            <div className="text-white font-bold text-lg">{slot.offer.lender_name?.charAt(0) || 'L'}</div>
                          </div>
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#212936] to-[#2c3c53] flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                          <div className="text-white font-bold text-lg">{slot.offer.lender_name?.charAt(0) || 'L'}</div>
                        </div>
                      )}
                      <div>
                        <h4 className={`font-bold text-xl mb-1 ${isHistorical ? 'text-gray-700' : 'text-[#212936]'}`}>
                          {slot.offer.lender_name || 'Unknown Lender'}
                        </h4>
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          Expires: {slot.offer.expires_at ? new Date(slot.offer.expires_at).toLocaleDateString('en-GB') : 'Not set'}
                        </p>
                      </div>
                    </div>
                    <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold shadow-lg ${
                      isHistorical ? 'bg-gray-200 text-gray-700' : `${getStatusStyling(slot.offer.status).bgClass} ${getStatusStyling(slot.offer.status).textClass}`
                    }`}>
                      {getStatusStyling(slot.offer.status).label}
                    </div>
                  </div>
                  
                  {/* Enhanced offer metrics with unified dark theme styling */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                    <div className="group bg-gradient-to-br from-slate-50 to-slate-100 p-3 rounded-xl border border-slate-200 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Amount</p>
                        <div className="bg-gradient-to-br from-[#212936] to-[#2c3c53] rounded-full p-1.5 shadow-sm group-hover:shadow-md transition-shadow">
                          <PoundSterling className="h-3.5 w-3.5 text-white" />
                        </div>
                      </div>
                      <p className={`font-bold text-lg ${isHistorical ? 'text-gray-700' : 'text-[#212936]'}`}>
                        {formatCurrency(slot.offer.offered_amount)}
                      </p>
                      <div className="w-full bg-slate-200/50 h-1 rounded-full mt-2">
                        <div className="bg-gradient-to-r from-[#212936] to-[#ff8000] h-1 rounded-full w-full"></div>
                      </div>
                    </div>
                    <div className="group bg-gradient-to-br from-slate-50 to-slate-100 p-3 rounded-xl border border-slate-200 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Rate</p>
                        <div className="bg-gradient-to-br from-[#212936] to-[#2c3c53] rounded-full p-1.5 shadow-sm group-hover:shadow-md transition-shadow">
                          <TrendingUp className="h-3.5 w-3.5 text-white" />
                        </div>
                      </div>
                      <p className={`font-bold text-lg ${isHistorical ? 'text-gray-700' : 'text-[#212936]'}`}>
                        {slot.offer.interest_rate ? `${slot.offer.interest_rate}%` : 'Not set'}
                      </p>
                      <div className="w-full bg-slate-200/50 h-1 rounded-full mt-2">
                        <div className="bg-gradient-to-r from-[#212936] to-[#ff8000] h-1 rounded-full w-4/5"></div>
                      </div>
                    </div>
                    <div className="group bg-gradient-to-br from-slate-50 to-slate-100 p-3 rounded-xl border border-slate-200 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Term</p>
                        <div className="bg-gradient-to-br from-[#212936] to-[#2c3c53] rounded-full p-1.5 shadow-sm group-hover:shadow-md transition-shadow">
                          <Clock className="h-3.5 w-3.5 text-white" />
                        </div>
                      </div>
                      <p className={`font-bold text-lg ${isHistorical ? 'text-gray-700' : 'text-[#212936]'}`}>
                        {slot.offer.offered_term_months ? `${slot.offer.offered_term_months}m` : 'Not set'}
                      </p>
                      <div className="w-full bg-slate-200/50 h-1 rounded-full mt-2">
                        <div className="bg-gradient-to-r from-[#212936] to-[#ff8000] h-1 rounded-full w-3/5"></div>
                      </div>
                    </div>
                    <div className="group bg-gradient-to-br from-slate-50 to-slate-100 p-3 rounded-xl border border-slate-200 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Monthly</p>
                        <div className="bg-gradient-to-br from-[#212936] to-[#2c3c53] rounded-full p-1.5 shadow-sm group-hover:shadow-md transition-shadow">
                          <Calendar className="h-3.5 w-3.5 text-white" />
                        </div>
                      </div>
                      <p className={`font-bold text-lg ${isHistorical ? 'text-gray-700' : 'text-[#212936]'}`}>
                        {formatCurrency(calculateMonthlyPayment(slot.offer))}
                      </p>
                      <div className="w-full bg-slate-200/50 h-1 rounded-full mt-2">
                        <div className="bg-gradient-to-r from-[#212936] to-[#ff8000] h-1 rounded-full w-3/4"></div>
                      </div>
                    </div>
                    <div className="group bg-gradient-to-br from-slate-50 to-slate-100 p-3 rounded-xl border border-slate-200 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Total Cost</p>
                        <div className="bg-gradient-to-br from-[#212936] to-[#2c3c53] rounded-full p-1.5 shadow-sm group-hover:shadow-md transition-shadow">
                          <BarChart3 className="h-3.5 w-3.5 text-white" />
                        </div>
                      </div>
                      <p className={`font-bold text-lg ${isHistorical ? 'text-gray-700' : 'text-[#212936]'}`}>
                        {formatCurrency(calculateTotalCost(slot.offer))}
                      </p>
                      <div className="w-full bg-slate-200/50 h-1 rounded-full mt-2">
                        <div className="bg-gradient-to-r from-[#212936] to-[#ff8000] h-1 rounded-full w-full"></div>
                      </div>
                    </div>
                    <div className="group bg-gradient-to-br from-slate-50 to-slate-100 p-3 rounded-xl border border-slate-200 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Interest</p>
                        <div className="bg-gradient-to-br from-[#212936] to-[#2c3c53] rounded-full p-1.5 shadow-sm group-hover:shadow-md transition-shadow">
                          <TrendingDown className="h-3.5 w-3.5 text-white" />
                        </div>
                      </div>
                      <p className={`font-bold text-lg ${isHistorical ? 'text-gray-700' : 'text-[#212936]'}`}>
                        {formatCurrency(calculateTotalInterest(slot.offer))}
                      </p>
                      <div className="w-full bg-slate-200/50 h-1 rounded-full mt-2">
                        <div className="bg-gradient-to-r from-[#212936] to-[#ff8000] h-1 rounded-full w-2/3"></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Fees and Conditions sections */}
                  {slot.offer.fees && Object.keys(slot.offer.fees).length > 0 && (
                    <div className="mb-4">
                      <h5 className="font-semibold text-sm text-gray-700 mb-2">Fees:</h5>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {Object.entries(slot.offer.fees).map(([feeType, amount]) => (
                          <div key={feeType} className="bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                            <div className="text-xs text-gray-600 capitalize">{feeType.replace('_', ' ')}</div>
                            <div className="font-semibold text-gray-800">{formatCurrency(amount as number)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {slot.offer.conditions && slot.offer.conditions.length > 0 && (
                    <div className="mb-4">
                      <h5 className="font-semibold text-sm text-gray-700 mb-2">Conditions:</h5>
                      <ul className="space-y-1">
                        {slot.offer.conditions.map((condition, idx) => (
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
                        <Link to={`/offers/${slot.offer.id}`} className="text-white">
                        <Award className="h-4 w-4 mr-1.5" />
                        View Details
                        </Link>
                    </Button>
                    
                    {!isHistorical && ['pending', 'negotiating'].includes(slot.offer.status) && (
                      <Button 
                        size="sm"
                        className="bg-gradient-to-r from-[#ff8800] to-[#ffaa00] hover:from-[#ff9900] hover:to-[#ffbb00] text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                      >
                        <MessageSquare className="h-4 w-4 mr-1.5" />
                        Respond
                      </Button>
                    )}
                    
                    {isHistorical && slot.offer.status === 'completed' && (
                      <LenderReviewDialog
                        lenderId={slot.offer.lender_id}
                        lenderName={slot.offer.lender_name}
                        offerId={slot.offer.id}
                        offerAmount={slot.offer.offered_amount}
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
              ) : (
                // Placeholder content for slots without offers
                <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-8 bg-gray-50 text-center">
                  <div className="max-w-sm mx-auto">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                      <Clock className="h-8 w-8 text-blue-600" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-700 mb-2">More Offers Coming Soon</h4>
                    <p className="text-gray-600 text-sm">
                      We're working with additional lenders to bring you more competitive financing options. 
                      Check back soon for more offers on your application.
                    </p>
                    <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
                      <RefreshCcw className="h-3.5 w-3.5" />
                      New offers typically arrive within 24-48 hours
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          
          <Separator className="my-6 bg-gray-200" />
          
          {/* Enhanced summary section */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Application #{formatApplicationNumber(application_details, applicationId)}
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

  // Main render return for OffersList component
  return (
    <PageLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-[#212936] mb-2">
                {isLender ? 'Extended Offers' : 'Your Offers'}
              </h1>
              <p className="text-gray-600 text-lg">
                {getDescription()}
              </p>
            </div>
            {isLender && (
              <Button asChild className="bg-gradient-to-r from-[#ff8800] to-[#ffaa00] hover:from-[#ff9900] hover:to-[#ffbb00] text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200">
                <Link to="/matched-applications">
                  Find Applications
                </Link>
              </Button>
            )}
          </div>
          
         

          {/* Tab Navigation */}
          <div className="mb-6">
            <div className="border-b border-gray-200 bg-white rounded-t-lg">
              <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('active')}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    activeTab === 'active'
                      ? 'border-[#ff8800] text-[#ff8800]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Active Offers
                  {activeOffers.length > 0 && (
                    <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                      activeTab === 'active' 
                        ? 'bg-[#ff8800] text-white' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {isLender ? activeOffers.length : Object.keys(groupedActiveOffers).length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('historical')}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    activeTab === 'historical'
                      ? 'border-[#ff8800] text-[#ff8800]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Historical Offers
                  {historicalOffers.length > 0 && (
                    <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                      activeTab === 'historical' 
                        ? 'bg-[#ff8800] text-white' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {isLender ? historicalOffers.length : Object.keys(groupedHistoricalOffers).length}
                    </span>
                  )}
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            {isLoading ? (
              <div className="text-center py-12">
                <p>Loading offers...</p>
              </div>
            ) : !offers || offers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-4">
                <div className="text-center max-w-md mx-auto">
                  <div className="mb-8">
                    <InboxIcon className="h-20 w-20 text-gray-300 mx-auto mb-6" />
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                      {isLender ? "No Offers Extended Yet" : "No Funding Offers Yet"}
                    </h3>
                    <p className="text-gray-600 text-lg leading-relaxed mb-8">
                      {isLender 
                        ? "You haven't extended any offers to businesses yet. Browse available applications to get started." 
                        : "You don't have any funding offers because you haven't created any applications yet. Start by creating your first funding application to receive offers from lenders."
                      }
                    </p>
                  </div>
                  
                  <Button 
                    asChild 
                    size="lg"
                    className="bg-gradient-to-r from-[#ff8800] to-[#ffaa00] hover:from-[#ff9900] hover:to-[#ffbb00] text-white font-bold py-4 px-8 text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 rounded-xl"
                  >
                    <Link to={isLender ? "/matched-applications" : "/applications/new"} className="flex items-center gap-2">
                      {isLender ? (
                        <>
                          <Users className="h-6 w-6" />
                          Browse Applications
                          <ArrowRight className="h-5 w-5" />
                        </>
                      ) : (
                        <>
                          <Target className="h-6 w-6" />
                          Create Your First Application
                          <ArrowRight className="h-5 w-5" />
                        </>
                      )}
                    </Link>
                  </Button>
                  
                  {!isLender && (
                    <p className="text-sm text-gray-500 mt-4">
                      Creating an application takes just a few minutes and connects you with multiple lenders
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Show content based on active tab */}
                {activeTab === 'active' ? (
                  // Active offers
                  isEmptyActiveOffers ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4">
                      <div className="text-center max-w-md mx-auto">
                        <div className="mb-6">
                          <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            No Active Offers
                          </h3>
                          <p className="text-gray-600">
                            {isLender 
                              ? "You don't have any active offers at the moment." 
                              : "You don't have any active offers. Check back later or create a new application."
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {isLender ? (
                        // Lender view: Show individual active offers
                        activeOffers.map((offer) => (
                          <IndividualOfferCard key={offer.id} offer={offer} />
                        ))
                      ) : (
                        // Business view: Show grouped active offers by application
                        Object.entries(groupedActiveOffers as GroupedOffers).map(([applicationId, groupData]) => (
                          <ApplicationOffersCard 
                            key={applicationId} 
                            applicationId={applicationId} 
                            groupData={groupData} 
                            id={`application-${applicationId}`}
                          />
                        ))
                      )}
                    </>
                  )
                ) : (
                  // Historical offers
                  isEmptyHistoricalOffers ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4">
                      <div className="text-center max-w-md mx-auto">
                        <div className="mb-6">
                          <Archive className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            No Historical Offers
                          </h3>
                          <p className="text-gray-600">
                            {isLender 
                              ? "You don't have any completed, declined, or expired offers yet." 
                              : "You don't have any completed, declined, or expired offers yet."
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {isLender ? (
                        // Lender view: Show individual historical offers
                        historicalOffers.map((offer) => (
                          <IndividualOfferCard key={offer.id} offer={offer} isHistorical={true} />
                        ))
                      ) : (
                        // Business view: Show grouped historical offers by application
                        Object.entries(groupedHistoricalOffers as GroupedOffers).map(([applicationId, groupData]) => (
                          <ApplicationOffersCard 
                            key={applicationId} 
                            applicationId={applicationId} 
                            groupData={groupData} 
                            isHistorical={true}
                            id={`application-${applicationId}`}
                          />
                        ))
                      )}
                    </>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

export default OffersList;
