import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { LaptopFrame } from "../components/LaptopFrame";
import { KineticTitle } from "../components/KineticTitle";

export const HeroCalendar: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const laptopIn = spring({ frame, fps, config: { damping: 20, stiffness: 130 } });
  const scale = interpolate(laptopIn, [0, 1], [0.85, 1]);
  const op = interpolate(laptopIn, [0, 1], [0, 1]);
  // slow Ken Burns zoom
  const zoom = 1 + (frame / 90) * 0.04;

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(160deg, #F5F2EC 0%, #e6dfd2 60%, #d6cbb6 100%)",
      }}
    >
      {/* huge backdrop number */}
      <div
        style={{
          position: "absolute",
          right: 40,
          top: 40,
          opacity: 0.08,
        }}
      >
        <KineticTitle text="02" size={420} color="#0B0B0F" letterSpacing={-12} />
      </div>

      {/* lower-third title (top-left here for asymmetry) */}
      <div style={{ position: "absolute", left: 80, top: 100 }}>
        <KineticTitle text="Season" size={130} delay={4} color="#0B0B0F" />
        <KineticTitle text="Calendar." size={130} delay={14} color="#B3122C" italic />
        <div
          style={{
            marginTop: 24,
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: 26,
            fontWeight: 500,
            color: "#0B0B0F",
            opacity: interpolate(frame, [30, 50], [0, 0.7], { extrapolateRight: "clamp" }),
            maxWidth: 480,
          }}
        >
          Games, practices and team events — every W/L in one place.
        </div>
      </div>

      {/* laptop */}
      <div
        style={{
          position: "absolute",
          right: -120,
          bottom: 40,
          transform: `scale(${scale * zoom}) rotate(-3deg)`,
          opacity: op,
          transformOrigin: "right bottom",
        }}
      >
        <LaptopFrame src="shots/calendar.png" width={1100} />
      </div>

      {/* W / L marker dots that pop in */}
      <Dots />
    </AbsoluteFill>
  );
};

const Dots: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dots = [
    { x: 1240, y: 720, color: "#16a34a" },
    { x: 1360, y: 760, color: "#B3122C" },
    { x: 1480, y: 700, color: "#16a34a" },
    { x: 1600, y: 740, color: "#16a34a" },
  ];
  return (
    <>
      {dots.map((d, i) => {
        const s = spring({ frame: frame - 45 - i * 5, fps, config: { damping: 10, stiffness: 200 } });
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: d.x,
              top: d.y,
              width: 28,
              height: 28,
              borderRadius: 999,
              background: d.color,
              transform: `scale(${s})`,
              boxShadow: `0 0 24px ${d.color}`,
            }}
          />
        );
      })}
    </>
  );
};
