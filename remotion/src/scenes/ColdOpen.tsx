import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { KineticTitle } from "../components/KineticTitle";

export const ColdOpen: React.FC = () => {
  const frame = useCurrentFrame();
  // diagonal crimson stroke that draws across "RALLY"
  const strokeWidth = interpolate(frame, [10, 30], [0, 1500], { extrapolateRight: "clamp" });
  const taglineOp = interpolate(frame, [30, 45], [0, 1], { extrapolateRight: "clamp" });
  const taglineY = interpolate(frame, [30, 45], [20, 0], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(ellipse at 30% 20%, #1a1a22 0%, #0B0B0F 60%)",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        gap: 24,
      }}
    >
      <div style={{ position: "relative" }}>
        <KineticTitle text="Rally Sport" size={200} delay={0} letterDelay={3} />
        {/* crimson swipe through the wordmark */}
        <div
          style={{
            position: "absolute",
            left: -100,
            top: "55%",
            height: 22,
            width: strokeWidth,
            background: "#B3122C",
            transform: "skewX(-12deg)",
            boxShadow: "0 0 40px rgba(179,18,44,0.7)",
          }}
        />
      </div>
      <div
        style={{
          fontFamily: "Inter, system-ui, sans-serif",
          fontSize: 36,
          fontWeight: 500,
          color: "#F5F2EC",
          letterSpacing: 10,
          textTransform: "uppercase",
          opacity: taglineOp,
          transform: `translateY(${taglineY}px)`,
        }}
      >
        Run · Your · Team
      </div>
    </AbsoluteFill>
  );
};
