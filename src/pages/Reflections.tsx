import { useCallback, useEffect, useMemo, useState } from "react";
import { Send, Loader2, Sparkles, Users, TrendingUp, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  format,
  startOfDay,
  startOfWeek,
  startOfMonth,
  subDays,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
} from "date-fns";

type TrendRange = "daily" | "weekly" | "monthly";

interface TrendPoint {
  key: string;
  label: string;
  mood: number | null;
  communication: number | null;
  intensity: number | null;
  support: number | null;
}

const moods = [
  { emoji: "😫", label: "Struggling", value: 1 },
  { emoji: "😟", label: "Low", value: 2 },
  { emoji: "😐", label: "Okay", value: 3 },
  { emoji: "😊", label: "Good", value: 4 },
  { emoji: "🔥", label: "Great", value: 5 },
];

const QUICK_RATING_LABELS = ["Team Communication", "Training Intensity", "Coach Support"];

const moodEmoji = (avg: number | null) => {
  if (avg == null) return "–";
  const rounded = Math.max(1, Math.min(5, Math.round(avg)));
  return moods.find((m) => m.value === rounded)?.emoji ?? "–";
};

const Reflections = () => {
  const { user, role, teamId } = useAuth();
  const isStaff = role === "coach" || role === "manager";

  const [selectedMood, setSelectedMood] = useState(3);
  const [suggestion, setSuggestion] = useState("");
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [anonymous, setAnonymous] = useState(true);
  const [sendingMood, setSendingMood] = useState(false);
  const [sendingSuggestion, setSendingSuggestion] = useState(false);
  const [sendingRatings, setSendingRatings] = useState(false);
  const [loggedToday, setLoggedToday] = useState<boolean | null>(null);

  // Check if the current user has already logged mood today
  const checkTodayMood = useCallback(async () => {
    if (!user) return;
    const startIso = startOfDay(new Date()).toISOString();
    const { data } = await supabase
      .from("morale_checkins")
      .select("id")
      .eq("user_id", user.id)
      .gte("created_at", startIso)
      .limit(1);
    setLoggedToday((data?.length ?? 0) > 0);
  }, [user]);

  useEffect(() => {
    checkTodayMood();
  }, [checkTodayMood]);

  // Staff trend data
  const [trendRange, setTrendRange] = useState<TrendRange>("weekly");
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);
  const [trendLoading, setTrendLoading] = useState(false);

  const loadTrends = useCallback(async () => {
    if (!isStaff || !teamId) return;
    setTrendLoading(true);

    const now = new Date();
    let start: Date;
    let buckets: { key: string; label: string; start: Date; end: Date }[] = [];

    if (trendRange === "daily") {
      start = subDays(startOfDay(now), 13); // last 14 days
      const days = eachDayOfInterval({ start, end: startOfDay(now) });
      buckets = days.map((d) => ({
        key: format(d, "yyyy-MM-dd"),
        label: format(d, "MMM d"),
        start: d,
        end: new Date(d.getTime() + 24 * 60 * 60 * 1000),
      }));
    } else if (trendRange === "weekly") {
      start = subDays(startOfWeek(now, { weekStartsOn: 1 }), 7 * 7); // last 8 weeks
      const weeks = eachWeekOfInterval(
        { start, end: startOfWeek(now, { weekStartsOn: 1 }) },
        { weekStartsOn: 1 }
      );
      buckets = weeks.map((w) => ({
        key: format(w, "yyyy-'W'II"),
        label: format(w, "MMM d"),
        start: w,
        end: new Date(w.getTime() + 7 * 24 * 60 * 60 * 1000),
      }));
    } else {
      start = new Date(now.getFullYear(), now.getMonth() - 5, 1); // last 6 months
      const months = eachMonthOfInterval({ start, end: startOfMonth(now) });
      buckets = months.map((m) => ({
        key: format(m, "yyyy-MM"),
        label: format(m, "MMM yy"),
        start: m,
        end: new Date(m.getFullYear(), m.getMonth() + 1, 1),
      }));
    }

    const startIso = buckets[0].start.toISOString();

    const [moodRes, ratingsRes] = await Promise.all([
      supabase
        .from("morale_checkins")
        .select("mood, created_at")
        .eq("team_id", teamId)
        .gte("created_at", startIso),
      supabase
        .from("feedback_ratings")
        .select("category, rating, created_at")
        .eq("team_id", teamId)
        .gte("created_at", startIso),
    ]);

    const moodRows = moodRes.data ?? [];
    const rRows = ratingsRes.data ?? [];

    const avg = (arr: number[]) =>
      arr.length ? Number((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2)) : null;

    const points: TrendPoint[] = buckets.map((b) => {
      const inBucket = <T extends { created_at: string }>(rows: T[]) =>
        rows.filter((r) => {
          const t = new Date(r.created_at).getTime();
          return t >= b.start.getTime() && t < b.end.getTime();
        });
      const moods = inBucket(moodRows).map((r) => r.mood);
      const ratingsInBucket = inBucket(rRows);
      return {
        key: b.key,
        label: b.label,
        mood: avg(moods),
        communication: avg(
          ratingsInBucket.filter((r) => r.category === "Team Communication").map((r) => r.rating)
        ),
        intensity: avg(
          ratingsInBucket.filter((r) => r.category === "Training Intensity").map((r) => r.rating)
        ),
        support: avg(
          ratingsInBucket.filter((r) => r.category === "Coach Support").map((r) => r.rating)
        ),
      };
    });

    setTrendData(points);
    setTrendLoading(false);
  }, [isStaff, teamId, trendRange]);

  useEffect(() => {
    loadTrends();
  }, [loadTrends]);

  // Staff comparison data
  const [compareLoading, setCompareLoading] = useState(false);
  const [teamMood, setTeamMood] = useState<{ avg: number | null; n: number }>({ avg: null, n: 0 });
  const [yourMood, setYourMood] = useState<{ avg: number | null; n: number }>({ avg: null, n: 0 });
  const [catCompare, setCatCompare] = useState<
    Record<string, { teamAvg: number | null; teamN: number; yourAvg: number | null; yourN: number }>
  >({});

  const loadComparison = useCallback(async () => {
    if (!isStaff || !teamId || !user) return;
    setCompareLoading(true);

    const since7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [moodRes, ratingsRes] = await Promise.all([
      supabase
        .from("morale_checkins")
        .select("user_id, mood, created_at")
        .eq("team_id", teamId)
        .gte("created_at", since7),
      supabase
        .from("feedback_ratings")
        .select("user_id, category, rating, created_at")
        .eq("team_id", teamId)
        .gte("created_at", since30),
    ]);

    // Mood split: team = others, you = self
    const moodRows = moodRes.data ?? [];
    const teamMoods = moodRows.filter((r) => r.user_id !== user.id).map((r) => r.mood);
    const yourMoods = moodRows.filter((r) => r.user_id === user.id).map((r) => r.mood);
    const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);
    setTeamMood({ avg: avg(teamMoods), n: teamMoods.length });
    setYourMood({ avg: avg(yourMoods), n: yourMoods.length });

    // Ratings split per category
    const rRows = ratingsRes.data ?? [];
    const next: typeof catCompare = {};
    for (const cat of QUICK_RATING_LABELS) {
      const teamArr = rRows.filter((r) => r.category === cat && r.user_id !== user.id).map((r) => r.rating);
      const yourArr = rRows.filter((r) => r.category === cat && r.user_id === user.id).map((r) => r.rating);
      next[cat] = {
        teamAvg: avg(teamArr),
        teamN: teamArr.length,
        yourAvg: avg(yourArr),
        yourN: yourArr.length,
      };
    }
    setCatCompare(next);
    setCompareLoading(false);
  }, [isStaff, teamId, user]);

  useEffect(() => {
    loadComparison();
  }, [loadComparison]);

  const submitMood = async () => {
    if (!user || !teamId) return toast.error("No team found");
    if (!isStaff && loggedToday) {
      return toast.info("You've already checked in today. Come back tomorrow!");
    }
    setSendingMood(true);
    const { error } = await supabase.from("morale_checkins").insert({
      user_id: user.id,
      team_id: teamId,
      mood: selectedMood,
    });
    setSendingMood(false);
    if (error) {
      if ((error as { code?: string }).code === "23505") {
        setLoggedToday(true);
        return toast.info("You've already checked in today. Come back tomorrow!");
      }
      return toast.error(error.message);
    }
    setLoggedToday(true);
    toast.success(isStaff ? "Read logged" : "Mood logged — see you tomorrow!");
    if (isStaff) {
      loadComparison();
      loadTrends();
    }
  };

  const submitSuggestion = async () => {
    if (!teamId || !suggestion.trim()) return toast.error("Please write a reflection");
    setSendingSuggestion(true);
    const { error } = await supabase.from("suggestions").insert({
      team_id: teamId,
      content: suggestion.trim(),
      is_anonymous: isStaff ? false : anonymous,
      user_id: isStaff ? user?.id : anonymous ? null : user?.id,
    });
    setSendingSuggestion(false);
    if (error) return toast.error(error.message);
    setSuggestion("");
    toast.success(isStaff ? "Note saved" : "Reflection sent");
  };

  const submitRatings = async () => {
    if (!user || !teamId) return toast.error("No team found");
    const entries = Object.entries(ratings);
    if (entries.length === 0) return toast.error("Please rate at least one category");
    setSendingRatings(true);
    const rows = entries.map(([category, rating]) => ({
      user_id: user.id,
      team_id: teamId,
      category,
      rating,
      is_anonymous: isStaff ? false : anonymous,
    }));
    const { error } = await supabase.from("feedback_ratings").insert(rows);
    setSendingRatings(false);
    if (error) return toast.error(error.message);
    setRatings({});
    toast.success("Ratings submitted");
    if (isStaff) loadComparison();
  };

  // ---------- STAFF VIEW ----------
  if (isStaff) {
    const moodDelta =
      yourMood.avg != null && teamMood.avg != null ? yourMood.avg - teamMood.avg : null;

    return (
      <div className="p-4 space-y-6 max-w-3xl mx-auto">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" /> {role === "coach" ? "Coach's View" : "Manager's View"}
          </p>
          <h1 className="text-2xl font-bold font-display text-foreground">Reflections</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your read on the team — and how it compares to what players report.
          </p>
        </div>

        {/* Trends */}
        <div className="bg-card rounded-xl p-5 shadow-[var(--card-shadow)] space-y-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h2 className="font-display font-semibold text-card-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" /> Team Trends
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Player mood (1–5) and category ratings (1–10) over time.
              </p>
            </div>
            <div className="inline-flex rounded-lg bg-muted p-0.5 text-xs font-medium">
              {(["daily", "weekly", "monthly"] as TrendRange[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setTrendRange(r)}
                  className={`px-3 py-1.5 rounded-md capitalize transition-colors ${
                    trendRange === r
                      ? "bg-card text-card-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {trendLoading ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : trendData.every(
              (p) =>
                p.mood == null &&
                p.communication == null &&
                p.intensity == null &&
                p.support == null
            ) ? (
            <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
              No data yet for this range.
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    stroke="hsl(var(--border))"
                  />
                  <YAxis
                    yAxisId="mood"
                    domain={[1, 5]}
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    stroke="hsl(var(--border))"
                  />
                  <YAxis
                    yAxisId="rating"
                    orientation="right"
                    domain={[1, 10]}
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    stroke="hsl(var(--border))"
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line
                    yAxisId="mood"
                    type="monotone"
                    dataKey="mood"
                    name="Mood (1–5)"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                    connectNulls
                  />
                  <Line
                    yAxisId="rating"
                    type="monotone"
                    dataKey="communication"
                    name="Communication"
                    stroke="hsl(var(--chart-2, 217 91% 60%))"
                    strokeWidth={1.75}
                    dot={false}
                    connectNulls
                  />
                  <Line
                    yAxisId="rating"
                    type="monotone"
                    dataKey="intensity"
                    name="Intensity"
                    stroke="hsl(var(--chart-3, 32 95% 55%))"
                    strokeWidth={1.75}
                    dot={false}
                    connectNulls
                  />
                  <Line
                    yAxisId="rating"
                    type="monotone"
                    dataKey="support"
                    name="Coach Support"
                    stroke="hsl(var(--chart-4, 142 71% 45%))"
                    strokeWidth={1.75}
                    dot={false}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>


        <div className="bg-card rounded-xl p-5 shadow-[var(--card-shadow)] space-y-4">
          <h2 className="font-display font-semibold text-card-foreground text-center">
            How do you read the team's mood today?
          </h2>
          <div className="flex justify-between items-center px-2">
            {moods.map((mood) => (
              <button
                key={mood.value}
                onClick={() => setSelectedMood(mood.value)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                  selectedMood === mood.value ? "bg-accent scale-110" : "opacity-50 hover:opacity-75"
                }`}
              >
                <span className="text-3xl">{mood.emoji}</span>
                <span className="text-[10px] font-medium text-muted-foreground">{mood.label}</span>
              </button>
            ))}
          </div>
          <Button onClick={submitMood} disabled={sendingMood} className="w-full">
            {sendingMood ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Log your read
          </Button>

          {/* Comparison strip */}
          <div className="border-t border-border pt-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Users className="w-3 h-3" /> Last 7 days
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted rounded-lg p-3 text-center">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Team reports</p>
                <p className="text-2xl mt-1">{moodEmoji(teamMood.avg)}</p>
                <p className="text-xs text-card-foreground font-medium mt-1">
                  {teamMood.avg != null ? teamMood.avg.toFixed(1) : "–"} / 5
                </p>
                <p className="text-[10px] text-muted-foreground">{teamMood.n} check-in{teamMood.n === 1 ? "" : "s"}</p>
              </div>
              <div className="bg-primary/10 rounded-lg p-3 text-center">
                <p className="text-[10px] uppercase tracking-wider text-primary">Your read</p>
                <p className="text-2xl mt-1">{moodEmoji(yourMood.avg)}</p>
                <p className="text-xs text-card-foreground font-medium mt-1">
                  {yourMood.avg != null ? yourMood.avg.toFixed(1) : "–"} / 5
                </p>
                <p className="text-[10px] text-muted-foreground">{yourMood.n} check-in{yourMood.n === 1 ? "" : "s"}</p>
              </div>
            </div>
            {moodDelta != null && Math.abs(moodDelta) >= 0.05 && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                You're reading the team{" "}
                <span className="font-semibold text-foreground">
                  {Math.abs(moodDelta).toFixed(1)} {moodDelta > 0 ? "higher" : "lower"}
                </span>{" "}
                than they report.
              </p>
            )}
            {teamMood.n === 0 && (
              <p className="text-xs text-muted-foreground mt-2 text-center">No player check-ins yet this week.</p>
            )}
          </div>
        </div>

        {/* Category ratings + comparison */}
        <div className="bg-card rounded-xl p-5 shadow-[var(--card-shadow)] space-y-5">
          <div>
            <h2 className="font-display font-semibold text-card-foreground">Rate the team — then compare</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Your 1–10 rating vs. the player average over the last 30 days.
            </p>
          </div>
          {QUICK_RATING_LABELS.map((label) => {
            const c = catCompare[label];
            const teamPct = c?.teamAvg != null ? (c.teamAvg / 10) * 100 : 0;
            const yourPct = c?.yourAvg != null ? (c.yourAvg / 10) * 100 : 0;
            const gap = c?.teamAvg != null && c?.yourAvg != null ? c.yourAvg - c.teamAvg : null;
            return (
              <div key={label} className="space-y-2">
                <p className="text-sm font-medium text-card-foreground">{label}</p>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <button
                      key={n}
                      onClick={() => setRatings((p) => ({ ...p, [label]: n }))}
                      className={`flex-1 h-8 rounded text-xs font-medium transition-colors ${
                        (ratings[label] || 0) >= n
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-accent"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>

                {/* Comparison */}
                {compareLoading ? (
                  <div className="h-10 flex items-center"><Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" /></div>
                ) : (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground w-14">Team</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-muted-foreground/60 rounded-full" style={{ width: `${teamPct}%` }} />
                      </div>
                      <span className="text-xs font-medium text-card-foreground w-14 text-right">
                        {c?.teamAvg != null ? `${c.teamAvg.toFixed(1)} (${c.teamN})` : "—"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase tracking-wider text-primary w-14">You</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${yourPct}%` }} />
                      </div>
                      <span className="text-xs font-medium text-card-foreground w-14 text-right">
                        {c?.yourAvg != null ? `${c.yourAvg.toFixed(1)} (${c.yourN})` : "—"}
                      </span>
                    </div>
                    {gap != null && Math.abs(gap) >= 0.05 && (
                      <p className="text-[11px] text-muted-foreground">
                        Gap: {gap > 0 ? "+" : ""}
                        {gap.toFixed(1)} ({gap > 0 ? "you rate higher" : "players rate higher"})
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          <Button onClick={submitRatings} disabled={sendingRatings} className="w-full">
            {sendingRatings ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Submit ratings
          </Button>
        </div>

        {/* Staff note */}
        <div className="bg-card rounded-xl p-5 shadow-[var(--card-shadow)] space-y-4">
          <div>
            <h2 className="font-display font-semibold text-card-foreground">Note to yourself / staff</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Private staff-side reflection on how the week is going.
            </p>
          </div>
          <textarea
            value={suggestion}
            onChange={(e) => setSuggestion(e.target.value)}
            placeholder="What's working, what's not, what to adjust..."
            maxLength={1000}
            className="w-full h-28 p-3 rounded-lg bg-muted text-foreground text-sm placeholder:text-muted-foreground resize-none border border-border focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="flex justify-end">
            <Button onClick={submitSuggestion} disabled={sendingSuggestion} size="sm">
              {sendingSuggestion ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Save note
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- PLAYER VIEW (unchanged) ----------
  return (
    <div className="p-4 space-y-6 max-w-3xl mx-auto">
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3 h-3" /> Personal
        </p>
        <h1 className="text-2xl font-bold font-display text-foreground">Reflections</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Quick personal check-ins, anonymous notes to your coach, and quick category ratings.
        </p>
      </div>

      {/* Mood */}
      <div className="bg-card rounded-xl p-5 shadow-[var(--card-shadow)] space-y-4">
        <h2 className="font-display font-semibold text-card-foreground text-center">How are you feeling today?</h2>
        <div className="flex justify-between items-center px-2">
          {moods.map((mood) => (
            <button
              key={mood.value}
              onClick={() => setSelectedMood(mood.value)}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                selectedMood === mood.value ? "bg-accent scale-110" : "opacity-50 hover:opacity-75"
              }`}
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
          Log mood
        </Button>
      </div>

      {/* Anonymous note */}
      <div className="bg-card rounded-xl p-5 shadow-[var(--card-shadow)] space-y-4">
        <h2 className="font-display font-semibold text-card-foreground">Anonymous reflection</h2>
        <p className="text-xs text-muted-foreground">Share thoughts privately with your coach.</p>
        <textarea
          value={suggestion}
          onChange={(e) => setSuggestion(e.target.value)}
          placeholder="Anything on your mind..."
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

      {/* Quick ratings */}
      <div className="bg-card rounded-xl p-5 shadow-[var(--card-shadow)] space-y-4">
        <h2 className="font-display font-semibold text-card-foreground">Quick ratings</h2>
        {QUICK_RATING_LABELS.map((label) => (
          <div key={label} className="space-y-1.5">
            <p className="text-sm text-card-foreground">{label}</p>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <button
                  key={n}
                  onClick={() => setRatings((p) => ({ ...p, [label]: n }))}
                  className={`flex-1 h-8 rounded text-xs font-medium transition-colors ${
                    (ratings[label] || 0) >= n
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        ))}
        <Button onClick={submitRatings} disabled={sendingRatings} className="w-full">
          {sendingRatings ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Submit ratings
        </Button>
      </div>
    </div>
  );
};

export default Reflections;
