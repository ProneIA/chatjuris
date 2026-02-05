import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  CreditCard, 
  Activity, 
  Shield,
  Search,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Star,
  Crown,
  Zap,
  AlertCircle,
  FileText,
  UserCheck,
  TrendingUp
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import moment from "moment";
import 'moment/locale/pt-br';
moment.locale('pt-br');

export default function AdminPanel({ theme = 'light' }) {
  const isDark = theme === 'dark';
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  // Estados para liberação manual
  const [manualReleaseDialog, setManualReleaseDialog] = useState(false);
  const [releaseForm, setReleaseForm] = useState({
    email: "",
    plan_type: "monthly",
    notes: ""
  });

  // Estados para filtros
  const [userSearch, setUserSearch] = useState("");
  const [subscriptionFilter, setSubscriptionFilter] = useState("all");

  useEffect(() => {
    base44.auth.me()
      .then(u => {
        if (!u || u.role !== 'admin') {
          toast.error("Acesso negado - apenas administradores");
          window.location.href = '/Dashboard';
          return;
        }
        setUser(u);
        setIsLoading(false);
      })
      .catch(() => {
        toast.error("Erro ao verificar autenticação");
        window.location.href = '/Dashboard';
      });
  }, []);

  // Buscar todos os usuários
  const { data: allUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      return await base44.asServiceRole.entities.User.list('-created_date');
    },
    enabled: !!user && user.role === 'admin'
  });

  // Buscar todas as assinaturas
  const { data: allSubscriptions = [], isLoading: subscriptionsLoading } = useQuery({
    queryKey: ['admin-subscriptions'],
    queryFn: async () => {
      return await base44.asServiceRole.entities.Subscription.list('-created_date');
    },
    enabled: !!user && user.role === 'admin'
  });

  // Buscar logs de auditoria
  const { data: auditLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: async () => {
      return await base44.asServiceRole.entities.AuditLog.list('-created_date', 100);
    },
    enabled: !!user && user.role === 'admin'
  });

  // Mutação para liberação manual
  const releaseManualMutation = useMutation({
    mutationFn: async (formData) => {
      // Buscar ou criar usuário
      let targetUser = allUsers.find(u => u.email === formData.email);
      
      if (!targetUser) {
        targetUser = await base44.asServiceRole.entities.User.create({
          email: formData.email,
          full_name: formData.email.split('@')[0],
          role: 'user'
        });
      }

      // Calcular datas de expiração
      const startDate = new Date();
      let endDate = null;

      if (formData.plan_type === 'trial') {
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 7);
      } else if (formData.plan_type === 'monthly') {
        endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (formData.plan_type === 'annual') {
        endDate = new Date(startDate);
        endDate.setFullYear(endDate.getFullYear() + 1);
      }
      // lifetime não tem endDate (null)

      // Buscar assinatura existente
      const existingSubs = await base44.asServiceRole.entities.Subscription.filter({ 
        user_id: targetUser.id 
      });

      const subscriptionData = {
        plan: formData.plan_type === 'trial' ? 'free' : 'pro',
        plan_type: formData.plan_type,
        status: formData.plan_type === 'trial' ? 'trial' : 'active',
        payment_status: 'paid',
        payment_method: 'manual',
        payment_provider: 'manual',
        daily_actions_limit: 999999,
        daily_actions_used: 0,
        last_reset_date: startDate.toISOString().split('T')[0],
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate ? endDate.toISOString().split('T')[0] : null,
        next_billing_date: endDate ? endDate.toISOString().split('T')[0] : null,
        activated_at: new Date().toISOString()
      };

      // Atualizar ou criar assinatura
      if (existingSubs.length > 0) {
        await base44.asServiceRole.entities.Subscription.update(existingSubs[0].id, subscriptionData);
      } else {
        await base44.asServiceRole.entities.Subscription.create({
          user_id: targetUser.id,
          ...subscriptionData
        });
      }

      // Criar log de auditoria
      await base44.asServiceRole.entities.AuditLog.create({
        user_email: user.email,
        action: 'manual_subscription_release',
        entity_type: 'Subscription',
        entity_id: targetUser.id,
        target_user_id: targetUser.id,
        details: JSON.stringify({
          target_email: formData.email,
          plan_type: formData.plan_type,
          notes: formData.notes,
          end_date: endDate ? endDate.toISOString().split('T')[0] : 'vitalício'
        })
      });

      return { targetUser, subscriptionData };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-audit-logs'] });
      toast.success("Assinatura liberada com sucesso!");
      setManualReleaseDialog(false);
      setReleaseForm({ email: "", plan_type: "monthly", notes: "" });
    },
    onError: (error) => {
      toast.error(`Erro ao liberar assinatura: ${error.message}`);
    }
  });

  // Métricas do Dashboard
  const metrics = React.useMemo(() => {
    const activeSubscriptions = allSubscriptions.filter(s => s.status === 'active' || s.status === 'trial');
    const expiredSubscriptions = allSubscriptions.filter(s => s.status === 'expired' || s.status === 'cancelled');
    
    const planDistribution = {
      trial: allSubscriptions.filter(s => s.status === 'trial').length,
      monthly: allSubscriptions.filter(s => s.plan_type === 'monthly' && s.status === 'active').length,
      annual: allSubscriptions.filter(s => s.plan_type === 'annual' && s.status === 'active').length,
      lifetime: allSubscriptions.filter(s => s.plan_type === 'lifetime').length
    };

    return {
      totalUsers: allUsers.length,
      activeUsers: activeSubscriptions.length,
      expiredUsers: expiredSubscriptions.length,
      planDistribution
    };
  }, [allUsers, allSubscriptions]);

  // Filtrar assinaturas
  const filteredSubscriptions = React.useMemo(() => {
    return allSubscriptions.filter(sub => {
      if (subscriptionFilter === 'all') return true;
      if (subscriptionFilter === 'active') return sub.status === 'active' || sub.status === 'trial';
      if (subscriptionFilter === 'expired') return sub.status === 'expired' || sub.status === 'cancelled';
      if (subscriptionFilter === 'lifetime') return sub.plan_type === 'lifetime';
      if (subscriptionFilter === 'manual') return sub.payment_method === 'manual';
      return true;
    });
  }, [allSubscriptions, subscriptionFilter]);

  // Filtrar usuários
  const filteredUsers = React.useMemo(() => {
    if (!userSearch) return allUsers;
    const search = userSearch.toLowerCase();
    return allUsers.filter(u => 
      u.email?.toLowerCase().includes(search) || 
      u.full_name?.toLowerCase().includes(search)
    );
  }, [allUsers, userSearch]);

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`}>
        <div className="text-center">
          <Shield className={`w-16 h-16 mx-auto mb-4 animate-pulse ${isDark ? 'text-neutral-700' : 'text-gray-400'}`} />
          <p className={isDark ? 'text-neutral-400' : 'text-gray-600'}>Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className={`w-8 h-8 ${isDark ? 'text-red-500' : 'text-red-600'}`} />
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Painel Administrativo
            </h1>
          </div>
          <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
            Gestão de usuários, assinaturas e auditoria do sistema
          </p>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className={isDark ? 'bg-neutral-900' : 'bg-white'}>
            <TabsTrigger value="dashboard">
              <TrendingUp className="w-4 h-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="w-4 h-4 mr-2" />
              Usuários ({allUsers.length})
            </TabsTrigger>
            <TabsTrigger value="subscriptions">
              <CreditCard className="w-4 h-4 mr-2" />
              Assinaturas ({allSubscriptions.length})
            </TabsTrigger>
            <TabsTrigger value="release">
              <UserCheck className="w-4 h-4 mr-2" />
              Liberação Manual
            </TabsTrigger>
            <TabsTrigger value="logs">
              <Activity className="w-4 h-4 mr-2" />
              Logs ({auditLogs.length})
            </TabsTrigger>
          </TabsList>

          {/* DASHBOARD */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid md:grid-cols-4 gap-4">
              <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <Users className={`w-5 h-5 ${isDark ? 'text-neutral-500' : 'text-gray-400'}`} />
                    <span className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {metrics.totalUsers}
                    </span>
                  </div>
                  <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>Total de Usuários</p>
                </CardContent>
              </Card>

              <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {metrics.activeUsers}
                    </span>
                  </div>
                  <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>Assinaturas Ativas</p>
                </CardContent>
              </Card>

              <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <XCircle className="w-5 h-5 text-red-500" />
                    <span className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {metrics.expiredUsers}
                    </span>
                  </div>
                  <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>Assinaturas Expiradas</p>
                </CardContent>
              </Card>

              <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <Star className="w-5 h-5 text-amber-500" />
                    <span className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {metrics.planDistribution.lifetime}
                    </span>
                  </div>
                  <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>Planos Vitalícios</p>
                </CardContent>
              </Card>
            </div>

            <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}>
              <CardHeader>
                <CardTitle className={isDark ? 'text-white' : 'text-gray-900'}>
                  Distribuição por Plano
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <span className={isDark ? 'text-neutral-300' : 'text-gray-700'}>Teste (7 dias)</span>
                    </div>
                    <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {metrics.planDistribution.trial}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-green-500" />
                      <span className={isDark ? 'text-neutral-300' : 'text-gray-700'}>Mensal</span>
                    </div>
                    <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {metrics.planDistribution.monthly}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-purple-500" />
                      <span className={isDark ? 'text-neutral-300' : 'text-gray-700'}>Anual</span>
                    </div>
                    <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {metrics.planDistribution.annual}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-500" />
                      <span className={isDark ? 'text-neutral-300' : 'text-gray-700'}>Vitalício</span>
                    </div>
                    <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {metrics.planDistribution.lifetime}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* USUÁRIOS */}
          <TabsContent value="users" className="space-y-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="relative flex-1">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-neutral-500' : 'text-gray-400'}`} />
                <Input
                  placeholder="Buscar usuário por email ou nome..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className={`border-b ${isDark ? 'border-neutral-800' : 'border-gray-200'}`}>
                      <tr>
                        <th className={`text-left p-4 text-sm font-medium ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>Usuário</th>
                        <th className={`text-left p-4 text-sm font-medium ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>Email</th>
                        <th className={`text-left p-4 text-sm font-medium ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>Função</th>
                        <th className={`text-left p-4 text-sm font-medium ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>Criado em</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className={`border-b ${isDark ? 'border-neutral-800' : 'border-gray-100'}`}>
                          <td className={`p-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>{u.full_name || 'N/A'}</td>
                          <td className={`p-4 ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>{u.email}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              u.role === 'admin' 
                                ? 'bg-red-100 text-red-700' 
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {u.role || 'user'}
                            </span>
                          </td>
                          <td className={`p-4 text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                            {moment(u.created_date).format('DD/MM/YYYY')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ASSINATURAS */}
          <TabsContent value="subscriptions" className="space-y-4">
            <div className="flex flex-wrap gap-2 mb-4">
              <Button
                variant={subscriptionFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSubscriptionFilter('all')}
              >
                Todas
              </Button>
              <Button
                variant={subscriptionFilter === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSubscriptionFilter('active')}
              >
                Ativas
              </Button>
              <Button
                variant={subscriptionFilter === 'expired' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSubscriptionFilter('expired')}
              >
                Expiradas
              </Button>
              <Button
                variant={subscriptionFilter === 'lifetime' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSubscriptionFilter('lifetime')}
              >
                Vitalícias
              </Button>
              <Button
                variant={subscriptionFilter === 'manual' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSubscriptionFilter('manual')}
              >
                Manuais
              </Button>
            </div>

            <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className={`border-b ${isDark ? 'border-neutral-800' : 'border-gray-200'}`}>
                      <tr>
                        <th className={`text-left p-4 text-sm font-medium ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>Email</th>
                        <th className={`text-left p-4 text-sm font-medium ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>Plano</th>
                        <th className={`text-left p-4 text-sm font-medium ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>Status</th>
                        <th className={`text-left p-4 text-sm font-medium ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>Provedor</th>
                        <th className={`text-left p-4 text-sm font-medium ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>Expira em</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSubscriptions.map((sub) => {
                        const user = allUsers.find(u => u.id === sub.user_id);
                        return (
                          <tr key={sub.id} className={`border-b ${isDark ? 'border-neutral-800' : 'border-gray-100'}`}>
                            <td className={`p-4 ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                              {user?.email || 'N/A'}
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                sub.plan_type === 'lifetime' ? 'bg-amber-100 text-amber-700' :
                                sub.plan_type === 'annual' ? 'bg-purple-100 text-purple-700' :
                                sub.plan_type === 'monthly' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {sub.plan_type === 'lifetime' ? 'Vitalício' :
                                 sub.plan_type === 'annual' ? 'Anual' :
                                 sub.plan_type === 'monthly' ? 'Mensal' : 'Teste'}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                sub.status === 'active' ? 'bg-green-100 text-green-700' :
                                sub.status === 'trial' ? 'bg-blue-100 text-blue-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {sub.status}
                              </span>
                            </td>
                            <td className={`p-4 text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                              {sub.payment_method === 'manual' ? '🔧 Manual' :
                               sub.payment_method === 'hotmart' ? '🛒 Hotmart' : sub.payment_method}
                            </td>
                            <td className={`p-4 text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                              {sub.end_date ? moment(sub.end_date).format('DD/MM/YYYY') : '♾️ Vitalício'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* LIBERAÇÃO MANUAL */}
          <TabsContent value="release" className="space-y-4">
            <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}>
              <CardHeader>
                <CardTitle className={isDark ? 'text-white' : 'text-gray-900'}>
                  Liberação Manual de Assinatura
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                    Email do Usuário *
                  </label>
                  <Input
                    type="email"
                    placeholder="usuario@exemplo.com"
                    value={releaseForm.email}
                    onChange={(e) => setReleaseForm({ ...releaseForm, email: e.target.value })}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                    Tipo de Plano *
                  </label>
                  <select
                    value={releaseForm.plan_type}
                    onChange={(e) => setReleaseForm({ ...releaseForm, plan_type: e.target.value })}
                    className={`w-full p-2 border rounded ${isDark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-white border-gray-300'}`}
                  >
                    <option value="trial">Teste (7 dias)</option>
                    <option value="monthly">Mensal (30 dias)</option>
                    <option value="annual">Anual (365 dias)</option>
                    <option value="lifetime">Vitalício (sem expiração)</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                    Observação / Motivo *
                  </label>
                  <Textarea
                    placeholder="Ex: Pagamento via PIX confirmado, Cortesia, Cliente VIP, etc."
                    value={releaseForm.notes}
                    onChange={(e) => setReleaseForm({ ...releaseForm, notes: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className={`p-4 rounded-lg border ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-yellow-50 border-yellow-200'}`}>
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
                    <div>
                      <p className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        ⚠️ Atenção
                      </p>
                      <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                        Esta ação substituirá qualquer plano anterior do usuário. 
                        Liberações manuais não geram renovação automática.
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => releaseManualMutation.mutate(releaseForm)}
                  disabled={!releaseForm.email || !releaseForm.notes || releaseManualMutation.isPending}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  {releaseManualMutation.isPending ? 'Liberando...' : 'Liberar Assinatura'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* LOGS */}
          <TabsContent value="logs" className="space-y-4">
            <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}>
              <CardHeader>
                <CardTitle className={isDark ? 'text-white' : 'text-gray-900'}>
                  Logs de Auditoria
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className={`border-b ${isDark ? 'border-neutral-800' : 'border-gray-200'}`}>
                      <tr>
                        <th className={`text-left p-4 text-sm font-medium ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>Data</th>
                        <th className={`text-left p-4 text-sm font-medium ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>Admin</th>
                        <th className={`text-left p-4 text-sm font-medium ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>Ação</th>
                        <th className={`text-left p-4 text-sm font-medium ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>Detalhes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.filter(log => log.action === 'manual_subscription_release').map((log) => {
                        let details = {};
                        try {
                          details = JSON.parse(log.details || '{}');
                        } catch (e) {}

                        return (
                          <tr key={log.id} className={`border-b ${isDark ? 'border-neutral-800' : 'border-gray-100'}`}>
                            <td className={`p-4 text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                              {moment(log.created_date).format('DD/MM/YYYY HH:mm')}
                            </td>
                            <td className={`p-4 ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                              {log.user_email}
                            </td>
                            <td className="p-4">
                              <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
                                Liberação Manual
                              </span>
                            </td>
                            <td className={`p-4 text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                              <div>
                                <p><strong>Usuário:</strong> {details.target_email}</p>
                                <p><strong>Plano:</strong> {details.plan_type}</p>
                                <p><strong>Expira:</strong> {details.end_date}</p>
                                {details.notes && <p><strong>Obs:</strong> {details.notes}</p>}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}