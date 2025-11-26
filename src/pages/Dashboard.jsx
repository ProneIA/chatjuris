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
  AlertCircle,
  Calendar,
  ArrowRight
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Dashboard({ theme = 'light' }) {
  const isDark = theme === 'dark';
  const { data: clients = [], isLoading: loadingClients } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-created_date'),
  });

  const { data: cases = [], isLoading: loadingCases } = useQuery({
    queryKey: ['cases'],
    queryFn: () => base44.entities.Case.list('-created_date'),
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
  const urgentTasks = tasks.filter(t => t.priority === 'urgent' && t.status !== 'completed').length;
  const pendingDocuments = documents.filter(d => d.status === 'draft' || d.status === 'review').length;

  const stats = [
    {
      title: "Total de Clientes",
      value: clients.length,
      icon: Users,
      link: createPageUrl("Clients")
    },
    {
      title: "Processos Ativos",
      value: activeCases,
      icon: FolderOpen,
      link: createPageUrl("Cases")
    },
    {
      title: "Documentos Pendentes",
      value: pendingDocuments,
      icon: FileText,
      link: createPageUrl("Documents")
    },
    {
      title: "Tarefas Urgentes",
      value: urgentTasks,
      icon: AlertCircle,
      link: createPageUrl("Tasks")
    }
  ];

  const upcomingTasks = tasks
    .filter(t => t.status !== 'completed')
    .slice(0, 5);

  const recentCases = cases.slice(0, 5);

  const isLoading = loadingClients || loadingCases || loadingTasks || loadingDocuments;

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className={`text-3xl font-light mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Dashboard</h1>
        <p className={isDark ? 'text-neutral-500' : 'text-gray-500'}>Visão geral do escritório</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Link key={index} to={stat.link}>
              <div className={`p-6 border rounded-lg transition-all group ${isDark ? 'border-neutral-800 hover:border-neutral-700 bg-black' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                <div className="flex items-center justify-between mb-4">
                  <p className={`text-sm ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>{stat.title}</p>
                  <div className={`w-10 h-10 border rounded-lg flex items-center justify-center transition-colors ${isDark ? 'border-neutral-800 group-hover:border-white' : 'border-gray-200 group-hover:border-gray-900'}`}>
                    <Icon className={`w-5 h-5 ${isDark ? 'text-white' : 'text-gray-900'}`} />
                  </div>
                </div>
                <div className={`text-3xl font-light ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {isLoading ? (
                    <Skeleton className={`h-9 w-16 ${isDark ? 'bg-neutral-800' : 'bg-gray-200'}`} />
                  ) : (
                    stat.value
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upcoming Tasks */}
        <div className={`border rounded-lg ${isDark ? 'border-neutral-800 bg-black' : 'border-gray-200 bg-white'}`}>
          <div className={`p-6 border-b flex items-center justify-between ${isDark ? 'border-neutral-800' : 'border-gray-200'}`}>
            <h2 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Próximas Tarefas</h2>
            <Link to={createPageUrl("Tasks")} className={`text-sm transition-colors flex items-center gap-1 ${isDark ? 'text-neutral-500 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>
              Ver todas <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="p-6">
            {loadingTasks ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className={`h-16 w-full ${isDark ? 'bg-neutral-800' : 'bg-gray-200'}`} />)}
              </div>
            ) : upcomingTasks.length === 0 ? (
              <div className="text-center py-8">
                <CheckSquare className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-neutral-700' : 'text-gray-300'}`} />
                <p className={isDark ? 'text-neutral-500' : 'text-gray-500'}>Nenhuma tarefa pendente</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingTasks.map(task => (
                  <div key={task.id} className={`flex items-center gap-4 p-4 border rounded-lg transition-colors ${isDark ? 'border-neutral-800 hover:border-neutral-700' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{task.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className={`w-3 h-3 ${isDark ? 'text-neutral-600' : 'text-gray-400'}`} />
                        <span className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                          {task.due_date && format(new Date(task.due_date), "dd 'de' MMM", { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      task.priority === 'urgent' ? 'bg-red-500/10 text-red-500' :
                      task.priority === 'high' ? 'bg-orange-500/10 text-orange-500' :
                      task.priority === 'medium' ? 'bg-yellow-500/10 text-yellow-600' :
                      isDark ? 'bg-neutral-800 text-neutral-400' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Cases */}
        <div className={`border rounded-lg ${isDark ? 'border-neutral-800 bg-black' : 'border-gray-200 bg-white'}`}>
          <div className={`p-6 border-b flex items-center justify-between ${isDark ? 'border-neutral-800' : 'border-gray-200'}`}>
            <h2 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Processos Recentes</h2>
            <Link to={createPageUrl("Cases")} className={`text-sm transition-colors flex items-center gap-1 ${isDark ? 'text-neutral-500 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>
              Ver todos <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="p-6">
            {loadingCases ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className={`h-16 w-full ${isDark ? 'bg-neutral-800' : 'bg-gray-200'}`} />)}
              </div>
            ) : recentCases.length === 0 ? (
              <div className="text-center py-8">
                <FolderOpen className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-neutral-700' : 'text-gray-300'}`} />
                <p className={isDark ? 'text-neutral-500' : 'text-gray-500'}>Nenhum processo cadastrado</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentCases.map(caseItem => (
                  <div key={caseItem.id} className={`flex items-center gap-4 p-4 border rounded-lg transition-colors ${isDark ? 'border-neutral-800 hover:border-neutral-700' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{caseItem.title}</p>
                      <p className={`text-xs mt-1 ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>{caseItem.client_name}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      caseItem.status === 'in_progress' ? 'bg-blue-500/10 text-blue-500' :
                      caseItem.status === 'new' ? 'bg-green-500/10 text-green-500' :
                      caseItem.status === 'waiting' ? 'bg-yellow-500/10 text-yellow-600' :
                      isDark ? 'bg-neutral-800 text-neutral-400' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {caseItem.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}