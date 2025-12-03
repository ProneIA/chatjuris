import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Users, 
  FolderOpen, 
  FileText, 
  CheckSquare, 
  AlertTriangle,
  Calendar,
  ArrowRight,
  Sparkles,
  Calculator,
  BookOpen,
  Scale,
  Clock,
  TrendingUp,
  Plus,
  Zap,
  FileSearch
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { format, isToday, isTomorrow, isPast, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";

export default function Dashboard({ theme = 'light' }) {
  const isDark = theme === 'dark';
  
  const [user, setUser] = React.useState(null);
  React.useEffect(() => {
    const initUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        
        // Verificar/criar subscription Free para novos usuários
        if (userData) {
          const subs = await base44.entities.Subscription.filter({ user_id: userData.id });
          if (subs.length === 0) {
            await base44.entities.Subscription.create({
              user_id: userData.id,
              plan: 'free',
              status: 'active',
              daily_actions_limit: 5,
              daily_actions_used: 0,
              price: 0,
              start_date: new Date().toISOString().split('T')[0],
              last_reset_date: new Date().toISOString().split('T')[0]
            });
          }
        }
      } catch (e) {
        console.log('Usuário não logado');
      }
    };
    initUser();
  }, []);

  const { data: clients = [], isLoading: loadingClients } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-created_date'),
  });

  const { data: rawCases = [], isLoading: loadingCases } = useQuery({
    queryKey: ['cases'],
    queryFn: () => base44.entities.Case.list('-created_date'),
  });

  // Normaliza os dados - o SDK retorna os dados dentro de 'data'
  const cases = rawCases
    .filter(c => c && (c.title || (c.data && c.data.title)))
    .map(c => {
      if (c.data && c.data.title) {
        return { id: c.id, created_date: c.created_date, created_by: c.created_by, ...c.data };
      }
      return c;
    });

  const { data: tasks = [], isLoading: loadingTasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list('due_date'),
  });

  const { data: documents = [], isLoading: loadingDocuments } = useQuery({
    queryKey: ['documents'],
    queryFn: () => base44.entities.LegalDocument.list('-created_date'),
  });

  const activeCases = cases.filter(c => c.status === 'in_progress').length;
  const totalCases = cases.length;
  const urgentTasks = tasks.filter(t => t.priority === 'urgent' && t.status !== 'completed').length;
  const pendingTasks = tasks.filter(t => t.status !== 'completed').length;
  const pendingDocuments = documents.filter(d => d.status === 'draft' || d.status === 'review').length;

  const upcomingTasks = tasks
    .filter(t => t.status !== 'completed')
    .slice(0, 5);

  const recentCases = cases.slice(0, 4);

  const isLoading = loadingClients || loadingCases || loadingTasks || loadingDocuments;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  const getTaskUrgency = (task) => {
    if (!task.due_date) return { label: "Sem prazo", color: "gray" };
    const dueDate = new Date(task.due_date);
    if (isPast(dueDate) && !isToday(dueDate)) return { label: "Atrasado", color: "red" };
    if (isToday(dueDate)) return { label: "Hoje", color: "orange" };
    if (isTomorrow(dueDate)) return { label: "Amanhã", color: "yellow" };
    const days = differenceInDays(dueDate, new Date());
    if (days <= 7) return { label: `${days} dias`, color: "blue" };
    return { label: format(dueDate, "dd/MM"), color: "gray" };
  };

  const quickActions = [
    { title: "Novo Processo", icon: Plus, url: createPageUrl("Cases"), color: "emerald" },
    { title: "Assistente IA", icon: Sparkles, url: createPageUrl("AIAssistant"), color: "purple", badge: "IA" },
    { title: "Calculadora", icon: Calculator, url: createPageUrl("LegalCalculator"), color: "blue" },
    { title: "Pesquisa Jurídica", icon: BookOpen, url: createPageUrl("LegalResearchAI"), color: "amber" },
  ];

  const statCards = [
    {
      title: "Clientes Ativos",
      value: clients.length,
      icon: Users,
      link: createPageUrl("Clients"),
      color: "blue",
      subtitle: "cadastrados"
    },
    {
      title: "Processos",
      value: activeCases,
      total: totalCases,
      icon: FolderOpen,
      link: createPageUrl("Cases"),
      color: "emerald",
      subtitle: "em andamento",
      showProgress: true
    },
    {
      title: "Documentos",
      value: pendingDocuments,
      icon: FileText,
      link: createPageUrl("DocumentsEnhanced"),
      color: "purple",
      subtitle: "pendentes"
    },
    {
      title: "Tarefas",
      value: urgentTasks,
      total: pendingTasks,
      icon: AlertTriangle,
      link: createPageUrl("Tasks"),
      color: urgentTasks > 0 ? "red" : "emerald",
      subtitle: urgentTasks > 0 ? "urgentes" : "em dia"
    }
  ];

  const colorClasses = {
    blue: { bg: "bg-blue-500/10", text: "text-blue-500", border: "border-blue-500/20" },
    emerald: { bg: "bg-emerald-500/10", text: "text-emerald-500", border: "border-emerald-500/20" },
    purple: { bg: "bg-purple-500/10", text: "text-purple-500", border: "border-purple-500/20" },
    amber: { bg: "bg-amber-500/10", text: "text-amber-500", border: "border-amber-500/20" },
    red: { bg: "bg-red-500/10", text: "text-red-500", border: "border-red-500/20" },
    orange: { bg: "bg-orange-500/10", text: "text-orange-500", border: "border-orange-500/20" },
    yellow: { bg: "bg-yellow-500/10", text: "text-yellow-600", border: "border-yellow-500/20" },
    gray: { bg: isDark ? "bg-neutral-800" : "bg-gray-100", text: isDark ? "text-neutral-400" : "text-gray-500", border: isDark ? "border-neutral-700" : "border-gray-200" }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0a0a0f]' : 'bg-slate-50'}`}>
      <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-8">
        {/* Header com saudação */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 className={`text-2xl md:text-3xl font-light tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {getGreeting()}, <span className="font-medium">{user?.full_name?.split(' ')[0] || 'Advogado'}</span>
            </h1>
            <p className={`mt-1 ${isDark ? 'text-neutral-500' : 'text-slate-500'}`}>
              {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link to={createPageUrl("AIAssistant")}>
              <Button className="bg-white text-black border border-gray-300 hover:bg-gray-100 rounded-none gap-2">
                <Sparkles className="w-4 h-4" />
                Assistente IA
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          {quickActions.map((action, i) => {
            const Icon = action.icon;
            const colors = colorClasses[action.color];
            return (
              <Link key={i} to={action.url}>
                <div className={`relative p-4 rounded-none border transition-all hover:scale-[1.02] hover:shadow-lg group ${
                  isDark ? 'bg-neutral-900/50 border-neutral-800 hover:border-neutral-700' : 'bg-white border-slate-200 hover:border-slate-300'
                }`}>
                  <div className={`w-10 h-10 rounded-none ${colors.bg} flex items-center justify-center mb-3`}>
                    <Icon className={`w-5 h-5 ${colors.text}`} />
                  </div>
                  <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{action.title}</p>
                  {action.badge && (
                    <span className="absolute top-3 right-3 text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500 text-white">
                      {action.badge}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </motion.div>

        {/* Stats Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            const colors = colorClasses[stat.color];
            const progress = stat.showProgress && stat.total > 0 ? (stat.value / stat.total) * 100 : 0;
            
            return (
              <Link key={index} to={stat.link}>
                <div className={`relative p-5 rounded-none border transition-all hover:shadow-lg group overflow-hidden ${
                  isDark ? 'bg-neutral-900/80 border-neutral-800 hover:border-neutral-700' : 'bg-white border-slate-200 hover:border-slate-300'
                }`}>
                  {/* Background glow */}
                  <div className={`absolute -top-10 -right-10 w-24 h-24 rounded-none opacity-20 blur-2xl ${colors.bg}`} />
                  
                  <div className="relative">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className={`text-xs font-medium uppercase tracking-wider ${isDark ? 'text-neutral-500' : 'text-slate-500'}`}>
                          {stat.title}
                        </p>
                        <div className="flex items-baseline gap-2 mt-1">
                          {isLoading ? (
                            <Skeleton className={`h-8 w-12 ${isDark ? 'bg-neutral-800' : 'bg-slate-200'}`} />
                          ) : (
                            <>
                              <span className={`text-3xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                {stat.value}
                              </span>
                              {stat.total !== undefined && (
                                <span className={`text-sm ${isDark ? 'text-neutral-600' : 'text-slate-400'}`}>
                                  / {stat.total}
                                </span>
                              )}
                            </>
                          )}
                        </div>
                        <p className={`text-xs mt-1 ${colors.text}`}>{stat.subtitle}</p>
                      </div>
                      <div className={`w-11 h-11 rounded-none ${colors.bg} flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${colors.text}`} />
                      </div>
                    </div>
                    
                    {/* Progress bar for cases */}
                    {stat.showProgress && stat.total > 0 && (
                      <div className={`h-1.5 rounded-none overflow-hidden ${isDark ? 'bg-neutral-800' : 'bg-slate-100'}`}>
                        <div 
                          className={`h-full rounded-none bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Próximos Prazos */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`lg:col-span-2 rounded-none border overflow-hidden ${
              isDark ? 'bg-neutral-900/80 border-neutral-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className={`px-6 py-4 border-b flex items-center justify-between ${isDark ? 'border-neutral-800' : 'border-slate-100'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-none flex items-center justify-center ${colorClasses.orange.bg}`}>
                  <Clock className={`w-4 h-4 ${colorClasses.orange.text}`} />
                </div>
                <h2 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Prazos e Tarefas</h2>
              </div>
              <Link to={createPageUrl("Tasks")} className={`text-sm flex items-center gap-1 transition-colors ${isDark ? 'text-neutral-500 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}>
                Ver todas <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="p-4">
              {loadingTasks ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-center py-8">
                    <LoadingSpinner size="default" text="Carregando tarefas..." />
                  </div>
                </div>
              ) : upcomingTasks.length === 0 ? (
                <div className="text-center py-12">
                  <div className={`w-16 h-16 rounded-none mx-auto mb-4 flex items-center justify-center ${colorClasses.emerald.bg}`}>
                    <CheckSquare className={`w-8 h-8 ${colorClasses.emerald.text}`} />
                  </div>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>Tudo em dia!</p>
                  <p className={`text-sm mt-1 ${isDark ? 'text-neutral-500' : 'text-slate-500'}`}>Nenhuma tarefa pendente</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {upcomingTasks.map(task => {
                    const urgency = getTaskUrgency(task);
                    const urgencyColors = colorClasses[urgency.color];
                    return (
                      <div key={task.id} className={`flex items-center gap-4 p-4 rounded-none border transition-all hover:shadow-sm ${
                        isDark ? 'border-neutral-800 hover:border-neutral-700 bg-neutral-900/50' : 'border-slate-100 hover:border-slate-200 bg-slate-50/50'
                      }`}>
                        <div className={`w-2 h-2 rounded-none ${urgencyColors.bg.replace('/10', '')}`} />
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{task.title}</p>
                          <p className={`text-xs mt-0.5 ${isDark ? 'text-neutral-500' : 'text-slate-500'}`}>
                            {task.due_date && format(new Date(task.due_date), "dd 'de' MMMM", { locale: ptBR })}
                          </p>
                        </div>
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-none ${urgencyColors.bg} ${urgencyColors.text}`}>
                          {urgency.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>

          {/* Feature Highlight */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-4"
          >
            {/* Calculadora Jurídica Promo */}
            <Link to={createPageUrl("LegalCalculator")}>
              <div className={`p-5 rounded-none border transition-all hover:shadow-lg group relative overflow-hidden ${
                isDark ? 'bg-gradient-to-br from-blue-900/30 to-indigo-900/30 border-blue-800/50 hover:border-blue-700' : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 hover:border-blue-300'
              }`}>
                <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-none bg-blue-500/10 blur-2xl" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <Calculator className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                      NOVO
                    </span>
                  </div>
                  <h3 className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Calculadora Jurídica
                  </h3>
                  <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
                    Liquidação, trabalhista, previdenciário e mais
                  </p>
                  <div className={`mt-3 flex items-center gap-1 text-sm font-medium ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                    Acessar <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>

            {/* Pesquisa Jurídica Promo */}
            <Link to={createPageUrl("LegalResearchAI")}>
              <div className={`p-5 rounded-none border transition-all hover:shadow-lg group relative overflow-hidden ${
                isDark ? 'bg-gradient-to-br from-amber-900/30 to-orange-900/30 border-amber-800/50 hover:border-amber-700' : 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 hover:border-amber-300'
              }`}>
                <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-none bg-amber-500/10 blur-2xl" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <FileSearch className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${isDark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-700'}`}>
                      IA
                    </span>
                  </div>
                  <h3 className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Pesquisa Jurídica
                  </h3>
                  <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
                    Encontre jurisprudências e precedentes relevantes
                  </p>
                  <div className={`mt-3 flex items-center gap-1 text-sm font-medium ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                    Pesquisar <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        </div>

        {/* Recent Cases */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className={`rounded-none border overflow-hidden ${isDark ? 'bg-neutral-900/80 border-neutral-800' : 'bg-white border-slate-200'}`}
        >
          <div className={`px-6 py-4 border-b flex items-center justify-between ${isDark ? 'border-neutral-800' : 'border-slate-100'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-none flex items-center justify-center ${colorClasses.emerald.bg}`}>
                <FolderOpen className={`w-4 h-4 ${colorClasses.emerald.text}`} />
              </div>
              <h2 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Processos Recentes</h2>
            </div>
            <Link to={createPageUrl("Cases")} className={`text-sm flex items-center gap-1 transition-colors ${isDark ? 'text-neutral-500 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}>
              Ver todos <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="p-4">
            {loadingCases ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center justify-center py-8 col-span-full">
                  <LoadingSpinner size="default" text="Carregando processos..." />
                </div>
              </div>
            ) : recentCases.length === 0 ? (
              <div className="text-center py-12">
                <FolderOpen className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-neutral-700' : 'text-slate-300'}`} />
                <p className={isDark ? 'text-neutral-500' : 'text-slate-500'}>Nenhum processo cadastrado</p>
                <Link to={createPageUrl("Cases")}>
                  <Button variant="outline" className="mt-4 bg-white text-black border border-gray-300 hover:bg-gray-100 rounded-none">
                    <Plus className="w-4 h-4 mr-2" />
                    Criar primeiro processo
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {recentCases.map(caseItem => {
                  const statusColors = {
                    'in_progress': colorClasses.blue,
                    'new': colorClasses.emerald,
                    'waiting': colorClasses.yellow,
                    'closed': colorClasses.gray
                  };
                  const colors = statusColors[caseItem.status] || colorClasses.gray;
                  
                  return (
                    <Link key={caseItem.id} to={createPageUrl("Cases")}>
                      <div className={`p-4 rounded-none border transition-all hover:shadow-sm ${
                        isDark ? 'border-neutral-800 hover:border-neutral-700 bg-neutral-900/50' : 'border-slate-100 hover:border-slate-200 bg-slate-50/50'
                      }`}>
                        <div className="flex items-start justify-between mb-2">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded ${colors.bg} ${colors.text}`}>
                            {caseItem.status === 'in_progress' ? 'Em andamento' : 
                             caseItem.status === 'new' ? 'Novo' :
                             caseItem.status === 'waiting' ? 'Aguardando' : 'Arquivado'}
                          </span>
                        </div>
                        <h3 className={`font-medium text-sm line-clamp-2 mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {caseItem.title}
                        </h3>
                        <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-slate-500'}`}>
                          {caseItem.client_name}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}