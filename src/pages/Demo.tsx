import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Loader2, Sparkles, Trash2, ShieldAlert } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

// Marker used so we can find + remove demo rows later.
const DEMO_TAG = "[DEMO]";

const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};
const isoDate = (d: Date) => d.toISOString().slice(0, 10);

const DEMO_TASKS = [
  { text: `${DEMO_TAG} Watch film from last game`, category: "Mental", done: true, due: -2 },
  { text: `${DEMO_TAG} 30 min mobility routine`, category: "Physical", done: true, due: -1 },
  { text: `${DEMO_TAG} 50 free throws after practice`, category: "Technical", done: false, due: 1 },
  { text: `${DEMO_TAG} Team huddle — set weekly goal`, category: "Teamwork", done: false, due: 2 },
  { text: `${DEMO_TAG} Hydration + sleep log`, category: "Physical", done: false, due: 0 },
];

const DEMO_EVENTS = [
  { type: "game", label: `${DEMO_TAG} vs Eagles`, day: -14, result: "win", regular: true },
  { type: "game", label: `${DEMO_TAG} vs Hawks`, day: -7, result: "loss", regular: true },
  { type: "game", label: `${DEMO_TAG} vs Wolves`, day: -3, result: "win", regular: true },
  { type: "game", label: `${DEMO_TAG} vs Bears`, day: 4, result: null, regular: true },
  { type: "practice", label: `${DEMO_TAG} Skills practice`, day: 1, result: null, regular: true },
  { type: "practice", label: `${DEMO_TAG} Conditioning`, day: 3, result: null, regular: true },
  { type: "other", label: `${DEMO_TAG} Team dinner`, day: 6, result: null, regular: true },
];

const DEMO_SUGGESTIONS = [
  { content: `${DEMO_TAG} Practices have felt sharper lately — drills are clicking.`, anon: false, status: "new" as const },
  { content: `${DEMO_TAG} Could we add 10 min of stretching at the end? My hamstrings are tight.`, anon: true, status: "new" as const },
  { content: `${DEMO_TAG} I think the offensive sets are confusing some of the new players.`, anon: true, status: "reviewed" as const },
  { content: `${DEMO_TAG} Loved the film session — really helped me see my spacing.`, anon: false, status: "resolved" as const },
];

const DEMO_RATINGS: { category: string; rating: number }[] = [
  { category: "Team Communication", rating: 8 },
  { category: "Training Intensity", rating: 7 },
  { category: "Coach Support", rating: 9 },
];

const DEMO_MOODS = [5, 4, 4, 3, 5, 4, 3];

