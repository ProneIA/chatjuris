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

const CATEGORIAS = [
  { value: "aluguel", label: "Aluguel" },
  { value: "funcionarios", label: "Funcionários" },
  { value: "tecnologia", label: "Tecnologia" },
  { value: "marketing", label: "Marketing" },
  { value: "despachante", label: "Despachante" },
  { value: "custas_processuais", label: "Custas Processuais" },
  { value: "fornecedores", label: "Fornecedores" },
  { value: "impostos", label: "Impostos" },
  { value: "outros", label: "Outros" },
];

export default function DespesasManager() {
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [despesaForm, setDespesaForm] = useState({});
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: despesas = [] } = useQuery({
    queryKey: ["despesas", user?.email],
    queryFn: () => base44.entities.Despesa.filter({ created_by: user.email }, "-created_date"),
    enabled: !!user?.email,
  });

  const createDespesaMutation = useMutation({
    mutationFn: (data) => base44.entities.Despesa.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["despesas"] });
      setShowForm(false);
      setDespesaForm({});
      toast.success("Despesa registrada!");
    },
  });

  const updateDespesaMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Despesa.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["despesas"] });
      toast.success("Despesa atualizada!");
    },
  });

  const marcarComoPago = (despesa) => {
    updateDespesaMutation.mutate({
      id: despesa.id,
      data: { ...despesa, status: "pago", data_pagamento: new Date().toISOString().split("T")[0] },
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createDespesaMutation.mutate(despesaForm);
  };

  const getCatLabel = (v) => CATEGORIAS.find((c) => c.value === v)?.label || v;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0", borderBottom: "1px solid var(--ink-6)", marginBottom: 16 }}>
        <h2 style={{ fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 600, color: "var(--ink)", margin: 0 }}>
          Despesas
        </h2>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={13} /> Nova Despesa
        </button>
      </div>

      {/* Lista */}
      <div style={{ display: "flex", flexDirection: "column", gap: 1, background: "var(--ink-6)" }}>
        {despesas.length === 0 && (
          <div style={{ background: "var(--white)", padding: "40px", textAlign: "center", fontSize: 12, color: "var(--ink-4)" }}>
            Nenhuma despesa registrada
          </div>
        )}
        {despesas.map((despesa) => (
          <div key={despesa.id} style={{
            background: "var(--white)", padding: "14px 20px",
            borderLeft: `3px solid ${despesa.status === "pago" ? "var(--ok)" : despesa.status === "atrasado" ? "var(--danger)" : "var(--warn)"}`,
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
              {despesa.status === "pago"
                ? <CheckCircle size={14} style={{ color: "var(--ok)", flexShrink: 0 }} />
                : despesa.status === "atrasado"
                ? <XCircle size={14} style={{ color: "var(--danger)", flexShrink: 0 }} />
                : <Clock size={14} style={{ color: "var(--warn)", flexShrink: 0 }} />}
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {despesa.descricao}
                </p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span className="badge badge-neutral">{getCatLabel(despesa.categoria)}</span>
                  <span style={{ fontSize: 10, color: "var(--ink-4)" }}>
                    Venc: {new Date(despesa.data_vencimento).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              </div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <p style={{ fontFamily: "var(--font-serif)", fontSize: 18, fontWeight: 600, color: "var(--ink)", margin: "0 0 6px", letterSpacing: "-0.03em" }}>
                {fmt(despesa.valor)}
              </p>
              {despesa.status === "pago" && despesa.data_pagamento && (
                <p style={{ fontSize: 10, color: "var(--ok)", margin: "0 0 6px" }}>
                  Pago em {new Date(despesa.data_pagamento).toLocaleDateString("pt-BR")}
                </p>
              )}
              {despesa.status === "pendente" && (
                <button className="btn-primary" style={{ padding: "5px 12px", fontSize: 11 }} onClick={() => marcarComoPago(despesa)}>
                  Pagar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Dialog Nova Despesa */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent style={{ borderRadius: 0 }}>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "var(--font-serif)", fontSize: 18 }}>Nova Despesa</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <Label>Descrição</Label>
              <Input value={despesaForm.descricao || ""} onChange={(e) => setDespesaForm({ ...despesaForm, descricao: e.target.value })} required />
            </div>
            <div>
              <Label>Categoria</Label>
              <Select value={despesaForm.categoria || ""} onValueChange={(v) => setDespesaForm({ ...despesaForm, categoria: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione a categoria" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map((cat) => <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Valor</Label>
              <Input type="number" step="0.01" value={despesaForm.valor || ""} onChange={(e) => setDespesaForm({ ...despesaForm, valor: parseFloat(e.target.value) })} required />
            </div>
            <div>
              <Label>Data de Vencimento</Label>
              <Input type="date" value={despesaForm.data_vencimento || ""} onChange={(e) => setDespesaForm({ ...despesaForm, data_vencimento: e.target.value })} required />
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea value={despesaForm.observacoes || ""} onChange={(e) => setDespesaForm({ ...despesaForm, observacoes: e.target.value })} rows={3} />
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", paddingTop: 8, borderTop: "1px solid var(--ink-6)" }}>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
              <button type="submit" className="btn-primary">Registrar Despesa</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}