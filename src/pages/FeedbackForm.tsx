import { useState } from "react";
import { Star, Eye, EyeOff, Send, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const FeedbackForm = () => {
  const { user, teamId } = useAuth();
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [anonymous, setAnonymous] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const setRating = (key: string, val: number) => {
    setRatings((prev) => ({ ...prev, [key]: val }));
  };

  const questions = [
    { key: "coaching", label: "Coaching Effectiveness", scale: 5 },
    { key: "communication", label: "Team Communication", scale: 5 },
    { key: "training", label: "Training Quality", scale: 10 },
    { key: "environment", label: "Team Environment", scale: 10 },
  ];

  const handleSubmit = async () => {
    if (!user || !teamId) return toast.error("No team found");
    if (Object.keys(ratings).length === 0) return toast.error("Please rate at least one question");
    setSubmitting(true);
    const { error } = await supabase.from("feedback_form_responses").insert({
      user_id: user.id,
      team_id: teamId,
      form_name: "Post-Game Reflection",
      ratings,
      is_anonymous: anonymous,
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    setRatings({});
    toast.success("Feedback submitted!");
  };

  return (
    <div className="p-4 space-y-5">
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Feedback</p>
        <h1 className="text-2xl font-bold font-display text-foreground">Post-Game Reflection</h1>
      </div>

      {/* Anonymity Toggle */}
      <div className="bg-card rounded-xl p-4 shadow-[var(--card-shadow)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          {anonymous ? <EyeOff className="w-4 h-4 text-success" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
          <div>
            <p className="text-sm font-medium text-card-foreground">{anonymous ? "Anonymous Mode" : "Identified Mode"}</p>
            <p className="text-[10px] text-muted-foreground">{anonymous ? "Your identity is hidden" : "Coach can see your name"}</p>
          </div>
        </div>
        <button onClick={() => setAnonymous(!anonymous)} className={`w-11 h-6 rounded-full relative transition-colors ${anonymous ? "bg-success" : "bg-muted"}`}>
          <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-card shadow transition-transform ${anonymous ? "right-0.5" : "left-0.5"}`} />
        </button>
      </div>

      {/* Rating Questions */}
      {questions.map((q) => (
        <div key={q.key} className="bg-card rounded-xl p-4 shadow-[var(--card-shadow)] space-y-3">
          <p className="text-sm font-medium text-card-foreground">{q.label}</p>
          {q.scale === 5 ? (
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setRating(q.key, n)} className="transition-transform hover:scale-110">
                  <Star className={`w-8 h-8 ${(ratings[q.key] || 0) >= n ? "fill-warning text-warning" : "text-muted-foreground"}`} />
                </button>
              ))}
            </div>
          ) : (
            <div className="flex gap-1.5">
              {Array.from({ length: 10 }).map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setRating(q.key, i + 1)}
                  className={`flex-1 h-9 rounded-lg text-xs font-semibold transition-colors ${
                    (ratings[q.key] || 0) >= i + 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        Submit Feedback
      </button>
    </div>
  );
};

export default FeedbackForm;
