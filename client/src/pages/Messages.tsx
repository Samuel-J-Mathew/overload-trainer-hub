import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { collection, onSnapshot, query, orderBy, limit, doc, getDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Search, Plus, ArrowLeft, Send, MessageCircle } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { StartChatModal } from "@/components/messages/StartChatModal";
import { ChatView } from "@/components/messages/ChatView";

interface Client {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface ChatInfo {
  clientId: string;
  clientName: string;
  clientEmail: string;
  lastMessage: string;
  lastMessageTime: any;
  unreadCount: number;
}

export default function Messages() {
  const { user } = useAuth();
  const [chats, setChats] = useState<ChatInfo[]>([]);
  const [filteredChats, setFilteredChats] = useState<ChatInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showStartChatModal, setShowStartChatModal] = useState(false);
  const [selectedChat, setSelectedChat] = useState<ChatInfo | null>(null);

  // Load existing chats
  useEffect(() => {
    if (!user?.uid) return;

    const messagesRef = collection(db, 'coaches', user.uid, 'messages');
    
    const unsubscribe = onSnapshot(messagesRef, async (snapshot) => {
      const chatList: ChatInfo[] = [];
      
      for (const chatDoc of snapshot.docs) {
        const clientId = chatDoc.id;
        
        // Get last message from this chat
        const messagesQuery = query(
          collection(db, 'coaches', user.uid, 'messages', clientId, 'chatInfo'),
          orderBy('timestamp', 'desc'),
          limit(1)
        );
        
        const lastMessageSnapshot = await new Promise<any>((resolve) => {
          const unsub = onSnapshot(messagesQuery, resolve);
          return unsub;
        });
        
        if (!lastMessageSnapshot.empty) {
          const lastMessage = lastMessageSnapshot.docs[0].data();
          
          // Get client info
          const clientRef = doc(db, 'coaches', user.uid, 'clients', clientId);
          const clientDoc = await getDoc(clientRef);
          
          if (clientDoc.exists()) {
            const clientData = clientDoc.data();
            
            chatList.push({
              clientId,
              clientName: clientData.name,
              clientEmail: clientData.email,
              lastMessage: lastMessage.text,
              lastMessageTime: lastMessage.timestamp,
              unreadCount: 0 // TODO: Implement unread count logic
            });
          }
        }
      }
      
      // Sort by last message time
      chatList.sort((a, b) => {
        if (!a.lastMessageTime || !b.lastMessageTime) return 0;
        return b.lastMessageTime.toDate() - a.lastMessageTime.toDate();
      });
      
      setChats(chatList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Filter chats
  useEffect(() => {
    const filtered = chats.filter(chat =>
      chat.clientName.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredChats(filtered);
  }, [chats, searchQuery]);

  const handleStartNewChat = (clientId: string) => {
    // Find the chat or create a new one
    const existingChat = chats.find(chat => chat.clientId === clientId);
    if (existingChat) {
      setSelectedChat(existingChat);
    } else {
      // We'll create the chat when the first message is sent
      // For now, we need to get client info
      const getClientAndStartChat = async () => {
        const clientRef = doc(db, 'coaches', user!.uid, 'clients', clientId);
        const clientDoc = await getDoc(clientRef);
        
        if (clientDoc.exists()) {
          const clientData = clientDoc.data();
          const newChat: ChatInfo = {
            clientId,
            clientName: clientData.name,
            clientEmail: clientData.email,
            lastMessage: "",
            lastMessageTime: null,
            unreadCount: 0
          };
          setSelectedChat(newChat);
        }
      };
      
      getClientAndStartChat();
    }
    setShowStartChatModal(false);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate();
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return format(date, 'HH:mm');
    } else if (diffInHours < 168) { // Less than a week
      return format(date, 'EEE');
    } else {
      return format(date, 'MMM d');
    }
  };

  // Show chat view if a chat is selected
  if (selectedChat) {
    return (
      <Layout>
        <ChatView 
          chat={selectedChat} 
          onBack={() => setSelectedChat(null)} 
        />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
            <p className="text-sm text-gray-600">Chat with your clients</p>
          </div>
          <Button
            onClick={() => setShowStartChatModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 border-gray-300"
          />
        </div>

        {/* Chat List */}
        <div className="bg-white border border-gray-200 rounded-lg">
          {loading ? (
            <div className="p-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 py-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                  </div>
                  <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
                </div>
              ))}
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No conversations yet</h3>
              <p className="text-gray-500 mb-4">
                {searchQuery ? "No conversations found" : "Start chatting with your clients"}
              </p>
              {!searchQuery && (
                <Button
                  onClick={() => setShowStartChatModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Start Your First Chat
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredChats.map((chat) => (
                <div
                  key={chat.clientId}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedChat(chat)}
                >
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-blue-100 text-blue-800">
                        {getInitials(chat.clientName)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900 truncate">
                          {chat.clientName}
                        </h3>
                        <span className="text-xs text-gray-500">
                          {formatTime(chat.lastMessageTime)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 truncate mt-1">
                        {chat.lastMessage}
                      </p>
                    </div>
                    
                    {chat.unreadCount > 0 && (
                      <Badge className="bg-blue-600 text-white">
                        {chat.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Start Chat Modal */}
        <StartChatModal
          open={showStartChatModal}
          onOpenChange={setShowStartChatModal}
          onSelectClient={handleStartNewChat}
        />
      </div>
    </Layout>
  );
}