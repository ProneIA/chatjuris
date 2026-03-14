import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Users, DollarSign, TrendingUp, Copy, CheckCircle,
  Clock, Link as LinkIcon, Gift, ShoppingCart, BarChart3
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
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    base44.auth.me().then(async (u) => {
      setUser(u);
      if (u?.email) {
        const affiliates = await base44.entities.Affiliate.filter({ user_email: u.email });
        setUserAffiliate(affiliates[0] || null);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const isAdmin = user?.role === 'admin';
  const isAffiliate = !!userAffiliate;

  React.useEffect(() => {
    if (!loading && user && !isAdmin && !isAffiliate) {
      window.location.href = '/Dashboard';
    }
  }, [user, isAdmin, isAffiliate, loading]);

  const { data: allAffiliates = [] } = useQuery({
    queryKey: ['affiliates', user?.email],
    queryFn: () => {
      if (isAdmin) return base44.entities.Affiliate.list('-created_date');
      if (isAffiliate) return base44.entities.Affiliate.filter({ user_email: user.email });
      return [];
    },
    enabled: !!user && (isAdmin || isAffiliate)
  });

  const { data: allCommissions = [] } = useQuery({
    queryKey: ['allCommissions', user?.email],
    queryFn: () => {
      if (isAdmin) return base44.entities.AffiliateCommission.list('-created_date');
      if (isAffiliate && userAffiliate) return base44.entities.AffiliateCommission.filter({ affiliate_id: userAffiliate.id });
      return [];
    },
    enabled: !!user && (isAdmin || isAffiliate)
  });

  const { data: withdrawalRequests = [] } = useQuery({
    queryKey: ['withdrawalRequests', user?.email],
    queryFn: () => {
      if (isAdmin) return base44.entities.WithdrawalRequest.list('-created_date');
      if (isAffiliate) return base44.entities.WithdrawalRequest.filter({ affiliate_email: user.email });
      return [];
    },
    enabled: !!user && (isAdmin || isAffiliate)
  });

  // Stats para admin
  const adminStats = {
    totalAffiliates: allAffiliates.length,
    activeAffiliates: allAffiliates.filter(a => a.status === 'active').length,
    totalCommissions: allCommissions.reduce((sum, c) => sum + (c.commission_amount || 0), 0),
    pendingCommissions: allCommissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + (c.commission_amount || 0), 0),
    pendingWithdrawals: withdrawalRequests.filter(w => w.status === 'pending').length,
    totalSales: allCommissions.length
  };

  // Stats para afiliado
  const affiliateStats = {
    totalSales: allCommissions.length,
    totalEarned: allCommissions.reduce((sum, c) => sum + (c.commission_amount || 0), 0),
    pendingAmount: allCommissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + (c.commission_amount || 0), 0),
    paidAmount: allCommissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + (c.commission_amount || 0), 0),
    availableBalance: (userAffiliate?.total_commission || 0) - (userAffiliate?.total_paid || 0),
    pendingWithdrawals: withdrawalRequests.filter(w => w.status === 'pending').length
  };

  const baseUrl = window.location.origin;
  const affiliateLink = userAffiliate ? `${baseUrl}/Pricing?ref=${userAffiliate.affiliate_code}` : '';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin && !isAffiliate) return null;

  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className={`text-3xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {isAdmin ? '🤝 Gestão de Afiliados' : '🎯 Meu Painel de Afiliado'}
          </h1>
          <p className={isDark ? 'text-neutral-400' : 'text-gray-600'}>
            {isAdmin
              ? 'Gerencie afiliados, comissões e saques do sistema'
              : `Bem-vindo, ${userAffiliate?.name}! Acompanhe suas vendas e comissões.`}
          </p>
        </div>

        {/* Stats - Admin */}
        {isAdmin && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Afiliados', value: adminStats.totalAffiliates, sub: `${adminStats.activeAffiliates} ativos`, icon: Users, color: 'text-blue-600' },
              { label: 'Total Vendas', value: adminStats.totalSales, sub: 'via afiliados', icon: ShoppingCart, color: 'text-indigo-600' },
              { label: 'Total Comissões', value: `R$ ${adminStats.totalCommissions.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, sub: 'acumulado', icon: DollarSign, color: 'text-green-600' },
              { label: 'Saques Pendentes', value: adminStats.pendingWithdrawals, sub: 'aguardando aprovação', icon: Clock, color: 'text-orange-600' }
            ].map((stat, i) => (
              <Card key={i} className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className={`text-xs font-medium mb-1 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>{stat.label}</p>
                      <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{stat.value}</p>
                      <p className={`text-xs mt-1 ${isDark ? 'text-neutral-500' : 'text-gray-400'}`}>{stat.sub}</p>
                    </div>
                    <stat.icon className={`w-8 h-8 ${stat.color}`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Stats - Afiliado */}
        {isAffiliate && !isAdmin && (
          <>
            {/* Link de afiliado em destaque */}
            <Card className="bg-gradient-to-r from-purple-600 to-indigo-600 border-0 text-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <LinkIcon className="w-5 h-5" />
                  <p className="font-semibold">Seu Link de Indicação</p>
                  <Badge className="bg-white/20 text-white border-0">Cupom: {userAffiliate?.affiliate_code}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white/10 px-4 py-3 rounded-lg text-sm break-all">
                    {affiliateLink}
                  </code>
                  <Button
                    size="sm"
                    className="bg-white text-purple-700 hover:bg-gray-100 shrink-0"
                    onClick={() => {
                      navigator.clipboard.writeText(affiliateLink);
                      toast.success('Link copiado!');
                    }}
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copiar
                  </Button>
                </div>
                <p className="text-white/70 text-xs mt-2">
                  Quando alguém usar seu link ou cupom <strong>{userAffiliate?.affiliate_code}</strong> no checkout, receberá {userAffiliate?.commission_rate}% de desconto e você ganhará {userAffiliate?.commission_rate}% de comissão após o pagamento confirmado.
                </p>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Vendas Realizadas', value: affiliateStats.totalSales, icon: ShoppingCart, color: 'text-blue-600' },
                { label: 'Total Ganho', value: `R$ ${affiliateStats.totalEarned.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: TrendingUp, color: 'text-green-600' },
                { label: 'Disponível p/ Saque', value: `R$ ${affiliateStats.availableBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: DollarSign, color: 'text-purple-600' },
                { label: 'Já Recebido', value: `R$ ${affiliateStats.paidAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: CheckCircle, color: 'text-emerald-600' }
              ].map((stat, i) => (
                <Card key={i} className="bg-white border-gray-200">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-medium mb-1 text-gray-500">{stat.label}</p>
                        <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                      </div>
                      <stat.icon className={`w-7 h-7 ${stat.color}`} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Tabs */}
        <Tabs defaultValue={isAffiliate && !isAdmin ? "commissions" : "affiliates"} className="w-full">
          <TabsList className={isDark ? 'bg-neutral-900' : 'bg-gray-100'}>
            {isAdmin && <TabsTrigger value="affiliates">Afiliados</TabsTrigger>}
            {isAdmin && <TabsTrigger value="commissions">Comissões</TabsTrigger>}
            {isAdmin && (
              <TabsTrigger value="withdrawals">
                Saques {adminStats.pendingWithdrawals > 0 && <Badge className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0">{adminStats.pendingWithdrawals}</Badge>}
              </TabsTrigger>
            )}
            {isAdmin && <TabsTrigger value="register">+ Novo Afiliado</TabsTrigger>}
            {isAffiliate && !isAdmin && <TabsTrigger value="commissions">Minhas Vendas</TabsTrigger>}
            {isAffiliate && !isAdmin && (
              <TabsTrigger value="withdrawals">
                Saques {affiliateStats.pendingWithdrawals > 0 && <Badge className="ml-1 bg-orange-500 text-white text-xs px-1.5 py-0">{affiliateStats.pendingWithdrawals}</Badge>}
              </TabsTrigger>
            )}
          </TabsList>

          {isAdmin && (
            <TabsContent value="affiliates">
              <AffiliateList affiliates={allAffiliates} theme={theme} isOwner={isAdmin} />
            </TabsContent>
          )}

          {(isAdmin || isAffiliate) && (
            <TabsContent value="commissions">
              <CommissionsList
                commissions={allCommissions}
                isAdmin={isAdmin}
                theme={theme}
              />
            </TabsContent>
          )}

          {(isAdmin || isAffiliate) && (
            <TabsContent value="withdrawals">
              <WithdrawalRequests
                requests={withdrawalRequests}
                isOwner={isAdmin}
                affiliate={userAffiliate}
                theme={theme}
              />
            </TabsContent>
          )}

          {isAdmin && (
            <TabsContent value="register">
              <AffiliateRegistration theme={theme} isOwner={isAdmin} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}