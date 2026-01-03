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

  // Redirecionar se não for admin nem afiliado
  React.useEffect(() => {
    if (user && !isAdmin && !isAffiliate) {
      window.location.href = '/';
    }
  }, [user, isAdmin, isAffiliate]);

  // Admin vê todos os afiliados, afiliado vê apenas ele mesmo
  const { data: allAffiliates = [] } = useQuery({
    queryKey: ['affiliates', user?.email],
    queryFn: () => {
      if (isAdmin) {
        return base44.entities.Affiliate.list('-created_date');
      } else if (isAffiliate) {
        return base44.entities.Affiliate.filter({ user_email: user.email });
      }
      return [];
    },
    enabled: isAdmin || isAffiliate
  });

  // Admin vê todas as comissões, afiliado vê apenas as suas
  const { data: allCommissions = [] } = useQuery({
    queryKey: ['allCommissions', user?.email],
    queryFn: () => {
      if (isAdmin) {
        return base44.entities.AffiliateCommission.list('-created_date');
      } else if (isAffiliate) {
        return base44.entities.AffiliateCommission.filter({ affiliate_id: userAffiliate.id });
      }
      return [];
    },
    enabled: (isAdmin || isAffiliate) && !!user?.email
  });



  const stats = {
    totalAffiliates: allAffiliates.length,
    activeAffiliates: allAffiliates.filter(a => a.status === 'active').length,
    totalCommissions: allCommissions.reduce((sum, c) => sum + c.commission_amount, 0),
    pendingCommissions: allCommissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.commission_amount, 0)
  };

  if (!isAdmin && !isAffiliate) {
    return null;
  }

  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {isAdmin ? 'Gestão de Afiliados' : 'Meu Painel de Afiliado'}
          </h1>
          <p className={isDark ? 'text-neutral-400' : 'text-gray-600'}>
            {isAdmin ? 'Gerencie afiliados e comissões' : 'Acompanhe suas vendas e comissões'}
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
        <Tabs defaultValue={isAffiliate && !isAdmin ? "commissions" : "affiliates"} className="w-full">
          <TabsList className={isDark ? 'bg-neutral-900' : 'bg-gray-100'}>
            {isAdmin && <TabsTrigger value="affiliates">Afiliados</TabsTrigger>}
            <TabsTrigger value="commissions">Comissões</TabsTrigger>
            {isAdmin && <TabsTrigger value="register">Novo Afiliado</TabsTrigger>}
            {isAffiliate && !isAdmin && <TabsTrigger value="my_data">Meus Dados</TabsTrigger>}
          </TabsList>

          {isAdmin && (
            <TabsContent value="affiliates">
              <AffiliateList affiliates={allAffiliates} theme={theme} />
            </TabsContent>
          )}

          <TabsContent value="commissions">
            <CommissionsList 
              commissions={allCommissions} 
              isAdmin={isAdmin}
              theme={theme} 
            />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="register">
              <AffiliateRegistration theme={theme} />
            </TabsContent>
          )}

          {isAffiliate && !isAdmin && (
            <TabsContent value="my_data">
              <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}>
                <CardHeader>
                  <CardTitle className={isDark ? 'text-white' : 'text-gray-900'}>
                    Meus Dados de Afiliado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>Nome</p>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {userAffiliate?.name}
                        </p>
                      </div>
                      <div>
                        <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>Código</p>
                        <p className={`font-mono font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {userAffiliate?.affiliate_code}
                        </p>
                      </div>
                      <div>
                        <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>Email</p>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {userAffiliate?.user_email}
                        </p>
                      </div>
                      <div>
                        <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>Status</p>
                        <p className={`font-medium ${
                          userAffiliate?.status === 'active' ? 'text-green-600' : 
                          userAffiliate?.status === 'pending' ? 'text-orange-600' : 'text-red-600'
                        }`}>
                          {userAffiliate?.status === 'active' ? 'Ativo' : 
                           userAffiliate?.status === 'pending' ? 'Pendente' : 'Suspenso'}
                        </p>
                      </div>
                      <div>
                        <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>Taxa de Comissão</p>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {userAffiliate?.commission_rate}%
                        </p>
                      </div>
                      <div>
                        <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>Total de Vendas</p>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {userAffiliate?.total_sales || 0}
                        </p>
                      </div>
                      <div>
                        <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>Total Comissões</p>
                        <p className={`font-medium text-green-600`}>
                          R$ {(userAffiliate?.total_commission || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>Total Pago</p>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          R$ {(userAffiliate?.total_paid || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>Chave PIX</p>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {userAffiliate?.pix_key || 'Não cadastrada'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}