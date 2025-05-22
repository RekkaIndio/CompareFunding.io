import React, { useState, useEffect, useRef } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Paperclip, Send, Smile, Loader2, MessageCircle } from 'lucide-react';
import { format, formatDistanceToNowStrict } from 'date-fns';

interface Conversation {
  id: string;
  userId: string;
  lenderId: string;
  lenderName: string;
  lenderAvatar: string;
  applicationId: string;
  applicationPurpose: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
}

interface Message {
  id: string;
  application_id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  sent_at: Date;
  read: boolean;
}

interface ConversationsUIProps {
  conversations: Conversation[];
  initialSelectedConversation: Conversation | null;
  initialMessages: Message[];
  currentUserId: string;
  onSendMessage: (applicationId: string, recipientId: string, content: string) => Promise<void>;
  onFetchMessages: (conversationId: string, applicationId: string, lenderId: string) => Promise<Message[]>;
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
}

const ConversationsUI: React.FC<ConversationsUIProps> = ({
  conversations,
  initialSelectedConversation,
  initialMessages,
  currentUserId,
  onSendMessage,
  onFetchMessages,
  isLoadingConversations,
  isLoadingMessages: initialIsLoadingMessages,
}) => {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(initialSelectedConversation);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [isLoadingMessages, setIsLoadingMessages] = useState(initialIsLoadingMessages);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    setSelectedConversation(initialSelectedConversation);
    setMessages(initialMessages);
  }, [initialSelectedConversation, initialMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectConversation = async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setIsLoadingMessages(true);
    try {
      const fetchedMessages = await onFetchMessages(conversation.id, conversation.applicationId, conversation.lenderId);
      setMessages(fetchedMessages);
    } catch (error) {
      console.error('Error fetching messages for selected conversation:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;
    try {
      await onSendMessage(selectedConversation.applicationId, selectedConversation.lenderId, newMessage.trim());
      const tempMessage: Message = {
        id: Date.now().toString(),
        application_id: selectedConversation.applicationId,
        sender_id: currentUserId,
        recipient_id: selectedConversation.lenderId,
        content: newMessage.trim(),
        sent_at: new Date(),
        read: false,
      };
      setMessages(prev => [...prev, tempMessage]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (isLoadingConversations) {
    return (
      <div className="flex justify-center items-center h-full min-h-[400px]">
        <Loader2 className="h-10 w-10 animate-spin text-[#ff8800]" />
        <p className="ml-2 text-slate-400">Loading conversations...</p>
      </div>
    );
  }

  if (!conversations || conversations.length === 0) {
    return <p className="text-center text-slate-400 py-10">No conversations yet.</p>;
  }

  return (
    <div className="flex h-[calc(100vh-250px)] md:h-[500px] text-white bg-slate-800 rounded-lg overflow-hidden">
      {/* Sidebar */}
      <ScrollArea className="w-1/3 border-r border-slate-700 bg-slate-800">
        <div className="p-3">
          <h2 className="text-lg font-semibold text-white mb-3 px-2">Chats</h2>
          {conversations.map((convo) => (
            <div
              key={convo.id}
              className={`p-3 mb-2 rounded-lg cursor-pointer hover:bg-slate-700 ${selectedConversation?.id === convo.id ? 'bg-slate-700' : 'bg-slate-800'}`}
              onClick={() => handleSelectConversation(convo)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarImage src={convo.lenderAvatar || undefined} />
                    <AvatarFallback className="bg-[#ff8800] text-white">
                      {convo.lenderName?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-sm text-white truncate max-w-[120px]">{convo.lenderName}</h3>
                    <p className="text-xs text-slate-400 truncate max-w-[120px]">{convo.applicationPurpose}</p>
                  </div>
                </div>
                {convo.unreadCount > 0 && (
                  <span className="bg-[#ff8800] text-white text-xs font-bold px-2 py-1 rounded-full">
                    {convo.unreadCount}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1 truncate max-w-[180px]">{convo.lastMessage}</p>
              <p className="text-xs text-slate-500 text-right">
                {formatDistanceToNowStrict(new Date(convo.lastMessageTime), { addSuffix: true })}
              </p>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Chat area */}
      <div className="flex-1 flex flex-col bg-slate-850">
        {selectedConversation ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-slate-700 bg-slate-800">
              <div className="flex items-center">
                <Avatar className="h-10 w-10 mr-3">
                  <AvatarImage src={selectedConversation.lenderAvatar || undefined} />
                  <AvatarFallback className="bg-[#ff8800] text-white">
                    {selectedConversation.lenderName?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-white">{selectedConversation.lenderName}</h3>
                  <p className="text-xs text-slate-400">Regarding: {selectedConversation.applicationPurpose}</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4 space-y-4 bg-slate-900">
              {isLoadingMessages ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-[#ff8800]" />
                </div>
              ) : messages.length > 0 ? (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      msg.sender_id === currentUserId ? 'bg-[#ff8800] text-white' : 'bg-slate-700 text-slate-200'
                    }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <p className={`text-xs mt-1 ${msg.sender_id === currentUserId ? 'text-slate-200/70 text-right' : 'text-slate-400 text-left'}`}>
                        {format(new Date(msg.sent_at), 'p')}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-slate-400 py-10">
                  No messages in this conversation yet. Start by sending a message!
                </p>
              )}
              <div ref={messagesEndRef} />
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t border-slate-700 bg-slate-800">
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-[#ff8800] hover:bg-slate-700">
                  <Paperclip size={20} />
                </Button>
                <Input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:ring-[#ff8800]"
                />
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-[#ff8800] hover:bg-slate-700">
                  <Smile size={20} />
                </Button>
                <Button onClick={handleSendMessage} className="bg-[#ff8800] hover:bg-[#ffaa00] text-white px-4 py-2 rounded-lg">
                  <Send size={18} />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col justify-center items-center bg-slate-900">
            <MessageCircle size={48} className="text-slate-500 mb-4" />
            <p className="text-slate-400">Select a conversation to start messaging.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationsUI;
