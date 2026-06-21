import { MontageScene } from "../components/MontageScene";

export const MontageTasks: React.FC = () => (
  <MontageScene
    src="shots/tasks.png"
    label="Tasks."
    chips={["Technical", "Mental", "Physical", "Teamwork"]}
    bg="linear-gradient(135deg, #0B0B0F 0%, #1a1a22 100%)"
    numeral="03"
    rotate={-4}
  />
);
