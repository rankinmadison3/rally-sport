import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, FileText, Users, Trophy, LogOut, Copy, Check, Pencil, ChevronDown, ChevronUp, ClipboardCheck, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Dashboard = () => {
  const { user, role, teamId, signOut } = useAuth();
  const navigate = useNavigate();
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);
  const [moraleData, setMoraleData] = useState<number[]>([]);
  const [feedbackForms, setFeedbackForms] = useState<{ id: string; title: string; responses: number; total: number; assignmentId: string | null; myDone?: boolean }[]>([]);
  const [teamCode, setTeamCode] = useState("");
  const [teamName, setTeamName] = useState("");
  const [teamMembers, setTeamMembers] = useState<{ display_name: string; joined_at: string }[]>([]);
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!teamId) return;

    const fetchData = async () => {
      // Fetch team record
      const { data: team } = await supabase
        .from("teams")
        .select("season_wins, season_losses, code, name")
        .eq("id", teamId)
        .single();
      if (team) {
        setWins(team.season_wins);
        setLosses(team.season_losses);
        setTeamCode(team.code);
        setTeamName(team.name);
      }

      // Fetch team members with profiles
      if (role === "coach" || role === "manager") {
        const { data: members } = await supabase
          .from("team_members")
          .select("joined_at, user_id")
          .eq("team_id", teamId);
        if (members && members.length > 0) {
          const userIds = members.map((m) => m.user_id);
          const { data: profiles } = await supabase
            .from("profiles")
            .select("user_id, display_name")
            .in("user_id", userIds);
          const profileMap = new Map(profiles?.map((p) => [p.user_id, p.display_name]) || []);
          setTeamMembers(
            members.map((m) => ({
              display_name: profileMap.get(m.user_id) || "Unknown",
              joined_at: m.joined_at,
            }))
          );
        }
      }

      // Fetch morale data (aggregate mood per day, last 11)
      const { data: morale } = await supabase
        .from("morale_checkins")
        .select("mood, created_at")
        .eq("team_id", teamId)
        .order("created_at", { ascending: true })
        .limit(100);

      if (morale && morale.length > 0) {
        // Average mood values, take last 11 groups
        const vals = morale.map((m) => (m.mood / 5) * 100);
        setMoraleData(vals.slice(-11));
      } else {
        setMoraleData([30, 45, 40, 55, 60, 58, 72, 78, 75, 82, 85]); // fallback demo data
      }

      // Fetch active feedback form assignments + response counts
      const { data: memberRows } = await supabase
        .from("team_members")
        .select("id")
        .eq("team_id", teamId);
      const totalMembers = (memberRows?.length || 0) + 1;

      const { data: asgs } = await supabase
        .from("feedback_form_assignments")
        .select("id, form_id")
        .eq("team_id", teamId)
        .eq("is_active", true)
        .order("broadcast_at", { ascending: false })
        .limit(5);

      if (asgs && asgs.length > 0) {
        const formIds = Array.from(new Set(asgs.map((a) => a.form_id)));
        const { data: forms } = await supabase
          .from("feedback_forms")
          .select("id, name")
          .in("id", formIds);
        const formMap = new Map((forms ?? []).map((f) => [f.id, f.name]));

        let myDoneSet = new Set<string>();
        if (role === "player" && user) {
          const { data: myResponses } = await supabase
            .from("feedback_form_responses")
            .select("assignment_id")
            .eq("user_id", user.id)
            .in("assignment_id", asgs.map((a) => a.id));
          myDoneSet = new Set((myResponses ?? []).map((r) => r.assignment_id).filter(Boolean) as string[]);
        }

        const formData = await Promise.all(
          asgs.map(async (a) => {
            const { count } = await supabase
              .from("feedback_form_responses")
              .select("id", { count: "exact", head: true })
              .eq("assignment_id", a.id);
            return {
              id: a.form_id,
              assignmentId: a.id,
              title: formMap.get(a.form_id) ?? "Form",
              responses: count || 0,
              total: totalMembers,
              myDone: myDoneSet.has(a.id),
            };
          })
        );
        setFeedbackForms(formData);
      } else {
        setFeedbackForms([]);
      }
    };

    fetchData();
  }, [teamId, role]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(teamCode);
    setCopied(true);
    toast.success("Team code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRename = async () => {
    const trimmed = editName.trim();
    if (!trimmed || !teamId) return;
    const { error } = await supabase.from("teams").update({ name: trimmed }).eq("id", teamId);
    if (error) {
      toast.error("Failed to rename team");
    } else {
      setTeamName(trimmed);
      toast.success("Team renamed!");
    }
    setEditing(false);
  };

  const total = wins + losses;
  const winPct = total > 0 ? Math.round((wins / total) * 100) : 0;

  return (
    <div className="p-4 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {role === "coach" ? "Coach's View" : role === "manager" ? "Manager's View" : "Player's View"}
          </p>
          <h1 className="text-2xl font-bold font-display text-foreground">Dashboard</h1>
        </div>
        <button onClick={signOut} className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
          <LogOut className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Team Code Card - Coach Only */}
      {(role === "coach" || role === "manager") && teamCode && (
        <div className="bg-card rounded-xl p-4 shadow-[var(--card-shadow)] space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-card-foreground">Your Team</h2>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold text-primary">{teamMembers.length} players</span>
              </div>
              <button onClick={() => setCollapsed(!collapsed)} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                {collapsed ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronUp className="w-4 h-4 text-muted-foreground" />}
              </button>
            </div>
          </div>
          {!collapsed && (
            <>
              {editing ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleRename()}
                    className="flex-1 text-sm bg-muted rounded-lg px-3 py-1.5 text-foreground outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button onClick={handleRename} className="text-xs font-medium text-primary">Save</button>
                  <button onClick={() => setEditing(false)} className="text-xs text-muted-foreground">Cancel</button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">{teamName}</p>
                  <button onClick={() => { setEditName(teamName); setEditing(true); }}>
                    <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-3">
                <code className="flex-1 text-2xl font-mono font-bold tracking-[0.3em] text-center py-2 bg-muted rounded-lg text-foreground">
                  {teamCode}
                </code>
                <button
                  onClick={handleCopyCode}
                  className="w-10 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0"
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground text-center">Share this code with players to join</p>
              {teamMembers.length > 0 && (
                <div className="border-t border-border pt-3 space-y-2">
                  {teamMembers.map((m, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-card-foreground">{m.display_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(m.joined_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Tasks shortcut */}
      <button
        onClick={() => navigate("/tasks")}
        className="w-full bg-card rounded-xl p-4 shadow-[var(--card-shadow)] flex items-center gap-3 hover:bg-accent/50 transition-colors text-left"
      >
        <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center shrink-0">
          <ClipboardCheck className="w-5 h-5 text-accent-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display font-semibold text-card-foreground">Tasks</p>
          <p className="text-xs text-muted-foreground">
            {role === "player" ? "View your assignments" : "Assign and track team tasks"}
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
      </button>

      <div className="bg-card rounded-xl p-4 shadow-[var(--card-shadow)] space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-semibold text-card-foreground">Season Progress</h2>
          <div className="flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-primary">{wins}-{losses}</span>
          </div>
        </div>
        <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${winPct}%` }} />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{winPct}% Win Rate</span>
          <span>{total} Games Played</span>
        </div>
      </div>

      {/* Team Morale Graph */}
      <div className="bg-card rounded-xl p-4 shadow-[var(--card-shadow)] space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-semibold text-card-foreground">Team Morale</h2>
          <div className="flex items-center gap-1 text-success text-xs font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Trend</span>
          </div>
        </div>
        <div className="h-32 flex items-end gap-1.5">
          {moraleData.map((val, i) => (
            <div key={i} className="flex-1 rounded-t bg-primary transition-all duration-300" style={{ height: `${(val / 100) * 128}px` }} />
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center">Last {moraleData.length} check-ins</p>
      </div>

      {/* Active Feedback Forms */}
      <div className="space-y-3">
        <h2 className="font-display font-semibold text-foreground">Active Feedback Forms</h2>
        {feedbackForms.map((form, i) => (
          <div
            key={i}
            onClick={() => navigate(role === "player" ? "/feedback-form" : "/feedback")}
            className="bg-card rounded-xl p-4 shadow-[var(--card-shadow)] flex items-center gap-3 cursor-pointer hover:bg-accent/50 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-accent-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-card-foreground truncate">{form.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 bg-muted rounded-full h-1.5">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${form.total > 0 ? (form.responses / form.total) * 100 : 0}%` }} />
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{form.responses}/{form.total}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
