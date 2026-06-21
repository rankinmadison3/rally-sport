import React from "react";
import { Img, staticFile } from "remotion";

type Props = {
  src: string;
  width?: number;
  rotate?: number;
};

// iPhone-ish frame with rounded corners + bezel + notch shadow.
// Source image is expected to be 390x844 (preview shots).
export const PhoneFrame: React.FC<Props> = ({ src, width = 480, rotate = 0 }) => {
  const height = (width / 390) * 844;
  return (
    <div
      style={{
        width,
        height,
        borderRadius: width * 0.12,
        background: "#0B0B0F",
        padding: 14,
        boxShadow:
          "0 60px 120px rgba(0,0,0,0.55), 0 0 0 2px #1a1a22, inset 0 0 0 1px rgba(255,255,255,0.04)",
        transform: `rotate(${rotate}deg)`,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: width * 0.1,
          overflow: "hidden",
          background: "#fff",
          position: "relative",
        }}
      >
        <Img
          src={staticFile(src)}
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }}
        />
        {/* notch */}
        <div
          style={{
            position: "absolute",
            top: 10,
            left: "50%",
            transform: "translateX(-50%)",
            width: width * 0.28,
            height: 22,
            background: "#0B0B0F",
            borderRadius: 14,
          }}
        />
      </div>
    </div>
  );
};
