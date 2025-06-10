import { useCollection } from "@/hooks/useFirestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart } from "@/components/charts/LineChart";
import { Plus, Edit } from "lucide-react";
import { where, orderBy } from "firebase/firestore";

interface HabitsTabProps {
  clientId: string;
}

export const HabitsTab = ({ clientId }: HabitsTabProps) => {
  const { data: habitEntries, loading } = useCollection("habit_entries", [
    orderBy("date", "desc")
  ]);

  // Mock data for the chart
  const habitsChartData = {
    labels: ['28 Jan', '29 Jan', '30 Jan', '31 Jan', '01 Feb', '02 Feb', '03 Feb', '04 Feb', '05 Feb', '06 Feb', '07 Feb', '08 Feb', '09 Feb', '10 Feb', '11 Feb'],
    datasets: [{
      label: 'Daily Steps',
      data: [11000, 12500, 10800, 13200, 11900, 10500, 12800, 11200, 13500, 10900, 12200, 11800, 13000, 11926, 12223],
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4,
      fill: true
    }]
  };

  const habitsOverview = [
    { label: 'Current Streak', value: '0', unit: '0 days', color: 'text-blue-600' },
    { label: 'Longest Streak', value: '15', unit: '15 days', color: 'text-blue-600' },
    { label: 'Habit Completed', value: '15', unit: '', color: 'text-green-600' },
    { label: 'Completion Rate', value: '11%', unit: '', color: 'text-blue-600' },
  ];

  const mockHabitEntries = [
    { id: '1', value: 12223, memo: '-', date: '2025-02-11' },
    { id: '2', value: 11926, memo: '-', date: '2025-02-10' },
  ];

  if (loading) {
    return <div className="text-center py-8">Loading habits data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Habits Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {habitsOverview.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-4 text-center">
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
              {stat.unit && <div className="text-xs text-gray-400 mt-1">{stat.unit}</div>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Habits List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Daily Steps</CardTitle>
          <div className="flex items-center space-x-2">
            <Button className="hubfit-primary" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Log Habit
            </Button>
            <Button variant="outline" size="sm">
              <Edit className="w-4 h-4 mr-2" />
              Edit Habit
            </Button>
          </div>
        </CardHeader>
        
        {/* Habits Chart */}
        <CardContent>
          <LineChart 
            data={habitsChartData} 
            height={300}
            options={{
              scales: {
                y: {
                  beginAtZero: false,
                  min: 10000,
                  max: 14000
                }
              }
            }}
          />
        </CardContent>

        {/* Habits Data Table */}
        <CardContent className="border-t border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Value</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Memo</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Date</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {habitEntries.length === 0 ? (
                  mockHabitEntries.map((entry) => (
                    <tr key={entry.id}>
                      <td className="px-4 py-2 font-medium text-gray-900">{entry.value}</td>
                      <td className="px-4 py-2 text-gray-600">{entry.memo}</td>
                      <td className="px-4 py-2 text-gray-600">{entry.date}</td>
                      <td className="px-4 py-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  habitEntries.map((entry: any) => (
                    <tr key={entry.id}>
                      <td className="px-4 py-2 font-medium text-gray-900">{entry.value}</td>
                      <td className="px-4 py-2 text-gray-600">{entry.memo || '-'}</td>
                      <td className="px-4 py-2 text-gray-600">
                        {entry.date?.toDate ? entry.date.toDate().toLocaleDateString() : entry.date}
                      </td>
                      <td className="px-4 py-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
