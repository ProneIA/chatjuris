import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, CheckCircle, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";

const fmt = (v) => `R$ ${(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

export default function HonorariosManager() {
  const [user, setUser] = useState(null);
  const [showContratoForm, setShowContratoForm] = useState(false);
  const [showParcelaDialog, setShowParcelaDialog] = useState(false);
  const [selectedContrato, setSelectedContrato] = useState(null);
  const [contratoForm, setContratoForm] = useState({});
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: contratos = [] } = useQuery({
    queryKey: ["honorarios", user?.email],
    queryFn: () => base44.entities.HonorarioContrato.filter({ created_by: user.email }, "-created_date"),
    enabled: !!user?.email,
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ["clients", user?.email],
    queryFn: () => base44.entities.Client.filter({ created_by: user.email }),
    enabled: !!user?.email,
  });

  const { data: parcelas = [] } = useQuery({
    queryKey: ["parcelas", user?.email],
    queryFn: () => base44.entities.ParcelaHonorario.filter({ created_by: user.email }),
    enabled: !!user?.email,
  });

  const createContratoMutation = useMutation({
    mutationFn: async (data) => {
      const contrato = await base44.entities.HonorarioContrato.create(data);
      if (data.forma_pagamento === "parcelado" && data.numero_parcelas > 1) {
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
            data_vencimento: dataVencimento.toISOString().split("T")[0],
            status: "pendente",
          });
        }
      } else {
        await base44.entities.ParcelaHonorario.create({
          contrato_id: contrato.id,
          cliente_nome: data.cliente_nome,
          numero_parcela: 1,
          valor: data.valor_total,
          data_vencimento: data.data_inicio,
          status: "pendente",
        });
      }
      return contrato;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["honorarios"] });
      queryClient.invalidateQueries({ queryKey: ["parcelas"] });
      setShowContratoForm(false);
      setContratoForm({});
      toast.success("Contrato criado com sucesso!");
    },
  });

  const updateParcelaMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ParcelaHonorario.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parcelas"] });
      queryClient.invalidateQueries({ queryKey: ["honorarios"] });
      toast.success("Parcela atualizada!");
    },
  });

  const marcarComoPago = (parcela) => {
    updateParcelaMutation.mutate({
      id: parcela.id,
      data: { ...parcela, status: "pago", data_pagamento: new Date().toISOString().split("T")[0] },
    });
  };

  const getParcelasContrato = (contratoId) => parcelas.filter((p) => p.contrato_id === contratoId);

  const handleSubmitContrato = (e) => {
    e.preventDefault();
    const cliente = clientes.find((c) => c.id === contratoForm.cliente_id);
    createContratoMutation.mutate({
      ...contratoForm,
      cliente_nome: cliente?.name || "",
      valor_pendente: contratoForm.valor_total,
      valor_recebido: 0,
    });
  };

  const tipoLabel = { fixo: "Fixo", exito: "Êxito", hibrido: "Híbrido", hora: "Por Hora" };
  const tipoColor = { fixo: "var(--ink)", exito: "var(--ok)", hibrido: "var(--warn)", hora: "var(--ink-3)" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Header da seção */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0", borderBottom: "1px solid var(--ink-6)", marginBottom: 16 }}>
        <h2 style={{ fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 600, color: "var(--ink)", margin: 0 }}>
          Contratos de Honorários
        </h2>
        <button className="btn-primary" onClick={() => setShowContratoForm(true)}>
          <Plus size={13} /> Novo Contrato
        </button>
      </div>

      {/* Lista de contratos */}
      <div style={{ display: "flex", flexDirection: "column", gap: 1, background: "var(--ink-6)" }}>
        {contratos.length === 0 && (
          <div style={{ background: "var(--white)", padding: "40px", textAlign: "center", fontSize: 12, color: "var(--ink-4)" }}>
            Nenhum contrato cadastrado
          </div>
        )}
        {contratos.map((contrato) => {
          const parcelasContrato = getParcelasContrato(contrato.id);
          const parcelasPagas = parcelasContrato.filter((p) => p.status === "pago").length;
          const pct = parcelasContrato.length > 0 ? (parcelasPagas / parcelasContrato.length) * 100 : 0;

          return (
            <div key={contrato.id} style={{ background: "var(--white)", padding: "16px 20px", borderLeft: `3px solid ${tipoColor[contrato.tipo] || "var(--ink-5)"}` }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", margin: "0 0 6px" }}>
                    {contrato.cliente_nome}
                  </p>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                    <span className="badge badge-neutral">{tipoLabel[contrato.tipo] || contrato.tipo}</span>
                    <span className={`badge ${contrato.status === "ativo" ? "badge-success" : "badge-neutral"}`}>
                      {contrato.status}
                    </span>
                  </div>
                  {/* Barra de progresso editorial */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ flex: 1, height: 2, background: "var(--ink-6)" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: "var(--ok)", transition: "width 0.4s" }} />
                    </div>
                    <span style={{ fontSize: 10, color: "var(--ink-4)", whiteSpace: "nowrap" }}>
                      {parcelasPagas}/{parcelasContrato.length} pagas
                    </span>
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ fontFamily: "var(--font-serif)", fontSize: 22, fontWeight: 600, color: "var(--ink)", margin: "0 0 8px", letterSpacing: "-0.03em" }}>
                    {fmt(contrato.valor_total)}
                  </p>
                  <button
                    className="btn-secondary"
                    style={{ padding: "5px 12px", fontSize: 11 }}
                    onClick={() => { setSelectedContrato(contrato); setShowParcelaDialog(true); }}
                  >
                    Ver Parcelas
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dialog Novo Contrato */}
      <Dialog open={showContratoForm} onOpenChange={setShowContratoForm}>
        <DialogContent style={{ borderRadius: 0 }}>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "var(--font-serif)", fontSize: 18 }}>Novo Contrato de Honorários</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitContrato} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <Label>Cliente</Label>
              <Select value={contratoForm.cliente_id || ""} onValueChange={(v) => setContratoForm({ ...contratoForm, cliente_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                <SelectContent>
                  {clientes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={contratoForm.tipo || ""} onValueChange={(v) => setContratoForm({ ...contratoForm, tipo: v })}>
                <SelectTrigger><SelectValue placeholder="Tipo de honorário" /></SelectTrigger>
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
              <Input type="number" step="0.01" value={contratoForm.valor_total || ""} onChange={(e) => setContratoForm({ ...contratoForm, valor_total: parseFloat(e.target.value) })} required />
            </div>
            <div>
              <Label>Forma de Pagamento</Label>
              <Select value={contratoForm.forma_pagamento || ""} onValueChange={(v) => setContratoForm({ ...contratoForm, forma_pagamento: v })}>
                <SelectTrigger><SelectValue placeholder="À vista ou parcelado" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="a_vista">À Vista</SelectItem>
                  <SelectItem value="parcelado">Parcelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {contratoForm.forma_pagamento === "parcelado" && (
              <div>
                <Label>Número de Parcelas</Label>
                <Input type="number" min="2" value={contratoForm.numero_parcelas || ""} onChange={(e) => setContratoForm({ ...contratoForm, numero_parcelas: parseInt(e.target.value) })} />
              </div>
            )}
            <div>
              <Label>Data de Início</Label>
              <Input type="date" value={contratoForm.data_inicio || ""} onChange={(e) => setContratoForm({ ...contratoForm, data_inicio: e.target.value })} required />
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea value={contratoForm.observacoes || ""} onChange={(e) => setContratoForm({ ...contratoForm, observacoes: e.target.value })} rows={3} />
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", paddingTop: 8, borderTop: "1px solid var(--ink-6)" }}>
              <button type="button" className="btn-secondary" onClick={() => setShowContratoForm(false)}>Cancelar</button>
              <button type="submit" className="btn-primary">Criar Contrato</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Parcelas */}
      <Dialog open={showParcelaDialog} onOpenChange={setShowParcelaDialog}>
        <DialogContent style={{ borderRadius: 0, maxWidth: 600 }}>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "var(--font-serif)", fontSize: 18 }}>
              Parcelas — {selectedContrato?.cliente_nome}
            </DialogTitle>
          </DialogHeader>
          <div style={{ display: "flex", flexDirection: "column", gap: 1, background: "var(--ink-6)", maxHeight: 360, overflowY: "auto" }}>
            {getParcelasContrato(selectedContrato?.id).map((parcela) => (
              <div key={parcela.id} style={{ background: "var(--white)", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {parcela.status === "pago" ? <CheckCircle size={14} style={{ color: "var(--ok)" }} />
                    : parcela.status === "atrasado" ? <XCircle size={14} style={{ color: "var(--danger)" }} />
                    : <Clock size={14} style={{ color: "var(--warn)" }} />}
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", margin: 0 }}>
                      Parcela {parcela.numero_parcela} — {fmt(parcela.valor)}
                    </p>
                    <p style={{ fontSize: 10, color: "var(--ink-4)", margin: "2px 0 0" }}>
                      Venc: {new Date(parcela.data_vencimento).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
                {parcela.status === "pendente" && (
                  <button className="btn-primary" style={{ padding: "5px 12px", fontSize: 11 }} onClick={() => marcarComoPago(parcela)}>
                    Marcar Pago
                  </button>
                )}
                {parcela.status === "pago" && (
                  <span style={{ fontSize: 10, color: "var(--ok)", fontWeight: 600 }}>
                    Pago em {new Date(parcela.data_pagamento).toLocaleDateString("pt-BR")}
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