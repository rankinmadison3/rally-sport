import React from "react";
import { Img, staticFile } from "remotion";

type Props = { src: string; width?: number };

// 16:10 laptop frame
export const LaptopFrame: React.FC<Props> = ({ src, width = 1200 }) => {
  const screenH = (width / 16) * 10;
  return (
    <div style={{ width, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div
        style={{
          width,
          height: screenH,
          background: "#0B0B0F",
          borderRadius: 18,
          padding: 16,
          boxShadow: "0 60px 120px rgba(0,0,0,0.55), 0 0 0 2px #1a1a22",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            background: "#fff",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top left" }} />
        </div>
      </div>
      {/* base */}
      <div
        style={{
          width: width * 1.08,
          height: 18,
          background: "linear-gradient(180deg,#1a1a22,#0B0B0F)",
          borderRadius: "0 0 18px 18px",
          boxShadow: "0 30px 60px rgba(0,0,0,0.5)",
        }}
      />
    </div>
  );
};
