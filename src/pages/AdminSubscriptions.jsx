import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, Search, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function AdminSubscriptions({ theme = 'light' }) {
  const [user, setUser] = useState(null);
  const [searchEmail, setSearchEmail] = useState("");
  const queryClient = useQueryClient();
  const isDark = theme === 'dark';

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: allUsers = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      const users = await base44.asServiceRole.entities.User.list();
      return users;
    },
    enabled: !!user && user.role === 'admin'
  });

  const { data: subscriptions = [], isLoading: loadingSubs } = useQuery({
    queryKey: ['all-subscriptions'],
    queryFn: async () => {
      const subs = await base44.asServiceRole.entities.Subscription.list();
      return subs;
    },
    enabled: !!user && user.role === 'admin'
  });

  const activateProMutation = useMutation({
    mutationFn: async ({ userId, userEmail }) => {
      const allSubs = await base44.asServiceRole.entities.Subscription.filter({ user_id: userId });
      
      const subData = {
        user_id: userId,
        plan: "pro",
        status: "active",
        daily_actions_limit: 999999,
        daily_actions_used: 0,
        price: 0,
        payment_method: "manual",
        start_date: new Date().toISOString().split('T')[0],
        last_reset_date: new Date().toISOString().split('T')[0]
      };

      if (allSubs.length > 0) {
        return await base44.asServiceRole.entities.Subscription.update(allSubs[0].id, subData);
      } else {
        return await base44.asServiceRole.entities.Subscription.create(subData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-subscriptions'] });
      toast.success('Plano Pro ativado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao ativar plano: ' + error.message);
    }
  });

  const deactivateProMutation = useMutation({
    mutationFn: async ({ userId }) => {
      const allSubs = await base44.asServiceRole.entities.Subscription.filter({ user_id: userId });
      
      if (allSubs.length > 0) {
        return await base44.asServiceRole.entities.Subscription.update(allSubs[0].id, {
          plan: "free",
          status: "active",
          daily_actions_limit: 5,
          daily_actions_used: 0,
          price: 0
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-subscriptions'] });
      toast.success('Plano alterado para Free');
    },
    onError: (error) => {
      toast.error('Erro ao desativar plano: ' + error.message);
    }
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-red-600">Acesso negado. Apenas administradores.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getUserSubscription = (userId) => {
    return subscriptions.find(s => s.user_id === userId);
  };

  const filteredUsers = allUsers.filter(u => 
    !searchEmail || u.email.toLowerCase().includes(searchEmail.toLowerCase()) || 
    u.full_name?.toLowerCase().includes(searchEmail.toLowerCase())
  );

  return (
    <div className={`min-h-screen ${isDark ? 'bg-neutral-950' : 'bg-gray-50'} py-8`}>
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Gerenciar Assinaturas
          </h1>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            Libere manualmente usuários para o plano Pro
          </p>
        </div>

        {/* Search */}
        <Card className={`mb-6 ${isDark ? 'bg-neutral-900 border-neutral-800' : ''}`}>
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar por email ou nome..."
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : ''}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">Total de Usuários</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {allUsers.length}
              </div>
            </CardContent>
          </Card>

          <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : ''}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">Usuários Pro</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {subscriptions.filter(s => s.plan === 'pro' && s.status === 'active').length}
              </div>
            </CardContent>
          </Card>

          <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : ''}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">Usuários Free</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {allUsers.length - subscriptions.filter(s => s.plan === 'pro' && s.status === 'active').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users List */}
        <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : ''}>
          <CardHeader>
            <CardTitle>Usuários</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingUsers || loadingSubs ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="space-y-3">
                {filteredUsers.map((u) => {
                  const subscription = getUserSubscription(u.id);
                  const isPro = subscription?.plan === 'pro' && subscription?.status === 'active';

                  return (
                    <div
                      key={u.id}
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        isDark ? 'border-neutral-800 bg-neutral-800/50' : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {u.full_name || 'Sem nome'}
                          </p>
                          {isPro && (
                            <Badge className="bg-amber-500 text-white">
                              <Crown className="w-3 h-3 mr-1" />
                              PRO
                            </Badge>
                          )}
                          {u.role === 'admin' && (
                            <Badge variant="outline">Admin</Badge>
                          )}
                        </div>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {u.email}
                        </p>
                        {subscription?.payment_method === 'manual' && (
                          <p className="text-xs text-purple-600 mt-1">
                            Liberado manualmente
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            if (isPro) {
                              deactivateProMutation.mutate({ userId: u.id });
                            } else {
                              activateProMutation.mutate({ userId: u.id, userEmail: u.email });
                            }
                          }}
                          disabled={activateProMutation.isPending || deactivateProMutation.isPending}
                          className={isPro 
                            ? "bg-green-600 hover:bg-green-700 text-white"
                            : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                          }
                        >
                          {isPro ? (
                            <>
                              <CheckCircle className="w-4 h-4 mr-1 fill-white" />
                              Pro Ativo (clique para remover)
                            </>
                          ) : (
                            <>
                              <Crown className="w-4 h-4 mr-1" />
                              Ativar Pro
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}

                {filteredUsers.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Nenhum usuário encontrado
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}