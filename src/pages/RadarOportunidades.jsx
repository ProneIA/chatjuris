import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, TrendingUp, MapPin, Bell, Sparkles, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import RadarDashboard from "@/components/radar/RadarDashboard";
import TendenciasChart from "@/components/radar/TendenciasChart";
import MapaRegional from "@/components/radar/MapaRegional";
import { toast } from "sonner";
import { AppPage, PageHeader, AppCard, AppBadge, AppAlert, AppTabs, SectionHeader } from "@/components/ds";
import { AppTabPanel } from "@/components/ds/AppTabs";

const AREAS = [
  { id: "consumidor",    label: "Consumidor" },
  { id: "trabalhista",   label: "Trabalhista" },
  { id: "previdenciario",label: "Previdenciário" },
  { id: "familia",       label: "Família" },
  { id: "empresarial",   label: "Empresarial" },
  { id: "tributario",    label: "Tributário" },
  { id: "saude",         label: "Saúde" },
  { id: "imobiliario",   label: "Imobiliário" },
];

const TABS = [
  { value: "dashboard",  label: "Dashboard",  icon: Activity   },
  { value: "tendencias", label: "Tendências", icon: TrendingUp },
  { value: "mapa",       label: "Mapa",       icon: MapPin     },
  { value: "alertas",    label: "Alertas",    icon: Bell       },
];

