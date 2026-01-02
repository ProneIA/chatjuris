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
  const [myAffiliate, setMyAffiliate] = useState(null);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    base44.auth.me().then(async (u) => {
      setUser(u);
      if (u?.email) {
        const affiliates = await base44.entities.Affiliate.filter({ user_email: u.email });
        if (affiliates.length > 0) {
          setMyAffiliate(affiliates[0]);
        }
      }
    });
  }, []);

  const isAdmin = user?.role === 'admin';

  const { data: allAffiliates = [] } = useQuery({
    queryKey: ['affiliates'],
    queryFn: () => base44.entities.Affiliate.list('-created_date'),
    enabled: isAdmin
  });

  const { data: myCommissions = [] } = useQuery({
    queryKey: ['myCommissions', myAffiliate?.id],
    queryFn: () => base44.entities.AffiliateCommission.filter({ affiliate_id: myAffiliate.id }, '-created_date'),
    enabled: !!myAffiliate?.id
  });

  const { data: allCommissions = [] } = useQuery({
    queryKey: ['allCommissions'],
    queryFn: () => base44.entities.AffiliateCommission.list('-created_date'),
    enabled: isAdmin
  });

  const copyAffiliateLink = () => {
    const link = `${window.location.origin}?ref=${myAffiliate.affiliate_code}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copiado!");
  };

  const stats = isAdmin ? {
    totalAffiliates: allAffiliates.length,
    activeAffiliates: allAffiliates.filter(a => a.status === 'active').length,
    totalCommissions: allCommissions.reduce((sum, c) => sum + c.commission_amount, 0),
    pendingCommissions: allCommissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.commission_amount, 0)
  } : {
    totalSales: myAffiliate?.total_sales || 0,
    totalCommission: myAffiliate?.total_commission || 0,
    totalPaid: myAffiliate?.total_paid || 0,
    pending: (myAffiliate?.total_commission || 0) - (myAffiliate?.total_paid || 0)
  };

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
          {isAdmin ? (
            <>
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
            </>
          ) : (
            <>
              <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                        Vendas Geradas
                      </p>
                      <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {stats.totalSales}
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-blue-600" />
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
                        R$ {stats.totalCommission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                        Já Recebido
                      </p>
                      <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        R$ {stats.totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                        A Receber
                      </p>
                      <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        R$ {stats.pending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <Clock className="w-8 h-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Affiliate Link (apenas para afiliados) */}
        {!isAdmin && myAffiliate && (
          <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="w-5 h-5" />
                Seu Link de Afiliado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className={`flex-1 p-3 rounded border ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-gray-50 border-gray-200'}`}>
                  <code className={`text-sm ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                    {window.location.origin}?ref={myAffiliate.affiliate_code}
                  </code>
                </div>
                <Button onClick={copyAffiliateLink}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar
                </Button>
              </div>
              <p className={`text-sm mt-2 ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                Compartilhe este link para ganhar {myAffiliate.commission_rate}% de comissão em cada venda!
              </p>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue={isAdmin ? "affiliates" : "commissions"} className="w-full">
          <TabsList className={isDark ? 'bg-neutral-900' : 'bg-gray-100'}>
            {isAdmin && <TabsTrigger value="affiliates">Afiliados</TabsTrigger>}
            <TabsTrigger value="commissions">Comissões</TabsTrigger>
            {isAdmin && <TabsTrigger value="register">Novo Afiliado</TabsTrigger>}
          </TabsList>

          {isAdmin && (
            <TabsContent value="affiliates">
              <AffiliateList affiliates={allAffiliates} theme={theme} />
            </TabsContent>
          )}

          <TabsContent value="commissions">
            <CommissionsList 
              commissions={isAdmin ? allCommissions : myCommissions} 
              isAdmin={isAdmin}
              theme={theme} 
            />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="register">
              <AffiliateRegistration theme={theme} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}