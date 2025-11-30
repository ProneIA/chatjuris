import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Crown,
  Calendar,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Loader2,
  RefreshCw,
  Star,
  Zap,
  Shield
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusConfig = {
  active: { label: "Ativa", color: "bg-green-500/20 text-green-400 border-green-500/30", icon: CheckCircle2 },
  pending: { label: "Pendente", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: Clock },
  cancelled: { label: "Cancelada", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: XCircle },
  expired: { label: "Expirada", color: "bg-gray-500/20 text-gray-400 border-gray-500/30", icon: AlertCircle },
  trial: { label: "Teste", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: Star },
};

const paymentStatusConfig = {
  paid: { label: "Pago", color: "bg-green-500/20 text-green-400" },
  pending: { label: "Pendente", color: "bg-yellow-500/20 text-yellow-400" },
  failed: { label: "Falhou", color: "bg-red-500/20 text-red-400" },
  cancelled: { label: "Cancelado", color: "bg-gray-500/20 text-gray-400" },
};

export default function MySubscription({ theme = 'light' }) {
  const isDark = theme === 'dark';
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: subscription, isLoading } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const subs = await base44.entities.Subscription.filter({ user_id: user.id });
      return subs[0] || null;
    },
    enabled: !!user?.id
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      if (!subscription) return;
      
      // Atualiza status para cancelado
      return base44.entities.Subscription.update(subscription.id, {
        status: "cancelled",
        plan: "free",
        daily_actions_limit: 5,
        end_date: new Date().toISOString().split('T')[0]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      setShowCancelDialog(false);
    }
  });

  const isPro = subscription?.plan === 'pro' && subscription?.status === 'active';
  const statusInfo = statusConfig[subscription?.status] || statusConfig.pending;
  const StatusIcon = statusInfo.icon;

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
              Gerencie seu plano e pagamentos
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['subscription'] })}
            className={isDark ? 'border-neutral-800 text-white hover:bg-neutral-900' : ''}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>

        {/* Plano Atual */}
        <Card className={`border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}`}>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Plano Atual
              </CardTitle>
              <Badge className={statusInfo.color}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {statusInfo.label}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-6">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                isPro ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-neutral-800'
              }`}>
                {isPro ? (
                  <Crown className="w-7 h-7 text-white" />
                ) : (
                  <Star className="w-7 h-7 text-neutral-400" />
                )}
              </div>
              <div>
                <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {isPro ? 'Plano Profissional' : 'Plano Gratuito'}
                </h3>
                <p className={isDark ? 'text-neutral-400' : 'text-gray-500'}>
                  {isPro ? 'Acesso ilimitado a todos os recursos' : '5 ações de IA por dia'}
                </p>
              </div>
              <div className="ml-auto text-right">
                <p className={`text-2xl font-light ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  R$ {isPro ? '49,99' : '0,00'}
                </p>
                <p className={`text-sm ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                  /mês
                </p>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className={`p-4 rounded-lg ${isDark ? 'bg-neutral-800' : 'bg-gray-100'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className={`w-4 h-4 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`} />
                  <span className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                    Início
                  </span>
                </div>
                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {subscription?.start_date 
                    ? format(new Date(subscription.start_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                    : '-'}
                </p>
              </div>

              <div className={`p-4 rounded-lg ${isDark ? 'bg-neutral-800' : 'bg-gray-100'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <RefreshCw className={`w-4 h-4 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`} />
                  <span className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                    Próxima Renovação
                  </span>
                </div>
                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {subscription?.next_billing_date 
                    ? format(new Date(subscription.next_billing_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                    : isPro ? 'Mensal' : '-'}
                </p>
              </div>

              <div className={`p-4 rounded-lg ${isDark ? 'bg-neutral-800' : 'bg-gray-100'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Zap className={`w-4 h-4 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`} />
                  <span className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                    Ações Hoje
                  </span>
                </div>
                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {subscription?.daily_actions_used || 0} / {isPro ? '∞' : (subscription?.daily_actions_limit || 5)}
                </p>
              </div>
            </div>

            {/* Benefícios */}
            {isPro && (
              <div className={`p-4 rounded-lg mb-6 ${isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'}`}>
                <h4 className={`font-medium mb-3 ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                  Seus Benefícios Pro
                </h4>
                <div className="grid md:grid-cols-2 gap-2">
                  {[
                    'Ações de IA ilimitadas',
                    'Clientes ilimitados',
                    'Processos ilimitados',
                    'Documentos ilimitados',
                    'Todos os modos de IA',
                    'Análise de documentos LEXIA',
                    'Jurisprudência completa',
                    'Suporte prioritário'
                  ].map((benefit, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <CheckCircle2 className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                      <span className={`text-sm ${isDark ? 'text-amber-200' : 'text-amber-800'}`}>{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              {!isPro ? (
                <Button 
                  className="bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700"
                  onClick={() => window.location.href = '/Pricing'}
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Fazer Upgrade para Pro
                </Button>
              ) : (
                <>
                  {subscription?.payment_external_url && (
                    <Button
                      variant="outline"
                      onClick={() => window.open(subscription.payment_external_url, '_blank')}
                      className={isDark ? 'border-neutral-700 text-white hover:bg-neutral-800' : ''}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Gerenciar no Cakto
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => setShowCancelDialog(true)}
                    className="text-red-500 border-red-500/30 hover:bg-red-500/10"
                  >
                    Cancelar Assinatura
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Histórico de Pagamentos */}
        <Card className={`border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}`}>
          <CardHeader>
            <CardTitle className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <CreditCard className="w-5 h-5 inline mr-2" />
              Informações de Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            {subscription?.cakto_order_id ? (
              <div className="space-y-4">
                <div className={`p-4 rounded-lg ${isDark ? 'bg-neutral-800' : 'bg-gray-100'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Assinatura Mensal - Juris Pro
                      </p>
                      <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                        ID: {subscription.cakto_order_id}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge className={paymentStatusConfig[subscription.payment_status]?.color || 'bg-gray-500/20 text-gray-400'}>
                        {paymentStatusConfig[subscription.payment_status]?.label || 'Pendente'}
                      </Badge>
                      <p className={`text-sm mt-1 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                        R$ 49,99/mês
                      </p>
                    </div>
                  </div>
                </div>

                <div className={`p-4 rounded-lg border ${isDark ? 'bg-neutral-800/50 border-neutral-700' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-start gap-3">
                    <Shield className={`w-5 h-5 mt-0.5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                    <div>
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Pagamento Seguro
                      </p>
                      <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                        Seus pagamentos são processados de forma segura através da plataforma Cakto.
                        Você pode gerenciar sua assinatura, ver faturas e atualizar método de pagamento
                        diretamente no painel do Cakto.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className={`text-center py-8 ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum pagamento registrado</p>
                <p className="text-sm mt-1">
                  Faça upgrade para o plano Pro para começar
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card className={`border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}`}>
          <CardHeader>
            <CardTitle className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Perguntas Frequentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Como funciona a cobrança?
              </h4>
              <p className={`text-sm mt-1 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                A cobrança é mensal e automática. Você será cobrado no mesmo dia de cada mês.
              </p>
            </div>
            <div>
              <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Posso cancelar a qualquer momento?
              </h4>
              <p className={`text-sm mt-1 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                Sim! Você pode cancelar sua assinatura a qualquer momento. O acesso Pro continua até o final do período pago.
              </p>
            </div>
            <div>
              <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                O que acontece se o pagamento falhar?
              </h4>
              <p className={`text-sm mt-1 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                Se o pagamento falhar, você receberá uma notificação e terá alguns dias para regularizar. Após esse período, sua assinatura será suspensa automaticamente.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog de Cancelamento */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className={isDark ? 'bg-neutral-900 border-neutral-800' : ''}>
          <DialogHeader>
            <DialogTitle className={isDark ? 'text-white' : ''}>
              Cancelar Assinatura
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja cancelar sua assinatura Pro? Você perderá acesso a:
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2 py-4">
            {[
              'Ações de IA ilimitadas',
              'Análise de documentos LEXIA',
              'Jurisprudência completa',
              'Templates ilimitados',
              'Calendário inteligente',
              'Suporte prioritário'
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-500" />
                <span className={isDark ? 'text-neutral-300' : 'text-gray-600'}>{item}</span>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
              className={isDark ? 'border-neutral-700' : ''}
            >
              Manter Assinatura
            </Button>
            <Button
              variant="destructive"
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Confirmar Cancelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}