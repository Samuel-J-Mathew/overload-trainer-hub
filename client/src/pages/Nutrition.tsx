import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Layout } from "@/components/Layout";
import { PlansTab } from "@/components/nutrition/PlansTab";
import { MealsTab } from "@/components/nutrition/MealsTab";
import { FoodsTab } from "@/components/nutrition/FoodsTab";

export default function Nutrition() {
  const [activeTab, setActiveTab] = useState("plans");

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Nutrition</h1>
          <p className="text-gray-600">Manage nutrition plans, meals, and food database for your clients</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="plans" className="text-sm font-medium">
              Plans
            </TabsTrigger>
            <TabsTrigger value="meals" className="text-sm font-medium">
              Meals
            </TabsTrigger>
            <TabsTrigger value="foods" className="text-sm font-medium">
              Foods
            </TabsTrigger>
          </TabsList>

          <TabsContent value="plans">
            <PlansTab />
          </TabsContent>

          <TabsContent value="meals">
            <MealsTab />
          </TabsContent>

          <TabsContent value="foods">
            <FoodsTab />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}