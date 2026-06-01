import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, TrendingUp, MapPin, Bell, Sparkles, AlertCircle, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import RadarDashboard from '@/components/radar/RadarDashboard';
import TendenciasChart from '@/components/radar/TendenciasChart';
import MapaRegional from '@/components/radar/MapaRegional';
import PageHeader from '@/components/common/PageHeader';
import { toast } from 'sonner';

export default function RadarOportunidades({ theme }) {
  const [user, setUser] = useState(null);
  const [selectedArea, setSelectedArea] = useState('all');
  const [generatingStrategy, setGeneratingStrategy] = useState(false);
  const [atualizandoDados, setAtualizandoDados] = useState(false);
  const queryClient = useQueryClient();

  const isDark = theme === 'dark';

  React.useEffect(() => {
    base44.auth.me()
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  const { data: insights, isLoading } = useQuery({
    queryKey: ['insights-juridicos', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const data = await base44.entities.InsightJuridico.filter({ created_by: user.email }, '-created_date', 50);
      return data;
    },
    enabled: !!user
  });

  const { data: casosPublicos } = useQuery({
    queryKey: ['casos-publicos', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const data = await base44.entities.CasoPublico.filter({ created_by: user.email }, '-data_distribuicao', 100);
      return data;
    },
    enabled: !!user
  });

  const atualizarDados = async () => {
    setAtualizandoDados(true);
    try {
      const response = await base44.functions.invoke('atualizarRadarDados', {});
      
      if (response.data.success) {
        toast.success(`${response.data.casosInseridos} casos e ${response.data.insightsGerados} insights atualizados!`);
        queryClient.invalidateQueries(['insights-juridicos']);
        queryClient.invalidateQueries(['casos-publicos']);
      } else {
        toast.error('Erro ao atualizar dados');
      }
    } catch (error) {
      toast.error('Erro ao atualizar: ' + error.message);
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

Dados:
- Área predominante: Direito do Consumidor
- Volume: 42 novos casos nos últimos 15 dias
- Região: Piauí
- Ticket médio estimado: R$ 18.000

REGRAS OBRIGATÓRIAS:
1. NUNCA sugerir contato direto com partes de processos
2. NUNCA expor dados pessoais
3. Focar em estratégia de posicionamento informativo
4. Sugerir produção de conteúdo educativo
5. Manter conformidade com LGPD e Código de Ética da OAB

Gere uma estratégia técnica e objetiva.`,
        response_json_schema: {
          type: "object",
          properties: {
            estrategia: { type: "string" },
            acoes_sugeridas: {
              type: "array",
              items: { type: "string" }
            },
            observacoes_eticas: { type: "string" }
          }
        }
      });

      toast.success('Estratégia gerada com sucesso!');
      
      await base44.entities.InsightJuridico.create({
        titulo: 'Estratégia Gerada por IA',
        area_juridica: 'consumidor',
        regiao: 'PI',
        volume_casos: 42,
        ticket_medio: 18000,
        tendencia: 'alta',
        periodo_analise_inicio: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        periodo_analise_fim: new Date().toISOString().split('T')[0],
        estrategia_sugerida: response.estrategia,
        relevancia: 'alta',
        descricao: response.acoes_sugeridas?.join('\n')
      });

    } catch (error) {
      toast.error('Erro ao gerar estratégia');
    } finally {
      setGeneratingStrategy(false);
    }
  };

  const areas = [
    { id: 'consumidor', label: 'Consumidor', color: 'bg-blue-500' },
    { id: 'trabalhista', label: 'Trabalhista', color: 'bg-green-500' },
    { id: 'previdenciario', label: 'Previdenciário', color: 'bg-purple-500' },
    { id: 'familia', label: 'Família', color: 'bg-pink-500' },
    { id: 'empresarial', label: 'Empresarial', color: 'bg-indigo-500' },
    { id: 'tributario', label: 'Tributário', color: 'bg-yellow-500' },
    { id: 'saude', label: 'Saúde', color: 'bg-red-500' },
    { id: 'imobiliario', label: 'Imobiliário', color: 'bg-orange-500' }
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--surface)", fontFamily: "var(--font-sans)" }}>
      <PageHeader
        title="Radar de Oportunidades"
        sub="Inteligência Jurídica Agregada"
        actions={
          <>
            <button className="btn-secondary" onClick={atualizarDados} disabled={atualizandoDados}>
              <Activity size={13} />
              {atualizandoDados ? 'Atualizando...' : 'Atualizar'}
            </button>
            <Link to={createPageUrl("AIAssistant") + "?mode=marketing_juridico"} style={{ textDecoration: "none" }}>
              <button className="btn-secondary">
                <MessageSquare size={13} /> Chat IA
              </button>
            </Link>
            <button className="btn-primary" onClick={generateStrategyWithAI} disabled={generatingStrategy}>
              <Sparkles size={13} />
              {generatingStrategy ? 'Gerando...' : 'Gerar Estratégia'}
            </button>
          </>
        }
      />

      <div style={{ padding: "20px 28px" }}>
        {/* Aviso LGPD/OAB */}
        <div style={{ background: "var(--warn-bg)", border: "1px solid var(--warn-border)", borderLeft: "3px solid var(--warn)", padding: "10px 14px", marginBottom: 20, display: "flex", alignItems: "flex-start", gap: 10 }}>
          <AlertCircle style={{ width: 14, height: 14, color: "var(--warn)", flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 11, color: "var(--ink-2)", margin: 0, lineHeight: 1.6 }}>
            <strong>Aviso:</strong> As informações têm caráter exclusivamente informativo e estratégico, não configurando captação direta de clientela, em conformidade com o Código de Ética da OAB e LGPD.
          </p>
        </div>

        <Tabs defaultValue="dashboard">
          <TabsList style={{ background: "var(--white)", border: "1px solid var(--ink-6)", borderRadius: 0, padding: 0, marginBottom: 20, display: "flex" }}>
            {[
              { value: "dashboard", icon: Activity, label: "Dashboard" },
              { value: "tendencias", icon: TrendingUp, label: "Tendências" },
              { value: "mapa", icon: MapPin, label: "Mapa Regional" },
              { value: "alertas", icon: Bell, label: `Alertas${insights?.filter(i => i.relevancia === 'alta').length ? ` (${insights.filter(i => i.relevancia === 'alta').length})` : ''}` },
            ].map(t => (
              <TabsTrigger key={t.value} value={t.value} style={{ flex: 1, borderRadius: 0, fontSize: 11, fontWeight: 500, display: "flex", alignItems: "center", gap: 6, fontFamily: "var(--font-sans)" }}>
                <t.icon style={{ width: 13, height: 13 }} />
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="dashboard">
            <RadarDashboard insights={insights} casosPublicos={casosPublicos} />
          </TabsContent>
          <TabsContent value="tendencias">
            <TendenciasChart insights={insights} />
          </TabsContent>
          <TabsContent value="mapa">
            <MapaRegional casosPublicos={casosPublicos} />
          </TabsContent>
          <TabsContent value="alertas">
            <div style={{ display: "flex", flexDirection: "column", gap: 1, background: "var(--ink-6)" }}>
              {insights?.filter(i => i.relevancia === 'alta').map((insight) => (
                <div key={insight.id} style={{ background: "var(--white)", padding: "16px 20px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", margin: "0 0 4px" }}>{insight.titulo}</p>
                      <p style={{ fontSize: 11, color: "var(--ink-4)", margin: 0 }}>{insight.area_juridica} · {insight.regiao}</p>
                    </div>
                    <span className="badge badge-danger">Alta Relevância</span>
                  </div>
                  <p style={{ fontSize: 12, color: "var(--ink-3)", margin: "0 0 8px" }}>{insight.descricao}</p>
                  {insight.estrategia_sugerida && (
                    <div style={{ background: "var(--ink-7)", border: "1px solid var(--ink-6)", padding: "10px 12px" }}>
                      <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-4)", margin: "0 0 4px" }}>Estratégia Sugerida</p>
                      <p style={{ fontSize: 12, color: "var(--ink-2)", margin: 0 }}>{insight.estrategia_sugerida}</p>
                    </div>
                  )}
                </div>
              ))}
              {!insights?.filter(i => i.relevancia === 'alta').length && (
                <div style={{ background: "var(--white)", padding: "40px 20px", textAlign: "center", fontSize: 12, color: "var(--ink-4)" }}>
                  Nenhum alerta de alta relevância no momento
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Filtros por Área */}
        <div style={{ background: "var(--white)", border: "1px solid var(--ink-6)", marginTop: 20 }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--ink-6)" }}>
            <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-4)", margin: 0 }}>Filtrar por Área Jurídica</p>
          </div>
          <div style={{ padding: "12px 16px", display: "flex", flexWrap: "wrap", gap: 6 }}>
            <button onClick={() => setSelectedArea('all')} style={{ padding: "5px 12px", border: "1px solid", fontSize: 11, cursor: "pointer", fontFamily: "var(--font-sans)", background: selectedArea === 'all' ? "var(--ink)" : "transparent", color: selectedArea === 'all' ? "var(--white)" : "var(--ink-3)", borderColor: selectedArea === 'all' ? "var(--ink)" : "var(--ink-5)", transition: "all var(--duration)", fontWeight: selectedArea === 'all' ? 500 : 400 }}>
              Todas
            </button>
            {areas.map((area) => (
              <button key={area.id} onClick={() => setSelectedArea(area.id)} style={{ padding: "5px 12px", border: "1px solid", fontSize: 11, cursor: "pointer", fontFamily: "var(--font-sans)", background: selectedArea === area.id ? "var(--ink)" : "transparent", color: selectedArea === area.id ? "var(--white)" : "var(--ink-3)", borderColor: selectedArea === area.id ? "var(--ink)" : "var(--ink-5)", transition: "all var(--duration)", fontWeight: selectedArea === area.id ? 500 : 400 }}>
                {area.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}