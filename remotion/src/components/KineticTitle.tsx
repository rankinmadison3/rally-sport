import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";

type Props = {
  text: string;
  size?: number;
  color?: string;
  delay?: number;
  letterDelay?: number;
  fontFamily?: string;
  weight?: number;
  italic?: boolean;
  letterSpacing?: number;
  uppercase?: boolean;
};

export const KineticTitle: React.FC<Props> = ({
  text,
  size = 180,
  color = "#F5F2EC",
  delay = 0,
  letterDelay = 2,
  fontFamily = "'Space Grotesk', system-ui, sans-serif",
  weight = 700,
  italic = false,
  letterSpacing = -4,
  uppercase = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const chars = (uppercase ? text.toUpperCase() : text).split("");
  return (
    <div
      style={{
        display: "flex",
        fontFamily,
        fontWeight: weight,
        fontStyle: italic ? "italic" : "normal",
        color,
        fontSize: size,
        letterSpacing,
        lineHeight: 0.95,
        whiteSpace: "pre",
      }}
    >
      {chars.map((c, i) => {
        const f = frame - delay - i * letterDelay;
        const s = spring({ frame: f, fps, config: { damping: 18, stiffness: 220 } });
        const y = interpolate(s, [0, 1], [60, 0]);
        const op = interpolate(s, [0, 1], [0, 1]);
        const blur = interpolate(s, [0, 1], [14, 0]);
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              transform: `translateY(${y}px)`,
              opacity: op,
              filter: `blur(${blur}px)`,
            }}
          >
            {c === " " ? "\u00A0" : c}
          </span>
        );
      })}
    </div>
  );
};
