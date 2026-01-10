import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DollarSign, CheckCircle, XCircle, Clock, Wallet } from "lucide-react";
import { toast } from "sonner";

export default function WithdrawalRequests({ requests, isOwner, affiliate, theme = 'light' }) {
  const queryClient = useQueryClient();
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestAmount, setRequestAmount] = useState('');
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const isActualOwner = user?.email === 'ld.andrade@outlook.com';

  const availableBalance = affiliate ? 
    (affiliate.total_commission || 0) - (affiliate.total_paid || 0) : 0;

  const createRequestMutation = useMutation({
    mutationFn: (data) => base44.entities.WithdrawalRequest.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['withdrawalRequests'] });
      setShowRequestForm(false);
      setRequestAmount('');
      toast.success("Solicitação enviada!");
    }
  });

  const updateRequestMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.WithdrawalRequest.update(id, data),
    onSuccess: async (_, variables) => {
      // Se foi marcado como pago, atualizar o total_paid do afiliado
      if (variables.data.status === 'paid') {
        const request = requests.find(r => r.id === variables.id);
        if (request) {
          const affiliates = await base44.entities.Affiliate.filter({ id: request.affiliate_id });
          if (affiliates.length > 0) {
            const currentPaid = affiliates[0].total_paid || 0;
            await base44.entities.Affiliate.update(request.affiliate_id, {
              total_paid: currentPaid + request.amount
            });
          }
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ['withdrawalRequests'] });
      queryClient.invalidateQueries({ queryKey: ['affiliates'] });
      toast.success("Solicitação atualizada!");
    }
  });

  const handleRequestWithdrawal = () => {
    const amount = parseFloat(requestAmount);
    if (!amount || amount <= 0) {
      toast.error("Digite um valor válido");
      return;
    }
    if (amount > availableBalance) {
      toast.error("Valor maior que saldo disponível");
      return;
    }

    createRequestMutation.mutate({
      affiliate_id: affiliate.id,
      affiliate_name: affiliate.name,
      affiliate_email: affiliate.user_email,
      pix_key: affiliate.pix_key,
      amount: amount,
      status: 'pending'
    });
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: { icon: Clock, color: 'bg-yellow-100 text-yellow-800', label: 'Pendente' },
      approved: { icon: CheckCircle, color: 'bg-blue-100 text-blue-800', label: 'Aprovado' },
      rejected: { icon: XCircle, color: 'bg-red-100 text-red-800', label: 'Rejeitado' },
      paid: { icon: CheckCircle, color: 'bg-green-100 text-green-800', label: 'Pago' }
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
    <div className="space-y-4">
      {/* Afiliado - Solicitar Saque */}
      {!isOwner && (
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Wallet className="w-5 h-5" />
              Solicitar Saque
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!showRequestForm ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Saldo Disponível</p>
                  <p className="text-3xl font-bold text-green-600">
                    R$ {availableBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <Button
                  onClick={() => setShowRequestForm(true)}
                  disabled={availableBalance <= 0}
                  className="w-full"
                >
                  Solicitar Saque
                </Button>
                {availableBalance <= 0 && (
                  <p className="text-sm text-gray-500 text-center">
                    Você não possui saldo disponível para saque
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label className="text-gray-900">Valor do Saque (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={requestAmount}
                    onChange={(e) => setRequestAmount(e.target.value)}
                    placeholder="0,00"
                    max={availableBalance}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Disponível: R$ {availableBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-900">Chave PIX</Label>
                  <Input
                    value={affiliate?.pix_key || ''}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowRequestForm(false);
                      setRequestAmount('');
                    }}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleRequestWithdrawal}
                    disabled={createRequestMutation.isPending}
                    className="flex-1"
                  >
                    {createRequestMutation.isPending ? 'Enviando...' : 'Confirmar Solicitação'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Lista de Solicitações */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900">
          {isOwner ? 'Solicitações de Saque' : 'Histórico de Saques'}
        </h3>
        
        {requests.length === 0 ? (
          <Card className="bg-white border-gray-200">
            <CardContent className="p-8 text-center">
              <p className="text-gray-600">
                {isOwner ? 'Nenhuma solicitação de saque ainda.' : 'Você ainda não solicitou nenhum saque.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          requests.map((request) => (
            <Card key={request.id} className="bg-white border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {isOwner && (
                        <h4 className="font-semibold text-gray-900">
                          {request.affiliate_name}
                        </h4>
                      )}
                      {getStatusBadge(request.status)}
                      <span className="text-2xl font-bold text-green-600">
                        R$ {request.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4 text-sm mt-3">
                      {isOwner && (
                        <>
                          <div>
                            <span className="text-gray-600">Email:</span>{' '}
                            <span className="text-gray-900">{request.affiliate_email}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Chave PIX:</span>{' '}
                            <span className="text-gray-900">{request.pix_key || 'Não informada'}</span>
                          </div>
                        </>
                      )}
                      <div>
                        <span className="text-gray-600">Solicitado em:</span>{' '}
                        <span className="text-gray-900">
                          {new Date(request.created_date).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      {request.paid_date && (
                        <div>
                          <span className="text-gray-600">Pago em:</span>{' '}
                          <span className="text-gray-900">
                            {new Date(request.paid_date).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      )}
                    </div>

                    {request.rejection_reason && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                        <p className="text-sm text-red-800">
                          <strong>Motivo da rejeição:</strong> {request.rejection_reason}
                        </p>
                      </div>
                    )}

                    {request.notes && (
                      <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded">
                        <p className="text-sm text-gray-700">
                          <strong>Observações:</strong> {request.notes}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Ações do Owner */}
                  {isActualOwner && request.status === 'pending' && (
                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        size="sm"
                        onClick={() => updateRequestMutation.mutate({
                          id: request.id,
                          data: { status: 'approved' }
                        })}
                      >
                        Aprovar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const reason = prompt('Motivo da rejeição:');
                          if (reason) {
                            updateRequestMutation.mutate({
                              id: request.id,
                              data: { status: 'rejected', rejection_reason: reason }
                            });
                          }
                        }}
                      >
                        Rejeitar
                      </Button>
                    </div>
                  )}

                  {isActualOwner && request.status === 'approved' && (
                    <Button
                      size="sm"
                      className="ml-4"
                      onClick={() => updateRequestMutation.mutate({
                        id: request.id,
                        data: { 
                          status: 'paid',
                          paid_date: new Date().toISOString()
                        }
                      })}
                    >
                      Marcar como Pago
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}