const Demo = () => {
  const { user, role, teamId, loading: authLoading } = useAuth();
  const [busy, setBusy] = useState<null | "seed" | "clear">(null);

  if (authLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;

  const seed = async () => {
    if (!teamId) return toast.error("Join or create a team first.");
    setBusy("seed");
    try {
      // Tasks
      const taskRows = DEMO_TASKS.map((t) => ({
        user_id: user.id,
        team_id: teamId,
        assigned_by: user.id,
        text: t.text,
        category: t.category,
        done: t.done,
        due_date: isoDate(daysAgo(-t.due)),
      }));
      // Calendar events
      const eventRows = DEMO_EVENTS.map((e) => ({
        team_id: teamId,
        created_by: user.id,
        event_type: e.type,
        label: e.label,
        event_date: isoDate(daysAgo(-e.day)),
        event_time: "18:00",
        location: "Home Gym",
        game_result: e.result,
        is_regular_season: e.regular,
      }));
      // Suggestions
      const suggestionRows = DEMO_SUGGESTIONS.map((s) => ({
        team_id: teamId,
        content: s.content,
        is_anonymous: s.anon,
        user_id: s.anon ? null : user.id,
        status: s.status,
      }));
      // Ratings (last 30 days, 1 row per category)
      const ratingRows = DEMO_RATINGS.map((r) => ({
        user_id: user.id,
        team_id: teamId,
        category: r.category,
        rating: r.rating,
        is_anonymous: false,
      }));
      // Mood — one per day for the last week
      const moodRows = DEMO_MOODS.map((m, i) => ({
        user_id: user.id,
        team_id: teamId,
        mood: m,
        created_at: daysAgo(i).toISOString(),
      }));

      const [t1, t2, t3, t4, t5] = await Promise.all([
        supabase.from("action_steps").insert(taskRows),
        supabase.from("calendar_events").insert(eventRows),
        supabase.from("suggestions").insert(suggestionRows),
        supabase.from("feedback_ratings").insert(ratingRows),
        supabase.from("morale_checkins").insert(moodRows),
      ]);

      const errs = [t1, t2, t3, t4, t5].map((r) => r.error?.message).filter(Boolean);
      if (errs.length) {
        toast.error(`Some inserts failed: ${errs[0]}`);
      } else {
        toast.success("Demo data loaded across the app.");
      }
    } finally {
      setBusy(null);
    }
  };

  const clear = async () => {
    if (!teamId) return;
    setBusy("clear");
    try {
      const [r1, r2, r3, r4, r5] = await Promise.all([
        supabase.from("action_steps").delete().eq("team_id", teamId).ilike("text", `${DEMO_TAG}%`),
        supabase.from("calendar_events").delete().eq("team_id", teamId).ilike("label", `${DEMO_TAG}%`),
        supabase.from("suggestions").delete().eq("team_id", teamId).ilike("content", `${DEMO_TAG}%`),
        // Ratings/moods have no text — clear by category/user for safety (only this user's recent demo rows)
        supabase
          .from("feedback_ratings")
          .delete()
          .eq("team_id", teamId)
          .eq("user_id", user.id)
          .in("category", DEMO_RATINGS.map((r) => r.category)),
        supabase
          .from("morale_checkins")
          .delete()
          .eq("team_id", teamId)
          .eq("user_id", user.id)
          .gte("created_at", daysAgo(8).toISOString()),
      ]);
      const errs = [r1, r2, r3, r4, r5].map((r) => r.error?.message).filter(Boolean);
      if (errs.length) toast.error(`Some deletes failed: ${errs[0]}`);
      else toast.success("Demo data cleared.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="p-4 space-y-5 max-w-2xl mx-auto">
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3 h-3" /> Internal
        </p>
        <h1 className="text-2xl font-bold font-display text-foreground">Demo Data</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Seeds the app with sample tasks, calendar events, feedback comments, ratings, and mood
          check-ins so you can demo the experience. This page is intentionally not linked from any
          menu.
        </p>
      </div>

      <div className="bg-card rounded-xl p-5 shadow-[var(--card-shadow)] space-y-4">
        <div className="text-sm text-card-foreground space-y-1.5">
          <p><span className="font-semibold">Signed in as:</span> {user.email}</p>
          <p><span className="font-semibold">Role:</span> {role ?? "—"}</p>
          <p><span className="font-semibold">Team:</span> {teamId ?? "no team"}</p>
        </div>

        <div className="rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 p-3 text-xs flex gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
          <p>
            Use a dedicated demo team. Seeded rows are tagged with <code>{DEMO_TAG}</code> in their
            text so "Clear demo data" can find and remove them.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={seed} disabled={busy !== null || !teamId}>
            {busy === "seed" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Load demo data
          </Button>
          <Button onClick={clear} disabled={busy !== null || !teamId} variant="outline">
            {busy === "clear" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Clear demo data
          </Button>
        </div>

        <div className="text-xs text-muted-foreground space-y-1 border-t border-border pt-3">
          <p className="font-semibold text-foreground">Will insert:</p>
          <ul className="list-disc pl-5 space-y-0.5">
            <li>{DEMO_TASKS.length} action steps across Technical / Mental / Physical / Teamwork</li>
            <li>{DEMO_EVENTS.length} calendar events (games with W/L, practices, team event)</li>
            <li>{DEMO_SUGGESTIONS.length} player feedback comments (mix of anonymous + named)</li>
            <li>{DEMO_RATINGS.length} category ratings + {DEMO_MOODS.length} daily mood check-ins</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Demo;
