import { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const moods = [
  { emoji: "😫", label: "Struggling", value: 1 },
  { emoji: "😟", label: "Low", value: 2 },
  { emoji: "😐", label: "Okay", value: 3 },
  { emoji: "😊", label: "Good", value: 4 },
  { emoji: "🔥", label: "Great", value: 5 },
];

const Feedback = () => {
  const { user, teamId } = useAuth();
  const [selectedMood, setSelectedMood] = useState(3);
  const [suggestion, setSuggestion] = useState("");
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [anonymous, setAnonymous] = useState(true);
  const [sendingMood, setSendingMood] = useState(false);
  const [sendingSuggestion, setSendingSuggestion] = useState(false);
  const [sendingRatings, setSendingRatings] = useState(false);

  const submitMood = async () => {
    if (!user || !teamId) return toast.error("No team found");
    setSendingMood(true);
    const { error } = await supabase.from("morale_checkins").insert({
      user_id: user.id,
      team_id: teamId,
      mood: selectedMood,
    });
    setSendingMood(false);
    if (error) return toast.error(error.message);
    toast.success("Mood submitted!");
  };

  const submitSuggestion = async () => {
    if (!teamId || !suggestion.trim()) return toast.error("Please write a suggestion");
    setSendingSuggestion(true);
    const { error } = await supabase.from("suggestions").insert({
      team_id: teamId,
      content: suggestion.trim(),
      is_anonymous: true,
      user_id: anonymous ? null : user?.id,
    });
    setSendingSuggestion(false);
    if (error) return toast.error(error.message);
    setSuggestion("");
    toast.success("Suggestion sent!");
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
      is_anonymous: anonymous,
    }));
    const { error } = await supabase.from("feedback_ratings").insert(rows);
    setSendingRatings(false);
    if (error) return toast.error(error.message);
    setRatings({});
    toast.success("Ratings submitted!");
  };

  return (
    <div className="p-4 space-y-6">
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Player's View</p>
        <h1 className="text-2xl font-bold font-display text-foreground">Wellness Check-in</h1>
      </div>

      {/* Mood Slider */}
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
        <button
          onClick={submitMood}
          disabled={sendingMood}
          className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {sendingMood ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Submit Mood
        </button>
      </div>

      {/* Anonymous Suggestion Box */}
      <div className="bg-card rounded-xl p-5 shadow-[var(--card-shadow)] space-y-4">
        <h2 className="font-display font-semibold text-card-foreground">Anonymous Suggestion Box</h2>
        <p className="text-xs text-muted-foreground">Your feedback is completely anonymous. Help your coach improve the team experience.</p>
        <textarea
          value={suggestion}
          onChange={(e) => setSuggestion(e.target.value)}
          placeholder="Share your thoughts, ideas, or concerns..."
          maxLength={1000}
          className="w-full h-32 p-3 rounded-lg bg-muted text-foreground text-sm placeholder:text-muted-foreground resize-none border border-border focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          onClick={submitSuggestion}
          disabled={sendingSuggestion}
          className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {sendingSuggestion ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Send to Coach
        </button>
      </div>

      {/* Rating Scale */}
      <div className="bg-card rounded-xl p-5 shadow-[var(--card-shadow)] space-y-4">
        <h2 className="font-display font-semibold text-card-foreground">Quick Ratings</h2>
        {["Team Communication", "Training Intensity", "Coach Support"].map((label) => (
          <div key={label} className="space-y-1.5">
            <p className="text-sm text-card-foreground">{label}</p>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <button
                  key={n}
                  onClick={() => setRatings((prev) => ({ ...prev, [label]: n }))}
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
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-muted-foreground">Anonymity</span>
          <button
            onClick={() => setAnonymous(!anonymous)}
            className={`w-10 h-5 rounded-full relative transition-colors ${anonymous ? "bg-primary" : "bg-muted"}`}
          >
            <div className={`absolute top-0.5 w-4 h-4 bg-primary-foreground rounded-full transition-transform ${anonymous ? "right-0.5" : "left-0.5"}`} />
          </button>
        </div>
        <button
          onClick={submitRatings}
          disabled={sendingRatings}
          className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {sendingRatings ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Submit Ratings
        </button>
      </div>
    </div>
  );
};

export default Feedback;
