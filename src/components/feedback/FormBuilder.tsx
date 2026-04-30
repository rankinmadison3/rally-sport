import { useEffect, useState } from "react";
import { Plus, Trash2, Loader2, Save } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FeedbackFormDef,
  FeedbackQuestion,
  FeedbackQuestionType,
  newQuestion,
} from "@/lib/feedbackForms";

interface Props {
  initialTemplateId?: string | null;
  editingFormId?: string | null;
  onClose: () => void;
  onSaved: () => void;
}

const FormBuilder = ({ initialTemplateId, editingFormId, onClose, onSaved }: Props) => {
  const { user, teamId } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<FeedbackQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const id = editingFormId ?? initialTemplateId;
      if (!id) {
        setQuestions([newQuestion("rating")]);
        return;
      }
      setLoading(true);
      const { data, error } = await supabase
        .from("feedback_forms")
        .select("*")
        .eq("id", id)
        .single();
      setLoading(false);
      if (error || !data) return toast.error("Failed to load form");
      const def = data as unknown as FeedbackFormDef;
      setName(editingFormId ? def.name : `${def.name} (copy)`);
      setDescription(def.description ?? "");
      setQuestions(
        (def.questions as FeedbackQuestion[]).map((q) => ({ ...q, id: q.id || crypto.randomUUID() }))
      );
    };
    load();
  }, [initialTemplateId, editingFormId]);

  const updateQuestion = (id: string, patch: Partial<FeedbackQuestion>) => {
    setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  };

  const removeQuestion = (id: string) => {
    setQuestions((qs) => qs.filter((q) => q.id !== id));
  };

  const handleSave = async () => {
    if (!name.trim()) return toast.error("Name is required");
    if (questions.length === 0) return toast.error("Add at least one question");
    if (questions.some((q) => !q.label.trim())) return toast.error("All questions need a label");
    if (!user || !teamId) return toast.error("No team");

    setSaving(true);
    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      questions: questions as never,
      team_id: teamId,
      created_by: user.id,
      is_template: false,
      is_system: false,
    };

    let error;
    if (editingFormId) {
      ({ error } = await supabase.from("feedback_forms").update(payload).eq("id", editingFormId));
    } else {
      ({ error } = await supabase.from("feedback_forms").insert(payload));
    }
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(editingFormId ? "Form updated" : "Form created");
    onSaved();
    onClose();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Form Name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. After Game 5" maxLength={100} />
      </div>
      <div className="space-y-2">
        <Label>Description (optional)</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={300} rows={2} />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Questions</Label>
          <span className="text-xs text-muted-foreground">{questions.length}</span>
        </div>
        {questions.map((q, idx) => (
          <div key={q.id} className="rounded-lg border border-border p-3 space-y-2 bg-muted/30">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-muted-foreground">Q{idx + 1}</span>
              <button
                onClick={() => removeQuestion(q.id)}
                className="text-destructive hover:opacity-70"
                aria-label="Remove question"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <Input
              value={q.label}
              onChange={(e) => updateQuestion(q.id, { label: e.target.value })}
              placeholder="Question label"
              maxLength={150}
            />
            <Select
              value={q.type}
              onValueChange={(v) => {
                const type = v as FeedbackQuestionType;
                updateQuestion(q.id, {
                  type,
                  scale: type === "rating" ? 5 : type === "scale" ? 10 : undefined,
                });
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">Star rating (1–5)</SelectItem>
                <SelectItem value="scale">Numeric scale (1–10)</SelectItem>
                <SelectItem value="text">Open text</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ))}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setQuestions((qs) => [...qs, newQuestion("rating")])}>
            <Plus className="w-4 h-4" /> Rating
          </Button>
          <Button variant="outline" size="sm" onClick={() => setQuestions((qs) => [...qs, newQuestion("scale")])}>
            <Plus className="w-4 h-4" /> Scale
          </Button>
          <Button variant="outline" size="sm" onClick={() => setQuestions((qs) => [...qs, newQuestion("text")])}>
            <Plus className="w-4 h-4" /> Text
          </Button>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {editingFormId ? "Save changes" : "Create form"}
        </Button>
      </div>
    </div>
  );
};

export default FormBuilder;
