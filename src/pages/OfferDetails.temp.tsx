import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getDocument, updateDocument, createDocument } from '@/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import PageLayout from '@/components/PageLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
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
        applications: applicationData,
        business: businessData
      };
    },
    enabled: !!id && !!user,
  });

  // Accept offer
  const handleAcceptOffer = async () => {
    try {
      if (!id || !offer || !offer.application_id) {
        toast.error('Missing required information');
        return;
      }
      
      // Update offer status
      const { error: offerError } = await updateDocument('offers', id, { 
        status: 'accepted',
        updated_at: new Date().toISOString()
      });
      
      if (offerError) throw offerError;
      
      // Update application status
      const { error: applicationError } = await updateDocument(
        'applications', 
        offer.application_id,
        { 
          status: 'approved',
          status_updated_at: new Date().toISOString() 
        }
      );
      
      if (applicationError) throw applicationError;
      
      // Create notification for the lender
      await createDocument('notifications', {
        recipient_id: offer.lender_id,
        type: 'offer_accepted',
        title: 'Offer Accepted',
        message: `Your offer for ${formatCurrency(offer.offered_amount)} has been accepted by the business.`,
        related_entity_id: id,
        related_entity_type: 'offer',
        application_id: offer.application_id,
        read: false,
        sent_at: new Date().toISOString()
      });
      
      // Create a conversation entry if it doesn't already exist
      // We'll use the offer ID as the conversation ID for simplicity
      await createDocument('conversations', {
        id: id, // Same as offer ID
        business_id: user.uid,
        lender_id: offer.lender_id,
        application_id: offer.application_id,
        offer_id: id,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      toast.success('Offer accepted successfully! The lender has been notified.');
      
      // Refresh the page after successful acceptance
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (err) {
      console.error('Error accepting offer:', err);
      toast.error('Failed to accept offer');
    }
  };

  // Decline offer
  const handleDeclineOffer = async () => {
    try {
      if (!id || !offer) {
        toast.error('Missing offer ID');
        return;
      }
      
      // Update offer status
      const { error } = await updateDocument('offers', id, { 
        status: 'declined',
        decline_reason: declineReason || 'No reason provided',
        updated_at: new Date().toISOString()
      });
      
      if (error) throw error;
      
      // Create notification for the lender
      await createDocument('notifications', {
        recipient_id: offer.lender_id,
        type: 'offer_declined',
        title: 'Offer Declined',
        message: `Your offer for ${formatCurrency(offer.offered_amount)} has been declined by the business.`,
        related_entity_id: id,
        related_entity_type: 'offer',
        application_id: offer.application_id,
        decline_reason: declineReason || 'No reason provided',
        read: false,
        sent_at: new Date().toISOString()
      });
      
      setIsDeclineDialogOpen(false);
      toast.success('Offer declined. The lender has been notified.');
      
      // Refresh the page after successful decline
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (err) {
      console.error('Error declining offer:', err);
      toast.error('Failed to decline offer');
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
          
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold mb-1">
                  {isLender ? `Offer to ${businessName}` : `Offer from ${offer.lender_name}`}
                </h1>
                <p className="text-slate-800">
                  {isLender 
                    ? `Application #${offer.application_id?.substring(0, 8)}`
                    : `For loan application #${offer.application_id?.substring(0, 8)}`
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
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main content - 2/3 width on desktop */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg">
                  <CardHeader className="bg-[#212936] text-white rounded-t-lg">
                    <CardTitle>Loan Details</CardTitle>
                    <CardDescription className="text-gray-200">Terms and conditions for this funding offer</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-slate-700">Loan Amount</p>
                        <p className="font-semibold text-xl flex items-center">
                          <PoundSterling className="h-4 w-4 text-slate-600 mr-1" />
                          {formatCurrency(loanAmount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-700">Interest Rate</p>
                        <p className="font-semibold text-xl">{interestRate}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-700">Term</p>
                        <p className="font-semibold text-xl flex items-center">
                          <CalendarDays className="h-4 w-4 text-slate-600 mr-1" />
                          {termMonths} months
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-700">Monthly Payment</p>
                        <p className="font-semibold text-lg">{formatCurrency(monthlyPayment)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-700">APR</p>
                        <p className="font-semibold text-lg">{offer.apr || (interestRate * 1.2).toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-700">Repayment Frequency</p>
                        <p className="font-semibold text-lg">{formatRepaymentFrequency(offer.repayment_frequency)}</p>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="font-semibold mb-2">Fees & Additional Costs</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Arrangement Fee ({arrangementFeePercent}%)</span>
                          <span className="font-medium">{formatCurrency(arrangementFeeAmount)}</span>
                        </div>
                        
                        {earlyRepaymentFee > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Early Repayment Fee</span>
                            <span className="font-medium">{earlyRepaymentFee}% of outstanding balance</span>
                          </div>
                        )}
                        
                        {/* Display any additional fees if present */}
                        {offer.fees && Object.entries(offer.fees)
                          .filter(([key]) => key !== 'arrangement_fee' && key !== 'early_repayment_fee')
                          .map(([feeName, feeAmount]) => (
                            <div key={feeName} className="flex justify-between">
                              <span className="text-sm capitalize">{feeName.replace('_', ' ')}</span>
                              <span className="font-medium">
                                {typeof feeAmount === 'number' 
                                  ? formatCurrency(feeAmount) 
                                  : String(feeAmount)}
                              </span>
                            </div>
                        ))}
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="font-semibold mb-2">Conditions</h3>
                      <div className="space-y-2">
                        {offer.conditions && offer.conditions.length > 0 ? (
                          <ul className="list-disc pl-5 space-y-1">
                            {offer.conditions.map((condition, index) => (
                              <li key={index} className="text-sm">{condition}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-slate-600">Standard terms and conditions apply</p>
                        )}
                      </div>
                    </div>
                    
                    {offer.business_notes && (
                      <>
                        <Separator />
                        <div>
                          <h3 className="font-semibold mb-2">Notes from Lender</h3>
                          <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
                            <p className="text-sm text-slate-800">{offer.business_notes}</p>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
                
                <Card className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg">
                  <CardHeader className="bg-[#212936] text-white rounded-t-lg">
                    <CardTitle>Cost Breakdown</CardTitle>
                    <CardDescription className="text-gray-200">Detailed view of total loan costs</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-blue-100/80 border border-blue-200 p-4 rounded-lg shadow-sm mb-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <div className="text-sm text-slate-700">Monthly Payment</div>
                          <div className="text-xl font-bold">
                            {formatCurrency(monthlyPayment)}
                          </div>
                          <div className="text-xs text-slate-600 mt-1">
                            Base payment excluding fees
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-slate-700">Total Repayment</div>
                          <div className="text-xl font-bold">
                            {formatCurrency(totalPayment)}
                          </div>
                          <div className="text-xs text-slate-600 mt-1">
                            Principal + Interest
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-slate-700">Arrangement Fee</div>
                          <div className="text-xl font-bold">
                            {formatCurrency(arrangementFeeAmount)}
                          </div>
                          <div className="text-xs text-slate-600 mt-1">
                            {arrangementFeePercent}% of principal
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">Principal Amount</p>
                          <p className="text-sm text-slate-600">Amount borrowed</p>
                        </div>
                        <p className="font-semibold">{formatCurrency(loanAmount)}</p>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">Total Interest</p>
                          <p className="text-sm text-slate-600">Over {termMonths} months at {interestRate}%</p>
                        </div>
                        <p className="font-semibold text-orange-600">{formatCurrency(totalInterest)}</p>
                      </div>
                      
                      <Separator />
                      
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">Total Cost</p>
                          <p className="text-sm text-slate-600">All payments over loan term</p>
                        </div>
                        <p className="font-bold text-lg">{formatCurrency(totalPayment)}</p>
                      </div>
                      
                      <Alert className="bg-blue-50 border-blue-200 text-blue-900">
                        <InfoIcon className="h-4 w-4 text-blue-700" />
                        <AlertTitle className="font-medium">Loan Summary</AlertTitle>
                        <AlertDescription className="text-blue-900">
                          This offer provides {formatCurrency(loanAmount)} over {termMonths} months with monthly payments of {formatCurrency(monthlyPayment)}.
                          {offer.apr && ` The APR is ${offer.apr}%.`}
                        </AlertDescription>
                      </Alert>
                    </div>
                  </CardContent>
                </Card>

                {isLender && offer.applications && (
                  <Card className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg">
                    <CardHeader className="bg-[#212936] text-white rounded-t-lg">
                      <CardTitle>Application Details</CardTitle>
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
              
              {/* Sidebar - 1/3 width on desktop */}
              <div className="space-y-6">
                {/* Action card - Different for lender vs business */}
                <Card className={`bg-white/90 backdrop-blur-sm border shadow-lg ${
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
                    'bg-[#212936] text-white'
                  } rounded-t-lg`}>
                    <CardTitle className={`${
                      isExpired || isAccepted || isDeclined || isWithdrawn ? 'text-slate-800' : ''
                    }`}>
                      {isExpired ? 'Offer Expired' :
                       isAccepted ? 'Offer Accepted' :
                       isDeclined ? 'Offer Declined' :
                       isWithdrawn ? 'Offer Withdrawn' :
                       isLender ? 'Offer Status' : 'Take Action'}
                    </CardTitle>
                    <CardDescription className={`${
                      isExpired || isAccepted || isDeclined || isWithdrawn ? 'text-slate-600' : 'text-gray-200'
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
                      <div className="space-y-4">
                        <Alert>
                          <InfoIcon className="h-4 w-4" />
                          <AlertDescription>
                            The business hasn't responded to this offer yet. It expires on {new Date(offer.expiry_date || offer.expires_at).toLocaleDateString()}.
                          </AlertDescription>
                        </Alert>
                        
                        <div className="flex flex-col gap-2">
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

                          {offer.business && (
                            <Button 
                              className="w-full bg-[#212936] hover:bg-[#212936]/90"
                              onClick={() => {
                                // Navigate to messages tab with this business pre-selected
                                navigate('/lender/dashboard');
                                // This would require additional state management to pre-select the conversation
                                // For now, just show a toast with instructions
                                toast.info('Go to the Messages tab to contact the business');
                              }}
                            >
                              <MessageSquare className="mr-2 h-4 w-4" />
                              Message Business
                            </Button>
                          )}
                        </div>
                      </div>
                    ) : !isLender ? (
                      <div className="space-y-4">
                        <Alert>
                          <CalendarDays className="h-4 w-4" />
                          <AlertDescription>
                            Offer valid until {new Date(offer.expiry_date || offer.expires_at).toLocaleDateString()}
                          </AlertDescription>
                        </Alert>
                        
                        <div className="flex flex-col gap-2">
                          <Button 
                            className="w-full bg-[#ff8000] hover:bg-[#ff8000]/90 text-white shadow-lg hover:scale-105 transition-transform"
                            onClick={handleAcceptOffer}
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
                                  onClick={handleDeclineOffer}
                                >
                                  Confirm Decline
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          
                          <Button variant="link" className="w-full">
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Contact Lender
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
                
                {/* Business info card for lenders / Lender info card for businesses */}
                <Card className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg">
                  <CardHeader className="bg-[#212936] text-white rounded-t-lg">
                    <CardTitle>{isLender ? businessName : offer.lender_name}</CardTitle>
                    <CardDescription className="text-gray-200">About the {isLender ? 'business' : 'lender'}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                      {isLender ? (
                        <>
                          <Building2 className="text-blue-500" />
                          <span className="text-sm">Business Profile</span>
                        </>
                      ) : (
                        <>
                          <BadgeCheck className="text-blue-500" />
                          <span className="text-sm">Verified Lender</span>
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
                        <p>Experienced lender specializing in business financing solutions.</p>
                        {offer.company_name && (
                          <div className="mt-2">
                            <p className="font-medium">{offer.company_name}</p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {!isLender && (
                      <Button variant="outline" className="w-full">
                        <Building2 className="mr-2 h-4 w-4" />
                        View Lender Profile
                      </Button>
                    )}
                  </CardContent>
                </Card>
                
                {/* Documents & Actions */}
                <Card className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg">
                  <CardHeader className="bg-[#212936] text-white rounded-t-lg">
                    <CardTitle>Documents & {isLender ? 'Analytics' : 'Support'}</CardTitle>
                    <CardDescription className="text-gray-200">Manage documentation and support</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default OfferDetails;
