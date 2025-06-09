import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import ConversationsUI from '@/components/ConversationsUI';

interface MessagingCardProps {
  conversation: any;
  messages: any[];
  isLender: boolean;
  onSendMessage: (applicationId: string, recipientId: string, content: string) => Promise<void>;
}

export const MessagingCard: React.FC<MessagingCardProps> = ({
  conversation,
  messages,
  isLender,
  onSendMessage
}) => {
  const handleFetchMessages = async (conversationId: string, applicationId: string, lenderId: string) => {
    return messages || [];
  };

  return (
    <Card className="bg-white/95 backdrop-blur-sm border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl" data-messaging="true">
      <CardHeader className="bg-gradient-to-br from-[#212936] to-[#2c3c53] text-white rounded-t-xl">
        <CardTitle className="text-white">
          💬 Direct Communication
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-96">
          <ConversationsUI
            conversations={[conversation]}
            initialSelectedConversation={conversation}
            initialMessages={messages}
            currentUserId={conversation?.userId || ''}
            userRole={isLender ? 'lender' : 'business'}
            onSendMessage={onSendMessage}
            onFetchMessages={handleFetchMessages}
            isLoadingConversations={false}
            isLoadingMessages={false}
          />
        </div>
      </CardContent>
    </Card>
  );
};
