import { TrendingUp, FileText, Users, Trophy } from "lucide-react";

const moraleData = [30, 45, 40, 55, 60, 58, 72, 78, 75, 82, 85];

const Dashboard = () => {
  const wins = 8;
  const losses = 3;
  const total = wins + losses;
  const winPct = Math.round((wins / total) * 100);

  return (
    <div className="p-4 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Coach's View</p>
          <h1 className="text-2xl font-bold font-display text-foreground">Dashboard</h1>
        </div>
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
          <Users className="w-5 h-5 text-primary-foreground" />
        </div>
      </div>

      {/* Season Progress */}
      <div className="bg-card rounded-xl p-4 shadow-[var(--card-shadow)] space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-semibold text-card-foreground">Season Progress</h2>
          <div className="flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-primary">{wins}-{losses}</span>
          </div>
        </div>
        <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${winPct}%` }}
          />
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
            <span>+12%</span>
          </div>
        </div>
        <div className="h-32 flex items-end gap-1.5">
          {moraleData.map((val, i) => (
            <div
              key={i}
              className="flex-1 rounded-t bg-primary transition-all duration-300"
              style={{ height: `${(val / 100) * 128}px` }}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center">Last 11 check-ins</p>
      </div>

      {/* Active Feedback Forms */}
      <div className="space-y-3">
        <h2 className="font-display font-semibold text-foreground">Active Feedback Forms</h2>
        {[
          { title: "Post-Game Reflection", responses: 14, total: 18, icon: FileText },
          { title: "Weekly Wellness Check", responses: 10, total: 18, icon: FileText },
          { title: "Team Chemistry Survey", responses: 6, total: 18, icon: FileText },
        ].map((form, i) => (
          <div
            key={i}
            className="bg-card rounded-xl p-4 shadow-[var(--card-shadow)] flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center shrink-0">
              <form.icon className="w-5 h-5 text-accent-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-card-foreground truncate">{form.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 bg-muted rounded-full h-1.5">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${(form.responses / form.total) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {form.responses}/{form.total}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
