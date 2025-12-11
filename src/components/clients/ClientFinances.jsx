import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Plus, Check, X, Calendar, CreditCard, Trash2, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

export default function ClientFinances({ clientId, theme = 'light' }) {
  const isDark = theme === 'dark';
  const [showForm, setShowForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    type: "honorario",
    payment_method: "cash",
    total_value: "",
    installments_count: 1,
    due_date: "",
    notes: ""
  });
  const queryClient = useQueryClient();

  const { data: payments = [] } = useQuery({
    queryKey: ['client-payments', clientId],
    queryFn: () => base44.entities.ClientPayment.filter({ client_id: clientId }, '-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ClientPayment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-payments'] });
      toast.success("Pagamento adicionado!");
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ClientPayment.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-payments'] });
      toast.success("Pagamento atualizado!");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ClientPayment.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-payments'] });
      toast.success("Pagamento removido!");
    },
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingPayment(null);
    setFormData({
      title: "",
      type: "honorario",
      payment_method: "cash",
      total_value: "",
      installments_count: 1,
      due_date: "",
      notes: ""
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const totalValue = parseFloat(formData.total_value);
    if (!formData.title || !totalValue) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    const paymentData = {
      client_id: clientId,
      title: formData.title,
      type: formData.type,
      payment_method: formData.payment_method,
      total_value: totalValue,
      paid_value: 0,
      status: "pending",
      due_date: formData.due_date || undefined,
      notes: formData.notes || undefined
    };

    if (formData.payment_method === "installments") {
      const installmentsCount = parseInt(formData.installments_count);
      const installmentValue = totalValue / installmentsCount;
      const baseDate = formData.due_date ? new Date(formData.due_date) : new Date();
      
      paymentData.installments = Array.from({ length: installmentsCount }, (_, i) => {
        const dueDate = new Date(baseDate);
        dueDate.setMonth(dueDate.getMonth() + i);
        return {
          number: i + 1,
          value: installmentValue,
          due_date: dueDate.toISOString().split('T')[0],
          paid: false
        };
      });
    }

    if (editingPayment) {
      updateMutation.mutate({ id: editingPayment.id, data: paymentData });
    } else {
      createMutation.mutate(paymentData);
    }
  };

  const handleMarkInstallmentPaid = (payment, installmentIndex) => {
    const updatedInstallments = [...payment.installments];
    updatedInstallments[installmentIndex] = {
      ...updatedInstallments[installmentIndex],
      paid: !updatedInstallments[installmentIndex].paid,
      paid_date: !updatedInstallments[installmentIndex].paid ? new Date().toISOString().split('T')[0] : null
    };

    const paidValue = updatedInstallments
      .filter(inst => inst.paid)
      .reduce((sum, inst) => sum + inst.value, 0);

    const allPaid = updatedInstallments.every(inst => inst.paid);
    const somePaid = updatedInstallments.some(inst => inst.paid);

    updateMutation.mutate({
      id: payment.id,
      data: {
        ...payment,
        installments: updatedInstallments,
        paid_value: paidValue,
        status: allPaid ? "paid" : somePaid ? "partial" : "pending"
      }
    });
  };

  const handleMarkCashPaid = (payment) => {
    updateMutation.mutate({
      id: payment.id,
      data: {
        ...payment,
        paid_value: payment.status === "paid" ? 0 : payment.total_value,
        status: payment.status === "paid" ? "pending" : "paid",
        paid_date: payment.status === "paid" ? null : new Date().toISOString().split('T')[0]
      }
    });
  };

  const totalReceivable = payments.reduce((sum, p) => sum + (p.total_value - (p.paid_value || 0)), 0);
  const totalReceived = payments.reduce((sum, p) => sum + (p.paid_value || 0), 0);

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    partial: "bg-blue-100 text-blue-800",
    paid: "bg-green-100 text-green-800",
    overdue: "bg-red-100 text-red-800"
  };

  const statusLabels = {
    pending: "Pendente",
    partial: "Parcial",
    paid: "Pago",
    overdue: "Atrasado"
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className={`p-4 rounded-lg border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-green-600" />
            <p className={`text-xs font-medium ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>Recebido</p>
          </div>
          <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            R$ {totalReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className={`p-4 rounded-lg border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-amber-600" />
            <p className={`text-xs font-medium ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>A Receber</p>
          </div>
          <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            R$ {totalReceivable.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Add Button */}
      <Button onClick={() => setShowForm(true)} className="w-full">
        <Plus className="w-4 h-4 mr-2" />
        Adicionar Honorário/Pagamento
      </Button>

      {/* Form */}
      {showForm && (
        <div className={`p-4 rounded-lg border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}`}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Título *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Honorários processo X"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo *</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="honorario">Honorário</SelectItem>
                    <SelectItem value="despesa">Despesa</SelectItem>
                    <SelectItem value="reembolso">Reembolso</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Valor Total *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.total_value}
                  onChange={(e) => setFormData({ ...formData, total_value: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <Label>Forma de Pagamento *</Label>
              <Select value={formData.payment_method} onValueChange={(v) => setFormData({ ...formData, payment_method: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">À Vista</SelectItem>
                  <SelectItem value="installments">Parcelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.payment_method === "installments" && (
              <div>
                <Label>Número de Parcelas</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.installments_count}
                  onChange={(e) => setFormData({ ...formData, installments_count: e.target.value })}
                />
              </div>
            )}

            <div>
              <Label>Vencimento</Label>
              <Input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>

            <div>
              <Label>Observações</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingPayment ? 'Atualizar' : 'Adicionar'}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Payments List */}
      <div className="space-y-4">
        {payments.map((payment) => (
          <div key={payment.id} className={`p-4 rounded-lg border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{payment.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={statusColors[payment.status]}>
                    {statusLabels[payment.status]}
                  </Badge>
                  <span className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                    {payment.type === 'honorario' ? 'Honorário' : payment.type === 'despesa' ? 'Despesa' : 'Reembolso'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (confirm("Remover este pagamento?")) {
                      deleteMutation.mutate(payment.id);
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className={isDark ? 'text-neutral-400' : 'text-gray-600'}>Total:</span>
                <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  R$ {payment.total_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className={isDark ? 'text-neutral-400' : 'text-gray-600'}>Pago:</span>
                <span className="font-medium text-green-600">
                  R$ {(payment.paid_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {payment.payment_method === "cash" ? (
              <Button
                onClick={() => handleMarkCashPaid(payment)}
                variant={payment.status === "paid" ? "outline" : "default"}
                size="sm"
                className="w-full mt-3"
              >
                {payment.status === "paid" ? (
                  <>
                    <X className="w-4 h-4 mr-2" />
                    Marcar como Não Pago
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Marcar como Pago
                  </>
                )}
              </Button>
            ) : (
              <div className="mt-3 space-y-2">
                <p className={`text-xs font-medium ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>Parcelas:</p>
                {payment.installments?.map((inst, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-2 rounded border ${
                      inst.paid
                        ? isDark ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200'
                        : isDark ? 'border-neutral-700' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`text-xs ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                        {inst.number}/{payment.installments.length}
                      </span>
                      <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        R$ {inst.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      <span className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                        {format(new Date(inst.due_date), 'dd/MM/yyyy')}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMarkInstallmentPaid(payment, index)}
                    >
                      {inst.paid ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <CreditCard className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {payments.length === 0 && !showForm && (
          <div className={`p-8 text-center border rounded-lg ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}`}>
            <DollarSign className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-neutral-700' : 'text-gray-300'}`} />
            <p className={isDark ? 'text-neutral-500' : 'text-gray-500'}>Nenhum pagamento registrado</p>
          </div>
        )}
      </div>
    </div>
  );
}