import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, CheckCircle, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function DespesasManager({ theme = 'light' }) {
  const isDark = theme === 'dark';
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [despesaForm, setDespesaForm] = useState({});
  const queryClient = useQueryClient();

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: despesas = [] } = useQuery({
    queryKey: ['despesas', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.Despesa.filter({ created_by: user.email }, '-created_date');
    },
    enabled: !!user?.email
  });

  const createDespesaMutation = useMutation({
    mutationFn: (data) => base44.entities.Despesa.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['despesas'] });
      setShowForm(false);
      setDespesaForm({});
      toast.success("Despesa registrada!");
    }
  });

  const updateDespesaMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Despesa.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['despesas'] });
      toast.success("Despesa atualizada!");
    }
  });

  const marcarComoPago = (despesa) => {
    updateDespesaMutation.mutate({
      id: despesa.id,
      data: {
        ...despesa,
        status: 'pago',
        data_pagamento: new Date().toISOString().split('T')[0]
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createDespesaMutation.mutate(despesaForm);
  };

  const categorias = [
    { value: 'aluguel', label: 'Aluguel' },
    { value: 'funcionarios', label: 'Funcionários' },
    { value: 'tecnologia', label: 'Tecnologia' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'despachante', label: 'Despachante' },
    { value: 'custas_processuais', label: 'Custas Processuais' },
    { value: 'fornecedores', label: 'Fornecedores' },
    { value: 'impostos', label: 'Impostos' },
    { value: 'outros', label: 'Outros' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Despesas
        </h2>
        <Button onClick={() => setShowForm(true)} className="bg-red-600 hover:bg-red-700">
          <Plus className="w-4 h-4 mr-2" />
          Nova Despesa
        </Button>
      </div>

      <div className="grid gap-3">
        {despesas.map((despesa) => (
          <Card key={despesa.id} className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {despesa.status === 'pago' ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : despesa.status === 'atrasado' ? (
                    <XCircle className="w-5 h-5 text-red-600" />
                  ) : (
                    <Clock className="w-5 h-5 text-orange-600" />
                  )}
                  <div>
                    <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {despesa.descricao}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                        {categorias.find(c => c.value === despesa.categoria)?.label}
                      </span>
                      <span className="text-xs text-gray-500">
                        Venc: {new Date(despesa.data_vencimento).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      R$ {despesa.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    {despesa.status === 'pago' && despesa.data_pagamento && (
                      <div className="text-xs text-green-600">
                        Pago em {new Date(despesa.data_pagamento).toLocaleDateString('pt-BR')}
                      </div>
                    )}
                  </div>
                  {despesa.status === 'pendente' && (
                    <Button size="sm" onClick={() => marcarComoPago(despesa)}>
                      Pagar
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog Nova Despesa */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}>
          <DialogHeader>
            <DialogTitle>Nova Despesa</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Descrição</Label>
              <Input
                value={despesaForm.descricao || ''}
                onChange={(e) => setDespesaForm({...despesaForm, descricao: e.target.value})}
                required
              />
            </div>

            <div>
              <Label>Categoria</Label>
              <Select 
                value={despesaForm.categoria} 
                onValueChange={(v) => setDespesaForm({...despesaForm, categoria: v})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Valor</Label>
              <Input
                type="number"
                step="0.01"
                value={despesaForm.valor || ''}
                onChange={(e) => setDespesaForm({...despesaForm, valor: parseFloat(e.target.value)})}
                required
              />
            </div>

            <div>
              <Label>Data de Vencimento</Label>
              <Input
                type="date"
                value={despesaForm.data_vencimento || ''}
                onChange={(e) => setDespesaForm({...despesaForm, data_vencimento: e.target.value})}
                required
              />
            </div>

            <div>
              <Label>Observações</Label>
              <Textarea
                value={despesaForm.observacoes || ''}
                onChange={(e) => setDespesaForm({...despesaForm, observacoes: e.target.value})}
                rows={3}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button type="submit">Registrar Despesa</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}