export default function RadarOportunidades() {
  const [user, setUser]                   = useState(null);
  const [selectedArea, setSelectedArea]   = useState("all");
  const [generatingStrategy, setGeneratingStrategy] = useState(false);
  const [atualizandoDados, setAtualizandoDados]     = useState(false);
  const queryClient                                  = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: insights = [] } = useQuery({
    queryKey: ["insights-juridicos", user?.email],
    queryFn: () => base44.entities.InsightJuridico.filter({ created_by: user.email }, "-created_date", 50),
    enabled: !!user,
  });

  const { data: casosPublicos } = useQuery({
    queryKey: ["casos-publicos", user?.email],
    queryFn: () => base44.entities.CasoPublico.filter({ created_by: user.email }, "-data_distribuicao", 100),
    enabled: !!user,
  });

  const atualizarDados = async () => {
    setAtualizandoDados(true);
    try {
      const response = await base44.functions.invoke("atualizarRadarDados", {});
      if (response.data.success) {
        toast.success(`${response.data.casosInseridos} casos e ${response.data.insightsGerados} insights atualizados!`);
        queryClient.invalidateQueries(["insights-juridicos"]);
        queryClient.invalidateQueries(["casos-publicos"]);
      } else {
        toast.error("Erro ao atualizar dados");
      }
    } catch (e) {
      toast.error("Erro ao atualizar: " + e.message);
    } finally {
      setAtualizandoDados(false);
    }
  };

  const generateStrategyWithAI = async () => {
    setGeneratingStrategy(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um sistema de inteligência jurídica especializado no ordenamento jurídico brasileiro.
Analise os seguintes dados agregados de processos públicos e gere uma estratégia informativa:
- Área predominante: Direito do Consumidor
- Volume: 42 novos casos nos últimos 15 dias
- Região: Piauí
- Ticket médio estimado: R$ 18.000
REGRAS: Nunca sugerir contato direto com partes; focar em posicionamento informativo; conformidade OAB/LGPD.`,
        response_json_schema: {
          type: "object",
          properties: {
            estrategia:       { type: "string" },
            acoes_sugeridas:  { type: "array", items: { type: "string" } },
            observacoes_eticas: { type: "string" },
          },
        },
      });
      toast.success("Estratégia gerada!");
      await base44.entities.InsightJuridico.create({
        titulo:                    "Estratégia Gerada por IA",
        area_juridica:             "consumidor",
        regiao:                    "PI",
        volume_casos:              42,
        ticket_medio:              18000,
        tendencia:                 "alta",
        periodo_analise_inicio:    new Date(Date.now() - 15 * 86400000).toISOString().split("T")[0],
        periodo_analise_fim:       new Date().toISOString().split("T")[0],
        estrategia_sugerida:       response.estrategia,
        relevancia:                "alta",
        descricao:                 response.acoes_sugeridas?.join("\n"),
      });
    } catch {
      toast.error("Erro ao gerar estratégia");
    } finally {
      setGeneratingStrategy(false);
    }
  };

  const highAlerts = insights.filter((i) => i.relevancia === "alta");
  const tabsWithCount = TABS.map((t) =>
    t.value === "alertas" && highAlerts.length
      ? { ...t, label: `Alertas (${highAlerts.length})` }
      : t
  );

  return (
    <AppPage>
      <PageHeader
        title="Radar de Oportunidades"
        subtitle="Inteligência Jurídica Agregada — dados públicos"
        icon={Activity}
        actions={
          <>
            <button className="btn btn-secondary" onClick={atualizarDados} disabled={atualizandoDados}>
              <Activity size={14} />
              {atualizandoDados ? "Atualizando..." : "Atualizar"}
            </button>
            <Link to={createPageUrl("AIAssistant") + "?mode=marketing_juridico"} style={{ textDecoration: "none" }}>
              <button className="btn btn-secondary"><MessageSquare size={14} /> Chat IA</button>
            </Link>
            <button className="btn btn-primary" onClick={generateStrategyWithAI} disabled={generatingStrategy}>
              <Sparkles size={14} />
              {generatingStrategy ? "Gerando..." : "Gerar Estratégia"}
            </button>
          </>
        }
      />

      <div style={{ padding: "24px 32px" }}>

        <div style={{ marginBottom: 20 }}>
          <AppAlert variant="warning">
            <strong>Aviso:</strong> As informações têm caráter exclusivamente informativo e estratégico, não configurando captação direta de clientela, em conformidade com o Código de Ética da OAB e LGPD.
          </AppAlert>
        </div>

        <AppTabs tabs={tabsWithCount} defaultValue="dashboard">
          <AppTabPanel value="dashboard">
            <RadarDashboard insights={insights} casosPublicos={casosPublicos} />
          </AppTabPanel>
          <AppTabPanel value="tendencias">
            <TendenciasChart insights={insights} />
          </AppTabPanel>
          <AppTabPanel value="mapa">
            <MapaRegional casosPublicos={casosPublicos} />
          </AppTabPanel>
          <AppTabPanel value="alertas">
            <AppCard noPad>
              {highAlerts.length === 0 ? (
                <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--text-secondary)", fontSize: 13 }}>
                  Nenhum alerta de alta relevância no momento
                </div>
              ) : (
                highAlerts.map((insight, i) => (
                  <div
                    key={insight.id}
                    style={{
                      padding: "16px 20px",
                      borderBottom: i < highAlerts.length - 1 ? "1px solid var(--border)" : "none",
                      transition: "background 0.12s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8, gap: 12 }}>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", margin: "0 0 4px", letterSpacing: "-0.01em" }}>
                          {insight.titulo}
                        </p>
                        <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0 }}>
                          {insight.area_juridica} · {insight.regiao}
                        </p>
                      </div>
                      <AppBadge variant="danger">Alta Relevância</AppBadge>
                    </div>
                    {insight.descricao && (
                      <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 10px", lineHeight: 1.6 }}>
                        {insight.descricao}
                      </p>
                    )}
                    {insight.estrategia_sugerida && (
                      <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 14px" }}>
                        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-secondary)", margin: "0 0 6px" }}>
                          Estratégia Sugerida
                        </p>
                        <p style={{ fontSize: 13, color: "var(--text-primary)", margin: 0, lineHeight: 1.6 }}>
                          {insight.estrategia_sugerida}
                        </p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </AppCard>
          </AppTabPanel>
        </AppTabs>

        {/* Area filter */}
        <AppCard style={{ marginTop: 20 }} noPad>
          <SectionHeader title="Filtrar por Área Jurídica" />
          <div style={{ padding: "12px 20px", display: "flex", flexWrap: "wrap", gap: 6 }}>
            <button
              onClick={() => setSelectedArea("all")}
              style={{
                padding: "6px 14px", borderRadius: 8, border: "1px solid",
                fontSize: 12, fontWeight: 500, cursor: "pointer",
                fontFamily: "var(--font-body)", letterSpacing: "-0.01em",
                background: selectedArea === "all" ? "var(--accent)" : "var(--card)",
                color:      selectedArea === "all" ? "#fff" : "var(--text-2)",
                borderColor: selectedArea === "all" ? "var(--accent)" : "var(--border)",
                transition: "all 0.15s ease",
              }}
            >
              Todas
            </button>
            {AREAS.map((area) => (
              <button
                key={area.id}
                onClick={() => setSelectedArea(area.id)}
                style={{
                  padding: "6px 14px", borderRadius: 8, border: "1px solid",
                  fontSize: 12, fontWeight: 500, cursor: "pointer",
                  fontFamily: "var(--font-body)", letterSpacing: "-0.01em",
                  background: selectedArea === area.id ? "var(--accent)" : "var(--card)",
                  color:      selectedArea === area.id ? "#fff" : "var(--text-2)",
                  borderColor: selectedArea === area.id ? "var(--accent)" : "var(--border)",
                  transition: "all 0.15s ease",
                }}
              >
                {area.label}
              </button>
            ))}
          </div>
        </AppCard>
      </div>
    </AppPage>
  );
}