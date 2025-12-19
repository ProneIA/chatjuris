import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";
import { 
  TrendingUp, Users, Briefcase, DollarSign, FileText, 
  Clock, Download, Filter, Calendar 
} from "lucide-react";
import { motion } from "framer-motion";
import moment from "moment";
import { jsPDF } from "jspdf";
import { toast } from "sonner";

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];

export default function Analytics({ theme = 'light' }) {
  const isDark = theme === 'dark';
  const [user, setUser] = useState(null);
  const [periodo, setPeriodo] = useState("30");
  const [areaFiltro, setAreaFiltro] = useState("all");
  const [statusFiltro, setStatusFiltro] = useState("all");

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: cases = [] } = useQuery({
    queryKey: ['analytics-cases', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.Case.filter({ created_by: user.email }, '-created_date');
    },
    enabled: !!user?.email
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['analytics-clients', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.Client.filter({ created_by: user.email }, '-created_date');
    },
    enabled: !!user?.email
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['analytics-documents', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.LegalDocument.filter({ created_by: user.email }, '-created_date');
    },
    enabled: !!user?.email
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['analytics-tasks', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.Task.filter({ created_by: user.email }, '-due_date');
    },
    enabled: !!user?.email
  });

  // Filtrar dados por período
  const dataInicio = moment().subtract(parseInt(periodo), 'days');
  const casesFiltrados = cases.filter(c => {
    const dentroPerido = moment(c.created_date).isAfter(dataInicio);
    const matchArea = areaFiltro === 'all' || c.area === areaFiltro;
    const matchStatus = statusFiltro === 'all' || c.status === statusFiltro;
    return dentroPerido && matchArea && matchStatus;
  });

  // KPIs
  const kpis = {
    casosAtivos: cases.filter(c => c.status === 'in_progress').length,
    casosTotais: cases.length,
    clientesAtivos: clients.filter(c => c.status === 'active').length,
    clientesTotais: clients.length,
    tarefasPendentes: tasks.filter(t => t.status === 'pending').length,
    tarefasTotais: tasks.length,
    documentosTotais: documents.length,
    valorTotal: cases.reduce((sum, c) => sum + (c.value || 0), 0)
  };

  // Dados por área
  const casosPorArea = Object.entries(
    cases.reduce((acc, c) => {
      acc[c.area] = (acc[c.area] || 0) + 1;
      return acc;
    }, {})
  ).map(([area, count]) => ({
    name: area === 'civil' ? 'Cível' :
          area === 'criminal' ? 'Criminal' :
          area === 'trabalhista' ? 'Trabalhista' :
          area === 'tributario' ? 'Tributário' :
          area === 'familia' ? 'Família' :
          area === 'empresarial' ? 'Empresarial' :
          area === 'consumidor' ? 'Consumidor' :
          area === 'previdenciario' ? 'Previdenciário' : 'Outros',
    value: count
  }));

  // Dados por status
  const casosPorStatus = [
    { name: 'Novos', value: cases.filter(c => c.status === 'new').length, fill: '#3b82f6' },
    { name: 'Em Andamento', value: cases.filter(c => c.status === 'in_progress').length, fill: '#f59e0b' },
    { name: 'Aguardando', value: cases.filter(c => c.status === 'waiting').length, fill: '#8b5cf6' },
    { name: 'Encerrados', value: cases.filter(c => c.status === 'closed').length, fill: '#10b981' },
    { name: 'Arquivados', value: cases.filter(c => c.status === 'archived').length, fill: '#6b7280' }
  ].filter(item => item.value > 0);

  // Timeline de casos (últimos 6 meses)
  const timelineCasos = [];
  for (let i = 5; i >= 0; i--) {
    const mes = moment().subtract(i, 'months');
    const count = cases.filter(c => 
      moment(c.created_date).format('YYYY-MM') === mes.format('YYYY-MM')
    ).length;
    timelineCasos.push({
      mes: mes.format('MMM/YY'),
      casos: count
    });
  }

  // Performance por advogado (se houver assigned_to)
  const casosResponsavel = Object.entries(
    cases.filter(c => c.assigned_to).reduce((acc, c) => {
      acc[c.assigned_to] = (acc[c.assigned_to] || 0) + 1;
      return acc;
    }, {})
  ).map(([email, count]) => ({
    name: email.split('@')[0],
    casos: count
  })).slice(0, 5);

  // Exportar relatório
  const exportarRelatorio = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('RELATÓRIO DE GESTÃO', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Período: ${periodo} dias | Data: ${moment().format('DD/MM/YYYY')}`, pageWidth / 2, 28, { align: 'center' });
    
    doc.line(15, 32, pageWidth - 15, 32);
    
    // KPIs
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('INDICADORES PRINCIPAIS', 15, 42);
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    let y = 52;
    
    const kpiData = [
      ['Casos Ativos', `${kpis.casosAtivos} de ${kpis.casosTotais}`],
      ['Clientes Ativos', `${kpis.clientesAtivos} de ${kpis.clientesTotais}`],
      ['Tarefas Pendentes', `${kpis.tarefasPendentes} de ${kpis.tarefasTotais}`],
      ['Documentos', kpis.documentosTotais],
      ['Valor Total', `R$ ${kpis.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`]
    ];
    
    kpiData.forEach(([label, value]) => {
      doc.text(label + ':', 15, y);
      doc.text(String(value), pageWidth - 15, y, { align: 'right' });
      y += 7;
    });
    
    // Casos por área
    y += 10;
    doc.setFont(undefined, 'bold');
    doc.text('CASOS POR ÁREA', 15, y);
    y += 7;
    
    doc.setFont(undefined, 'normal');
    casosPorArea.forEach(item => {
      doc.text(item.name + ':', 15, y);
      doc.text(String(item.value), pageWidth - 15, y, { align: 'right' });
      y += 6;
    });
    
    doc.save('relatorio_gestao.pdf');
    toast.success("Relatório exportado com sucesso!");
  };

  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-neutral-950' : 'bg-slate-50'}`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              📊 Analytics & Relatórios
            </h1>
            <p className={`${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
              Insights profundos sobre gestão de casos e clientes
            </p>
          </div>
          <Button onClick={exportarRelatorio} className="bg-blue-600 hover:bg-blue-700">
            <Download className="w-4 h-4 mr-2" />
            Exportar Relatório
          </Button>
        </div>

        {/* Filtros */}
        <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : ''}>
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-500" />
                <Select value={periodo} onValueChange={setPeriodo}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Últimos 7 dias</SelectItem>
                    <SelectItem value="30">Últimos 30 dias</SelectItem>
                    <SelectItem value="90">Últimos 90 dias</SelectItem>
                    <SelectItem value="180">Últimos 6 meses</SelectItem>
                    <SelectItem value="365">Último ano</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Select value={areaFiltro} onValueChange={setAreaFiltro}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Área" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as áreas</SelectItem>
                  <SelectItem value="civil">Cível</SelectItem>
                  <SelectItem value="criminal">Criminal</SelectItem>
                  <SelectItem value="trabalhista">Trabalhista</SelectItem>
                  <SelectItem value="tributario">Tributário</SelectItem>
                  <SelectItem value="familia">Família</SelectItem>
                  <SelectItem value="empresarial">Empresarial</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFiltro} onValueChange={setStatusFiltro}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="new">Novos</SelectItem>
                  <SelectItem value="in_progress">Em Andamento</SelectItem>
                  <SelectItem value="waiting">Aguardando</SelectItem>
                  <SelectItem value="closed">Encerrados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : ''}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-blue-500/20' : 'bg-blue-50'}`}>
                    <Briefcase className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  </div>
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {kpis.casosAtivos}
                </p>
                <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
                  Casos Ativos
                </p>
                <p className={`text-xs mt-1 ${isDark ? 'text-neutral-500' : 'text-slate-500'}`}>
                  de {kpis.casosTotais} totais
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : ''}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-purple-500/20' : 'bg-purple-50'}`}>
                    <Users className={`w-6 h-6 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                  </div>
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {kpis.clientesAtivos}
                </p>
                <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
                  Clientes Ativos
                </p>
                <p className={`text-xs mt-1 ${isDark ? 'text-neutral-500' : 'text-slate-500'}`}>
                  de {kpis.clientesTotais} totais
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : ''}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-amber-500/20' : 'bg-amber-50'}`}>
                    <Clock className={`w-6 h-6 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                  </div>
                  <Calendar className="w-5 h-5 text-amber-500" />
                </div>
                <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {kpis.tarefasPendentes}
                </p>
                <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
                  Tarefas Pendentes
                </p>
                <p className={`text-xs mt-1 ${isDark ? 'text-neutral-500' : 'text-slate-500'}`}>
                  de {kpis.tarefasTotais} totais
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : ''}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-green-500/20' : 'bg-green-50'}`}>
                    <DollarSign className={`w-6 h-6 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                  </div>
                </div>
                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  R$ {(kpis.valorTotal / 1000).toFixed(0)}k
                </p>
                <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
                  Valor Total em Causa
                </p>
                <p className={`text-xs mt-1 ${isDark ? 'text-neutral-500' : 'text-slate-500'}`}>
                  {kpis.documentosTotais} documentos
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Gráficos */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className={isDark ? 'bg-neutral-900' : ''}>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="areas">Por Área</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : ''}>
                <CardHeader>
                  <CardTitle className={isDark ? 'text-white' : ''}>Distribuição por Status</CardTitle>
                  <CardDescription className={isDark ? 'text-neutral-400' : ''}>
                    Status atual de todos os casos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={casosPorStatus}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        dataKey="value"
                      >
                        {casosPorStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : ''}>
                <CardHeader>
                  <CardTitle className={isDark ? 'text-white' : ''}>Casos por Área</CardTitle>
                  <CardDescription className={isDark ? 'text-neutral-400' : ''}>
                    Distribuição por área do direito
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={casosPorArea}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#333' : '#e5e7eb'} />
                      <XAxis dataKey="name" stroke={isDark ? '#999' : '#666'} />
                      <YAxis stroke={isDark ? '#999' : '#666'} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: isDark ? '#1c1c1c' : '#fff',
                          border: `1px solid ${isDark ? '#333' : '#e5e7eb'}`
                        }}
                      />
                      <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="areas">
            <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : ''}>
              <CardHeader>
                <CardTitle className={isDark ? 'text-white' : ''}>Análise Detalhada por Área</CardTitle>
                <CardDescription className={isDark ? 'text-neutral-400' : ''}>
                  Comparativo de casos entre áreas do direito
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={casosPorArea} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#333' : '#e5e7eb'} />
                    <XAxis type="number" stroke={isDark ? '#999' : '#666'} />
                    <YAxis dataKey="name" type="category" stroke={isDark ? '#999' : '#666'} width={100} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: isDark ? '#1c1c1c' : '#fff',
                        border: `1px solid ${isDark ? '#333' : '#e5e7eb'}`
                      }}
                    />
                    <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                      {casosPorArea.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeline">
            <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : ''}>
              <CardHeader>
                <CardTitle className={isDark ? 'text-white' : ''}>Timeline de Casos</CardTitle>
                <CardDescription className={isDark ? 'text-neutral-400' : ''}>
                  Evolução mensal de novos casos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={timelineCasos}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#333' : '#e5e7eb'} />
                    <XAxis dataKey="mes" stroke={isDark ? '#999' : '#666'} />
                    <YAxis stroke={isDark ? '#999' : '#666'} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: isDark ? '#1c1c1c' : '#fff',
                        border: `1px solid ${isDark ? '#333' : '#e5e7eb'}`
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="casos" 
                      stroke="#8b5cf6" 
                      strokeWidth={3}
                      dot={{ fill: '#8b5cf6', r: 5 }}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance">
            <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : ''}>
              <CardHeader>
                <CardTitle className={isDark ? 'text-white' : ''}>Performance por Advogado</CardTitle>
                <CardDescription className={isDark ? 'text-neutral-400' : ''}>
                  Top 5 advogados com mais casos atribuídos
                </CardDescription>
              </CardHeader>
              <CardContent>
                {casosResponsavel.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={casosResponsavel}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#333' : '#e5e7eb'} />
                      <XAxis dataKey="name" stroke={isDark ? '#999' : '#666'} />
                      <YAxis stroke={isDark ? '#999' : '#666'} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: isDark ? '#1c1c1c' : '#fff',
                          border: `1px solid ${isDark ? '#333' : '#e5e7eb'}`
                        }}
                      />
                      <Bar dataKey="casos" fill="#10b981" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12">
                    <p className={isDark ? 'text-neutral-400' : 'text-slate-500'}>
                      Nenhum caso com advogado atribuído
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}