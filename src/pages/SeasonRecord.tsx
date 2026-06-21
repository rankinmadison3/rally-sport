import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import {
  Trophy, ArrowLeft, Calendar as CalendarIcon, MapPin,
  Check, X as XIcon, Loader2, ChevronDown, ChevronUp, MoreHorizontal,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface GameRow {
  id: string;
  event_type: string;
  label: string | null;
  event_date: string;
  event_time: string | null;
  location: string | null;
  game_result: string | null;
  is_regular_season: boolean;
}

const SeasonRecord = () => {
  const { role, teamId } = useAuth();
  const navigate = useNavigate();
  const isCoachOrManager = role === "coach" || role === "manager";

  const [games, setGames] = useState<GameRow[]>([]);
  const [teamName, setTeamName] = useState("");
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);
  const [loading, setLoading] = useState(true);
  const [openOther, setOpenOther] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isCoachOrManager) {
      navigate("/", { replace: true });
    }
  }, [isCoachOrManager, navigate]);

  const fetchAll = async () => {
    if (!teamId) return;
    setLoading(true);
    const [{ data: gameData }, { data: team }] = await Promise.all([
      supabase
        .from("calendar_events")
        .select("id, event_type, label, event_date, event_time, location, game_result, is_regular_season")
        .eq("team_id", teamId)
        .eq("event_type", "game")
        .order("event_date", { ascending: false }),
      supabase
        .from("teams")
        .select("name, season_wins, season_losses")
        .eq("id", teamId)
        .single(),
    ]);
    setGames((gameData as GameRow[]) ?? []);
    if (team) {
      setTeamName(team.name);
      setWins(team.season_wins);
      setLosses(team.season_losses);
    }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); /* eslint-disable-next-line */ }, [teamId]);

  const today = useMemo(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d;
  }, []);

  const { needsResult, withResult, other } = useMemo(() => {
    const needsResult: GameRow[] = [];
    const withResult: GameRow[] = [];
    const other: GameRow[] = [];
    games.forEach((g) => {
      if (!g.is_regular_season) { other.push(g); return; }
      const eventDate = parseISO(g.event_date);
      if (!g.game_result && eventDate <= today) needsResult.push(g);
      else if (g.game_result) withResult.push(g);
      // future regular-season games without result aren't urgent — list them in "other"
      else other.push(g);
    });
    return { needsResult, withResult, other };
  }, [games, today]);

  const total = wins + losses;
  const winPct = total > 0 ? Math.round((wins / total) * 100) : 0;

  const setResult = async (id: string, result: "win" | "loss" | null) => {
    setUpdatingId(id);
    // Optimistic update
    setGames((prev) => prev.map((g) => (g.id === id ? { ...g, game_result: result } : g)));
    const { error } = await supabase
      .from("calendar_events")
      .update({ game_result: result })
      .eq("id", id);
    if (error) {
      toast.error("Failed to update result");
      fetchAll();
    } else {
      toast.success(result ? `Logged as ${result}` : "Result cleared");
      // Re-fetch team record (updated by trigger)
      const { data: team } = await supabase
        .from("teams").select("season_wins, season_losses").eq("id", teamId!).single();
      if (team) { setWins(team.season_wins); setLosses(team.season_losses); }
    }
    setUpdatingId(null);
  };

  if (!isCoachOrManager) return null;

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-5 pb-12">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/")}
          className="w-9 h-9 rounded-full bg-muted flex items-center justify-center"
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="w-4 h-4 text-muted-foreground" />
        </button>
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Season Management
          </p>
          <h1 className="text-2xl font-bold font-display text-foreground">Season Record</h1>
        </div>
      </div>

      {/* Header stats */}
      <div className="bg-card rounded-2xl p-5 shadow-[var(--card-shadow)]">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-muted-foreground">{teamName}</p>
            <div className="flex items-baseline gap-3 mt-1">
              <p className="text-4xl font-bold font-display text-foreground tracking-tight">
                {wins}<span className="text-muted-foreground">-</span>{losses}
              </p>
              <p className="text-sm text-muted-foreground">{winPct}% win rate</p>
            </div>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Trophy className="w-7 h-7 text-primary" />
          </div>
        </div>
        <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${winPct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>{total} regular-season games played</span>
          {needsResult.length > 0 && (
            <span className="text-destructive font-medium">
              {needsResult.length} unlogged
            </span>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}

      {!loading && games.length === 0 && (
        <div className="bg-card rounded-2xl p-8 shadow-[var(--card-shadow)] text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-muted mx-auto flex items-center justify-center">
            <CalendarIcon className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="font-medium text-card-foreground">No games scheduled yet</p>
          <p className="text-sm text-muted-foreground">Add games from the Team Calendar.</p>
          <Button onClick={() => navigate("/calendar")} size="sm" variant="outline">
            Go to Calendar
          </Button>
        </div>
      )}

      {/* Needs result */}
      {needsResult.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Needs Result · {needsResult.length}
          </h2>
          {needsResult.map((g) => (
            <GameCard
              key={g.id}
              game={g}
              updating={updatingId === g.id}
              onWin={() => setResult(g.id, "win")}
              onLoss={() => setResult(g.id, "loss")}
              urgent
            />
          ))}
        </section>
      )}

      {/* Logged regular season */}
      {withResult.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Regular Season · {withResult.length}
          </h2>
          {withResult.map((g) => (
            <GameCard
              key={g.id}
              game={g}
              updating={updatingId === g.id}
              onChange={(r) => setResult(g.id, r)}
            />
          ))}
        </section>
      )}

      {/* Other games */}
      {other.length > 0 && (
        <section className="space-y-2">
          <button
            onClick={() => setOpenOther((o) => !o)}
            className="w-full flex items-center justify-between"
          >
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Other Games · {other.length}
            </h2>
            {openOther ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
          {openOther && (
            <>
              <p className="text-xs text-muted-foreground">
                Not counted toward season record.
              </p>
              {other.map((g) => (
                <GameCard key={g.id} game={g} muted />
              ))}
            </>
          )}
        </section>
      )}
    </div>
  );
};

