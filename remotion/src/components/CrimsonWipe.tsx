import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

// 14-frame diagonal crimson swipe — covers screen at midpoint, then exits.
export const CrimsonWipe: React.FC = () => {
  const frame = useCurrentFrame();
  // 0 -> 1 across full duration
  const t = interpolate(frame, [0, 14], [0, 1], { extrapolateRight: "clamp" });
  // Bar travels from -120% to 120% of width across the 14 frames
  const x = interpolate(t, [0, 1], [-130, 130]);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          top: "-20%",
          left: 0,
          width: "180%",
          height: "140%",
          background: "#B3122C",
          transform: `translateX(${x}%) skewX(-18deg)`,
          boxShadow: "0 0 80px rgba(179,18,44,0.6)",
        }}
      />
    </AbsoluteFill>
  );
};
