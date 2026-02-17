import React from "react";

export default function AuditHealthGauge({ score, isDark }) {
  const getColor = (s) => {
    if (s >= 85) return "#10b981"; // emerald
    if (s >= 60) return "#f59e0b"; // amber
    if (s >= 40) return "#f97316"; // orange
    return "#ef4444"; // red
  };

  const getLabel = (s) => {
    if (s >= 85) return "Saudável";
    if (s >= 60) return "Atenção";
    if (s >= 40) return "Em Risco";
    return "Crítico";
  };

  const color = getColor(score);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
          <circle
            cx="70" cy="70" r={radius}
            fill="none"
            stroke={isDark ? "#262626" : "#f1f5f9"}
            strokeWidth="12"
          />
          <circle
            cx="70" cy="70" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold" style={{ color }}>{score}</span>
          <span className={`text-xs ${isDark ? "text-neutral-500" : "text-slate-500"}`}>/ 100</span>
        </div>
      </div>
      <div className="mt-2 text-center">
        <span className="text-sm font-semibold" style={{ color }}>{getLabel(score)}</span>
        <p className={`text-xs mt-0.5 ${isDark ? "text-neutral-500" : "text-slate-500"}`}>Saúde Geral do Sistema</p>
      </div>
    </div>
  );
}