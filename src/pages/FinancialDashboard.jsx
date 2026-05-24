import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DollarSign, TrendingUp, TrendingDown, AlertCircle,
  Calendar, PieChart, BarChart3, FileText, Plus, Filter
} from "lucide-react";
import HonorariosManager from "@/components/financial/HonorariosManager";
import DespesasManager from "@/components/financial/DespesasManager";
import DREReport from "@/components/financial/DREReport";
import FluxoCaixaReport from "@/components/financial/FluxoCaixaReport";

const GOLD = "#C9A84C";
const GOLD_LIGHT = "#FBF5E6";
const GOLD_BORDER = "#E8D5A0";

const fmt = (v) =>
  typeof v === "number"
    ? `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
    : v;

function SummaryCard({ title, value, icon: Icon, trend, trendLabel, accentColor }) {
  const colors = {
    green: { bg: "#F0FDF4", border: "#BBF7D0", icon: "#16A34A", text: "#15803D" },
    red:   { bg: "#FEF2F2", border: "#FECACA", icon: "#DC2626", text: "#B91C1C" },
    gold:  { bg: GOLD_LIGHT, border: GOLD_BORDER, icon: GOLD, text: "#A07830" },
  };
  const c = colors[accentColor] || colors.gold;

  return (
    <div style={{
      background: "#FFFFFF",
      border: "1px solid #E8E4DC",
      borderRadius: 12,
      padding: "1.25rem 1.5rem",
      display: "flex",
      flexDirection: "column",
      gap: "0.5rem",
      boxShadow: "0 1px 4px rgba(0,0,0,0.05)"
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em" }}>{title}</span>
        <div style={{ width: 34, height: 34, borderRadius: 8, background: c.bg, border: `1px solid ${c.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon style={{ width: 16, height: 16, color: c.icon }} />
        </div>
      </div>
      <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#1A1A1A", fontFamily: "'IBM Plex Sans', sans-serif", lineHeight: 1.1 }}>
        {fmt(value)}
      </div>
      {trend && (
        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.75rem", color: c.text, fontWeight: 500 }}>
          {trend === "up" ? <TrendingUp style={{ width: 13, height: 13 }} /> : <TrendingDown style={{ width: 13, height: 13 }} />}
          {trendLabel}
        </div>
      )}
    </div>
  );
}

const PERIOD_OPTIONS = [
  { label: "Este mês", value: "month" },
  { label: "Últimos 3 meses", value: "3months" },
  { label: "Este ano", value: "year" },
];

