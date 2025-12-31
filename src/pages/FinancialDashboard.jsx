import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  DollarSign, TrendingUp, TrendingDown, AlertCircle, 
  Calendar, PieChart, BarChart3, FileText 
} from "lucide-react";
import HonorariosManager from "@/components/financial/HonorariosManager";
import DespesasManager from "@/components/financial/DespesasManager";
import DREReport from "@/components/financial/DREReport";
import FluxoCaixaReport from "@/components/financial/FluxoCaixaReport";

export default function FinancialDashboard({ theme = 'light' }) {
  const isDark = theme === 'dark';
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: contratos = [] } = useQuery({
    queryKey: ['honorarios', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.HonorarioContrato.filter({ created_by: user.email });
    },
    enabled: !!user?.email
  });

  const { data: parcelas = [] } = useQuery({
    queryKey: ['parcelas', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.ParcelaHonorario.filter({ created_by: user.email });
    },
    enabled: !!user?.email
  });

  const { data: despesas = [] } = useQuery({
    queryKey: ['despesas', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.Despesa.filter({ created_by: user.email });
    },
    enabled: !!user?.email
  });

  // Cálculos financeiros
  const totalHonorariosContratados = contratos
    .filter(c => c.status === 'ativo' || c.status === 'concluido')
    .reduce((sum, c) => sum + (c.valor_total || 0), 0);

  const totalRecebido = parcelas
    .filter(p => p.status === 'pago')
    .reduce((sum, p) => sum + (p.valor || 0), 0);

  const totalPendente = parcelas
    .filter(p => p.status === 'pendente' || p.status === 'atrasado')
    .reduce((sum, p) => sum + (p.valor || 0), 0);

  const parcelasAtrasadas = parcelas.filter(p => {
    if (p.status !== 'pendente') return false;
    const hoje = new Date();
    const vencimento = new Date(p.data_vencimento);
    return vencimento < hoje;
  }).length;

  const totalDespesasPagas = despesas
    .filter(d => d.status === 'pago')
    .reduce((sum, d) => sum + (d.valor || 0), 0);

  const totalDespesasPendentes = despesas
    .filter(d => d.status === 'pendente' || d.status === 'atrasado')
    .reduce((sum, d) => sum + (d.valor || 0), 0);

  const saldoAtual = totalRecebido - totalDespesasPagas;
  const taxaRecebimento = totalHonorariosContratados > 0 
    ? ((totalRecebido / totalHonorariosContratados) * 100).toFixed(1) 
    : 0;

  const StatCard = ({ title, value, icon: Icon, trend, trendValue, color = "blue" }) => (
    <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className={`text-sm font-medium ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
            {title}
          </CardTitle>
          <Icon className={`w-4 h-4 text-${color}-600`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {typeof value === 'number' ? `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : value}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 mt-2 text-xs ${
            trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-500'
          }`}>
            {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : trend === 'down' ? <TrendingDown className="w-3 h-3" /> : null}
            <span>{trendValue}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className={`h-full ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`}>
      <div className={`border-b px-6 py-6 ${isDark ? 'bg-black border-neutral-800' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-2xl font-light ${isDark ? 'text-white' : 'text-gray-900'}`}>Financeiro</h1>
            <p className={`mt-1 ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
              Gestão completa de honorários e despesas
            </p>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            isDark ? 'bg-neutral-900 border border-neutral-800' : 'bg-gray-50 border border-gray-200'
          }`}>
            <Calendar className="w-4 h-4" />
            <span className="text-sm font-medium">
              {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className={`mb-6 ${isDark ? 'bg-neutral-900' : 'bg-gray-100'}`}>
            <TabsTrigger value="overview">
              <BarChart3 className="w-4 h-4 mr-2" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="honorarios">
              <DollarSign className="w-4 h-4 mr-2" />
              Honorários
            </TabsTrigger>
            <TabsTrigger value="despesas">
              <TrendingDown className="w-4 h-4 mr-2" />
              Despesas
            </TabsTrigger>
            <TabsTrigger value="dre">
              <PieChart className="w-4 h-4 mr-2" />
              DRE
            </TabsTrigger>
            <TabsTrigger value="fluxo">
              <FileText className="w-4 h-4 mr-2" />
              Fluxo de Caixa
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Saldo Atual"
                value={saldoAtual}
                icon={DollarSign}
                color={saldoAtual >= 0 ? "green" : "red"}
              />
              <StatCard
                title="Total Recebido"
                value={totalRecebido}
                icon={TrendingUp}
                trend="up"
                trendValue={`${taxaRecebimento}% dos contratos`}
                color="green"
              />
              <StatCard
                title="A Receber"
                value={totalPendente}
                icon={AlertCircle}
                color="orange"
              />
              <StatCard
                title="Despesas do Mês"
                value={totalDespesasPagas + totalDespesasPendentes}
                icon={TrendingDown}
                color="red"
              />
            </div>

            {/* Alertas */}
            {parcelasAtrasadas > 0 && (
              <Card className={`border-l-4 border-orange-500 ${isDark ? 'bg-orange-900/20 border-orange-800' : 'bg-orange-50 border-orange-200'}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                    <div>
                      <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Atenção: {parcelasAtrasadas} parcela(s) atrasada(s)
                      </p>
                      <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                        Verifique os recebimentos pendentes na aba Honorários
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Resumo visual */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}>
                <CardHeader>
                  <CardTitle className="text-base">Contratos Ativos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {contratos.filter(c => c.status === 'ativo').length}
                  </div>
                  <p className={`text-sm mt-2 ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                    Total contratado: R$ {totalHonorariosContratados.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </CardContent>
              </Card>

              <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}>
                <CardHeader>
                  <CardTitle className="text-base">Taxa de Recebimento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {taxaRecebimento}%
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all" 
                      style={{ width: `${taxaRecebimento}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="honorarios">
            <HonorariosManager theme={theme} />
          </TabsContent>

          <TabsContent value="despesas">
            <DespesasManager theme={theme} />
          </TabsContent>

          <TabsContent value="dre">
            <DREReport 
              receitas={totalRecebido}
              despesas={totalDespesasPagas}
              despesasDetalhadas={despesas.filter(d => d.status === 'pago')}
              theme={theme}
            />
          </TabsContent>

          <TabsContent value="fluxo">
            <FluxoCaixaReport 
              parcelas={parcelas}
              despesas={despesas}
              theme={theme}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}