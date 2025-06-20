import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ArrowLeft, Send, Clock } from "lucide-react";
import { format } from "date-fns";

interface ChatInfo {
  clientId: string;
  clientName: string;
  clientEmail: string;
  lastMessage: string;
  lastMessageTime: any;
  unreadCount: number;
}

interface Message {
  id: string;
  sender: "coach" | "client";
  text: string;
  timestamp: any;
}

interface ChatViewProps {
  chat: ChatInfo;
  onBack: () => void;
}

export const ChatView = ({ chat, onBack }: ChatViewProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load messages
  useEffect(() => {
    if (!user?.uid) return;

    const messagesRef = collection(db, 'coaches', user.uid, 'messages', chat.clientId, 'chatInfo');
    const messagesQuery = query(messagesRef, orderBy('timestamp', 'asc'));
    
    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const loadedMessages: Message[] = [];
      snapshot.forEach((doc) => {
        loadedMessages.push({
          id: doc.id,
          ...doc.data()
        } as Message);
      });
      setMessages(loadedMessages);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid, chat.clientId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!newMessage.trim() || !user?.uid || sending) return;

    setSending(true);
    try {
      const messagesRef = collection(db, 'coaches', user.uid, 'messages', chat.clientId, 'chatInfo');
      
      await addDoc(messagesRef, {
        sender: "coach",
        text: newMessage.trim(),
        timestamp: serverTimestamp()
      });

      setNewMessage("");
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    }
    setSending(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageTime = (timestamp: any) => {
    if (!timestamp) return "";
    
    const date = timestamp.toDate();
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return format(date, 'HH:mm');
    } else if (diffInHours < 168) { // Less than a week
      return format(date, 'EEE HH:mm');
    } else {
      return format(date, 'MMM d, HH:mm');
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Messages
          </Button>
          
          <Avatar className="h-10 w-10">
            <AvatarImage src="" />
            <AvatarFallback className="bg-blue-100 text-blue-800">
              {getInitials(chat.clientName)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <h2 className="font-semibold text-gray-900">{chat.clientName}</h2>
            <p className="text-sm text-gray-500">Online</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Avatar className="h-16 w-16 mb-4">
              <AvatarImage src="" />
              <AvatarFallback className="bg-blue-100 text-blue-800 text-lg">
                {getInitials(chat.clientName)}
              </AvatarFallback>
            </Avatar>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Start chatting with {chat.clientName}
            </h3>
            <p className="text-gray-500 max-w-sm">
              This is the beginning of your conversation. Send a message to get started!
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'coach' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md`}>
                {message.sender === 'client' && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-gray-100 text-gray-800 text-xs">
                      {getInitials(chat.clientName)}
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div
                  className={`rounded-2xl px-4 py-2 ${
                    message.sender === 'coach'
                      ? 'bg-black text-white'
                      : 'bg-white border border-gray-200 text-gray-900'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  <div className={`flex items-center mt-1 text-xs ${
                    message.sender === 'coach' ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    <Clock className="h-3 w-3 mr-1" />
                    {formatMessageTime(message.timestamp)}
                  </div>
                </div>
                
                {message.sender === 'coach' && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-blue-100 text-blue-800 text-xs">
                      You
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <form onSubmit={handleSendMessage} className="flex space-x-3">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 border-gray-300"
            disabled={sending}
          />
          <Button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="bg-black hover:bg-gray-800 text-white"
          >
            {sending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};