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
      
      return data || [];
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

  // Get icon based on notification category
  const getNotificationIcon = (category) => {
    switch (category) {
      case 'application':
        return <FileText className="h-6 w-6 text-blue-500" />;
      case 'offer':
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
    const date = new Date(timestamp);
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
      <div className="container py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Notifications</h1>
            <p className="text-muted-foreground">
              Stay updated on your business financing activities
            </p>
          </div>
          
          {unreadCount > 0 && (
            <Button 
              variant="outline" 
              className="mt-4 md:mt-0 flex items-center gap-2"
              onClick={markAllAsRead}
            >
              <CheckCheck className="h-4 w-4" />
              Mark All as Read
            </Button>
          )}
        </div>
        
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
          <TabsList className="grid grid-cols-5 w-full md:w-auto">
            <TabsTrigger value="all" className="relative">
              All
              {unreadCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-fundhub-blue">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="unread">Unread</TabsTrigger>
            <TabsTrigger value="application">Applications</TabsTrigger>
            <TabsTrigger value="offer">Offers</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <Card>
          <CardHeader>
            <CardTitle>Your Notifications</CardTitle>
            <CardDescription>
              {activeTab === 'all' ? 'All notifications' : 
               activeTab === 'unread' ? 'Unread notifications' : 
               `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} notifications`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-6 animate-pulse">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-24 bg-gray-100 rounded-lg"></div>
                ))}
              </div>
            ) : filteredNotifications && filteredNotifications.length > 0 ? (
              <div className="space-y-4">
                {filteredNotifications.map(notification => (
                  <div 
                    key={notification.id} 
                    className={`border rounded-lg p-4 transition-colors ${!notification.read ? 'bg-gray-50' : ''}`}
                  >
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        {getNotificationIcon(notification.category)}
                      </div>
                      <div className="flex-grow">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-1">
                          <div className="font-medium text-md">
                            {notification.title}
                            {!notification.read && (
                              <Badge className="ml-2 bg-fundhub-blue">New</Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center mt-1 sm:mt-0">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatTimestamp(notification.created_at)}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          {notification.message}
                        </p>
                        <div className="flex justify-between items-center">
                          <div className="flex gap-2">
                            {notification.action_url && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-8 flex items-center gap-1"
                                onClick={() => window.location.href = notification.action_url}
                              >
                                <ArrowRightCircle className="h-3.5 w-3.5" />
                                {notification.action_text || 'View Details'}
                              </Button>
                            )}
                            {!notification.read && (
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-8 flex items-center gap-1"
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
                            className="h-8 w-8 p-0"
                            onClick={() => deleteNotification(notification.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-gray-500" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <Bell className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium">No notifications</h3>
                <p className="text-muted-foreground max-w-sm mx-auto mb-4">
                  {activeTab === 'all' 
                    ? "You don't have any notifications yet." 
                    : activeTab === 'unread'
                    ? "You're all caught up! No unread notifications."
                    : `You don't have any ${activeTab} notifications.`
                  }
                </p>
                {activeTab !== 'all' && (
                  <Button 
                    variant="outline"
                    onClick={() => setActiveTab('all')}
                  >
                    View All Notifications
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default Notifications;
