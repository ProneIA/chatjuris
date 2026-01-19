import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Crown, 
  Calendar, 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Loader2,
  ExternalLink,
  RefreshCw,
  Star
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusConfig = {
  active: { label: "Ativa", color: "bg-green-500", icon: CheckCircle },
  pending: { label: "Pendente", color: "bg-yellow-500", icon: Clock },
  cancelled: { label: "Cancelada", color: "bg-red-500", icon: XCircle },
  expired: { label: "Expirada", color: "bg-gray-500", icon: AlertTriangle },
  trial: { label: "Trial", color: "bg-blue-500", icon: Star },
};

const paymentStatusConfig = {
  paid: { label: "Pago", color: "text-green-600 bg-green-50" },
  pending: { label: "Pendente", color: "text-yellow-600 bg-yellow-50" },
  failed: { label: "Falhou", color: "text-red-600 bg-red-50" },
  cancelled: { label: "Cancelado", color: "text-gray-600 bg-gray-50" },
};

export default function MySubscription({ theme = 'light' }) {
  const isDark = theme === 'dark';
  const [user, setUser] = useState(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: subscription, isLoading, refetch } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const subs = await base44.entities.Subscription.filter({ user_id: user.id });
      return subs[0] || null;
    },
    enabled: !!user?.id
  });

  const { data: paymentHistory, isLoading: loadingHistory } = useQuery({
    queryKey: ['payment-history', subscription?.id],
    queryFn: async () => {
      if (!subscription?.cakto_customer_id) return [];
      try {
        const response = await base44.functions.invoke('caktoSubscription', {
          action: 'history',
          customerId: subscription.cakto_customer_id
        });
        return response.data?.payments || [];
      } catch {
        return [];
      }
    },
    enabled: !!subscription?.cakto_customer_id
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      if (subscription?.cakto_order_id) {
        await base44.functions.invoke('caktoSubscription', {
          action: 'cancel',
          orderId: subscription.cakto_order_id
        });
      }
      
      return base44.entities.Subscription.update(subscription.id, {
        status: 'cancelled',
        plan: 'free',
        daily_actions_limit: 5,
        daily_actions_used: 0
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      setShowCancelDialog(false);
    }
  });

  const isPro = (subscription?.plan?.startsWith('pro') || subscription?.plan === 'pro') && subscription?.status === 'active';
  const isMonthly = subscription?.plan === 'pro_monthly';
  const isYearly = subscription?.plan === 'pro_yearly';
  const StatusIcon = statusConfig[subscription?.status]?.icon || Clock;

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-black' : 'bg-gray-50'}`}>
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen py-8 px-4 ${isDark ? 'bg-black' : 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-2xl font-light ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Minha Assinatura
            </h1>
            <p className={`mt-1 ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
              Gerencie sua assinatura e pagamentos
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className={isDark ? 'border-neutral-700 text-white hover:bg-neutral-800' : ''}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>

        {/* Subscription Card */}
        <Card className={`${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  isPro ? 'bg-gradient-to-br from-amber-400 to-amber-600' : 'bg-gray-200'
                }`}>
                  <Crown className={`w-6 h-6 ${isPro ? 'text-white' : 'text-gray-500'}`} />
                </div>
                <div>
                  <CardTitle className={isDark ? 'text-white' : ''}>
                    Plano {isPro ? (isYearly ? 'Profissional Anual' : 'Profissional Mensal') : 'Gratuito'}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={`${statusConfig[subscription?.status || 'active']?.color} text-white`}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {statusConfig[subscription?.status || 'active']?.label}
                    </Badge>
                  </div>
                </div>
              </div>
              
              {isPro && (
                <div className={`text-right ${isDark ? 'text-white' : ''}`}>
                  {isMonthly && (
                    <>
                      <p className="text-2xl font-light">R$ 119,90</p>
                      <p className={`text-sm ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>/mês</p>
                    </>
                  )}
                  {isYearly && (
                    <>
                      <p className="text-2xl font-light">R$ 99,90</p>
                      <p className={`text-sm ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>/mês</p>
                      <p className={`text-xs ${isDark ? 'text-neutral-600' : 'text-gray-400'} mt-1`}>
                        R$ 1.198,80/ano
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Subscription Details */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className={`p-4 rounded-lg ${isDark ? 'bg-neutral-800' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className={`w-4 h-4 ${isDark ? 'text-neutral-400' : 'text-gray-400'}`} />
                  <span className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                    Início
                  </span>
                </div>
                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {subscription?.start_date 
                    ? format(new Date(subscription.start_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                    : '-'
                  }
                </p>
              </div>

              <div className={`p-4 rounded-lg ${isDark ? 'bg-neutral-800' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <RefreshCw className={`w-4 h-4 ${isDark ? 'text-neutral-400' : 'text-gray-400'}`} />
                  <span className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                    Próxima Renovação
                  </span>
                </div>
                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {subscription?.next_billing_date 
                    ? format(new Date(subscription.next_billing_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                    : isPro ? 'Renovação automática' : '-'
                  }
                </p>
              </div>

              <div className={`p-4 rounded-lg ${isDark ? 'bg-neutral-800' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className={`w-4 h-4 ${isDark ? 'text-neutral-400' : 'text-gray-400'}`} />
                  <span className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                    Pagamento
                  </span>
                </div>
                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {subscription?.payment_method === 'pix' ? 'PIX' : 
                   subscription?.payment_method === 'credit_card' ? 'Cartão de Crédito' : 
                   subscription?.payment_method || 'Não definido'}
                </p>
              </div>
            </div>

            {/* Usage Info for Free Plan */}
            {!isPro && (
              <div className={`p-4 rounded-lg border ${isDark ? 'border-neutral-700 bg-neutral-800/50' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className={isDark ? 'text-white' : 'text-gray-900'}>Uso Diário de IA</span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {subscription?.daily_actions_used || 0} / {subscription?.daily_actions_limit || 5}
                  </span>
                </div>
                <div className={`w-full h-2 rounded-full ${isDark ? 'bg-neutral-700' : 'bg-gray-200'}`}>
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
                    style={{ width: `${((subscription?.daily_actions_used || 0) / (subscription?.daily_actions_limit || 5)) * 100}%` }}
                  />
                </div>
                <p className={`text-sm mt-2 ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                  Resets diariamente à meia-noite
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              {!isPro ? (
                <Link to={createPageUrl('Pricing')}>
                  <Button className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700">
                    <Crown className="w-4 h-4 mr-2" />
                    Fazer Upgrade para Pro
                  </Button>
                </Link>
              ) : (
                <>
                  {subscription?.payment_external_url && (
                    <a href={subscription.payment_external_url} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" className={isDark ? 'border-neutral-700 text-white hover:bg-neutral-800' : ''}>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Gerenciar no Cakto
                      </Button>
                    </a>
                  )}
                  <Button 
                    variant="outline" 
                    className="text-red-500 border-red-200 hover:bg-red-50"
                    onClick={() => setShowCancelDialog(true)}
                  >
                    Cancelar Assinatura
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payment History */}
        {isPro && (
          <Card className={`${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}`}>
            <CardHeader>
              <CardTitle className={isDark ? 'text-white' : ''}>Histórico de Pagamentos</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : paymentHistory && paymentHistory.length > 0 ? (
                <div className="space-y-3">
                  {paymentHistory.map((payment, index) => (
                    <div 
                      key={index}
                      className={`flex items-center justify-between p-4 rounded-lg ${isDark ? 'bg-neutral-800' : 'bg-gray-50'}`}
                    >
                      <div className="flex items-center gap-3">
                        <CreditCard className={`w-5 h-5 ${isDark ? 'text-neutral-400' : 'text-gray-400'}`} />
                        <div>
                          <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            R$ {payment.amount?.toFixed(2).replace('.', ',')}
                          </p>
                          <p className={`text-sm ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                            {payment.date ? format(new Date(payment.date), "dd/MM/yyyy", { locale: ptBR }) : '-'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={paymentStatusConfig[payment.status]?.color || 'bg-gray-100'}>
                          {paymentStatusConfig[payment.status]?.label || payment.status}
                        </Badge>
                        {payment.invoice_url && (
                          <a href={payment.invoice_url} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`text-center py-8 ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                  <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum pagamento registrado</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Pro Benefits */}
        {isPro && (
          <Card className={`${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}`}>
            <CardHeader>
              <CardTitle className={isDark ? 'text-white' : ''}>Seus Benefícios Pro</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-3">
                {[
                  'Ações de IA ilimitadas',
                  'Clientes ilimitados',
                  'Processos ilimitados',
                  'Documentos ilimitados',
                  'Equipes e Workspace',
                  'Jurisprudência completa',
                  'Templates ilimitados',
                  'Calendário inteligente',
                  'Análise de documentos LEXIA',
                  'Suporte prioritário'
                ].map((benefit, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className={isDark ? 'text-neutral-300' : 'text-gray-700'}>{benefit}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className={isDark ? 'bg-neutral-900 border-neutral-800' : ''}>
          <DialogHeader>
            <DialogTitle className={isDark ? 'text-white' : ''}>Cancelar Assinatura</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja cancelar sua assinatura Pro? Você perderá acesso a todos os recursos premium e voltará para o plano gratuito com limite de 5 ações de IA por dia.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowCancelDialog(false)}
              className={isDark ? 'border-neutral-700 text-white hover:bg-neutral-800' : ''}
            >
              Manter Assinatura
            </Button>
            <Button 
              variant="destructive"
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Cancelando...
                </>
              ) : (
                'Confirmar Cancelamento'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}