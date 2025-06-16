import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getDocument, updateDocument, createDocument, serverTimestamp } from '@/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { formatApplicationNumber } from '@/lib/applicationUtils';
import { useOfferActions } from '@/pages/Business/OffersList/useOfferActions';
import { Offer } from '@/pages/Business/OffersList/types';
import PageLayout from '@/components/PageLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
  AlertCircle, 
  ArrowLeft, 
  BadgeCheck, 
  Building2,
  CalendarDays, 
  ChevronRight, 
  Clock, 
  CreditCard, 
  Download, 
  FileText,
  FileEdit,
  FileCheck,
  HelpCircle,
  InfoIcon,
  MessageSquare, 
  Phone,
  PieChart, 
  PoundSterling,
  ThumbsUp, 
  Undo2, 
  X 
} from 'lucide-react';

// Helper to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0
  }).format(amount);
};

// Helper to format repayment frequency
const formatRepaymentFrequency = (frequency?: string) => {
  if (!frequency) return "Monthly";
  
  switch (frequency) {
    case "monthly": return "Monthly";
    case "bi_weekly": return "Bi-weekly";
    case "weekly": return "Weekly";
    default: return "Monthly";
  }
};

const OfferDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [declineReason, setDeclineReason] = useState('');
  const [isDeclineDialogOpen, setIsDeclineDialogOpen] = useState(false);
  const [isLenderProfileModalOpen, setIsLenderProfileModalOpen] = useState(false);
  
  // Use the centralized offer actions hook for consistent notification logic
  const { handleAcceptOffer, handleDeclineOffer } = useOfferActions(user);
  const isLender = user?.role === 'lender';
  
  // Fetch offer details using Firebase
  const { data: offer, isLoading: isLoadingOffer } = useQuery({
    queryKey: ['offer', id],
    queryFn: async () => {
      if (!id) {
        throw new Error('Offer ID is missing');
      }
      
      // Get offer data
      const { data: offerData, error: offerError } = await getDocument('offers', id);
      
      if (offerError) {
        toast.error('Failed to load offer details');
        throw offerError;
      }
      
      if (!offerData) {
        throw new Error('Offer not found');
      }
      
      // Get the associated application
      let applicationData = null;
      if (offerData.application_id) {
        const { data: appData } = await getDocument('applications', offerData.application_id);
        if (appData) {
          applicationData = appData;
        }
      }
      
      // Get lender details if not already in offer
      let lenderData = null;
      if (offerData.lender_id && (!offerData.lender_name || offerData.lender_name === 'Unnamed Lender')) {
        try {
          // Try to get from lender_profiles collection
          const { data: lenderProfile } = await getDocument('lender_profiles', offerData.lender_id);
          if (lenderProfile) {
            lenderData = {
              lender_name: lenderProfile.lender_name || lenderProfile.company_name || 'Unnamed Lender',
              company_logo: lenderProfile.logo_url || ''
            };
          } else {
            // Fallback: try to get from users collection
            const { data: userData } = await getDocument('users', offerData.lender_id);
            if (userData) {
              lenderData = {
                lender_name: userData.company_name || userData.name || 'Unnamed Lender',
                company_logo: userData.logo_url || userData.logo || ''
              };
            }
          }
        } catch (error) {
          console.warn('Could not fetch lender details:', error);
        }
      }
      
      // Get business details if we're the lender viewing our offer
      let businessData = null;
      if (isLender && applicationData && applicationData.business_id) {
        const { data: busData } = await getDocument('businesses', applicationData.business_id);
        if (busData) {
          businessData = busData;
        }
      }

      // Return combined data (similar to Supabase join)
      return {
        ...offerData,
        // Override with fetched lender data if available
        ...(lenderData && {
          lender_name: lenderData.lender_name,
          company_logo: lenderData.company_logo
        }),
        applications: applicationData,
        business: businessData
      };
    },
    enabled: !!id && !!user,
  });

  // Fetch detailed lender profile for modal
  const { data: lenderProfile, isLoading: isLoadingLenderProfile } = useQuery({
    queryKey: ['lenderProfile', offer?.lender_id],
    queryFn: async () => {
      if (!offer?.lender_id) return null;
      
      try {
        // First try to get from lender_profiles collection
        const { data: lenderData } = await getDocument('lender_profiles', offer.lender_id);
        if (lenderData) {
          return {
            ...lenderData,
            source: 'lender_profiles'
          };
        }
        
        // Fallback to users collection
        const { data: userData } = await getDocument('users', offer.lender_id);
        if (userData) {
          return {
            ...userData,
            lender_name: userData.company_name || userData.name || 'Unnamed Lender',
            source: 'users'
          };
        }
        
        return null;
      } catch (error) {
        console.error('Error fetching lender profile:', error);
        return null;
      }
    },
    enabled: !!offer?.lender_id && isLenderProfileModalOpen,
  });

  // Wrapper functions to match button onClick signatures
  const handleAcceptOfferWrapper = async () => {
    if (offer) {
      await handleAcceptOffer(offer);
    }
  };

  const handleDeclineOfferWrapper = async () => {
    if (offer) {
      await handleDeclineOffer(offer, declineReason);
      setIsDeclineDialogOpen(false);
    }
  };

  // Withdraw offer (for lenders)
  const handleWithdrawOffer = async () => {
    try {
      if (!id || !offer) {
        toast.error('Missing offer ID');
        return;
      }
      
      // Update offer status
      const { error } = await updateDocument('offers', id, { 
        status: 'withdrawn',
        updated_at: new Date().toISOString()
      });
      
      if (error) throw error;
      
      // Create notification for the business
      if (offer.applications && offer.applications.business_id) {
        await createDocument('notifications', {
          recipient_id: offer.applications.business_id,
          type: 'offer_withdrawn',
          title: 'Offer Withdrawn',
          message: `A financing offer for ${formatCurrency(offer.offered_amount)} has been withdrawn by the lender.`,
          related_entity_id: id,
          related_entity_type: 'offer',
          application_id: offer.application_id,
          read: false,
          sent_at: new Date().toISOString()
        });
      }
      
      toast.success('Offer withdrawn successfully.');
      
      // Refresh the page after withdrawal
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (err) {
      console.error('Error withdrawing offer:', err);
      toast.error('Failed to withdraw offer');
    }
  };

  if (isLoadingOffer) {
    return (
      <PageLayout>
        <div className="container py-8">
          <div className="max-w-4xl mx-auto">
            <div className="h-96 animate-pulse bg-gray-100 rounded-xl"></div>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!offer) {
    return (
      <PageLayout>
        <div className="container py-8">
          <div className="max-w-4xl mx-auto">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Offer not found</AlertTitle>
              <AlertDescription>
                The offer you're looking for doesn't exist or you don't have permission to view it.
              </AlertDescription>
            </Alert>
            <Button 
              className="mt-4"
              variant="outline" 
              onClick={() => navigate('/offers')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Offers
            </Button>
          </div>
        </div>
      </PageLayout>
    );
  }

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
  
  // Check expiry date and status
  const isExpired = new Date(offer.expiry_date || offer.expires_at) < new Date();
  const isAccepted = offer.status === 'accepted';
  const isDeclined = offer.status === 'declined';
  const isPending = offer.status === 'pending';
  const isNegotiating = offer.status === 'negotiating';
  const isWithdrawn = offer.status === 'withdrawn';

  // Early check for business ID visibility
  const businessName = offer.business?.business_name || 
    (offer.applications?.business_name || 'Business');

  return (
    <PageLayout>
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
        <div className="container py-8">
          <Button
            variant="ghost"
            className="mb-6 flex items-center hover:bg-[#212936]/10 text-[#212936]"
            onClick={() => navigate(isLender ? '/matched-applications' : '/offers')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to {isLender ? 'Applications' : 'Offers'}
          </Button>
          
          <div className="max-w-10xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold mb-1 text-slate-900">
                  {isLender ? `Offer to ${businessName}` : `Offer from ${offer.lender_name}`}
                </h1>
                <p className="text-slate-800">
                  {isLender 
                    ? `Application #${formatApplicationNumber(offer.applications, offer.application_id)}`
                    : `For loan application #${formatApplicationNumber(offer.applications, offer.application_id)}`
                  }
                </p>
              </div>
              <div className="mt-2 md:mt-0">
                {isExpired ? (
                  <Badge variant="outline" className="text-orange-500 bg-orange-50">Expired</Badge>
                ) : isAccepted ? (
                  <Badge variant="outline" className="text-green-500 bg-green-50">Accepted</Badge>
                ) : isDeclined ? (
                  <Badge variant="outline" className="text-red-500 bg-red-50">Declined</Badge>
                ) : isWithdrawn ? (
                  <Badge variant="outline" className="text-gray-500 bg-gray-50">Withdrawn</Badge>
                ) : isPending ? (
                  <Badge variant="outline" className="text-blue-500 bg-blue-50">Pending Response</Badge>
                ) : isNegotiating ? (
                  <Badge variant="outline" className="text-purple-500 bg-purple-50">In Negotiation</Badge>
                ) : (
                  <Badge variant="outline">{offer.status}</Badge>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
              {/* Main content - 3/5 width on desktop for more space */}
              <div className="lg:col-span-3 space-y-10">
                <Card className="bg-white/95 backdrop-blur-sm border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl">
                  <CardHeader className="bg-gradient-to-br from-[#212936] to-[#2c3c53] text-white rounded-t-xl">
                    <CardTitle className="text-white text-xl">Loan Details</CardTitle>
                    <CardDescription className="text-gray-200">Terms and conditions for this funding offer</CardDescription>
                  </CardHeader>
                  <CardContent className="p-10 space-y-10">
                    {/* Enhanced metric cards matching OffersList styling */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="group bg-gradient-to-br from-slate-50 to-slate-100 p-3 rounded-xl border border-slate-200 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Amount</p>
                          <div className="bg-gradient-to-br from-[#212936] to-[#2c3c53] rounded-full p-1.5 shadow-sm group-hover:shadow-md transition-shadow">
                            <PoundSterling className="h-3.5 w-3.5 text-white" />
                          </div>
                        </div>
                        <p className="font-bold text-lg text-[#212936]">{formatCurrency(loanAmount)}</p>
                        <div className="w-full bg-slate-200/50 h-1 rounded-full mt-2">
                          <div className="bg-gradient-to-r from-[#212936] to-[#ff8000] h-1 rounded-full w-full"></div>
                        </div>
                      </div>
                      
                      <div className="group bg-gradient-to-br from-slate-50 to-slate-100 p-3 rounded-xl border border-slate-200 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Rate</p>
                          <div className="bg-gradient-to-br from-[#212936] to-[#2c3c53] rounded-full p-1.5 shadow-sm group-hover:shadow-md transition-shadow">
                            <CreditCard className="h-3.5 w-3.5 text-white" />
                          </div>
                        </div>
                        <p className="font-bold text-lg text-[#212936]">{interestRate}%</p>
                        <div className="w-full bg-slate-200/50 h-1 rounded-full mt-2">
                          <div className="bg-gradient-to-r from-[#212936] to-[#ff8000] h-1 rounded-full w-4/5"></div>
                        </div>
                      </div>
                      
                      <div className="group bg-gradient-to-br from-slate-50 to-slate-100 p-3 rounded-xl border border-slate-200 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Term</p>
                          <div className="bg-gradient-to-br from-[#212936] to-[#2c3c53] rounded-full p-1.5 shadow-sm group-hover:shadow-md transition-shadow">
                            <CalendarDays className="h-3.5 w-3.5 text-white" />
                          </div>
                        </div>
                        <p className="font-bold text-lg text-[#212936]">{termMonths}m</p>
                        <div className="w-full bg-slate-200/50 h-1 rounded-full mt-2">
                          <div className="bg-gradient-to-r from-[#212936] to-[#ff8000] h-1 rounded-full w-3/5"></div>
                        </div>
                      </div>
                      
                      <div className="group bg-gradient-to-br from-slate-50 to-slate-100 p-3 rounded-xl border border-slate-200 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Monthly</p>
                          <div className="bg-gradient-to-br from-[#212936] to-[#2c3c53] rounded-full p-1.5 shadow-sm group-hover:shadow-md transition-shadow">
                            <CalendarDays className="h-3.5 w-3.5 text-white" />
                          </div>
                        </div>
                        <p className="font-bold text-lg text-[#212936]">{formatCurrency(monthlyPayment)}</p>
                        <div className="w-full bg-slate-200/50 h-1 rounded-full mt-2">
                          <div className="bg-gradient-to-r from-[#212936] to-[#ff8000] h-1 rounded-full w-4/5"></div>
                        </div>
                      </div>
                      
                      <div className="group bg-gradient-to-br from-slate-50 to-slate-100 p-3 rounded-xl border border-slate-200 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">APR</p>
                          <div className="bg-gradient-to-br from-[#212936] to-[#2c3c53] rounded-full p-1.5 shadow-sm group-hover:shadow-md transition-shadow">
                            <CreditCard className="h-3.5 w-3.5 text-white" />
                          </div>
                        </div>
                        <p className="font-bold text-lg text-[#212936]">{offer.apr || (interestRate * 1.2).toFixed(1)}%</p>
                        <div className="w-full bg-slate-200/50 h-1 rounded-full mt-2">
                          <div className="bg-gradient-to-r from-[#212936] to-[#ff8000] h-1 rounded-full w-3/4"></div>
                        </div>
                      </div>
                      
                      <div className="group bg-gradient-to-br from-slate-50 to-slate-100 p-3 rounded-xl border border-slate-200 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Frequency</p>
                          <div className="bg-gradient-to-br from-[#212936] to-[#2c3c53] rounded-full p-1.5 shadow-sm group-hover:shadow-md transition-shadow">
                            <Clock className="h-3.5 w-3.5 text-white" />
                          </div>
                        </div>
                        <p className="font-bold text-lg text-[#212936]">{formatRepaymentFrequency(offer.repayment_frequency)}</p>
                        <div className="w-full bg-slate-200/50 h-1 rounded-full mt-2">
                          <div className="bg-gradient-to-r from-[#212936] to-[#ff8000] h-1 rounded-full w-2/3"></div>
                        </div>
                      </div>
                    </div>
                    
                    <Separator className="my-6 bg-gray-200" />
                    
                    {/* Fees section with enhanced styling */}
                    <div className="group bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200 shadow-md hover:shadow-lg transition-all duration-200">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="bg-gradient-to-br from-[#212936] to-[#2c3c53] rounded-full p-1.5 shadow-sm group-hover:shadow-md transition-shadow">
                          <FileEdit className="h-4 w-4 text-white" />
                        </div>
                        <h3 className="font-semibold text-slate-900 uppercase tracking-wide text-sm">Fees & Additional Costs</h3>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600 font-medium">Arrangement Fee ({arrangementFeePercent}%)</span>
                          <span className="font-bold text-[#212936]">{formatCurrency(arrangementFeeAmount)}</span>
                        </div>
                        
                        {earlyRepaymentFee > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-600 font-medium">Early Repayment Fee</span>
                            <span className="font-bold text-[#212936]">{earlyRepaymentFee}% of outstanding balance</span>
                          </div>
                        )}
                        
                        {/* Display any additional fees if present */}
                        {offer.fees && Object.entries(offer.fees)
                          .filter(([key]) => key !== 'arrangement_fee' && key !== 'early_repayment_fee')
                          .map(([feeName, feeAmount]) => (
                            <div key={feeName} className="flex justify-between">
                              <span className="text-sm text-slate-600 font-medium capitalize">{feeName.replace('_', ' ')}</span>
                              <span className="font-bold text-[#212936]">
                                {typeof feeAmount === 'number' 
                                  ? formatCurrency(feeAmount) 
                                  : String(feeAmount)}
                              </span>
                            </div>
                        ))}
                      </div>
                    </div>
                    
                    <Separator className="my-6 bg-gray-200" />
                    
                    {/* Conditions section with enhanced styling */}
                    <div className="group bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200 shadow-md hover:shadow-lg transition-all duration-200">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="bg-gradient-to-br from-[#212936] to-[#2c3c53] rounded-full p-1.5 shadow-sm group-hover:shadow-md transition-shadow">
                          <FileCheck className="h-4 w-4 text-white" />
                        </div>
                        <h3 className="font-semibold text-slate-900 uppercase tracking-wide text-sm">Conditions</h3>
                      </div>
                      <div className="space-y-2">
                        {offer.conditions && offer.conditions.length > 0 ? (
                          <ul className="list-disc pl-5 space-y-1">
                            {offer.conditions.map((condition, index) => (
                              <li key={index} className="text-sm text-slate-700">{condition}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-slate-600">No specific conditions attached to this offer.</p>
                        )}
                      </div>
                    </div>
                    
                    {offer.business_notes && (
                      <>
                        <Separator className="my-6 bg-gray-200" />
                        <div className="group bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200 shadow-md hover:shadow-lg transition-all duration-200">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="bg-gradient-to-br from-[#212936] to-[#2c3c53] rounded-full p-1.5 shadow-sm group-hover:shadow-md transition-shadow">
                              <MessageSquare className="h-4 w-4 text-white" />
                            </div>
                            <h3 className="font-semibold text-slate-900 uppercase tracking-wide text-sm">Notes from Lender</h3>
                          </div>
                          <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
                            <p className="text-sm text-slate-800">{offer.business_notes}</p>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
                
                <Card className="bg-white/95 backdrop-blur-sm border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl">
                  <CardHeader className="bg-gradient-to-br from-[#212936] to-[#2c3c53] text-white rounded-t-xl">
                    <CardTitle>Cost Breakdown</CardTitle>
                    <CardDescription className="text-gray-200">Detailed view of total loan costs</CardDescription>
                  </CardHeader>
                  <CardContent className="p-10 space-y-8">
                    {/* Cost Breakdown summary with enhanced styling */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="group bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-xl border border-slate-200 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
                        <div className="flex justify-between items-start mb-2">
                          <div className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Monthly Payment</div>
                          <div className="bg-gradient-to-br from-[#212936] to-[#2c3c53] rounded-full p-1.5 shadow-sm group-hover:shadow-md transition-shadow">
                            <CalendarDays className="h-3.5 w-3.5 text-white" />
                          </div>
                        </div>
                        <div className="text-xl font-bold text-[#212936]">
                          {formatCurrency(monthlyPayment)}
                        </div>
                        <div className="text-xs text-slate-600 mt-1">
                          Base payment excluding fees
                        </div>
                      </div>
                      <div className="group bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-xl border border-slate-200 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
                        <div className="flex justify-between items-start mb-2">
                          <div className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Total Repayment</div>
                          <div className="bg-gradient-to-br from-[#212936] to-[#2c3c53] rounded-full p-1.5 shadow-sm group-hover:shadow-md transition-shadow">
                            <PoundSterling className="h-3.5 w-3.5 text-white" />
                          </div>
                        </div>
                        <div className="text-xl font-bold text-[#212936]">
                          {formatCurrency(totalPayment)}
                        </div>
                        <div className="text-xs text-slate-600 mt-1">
                          Principal + Interest
                        </div>
                      </div>
                      <div className="group bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-xl border border-slate-200 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
                        <div className="flex justify-between items-start mb-2">
                          <div className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Arrangement Fee</div>
                          <div className="bg-gradient-to-br from-[#212936] to-[#2c3c53] rounded-full p-1.5 shadow-sm group-hover:shadow-md transition-shadow">
                            <FileEdit className="h-3.5 w-3.5 text-white" />
                          </div>
                        </div>
                        <div className="text-xl font-bold text-[#212936]">
                          {formatCurrency(arrangementFeeAmount)}
                        </div>
                        <div className="text-xs text-slate-600 mt-1">
                          {arrangementFeePercent}% of principal
                        </div>
                      </div>
                    </div>
                    
                    {/* Cost Breakdown details */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-slate-900">Principal Amount</p>
                          <p className="text-sm text-slate-700">Amount borrowed</p>
                        </div>
                        <p className="font-semibold text-slate-900">{formatCurrency(loanAmount)}</p>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-slate-900">Total Interest</p>
                          <p className="text-sm text-slate-700">Over {termMonths} months at {interestRate}%</p>
                        </div>
                        <p className="font-semibold text-orange-700">{formatCurrency(totalInterest)}</p>
                      </div>
                      
                      <Separator />
                      
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-slate-900">Total Cost</p>
                          <p className="text-sm text-slate-700">All payments over loan term</p>
                        </div>
                        <p className="font-bold text-lg text-slate-900">{formatCurrency(totalPayment)}</p>
                      </div>
                      
                      <Alert className="bg-blue-50 border-blue-200">
                        <InfoIcon className="h-4 w-4 text-blue-700" />
                        <AlertTitle className="font-medium text-blue-900">Loan Summary</AlertTitle>
                        <AlertDescription className="text-blue-800">
                          This offer provides {formatCurrency(loanAmount)} over {termMonths} months with monthly payments of {formatCurrency(monthlyPayment)}.
                          {offer.apr && ` The APR is ${offer.apr}%.`}
                        </AlertDescription>
                      </Alert>
                    </div>
                  </CardContent>
                </Card>

                {isLender && offer.applications && (
                  <Card className="bg-white/95 backdrop-blur-sm border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl">
                    <CardHeader className="bg-gradient-to-br from-[#212936] to-[#2c3c53] text-white rounded-t-xl">
                      <CardTitle className="text-white">Application Details</CardTitle>
                      <CardDescription className="text-gray-200">Information about the associated application</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-slate-700">Requested Amount</p>
                          <p className="font-semibold">
                            {formatCurrency(offer.applications.loan_amount || 0)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-700">Requested Term</p>
                          <p className="font-semibold">
                            {offer.applications.loan_term_months || 0} months
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-700">Purpose</p>
                          <p className="font-semibold">
                            {offer.applications.purpose || 'Not specified'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-700">Application Status</p>
                          <p className="font-semibold capitalize">
                            {offer.applications.status || 'Unknown'}
                          </p>
                        </div>
                      </div>
                      
                      <Button 
                        variant="outline" 
                        className="w-full mt-2"
                        onClick={() => navigate(`/business/${offer.application_id}`)}
                      >
                        <FileCheck className="mr-2 h-4 w-4" />
                        View Full Application
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
              
              {/* Sidebar - 2/5 width on desktop for better messaging space */}
              <div className="lg:col-span-2 space-y-8">
                {/* Action card - Different for lender vs business */}
                <Card className={`bg-white/95 backdrop-blur-sm border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl ${
                  isExpired ? 'border-gray-200' :
                  isAccepted ? 'border-green-200' :
                  isDeclined ? 'border-red-200' :
                  isWithdrawn ? 'border-gray-200' :
                  'border-blue-200'
                }`}>
                  <CardHeader className={`${
                    isExpired ? 'bg-gray-100' :
                    isAccepted ? 'bg-green-50' :
                    isDeclined ? 'bg-red-50' :
                    isWithdrawn ? 'bg-gray-100' :
                    'bg-gradient-to-br from-[#212936] to-[#2c3c53] text-white'
                  } rounded-t-xl`}>
                    <CardTitle className={`${
                      isExpired || isAccepted || isDeclined || isWithdrawn ? 'text-slate-800 font-bold' : ''
                    }`}>
                      {isExpired ? 'Offer Expired' :
                       isAccepted ? 'Offer Accepted' :
                       isDeclined ? 'Offer Declined' :
                       isWithdrawn ? 'Offer Withdrawn' :
                       isLender ? 'Offer Status' : 'Take Action'}
                    </CardTitle>
                    <CardDescription className={`${
                      isExpired || isAccepted || isDeclined || isWithdrawn ? 'text-slate-700' : 'text-gray-100'
                    }`}>
                      {isExpired ? 'This offer is no longer available' :
                       isAccepted ? `${isLender ? 'The business has' : 'You have'} accepted this offer` :
                       isDeclined ? `${isLender ? 'The business has' : 'You have'} declined this offer` :
                       isWithdrawn ? 'You have withdrawn this offer' :
                       isLender ? 'Current status of your offer' : 'Review and respond to this offer'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isExpired ? (
                      <Alert>
                        <Clock className="h-4 w-4" />
                        <AlertDescription>
                          This offer expired on {new Date(offer.expiry_date || offer.expires_at).toLocaleDateString()}
                        </AlertDescription>
                      </Alert>
                    ) : isAccepted ? (
                      <Alert className="bg-green-50 border-green-200 text-green-900">
                        <BadgeCheck className="h-4 w-4 text-green-700" />
                        <AlertTitle className="font-medium">Success</AlertTitle>
                        <AlertDescription className="text-green-900">
                          {isLender 
                            ? `The business accepted this offer on ${new Date(offer.updated_at).toLocaleDateString()}. You should contact them to proceed with the next steps.`
                            : `Accepted on ${new Date(offer.updated_at).toLocaleDateString()}. The lender will contact you with next steps.`}
                        </AlertDescription>
                      </Alert>
                    ) : isDeclined ? (
                      <Alert variant="destructive">
                        <X className="h-4 w-4" />
                        <AlertDescription>
                          {isLender
                            ? `The business declined this offer on ${new Date(offer.updated_at).toLocaleDateString()}.`
                            : `Declined on ${new Date(offer.updated_at).toLocaleDateString()}`}
                          {offer.decline_reason && (
                            <div className="mt-2">
                              <p className="font-medium text-sm">Reason:</p>
                              <p className="text-sm">{offer.decline_reason}</p>
                            </div>
                          )}
                        </AlertDescription>
                      </Alert>
                    ) : isWithdrawn ? (
                      <Alert>
                        <Undo2 className="h-4 w-4" />
                        <AlertDescription>
                          You withdrew this offer on {new Date(offer.updated_at).toLocaleDateString()}
                        </AlertDescription>
                      </Alert>
                    ) : isPending && isLender ? (
                      <div className="space-y-6">
                        <Alert>
                          <InfoIcon className="h-4 w-4" />
                          <AlertDescription>
                            The business hasn't responded to this offer yet. It expires on {new Date(offer.expiry_date || offer.expires_at).toLocaleDateString()}.
                          </AlertDescription>
                        </Alert>
                        
                        <div className="flex flex-col gap-3">
                          <Button 
                            variant="outline" 
                            className="w-full"
                            onClick={() => navigate(`/create-offer/${offer.application_id}`, { 
                              state: { editOffer: offer.id } 
                            })}
                          >
                            <FileEdit className="mr-2 h-4 w-4" />
                            Edit Offer
                          </Button>
                          
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" className="w-full text-red-500 hover:text-red-500">
                                <X className="mr-2 h-4 w-4" />
                                Withdraw Offer
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Withdraw Offer</DialogTitle>
                                <DialogDescription>
                                  Are you sure you want to withdraw this offer? This action cannot be undone.
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter className="gap-2">
                                <Button
                                  variant="ghost"
                                  onClick={() => {}}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={handleWithdrawOffer}
                                >
                                  Confirm Withdrawal
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>

                          {offer.business && isAccepted && (
                            <Button 
                              className="w-full bg-[#212936] hover:bg-[#212936]/90"
                              onClick={() => navigate('/messages')}
                            >
                              <MessageSquare className="mr-2 h-4 w-4" />
                              Message Business
                            </Button>
                          )}
                        </div>
                      </div>
                    ) : !isLender ? (
                      <div className="space-y-6">
                        <Alert>
                          <CalendarDays className="h-4 w-4" />
                          <AlertDescription>
                            Offer valid until {new Date(offer.expiry_date || offer.expires_at).toLocaleDateString()}
                          </AlertDescription>
                        </Alert>
                        
                        <div className="flex flex-col gap-3">
                          <Button 
                            className="w-full bg-[#ff8000] hover:bg-[#ff8000]/90 text-white shadow-lg hover:scale-105 transition-transform"
                            onClick={handleAcceptOfferWrapper}
                          >
                            <ThumbsUp className="mr-2 h-4 w-4" />
                            Accept Offer
                          </Button>
                          
                          <Dialog open={isDeclineDialogOpen} onOpenChange={setIsDeclineDialogOpen}>
                            <DialogTrigger asChild>
                              <Button variant="outline" className="w-full">
                                <X className="mr-2 h-4 w-4" />
                                Decline Offer
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Decline Offer</DialogTitle>
                                <DialogDescription>
                                  Please let us know why you're declining this offer. This feedback helps lenders improve their offerings.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <Textarea
                                  placeholder="Enter your reason for declining (optional)"
                                  value={declineReason}
                                  onChange={(e) => setDeclineReason(e.target.value)}
                                />
                              </div>
                              <DialogFooter className="gap-2">
                                <Button
                                  variant="ghost"
                                  onClick={() => setIsDeclineDialogOpen(false)}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={handleDeclineOfferWrapper}
                                >
                                  Confirm Decline
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          
                          <Button 
                            variant="link" 
                            className="w-full"
                            onClick={() => {
                              // Scroll to messaging section
                              const messagingCard = document.querySelector('[data-messaging-card]');
                              if (messagingCard) {
                                messagingCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              } else {
                                toast.info('Accept the offer to start messaging with the lender');
                              }
                            }}
                          >
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Contact Lender
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
                
                {/* Business info card for lenders / Lender info card for businesses */}
                <Card className="bg-white/95 backdrop-blur-sm border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl">
                  <CardHeader className="bg-gradient-to-br from-[#212936] to-[#2c3c53] text-white rounded-t-xl">
                    <CardTitle className="text-white flex items-center gap-3">
                      {!isLender && (
                        <Avatar className="w-8 h-8 border-2 border-white/20">
                          <AvatarImage 
                            src={offer?.company_logo} 
                            alt={`${offer.lender_name} logo`}
                          />
                          <AvatarFallback className="bg-white/10 text-white text-sm">
                            <Building2 className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                      {isLender ? businessName : offer.lender_name}
                    </CardTitle>
                    <CardDescription className="text-gray-200">About the {isLender ? 'business' : 'lender'}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center gap-2">
                      {isLender ? (
                        <>
                          <Building2 className="text-blue-500" />
                          <span className="text-sm">Business Profile</span>
                        </>
                      ) : (
                        <>
                          <BadgeCheck className="text-blue-500" />
                          <span className="text-sm text-blue-500">Verified Lender</span>
                        </>
                      )}
                    </div>
                    {isLender && offer.business ? (
                      <div className="space-y-2">
                        {offer.business.industry_sector && (
                          <div>
                            <p className="text-sm text-slate-700">Industry</p>
                            <p className="text-sm font-medium capitalize">{offer.business.industry_sector.replace('_', ' ')}</p>
                          </div>
                        )}
                        {offer.business.company_size && (
                          <div>
                            <p className="text-sm text-slate-700">Company Size</p>
                            <p className="text-sm font-medium">{offer.business.company_size}</p>
                          </div>
                        )}
                        <div className="pt-2">
                          <Button 
                            variant="outline" 
                            className="w-full"
                            onClick={() => navigate(`/business/${offer.business?.id || offer.applications?.business_id}`)}
                          >
                            <Building2 className="mr-2 h-4 w-4" />
                            View Business Profile
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-slate-700">
                        <p>Experienced lender specialising in business financing solutions.</p>
                        {offer.company_name && (
                          <div className="mt-2">
                            <p className="font-medium">{offer.company_name}</p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {!isLender && (
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => setIsLenderProfileModalOpen(true)}
                      >
                        <Building2 className="mr-2 h-4 w-4" />
                        View Lender Profile
                      </Button>
                    )}
                  </CardContent>
                </Card>
                
                {/* Documents & Actions */}
                <Card className="bg-white/95 backdrop-blur-sm border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl">
                  <CardHeader className="bg-gradient-to-br from-[#212936] to-[#2c3c53] text-white rounded-t-xl">
                    <CardTitle className="text-white">Documents & {isLender ? 'Analytics' : 'Support'}</CardTitle>
                    <CardDescription className="text-gray-200">Manage documentation and support</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <Button variant="outline" className="w-full">
                      <Download className="mr-2 h-4 w-4" />
                      Download {isLender ? 'Offer Details' : 'Offer PDF'}
                    </Button>
                    
                    {isLender ? (
                      <>
                        {isAccepted && (
                          <Button variant="outline" className="w-full">
                            <PieChart className="mr-2 h-4 w-4" />
                            View Analytics
                          </Button>
                        )}
                        {offer.applications?.user_id && (
                          <Button variant="outline" className="w-full">
                            <Phone className="mr-2 h-4 w-4" />
                            Contact Business
                          </Button>
                        )}
                      </>
                    ) : (
                      <Button variant="outline" className="w-full">
                        <HelpCircle className="mr-2 h-4 w-4" />
                        Get Help
                      </Button>
                    )}
                  </CardContent>
                </Card>
                
                {/* Messaging Navigation - Available after offer acceptance */}
                {isAccepted && (
                  <Card className="bg-white/95 backdrop-blur-sm border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl">
                    <CardHeader className="bg-gradient-to-br from-[#212936] to-[#2c3c53] text-white rounded-t-xl">
                      <CardTitle className="text-white flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Communication
                      </CardTitle>
                      <CardDescription className="text-gray-200">
                        Message with {isLender ? 'the business' : 'the lender'} about this offer
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="text-center space-y-4">
                        <div className="bg-slate-50 rounded-lg p-4">
                          <MessageSquare className="h-12 w-12 text-[#ff8000] mx-auto mb-3" />
                          <p className="text-sm text-slate-600 mb-4">
                            Continue your conversation with {isLender ? 'the business' : offer?.lender_name} about this accepted offer.
                          </p>
                          <Button 
                            onClick={() => navigate('/messages')}
                            className="bg-[#ff8000] hover:bg-[#ff8000]/90 text-white"
                          >
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Open Messages
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lender Profile Modal */}
      <Dialog open={isLenderProfileModalOpen} onOpenChange={setIsLenderProfileModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#212936]">
              Lender Profile
            </DialogTitle>
            <DialogDescription>
              Detailed information about {offer?.lender_name || 'this lender'}
            </DialogDescription>
          </DialogHeader>
          
          {isLoadingLenderProfile ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#212936]"></div>
            </div>
          ) : lenderProfile ? (
            <div className="space-y-6">
              {/* Lender Header */}
              <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg border">
                <div className="flex-shrink-0">
                  <Avatar className="w-16 h-16 border-2 border-white shadow-sm">
                    <AvatarImage 
                      src={lenderProfile.logo_url || lenderProfile.company_logo || offer?.company_logo} 
                      alt={`${lenderProfile.lender_name || lenderProfile.company_name} logo`}
                    />
                    <AvatarFallback className="bg-gradient-to-br from-[#212936] to-[#2c3c53] text-white text-xl">
                      <Building2 className="h-8 w-8" />
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-[#212936]">
                    {lenderProfile.lender_name || lenderProfile.company_name || offer?.lender_name || 'Unnamed Lender'}
                  </h3>
                  {lenderProfile.business_type && (
                    <p className="text-sm text-slate-600 capitalize">
                      {lenderProfile.business_type.replace('_', ' ')}
                    </p>
                  )}
                  {lenderProfile.established_year && (
                    <p className="text-sm text-slate-600">
                      Established: {lenderProfile.established_year}
                    </p>
                  )}
                </div>
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  <BadgeCheck className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              </div>

              {/* Company Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {lenderProfile.company_size && (
                  <div className="bg-white p-4 rounded-lg border">
                    <h4 className="font-medium text-slate-900 mb-1">Company Size</h4>
                    <p className="text-sm text-slate-600">{lenderProfile.company_size}</p>
                  </div>
                )}
                
                {lenderProfile.industry_focus && (
                  <div className="bg-white p-4 rounded-lg border">
                    <h4 className="font-medium text-slate-900 mb-1">Industry Focus</h4>
                    <p className="text-sm text-slate-600 capitalize">
                      {Array.isArray(lenderProfile.industry_focus) 
                        ? lenderProfile.industry_focus.join(', ').replace(/_/g, ' ')
                        : lenderProfile.industry_focus.replace(/_/g, ' ')
                      }
                    </p>
                  </div>
                )}

                {lenderProfile.lending_criteria && (
                  <div className="bg-white p-4 rounded-lg border md:col-span-2">
                    <h4 className="font-medium text-slate-900 mb-3">Lending Criteria</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      {typeof lenderProfile.lending_criteria === 'object' ? (
                        <>
                          {lenderProfile.lending_criteria.min_loan_amount && typeof lenderProfile.lending_criteria.min_loan_amount === 'number' && (
                            <div>
                              <span className="font-medium text-slate-700">Min Loan:</span>
                              <span className="ml-2 text-slate-600">{formatCurrency(lenderProfile.lending_criteria.min_loan_amount)}</span>
                            </div>
                          )}
                          {lenderProfile.lending_criteria.max_loan_amount && typeof lenderProfile.lending_criteria.max_loan_amount === 'number' && (
                            <div>
                              <span className="font-medium text-slate-700">Max Loan:</span>
                              <span className="ml-2 text-slate-600">{formatCurrency(lenderProfile.lending_criteria.max_loan_amount)}</span>
                            </div>
                          )}
                          {lenderProfile.lending_criteria.min_annual_revenue && typeof lenderProfile.lending_criteria.min_annual_revenue === 'number' && (
                            <div>
                              <span className="font-medium text-slate-700">Min Revenue:</span>
                              <span className="ml-2 text-slate-600">{formatCurrency(lenderProfile.lending_criteria.min_annual_revenue)}/year</span>
                            </div>
                          )}
                          {lenderProfile.lending_criteria.interest_rate_range && typeof lenderProfile.lending_criteria.interest_rate_range === 'string' && (
                            <div>
                              <span className="font-medium text-slate-700">Interest Rate:</span>
                              <span className="ml-2 text-slate-600">{lenderProfile.lending_criteria.interest_rate_range}</span>
                            </div>
                          )}
                          {lenderProfile.lending_criteria.funding_speed_days && typeof lenderProfile.lending_criteria.funding_speed_days === 'number' && (
                            <div>
                              <span className="font-medium text-slate-700">Funding Speed:</span>
                              <span className="ml-2 text-slate-600">{lenderProfile.lending_criteria.funding_speed_days} days</span>
                            </div>
                          )}
                          {lenderProfile.lending_criteria.min_business_age_months && typeof lenderProfile.lending_criteria.min_business_age_months === 'number' && (
                            <div>
                              <span className="font-medium text-slate-700">Min Business Age:</span>
                              <span className="ml-2 text-slate-600">{Math.round(lenderProfile.lending_criteria.min_business_age_months / 12)} years</span>
                            </div>
                          )}
                          {lenderProfile.lending_criteria.preferred_industries && lenderProfile.lending_criteria.preferred_industries.length > 0 && (
                            <div className="sm:col-span-2">
                              <span className="font-medium text-slate-700">Preferred Industries:</span>
                              <div className="mt-1 flex flex-wrap gap-1">
                                {lenderProfile.lending_criteria.preferred_industries.map((industry, index) => (
                                  <Badge key={index} variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                    {industry.replace(/_/g, ' ')}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          {lenderProfile.lending_criteria.excluded_industries && lenderProfile.lending_criteria.excluded_industries.length > 0 && (
                            <div className="sm:col-span-2">
                              <span className="font-medium text-slate-700">Excluded Industries:</span>
                              <div className="mt-1 flex flex-wrap gap-1">
                                {lenderProfile.lending_criteria.excluded_industries.map((industry, index) => (
                                  <Badge key={index} variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                                    {industry.replace(/_/g, ' ')}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          {lenderProfile.lending_criteria.funding_types && lenderProfile.lending_criteria.funding_types.length > 0 && (
                            <div className="sm:col-span-2">
                              <span className="font-medium text-slate-700">Funding Types:</span>
                              <div className="mt-1 flex flex-wrap gap-1">
                                {lenderProfile.lending_criteria.funding_types.map((type, index) => (
                                  <Badge key={index} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                    {type.replace(/_/g, ' ')}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="text-slate-600">{lenderProfile.lending_criteria}</p>
                      )}
                    </div>
                  </div>
                )}

                {(lenderProfile.min_loan_amount || lenderProfile.max_loan_amount) && (
                  <div className="bg-white p-4 rounded-lg border">
                    <h4 className="font-medium text-slate-900 mb-1">Loan Range</h4>
                    <p className="text-sm text-slate-600">
                      {lenderProfile.min_loan_amount && typeof lenderProfile.min_loan_amount === 'number' && formatCurrency(lenderProfile.min_loan_amount)} 
                      {lenderProfile.min_loan_amount && lenderProfile.max_loan_amount && ' - '}
                      {lenderProfile.max_loan_amount && typeof lenderProfile.max_loan_amount === 'number' && formatCurrency(lenderProfile.max_loan_amount)}
                    </p>
                  </div>
                )}
              </div>

              {/* Contact Information */}
              {(lenderProfile.contact_email || lenderProfile.phone || lenderProfile.website) && (
                <div className="bg-slate-50 p-4 rounded-lg border">
                  <h4 className="font-medium text-slate-900 mb-3">Contact Information</h4>
                  <div className="space-y-2">
                    {lenderProfile.contact_email && (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-slate-600">Email: {lenderProfile.contact_email}</span>
                      </div>
                    )}
                    {lenderProfile.phone && (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-slate-600">Phone: {lenderProfile.phone}</span>
                      </div>
                    )}
                    {lenderProfile.website && (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span className="text-sm text-slate-600">Website: {lenderProfile.website}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Company Description */}
              {lenderProfile.company_description && (
                <div className="bg-white p-4 rounded-lg border">
                  <h4 className="font-medium text-slate-900 mb-2">About</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {lenderProfile.company_description}
                  </p>
                </div>
              )}

              {/* Specializations */}
              {lenderProfile.specializations && lenderProfile.specializations.length > 0 && (
                <div className="bg-white p-4 rounded-lg border">
                  <h4 className="font-medium text-slate-900 mb-2">Specializations</h4>
                  <div className="flex flex-wrap gap-2">
                    {lenderProfile.specializations.map((spec, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {spec.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-600">No detailed profile information available for this lender.</p>
              <p className="text-sm text-slate-500 mt-1">
                Basic information about {offer?.lender_name || 'this lender'} is available in the offer details.
              </p>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsLenderProfileModalOpen(false)}
            >
              Close
            </Button>
            {!isLender && lenderProfile && (
              <Button 
                className="bg-[#212936] hover:bg-[#212936]/90"
                onClick={() => {
                  setIsLenderProfileModalOpen(false);
                  // Scroll to messaging section
                  const messagingElement = document.querySelector('[data-messaging="true"]');
                  if (messagingElement) {
                    messagingElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Contact Lender
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
};

export default OfferDetails;
