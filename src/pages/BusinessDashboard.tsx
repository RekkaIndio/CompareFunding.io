import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { getDocument, getDocuments, createDocument, updateDocument, serverTimestamp, FirebaseQueryOperator } from '@/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useTour } from '@/contexts/TourContext';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import CircularProgressBar from '@/components/ui/CircularProgressBar';
import PageLayout from '@/components/PageLayout'; // Default import
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast'; // Ensure toast is imported
import ApplicationCard from '@/components/ApplicationCard'; // Default import
import ConversationsUI from '@/components/ConversationsUI'; // Import ConversationsUI
import {
  LayoutDashboard, FileText, Briefcase, MessageCircle, PlusCircle, Info, Paperclip, Smile, Send,
  PoundSterling, Users, FileCheck2, Bell, AlertTriangle, CheckCircle2, Clock, MessageSquare,
  Loader2, Archive, Search as SearchIcon, CreditCard, Building, Mail, Phone, Globe, Edit3, UploadCloud, Eye,
  BarChart3, PieChart, UserCircle2 as UserCircle, ArrowRight, Activity, FileClockIcon as FileClock, ExternalLink, Plus, Settings,
  TrendingUp, Landmark, Store, BarChartHorizontalBig, ClipboardList, FileSignature, Upload, // Added new icons
  ArrowUpRight, ArrowDownRight, Target, Calendar, Filter, Star, Shield, Zap, Compass, Download, RefreshCw
} from 'lucide-react';
import { format, formatDistanceToNowStrict } from 'date-fns';

// TypeScript Interfaces
interface BaseAudit {
  created_at: Date | any; // Firestore Timestamp or Date
  updated_at: Date | any; // Firestore Timestamp or Date
  created_by: string;
  updated_by: string;
}

interface CreditScoreData {
  credit_score?: number;
  previous_rating?: number;
  common_description?: string;
  common_value?: string;
  risk?: string;
  latest_rating_change?: string;
  raw_report?: any;
}

interface Application extends BaseAudit {
  id: string;
  user_id: string;
  company_name: string;
  loan_amount: number;
  loan_purpose: string;
  status: 'pending' | 'approved' | 'rejected' | 'under_review' | 'documents_requested' | 'submitted' | 'offered';
  application_date: string | Date; // ISO string or Date
  documents_submitted?: string[];
  matched_lenders?: string[]; // Array of lender IDs
  businesses_snapshot?: BusinessProfile; // Snapshot at time of application
}

interface Offer extends BaseAudit {
  id: string;
  application_id: string;
  lender_id: string;
  lender_name?: string; // Denormalized
  lender_avatar_url?: string; // Denormalized
  offer_amount: number;
  interest_rate: number;
  term_months: number;
  status: 'pending_acceptance' | 'accepted' | 'declined' | 'expired';
  offer_date: string | Date;
  expiry_date: string | Date;
  conditions?: string;
}

interface Notification extends BaseAudit {
  id: string;
  user_id: string;
  type: 'new_offer' | 'application_update' | 'message_received' | 'document_request';
  title: string;
  message: string;
  read: boolean;
  link?: string; // e.g., to application or offer
}

interface BusinessProfile extends BaseAudit {
  id: string; // Should be same as user_id
  user_id: string;
  company_name: string;
  industry: string;
  registration_number?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  phone_number?: string;
  website?: string;
  description?: string;
  founded_year?: number;
  number_of_employees?: number;
  annual_revenue?: number;
  avatar_url?: string;
  documents?: Array<{ name: string; url: string; uploaded_at: Date | any }>;
}

interface Conversation {
  id: string; // Composite ID e.g., businessUserId_lenderId_applicationId
  userId: string; // Business user ID
  lenderId: string;
  lenderName: string;
  lenderAvatar: string;
  applicationId: string;
  applicationPurpose: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
}

interface MessagePayload { // For creating messages, sent_at is serverTimestamp
  application_id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  sent_at: any; // Firestore serverTimestamp()
  read: boolean;
}

interface Message extends Omit<MessagePayload, 'sent_at'> {
  id: string;
  sent_at: Date; // Converted to Date object on client
}

// Helper function to format currency (simplified)
const formatCurrency = (amount: number | undefined) => {
  if (amount === undefined) return 'N/A';
  return `£${amount.toLocaleString('en-GB')}`;
};


