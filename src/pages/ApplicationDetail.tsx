/**
 * @deprecated This file is maintained for backward compatibility.
 * Please import from '@/pages/Applications/ApplicationDetail' instead.
 */
// import ApplicationDetail from '@/pages/Applications/ApplicationDetail';

// export default ApplicationDetail;
// import { 
//   Alert,
//   AlertTitle,
//   AlertDescription 
// } from "@/components/ui/alert";
// import { 
//   Card,
//   CardHeader,
//   CardTitle,
//   CardDescription,
//   CardContent
// } from "@/components/ui/card";
// import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
// import { Badge } from '@/components/ui/badge';
// import StatusBadge from '@/components/StatusBadge';
// import {
//   ArrowLeft,
//   PoundSterling,
//   CalendarDays,
//   Briefcase,
//   ChevronRight,
//   FileText,
//   CheckCircle,
//   AlertTriangle,
//   Eye,
//   Shield,
//   BarChart4,
//   PieChart,
//   ArrowUpRight,
//   Lightbulb,
//   HandCoins,
//   ThumbsUp,
//   MessageSquare,
//   Loader2,
//   TrendingUp,
//   Building2,
//   Upload,
//   Zap,
//   Send
// } from 'lucide-react';
// import LowCreditsDialog from '@/components/LowCreditsDialog';
// import { Textarea } from '@/components/ui/textarea';
// import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
// import { FinancialsTable } from './Business/Documents/FinancialsTable';

// const DOCUMENT_STEPS = [
//   { key: 'pl', label: 'Profit & Loss' },
//   { key: 'bs', label: 'Balance Sheet' },
//   { key: 'tb', label: 'Trial Balance' },
//   { key: 'ap', label: 'Aged Payables' },
//   { key: 'ar', label: 'Aged Receivables' }
// ] as const;

// interface FinancialDocument {
//   id: string;
//   documentType: string;
//   documentName: string;
//   data: Record<string, any>;
//   summary?: string;
//   fileUrl?: string;
//   extractedAt: string;
//   createdAt: string;
//   updatedAt: string;
//   createdBy: string;
//   documentFormat: string;
// }

// const ApplicationDetail = () => {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const { user } = useAuth();
//   const [hasViewedDetails, setHasViewedDetails] = useState(false);
//   const [isDeductingCredits, setIsDeductingCredits] = useState(false);
//   const [showLowCreditsDialog, setShowLowCreditsDialog] = useState(false);
//   const [newMessage, setNewMessage] = useState('');
//   const [selectedLenderConversation, setSelectedLenderConversation] = useState(null);
  
//   // Fetch application data
//   const { data: application, isLoading } = useQuery({
//     queryKey: ['applicationDetail', id],
//     queryFn: async () => {
//       if (!id) throw new Error('Application ID is required');
//       // Get application details
//       const { data, error } = await getDocument('applications', id);
//       if (error) {
//         toast.error('Failed to load application details');
//         throw error;
//       }
//       // Check if the user is either the owner of the application or a lender with access
//       const isOwner = data.user_id === user?.uid;
//       const isMatchedLender = data.matched_lenders && Array.isArray(data.matched_lenders) && data.matched_lenders.includes(user?.uid);
//       const hasExpressedInterest = data.interested_lenders && Array.isArray(data.interested_lenders) && 
//                                   data.interested_lenders.some(l => l.lender_id === user?.uid);
//       // Check for lender role - this allows lenders from MatchedApplications page to view details
//       const isLender = user?.role === 'lender';
//       // Allow access for owners, matched lenders, lenders who have expressed interest, or any lender viewing from correct route
//       const hasPermission = isOwner || isMatchedLender || hasExpressedInterest || isLender;
//       if (!hasPermission) {
//         toast.error('You do not have permission to view this application');
//         if (isOwner) {
//           navigate('/applications');
//         } else {
//           navigate('/matched-applications');
//         }
//         throw new Error('Unauthorized');
//       }
//       // Check if this lender has already viewed this application (to determine if credits need to be spent)
//       if (isLender && !isOwner) {
//         const viewedByLenders = data.viewed_by_lenders || [];
//         if (viewedByLenders.includes(user.uid)) {
//           setHasViewedDetails(true);
//         }
//       }
//       // Get business details - for application owners only
//       let businessData = null;
//       let creditInfo = null;
//       if (isOwner) {
//         const businessResponse = await getDocument('businesses', user.uid);
//         businessData = businessResponse.data;
//       } else if (data.business_id) {
//         // For lenders, get the business profile using business_id from the application
//         const businessResponse = await getDocument('businesses', data.business_id);
//         businessData = businessResponse.data;
//       }
//       // Fetch latest credit score from subcollection if businessData exists
//       if (businessData) {
//         try {
//           const creditScoreResp = await getDocument(`businesses/${businessData.id || (isOwner ? user.uid : data.business_id)}/credit_score`, 'latest');
//           if (creditScoreResp && creditScoreResp.data) {
//             creditInfo = creditScoreResp.data;
//             businessData.credit_info = creditInfo.details || creditInfo; // Use .details if present
//           }
//         } catch (err) {
//           console.error('Error fetching credit score:', err);
//         }
//         try {
//           // Fetch financial documents from business-financials collection
//           const db = getFirestore();
//           const financialsQuery = query(
//             collection(db, 'businesses', businessData.id, 'financials')
//           );
//           const financialsSnapshot = await getDocs(financialsQuery);
//           const financialDocs = financialsSnapshot.docs.map(doc => ({
//             id: doc.id,
//             ...doc.data()
//           })) as FinancialDocument[];

//           // Group documents by type
//           let financialDocuments = {};
//           let financialSummaries = {};

//           financialDocs.forEach(doc => {
//             const key = doc.documentType?.toLowerCase()?.includes('profit') ? 'pl'
//               : doc.documentType?.toLowerCase()?.includes('balance') && !doc.documentType?.toLowerCase()?.includes('trial') ? 'bs'
//               : doc.documentType?.toLowerCase()?.includes('trial') ? 'tb'
//               : doc.documentType?.toLowerCase()?.includes('payable') ? 'ap'
//               : doc.documentType?.toLowerCase()?.includes('receivable') ? 'ar'
//               : null;

//             if (key) {
//               // Process the data with extra handling for Trial Balance and Balance Sheet
//               let processedData = doc.data || {};
              
//               // Sometimes the data is a string that needs to be parsed
//               if (typeof processedData === 'string') {
//                 try {
//                   processedData = JSON.parse(processedData);
//                 } catch (e) {
//                   console.error(`Failed to parse ${key} data as JSON:`, e);
//                 }
//               }
              
