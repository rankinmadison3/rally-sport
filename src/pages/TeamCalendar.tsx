import { useState, useEffect, useCallback } from "react";
import { Trophy, XCircle, Clock, MapPin, ChevronLeft, ChevronRight, Plus, Download, Pencil, Calendar as CalendarIcon, Users, Dumbbell, ClipboardCheck, CheckCircle2, Flame } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, getDay, getDaysInMonth, addMonths, subMonths, isToday as isDateToday } from "date-fns";
import { Button } from "@/components/ui/button";
import EventDialog, { EventFormValue } from "@/components/calendar/EventDialog";
import { downloadIcs } from "@/lib/icsExport";
import { HeroCard } from "@/components/ui/hero-card";

interface MyTask {
  id: string;
  text: string;
  category: string | null;
  due_date: string;
  done: boolean;
}


interface CalendarEvent {
  id: string;
  event_type: string;
  label: string;
  event_date: string;
  event_time: string | null;
  location: string | null;
  game_result: string | null;
  is_regular_season: boolean;
}

const TeamCalendar = () => {
  const { user, role, teamId } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [myTasks, setMyTasks] = useState<MyTask[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<EventFormValue> | null>(null);
  const [exporting, setExporting] = useState(false);

  const canEdit = role === "coach" || role === "manager";
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = getDaysInMonth(currentMonth);
  const startDay = getDay(startOfMonth(currentMonth));

  const fetchEvents = useCallback(async () => {
    if (!teamId) return;
    const start = format(startOfMonth(currentMonth), "yyyy-MM-dd");
    const end = format(endOfMonth(currentMonth), "yyyy-MM-dd");
    const { data } = await supabase
      .from("calendar_events")
      .select("id, event_type, label, event_date, event_time, location, game_result, is_regular_season")
      .eq("team_id", teamId)
      .gte("event_date", start)
      .lte("event_date", end)
      .order("event_date", { ascending: true });
    setEvents((data as CalendarEvent[]) || []);
    setLoading(false);
  }, [teamId, currentMonth]);

  const fetchMyTasks = useCallback(async () => {
    if (!user) return;
    const start = format(startOfMonth(currentMonth), "yyyy-MM-dd");
    const end = format(endOfMonth(currentMonth), "yyyy-MM-dd");
    const { data } = await supabase
      .from("action_steps")
      .select("id, text, category, due_date, done")
      .eq("user_id", user.id)
      .not("due_date", "is", null)
      .gte("due_date", start)
      .lte("due_date", end);
    setMyTasks((data as MyTask[]) || []);
  }, [user, currentMonth]);

  useEffect(() => {
    setLoading(true);
    fetchEvents();
    fetchMyTasks();
  }, [fetchEvents, fetchMyTasks]);

  // Realtime sync — every team member sees changes immediately
  useEffect(() => {
    if (!teamId) return;
    const channel = supabase
      .channel(`calendar-${teamId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "calendar_events", filter: `team_id=eq.${teamId}` },
        () => fetchEvents()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamId, fetchEvents]);

  const updateEvent = async (eventId: string, updates: Partial<CalendarEvent>) => {
    setUpdating(eventId);
    const { error } = await supabase.from("calendar_events").update(updates).eq("id", eventId);
    if (error) {
      toast.error("Failed to update event");
    } else {
      setEvents((prev) => prev.map((e) => (e.id === eventId ? { ...e, ...updates } : e)));
      toast.success("Updated");
    }
    setUpdating(null);
  };

  const getEventsForDay = (day: number) => {
    const dateStr = format(new Date(year, month, day), "yyyy-MM-dd");
    return events.filter((e) => e.event_date === dateStr);
  };

  const getTasksForDay = (day: number) => {
    const dateStr = format(new Date(year, month, day), "yyyy-MM-dd");
    return myTasks.filter((t) => t.due_date === dateStr);
  };

  const dayEvents = selectedDay ? getEventsForDay(selectedDay) : [];
  const dayTasks = selectedDay ? getTasksForDay(selectedDay) : [];

  const openCreate = () => {
    const dateStr = selectedDay
      ? format(new Date(year, month, selectedDay), "yyyy-MM-dd")
      : format(new Date(), "yyyy-MM-dd");
    setEditing({ event_date: dateStr });
    setDialogOpen(true);
  };

  const openEdit = (evt: CalendarEvent) => {
    setEditing({
      id: evt.id,
      event_type: evt.event_type,
      label: evt.label,
      event_date: evt.event_date,
      event_time: evt.event_time,
      location: evt.location,
      is_regular_season: evt.is_regular_season,
    });
    setDialogOpen(true);
  };

  const handleExport = async () => {
    if (!teamId) return;
    setExporting(true);
    // Export all events for the team, not just this month
    const { data, error } = await supabase
      .from("calendar_events")
      .select("id, event_type, label, event_date, event_time, location, game_result, is_regular_season")
      .eq("team_id", teamId)
      .order("event_date", { ascending: true });
    setExporting(false);
    if (error || !data) {
      toast.error("Failed to export");
      return;
    }
    if (data.length === 0) {
      toast.info("No events to export");
      return;
    }
    downloadIcs(data as CalendarEvent[], "team-calendar.ics");
    toast.success(`Exported ${data.length} event${data.length === 1 ? "" : "s"}`);
  };

  // Next upcoming event across all months (from current month's fetched events)
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const upcoming = events
    .filter((e) => e.event_date >= todayStr)
    .sort((a, b) => a.event_date.localeCompare(b.event_date))[0];

  const daysUntil = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return Math.round((d.getTime() - t.getTime()) / 86400000);
  };

  // 14-day density strip
  const stripDays = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + i);
    const ds = format(d, "yyyy-MM-dd");
    const evts = events.filter((e) => e.event_date === ds);
    const tsks = myTasks.filter((t) => t.due_date === ds);
    return {
      date: d,
      hasGame: evts.some((e) => e.event_type === "game"),
      hasPractice: evts.some((e) => e.event_type === "practice"),
      hasOther: evts.some((e) => !["game", "practice"].includes(e.event_type)),
      hasTask: tsks.length > 0,
    };
  });

  const upcomingIcon =
    upcoming?.event_type === "game" ? <Trophy className="w-5 h-5" /> :
    upcoming?.event_type === "practice" ? <Dumbbell className="w-5 h-5" /> :
    upcoming?.event_type === "absence" ? <XCircle className="w-5 h-5" /> :
    <CalendarIcon className="w-5 h-5" />;

  return (
    <div className="p-4 space-y-5 pb-8">
      <div className="flex items-center justify-end gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={handleExport}
          disabled={exporting}
          className="gap-1.5 rounded-full border-primary/20 bg-card/80 backdrop-blur-sm"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Export .ics</span>
        </Button>
        {canEdit && (
          <Button size="sm" onClick={openCreate} className="gap-1.5 rounded-full shadow-lg shadow-primary/25">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Event</span>
          </Button>
        )}
      </div>

      <HeroCard
        eyebrow="Team Schedule"
        title="Calendar"
        subtitle={
          upcoming
            ? `${upcoming.label} · ${format(new Date(upcoming.event_date + "T00:00:00"), "EEE MMM d")}${
                daysUntil(upcoming.event_date) === 0
                  ? " · Today"
                  : daysUntil(upcoming.event_date) === 1
                  ? " · Tomorrow"
                  : ` · in ${daysUntil(upcoming.event_date)} days`
              }`
            : "Synced with all team members"
        }
        icon={<CalendarIcon className="w-5 h-5" />}
        right={
          upcoming && (
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-primary-foreground/20 blur-md animate-pulse" />
              <div className="relative w-16 h-16 rounded-2xl bg-primary-foreground/15 backdrop-blur-sm border border-primary-foreground/20 flex flex-col items-center justify-center shadow-xl">
                {upcomingIcon}
                <span className="text-[10px] uppercase tracking-wider text-primary-foreground/90 mt-0.5 font-semibold">
                  {format(new Date(upcoming.event_date + "T00:00:00"), "MMM d")}
                </span>
              </div>
            </div>
          )
        }
      >
        {/* 14-day density strip as activity bars */}
        <div className="flex items-end justify-between gap-1 pt-1">
          {stripDays.map((s, i) => {
            const anything = s.hasGame || s.hasPractice || s.hasOther || s.hasTask;
            const intensity = [s.hasGame, s.hasPractice, s.hasOther, s.hasTask].filter(Boolean).length;
            const isTodayStrip = isDateToday(s.date);
            return (
              <div key={i} className="flex flex-col items-center flex-1 min-w-0">
                <div className="h-10 flex items-end gap-0.5">
                  {s.hasGame && (
                    <div className="w-1.5 rounded-t-full bg-primary-foreground h-6 shadow-[0_0_8px_rgba(255,255,255,0.35)]" />
                  )}
                  {s.hasPractice && (
                    <div className="w-1.5 rounded-t-full bg-primary-foreground/70 h-4" />
                  )}
                  {s.hasOther && (
                    <div className="w-1.5 rounded-t-full bg-primary-foreground/50 h-3" />
                  )}
                  {s.hasTask && (
                    <div className="w-1 rounded-t-full border border-primary-foreground/80 h-2.5" />
                  )}
                  {!anything && <div className="w-1 rounded-t-full bg-primary-foreground/20 h-1.5" />}
                </div>
                <span
                  className={`text-[9px] font-semibold mt-1.5 px-1.5 py-0.5 rounded-full ${
                    isTodayStrip
                      ? "bg-primary-foreground text-primary"
                      : "text-primary-foreground/70"
                  }`}
                >
                  {format(s.date, "d")}
                </span>
              </div>
            );
          })}
        </div>
      </HeroCard>

      <div className="bg-card rounded-2xl p-4 shadow-[var(--card-shadow)] border border-border/50 overflow-hidden relative">
        {/* subtle top gradient bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/70 to-primary-foreground/30" />

        <div className="flex items-center justify-between mb-5">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 rounded-xl hover:bg-muted active:scale-95 transition-all"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="text-center">
            <h2 className="font-display font-bold text-card-foreground text-lg tracking-tight">
              {format(currentMonth, "MMMM")}
            </h2>
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest">
              {format(currentMonth, "yyyy")}
            </span>
          </div>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 rounded-xl hover:bg-muted active:scale-95 transition-all"
            aria-label="Next month"
          >
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div key={i} className="text-center text-[10px] font-bold text-muted-foreground/70 py-1 uppercase tracking-wider">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: startDay }).map((_, i) => <div key={`e-${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateObj = new Date(year, month, day);
            const dayEvts = getEventsForDay(day);
            const dayTsks = getTasksForDay(day);
            const isSelected = selectedDay === day;
            const today = isDateToday(dateObj);
            const hasGame = dayEvts.some((e) => e.event_type === "game");
            const hasAbsence = dayEvts.some((e) => e.event_type === "absence");
            const hasPractice = dayEvts.some((e) => e.event_type === "practice");
            const hasOther = dayEvts.some((e) => !["game", "absence", "practice"].includes(e.event_type));
            const hasWin = dayEvts.some((e) => e.game_result === "win");
            const hasLoss = dayEvts.some((e) => e.game_result === "loss");
            const hasTask = dayTsks.length > 0;
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`relative aspect-square flex flex-col items-center justify-center rounded-xl text-sm transition-all duration-200 border ${
                  isSelected
                    ? "bg-muted text-card-foreground font-bold border-primary/40 shadow-[0_0_0_2px_hsl(var(--primary)/0.25)] z-10"
                    : today
                    ? "bg-primary/10 text-primary font-bold border-primary/30"
                    : "hover:bg-muted/80 hover:border-border/80 text-card-foreground border-transparent"
                }`}
              >
                <span className={`${today ? "relative" : ""}`}>
                  {day}
                  {today && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                  )}
                </span>
                {(dayEvts.length > 0 || hasTask) && (
                  <div className="absolute bottom-1.5 flex gap-0.5 items-center">
                    {hasGame && !hasWin && !hasLoss && <Trophy className="w-3.5 h-3.5 text-primary" />}
                    {hasWin && <div className="w-2.5 h-2.5 rounded-full bg-success shadow-sm" />}
                    {hasLoss && <div className="w-2.5 h-2.5 rounded-full bg-destructive shadow-sm" />}
                    {hasAbsence && <XCircle className="w-3.5 h-3.5 text-destructive" />}
                    {hasPractice && !hasGame && <Dumbbell className="w-3.5 h-3.5 text-success" />}
                    {hasOther && !hasGame && !hasPractice && <div className="w-2 h-2 rounded-full bg-primary" />}
                    {hasTask && <ClipboardCheck className="w-3.5 h-3.5 text-accent-foreground" />}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border/60">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-[10px] font-medium text-primary">
            <Trophy className="w-3 h-3" /> Game
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-success/10 text-[10px] font-medium text-success">
            <div className="w-2 h-2 rounded-full bg-success" /> Win
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-success/10 text-[10px] font-medium text-success">
            <Dumbbell className="w-3 h-3" /> Practice
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-destructive/10 text-[10px] font-medium text-destructive">
            <div className="w-2 h-2 rounded-full bg-destructive" /> Loss
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-destructive/10 text-[10px] font-medium text-destructive">
            <XCircle className="w-3 h-3" /> Absence
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-muted text-[10px] font-medium text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-primary" /> Other
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-accent text-[10px] font-medium text-accent-foreground">
            <ClipboardCheck className="w-3 h-3" /> My tasks
          </span>
        </div>
      </div>

      {selectedDay && (
        <div className="bg-card rounded-xl p-4 shadow-[var(--card-shadow)] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-semibold text-card-foreground">
              {format(new Date(year, month, selectedDay), "MMMM d")}
            </h3>
            {canEdit && (
              <Button size="sm" variant="ghost" onClick={openCreate} className="gap-1.5 h-8">
                <Plus className="w-4 h-4" /> Add
              </Button>
            )}
          </div>
          {dayEvents.length > 0 ? (
            dayEvents.map((evt) => (
              <div key={evt.id} className="p-3 rounded-lg bg-muted space-y-2">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
                    {evt.event_type === "game" ? <Trophy className="w-4 h-4 text-primary" /> :
                     evt.event_type === "absence" ? <XCircle className="w-4 h-4 text-destructive" /> :
                     evt.event_type === "practice" ? <Dumbbell className="w-4 h-4 text-success" /> :
                     <CalendarIcon className="w-4 h-4 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-foreground">{evt.label}</p>
                      <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-background text-muted-foreground">
                        {evt.event_type}
                      </span>
                      {evt.event_type === "game" && !evt.is_regular_season && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted-foreground/20 text-muted-foreground">Non-season</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground flex-wrap">
                      {evt.event_time && <><Clock className="w-3 h-3" /> {evt.event_time.slice(0,5)}</>}
                      {evt.location && <><span className="mx-1">•</span><MapPin className="w-3 h-3" /> {evt.location}</>}
                    </div>
                  </div>
                  {canEdit && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => openEdit(evt)}
                      aria-label="Edit event"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>

                {/* Game result controls for coaches/managers */}
                {evt.event_type === "game" && canEdit && (
                  <div className="space-y-2 pt-2 border-t border-border/50">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs text-muted-foreground mr-1">Result:</span>
                      {(["win", "loss", null] as const).map((result) => (
                        <button
                          key={result ?? "none"}
                          disabled={updating === evt.id}
                          onClick={() => updateEvent(evt.id, { game_result: result })}
                          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                            evt.game_result === result
                              ? result === "win"
                                ? "bg-success text-success-foreground"
                                : result === "loss"
                                ? "bg-destructive text-destructive-foreground"
                                : "bg-primary text-primary-foreground"
                              : "bg-background text-muted-foreground hover:bg-accent"
                          }`}
                        >
                          {result === "win" ? "Win" : result === "loss" ? "Loss" : "No Result"}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Read-only result display for players */}
                {evt.event_type === "game" && !canEdit && evt.game_result && (
                  <div className="pt-2 border-t border-border/50">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      evt.game_result === "win" ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
                    }`}>
                      {evt.game_result === "win" ? "Win" : "Loss"}
                    </span>
                  </div>
                )}
              </div>
            ))
          ) : dayTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events scheduled.</p>
          ) : null}

          {dayTasks.length > 0 && (
            <div className="space-y-2 pt-1">
              <p className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground">My tasks</p>
              {dayTasks.map((t) => (
                <div key={t.id} className="p-3 rounded-lg bg-accent/40 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center shrink-0">
                    {t.done ? (
                      <CheckCircle2 className="w-4 h-4 text-success" />
                    ) : (
                      <ClipboardCheck className="w-4 h-4 text-accent-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${t.done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                      {t.text}
                    </p>
                    {t.category && (
                      <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-background text-muted-foreground mt-1 inline-block">
                        {t.category}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <EventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editing}
        onSaved={fetchEvents}
        onDeleted={fetchEvents}
      />
    </div>
  );
};

export default TeamCalendar;
