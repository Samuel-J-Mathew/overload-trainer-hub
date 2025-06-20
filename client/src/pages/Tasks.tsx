import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AddTaskModal } from "@/components/tasks/AddTaskModal";
import { collection, onSnapshot, orderBy, query, Timestamp, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Plus, Search, CheckCircle2, Filter } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";

interface Task {
  id: string;
  name: string;
  dueDate: Timestamp;
  createdAt: Timestamp;
  completed: boolean;
  completedAt?: Timestamp;
}

export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("latest");

  // Load tasks from Firebase
  useEffect(() => {
    if (!user?.uid) return;

    const tasksRef = collection(db, 'coaches', user.uid, 'tasks');
    const tasksQuery = query(tasksRef, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(tasksQuery, (snapshot) => {
      const loadedTasks: Task[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        loadedTasks.push({
          id: doc.id,
          name: data.name,
          dueDate: data.dueDate,
          createdAt: data.createdAt,
          completed: data.completed || false,
          completedAt: data.completedAt
        });
      });
      
      setTasks(loadedTasks);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Filter and sort tasks
  useEffect(() => {
    let filtered = tasks.filter(task =>
      task.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort tasks - completed tasks go to bottom, then sort by due date
    filtered.sort((a, b) => {
      // First sort by completion status
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      
      // Then sort by due date within each group
      if (sortBy === "latest") {
        return b.dueDate.toMillis() - a.dueDate.toMillis();
      } else {
        return a.dueDate.toMillis() - b.dueDate.toMillis();
      }
    });

    setFilteredTasks(filtered);
  }, [tasks, searchQuery, sortBy]);

  const formatDueDate = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    return format(date, "MMMM d, yyyy");
  };

  const isOverdue = (timestamp: Timestamp) => {
    const today = new Date();
    const dueDate = timestamp.toDate();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  };

  const isDueToday = (timestamp: Timestamp) => {
    const today = new Date();
    const dueDate = timestamp.toDate();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate.getTime() === today.getTime();
  };

  const handleTaskToggle = async (taskId: string, completed: boolean) => {
    if (!user?.uid) return;

    try {
      const taskRef = doc(db, 'coaches', user.uid, 'tasks', taskId);
      await updateDoc(taskRef, {
        completed: !completed,
        completedAt: !completed ? Timestamp.now() : null
      });
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  // Separate completed and upcoming tasks
  const upcomingTasks = filteredTasks.filter(task => !task.completed);
  const completedTasks = filteredTasks.filter(task => task.completed);

  return (
    <Layout>
      <div className="bg-white p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded border border-gray-300"></div>
              <h1 className="text-xl font-semibold text-gray-900">Tasks</h1>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-gray-700"
              >
                Help
              </Button>
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600">A</span>
              </div>
            </div>
          </div>

          {/* Search and Add Task */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search tasks"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-gray-200"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-600"
              >
                <Filter className="h-4 w-4 mr-1" />
                1 Filter
              </Button>
              
              <Button
                onClick={() => setShowAddTaskModal(true)}
                size="sm"
                className="bg-black hover:bg-gray-800 text-white"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Task
              </Button>
            </div>
          </div>

          {/* Tasks Table */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-gray-200">
                  <TableHead className="text-gray-600 font-medium w-16">
                    <Checkbox className="w-4 h-4" disabled />
                  </TableHead>
                  <TableHead className="text-gray-600 font-medium">Task</TableHead>
                  <TableHead className="text-gray-600 font-medium text-right">
                    <div className="flex items-center justify-end gap-1">
                      Due Date
                      <Filter className="h-3 w-3" />
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(3)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                      </TableCell>
                      <TableCell>
                        <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                      </TableCell>
                      <TableCell>
                        <div className="h-4 bg-gray-200 rounded w-20 ml-auto animate-pulse"></div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <>
                    {/* Upcoming Section */}
                    {upcomingTasks.length > 0 && (
                      <>
                        <TableRow>
                          <TableCell colSpan={3} className="py-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-700">Upcoming</span>
                              <span className="text-sm text-gray-500">{upcomingTasks.length}</span>
                            </div>
                          </TableCell>
                        </TableRow>
                        
                        {upcomingTasks.map((task) => (
                          <TableRow key={task.id} className="hover:bg-gray-50">
                            <TableCell>
                              <Checkbox
                                checked={task.completed}
                                onCheckedChange={() => handleTaskToggle(task.id, task.completed)}
                                className="w-4 h-4"
                              />
                            </TableCell>
                            <TableCell>
                              <span className="text-gray-900">{task.name}</span>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={`text-sm ${
                                isOverdue(task.dueDate) 
                                  ? "text-red-600" 
                                  : isDueToday(task.dueDate) 
                                  ? "text-orange-600" 
                                  : "text-gray-600"
                              }`}>
                                {isOverdue(task.dueDate) && "Due "}
                                {formatDueDate(task.dueDate)}
                                {isOverdue(task.dueDate) && " ago"}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </>
                    )}

                    {/* Completed Section */}
                    {completedTasks.length > 0 && (
                      <>
                        <TableRow>
                          <TableCell colSpan={3} className="py-2 pt-6">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-700">Completed</span>
                              <span className="text-sm text-gray-500">{completedTasks.length}</span>
                            </div>
                          </TableCell>
                        </TableRow>
                        
                        {completedTasks.map((task) => (
                          <TableRow key={task.id} className="hover:bg-gray-50 opacity-75">
                            <TableCell>
                              <Checkbox
                                checked={task.completed}
                                onCheckedChange={() => handleTaskToggle(task.id, task.completed)}
                                className="w-4 h-4"
                              />
                            </TableCell>
                            <TableCell>
                              <span className="text-gray-500 line-through">{task.name}</span>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="text-sm text-gray-400">
                                {task.completedAt && format(task.completedAt.toDate(), "MMM d")}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </>
                    )}
                    
                    {/* Empty State */}
                    {filteredTasks.length === 0 && !loading && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-12">
                          <div className="text-gray-500">
                            {searchQuery ? "No tasks found" : "No tasks yet"}
                          </div>
                          {!searchQuery && (
                            <Button
                              onClick={() => setShowAddTaskModal(true)}
                              variant="outline"
                              size="sm"
                              className="mt-2"
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add First Task
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Add Task Modal */}
          <AddTaskModal
            open={showAddTaskModal}
            onOpenChange={setShowAddTaskModal}
          />
        </div>
      </div>
    </Layout>
  );
}