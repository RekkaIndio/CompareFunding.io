import React from 'react';
import { 
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, Send } from 'lucide-react';

interface CommunicationSectionProps {
  application: any;
  user: any;
  selectedLenderConversation: any;
  selectLenderConversation: (lenderId: string, lenderName: string, offerId?: string) => void;
  messages: any[];
  newMessage: string;
  setNewMessage: React.Dispatch<React.SetStateAction<string>>;
  sendMessage: (e: React.FormEvent) => Promise<void>;
}

const CommunicationSection: React.FC<CommunicationSectionProps> = ({
  application,
  user,
  selectedLenderConversation,
  selectLenderConversation,
  messages,
  newMessage,
  setNewMessage,
  sendMessage
}) => {
  if (!application) return null;

  return (
    <Card className="mb-6 bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="bg-[#212936] text-white rounded-t-lg">
        <CardTitle className="flex items-center">
          <MessageSquare className="mr-2 h-5 w-5 text-[#ff8000]" />
          <span className="text-white">Communication</span>
        </CardTitle>
        <CardDescription className="text-gray-200">
          Messages between you and lenders
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        {application.matched_lenders && application.matched_lenders.length > 0 ? (
          <div className="flex flex-col md:flex-row h-[400px] border border-slate-200 rounded-lg overflow-hidden">
            {/* Lender List */}
            <div className="w-full md:w-1/3 border-r border-slate-200 bg-slate-50">
              <div className="p-3 border-b border-slate-200 bg-slate-100">
                <h3 className="font-medium text-slate-700">Lenders</h3>
              </div>
              <div className="overflow-y-auto h-[calc(400px-40px)]">
                {application.matched_lenders.map((lenderId, index) => {
                  // Find offer from this lender if exists
                  const offer = application.offers?.find(o => o.lender_id === lenderId);
                  const lenderName = offer?.lender_name || `Lender ${index + 1}`;
                  const conversationId = offer?.id || lenderId;
                  
                  return (
                    <div
                      key={lenderId}
                      className={`p-3 border-b border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors ${
                        selectedLenderConversation?.id === conversationId ? 'bg-slate-100' : ''
                      }`}
                      onClick={() => selectLenderConversation(lenderId, lenderName, offer?.id)}
                    >
                      <div className="flex items-center">
                        <Avatar className="h-8 w-8 mr-2">
                          <AvatarFallback className="bg-[#212936] text-white text-xs">
                            {lenderName.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-slate-800 text-sm">{lenderName}</p>
                          {offer && (
                            <p className="text-xs text-slate-500">
                              £{Number(offer.amount).toLocaleString()} • {offer.term} months
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Chat Area */}
            <div className="w-full md:w-2/3 flex flex-col">
              {selectedLenderConversation ? (
                <>
                  <div className="p-3 border-b border-slate-200 bg-slate-100">
                    <h3 className="font-medium text-slate-700">
                      Chat with {selectedLenderConversation.lenderName}
                    </h3>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages?.length > 0 ? (
                      messages.map((msg, index) => (
                        <div
                          key={index}
                          className={`flex ${msg.sender_id === user?.uid ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg p-3 ${
                              msg.sender_id === user?.uid
                                ? 'bg-[#212936] text-white'
                                : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            <p className="text-sm">{msg.message}</p>
                            <p className="text-xs mt-1 opacity-70">
                              {new Date(msg.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-slate-500 text-center">
                          No messages yet. Send a message to start the conversation.
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="p-3 border-t border-slate-200">
                    <form onSubmit={sendMessage} className="flex">
                      <Textarea
                        className="flex-1 resize-none min-h-[40px] max-h-20 rounded-r-none"
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                      />
                      <Button
                        className="rounded-l-none h-auto bg-[#212936] hover:bg-[#212936]/90"
                        disabled={!newMessage.trim()}
                        type="submit"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MessageSquare className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">Select a lender to start chatting</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center p-6">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4">
              <p className="font-medium text-slate-700">No lenders matched yet</p>
              {application.status === 'submitted' && (
                <p className="text-sm text-slate-500 mt-1">
                  Your application is being reviewed. Lenders will be matched soon.
                </p>
              )}
              {application.status === 'draft' && (
                <p className="text-sm text-slate-500 mt-1">
                  Submit your application to get matched with lenders.
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CommunicationSection;
