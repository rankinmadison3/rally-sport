import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";

type Props = {
  kicker?: string;
  label: string;
  delay?: number;
  accent?: string;
  background?: string;
  color?: string;
};

export const StatChip: React.FC<Props> = ({
  kicker,
  label,
  delay = 0,
  accent = "#B3122C",
  background = "#F5F2EC",
  color = "#0B0B0F",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 18, stiffness: 240 } });
  const x = interpolate(s, [0, 1], [-80, 0]);
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "stretch",
        transform: `translateX(${x}px)`,
        opacity: s,
        boxShadow: "0 20px 40px rgba(0,0,0,0.35)",
      }}
    >
      <div style={{ width: 10, background: accent }} />
      <div
        style={{
          background,
          color,
          padding: "16px 28px",
          fontFamily: "'Space Grotesk', system-ui, sans-serif",
          fontWeight: 700,
          letterSpacing: -0.5,
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {kicker && (
          <div
            style={{
              fontFamily: "Inter, system-ui, sans-serif",
              fontWeight: 600,
              fontSize: 14,
              letterSpacing: 2,
              color: accent,
              textTransform: "uppercase",
            }}
          >
            {kicker}
          </div>
        )}
        <div style={{ fontSize: 36, lineHeight: 1 }}>{label}</div>
      </div>
    </div>
  );
};