//               // Special handling for Trial Balance
//               if (key === 'tb' && (!processedData || Object.keys(processedData).length === 0)) {
//                 // Try to extract data from the summary if the data field is empty
//                 try {
//                   if (doc.summary && typeof doc.summary === 'string') {
//                     const summaryJson = JSON.parse(doc.summary);
//                     if (summaryJson.json && Object.keys(summaryJson.json).length > 0) {
//                       processedData = summaryJson.json;
//                     }
//                   }
//                 } catch (e) {
//                   console.error('Failed to extract Trial Balance data from summary:', e);
//                 }
//               }
              
//               financialDocuments[key] = processedData;
//               financialSummaries[key] = doc.summary || '';
//             }
//           });

//           const appData = {
//             ...data,
//             business: businessData,
//             financial_documents: businessData?.financial_documents || [],
//             financialDocuments,
//             financialSummaries,
//             isOwner,
//             isLender: !isOwner
//           };
//           // Calculate application completeness
//           calculateCompleteness(appData);
//           return appData;
//         } catch (err) {
//           console.error('Error fetching financial documents:', err);
//         }
//       }
//       const appData = {
//         ...data,
//         business: businessData,
//         financial_documents: businessData?.financial_documents || [],
//         isOwner,
//         isLender: !isOwner
//       };
//       // Calculate application completeness
//       calculateCompleteness(appData);
//       return appData;
//     },
//     enabled: !!id && !!user?.uid,
//   });
  
//   // Check if user is a matched lender for this application
//   const isMatchedLender = application?.matched_lenders?.includes(user?.uid) || false;
  
//   // Fetch lender's available credits
//   const { data: lenderData } = useQuery({
//     queryKey: ['lenderBilling', user?.uid],
//     queryFn: async () => {
//       if (!user?.uid) throw new Error('User ID is required');
      
//       const { data, error } = await getDocument('lender_billing', user.uid);
      
//       if (error) {
//         // Not an error if document doesn't exist yet - just provide default values
//         return { 
//           total_credits: 25, 
//           used_credits: 10
//         };
//       }
      
//       return data || { 
//         total_credits: 25, 
//         used_credits: 10
//       };
//     },
//     enabled: !!user?.uid,
//   });
  
//   // Calculate available credits
//   const availableCredits = lenderData 
//     ? lenderData.total_credits - lenderData.used_credits 
//     : 0;      // Calculate credit cost based on loan amount
//   const getCreditCost = (loanAmount) => {
//     if (!loanAmount) return 1;
//     const amount = Number(loanAmount);
//     // £100 = 1 credit, so divide by 100 and round up
//     return Math.ceil(amount / 100);
//   };
  
//   // Calculate application completeness
//   const calculateCompleteness = (app) => {
//     if (!app) return { percentage: 0, completed: 0, total: 4, missing: [] };
    
//     // Check if financial documents are available in either format
//     const hasFinancialDocs = 
//       // Check in the traditional format
//       (app.financial_documents && app.financial_documents.length > 0) ||
//       // Check in the financialDocuments object format
//       (app.financialDocuments && Object.keys(app.financialDocuments).some(key => 
//         app.financialDocuments[key] && Object.keys(app.financialDocuments[key]).length > 0));
    
//     const checks = [
//       { name: 'Business profile', value: app.business ? true : false },
//       { name: 'Credit score', value: app.business?.credit_info?.credit_score ? true : false },
//       { name: 'Financial documents', value: hasFinancialDocs },
//       { name: 'Application details', value: app.loan_amount && app.loan_term_months && app.purpose ? true : false }
//     ];
    
//     const completed = checks.filter(check => check.value).length;
//     const missing = checks.filter(check => !check.value).map(check => check.name);
//     const percentage = Math.round((completed / checks.length) * 100);
    
//     // Add completeness percentage to application object
//     app.completeness_percentage = percentage;
    
//     return {
//       percentage,
//       completed,
//       total: checks.length,
//       missing
//     };
//   };
  
//   const handleViewFullDetails = async () => {
//     if (!id || !user || !application) return;
    
//     try {
//       setIsDeductingCredits(true);
//       const creditCost = getCreditCost(application.loan_amount);
//       const availableCredits = lenderData 
//         ? lenderData.total_credits - (lenderData.credits_used || 0) 
//         : 0;

//       if (availableCredits < creditCost) {
//         setShowLowCreditsDialog(true);
//         return;
//       }
      
//       // Deduct credits from lender's account
//       await deductCredits(user.uid, creditCost);
      
//       // Record that this lender has viewed this application
//       const viewedByLenders = application.viewed_by_lenders || [];
      
//       if (!viewedByLenders.includes(user.uid)) {
//         const updatedViewers = [...viewedByLenders, user.uid];
//         await updateDocument('applications', id, {
//           viewed_by_lenders: updatedViewers
//         });
//       }
      
//       setHasViewedDetails(true);
//       toast.success(`${creditCost} credits used to view details`);
//     } catch (error: any) {
//       console.error('Error viewing application details:', error);
//       if (error.message === 'Insufficient credits') {
//         toast.error('You do not have enough credits to view this application. Please purchase more credits.');
//         navigate('/lender/billing');
//       } else {
//         toast.error('Failed to unlock application details');
//       }
//     } finally {
//       setIsDeductingCredits(false);
//     }
//   };

//   // Respond to lender interest (accept or reject)
//   const handleRespondToInterest = async (lender: any, response: 'accepted' | 'rejected') => {
//     if (!id || !user || !application) return;
    
//     try {
//       // Find the interested lender in the array
//       const interestedLenders = application.interested_lenders || [];
//       const updatedLenders = interestedLenders.map(l => {
//         if (l.lender_id === lender.lender_id) {
//           return {
//             ...l,
//             status: response,
//             responded_at: new Date()
//           };
//         }
//         return l;
//       });
      
//       // Update the application with the new status
//       await updateDocument('applications', id, {
//         interested_lenders: updatedLenders
//       });
      
//       // Create a notification for the lender
//       const notificationData = {
//         user_id: lender.lender_id,
//         type: response === 'accepted' ? 'interest_accepted' : 'interest_declined',
//         title: response === 'accepted' ? 'Interest Accepted' : 'Interest Declined',
//         message: response === 'accepted' 
//           ? `Application #${application.application_number || id?.substring(0, 8)} has accepted your interest` 
//           : `Application #${application.application_number || id?.substring(0, 8)} has declined your interest`,
//         application_id: id,
//         read: false,
//         created_at: new Date()
//       };
      
//       await createDocument('notifications', notificationData);
      
//       // If accepted, match the lender with the application
//       if (response === 'accepted') {
//         // Add this lender to matched_lenders array if not already there
//         const matchedLenders = application.matched_lenders || [];
//         if (!matchedLenders.includes(lender.lender_id)) {
//           await updateDocument('applications', id, {
//             matched_lenders: [...matchedLenders, lender.lender_id]
//           });
//         }
//       }
      
//       toast.success(
//         response === 'accepted'
//           ? 'You have accepted this lender\'s interest. They will be notified.'
//           : 'You have declined this lender\'s interest. They will be notified.'
//       );
      
