import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Package, DollarSign, Calendar, User } from "lucide-react";
import { AddPackageModal } from "@/components/packages/AddPackageModal";
import { useAuth } from "@/hooks/useAuth";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface PackageData {
  id: string;
  name: string;
  description: string;
  currency: string;
  planType: string;
  duration: number;
  totalPrice: number;
  payoutPerMonth: number;
  createdAt: any;
}

export default function Packages() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [packages, setPackages] = useState<PackageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const { user } = useAuth();

  // For demo purposes, using a default client ID - in real app this would come from selected client
  const defaultClientId = "demo-client-123";

  // Load packages for the selected client
  useEffect(() => {
    if (!user?.uid) return;

    const clientId = selectedClientId || defaultClientId;
    const packagesRef = collection(db, 'coaches', user.uid, 'clients', clientId, 'packages');
    const packagesQuery = query(packagesRef, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(packagesQuery, (snapshot) => {
      const loadedPackages: PackageData[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        loadedPackages.push({
          id: doc.id,
          name: data.name,
          description: data.description,
          currency: data.currency,
          planType: data.planType,
          duration: data.duration,
          totalPrice: data.totalPrice,
          payoutPerMonth: data.payoutPerMonth,
          createdAt: data.createdAt
        });
      });
      
      setPackages(loadedPackages);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid, selectedClientId]);

  const formatCurrency = (amount: number, currency: string) => {
    const symbols: { [key: string]: string } = {
      USD: '$',
      EUR: '€',
      GBP: '£'
    };
    return `${symbols[currency] || currency} ${amount.toFixed(2)}`;
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Packages</h1>
            <p className="text-gray-600">Manage coaching packages for your clients</p>
          </div>
          <Button 
            onClick={() => setShowAddModal(true)}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Package
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Loading packages...</p>
            </div>
          </div>
        ) : packages.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No packages found</h3>
            <p className="text-gray-500 mb-6">No packages found. Create your first package to get started.</p>
            <Button 
              onClick={() => setShowAddModal(true)}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Package
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {packages.map((pkg) => (
              <Card key={pkg.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Package className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold text-gray-900">{pkg.name}</CardTitle>
                        <Badge variant="outline" className="mt-1">
                          {pkg.planType}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600 line-clamp-2">{pkg.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Duration</p>
                        <p className="text-sm font-medium">{pkg.duration} month{pkg.duration !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Total Price</p>
                        <p className="text-sm font-medium">{formatCurrency(pkg.totalPrice, pkg.currency)}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Monthly Payout</span>
                      <span className="text-lg font-semibold text-green-600">
                        {formatCurrency(pkg.payoutPerMonth, pkg.currency)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <AddPackageModal
          open={showAddModal}
          onOpenChange={setShowAddModal}
          clientId={selectedClientId || defaultClientId}
        />
      </div>
    </Layout>
  );
}