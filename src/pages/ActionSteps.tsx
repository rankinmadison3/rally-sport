import { useState, useEffect } from "react";
import { CheckCircle2, Circle, Dumbbell, Brain, Users, Target, Plus, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const categories = [
  { label: "Technical", icon: Target, color: "text-primary" },
  { label: "Mental", icon: Brain, color: "text-info" },
  { label: "Physical", icon: Dumbbell, color: "text-success" },
  { label: "Teamwork", icon: Users, color: "text-warning" },
];

interface ActionStep {
  id: string;
  text: string;
  category: string;
  done: boolean;
}

const ActionSteps = () => {
  const { user, role, teamId } = useAuth();
  const [tasks, setTasks] = useState<ActionStep[]>([]);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [newTask, setNewTask] = useState("");
  const [newCategory, setNewCategory] = useState("Technical");
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    if (!user || !teamId) return;
    const fetchTasks = async () => {
      let query = supabase.from("action_steps").select("id, text, category, done").eq("team_id", teamId);
      if (role === "player") query = query.eq("user_id", user.id);
      const { data } = await query.order("created_at", { ascending: true });
      setTasks((data as ActionStep[]) || []);
      setLoading(false);
    };
    fetchTasks();
  }, [user, teamId, role]);

  const toggleTask = async (id: string, done: boolean) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !done } : t)));
    await supabase.from("action_steps").update({ done: !done }).eq("id", id);
  };

  const addTask = async () => {
    if (!newTask.trim() || !user || !teamId) return;
    const { data, error } = await supabase
      .from("action_steps")
      .insert({ user_id: user.id, team_id: teamId, text: newTask.trim(), category: newCategory })
      .select("id, text, category, done")
      .single();
    if (error) return toast.error(error.message);
    if (data) setTasks((prev) => [...prev, data as ActionStep]);
    setNewTask("");
    setShowAdd(false);
    toast.success("Task added!");
  };

  const filtered = filter === "All" ? tasks : tasks.filter((t) => t.category === filter);
  const completedCount = tasks.filter((t) => t.done).length;
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  const getCategoryIcon = (cat: string) => categories.find((c) => c.label === cat) || categories[0];

  if (loading) return <div className="p-4 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="p-4 space-y-5">
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {role === "coach" ? "Coach's View" : "Player's View"}
        </p>
        <h1 className="text-2xl font-bold font-display text-foreground">My Action Steps</h1>
      </div>

      {/* Progress */}
      <div className="bg-card rounded-xl p-4 shadow-[var(--card-shadow)] space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-semibold text-card-foreground">Progress</h2>
          <span className="text-2xl font-bold text-primary font-display">{progress}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-xs text-muted-foreground">{completedCount} of {tasks.length} tasks completed</p>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {["All", ...categories.map((c) => c.label)].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium shrink-0 transition-colors ${
              filter === cat ? "bg-primary text-primary-foreground" : "bg-card text-card-foreground border border-border hover:bg-accent"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Add Task */}
      {showAdd ? (
        <div className="bg-card rounded-xl p-4 shadow-[var(--card-shadow)] space-y-3">
          <input
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="New task description..."
            maxLength={200}
            className="w-full px-3 py-2 rounded-lg bg-muted text-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
          />
          <div className="flex gap-1.5">
            {categories.map((c) => (
              <button
                key={c.label}
                onClick={() => setNewCategory(c.label)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  newCategory === c.label ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowAdd(false)} className="flex-1 py-2 rounded-lg bg-muted text-muted-foreground text-sm font-medium">Cancel</button>
            <button onClick={addTask} className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">Add</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowAdd(true)} className="w-full py-3 bg-card rounded-xl shadow-[var(--card-shadow)] flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          <Plus className="w-4 h-4" /> Add Task
        </button>
      )}

      {/* Task List */}
      <div className="space-y-2">
        {filtered.map((task) => {
          const cat = getCategoryIcon(task.category);
          const Icon = cat.icon;
          return (
            <button
              key={task.id}
              onClick={() => toggleTask(task.id, task.done)}
              className="w-full bg-card rounded-xl p-4 shadow-[var(--card-shadow)] flex items-center gap-3 text-left transition-all hover:shadow-[var(--card-shadow-hover)]"
            >
              {task.done ? <CheckCircle2 className="w-6 h-6 text-success shrink-0" /> : <Circle className="w-6 h-6 text-muted-foreground shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${task.done ? "line-through text-muted-foreground" : "text-card-foreground"}`}>{task.text}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Icon className={`w-3 h-3 ${cat.color}`} />
                  <span className="text-[10px] text-muted-foreground">{task.category}</span>
                </div>
              </div>
            </button>
          );
        })}
        {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No tasks yet</p>}
      </div>
    </div>
  );
};

export default ActionSteps;