//       // Refresh the application data
//       setTimeout(() => {
//         window.location.reload();
//       }, 1000);
      
//     } catch (error) {
//       console.error('Error responding to lender interest:', error);
//       toast.error('Failed to respond to lender interest');
//     }
//   };

//   // Fetch messages for selected conversation
//   const { data: messages, isLoading: messagesLoading, refetch: refetchMessages } = useQuery({
//     queryKey: ['messages', selectedLenderConversation?.id],
//     queryFn: async () => {
//       if (!selectedLenderConversation?.id) return [];
      
//       const { data } = await getDocuments(
//         'messages',
//         [{ field: 'conversation_id', operator: '==', value: selectedLenderConversation.id }],
//         [{ field: 'timestamp', direction: 'asc' }]
//       );
      
//       return data || [];
//     },
//     enabled: !!selectedLenderConversation?.id
//   });

//   // Function to select a lender for conversation
//   const selectLenderConversation = (lenderId, lenderName, offerId) => {
//     setSelectedLenderConversation({
//       id: offerId || lenderId, // Use offer ID if available, otherwise use lender ID
//       lenderId: lenderId,
//       lenderName: lenderName
//     });
//   };

//   // Function to send a message
//   const sendMessage = async (e) => {
//     e.preventDefault();
//     if (!newMessage.trim() || !selectedLenderConversation) return;

//     try {
//       // Create the message
//       const messageData = {
//         conversation_id: selectedLenderConversation.id,
//         offer_id: selectedLenderConversation.id, // If using offer ID as conversation ID
//         application_id: id,
//         sender_id: user.uid,
//         sender_type: 'business',
//         recipient_id: selectedLenderConversation.lenderId,
//         message: newMessage.trim(),
//         timestamp: new Date().toISOString(),
//         read: false
//       };

//       const result = await createDocument('messages', messageData);
//       if (result.error) throw result.error;

//       // Create a notification for the lender
//       await createDocument('notifications', {
//         recipient_id: selectedLenderConversation.lenderId,
//         type: 'new_message',
//         title: 'New message',
//         message: `New message from Application #${application.application_number || id?.substring(0, 8)}`,
//         related_entity_id: selectedLenderConversation.id,
//         related_entity_type: 'conversation',
//         read: false,
//         sent_at: new Date().toISOString()
//       });

//       setNewMessage('');
//       refetchMessages();
//     } catch (err) {
//       console.error('Error sending message:', err);
//       toast.error('Failed to send message');
//     }
//   };

//   // Function to get display name based on permissions
//   const getBusinessDisplayName = (businessData, isOwner, isMatched) => {
//     if (isOwner || isMatched) {
//       return businessData?.business_name || 'Unnamed Business';
//     }
//     return `Application #${application.application_number || id?.substring(0, 8)}`;
//   };

//   return (
//     <PageLayout>
//       <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
//         <div className="w-full py-8 px-6">
//           <Button
//             variant="ghost"
//             className="mb-6 hover:bg-white/60 text-slate-700 hover:text-slate-900 border border-slate-200/50 backdrop-blur-sm"
//             onClick={() => {
//               if (application?.isLender) {
//                 navigate('/matched-applications');
//               } else {
//                 navigate('/applications');
//               }
//             }}
//           >
//             <ArrowLeft className="mr-2 h-4 w-4" />
//             {application?.isLender ? 'Back to Matched Applications' : 'Back to Applications'}
//           </Button>
          
//           <div className="w-full max-w-none">
//             <div className="bg-[#212936] text-white rounded-xl p-8 mb-8 shadow-xl border-b-2 border-[#ff8000]">
//               <h1 className="text-4xl font-bold mb-3 tracking-tight">
//                 {application?.isLender 
//                   ? `Application #${application?.application_number || id?.substring(0, 8)}`
//                   : 'Application Details'
//                 }
//               </h1>
//               <div className="flex items-center space-x-3 mb-3">
//                 {application && <StatusBadge status={application.status} />}
//                 <p className="text-gray-200 text-md">
//                   Submitted {application?.application_date ? new Date(application.application_date).toLocaleDateString() : 'N/A'}
//                 </p>
//               </div>
//               <p className="text-gray-200 text-lg leading-relaxed">
//                 {application?.isLender 
//                   ? 'Full business information and loan application details'
//                   : 'Review your submitted application and track lender interactions'
//                 }
//               </p>
//             </div>
            
//             {isLoading ? (
//               <div className="h-64 animate-pulse bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/50 shadow-lg"></div>
//             ) : application ? (
//               <>
//                 {application.status === 'draft' && (
//                   <Alert className="mb-6 bg-white/90 backdrop-blur-sm border border-amber-200 shadow-lg">
//                     <AlertTriangle className="h-5 w-5 text-amber-600" />
//                     <AlertTitle className="text-amber-800 font-medium">Draft Application</AlertTitle>
//                     <AlertDescription className="flex items-center justify-between text-amber-700">
//                       <span>This application hasn't been submitted yet. Submit it to start receiving offers from lenders.</span>
//                       <Button 
//                         className="bg-[#212936] hover:bg-[#212936]/90 border-b-2 border-[#ff8000]"
//                         onClick={() => navigate(`/applications/${id}/review`)}
//                       >
//                         Continue to Review
//                       </Button>
//                     </AlertDescription>
//                   </Alert>
//                 )}

//                 {/* Only show the credit cost and view details if user is lender and hasn't viewed yet */}
//                 {application?.isLender && !hasViewedDetails && !isMatchedLender && !application.viewed_by_lenders?.includes(user?.uid) ? (
//                   <Card className="mb-6 bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
//                     <CardHeader className="bg-[#212936] text-white rounded-t-lg">
//                       <CardTitle className="flex items-center">
//                         <Eye className="mr-2 h-5 w-5 text-[#ff8000]" />
//                         <span className="text-white">View Application Details</span>
//                       </CardTitle>
//                       <CardDescription className="text-gray-200">
//                         Unlock full application details including financial information and business profile
//                       </CardDescription>
//                     </CardHeader>
//                     <CardContent className="p-6">
//                       <div className="flex items-center justify-between">
//                         <div>
//                           <div className="text-lg font-medium text-[#212936]">Credit Cost</div>
//                           <div className="text-sm text-slate-500">
//                             {getCreditCost(application.loan_amount)} credits required to view
//                           </div>
//                         </div>
//                         <Button 
//                           onClick={handleViewFullDetails}
//                           disabled={isDeductingCredits}
//                           className="bg-[#212936] hover:bg-[#212936]/90 border-b-2 border-[#ff8000] text-white"
//                         >
//                           {isDeductingCredits ? (
//                             <>
//                               <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                               Processing...
//                             </>
//                           ) : (
//                             'View Details'
//                           )}
//                         </Button>
//                       </div>
//                     </CardContent>
//                   </Card>
//                 ) : null}

