import { MontageScene } from "../components/MontageScene";

export const MontageChat: React.FC = () => (
  <MontageScene
    src="shots/chat.png"
    label="Chat."
    chips={["Team Channels", "Direct Messages", "Pinned Announcements"]}
    bg="linear-gradient(135deg, #1a1a22 0%, #0B0B0F 100%)"
    numeral="05"
    rotate={-3}
  />
);
