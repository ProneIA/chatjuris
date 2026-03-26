import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Save, ArrowLeft, Loader2 } from "lucide-react";
import JusTrackLayout from "@/components/justrack/JusTrackLayout";
import TribunalSelect, { getTribunalNome } from "@/components/justrack/TribunalSelect";

function maskCNJ(v) {
  v = v.replace(/\D/g, "");
  if (v.length > 20) v = v.slice(0, 20);
  const d = v;
  let r = d;
  if (d.length > 7)  r = d.slice(0,7) + "-" + d.slice(7);
  if (d.length > 9)  r = d.slice(0,7) + "-" + d.slice(7,9) + "." + d.slice(9);
  if (d.length > 13) r = d.slice(0,7) + "-" + d.slice(7,9) + "." + d.slice(9,13) + "." + d.slice(13);
  if (d.length > 14) r = d.slice(0,7) + "-" + d.slice(7,9) + "." + d.slice(9,13) + "." + d.slice(13,14) + "." + d.slice(14);
  if (d.length > 16) r = d.slice(0,7) + "-" + d.slice(7,9) + "." + d.slice(9,13) + "." + d.slice(13,14) + "." + d.slice(14,16) + "." + d.slice(16);
  return r;
}

const EMPTY = {
  numeroProcesso: "", tribunalUrl: "", classeProcessual: "", tipoAcao: "",
  requerente: "", requerido: "", advogado: "", status: "Ativo",
  dataDistribuicao: "", valorCausa: "", observacoes: "", orgaoJulgador: "",
};

