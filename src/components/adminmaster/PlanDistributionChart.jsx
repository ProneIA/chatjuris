import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b"];
const LABELS = { trial: "Teste", monthly: "Mensal", yearly: "Anual", lifetime: "Vitalício" };

export default function PlanDistributionChart({ distribution, isDark }) {
  const data = Object.entries(distribution || {})
    .filter(([, v]) => v > 0)
    .map(([key, value]) => ({ name: LABELS[key] || key, value }));

  if (data.length === 0) {
    return (
      <p className={`text-center py-8 ${isDark ? "text-neutral-500" : "text-slate-400"}`}>
        Sem dados de distribuição
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={95}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: isDark ? "#171717" : "#fff",
            border: isDark ? "1px solid #333" : "1px solid #e2e8f0",
            borderRadius: 8,
            color: isDark ? "#fff" : "#0f172a",
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, color: isDark ? "#a3a3a3" : "#64748b" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}