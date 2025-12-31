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
import { Plus, DollarSign, CheckCircle, Clock, XCircle, Edit, Calendar } from "lucide-react";
import { toast } from "sonner";

export default function HonorariosManager({ theme = 'light' }) {
  const isDark = theme === 'dark';
  const [user, setUser] = useState(null);
  const [showContratoForm, setShowContratoForm] = useState(false);
  const [showParcelaDialog, setShowParcelaDialog] = useState(false);
  const [selectedContrato, setSelectedContrato] = useState(null);
  const [contratoForm, setContratoForm] = useState({});
  const queryClient = useQueryClient();

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: contratos = [] } = useQuery({
    queryKey: ['honorarios', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.HonorarioContrato.filter({ created_by: user.email }, '-created_date');
    },
    enabled: !!user?.email
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ['clients', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.Client.filter({ created_by: user.email });
    },
    enabled: !!user?.email
  });

  const { data: parcelas = [] } = useQuery({
    queryKey: ['parcelas', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.ParcelaHonorario.filter({ created_by: user.email });
    },
    enabled: !!user?.email
  });

  const createContratoMutation = useMutation({
    mutationFn: async (data) => {
      const contrato = await base44.entities.HonorarioContrato.create(data);
      
      // Criar parcelas automaticamente se parcelado
      if (data.forma_pagamento === 'parcelado' && data.numero_parcelas > 1) {
        const valorParcela = data.valor_total / data.numero_parcelas;
        const dataInicio = new Date(data.data_inicio);
        
        for (let i = 1; i <= data.numero_parcelas; i++) {
          const dataVencimento = new Date(dataInicio);
          dataVencimento.setMonth(dataVencimento.getMonth() + i - 1);
          
          await base44.entities.ParcelaHonorario.create({
            contrato_id: contrato.id,
            cliente_nome: data.cliente_nome,
            numero_parcela: i,
            valor: valorParcela,
            data_vencimento: dataVencimento.toISOString().split('T')[0],
            status: 'pendente'
          });
        }
      } else {
        // Criar parcela única
        await base44.entities.ParcelaHonorario.create({
          contrato_id: contrato.id,
          cliente_nome: data.cliente_nome,
          numero_parcela: 1,
          valor: data.valor_total,
          data_vencimento: data.data_inicio,
          status: 'pendente'
        });
      }
      
      return contrato;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['honorarios'] });
      queryClient.invalidateQueries({ queryKey: ['parcelas'] });
      setShowContratoForm(false);
      setContratoForm({});
      toast.success("Contrato criado com sucesso!");
    }
  });

  const updateParcelaMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ParcelaHonorario.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parcelas'] });
      queryClient.invalidateQueries({ queryKey: ['honorarios'] });
      toast.success("Parcela atualizada!");
    }
  });

  const marcarComoPago = (parcela) => {
    updateParcelaMutation.mutate({
      id: parcela.id,
      data: {
        ...parcela,
        status: 'pago',
        data_pagamento: new Date().toISOString().split('T')[0]
      }
    });
  };

  const getParcelasContrato = (contratoId) => {
    return parcelas.filter(p => p.contrato_id === contratoId);
  };

  const handleSubmitContrato = (e) => {
    e.preventDefault();
    const cliente = clientes.find(c => c.id === contratoForm.cliente_id);
    createContratoMutation.mutate({
      ...contratoForm,
      cliente_nome: cliente?.name || '',
      valor_pendente: contratoForm.valor_total,
      valor_recebido: 0
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Contratos de Honorários
        </h2>
        <Button onClick={() => setShowContratoForm(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Novo Contrato
        </Button>
      </div>

      <div className="grid gap-4">
        {contratos.map((contrato) => {
          const parcelasContrato = getParcelasContrato(contrato.id);
          const parcelasPagas = parcelasContrato.filter(p => p.status === 'pago').length;
          
          return (
            <Card key={contrato.id} className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{contrato.cliente_nome}</CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        contrato.tipo === 'fixo' ? 'bg-blue-100 text-blue-700' :
                        contrato.tipo === 'exito' ? 'bg-green-100 text-green-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {contrato.tipo.toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        contrato.status === 'ativo' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {contrato.status}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      R$ {contrato.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {parcelasPagas} de {parcelasContrato.length} parcelas pagas
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className={isDark ? 'text-neutral-400' : 'text-gray-600'}>Início:</span>
                    <span className={isDark ? 'text-white' : 'text-gray-900'}>
                      {new Date(contrato.data_inicio).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${(parcelasPagas / parcelasContrato.length) * 100}%` }}
                    />
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedContrato(contrato);
                      setShowParcelaDialog(true);
                    }}
                    className="w-full"
                  >
                    Ver Parcelas
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Dialog Novo Contrato */}
      <Dialog open={showContratoForm} onOpenChange={setShowContratoForm}>
        <DialogContent className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}>
          <DialogHeader>
            <DialogTitle>Novo Contrato de Honorários</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitContrato} className="space-y-4">
            <div>
              <Label>Cliente</Label>
              <Select 
                value={contratoForm.cliente_id || ""} 
                onValueChange={(v) => setContratoForm({...contratoForm, cliente_id: v})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Tipo</Label>
              <Select 
                value={contratoForm.tipo || ""} 
                onValueChange={(v) => setContratoForm({...contratoForm, tipo: v})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de honorário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixo">Fixo</SelectItem>
                  <SelectItem value="exito">Êxito</SelectItem>
                  <SelectItem value="hibrido">Híbrido</SelectItem>
                  <SelectItem value="hora">Por Hora</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Valor Total</Label>
              <Input
                type="number"
                step="0.01"
                value={contratoForm.valor_total || ''}
                onChange={(e) => setContratoForm({...contratoForm, valor_total: parseFloat(e.target.value)})}
                required
              />
            </div>

            <div>
              <Label>Forma de Pagamento</Label>
              <Select 
                value={contratoForm.forma_pagamento || ""} 
                onValueChange={(v) => setContratoForm({...contratoForm, forma_pagamento: v})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="À vista ou parcelado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="a_vista">À Vista</SelectItem>
                  <SelectItem value="parcelado">Parcelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {contratoForm.forma_pagamento === 'parcelado' && (
              <div>
                <Label>Número de Parcelas</Label>
                <Input
                  type="number"
                  min="2"
                  value={contratoForm.numero_parcelas || ''}
                  onChange={(e) => setContratoForm({...contratoForm, numero_parcelas: parseInt(e.target.value)})}
                />
              </div>
            )}

            <div>
              <Label>Data de Início</Label>
              <Input
                type="date"
                value={contratoForm.data_inicio || ''}
                onChange={(e) => setContratoForm({...contratoForm, data_inicio: e.target.value})}
                required
              />
            </div>

            <div>
              <Label>Observações</Label>
              <Textarea
                value={contratoForm.observacoes || ''}
                onChange={(e) => setContratoForm({...contratoForm, observacoes: e.target.value})}
                rows={3}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setShowContratoForm(false)}>
                Cancelar
              </Button>
              <Button type="submit">Criar Contrato</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Parcelas */}
      <Dialog open={showParcelaDialog} onOpenChange={setShowParcelaDialog}>
        <DialogContent className={`max-w-2xl ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}`}>
          <DialogHeader>
            <DialogTitle>Parcelas - {selectedContrato?.cliente_nome}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {getParcelasContrato(selectedContrato?.id).map((parcela) => (
              <div 
                key={parcela.id} 
                className={`p-3 rounded-lg border flex items-center justify-between ${
                  isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  {parcela.status === 'pago' ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : parcela.status === 'atrasado' ? (
                    <XCircle className="w-5 h-5 text-red-600" />
                  ) : (
                    <Clock className="w-5 h-5 text-orange-600" />
                  )}
                  <div>
                    <div className="font-medium">
                      Parcela {parcela.numero_parcela} - R$ {parcela.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-gray-500">
                      Vencimento: {new Date(parcela.data_vencimento).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </div>
                {parcela.status === 'pendente' && (
                  <Button size="sm" onClick={() => marcarComoPago(parcela)}>
                    Marcar como Pago
                  </Button>
                )}
                {parcela.status === 'pago' && (
                  <span className="text-xs text-green-600">
                    Pago em {new Date(parcela.data_pagamento).toLocaleDateString('pt-BR')}
                  </span>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}