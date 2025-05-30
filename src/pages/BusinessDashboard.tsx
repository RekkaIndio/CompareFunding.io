import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { getDocument, getDocuments, createDocument, updateDocument, serverTimestamp, FirebaseQueryOperator } from '@/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import PageLayout from '@/components/PageLayout'; // Default import
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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
  TrendingUp, Landmark, Store, BarChartHorizontalBig, ClipboardList, FileSignature, Upload // Added new icons
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
  const [activeTab, setActiveTab] = useState('overview');
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [overallDashboardLoading, setOverallDashboardLoading] = useState(true);

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

    const newApplicationsThisWeek = applications.filter(app => {
      const appDate = new Date(app.application_date as string);
      const today = new Date();
      const oneWeekAgo = new Date(new Date().setDate(today.getDate() - 7)); // Ensure new Date object for oneWeekAgo
      return appDate >= oneWeekAgo;
    }).length;

    const approvalRate = applications.length > 0 
      ? Math.round(applications.filter(app => app.status === 'approved').length / applications.length * 100)
      : 0;

    const overviewData = [
      {
        title: "Total Funding",
        value: formatCurrency(totalFunding),
        // Subtitle needs real data, using placeholder
        subtitle: "+12.4% vs last month", 
        icon: <span className="text-3xl">£</span>, // Using text for pound symbol
        iconBg: "bg-gray-100",
        trendColor: "text-green-500",
      },
      {
        title: "Applications",
        value: applications.length.toString(),
        subtitle: `+${newApplicationsThisWeek} new this week`,
        icon: <BarChart3 size={24} />,
        iconBg: "bg-gray-100",
        trendColor: "text-green-500",
      },
      {
        title: "Approval Rate",
        value: `${approvalRate}%`,
        // Subtitle needs real data, using placeholder
        subtitle: "+7% vs industry avg", 
        icon: <CheckCircle2 size={24} />,
        iconBg: "bg-green-500", // Green background for the icon as in screenshot
        trendColor: "text-green-500",
      },
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {overviewData.map((item, index) => (
          <Card key={index} className="bg-white border-gray-200 shadow-md rounded-xl p-0">
            <div className="bg-[#1c2127] rounded-t-xl px-6 py-4 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-white m-0 p-0">{item.title}</CardTitle>
              <div className={`p-2 rounded-md ${item.iconBg}`}> 
                {React.cloneElement(item.icon, { className: "text-slate-100"})}
              </div>
            </div>
            <CardContent className="p-6">
              <div className="text-4xl font-bold text-gray-800 py-2">{item.value}</div>
              <p className={`text-xs ${item.trendColor} flex items-center`}>
                <ArrowRight size={12} className="mr-1 transform rotate-[-45deg]" />
                {item.subtitle}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderRecentActivity = () => {
    const recentActivities = applications.slice(0, 3).map(app => ({
      id: app.id,
      type: app.loan_purpose,
      source: app.company_name, // Or a lender name if available post-matching
      time: formatDistanceToNowStrict(new Date(app.application_date as string), { addSuffix: true }),
      amount: app.loan_amount,
      status: app.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      icon: <Archive size={20} className="text-gray-600" /> // Generic icon
    }));

    if (recentActivities.length === 0) {
      return (
        <div className="bg-white border-gray-200 shadow-md rounded-xl p-6 text-center">
          <p className="text-gray-500">No recent funding activity.</p>
        </div>
      );
    }

    return (
      <Card className="bg-white border-gray-200 shadow-md rounded-xl mb-8">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div className="flex items-center">
            <FileClock size={20} className="text-gray-600 mr-3" />
            <CardTitle className="text-lg font-semibold text-gray-800">Recent Funding Activity</CardTitle>
          </div>
          <Button variant="link" className="text-[#ff8800] hover:text-[#ffaa00] px-0" onClick={() => setActiveTab('applications')}>
            View All <ArrowRight size={16} className="ml-1" />
          </Button>
        </CardHeader>
        <CardContent className="divide-y divide-slate-700 p-0">
          {recentActivities.map((activity) => (
            <div key={activity.id} className="flex items-center justify-between p-4 hover:bg-gray-100/50 transition-colors">
              <div className="flex items-center">
                <div className="p-3 bg-gray-100 rounded-lg mr-4">
                  {activity.icon}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{activity.type}</p>
                  <p className="text-xs text-gray-500">{activity.source} • {activity.time}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-800">{formatCurrency(activity.amount)}</p>
                <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                  activity.status === 'Approved' ? 'bg-green-600 text-gray-800' :
                  activity.status === 'Pending' || activity.status === 'Under Review' ? 'bg-yellow-500 text-slate-900' :
                  activity.status === 'Rejected' ? 'bg-red-600 text-gray-800' :
                  'bg-gray-200 text-gray-600'
                }`}>
                  {activity.status}
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  };
  
  const renderBottomActions = () => {
    const unreadNotificationsCount = notifications.filter(n => !n.read).length;

    return (
      <div className="fixed bottom-0 left-0 right-0 lg:relative p-4 bg-white lg:bg-transparent lg:p-0 border-t border-gray-200 lg:border-t-0 flex items-center justify-around lg:justify-start lg:space-x-4 mt-auto">
        <Button className="bg-[#ff8800] hover:bg-[#ffaa00] text-white font-semibold py-3 px-6 rounded-lg flex-grow lg:flex-grow-0" onClick={() => navigate('/new-application')}>
          <Plus size={20} className="mr-2" />
          New Application
        </Button>
        <div className="flex items-center space-x-2 lg:space-x-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="text-gray-500 hover:text-[#ff8800] hover:bg-gray-100 relative" onClick={() => navigate('/notifications')}>
                  <Bell size={22} />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute top-0 right-0 block h-4 w-4 transform -translate-y-1/2 translate-x-1/2 rounded-full bg-red-500 text-gray-800 text-[10px] flex items-center justify-center">
                      {unreadNotificationsCount}
                    </span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-white text-gray-800 border-gray-200">
                <p>Notifications</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="text-gray-500 hover:text-[#ff8800] hover:bg-gray-100 relative" onClick={() => setActiveTab('messages')}>
                  <MessageSquare size={22} />
                  {totalUnreadMessages > 0 && (
                     <span className="absolute top-0 right-0 block h-4 w-4 transform -translate-y-1/2 translate-x-1/2 rounded-full bg-[#ff8800] text-gray-800 text-[10px] flex items-center justify-center">
                       {totalUnreadMessages}
                     </span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-white text-gray-800 border-gray-200">
                <p>Messages</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="text-gray-500 hover:text-[#ff8800] hover:bg-gray-100" onClick={() => navigate('/settings')}>
                  <Settings size={22} />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-white text-gray-800 border-gray-200">
                <p>Settings</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    );
  };

  const renderProfileCompletionCard = () => {
    if (!businessProfile) return null;
    const percentage = getProfileCompletionPercentage();
    return (
      <Card className="bg-white border-gray-200 shadow-md rounded-xl">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-800">Complete Your Profile</CardTitle>
          <CardDescription className="text-gray-500">
            A complete profile helps us match you with the best funding options.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={percentage} className="w-full [&>div]:bg-[#ff8800]" />
          <p className="text-sm text-gray-600 mt-2">{percentage}% complete</p>
        </CardContent>
        <CardContent className="pt-0">
           <Button className="w-full bg-[#ff8800] hover:bg-[#ffaa00] text-white" onClick={() => setActiveTab('profile')}>
            Go to Profile <ArrowRight size={16} className="ml-2" />
          </Button>
        </CardContent>
      </Card>
    );
  };

  const renderApplicationJourney = () => {
    const displayedApplications = applications.sort((a,b) => new Date(b.application_date as string).getTime() - new Date(a.application_date as string).getTime()).slice(0, 2);

    return (
      <Card className="bg-white border-gray-200 shadow-md rounded-xl w-full h-full flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-gray-800 text-xl">Application Journey</CardTitle>
              <CardDescription className="text-gray-500">Track your application progress</CardDescription>
            </div>
            <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-800">
              <Info size={18} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2.5 flex-grow px-4">
          {displayedApplications.length > 0 ? displayedApplications.map((app, index) => (
            <div key={app.id} className="p-3 bg-gray-100 rounded-lg border border-gray-200">
              <div className="flex items-start space-x-3">
                <div className={`flex-shrink-0 h-7 w-7 rounded-full text-gray-800 flex items-center justify-center text-sm font-bold ${app.status === 'approved' ? 'bg-green-500' : 'bg-[#ff8800]'}`}>
                  {index + 1}
                </div>
                <div className="flex-grow min-w-0">
                  <div className="flex justify-between items-center mb-1 gap-2">
                    <p className="text-sm font-semibold text-gray-800 truncate" title={`Application #${app.id}`}>
                      Application #{app.id.substring(0, 8)}...
                    </p>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full shrink-0 ${
                      app.status === 'approved' ? 'bg-green-500 text-gray-800' :
                      app.status === 'submitted' ? 'bg-blue-500 text-gray-800' :
                      app.status === 'documents_requested' ? 'bg-yellow-500 text-slate-900' :
                      app.status === 'offered' ? 'bg-[#ff8800] text-gray-800' :
                      app.status === 'pending' || app.status === 'under_review' ? 'bg-blue-500 text-gray-800' :
                      'bg-gray-200 text-gray-600'
                    }`}>
                      {app.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-1">
                    {format(new Date(app.application_date as string), 'PP')} ({formatDistanceToNowStrict(new Date(app.application_date as string), { addSuffix: true })})
                  </p>
                  <p className="text-xs text-gray-600 truncate" title={`${formatCurrency(app.loan_amount)} for ${app.loan_purpose}`}>
                    {formatCurrency(app.loan_amount)} for {app.loan_purpose}
                  </p>
                </div>
              </div>
            </div>
          )) : (
            <p className="text-gray-500 text-center py-4">No recent applications to display.</p>
          )}
        </CardContent>
        {applications.length > 0 && (
            <CardFooter className='pt-0 pb-4 px-4'>
                <Button variant="link" className="text-[#ff8800] hover:text-[#ffaa00] px-0 w-full justify-center text-sm" onClick={() => setActiveTab('applications')}>
                  View All Applications <ArrowRight size={16} className="ml-1" />
                </Button>
            </CardFooter>
        )}
      </Card>
    );
  };

  const renderFundingOpportunities = () => {
    const opportunities = [
      { 
        title: 'Term Loans', 
        description: 'Best for long-term investments and growth opportunities with stable repayment terms.', 
        icon: <Landmark size={20} className="text-[#ff8800]" />, 
        linkText: 'Explore Options', 
        linkTo: '/new-application?type=term_loan' 
      },
      { 
        title: 'Invoice Financing', 
        description: 'Unlock cash tied up in your unpaid invoices to improve cash flow and working capital.', 
        icon: <TrendingUp size={20} className="text-[#ff8800]" />, 
        linkText: 'Explore Options', 
        linkTo: '/new-application?type=invoice_financing' 
      },
      { 
        title: 'Merchant Cash Advance', 
        description: 'Flexible funding based on your business card sales with repayments that scale with your revenue.', 
        icon: <Store size={20} className="text-[#ff8800]" />, 
        linkText: 'Explore Options', 
        linkTo: '/new-application?type=mca' 
      },
    ];
    return (
      <Card className="bg-white border-gray-200 shadow-md rounded-xl w-full h-full flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="text-gray-800 text-xl">Funding Opportunities</CardTitle>
          <CardDescription className="text-gray-500">Financing options for your business</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2.5 flex-grow px-4">
          {opportunities.map((op, index) => (
            <div key={index} className="p-3 bg-gray-100 rounded-lg border border-gray-200">
              <div className="flex items-center space-x-3 mb-1">
                <div className="p-1.5 bg-gray-200 rounded-md flex-shrink-0">{op.icon}</div>
                <h4 className="font-semibold text-gray-800 text-sm">{op.title}</h4>
              </div>
              <p className="text-xs text-gray-600 mb-1.5 line-clamp-2 min-w-0">{op.description}</p>
              <Button variant="link" className="text-[#ff8800] hover:text-[#ffaa00] p-0 h-auto text-xs" onClick={() => navigate(op.linkTo)}>
                {op.linkText} <ArrowRight size={14} className="ml-1" />
              </Button>
            </div>
          ))}
        </CardContent>
        <CardFooter className='pt-0 pb-4 px-4'>
          <Button variant="link" className="text-[#ff8800] hover:text-[#ffaa00] px-0 w-full justify-center text-sm" onClick={() => navigate('/new-application')}>
            Explore All Options <ArrowRight size={16} className="ml-1" />
          </Button>
        </CardFooter>
      </Card>
    );
  };

  const renderDocumentCenter = () => {
    // Define the required documents
    const requiredDocs = [
      { id: 'pl', name: 'Profit and Loss', description: 'Last 12 months of P&L statement', icon: <FileText size={18} className="text-gray-600" /> },
      { id: 'bs', name: 'Balance Sheet', description: 'Current financial position', icon: <BarChartHorizontalBig size={18} className="text-gray-600" /> },
      { id: 'tb', name: 'Trial Balance', description: 'Detailed financial snapshot', icon: <ClipboardList size={18} className="text-gray-600" /> },
      { id: 'ar', name: 'Aged Receivables', description: 'Outstanding customer payments', icon: <Users size={18} className="text-gray-600" /> },
      { id: 'ap', name: 'Aged Payables', description: 'Outstanding vendor invoices', icon: <FileSignature size={18} className="text-gray-600" /> },
    ];
    
    // Safely handle documents which might not exist in the businessProfile
    const uploadedDocumentNames: string[] = [];
    if (businessProfile && 'documents' in businessProfile) {
      const documents = businessProfile.documents as Array<{name: string, url: string}> | undefined;
      if (documents && Array.isArray(documents)) {
        documents.forEach(doc => {
          if (doc && doc.name) {
            uploadedDocumentNames.push(doc.name.toLowerCase());
          }
        });
      }
    }
    
    const documentsStatus = requiredDocs.map(doc => ({
      ...doc,
      status: uploadedDocumentNames.includes(doc.name.toLowerCase()) ? 'uploaded' : 'pending'
    }));
    
    const uploadedCount = documentsStatus.filter(d => d.status === 'uploaded').length;
    const totalCount = documentsStatus.length;

    return (
      <Card className="bg-white border-gray-200 shadow-md rounded-xl w-full h-full flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-gray-800 text-xl">Document Center</CardTitle>
              <CardDescription className="text-gray-500">Track your document upload status</CardDescription>
            </div>
            <p className="text-gray-600 font-semibold">{uploadedCount}/{totalCount}</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-2.5 flex-grow overflow-y-auto px-4">
          {documentsStatus.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-100 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-2.5 min-w-0 flex-grow">
                <div className="p-1.5 bg-gray-200 rounded-md flex-shrink-0">{doc.icon}</div>
                <div className="flex-grow min-w-0">
                  <p className="font-medium text-gray-800 text-sm truncate" title={doc.name}>{doc.name}</p>
                  <p className="text-xs text-gray-500 truncate" title={doc.description}>{doc.description}</p>
                </div>
              </div>
              <Button 
                size="sm" 
                className={`text-xs whitespace-nowrap ml-2 shrink-0 ${doc.status === 'uploaded' ? 'bg-green-600 hover:bg-green-700' : 'bg-[#ff8800] hover:bg-[#ffaa00]'} text-gray-800`}
                onClick={() => setActiveTab('profile')} // Navigate to profile tab for upload
              >
                {doc.status === 'uploaded' ? 'View' : 'Upload'} <Upload size={12} className="ml-1.5" />
              </Button>
            </div>
          ))}
        </CardContent>
        <CardFooter className='pt-2 px-4'>
          <Button className="w-full bg-gray-200 hover:bg-slate-500 text-gray-800" onClick={() => setActiveTab('profile')}>
            Upload All Documents <ArrowRight size={16} className="ml-2" />
          </Button>
        </CardFooter>
      </Card>
    );
  };


  // Main component return
  if (overallDashboardLoading) {
    return (
      <PageLayout>
        <div className="flex justify-center items-center h-screen bg-white">
          <Loader2 className="h-12 w-12 animate-spin text-[#ff8800]" />
        </div>
      </PageLayout>
    );
  }
  
  const userInitials = user?.displayName?.split(' ').map(n => n[0]).join('').toUpperCase() || user?.email?.substring(0, 2).toUpperCase() || 'U';

  return (
    <PageLayout>
      <div className="bg-white text-gray-800 min-h-screen p-4 md:p-6 lg:p-8">
        {/* Custom Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8">
          <div>
            {/* The "traffic lights" are OS-level, not part of the component. */}
            {/* <div className="flex space-x-2 mb-2 md:mb-0">
              <span className="h-3 w-3 bg-red-500 rounded-full"></span>
              <span className="h-3 w-3 bg-yellow-500 rounded-full"></span>
              <span className="h-3 w-3 bg-green-500 rounded-full"></span>
            </div> */}
            <h1 className="text-3xl font-bold text-gray-800"></h1>
          </div>
          <div className="flex items-center space-x-3 mt-4 md:mt-0">
            <Avatar className="h-10 w-10">
              <AvatarImage src={businessProfile?.avatar_url || undefined} />
              <AvatarFallback className="bg-[#ff8800] text-white font-semibold">
                {userInitials}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 bg-white p-1 rounded-lg mb-6">
            {['overview', 'applications', 'offers', 'messages', 'profile'].map((tabName) => (
              <TabsTrigger
                key={tabName}
                value={tabName}
                className="capitalize data-[state=active]:bg-[#ff8800] data-[state=active]:text-white data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:bg-gray-100 data-[state=inactive]:hover:text-gray-800 rounded-md px-3 py-2 text-sm font-medium transition-all"
              >
                {tabName}
                {tabName === 'messages' && totalUnreadMessages > 0 && (
                  <span className="ml-2 bg-white text-[#ff8800] text-xs font-bold px-1.5 py-0.5 rounded-full">
                    {totalUnreadMessages}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview" className="outline-none">
            {renderOverviewCards()}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-2">
                {renderRecentActivity()}
              </div>
              <div className="lg:col-span-1">
                {renderProfileCompletionCard()}
              </div>
            </div>
            {/* Application Journey, Funding Opportunities, and Document Center sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-3 mb-8 w-full">
              <div className="md:col-span-1 lg:col-span-1 w-full h-full">
                {renderApplicationJourney()}
              </div>
              <div className="md:col-span-1 lg:col-span-1 w-full h-full">
                {renderFundingOpportunities()}
              </div>
              <div className="md:col-span-2 lg:col-span-1 w-full h-full"> 
                {renderDocumentCenter()}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="applications">
            <Card className="bg-white border-gray-200 shadow-md rounded-xl">
              <CardHeader>
                <CardTitle className="text-gray-800">My Applications</CardTitle>
                <CardDescription className="text-gray-500">View and manage your funding applications.</CardDescription>
              </CardHeader>
              <CardContent>
                {applications.length > 0 ? (
                  applications.map(app => (
                    <ApplicationCard 
                      key={app.id} 
                      id={app.id}
                      amount={app.loan_amount}
                      purpose={app.loan_purpose}
                      status={app.status}
                      dateApplied={typeof app.application_date === 'string' ? app.application_date : format(new Date(app.application_date), 'yyyy-MM-dd')}
                      className="mb-4 bg-gray-100 border-slate-600 text-gray-800" 
                      business_name={app.company_name} 
                    />
                  ))
                ) : (
                  <p className="text-gray-500">No applications submitted yet.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="offers">
            <Card className="bg-white border-gray-200 shadow-md rounded-xl">
              <CardHeader><CardTitle className="text-gray-800">My Offers</CardTitle></CardHeader>
              <CardContent>
                {offers.length > 0 ? (
                  offers.map(offer => (
                    <div key={offer.id} className="p-3 bg-gray-100 rounded-md mb-2 text-gray-600">
                      Offer for {formatCurrency(offer.offer_amount)} from {offer.lender_name || 'a lender'} - Status: {offer.status}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No offers received yet.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages">
            <Card className="bg-white border-gray-200 shadow-md rounded-xl min-h-[calc(100vh-200px)] md:min-h-[500px] flex flex-col">
              <CardHeader>
                <CardTitle className="text-gray-800">Conversations</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow p-0">
                {user?.uid ? (
                  <ConversationsUI
                    conversations={conversations}
                    initialSelectedConversation={initialSelectedConvoForUI}
                    initialMessages={initialMessagesForUI}
                    currentUserId={user.uid}
                    onSendMessage={handleSendMessage}
                    onFetchMessages={handleFetchMessages}
                    isLoadingConversations={isLoadingConversations}
                    isLoadingMessages={isLoadingMessagesForSelectedConvo}
                  />
                ) : (
                  <p className="text-gray-500 text-center py-10">Please log in to view messages.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile">
            <Card className="bg-white border-gray-200 shadow-md rounded-xl">
              <CardHeader><CardTitle className="text-gray-800">Business Profile</CardTitle></CardHeader>
              <CardContent>
                {businessProfile ? (
                  Object.entries(businessProfile).map(([key, value]) => (
                    <p key={key} className="text-gray-600"><strong>{key}:</strong> {String(value)}</p>
                  ))
                ) : (
                  <p className="text-gray-500">Profile not loaded.</p>
                )}
                 <Button className="mt-4 bg-[#ff8800] hover:bg-[#ffaa00] text-white" onClick={() => navigate('/business-profile')}>
                  Edit Profile <Edit3 size={16} className="ml-2" />
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        {activeTab === 'overview' && <div className="mt-8 hidden lg:block">{renderBottomActions()}</div>}
      </div>
      {activeTab === 'overview' && <div className="lg:hidden">{renderBottomActions()}</div>}
    </PageLayout>
  );
};

export default BusinessDashboard;