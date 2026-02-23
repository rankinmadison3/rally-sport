import { useState } from "react";
import { Trophy, XCircle, Clock, MapPin, ChevronLeft, ChevronRight } from "lucide-react";

const events: Record<number, { type: string; label: string }[]> = {
  3: [{ type: "practice", label: "Practice" }],
  5: [{ type: "game", label: "District Game vs Lincoln" }],
  7: [{ type: "absence", label: "Player Absence - J. Smith" }],
  10: [{ type: "practice", label: "Practice" }],
  12: [{ type: "game", label: "District Game vs Central" }],
  14: [{ type: "practice", label: "Practice" }],
  18: [{ type: "absence", label: "Player Absence - M. Chen" }],
  20: [{ type: "game", label: "Home Game vs Riverside" }],
  22: [{ type: "practice", label: "Practice" }],
  25: [{ type: "game", label: "District Finals" }],
  28: [{ type: "practice", label: "Practice" }],
};

const daysInMonth = 31;
const startDay = 3; // Wednesday

const TeamCalendar = () => {
  const [selectedDay, setSelectedDay] = useState<number | null>(5);

  const dayEvents = selectedDay ? events[selectedDay] || [] : [];

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Team</p>
        <h1 className="text-2xl font-bold font-display text-foreground">Calendar</h1>
      </div>

      {/* Month Nav */}
      <div className="bg-card rounded-xl p-4 shadow-[var(--card-shadow)]">
        <div className="flex items-center justify-between mb-4">
          <button className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <h2 className="font-display font-semibold text-card-foreground">February 2026</h2>
          <button className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div key={i} className="text-center text-[10px] font-medium text-muted-foreground py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: startDay }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayEvt = events[day];
            const isSelected = selectedDay === day;
            const hasGame = dayEvt?.some((e) => e.type === "game");
            const hasAbsence = dayEvt?.some((e) => e.type === "absence");
            const hasPractice = dayEvt?.some((e) => e.type === "practice");

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`relative aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-all ${
                  isSelected
                    ? "bg-primary text-primary-foreground font-bold"
                    : "hover:bg-muted text-card-foreground"
                }`}
              >
                {day}
                {dayEvt && !isSelected && (
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

        {/* Legend */}
        <div className="flex gap-4 mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Trophy className="w-3 h-3 text-primary" /> Game
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <XCircle className="w-3 h-3 text-destructive" /> Absence
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-success" /> Practice
          </div>
        </div>
      </div>

      {/* Event Detail Sheet */}
      {selectedDay && (
        <div className="bg-card rounded-xl p-4 shadow-[var(--card-shadow)] space-y-3">
          <h3 className="font-display font-semibold text-card-foreground">
            February {selectedDay}
          </h3>
          {dayEvents.length > 0 ? (
            dayEvents.map((evt, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted">
                <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
                  {evt.type === "game" ? (
                    <Trophy className="w-4 h-4 text-primary" />
                  ) : evt.type === "absence" ? (
                    <XCircle className="w-4 h-4 text-destructive" />
                  ) : (
                    <Clock className="w-4 h-4 text-success" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{evt.label}</p>
                  <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" /> 4:00 PM
                    <span className="mx-1">•</span>
                    <MapPin className="w-3 h-3" /> Main Court
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
