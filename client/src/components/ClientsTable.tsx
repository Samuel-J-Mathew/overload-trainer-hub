import { useState } from "react";
import { Client } from "@/types/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, MoreHorizontal } from "lucide-react";
import { AddClientModal } from "./AddClientModal";

interface ClientsTableProps {
  clients: Client[];
  onClientSelect: (client: Client) => void;
}

export const ClientsTable = ({ clients, onClientSelect }: ClientsTableProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredClients = clients.filter(client =>
    (client.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (client.email?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  const getInitials = (name?: string) => {
    if (!name) return "?";
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getAvatarColor = (name?: string) => {
    // Use dark gray background for all avatars to match the lighter theme
    return 'bg-gray-800';
  };

  const formatDate = (date?: any) => {
    if (!date) return "Never";
    
    // Handle Firestore Timestamp objects
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - dateObj.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
  };

  return (
    <>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>{clients.length}</span>
              <span>Clients</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Input
                type="search"
                placeholder="Search clients"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 pl-10"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            </div>
            <Button onClick={() => setShowAddModal(true)} className="hubfit-primary">
              <Plus className="w-4 h-4 mr-2" />
              Add Client
            </Button>
          </div>
        </div>
      </header>

      {/* Clients Table */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="hubfit-card mb-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tag
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Check-in
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Active
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      {searchTerm ? "No clients found matching your search." : "No clients yet. Add your first client to get started."}
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((client) => (
                    <tr
                      key={client.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => onClientSelect(client)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className={`w-10 h-10 ${getAvatarColor(client.name)} rounded-full flex items-center justify-center mr-3`}>
                            <span className="text-white font-medium">
                              {getInitials(client.name)}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {client.name || "Unknown Client"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {client.email || "No email"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {client.tag && (
                          <Badge variant={client.tag === 'in-person' ? 'default' : 'secondary'}>
                            {client.tag.replace('-', ' ')}
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatDate(client.lastCheckin)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatDate(client.lastActive)}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={client.duration === 'active' ? 'default' : 'secondary'}>
                          {client.duration || 'New'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <AddClientModal 
        open={showAddModal} 
        onOpenChange={setShowAddModal}
      />
    </>
  );
};