//                 <Card className="mb-6 bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
//                   <CardHeader className="bg-[#212936] text-white rounded-t-lg">
//                     <CardTitle className="flex items-center">
//                       <Briefcase className="mr-2 h-5 w-5 text-[#ff8000]" />
//                       <span className="text-white">Application Overview</span>
//                     </CardTitle>
//                     <CardDescription className="text-gray-200">
//                       Key details about your funding application
//                     </CardDescription>
//                   </CardHeader>
//                   <CardContent className="space-y-6 p-6">
//                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                       <div className="bg-slate-50/70 rounded-lg p-3 border border-slate-100">
//                         <p className="text-sm text-slate-500">Loan Amount</p>
//                         <p className="font-semibold text-slate-900 text-lg flex items-center">
//                           <PoundSterling className="h-4 w-4 text-[#ff8000] mr-1" />
//                           £{application.loan_amount?.toLocaleString() || 'Not specified'}
//                         </p>
//                       </div>
//                       <div className="bg-slate-50/70 rounded-lg p-3 border border-slate-100">
//                         <p className="text-sm text-slate-500">Loan Term</p>
//                         <p className="font-semibold text-slate-900 text-lg flex items-center">
//                           <CalendarDays className="h-4 w-4 text-[#ff8000] mr-1" />
//                           {application.loan_term_months || 'Not specified'} months
//                         </p>
//                       </div>
//                       <div className="bg-slate-50/70 rounded-lg p-3 border border-slate-100">
//                         <p className="text-sm text-slate-500">Type</p>
//                         <p className="font-semibold text-slate-900 text-lg capitalize">
//                           {application.loan_type?.replace('_', ' ') || 'Not specified'}
//                         </p>
//                       </div>
//                     </div>
                    
//                     <Separator className="bg-slate-200" />
                    
//                     <div>
//                       <div className="bg-slate-50/70 rounded-lg p-3 border border-slate-100 mb-4">
//                         <p className="text-sm text-slate-500">Purpose</p>
//                         <p className="font-semibold text-slate-900">
//                           {application.purpose || 'Not specified'}
//                         </p>
//                         {application.purpose_details && (
//                           <p className="text-sm mt-1 text-slate-600">
//                             {application.purpose_details}
//                           </p>
//                         )}
//                       </div>
//                     </div>

//                     <Separator className="bg-slate-200" />

//                     <div>
//                       <div className="text-lg font-medium mb-3 text-[#212936]">Additional Details</div>
//                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                         <div className="bg-slate-50/70 rounded-lg p-3 border border-slate-100">
//                           <p className="text-sm text-slate-500">Security Offered</p>
//                           <p className="font-medium text-slate-900">
//                             {application.is_secured ? 'Yes' : 'No'}
//                           </p>
//                         </div>
//                         <div className="bg-slate-50/70 rounded-lg p-3 border border-slate-100">
//                           <p className="text-sm text-slate-500">Personal Guarantee</p>
//                           <p className="font-medium text-slate-900">
//                             {application.has_personal_guarantee ? 'Yes' : 'No'}
//                           </p>
//                         </div>
//                         <div className="bg-slate-50/70 rounded-lg p-3 border border-slate-100">
//                           <p className="text-sm text-slate-500">Application Date</p>
//                           <p className="font-medium text-slate-900">
//                             {application.application_date ? new Date(application.application_date).toLocaleDateString() : 'N/A'}
//                           </p>
//                         </div>
//                         <div className="bg-slate-50/70 rounded-lg p-3 border border-slate-100">
//                           <p className="text-sm text-slate-500">Last Updated</p>
//                           <p className="font-medium text-slate-900">
//                             {application.status_updated_at ? new Date(application.status_updated_at).toLocaleDateString() : 'N/A'}
//                           </p>
//                         </div>
//                       </div>
//                     </div>
//                   </CardContent>
//                 </Card>

//                 {/* New grid layout for strength cards and business info */}
//                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
//                   {/* Application Strength Card */}
//                   <Card className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
//                     <CardHeader className="bg-[#212936] text-white rounded-t-lg">
//                       <CardTitle className="flex items-center">
//                         <Shield className="mr-2 h-5 w-5 text-[#ff8000]" />
//                         <span className="text-white">Application Strength</span>
//                       </CardTitle>
//                       <CardDescription className="text-gray-200">
//                         Overall application strength assessment
//                       </CardDescription>
//                     </CardHeader>
//                     <CardContent className="p-6">
//                       {application ? (
//                         <div className="flex flex-col items-center">
//                           {/* Circular Progress Indicator */}
//                           <div className="relative w-36 h-36 mb-4">
//                             <svg className="w-full h-full" viewBox="0 0 100 100">
//                               {/* Background circle */}
//                               <circle
//                                 cx="50"
//                                 cy="50"
//                                 r="45"
//                                 fill="none"
//                                 stroke="#e5e7eb"
//                                 strokeWidth="8"
//                               />
                              
//                               {/* Progress circle */}
//                               <circle
//                                 cx="50"
//                                 cy="50"
//                                 r="45"
//                                 fill="none"
//                                 stroke={
//                                   !application.completeness_percentage ? "#f97316" :
//                                   application.completeness_percentage < 50 ? "#f97316" : 
//                                   application.completeness_percentage < 75 ? "#facc15" : 
//                                   application.completeness_percentage < 100 ? "#22c55e" : 
//                                   "#10b981"
//                                 } 
//                                 strokeWidth="8"
//                                 strokeLinecap="round"
//                                 strokeDasharray={`${2 * Math.PI * 45}`}
//                                 strokeDashoffset={`${2 * Math.PI * 45 * (1 - (application.completeness_percentage || 0) / 100)}`}
//                                 className="transition-all duration-1000 ease-out"
//                               />
//                             </svg>
                            
//                             {/* Percentage in Middle */}
//                             <div className="absolute inset-0 flex items-center justify-center flex-col">
//                               <span className="text-4xl font-bold text-[#212936]">
//                                 {application.completeness_percentage || 0}%
//                               </span>
//                               <span className="text-sm font-medium text-gray-500">Strength</span>
//                             </div>
//                           </div>
                          
//                           <div className="text-center w-full">
//                             <div className="flex justify-center items-center mb-2">
//                               <div className="h-2 w-2 mr-1.5 rounded-full bg-[#ff8000]"></div>
//                               <span className="text-slate-700 text-sm font-medium">
//                                 Application Strength Indicators
//                               </span>
//                             </div>
                            
