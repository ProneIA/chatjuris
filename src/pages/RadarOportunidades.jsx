import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, TrendingUp, MapPin, Bell, Sparkles, AlertCircle, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import RadarDashboard from '@/components/radar/RadarDashboard';
import TendenciasChart from '@/components/radar/TendenciasChart';
import MapaRegional from '@/components/radar/MapaRegional';
import { toast } from 'sonner';

export default function RadarOportunidades({ theme }) {
  const [user, setUser] = useState(null);
  const [selectedArea, setSelectedArea] = useState('all');
  const [generatingStrategy, setGeneratingStrategy] = useState(false);
  const [atualizandoDados, setAtualizandoDados] = useState(false);

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

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Radar de Oportunidades
                </h1>
                <p className={`${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                  Inteligência Jurídica Agregada
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={atualizarDados} disabled={atualizandoDados} variant="outline">
                <Activity className="w-4 h-4 mr-2" />
                {atualizandoDados ? 'Atualizando...' : 'Atualizar Dados'}
              </Button>
              <Link to={createPageUrl("AIAssistant") + "?mode=marketing_juridico"}>
                <Button variant="outline">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Chat com IA
                </Button>
              </Link>
              <Button onClick={generateStrategyWithAI} disabled={generatingStrategy} className="bg-blue-600 hover:bg-blue-700">
                <Sparkles className="w-4 h-4 mr-2" />
                {generatingStrategy ? 'Gerando...' : 'Gerar Estratégia com IA'}
              </Button>
            </div>
          </div>

          {/* Aviso LGPD/OAB */}
          <div className={`p-4 rounded-lg border ${isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200'}`}>
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p className={`text-sm ${isDark ? 'text-amber-200' : 'text-amber-900'}`}>
                <strong>Aviso Importante:</strong> As informações disponibilizadas têm caráter exclusivamente informativo e estratégico, 
                não configurando captação direta de clientela, em conformidade com o Código de Ética da OAB e LGPD (Lei 13.709/2018).
              </p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className={isDark ? 'bg-neutral-900' : 'bg-white'}>
            <TabsTrigger value="dashboard">
              <Activity className="w-4 h-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="tendencias">
              <TrendingUp className="w-4 h-4 mr-2" />
              Tendências
            </TabsTrigger>
            <TabsTrigger value="mapa">
              <MapPin className="w-4 h-4 mr-2" />
              Mapa Regional
            </TabsTrigger>
            <TabsTrigger value="alertas">
              <Bell className="w-4 h-4 mr-2" />
              Alertas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <RadarDashboard insights={insights} casosPublicos={casosPublicos} theme={theme} />
          </TabsContent>

          <TabsContent value="tendencias">
            <TendenciasChart insights={insights} theme={theme} />
          </TabsContent>

          <TabsContent value="mapa">
            <MapaRegional casosPublicos={casosPublicos} theme={theme} />
          </TabsContent>

          <TabsContent value="alertas">
            <div className="grid gap-4">
              {insights?.filter(i => i.relevancia === 'alta').map((insight) => (
                <Card key={insight.id} className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className={isDark ? 'text-white' : 'text-gray-900'}>
                          {insight.titulo}
                        </CardTitle>
                        <CardDescription className={isDark ? 'text-neutral-400' : 'text-gray-600'}>
                          {insight.area_juridica} • {insight.regiao}
                        </CardDescription>
                      </div>
                      <Badge className="bg-red-100 text-red-700">Alta Relevância</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className={`text-sm ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                        {insight.descricao}
                      </p>
                      {insight.estrategia_sugerida && (
                        <div className={`p-3 rounded-lg ${isDark ? 'bg-neutral-800' : 'bg-gray-50'}`}>
                          <p className={`text-sm font-medium mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            Estratégia Sugerida:
                          </p>
                          <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                            {insight.estrategia_sugerida}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Filtros por Área */}
        <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}>
          <CardHeader>
            <CardTitle className={isDark ? 'text-white' : 'text-gray-900'}>
              Filtrar por Área Jurídica
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedArea === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedArea('all')}
              >
                Todas
              </Button>
              {areas.map((area) => (
                <Button
                  key={area.id}
                  variant={selectedArea === area.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedArea(area.id)}
                >
                  <div className={`w-2 h-2 rounded-full ${area.color} mr-2`}></div>
                  {area.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}