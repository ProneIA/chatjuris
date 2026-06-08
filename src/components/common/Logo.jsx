import React from "react";

export default function Logo({ size = 28, className = "" }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        style={{
          width: size,
          height: size,
          background: "#B8952A",
          borderRadius: 4,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontWeight: 700,
            fontSize: size * 0.5,
            color: "#fff",
            lineHeight: 1,
          }}
        >
          J
        </span>
      </div>
      <span
        style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontWeight: 700,
          fontSize: size * 0.57,
          color: "#fff",
          letterSpacing: "-0.01em",
          lineHeight: 1,
        }}
      >
        JURIS<span style={{ color: "#B8952A" }}>.IA</span>
      </span>
    </div>
  );
}