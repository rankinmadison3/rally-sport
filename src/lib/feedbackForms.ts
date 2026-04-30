export type FeedbackQuestionType = "rating" | "scale" | "text";

export interface FeedbackQuestion {
  id: string;
  type: FeedbackQuestionType;
  label: string;
  scale?: number; // 5 for rating, 10 for scale
}

export interface FeedbackFormDef {
  id: string;
  name: string;
  description: string | null;
  questions: FeedbackQuestion[];
  is_template: boolean;
  is_system: boolean;
  team_id: string | null;
  created_by: string | null;
}

export const newQuestion = (type: FeedbackQuestionType): FeedbackQuestion => ({
  id: crypto.randomUUID(),
  type,
  label: "",
  scale: type === "rating" ? 5 : type === "scale" ? 10 : undefined,
});
