import React from "react";

export default function MetricCard({ title, value, subtitle, icon: Icon, color = "blue", isDark }) {
  const colors = {
    blue: { bg: "bg-blue-500/10", text: "text-blue-500", border: "border-blue-500/20" },
    green: { bg: "bg-emerald-500/10", text: "text-emerald-500", border: "border-emerald-500/20" },
    purple: { bg: "bg-purple-500/10", text: "text-purple-500", border: "border-purple-500/20" },
    amber: { bg: "bg-amber-500/10", text: "text-amber-500", border: "border-amber-500/20" },
    red: { bg: "bg-red-500/10", text: "text-red-500", border: "border-red-500/20" },
    indigo: { bg: "bg-indigo-500/10", text: "text-indigo-500", border: "border-indigo-500/20" },
  };

  const c = colors[color] || colors.blue;

  return (
    <div className={`rounded-xl border p-5 ${isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-slate-200"}`}>
      <div className="flex items-start justify-between mb-3">
        <p className={`text-xs font-medium uppercase tracking-wider ${isDark ? "text-neutral-500" : "text-slate-500"}`}>
          {title}
        </p>
        {Icon && (
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${c.bg}`}>
            <Icon className={`w-4 h-4 ${c.text}`} />
          </div>
        )}
      </div>
      <p className={`text-3xl font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{value ?? "—"}</p>
      {subtitle && (
        <p className={`text-xs mt-1 ${c.text}`}>{subtitle}</p>
      )}
    </div>
  );
}