import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { KineticTitle } from "../components/KineticTitle";

export const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logoIn = spring({ frame, fps, config: { damping: 14, stiffness: 160 } });
  const logoScale = interpolate(logoIn, [0, 1], [0.7, 1]);
  const underline = interpolate(frame, [30, 55], [0, 700], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(ellipse at 50% 50%, #1a1a22 0%, #0B0B0F 70%)",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        gap: 28,
      }}
    >
      <Img
        src={staticFile("logo.png")}
        style={{
          width: 220,
          height: 220,
          objectFit: "contain",
          transform: `scale(${logoScale})`,
          opacity: logoIn,
          filter: "drop-shadow(0 0 40px rgba(179,18,44,0.5))",
        }}
      />
      <div style={{ position: "relative" }}>
        <KineticTitle text="One app. One team." size={96} delay={14} color="#F5F2EC" letterDelay={1} />
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: -22,
            transform: "translateX(-50%)",
            height: 6,
            width: underline,
            background: "#B3122C",
            boxShadow: "0 0 20px rgba(179,18,44,0.7)",
          }}
        />
      </div>
      <div
        style={{
          marginTop: 30,
          fontFamily: "Inter, system-ui, sans-serif",
          fontSize: 22,
          letterSpacing: 8,
          color: "#F5F2EC",
          opacity: interpolate(frame, [40, 55], [0, 0.7], { extrapolateRight: "clamp" }),
          textTransform: "uppercase",
        }}
      >
        Rally Sport
      </div>
    </AbsoluteFill>
  );
};