//                             {/* Missing items - only show if not 100% complete */}
//                             {application.completeness_percentage !== 100 && (
//                               <div className="mt-2 px-4">
//                                 {!application.businesses && (
//                                   <div className="bg-amber-50 border border-amber-200/70 rounded-lg p-2 mb-2 flex items-center">
//                                     <div className="h-1.5 w-1.5 rounded-full bg-amber-500 mr-2"></div>
//                                     <p className="text-amber-800 text-xs font-medium">Business profile incomplete</p>
//                                   </div>
//                                 )}
//                                 {!application.credit_score && (
//                                   <div className="bg-amber-50 border border-amber-200/70 rounded-lg p-2 mb-2 flex items-center">
//                                     <div className="h-1.5 w-1.5 rounded-full bg-amber-500 mr-2"></div>
//                                     <p className="text-amber-800 text-xs font-medium">Credit score missing</p>
//                                   </div>
//                                 )}
//                                 {!application.has_documents && (
//                                   <div className="bg-amber-50 border border-amber-200/70 rounded-lg p-2 mb-2 flex items-center">
//                                     <div className="h-1.5 w-1.5 rounded-full bg-amber-500 mr-2"></div>
//                                     <p className="text-amber-800 text-xs font-medium">Financial documents missing</p>
//                                   </div>
//                                 )}
//                               </div>
//                             )}
                            
//                             {/* Complete application */}
//                             {application.completeness_percentage === 100 && (
//                               <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-2 mx-4">
//                                 <p className="text-green-800 text-sm font-medium">
//                                   ✓ Application complete
//                                 </p>
//                               </div>
//                             )}
//                           </div>
//                         </div>
//                       ) : (
//                         <div className="flex justify-center items-center h-40">
//                           <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
//                         </div>
//                       )}
//                     </CardContent>
//                   </Card>

//                   {/* Business Profile Card */}
//                   <Card className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
//                     <CardHeader className="bg-[#212936] text-white rounded-t-lg">
//                       <CardTitle className="flex items-center">
//                         <Building2 className="mr-2 h-5 w-5 text-[#ff8000]" />
//                         <span className="text-white">Business Profile</span>
//                       </CardTitle>
//                       <CardDescription className="text-gray-200">
//                         Company details and registration information
//                       </CardDescription>
//                     </CardHeader>
//                     <CardContent className="p-6">
//                       {application?.business ? (
//                         <div className="space-y-4">
//                           <div className="bg-slate-50/70 rounded-lg p-4 border border-slate-100">
//                             <h3 className="font-semibold text-[#212936] text-lg mb-1">{application.business.business_name || application.business.name || 'Unnamed Business'}</h3>
//                             <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-700">
//                               {application.business.website && (
//                                 <div><span className="font-medium">Website:</span> <a href={application.business.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{application.business.website}</a></div>
//                               )}
//                               {application.business.company_number && (
//                                 <div><span className="font-medium">Company Number:</span> {application.business.company_number}</div>
//                               )}
//                               {application.business.industry && (
//                                 <div><span className="font-medium">Industry:</span> {application.business.industry}</div>
//                               )}
//                               {application.business.company_size && (
//                                 <div><span className="font-medium">Size:</span> {application.business.company_size}</div>
//                               )}
//                               {application.business.business_email && (
//                                 <div><span className="font-medium">Email:</span> {application.business.business_email}</div>
//                               )}
//                               {application.business.business_phone && (
//                                 <div><span className="font-medium">Phone:</span> {application.business.business_phone}</div>
//                               )}
//                               {application.business.incorporation_date && (
//                                 <div><span className="font-medium">Incorporation Date:</span> {new Date(application.business.incorporation_date).toLocaleDateString()}</div>
//                               )}
//                             </div>
//                             <div className="mt-3 flex items-center">
//                               <Badge variant="outline" className="border-[#212936] text-[#212936]">
//                                 {application.business.years_trading || 0} years trading
//                               </Badge>
//                             </div>
//                           </div>
//                           {/* Address */}
//                           {application.business.address && (
//                             <div className="text-sm text-slate-600">
//                               <div className="font-medium text-slate-700">Business Address:</div>
//                               <p>
//                                 {application.business.address.line1 || application.business.address.street || ''}
//                                 {application.business.address.city ? `, ${application.business.address.city}` : ''}
//                                 {application.business.address.postal_code ? `, ${application.business.address.postal_code}` : ''}
//                                 {application.business.address.country ? `, ${application.business.address.country}` : ''}
//                               </p>
//                             </div>
//                           )}
//                         </div>
//                       ) : (
//                         <div className="text-center py-6">
//                           <div className="bg-gray-50/80 border border-gray-200/70 rounded-lg p-4 mb-4">
//                             <p className="font-medium text-gray-600">No business profile available</p>
//                           </div>
//                         </div>
//                       )}
//                     </CardContent>
//                   </Card>
                  
//                   {/* Credit Score Card */}
//                   <Card className="bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
//                     <CardHeader className="bg-[#212936] text-white rounded-t-lg">
//                       <CardTitle className="flex items-center">
//                         <TrendingUp className="mr-2 h-5 w-5 text-[#ff8000]" />
//                         <span className="text-white">Credit Assessment</span>
//                       </CardTitle>
//                       <CardDescription className="text-gray-200">
//                         Business credit score and risk assessment
//                       </CardDescription>
//                     </CardHeader>
//                     <CardContent className="p-6">
//                       {application?.business?.credit_info?.credit_score ? (
//                         <div className="text-center py-4">
//                           <div className="flex flex-col items-center justify-center mb-4">
//                             {/* Circular Credit Score Indicator */}
//                             <div className="relative w-24 h-24 flex items-center justify-center mb-2">
//                               <svg width="96" height="96" viewBox="0 0 96 96">
//                                 <circle
//                                   cx="48" cy="48" r="44"
//                                   fill="#fff"
//                                   stroke="#e5e7eb"
//                                   strokeWidth="8"
//                                 />
//                                 <circle
//                                   cx="48" cy="48" r="44"
//                                   fill="none"
//                                   stroke="#22c55e"
//                                   strokeWidth="8"
//                                   strokeDasharray={2 * Math.PI * 44}
//                                   strokeDashoffset={2 * Math.PI * 44 * (1 - (Number(application.business.credit_info.credit_score) / 100))}
//                                   strokeLinecap="round"
//                                   style={{ transition: 'stroke-dashoffset 0.5s' }}
//                                 />
//                               </svg>
//                               <span className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-green-700">
//                                 {application.business.credit_info.credit_score}
//                               </span>
//                             </div>
//                             <p className="text-sm text-green-600">Business Credit Score</p>
//                             {application.business.credit_info.risk && (
//                               <p className="text-sm font-medium text-green-700 mt-1">{application.business.credit_info.risk}</p>
//                             )}
//                           </div>
//                           <Badge variant="default" className="bg-green-600 text-white shadow-sm">Score Available</Badge>
//                         </div>
//                       ) : (
//                         <div className="text-center py-6">
//                           <div className="bg-orange-50/80 border border-orange-200/70 rounded-lg p-4 mb-4">
//                             <p className="font-medium text-orange-800">Credit score not available</p>
//                             <p className="text-sm text-orange-600 mt-1">Other factors will be used to evaluate this application</p>
//                           </div>
//                         </div>
//                       )}
//                     </CardContent>
//                   </Card>
//                 </div>

