import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, TrendingUp, TrendingDown, PieChart, BarChart3, FileText, Plus } from "lucide-react";
import AlertBanner from "@/components/common/AlertBanner";
import HonorariosManager from "@/components/financial/HonorariosManager";
import DespesasManager from "@/components/financial/DespesasManager";
import DREReport from "@/components/financial/DREReport";
import FluxoCaixaReport from "@/components/financial/FluxoCaixaReport";
import { AppPage, PageHeader, StatCard, KPIGrid, AppCard, AppBadge, SectionHeader, AppTabs, AppTable } from "@/components/ds";
import { AppTabPanel } from "@/components/ds/AppTabs";

const fmt = (v) =>
  typeof v === "number"
    ? `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
    : v;

const PERIODS = [
  { label: "Este mês",       value: "month"   },
  { label: "Últimos 3 meses",value: "3months" },
  { label: "Este ano",       value: "year"    },
];

const TABS = [
  { value: "overview",   label: "Visão Geral", icon: BarChart3   },
  { value: "honorarios", label: "Honorários",  icon: DollarSign  },
  { value: "despesas",   label: "Despesas",    icon: TrendingDown },
  { value: "dre",        label: "DRE",         icon: PieChart    },
  { value: "fluxo",      label: "Fluxo de Caixa", icon: FileText },
];

const STATUS_VARIANT = { pago: "success", atrasado: "danger", pendente: "warning" };
const STATUS_LABEL   = { pago: "Pago",    atrasado: "Atrasado", pendente: "Pendente" };

export default function FinancialDashboard() {
  const [user, setUser]       = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [period, setPeriod]   = useState("month");

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

  const now = new Date();
  const periodStart =
    period === "month"   ? new Date(now.getFullYear(), now.getMonth(), 1)     :
    period === "3months" ? new Date(now.getFullYear(), now.getMonth() - 2, 1) :
                           new Date(now.getFullYear(), 0, 1);

  const parcelasPeriod = parcelas.filter((p) => new Date(p.data_vencimento) >= periodStart);
  const despesasPeriod = despesas.filter((d) => new Date(d.data_vencimento || d.created_date) >= periodStart);

  const totalRecebido     = parcelasPeriod.filter((p) => p.status === "pago").reduce((s, p) => s + (p.valor || 0), 0);
  const totalPendente     = parcelasPeriod.filter((p) => p.status === "pendente" || p.status === "atrasado").reduce((s, p) => s + (p.valor || 0), 0);
  const totalDespesas     = despesasPeriod.reduce((s, d) => s + (d.valor || 0), 0);
  const saldo             = totalRecebido - totalDespesas;
  const totalContratado   = contratos.filter((c) => c.status === "ativo" || c.status === "concluido").reduce((s, c) => s + (c.valor_total || 0), 0);
  const taxaRecebimento   = totalContratado > 0 ? ((totalRecebido / totalContratado) * 100).toFixed(1) : 0;
  const parcelasAtrasadas = parcelas.filter((p) => p.status === "pendente" && new Date(p.data_vencimento) < now).length;

  const transacoes = [
    ...parcelasPeriod.map((p) => ({
      id:        p.id,
      data:      p.data_vencimento ? new Date(p.data_vencimento).toLocaleDateString("pt-BR") : "—",
      descricao: p.descricao || `Honorário #${p.id?.slice(-4)}`,
      categoria: "Honorários",
      valor:     p.valor || 0,
      tipo:      "receita",
      status:    p.status,
    })),
    ...despesasPeriod.map((d) => ({
      id:        d.id,
      data:      d.data_vencimento ? new Date(d.data_vencimento).toLocaleDateString("pt-BR") : "—",
      descricao: d.descricao || d.titulo || "Despesa",
      categoria: d.categoria || "Despesa",
      valor:     -(d.valor || 0),
      tipo:      "despesa",
      status:    d.status,
    })),
  ].sort((a, b) => new Date(b.data) - new Date(a.data)).slice(0, 20);

  const tableColumns = [
    { key: "data",      label: "Data",      width: 100 },
    { key: "descricao", label: "Descrição", wrap: true },
    { key: "categoria", label: "Categoria", render: (v) => <AppBadge variant="neutral">{v}</AppBadge> },
    {
      key: "valor", label: "Valor", align: "right",
      render: (v) => (
        <span style={{ fontWeight: 600, color: v >= 0 ? "var(--success)" : "var(--danger)" }}>
          {v >= 0 ? "+" : ""}{fmt(v)}
        </span>
      ),
    },
    {
      key: "status", label: "Status", align: "center",
      render: (v) => <AppBadge variant={STATUS_VARIANT[v] || "neutral"}>{STATUS_LABEL[v] || v}</AppBadge>,
    },
  ];

  return (
    <AppPage>
      <PageHeader
        title="Financeiro"
        subtitle="Gestão de honorários, despesas e fluxo de caixa"
        icon={DollarSign}
        actions={
          <>
            {/* Period selector */}
            <div style={{ display: "flex", gap: 4, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, padding: 4 }}>
              {PERIODS.map((o) => (
                <button
                  key={o.value}
                  onClick={() => setPeriod(o.value)}
                  style={{
                    padding: "6px 12px",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: period === o.value ? 600 : 400,
                    cursor: "pointer",
                    fontFamily: "var(--font-body)",
                    background: period === o.value ? "var(--card)" : "transparent",
                    color: period === o.value ? "var(--text-1)" : "var(--text-2)",
                    boxShadow: period === o.value ? "0 1px 2px rgba(0,0,0,.06)" : "none",
                    transition: "all 0.15s ease",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {o.label}
                </button>
              ))}
            </div>
            <button className="btn btn-primary" onClick={() => setActiveTab("honorarios")}>
              <Plus size={14} /> Nova Transação
            </button>
          </>
        }
      />

      {/* KPI */}
      <KPIGrid cols={4}>
        <StatCard icon={DollarSign}   label="Saldo do Período" value={fmt(saldo)}         sub={saldo >= 0 ? "Resultado positivo" : "Resultado negativo"} color={saldo >= 0 ? "var(--success)" : "var(--danger)"} />
        <StatCard icon={TrendingUp}   label="Receitas"          value={fmt(totalRecebido)} sub={`${taxaRecebimento}% dos contratos`}                      color="var(--success)" />
        <StatCard icon={TrendingDown} label="A Receber"          value={fmt(totalPendente)} sub="em aberto"                                                color="var(--warning)" />
        <StatCard icon={TrendingDown} label="Despesas"           value={fmt(totalDespesas)} sub="no período"                                               color={totalDespesas > totalRecebido ? "var(--danger)" : "var(--text-muted)"} />
      </KPIGrid>

      <div style={{ padding: "24px 32px" }}>

        {parcelasAtrasadas > 0 && (
          <div style={{ marginBottom: 20 }}>
            <AlertBanner
              variant="warn"
              message={`${parcelasAtrasadas} parcela${parcelasAtrasadas > 1 ? "s" : ""} atrasada${parcelasAtrasadas > 1 ? "s" : ""} — verifique a aba Honorários`}
            />
          </div>
        )}

        <AppTabs tabs={TABS} value={activeTab} onValueChange={setActiveTab}>
          <AppTabPanel value="overview">
            {/* Summary cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }} className="md:grid-cols-2 grid-cols-1">
              <AppCard>
                <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-2)", margin: "0 0 12px" }}>Contratos Ativos</p>
                <p style={{ fontSize: 36, fontWeight: 700, color: "var(--text-1)", letterSpacing: "-0.04em", margin: "0 0 4px" }}>
                  {contratos.filter((c) => c.status === "ativo").length}
                </p>
                <p style={{ fontSize: 12, color: "var(--text-2)", margin: 0 }}>Total: {fmt(totalContratado)}</p>
                <div style={{ background: "var(--border)", height: 3, marginTop: 12, borderRadius: 2 }}>
                  <div style={{ width: `${Math.min(taxaRecebimento, 100)}%`, height: "100%", background: "var(--success)", borderRadius: 2, transition: "width 0.4s" }} />
                </div>
              </AppCard>
              <AppCard>
                <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-2)", margin: "0 0 12px" }}>Taxa de Recebimento</p>
                <p style={{ fontSize: 36, fontWeight: 700, color: "var(--text-1)", letterSpacing: "-0.04em", margin: "0 0 4px" }}>
                  {taxaRecebimento}%
                </p>
                <p style={{ fontSize: 12, color: "var(--text-2)", margin: 0 }}>do total contratado</p>
                <div style={{ background: "var(--border)", height: 3, marginTop: 12, borderRadius: 2 }}>
                  <div style={{ width: `${Math.min(taxaRecebimento, 100)}%`, height: "100%", background: "var(--warning)", borderRadius: 2, transition: "width 0.4s" }} />
                </div>
              </AppCard>
            </div>

            {/* Transactions table */}
            <AppCard noPad>
              <SectionHeader title="Transações Recentes" subtitle={`${transacoes.length} registros no período`} />
              <AppTable columns={tableColumns} rows={transacoes} emptyMessage="Nenhuma transação no período selecionado" />
            </AppCard>
          </AppTabPanel>

          <AppTabPanel value="honorarios">
            <HonorariosManager />
          </AppTabPanel>

          <AppTabPanel value="despesas">
            <DespesasManager />
          </AppTabPanel>

          <AppTabPanel value="dre">
            <DREReport
              receitas={totalRecebido}
              despesas={totalDespesas}
              despesasDetalhadas={despesas.filter((d) => d.status === "pago")}
            />
          </AppTabPanel>

          <AppTabPanel value="fluxo">
            <FluxoCaixaReport parcelas={parcelas} despesas={despesas} />
          </AppTabPanel>
        </AppTabs>
      </div>
    </AppPage>
  );
}