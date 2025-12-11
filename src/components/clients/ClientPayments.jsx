import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, DollarSign, TrendingUp, AlertCircle, CheckCircle, Calendar, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export default function ClientPayments({ clients, theme = 'light' }) {
  const isDark = theme === 'dark';
  const [showNewPayment, setShowNewPayment] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    client_id: "",
    client_name: "",
    type: "fee",
    description: "",
    total_value: "",
    payment_method: "cash",
    installments: [],
    notes: ""
  });

  const [installmentCount, setInstallmentCount] = useState(1);

  const { data: payments = [] } = useQuery({
    queryKey: ['clientPayments'],
    queryFn: () => base44.entities.ClientPayment.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ClientPayment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientPayments'] });
      toast.success("Pagamento registrado com sucesso!");
      setShowNewPayment(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ClientPayment.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientPayments'] });
      toast.success("Pagamento atualizado!");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ClientPayment.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientPayments'] });
      toast.success("Pagamento removido!");
    },
  });

  const resetForm = () => {
    setFormData({
      client_id: "",
      client_name: "",
      type: "fee",
      description: "",
      total_value: "",
      payment_method: "cash",
      installments: [],
      notes: ""
    });
    setInstallmentCount(1);
  };

  const handleClientChange = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    setFormData({
      ...formData,
      client_id: clientId,
      client_name: client?.name || ""
    });
  };

  const generateInstallments = () => {
    const count = parseInt(installmentCount);
    const valuePerInstallment = parseFloat(formData.total_value) / count;
    const installments = [];
    
    for (let i = 1; i <= count; i++) {
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + i);
      installments.push({
        number: i,
        value: valuePerInstallment,
        due_date: dueDate.toISOString().split('T')[0],
        paid: false,
        paid_date: null
      });
    }
    
    setFormData({ ...formData, installments });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.client_id || !formData.total_value) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    const dataToSubmit = { ...formData };
    
    if (dataToSubmit.payment_method === 'cash') {
      dataToSubmit.installments = [{
        number: 1,
        value: parseFloat(dataToSubmit.total_value),
        due_date: new Date().toISOString().split('T')[0],
        paid: false,
        paid_date: null
      }];
      dataToSubmit.status = 'pending';
    } else {
      const paidCount = dataToSubmit.installments.filter(i => i.paid).length;
      if (paidCount === dataToSubmit.installments.length) {
        dataToSubmit.status = 'paid';
      } else if (paidCount > 0) {
        dataToSubmit.status = 'partial';
      } else {
        dataToSubmit.status = 'pending';
      }
    }

    createMutation.mutate(dataToSubmit);
  };

  const toggleInstallmentPaid = (payment, installmentNumber) => {
    const updatedInstallments = payment.installments.map(inst => {
      if (inst.number === installmentNumber) {
        return {
          ...inst,
          paid: !inst.paid,
          paid_date: !inst.paid ? new Date().toISOString().split('T')[0] : null
        };
      }
      return inst;
    });

    const paidCount = updatedInstallments.filter(i => i.paid).length;
    let newStatus = 'pending';
    if (paidCount === updatedInstallments.length) {
      newStatus = 'paid';
    } else if (paidCount > 0) {
      newStatus = 'partial';
    }

    updateMutation.mutate({
      id: payment.id,
      data: {
        ...payment,
        installments: updatedInstallments,
        status: newStatus
      }
    });
  };

  const totalReceived = payments.reduce((acc, p) => {
    if (p.status === 'paid') return acc + p.total_value;
    if (p.status === 'partial') {
      return acc + p.installments.filter(i => i.paid).reduce((s, i) => s + i.value, 0);
    }
    return acc;
  }, 0);

  const totalPending = payments.reduce((acc, p) => {
    if (p.status === 'pending') return acc + p.total_value;
    if (p.status === 'partial') {
      return acc + p.installments.filter(i => !i.paid).reduce((s, i) => s + i.value, 0);
    }
    return acc;
  }, 0);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className={`text-2xl font-light ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Honorários e Pagamentos
          </h2>
          <p className={`mt-1 ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
            Gerencie o fluxo de caixa dos clientes
          </p>
        </div>
        <Dialog open={showNewPayment} onOpenChange={setShowNewPayment}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-green-600 to-emerald-600">
              <Plus className="w-4 h-4 mr-2" />
              Novo Pagamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Registrar Pagamento</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cliente *</Label>
                  <Select value={formData.client_id} onValueChange={handleClientChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tipo *</Label>
                  <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fee">Honorário</SelectItem>
                      <SelectItem value="expense">Despesa</SelectItem>
                      <SelectItem value="reimbursement">Reembolso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Valor Total *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.total_value}
                    onChange={(e) => setFormData({...formData, total_value: e.target.value})}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Forma de Pagamento *</Label>
                  <Select 
                    value={formData.payment_method} 
                    onValueChange={(v) => setFormData({...formData, payment_method: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">À Vista</SelectItem>
                      <SelectItem value="installment">Parcelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.payment_method === 'installment' && (
                <div className="space-y-3">
                  <div className="flex gap-2 items-end">
                    <div className="flex-1 space-y-2">
                      <Label>Número de Parcelas</Label>
                      <Input
                        type="number"
                        min="2"
                        value={installmentCount}
                        onChange={(e) => setInstallmentCount(e.target.value)}
                      />
                    </div>
                    <Button type="button" onClick={generateInstallments}>
                      Gerar Parcelas
                    </Button>
                  </div>

                  {formData.installments.length > 0 && (
                    <div className={`border rounded-lg p-3 space-y-2 ${isDark ? 'border-neutral-700' : 'border-gray-200'}`}>
                      <p className="text-sm font-medium">Parcelas Geradas:</p>
                      {formData.installments.map((inst, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span>Parcela {inst.number}</span>
                          <span>R$ {inst.value.toFixed(2)} - {format(new Date(inst.due_date), 'dd/MM/yyyy')}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Ex: Honorários advocatícios - Processo 123"
                />
              </div>

              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowNewPayment(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  Registrar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : ''}>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              Total Recebido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-light">
              R$ {totalReceived.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : ''}>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-orange-500" />
              Total Pendente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-light">
              R$ {totalPending.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : ''}>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-blue-500" />
              Total Geral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-light">
              R$ {(totalReceived + totalPending).toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payments List */}
      <div className="space-y-4">
        {payments.length === 0 ? (
          <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : ''}>
            <CardContent className="py-12 text-center">
              <DollarSign className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-neutral-700' : 'text-gray-300'}`} />
              <p className={isDark ? 'text-neutral-500' : 'text-gray-500'}>
                Nenhum pagamento registrado
              </p>
            </CardContent>
          </Card>
        ) : (
          payments.map(payment => (
            <Card key={payment.id} className={isDark ? 'bg-neutral-900 border-neutral-800' : ''}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{payment.client_name}</CardTitle>
                    <p className={`text-sm ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                      {payment.description || 'Sem descrição'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      payment.status === 'paid' ? 'bg-green-100 text-green-700' :
                      payment.status === 'partial' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {payment.status === 'paid' ? 'Pago' :
                       payment.status === 'partial' ? 'Parcial' : 'Pendente'}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm('Remover este pagamento?')) {
                          deleteMutation.mutate(payment.id);
                        }
                      }}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className={isDark ? 'text-neutral-400' : 'text-gray-600'}>Valor Total:</span>
                    <span className="font-medium">R$ {payment.total_value.toFixed(2)}</span>
                  </div>

                  {payment.installments && payment.installments.length > 0 && (
                    <div className={`border-t pt-3 space-y-2 ${isDark ? 'border-neutral-800' : 'border-gray-200'}`}>
                      <p className="text-sm font-medium">Parcelas:</p>
                      {payment.installments.map(inst => (
                        <div 
                          key={inst.number} 
                          className={`flex items-center justify-between p-2 rounded ${isDark ? 'bg-neutral-800' : 'bg-gray-50'}`}
                        >
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleInstallmentPaid(payment, inst.number)}
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                inst.paid 
                                  ? 'bg-green-500 border-green-500' 
                                  : isDark ? 'border-neutral-600' : 'border-gray-300'
                              }`}
                            >
                              {inst.paid && <CheckCircle className="w-3 h-3 text-white" />}
                            </button>
                            <span className={`text-sm ${inst.paid && 'line-through opacity-50'}`}>
                              Parcela {inst.number}/{payment.installments.length}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">R$ {inst.value.toFixed(2)}</p>
                            <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                              {format(new Date(inst.due_date), 'dd/MM/yyyy')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
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