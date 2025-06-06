import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Paperclip, Send, Smile, Loader2, MessageCircle, ExternalLink } from 'lucide-react';
import { format, formatDistanceToNowStrict } from 'date-fns';

interface Conversation {
  id: string;
  userId: string;
  lenderId: string;  // Note: For lenders, this contains the business ID they're talking to
  lenderName: string;
  lenderAvatar: string;
  applicationId: string;
  applicationPurpose: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  // Additional fields for enhanced display
  applicationAmount?: number;
  applicationStatus?: string;
  applicationDate?: string;
  lenderOffer?: number;
  offerStatus?: string;
  businessName?: string;
  businessId?: string;  // Added to explicitly track business ID for proper routing
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
  userRole?: 'business' | 'lender'; // Add user role to determine correct application route
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
  userRole = 'business', // Default to business role
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
    if (messagesEndRef.current) {
      // Use a more controlled scrolling approach
      const scrollContainer = messagesEndRef.current.parentElement;
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
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
      <ScrollArea className="w-1/3 border-r border-slate-700 bg-slate-800" onClick={(e) => e.preventDefault()}>
        <div className="p-3">
          <h2 className="text-lg font-semibold text-white mb-3 px-2">Chats</h2>
          {conversations.map((convo) => (
            <div
              key={convo.id}
              className={`p-3 mb-2 rounded-lg cursor-pointer hover:bg-slate-700 ${selectedConversation?.id === convo.id ? 'bg-slate-700' : 'bg-slate-800'}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSelectConversation(convo);
              }}
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
                    <div className="flex items-center space-x-1">
                      <p className="text-xs text-slate-400 truncate max-w-[120px]">{convo.applicationPurpose}</p>
                      {convo.applicationAmount && (
                        <span className="text-xs text-green-400">£{convo.applicationAmount.toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  {convo.unreadCount > 0 && (
                    <span className="bg-[#ff8800] text-white text-xs font-bold px-2 py-1 rounded-full mb-1">
                      {convo.unreadCount}
                    </span>
                  )}
                  {convo.offerStatus && (
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      convo.offerStatus === 'accepted' ? 'bg-green-700 text-white' :
                      convo.offerStatus === 'pending' ? 'bg-yellow-700 text-white' :
                      'bg-slate-700 text-white'
                    }`}>
                      {convo.offerStatus}
                    </span>
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-1 truncate max-w-[180px]">{convo.lastMessage}</p>
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-blue-400">ID: {convo.applicationId.substring(0, 6)}...</span>
                <p className="text-xs text-slate-500 text-right">
                  {(() => {
                    const date = new Date(convo.lastMessageTime);
                    return isNaN(date.getTime()) ? 'Unknown' : formatDistanceToNowStrict(date, { addSuffix: true });
                  })()}
                </p>
              </div>
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
              <div className="flex items-center justify-between">
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
                <div className="text-right">
                  <div className="bg-slate-700 rounded-md p-2 text-sm">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-xs text-slate-300">
                        <span className="font-semibold">App ID:</span> {selectedConversation.applicationId?.substring(0, 8)}...
                      </p>
                      <Link 
                        to={userRole === 'lender' 
                          ? `/business/${selectedConversation.businessId || selectedConversation.lenderId}` // For lenders, view the business details using businessId if available
                          : `/applications/${selectedConversation.applicationId}` // For businesses, view the application
                        }
                        className="flex items-center text-xs text-blue-400 hover:text-blue-300 ml-2"
                        onClick={(e) => e.stopPropagation()}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span>{userRole === 'lender' ? 'View Business' : 'View Application'}</span>
                        <ExternalLink size={12} className="ml-1" />
                      </Link>
                    </div>
                    {selectedConversation.applicationAmount && (
                      <p className="text-xs text-slate-300">
                        <span className="font-semibold">Request:</span> £{selectedConversation.applicationAmount.toLocaleString()}
                      </p>
                    )}
                    {selectedConversation.lenderOffer && (
                      <p className="text-xs text-green-400">
                        <span className="font-semibold">Offer:</span> £{selectedConversation.lenderOffer.toLocaleString()}
                      </p>
                    )}
                    {selectedConversation.offerStatus && (
                      <p className="text-xs text-yellow-400">
                        <span className="font-semibold">Status:</span> {selectedConversation.offerStatus}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4 space-y-4 bg-slate-900" onClick={(e) => e.preventDefault()}>
              {isLoadingMessages ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-[#ff8800]" />
                </div>
              ) : messages.length > 0 ? (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    <div 
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        msg.sender_id === currentUserId ? 'bg-[#ff8800] text-white' : 'bg-slate-700 text-slate-200'
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <p className={`text-xs mt-1 ${msg.sender_id === currentUserId ? 'text-slate-200/70 text-right' : 'text-slate-400 text-left'}`}>
                        {(() => {
                          const date = new Date(msg.sent_at);
                          return isNaN(date.getTime()) ? 'Unknown time' : format(date, 'p');
                        })()}
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
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSendMessage();
                }}
                className="flex items-center space-x-2"
                onClick={(e) => e.stopPropagation()}
              >
                <Button type="button" variant="ghost" size="icon" className="text-slate-400 hover:text-[#ff8800] hover:bg-slate-700">
                  <Paperclip size={20} />
                </Button>
                <Input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:ring-[#ff8800]"
                />
                <Button type="button" variant="ghost" size="icon" className="text-slate-400 hover:text-[#ff8800] hover:bg-slate-700">
                  <Smile size={20} />
                </Button>
                <Button type="submit" className="bg-[#ff8800] hover:bg-[#ffaa00] text-white px-4 py-2 rounded-lg">
                  <Send size={18} />
                </Button>
              </form>
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
