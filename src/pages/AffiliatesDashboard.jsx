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
  const queryClient = useQueryClient();

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const isAdmin = user?.role === 'admin';

  // Redirecionar se não for admin
  React.useEffect(() => {
    if (user && !isAdmin) {
      window.location.href = '/';
    }
  }, [user, isAdmin]);

  const { data: allAffiliates = [] } = useQuery({
    queryKey: ['affiliates'],
    queryFn: () => base44.entities.Affiliate.list('-created_date'),
    enabled: isAdmin
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

  const stats = {
    totalAffiliates: allAffiliates.length,
    activeAffiliates: allAffiliates.filter(a => a.status === 'active').length,
    totalCommissions: allCommissions.reduce((sum, c) => sum + c.commission_amount, 0),
    pendingCommissions: allCommissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.commission_amount, 0)
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Gestão de Afiliados
          </h1>
          <p className={isDark ? 'text-neutral-400' : 'text-gray-600'}>
            Gerencie afiliados e comissões
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
        <Tabs defaultValue="affiliates" className="w-full">
          <TabsList className={isDark ? 'bg-neutral-900' : 'bg-gray-100'}>
            <TabsTrigger value="affiliates">Afiliados</TabsTrigger>
            <TabsTrigger value="commissions">Comissões</TabsTrigger>
            <TabsTrigger value="register">Novo Afiliado</TabsTrigger>
          </TabsList>

          <TabsContent value="affiliates">
            <AffiliateList affiliates={allAffiliates} theme={theme} />
          </TabsContent>

          <TabsContent value="commissions">
            <CommissionsList 
              commissions={allCommissions} 
              isAdmin={true}
              theme={theme} 
            />
          </TabsContent>

          <TabsContent value="register">
            <AffiliateRegistration theme={theme} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}