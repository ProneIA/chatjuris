import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Crown, 
  Search, 
  Shield, 
  Calendar,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Edit,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import LoadingSpinner from "@/components/common/LoadingSpinner";

export default function AdminSubscriptions({ theme = 'light' }) {
  const [user, setUser] = React.useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingUser, setEditingUser] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [endDate, setEndDate] = useState("");
  const itemsPerPage = 10;
  const queryClient = useQueryClient();
  const isDark = theme === 'dark';

  React.useEffect(() => {
    base44.auth.me()
      .then(setUser)
      .catch(() => {});
  }, []);

  const { data: adminData, isLoading: loadingData } = useQuery({
    queryKey: ['admin-data'],
    queryFn: async () => {
      const response = await base44.functions.invoke('adminGetUsers');
      if (!response.data.success) {
        throw new Error(response.data.error);
      }
      return response.data;
    },
    enabled: !!user && user.role === 'admin'
  });

  const updateSubscriptionMutation = useMutation({
    mutationFn: async ({ userId, action, subscriptionData }) => {
      console.log('Iniciando atualização:', { userId, action, subscriptionData });
      const response = await base44.functions.invoke('adminUpdateSubscription', {
        userId,
        action,
        subscriptionData
      });
      console.log('Resposta da função:', response.data);
      if (!response.data.success) {
        throw new Error(response.data.error || 'Erro desconhecido');
      }
      return response.data;
    },
    onSuccess: async (data) => {
      console.log('Atualização bem-sucedida:', data);
      // Invalidar queries para forçar refetch
      await queryClient.invalidateQueries({ queryKey: ['admin-data'] });
      // Refetch imediato
      await queryClient.refetchQueries({ queryKey: ['admin-data'] });
      toast.success('Assinatura atualizada com sucesso!');
      setEditDialogOpen(false);
      setEditingUser(null);
      setEndDate("");
    },
    onError: (error) => {
      console.error('Erro na atualização:', error);
      toast.error('Erro: ' + error.message);
    }
  });

  const handleActivatePro = (userId) => {
    updateSubscriptionMutation.mutate({
      userId,
      action: 'activate_pro'
    });
  };

  const handleDeactivatePro = (userId) => {
    updateSubscriptionMutation.mutate({
      userId,
      action: 'deactivate_pro'
    });
  };

  const handleEditSubscription = (user, sub) => {
    setEditingUser({ ...user, subscription: sub });
    setEndDate(sub?.end_date || "");
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingUser) return;

    const subscriptionData = {
      plan: editingUser.subscription?.plan || 'free',
      status: 'active',
      daily_actions_limit: editingUser.subscription?.plan === 'pro' ? 999999 : 5,
      daily_actions_used: 0,
      ...(endDate && { end_date: endDate })
    };

    updateSubscriptionMutation.mutate({
      userId: editingUser.id,
      action: 'update',
      subscriptionData
    });
  };

  if (!user) {
    return <LoadingSpinner />;
  }

  if (user.role !== 'admin') {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`}>
        <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : ''}>
          <CardContent className="p-8 text-center">
            <Shield className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
            <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Acesso Negado
            </h2>
            <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
              Esta área é exclusiva para administradores.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loadingData) {
    return <LoadingSpinner />;
  }

  const allUsers = adminData?.users || [];
  const subscriptions = adminData?.subscriptions || [];

  const getUserSubscription = (userId) => {
    return subscriptions.find(sub => sub.user_id === userId);
  };

  const filteredUsers = allUsers.filter(u => 
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const proUsers = subscriptions.filter(s => s.plan === 'pro' && s.status === 'active').length;
  const freeUsers = allUsers.length - proUsers;
  const manualSubs = subscriptions.filter(s => s.payment_method === 'manual' && s.status === 'active').length;

  return (
    <div className={`min-h-screen ${isDark ? 'bg-neutral-950' : 'bg-gray-50'} p-4 sm:p-8`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Gerenciar Assinaturas
          </h1>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            Libere manualmente usuários para o plano Pro
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : ''}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Total de Usuários
              </CardTitle>
              <Users className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {allUsers.length}
              </div>
            </CardContent>
          </Card>

          <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : ''}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Usuários Pro
              </CardTitle>
              <Crown className="w-4 h-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {proUsers}
              </div>
            </CardContent>
          </Card>

          <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : ''}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Usuários Free
              </CardTitle>
              <TrendingUp className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {freeUsers}
              </div>
            </CardContent>
          </Card>

          <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : ''}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Assinaturas Manuais
              </CardTitle>
              <Shield className="w-4 h-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {manualSubs}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            <Input
              placeholder="Buscar por email ou nome..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className={`pl-10 ${isDark ? 'bg-neutral-900 border-neutral-800 text-white' : ''}`}
            />
          </div>
        </div>

        {/* Users Table */}
        <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : ''}>
          <CardHeader>
            <CardTitle className={isDark ? 'text-white' : 'text-gray-900'}>
              Usuários
            </CardTitle>
          </CardHeader>
          <CardContent>
            {paginatedUsers.length === 0 ? (
              <div className="text-center py-8">
                <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                  Nenhum usuário encontrado
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {paginatedUsers.map((u) => {
                  const sub = getUserSubscription(u.id);
                  const isPro = sub?.plan === 'pro' && sub?.status === 'active';
                  const isManual = sub?.payment_method === 'manual';

                  return (
                    <div 
                      key={u.id}
                      className={`p-4 rounded-lg border ${isDark ? 'border-neutral-800 bg-neutral-800/50' : 'border-gray-200 bg-gray-50'}`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {u.full_name || 'Sem nome'}
                            </p>
                            {u.role === 'admin' && (
                              <Badge variant="outline" className="text-xs">
                                <Shield className="w-3 h-3 mr-1" />
                                Admin
                              </Badge>
                            )}
                          </div>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {u.email}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Badge 
                              variant={isPro ? "default" : "secondary"}
                              className={isPro ? "bg-amber-500 text-white" : ""}
                            >
                              {isPro ? (
                                <>
                                  <Crown className="w-3 h-3 mr-1" />
                                  Pro
                                </>
                              ) : (
                                'Free'
                              )}
                            </Badge>
                            {isManual && (
                              <Badge variant="outline" className="text-xs">
                                Manual
                              </Badge>
                            )}
                            {sub?.end_date && (
                              <Badge variant="outline" className="text-xs">
                                <Calendar className="w-3 h-3 mr-1" />
                                Expira: {new Date(sub.end_date).toLocaleDateString('pt-BR')}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditSubscription(u, sub)}
                            disabled={updateSubscriptionMutation.isPending}
                            className={isDark ? 'border-neutral-700 hover:bg-neutral-800' : ''}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                          {isPro ? (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeactivatePro(u.id)}
                              disabled={updateSubscriptionMutation.isPending}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Desativar Pro
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleActivatePro(u.id)}
                              disabled={updateSubscriptionMutation.isPending}
                              className="bg-amber-500 hover:bg-amber-600 text-white"
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              Ativar Pro
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t">
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Página {currentPage} de {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className={isDark ? 'border-neutral-700' : ''}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className={isDark ? 'border-neutral-700' : ''}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className={isDark ? 'bg-neutral-900 border-neutral-800' : ''}>
          <DialogHeader>
            <DialogTitle className={isDark ? 'text-white' : ''}>
              Editar Assinatura
            </DialogTitle>
            <DialogDescription className={isDark ? 'text-gray-400' : ''}>
              {editingUser?.full_name || editingUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className={isDark ? 'text-gray-300' : ''}>
                Plano Atual
              </Label>
              <Badge className="mt-2" variant={editingUser?.subscription?.plan === 'pro' ? "default" : "secondary"}>
                {editingUser?.subscription?.plan === 'pro' ? 'Pro' : 'Free'}
              </Badge>
            </div>
            <div>
              <Label htmlFor="end_date" className={isDark ? 'text-gray-300' : ''}>
                Data de Expiração (Opcional)
              </Label>
              <Input
                id="end_date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={isDark ? 'bg-neutral-800 border-neutral-700 text-white' : ''}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveEdit} disabled={updateSubscriptionMutation.isPending}>
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}