//                 {/* Financial Documents Section */}
//                 <div className="mt-8">
//                   <h2 className="text-2xl font-semibold mb-4">Financial Documents</h2>
//                   <Tabs defaultValue="pl" className="w-full">
//                     <TabsList className="flex flex-wrap justify-center mb-4">
//                       {DOCUMENT_STEPS.map((step) => (
//                         <TabsTrigger 
//                           key={step.key} 
//                           value={step.key} 
//                           className="mx-2 data-[state=active]:text-[#ff8000] data-[state=active]:font-bold data-[state=inactive]:text-white"
//                         >
//                           {step.label}
//                         </TabsTrigger>
//                       ))}
//                     </TabsList>
//                     {DOCUMENT_STEPS.map((step) => (
//                       <TabsContent key={step.key} value={step.key} className="text-center p-4 bg-white rounded shadow">
//                         <Card className="border-none shadow-none p-0">
//                           {/* Display ONLY the summary text, not the full JSON */}
//                           {application?.financialSummaries?.[step.key] && (
//                             <div className="text-left bg-white border border-gray-100 rounded-lg p-4 mt-4 mb-4 whitespace-pre-line shadow-sm">
//                               <div className="flex items-center mb-2">
//                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-2" viewBox="0 0 20 20" fill="currentColor">
//                                   <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
//                                 </svg>
//                                 <strong className="text-gray-800">Financial Summary</strong>
//                               </div>
//                               <div className="mt-1 text-sm text-gray-700 pl-7 leading-relaxed">
//                                 {(() => {
//                                   // Extract the actual summary text from the complex string
//                                   const summaryContent = application.financialSummaries[step.key];
                                  
//                                   if (typeof summaryContent !== 'string' || !summaryContent.trim()) {
//                                     return "No summary available";
//                                   }
                                  
//                                   // Check if the summary content is actually JSON
//                                   if (summaryContent.startsWith('{') && summaryContent.endsWith('}')) {
//                                     try {
//                                       const parsedSummary = JSON.parse(summaryContent);
//                                       if (parsedSummary.summary && typeof parsedSummary.summary === 'string') {
//                                         return parsedSummary.summary;
//                                       }
//                                     } catch (e) {
//                                       console.error("Failed to parse summary as JSON:", e);
//                                     }
//                                   }
                                  
//                                   // If it contains markdown JSON with a nested summary field, extract that
//                                   if (summaryContent.includes('```json')) {
//                                     try {
//                                       // Extract just the actual summary text from the nested structure
//                                       const match = summaryContent.match(/"summary"\s*:\s*"([^"]+)"/);
//                                       if (match && match[1]) {
//                                         // We found the actual summary text!
//                                         return match[1].replace(/\\n/g, ' ')
//                                                      .replace(/\\"/g, '"')
//                                                      .trim();
//                                       }
//                                     } catch (e) {
//                                       console.error("Failed to extract nested summary:", e);
//                                     }
//                                   }
                                  
//                                   // Special handling for Trial Balance and Balance Sheet
//                                   if (step.key === 'tb' || step.key === 'bs') {
//                                     // Try to extract the summary from JSON format
//                                     const summaryMatch = summaryContent.match(/"summary"\s*:\s*"([^"]+)"/);
//                                     if (summaryMatch && summaryMatch[1]) {
//                                       return summaryMatch[1]
//                                         .replace(/\\n/g, ' ')
//                                         .replace(/\\"/g, '"')
//                                         .trim();
//                                     }
                                    
//                                     // Look for a "summary" field in the JSON
//                                     try {
//                                       // Try to find a summary directly in the content if it's a JSON object
//                                       const jsonData = JSON.parse(summaryContent);
//                                       if (jsonData && jsonData.summary && typeof jsonData.summary === 'string') {
//                                         return jsonData.summary;
//                                       }
//                                     } catch (e) {
//                                       console.error(`Failed to parse ${step.key} summary as JSON:`, e);
//                                     }
//                                   }
                                  
//                                   // If we couldn't extract a nested summary, check for JSON strings in the content
//                                   if (summaryContent.includes('"summary"')) {
//                                     const matches = summaryContent.match(/"summary"\s*:\s*"([^"]+)"/);
//                                     if (matches && matches[1]) {
//                                       return matches[1]
//                                         .replace(/\\n/g, ' ')
//                                         .replace(/\\"/g, '"')
//                                         .trim();
//                                     }
//                                   }
                                  
//                                   // If we couldn't extract a summary using any method, return a clean version of the original
//                                   // For Trial Balance and Balance Sheet, provide a fallback if everything fails
//                                   if (step.key === 'tb' || step.key === 'bs') {
//                                     if (summaryContent.includes('{') && summaryContent.includes('}')) {
//                                       return step.key === 'tb' 
//                                         ? "Trial Balance summary showing account balances."
//                                         : "Balance Sheet summary showing assets, liabilities and equity.";
//                                     }
//                                   }
                                  
//                                   return summaryContent;
//                                 })()}
//                               </div>
//                             </div>
//                           )}
                          
//                           {/* Use the FinancialsTable component to display financial data */}
//                           <div className="text-left bg-white rounded-lg shadow p-5 mt-6 border border-gray-100">
//                             <div className="flex items-center justify-between mb-4 pb-2 border-b">
//                               <div className="flex items-center">
//                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
//                                   <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
//                                 </svg>
//                                 <h4 className="text-lg font-semibold text-gray-800">Financial Metrics</h4>
//                               </div>
//                             </div>
//                             <FinancialsTable
//                               data={(() => {
//                                 // Get the data for this document type
//                                 let data = application?.financialDocuments?.[step.key] || null;
                                
//                                 // If data is empty or null, check if we can extract it from the summary
//                                 if (!data || Object.keys(data).length === 0) {
//                                   try {
//                                     const summaryContent = application?.financialSummaries?.[step.key];
//                                     if (summaryContent) {
//                                       // Try to parse the summary as JSON
//                                       if (typeof summaryContent === 'string' && summaryContent.startsWith('{')) {
//                                         const parsed = JSON.parse(summaryContent);
//                                         // Look for the data in common locations
//                                         if (parsed.json && Object.keys(parsed.json).length > 0) {
//                                           data = parsed.json;
//                                         } else if (parsed.data && Object.keys(parsed.data).length > 0) {
//                                           data = parsed.data;
//                                         }
//                                       }
//                                     }
//                                   } catch (e) {
//                                     console.error(`Failed to extract data from summary for ${step.key}:`, e);
//                                   }
//                                 }
                                
//                                 // Special handling for Trial Balance
//                                 if (step.key === 'tb' && data) {
//                                   // Make sure accounts data is properly exposed
//                                   if (data.accounts) {
//                                     return data;
//                                   } else if (Array.isArray(data) && data.length > 0) {
//                                     return { accounts: data };
//                                   } else if (data.lineItems && Array.isArray(data.lineItems)) {
//                                     return { accounts: data.lineItems };
//                                   }
//                                 }
                                
