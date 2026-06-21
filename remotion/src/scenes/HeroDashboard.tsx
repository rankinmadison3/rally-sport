import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { PhoneFrame } from "../components/PhoneFrame";
import { StatChip } from "../components/StatChip";
import { KineticTitle } from "../components/KineticTitle";

export const HeroDashboard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const phoneIn = spring({ frame, fps, config: { damping: 18, stiffness: 140 } });
  const phoneY = interpolate(phoneIn, [0, 1], [800, 0]);
  // gentle parallax drift
  const drift = Math.sin(frame / 20) * 8;

  return (
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(125deg, #B3122C 0%, #7a0a1d 55%, #0B0B0F 100%)",
      }}
    >
      {/* big background label */}
      <div
        style={{
          position: "absolute",
          left: 60,
          top: 60,
          opacity: 0.18,
          mixBlendMode: "screen",
        }}
      >
        <KineticTitle text="01" size={420} delay={0} color="#F5F2EC" letterSpacing={-12} />
      </div>

      {/* phone */}
      <div
        style={{
          position: "absolute",
          right: 120,
          top: 80,
          transform: `translateY(${phoneY}px) rotate(-6deg) translateY(${drift}px)`,
        }}
      >
        <PhoneFrame src="shots/dashboard.png" width={520} />
      </div>

      {/* lower-third headline */}
      <div
        style={{
          position: "absolute",
          left: 80,
          bottom: 180,
          maxWidth: 900,
        }}
      >
        <KineticTitle text="Your team" size={140} delay={20} color="#F5F2EC" />
        <KineticTitle text="at a glance." size={140} delay={32} color="#F5F2EC" italic />
      </div>

      {/* stat chips */}
      <div
        style={{
          position: "absolute",
          left: 80,
          bottom: 90,
          display: "flex",
          gap: 18,
        }}
      >
        <StatChip kicker="Season" label="8 – 4" delay={45} />
        <StatChip kicker="Morale" label="4.0 / 5" delay={55} />
        <StatChip kicker="Roster" label="3 Players" delay={65} />
      </div>
    </AbsoluteFill>
  );
};
