import { useCollection } from "@/hooks/useFirestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart } from "@/components/charts/LineChart";
import { where, orderBy } from "firebase/firestore";

interface NutritionTabProps {
  clientId: string;
}

export const NutritionTab = ({ clientId }: NutritionTabProps) => {
  const { data: nutritionLogs, loading } = useCollection("nutrition_logs", [
    where("clientId", "==", clientId),
    orderBy("date", "desc")
  ]);

  // Mock data for the chart since we don't have real data
  const macrosChartData = {
    labels: ['09 Jan', '10 Jan', '11 Jan', '12 Jan', '13 Jan', '14 Jan', '15 Jan'],
    datasets: [{
      label: 'Calories',
      data: [0, 0, 0, 0, 0, 0, 0],
      borderColor: 'rgb(99, 102, 241)',
      backgroundColor: 'rgba(99, 102, 241, 0.1)',
      tension: 0.4
    }]
  };

  const calendarDays = Array.from({ length: 7 }, (_, i) => ({
    number: 9 + i,
    hasData: i === 1 || i === 2 // Mock some days with data
  }));

  const macrosData = [
    { name: 'Calories', avg: 0, total: 0 },
    { name: 'Protein', avg: 0, total: 0 },
    { name: 'Carbs', avg: 0, total: 0 },
    { name: 'Fat', avg: 0, total: 0 },
  ];

  if (loading) {
    return <div className="text-center py-8">Loading nutrition data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Nutrition Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Macros Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Macros Target</CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart data={macrosChartData} height={200} />
          </CardContent>
        </Card>

        {/* Weekly Calendar */}
        <Card>
          <CardHeader>
            <CardTitle>Logged Meals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
              {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(day => (
                <div key={day} className="font-medium text-gray-500">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => (
                <div
                  key={index}
                  className={`h-8 w-8 flex items-center justify-center text-xs rounded ${
                    day.hasData
                      ? 'bg-green-100 text-green-800'
                      : 'text-gray-500'
                  }`}
                >
                  {day.number}
                </div>
              ))}
            </div>
            {nutritionLogs.length === 0 && (
              <div className="text-center mt-4 text-gray-500 text-sm">
                <p>No nutrition logs yet</p>
                <p>Meal logs will appear here when the client tracks their food</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Macros Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle>Macros Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Macro</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-500">Avg</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-500">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {macrosData.map((macro) => (
                  <tr key={macro.name}>
                    <td className="px-4 py-2 font-medium text-gray-900">{macro.name}</td>
                    <td className="px-4 py-2 text-right text-gray-900">{macro.avg}</td>
                    <td className="px-4 py-2 text-right text-gray-900">{macro.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