//                                 return data;
//                               })()}
//                             />
//                           </div>
//                         </Card>
//                       </TabsContent>
//                     ))}
//                   </Tabs>
//                 </div>

//                 {/* Offers Section */}
//                 {application.offers && application.offers.length > 0 ? (
//                   <Card className="mb-6 bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
//                     <CardHeader className="bg-[#212936] text-white rounded-t-lg">
//                       <CardTitle className="flex items-center">
//                         <HandCoins className="mr-2 h-5 w-5 text-[#ff8000]" />
//                         <span className="text-white">Funding Offers</span>
//                       </CardTitle>
//                       <CardDescription className="text-gray-200">
//                         Lender offers for your application
//                       </CardDescription>
//                     </CardHeader>
//                     <CardContent className="p-6">
//                       <div className="space-y-4">
//                         {application.offers && application.offers.map((offer, index) => (
//                           <div key={index} className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
//                             <div className={`p-4 ${offer.status === 'approved' ? 'bg-green-50 border-b border-green-200' : offer.status === 'rejected' ? 'bg-red-50 border-b border-red-200' : 'bg-blue-50 border-b border-blue-200'}`}>
//                               <div className="flex justify-between items-start">
//                                 <div>
//                                   <h3 className="text-lg font-semibold text-[#212936]">
//                                     £{Number(offer.amount).toLocaleString()}
//                                   </h3>
//                                   <p className="text-sm text-slate-600">
//                                     {offer.term} months • {offer.interest_rate}% interest
//                                   </p>
//                                 </div>
//                                 <Badge 
//                                   className={`
//                                     ${offer.status === 'approved' ? 'bg-green-100 text-green-800 border-green-200' : 
//                                      offer.status === 'rejected' ? 'bg-red-100 text-red-800 border-red-200' :
//                                      'bg-blue-100 text-blue-800 border-blue-200'}
//                                   `}
//                                 >
//                                   {offer.status === 'approved' ? 'Accepted' :
//                                    offer.status === 'rejected' ? 'Declined' :
//                                    'Pending'}
//                                 </Badge>
//                               </div>
//                             </div>
                            
//                             <div className="p-4">
//                               {offer.lender_name && (
//                                 <div className="mb-3">
//                                   <span className="text-sm text-slate-500">From</span>
//                                   <div className="font-medium text-slate-800">{offer.lender_name}</div>
//                                 </div>
//                               )}
                              
//                               {offer.note && (
//                                 <div className="mb-3">
//                                   <span className="text-sm text-slate-500">Note</span>
//                                   <p className="text-slate-800 text-sm">{offer.note}</p>
//                                 </div>
//                               )}
                              
//                               {offer.status === 'pending' && !application.isLender && (
//                                 <div className="flex space-x-2 mt-3">
//                                   <Button 
//                                     size="sm" 
//                                     className="bg-green-600 hover:bg-green-700 text-white"
//                                     onClick={() => {/* Handle approve */}}
//                                   >
//                                     <ThumbsUp className="mr-1 h-3 w-3" /> Accept
//                                   </Button>
//                                   <Button 
//                                     size="sm" 
//                                     variant="outline"
//                                     className="border-red-300 text-red-600 hover:bg-red-50"
//                                     onClick={() => {/* Handle reject */}}
//                                   >
//                                     Decline
//                                   </Button>
//                                 </div>
//                               )}
                              
//                               {offer.id && (
//                                 <Button
//                                   variant="ghost"
//                                   size="sm"
//                                   className="mt-3 text-[#212936] hover:bg-slate-100 hover:text-[#212936]/80"
//                                   onClick={() => selectLenderConversation(offer.lender_id, offer.lender_name, offer.id)}
//                                 >
//                                   <MessageSquare className="mr-1 h-3 w-3" />
//                                   <span className="text-xs">Message Lender</span>
//                                 </Button>
//                               )}
//                             </div>
//                           </div>
//                         ))}
//                       </div>
//                     </CardContent>
//                   </Card>
//                 ) : null}

//                 {application.interested_lenders && application.interested_lenders.length > 0 && application.isOwner ? (
//                   <Card>
//                     <CardHeader>
//                       <CardTitle className="text-xl flex items-center">
//                         <ThumbsUp className="mr-2 h-5 w-5 text-fundhub-blue" />
//                         Interested Lenders
//                       </CardTitle>
//                       <CardDescription>
//                         These lenders have expressed interest in your application
//                       </CardDescription>
//                     </CardHeader>
//                     <CardContent>
//                       <div className="space-y-4">
//                         {application.interested_lenders.map((lender: any, index: number) => (
//                           <div key={lender.lender_id || index} className="border rounded-lg p-4">
//                             <div className="flex justify-between items-start mb-2">
//                               <div>
//                                 <h3 className="font-medium">{lender.lender_name || 'Lender'}</h3>
//                                 <div className="text-sm text-muted-foreground mt-1">
//                                   {lender.lender_company || 'Financial Institution'}
//                                 </div>
//                                 <div className="text-xs text-muted-foreground mt-1">
//                                   Interest expressed on {lender.expressed_at ? new Date(lender.expressed_at.seconds * 1000).toLocaleDateString() : 'recently'}
//                                 </div>
//                               </div>
//                               <div className="flex gap-2">
//                                 {lender.status === 'pending' ? (
//                                   <>
//                                     <Button
//                                       variant="outline"
//                                       size="sm"
//                                       className="text-red-600 border-red-600"
//                                       onClick={() => handleRespondToInterest(lender, 'rejected')}
//                                     >
//                                       Decline
//                                     </Button>
//                                     <Button
//                                       size="sm"
//                                       className="bg-fundhub-blue hover:bg-fundhub-blue/90"
//                                       onClick={() => handleRespondToInterest(lender, 'accepted')}
//                                     >
//                                       Accept
//                                     </Button>
//                                   </>
//                                 ) : (
//                                   <Badge variant={lender.status === 'accepted' ? 'default' : 'destructive'}>
//                                     {lender.status === 'accepted' ? 'Accepted' : 'Declined'}
//                                   </Badge>
//                                 )}
//                               </div>
//                             </div>
//                             <div className="text-sm mt-2">
//                               <p>By accepting, you'll connect with this lender to discuss potential financing options.</p>
//                             </div>
//                           </div>
//                         ))}
//                       </div>
//                     </CardContent>
//                   </Card>
//                 ) : application.status === 'submitted' ? (
//                   <Card>
//                     <CardContent className="py-12">
//                       <div className="text-center">
//                         <BarChart4 className="h-12 w-12 mx-auto text-fundhub-blue mb-4" />
//                         <h3 className="text-lg font-medium mb-2">
//                           Application Under Review
//                         </h3>
//                         <p className="text-muted-foreground max-w-md mx-auto">
//                           Your application is being reviewed by matching lenders. 
//                           You'll be notified when you receive offers.
//                         </p>
//                       </div>
//                     </CardContent>
//                   </Card>
//                 ) : null}

