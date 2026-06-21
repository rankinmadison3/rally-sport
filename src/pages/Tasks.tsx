import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Calendar as CalendarIcon, CheckCircle2, Circle, ClipboardCheck, Sparkles, Send } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Category = "Technical" | "Mental" | "Physical" | "Teamwork";
const CATEGORIES: Category[] = ["Technical", "Mental", "Physical", "Teamwork"];

const CATEGORY_STYLES: Record<Category, string> = {
  Technical: "bg-blue-100 text-blue-700",
  Mental: "bg-purple-100 text-purple-700",
  Physical: "bg-green-100 text-green-700",
  Teamwork: "bg-amber-100 text-amber-700",
};

interface TaskRow {
  id: string;
  text: string;
  notes: string | null;
  category: Category;
  due_date: string | null;
  done: boolean;
  user_id: string;
  assigned_by: string | null;
  created_at: string;
}

interface PlayerOption {
  user_id: string;
  display_name: string;
}

interface TemplateRow {
  id: string;
  text: string;
  notes: string | null;
  category: Category;
  due_date: string | null;
  active: boolean;
  created_at: string;
}

const TEMPLATE_SENTINEL = "__template__";

const Tasks = () => {
  const { user, role, teamId } = useAuth();
  const navigate = useNavigate();
  const isCoachOrManager = role === "coach" || role === "manager";

  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [players, setPlayers] = useState<PlayerOption[]>([]);
  const [profileMap, setProfileMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [formText, setFormText] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formCategory, setFormCategory] = useState<Category>("Technical");
  const [formDueDate, setFormDueDate] = useState<Date | undefined>();
  const [formAssignee, setFormAssignee] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = async () => {
    if (!teamId || !user) return;
    setLoading(true);

    // Tasks: RLS already filters (player sees own; coach sees all)
    const { data: taskData, error } = await supabase
      .from("action_steps")
      .select("id, text, notes, category, due_date, done, user_id, assigned_by, created_at")
      .eq("team_id", teamId)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load tasks");
      setLoading(false);
      return;
    }
    setTasks((taskData as TaskRow[]) || []);

    // Templates (coach/manager only)
    if (isCoachOrManager) {
      const { data: tplData } = await supabase
        .from("action_step_templates")
        .select("id, text, notes, category, due_date, active, created_at")
        .eq("team_id", teamId)
        .order("created_at", { ascending: false });
      setTemplates((tplData as TemplateRow[]) || []);
    }

    // Players list (for coach assignment + for displaying assignee names)
    if (isCoachOrManager) {
      const { data: members } = await supabase
        .from("team_members")
        .select("user_id")
        .eq("team_id", teamId);
      const userIds = members?.map((m) => m.user_id) ?? [];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name")
          .in("user_id", userIds);
        const opts: PlayerOption[] =
          profiles?.map((p) => ({ user_id: p.user_id, display_name: p.display_name || "Unnamed" })) ?? [];
        setPlayers(opts);
        const map: Record<string, string> = {};
        opts.forEach((p) => (map[p.user_id] = p.display_name));
        setProfileMap(map);
      } else {
        setPlayers([]);
        setProfileMap({});
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, user?.id, role]);

  const resetForm = () => {
    setFormText("");
    setFormNotes("");
    setFormCategory("Technical");
    setFormDueDate(undefined);
    setFormAssignee(players.length === 0 ? TEMPLATE_SENTINEL : "");
  };

  // When opening the dialog, default to template mode if there's no roster yet
  const openCreateDialog = () => {
    setFormAssignee(players.length === 0 ? TEMPLATE_SENTINEL : "");
    setDialogOpen(true);
  };

  const handleCreate = async () => {
    if (!teamId || !user) return;
    const trimmed = formText.trim();
    if (!trimmed) {
      toast.error("Task title is required");
      return;
    }
    if (!formAssignee) {
      toast.error("Please choose who this task is for");
      return;
    }
    setSubmitting(true);

    if (formAssignee === TEMPLATE_SENTINEL) {
      const { error } = await supabase.from("action_step_templates").insert({
        team_id: teamId,
        created_by: user.id,
        text: trimmed,
        notes: formNotes.trim() || null,
        category: formCategory,
        due_date: formDueDate ? format(formDueDate, "yyyy-MM-dd") : null,
        active: true,
      });
      setSubmitting(false);
      if (error) {
        toast.error("Failed to save template");
        return;
      }
      toast.success("Template saved · will auto-assign to new players");
    } else {
      const { error } = await supabase.from("action_steps").insert({
        team_id: teamId,
        user_id: formAssignee,
        assigned_by: user.id,
        text: trimmed,
        notes: formNotes.trim() || null,
        category: formCategory,
        due_date: formDueDate ? format(formDueDate, "yyyy-MM-dd") : null,
        done: false,
      });
      setSubmitting(false);
      if (error) {
        toast.error("Failed to create task");
        return;
      }
      toast.success("Task assigned");
    }

    resetForm();
    setDialogOpen(false);
    fetchAll();
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("Delete this template? Tasks already assigned to players will remain.")) return;
    const prev = templates;
    setTemplates((p) => p.filter((t) => t.id !== id));
    const { error } = await supabase.from("action_step_templates").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete template");
      setTemplates(prev);
    } else {
      toast.success("Template deleted");
    }
  };

  const handleApplyTemplateToRoster = async (tpl: TemplateRow) => {
    if (!user || !teamId) return;
    if (players.length === 0) {
      toast.error("No players on the roster yet");
      return;
    }
    if (!confirm(`Assign this task to all ${players.length} current player${players.length === 1 ? "" : "s"}?`)) return;
    const rows = players.map((p) => ({
      team_id: teamId,
      user_id: p.user_id,
      assigned_by: user.id,
      text: tpl.text,
      notes: tpl.notes,
      category: tpl.category,
      due_date: tpl.due_date,
      done: false,
    }));
    const { error } = await supabase.from("action_steps").insert(rows);
    if (error) {
      toast.error("Failed to assign to roster");
    } else {
      toast.success(`Assigned to ${players.length} player${players.length === 1 ? "" : "s"}`);
      fetchAll();
    }
  };

  const toggleDone = async (task: TaskRow) => {
    // Optimistic
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, done: !t.done } : t))
    );
    const { error } = await supabase
      .from("action_steps")
      .update({ done: !task.done })
      .eq("id", task.id);
    if (error) {
      toast.error("Failed to update task");
      // Roll back
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, done: task.done } : t))
      );
    }
  };

  const handleDelete = async (taskId: string) => {
    const prev = tasks;
    setTasks((p) => p.filter((t) => t.id !== taskId));
    const { error } = await supabase.from("action_steps").delete().eq("id", taskId);
    if (error) {
      toast.error("Failed to delete task");
      setTasks(prev);
    } else {
      toast.success("Task deleted");
    }
  };

  const grouped = useMemo(() => {
    const open = tasks.filter((t) => !t.done);
    const done = tasks.filter((t) => t.done);
    return { open, done };
  }, [tasks]);

  const formatDue = (dateStr: string | null) => {
    if (!dateStr) return null;
    const d = new Date(dateStr + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.round((d.getTime() - today.getTime()) / 86400000);
    if (diffDays < 0) return { label: `Overdue · ${format(d, "MMM d")}`, overdue: true };
    if (diffDays === 0) return { label: "Due today", overdue: false };
    if (diffDays === 1) return { label: "Due tomorrow", overdue: false };
    return { label: `Due ${format(d, "MMM d")}`, overdue: false };
  };

  return (
    <div className="p-4 space-y-5 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="w-9 h-9 rounded-full bg-muted flex items-center justify-center"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {isCoachOrManager ? "Assign & Track" : "Your Assignments"}
            </p>
            <h1 className="text-2xl font-bold font-display text-foreground">Tasks</h1>
          </div>
        </div>
        {isCoachOrManager && (
          <Button onClick={openCreateDialog} size="sm" className="gap-1.5">
            <Plus className="w-4 h-4" /> New
          </Button>
        )}
      </div>

      {/* Empty state */}
      {!loading && tasks.length === 0 && templates.length === 0 && (
        <div className="bg-card rounded-xl p-8 shadow-[var(--card-shadow)] text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-muted mx-auto flex items-center justify-center">
            <ClipboardCheck className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="font-medium text-card-foreground">No tasks yet</p>
          <p className="text-sm text-muted-foreground">
            {isCoachOrManager
              ? players.length === 0
                ? "No players have joined yet. Prebuild your season plan as templates — they'll auto-assign to every player who joins."
                : "Create a task and assign it to a player to get started."
              : "Your coach hasn't assigned you any tasks yet."}
          </p>
        </div>
      )}

      {/* Preseason Templates (coach/manager) */}
      {isCoachOrManager && templates.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Preseason Templates · {templates.length}
            </h2>
            <p className="text-[10px] text-muted-foreground">Auto-assigns to new players</p>
          </div>
          <div className="space-y-2">
            {templates.map((tpl) => {
              const due = formatDue(tpl.due_date);
              return (
                <article
                  key={tpl.id}
                  className="bg-card rounded-xl p-4 shadow-[var(--card-shadow)] border border-dashed border-border space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-sm text-card-foreground leading-snug">{tpl.text}</p>
                    <div className="flex items-center gap-1 shrink-0">
                      {players.length > 0 && (
                        <button
                          onClick={() => handleApplyTemplateToRoster(tpl)}
                          className="text-muted-foreground hover:text-primary p-1"
                          aria-label="Apply to current roster"
                          title="Apply to current roster"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteTemplate(tpl.id)}
                        className="text-muted-foreground hover:text-destructive p-1"
                        aria-label="Delete template"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {tpl.notes && (
                    <p className="text-xs text-muted-foreground whitespace-pre-line">{tpl.notes}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary inline-flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Template
                    </span>
                    <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", CATEGORY_STYLES[tpl.category])}>
                      {tpl.category}
                    </span>
                    {due && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1 bg-muted text-muted-foreground">
                        <CalendarIcon className="w-3 h-3" />
                        {due.label}
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* Open tasks */}
      {grouped.open.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Open · {grouped.open.length}
          </h2>
          <div className="space-y-2">
            {grouped.open.map((t) => {
              const due = formatDue(t.due_date);
              const assigneeName = profileMap[t.user_id];
              return (
                <article
                  key={t.id}
                  className="bg-card rounded-xl p-4 shadow-[var(--card-shadow)] flex gap-3"
                >
                  <button
                    onClick={() => toggleDone(t)}
                    className="shrink-0 mt-0.5"
                    aria-label="Mark as done"
                  >
                    <Circle className="w-5 h-5 text-muted-foreground" />
                  </button>
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm text-card-foreground leading-snug">
                        {t.text}
                      </p>
                      {isCoachOrManager && (
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="text-muted-foreground hover:text-destructive shrink-0"
                          aria-label="Delete task"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    {t.notes && (
                      <p className="text-xs text-muted-foreground whitespace-pre-line">{t.notes}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", CATEGORY_STYLES[t.category])}>
                        {t.category}
                      </span>
                      {due && (
                        <span
                          className={cn(
                            "text-[10px] font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1",
                            due.overdue
                              ? "bg-destructive/10 text-destructive"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="w-3 h-3" />
                          {due.label}
                        </span>
                      )}
                      {isCoachOrManager && assigneeName && (
                        <span className="text-[10px] text-muted-foreground">
                          → {assigneeName}
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* Done tasks */}
      {grouped.done.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Done · {grouped.done.length}
          </h2>
          <div className="space-y-2">
            {grouped.done.map((t) => {
              const assigneeName = profileMap[t.user_id];
              return (
                <article
                  key={t.id}
                  className="bg-card rounded-xl p-4 shadow-[var(--card-shadow)] flex gap-3 opacity-70"
                >
                  <button
                    onClick={() => toggleDone(t)}
                    className="shrink-0 mt-0.5"
                    aria-label="Mark as not done"
                  >
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  </button>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm text-card-foreground line-through leading-snug">
                        {t.text}
                      </p>
                      {isCoachOrManager && (
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="text-muted-foreground hover:text-destructive shrink-0"
                          aria-label="Delete task"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", CATEGORY_STYLES[t.category])}>
                        {t.category}
                      </span>
                      {isCoachOrManager && assigneeName && (
                        <span className="text-[10px] text-muted-foreground">
                          → {assigneeName}
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* New task dialog (coach/manager) */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Task</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="task-title">Title</Label>
              <Input
                id="task-title"
                value={formText}
                onChange={(e) => setFormText(e.target.value)}
                placeholder="e.g. Watch game film from last match"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-assignee">Assign to</Label>
              <Select value={formAssignee} onValueChange={setFormAssignee}>
                <SelectTrigger id="task-assignee">
                  <SelectValue placeholder="Select an assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TEMPLATE_SENTINEL}>
                    ✨ All future players (template)
                  </SelectItem>
                  {players.map((p) => (
                    <SelectItem key={p.user_id} value={p.user_id}>
                      {p.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formAssignee === TEMPLATE_SENTINEL && (
                <p className="text-[11px] text-muted-foreground">
                  Saved as a preseason template. Auto-assigns to every player who joins your team.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="task-category">Category</Label>
                <Select value={formCategory} onValueChange={(v) => setFormCategory(v as Category)}>
                  <SelectTrigger id="task-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Due date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formDueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formDueDate ? format(formDueDate, "MMM d") : "Optional"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formDueDate}
                      onSelect={setFormDueDate}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-notes">Notes (optional)</Label>
              <Textarea
                id="task-notes"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Add any extra context, instructions, or links"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={submitting}>
              {submitting ? "Creating..." : "Assign Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Tasks;
