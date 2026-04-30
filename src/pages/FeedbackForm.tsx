import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Star, Eye, EyeOff, Send, Loader2, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FeedbackFormDef, FeedbackQuestion } from "@/lib/feedbackForms";

const FeedbackForm = () => {
  const { user, teamId } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const assignmentId = params.get("assignment");
  const directFormId = params.get("form");

  const [form, setForm] = useState<FeedbackFormDef | null>(null);
  const [resolvedFormId, setResolvedFormId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [textAnswers, setTextAnswers] = useState<Record<string, string>>({});
  const [anonymous, setAnonymous] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alreadyDone, setAlreadyDone] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      let formId: string | null = directFormId;

      if (assignmentId) {
        const { data: asg } = await supabase
          .from("feedback_form_assignments")
          .select("form_id")
          .eq("id", assignmentId)
          .single();
        formId = asg?.form_id ?? null;

        if (user && assignmentId) {
          const { data: existing } = await supabase
            .from("feedback_form_responses")
            .select("id")
            .eq("assignment_id", assignmentId)
            .eq("user_id", user.id)
            .maybeSingle();
          if (existing) setAlreadyDone(true);
        }
      }

      if (!formId) {
        // Fallback: find Post-Game Reflection system template
        const { data } = await supabase
          .from("feedback_forms")
          .select("*")
          .eq("is_system", true)
          .eq("name", "Post-Game Reflection")
          .single();
        if (data) {
          setForm(data as unknown as FeedbackFormDef);
          setResolvedFormId(data.id);
        }
      } else {
        const { data } = await supabase.from("feedback_forms").select("*").eq("id", formId).single();
        if (data) {
          setForm(data as unknown as FeedbackFormDef);
          setResolvedFormId(data.id);
        }
      }
      setLoading(false);
    };
    load();
  }, [assignmentId, directFormId, user]);

  const setRating = (key: string, val: number) => setRatings((p) => ({ ...p, [key]: val }));
  const setText = (key: string, val: string) => setTextAnswers((p) => ({ ...p, [key]: val }));

  const handleSubmit = async () => {
    if (!user || !teamId || !form) return toast.error("Missing context");
    const anyRating = Object.keys(ratings).length > 0;
    const anyText = Object.values(textAnswers).some((v) => v.trim());
    if (!anyRating && !anyText) return toast.error("Please answer at least one question");

    setSubmitting(true);
    const { error } = await supabase.from("feedback_form_responses").insert({
      user_id: user.id,
      team_id: teamId,
      form_name: form.name,
      form_id: resolvedFormId,
      assignment_id: assignmentId,
      ratings: ratings as never,
      text_answers: textAnswers as never,
      is_anonymous: anonymous,
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    setRatings({});
    setTextAnswers({});
    toast.success("Feedback submitted!");
    navigate("/feedback");
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Form not found.
        <div className="mt-4"><Button onClick={() => navigate("/feedback")}>Back</Button></div>
      </div>
    );
  }

  const questions = (form.questions as FeedbackQuestion[]) ?? [];

  return (
    <div className="p-4 space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
          <ArrowLeft className="w-4 h-4 text-muted-foreground" />
        </button>
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Feedback</p>
          <h1 className="text-2xl font-bold font-display text-foreground">{form.name}</h1>
        </div>
      </div>

      {form.description && <p className="text-sm text-muted-foreground">{form.description}</p>}

      {alreadyDone && (
        <div className="bg-success/10 border border-success/30 rounded-xl p-3 text-sm text-success-foreground">
          You've already submitted this form. You can submit again, but your previous response is kept.
        </div>
      )}

      {/* Anonymity toggle */}
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

      {questions.map((q) => (
        <div key={q.id} className="bg-card rounded-xl p-4 shadow-[var(--card-shadow)] space-y-3">
          <p className="text-sm font-medium text-card-foreground">{q.label}</p>

          {q.type === "rating" && (
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setRating(q.id, n)} className="transition-transform hover:scale-110">
                  <Star className={`w-8 h-8 ${(ratings[q.id] || 0) >= n ? "fill-warning text-warning" : "text-muted-foreground"}`} />
                </button>
              ))}
            </div>
          )}

          {q.type === "scale" && (
            <div className="flex gap-1.5 flex-wrap">
              {Array.from({ length: q.scale ?? 10 }).map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setRating(q.id, i + 1)}
                  className={`flex-1 min-w-[28px] h-9 rounded-lg text-xs font-semibold transition-colors ${
                    (ratings[q.id] || 0) >= i + 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}

          {q.type === "text" && (
            <textarea
              value={textAnswers[q.id] ?? ""}
              onChange={(e) => setText(q.id, e.target.value)}
              maxLength={1000}
              rows={3}
              placeholder="Your answer..."
              className="w-full p-3 rounded-lg bg-muted text-foreground text-sm placeholder:text-muted-foreground resize-none border border-border focus:outline-none focus:ring-2 focus:ring-ring"
            />
          )}
        </div>
      ))}

      <Button onClick={handleSubmit} disabled={submitting} className="w-full">
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        Submit Feedback
      </Button>
    </div>
  );
};

export default FeedbackForm;
