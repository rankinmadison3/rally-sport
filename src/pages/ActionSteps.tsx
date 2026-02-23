import { useState } from "react";
import { CheckCircle2, Circle, Dumbbell, Brain, Users, Target } from "lucide-react";

const categories = [
  { label: "Technical", icon: Target, color: "text-primary" },
  { label: "Mental", icon: Brain, color: "text-info" },
  { label: "Physical", icon: Dumbbell, color: "text-success" },
  { label: "Teamwork", icon: Users, color: "text-warning" },
];

const initialTasks = [
  { id: 1, text: "Improve backhand follow-through", category: "Technical", done: true },
  { id: 2, text: "Daily hydration goal (3L)", category: "Physical", done: true },
  { id: 3, text: "5-min visualization before matches", category: "Mental", done: true },
  { id: 4, text: "Communicate more during doubles", category: "Teamwork", done: false },
  { id: 5, text: "Footwork ladder drills (15 min)", category: "Physical", done: false },
];

const ActionSteps = () => {
  const [tasks, setTasks] = useState(initialTasks);
  const completedCount = tasks.filter((t) => t.done).length;
  const progress = Math.round((completedCount / tasks.length) * 100);

  const toggleTask = (id: number) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const getCategoryIcon = (cat: string) => {
    const found = categories.find((c) => c.label === cat);
    return found || categories[0];
  };

  return (
    <div className="p-4 space-y-5">
      {/* Header */}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Player's View</p>
        <h1 className="text-2xl font-bold font-display text-foreground">My Action Steps</h1>
      </div>

      {/* Progress */}
      <div className="bg-card rounded-xl p-4 shadow-[var(--card-shadow)] space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-semibold text-card-foreground">Progress</h2>
          <span className="text-2xl font-bold text-primary font-display">{progress}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {completedCount} of {tasks.length} tasks completed
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button className="px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium shrink-0">
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.label}
            className="px-3 py-1.5 rounded-full bg-card text-card-foreground text-xs font-medium border border-border shrink-0 hover:bg-accent transition-colors"
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="space-y-2">
        {tasks.map((task) => {
          const cat = getCategoryIcon(task.category);
          const Icon = cat.icon;
          return (
            <button
              key={task.id}
              onClick={() => toggleTask(task.id)}
              className="w-full bg-card rounded-xl p-4 shadow-[var(--card-shadow)] flex items-center gap-3 text-left transition-all hover:shadow-[var(--card-shadow-hover)]"
            >
              {task.done ? (
                <CheckCircle2 className="w-6 h-6 text-success shrink-0" />
              ) : (
                <Circle className="w-6 h-6 text-muted-foreground shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium ${
                    task.done ? "line-through text-muted-foreground" : "text-card-foreground"
                  }`}
                >
                  {task.text}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <Icon className={`w-3 h-3 ${cat.color}`} />
                  <span className="text-[10px] text-muted-foreground">{task.category}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ActionSteps;
