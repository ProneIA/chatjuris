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
  TrendingUp,
  Calendar,
  DollarSign
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Dashboard() {
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
      color: "from-blue-500 to-cyan-500",
      link: createPageUrl("Clients")
    },
    {
      title: "Processos Ativos",
      value: activeCases,
      icon: FolderOpen,
      color: "from-purple-500 to-pink-500",
      link: createPageUrl("Cases")
    },
    {
      title: "Documentos Pendentes",
      value: pendingDocuments,
      icon: FileText,
      color: "from-green-500 to-emerald-500",
      link: createPageUrl("Documents")
    },
    {
      title: "Tarefas Urgentes",
      value: urgentTasks,
      icon: AlertCircle,
      color: "from-red-500 to-orange-500",
      link: createPageUrl("Tasks")
    }
  ];

  const upcomingTasks = tasks
    .filter(t => t.status !== 'completed')
    .slice(0, 5);

  const recentCases = cases.slice(0, 5);

  const priorityColors = {
    low: "bg-blue-100 text-blue-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-orange-100 text-orange-800",
    urgent: "bg-red-100 text-red-800"
  };

  const statusColors = {
    new: "bg-blue-100 text-blue-800",
    in_progress: "bg-purple-100 text-purple-800",
    waiting: "bg-yellow-100 text-yellow-800",
    closed: "bg-green-100 text-green-800"
  };

  return (
    <div className="p-6 md:p-8 space-y-8 bg-neutral-950 min-h-screen">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-light text-white mb-2">Dashboard</h1>
        <p className="text-gray-500">Visão geral do escritório</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Link key={index} to={stat.link}>
              <Card className="hover:border-gray-600 transition-all duration-300 cursor-pointer border border-gray-800 bg-black overflow-hidden group">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-500">
                      {stat.title}
                    </CardTitle>
                    <div className="w-10 h-10 rounded-lg border border-gray-700 flex items-center justify-center group-hover:border-white transition-colors">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-light text-white">
                    {loadingClients || loadingCases || loadingTasks || loadingDocuments ? (
                      <Skeleton className="h-9 w-16 bg-gray-800" />
                    ) : (
                      stat.value
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upcoming Tasks */}
        <Card className="border border-gray-800 bg-black">
          <CardHeader className="border-b border-gray-800">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-medium text-white">Próximas Tarefas</CardTitle>
              <Link to={createPageUrl("Tasks")}>
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-gray-800">Ver todas</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {loadingTasks ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full bg-gray-800" />)}
              </div>
            ) : upcomingTasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckSquare className="w-12 h-12 mx-auto mb-3 text-gray-700" />
                <p>Nenhuma tarefa pendente</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingTasks.map(task => (
                  <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-800 hover:border-gray-600 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{task.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="w-3 h-3 text-gray-500" />
                        <span className="text-xs text-gray-500">
                          {task.due_date && format(new Date(task.due_date), "dd 'de' MMM", { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                    <Badge className="bg-gray-800 text-gray-300 border border-gray-700">
                      {task.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Cases */}
        <Card className="border border-gray-800 bg-black">
          <CardHeader className="border-b border-gray-800">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-medium text-white">Processos Recentes</CardTitle>
              <Link to={createPageUrl("Cases")}>
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-gray-800">Ver todos</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {loadingCases ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full bg-gray-800" />)}
              </div>
            ) : recentCases.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FolderOpen className="w-12 h-12 mx-auto mb-3 text-gray-700" />
                <p>Nenhum processo cadastrado</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentCases.map(caseItem => (
                  <div key={caseItem.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-800 hover:border-gray-600 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{caseItem.title}</p>
                      <p className="text-xs text-gray-500 mt-1">{caseItem.client_name}</p>
                    </div>
                    <Badge className="bg-gray-800 text-gray-300 border border-gray-700">
                      {caseItem.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}