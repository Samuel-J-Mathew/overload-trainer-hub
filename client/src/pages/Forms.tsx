import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckInsTab } from "@/components/forms/CheckInsTab";

export default function Forms() {
  const [activeTab, setActiveTab] = useState("checkins");

  return (
    <Layout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Forms</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="checkins">Check-Ins</TabsTrigger>
            <TabsTrigger value="questionnaires">Questionnaires</TabsTrigger>
          </TabsList>

          <TabsContent value="checkins" className="space-y-4">
            <CheckInsTab />
          </TabsContent>

          <TabsContent value="questionnaires" className="space-y-4">
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Questionnaires</h3>
              <p className="text-gray-500">Coming soon...</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}