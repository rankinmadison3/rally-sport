import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Loader2, Plus, FileText, Calendar as CalendarIcon, Repeat, Users, ChevronRight, Trash2, Pencil } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import FormBuilder from "@/components/feedback/FormBuilder";
import { FeedbackFormDef, FeedbackQuestion } from "@/lib/feedbackForms";

const moods = [
  { emoji: "😫", label: "Struggling", value: 1 },
  { emoji: "😟", label: "Low", value: 2 },
  { emoji: "😐", label: "Okay", value: 3 },
  { emoji: "😊", label: "Good", value: 4 },
  { emoji: "🔥", label: "Great", value: 5 },
];

interface AssignmentRow {
  id: string;
  form_id: string;
  team_id: string;
  due_date: string | null;
  recurrence: string;
  broadcast_at: string;
  is_active: boolean;
  form?: FeedbackFormDef;
  responseCount?: number;
  totalMembers?: number;
  myDone?: boolean;
}

const Feedback = () => {
  const { user, role, teamId } = useAuth();
  const navigate = useNavigate();

  // Player wellness state
  const [selectedMood, setSelectedMood] = useState(3);
  const [suggestion, setSuggestion] = useState("");
  const [anonymous, setAnonymous] = useState(true);
  const [sendingMood, setSendingMood] = useState(false);
  const [sendingSuggestion, setSendingSuggestion] = useState(false);

  // Coach state
  const [templates, setTemplates] = useState<FeedbackFormDef[]>([]);
  const [myForms, setMyForms] = useState<FeedbackFormDef[]>([]);
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [loadingCoach, setLoadingCoach] = useState(false);

  // Dialogs
  const [builderOpen, setBuilderOpen] = useState(false);
  const [builderTemplateId, setBuilderTemplateId] = useState<string | null>(null);
  const [builderEditId, setBuilderEditId] = useState<string | null>(null);

  const [broadcastForm, setBroadcastForm] = useState<FeedbackFormDef | null>(null);
  const [broadcastDue, setBroadcastDue] = useState("");
  const [broadcastRecurrence, setBroadcastRecurrence] = useState("none");
  const [broadcasting, setBroadcasting] = useState(false);

  const isCoachOrManager = role === "coach" || role === "manager";

  const loadCoachData = async () => {
    if (!teamId) return;
    setLoadingCoach(true);

    const [tmplRes, myRes, asgRes, memRes] = await Promise.all([
      supabase.from("feedback_forms").select("*").eq("is_system", true).order("name"),
      supabase.from("feedback_forms").select("*").eq("team_id", teamId).eq("is_system", false).order("created_at", { ascending: false }),
      supabase.from("feedback_form_assignments").select("*").eq("team_id", teamId).eq("is_active", true).order("broadcast_at", { ascending: false }),
      supabase.from("team_members").select("id", { count: "exact" }).eq("team_id", teamId),
    ]);

    setTemplates((tmplRes.data ?? []) as unknown as FeedbackFormDef[]);
    setMyForms((myRes.data ?? []) as unknown as FeedbackFormDef[]);

    const asgRows = (asgRes.data ?? []) as AssignmentRow[];
    const totalMembers = (memRes.count ?? 0) + 1;

    if (asgRows.length > 0) {
      const formIds = Array.from(new Set(asgRows.map((a) => a.form_id)));
      const { data: forms } = await supabase.from("feedback_forms").select("*").in("id", formIds);
      const formMap = new Map((forms ?? []).map((f) => [f.id, f as unknown as FeedbackFormDef]));

      const enriched = await Promise.all(
        asgRows.map(async (a) => {
          const { count } = await supabase
            .from("feedback_form_responses")
            .select("id", { count: "exact", head: true })
            .eq("assignment_id", a.id);
          return { ...a, form: formMap.get(a.form_id), responseCount: count ?? 0, totalMembers };
        })
      );
      setAssignments(enriched);
    } else {
      setAssignments([]);
    }
    setLoadingCoach(false);
  };

  const loadPlayerAssignments = async () => {
    if (!teamId || !user) return;
    setLoadingCoach(true);
    const { data: asgRes } = await supabase
      .from("feedback_form_assignments")
      .select("*")
      .eq("team_id", teamId)
      .eq("is_active", true)
      .order("broadcast_at", { ascending: false });

    const asgRows = (asgRes ?? []) as AssignmentRow[];
    if (asgRows.length === 0) {
      setAssignments([]);
      setLoadingCoach(false);
      return;
    }
    const formIds = Array.from(new Set(asgRows.map((a) => a.form_id)));
    const { data: forms } = await supabase.from("feedback_forms").select("*").in("id", formIds);
    const formMap = new Map((forms ?? []).map((f) => [f.id, f as unknown as FeedbackFormDef]));

    const { data: myResponses } = await supabase
      .from("feedback_form_responses")
      .select("assignment_id")
      .eq("user_id", user.id)
      .in("assignment_id", asgRows.map((a) => a.id));
    const doneSet = new Set((myResponses ?? []).map((r) => r.assignment_id));

    setAssignments(
      asgRows.map((a) => ({ ...a, form: formMap.get(a.form_id), myDone: doneSet.has(a.id) }))
    );
    setLoadingCoach(false);
  };

  useEffect(() => {
    if (!teamId) return;
    if (isCoachOrManager) loadCoachData();
    else loadPlayerAssignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, role]);

  const submitMood = async () => {
    if (!user || !teamId) return toast.error("No team found");
    setSendingMood(true);
    const { error } = await supabase.from("morale_checkins").insert({ user_id: user.id, team_id: teamId, mood: selectedMood });
    setSendingMood(false);
    if (error) return toast.error(error.message);
    toast.success("Mood submitted!");
  };

  const submitSuggestion = async () => {
    if (!teamId || !suggestion.trim()) return toast.error("Please write a suggestion");
    setSendingSuggestion(true);
    const { error } = await supabase.from("suggestions").insert({
      team_id: teamId,
      content: suggestion.trim(),
      is_anonymous: anonymous,
      user_id: anonymous ? null : user?.id,
    });
    setSendingSuggestion(false);
    if (error) return toast.error(error.message);
    setSuggestion("");
    toast.success("Suggestion sent!");
  };

  const handleBroadcast = async () => {
    if (!broadcastForm || !user || !teamId) return;
    setBroadcasting(true);
    const { error } = await supabase.from("feedback_form_assignments").insert({
      form_id: broadcastForm.id,
      team_id: teamId,
      due_date: broadcastDue || null,
      recurrence: broadcastRecurrence,
      broadcast_by: user.id,
    });
    setBroadcasting(false);
    if (error) return toast.error(error.message);
    toast.success(`"${broadcastForm.name}" sent to team`);
    setBroadcastForm(null);
    setBroadcastDue("");
    setBroadcastRecurrence("none");
    loadCoachData();
  };

  const closeAssignment = async (id: string) => {
    const { error } = await supabase.from("feedback_form_assignments").update({ is_active: false }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Form closed");
    loadCoachData();
  };

  const deleteForm = async (id: string) => {
    const { error } = await supabase.from("feedback_forms").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Form deleted");
    loadCoachData();
  };

  // -------- COACH / MANAGER VIEW --------
  if (isCoachOrManager) {
    return (
      <div className="p-4 space-y-5 max-w-3xl mx-auto">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {role === "coach" ? "Coach's View" : "Manager's View"}
            </p>
            <h1 className="text-2xl font-bold font-display text-foreground">Feedback Forms</h1>
          </div>
          <Button
            onClick={() => { setBuilderTemplateId(null); setBuilderEditId(null); setBuilderOpen(true); }}
            size="sm"
          >
            <Plus className="w-4 h-4" /> New form
          </Button>
        </div>

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="forms">My Forms</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          {/* Active broadcasts */}
          <TabsContent value="active" className="space-y-3 mt-4">
            {loadingCoach ? (
              <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
            ) : assignments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No active forms. Broadcast one from "My Forms" or "Templates".</p>
            ) : (
              assignments.map((a) => {
                const pct = a.totalMembers ? Math.round(((a.responseCount ?? 0) / a.totalMembers) * 100) : 0;
                return (
                  <div key={a.id} className="bg-card rounded-xl p-4 shadow-[var(--card-shadow)] space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-display font-semibold text-card-foreground truncate">{a.form?.name ?? "Form"}</p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                          {a.due_date && <span className="inline-flex items-center gap-1"><CalendarIcon className="w-3 h-3" />Due {new Date(a.due_date).toLocaleDateString()}</span>}
                          {a.recurrence !== "none" && <span className="inline-flex items-center gap-1"><Repeat className="w-3 h-3" />{a.recurrence}</span>}
                          <span className="inline-flex items-center gap-1"><Users className="w-3 h-3" />{a.responseCount}/{a.totalMembers}</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => closeAssignment(a.id)}>Close</Button>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </TabsContent>

          {/* My custom forms */}
          <TabsContent value="forms" className="space-y-3 mt-4">
            {myForms.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No custom forms yet. Create one or duplicate a template.</p>
            ) : (
              myForms.map((f) => (
                <FormCard
                  key={f.id}
                  form={f}
                  onBroadcast={() => setBroadcastForm(f)}
                  onEdit={() => { setBuilderEditId(f.id); setBuilderTemplateId(null); setBuilderOpen(true); }}
                  onDelete={() => deleteForm(f.id)}
                />
              ))
            )}
          </TabsContent>

          {/* System templates */}
          <TabsContent value="templates" className="space-y-3 mt-4">
            {templates.map((f) => (
              <FormCard
                key={f.id}
                form={f}
                badge="Template"
                onBroadcast={() => setBroadcastForm(f)}
                onDuplicate={() => { setBuilderTemplateId(f.id); setBuilderEditId(null); setBuilderOpen(true); }}
              />
            ))}
          </TabsContent>
        </Tabs>

        {/* Builder dialog */}
        <Dialog open={builderOpen} onOpenChange={setBuilderOpen}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{builderEditId ? "Edit form" : "New form"}</DialogTitle>
            </DialogHeader>
            <FormBuilder
              initialTemplateId={builderTemplateId}
              editingFormId={builderEditId}
              onClose={() => setBuilderOpen(false)}
              onSaved={loadCoachData}
            />
          </DialogContent>
        </Dialog>

        {/* Broadcast dialog */}
        <Dialog open={!!broadcastForm} onOpenChange={(o) => !o && setBroadcastForm(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Broadcast "{broadcastForm?.name}"</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Due date (optional)</Label>
                <Input type="date" value={broadcastDue} onChange={(e) => setBroadcastDue(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Recurrence</Label>
                <Select value={broadcastRecurrence} onValueChange={setBroadcastRecurrence}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">One-time</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setBroadcastForm(null)} disabled={broadcasting}>Cancel</Button>
                <Button onClick={handleBroadcast} disabled={broadcasting}>
                  {broadcasting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Send to team
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // -------- PLAYER VIEW --------
  return (
    <div className="p-4 space-y-6 max-w-3xl mx-auto">
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Player's View</p>
        <h1 className="text-2xl font-bold font-display text-foreground">Feedback</h1>
      </div>

      {/* Assigned forms */}
      <div className="space-y-3">
        <h2 className="font-display font-semibold text-foreground flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" /> Assigned Forms
        </h2>
        {loadingCoach ? (
          <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
        ) : assignments.length === 0 ? (
          <p className="text-sm text-muted-foreground bg-card rounded-xl p-4 shadow-[var(--card-shadow)]">No forms assigned right now.</p>
        ) : (
          assignments.map((a) => (
            <button
              key={a.id}
              onClick={() => navigate(`/feedback-form?assignment=${a.id}`)}
              disabled={a.myDone}
              className="w-full bg-card rounded-xl p-4 shadow-[var(--card-shadow)] flex items-center gap-3 hover:bg-accent/50 transition-colors text-left disabled:opacity-60"
            >
              <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-accent-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-card-foreground truncate">{a.form?.name ?? "Form"}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  {a.due_date && <span>Due {new Date(a.due_date).toLocaleDateString()}</span>}
                  {a.myDone && <span className="text-success font-medium">✓ Submitted</span>}
                </div>
              </div>
              {!a.myDone && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
            </button>
          ))
        )}
      </div>

      {/* Wellness check-in */}
      <div className="bg-card rounded-xl p-5 shadow-[var(--card-shadow)] space-y-4">
        <h2 className="font-display font-semibold text-card-foreground text-center">How are you feeling today?</h2>
        <div className="flex justify-between items-center px-2">
          {moods.map((mood) => (
            <button
              key={mood.value}
              onClick={() => setSelectedMood(mood.value)}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${selectedMood === mood.value ? "bg-accent scale-110" : "opacity-50 hover:opacity-75"}`}
            >
              <span className="text-3xl">{mood.emoji}</span>
              <span className="text-[10px] font-medium text-muted-foreground">{mood.label}</span>
            </button>
          ))}
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${(selectedMood / 5) * 100}%` }} />
        </div>
        <Button onClick={submitMood} disabled={sendingMood} className="w-full">
          {sendingMood ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Submit Mood
        </Button>
      </div>

      {/* Anonymous suggestion */}
      <div className="bg-card rounded-xl p-5 shadow-[var(--card-shadow)] space-y-4">
        <h2 className="font-display font-semibold text-card-foreground">Anonymous Suggestion Box</h2>
        <p className="text-xs text-muted-foreground">Share thoughts privately with your coach.</p>
        <textarea
          value={suggestion}
          onChange={(e) => setSuggestion(e.target.value)}
          placeholder="Share your thoughts, ideas, or concerns..."
          maxLength={1000}
          className="w-full h-28 p-3 rounded-lg bg-muted text-foreground text-sm placeholder:text-muted-foreground resize-none border border-border focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
            Send anonymously
          </label>
          <Button onClick={submitSuggestion} disabled={sendingSuggestion} size="sm">
            {sendingSuggestion ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Send
          </Button>
        </div>
      </div>
    </div>
  );
};

interface FormCardProps {
  form: FeedbackFormDef;
  badge?: string;
  onBroadcast: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
}

const FormCard = ({ form, badge, onBroadcast, onEdit, onDelete, onDuplicate }: FormCardProps) => {
  const qs = (form.questions as FeedbackQuestion[]) ?? [];
  return (
    <div className="bg-card rounded-xl p-4 shadow-[var(--card-shadow)] space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-display font-semibold text-card-foreground truncate">{form.name}</p>
            {badge && <span className="text-[10px] font-semibold bg-accent text-accent-foreground px-1.5 py-0.5 rounded">{badge}</span>}
          </div>
          {form.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{form.description}</p>}
          <p className="text-xs text-muted-foreground mt-1">{qs.length} question{qs.length === 1 ? "" : "s"}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 justify-end">
        {onDelete && (
          <Button variant="ghost" size="sm" onClick={onDelete} className="text-destructive">
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
        {onEdit && (
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil className="w-4 h-4" /> Edit
          </Button>
        )}
        {onDuplicate && (
          <Button variant="outline" size="sm" onClick={onDuplicate}>Duplicate</Button>
        )}
        <Button size="sm" onClick={onBroadcast}>
          <Send className="w-4 h-4" /> Broadcast
        </Button>
      </div>
    </div>
  );
};

export default Feedback;
