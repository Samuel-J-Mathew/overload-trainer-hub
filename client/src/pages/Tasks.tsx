import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AddTaskModal } from "@/components/tasks/AddTaskModal";
import { collection, onSnapshot, orderBy, query, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Plus, Search, Filter, Calendar, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

interface Task {
  id: string;
  name: string;
  dueDate: Timestamp;
  createdAt: Timestamp;
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
          createdAt: data.createdAt
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

    // Sort tasks
    filtered.sort((a, b) => {
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

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Tasks</h1>
          <p className="text-gray-400">Manage your coaching tasks and deadlines</p>
        </div>

        {/* Search and Sort Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px] bg-gray-800 border-gray-700 text-white">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="latest">Sort by: Latest</SelectItem>
                <SelectItem value="oldest">Sort by: Oldest</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              onClick={() => setShowAddTaskModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </div>
        </div>

        {/* Tasks List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="bg-gray-800 border-gray-700 animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-700 rounded w-2/3"></div>
                  <div className="h-4 bg-gray-700 rounded w-1/3"></div>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle2 className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">
              {searchQuery ? "No tasks found" : "No tasks yet"}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchQuery 
                ? "Try adjusting your search terms" 
                : "Get started by adding your first task"
              }
            </p>
            {!searchQuery && (
              <Button
                onClick={() => setShowAddTaskModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Task
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTasks.map((task) => (
              <Card key={task.id} className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-white text-lg font-semibold">
                        {task.name}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-2">
                        <Calendar className="h-4 w-4" />
                        <span className={`${
                          isOverdue(task.dueDate) 
                            ? "text-red-400" 
                            : isDueToday(task.dueDate) 
                            ? "text-yellow-400" 
                            : "text-gray-400"
                        }`}>
                          Due: {formatDueDate(task.dueDate)}
                          {isOverdue(task.dueDate) && " (Overdue)"}
                          {isDueToday(task.dueDate) && " (Today)"}
                        </span>
                      </CardDescription>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {isOverdue(task.dueDate) && (
                        <div className="w-3 h-3 bg-red-500 rounded-full" title="Overdue" />
                      )}
                      {isDueToday(task.dueDate) && (
                        <div className="w-3 h-3 bg-yellow-500 rounded-full" title="Due Today" />
                      )}
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}

        {/* Add Task Modal */}
        <AddTaskModal
          open={showAddTaskModal}
          onOpenChange={setShowAddTaskModal}
        />
      </div>
    </div>
  );
}