export default function FinancialDashboard() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [period, setPeriod] = useState("month");
  const [showHonorariosForm, setShowHonorariosForm] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: contratos = [] } = useQuery({
    queryKey: ["honorarios", user?.email],
    queryFn: () => base44.entities.HonorarioContrato.filter({ created_by: user.email }),
    enabled: !!user?.email,
  });

  const { data: parcelas = [] } = useQuery({
    queryKey: ["parcelas", user?.email],
    queryFn: () => base44.entities.ParcelaHonorario.filter({ created_by: user.email }),
    enabled: !!user?.email,
  });

  const { data: despesas = [] } = useQuery({
    queryKey: ["despesas", user?.email],
    queryFn: () => base44.entities.Despesa.filter({ created_by: user.email }),
    enabled: !!user?.email,
  });

  // Period filter
  const now = new Date();
  const periodStart = period === "month"
    ? new Date(now.getFullYear(), now.getMonth(), 1)
    : period === "3months"
    ? new Date(now.getFullYear(), now.getMonth() - 2, 1)
    : new Date(now.getFullYear(), 0, 1);

  const parcelasPeriod = parcelas.filter(p => new Date(p.data_vencimento) >= periodStart);
  const despesasPeriod = despesas.filter(d => new Date(d.data_vencimento || d.created_date) >= periodStart);

  const totalRecebido = parcelasPeriod.filter(p => p.status === "pago").reduce((s, p) => s + (p.valor || 0), 0);
  const totalPendente = parcelasPeriod.filter(p => p.status === "pendente" || p.status === "atrasado").reduce((s, p) => s + (p.valor || 0), 0);
  const totalDespesas = despesasPeriod.reduce((s, d) => s + (d.valor || 0), 0);
  const saldo = totalRecebido - totalDespesas;

  const totalContratado = contratos.filter(c => c.status === "ativo" || c.status === "concluido").reduce((s, c) => s + (c.valor_total || 0), 0);
  const taxaRecebimento = totalContratado > 0 ? ((totalRecebido / totalContratado) * 100).toFixed(1) : 0;

  const parcelasAtrasadas = parcelas.filter(p => {
    if (p.status !== "pendente") return false;
    return new Date(p.data_vencimento) < now;
  }).length;

  // Transações recentes para tabela
  const transacoesRecentes = [
    ...parcelasPeriod.map(p => ({
      data: p.data_vencimento,
      descricao: p.descricao || `Honorário #${p.id?.slice(-4)}`,
      categoria: "Honorários",
      valor: p.valor || 0,
      tipo: "receita",
      status: p.status,
    })),
    ...despesasPeriod.map(d => ({
      data: d.data_vencimento || d.created_date,
      descricao: d.descricao || d.titulo || "Despesa",
      categoria: d.categoria || "Despesa",
      valor: -(d.valor || 0),
      tipo: "despesa",
      status: d.status,
    })),
  ].sort((a, b) => new Date(b.data) - new Date(a.data)).slice(0, 20);

  const headerStyle = {
    background: "#FAFAFA",
    borderBottom: "1px solid #E0E0E0",
  };
  const contentStyle = {
    padding: "2rem",
    maxWidth: 1400,
    margin: "0 auto",
  };

  return (
    <div style={{ background: "#F5F3EE", minHeight: "100vh" }}>
      {/* ── HEADER ── */}
      <div style={headerStyle}>
        <div style={{ padding: "1.5rem 2rem", maxWidth: 1400, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 800, fontSize: "1.4rem", color: "#1A1A1A", margin: 0, textTransform: "uppercase", letterSpacing: "0.07em" }}>
              Financeiro
            </h1>
            <p style={{ marginTop: "0.2rem", color: "#888", fontSize: "0.82rem", margin: 0 }}>
              Gestão de honorários, despesas e fluxo de caixa
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            {/* Period filter */}
            <div style={{ display: "flex", gap: 4, background: "#F0EDE6", borderRadius: 8, padding: 3, border: "1px solid #E8E4DC" }}>
              {PERIOD_OPTIONS.map(o => (
                <button
                  key={o.value}
                  onClick={() => setPeriod(o.value)}
                  style={{
                    padding: "5px 14px",
                    borderRadius: 6,
                    border: "none",
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    background: period === o.value ? "#FFFFFF" : "transparent",
                    color: period === o.value ? GOLD : "#888",
                    boxShadow: period === o.value ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                    transition: "all 0.15s",
                  }}
                >
                  {o.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => { setActiveTab("honorarios"); }}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 18px", borderRadius: 8,
                background: GOLD, border: "none", color: "#fff",
                fontWeight: 700, fontSize: "0.82rem", cursor: "pointer",
                letterSpacing: "0.04em", textTransform: "uppercase",
                boxShadow: "0 2px 8px rgba(201,168,76,0.3)",
              }}
            >
              <Plus style={{ width: 15, height: 15 }} />
              Nova Transação
            </button>
          </div>
        </div>
      </div>

      {/* ── CONTEÚDO ── */}
      <div style={contentStyle}>
        {/* Alerta parcelas atrasadas */}
        {parcelasAtrasadas > 0 && (
          <div style={{ background: "#FFF7ED", border: "1px solid #FED7AA", borderLeft: "4px solid #F97316", borderRadius: 10, padding: "0.75rem 1.25rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: 10 }}>
            <AlertCircle style={{ width: 18, height: 18, color: "#EA580C", flexShrink: 0 }} />
            <span style={{ fontSize: "0.85rem", color: "#9A3412", fontWeight: 600 }}>
              {parcelasAtrasadas} parcela{parcelasAtrasadas > 1 ? "s" : ""} atrasada{parcelasAtrasadas > 1 ? "s" : ""} — verifique a aba Honorários
            </span>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList style={{ marginBottom: "1.5rem", background: "#F0EDE6", border: "1px solid #E8E4DC", borderRadius: 10, padding: 4 }}>
            <TabsTrigger value="overview"><BarChart3 className="w-4 h-4 mr-1.5" />Visão Geral</TabsTrigger>
            <TabsTrigger value="honorarios"><DollarSign className="w-4 h-4 mr-1.5" />Honorários</TabsTrigger>
            <TabsTrigger value="despesas"><TrendingDown className="w-4 h-4 mr-1.5" />Despesas</TabsTrigger>
            <TabsTrigger value="dre"><PieChart className="w-4 h-4 mr-1.5" />DRE</TabsTrigger>
            <TabsTrigger value="fluxo"><FileText className="w-4 h-4 mr-1.5" />Fluxo de Caixa</TabsTrigger>
          </TabsList>

          {/* ── VISÃO GERAL ── */}
          <TabsContent value="overview">
            {/* KPI Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
              <SummaryCard title="Saldo do Período" value={saldo} icon={DollarSign} accentColor={saldo >= 0 ? "green" : "red"} />
              <SummaryCard title="Receitas" value={totalRecebido} icon={TrendingUp} trend="up" trendLabel={`${taxaRecebimento}% dos contratos`} accentColor="green" />
              <SummaryCard title="A Receber" value={totalPendente} icon={AlertCircle} accentColor="gold" />
              <SummaryCard title="Despesas" value={totalDespesas} icon={TrendingDown} accentColor="red" />
            </div>

            {/* Resumo rápido */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
              <div style={{ background: "#fff", border: "1px solid #E8E4DC", borderRadius: 12, padding: "1.25rem" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.75rem" }}>Contratos Ativos</div>
                <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "#1A1A1A", fontFamily: "'IBM Plex Sans', sans-serif" }}>
                  {contratos.filter(c => c.status === "ativo").length}
                </div>
                <div style={{ fontSize: "0.8rem", color: "#888", marginTop: 4 }}>
                  Total contratado: {fmt(totalContratado)}
                </div>
              </div>
              <div style={{ background: "#fff", border: "1px solid #E8E4DC", borderRadius: 12, padding: "1.25rem" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.75rem" }}>Taxa de Recebimento</div>
                <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "#1A1A1A", fontFamily: "'IBM Plex Sans', sans-serif" }}>
                  {taxaRecebimento}%
                </div>
                <div style={{ background: "#F0EDE6", borderRadius: 999, height: 6, marginTop: 10 }}>
                  <div style={{ width: `${Math.min(taxaRecebimento, 100)}%`, height: "100%", borderRadius: 999, background: GOLD, transition: "width 0.4s" }} />
                </div>
              </div>
            </div>

            {/* Tabela de transações recentes */}
            <div style={{ background: "#fff", border: "1px solid #E8E4DC", borderRadius: 12, overflow: "hidden" }}>
              <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid #F0EDE6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "#1A1A1A" }}>
                  Transações Recentes
                </span>
                <span style={{ fontSize: "0.75rem", color: "#888" }}>{transacoesRecentes.length} registros</span>
              </div>
              {transacoesRecentes.length === 0 ? (
                <div style={{ padding: "3rem", textAlign: "center", color: "#888", fontSize: "0.875rem" }}>
                  Nenhuma transação no período selecionado
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#FAFAFA" }}>
                        {["Data", "Descrição", "Categoria", "Valor", "Status"].map(h => (
                          <th key={h} style={{ padding: "0.6rem 1rem", textAlign: "left", fontSize: "0.72rem", fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.07em", whiteSpace: "nowrap" }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {transacoesRecentes.map((t, i) => (
                        <tr key={i} style={{ borderTop: "1px solid #F5F3EE", transition: "background 0.1s" }}
                          onMouseEnter={e => e.currentTarget.style.background = "#FAFAF7"}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                        >
                          <td style={{ padding: "0.7rem 1rem", fontSize: "0.82rem", color: "#555", whiteSpace: "nowrap" }}>
                            {t.data ? new Date(t.data).toLocaleDateString("pt-BR") : "—"}
                          </td>
                          <td style={{ padding: "0.7rem 1rem", fontSize: "0.85rem", color: "#1A1A1A", fontWeight: 500, maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {t.descricao}
                          </td>
                          <td style={{ padding: "0.7rem 1rem" }}>
                            <span style={{ padding: "2px 10px", borderRadius: 999, background: "#F0EDE6", color: "#A07830", fontSize: "0.72rem", fontWeight: 600 }}>
                              {t.categoria}
                            </span>
                          </td>
                          <td style={{ padding: "0.7rem 1rem", fontSize: "0.88rem", fontWeight: 700, color: t.valor >= 0 ? "#16A34A" : "#DC2626", whiteSpace: "nowrap" }}>
                            {t.valor >= 0 ? "+" : ""}{fmt(t.valor)}
                          </td>
                          <td style={{ padding: "0.7rem 1rem" }}>
                            <span style={{
                              padding: "2px 10px", borderRadius: 999, fontSize: "0.72rem", fontWeight: 700,
                              background: t.status === "pago" ? "#F0FDF4" : t.status === "atrasado" ? "#FEF2F2" : "#FFF7ED",
                              color: t.status === "pago" ? "#16A34A" : t.status === "atrasado" ? "#DC2626" : "#EA580C",
                            }}>
                              {t.status === "pago" ? "Pago" : t.status === "atrasado" ? "Atrasado" : "Pendente"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="honorarios">
            <HonorariosManager />
          </TabsContent>

          <TabsContent value="despesas">
            <DespesasManager />
          </TabsContent>

          <TabsContent value="dre">
            <DREReport
              receitas={totalRecebido}
              despesas={totalDespesas}
              despesasDetalhadas={despesas.filter(d => d.status === "pago")}
            />
          </TabsContent>

          <TabsContent value="fluxo">
            <FluxoCaixaReport parcelas={parcelas} despesas={despesas} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}