export default function JusTrackNovo({ editData = null }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(editData || EMPTY);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => { if (editData) setForm(editData); }, [editData]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.numeroProcesso.trim()) { setErro("Informe o número do processo."); return; }
    if (!form.tribunalUrl) { setErro("Selecione o tribunal."); return; }
    setSaving(true); setErro("");
    try {
      const payload = {
        ...form,
        tribunal: getTribunalNome(form.tribunalUrl),
        valorCausa: form.valorCausa ? Number(String(form.valorCausa).replace(/\./g, "").replace(",", ".")) : undefined,
      };
      if (editData?.id) {
        await base44.entities.Processo.update(editData.id, payload);
      } else {
        await base44.entities.Processo.create(payload);
      }
      navigate("/JusTrackProcessos");
    } catch (err) {
      setErro(err.message || "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    background: "#0d1117",
    border: "1px solid #1e2740",
    color: "#e8eaf0",
    padding: ".65rem .9rem",
    fontFamily: "'IBM Plex Sans', sans-serif",
    fontSize: ".85rem",
    outline: "none",
    width: "100%",
  };

  const labelStyle = {
    display: "block",
    fontSize: ".68rem",
    color: "#8892a4",
    fontFamily: "'IBM Plex Sans', sans-serif",
    textTransform: "uppercase",
    letterSpacing: ".1em",
    marginBottom: ".35rem",
    fontWeight: 600,
  };

  const Field = ({ label, children }) => (
    <div><label style={labelStyle}>{label}</label>{children}</div>
  );

  return (
    <JusTrackLayout>
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/JusTrackProcessos")} style={{ background: "none", border: "none", color: "#8892a4", cursor: "pointer", display: "flex", alignItems: "center", gap: ".4rem", fontFamily: "'IBM Plex Sans', sans-serif", fontSize: ".8rem" }}>
            <ArrowLeft style={{ width: 14, height: 14 }} /> Voltar
          </button>
          <div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: "1.5rem", color: "#C9A84C", margin: 0 }}>
              {editData ? "Editar Processo" : "Cadastrar Processo"}
            </h1>
            <p style={{ color: "#8892a4", fontSize: ".82rem", margin: ".2rem 0 0", fontFamily: "'IBM Plex Sans', sans-serif" }}>
              Preencha os dados do processo judicial
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ background: "#161b27", border: "1px solid #1e2740", padding: "1.5rem" }} className="space-y-5">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <Field label="Número do Processo (CNJ) *">
                  <input style={inputStyle} placeholder="0000000-00.0000.0.00.0000" value={form.numeroProcesso} onChange={e => set("numeroProcesso", maskCNJ(e.target.value))} maxLength={25} />
                </Field>
              </div>

              <div className="md:col-span-2">
                <Field label="Tribunal *">
                  <TribunalSelect value={form.tribunalUrl} onChange={v => set("tribunalUrl", v)} style={{ background: "#0d1117" }} />
                </Field>
              </div>

              <Field label="Classe Processual">
                <input style={inputStyle} placeholder="Ex: Ação Ordinária" value={form.classeProcessual} onChange={e => set("classeProcessual", e.target.value)} />
              </Field>

              <Field label="Tipo de Ação">
                <input style={inputStyle} placeholder="Ex: Indenizatória" value={form.tipoAcao} onChange={e => set("tipoAcao", e.target.value)} />
              </Field>

              <Field label="Requerente">
                <input style={inputStyle} placeholder="Nome do requerente" value={form.requerente} onChange={e => set("requerente", e.target.value)} />
              </Field>

              <Field label="Requerido">
                <input style={inputStyle} placeholder="Nome do requerido" value={form.requerido} onChange={e => set("requerido", e.target.value)} />
              </Field>

              <Field label="Advogado Responsável">
                <input style={inputStyle} placeholder="Nome do advogado" value={form.advogado} onChange={e => set("advogado", e.target.value)} />
              </Field>

              <Field label="Órgão Julgador">
                <input style={inputStyle} placeholder="Ex: 1ª Vara Cível" value={form.orgaoJulgador} onChange={e => set("orgaoJulgador", e.target.value)} />
              </Field>

              <Field label="Status">
                <select style={{ ...inputStyle, cursor: "pointer" }} value={form.status} onChange={e => set("status", e.target.value)}>
                  {["Ativo", "Arquivado", "Suspenso", "Baixado"].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>

              <Field label="Data de Distribuição">
                <input type="date" style={inputStyle} value={form.dataDistribuicao} onChange={e => set("dataDistribuicao", e.target.value)} />
              </Field>

              <Field label="Valor da Causa (R$)">
                <input style={inputStyle} placeholder="0,00" value={form.valorCausa} onChange={e => set("valorCausa", e.target.value)} />
              </Field>

              <div className="md:col-span-2">
                <Field label="Observações">
                  <textarea style={{ ...inputStyle, minHeight: 90, resize: "vertical" }} placeholder="Anotações, andamentos, observações..." value={form.observacoes} onChange={e => set("observacoes", e.target.value)} />
                </Field>
              </div>
            </div>

            {erro && (
              <p style={{ color: "#f87171", fontFamily: "'IBM Plex Sans', sans-serif", fontSize: ".8rem", background: "rgba(248,113,113,.08)", border: "1px solid rgba(248,113,113,.2)", padding: ".6rem .9rem" }}>{erro}</p>
            )}

            <div className="flex gap-3">
              <button type="submit" disabled={saving}
                style={{ display: "flex", alignItems: "center", gap: ".5rem", padding: ".75rem 1.5rem", background: "#C9A84C", border: "none", color: "#0d1117", cursor: saving ? "not-allowed" : "pointer", fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700, fontSize: ".82rem", opacity: saving ? .7 : 1 }}>
                {saving ? <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} /> : <Save style={{ width: 14, height: 14 }} />}
                {saving ? "Salvando..." : "Salvar Processo"}
              </button>
              <button type="button" onClick={() => navigate("/JusTrackProcessos")}
                style={{ padding: ".75rem 1.25rem", background: "transparent", border: "1px solid #1e2740", color: "#8892a4", cursor: "pointer", fontFamily: "'IBM Plex Sans', sans-serif", fontSize: ".82rem" }}>
                Cancelar
              </button>
            </div>
          </div>
        </form>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    </JusTrackLayout>
  );
}