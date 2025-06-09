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

import { formatApplicationNumber } from '@/lib/applicationUtils';
import { format, formatDistanceToNowStrict } from 'date-fns';
import { formatApplicationTitle } from '@/lib/applicationUtils';

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
  application_number?: string; // Added missing application_number field
  user_id: string;
  company_name: string;
  loan_amount: number;
  loan_purpose: string;
  purpose_category?: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'under_review' | 'documents_requested' | 'submitted' | 'offered';
  application_date: string | Date; // ISO string or Date
  documents_submitted?: string[];
  matched_lenders?: string[]; // Array of lender IDs
  businesses_snapshot?: BusinessProfile; // Snapshot at time of application
  is_prefilled?: boolean; // Flag for auto-created applications
  prefill_source?: string; // Source of prefill data
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
  const { startTour, isActive: isTourActive, currentTourStep } = useTour();
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

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Function to trigger data refresh - can be called from outside
  const refreshDashboardData = useCallback(() => {
    console.log('🔄 Refreshing dashboard data...');
    setRefreshTrigger(prev => prev + 1);
  }, []);

  // Expose refresh function globally for tour completion
  useEffect(() => {
    (window as any).refreshDashboard = refreshDashboardData;
    return () => {
      delete (window as any).refreshDashboard;
    };
  }, [refreshDashboardData]);

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

          console.log('=== Dashboard Data Fetch Results ===');
          console.log('Applications result:', applicationsResult);
          console.log('Applications data:', applicationsResult.data);
          console.log('Number of applications:', applicationsResult.data?.length || 0);
          
          if (applicationsResult.data) {
            const draftApps = applicationsResult.data.filter((app: any) => app.status === 'draft');
            console.log('Draft applications found:', draftApps);
          }

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
  }, [user?.uid, refreshTrigger]);

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
                      {formatApplicationTitle(application, application.id)}
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
                
                <CardContent className="p-6 bg-white">
                  {/* Simplified application content - only funding amount and description */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    {/* Funding Amount */}
                    <div className="text-center md:text-left">
                      <div className="text-3xl font-bold text-[#212936] mb-2">
                        {formatCurrency(application.loan_amount)}
                      </div>
                      <div className="text-sm text-gray-600">Requested Amount</div>
                    </div>
                    
                    {/* Purpose/Description */}
                    <div className="text-center md:text-left">
                      <h4 className="text-sm font-semibold text-gray-700 mb-1">Funding Purpose</h4>
                      <p className="text-gray-900 font-medium">{application.loan_purpose}</p>
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
                            <Star className="h-4 w-4 mr-1 text-white" />
                            <span className="text-white">
                              View Offers {applicationOffers.length > 0 && `(${applicationOffers.length})`}
                            </span>
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
  
  // Render draft applications section
  const renderDraftApplications = () => {
    // Filter to show only draft applications
    const draftApplications = applications.filter(application => 
      application.status === 'draft'
    );

    // Sort drafts by date, most recent first
    const sortedDrafts = draftApplications.sort((a, b) => 
      new Date(b.application_date as string).getTime() - new Date(a.application_date as string).getTime()
    );

    if (draftApplications.length === 0) {
      return null; // Don't show section if no drafts
    }

    return (
      <div className="space-y-6 mb-8" data-tour="draft-applications-section">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Draft Applications</h2>
            <p className="text-gray-600">Complete your applications to submit to lenders</p>
          </div>
        </div>
        
        <div className="grid gap-4">
          {sortedDrafts.map((application) => (
            <Card 
              key={application.id} 
              className="overflow-hidden transition-all duration-300 transform hover:-translate-y-1 rounded-xl shadow-lg hover:shadow-xl bg-white/95 backdrop-blur-sm border-slate-200/50 hover:shadow-2xl cursor-pointer"
              onClick={() => navigate(`/applications/new?draft=${application.id}`)}
            >
              {/* Draft status indicator bar */}
              <div className="h-3 w-full bg-gradient-to-r from-yellow-400 to-orange-500"></div>
              
              {/* Header */}
              <CardHeader className="relative overflow-hidden bg-gradient-to-br from-yellow-50 to-orange-50">
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                        <Edit3 className="h-4 w-4" />
                        <span className="ml-1.5">Draft</span>
                      </div>
                      {application.is_prefilled && (
                        <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                          <Zap className="h-3 w-3 mr-1" />
                          Auto-filled
                        </div>
                      )}
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-500 hover:text-gray-700 transition-colors" />
                  </div>
                  
                  <CardTitle className="text-xl font-bold text-gray-900 mb-2">
                    Application #{formatApplicationNumber(application, application.id)}
                  </CardTitle>
                  
                  <div className="flex items-center gap-6 text-gray-600 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Created {new Date(application.application_date as string).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      <span className="font-semibold">{application.company_name || 'Business'}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-6">
                {/* Simplified draft content - only funding amount and description */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  {/* Funding Amount */}
                  <div className="text-center md:text-left">
                    <div className="text-3xl font-bold text-gray-900 mb-2">
                      {formatCurrency(application.loan_amount)}
                    </div>
                    <div className="text-sm text-gray-600">Requested Amount</div>
                  </div>
                  
                  {/* Purpose/Description */}
                  <div className="text-center md:text-left">
                    <h4 className="text-sm font-semibold text-gray-700 mb-1">Funding Purpose</h4>
                    <p className="text-gray-900 font-medium">{application.loan_purpose}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
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
            {renderDraftApplications()}
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