import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { getDocument, updateDocument, getDocuments, createDocument, deductCredits } from '@/firebase';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { toast } from 'sonner';
import PageLayout from '@/components/PageLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import StatusBadge from '@/components/StatusBadge';
import {
  ArrowLeft,
  PoundSterling,
  CalendarDays,
  Briefcase,
  ChevronRight,
  FileText,
  CheckCircle,
  AlertTriangle,
  Eye,
  Shield,
  BarChart4,
  PieChart,
  ArrowUpRight,
  Lightbulb,
  HandCoins,
  ThumbsUp,
  MessageSquare,
  Loader2,
  TrendingUp,
  Building2,
  Upload,
  Zap,
  Send
} from 'lucide-react';
import LowCreditsDialog from '@/components/LowCreditsDialog';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const ApplicationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hasViewedDetails, setHasViewedDetails] = useState(false);
  const [isDeductingCredits, setIsDeductingCredits] = useState(false);
  const [showLowCreditsDialog, setShowLowCreditsDialog] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [selectedLenderConversation, setSelectedLenderConversation] = useState(null);
  
  // Fetch application data
  const { data: application, isLoading } = useQuery({
    queryKey: ['applicationDetail', id],
    queryFn: async () => {
      if (!id) throw new Error('Application ID is required');
      
      // Get application details
      const { data, error } = await getDocument('applications', id);
      
      if (error) {
        toast.error('Failed to load application details');
        throw error;
      }
      
      // Check if the user is either the owner of the application or a lender with access
      const isOwner = data.user_id === user?.uid;
      const isMatchedLender = data.matched_lenders && Array.isArray(data.matched_lenders) && data.matched_lenders.includes(user?.uid);
      const hasExpressedInterest = data.interested_lenders && Array.isArray(data.interested_lenders) && 
                                  data.interested_lenders.some(l => l.lender_id === user?.uid);
      
      // Check for lender role - this allows lenders from MatchedApplications page to view details
      const isLender = user?.role === 'lender';
      // Allow access for owners, matched lenders, lenders who have expressed interest, or any lender viewing from correct route
      const hasPermission = isOwner || isMatchedLender || hasExpressedInterest || isLender;
      
      if (!hasPermission) {
        toast.error('You do not have permission to view this application');
        if (isOwner) {
          navigate('/applications');
        } else {
          navigate('/matched-applications');
        }
        throw new Error('Unauthorized');
      }
      
      // Check if this lender has already viewed this application (to determine if credits need to be spent)
      if (isLender && !isOwner) {
        const viewedByLenders = data.viewed_by_lenders || [];
        if (viewedByLenders.includes(user.uid)) {
          setHasViewedDetails(true);
        }
      }
      
      // Get business details - for application owners only
      let businessData = null;
      if (isOwner) {
        const businessResponse = await getDocument('business_profiles', user.uid);
        businessData = businessResponse.data;
      } else if (data.business_id) {
        // For lenders, get the business profile using business_id from the application
        const businessResponse = await getDocument('business_profiles', data.business_id);
        businessData = businessResponse.data;
      }
      
      // Include financial documents if they exist
      let financialDocs = [];
      try {
        if (isOwner && data.business_id) {
          const db = getFirestore();
          const docsQuery = query(
            collection(db, 'financial_documents'),
            where('business_id', '==', data.business_id)
          );
          const docsSnapshot = await getDocs(docsQuery);
          financialDocs = docsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
      } catch (err) {
        console.error('Error fetching financial documents:', err);
      }
      
      const appData = {
        ...data,
        business: businessData,
        financial_documents: financialDocs,
        isOwner,
        isLender: !isOwner
      };
      
      // Calculate application completeness
      calculateCompleteness(appData);
      
      return appData;
    },
    enabled: !!id && !!user?.uid,
  });
  
  // Check if user is a matched lender for this application
  const isMatchedLender = application?.matched_lenders?.includes(user?.uid) || false;
  
  // Fetch lender's available credits
  const { data: lenderData } = useQuery({
    queryKey: ['lenderBilling', user?.uid],
    queryFn: async () => {
      if (!user?.uid) throw new Error('User ID is required');
      
      const { data, error } = await getDocument('lender_billing', user.uid);
      
      if (error) {
        // Not an error if document doesn't exist yet - just provide default values
        return { 
          total_credits: 25, 
          used_credits: 10
        };
      }
      
      return data || { 
        total_credits: 25, 
        used_credits: 10
      };
    },
    enabled: !!user?.uid,
  });
  
  // Calculate available credits
  const availableCredits = lenderData 
    ? lenderData.total_credits - lenderData.used_credits 
    : 0;      // Calculate credit cost based on loan amount
  const getCreditCost = (loanAmount) => {
    if (!loanAmount) return 1;
    const amount = Number(loanAmount);
    // £100 = 1 credit, so divide by 100 and round up
    return Math.ceil(amount / 100);
  };
  
  // Calculate application completeness
  const calculateCompleteness = (app) => {
    if (!app) return { percentage: 0, completed: 0, total: 4, missing: [] };
    
    const checks = [
      { name: 'Business profile', value: app.business ? true : false },
      { name: 'Credit score', value: app.business?.credit_info?.credit_score ? true : false },
      { name: 'Financial documents', value: app.financial_documents && app.financial_documents.length > 0 },
      { name: 'Application details', value: app.loan_amount && app.loan_term_months && app.purpose ? true : false }
    ];
    
    const completed = checks.filter(check => check.value).length;
    const missing = checks.filter(check => !check.value).map(check => check.name);
    const percentage = Math.round((completed / checks.length) * 100);
    
    // Add completeness percentage to application object
    app.completeness_percentage = percentage;
    
    return {
      percentage,
      completed,
      total: checks.length,
      missing
    };
  };
  
  const handleViewFullDetails = async () => {
    if (!id || !user || !application) return;
    
    try {
      setIsDeductingCredits(true);
      const creditCost = getCreditCost(application.loan_amount);
      const availableCredits = lenderData 
        ? lenderData.total_credits - (lenderData.credits_used || 0) 
        : 0;

      if (availableCredits < creditCost) {
        setShowLowCreditsDialog(true);
        return;
      }
      
      // Deduct credits from lender's account
      await deductCredits(user.uid, creditCost);
      
      // Record that this lender has viewed this application
      const viewedByLenders = application.viewed_by_lenders || [];
      
      if (!viewedByLenders.includes(user.uid)) {
        const updatedViewers = [...viewedByLenders, user.uid];
        await updateDocument('applications', id, {
          viewed_by_lenders: updatedViewers
        });
      }
      
      setHasViewedDetails(true);
      toast.success(`${creditCost} credits used to view details`);
    } catch (error: any) {
      console.error('Error viewing application details:', error);
      if (error.message === 'Insufficient credits') {
        toast.error('You do not have enough credits to view this application. Please purchase more credits.');
        navigate('/lender/billing');
      } else {
        toast.error('Failed to unlock application details');
      }
    } finally {
      setIsDeductingCredits(false);
    }
  };

  // Respond to lender interest (accept or reject)
  const handleRespondToInterest = async (lender: any, response: 'accepted' | 'rejected') => {
    if (!id || !user || !application) return;
    
    try {
      // Find the interested lender in the array
      const interestedLenders = application.interested_lenders || [];
      const updatedLenders = interestedLenders.map(l => {
        if (l.lender_id === lender.lender_id) {
          return {
            ...l,
            status: response,
            responded_at: new Date()
          };
        }
        return l;
      });
      
      // Update the application with the new status
      await updateDocument('applications', id, {
        interested_lenders: updatedLenders
      });
      
      // Create a notification for the lender
      const notificationData = {
        user_id: lender.lender_id,
        type: response === 'accepted' ? 'interest_accepted' : 'interest_declined',
        title: response === 'accepted' ? 'Interest Accepted' : 'Interest Declined',
        message: response === 'accepted' 
          ? `Application #${application.application_number || id?.substring(0, 8)} has accepted your interest` 
          : `Application #${application.application_number || id?.substring(0, 8)} has declined your interest`,
        application_id: id,
        read: false,
        created_at: new Date()
      };
      
      await createDocument('notifications', notificationData);
      
      // If accepted, match the lender with the application
      if (response === 'accepted') {
        // Add this lender to matched_lenders array if not already there
        const matchedLenders = application.matched_lenders || [];
        if (!matchedLenders.includes(lender.lender_id)) {
          await updateDocument('applications', id, {
            matched_lenders: [...matchedLenders, lender.lender_id]
          });
        }
      }
      
      toast.success(
        response === 'accepted'
          ? 'You have accepted this lender\'s interest. They will be notified.'
          : 'You have declined this lender\'s interest. They will be notified.'
      );
      
      // Refresh the application data
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('Error responding to lender interest:', error);
      toast.error('Failed to respond to lender interest');
    }
  };

  // Fetch messages for selected conversation
  const { data: messages, isLoading: messagesLoading, refetch: refetchMessages } = useQuery({
    queryKey: ['messages', selectedLenderConversation?.id],
    queryFn: async () => {
      if (!selectedLenderConversation?.id) return [];
      
      const { data } = await getDocuments(
        'messages',
        [{ field: 'conversation_id', operator: '==', value: selectedLenderConversation.id }],
        [{ field: 'timestamp', direction: 'asc' }]
      );
      
      return data || [];
    },
    enabled: !!selectedLenderConversation?.id
  });

  // Function to select a lender for conversation
  const selectLenderConversation = (lenderId, lenderName, offerId) => {
    setSelectedLenderConversation({
      id: offerId || lenderId, // Use offer ID if available, otherwise use lender ID
      lenderId: lenderId,
      lenderName: lenderName
    });
  };

  // Function to send a message
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedLenderConversation) return;

    try {
      // Create the message
      const messageData = {
        conversation_id: selectedLenderConversation.id,
        offer_id: selectedLenderConversation.id, // If using offer ID as conversation ID
        application_id: id,
        sender_id: user.uid,
        sender_type: 'business',
        recipient_id: selectedLenderConversation.lenderId,
        message: newMessage.trim(),
        timestamp: new Date().toISOString(),
        read: false
      };

      const result = await createDocument('messages', messageData);
      if (result.error) throw result.error;

      // Create a notification for the lender
      await createDocument('notifications', {
        recipient_id: selectedLenderConversation.lenderId,
        type: 'new_message',
        title: 'New message',
        message: `New message from Application #${application.application_number || id?.substring(0, 8)}`,
        related_entity_id: selectedLenderConversation.id,
        related_entity_type: 'conversation',
        read: false,
        sent_at: new Date().toISOString()
      });

      setNewMessage('');
      refetchMessages();
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error('Failed to send message');
    }
  };

  // Function to get display name based on permissions
  const getBusinessDisplayName = (businessData, isOwner, isMatched) => {
    if (isOwner || isMatched) {
      return businessData?.business_name || 'Unnamed Business';
    }
    return `Application #${application.application_number || id?.substring(0, 8)}`;
  };

  return (
    <PageLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="w-full py-8 px-6">
          <Button
            variant="ghost"
            className="mb-6 hover:bg-white/60 text-slate-700 hover:text-slate-900 border border-slate-200/50 backdrop-blur-sm"
            onClick={() => {
              if (application?.isLender) {
                navigate('/matched-applications');
              } else {
                navigate('/applications');
              }
            }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {application?.isLender ? 'Back to Matched Applications' : 'Back to Applications'}
          </Button>
          
          <div className="w-full max-w-none">
            <div className="bg-[#212936] text-white rounded-xl p-8 mb-8 shadow-xl border-b-2 border-[#ff8000]">
              <h1 className="text-4xl font-bold mb-3 tracking-tight">
                {application?.isLender 
                  ? `Application #${application?.application_number || id?.substring(0, 8)}`
                  : 'Application Details'
                }
              </h1>
              <div className="flex items-center space-x-3 mb-3">
                {application && <StatusBadge status={application.status} />}
                <p className="text-gray-200 text-md">
                  Submitted {application?.application_date ? new Date(application.application_date).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <p className="text-gray-200 text-lg leading-relaxed">
                {application?.isLender 
                  ? 'Full business information and loan application details'
                  : 'Review your submitted application and track lender interactions'
                }
              </p>
            </div>
            
            {isLoading ? (
              <div className="h-64 animate-pulse bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/50 shadow-lg"></div>
            ) : application ? (
              <>
                {application.status === 'draft' && (
                  <Alert className="mb-6 bg-white/90 backdrop-blur-sm border border-amber-200 shadow-lg">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                    <AlertTitle className="text-amber-800 font-medium">Draft Application</AlertTitle>
                    <AlertDescription className="flex items-center justify-between text-amber-700">
                      <span>This application hasn't been submitted yet. Submit it to start receiving offers from lenders.</span>
                      <Button 
                        className="bg-[#212936] hover:bg-[#212936]/90 border-b-2 border-[#ff8000]"
                        onClick={() => navigate(`/applications/${id}/review`)}
                      >
                        Continue to Review
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Only show the credit cost and view details if user is lender and hasn't viewed yet */}
                {application?.isLender && !hasViewedDetails && !isMatchedLender && !application.viewed_by_lenders?.includes(user?.uid) ? (
                  <Card className="mb-6 bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardHeader className="bg-[#212936] text-white rounded-t-lg">
                      <CardTitle className="flex items-center">
                        <Eye className="mr-2 h-5 w-5 text-[#ff8000]" />
                        <span className="text-white">View Application Details</span>
                      </CardTitle>
                      <CardDescription className="text-gray-200">
                        Unlock full application details including financial information and business profile
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-lg font-medium text-[#212936]">Credit Cost</div>
                          <div className="text-sm text-slate-500">
                            {getCreditCost(application.loan_amount)} credits required to view
                          </div>
                        </div>
                        <Button 
                          onClick={handleViewFullDetails}
                          disabled={isDeductingCredits}
                          className="bg-[#212936] hover:bg-[#212936]/90 border-b-2 border-[#ff8000] text-white"
                        >
                          {isDeductingCredits ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            'View Details'
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : null}

                <Card className="mb-6 bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="bg-[#212936] text-white rounded-t-lg">
                    <CardTitle className="flex items-center">
                      <Briefcase className="mr-2 h-5 w-5 text-[#ff8000]" />
                      <span className="text-white">Application Overview</span>
                    </CardTitle>
                    <CardDescription className="text-gray-200">
                      Key details about your funding application
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-slate-50/70 rounded-lg p-3 border border-slate-100">
                        <p className="text-sm text-slate-500">Loan Amount</p>
                        <p className="font-semibold text-slate-900 text-lg flex items-center">
                          <PoundSterling className="h-4 w-4 text-[#ff8000] mr-1" />
                          £{application.loan_amount?.toLocaleString() || 'Not specified'}
                        </p>
                      </div>
                      <div className="bg-slate-50/70 rounded-lg p-3 border border-slate-100">
                        <p className="text-sm text-slate-500">Loan Term</p>
                        <p className="font-semibold text-slate-900 text-lg flex items-center">
                          <CalendarDays className="h-4 w-4 text-[#ff8000] mr-1" />
                          {application.loan_term_months || 'Not specified'} months
                        </p>
                      </div>
                      <div className="bg-slate-50/70 rounded-lg p-3 border border-slate-100">
                        <p className="text-sm text-slate-500">Type</p>
                        <p className="font-semibold text-slate-900 text-lg capitalize">
                          {application.loan_type?.replace('_', ' ') || 'Not specified'}
                        </p>
                      </div>
                    </div>
                    
                    <Separator className="bg-slate-200" />
                    
                    <div>
                      <div className="bg-slate-50/70 rounded-lg p-3 border border-slate-100 mb-4">
                        <p className="text-sm text-slate-500">Purpose</p>
                        <p className="font-semibold text-slate-900">
                          {application.purpose || 'Not specified'}
                        </p>
                        {application.purpose_details && (
                          <p className="text-sm mt-1 text-slate-600">
                            {application.purpose_details}
                          </p>
                        )}
                      </div>
                    </div>

                    <Separator className="bg-slate-200" />

                    <div>
                      <div className="text-lg font-medium mb-3 text-[#212936]">Additional Details</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-50/70 rounded-lg p-3 border border-slate-100">
                          <p className="text-sm text-slate-500">Security Offered</p>
                          <p className="font-medium text-slate-900">
                            {application.is_secured ? 'Yes' : 'No'}
                          </p>
                        </div>
                        <div className="bg-slate-50/70 rounded-lg p-3 border border-slate-100">
                          <p className="text-sm text-slate-500">Personal Guarantee</p>
                          <p className="font-medium text-slate-900">
                            {application.has_personal_guarantee ? 'Yes' : 'No'}
                          </p>
                        </div>
                        <div className="bg-slate-50/70 rounded-lg p-3 border border-slate-100">
                          <p className="text-sm text-slate-500">Application Date</p>
                          <p className="font-medium text-slate-900">
                            {application.application_date ? new Date(application.application_date).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                        <div className="bg-slate-50/70 rounded-lg p-3 border border-slate-100">
                          <p className="text-sm text-slate-500">Last Updated</p>
                          <p className="font-medium text-slate-900">
                            {application.status_updated_at ? new Date(application.status_updated_at).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* New grid layout for strength cards and business info */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                  {/* Application Strength Card */}
                  <Card className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardHeader className="bg-[#212936] text-white rounded-t-lg">
                      <CardTitle className="flex items-center">
                        <Shield className="mr-2 h-5 w-5 text-[#ff8000]" />
                        <span className="text-white">Application Strength</span>
                      </CardTitle>
                      <CardDescription className="text-gray-200">
                        Overall application strength assessment
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      {application ? (
                        <div className="flex flex-col items-center">
                          {/* Circular Progress Indicator */}
                          <div className="relative w-36 h-36 mb-4">
                            <svg className="w-full h-full" viewBox="0 0 100 100">
                              {/* Background circle */}
                              <circle
                                cx="50"
                                cy="50"
                                r="45"
                                fill="none"
                                stroke="#e5e7eb"
                                strokeWidth="8"
                              />
                              
                              {/* Progress circle */}
                              <circle
                                cx="50"
                                cy="50"
                                r="45"
                                fill="none"
                                stroke={
                                  !application.completeness_percentage ? "#f97316" :
                                  application.completeness_percentage < 50 ? "#f97316" : 
                                  application.completeness_percentage < 75 ? "#facc15" : 
                                  application.completeness_percentage < 100 ? "#22c55e" : 
                                  "#10b981"
                                } 
                                strokeWidth="8"
                                strokeLinecap="round"
                                strokeDasharray={`${2 * Math.PI * 45}`}
                                strokeDashoffset={`${2 * Math.PI * 45 * (1 - (application.completeness_percentage || 0) / 100)}`}
                                className="transition-all duration-1000 ease-out"
                              />
                            </svg>
                            
                            {/* Percentage in Middle */}
                            <div className="absolute inset-0 flex items-center justify-center flex-col">
                              <span className="text-4xl font-bold text-[#212936]">
                                {application.completeness_percentage || 0}%
                              </span>
                              <span className="text-sm font-medium text-gray-500">Strength</span>
                            </div>
                          </div>
                          
                          <div className="text-center w-full">
                            <div className="flex justify-center items-center mb-2">
                              <div className="h-2 w-2 mr-1.5 rounded-full bg-[#ff8000]"></div>
                              <span className="text-slate-700 text-sm font-medium">
                                Application Strength Indicators
                              </span>
                            </div>
                            
                            {/* Missing items */}
                            {(!application.business_profile || !application.credit_score || !application.has_documents) && (
                              <div className="mt-2 px-4">
                                {!application.business_profile && (
                                  <div className="bg-amber-50 border border-amber-200/70 rounded-lg p-2 mb-2 flex items-center">
                                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500 mr-2"></div>
                                    <p className="text-amber-800 text-xs font-medium">Business profile incomplete</p>
                                  </div>
                                )}
                                {!application.credit_score && (
                                  <div className="bg-amber-50 border border-amber-200/70 rounded-lg p-2 mb-2 flex items-center">
                                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500 mr-2"></div>
                                    <p className="text-amber-800 text-xs font-medium">Credit score missing</p>
                                  </div>
                                )}
                                {!application.has_documents && (
                                  <div className="bg-amber-50 border border-amber-200/70 rounded-lg p-2 mb-2 flex items-center">
                                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500 mr-2"></div>
                                    <p className="text-amber-800 text-xs font-medium">Financial documents missing</p>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* Complete application */}
                            {application.completeness_percentage === 100 && (
                              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-2 mx-4">
                                <p className="text-green-800 text-sm font-medium">
                                  ✓ Application complete
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-center items-center h-40">
                          <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Business Profile Card */}
                  <Card className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardHeader className="bg-[#212936] text-white rounded-t-lg">
                      <CardTitle className="flex items-center">
                        <Building2 className="mr-2 h-5 w-5 text-[#ff8000]" />
                        <span className="text-white">Business Profile</span>
                      </CardTitle>
                      <CardDescription className="text-gray-200">
                        Company details and registration information
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      {application?.business ? (
                        <div className="space-y-4">
                          <div className="bg-slate-50/70 rounded-lg p-4 border border-slate-100">
                            <h3 className="font-semibold text-[#212936]">{application.business.business_name || 'Unnamed Business'}</h3>
                            <p className="text-sm text-slate-600">
                              {application.business.registration_number && `Reg: ${application.business.registration_number}`}
                              {application.business.business_type && ` • ${application.business.business_type}`}
                            </p>
                            <div className="mt-3 flex items-center">
                              <Badge variant="outline" className="border-[#212936] text-[#212936]">
                                {application.business.years_trading || 0} years trading
                              </Badge>
                            </div>
                          </div>
                          
                          {application.business.business_address && (
                            <div className="text-sm text-slate-600">
                              <div className="font-medium text-slate-700">Business Address:</div>
                              <p>{application.business.business_address}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-6">
                          <div className="bg-gray-50/80 border border-gray-200/70 rounded-lg p-4 mb-4">
                            <p className="font-medium text-gray-600">No business profile available</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  {/* Credit Score Card */}
                  <Card className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardHeader className="bg-[#212936] text-white rounded-t-lg">
                      <CardTitle className="flex items-center">
                        <TrendingUp className="mr-2 h-5 w-5 text-[#ff8000]" />
                        <span className="text-white">Credit Assessment</span>
                      </CardTitle>
                      <CardDescription className="text-gray-200">
                        Business credit score and risk assessment
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      {application?.business?.credit_info?.credit_score ? (
                        <div className="text-center py-4">
                          <div className="bg-green-50/80 border border-green-200/70 rounded-lg p-4 mb-4">
                            <div className="text-4xl font-bold text-green-700 mb-2">
                              {application.business.credit_info.credit_score}
                            </div>
                            <p className="text-sm text-green-600">Business Credit Score</p>
                            {application.business.credit_info.risk && (
                              <p className="text-sm font-medium text-green-700 mt-1">{application.business.credit_info.risk}</p>
                            )}
                          </div>
                          <Badge variant="default" className="bg-green-600 text-white shadow-sm">Score Available</Badge>
                        </div>
                      ) : (
                        <div className="text-center py-6">
                          <div className="bg-orange-50/80 border border-orange-200/70 rounded-lg p-4 mb-4">
                            <p className="font-medium text-orange-800">Credit score not available</p>
                            <p className="text-sm text-orange-600 mt-1">Other factors will be used to evaluate this application</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Financial Documents Section */}
                <Card className="mb-6 bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="bg-[#212936] text-white rounded-t-lg">
                    <CardTitle className="flex items-center">
                      <FileText className="mr-2 h-5 w-5 text-[#ff8000]" />
                      <span className="text-white">Financial Documents</span>
                    </CardTitle>
                    <CardDescription className="text-gray-200">
                      Supporting financial information for your application
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {application?.financial_documents && application.financial_documents.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {application.financial_documents.map((doc, index) => (
                            <div key={index} className="bg-slate-50/70 rounded-lg p-4 border border-slate-200 flex items-start space-x-3">
                              <div className="bg-[#212936] rounded-md p-2">
                                <FileText className="h-6 w-6 text-white" />
                              </div>
                              <div>
                                <h3 className="font-medium text-[#212936]">{doc.document_type || 'Financial Document'}</h3>
                                <p className="text-xs text-slate-500">
                                  {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : 'Unknown date'}
                                </p>
                                <div className="mt-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="text-xs h-7 border-slate-300 text-slate-700 hover:bg-slate-100"
                                    onClick={() => window.open(doc.file_url, '_blank')}
                                  >
                                    <Eye className="mr-1 h-3 w-3" />
                                    View
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6">
                          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                            <p className="text-slate-700">No financial documents have been uploaded</p>
                            {!application.isLender && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-3 border-[#212936] text-[#212936] hover:bg-[#212936] hover:text-white"
                                onClick={() => navigate('/business/documents')}
                              >
                                <Upload className="mr-1 h-3 w-3" />
                                Upload Documents
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Document Status Summary */}
                      <div className="mt-4">
                        <div className="text-sm font-medium text-slate-700 mb-2">Document Status</div>
                        <div className="grid grid-cols-2 gap-2">
                          {['pl', 'bs', 'tb', 'ap', 'ar'].map((docType) => {
                            const docLabel = {
                              'pl': 'Profit & Loss',
                              'bs': 'Balance Sheet',
                              'tb': 'Trial Balance',
                              'ap': 'Aged Payables',
                              'ar': 'Aged Receivables'
                            }[docType];
                            
                            const hasDoc = application?.financial_documents?.some(doc => doc.document_type === docType);
                            
                            return (
                              <div key={docType} className={`rounded-md px-3 py-2 flex items-center ${hasDoc ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
                                {hasDoc ? (
                                  <CheckCircle className="h-3 w-3 text-green-600 mr-2" />
                                ) : (
                                  <AlertTriangle className="h-3 w-3 text-amber-500 mr-2" />
                                )}
                                <span className={`text-xs ${hasDoc ? 'text-green-800' : 'text-gray-600'}`}>
                                  {docLabel}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Offers Section */}
                {application.offers && application.offers.length > 0 ? (
                  <Card className="mb-6 bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardHeader className="bg-[#212936] text-white rounded-t-lg">
                      <CardTitle className="flex items-center">
                        <HandCoins className="mr-2 h-5 w-5 text-[#ff8000]" />
                        <span className="text-white">Funding Offers</span>
                      </CardTitle>
                      <CardDescription className="text-gray-200">
                        Lender offers for your application
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {application.offers.map((offer, index) => (
                          <div key={index} className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                            <div className={`p-4 ${offer.status === 'approved' ? 'bg-green-50 border-b border-green-200' : offer.status === 'rejected' ? 'bg-red-50 border-b border-red-200' : 'bg-blue-50 border-b border-blue-200'}`}>
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="text-lg font-semibold text-[#212936]">
                                    £{Number(offer.amount).toLocaleString()}
                                  </h3>
                                  <p className="text-sm text-slate-600">
                                    {offer.term} months • {offer.interest_rate}% interest
                                  </p>
                                </div>
                                <Badge 
                                  className={`
                                    ${offer.status === 'approved' ? 'bg-green-100 text-green-800 border-green-200' : 
                                     offer.status === 'rejected' ? 'bg-red-100 text-red-800 border-red-200' :
                                     'bg-blue-100 text-blue-800 border-blue-200'}
                                  `}
                                >
                                  {offer.status === 'approved' ? 'Accepted' :
                                   offer.status === 'rejected' ? 'Declined' :
                                   'Pending'}
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="p-4">
                              {offer.lender_name && (
                                <div className="mb-3">
                                  <span className="text-sm text-slate-500">From</span>
                                  <div className="font-medium text-slate-800">{offer.lender_name}</div>
                                </div>
                              )}
                              
                              {offer.note && (
                                <div className="mb-3">
                                  <span className="text-sm text-slate-500">Note</span>
                                  <p className="text-slate-800 text-sm">{offer.note}</p>
                                </div>
                              )}
                              
                              {offer.status === 'pending' && !application.isLender && (
                                <div className="flex space-x-2 mt-3">
                                  <Button 
                                    size="sm" 
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                    onClick={() => {/* Handle approve */}}
                                  >
                                    <ThumbsUp className="mr-1 h-3 w-3" /> Accept
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="border-red-300 text-red-600 hover:bg-red-50"
                                    onClick={() => {/* Handle reject */}}
                                  >
                                    Decline
                                  </Button>
                                </div>
                              )}
                              
                              {offer.id && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="mt-3 text-[#212936] hover:bg-slate-100 hover:text-[#212936]/80"
                                  onClick={() => selectLenderConversation(offer.lender_id, offer.lender_name, offer.id)}
                                >
                                  <MessageSquare className="mr-1 h-3 w-3" />
                                  <span className="text-xs">Message Lender</span>
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : null}

                {application.interested_lenders && application.interested_lenders.length > 0 && application.isOwner ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-xl flex items-center">
                        <ThumbsUp className="mr-2 h-5 w-5 text-fundhub-blue" />
                        Interested Lenders
                      </CardTitle>
                      <CardDescription>
                        These lenders have expressed interest in your application
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {application.interested_lenders.map((lender: any, index: number) => (
                          <div key={lender.lender_id || index} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="font-medium">{lender.lender_name || 'Lender'}</h3>
                                <div className="text-sm text-muted-foreground mt-1">
                                  {lender.lender_company || 'Financial Institution'}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  Interest expressed on {lender.expressed_at ? new Date(lender.expressed_at.seconds * 1000).toLocaleDateString() : 'recently'}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                {lender.status === 'pending' ? (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-red-600 border-red-600"
                                      onClick={() => handleRespondToInterest(lender, 'rejected')}
                                    >
                                      Decline
                                    </Button>
                                    <Button
                                      size="sm"
                                      className="bg-fundhub-blue hover:bg-fundhub-blue/90"
                                      onClick={() => handleRespondToInterest(lender, 'accepted')}
                                    >
                                      Accept
                                    </Button>
                                  </>
                                ) : (
                                  <Badge variant={lender.status === 'accepted' ? 'default' : 'destructive'}>
                                    {lender.status === 'accepted' ? 'Accepted' : 'Declined'}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="text-sm mt-2">
                              <p>By accepting, you'll connect with this lender to discuss potential financing options.</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : application.status === 'submitted' ? (
                  <Card>
                    <CardContent className="py-12">
                      <div className="text-center">
                        <BarChart4 className="h-12 w-12 mx-auto text-fundhub-blue mb-4" />
                        <h3 className="text-lg font-medium mb-2">
                          Application Under Review
                        </h3>
                        <p className="text-muted-foreground max-w-md mx-auto">
                          Your application is being reviewed by matching lenders. 
                          You'll be notified when you receive offers.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ) : null}

                {/* Communication Section */}
                <Card className="mb-6 bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="bg-[#212936] text-white rounded-t-lg">
                    <CardTitle className="flex items-center">
                      <MessageSquare className="mr-2 h-5 w-5 text-[#ff8000]" />
                      <span className="text-white">Communication</span>
                    </CardTitle>
                    <CardDescription className="text-gray-200">
                      Messages between you and lenders
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    {application.matched_lenders && application.matched_lenders.length > 0 ? (
                      <div className="flex flex-col md:flex-row h-[400px] border border-slate-200 rounded-lg overflow-hidden">
                        {/* Lender List */}
                        <div className="w-full md:w-1/3 border-r border-slate-200 bg-slate-50">
                          <div className="p-3 border-b border-slate-200 bg-slate-100">
                            <h3 className="font-medium text-slate-700">Lenders</h3>
                          </div>
                          <div className="overflow-y-auto h-[calc(400px-40px)]">
                            {application.matched_lenders.map((lenderId, index) => {
                              // Find offer from this lender if exists
                              const offer = application.offers?.find(o => o.lender_id === lenderId);
                              const lenderName = offer?.lender_name || `Lender ${index + 1}`;
                              const conversationId = offer?.id || lenderId;
                              
                              return (
                                <div
                                  key={lenderId}
                                  className={`p-3 border-b border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors ${
                                    selectedLenderConversation?.id === conversationId ? 'bg-slate-100' : ''
                                  }`}
                                  onClick={() => selectLenderConversation(lenderId, lenderName, offer?.id)}
                                >
                                  <div className="flex items-center">
                                    <Avatar className="h-8 w-8 mr-2">
                                      <AvatarFallback className="bg-[#212936] text-white text-xs">
                                        {lenderName.slice(0, 2).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="font-medium text-slate-800 text-sm">{lenderName}</p>
                                      {offer && (
                                        <p className="text-xs text-slate-500">
                                          £{Number(offer.amount).toLocaleString()} • {offer.term} months
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        
                        {/* Chat Area */}
                        <div className="w-full md:w-2/3 flex flex-col">
                          {selectedLenderConversation ? (
                            <>
                              <div className="p-3 border-b border-slate-200 bg-slate-100">
                                <h3 className="font-medium text-slate-700">
                                  Chat with {selectedLenderConversation.lenderName}
                                </h3>
                              </div>
                              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {messages?.length > 0 ? (
                                  messages.map((msg, index) => (
                                    <div
                                      key={index}
                                      className={`flex ${msg.sender_id === user?.uid ? 'justify-end' : 'justify-start'}`}
                                    >
                                      <div
                                        className={`max-w-[80%] rounded-lg p-3 ${
                                          msg.sender_id === user?.uid
                                            ? 'bg-[#212936] text-white'
                                            : 'bg-slate-100 text-slate-800'
                                        }`}
                                      >
                                        <p className="text-sm">{msg.message}</p>
                                        <p className="text-xs mt-1 opacity-70">
                                          {new Date(msg.timestamp).toLocaleTimeString([], {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                          })}
                                        </p>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <div className="flex items-center justify-center h-full">
                                    <p className="text-slate-500 text-center">
                                      No messages yet. Send a message to start the conversation.
                                    </p>
                                  </div>
                                )}
                              </div>
                              <div className="p-3 border-t border-slate-200">
                                <form onSubmit={sendMessage} className="flex">
                                  <Textarea
                                    className="flex-1 resize-none min-h-[40px] max-h-20 rounded-r-none"
                                    placeholder="Type a message..."
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                  />
                                  <Button
                                    className="rounded-l-none h-auto bg-[#212936] hover:bg-[#212936]/90"
                                    disabled={!newMessage.trim()}
                                    type="submit"
                                  >
                                    <Send className="h-4 w-4" />
                                  </Button>
                                </form>
                              </div>
                            </>
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <div className="text-center">
                                <MessageSquare className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-500">Select a lender to start chatting</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center p-6">
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4">
                          <p className="font-medium text-slate-700">No lenders matched yet</p>
                          {application.status === 'submitted' && (
                            <p className="text-sm text-slate-500 mt-1">
                              Your application is being reviewed. Lenders will be matched soon.
                            </p>
                          )}
                          {application.status === 'draft' && (
                            <p className="text-sm text-slate-500 mt-1">
                              Submit your application to get matched with lenders.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Low Credits Dialog */}
                {showLowCreditsDialog && (
                  <LowCreditsDialog 
                    open={showLowCreditsDialog}
                    onOpenChange={setShowLowCreditsDialog}
                    availableCredits={availableCredits}
                    requiredCredits={getCreditCost(application.loan_amount)}
                  />
                )}
              </>
            ) : (
              <Alert variant="destructive" className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Application Not Found</AlertTitle>
                <AlertDescription>
                  {errorMessage || "This application doesn't exist or you don't have permission to view it."}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default ApplicationDetail;
