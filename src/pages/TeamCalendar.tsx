import { useState, useEffect } from "react";
import { Trophy, XCircle, Clock, MapPin, ChevronLeft, ChevronRight, Plus, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, getDay, getDaysInMonth, addMonths, subMonths } from "date-fns";

interface CalendarEvent {
  id: string;
  event_type: string;
  label: string;
  event_date: string;
  event_time: string | null;
  location: string | null;
}

const TeamCalendar = () => {
  const { role, teamId } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = getDaysInMonth(currentMonth);
  const startDay = getDay(startOfMonth(currentMonth));

  useEffect(() => {
    if (!teamId) return;
    const fetchEvents = async () => {
      const start = format(startOfMonth(currentMonth), "yyyy-MM-dd");
      const end = format(endOfMonth(currentMonth), "yyyy-MM-dd");
      const { data } = await supabase
        .from("calendar_events")
        .select("id, event_type, label, event_date, event_time, location")
        .eq("team_id", teamId)
        .gte("event_date", start)
        .lte("event_date", end);
      setEvents((data as CalendarEvent[]) || []);
      setLoading(false);
    };
    fetchEvents();
  }, [teamId, currentMonth]);

  const getEventsForDay = (day: number) => {
    const dateStr = format(new Date(year, month, day), "yyyy-MM-dd");
    return events.filter((e) => e.event_date === dateStr);
  };

  const dayEvents = selectedDay ? getEventsForDay(selectedDay) : [];

  return (
    <div className="p-4 space-y-4">
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Team</p>
        <h1 className="text-2xl font-bold font-display text-foreground">Calendar</h1>
      </div>

      <div className="bg-card rounded-xl p-4 shadow-[var(--card-shadow)]">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <h2 className="font-display font-semibold text-card-foreground">{format(currentMonth, "MMMM yyyy")}</h2>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div key={i} className="text-center text-[10px] font-medium text-muted-foreground py-1">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: startDay }).map((_, i) => <div key={`e-${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayEvts = getEventsForDay(day);
            const isSelected = selectedDay === day;
            const hasGame = dayEvts.some((e) => e.event_type === "game");
            const hasAbsence = dayEvts.some((e) => e.event_type === "absence");
            const hasPractice = dayEvts.some((e) => e.event_type === "practice");
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`relative aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-all ${
                  isSelected ? "bg-primary text-primary-foreground font-bold" : "hover:bg-muted text-card-foreground"
                }`}
              >
                {day}
                {dayEvts.length > 0 && !isSelected && (
                  <div className="absolute bottom-0.5 flex gap-0.5">
                    {hasGame && <Trophy className="w-2.5 h-2.5 text-primary" />}
                    {hasAbsence && <XCircle className="w-2.5 h-2.5 text-destructive" />}
                    {hasPractice && <div className="w-1.5 h-1.5 rounded-full bg-success" />}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex gap-4 mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground"><Trophy className="w-3 h-3 text-primary" /> Game</div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground"><XCircle className="w-3 h-3 text-destructive" /> Absence</div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground"><div className="w-2 h-2 rounded-full bg-success" /> Practice</div>
        </div>
      </div>

      {selectedDay && (
        <div className="bg-card rounded-xl p-4 shadow-[var(--card-shadow)] space-y-3">
          <h3 className="font-display font-semibold text-card-foreground">
            {format(new Date(year, month, selectedDay), "MMMM d")}
          </h3>
          {dayEvents.length > 0 ? (
            dayEvents.map((evt) => (
              <div key={evt.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted">
                <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
                  {evt.event_type === "game" ? <Trophy className="w-4 h-4 text-primary" /> :
                   evt.event_type === "absence" ? <XCircle className="w-4 h-4 text-destructive" /> :
                   <Clock className="w-4 h-4 text-success" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{evt.label}</p>
                  <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                    {evt.event_time && <><Clock className="w-3 h-3" /> {evt.event_time}</>}
                    {evt.location && <><span className="mx-1">•</span><MapPin className="w-3 h-3" /> {evt.location}</>}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No events scheduled.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default TeamCalendar;
