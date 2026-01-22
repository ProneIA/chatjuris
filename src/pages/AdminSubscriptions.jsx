import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Search, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminSubscriptions({ theme = 'light' }) {
  const [user, setUser] = useState(null);
  const [searchEmail, setSearchEmail] = useState("");
  const queryClient = useQueryClient();
  const isDark = theme === 'dark';

  React.useEffect(() => {
    base44.auth.me().then(u => {
      if (u?.role !== 'admin') {
        window.location.href = '/';
      }
      setUser(u);
    }).catch(() => {
      window.location.href = '/';
    });
  }, []);

  const { data: allUsers, isLoading: loadingUsers } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => base44.entities.User.list(),
    enabled: !!user
  });

  const { data: allSubscriptions, isLoading: loadingSubs } = useQuery({
    queryKey: ['admin-subscriptions'],
    queryFn: () => base44.entities.Subscription.list(),
    enabled: !!user
  });

  const activateProMutation = useMutation({
    mutationFn: async ({ userId, userEmail }) => {
      const subs = await base44.entities.Subscription.filter({ user_id: userId });
      
      const proData = {
        user_id: userId,
        plan: 'pro',
        status: 'active',
        daily_actions_limit: 999999,
        daily_actions_used: 0,
        price: 0,
        payment_method: 'manual',
        start_date: new Date().toISOString().split('T')[0],
        last_reset_date: new Date().toISOString().split('T')[0]
      };

      if (subs.length > 0) {
        return base44.entities.Subscription.update(subs[0].id, proData);
      } else {
        return base44.entities.Subscription.create(proData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] });
      toast.success('Plano Pro ativado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao ativar plano Pro');
    }
  });

  const deactivateProMutation = useMutation({
    mutationFn: async ({ userId }) => {
      const subs = await base44.entities.Subscription.filter({ user_id: userId });
      
      if (subs.length > 0) {
        return base44.entities.Subscription.update(subs[0].id, {
          plan: 'free',
          status: 'active',
          daily_actions_limit: 5,
          daily_actions_used: 0,
          price: 0
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] });
      toast.success('Plano alterado para Free');
    },
    onError: () => {
      toast.error('Erro ao alterar plano');
    }
  });

  if (!user || loadingUsers || loadingSubs) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  const subsMap = {};
  (allSubscriptions || []).forEach(sub => {
    subsMap[sub.user_id] = sub;
  });

  const filteredUsers = (allUsers || []).filter(u => 
    u.email.toLowerCase().includes(searchEmail.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(searchEmail.toLowerCase())
  );

  return (
    <div className={`min-h-screen ${isDark ? 'bg-neutral-950' : 'bg-gray-50'} p-6`}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Crown className="w-8 h-8 text-purple-600" />
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Gerenciar Assinaturas
          </h1>
        </div>

        <Card className={`mb-6 ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}`}>
          <CardHeader>
            <CardTitle className={isDark ? 'text-white' : 'text-gray-900'}>
              Buscar Usuário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Buscar por email ou nome..."
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                className={`pl-10 ${isDark ? 'bg-neutral-800 border-neutral-700 text-white' : ''}`}
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {filteredUsers.map(u => {
            const subscription = subsMap[u.id];
            const isPro = subscription?.plan === 'pro' && subscription?.status === 'active';

            return (
              <Card key={u.id} className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {u.full_name || 'Sem nome'}
                        </h3>
                        {isPro && (
                          <Badge className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                            <Crown className="w-3 h-3 mr-1" />
                            PRO
                          </Badge>
                        )}
                        {!isPro && (
                          <Badge variant="outline" className={isDark ? 'text-gray-400' : ''}>
                            FREE
                          </Badge>
                        )}
                      </div>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {u.email}
                      </p>
                      {subscription && (
                        <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                          Criado em: {new Date(u.created_date).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {isPro ? (
                        <Button
                          onClick={() => deactivateProMutation.mutate({ userId: u.id })}
                          disabled={deactivateProMutation.isPending}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Remover Pro
                        </Button>
                      ) : (
                        <Button
                          onClick={() => activateProMutation.mutate({ userId: u.id, userEmail: u.email })}
                          disabled={activateProMutation.isPending}
                          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                          size="sm"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Ativar Pro
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {filteredUsers.length === 0 && (
            <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Nenhum usuário encontrado
            </div>
          )}
        </div>
      </div>
    </div>
  );
}