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
  TrendingUp,
  Tag
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import CouponsManager from "@/components/admin/CouponsManager";
import moment from "moment";
import 'moment/locale/pt-br';
moment.locale('pt-br');

export default function AdminPanel({ theme = 'light' }) {
  const isDark = false;
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

  // Estado para edição de usuário
  const [editUserDialog, setEditUserDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editPlanType, setEditPlanType] = useState("monthly");

  useEffect(() => {
    const verifyAdminAccess = async () => {
      try {
        const u = await base44.auth.me();
        
        // VERIFICAÇÃO ESTRITA: Apenas role === 'admin'
        if (!u || u.role !== 'admin') {
          // Registrar tentativa de acesso indevido
          try {
            await base44.entities.AuditLog.create({
              user_email: u?.email || 'anonymous',
              action: 'unauthorized_admin_access_attempt',
              entity_type: 'SecurityAttempt',
              details: JSON.stringify({
                timestamp: new Date().toISOString(),
                user_role: u?.role || 'none',
                message: 'Tentativa de acesso ao painel admin bloqueada'
              })
            });
          } catch (logError) {
            console.error('Erro ao registrar tentativa:', logError);
          }
          
          toast.error("🔒 Acesso restrito - Apenas administradores");
          window.location.replace('/Dashboard');
          return;
        }
        
        setUser(u);
        setIsLoading(false);
      } catch (error) {
        toast.error("Erro ao verificar autenticação");
        window.location.replace('/Dashboard');
      }
    };
    
    verifyAdminAccess();
  }, []);

  // Buscar todos os usuários via backend seguro
  const { data: allUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const response = await base44.functions.invoke('adminSecureAction', { action: 'list_users' });
      if (!response.data?.success) throw new Error(response.data?.error || 'Erro ao buscar usuários');
      return response.data.data;
    },
    enabled: !!user && user.role === 'admin'
  });

  // Buscar todas as assinaturas via backend seguro
  const { data: allSubscriptions = [], isLoading: subscriptionsLoading } = useQuery({
    queryKey: ['admin-subscriptions'],
    queryFn: async () => {
      const response = await base44.functions.invoke('adminSecureAction', { action: 'list_subscriptions' });
      if (!response.data?.success) throw new Error(response.data?.error || 'Erro ao buscar assinaturas');
      return response.data.data;
    },
    enabled: !!user && user.role === 'admin'
  });

  // Buscar logs de auditoria via backend seguro
  const { data: auditLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: async () => {
      const response = await base44.functions.invoke('adminSecureAction', { action: 'list_audit_logs' });
      if (!response.data?.success) throw new Error(response.data?.error || 'Erro ao buscar logs');
      return response.data.data;
    },
    enabled: !!user && user.role === 'admin'
  });

  // Mutação para liberação manual via backend seguro
  const releaseManualMutation = useMutation({
    mutationFn: async (formData) => {
      const response = await base44.functions.invoke('adminSecureAction', {
        action: 'release_manual',
        data: {
          email: formData.email,
          planType: formData.plan_type,
          notes: formData.notes
        }
      });
      
      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Erro ao liberar assinatura');
      }
      
      return response.data.data;
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

  // Mutação para atualizar plano de usuário existente via backend seguro
  const updateUserPlanMutation = useMutation({
    mutationFn: async ({ userId, userEmail, planType }) => {
      const response = await base44.functions.invoke('adminSecureAction', {
        action: 'update_subscription',
        data: {
          userId,
          userEmail,
          planType
        }
      });
      
      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Erro ao atualizar plano');
      }
      
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-audit-logs'] });
      toast.success("Plano atualizado com sucesso!");
      setEditUserDialog(false);
      setSelectedUser(null);
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar plano: ${error.message}`);
    }
  });

  // Métricas do Dashboard - APENAS assinaturas ativas (1 por usuário)
  const metrics = React.useMemo(() => {
    // Agrupar assinaturas por usuário e pegar apenas a mais recente ativa
    const activeByUser = {};
    for (const sub of allSubscriptions) {
      if (sub.status === 'active' || sub.status === 'trial') {
        if (!activeByUser[sub.user_id] || new Date(sub.created_date) > new Date(activeByUser[sub.user_id].created_date)) {
          activeByUser[sub.user_id] = sub;
        }
      }
    }
    
    const uniqueActiveSubs = Object.values(activeByUser);
    const expiredSubscriptions = allSubscriptions.filter(s => s.status === 'expired' || s.status === 'cancelled');
    
    // Contar duplicatas (mais de 1 ativa por usuário)
    const userSubCounts = {};
    for (const sub of allSubscriptions) {
      if (sub.status === 'active' || sub.status === 'trial') {
        userSubCounts[sub.user_id] = (userSubCounts[sub.user_id] || 0) + 1;
      }
    }
    const duplicateCount = Object.values(userSubCounts).filter(count => count > 1).length;
    
    const planDistribution = {
      trial: uniqueActiveSubs.filter(s => s.status === 'trial' || s.plan_type === 'trial').length,
      monthly: uniqueActiveSubs.filter(s => s.plan_type === 'monthly' && s.status === 'active').length,
      annual: uniqueActiveSubs.filter(s => s.plan_type === 'annual' && s.status === 'active').length,
      lifetime: uniqueActiveSubs.filter(s => s.plan_type === 'lifetime').length
    };

    return {
      totalUsers: allUsers.length,
      activeUsers: uniqueActiveSubs.length,
      expiredUsers: expiredSubscriptions.length,
      planDistribution,
      duplicateCount
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

  // Função para obter assinatura do usuário
  const getUserSubscription = (userId) => {
    return allSubscriptions.find(s => s.user_id === userId);
  };

  // Abrir dialog de edição
  const openEditUser = (userToEdit) => {
    const sub = getUserSubscription(userToEdit.id);
    setSelectedUser(userToEdit);
    setEditPlanType(sub?.plan_type || 'monthly');
    setEditUserDialog(true);
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)' }}>
        <div className="text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 animate-pulse" style={{ color: 'var(--text-muted)' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // BLOQUEIO ABSOLUTO: Se não for admin, não renderiza nada
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso Restrito</h1>
          <p className="text-gray-600">Esta área é exclusiva para administradores.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', padding: 24, background: 'var(--surface)' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className={`w-8 h-8 ${isDark ? 'text-red-500' : 'text-red-600'}`} />
            <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)' }}>
              Painel Administrativo
            </h1>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Gestão de usuários, assinaturas e auditoria do sistema
          </p>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList>
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
            <TabsTrigger value="coupons">
              <Tag className="w-4 h-4 mr-2" />
              Cupons
            </TabsTrigger>
            <TabsTrigger value="logs">
              <Activity className="w-4 h-4 mr-2" />
              Logs ({auditLogs.length})
            </TabsTrigger>
          </TabsList>

          {/* DASHBOARD */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Alerta de duplicatas */}
            {metrics.duplicateCount > 0 && (
              <Card className="bg-red-50 border-red-200">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-6 h-6 text-red-600" />
                      <div>
                        <p style={{ fontWeight: 600, color: 'var(--danger)' }}>
                          ⚠️ {metrics.duplicateCount} usuário(s) com múltiplas assinaturas ativas
                        </p>
                        <p style={{ fontSize: 13, color: 'var(--danger)' }}>
                          Execute a limpeza para corrigir dados inconsistentes
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={async () => {
                        if (confirm('Isso irá expirar assinaturas duplicadas, mantendo apenas a mais recente de cada usuário. Continuar?')) {
                          try {
                            const response = await base44.functions.invoke('adminSecureAction', { action: 'cleanup_duplicates' });
                            if (response.data?.success) {
                              toast.success(`Limpeza concluída: ${response.data.data.expired_count} assinaturas expiradas`);
                              queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] });
                            } else {
                              throw new Error(response.data?.error);
                            }
                          } catch (e) {
                            toast.error(`Erro: ${e.message}`);
                          }
                        }
                      }}
                      className="btn-primary"
                    >
                      Limpar Duplicatas
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <Users className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                    <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>{metrics.totalUsers}</span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Total de Usuários</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <CheckCircle2 className="w-5 h-5" style={{ color: 'var(--success)' }} />
                    <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>{metrics.activeUsers}</span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Assinaturas Ativas (únicas)</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <XCircle className="w-5 h-5" style={{ color: 'var(--danger)' }} />
                    <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>{metrics.expiredUsers}</span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Assinaturas Expiradas</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <Star className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                    <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>{metrics.planDistribution.lifetime}</span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Planos Vitalícios</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Plano</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { icon: Clock, color: 'var(--info)', label: 'Teste (7 dias)', value: metrics.planDistribution.trial },
                    { icon: Zap, color: 'var(--success)', label: 'Mensal', value: metrics.planDistribution.monthly },
                    { icon: Crown, color: 'var(--accent)', label: 'Anual', value: metrics.planDistribution.annual },
                    { icon: Star, color: 'var(--accent)', label: 'Vitalício', value: metrics.planDistribution.lifetime },
                  ].map(({ icon: Icon, color, label, value }) => (
                    <div key={label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" style={{ color }} />
                        <span style={{ color: 'var(--text-primary)', fontSize: 13 }}>{label}</span>
                      </div>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>{value}</span>
                    </div>
                  ))}
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

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        {["Usuário", "Email", "Plano Atual", "Status", "Ações"].map(h => (
                          <th key={h} style={{ textAlign: 'left', padding: 16, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', borderBottom: '2px solid var(--border)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u) => {
                        const sub = getUserSubscription(u.id);
                        return (
                          <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: 16, color: 'var(--text-primary)', fontSize: 13 }}>{u.full_name || 'N/A'}</td>
                            <td style={{ padding: 16, color: 'var(--text-secondary)', fontSize: 13 }}>{u.email}</td>
                            <td style={{ padding: 16 }}>
                              <span className={`badge ${
                                sub?.plan_type === 'lifetime' ? 'badge-gold' :
                                sub?.plan_type === 'annual' ? 'badge-neutral' :
                                sub?.plan_type === 'monthly' ? 'badge-info' :
                                sub?.status === 'trial' ? 'badge-info' :
                                'badge-neutral'
                              }`}>
                                {sub?.plan_type === 'lifetime' ? '⭐ Vitalício' :
                                 sub?.plan_type === 'annual' ? '👑 Anual' :
                                 sub?.plan_type === 'monthly' ? '📅 Mensal' :
                                 sub?.status === 'trial' ? '⏱️ Teste' : '❌ Sem plano'}
                              </span>
                            </td>
                            <td style={{ padding: 16 }}>
                              <span className={`badge ${
                                sub?.status === 'active' ? 'badge-success' :
                                sub?.status === 'trial' ? 'badge-info' :
                                sub?.status === 'expired' ? 'badge-error' :
                                'badge-neutral'
                              }`}>
                                {sub?.status === 'active' ? 'Ativo' :
                                 sub?.status === 'trial' ? 'Teste' :
                                 sub?.status === 'expired' ? 'Expirado' : 'Inativo'}
                              </span>
                            </td>
                            <td className="p-4">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditUser(u)}
                                className="text-xs"
                              >
                                Alterar Plano
                              </Button>
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

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        {["Email", "Plano", "Status", "Provedor", "Expira em"].map(h => (
                          <th key={h} style={{ textAlign: 'left', padding: 16, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', borderBottom: '2px solid var(--border)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSubscriptions.map((sub) => {
                        const user = allUsers.find(u => u.id === sub.user_id);
                        return (
                          <tr key={sub.id} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: 16, color: 'var(--text-secondary)', fontSize: 13 }}>
                              {user?.email || 'N/A'}
                            </td>
                            <td style={{ padding: 16 }}>
                              <span className={`badge ${
                                sub.plan_type === 'lifetime' ? 'badge-gold' :
                                sub.plan_type === 'annual' ? 'badge-neutral' :
                                sub.plan_type === 'monthly' ? 'badge-info' :
                                'badge-neutral'
                              }`}>
                                {sub.plan_type === 'lifetime' ? 'Vitalício' :
                                 sub.plan_type === 'annual' ? 'Anual' :
                                 sub.plan_type === 'monthly' ? 'Mensal' : 'Teste'}
                              </span>
                            </td>
                            <td style={{ padding: 16 }}>
                              <span className={`badge ${
                                sub.status === 'active' ? 'badge-success' :
                                sub.status === 'trial' ? 'badge-info' :
                                'badge-error'
                              }`}>
                                {sub.status}
                              </span>
                            </td>
                            <td style={{ padding: 16, fontSize: 13, color: 'var(--text-secondary)' }}>
                              {sub.payment_method === 'manual' ? '🔧 Manual' :
                               sub.payment_method === 'hotmart' ? '🛒 Hotmart' : sub.payment_method}
                            </td>
                            <td style={{ padding: 16, fontSize: 13, color: 'var(--text-secondary)' }}>
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
            <Card>
              <CardHeader>
                <CardTitle>Liberação Manual de Assinatura</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 8, color: 'var(--text-secondary)' }}>
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
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 8, color: 'var(--text-secondary)' }}>
                    Tipo de Plano *
                  </label>
                  <select
                    value={releaseForm.plan_type}
                    onChange={(e) => setReleaseForm({ ...releaseForm, plan_type: e.target.value })}
                    style={{ width: '100%' }}
                  >
                    <option value="trial">Teste (7 dias)</option>
                    <option value="monthly">Mensal (30 dias)</option>
                    <option value="annual">Anual (365 dias)</option>
                    <option value="lifetime">Vitalício (sem expiração)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 8, color: 'var(--text-secondary)' }}>
                    Observação / Motivo *
                  </label>
                  <Textarea
                    placeholder="Ex: Pagamento via PIX confirmado, Cortesia, Cliente VIP, etc."
                    value={releaseForm.notes}
                    onChange={(e) => setReleaseForm({ ...releaseForm, notes: e.target.value })}
                    rows={3}
                  />
                </div>

                <div style={{ padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid var(--warn-border)', background: 'var(--warn-bg)' }}>
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" style={{ color: 'var(--warn)' }} />
                    <div>
                      <p style={{ fontWeight: 600, marginBottom: 4, color: 'var(--text-primary)' }}>
                        ⚠️ Atenção
                      </p>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        Esta ação substituirá qualquer plano anterior do usuário. 
                        Liberações manuais não geram renovação automática.
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => releaseManualMutation.mutate(releaseForm)}
                  disabled={!releaseForm.email || !releaseForm.notes || releaseManualMutation.isPending}
                  className="w-full btn-primary"
                >
                  {releaseManualMutation.isPending ? 'Liberando...' : 'Liberar Assinatura'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CUPONS */}
          <TabsContent value="coupons" className="space-y-4">
            <CouponsManager isDark={isDark} />
          </TabsContent>

          {/* LOGS */}
          <TabsContent value="logs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Logs de Auditoria</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        {["Data", "Admin", "Ação", "Detalhes"].map(h => (
                          <th key={h} style={{ textAlign: 'left', padding: 16, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', borderBottom: '2px solid var(--border)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.filter(log => log.action === 'manual_subscription_release').map((log) => {
                        let details = {};
                        try {
                          details = JSON.parse(log.details || '{}');
                        } catch (e) {}

                        return (
                          <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: 16, fontSize: 13, color: 'var(--text-secondary)' }}>
                              {moment(log.created_date).format('DD/MM/YYYY HH:mm')}
                            </td>
                            <td style={{ padding: 16, fontSize: 13, color: 'var(--text-primary)' }}>
                              {log.user_email}
                            </td>
                            <td style={{ padding: 16 }}>
                              <span className="badge badge-info">
                                Liberação Manual
                              </span>
                            </td>
                            <td style={{ padding: 16, fontSize: 13, color: 'var(--text-secondary)' }}>
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

        {/* Dialog de Edição de Plano */}
        <Dialog open={editUserDialog} onOpenChange={setEditUserDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Alterar Plano do Usuário</DialogTitle>
            </DialogHeader>
            
            {selectedUser && (
              <div className="space-y-4">
                <div style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--surface)' }}>
                  <p style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                    {selectedUser.full_name || 'Sem nome'}
                  </p>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    {selectedUser.email}
                  </p>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 8, color: 'var(--text-secondary)' }}>
                    Selecione o Plano
                  </label>
                  <select
                    value={editPlanType}
                    onChange={(e) => setEditPlanType(e.target.value)}
                    style={{ width: '100%' }}
                  >
                    <option value="trial">⏱️ Teste (7 dias)</option>
                    <option value="monthly">📅 Mensal (30 dias)</option>
                    <option value="annual">👑 Anual (365 dias)</option>
                    <option value="lifetime">⭐ Vitalício (sem expiração)</option>
                  </select>
                </div>

                <div style={{ padding: 12, borderRadius: 'var(--radius-md)', border: '1px solid var(--warn-border)', background: 'var(--warn-bg)' }}>
                  <p style={{ fontSize: 13, color: '#7a6010' }}>
                    ⚠️ Esta ação substituirá o plano atual do usuário imediatamente.
                  </p>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditUserDialog(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => updateUserPlanMutation.mutate({
                  userId: selectedUser.id,
                  userEmail: selectedUser.email,
                  planType: editPlanType
                })}
                disabled={updateUserPlanMutation.isPending}
                className="btn-primary"
              >
                {updateUserPlanMutation.isPending ? 'Salvando...' : 'Salvar Plano'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}