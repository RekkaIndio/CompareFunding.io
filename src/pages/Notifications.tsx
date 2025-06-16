import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { getDocuments, updateDocument, deleteDocument } from '@/firebase';
import { toast } from 'sonner';
import PageLayout from '@/components/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  CheckCheck,
  Clock,
  FileText,
  MessageSquare,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Trash2,
  ArrowRightCircle
} from 'lucide-react';

const Notifications = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  
  // Fetch notifications
  const { data: notifications, isLoading, refetch } = useQuery({
    queryKey: ['notifications', user?.uid],
    queryFn: async () => {
      const { data, error } = await getDocuments(
        'notifications',
        [{ field: 'user_id', operator: '==', value: user?.uid }],
        [{ field: 'created_at', direction: 'desc' }]
      );
      
      if (error) {
        toast.error('Failed to load notifications');
        throw error;
      }
      
      // Transform the data to ensure proper timestamp handling
      const transformedData = (data || []).map(notification => ({
        ...notification,
        created_at: notification.created_at || new Date().toISOString(),
        // Also handle other potential timestamp fields
        updated_at: notification.updated_at || notification.created_at || new Date().toISOString()
      }));
      
      return transformedData;
    },
    enabled: !!user?.uid,
  });

  // Mark notification as read
  const markAsRead = async (id) => {
    try {
      await updateDocument('notifications', id, { read: true });
      await refetch();
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to update notification');
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      // Firebase doesn't support bulk updates the same way as Supabase
      // We need to update each unread notification individually
      const unreadNotifications = notifications?.filter(n => !n.read) || [];
      
      // Create an array of promises for each update
      const updatePromises = unreadNotifications.map(notification => 
        updateDocument('notifications', notification.id, { read: true })
      );
      
      // Wait for all updates to complete
      await Promise.all(updatePromises);
      
      await refetch();
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to update notifications');
    }
  };

  // Delete notification
  const deleteNotification = async (id) => {
    try {
      await deleteDocument('notifications', id);
      await refetch();
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  // Filter notifications based on active tab
  const filteredNotifications = notifications?.filter(notification => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !notification.read;
    return notification.category === activeTab;
  });

  // Count unread notifications
  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  // Get icon based on notification category or type
  const getNotificationIcon = (notification) => {
    // Handle specific offer types first
    if (notification.type === 'offer_accepted') {
      return <CheckCircle className="h-6 w-6 text-green-500" />;
    }
    if (notification.type === 'offer_declined') {
      return <AlertCircle className="h-6 w-6 text-red-500" />;
    }
    
    // Fall back to category-based icons
    switch (notification.category) {
      case 'application':
        return <FileText className="h-6 w-6 text-blue-500" />;
      case 'offer':
      case 'offer_acceptance':
        return <MessageSquare className="h-6 w-6 text-green-500" />;
      case 'billing':
        return <CreditCard className="h-6 w-6 text-purple-500" />;
      case 'system':
        return <AlertCircle className="h-6 w-6 text-orange-500" />;
      default:
        return <Bell className="h-6 w-6 text-gray-500" />;
    }
  };

  // Format notification timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown time';
    
    let date;
    
    // Handle different timestamp formats
    if (timestamp && typeof timestamp.toDate === 'function') {
      // Firestore Timestamp object
      date = timestamp.toDate();
    } else if (timestamp && typeof timestamp.seconds === 'number') {
      // Firestore Timestamp-like object
      date = new Date(timestamp.seconds * 1000);
    } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
      // String or number timestamp
      date = new Date(timestamp);
    } else if (timestamp instanceof Date) {
      // Already a Date object
      date = timestamp;
    } else {
      // Fallback
      return 'Unknown time';
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Unknown time';
    }
    
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <PageLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="container px-6 py-8 mx-auto">
          {/* Enhanced Header Section */}
          <div className="relative bg-gradient-to-r from-[#212936] via-[#2a3441] to-[#212936] text-white rounded-2xl p-8 mb-8 shadow-2xl border border-slate-200/20 overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#ff8000] rounded-full -translate-y-32 translate-x-32 blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400 rounded-full translate-y-24 -translate-x-24 blur-3xl"></div>
            </div>
            
            <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-[#ff8000]/20 rounded-xl border border-[#ff8000]/30">
                    <Bell className="h-6 w-6 text-[#ff8000]" />
                  </div>
                  <div>
                    <h1 className="text-4xl lg:text-5xl font-bold mb-2 tracking-tight bg-gradient-to-r from-white to-gray-200 bg-clip-text">
                      Notifications
                    </h1>
                    <p className="text-gray-300 text-lg">
                      Stay updated on your business financing activities
                    </p>
                  </div>
                </div>
                
                {/* Quick Stats in Header */}
                <div className="flex flex-wrap gap-4 mt-6">
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/20">
                    <Bell className="h-4 w-4 text-blue-400" />
                    <span className="text-sm font-medium">
                      {notifications?.length || 0} Total
                    </span>
                  </div>
                  {unreadCount > 0 && (
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/20">
                      <AlertCircle className="h-4 w-4 text-[#ff8000]" />
                      <span className="text-sm font-medium">
                        {unreadCount} Unread
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                {unreadCount > 0 && (
                  <Button 
                    variant="outline" 
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20 flex items-center gap-2"
                    onClick={markAllAsRead}
                  >
                    <CheckCheck className="h-4 w-4" />
                    Mark All as Read
                  </Button>
                )}
              </div>
            </div>
          </div>
        
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
          <TabsList className="grid grid-cols-5 w-full md:w-auto bg-white/80 backdrop-blur-sm border border-slate-200">
            <TabsTrigger value="all" className="relative data-[state=active]:bg-[#ff8000] data-[state=active]:text-white">
              All
              {unreadCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-[#ff8000] text-white text-xs">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="unread" className="data-[state=active]:bg-[#ff8000] data-[state=active]:text-white">Unread</TabsTrigger>
            <TabsTrigger value="application" className="data-[state=active]:bg-[#ff8000] data-[state=active]:text-white">Applications</TabsTrigger>
            <TabsTrigger value="offer" className="data-[state=active]:bg-[#ff8000] data-[state=active]:text-white">Offers</TabsTrigger>
            <TabsTrigger value="system" className="data-[state=active]:bg-[#ff8000] data-[state=active]:text-white">System</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <Card className="bg-white/95 backdrop-blur-sm border-slate-200/50 shadow-xl rounded-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200/50">
            <CardTitle className="text-[#212936] flex items-center gap-2">
              <Bell className="h-5 w-5 text-[#ff8000]" />
              Your Notifications
            </CardTitle>
            <CardDescription className="text-slate-600">
              {activeTab === 'all' ? 'All notifications' : 
               activeTab === 'unread' ? 'Unread notifications' : 
               `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} notifications`}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6">
                <div className="space-y-6 animate-pulse">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-24 bg-slate-100 rounded-lg"></div>
                  ))}
                </div>
              </div>
            ) : filteredNotifications && filteredNotifications.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {filteredNotifications.map(notification => (
                  <div 
                    key={notification.id} 
                    className={`p-6 transition-all duration-200 hover:bg-slate-50/80 ${!notification.read ? 'bg-gradient-to-r from-blue-50/50 to-transparent border-l-4 border-l-[#ff8000]' : ''}`}
                  >
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className={`p-2 rounded-xl ${!notification.read ? 'bg-[#ff8000]/10' : 'bg-slate-100'}`}>
                          {getNotificationIcon(notification)}
                        </div>
                      </div>
                      <div className="flex-grow">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3">
                          <div className="font-semibold text-[#212936] flex items-center gap-2">
                            {notification.title}
                            {!notification.read && (
                              <Badge className="bg-[#ff8000] text-white text-xs px-2 py-1">New</Badge>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 flex items-center mt-1 sm:mt-0">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatTimestamp(notification.created_at)}
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                          {notification.message}
                        </p>
                        {/* Show decline reason if available for declined offers */}
                        {notification.type === 'offer_declined' && notification.decline_reason && notification.decline_reason !== 'No reason provided' && (
                          <div className="bg-gradient-to-r from-red-50 to-red-50/50 border border-red-200 rounded-xl p-4 mb-4">
                            <div className="flex items-start gap-3">
                              <div className="p-1 bg-red-100 rounded-lg">
                                <AlertCircle className="h-4 w-4 text-red-600" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-red-800 mb-1">Feedback from business:</p>
                                <p className="text-sm text-red-700">{notification.decline_reason}</p>
                              </div>
                            </div>
                          </div>
                        )}
                        <div className="flex justify-between items-center">
                          <div className="flex gap-2">
                            {notification.action_url && (
                              <Button 
                                size="sm" 
                                className="bg-[#ff8000] hover:bg-[#ff8000]/90 text-white h-8 flex items-center gap-1"
                                onClick={() => window.location.href = notification.action_url}
                              >
                                <ArrowRightCircle className="h-3.5 w-3.5" />
                                {notification.action_text || 'View Details'}
                              </Button>
                            )}
                            {!notification.read && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-8 flex items-center gap-1 border-slate-300 hover:bg-slate-50"
                                onClick={() => markAsRead(notification.id)}
                              >
                                <CheckCircle className="h-3.5 w-3.5" />
                                Mark as Read
                              </Button>
                            )}
                          </div>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                            onClick={() => deleteNotification(notification.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 px-6 text-center">
                <div className="bg-gradient-to-br from-[#212936] to-[#2c3c53] rounded-full p-8 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                  <Bell className="h-8 w-8 text-[#ff8000]" />
                </div>
                <h3 className="text-xl font-semibold text-[#212936] mb-3">No notifications</h3>
                <p className="text-slate-600 max-w-sm mx-auto mb-6 leading-relaxed">
                  {activeTab === 'all' 
                    ? "You don't have any notifications yet. We'll notify you when there's important updates about your applications." 
                    : activeTab === 'unread'
                    ? "You're all caught up! No unread notifications at this time."
                    : `You don't have any ${activeTab} notifications yet.`
                  }
                </p>
                {activeTab !== 'all' && (
                  <Button 
                    variant="outline"
                    onClick={() => setActiveTab('all')}
                    className="border-[#ff8000] text-[#ff8000] hover:bg-[#ff8000] hover:text-white"
                  >
                    View All Notifications
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </div>
    </PageLayout>
  );
};

export default Notifications;
