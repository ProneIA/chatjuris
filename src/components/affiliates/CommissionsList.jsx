import React from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function CommissionsList({ commissions, isAdmin, theme = 'light' }) {
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);
  
  const isOwner = user?.role === 'admin';
  const isDark = theme === 'dark';
  const queryClient = useQueryClient();
  const [affiliates, setAffiliates] = React.useState({});

  // Carregar dados dos afiliados
  React.useEffect(() => {
    const loadAffiliates = async () => {
      try {
        const allAffiliates = await base44.entities.Affiliate.list();
        const affiliatesMap = {};
        allAffiliates.forEach(a => {
          affiliatesMap[a.id] = a;
        });
        setAffiliates(affiliatesMap);
      } catch (error) {
        console.error('Erro ao carregar afiliados:', error);
      }
    };
    loadAffiliates();
  }, []);

  const markAsPaidMutation = useMutation({
    mutationFn: async ({ commissionId, affiliateId, affiliateEmail, affiliateName, commissionAmount }) => {
      const commission = await base44.entities.AffiliateCommission.update(commissionId, {
        status: 'paid',
        payment_date: new Date().toISOString().split('T')[0]
      });

      // Atualizar total pago do afiliado
      const affiliate = await base44.entities.Affiliate.filter({ id: affiliateId });
      if (affiliate.length > 0) {
        const currentPaid = affiliate[0].total_paid || 0;
        await base44.entities.Affiliate.update(affiliateId, {
          total_paid: currentPaid + commission.commission_amount
        });
      }

      // Enviar notificação automática
      try {
        await base44.functions.invoke('notifyCommissionPayment', {
          affiliate_email: affiliateEmail,
          affiliate_name: affiliateName,
          commission_amount: commissionAmount,
          payment_date: new Date().toISOString().split('T')[0]
        });
      } catch (error) {
        console.error('Erro ao enviar notificação:', error);
      }

      return commission;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allCommissions'] });
      queryClient.invalidateQueries({ queryKey: ['myCommissions'] });
      queryClient.invalidateQueries({ queryKey: ['affiliates'] });
      toast.success("Comissão marcada como paga!");
    }
  });

  const getStatusBadge = (status) => {
    const variants = {
      paid: { icon: CheckCircle, color: 'bg-green-100 text-green-800', label: 'Pago' },
      pending: { icon: Clock, color: 'bg-yellow-100 text-yellow-800', label: 'Pendente' },
      cancelled: { icon: XCircle, color: 'bg-red-100 text-red-800', label: 'Cancelado' }
    };
    const variant = variants[status] || variants.pending;
    const Icon = variant.icon;
    
    return (
      <Badge className={variant.color}>
        <Icon className="w-3 h-3 mr-1" />
        {variant.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-3">
      {commissions.map((commission) => (
        <Card key={commission.id} className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <code className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-neutral-800' : 'bg-gray-100'}`}>
                    {commission.affiliate_code}
                  </code>
                  {getStatusBadge(commission.status)}
                </div>
                
                <div className="grid md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className={isDark ? 'text-neutral-400' : 'text-gray-600'}>Cliente:</span>{' '}
                    <span className={isDark ? 'text-neutral-300' : 'text-gray-700'}>
                      {commission.customer_email}
                    </span>
                  </div>
                  <div>
                    <span className={isDark ? 'text-neutral-400' : 'text-gray-600'}>Valor Assinatura:</span>{' '}
                    <span className={isDark ? 'text-neutral-300' : 'text-gray-700'}>
                      R$ {commission.subscription_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div>
                    <span className={isDark ? 'text-neutral-400' : 'text-gray-600'}>Taxa:</span>{' '}
                    <span className="text-green-600 font-semibold">
                      {commission.commission_rate}%
                    </span>
                  </div>
                  <div>
                    <span className={isDark ? 'text-neutral-400' : 'text-gray-600'}>Comissão:</span>{' '}
                    <span className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      R$ {commission.commission_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-2 text-xs">
                  <span className={isDark ? 'text-neutral-500' : 'text-gray-500'}>
                    Criado em {new Date(commission.created_date).toLocaleDateString('pt-BR')}
                  </span>
                  {commission.payment_date && (
                    <span className="text-green-600">
                      Pago em {new Date(commission.payment_date).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>
              </div>

              {isOwner && commission.status === 'pending' && (
                <Button
                  size="sm"
                  onClick={() => {
                    const affiliate = affiliates[commission.affiliate_id];
                    markAsPaidMutation.mutate({ 
                      commissionId: commission.id,
                      affiliateId: commission.affiliate_id,
                      affiliateEmail: affiliate?.user_email || '',
                      affiliateName: affiliate?.name || 'Afiliado',
                      commissionAmount: commission.commission_amount
                    });
                  }}
                  disabled={markAsPaidMutation.isPending}
                >
                  Marcar como Pago
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {commissions.length === 0 && (
        <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}>
          <CardContent className="p-8 text-center">
            <p className={isDark ? 'text-neutral-400' : 'text-gray-600'}>
              Nenhuma comissão registrada ainda.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}