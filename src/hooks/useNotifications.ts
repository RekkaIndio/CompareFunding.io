import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { getDocuments } from '@/firebase';

export interface NotificationCounts {
  unreadNotifications: number;
  unreadMessages: number;
  hasNewOffers: boolean;
  hasNewMessages: boolean;
}

export const useNotifications = () => {
  const { user } = useAuth();

  // Fetch unread notifications
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      
      console.log('Fetching notifications for user:', user.uid);
      
      const { data, error } = await getDocuments(
        'notifications',
        [
          { field: 'user_id', operator: '==', value: user.uid },
          { field: 'read', operator: '==', value: false }
        ],
        [{ field: 'created_at', direction: 'desc' }]
      );
      
      if (error) {
        console.error('Error fetching notifications:', error);
        return [];
      }
      
      console.log('Fetched notifications:', data);
      return data || [];
    },
    enabled: !!user?.uid,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch unread messages
  const { data: messages = [] } = useQuery({
    queryKey: ['unread_messages', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      
      const { data, error } = await getDocuments(
        'messages',
        [
          { field: 'recipient_id', operator: '==', value: user.uid },
          { field: 'read', operator: '==', value: false }
        ],
        [{ field: 'sent_at', direction: 'desc' }]
      );
      
      if (error) {
        console.error('Error fetching unread messages:', error);
        return [];
      }
      
      return data || [];
    },
    enabled: !!user?.uid,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Process notification counts
  const unreadNotifications = notifications.length;
  const unreadMessages = messages.length;
  
  // Check for specific types of notifications
  const hasNewOffers = notifications.some(
    (notif: any) => notif.type === 'new_offer' || notif.category === 'offer'
  );
  
  const hasNewMessages = unreadMessages > 0;

  console.log('Notification counts:', {
    unreadNotifications,
    unreadMessages,
    hasNewOffers,
    hasNewMessages,
    notifications: notifications.map(n => ({ type: n.type, category: n.category, created_at: n.created_at }))
  });

  return {
    unreadNotifications,
    unreadMessages,
    hasNewOffers,
    hasNewMessages,
    notifications,
    messages,
  };
};
