import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  FileText, Download, Filter, Calendar, User, Briefcase,
  TrendingUp, DollarSign, BarChart3, PieChart as PieChartIcon
} from "lucide-react";
import { 
  BarChart, Bar, LineChart, Line, PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";
import { motion } from "framer-motion";
import { jsPDF } from "jspdf";
import { toast } from "sonner";
import moment from "moment";

export default function Reports({ theme = 'light' }) {
  const isDark = theme === 'dark';
  const [user, setUser] = useState(null);
  const [dateStart, setDateStart] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 6);
    return date.toISOString().split('T')[0];
  });
  const [dateEnd, setDateEnd] = useState(new Date().toISOString().split('T')[0]);
  const [caseArea, setCaseArea] = useState("all");
  const [caseStatus, setCaseStatus] = useState("all");
  const [assignedTo, setAssignedTo] = useState("all");
  const [reportType, setReportType] = useState("overview");

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: cases = [] } = useQuery({
    queryKey: ['reports-cases'],
    queryFn: () => base44.entities.Case.list('-created_date')
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['reports-clients'],
    queryFn: () => base44.entities.Client.list('-created_date')
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['reports-tasks'],
    queryFn: () => base44.entities.Task.list('-created_date')
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['reports-documents'],
    queryFn: () => base44.entities.LegalDocument.list('-created_date')
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['reports-payments'],
    queryFn: () => base44.entities.ClientPayment.list('-created_date'),
    initialData: []
  });

  // Filtrar dados por período
  const filterByDate = (items, dateField = 'created_date') => {
    return items.filter(item => {
      if (!item[dateField]) return false;
      const itemDate = new Date(item[dateField]);
      const start = new Date(dateStart);
      const end = new Date(dateEnd);
      end.setHours(23, 59, 59);
      return itemDate >= start && itemDate <= end;
    });
  };

  const filteredCases = filterByDate(cases).filter(c => {
    if (caseArea !== 'all' && c.area !== caseArea) return false;
    if (caseStatus !== 'all' && c.status !== caseStatus) return false;
    if (assignedTo !== 'all' && c.assigned_to !== assignedTo) return false;
    return true;
  });

  const filteredClients = filterByDate(clients);
  const filteredTasks = filterByDate(tasks);
  const filteredDocuments = filterByDate(documents);
  const filteredPayments = filterByDate(payments, 'payment_date');

  // Métricas calculadas
  const totalCases = filteredCases.length;
  const activeCases = filteredCases.filter(c => c.status === 'in_progress').length;
  const closedCases = filteredCases.filter(c => c.status === 'closed').length;
  const totalClients = filteredClients.length;
  const totalTasks = filteredTasks.length;
  const completedTasks = filteredTasks.filter(t => t.status === 'completed').length;
  const totalRevenue = filteredPayments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const pendingRevenue = filteredPayments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  // Dados para gráficos
  const casesByArea = filteredCases.reduce((acc, c) => {
    const area = c.area || 'outros';
    acc[area] = (acc[area] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(casesByArea).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  }));

  const casesByMonth = {};
  filteredCases.forEach(c => {
    const month = moment(c.created_date).format('MMM/YY');
    casesByMonth[month] = (casesByMonth[month] || 0) + 1;
  });

  const lineData = Object.entries(casesByMonth).map(([month, count]) => ({
    month,
    casos: count
  }));

  const statusData = [
    { name: 'Novos', value: filteredCases.filter(c => c.status === 'new').length },
    { name: 'Em Andamento', value: activeCases },
    { name: 'Aguardando', value: filteredCases.filter(c => c.status === 'waiting').length },
    { name: 'Encerrados', value: closedCases },
  ].filter(d => d.value > 0);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  // Advogados únicos
  const lawyers = [...new Set(cases.map(c => c.assigned_to).filter(Boolean))];

  const exportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('RELATÓRIO DE GESTÃO', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Período: ${moment(dateStart).format('DD/MM/YYYY')} a ${moment(dateEnd).format('DD/MM/YYYY')}`, pageWidth / 2, 28, { align: 'center' });
    doc.text(`Gerado em: ${moment().format('DD/MM/YYYY HH:mm')}`, pageWidth / 2, 34, { align: 'center' });
    
    doc.line(15, 38, pageWidth - 15, 38);
    
    // Métricas principais
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('RESUMO EXECUTIVO', 15, 48);
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    let y = 58;
    
    const metrics = [
      ['Total de Casos:', totalCases],
      ['Casos Ativos:', activeCases],
      ['Casos Encerrados:', closedCases],
      ['Total de Clientes:', totalClients],
      ['Tarefas Concluídas:', `${completedTasks}/${totalTasks}`],
      ['Receita Recebida:', `R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
      ['Receita Pendente:', `R$ ${pendingRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
    ];
    
    metrics.forEach(([label, value]) => {
      doc.setFont(undefined, 'bold');
      doc.text(label, 15, y);
      doc.setFont(undefined, 'normal');
      doc.text(String(value), 80, y);
      y += 7;
    });
    
    // Casos por área
    y += 10;
    doc.setFont(undefined, 'bold');
    doc.text('CASOS POR ÁREA', 15, y);
    y += 8;
    
    doc.setFont(undefined, 'normal');
    Object.entries(casesByArea).forEach(([area, count]) => {
      doc.text(`${area.charAt(0).toUpperCase() + area.slice(1)}:`, 15, y);
      doc.text(String(count), pageWidth - 15, y, { align: 'right' });
      y += 6;
    });
    
    doc.save('relatorio_gestao.pdf');
    toast.success("Relatório exportado com sucesso!");
  };

  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-neutral-950' : 'bg-slate-50'}`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              📊 Relatórios e Análises
            </h1>
            <p className={`mt-1 ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
              Insights profundos sobre gestão de casos e clientes
            </p>
          </div>
          <Button onClick={exportPDF} className="bg-blue-600 hover:bg-blue-700">
            <Download className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
        </div>

        {/* Filtros */}
        <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : ''}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <Filter className="w-5 h-5" />
              Filtros do Relatório
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className={isDark ? 'text-neutral-300' : ''}>
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Data Início
                </Label>
                <Input
                  type="date"
                  value={dateStart}
                  onChange={(e) => setDateStart(e.target.value)}
                  className={isDark ? 'bg-neutral-800 border-neutral-700' : ''}
                />
              </div>

              <div className="space-y-2">
                <Label className={isDark ? 'text-neutral-300' : ''}>
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Data Fim
                </Label>
                <Input
                  type="date"
                  value={dateEnd}
                  onChange={(e) => setDateEnd(e.target.value)}
                  className={isDark ? 'bg-neutral-800 border-neutral-700' : ''}
                />
              </div>

              <div className="space-y-2">
                <Label className={isDark ? 'text-neutral-300' : ''}>
                  <Briefcase className="w-4 h-4 inline mr-2" />
                  Área
                </Label>
                <Select value={caseArea} onValueChange={setCaseArea}>
                  <SelectTrigger className={isDark ? 'bg-neutral-800 border-neutral-700' : ''}>
                    <SelectValue />
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
              </div>

              <div className="space-y-2">
                <Label className={isDark ? 'text-neutral-300' : ''}>
                  <FileText className="w-4 h-4 inline mr-2" />
                  Status
                </Label>
                <Select value={caseStatus} onValueChange={setCaseStatus}>
                  <SelectTrigger className={isDark ? 'bg-neutral-800 border-neutral-700' : ''}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="new">Novo</SelectItem>
                    <SelectItem value="in_progress">Em Andamento</SelectItem>
                    <SelectItem value="waiting">Aguardando</SelectItem>
                    <SelectItem value="closed">Encerrado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className={isDark ? 'text-neutral-300' : ''}>
                  <User className="w-4 h-4 inline mr-2" />
                  Responsável
                </Label>
                <Select value={assignedTo} onValueChange={setAssignedTo}>
                  <SelectTrigger className={isDark ? 'bg-neutral-800 border-neutral-700' : ''}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {lawyers.map(lawyer => (
                      <SelectItem key={lawyer} value={lawyer}>{lawyer}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPIs */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div whileHover={{ y: -4 }}>
            <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : ''}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-blue-500/20' : 'bg-blue-50'}`}>
                    <Briefcase className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  </div>
                  <div>
                    <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {totalCases}
                    </p>
                    <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
                      Total de Casos
                    </p>
                    <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-slate-500'}`}>
                      {activeCases} ativos
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ y: -4 }}>
            <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : ''}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-green-500/20' : 'bg-green-50'}`}>
                    <User className={`w-6 h-6 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                  </div>
                  <div>
                    <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {totalClients}
                    </p>
                    <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
                      Novos Clientes
                    </p>
                    <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-slate-500'}`}>
                      No período
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ y: -4 }}>
            <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : ''}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-purple-500/20' : 'bg-purple-50'}`}>
                    <FileText className={`w-6 h-6 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                  </div>
                  <div>
                    <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {completedTasks}/{totalTasks}
                    </p>
                    <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
                      Tarefas Concluídas
                    </p>
                    <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-slate-500'}`}>
                      {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}% de conclusão
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ y: -4 }}>
            <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : ''}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-50'}`}>
                    <DollarSign className={`w-6 h-6 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  </div>
                  <div>
                    <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      R$ {(totalRevenue / 1000).toFixed(1)}k
                    </p>
                    <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
                      Receita Recebida
                    </p>
                    <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-slate-500'}`}>
                      R$ {(pendingRevenue / 1000).toFixed(1)}k pendente
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Gráficos */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : ''}>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <BarChart3 className="w-5 h-5" />
                Casos por Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statusData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                  <XAxis dataKey="name" stroke={isDark ? '#9ca3af' : '#6b7280'} />
                  <YAxis stroke={isDark ? '#9ca3af' : '#6b7280'} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: isDark ? '#1f2937' : '#fff',
                      border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : ''}>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <PieChartIcon className="w-5 h-5" />
                Distribuição por Área
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPie>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: isDark ? '#1f2937' : '#fff',
                      border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                      borderRadius: '8px'
                    }}
                  />
                </RechartsPie>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className={`lg:col-span-2 ${isDark ? 'bg-neutral-900 border-neutral-800' : ''}`}>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <TrendingUp className="w-5 h-5" />
                Evolução de Casos ao Longo do Tempo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                  <XAxis dataKey="month" stroke={isDark ? '#9ca3af' : '#6b7280'} />
                  <YAxis stroke={isDark ? '#9ca3af' : '#6b7280'} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: isDark ? '#1f2937' : '#fff',
                      border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="casos" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6' }}
                    name="Número de Casos"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}