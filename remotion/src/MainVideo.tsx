import { AbsoluteFill, Sequence } from "remotion";
import "./fonts";
import { ColdOpen } from "./scenes/ColdOpen";
import { HeroDashboard } from "./scenes/HeroDashboard";
import { HeroCalendar } from "./scenes/HeroCalendar";
import { MontageTasks } from "./scenes/MontageTasks";
import { MontageFeedback } from "./scenes/MontageFeedback";
import { MontageChat } from "./scenes/MontageChat";
import { EndCard } from "./scenes/EndCard";
import { GrainOverlay } from "./components/GrainOverlay";
import { CrimsonWipe } from "./components/CrimsonWipe";

// Scene durations (no transitions package; we hand-cut with wipes that overlap visually)
// 0-60   ColdOpen        (60)
// 60-150 HeroDashboard   (90)
// 150-240 HeroCalendar   (90)
// 240-290 MontageTasks   (50)
// 290-340 MontageFeedback(50)
// 340-390 MontageChat    (50)
// 390-450 EndCard        (60)

export const MainVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0B0B0F", overflow: "hidden" }}>
      <Sequence from={0} durationInFrames={60}>
        <ColdOpen />
      </Sequence>
      <Sequence from={60} durationInFrames={90}>
        <HeroDashboard />
      </Sequence>
      <Sequence from={150} durationInFrames={90}>
        <HeroCalendar />
      </Sequence>
      <Sequence from={240} durationInFrames={50}>
        <MontageTasks />
      </Sequence>
      <Sequence from={290} durationInFrames={50}>
        <MontageFeedback />
      </Sequence>
      <Sequence from={340} durationInFrames={50}>
        <MontageChat />
      </Sequence>
      <Sequence from={390} durationInFrames={60}>
        <EndCard />
      </Sequence>

      {/* Crimson wipes at every scene boundary */}
      <Sequence from={54} durationInFrames={14}><CrimsonWipe /></Sequence>
      <Sequence from={144} durationInFrames={14}><CrimsonWipe /></Sequence>
      <Sequence from={234} durationInFrames={14}><CrimsonWipe /></Sequence>
      <Sequence from={284} durationInFrames={14}><CrimsonWipe /></Sequence>
      <Sequence from={334} durationInFrames={14}><CrimsonWipe /></Sequence>
      <Sequence from={384} durationInFrames={14}><CrimsonWipe /></Sequence>

      <GrainOverlay />

      {/* REC tag persistent */}
      <div
        style={{
          position: "absolute",
          top: 32,
          right: 36,
          color: "#F5F2EC",
          fontFamily: "Inter, sans-serif",
          fontWeight: 500,
          fontSize: 18,
          letterSpacing: 2,
          display: "flex",
          alignItems: "center",
          gap: 10,
          opacity: 0.65,
          mixBlendMode: "difference",
        }}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: 999,
            background: "#B3122C",
            boxShadow: "0 0 12px #B3122C",
          }}
        />
        REC · RALLY SPORT
      </div>
    </AbsoluteFill>
  );
};
