import { MontageScene } from "../components/MontageScene";

export const MontageFeedback: React.FC = () => (
  <MontageScene
    src="shots/feedback.png"
    label="Feedback."
    chips={["Mood Check-ins", "Ratings", "Anonymous Suggestions"]}
    bg="linear-gradient(135deg, #B3122C 0%, #5a0815 100%)"
    numeral="04"
    rotate={4}
  />
);
