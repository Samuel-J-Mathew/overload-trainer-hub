import { useState } from "react";
import { useCollection } from "@/hooks/useFirestore";
import { Client } from "@/types/client";
import { Layout } from "@/components/Layout";
import { ClientsTable } from "@/components/ClientsTable";
import { ClientDetail } from "@/components/ClientDetail";

export default function Dashboard() {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const { data: clients, loading } = useCollection("clients");

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
  };

  const handleBackToClients = () => {
    setSelectedClient(null);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {selectedClient ? (
        <ClientDetail client={selectedClient} onBack={handleBackToClients} />
      ) : (
        <ClientsTable clients={clients} onClientSelect={handleClientSelect} />
      )}
    </Layout>
  );
}
