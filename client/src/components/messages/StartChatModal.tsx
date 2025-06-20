import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Search, MessageCircle, X } from "lucide-react";

interface Client {
  id: string;
  name: string;
  email: string;
  tag?: string;
}

interface StartChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectClient: (clientId: string) => void;
}

export const StartChatModal = ({ open, onOpenChange, onSelectClient }: StartChatModalProps) => {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Load clients
  useEffect(() => {
    if (!user?.uid || !open) return;

    const clientsRef = collection(db, 'coaches', user.uid, 'clients');
    const clientsQuery = query(clientsRef, orderBy('name', 'asc'));
    
    const unsubscribe = onSnapshot(clientsQuery, (snapshot) => {
      const loadedClients: Client[] = [];
      snapshot.forEach((doc) => {
        loadedClients.push({
          id: doc.id,
          ...doc.data()
        } as Client);
      });
      setClients(loadedClients);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid, open]);

  // Filter clients
  useEffect(() => {
    const filtered = clients.filter(client =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (client.tag && client.tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    setFilteredClients(filtered);
  }, [clients, searchQuery]);

  const handleClientSelect = (clientId: string) => {
    onSelectClient(clientId);
    setSearchQuery("");
  };

  const handleClose = () => {
    setSearchQuery("");
    onOpenChange(false);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-white border-gray-200">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between text-gray-900">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Start Chat
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-auto p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Select a client to start a chat
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search for a client"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 border-gray-300"
            autoFocus
          />
        </div>

        {/* Client List */}
        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3 p-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">
                {searchQuery ? "No clients found" : "No clients available"}
              </p>
              {!searchQuery && (
                <p className="text-sm text-gray-400 mt-1">
                  Add clients to start chatting with them
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredClients.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                  onClick={() => handleClientSelect(client.id)}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-blue-100 text-blue-800 text-sm">
                      {getInitials(client.name)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900 truncate">
                        {client.name}
                      </h3>
                      {client.tag && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {client.tag}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {client.email}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleClose}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};