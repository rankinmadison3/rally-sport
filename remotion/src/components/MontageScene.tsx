import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { PhoneFrame } from "../components/PhoneFrame";
import { KineticTitle } from "../components/KineticTitle";

type Props = {
  src: string;
  label: string;
  chips: string[];
  bg: string;
  accent?: string;
  numeral: string;
  rotate?: number;
};

export const MontageScene: React.FC<Props> = ({ src, label, chips, bg, accent = "#B3122C", numeral, rotate = -4 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const phoneIn = spring({ frame, fps, config: { damping: 16, stiffness: 200 } });
  const phoneX = interpolate(phoneIn, [0, 1], [400, 0]);

  return (
    <AbsoluteFill style={{ background: bg }}>
      {/* big numeral */}
      <div style={{ position: "absolute", left: 60, top: 40, opacity: 0.16 }}>
        <KineticTitle text={numeral} size={360} color="#F5F2EC" letterSpacing={-10} />
      </div>

      {/* phone */}
      <div
        style={{
          position: "absolute",
          right: 160,
          top: 60,
          transform: `translateX(${phoneX}px) rotate(${rotate}deg)`,
          opacity: phoneIn,
        }}
      >
        <PhoneFrame src={src} width={440} />
      </div>

      {/* big label */}
      <div style={{ position: "absolute", left: 80, bottom: 220 }}>
        <KineticTitle text={label} size={130} delay={6} color="#F5F2EC" letterDelay={2} />
      </div>

      {/* chips */}
      <div
        style={{
          position: "absolute",
          left: 80,
          bottom: 120,
          display: "flex",
          gap: 14,
          flexWrap: "wrap",
          maxWidth: 800,
        }}
      >
        {chips.map((c, i) => {
          const s = spring({ frame: frame - 18 - i * 4, fps, config: { damping: 18, stiffness: 240 } });
          const y = interpolate(s, [0, 1], [30, 0]);
          return (
            <div
              key={c}
              style={{
                transform: `translateY(${y}px)`,
                opacity: s,
                padding: "10px 18px",
                background: "#F5F2EC",
                color: "#0B0B0F",
                fontFamily: "Inter, system-ui, sans-serif",
                fontWeight: 600,
                fontSize: 18,
                letterSpacing: 1.4,
                textTransform: "uppercase",
                borderLeft: `5px solid ${accent}`,
              }}
            >
              {c}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
