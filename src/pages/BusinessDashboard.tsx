import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { getDocument, getDocuments, createDocument, updateDocument, serverTimestamp, FirebaseQueryOperator } from '@/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import PageLayout from '@/components/PageLayout'; // Default import
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress'; // Added Progress import
import { toast } from '@/hooks/use-toast'; // Ensure toast is imported
import ApplicationCard from '@/components/ApplicationCard'; // Default import
import ConversationsUI from '@/components/ConversationsUI'; // Import ConversationsUI
import {
  LayoutDashboard, FileText, Briefcase, MessageCircle, PlusCircle, Info, Paperclip, Smile, Send,
  DollarSign, Users, FileCheck2, Bell, AlertTriangle, CheckCircle2, Clock, MessageSquare,
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
  const navigate = useNavigate();
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
            notificationsPromise
          ]);

          if (profileResult.data) setBusinessProfile(profileResult.data as BusinessProfile);
          if (applicationsResult.data) setApplications(applicationsResult.data as Application[]);
          if (offersResult.data) setOffers(offersResult.data as Offer[]);
          if (notificationsResult.data) setNotifications(notificationsResult.data as Notification[]);

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
          console.error("Error fetching dashboard data:", error);
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
      console.error('Error fetching conversations:', error);
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
      console.error('Error fetching messages:', error);
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
      console.error('Error sending message:', error);
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

    const overviewData = [
      {
        title: "Total Funding Secured",
        value: formatCurrency(totalFunding),
        subtitle: totalFunding > 0 ? `${applications.filter(app => app.status === 'approved').length} approved applications` : "No funding secured yet",
        icon: <DollarSign className="h-6 w-6 text-white" />,
        gradient: "from-emerald-500 to-emerald-600",
        trend: totalFunding > 0 ? "positive" : "neutral",
        bgOpacity: "opacity-20"
      },
      {
        title: "Active Applications",
        value: pendingApplications.toString(),
        subtitle: `${applications.length} total applications`,
        icon: <FileText className="h-6 w-6 text-white" />,
        gradient: "from-blue-500 to-blue-600",
        trend: pendingApplications > 0 ? "positive" : "neutral",
        bgOpacity: "opacity-20"
      },
      {
        title: "Pending Offers",
        value: activeOffers.toString(),
        subtitle: `${offers.length} total offers received`,
        icon: <Target className="h-6 w-6 text-white" />,
        gradient: "from-amber-500 to-amber-600",
        trend: activeOffers > 0 ? "positive" : "neutral",
        bgOpacity: "opacity-20"
      },
      {
        title: "Success Rate",
        value: `${approvalRate}%`,
        subtitle: applications.length > 0 ? `Based on ${applications.length} applications` : "No applications yet",
        icon: <TrendingUp className="h-6 w-6 text-white" />,
        gradient: "from-purple-500 to-purple-600",
        trend: approvalRate >= 50 ? "positive" : "neutral",
        bgOpacity: "opacity-20"
      },
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {overviewData.map((item, index) => (
          <div key={index} className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 p-6 relative overflow-hidden hover:shadow-xl transition-all duration-300">
            <div className={`absolute -top-6 -right-6 w-20 h-20 bg-gradient-to-br ${item.gradient} rounded-full ${item.bgOpacity}`}></div>
            <div className="absolute top-4 right-4">
              <div className={`p-2 bg-gradient-to-br ${item.gradient} rounded-lg shadow-md`}>
                {item.icon}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium text-slate-300">{item.title}</div>
              <div className="text-3xl font-bold text-white">{item.value}</div>
              <div className="flex items-center gap-2">
                <div className="text-sm text-slate-400">
                  {item.subtitle}
                </div>
                {item.trend === "positive" && <ArrowUpRight className="h-4 w-4 text-emerald-400" />}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderRecentActivity = () => {
    const recentActivities = applications
      .sort((a, b) => new Date(b.application_date as string).getTime() - new Date(a.application_date as string).getTime())
      .slice(0, 5)
      .map(app => ({
        id: app.id,
        type: app.loan_purpose,
        amount: app.loan_amount,
        date: new Date(app.application_date as string),
        status: app.status,
        company: app.company_name,
      }));

    const getStatusIcon = (status: string) => {
      switch (status) {
        case 'approved':
          return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
        case 'pending':
          return <Clock className="h-5 w-5 text-amber-500" />;
        case 'under_review':
          return <Eye className="h-5 w-5 text-blue-500" />;
        case 'rejected':
          return <AlertTriangle className="h-5 w-5 text-red-500" />;
        case 'offered':
          return <Star className="h-5 w-5 text-purple-500" />;
        default:
          return <FileText className="h-5 w-5 text-slate-500" />;
      }
    };

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'approved':
          return 'text-emerald-600 bg-emerald-50 border-emerald-200';
        case 'pending':
          return 'text-amber-600 bg-amber-50 border-amber-200';
        case 'under_review':
          return 'text-blue-600 bg-blue-50 border-blue-200';
        case 'rejected':
          return 'text-red-600 bg-red-50 border-red-200';
        case 'offered':
          return 'text-purple-600 bg-purple-50 border-purple-200';
        default:
          return 'text-slate-600 bg-slate-50 border-slate-200';
      }
    };

    if (recentActivities.length === 0) {
      return (
        <Card className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/50 overflow-hidden">
          <div className="bg-slate-800 px-6 py-4">
            <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </div>
          <CardContent className="p-8">
            <div className="text-center">
              <div className="mx-auto mb-4 p-4 bg-slate-100 rounded-full w-16 h-16 flex items-center justify-center">
                <FileText className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">No Recent Activity</h3>
              <p className="text-slate-500 mb-6">Start your funding journey by creating your first application</p>
              <Button 
                className="bg-gradient-to-r from-[#ff8800] to-[#ffaa00] hover:from-[#ff9900] hover:to-[#ffbb00] text-white font-semibold px-6 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                onClick={() => navigate('/new-application')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Application
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/50 overflow-hidden hover:shadow-xl transition-all duration-300">
        <div className="bg-slate-800 px-6 py-4 flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg px-3 py-2"
            onClick={() => navigate('/applications')}
          >
            View All
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100">
            {recentActivities.map((activity, index) => (
              <div 
                key={activity.id} 
                className="p-6 hover:bg-slate-50 transition-colors cursor-pointer group"
                onClick={() => navigate(`/applications/${activity.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-slate-200 transition-colors">
                      {getStatusIcon(activity.status)}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 text-lg">{activity.type}</div>
                      <div className="text-sm text-slate-500 mt-1">
                        {formatCurrency(activity.amount)} • {formatDistanceToNowStrict(activity.date, { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusColor(activity.status)}`}>
                      {activity.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                    <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };
  
  

  const renderProfileCompletionCard = () => {
    // This function is being replaced by renderNewApplicationCard
    return null;
  };

  const renderNewApplicationCard = () => {
    return (
      <Card className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/50 overflow-hidden">
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

  const renderApplicationJourney = () => {
    const displayedApplications = applications.sort((a,b) => new Date(b.application_date as string).getTime() - new Date(a.application_date as string).getTime()).slice(0, 3);

    return (
      <Card className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/50 overflow-hidden h-full flex flex-col">
        <div className="bg-slate-800 px-6 py-4">
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <Compass className="h-5 w-5" />
            Application Journey
          </CardTitle>
          <p className="text-sm text-slate-300 mt-1">Track your application progress</p>
        </div>
        <CardContent className="flex-grow p-6">
          {displayedApplications.length > 0 ? (
            <div className="space-y-4">
              {displayedApplications.map((app, index) => (
                <div key={app.id} className="group relative">
                  <div className="flex items-start gap-4 p-4 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer" onClick={() => navigate(`/applications/${app.id}`)}>
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                      app.status === 'approved' ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' : 
                      app.status === 'offered' ? 'bg-gradient-to-r from-purple-500 to-purple-600' :
                      app.status === 'under_review' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                      'bg-gradient-to-r from-amber-500 to-amber-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-slate-900 truncate" title={`Application #${app.id}`}>
                          Application #{app.id.substring(0, 8)}...
                        </h4>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                          app.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          app.status === 'offered' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                          app.status === 'under_review' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          app.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-slate-50 text-slate-700 border-slate-200'
                        }`}>
                          {app.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mb-1">
                        {format(new Date(app.application_date as string), 'MMM d, yyyy')} • {formatDistanceToNowStrict(new Date(app.application_date as string), { addSuffix: true })}
                      </p>
                      <p className="text-sm font-medium text-slate-700">
                        {formatCurrency(app.loan_amount)} for {app.loan_purpose}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-colors opacity-0 group-hover:opacity-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="mx-auto mb-4 p-3 bg-slate-100 rounded-full w-12 h-12 flex items-center justify-center">
                <FileText className="h-6 w-6 text-slate-400" />
              </div>
              <p className="text-slate-500 mb-4">No applications yet</p>
              <Button 
                variant="outline" 
                size="sm"
                className="border-[#ff8800] text-[#ff8800] hover:bg-[#ff8800] hover:text-white"
                onClick={() => navigate('/new-application')}
              >
                Create Application
              </Button>
            </div>
          )}
        </CardContent>
        {applications.length > 3 && (
          <div className="px-6 pb-6">
            <Button 
              variant="ghost" 
              className="w-full text-[#ff8800] hover:text-[#ff9900] hover:bg-orange-50 font-medium" 
              onClick={() => navigate('/applications')}
            >
              View All Applications
              <ArrowRight size={16} className="ml-2" />
            </Button>
          </div>
        )}
      </Card>
    );
  };

  const renderFundingOpportunities = () => {
    const opportunities = [
      { 
        title: 'Term Loans', 
        description: 'Best for long-term investments and growth opportunities with stable repayment terms.', 
        icon: <Landmark size={20} className="text-white" />, 
        linkText: 'Explore Options', 
        linkTo: '/new-application?type=term_loan',
        gradient: 'from-blue-500 to-blue-600',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-700'
      },
      { 
        title: 'Invoice Financing', 
        description: 'Unlock cash tied up in your unpaid invoices to improve cash flow and working capital.', 
        icon: <TrendingUp size={20} className="text-white" />, 
        linkText: 'Explore Options', 
        linkTo: '/new-application?type=invoice_financing',
        gradient: 'from-emerald-500 to-emerald-600',
        bgColor: 'bg-emerald-50',
        textColor: 'text-emerald-700'
      },
      { 
        title: 'Merchant Cash Advance', 
        description: 'Flexible funding based on your business card sales with repayments that scale with your revenue.', 
        icon: <Store size={20} className="text-white" />, 
        linkText: 'Explore Options', 
        linkTo: '/new-application?type=mca',
        gradient: 'from-purple-500 to-purple-600',
        bgColor: 'bg-purple-50',
        textColor: 'text-purple-700'
      },
    ];
    
    return (
      <Card className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/50 overflow-hidden h-full flex flex-col">
        <div className="bg-slate-800 px-6 py-4">
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Funding Opportunities
          </CardTitle>
          <p className="text-sm text-slate-300 mt-1">Financing options for your business</p>
        </div>
        <CardContent className="flex-grow p-6">
          <div className="space-y-4">
            {opportunities.map((op, index) => (
              <div 
                key={index} 
                className={`p-4 rounded-lg border border-slate-200 ${op.bgColor} hover:shadow-md transition-all duration-200 cursor-pointer group`}
                onClick={() => navigate(op.linkTo)}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className={`p-2 bg-gradient-to-r ${op.gradient} rounded-lg shadow-sm flex-shrink-0`}>
                    {op.icon}
                  </div>
                  <div className="flex-grow min-w-0">
                    <h4 className={`font-semibold ${op.textColor} text-base mb-1`}>{op.title}</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">{op.description}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className={`${op.textColor} hover:bg-white/50 font-medium p-0 h-auto`}
                  >
                    {op.linkText}
                    <ArrowRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <div className="px-6 pb-6">
          <Button 
            className="w-full bg-gradient-to-r from-[#ff8800] to-[#ffaa00] hover:from-[#ff9900] hover:to-[#ffbb00] text-white font-semibold py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-200" 
            onClick={() => navigate('/new-application')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Start New Application
          </Button>
        </div>
      </Card>
    );
  };

  const renderDocumentCenter = () => {
    // Define the required documents - matching the keys from DOCUMENT_STEPS in Business/Documents.tsx
    const requiredDocs = [
      { 
        id: 'pl', 
        name: 'Profit and Loss', 
        description: 'Last 12 months of P&L statement', 
        icon: <FileText size={18} className="text-white" />,
        gradient: 'from-blue-500 to-blue-600'
      },
      { 
        id: 'bs', 
        name: 'Balance Sheet', 
        description: 'Current financial position', 
        icon: <BarChartHorizontalBig size={18} className="text-white" />,
        gradient: 'from-emerald-500 to-emerald-600'
      },
      { 
        id: 'tb', 
        name: 'Trial Balance', 
        description: 'Detailed financial snapshot', 
        icon: <ClipboardList size={18} className="text-white" />,
        gradient: 'from-purple-500 to-purple-600'
      },
      { 
        id: 'ar', 
        name: 'Aged Receivables', 
        description: 'Outstanding customer payments', 
        icon: <Users size={18} className="text-white" />,
        gradient: 'from-amber-500 to-amber-600'
      },
      { 
        id: 'ap', 
        name: 'Aged Payables', 
        description: 'Outstanding vendor invoices', 
        icon: <FileSignature size={18} className="text-white" />,
        gradient: 'from-red-500 to-red-600'
      },
    ];
    
    // Map required documents to their status based on uploaded documents
    const documentsStatus = requiredDocs.map(doc => ({
      ...doc,
      status: uploadedDocuments.includes(doc.id) ? 'uploaded' : 'pending'
    }));
    
    const uploadedCount = uploadedDocuments.length;
    const totalCount = requiredDocs.length;

    return (
      <Card className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/50 overflow-hidden h-full flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <div className="bg-slate-800 p-2 rounded-md">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800">Document Center</h3>
          </div>
          <div className="text-2xl font-bold text-slate-800">{uploadedCount}/{totalCount}</div>
        </div>
        <div className="p-5">
          <p className="text-slate-600 text-sm mb-4">Secure document management</p>
          
          <div className="space-y-4">
            {requiredDocs.map((doc, index) => (
              <div key={doc.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-md bg-gradient-to-br ${doc.gradient}`}>
                    {doc.icon}
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-800">{doc.name}</h4>
                    <p className="text-xs text-slate-500">{doc.description}</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="bg-orange-50 hover:bg-orange-100 text-orange-600 flex items-center" 
                  onClick={() => navigate('/business/documents')}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Upload
                </Button>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-auto p-5 border-t border-slate-200">
          <Button 
            variant="outline" 
            className="w-full bg-slate-800 text-white hover:bg-slate-700 flex items-center justify-center"
            onClick={() => navigate('/business/documents')}
          >
            <Upload className="h-4 w-4 mr-2" />
            Manage All Documents
          </Button>
        </div>
      </Card>
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
              <div className="flex items-center gap-4">
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="lg:col-span-2">
                {renderRecentActivity()}
              </div>
              <div className="lg:col-span-1">
                {renderNewApplicationCard()}
              </div>
            </div>
            {/* Application Journey, Funding Opportunities, and Document Center sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 w-full">
              <div className="md:col-span-1 lg:col-span-1 w-full">
                {renderApplicationJourney()}
              </div>
              <div className="md:col-span-1 lg:col-span-1 w-full">
                {renderFundingOpportunities()}
              </div>
              <div className="md:col-span-2 lg:col-span-1 w-full"> 
                {renderDocumentCenter()}
              </div>
            </div>
          </div>

        </div>
        
      </div>
    </PageLayout>
  );
};

export default BusinessDashboard;