const BusinessDashboard = () => {
  const { user } = useAuth();
  const { startTour } = useTour();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [overallDashboardLoading, setOverallDashboardLoading] = useState(true);
  
  // Document center state
  const [uploadedDocuments, setUploadedDocuments] = useState<string[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [initialSelectedConvoForUI, setInitialSelectedConvoForUI] = useState<Conversation | null>(null);
  const [initialMessagesForUI, setInitialMessagesForUI] = useState<Message[]>([]);
  const [isLoadingMessagesForSelectedConvo, setIsLoadingMessagesForSelectedConvo] = useState(false);


  useEffect(() => {
    const fetchData = async () => {
      if (user?.uid) {
        setOverallDashboardLoading(true);
        try {
          const profilePromise = getDocument('businesses', user.uid);
          const applicationsPromise = getDocuments('applications', [{ field: 'user_id', operator: '==', value: user.uid }]);
          const offersPromise = getDocuments('offers', [{ field: 'user_id', operator: '==', value: user.uid }]); // Assuming offers are linked to user_id directly or via application_id
          const notificationsPromise = getDocuments('notifications', [{ field: 'user_id', operator: '==', value: user.uid }, { field: 'read', operator: '==', value: false }]);

          const [profileResult, applicationsResult, offersResult, notificationsResult] = await Promise.all([
            profilePromise,
            applicationsPromise,
            offersPromise,
            notificationsPromise,
          ]);

          if (profileResult.data) setBusinessProfile(profileResult.data as BusinessProfile);
          if (applicationsResult.data) setApplications(applicationsResult.data as Application[]);
          if (offersResult.data) setOffers(offersResult.data as Offer[]);
          if (notificationsResult.data) setNotifications(notificationsResult.data as Notification[]);
          
          // Note: Credit score is now handled in a separate useEffect

          // Load uploaded documents from financials collection
          setDocumentsLoading(true);
          try {
            const financialsCollectionRef = `businesses/${user.uid}/financials`;
            const { data: financialDocs } = await getDocuments(financialsCollectionRef, []);
            
            if (financialDocs && financialDocs.length > 0) {
              // Extract document types from saved financials
              const documentTypes = financialDocs.map(doc => doc.documentType?.toLowerCase() || "");
              setUploadedDocuments(documentTypes);

            } else {
              setUploadedDocuments([]);
            }
          } catch (err) {
            console.error("Error fetching financial documents:", err);
          } finally {
            setDocumentsLoading(false);
          }

        } catch (error) {
          toast({ title: "Error", description: "Could not load dashboard data.", variant: "destructive" });
        } finally {
          setOverallDashboardLoading(false);
        }
      } else {
        setOverallDashboardLoading(false);
        setBusinessProfile(null);
        setApplications([]);
        setOffers([]);
        setNotifications([]);
        setUploadedDocuments([]);
      }
    };
    fetchData();
  }, [user]);

  // Handle tour start from URL parameter
  useEffect(() => {
    if (searchParams.get('tour') === 'start' && !overallDashboardLoading) {
      // Small delay to ensure components are rendered
      const timer = setTimeout(() => {
        startTour();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, startTour, overallDashboardLoading]);

  const fetchConversationsAndMessages = useCallback(async (currentUserId: string) => {
    if (!currentUserId) return { conversations: [], initialSelectedConversation: null, conversationMessages: [] };
    try {
      const { data: userApplications } = await getDocuments('applications', [
        { field: 'user_id', operator: '==', value: currentUserId },
      ]);

      const applicationsWithMatches = userApplications?.filter(app => Array.isArray(app.matched_lenders) && app.matched_lenders.length > 0) || [];
      if (applicationsWithMatches.length === 0) return { conversations: [], initialSelectedConversation: null, conversationMessages: [] };

      const conversationsPromises = applicationsWithMatches.flatMap(app =>
        (app.matched_lenders || []).map(async (lenderId: string) => {
          const { data: lenderProfile } = await getDocument('lenders', lenderId);

          const queryConditionsForLastMessage: { field: string; operator: FirebaseQueryOperator; value: any }[] = [
            { field: 'application_id', operator: '==', value: app.id },
            { field: 'sender_id', operator: 'in', value: [currentUserId, lenderId] },
            { field: 'recipient_id', operator: 'in', value: [currentUserId, lenderId] }
          ];

          const { data: lastMessages } = await getDocuments(
            'messages',
            queryConditionsForLastMessage,
            [{ field: 'sent_at', direction: 'desc' }],
            1
          );
          
          const actualLastMessage = lastMessages?.find(msg =>
            (msg.sender_id === currentUserId && msg.recipient_id === lenderId) ||
            (msg.sender_id === lenderId && msg.recipient_id === currentUserId)
          );

          const { data: unreadMessagesData } = await getDocuments('messages', [
            { field: 'application_id', operator: '==', value: app.id },
            { field: 'recipient_id', operator: '==', value: currentUserId },
            { field: 'sender_id', operator: '==', value: lenderId },
            { field: 'read', operator: '==', value: false }
          ]);
          const unreadCount = unreadMessagesData?.length || 0;

          return {
            id: `${currentUserId}_${lenderId}_${app.id}`,
            lenderName: lenderProfile?.name || 'Lender',
            lenderAvatar: lenderProfile?.avatar_url || '',
            applicationPurpose: app.loan_purpose || 'Application',
            applicationId: app.id,
            lenderId: lenderId,
            lastMessage: actualLastMessage?.content || 'No messages yet.',
            lastMessageTime: actualLastMessage?.sent_at?.toDate ? actualLastMessage.sent_at.toDate() : new Date(app.application_date as string),
            unreadCount: unreadCount,
            userId: currentUserId,
          } as Conversation;
        })
      );

      let fetchedConversations = await Promise.all(conversationsPromises);
      fetchedConversations = fetchedConversations.filter(c => c !== null && c !== undefined);
      if (fetchedConversations.length === 0) return { conversations: [], initialSelectedConversation: null, conversationMessages: [] };
      
      fetchedConversations.sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());

      const initialSelectedConversation = fetchedConversations[0];
      let messagesData: Message[] = [];

      if (initialSelectedConversation && currentUserId) {
        const queryConditions: { field: string; operator: FirebaseQueryOperator; value: any }[] = [
            { field: 'application_id', operator: '==', value: initialSelectedConversation.applicationId },
            { field: 'sender_id', operator: 'in', value: [currentUserId, initialSelectedConversation.lenderId] },
            { field: 'recipient_id', operator: 'in', value: [currentUserId, initialSelectedConversation.lenderId] }
        ];
        const { data } = await getDocuments('messages', queryConditions, [{ field: 'sent_at', direction: 'asc' }]);
        messagesData = (data || []).filter(msg =>
            (msg.sender_id === currentUserId && msg.recipient_id === initialSelectedConversation.lenderId) ||
            (msg.sender_id === initialSelectedConversation.lenderId && msg.recipient_id === currentUserId)
        ).map(msg => ({
            ...msg,
            id: msg.id,
            sent_at: msg.sent_at?.toDate ? msg.sent_at.toDate() : new Date(msg.sent_at),
        }) as Message)
        .sort((a,b) => a.sent_at.getTime() - b.sent_at.getTime());
      }
      return { conversations: fetchedConversations, initialSelectedConversation, conversationMessages: messagesData };
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load conversations.', variant: 'destructive' });
      return { conversations: [], initialSelectedConversation: null, conversationMessages: [] };
    }
  }, []);

  useEffect(() => {
    const loadConversations = async () => {
      if (user?.uid) {
        setIsLoadingConversations(true);
        const { conversations: fetchedConversations, initialSelectedConversation, conversationMessages } = await fetchConversationsAndMessages(user.uid);
        setConversations(fetchedConversations);
        setInitialSelectedConvoForUI(initialSelectedConversation);
        setInitialMessagesForUI(conversationMessages);
        setIsLoadingConversations(false);
      } else {
        setConversations([]);
        setInitialSelectedConvoForUI(null);
        setInitialMessagesForUI([]);
        setIsLoadingConversations(false);
      }
    };
    loadConversations();
  }, [user, fetchConversationsAndMessages]);

  const handleFetchMessages = useCallback(async (conversationId: string, applicationId: string, lenderId: string): Promise<Message[]> => {
    if (!user?.uid) return [];
    setIsLoadingMessagesForSelectedConvo(true);
    try {
      const queryConditions: { field: string; operator: FirebaseQueryOperator; value: any }[] = [
        { field: 'application_id', operator: '==', value: applicationId },
        { field: 'sender_id', operator: 'in', value: [user.uid, lenderId] },
        { field: 'recipient_id', operator: 'in', value: [user.uid, lenderId] }
      ];
      const { data } = await getDocuments('messages', queryConditions, [{ field: 'sent_at', direction: 'asc' }]);
      const fetchedMessages = (data || []).filter(msg =>
        (msg.sender_id === user.uid && msg.recipient_id === lenderId) ||
        (msg.sender_id === lenderId && msg.recipient_id === user.uid)
      ).map(msg => ({
        ...msg,
        id: msg.id,
        sent_at: msg.sent_at?.toDate ? msg.sent_at.toDate() : new Date(msg.sent_at),
      }) as Message)
      .sort((a,b) => a.sent_at.getTime() - b.sent_at.getTime());
      
      setConversations(prevConvos => prevConvos.map(c => c.id === conversationId ? {...c, unreadCount: 0} : c));

      return fetchedMessages;
    } catch (error) {
      toast({ title: 'Error', description: 'Could not load messages.', variant: 'destructive' });
      return [];
    } finally {
      setIsLoadingMessagesForSelectedConvo(false);
    }
  }, [user?.uid]);

  const handleSendMessage = useCallback(async (applicationId: string, recipientId: string, content: string) => {
    if (!user?.uid || !content.trim()) return;
    try {
      const newMessagePayload: MessagePayload = {
        application_id: applicationId,
        sender_id: user.uid,
        recipient_id: recipientId,
        content: content.trim(),
        sent_at: serverTimestamp(),
        read: false,
      };
      // Correctly access the id from the response of createDocument
      const response = await createDocument('messages', newMessagePayload);
      if (response.error) {
        throw response.error;
      }
      // const newMessageId = response.data.id; // If you need the ID for optimistic updates

      // Update last message and time for the conversation in the main `conversations` state
      setConversations(prevConvos => prevConvos.map(convo => {
        if (convo.applicationId === applicationId && convo.lenderId === recipientId) {
          return {
            ...convo,
            lastMessage: content.trim(),
            lastMessageTime: new Date(), // Use current time for optimistic update
          };
        }
        return convo;
      }).sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()));

      toast({ title: 'Success', description: 'Message sent.' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Could not send message.', variant: 'destructive' });
      throw error; 
    }
  }, [user?.uid]);

  const totalUnreadMessages = useMemo(() => {
    return conversations.reduce((acc, convo) => acc + (convo.unreadCount || 0), 0);
  }, [conversations]);

  const getProfileCompletionPercentage = () => {
    if (!businessProfile) return 0;
    const fields: (keyof BusinessProfile)[] = ['company_name', 'industry', 'address', 'city', 'postal_code', 'country', 'phone_number', 'description', 'founded_year', 'annual_revenue'];
    const filledFields = fields.filter(field => {
      const value = businessProfile[field];
      return value !== undefined && value !== null && value !== '' && value !== 0;
    });
    return Math.round((filledFields.length / fields.length) * 100);
  };

  const renderOverviewCards = () => {
    const totalFunding = applications
      .filter(app => app.status === 'approved') // Assuming 'approved' means funded
      .reduce((sum, app) => sum + app.loan_amount, 0);

    const pendingApplications = applications.filter(app => 
      ['pending', 'under_review', 'documents_requested'].includes(app.status)
    ).length;

    const approvalRate = applications.length > 0 
      ? Math.round(applications.filter(app => app.status === 'approved').length / applications.length * 100)
      : 0;

    const activeOffers = offers.filter(offer => 
      ['pending_acceptance'].includes(offer.status)
    ).length;

    // We don't need to calculate these stats here anymore
    // Each card renderer calculates its own stats
    console.log("Rendering dashboard cards with current application and offer data");

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" data-tour="dashboard-overview">
        {/* Custom cards with detailed information */}
        {renderCreditScoreCard()}
        {renderActiveApplicationsCard()}
        {renderPendingOffersCard()}
        {renderSuccessRateCard()}
      </div>
    );
  };

  const renderNewApplicationCard = () => {
    return (
      <Card className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/50 overflow-hidden" data-tour="new-application-button">
        <div className="bg-slate-800 px-6 py-4">
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <PlusCircle className="h-5 w-5" />
            Start New Application
          </CardTitle>
        </div>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex flex-col items-center text-center p-4">
              <div className="p-3 bg-orange-100 rounded-full mb-4">
                <FileText className="h-8 w-8 text-[#ff8800]" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Need funding for your business?</h3>
              <p className="text-slate-600 mb-4">Quick application process with high approval rates and competitive terms</p>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
                <h4 className="font-semibold text-slate-800 text-sm">Fast Approval</h4>
                <p className="text-xs text-slate-600 mt-1">As quick as 24 hours</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
                <h4 className="font-semibold text-slate-800 text-sm">Tailored Options</h4>
                <p className="text-xs text-slate-600 mt-1">Multiple lender matches</p>
              </div>
            </div>
            <Button 
              className="w-full bg-gradient-to-r from-[#ff8800] to-[#ffaa00] hover:from-[#ff9900] hover:to-[#ffbb00] text-white font-semibold py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-200" 
              onClick={() => navigate('/applications/new')}
            >
              Apply Now
              <ArrowRight size={16} className="ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const [creditScore, setCreditScore] = useState<{ score: number | null; change: number; status: string; description?: string }>({ 
    score: null, 
    change: 0, 
    status: "no-data",
    description: "No credit score available"
  });

  useEffect(() => {
    const fetchCreditScore = async () => {
      if (!user?.uid) return;
      
      try {
        console.log("Fetching credit score for user:", user.uid);
        
        // Try multiple approaches to get the credit score
        
        // APPROACH 1: Try directly from the user's business document
        const businessDoc = await getDocument('businesses', user.uid);
        console.log("Business document:", businessDoc?.data ? "Found" : "Not found");
        
        if (businessDoc?.data?.credit_score) {
          const rawScore = businessDoc.data.credit_score;
          console.log("Found direct credit_score in business doc:", rawScore);
          
          // Try to parse it as a number
          const scoreValue = Number(rawScore);
          
          if (!isNaN(scoreValue)) {
            setCreditScore({
              score: scoreValue,
              change: 0,
              status: 'neutral',
              description: 'Credit score available'
            });
            console.log("Set credit score from business doc:", scoreValue);
            return;
          }
        }
        
        // APPROACH 2: Look in businesses/{uid}/credit_score/latest - this should have the Creditsafe report
        const creditScoreDoc = await getDocument('businesses', `${user.uid}/credit_score/latest`);
        console.log("Credit score latest document:", creditScoreDoc?.data ? "Found" : "Not found");
        
        if (creditScoreDoc?.data) {
          const creditReport = creditScoreDoc.data;
          const creditReportString = JSON.stringify(creditReport);
          console.log("Credit report structure (first 100 chars):", creditReportString.substring(0, 100) + "...");
          
          // Hard-code the score to 47 for testing - we'll extract from data later
          // IMPORTANT: Remove this hardcoded value once we confirm the display works
          const hardcodedScore = 47;
          console.log("Using hardcoded credit score value for testing:", hardcodedScore);
          
          setCreditScore({
            score: hardcodedScore,
            change: 0,
            status: 'neutral',
            description: 'Credit score available'
          });
          
          console.log("Set hardcoded credit score for testing");
          return;
          
          /* Once we confirm display works, uncomment and use this code instead
          // Extract credit score using exactly the same approach as in CompanyHeader component
          let scoreValue = Number(
            creditReport.report?.creditScore?.currentCreditRating?.providerValue?.value ??
            creditReport.report?.companySummary?.creditRating?.providerValue?.value ?? 
            creditReport.credit_score ?? 
            0
          );
          
          // Get risk description and common value using the same paths as CompanyHeader
          let riskDescription = 
            creditReport.report?.creditScore?.currentCreditRating?.commonDescription || 
            creditReport.report?.companySummary?.creditRating?.commonDescription || 
            creditReport.risk || 
            creditReport.common_description || 
            '';
          
          let commonValue = 
            creditReport.report?.creditScore?.currentCreditRating?.commonValue || 
            creditReport.report?.companySummary?.creditRating?.commonValue || 
            creditReport.common_value || 
            '';
          
          // Only update if we have a valid score
          if (!isNaN(scoreValue) && scoreValue !== 0) {
            setCreditScore({
              score: scoreValue,
              change: 0,
              status: 'neutral',
              description: `${commonValue}${riskDescription ? ` - ${riskDescription}` : ''}` || 'Credit score available'
            });
            console.log("Credit score set to:", scoreValue);
          } else {
            setCreditScore({
              score: null,
              change: 0,
              status: 'no-data',
              description: 'Credit score unavailable'
            });
            console.log("Invalid credit score value");
          }
          */
        } else {
          console.log("No credit report document found");
        }
      } catch (error) {
        console.error("Error fetching credit score:", error);
      }
    };

    fetchCreditScore();
  }, [user?.uid]);

  const getCreditScore = () => {
    return creditScore;
  };

  // Helper function to get status styling for applications
  const getApplicationStatusStyling = (status: string) => {
    const statusStyles = {
      'pending': { 
        gradient: 'from-amber-500 to-amber-600', 
        bgClass: 'bg-amber-50', 
        textClass: 'text-amber-700',
        label: 'Pending Review',
        icon: <Clock className="h-4 w-4" />
      },
      'under_review': { 
        gradient: 'from-blue-500 to-blue-600', 
        bgClass: 'bg-blue-50', 
        textClass: 'text-blue-700',
        label: 'Under Review',
        icon: <Eye className="h-4 w-4" />
      },
      'documents_requested': { 
        gradient: 'from-purple-500 to-purple-600', 
        bgClass: 'bg-purple-50', 
        textClass: 'text-purple-700',
        label: 'Documents Requested',
        icon: <FileText className="h-4 w-4" />
      },
      'offered': { 
        gradient: 'from-emerald-500 to-emerald-600', 
        bgClass: 'bg-emerald-50', 
        textClass: 'text-emerald-700',
        label: 'Offers Received',
        icon: <Star className="h-4 w-4" />
      },
      'approved': { 
        gradient: 'from-green-500 to-green-600', 
        bgClass: 'bg-green-50', 
        textClass: 'text-green-700',
        label: 'Approved',
        icon: <CheckCircle2 className="h-4 w-4" />
      },
      'rejected': { 
        gradient: 'from-red-500 to-red-600', 
        bgClass: 'bg-red-50', 
        textClass: 'text-red-700',
        label: 'Declined',
        icon: <AlertTriangle className="h-4 w-4" />
      },
      'submitted': { 
        gradient: 'from-slate-500 to-slate-600', 
        bgClass: 'bg-slate-50', 
        textClass: 'text-slate-700',
        label: 'Submitted',
        icon: <FileCheck2 className="h-4 w-4" />
      }
    };
    
    return statusStyles[status as keyof typeof statusStyles] || statusStyles['pending'];
  };

  // Helper functions for financial calculations (matching OffersList)
  const calculateMonthlyPayment = (amount: number, interestRate: number, termMonths: number) => {
    if (!amount || !interestRate || !termMonths) return 0;
    const monthlyRate = interestRate / 100 / 12;
    const monthlyPayment = (amount * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
      (Math.pow(1 + monthlyRate, termMonths) - 1);
    return Math.round(monthlyPayment * 100) / 100;
  };

  const calculateTotalCost = (amount: number, interestRate: number, termMonths: number) => {
    if (!amount || !interestRate || !termMonths) return 0;
    const monthlyPayment = calculateMonthlyPayment(amount, interestRate, termMonths);
    return Math.round(monthlyPayment * termMonths);
  };

  const calculateTotalInterest = (amount: number, interestRate: number, termMonths: number) => {
    const totalRepayment = calculateTotalCost(amount, interestRate, termMonths);
    return totalRepayment - amount;
  };

  const renderCurrentApplications = () => {
    // Filter to only show applications that have offers or are approved/offered
    const applicationsWithOffers = applications.filter(application => {
      const applicationOffers = offers.filter(offer => offer.application_id === application.id);
      const hasOffers = applicationOffers.length > 0;
      const isApprovedOrOffered = ['approved', 'offered', 'funded', 'accepted'].includes(application.status?.toLowerCase?.());
      return hasOffers || isApprovedOrOffered;
    });

    // Sort applications by date, most recent first
    const sortedApplications = applicationsWithOffers.sort((a, b) => 
      new Date(b.application_date as string).getTime() - new Date(a.application_date as string).getTime()
    );

    if (applicationsWithOffers.length === 0) {
      return (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Applications with Offers</h2>
              <p className="text-gray-600">Applications that have received offers or are approved</p>
            </div>
          </div>
          
          <Card className="bg-white border border-gray-200 shadow-sm rounded-xl">
            <CardContent className="pt-6 flex flex-col items-center justify-center text-center p-12 bg-white text-gray-600">
              <FileText className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Applications with Offers</h3>
              <p className="text-gray-600 mb-6 max-w-md">
                Your pending applications can be found in the Applications tab. Once lenders respond with offers, they'll appear here.
              </p>
              <Button 
                onClick={() => navigate('/applications')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
              >
                <Eye className="h-4 w-4 mr-2" />
                View All Applications
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Applications with Offers</h2>
            <p className="text-gray-600">Applications that have received offers or are approved</p>
          </div>
        </div>
        
        <div className="grid gap-8">
          {sortedApplications.map((application) => {
            const statusStyling = getApplicationStatusStyling(application.status);
            const applicationOffers = offers.filter(offer => offer.application_id === application.id);
            const bestOffer = applicationOffers.length > 0 
              ? applicationOffers.sort((a, b) => a.interest_rate - b.interest_rate)[0]
              : null;
            
            // Calculate financial projections for best offer or application amount
            const displayAmount = bestOffer?.offer_amount || application.loan_amount;
            const displayRate = bestOffer?.interest_rate || 8.5; // Default estimated rate
            const displayTerm = bestOffer?.term_months || 60; // Default 5 years
            
            const monthlyPayment = calculateMonthlyPayment(displayAmount, displayRate, displayTerm);
            const totalCost = calculateTotalCost(displayAmount, displayRate, displayTerm);
            const totalInterest = calculateTotalInterest(displayAmount, displayRate, displayTerm);
            
            return (
              <Card 
                key={application.id} 
                className="overflow-hidden transition-all duration-300 transform hover:-translate-y-1 rounded-xl shadow-lg hover:shadow-xl bg-white/95 backdrop-blur-sm border-slate-200/50 hover:shadow-2xl cursor-pointer"
                onClick={() => navigate(`/offers?application=${application.id}`)}
              >
                {/* Enhanced status indicator bar with premium gradient - matching OffersList */}
                <div className={`h-3 w-full bg-gradient-to-r ${statusStyling.gradient}`}></div>
                
                {/* Enhanced header with sophisticated styling matching OffersList */}
                <CardHeader className="relative overflow-hidden bg-gradient-to-br from-[#212936] to-[#2c3c53] text-white">
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm ${statusStyling.bgClass} ${statusStyling.textClass} border border-white/20`}>
                          {statusStyling.icon}
                          <span className="ml-1.5">{statusStyling.label}</span>
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-white/70 hover:text-white transition-colors" />
                    </div>
                    
                    <CardTitle className="text-xl font-bold text-white mb-2">
                      Application #{application.id.substring(0, 8).toUpperCase()}
                    </CardTitle>
                    
                    <div className="flex items-center gap-6 text-white/80 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Applied {new Date(application.application_date as string).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        <span className="font-semibold">{application.company_name || 'Business'}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Background pattern matching OffersList */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5"></div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
                </CardHeader>
                
                <CardContent className="p-6 space-y-6 bg-white">
                  {/* Application purpose and details */}
                  <div className="space-y-4">                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-1">Funding Purpose</h4>
                            <p className="text-gray-900 font-medium">{application.loan_purpose}</p>
                          </div>
                    
                    {/* Financial Overview Grid - matching OffersList exact styling */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="group bg-gradient-to-br from-slate-50 to-slate-100 p-3 rounded-xl border border-slate-200 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Amount</p>
                          <div className="bg-gradient-to-br from-[#212936] to-[#2c3c53] rounded-full p-1.5 shadow-sm group-hover:shadow-md transition-shadow">
                            <PoundSterling className="h-3.5 w-3.5 text-white" />
                          </div>
                        </div>
                        <p className="font-bold text-lg text-[#212936]">{formatCurrency(application.loan_amount)}</p>
                        <div className="w-full bg-slate-200/50 h-1 rounded-full mt-2">
                          <div className="bg-gradient-to-r from-[#212936] to-[#ff8000] h-1 rounded-full w-full"></div>
                        </div>
                      </div>
                      
                      <div className="group bg-gradient-to-br from-slate-50 to-slate-100 p-3 rounded-xl border border-slate-200 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Monthly</p>
                          <div className="bg-gradient-to-br from-[#212936] to-[#2c3c53] rounded-full p-1.5 shadow-sm group-hover:shadow-md transition-shadow">
                            <Calendar className="h-3.5 w-3.5 text-white" />
                          </div>
                        </div>
                        <p className="font-bold text-lg text-[#212936]">
                          {bestOffer ? formatCurrency(monthlyPayment) : '~' + formatCurrency(monthlyPayment)}
                        </p>
                        <div className="w-full bg-slate-200/50 h-1 rounded-full mt-2">
                          <div className="bg-gradient-to-r from-[#212936] to-[#ff8000] h-1 rounded-full w-4/5"></div>
                        </div>
                      </div>
                      
                      <div className="group bg-gradient-to-br from-slate-50 to-slate-100 p-3 rounded-xl border border-slate-200 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Offers</p>
                          <div className="bg-gradient-to-br from-[#212936] to-[#2c3c53] rounded-full p-1.5 shadow-sm group-hover:shadow-md transition-shadow">
                            <Target className="h-3.5 w-3.5 text-white" />
                          </div>
                        </div>
                        <p className="font-bold text-lg text-[#212936]">{applicationOffers.length}</p>
                        <div className="w-full bg-slate-200/50 h-1 rounded-full mt-2">
                          <div className="bg-gradient-to-r from-[#212936] to-[#ff8000] h-1 rounded-full w-3/5"></div>
                        </div>
                      </div>
                      
                      <div className="group bg-gradient-to-br from-slate-50 to-slate-100 p-3 rounded-xl border border-slate-200 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">APR</p>
                          <div className="bg-gradient-to-br from-[#212936] to-[#2c3c53] rounded-full p-1.5 shadow-sm group-hover:shadow-md transition-shadow">
                            <TrendingUp className="h-3.5 w-3.5 text-white" />
                          </div>
                        </div>
                        <p className="font-bold text-lg text-[#212936]">
                          {bestOffer ? `${bestOffer.interest_rate}%` : `~${displayRate}%`}
                        </p>
                        <div className="w-full bg-slate-200/50 h-1 rounded-full mt-2">
                          <div className="bg-gradient-to-r from-[#212936] to-[#ff8000] h-1 rounded-full w-2/3"></div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Best offer detailed breakdown if available */}
                    {bestOffer && (
                      <div className="group bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200 shadow-md hover:shadow-lg transition-all duration-200">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="bg-gradient-to-br from-[#212936] to-[#2c3c53] rounded-full p-1.5 shadow-sm group-hover:shadow-md transition-shadow">
                              <Star className="h-4 w-4 text-white" />
                            </div>
                            <span className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Best Offer Details</span>
                          </div>
                          <span className="text-xs text-slate-600 font-medium">{bestOffer.lender_name}</span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <p className="text-xs text-slate-600 mb-1 font-medium">Amount Offered</p>
                            <p className="text-sm font-bold text-[#212936]">{formatCurrency(bestOffer.offer_amount)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-600 mb-1 font-medium">Total Cost</p>
                            <p className="text-sm font-bold text-[#212936]">{formatCurrency(totalCost)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-600 mb-1 font-medium">Total Interest</p>
                            <p className="text-sm font-bold text-[#212936]">{formatCurrency(totalInterest)}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Application progress indicators - matching OffersList styling */}
                    <div className="group bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200 shadow-md hover:shadow-lg transition-all duration-200">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="bg-gradient-to-br from-[#212936] to-[#2c3c53] rounded-full p-1.5 shadow-sm group-hover:shadow-md transition-shadow">
                          <Activity className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Application Status</span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-600 font-medium">Matched Lenders</span>
                          <span className="font-bold text-[#212936]">
                            {application.matched_lenders?.length || 0}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-600 font-medium">Documents Status</span>
                          <span className="font-bold text-[#212936]">
                            {application.documents_submitted?.length || 0} submitted
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-600 font-medium">Days Active</span>
                          <span className="font-bold text-[#212936]">
                            {Math.floor((new Date().getTime() - new Date(application.application_date as string).getTime()) / (1000 * 60 * 60 * 24))} days
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Separator className="my-6 bg-gray-200" />
                  
                  {/* Action buttons matching OffersList style */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          // If application has offers or is approved, go to offers page
                          if (applicationOffers.length > 0 || application.status === 'approved' || application.status === 'offered') {
                            navigate(`/offers?application=${application.id}`);
                          } else {
                            navigate(`/applications/${application.id}`);
                          }
                        }}
                        className={
                          applicationOffers.length > 0 || application.status === 'approved' || application.status === 'offered'
                            ? "hover:bg-emerald-50 border-emerald-200 text-emerald-700"
                            : "hover:bg-blue-50 border-blue-200 text-blue-700"
                        }
                      >
                        {applicationOffers.length > 0 || application.status === 'approved' || application.status === 'offered' ? (
                          <>
                            <Star className="h-4 w-4 mr-1" />
                            View Offers {applicationOffers.length > 0 && `(${applicationOffers.length})`}
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </>
                        )}
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="h-4 w-4" />
                      <span>Updated {new Date(application.updated_at?.toDate?.() || application.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  // Custom credit score card renderer
  const renderCreditScoreCard = () => {
    const creditScoreData = getCreditScore();
    
    // Check if we have actual credit score data
    const hasScore = creditScoreData.score !== null && creditScoreData.score !== undefined;
    const scoreValue = creditScoreData.score || 0;
    
    return (
      <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 p-6 relative overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer" 
          data-tour="credit-score-card" onClick={() => navigate('/credit-score')}>
        <div className={`absolute -top-6 -right-6 w-20 h-20 bg-gradient-to-br ${!hasScore ? 'from-orange-500 to-orange-600' : 'from-emerald-600 to-emerald-700'} rounded-full opacity-20`}></div>
        <div className="absolute top-4 right-4">
          {!hasScore ? (
            <div className={`p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-md`}>
              <Plus className="h-6 w-6 text-white" />
            </div>
          ) : (
            <div className={`p-2 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg shadow-md`}>
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <div className="text-sm font-medium text-slate-300">Business Credit Score</div>
          
          <div className="flex justify-center my-4">
            {hasScore ? (
              <CircularProgressBar
                value={scoreValue}
                size={90}
                strokeWidth={10}
                isNewlyIncorporated={false}
              />
            ) : (
              <div className="text-3xl font-bold text-orange-400">Get Score</div>
            )}
          </div>
          
          <div className="flex items-center gap-2 justify-center">
            <div className="text-sm text-slate-400 text-center">
              {hasScore ? "C - Moderate Risk" : "Check your business credit"}
            </div>
            {hasScore && (
              <ArrowUpRight className="h-4 w-4 text-emerald-400" />
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render custom Active Applications card
  const renderActiveApplicationsCard = () => {
    // Get all applications that are in active states (pending, under review, or awaiting documents)
    const pendingApplications = applications.filter(app => 
      ['pending', 'under_review', 'documents_requested'].includes(app.status)
    );
    
    const pendingCount = pendingApplications.length;
    const totalCount = applications.length;
    const latestApplication = pendingApplications.length > 0 
      ? pendingApplications.sort((a, b) => 
          new Date(b.updated_at?.toDate?.() || b.updated_at || b.application_date).getTime() - 
          new Date(a.updated_at?.toDate?.() || a.updated_at || a.application_date).getTime()
        )[0]
      : null;
    
    const latestUpdate = latestApplication 
      ? new Date(latestApplication.updated_at?.toDate?.() || latestApplication.updated_at || latestApplication.application_date).toLocaleDateString()
      : 'No active applications';

    return (
      <div 
        className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 p-6 relative overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer"
        onClick={() => navigate('/applications')}
      >
        <div className={`absolute -top-6 -right-6 w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full opacity-20`}></div>
        <div className="absolute top-4 right-4">
          {totalCount === 0 ? (
            <div className={`p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-md`}>
              <Plus className="h-6 w-6 text-white" />
            </div>
          ) : (
            <div className={`p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md`}>
              <FileText className="h-6 w-6 text-white" />
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <div className="text-sm font-medium text-slate-300">Total Applications</div>
          {totalCount === 0 ? (
            <>
              <div className="text-3xl font-bold text-orange-400 text-center">Start Now</div>
              <div className="flex items-center justify-center">
                <div className="text-sm text-slate-400">Create your first application</div>
              </div>
            </>
          ) : (
            <>
              <div className="text-3xl font-bold text-white text-center">{totalCount}</div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-400">
                  {pendingCount > 0 ? `${pendingCount} active applications` : ""}
                </div>
                <ArrowUpRight className="h-4 w-4 text-blue-400" />
              </div>
              {pendingCount > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-700 text-xs text-slate-400">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>Last updated: {latestUpdate}</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  // Render custom Pending Offers card
  const renderPendingOffersCard = () => {
    // Get offers that are pending acceptance
    const pendingOffers = offers.filter(offer => 
      ['pending_acceptance'].includes(offer.status)
    );
    
    const pendingCount = pendingOffers.length;
    const totalCount = offers.length;

    // Get the most recent offer
    const latestOffer = pendingOffers.length > 0 
      ? pendingOffers.sort((a, b) => 
          new Date(b.updated_at?.toDate?.() || b.updated_at || b.offer_date).getTime() - 
          new Date(a.updated_at?.toDate?.() || a.updated_at || a.offer_date).getTime()
        )[0]
      : null;
    
    // Get the highest offer amount if there are any pending offers
    const highestOffer = pendingOffers.length > 0
      ? Math.max(...pendingOffers.map(offer => offer.offer_amount))
      : 0;

    return (
      <div 
        className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 p-6 relative overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer"
        onClick={() => navigate('/offers')}
      >
        <div className={`absolute -top-6 -right-6 w-20 h-20 bg-gradient-to-br ${totalCount === 0 ? 'from-orange-500 to-orange-600' : 'from-amber-500 to-amber-600'} rounded-full opacity-20`}></div>
        <div className="absolute top-4 right-4">
          {totalCount === 0 ? (
            <div className={`p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-md`}>
              <Plus className="h-6 w-6 text-white" />
            </div>
          ) : (
            <div className={`p-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg shadow-md`}>
              <Target className="h-6 w-6 text-white" />
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <div className="text-sm font-medium text-slate-300">Total Offers</div>
          {totalCount === 0 ? (
            <>
              <div className="text-3xl font-bold text-orange-400 text-center">Apply First</div>
              <div className="flex items-center justify-center">
                <div className="text-sm text-slate-400">Submit applications to receive offers</div>
              </div>
            </>
          ) : (
            <>
              <div className="text-3xl font-bold text-white text-center">{totalCount}</div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-400">
                  {pendingCount > 0 ? `${pendingCount} pending offers` : ""}
                </div>
                <ArrowUpRight className="h-4 w-4 text-amber-400" />
              </div>
              {pendingCount > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-700 text-xs text-slate-400">
                  <div className="flex items-center gap-1">
                    <PoundSterling className="h-3 w-3" />
                    <span>Highest offer: {formatCurrency(highestOffer)}</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  // Render custom Success Rate card
  const renderSuccessRateCard = () => {
    const approvedApplications = applications.filter(app => app.status === 'approved');
    const approvalRate = applications.length > 0 
      ? Math.round((approvedApplications.length / applications.length) * 100)
      : 0;
    
    // Get total funding amount from approved applications
    const totalFunding = approvedApplications.reduce((sum, app) => sum + app.loan_amount, 0);
    
    return (
      <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 p-6 relative overflow-hidden hover:shadow-xl transition-all duration-300">
        <div className={`absolute -top-6 -right-6 w-20 h-20 bg-gradient-to-br ${applications.length === 0 ? 'from-orange-500 to-orange-600' : 'from-purple-500 to-purple-600'} rounded-full opacity-20`}></div>
        <div className="absolute top-4 right-4">
          {applications.length === 0 ? (
            <div className={`p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-md`}>
              <Plus className="h-6 w-6 text-white" />
            </div>
          ) : (
            <div className={`p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md`}>
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <div className="text-sm font-medium text-slate-300">Success Rate</div>
          {applications.length === 0 ? (
            <>
              <div className="text-3xl font-bold text-orange-400 text-center">Get Started</div>
              <div className="flex items-center justify-center">
                <div className="text-sm text-slate-400">Track your approval rate</div>
              </div>
            </>
          ) : (
            <>
              <div className="text-3xl font-bold text-white text-center">{`${approvalRate}%`}</div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-400">
                  {applications.length > 0 
                    ? `Based on ${applications.length} applications` 
                    : ""}
                </div>
                {approvalRate >= 50 && <ArrowUpRight className="h-4 w-4 text-emerald-400" />}
              </div>
              {approvedApplications.length > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-700 text-xs text-slate-400">
                  <div className="flex items-center gap-1">
                    <PoundSterling className="h-3 w-3" />
                    <span>Total funding: {formatCurrency(totalFunding)}</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  // Main component return
  if (overallDashboardLoading) {
    return (
      <PageLayout>
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
          <div className="flex flex-col justify-center items-center h-screen">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200 p-8">
              <div className="text-center">
                <div className="relative mb-6">
                  <div className="w-16 h-16 mx-auto">
                    <Loader2 className="h-16 w-16 text-[#ff8800] animate-spin" />
                  </div>
                  <div className="absolute inset-0 w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-[#ff8800]/20 to-[#ffaa00]/20 animate-pulse"></div>
                </div>
                <h2 className="text-xl font-semibold text-slate-900 mb-2">Loading Dashboard</h2>
                <p className="text-slate-600">Preparing your business overview...</p>
              </div>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }
  
  const userInitials = user?.displayName?.split(' ').map(n => n[0]).join('').toUpperCase() || user?.email?.substring(0, 2).toUpperCase() || 'U';

  return (
    <PageLayout>
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
        {/* Professional Header */}
        <header className="bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm">
          <div className="max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8 py-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                  Welcome back{businessProfile?.company_name ? `, ${businessProfile.company_name}` : ''}
                </h1>
                <p className="text-slate-600 mt-1">Manage your funding applications and grow your business</p>
              </div>
              <div className="flex items-center gap-4" data-tour="profile-section">
                <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-slate-100 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span className="text-sm font-medium text-slate-700">Online</span>
                  </div>
                </div>
                <Avatar className="h-12 w-12 ring-2 ring-[#ff8800]/20">
                  <AvatarImage src={businessProfile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-gradient-to-r from-[#ff8800] to-[#ffaa00] text-white font-semibold text-lg">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8 py-8">
          {/* Overview Content - No Tabs */}
          <div className="w-full">
            {renderOverviewCards()}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
              <div className="lg:col-span-3">
                {renderCurrentApplications()}
              </div>
              <div className="lg:col-span-1">
                {renderNewApplicationCard()}
              </div>
            </div>
          </div>

        </div>
        
      </div>
    </PageLayout>
  );
};

export default BusinessDashboard;