import { useState } from "react";
import { Send } from "lucide-react";

const moods = [
  { emoji: "😫", label: "Struggling", value: 1 },
  { emoji: "😟", label: "Low", value: 2 },
  { emoji: "😐", label: "Okay", value: 3 },
  { emoji: "😊", label: "Good", value: 4 },
  { emoji: "🔥", label: "Great", value: 5 },
];

const Feedback = () => {
  const [selectedMood, setSelectedMood] = useState(3);
  const [suggestion, setSuggestion] = useState("");

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Player's View</p>
        <h1 className="text-2xl font-bold font-display text-foreground">Wellness Check-in</h1>
      </div>

      {/* Mood Slider */}
      <div className="bg-card rounded-xl p-5 shadow-[var(--card-shadow)] space-y-4">
        <h2 className="font-display font-semibold text-card-foreground text-center">
          How are you feeling today?
        </h2>
        <div className="flex justify-between items-center px-2">
          {moods.map((mood) => (
            <button
              key={mood.value}
              onClick={() => setSelectedMood(mood.value)}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                selectedMood === mood.value
                  ? "bg-accent scale-110"
                  : "opacity-50 hover:opacity-75"
              }`}
            >
              <span className="text-3xl">{mood.emoji}</span>
              <span className="text-[10px] font-medium text-muted-foreground">{mood.label}</span>
            </button>
          ))}
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${(selectedMood / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* Anonymous Suggestion Box */}
      <div className="bg-card rounded-xl p-5 shadow-[var(--card-shadow)] space-y-4">
        <h2 className="font-display font-semibold text-card-foreground">Anonymous Suggestion Box</h2>
        <p className="text-xs text-muted-foreground">
          Your feedback is completely anonymous. Help your coach improve the team experience.
        </p>
        <textarea
          value={suggestion}
          onChange={(e) => setSuggestion(e.target.value)}
          placeholder="Share your thoughts, ideas, or concerns..."
          className="w-full h-32 p-3 rounded-lg bg-muted text-foreground text-sm placeholder:text-muted-foreground resize-none border border-border focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
          <Send className="w-4 h-4" />
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
                  className="flex-1 h-8 rounded bg-muted text-xs font-medium text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        ))}
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-muted-foreground">Anonymity</span>
          <div className="w-10 h-5 bg-primary rounded-full relative cursor-pointer">
            <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-primary-foreground rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Feedback;
