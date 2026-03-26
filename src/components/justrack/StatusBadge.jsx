import React from "react";

const config = {
  "Ativo":      { bg: "rgba(74,222,128,.12)",  color: "#4ade80",  border: "rgba(74,222,128,.3)" },
  "Arquivado":  { bg: "rgba(148,163,184,.1)",  color: "#94a3b8",  border: "rgba(148,163,184,.3)" },
  "Suspenso":   { bg: "rgba(251,191,36,.1)",   color: "#fbbf24",  border: "rgba(251,191,36,.3)" },
  "Baixado":    { bg: "rgba(248,113,113,.12)", color: "#f87171",  border: "rgba(248,113,113,.3)" },
};

export default function StatusBadge({ status }) {
  const s = config[status] || config["Arquivado"];
  return (
    <span style={{
      display: "inline-block",
      padding: ".2rem .6rem",
      background: s.bg,
      color: s.color,
      border: `1px solid ${s.border}`,
      fontSize: ".68rem",
      fontFamily: "'IBM Plex Sans', sans-serif",
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: ".08em",
    }}>
      {status || "—"}
    </span>
  );
}