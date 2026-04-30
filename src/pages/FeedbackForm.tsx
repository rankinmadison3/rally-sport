import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Star, Eye, EyeOff, Send, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FeedbackFormDef, FeedbackQuestion } from "@/lib/feedbackForms";

const FeedbackForm = () => {
  const { user, role, teamId } = useAuth();
  const navigate = useNavigate();
  const params = useParams();
  const [search] = useSearchParams();

  const assignmentId = params.assignmentId ?? search.get("assignment");
  const formIdParam = params.formId ?? search.get("form");

  const [form, setForm] = useState<FeedbackFormDef | null>(null);
  const [resolvedFormId, setResolvedFormId] = useState<string | null>(null);
  const [resolvedAssignmentId, setResolvedAssignmentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [textAnswers, setTextAnswers] = useState<Record<string, string>>({});
  const [anonymous, setAnonymous] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alreadyDone, setAlreadyDone] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      if (!assignmentId && !formIdParam) {
        setError("No feedback form selected.");
        setLoading(false);
        return;
      }

      let formId: string | null = formIdParam ?? null;

      if (assignmentId) {
        const { data: asg, error: asgErr } = await supabase
          .from("feedback_form_assignments")
          .select("id, form_id, player_id, status, is_active")
          .eq("id", assignmentId)
          .maybeSingle();

        if (asgErr || !asg) {
          setError("Feedback request not found.");
          setLoading(false);
          return;
        }

        // Ownership check for players
        if (role === "player" && user && asg.player_id && asg.player_id !== user.id) {
          setError("This feedback isn't assigned to you.");
          setLoading(false);
          return;
        }

        formId = asg.form_id;
        setResolvedAssignmentId(asg.id);
        if (asg.status === "submitted" || !asg.is_active) setAlreadyDone(true);
      }

      if (!formId) {
        setError("Form not found.");
        setLoading(false);
        return;
      }

      const { data: formData, error: formErr } = await supabase
        .from("feedback_forms")
        .select("*")
        .eq("id", formId)
        .maybeSingle();

      if (formErr || !formData) {
        setError("Form not found.");
        setLoading(false);
        return;
      }

      setForm(formData as unknown as FeedbackFormDef);
      setResolvedFormId(formData.id);
      setLoading(false);
    };
    load();
  }, [assignmentId, formIdParam, role, user]);

  const setRating = (key: string, val: number) => setRatings((p) => ({ ...p, [key]: val }));
  const setText = (key: string, val: string) => setTextAnswers((p) => ({ ...p, [key]: val }));

  const handleSubmit = async () => {
    if (!user || !teamId || !form) return toast.error("Missing context");
    if (alreadyDone) return toast.error("Already submitted");
    const anyRating = Object.keys(ratings).length > 0;
    const anyText = Object.values(textAnswers).some((v) => v.trim());
    if (!anyRating && !anyText) return toast.error("Please answer at least one question");

    setSubmitting(true);
    const { error: respErr } = await supabase.from("feedback_form_responses").insert({
      user_id: user.id,
      team_id: teamId,
      form_name: form.name,
      form_id: resolvedFormId,
      assignment_id: resolvedAssignmentId,
      ratings: ratings as never,
      text_answers: textAnswers as never,
      is_anonymous: anonymous,
    });

    if (respErr) {
      setSubmitting(false);
      return toast.error(respErr.message);
    }

    if (resolvedAssignmentId) {
      await supabase
        .from("feedback_form_assignments")
        .update({ status: "submitted", submitted_at: new Date().toISOString() })
        .eq("id", resolvedAssignmentId);
    }

    setSubmitting(false);
    toast.success("Feedback submitted");
    navigate("/feedback");
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="p-4 max-w-2xl mx-auto">
        <div className="bg-card rounded-xl p-8 shadow-[var(--card-shadow)] text-center space-y-4">
          <p className="text-sm text-muted-foreground">{error ?? "Form not found."}</p>
          <Button onClick={() => navigate("/feedback")}>Back to Feedback</Button>
        </div>
      </div>
    );
  }

  const questions = (form.questions as FeedbackQuestion[]) ?? [];

  return (
    <div className="p-4 space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center" aria-label="Back">
          <ArrowLeft className="w-4 h-4 text-muted-foreground" />
        </button>
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Feedback</p>
          <h1 className="text-2xl font-bold font-display text-foreground">{form.name}</h1>
        </div>
      </div>

      {form.description && <p className="text-sm text-muted-foreground">{form.description}</p>}

      {alreadyDone && (
        <div className="bg-success/10 border border-success/30 rounded-xl p-4 flex items-center gap-2 text-sm">
          <CheckCircle2 className="w-4 h-4 text-success" />
          <span className="text-card-foreground">You've already submitted this feedback.</span>
        </div>
      )}

      {/* Anonymity toggle */}
      <div className="bg-card rounded-xl p-4 shadow-[var(--card-shadow)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          {anonymous ? <EyeOff className="w-4 h-4 text-success" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
          <div>
            <p className="text-sm font-medium text-card-foreground">{anonymous ? "Anonymous" : "Identified"}</p>
            <p className="text-[10px] text-muted-foreground">{anonymous ? "Your identity is hidden" : "Coach can see your name"}</p>
          </div>
        </div>
        <button
          onClick={() => setAnonymous(!anonymous)}
          disabled={alreadyDone}
          className={`w-11 h-6 rounded-full relative transition-colors disabled:opacity-50 ${anonymous ? "bg-success" : "bg-muted"}`}
        >
          <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-card shadow transition-transform ${anonymous ? "right-0.5" : "left-0.5"}`} />
        </button>
      </div>

      {questions.map((q) => (
        <div key={q.id} className="bg-card rounded-xl p-4 shadow-[var(--card-shadow)] space-y-3">
          <p className="text-sm font-medium text-card-foreground">{q.label}</p>

          {q.type === "rating" && (
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  disabled={alreadyDone}
                  onClick={() => setRating(q.id, n)}
                  className="transition-transform hover:scale-110 disabled:opacity-60"
                >
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
                  disabled={alreadyDone}
                  onClick={() => setRating(q.id, i + 1)}
                  className={`flex-1 min-w-[28px] h-9 rounded-lg text-xs font-semibold transition-colors disabled:opacity-60 ${
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
              disabled={alreadyDone}
              maxLength={1000}
              rows={3}
              placeholder="Your answer..."
              className="w-full p-3 rounded-lg bg-muted text-foreground text-sm placeholder:text-muted-foreground resize-none border border-border focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
            />
          )}
        </div>
      ))}

      <Button onClick={handleSubmit} disabled={submitting || alreadyDone} className="w-full">
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        {alreadyDone ? "Already submitted" : "Submit feedback"}
      </Button>
    </div>
  );
};

export default FeedbackForm;