//                 {/* Communication Section */}
//                 <Card className="mb-6 bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
//                   <CardHeader className="bg-[#212936] text-white rounded-t-lg">
//                     <CardTitle className="flex items-center">
//                       <MessageSquare className="mr-2 h-5 w-5 text-[#ff8000]" />
//                       <span className="text-white">Communication</span>
//                     </CardTitle>
//                     <CardDescription className="text-gray-200">
//                       Messages between you and lenders
//                     </CardDescription>
//                   </CardHeader>
//                   <CardContent className="p-6">
//                     {application.matched_lenders && application.matched_lenders.length > 0 ? (
//                       <div className="flex flex-col md:flex-row h-[400px] border border-slate-200 rounded-lg overflow-hidden">
//                         {/* Lender List */}
//                         <div className="w-full md:w-1/3 border-r border-slate-200 bg-slate-50">
//                           <div className="p-3 border-b border-slate-200 bg-slate-100">
//                             <h3 className="font-medium text-slate-700">Lenders</h3>
//                           </div>
//                           <div className="overflow-y-auto h-[calc(400px-40px)]">
//                             {application.matched_lenders.map((lenderId, index) => {
//                               // Find offer from this lender if exists
//                               const offer = application.offers?.find(o => o.lender_id === lenderId);
//                               const lenderName = offer?.lender_name || `Lender ${index + 1}`;
//                               const conversationId = offer?.id || lenderId;
                              
//                               return (
//                                 <div
//                                   key={lenderId}
//                                   className={`p-3 border-b border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors ${
//                                     selectedLenderConversation?.id === conversationId ? 'bg-slate-100' : ''
//                                   }`}
//                                   onClick={() => selectLenderConversation(lenderId, lenderName, offer?.id)}
//                                 >
//                                   <div className="flex items-center">
//                                     <Avatar className="h-8 w-8 mr-2">
//                                       <AvatarFallback className="bg-[#212936] text-white text-xs">
//                                         {lenderName.slice(0, 2).toUpperCase()}
//                                       </AvatarFallback>
//                                     </Avatar>
//                                     <div>
//                                       <p className="font-medium text-slate-800 text-sm">{lenderName}</p>
//                                       {offer && (
//                                         <p className="text-xs text-slate-500">
//                                           £{Number(offer.amount).toLocaleString()} • {offer.term} months
//                                         </p>
//                                       )}
//                                     </div>
//                                   </div>
//                                 </div>
//                               );
//                             })}
//                           </div>
//                         </div>
                        
//                         {/* Chat Area */}
//                         <div className="w-full md:w-2/3 flex flex-col">
//                           {selectedLenderConversation ? (
//                             <>
//                               <div className="p-3 border-b border-slate-200 bg-slate-100">
//                                 <h3 className="font-medium text-slate-700">
//                                   Chat with {selectedLenderConversation.lenderName}
//                                 </h3>
//                               </div>
//                               <div className="flex-1 overflow-y-auto p-4 space-y-4">
//                                 {messages?.length > 0 ? (
//                                   messages.map((msg, index) => (
//                                     <div
//                                       key={index}
//                                       className={`flex ${msg.sender_id === user?.uid ? 'justify-end' : 'justify-start'}`}
//                                     >
//                                       <div
//                                         className={`max-w-[80%] rounded-lg p-3 ${
//                                           msg.sender_id === user?.uid
//                                             ? 'bg-[#212936] text-white'
//                                             : 'bg-slate-100 text-slate-800'
//                                         }`}
//                                       >
//                                         <p className="text-sm">{msg.message}</p>
//                                         <p className="text-xs mt-1 opacity-70">
//                                           {new Date(msg.timestamp).toLocaleTimeString([], {
//                                             hour: '2-digit',
//                                             minute: '2-digit',
//                                           })}
//                                         </p>
//                                       </div>
//                                     </div>
//                                   ))
//                                 ) : (
//                                   <div className="flex items-center justify-center h-full">
//                                     <p className="text-slate-500 text-center">
//                                       No messages yet. Send a message to start the conversation.
//                                     </p>
//                                   </div>
//                                 )}
//                               </div>
//                               <div className="p-3 border-t border-slate-200">
//                                 <form onSubmit={sendMessage} className="flex">
//                                   <Textarea
//                                     className="flex-1 resize-none min-h-[40px] max-h-20 rounded-r-none"
//                                     placeholder="Type a message..."
//                                     value={newMessage}
//                                     onChange={(e) => setNewMessage(e.target.value)}
//                                   />
//                                   <Button
//                                     className="rounded-l-none h-auto bg-[#212936] hover:bg-[#212936]/90"
//                                     disabled={!newMessage.trim()}
//                                     type="submit"
//                                   >
//                                     <Send className="h-4 w-4" />
//                                   </Button>
//                                 </form>
//                               </div>
//                             </>
//                           ) : (
//                             <div className="flex items-center justify-center h-full">
//                               <div className="text-center">
//                                 <MessageSquare className="h-10 w-10 text-slate-300 mx-auto mb-3" />
//                                 <p className="text-slate-500">Select a lender to start chatting</p>
//                               </div>
//                             </div>
//                           )}
//                         </div>
//                       </div>
//                     ) : (
//                       <div className="text-center p-6">
//                         <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4">
//                           <p className="font-medium text-slate-700">No lenders matched yet</p>
//                           {application.status === 'submitted' && (
//                             <p className="text-sm text-slate-500 mt-1">
//                               Your application is being reviewed. Lenders will be matched soon.
//                             </p>
//                           )}
//                           {application.status === 'draft' && (
//                             <p className="text-sm text-slate-500 mt-1">
//                               Submit your application to get matched with lenders.
//                             </p>
//                           )}
//                         </div>
//                       </div>
//                     )}
//                   </CardContent>
//                 </Card>

//                 {/* Low Credits Dialog */}
//                 {showLowCreditsDialog && (
//                   <LowCreditsDialog 
//                     open={showLowCreditsDialog}
//                     onOpenChange={setShowLowCreditsDialog}
//                     availableCredits={availableCredits}
//                     requiredCredits={getCreditCost(application.loan_amount)}
//                   />
//                 )}
//               </>
//             ) : (
//               <Alert variant="destructive" className="mb-6">
//                 <AlertTriangle className="h-4 w-4" />
//                 <AlertTitle>Application Not Found</AlertTitle>
//                 <AlertDescription>
//                   {errorMessage || "This application doesn't exist or you don't have permission to view it."}
//                 </AlertDescription>
//               </Alert>
//             )}
//           </div>
//         </div>
//       </div>
//     </PageLayout>
//   );
// };

// export default ApplicationDetail;
