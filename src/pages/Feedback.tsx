import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Send, Loader2, Plus, FileText, Calendar as CalendarIcon, Repeat, Users,
  ChevronRight, Trash2, Pencil, ChevronDown, CheckCircle2, Clock, Inbox, TrendingUp, MessageSquare,
} from "lucide-react";
import { HeroCard, StatTile } from "@/components/ui/hero-card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import FormBuilder from "@/components/feedback/FormBuilder";
import { FeedbackFormDef, FeedbackQuestion } from "@/lib/feedbackForms";

interface AssignmentRow {
  id: string;
  form_id: string;
  team_id: string;
  player_id: string | null;
  due_date: string | null;
  recurrence: string;
  broadcast_at: string;
  status: "pending" | "submitted";
  submitted_at: string | null;
  is_active: boolean;
}

interface BroadcastGroup {
  key: string; // form_id + broadcast_at
  form?: FeedbackFormDef;
  form_id: string;
  broadcast_at: string;
  due_date: string | null;
  recurrence: string;
  total: number;
  submitted: number;
  assignments: (AssignmentRow & { playerName?: string })[];
}

interface PlayerAssignmentRow extends AssignmentRow {
  form?: FeedbackFormDef;
}

const Feedback = () => {
  const { user, role, teamId } = useAuth();
  const navigate = useNavigate();
  const isCoachOrManager = role === "coach" || role === "manager";

  // Coach state
  const [templates, setTemplates] = useState<FeedbackFormDef[]>([]);
  const [myForms, setMyForms] = useState<FeedbackFormDef[]>([]);
  const [broadcasts, setBroadcasts] = useState<BroadcastGroup[]>([]);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Player state
  const [playerAssignments, setPlayerAssignments] = useState<PlayerAssignmentRow[]>([]);

  // Builder dialog
  const [builderOpen, setBuilderOpen] = useState(false);
  const [builderTemplateId, setBuilderTemplateId] = useState<string | null>(null);
  const [builderEditId, setBuilderEditId] = useState<string | null>(null);

  // Broadcast dialog
  const [broadcastForm, setBroadcastForm] = useState<FeedbackFormDef | null>(null);
  const [broadcastDue, setBroadcastDue] = useState("");
  const [broadcastRecurrence, setBroadcastRecurrence] = useState("none");
  const [broadcasting, setBroadcasting] = useState(false);

  const loadCoachData = async () => {
    if (!teamId) return;
    setLoading(true);

    const [tmplRes, myRes, asgRes] = await Promise.all([
      supabase.from("feedback_forms").select("*").eq("is_system", true).order("name"),
      supabase.from("feedback_forms").select("*").eq("team_id", teamId).eq("is_system", false).order("created_at", { ascending: false }),
      supabase.from("feedback_form_assignments").select("*").eq("team_id", teamId).eq("is_active", true).order("broadcast_at", { ascending: false }),
    ]);

    setTemplates((tmplRes.data ?? []) as unknown as FeedbackFormDef[]);
    setMyForms((myRes.data ?? []) as unknown as FeedbackFormDef[]);

    const asgRows = (asgRes.data ?? []) as AssignmentRow[];

    if (asgRows.length === 0) {
      setBroadcasts([]);
      setLoading(false);
      return;
    }

    // Fetch related forms + player profiles
    const formIds = Array.from(new Set(asgRows.map((a) => a.form_id)));
    const playerIds = Array.from(new Set(asgRows.map((a) => a.player_id).filter(Boolean) as string[]));

    const [formsRes, profilesRes] = await Promise.all([
      supabase.from("feedback_forms").select("*").in("id", formIds),
      playerIds.length
        ? supabase.from("profiles").select("user_id, display_name").in("user_id", playerIds)
        : Promise.resolve({ data: [] as { user_id: string; display_name: string }[] }),
    ]);

    const formMap = new Map((formsRes.data ?? []).map((f) => [f.id, f as unknown as FeedbackFormDef]));
    const nameMap = new Map((profilesRes.data ?? []).map((p) => [p.user_id, p.display_name]));

    // Group by form_id + broadcast_at
    const groups = new Map<string, BroadcastGroup>();
    for (const a of asgRows) {
      const key = `${a.form_id}|${a.broadcast_at}`;
      let g = groups.get(key);
      if (!g) {
        g = {
          key,
          form: formMap.get(a.form_id),
          form_id: a.form_id,
          broadcast_at: a.broadcast_at,
          due_date: a.due_date,
          recurrence: a.recurrence,
          total: 0,
          submitted: 0,
          assignments: [],
        };
        groups.set(key, g);
      }
      g.total += 1;
      if (a.status === "submitted") g.submitted += 1;
      g.assignments.push({ ...a, playerName: a.player_id ? nameMap.get(a.player_id) ?? "Player" : "Player" });
    }

    setBroadcasts(Array.from(groups.values()).sort((a, b) => b.broadcast_at.localeCompare(a.broadcast_at)));
    setLoading(false);
  };

  const loadPlayerData = async () => {
    if (!teamId || !user) return;
    setLoading(true);

    const { data: asgRes } = await supabase
      .from("feedback_form_assignments")
      .select("*")
      .eq("team_id", teamId)
      .eq("player_id", user.id)
      .eq("is_active", true)
      .order("broadcast_at", { ascending: false });

    const asgRows = (asgRes ?? []) as AssignmentRow[];
    if (asgRows.length === 0) {
      setPlayerAssignments([]);
      setLoading(false);
      return;
    }
    const formIds = Array.from(new Set(asgRows.map((a) => a.form_id)));
    const { data: forms } = await supabase.from("feedback_forms").select("*").in("id", formIds);
    const formMap = new Map((forms ?? []).map((f) => [f.id, f as unknown as FeedbackFormDef]));

    setPlayerAssignments(asgRows.map((a) => ({ ...a, form: formMap.get(a.form_id) })));
    setLoading(false);
  };

  useEffect(() => {
    if (!teamId) return;
    if (isCoachOrManager) loadCoachData();
    else loadPlayerData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, role, user?.id]);

  const handleBroadcast = async () => {
    if (!broadcastForm || !user || !teamId) return;
    setBroadcasting(true);

    // Fetch all players in this team
    const { data: members, error: memErr } = await supabase
      .from("team_members")
      .select("user_id")
      .eq("team_id", teamId);

    if (memErr) {
      setBroadcasting(false);
      return toast.error(memErr.message);
    }
    const playerIds = (members ?? []).map((m) => m.user_id);

    if (playerIds.length === 0) {
      setBroadcasting(false);
      return toast.error("No players found in this team. Ask players to join with the team code first.");
    }

    const broadcastAt = new Date().toISOString();
    const rows = playerIds.map((pid) => ({
      form_id: broadcastForm.id,
      team_id: teamId,
      player_id: pid,
      due_date: broadcastDue || null,
      recurrence: broadcastRecurrence,
      broadcast_at: broadcastAt,
      broadcast_by: user.id,
      is_active: true,
      status: "pending" as const,
    }));

    const { error } = await supabase.from("feedback_form_assignments").insert(rows);
    setBroadcasting(false);
    if (error) return toast.error(error.message);

    toast.success(`Feedback sent to ${playerIds.length} player${playerIds.length === 1 ? "" : "s"}.`);
    setBroadcastForm(null);
    setBroadcastDue("");
    setBroadcastRecurrence("none");
    loadCoachData();
  };

  const closeBroadcast = async (group: BroadcastGroup) => {
    const ids = group.assignments.map((a) => a.id);
    const { error } = await supabase
      .from("feedback_form_assignments")
      .update({ is_active: false })
      .in("id", ids);
    if (error) return toast.error(error.message);
    toast.success("Broadcast closed");
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
    const totalResponses = broadcasts.reduce((s, g) => s + g.submitted, 0);
    const totalOutstanding = broadcasts.reduce((s, g) => s + (g.total - g.submitted), 0);
    const totalSent = broadcasts.reduce((s, g) => s + g.total, 0);
    const responseRate = totalSent === 0 ? 0 : Math.round((totalResponses / totalSent) * 100);

    return (
      <div className="p-4 space-y-5 max-w-5xl mx-auto">
        <HeroCard
          eyebrow={role === "coach" ? "Coach's Command · Feedback" : "Manager's Command · Feedback"}
          title="Feedback"
          subtitle="Build surveys, broadcast them to the team, and watch responses roll in."
          icon={<MessageSquare className="w-5 h-5" />}
          right={
            <button
              onClick={() => { setBuilderTemplateId(null); setBuilderEditId(null); setBuilderOpen(true); }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary-foreground text-primary px-3.5 py-2 text-sm font-semibold shadow-sm hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" /> New form
            </button>
          }
        />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatTile
            icon={<Send className="w-4 h-4" />}
            label="Active"
            value={broadcasts.length}
            hint={`${totalSent} sent`}
          />
          <StatTile
            icon={<CheckCircle2 className="w-4 h-4" />}
            label="Responses"
            value={totalResponses}
            hint={`${totalOutstanding} pending`}
            accent="bg-emerald-500/15 text-emerald-600"
          />
          <StatTile
            icon={<TrendingUp className="w-4 h-4" />}
            label="Response rate"
            value={`${responseRate}%`}
            hint="across broadcasts"
            accent="bg-amber-500/15 text-amber-600"
          />
          <StatTile
            icon={<FileText className="w-4 h-4" />}
            label="Forms"
            value={myForms.length}
            hint={`${templates.length} templates`}
            accent="bg-blue-500/15 text-blue-600"
          />
        </div>


        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="forms">My Forms</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-3 mt-4">
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
            ) : broadcasts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No active feedback. Send one from "My Forms" or "Templates".
              </p>
            ) : (
              broadcasts.map((g) => {
                const pct = g.total > 0 ? Math.round((g.submitted / g.total) * 100) : 0;
                const expanded = expandedKey === g.key;
                return (
                  <div key={g.key} className="bg-card rounded-2xl p-5 shadow-[var(--card-shadow)] border border-border/60 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* Progress ring */}
                        <div className="relative w-14 h-14 shrink-0">
                          <svg viewBox="0 0 40 40" className="w-14 h-14 -rotate-90">
                            <circle cx="20" cy="20" r="16" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
                            <circle
                              cx="20" cy="20" r="16" fill="none"
                              stroke="hsl(var(--primary))" strokeWidth="4" strokeLinecap="round"
                              strokeDasharray={2 * Math.PI * 16}
                              strokeDashoffset={2 * Math.PI * 16 * (1 - pct / 100)}
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-foreground">
                            {pct}%
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-display font-semibold text-card-foreground truncate">
                            {g.form?.name ?? "Feedback"}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <Clock className="w-3 h-3" />{new Date(g.broadcast_at).toLocaleDateString()}
                            </span>
                            {g.due_date && (
                              <span className="inline-flex items-center gap-1">
                                <CalendarIcon className="w-3 h-3" />Due {new Date(g.due_date).toLocaleDateString()}
                              </span>
                            )}
                            {g.recurrence !== "none" && (
                              <span className="inline-flex items-center gap-1 capitalize"><Repeat className="w-3 h-3" />{g.recurrence}</span>
                            )}
                            <span className="inline-flex items-center gap-1 font-medium text-foreground">
                              <Users className="w-3 h-3" />{g.submitted}/{g.total}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => closeBroadcast(g)}>Close</Button>
                    </div>

                    <button
                      onClick={() => setExpandedKey(expanded ? null : g.key)}
                      className="text-xs text-primary font-medium inline-flex items-center gap-1 hover:opacity-80"
                    >
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
                      {expanded ? "Hide players" : `View ${g.total} player${g.total === 1 ? "" : "s"}`}
                    </button>

                    {expanded && (
                      <div className="border-t border-border/60 pt-3 grid gap-1.5 sm:grid-cols-2">
                        {g.assignments.map((a) => (
                          <div key={a.id} className="flex items-center justify-between text-sm px-2 py-1.5 rounded-lg bg-muted/50">
                            <span className="text-card-foreground truncate">{a.playerName}</span>
                            {a.status === "submitted" ? (
                              <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium shrink-0 ml-2">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {a.submitted_at ? new Date(a.submitted_at).toLocaleDateString() : "Done"}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground shrink-0 ml-2">Pending</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </TabsContent>

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

        <Dialog open={builderOpen} onOpenChange={setBuilderOpen}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{builderEditId ? "Edit feedback form" : "New feedback form"}</DialogTitle>
            </DialogHeader>
            <FormBuilder
              initialTemplateId={builderTemplateId}
              editingFormId={builderEditId}
              onClose={() => setBuilderOpen(false)}
              onSaved={loadCoachData}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={!!broadcastForm} onOpenChange={(o) => !o && setBroadcastForm(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Send "{broadcastForm?.name}" to team</DialogTitle>
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
  const pending = playerAssignments.filter((a) => a.status !== "submitted");
  const submitted = playerAssignments.filter((a) => a.status === "submitted");

  return (
    <div className="p-4 space-y-6 max-w-3xl mx-auto">
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Player's View</p>
        <h1 className="text-2xl font-bold font-display text-foreground">Feedback</h1>
        <p className="text-sm text-muted-foreground mt-1">Feedback your coach has assigned to you.</p>
      </div>

      {/* Pending */}
      <div className="space-y-3">
        <h2 className="font-display font-semibold text-foreground flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" /> Pending Feedback
        </h2>
        {loading ? (
          <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
        ) : pending.length === 0 ? (
          <p className="text-sm text-muted-foreground bg-card rounded-xl p-4 shadow-[var(--card-shadow)]">
            No feedback requests right now.
          </p>
        ) : (
          pending.map((a) => (
            <button
              key={a.id}
              onClick={() => navigate(`/feedback/assignment/${a.id}`)}
              className="w-full bg-card rounded-xl p-4 shadow-[var(--card-shadow)] flex items-center gap-3 hover:bg-accent/50 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-accent-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-card-foreground truncate">{a.form?.name ?? "Feedback"}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  {a.due_date && <span>Due {new Date(a.due_date).toLocaleDateString()}</span>}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          ))
        )}
      </div>

      {/* Submitted */}
      {submitted.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-display font-semibold text-foreground">Submitted</h2>
          {submitted.map((a) => (
            <div
              key={a.id}
              className="bg-card rounded-xl p-4 shadow-[var(--card-shadow)] flex items-center gap-3 opacity-80"
            >
              <div className="w-10 h-10 rounded-lg bg-success/15 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-success" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-card-foreground truncate">{a.form?.name ?? "Feedback"}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Submitted {a.submitted_at ? new Date(a.submitted_at).toLocaleDateString() : ""}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
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
          <Send className="w-4 h-4" /> Send to team
        </Button>
      </div>
    </div>
  );
};

export default Feedback;
