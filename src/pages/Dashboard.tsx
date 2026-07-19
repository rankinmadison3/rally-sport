import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, FileText, Users, Trophy, Copy, Check, Pencil, ChevronDown, ChevronUp, ClipboardCheck, ChevronRight, AlertCircle, X as XIcon } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Dashboard = () => {
  const { user, role, teamId } = useAuth();
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
  const [unloggedGames, setUnloggedGames] = useState<{ id: string; label: string | null; event_date: string }[]>([]);

  const fetchUnloggedGames = async () => {
    if (!teamId || !(role === "coach" || role === "manager")) return;
    const todayStr = new Date().toISOString().slice(0, 10);
    const { data } = await supabase
      .from("calendar_events")
      .select("id, label, event_date")
      .eq("team_id", teamId)
      .eq("event_type", "game")
      .eq("is_regular_season", true)
      .is("game_result", null)
      .lte("event_date", todayStr)
      .order("event_date", { ascending: false })
      .limit(3);
    setUnloggedGames(data ?? []);
  };

  const logResult = async (id: string, result: "win" | "loss") => {
    if (!teamId) return;
    const prev = unloggedGames;
    setUnloggedGames((g) => g.filter((x) => x.id !== id));
    const { error } = await supabase
      .from("calendar_events")
      .update({ game_result: result })
      .eq("id", id);
    if (error) {
      toast.error("Failed to log result");
      setUnloggedGames(prev);
      return;
    }
    toast.success(`Logged as ${result}`);
    // Refresh team record
    const { data: team } = await supabase
      .from("teams").select("season_wins, season_losses").eq("id", teamId).single();
    if (team) { setWins(team.season_wins); setLosses(team.season_losses); }
  };

  useEffect(() => {
    if (!teamId) return;
    fetchUnloggedGames();

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

      // Fetch active feedback assignments (per-player rows). Group by form + broadcast.
      const { data: asgs } = await supabase
        .from("feedback_form_assignments")
        .select("id, form_id, player_id, status, broadcast_at")
        .eq("team_id", teamId)
        .eq("is_active", true)
        .order("broadcast_at", { ascending: false });

      if (asgs && asgs.length > 0) {
        const formIds = Array.from(new Set(asgs.map((a) => a.form_id)));
        const { data: forms } = await supabase
          .from("feedback_forms")
          .select("id, name")
          .in("id", formIds);
        const formMap = new Map((forms ?? []).map((f) => [f.id, f.name]));

        type Group = { id: string; assignmentId: string | null; title: string; responses: number; total: number; myDone?: boolean };
        const groups = new Map<string, Group>();
        for (const a of asgs) {
          const key = `${a.form_id}|${a.broadcast_at}`;
          let g = groups.get(key);
          if (!g) {
            g = {
              id: a.form_id,
              assignmentId: null,
              title: formMap.get(a.form_id) ?? "Feedback",
              responses: 0,
              total: 0,
            };
            groups.set(key, g);
          }
          g.total += 1;
          if (a.status === "submitted") g.responses += 1;
          if (role === "player" && user && a.player_id === user.id) {
            g.assignmentId = a.id;
            g.myDone = a.status === "submitted";
          }
        }

        setFeedbackForms(Array.from(groups.values()).slice(0, 5));
      } else {
        setFeedbackForms([]);
      }
    };

    fetchData();
  }, [teamId, role, user]);

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
        <button
          onClick={() => navigate("/profile")}
          aria-label="Open profile"
          className="w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold font-display flex items-center justify-center shadow-md transition-all hover:opacity-90 hover:scale-105"
        >
          {(user?.email ?? "C").charAt(0).toUpperCase()}
        </button>
      </div>

      {/* Season Progress - Hero */}
      {(() => {
        const size = 92;
        const stroke = 8;
        const r = (size - stroke) / 2;
        const c = 2 * Math.PI * r;
        const dash = total > 0 ? (winPct / 100) * c : 0;
        const canManageSeason = role === "coach" || role === "manager";
        return (
          <div
            onClick={() => canManageSeason && navigate("/season")}
            role={canManageSeason ? "button" : undefined}
            className="relative overflow-hidden rounded-2xl p-5 text-primary-foreground shadow-lg cursor-pointer transition-transform hover:scale-[1.01]"
            style={{
              background:
                "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.82) 100%)",
            }}
          >
            {/* Decorative rings */}
            <div className="pointer-events-none absolute -right-12 -top-12 w-48 h-48 rounded-full border border-white/10" />
            <div className="pointer-events-none absolute -right-4 -bottom-16 w-40 h-40 rounded-full border border-white/10" />

            <div className="relative flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] opacity-80">
                  Season
                </p>
                <div className="mt-1 flex items-baseline gap-2 font-display font-bold leading-none">
                  <span className="text-5xl">{wins}</span>
                  <span className="text-3xl opacity-70">–</span>
                  <span className="text-5xl">{losses}</span>
                </div>
                <p className="mt-2 text-xs opacity-85">
                  {total === 0
                    ? canManageSeason
                      ? "Log your first result →"
                      : "No games played yet"
                    : `${total} game${total === 1 ? "" : "s"} played · ${winPct}% win rate`}
                </p>
              </div>

              <div className="relative shrink-0" style={{ width: size, height: size }}>
                <svg width={size} height={size} className="-rotate-90">
                  <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    stroke="hsl(var(--primary-foreground) / 0.2)"
                    strokeWidth={stroke}
                    fill="none"
                  />
                  <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    stroke="hsl(var(--primary-foreground))"
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={`${dash} ${c}`}
                    fill="none"
                    className="transition-all duration-700"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display font-bold text-lg leading-none">{winPct}%</span>
                  <span className="text-[9px] uppercase tracking-wider opacity-75 mt-0.5">Win</span>
                </div>
              </div>
            </div>

            {/* Segmented game bar */}
            <div className="relative mt-4">
              {total === 0 ? (
                <div className="h-2 rounded-full bg-white/15" />
              ) : (
                <div className="flex gap-1">
                  {Array.from({ length: total }).map((_, i) => (
                    <div
                      key={i}
                      className={`flex-1 h-2 rounded-sm ${
                        i < wins ? "bg-white" : "bg-white/20 border border-white/30"
                      }`}
                    />
                  ))}
                </div>
              )}
              <div className="mt-2 flex items-center justify-between text-[10px] font-medium opacity-80">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-sm bg-white" /> Wins {wins}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-sm border border-white/60" /> Losses {losses}
                </span>
              </div>
            </div>
          </div>
        );
      })()}


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

      {/* Unlogged games (coach/manager) */}
      {(role === "coach" || role === "manager") && unloggedGames.length > 0 && (
        <div className="bg-card rounded-xl p-4 shadow-[var(--card-shadow)] space-y-3 border border-destructive/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="w-4 h-4 text-destructive" />
              </div>
              <h2 className="font-display font-semibold text-card-foreground">
                Log Result · {unloggedGames.length}
              </h2>
            </div>
            <button
              onClick={() => navigate("/season")}
              className="text-xs text-primary font-medium hover:underline"
            >
              Manage season →
            </button>
          </div>
          <div className="space-y-2">
            {unloggedGames.map((g) => (
              <div
                key={g.id}
                className="flex items-center gap-3 bg-muted/40 rounded-lg p-2.5"
              >
                <div className="flex flex-col items-center justify-center w-10 shrink-0">
                  <span className="text-[9px] font-semibold text-muted-foreground uppercase">
                    {format(parseISO(g.event_date), "MMM")}
                  </span>
                  <span className="text-sm font-bold text-foreground leading-none">
                    {format(parseISO(g.event_date), "d")}
                  </span>
                </div>
                <p className="flex-1 text-sm font-medium text-card-foreground truncate">
                  {g.label || "Game"}
                </p>
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => logResult(g.id, "win")}
                    className="px-2.5 py-1 rounded-md bg-success/10 text-success text-xs font-semibold hover:bg-success/20 transition-colors inline-flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" /> Win
                  </button>
                  <button
                    onClick={() => logResult(g.id, "loss")}
                    className="px-2.5 py-1 rounded-md bg-destructive/10 text-destructive text-xs font-semibold hover:bg-destructive/20 transition-colors inline-flex items-center gap-1"
                  >
                    <XIcon className="w-3.5 h-3.5" /> Loss
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}


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

      {/* Active Feedback */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-semibold text-foreground">Active Feedback</h2>
          <button onClick={() => navigate("/feedback")} className="text-xs text-primary font-medium">View all</button>
        </div>
        {feedbackForms.length === 0 ? (
          <div className="bg-card rounded-xl p-4 shadow-[var(--card-shadow)] text-sm text-muted-foreground text-center">
            No active forms.
          </div>
        ) : (
          feedbackForms.map((form) => (
            <div
              key={form.assignmentId ?? form.id}
              onClick={() =>
                navigate(
                  role === "player" && form.assignmentId
                    ? `/feedback-form?assignment=${form.assignmentId}`
                    : "/feedback"
                )
              }
              className="bg-card rounded-xl p-4 shadow-[var(--card-shadow)] flex items-center gap-3 cursor-pointer hover:bg-accent/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-accent-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm text-card-foreground truncate">{form.title}</p>
                  {role === "player" && form.myDone && (
                    <span className="text-[10px] text-success font-medium shrink-0">✓ Done</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 bg-muted rounded-full h-1.5">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${form.total > 0 ? (form.responses / form.total) * 100 : 0}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{form.responses}/{form.total}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Your Team - Coach/Manager Only, moved to bottom */}
      {(role === "coach" || role === "manager") && teamCode && (
        <div data-tour="profile-team-code" className="bg-card rounded-xl p-4 shadow-[var(--card-shadow)] space-y-3">
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
    </div>
  );
};

export default Dashboard;
