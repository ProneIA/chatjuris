import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { MessageSquare, CheckCircle2, PauseCircle, AlertCircle } from "lucide-react";

export default function AgentSettings() {
  const [user, setUser] = useState(null);
  const [officeConfig, setOfficeConfig] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    office_name: "",
    lawyer_name: "",
    practice_areas: "",
    fee_table: "",
    working_hours: "",
    meeting_duration: 60,
    welcome_message: "",
  });

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      setUser(u);
      const [configs, sessions] = await Promise.all([
        base44.entities.OfficeConfig.filter({ user_id: u.id }),
        base44.entities.WhatsappSession.filter({ user_id: u.id }),
      ]);
      if (configs.length > 0) {
        const c = configs[0];
        setOfficeConfig(c);
        setForm({
          office_name: c.office_name || "",
          lawyer_name: c.lawyer_name || "",
          practice_areas: c.practice_areas || "",
          fee_table: c.fee_table || "",
          working_hours: c.working_hours || "",
          meeting_duration: c.meeting_duration || 60,
          welcome_message: c.welcome_message || "",
        });
      }
      if (sessions.length > 0) setSession(sessions[0]);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (officeConfig) {
        await base44.entities.OfficeConfig.update(officeConfig.id, { ...form, user_id: user.id });
      } else {
        const created = await base44.entities.OfficeConfig.create({ ...form, user_id: user.id });
        setOfficeConfig(created);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAgent = async (val) => {
    if (!session) return;
    await base44.entities.WhatsappSession.update(session.id, { agent_enabled: val });
    setSession({ ...session, agent_enabled: val });
  };

  const isConnected = session?.status === "connected";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-700 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: "1.5rem", textTransform: "uppercase", letterSpacing: "-0.02em", color: "var(--text)" }}>
          Configurações do Agente
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: ".85rem", marginTop: "0.25rem" }}>
          Configure os dados do escritório e controle o agente de WhatsApp
        </p>
      </div>

      {/* Seção 1 — Dados do escritório */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", marginBottom: "1.5rem" }}>
        <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--border)" }}>
          <h2 style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 600, fontSize: ".82rem", textTransform: "uppercase", letterSpacing: ".1em", color: "var(--text)", margin: 0 }}>
            Dados do Escritório
          </h2>
        </div>
        <div style={{ padding: "1.5rem" }} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label style={{ fontSize: ".75rem", fontFamily: "'Oswald', sans-serif", textTransform: "uppercase", letterSpacing: ".08em", color: "var(--text-muted)" }}>
                Nome do Escritório
              </Label>
              <Input
                value={form.office_name}
                onChange={e => setForm({ ...form, office_name: e.target.value })}
                placeholder="Silva & Associados"
              />
            </div>
            <div className="space-y-1">
              <Label style={{ fontSize: ".75rem", fontFamily: "'Oswald', sans-serif", textTransform: "uppercase", letterSpacing: ".08em", color: "var(--text-muted)" }}>
                Nome do Advogado
              </Label>
              <Input
                value={form.lawyer_name}
                onChange={e => setForm({ ...form, lawyer_name: e.target.value })}
                placeholder="Dr. João Silva"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label style={{ fontSize: ".75rem", fontFamily: "'Oswald', sans-serif", textTransform: "uppercase", letterSpacing: ".08em", color: "var(--text-muted)" }}>
              Áreas de Atuação
            </Label>
            <Input
              value={form.practice_areas}
              onChange={e => setForm({ ...form, practice_areas: e.target.value })}
              placeholder="Direito trabalhista, cível, família"
            />
          </div>

          <div className="space-y-1">
            <Label style={{ fontSize: ".75rem", fontFamily: "'Oswald', sans-serif", textTransform: "uppercase", letterSpacing: ".08em", color: "var(--text-muted)" }}>
              Tabela de Honorários
            </Label>
            <Textarea
              value={form.fee_table}
              onChange={e => setForm({ ...form, fee_table: e.target.value })}
              placeholder="Consulta: R$300&#10;Contrato trabalhista: R$800&#10;Audiência: R$500"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label style={{ fontSize: ".75rem", fontFamily: "'Oswald', sans-serif", textTransform: "uppercase", letterSpacing: ".08em", color: "var(--text-muted)" }}>
                Horário de Atendimento
              </Label>
              <Input
                value={form.working_hours}
                onChange={e => setForm({ ...form, working_hours: e.target.value })}
                placeholder="Seg-Sex 9h-18h"
              />
            </div>
            <div className="space-y-1">
              <Label style={{ fontSize: ".75rem", fontFamily: "'Oswald', sans-serif", textTransform: "uppercase", letterSpacing: ".08em", color: "var(--text-muted)" }}>
                Duração da Reunião (min)
              </Label>
              <Input
                type="number"
                value={form.meeting_duration}
                onChange={e => setForm({ ...form, meeting_duration: Number(e.target.value) })}
                min={15}
                max={480}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label style={{ fontSize: ".75rem", fontFamily: "'Oswald', sans-serif", textTransform: "uppercase", letterSpacing: ".08em", color: "var(--text-muted)" }}>
              Mensagem de Boas-vindas
            </Label>
            <Textarea
              value={form.welcome_message}
              onChange={e => setForm({ ...form, welcome_message: e.target.value })}
              placeholder="Olá! Sou o assistente virtual do escritório Silva & Associados. Como posso ajudá-lo?"
              rows={3}
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary"
              style={{ background: "var(--primary)", color: "#fff", border: "none" }}
            >
              {saving ? "Salvando..." : "Salvar Configurações"}
            </Button>
            {saved && (
              <span style={{ color: "#16a34a", fontSize: ".8rem", display: "flex", alignItems: "center", gap: 4 }}>
                <CheckCircle2 className="w-4 h-4" /> Salvo com sucesso
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Seção 2 — Controle do agente */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--border)" }}>
          <h2 style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 600, fontSize: ".82rem", textTransform: "uppercase", letterSpacing: ".1em", color: "var(--text)", margin: 0 }}>
            Controle do Agente
          </h2>
        </div>
        <div style={{ padding: "1.5rem" }}>
          {!isConnected ? (
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "1rem", background: "var(--surface-2)", border: "1px solid var(--border)" }}>
              <AlertCircle className="w-5 h-5" style={{ color: "var(--text-muted)", flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: ".85rem", color: "var(--text)", margin: 0 }}>
                  Conecte seu WhatsApp primeiro para ativar o agente.
                </p>
                <Link
                  to="/WhatsAppConnect"
                  style={{ fontSize: ".8rem", color: "var(--primary)", textDecoration: "underline", marginTop: "0.25rem", display: "inline-block" }}
                >
                  Ir para configuração do WhatsApp →
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: ".85rem", color: "var(--text-muted)" }}>
                <MessageSquare className="w-4 h-4" />
                <span>WhatsApp conectado: <strong style={{ color: "var(--text)" }}>{session.phone_number || "número vinculado"}</strong></span>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem", border: "1px solid var(--border)" }}>
                <div>
                  <p style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 600, fontSize: ".8rem", textTransform: "uppercase", letterSpacing: ".08em", color: "var(--text)", margin: 0 }}>
                    Agente Ativo
                  </p>
                  <p style={{ fontSize: ".75rem", color: "var(--text-muted)", margin: "0.25rem 0 0" }}>
                    Ativar resposta automática para clientes no WhatsApp
                  </p>
                </div>
                <Switch
                  checked={!!session.agent_enabled}
                  onCheckedChange={handleToggleAgent}
                />
              </div>

              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.75rem 1rem",
                background: session.agent_enabled ? "rgba(22,163,74,0.08)" : "var(--surface-2)",
                border: `1px solid ${session.agent_enabled ? "rgba(22,163,74,0.3)" : "var(--border)"}`,
              }}>
                {session.agent_enabled ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" style={{ color: "#16a34a" }} />
                    <span style={{ fontSize: ".82rem", color: "#16a34a", fontFamily: "'Oswald', sans-serif", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em" }}>
                      Agente respondendo automaticamente
                    </span>
                  </>
                ) : (
                  <>
                    <PauseCircle className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                    <span style={{ fontSize: ".82rem", color: "var(--text-muted)", fontFamily: "'Oswald', sans-serif", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em" }}>
                      Agente pausado
                    </span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}