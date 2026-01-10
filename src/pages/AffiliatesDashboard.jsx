import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, DollarSign, TrendingUp, Copy, CheckCircle, 
  Clock, Ban, ExternalLink, Download 
} from "lucide-react";
import { toast } from "sonner";
import AffiliateRegistration from "@/components/affiliates/AffiliateRegistration";
import AffiliateList from "@/components/affiliates/AffiliateList";
import CommissionsList from "@/components/affiliates/CommissionsList";
import WithdrawalRequests from "@/components/affiliates/WithdrawalRequests";

export default function AffiliatesDashboard({ theme = 'light' }) {
  const isDark = theme === 'dark';
  const [user, setUser] = useState(null);
  const [userAffiliate, setUserAffiliate] = useState(null);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    base44.auth.me().then(async (u) => {
      setUser(u);
      if (u?.email) {
        // Verificar se o usuário é um afiliado
        const affiliates = await base44.entities.Affiliate.filter({ user_email: u.email });
        setUserAffiliate(affiliates[0] || null);
      }
    }).catch(() => {});
  }, []);

  const isAdmin = user?.role === 'admin';
  const isAffiliate = !!userAffiliate;
  const isOwner = user?.email === 'your-email@example.com'; // Substitua pelo seu email de criador

  // Redirecionar se não for admin nem afiliado
  React.useEffect(() => {
    if (user && !isAdmin && !isAffiliate) {
      window.location.href = '/';
    }
  }, [user, isAdmin, isAffiliate]);

  // Owner/Admin vê todos, afiliado vê apenas ele mesmo
  const { data: allAffiliates = [] } = useQuery({
    queryKey: ['affiliates', user?.email],
    queryFn: () => {
      if (isOwner) {
        return base44.entities.Affiliate.list('-created_date');
      } else if (isAffiliate) {
        return base44.entities.Affiliate.filter({ user_email: user.email });
      }
      return [];
    },
    enabled: isOwner || isAffiliate
  });

  // Owner vê todas, afiliado vê apenas as suas
  const { data: allCommissions = [] } = useQuery({
    queryKey: ['allCommissions', user?.email],
    queryFn: () => {
      if (isOwner) {
        return base44.entities.AffiliateCommission.list('-created_date');
      } else if (isAffiliate) {
        return base44.entities.AffiliateCommission.filter({ affiliate_id: userAffiliate.id });
      }
      return [];
    },
    enabled: (isOwner || isAffiliate) && !!user?.email
  });

  // Solicitações de saque
  const { data: withdrawalRequests = [] } = useQuery({
    queryKey: ['withdrawalRequests', user?.email],
    queryFn: () => {
      if (isOwner) {
        return base44.entities.WithdrawalRequest.list('-created_date');
      } else if (isAffiliate) {
        return base44.entities.WithdrawalRequest.filter({ affiliate_email: user.email });
      }
      return [];
    },
    enabled: (isOwner || isAffiliate) && !!user?.email
  });



  const stats = {
    totalAffiliates: allAffiliates.length,
    activeAffiliates: allAffiliates.filter(a => a.status === 'active').length,
    totalCommissions: allCommissions.reduce((sum, c) => sum + c.commission_amount, 0),
    pendingCommissions: allCommissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.commission_amount, 0),
    pendingWithdrawals: withdrawalRequests.filter(w => w.status === 'pending').length
  };

  if (!isOwner && !isAffiliate) {
    return null;
  }

  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {isOwner ? 'Gestão de Afiliados' : 'Meu Painel de Afiliado'}
          </h1>
          <p className={isDark ? 'text-neutral-400' : 'text-gray-600'}>
            {isOwner ? 'Gerencie afiliados e comissões' : 'Acompanhe suas vendas e comissões'}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                    Total Afiliados
                  </p>
                  <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {stats.totalAffiliates}
                  </p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                    Afiliados Ativos
                  </p>
                  <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {stats.activeAffiliates}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                    Total Comissões
                  </p>
                  <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    R$ {stats.totalCommissions.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                    Pendente
                  </p>
                  <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    R$ {stats.pendingCommissions.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>



        {/* Tabs */}
        <Tabs defaultValue={isAffiliate && !isOwner ? "my_data" : "affiliates"} className="w-full">
          <TabsList className={isDark ? 'bg-neutral-900' : 'bg-gray-100'}>
            {isOwner && <TabsTrigger value="affiliates">Afiliados</TabsTrigger>}
            {isOwner && <TabsTrigger value="commissions">Comissões</TabsTrigger>}
            {isOwner && (
              <TabsTrigger value="withdrawals">
                Saques {stats.pendingWithdrawals > 0 && `(${stats.pendingWithdrawals})`}
              </TabsTrigger>
            )}
            {isOwner && <TabsTrigger value="register">Novo Afiliado</TabsTrigger>}
            {isAffiliate && !isOwner && <TabsTrigger value="my_data">Meu Link</TabsTrigger>}
            {isAffiliate && !isOwner && <TabsTrigger value="commissions">Minhas Comissões</TabsTrigger>}
            {isAffiliate && !isOwner && <TabsTrigger value="withdrawals">Meus Saques</TabsTrigger>}
          </TabsList>

          {isOwner && (
            <TabsContent value="affiliates">
              <AffiliateList affiliates={allAffiliates} theme={theme} isOwner={isOwner} />
            </TabsContent>
          )}

          {isOwner && (
            <TabsContent value="commissions">
              <CommissionsList 
                commissions={allCommissions} 
                isAdmin={isOwner}
                theme={theme} 
              />
            </TabsContent>
          )}

          {isOwner && (
            <TabsContent value="withdrawals">
              <WithdrawalRequests 
                requests={withdrawalRequests} 
                isOwner={isOwner}
                theme={theme} 
              />
            </TabsContent>
          )}

          {isOwner && (
            <TabsContent value="register">
              <AffiliateRegistration theme={theme} />
            </TabsContent>
          )}

          {isAffiliate && !isOwner && (
            <>
              <TabsContent value="my_data">
                <Card className="bg-white border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-gray-900">
                      Seu Link de Indicação
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-lg border border-purple-200">
                        <p className="text-sm text-gray-600 mb-3">Compartilhe este link para ganhar comissões:</p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 bg-white px-4 py-3 rounded border border-gray-300 text-sm text-gray-900">
                            https://chatjuris.com/Pricing?ref={userAffiliate?.affiliate_code}
                          </code>
                          <Button
                            onClick={() => {
                              navigator.clipboard.writeText(`https://chatjuris.com/Pricing?ref=${userAffiliate?.affiliate_code}`);
                              toast.success('Link copiado!');
                            }}
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            Copiar Link
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white border border-gray-200 p-4 rounded">
                          <p className="text-sm text-gray-600">Código</p>
                          <p className="font-mono font-bold text-gray-900 text-lg mt-1">
                            {userAffiliate?.affiliate_code}
                          </p>
                        </div>
                        <div className="bg-white border border-gray-200 p-4 rounded">
                          <p className="text-sm text-gray-600">Taxa de Comissão</p>
                          <p className="font-bold text-green-600 text-lg mt-1">
                            {userAffiliate?.commission_rate}%
                          </p>
                        </div>
                        <div className="bg-white border border-gray-200 p-4 rounded">
                          <p className="text-sm text-gray-600">Total de Vendas</p>
                          <p className="font-bold text-gray-900 text-lg mt-1">
                            {userAffiliate?.total_sales || 0}
                          </p>
                        </div>
                        <div className="bg-white border border-gray-200 p-4 rounded">
                          <p className="text-sm text-gray-600">Disponível para Saque</p>
                          <p className="font-bold text-green-600 text-lg mt-1">
                            R$ {((userAffiliate?.total_commission || 0) - (userAffiliate?.total_paid || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="commissions">
                <CommissionsList 
                  commissions={allCommissions} 
                  isAdmin={false}
                  theme={theme} 
                />
              </TabsContent>

              <TabsContent value="withdrawals">
                <WithdrawalRequests 
                  requests={withdrawalRequests} 
                  isOwner={false}
                  affiliate={userAffiliate}
                  theme={theme} 
                />
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </div>
  );
}