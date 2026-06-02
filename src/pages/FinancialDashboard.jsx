import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DollarSign, TrendingUp, TrendingDown,
  PieChart, BarChart3, FileText, Plus
} from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import StatCard from "@/components/common/StatCard";
import AlertBanner from "@/components/common/AlertBanner";
import HonorariosManager from "@/components/financial/HonorariosManager";
import DespesasManager from "@/components/financial/DespesasManager";
import DREReport from "@/components/financial/DREReport";
import FluxoCaixaReport from "@/components/financial/FluxoCaixaReport";

const fmt = (v) =>
  typeof v === "number"
    ? `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
    : v;

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

  return (
    <div style={{ background: "var(--surface)", minHeight: "100vh", fontFamily: "var(--font-sans)" }}>
      <PageHeader
        title="Financeiro"
        sub="Gestão de honorários, despesas e fluxo de caixa"
        actions={
          <>
            <div style={{ display: "flex", gap: 0, border: "1px solid var(--ink-5)" }}>
              {PERIOD_OPTIONS.map(o => (
                <button
                  key={o.value}
                  onClick={() => setPeriod(o.value)}
                  style={{
                    padding: "7px 14px", border: "none", borderRight: "1px solid var(--ink-5)",
                    fontSize: 11, fontWeight: period === o.value ? 600 : 400,
                    cursor: "pointer", fontFamily: "var(--font-sans)",
                    background: period === o.value ? "var(--ink)" : "var(--white)",
                    color: period === o.value ? "var(--white)" : "var(--ink-3)",
                    transition: "all var(--duration)",
                  }}
                >
                  {o.label}
                </button>
              ))}
            </div>
            <button className="btn-primary" onClick={() => setActiveTab("honorarios")}>
              <Plus size={13} /> Nova Transação
            </button>
          </>
        }
      />

      {/* KPI Strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", background: "var(--ink-6)", gap: 1, borderBottom: "1px solid var(--ink-6)" }} className="lg:grid-cols-4 grid-cols-2">
        <StatCard title="Saldo do Período" value={fmt(saldo)} accentColor={saldo >= 0 ? "ok" : "danger"} status={saldo >= 0 ? { label: "Positivo", ok: true } : { label: "Negativo", danger: true }} />
        <StatCard title="Receitas" value={fmt(totalRecebido)} sub={`${taxaRecebimento}% dos contratos`} accentColor="ok" />
        <StatCard title="A Receber" value={fmt(totalPendente)} accentColor="warn" status={totalPendente > 0 ? { label: "Pendente", warn: true } : null} />
        <StatCard title="Despesas" value={fmt(totalDespesas)} accentColor={totalDespesas > totalRecebido ? "danger" : "neutral"} />
      </div>

      <div style={{ padding: "24px 28px" }}>
        {/* Alerta parcelas atrasadas */}
        {parcelasAtrasadas > 0 && (
          <div style={{ marginBottom: "1.5rem" }}>
            <AlertBanner
              variant="warn"
              message={`${parcelasAtrasadas} parcela${parcelasAtrasadas > 1 ? "s" : ""} atrasada${parcelasAtrasadas > 1 ? "s" : ""} — verifique a aba Honorários`}
            />
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList style={{ background: "var(--white)", border: "1px solid var(--ink-6)", borderRadius: 0, padding: 0, marginBottom: 20, display: "flex" }}>
            {[
              { value: "overview", icon: BarChart3, label: "Visão Geral" },
              { value: "honorarios", icon: DollarSign, label: "Honorários" },
              { value: "despesas", icon: TrendingDown, label: "Despesas" },
              { value: "dre", icon: PieChart, label: "DRE" },
              { value: "fluxo", icon: FileText, label: "Fluxo de Caixa" },
            ].map(t => (
              <TabsTrigger key={t.value} value={t.value} style={{ flex: 1, borderRadius: 0, fontSize: 11, fontWeight: 500, display: "flex", alignItems: "center", gap: 5, fontFamily: "var(--font-sans)" }}>
                <t.icon style={{ width: 13, height: 13 }} />{t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview">

            {/* Resumo rápido */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, marginBottom: 20, background: "var(--ink-6)" }}>
              <div style={{ background: "var(--white)", padding: "18px 20px", borderBottom: "2px solid var(--ok)" }}>
                <p style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--ink-4)", margin: "0 0 10px" }}>Contratos Ativos</p>
                <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 36, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.04em" }}>
                  {contratos.filter(c => c.status === "ativo").length}
                </span>
                <p style={{ fontSize: 11, color: "var(--ink-4)", margin: "4px 0 0" }}>Total: {fmt(totalContratado)}</p>
              </div>
              <div style={{ background: "var(--white)", padding: "18px 20px", borderBottom: "2px solid var(--warn)" }}>
                <p style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--ink-4)", margin: "0 0 10px" }}>Taxa de Recebimento</p>
                <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 36, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.04em" }}>
                  {taxaRecebimento}%
                </span>
                <div style={{ background: "var(--ink-6)", height: 3, marginTop: 10 }}>
                  <div style={{ width: `${Math.min(taxaRecebimento, 100)}%`, height: "100%", background: "var(--warn)", transition: "width 0.4s" }} />
                </div>
              </div>
            </div>

            {/* Tabela de transações recentes */}
            <div style={{ background: "var(--white)", border: "1px solid var(--ink-6)" }}>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--ink-6)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <p style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--ink-4)", margin: 0 }}>Transações Recentes</p>
                <span style={{ fontSize: 10, color: "var(--ink-4)" }}>{transacoesRecentes.length} registros</span>
              </div>
              {transacoesRecentes.length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center", color: "var(--ink-4)", fontSize: 12 }}>
                  Nenhuma transação no período selecionado
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "var(--ink-7)" }}>
                        {["Data", "Descrição", "Categoria", "Valor", "Status"].map(h => (
                          <th key={h} style={{ padding: "8px 14px", textAlign: "left", fontSize: 9, fontWeight: 600, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: "0.10em", whiteSpace: "nowrap", fontFamily: "var(--font-sans)" }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {transacoesRecentes.map((t, i) => (
                        <tr key={i} style={{ borderTop: "1px solid var(--ink-7)", transition: "background var(--duration)" }}
                          onMouseEnter={e => e.currentTarget.style.background = "var(--ink-7)"}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                        >
                          <td style={{ padding: "9px 14px", fontSize: 11, color: "var(--ink-3)", whiteSpace: "nowrap" }}>
                            {t.data ? new Date(t.data).toLocaleDateString("pt-BR") : "—"}
                          </td>
                          <td style={{ padding: "9px 14px", fontSize: 12, color: "var(--ink-2)", fontWeight: 500, maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {t.descricao}
                          </td>
                          <td style={{ padding: "9px 14px" }}>
                            <span className="badge badge-neutral">{t.categoria}</span>
                          </td>
                          <td style={{ padding: "9px 14px", fontSize: 12, fontWeight: 600, color: t.valor >= 0 ? "var(--ok)" : "var(--danger)", whiteSpace: "nowrap" }}>
                            {t.valor >= 0 ? "+" : ""}{fmt(t.valor)}
                          </td>
                          <td style={{ padding: "9px 14px" }}>
                            <span className={`badge ${t.status === "pago" ? "badge-success" : t.status === "atrasado" ? "badge-danger" : "badge-warning"}`}>
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