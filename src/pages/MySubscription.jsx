import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  CreditCard, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Clock,
  Receipt,
  Settings,
  Crown,
  Zap,
  ArrowRight,
  Loader2,
  ExternalLink,
  RefreshCw,
  Ban
} from "lucide-react";
import { toast } from "sonner";

const statusConfig = {
  active: { label: "Ativa", color: "bg-green-100 text-green-800", icon: CheckCircle },
  pending: { label: "Pendente", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  cancelled: { label: "Cancelada", color: "bg-red-100 text-red-800", icon: XCircle },
  expired: { label: "Expirada", color: "bg-gray-100 text-gray-800", icon: AlertCircle },
  trial: { label: "Período de Teste", color: "bg-blue-100 text-blue-800", icon: Zap }
};

const paymentStatusConfig = {
  paid: { label: "Pago", color: "bg-green-100 text-green-800" },
  pending: { label: "Pendente", color: "bg-yellow-100 text-yellow-800" },
  failed: { label: "Falhou", color: "bg-red-100 text-red-800" },
  cancelled: { label: "Cancelado", color: "bg-gray-100 text-gray-800" }
};

export default function MySubscription({ theme = 'light' }) {
  const isDark = theme === 'dark';
  const queryClient = useQueryClient();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [user, setUser] = useState(null);

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Busca status da assinatura via função backend
  const { data: subscriptionData, isLoading, refetch } = useQuery({
    queryKey: ['subscription-status'],
    queryFn: async () => {
      const response = await base44.functions.invoke('mercadopagoSubscription', {
        action: "status"
      });
      return response.data;
    },
    enabled: !!user
  });

  // Busca histórico de pagamentos
  const { data: paymentHistory } = useQuery({
    queryKey: ['payment-history'],
    queryFn: async () => {
      const response = await base44.functions.invoke('mercadopagoSubscription', {
        action: "history"
      });
      return response.data?.payments || [];
    },
    enabled: !!user && !!subscriptionData?.has_active_subscription
  });

  // Mutation para cancelar assinatura
  const cancelMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('mercadopagoSubscription', {
        action: "cancel"
      });
      if (response.data.error) throw new Error(response.data.error);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Assinatura cancelada com sucesso");
      queryClient.invalidateQueries({ queryKey: ['subscription-status'] });
      setShowCancelDialog(false);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao cancelar assinatura");
    }
  });

  const subscription = subscriptionData?.subscription;
  const hasActiveSubscription = subscriptionData?.has_active_subscription;
  const status = statusConfig[subscription?.status] || statusConfig.pending;
  const StatusIcon = status.icon;

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
      return format(new Date(dateStr), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen p-6 ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`}>
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
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
            className={isDark ? 'border-neutral-800 text-neutral-400 hover:text-white' : ''}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>

        {/* Sem assinatura */}
        {!hasActiveSubscription && !subscription && (
          <Card className={`border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}`}>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDark ? 'bg-neutral-800' : 'bg-gray-100'}`}>
                <Crown className={`w-8 h-8 ${isDark ? 'text-neutral-500' : 'text-gray-400'}`} />
              </div>
              <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Você não possui uma assinatura ativa
              </h3>
              <p className={`text-center max-w-md mb-6 ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                Assine o plano Pro para ter acesso ilimitado a todas as funcionalidades da plataforma.
              </p>
              <Link to={createPageUrl("Pricing")}>
                <Button className={isDark ? 'bg-white text-black hover:bg-gray-100' : 'bg-gray-900 text-white'}>
                  Ver Planos
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Card principal da assinatura */}
        {subscription && (
          <div className="space-y-6">
            {/* Status Card */}
            <Card className={`border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}`}>
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      subscription.plan === 'pro' 
                        ? 'bg-gradient-to-br from-amber-400 to-orange-500' 
                        : isDark ? 'bg-neutral-800' : 'bg-gray-100'
                    }`}>
                      {subscription.plan === 'pro' ? (
                        <Crown className="w-6 h-6 text-white" />
                      ) : (
                        <Zap className={`w-6 h-6 ${isDark ? 'text-neutral-500' : 'text-gray-500'}`} />
                      )}
                    </div>
                    <div>
                      <CardTitle className={isDark ? 'text-white' : 'text-gray-900'}>
                        Plano {subscription.plan === 'pro' ? 'Profissional' : 'Gratuito'}
                      </CardTitle>
                      <CardDescription className={isDark ? 'text-neutral-500' : ''}>
                        {subscription.plan === 'pro' ? 'Acesso ilimitado a todos os recursos' : 'Recursos básicos com limite diário'}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className={status.color}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {status.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Valor */}
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-neutral-800' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <CreditCard className={`w-4 h-4 ${isDark ? 'text-neutral-500' : 'text-gray-400'}`} />
                      <span className={`text-sm ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>Valor</span>
                    </div>
                    <p className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      R$ {(subscription.price || 0).toFixed(2).replace('.', ',')}
                      <span className={`text-sm font-normal ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>/mês</span>
                    </p>
                  </div>

                  {/* Data de início */}
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-neutral-800' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className={`w-4 h-4 ${isDark ? 'text-neutral-500' : 'text-gray-400'}`} />
                      <span className={`text-sm ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>Início</span>
                    </div>
                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {formatDate(subscription.start_date)}
                    </p>
                  </div>

                  {/* Próxima cobrança */}
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-neutral-800' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className={`w-4 h-4 ${isDark ? 'text-neutral-500' : 'text-gray-400'}`} />
                      <span className={`text-sm ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>Próxima cobrança</span>
                    </div>
                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {subscription.status === 'cancelled' ? 'Cancelada' : formatDate(subscription.next_billing_date)}
                    </p>
                  </div>

                  {/* Status do pagamento */}
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-neutral-800' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Receipt className={`w-4 h-4 ${isDark ? 'text-neutral-500' : 'text-gray-400'}`} />
                      <span className={`text-sm ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>Pagamento</span>
                    </div>
                    <Badge className={paymentStatusConfig[subscription.payment_status]?.color || 'bg-gray-100'}>
                      {paymentStatusConfig[subscription.payment_status]?.label || subscription.payment_status}
                    </Badge>
                  </div>
                </div>

                {/* Ações */}
                {subscription.status === 'active' && subscription.plan === 'pro' && (
                  <div className={`mt-6 pt-6 border-t flex flex-wrap gap-3 ${isDark ? 'border-neutral-800' : 'border-gray-200'}`}>
                    {subscription.payment_external_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className={isDark ? 'border-neutral-700 text-neutral-300 hover:text-white' : ''}
                      >
                        <a href={subscription.payment_external_url} target="_blank" rel="noopener noreferrer">
                          <Settings className="w-4 h-4 mr-2" />
                          Gerenciar no Mercado Pago
                          <ExternalLink className="w-3 h-3 ml-2" />
                        </a>
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCancelDialog(true)}
                      className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                    >
                      <Ban className="w-4 h-4 mr-2" />
                      Cancelar Assinatura
                    </Button>
                  </div>
                )}

                {/* Assinatura cancelada */}
                {subscription.status === 'cancelled' && (
                  <div className={`mt-6 p-4 rounded-lg ${isDark ? 'bg-red-900/20 border border-red-900/50' : 'bg-red-50 border border-red-200'}`}>
                    <p className={`text-sm ${isDark ? 'text-red-400' : 'text-red-700'}`}>
                      Sua assinatura foi cancelada em {formatDate(subscription.end_date)}. 
                      Você pode reativar a qualquer momento.
                    </p>
                    <Link to={createPageUrl("Pricing")}>
                      <Button size="sm" className="mt-3 bg-red-600 hover:bg-red-700 text-white">
                        Reativar Assinatura
                      </Button>
                    </Link>
                  </div>
                )}

                {/* Pagamento pendente */}
                {subscription.status === 'pending' && subscription.payment_external_url && (
                  <div className={`mt-6 p-4 rounded-lg ${isDark ? 'bg-yellow-900/20 border border-yellow-900/50' : 'bg-yellow-50 border border-yellow-200'}`}>
                    <p className={`text-sm mb-3 ${isDark ? 'text-yellow-400' : 'text-yellow-700'}`}>
                      Seu pagamento está pendente. Clique abaixo para concluir a assinatura.
                    </p>
                    <Button size="sm" asChild className="bg-yellow-600 hover:bg-yellow-700 text-white">
                      <a href={subscription.payment_external_url} target="_blank" rel="noopener noreferrer">
                        Concluir Pagamento
                        <ExternalLink className="w-3 h-3 ml-2" />
                      </a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Histórico de Pagamentos */}
            <Card className={`border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}`}>
              <CardHeader>
                <CardTitle className={`text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Histórico de Pagamentos
                </CardTitle>
                <CardDescription className={isDark ? 'text-neutral-500' : ''}>
                  Seus últimos pagamentos e faturas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {paymentHistory && paymentHistory.length > 0 ? (
                  <div className="space-y-3">
                    {paymentHistory.map((payment, index) => (
                      <div 
                        key={payment.id || index}
                        className={`flex items-center justify-between p-4 rounded-lg ${isDark ? 'bg-neutral-800' : 'bg-gray-50'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            payment.status === 'approved' ? 'bg-green-100' : 
                            payment.status === 'pending' ? 'bg-yellow-100' : 'bg-red-100'
                          }`}>
                            {payment.status === 'approved' ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : payment.status === 'pending' ? (
                              <Clock className="w-5 h-5 text-yellow-600" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-600" />
                            )}
                          </div>
                          <div>
                            <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              R$ {(payment.amount || 0).toFixed(2).replace('.', ',')}
                            </p>
                            <p className={`text-sm ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                              {formatDate(payment.date)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={
                            payment.status === 'approved' ? 'bg-green-100 text-green-800' :
                            payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }>
                            {payment.status === 'approved' ? 'Aprovado' : 
                             payment.status === 'pending' ? 'Pendente' : 'Falhou'}
                          </Badge>
                          {payment.receipt_url && (
                            <Button variant="ghost" size="sm" asChild>
                              <a href={payment.receipt_url} target="_blank" rel="noopener noreferrer">
                                <Receipt className="w-4 h-4" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={`text-center py-8 ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                    <Receipt className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Nenhum pagamento registrado ainda</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Informações adicionais */}
            <Card className={`border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}`}>
              <CardHeader>
                <CardTitle className={`text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Informações da Conta
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <p className={`text-sm ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>Email</p>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{user?.email}</p>
                  </div>
                  <div>
                    <p className={`text-sm ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>ID da Assinatura</p>
                    <p className={`font-mono text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {subscription.payment_external_id || subscription.id}
                    </p>
                  </div>
                  <div>
                    <p className={`text-sm ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>Método de Pagamento</p>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {subscription.payment_method === 'mercadopago' ? 'Mercado Pago' : subscription.payment_method || '-'}
                    </p>
                  </div>
                  <div>
                    <p className={`text-sm ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>Criada em</p>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {formatDate(subscription.created_date)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Dialog de confirmação de cancelamento */}
        <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancelar Assinatura</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja cancelar sua assinatura? Você perderá acesso aos recursos Pro 
                ao final do período atual. Esta ação pode ser revertida reativando a assinatura.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Voltar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {cancelMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Cancelando...
                  </>
                ) : (
                  "Confirmar Cancelamento"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}