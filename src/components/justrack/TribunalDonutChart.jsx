import React, { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const COLORS = [
  "#C9A84C", "#4ade80", "#60a5fa", "#f87171", "#a78bfa",
  "#fb923c", "#34d399", "#f472b6", "#38bdf8", "#facc15",
];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div style={{ background: "#0d1117", border: "1px solid #1e2740", padding: ".6rem .9rem", fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <p style={{ color: d.payload.fill, fontSize: ".78rem", fontWeight: 600, margin: "0 0 .15rem" }}>{d.name}</p>
      <p style={{ color: "#e8eaf0", fontSize: ".82rem", margin: 0 }}>{d.value} processo{d.value !== 1 ? "s" : ""}</p>
    </div>
  );
};

const CustomLegend = ({ payload }) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: ".4rem .9rem", justifyContent: "center", marginTop: ".5rem" }}>
    {payload.map((entry, i) => (
      <div key={i} style={{ display: "flex", alignItems: "center", gap: ".3rem" }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: entry.color, flexShrink: 0 }} />
        <span style={{ fontSize: ".68rem", color: "#8892a4", fontFamily: "'IBM Plex Sans', sans-serif" }}>{entry.value}</span>
      </div>
    ))}
  </div>
);

export default function TribunalDonutChart({ processos }) {
  const data = useMemo(() => {
    const counts = {};
    for (const p of processos) {
      const t = p.tribunal || "Não informado";
      // Abreviar nome longo do tribunal
      const label = t.length > 22 ? t.replace(/Tribunal(.*?)de\s/i, "").trim().slice(0, 22) : t;
      counts[label] = (counts[label] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [processos]);

  if (data.length === 0) {
    return (
      <div style={{ padding: "2.5rem", textAlign: "center" }}>
        <p style={{ color: "#4a5568", fontFamily: "'IBM Plex Sans', sans-serif", fontSize: ".82rem" }}>
          Cadastre processos para visualizar o gráfico.
        </p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="45%"
          innerRadius={60}
          outerRadius={95}
          paddingAngle={2}
          dataKey="value"
          stroke="none"
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend content={<CustomLegend />} />
      </PieChart>
    </ResponsiveContainer>
  );
}