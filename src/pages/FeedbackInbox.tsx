import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { Loader2, Inbox, UserRound, EyeOff, CheckCircle2, Eye, Undo2, Tag, Calendar as CalIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  new: "bg-primary/15 text-primary",
  reviewed: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  resolved: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
};

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "reviewed", label: "Reviewed" },
  { key: "resolved", label: "Resolved" },
  { key: "anonymous", label: "Anonymous" },
  { key: "named", label: "Named" },
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

  return (
    <div className="p-4 space-y-5 max-w-3xl mx-auto">
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Inbox className="w-3 h-3" /> {role === "coach" ? "Coach's View" : "Manager's View"}
        </p>
        <h1 className="text-2xl font-bold font-display text-foreground">Feedback Inbox</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Written reflections from your players. Mark them as reviewed once you've read them, or resolved when you've acted on them.
        </p>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterKey)} className="w-full">
        <TabsList className="flex flex-wrap h-auto justify-start gap-1 bg-muted p-1">
          {FILTERS.map((f) => (
            <TabsTrigger key={f.key} value={f.key} className="text-xs">
              {f.label}
              <span className="ml-1.5 text-[10px] opacity-70">{counts[f.key]}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card rounded-xl p-8 text-center shadow-[var(--card-shadow)]">
          <Inbox className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            {rows.length === 0 ? "No player comments yet." : "Nothing matches this filter."}
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
                className="bg-card rounded-xl p-4 shadow-[var(--card-shadow)] space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
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
                    className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-1 rounded-full ${STATUS_STYLES[r.status]}`}
                  >
                    {r.status}
                  </span>
                </div>

                <p className="text-sm text-card-foreground whitespace-pre-wrap leading-relaxed">
                  {r.content}
                </p>

                <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-border">
                  <div className="flex items-center gap-2 flex-wrap text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-muted">
                      <Tag className="w-3 h-3" /> Player reflection
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-muted">
                      {r.is_anonymous ? (
                        <><EyeOff className="w-3 h-3" /> Anonymous</>
                      ) : (
                        <><UserRound className="w-3 h-3" /> Named</>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {r.status === "new" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy === r.id}
                        onClick={() => updateStatus(r.id, "reviewed")}
                      >
                        <Eye className="w-3.5 h-3.5" /> Mark reviewed
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
                        Mark resolved
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
  );
};

export default FeedbackInbox;
