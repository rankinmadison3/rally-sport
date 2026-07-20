import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  Loader2, Inbox, UserRound, EyeOff, CheckCircle2, Eye, Undo2, Tag, Calendar as CalIcon,
  MessageSquare, Sparkles, Filter,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { HeroCard, StatTile } from "@/components/ui/hero-card";

type Status = "new" | "reviewed" | "resolved";

interface SuggestionRow {
  id: string;
  team_id: string;
  content: string;
  is_anonymous: boolean;
  user_id: string | null;
  created_at: string;
  status: Status;
}

type FilterKey = "all" | "new" | "reviewed" | "resolved" | "anonymous" | "named";

const STATUS_STYLES: Record<Status, string> = {
  new: "bg-primary/15 text-primary border-primary/30",
  reviewed: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  resolved: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
};

const FILTERS: { key: FilterKey; label: string; icon: any }[] = [
  { key: "all", label: "All", icon: Inbox },
  { key: "new", label: "New", icon: Sparkles },
  { key: "reviewed", label: "Reviewed", icon: Eye },
  { key: "resolved", label: "Resolved", icon: CheckCircle2 },
  { key: "anonymous", label: "Anonymous", icon: EyeOff },
  { key: "named", label: "Named", icon: UserRound },
];

const FeedbackInbox = () => {
  const { user, role, teamId, loading: authLoading } = useAuth();
  const isStaff = role === "coach" || role === "manager";

  const [rows, setRows] = useState<SuggestionRow[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!teamId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("suggestions")
      .select("*")
      .eq("team_id", teamId)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    const list = (data ?? []) as SuggestionRow[];
    setRows(list);

    const namedIds = Array.from(
      new Set(list.filter((r) => !r.is_anonymous && r.user_id).map((r) => r.user_id as string)),
    );
    if (namedIds.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", namedIds);
      setNames(Object.fromEntries((profs ?? []).map((p) => [p.user_id, p.display_name])));
    } else {
      setNames({});
    }
    setLoading(false);
  }, [teamId]);

  useEffect(() => {
    if (isStaff) load();
  }, [isStaff, load]);

  const counts = useMemo(() => {
    const c = { all: rows.length, new: 0, reviewed: 0, resolved: 0, anonymous: 0, named: 0 };
    for (const r of rows) {
      c[r.status] += 1;
      if (r.is_anonymous) c.anonymous += 1;
      else c.named += 1;
    }
    return c;
  }, [rows]);

  const filtered = useMemo(() => {
    switch (filter) {
      case "all":
        return rows;
      case "anonymous":
        return rows.filter((r) => r.is_anonymous);
      case "named":
        return rows.filter((r) => !r.is_anonymous);
      default:
        return rows.filter((r) => r.status === filter);
    }
  }, [rows, filter]);

  const updateStatus = async (id: string, status: Status) => {
    setBusy(id);
    const prev = rows;
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
    const { error } = await supabase.from("suggestions").update({ status }).eq("id", id);
    setBusy(null);
    if (error) {
      setRows(prev);
      toast.error(error.message);
      return;
    }
    toast.success(`Marked ${status}`);
  };

  if (authLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (!isStaff) return <Navigate to="/" replace />;

  const resolvedPct = counts.all === 0 ? 0 : Math.round((counts.resolved / counts.all) * 100);

  return (
    <div className="p-4 space-y-5 max-w-6xl mx-auto">
      <HeroCard
        eyebrow={role === "coach" ? "Coach's Command · Inbox" : "Manager's Command · Inbox"}
        title="Feedback Inbox"
        subtitle="Written reflections from your players. Triage, review, and resolve — nothing gets lost."
        icon={<MessageSquare className="w-5 h-5" />}
        right={
          <div className="hidden sm:flex flex-col items-end">
            <p className="text-[10px] uppercase tracking-[0.18em] text-primary-foreground/70">Resolved</p>
            <p className="text-2xl font-bold font-display leading-none">{resolvedPct}%</p>
          </div>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatTile icon={<Sparkles className="w-4 h-4" />} label="New" value={counts.new} hint="need review" />
        <StatTile icon={<Eye className="w-4 h-4" />} label="Reviewed" value={counts.reviewed} hint="in progress" accent="bg-amber-500/15 text-amber-600" />
        <StatTile icon={<CheckCircle2 className="w-4 h-4" />} label="Resolved" value={counts.resolved} hint="closed out" accent="bg-emerald-500/15 text-emerald-600" />
        <StatTile icon={<EyeOff className="w-4 h-4" />} label="Anonymous" value={counts.anonymous} hint={`${counts.named} named`} accent="bg-blue-500/15 text-blue-600" />
      </div>

      {/* Command center layout: rail + list */}
      <div className="grid md:grid-cols-[220px,1fr] gap-4">
        {/* Filter rail */}
        <aside className="bg-card/60 backdrop-blur-sm rounded-2xl p-2 border border-border/60 shadow-[var(--card-shadow)] h-max md:sticky md:top-4">
          <div className="px-3 pt-2 pb-2 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Triage</p>
          </div>
          <div className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible">
            {FILTERS.map((f) => {
              const active = filter === f.key;
              const Icon = f.icon;
              return (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-left transition-colors shrink-0 md:w-full ${
                    active
                      ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                      : "hover:bg-muted text-foreground/80"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="flex-1">{f.label}</span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      active ? "bg-primary-foreground/20" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {counts[f.key]}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Queue */}
        <div>
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-card rounded-2xl p-10 text-center shadow-[var(--card-shadow)] border border-border/60">
              <Inbox className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-sm font-semibold text-foreground">
                {rows.length === 0 ? "No player comments yet." : "Nothing matches this filter."}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {rows.length === 0
                  ? "Suggestions from your team will land here."
                  : "Try another filter from the rail."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((r) => {
                const author = r.is_anonymous
                  ? "Anonymous player"
                  : (r.user_id && names[r.user_id]) || "Player";
                return (
                  <article
                    key={r.id}
                    className={`bg-card rounded-2xl p-5 shadow-[var(--card-shadow)] border-l-4 space-y-3 transition-shadow hover:shadow-md ${
                      r.status === "new"
                        ? "border-l-primary"
                        : r.status === "reviewed"
                        ? "border-l-amber-500"
                        : "border-l-emerald-500"
                    } border-y border-r border-border/60`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            r.is_anonymous ? "bg-muted text-muted-foreground" : "bg-primary/15 text-primary"
                          }`}
                        >
                          {r.is_anonymous ? <EyeOff className="w-4 h-4" /> : <UserRound className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-card-foreground truncate">{author}</p>
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <CalIcon className="w-3 h-3" />
                            {new Date(r.created_at).toLocaleString(undefined, {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full border ${STATUS_STYLES[r.status]}`}
                      >
                        {r.status}
                      </span>
                    </div>

                    <p className="text-sm text-card-foreground whitespace-pre-wrap leading-relaxed border-l-2 border-border/60 pl-3 italic">
                      {r.content}
                    </p>

                    <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                      <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted">
                          <Tag className="w-3 h-3" /> Reflection
                        </span>
                        {r.is_anonymous && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted">
                            <EyeOff className="w-3 h-3" /> Anonymous
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {r.status === "new" && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy === r.id}
                            onClick={() => updateStatus(r.id, "reviewed")}
                          >
                            <Eye className="w-3.5 h-3.5" /> Reviewed
                          </Button>
                        )}
                        {r.status === "reviewed" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={busy === r.id}
                            onClick={() => updateStatus(r.id, "new")}
                          >
                            <Undo2 className="w-3.5 h-3.5" /> Undo
                          </Button>
                        )}
                        {r.status !== "resolved" ? (
                          <Button
                            size="sm"
                            disabled={busy === r.id}
                            onClick={() => updateStatus(r.id, "resolved")}
                          >
                            {busy === r.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                            Resolve
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={busy === r.id}
                            onClick={() => updateStatus(r.id, "reviewed")}
                          >
                            <Undo2 className="w-3.5 h-3.5" /> Reopen
                          </Button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedbackInbox;