interface GameCardProps {
  game: GameRow;
  updating?: boolean;
  urgent?: boolean;
  muted?: boolean;
  onWin?: () => void;
  onLoss?: () => void;
  onChange?: (r: "win" | "loss" | null) => void;
}

const GameCard = ({ game, updating, urgent, muted, onWin, onLoss, onChange }: GameCardProps) => {
  const date = parseISO(game.event_date);
  return (
    <article
      className={`bg-card rounded-xl p-4 shadow-[var(--card-shadow)] flex items-center gap-3 ${
        muted ? "opacity-70" : ""
      } ${urgent ? "ring-1 ring-destructive/20" : ""}`}
    >
      <div className="w-12 h-12 rounded-lg bg-muted flex flex-col items-center justify-center shrink-0">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase">
          {format(date, "MMM")}
        </span>
        <span className="text-base font-bold text-foreground leading-none">
          {format(date, "d")}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-card-foreground truncate">
          {game.label || "Game"}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
          {game.event_time && <span>{game.event_time.slice(0, 5)}</span>}
          {game.location && (
            <span className="inline-flex items-center gap-0.5 truncate">
              <MapPin className="w-3 h-3" /> {game.location}
            </span>
          )}
          {!game.is_regular_season && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              Non-regular
            </span>
          )}
        </div>
      </div>

      {/* Result controls */}
      {updating ? (
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      ) : onWin && onLoss ? (
        <div className="flex gap-1.5 shrink-0">
          <button
            onClick={onWin}
            className="px-3 py-1.5 rounded-lg bg-success/10 text-success text-xs font-semibold hover:bg-success/20 transition-colors inline-flex items-center gap-1"
          >
            <Check className="w-3.5 h-3.5" /> Win
          </button>
          <button
            onClick={onLoss}
            className="px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-xs font-semibold hover:bg-destructive/20 transition-colors inline-flex items-center gap-1"
          >
            <XIcon className="w-3.5 h-3.5" /> Loss
          </button>
        </div>
      ) : onChange ? (
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`text-[11px] font-semibold px-2 py-1 rounded ${
              game.game_result === "win"
                ? "bg-success/15 text-success"
                : "bg-destructive/15 text-destructive"
            }`}
          >
            {game.game_result === "win" ? "Win" : "Loss"}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger className="w-7 h-7 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground">
              <MoreHorizontal className="w-4 h-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onChange("win")}>Mark as Win</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onChange("loss")}>Mark as Loss</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onChange(null)} className="text-muted-foreground">
                Clear result
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : game.game_result ? (
        <span
          className={`text-[11px] font-semibold px-2 py-1 rounded shrink-0 ${
            game.game_result === "win"
              ? "bg-success/15 text-success"
              : "bg-destructive/15 text-destructive"
          }`}
        >
          {game.game_result === "win" ? "Win" : "Loss"}
        </span>
      ) : null}
    </article>
  );
};

export default SeasonRecord;
