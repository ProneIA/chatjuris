import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  Tag, Plus, RefreshCw, Copy, CheckCircle2, XCircle, 
  Percent, Calendar, AlertCircle, Info
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Cupom padrão 50% Mensal baseado na especificação
const DEFAULT_COUPON = {
  name: "DESCONTO_50_MENSAL",
  code: "MENSAL50OFF",
  type: "fixed_percentage",
  value: 50,
  max_allowed_amount: 100,
  total_amount: 10000,
  status: "active",
  date_expiration: "2026-12-31T23:59:59.000-03:00",
  rules: {
    max_redeems_per_user: 1
  }
};

export default function CouponsManager({ isDark }) {
  const queryClient = useQueryClient();
  const [createDialog, setCreateDialog] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [couponForm, setCouponForm] = useState(DEFAULT_COUPON);

  // ── Buscar cupons ──────────────────────────────────────────────────────────
  const { data: coupons = [], isLoading, refetch } = useQuery({
    queryKey: ['mp-coupons'],
    queryFn: async () => {
      const res = await base44.functions.invoke('manageMPCoupons', { action: 'list' });
      if (!res.data?.success) throw new Error(res.data?.error || 'Erro ao listar cupons');
      return res.data.data;
    },
  });

  // ── Criar cupom ────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: async (data) => {
      const res = await base44.functions.invoke('manageMPCoupons', { action: 'create', coupon_data: data });
      if (!res.data?.success) throw new Error(res.data?.error || 'Erro ao criar cupom');
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mp-coupons'] });
      toast.success('Cupom criado com sucesso no Mercado Pago!');
      setCreateDialog(false);
    },
    onError: (e) => toast.error(`Erro: ${e.message}`),
  });

  // ── Ativar/Desativar cupom ─────────────────────────────────────────────────
  const toggleMutation = useMutation({
    mutationFn: async ({ id, new_status }) => {
      const res = await base44.functions.invoke('manageMPCoupons', { action: 'toggle_status', coupon_id: id, new_status });
      if (!res.data?.success) throw new Error(res.data?.error || 'Erro ao atualizar cupom');
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mp-coupons'] });
      toast.success('Status do cupom atualizado!');
    },
    onError: (e) => toast.error(`Erro: ${e.message}`),
  });

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado!');
  };

  const promptText = JSON.stringify(couponForm, null, 2);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Cupons de Desconto — Mercado Pago
          </h2>
          <p className={`text-sm mt-0.5 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
            Gerencie cupons diretamente na API do Mercado Pago
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="w-4 h-4" /> Atualizar
          </Button>
          <Button size="sm" onClick={() => setCreateDialog(true)} className="gap-2 bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4" /> Criar Cupom
          </Button>
        </div>
      </div>

      {/* Card de destaque: Cupom MENSAL50OFF */}
      <Card className={`border-2 ${isDark ? 'bg-neutral-900 border-green-900' : 'bg-green-50 border-green-200'}`}>
        <CardContent className="pt-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-green-600 flex items-center justify-center shrink-0">
                <Percent className="w-7 h-7 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>50% OFF</span>
                  <Badge className="bg-green-600 text-white text-xs">Plano Mensal</Badge>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <code className={`font-mono text-sm font-bold px-2 py-0.5 rounded ${isDark ? 'bg-neutral-800 text-green-400' : 'bg-white text-green-700 border border-green-200'}`}>
                    MENSAL50OFF
                  </code>
                  <button onClick={() => copyToClipboard('MENSAL50OFF')} className="text-gray-400 hover:text-gray-600">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <p className={`text-xs mt-1 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                  Máx. 1 uso por usuário · Expira 31/12/2026 · Limite: 10.000 usos totais
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:items-end">
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={() => { setCouponForm(DEFAULT_COUPON); setShowPrompt(true); }}
              >
                <Info className="w-4 h-4" /> Ver Payload
              </Button>
              <Button
                size="sm"
                className="gap-2 bg-green-600 hover:bg-green-700"
                onClick={() => { setCouponForm(DEFAULT_COUPON); setCreateDialog(true); }}
              >
                <Plus className="w-4 h-4" /> Criar este Cupom
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de cupons existentes */}
      <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <Tag className="w-5 h-5" />
            Cupons Cadastrados no Mercado Pago
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : coupons.length === 0 ? (
            <div className="text-center py-12">
              <Tag className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-neutral-700' : 'text-gray-300'}`} />
              <p className={`font-medium ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                Nenhum cupom encontrado
              </p>
              <p className={`text-sm mt-1 ${isDark ? 'text-neutral-600' : 'text-gray-400'}`}>
                Crie o cupom MENSAL50OFF acima para começar
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`border-b ${isDark ? 'border-neutral-800' : 'border-gray-100'}`}>
                  <tr>
                    <th className={`text-left p-4 text-xs font-medium uppercase tracking-wider ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>Código</th>
                    <th className={`text-left p-4 text-xs font-medium uppercase tracking-wider ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>Nome</th>
                    <th className={`text-left p-4 text-xs font-medium uppercase tracking-wider ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>Desconto</th>
                    <th className={`text-left p-4 text-xs font-medium uppercase tracking-wider ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>Status</th>
                    <th className={`text-left p-4 text-xs font-medium uppercase tracking-wider ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>Expira</th>
                    <th className={`text-left p-4 text-xs font-medium uppercase tracking-wider ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((c) => (
                    <tr key={c.id} className={`border-b ${isDark ? 'border-neutral-800' : 'border-gray-50'}`}>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <code className={`font-mono text-sm font-bold ${isDark ? 'text-green-400' : 'text-green-700'}`}>{c.code}</code>
                          <button onClick={() => copyToClipboard(c.code)} className="text-gray-400 hover:text-gray-600">
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className={`p-4 text-sm ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>{c.name}</td>
                      <td className="p-4">
                        <Badge variant="outline" className="gap-1 font-bold">
                          <Percent className="w-3 h-3" />
                          {c.value}%
                        </Badge>
                      </td>
                      <td className="p-4">
                        {c.status === 'active' ? (
                          <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                            <CheckCircle2 className="w-4 h-4" /> Ativo
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-500 text-sm font-medium">
                            <XCircle className="w-4 h-4" /> Inativo
                          </span>
                        )}
                      </td>
                      <td className={`p-4 text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                        {c.date_expiration 
                          ? format(new Date(c.date_expiration), "dd/MM/yyyy", { locale: ptBR }) 
                          : '—'}
                      </td>
                      <td className="p-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleMutation.mutate({ id: c.id, new_status: c.status === 'active' ? 'inactive' : 'active' })}
                          disabled={toggleMutation.isPending}
                          className="text-xs"
                        >
                          {c.status === 'active' ? 'Desativar' : 'Ativar'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog: Criar cupom */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent className={`max-w-lg ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}`}>
          <DialogHeader>
            <DialogTitle className={isDark ? 'text-white' : 'text-gray-900'}>
              Criar Cupom no Mercado Pago
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>Código</label>
                <Input value={couponForm.code} onChange={e => setCouponForm(p => ({ ...p, code: e.target.value }))} className="font-mono" />
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>Nome interno</label>
                <Input value={couponForm.name} onChange={e => setCouponForm(p => ({ ...p, name: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>Desconto (%)</label>
                <Input type="number" value={couponForm.value} onChange={e => setCouponForm(p => ({ ...p, value: Number(e.target.value) }))} />
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>Max usos total</label>
                <Input type="number" value={couponForm.total_amount} onChange={e => setCouponForm(p => ({ ...p, total_amount: Number(e.target.value) }))} />
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>Max/usuário</label>
                <Input type="number" value={couponForm.rules?.max_redeems_per_user || 1} onChange={e => setCouponForm(p => ({ ...p, rules: { ...p.rules, max_redeems_per_user: Number(e.target.value) } }))} />
              </div>
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>Data expiração</label>
              <Input type="date" value={couponForm.date_expiration?.split('T')[0]} onChange={e => setCouponForm(p => ({ ...p, date_expiration: `${e.target.value}T23:59:59.000-03:00` }))} />
            </div>

            <div className={`p-3 rounded-lg border text-xs ${isDark ? 'bg-green-900/30 border-green-800 text-green-400' : 'bg-green-50 border-green-100 text-green-700'}`}>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <p>Este cupom será restrito ao <strong>Plano Mensal (Assinatura Mensal Juris — R$ 119,90/mês)</strong> via <code>eligibility.preapproval_plan_ids</code>. Usuários de outros planos não poderão utilizá-lo.</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialog(false)}>Cancelar</Button>
            <Button
              onClick={() => createMutation.mutate(couponForm)}
              disabled={createMutation.isPending || !couponForm.code}
              className="bg-green-600 hover:bg-green-700"
            >
              {createMutation.isPending ? 'Criando...' : 'Criar Cupom'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Ver payload JSON */}
      <Dialog open={showPrompt} onOpenChange={setShowPrompt}>
        <DialogContent className={`max-w-xl ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}`}>
          <DialogHeader>
            <DialogTitle className={isDark ? 'text-white' : 'text-gray-900'}>
              Payload JSON — Cupom MENSAL50OFF
            </DialogTitle>
          </DialogHeader>
          <div className="relative">
            <pre className={`text-xs rounded-lg p-4 overflow-auto max-h-80 font-mono ${isDark ? 'bg-neutral-800 text-green-400' : 'bg-slate-50 text-slate-800'}`}>
              {promptText}
            </pre>
            <Button
              size="sm"
              variant="outline"
              className="absolute top-2 right-2"
              onClick={() => copyToClipboard(promptText)}
            >
              <Copy className="w-3.5 h-3.5 mr-1" /> Copiar
            </Button>
          </div>
          <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-400'}`}>
            Substitua <strong>ID_DO_SEU_PLANO_MENSAL_AQUI</strong> pelo ID real do seu preapproval_plan no Mercado Pago antes de enviar via API.
          </p>
          <DialogFooter>
            <Button onClick={() => setShowPrompt(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}