import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  MessageSquare, CheckCircle2, PauseCircle, AlertCircle,
  Bot, Clock, DollarSign, FileText, Settings2, Mic2
} from "lucide-react";

const TONES = [
  { value: "formal", label: "Formal", desc: "Linguagem jurídica, respeitosa e formal" },
  { value: "profissional", label: "Profissional", desc: "Equilibrada, clara e confiante" },
  { value: "amigavel", label: "Amigável", desc: "Mais próxima, acolhedora e acessível" },
];

const SectionCard = ({ icon: Icon, title, children }) => (
  <div style={{ background: "var(--surface)", border: "1px solid var(--border)", marginBottom: "1.5rem" }}>
    <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <Icon className="w-4 h-4" style={{ color: "var(--primary)" }} />
      <h2 style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 600, fontSize: ".82rem", textTransform: "uppercase", letterSpacing: ".1em", color: "var(--text)", margin: 0 }}>
        {title}
      </h2>
    </div>
    <div style={{ padding: "1.5rem" }} className="space-y-4">
      {children}
    </div>
  </div>
);

const FieldLabel = ({ children }) => (
  <Label style={{ fontSize: ".72rem", fontFamily: "'Oswald', sans-serif", textTransform: "uppercase", letterSpacing: ".08em", color: "var(--text-muted)" }}>
    {children}
  </Label>
);

export default function AgentSettings() {
  const [user, setUser] = useState(null);
  const [officeConfig, setOfficeConfig] = useState(null);
  const [agentConfig, setAgentConfig] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [office, setOffice] = useState({
    office_name: "",
    lawyer_name: "",
    practice_areas: "",
    fee_table: "",
    working_hours: "",
    meeting_duration: 60,
    welcome_message: "",
  });

  const [agent, setAgent] = useState({
    agent_name: "",
    response_tone: "profissional",
    custom_instructions: "",
    collect_appointment_info: true,
    services_offered: "",
    greeting_message: "",
  });

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      setUser(u);
      const [configs, agentConfigs, sessions] = await Promise.all([
        base44.entities.OfficeConfig.filter({ user_id: u.id }),
        base44.entities.WhatsAppAgentConfig.filter({ created_by: u.email }),
        base44.entities.WhatsappSession.filter({ user_id: u.id }),
      ]);

      if (configs.length > 0) {
        const c = configs[0];
        setOfficeConfig(c);
        setOffice({
          office_name: c.office_name || "",
          lawyer_name: c.lawyer_name || "",
          practice_areas: c.practice_areas || "",
          fee_table: c.fee_table || "",
          working_hours: c.working_hours || "",
          meeting_duration: c.meeting_duration || 60,
          welcome_message: c.welcome_message || "",
        });
      }

      if (agentConfigs.length > 0) {
        const a = agentConfigs[0];
        setAgentConfig(a);
        setAgent({
          agent_name: a.agent_name || "",
          response_tone: a.response_tone || "profissional",
          custom_instructions: a.custom_instructions || "",
          collect_appointment_info: a.collect_appointment_info !== false,
          services_offered: Array.isArray(a.services_offered) ? a.services_offered.join(", ") : (a.services_offered || ""),
          greeting_message: a.greeting_message || "",
        });
      }

      if (sessions.length > 0) setSession(sessions[0]);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Salvar OfficeConfig
      if (officeConfig) {
        await base44.entities.OfficeConfig.update(officeConfig.id, { ...office, user_id: user.id });
      } else {
        const created = await base44.entities.OfficeConfig.create({ ...office, user_id: user.id });
        setOfficeConfig(created);
      }

      // Salvar WhatsAppAgentConfig
      const agentData = {
        ...agent,
        services_offered: agent.services_offered.split(",").map(s => s.trim()).filter(Boolean),
        office_name: office.office_name,
        office_hours: office.working_hours,
      };
      if (agentConfig) {
        await base44.entities.WhatsAppAgentConfig.update(agentConfig.id, agentData);
      } else {
        const created = await base44.entities.WhatsAppAgentConfig.create(agentData);
        setAgentConfig(created);
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
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: "1.5rem", textTransform: "uppercase", letterSpacing: "-0.02em", color: "var(--text)" }}>
          Configurações do Agente
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: ".85rem", marginTop: "0.25rem" }}>
          Configure completamente como o agente virtual vai se comportar e responder seus clientes
        </p>
      </div>

      {/* Status do agente */}
      <SectionCard icon={MessageSquare} title="Controle do Agente">
        {!isConnected ? (
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "1rem", background: "var(--surface-2)", border: "1px solid var(--border)" }}>
            <AlertCircle className="w-5 h-5" style={{ color: "var(--text-muted)", flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: ".85rem", color: "var(--text)", margin: 0 }}>
                Conecte seu WhatsApp primeiro para ativar o agente.
              </p>
              <Link to="/WhatsAppConnect" style={{ fontSize: ".8rem", color: "var(--primary)", textDecoration: "underline", marginTop: "0.25rem", display: "inline-block" }}>
                Ir para configuração do WhatsApp →
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem", border: "1px solid var(--border)" }}>
              <div>
                <p style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 600, fontSize: ".8rem", textTransform: "uppercase", letterSpacing: ".08em", color: "var(--text)", margin: 0 }}>
                  Agente Ativo
                </p>
                <p style={{ fontSize: ".75rem", color: "var(--text-muted)", margin: "0.25rem 0 0" }}>
                  Ativar resposta automática para clientes no WhatsApp
                </p>
              </div>
              <Switch checked={!!session.agent_enabled} onCheckedChange={handleToggleAgent} />
            </div>
            <div style={{
              display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1rem",
              background: session.agent_enabled ? "rgba(22,163,74,0.08)" : "var(--surface-2)",
              border: `1px solid ${session.agent_enabled ? "rgba(22,163,74,0.3)" : "var(--border)"}`,
            }}>
              {session.agent_enabled
                ? <><CheckCircle2 className="w-4 h-4" style={{ color: "#16a34a" }} /><span style={{ fontSize: ".82rem", color: "#16a34a", fontFamily: "'Oswald', sans-serif", fontWeight: 600, textTransform: "uppercase" }}>Agente respondendo automaticamente</span></>
                : <><PauseCircle className="w-4 h-4" style={{ color: "var(--text-muted)" }} /><span style={{ fontSize: ".82rem", color: "var(--text-muted)", fontFamily: "'Oswald', sans-serif", fontWeight: 600, textTransform: "uppercase" }}>Agente pausado</span></>
              }
            </div>
          </>
        )}
      </SectionCard>

      {/* Identidade do agente */}
      <SectionCard icon={Bot} title="Identidade do Agente">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <FieldLabel>Nome do Assistente</FieldLabel>
            <Input
              value={agent.agent_name}
              onChange={e => setAgent({ ...agent, agent_name: e.target.value })}
              placeholder="Júlia, Max, Assistente Jurídico..."
            />
          </div>
          <div className="space-y-1">
            <FieldLabel>Nome do Escritório</FieldLabel>
            <Input
              value={office.office_name}
              onChange={e => setOffice({ ...office, office_name: e.target.value })}
              placeholder="Silva & Associados"
            />
          </div>
        </div>
        <div className="space-y-1">
          <FieldLabel>Nome do Advogado Responsável</FieldLabel>
          <Input
            value={office.lawyer_name}
            onChange={e => setOffice({ ...office, lawyer_name: e.target.value })}
            placeholder="Dr. João Silva"
          />
        </div>
        <div className="space-y-1">
          <FieldLabel>Mensagem de Boas-vindas</FieldLabel>
          <Textarea
            value={agent.greeting_message || office.welcome_message}
            onChange={e => {
              setAgent({ ...agent, greeting_message: e.target.value });
              setOffice({ ...office, welcome_message: e.target.value });
            }}
            placeholder="Olá! Sou a Júlia, assistente virtual do escritório Silva & Associados. Como posso ajudá-lo hoje?"
            rows={3}
          />
          <p style={{ fontSize: ".7rem", color: "var(--text-muted)" }}>Esta mensagem é enviada quando o cliente entra em contato pela primeira vez.</p>
        </div>
      </SectionCard>

      {/* Tom e comportamento */}
      <SectionCard icon={Mic2} title="Tom e Comportamento">
        <div className="space-y-1">
          <FieldLabel>Tom das Respostas</FieldLabel>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {TONES.map(t => (
              <button
                key={t.value}
                onClick={() => setAgent({ ...agent, response_tone: t.value })}
                style={{
                  padding: "0.75rem 1rem",
                  border: `2px solid ${agent.response_tone === t.value ? "var(--primary)" : "var(--border)"}`,
                  background: agent.response_tone === t.value ? "var(--primary-light)" : "var(--surface)",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <div style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 600, fontSize: ".8rem", textTransform: "uppercase", color: agent.response_tone === t.value ? "var(--primary)" : "var(--text)" }}>
                  {t.label}
                </div>
                <div style={{ fontSize: ".72rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>{t.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem", border: "1px solid var(--border)" }}>
          <div>
            <p style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 600, fontSize: ".78rem", textTransform: "uppercase", letterSpacing: ".08em", color: "var(--text)", margin: 0 }}>
              Coletar informações para agendamento
            </p>
            <p style={{ fontSize: ".72rem", color: "var(--text-muted)", margin: "0.2rem 0 0" }}>
              O agente perguntará nome, telefone e assunto ao novo contato
            </p>
          </div>
          <Switch
            checked={agent.collect_appointment_info}
            onCheckedChange={val => setAgent({ ...agent, collect_appointment_info: val })}
          />
        </div>

        <div className="space-y-1">
          <FieldLabel>Instruções Personalizadas</FieldLabel>
          <Textarea
            value={agent.custom_instructions}
            onChange={e => setAgent({ ...agent, custom_instructions: e.target.value })}
            placeholder="Ex: Nunca informe valores de honorários por WhatsApp. Sempre direcione para uma consulta presencial. Não responda sobre causas criminais. Use apenas informações verificadas..."
            rows={5}
          />
          <p style={{ fontSize: ".7rem", color: "var(--text-muted)" }}>Regras específicas que o agente deve seguir ao responder. Seja específico.</p>
        </div>
      </SectionCard>

      {/* Serviços e honorários */}
      <SectionCard icon={DollarSign} title="Serviços e Honorários">
        <div className="space-y-1">
          <FieldLabel>Áreas de Atuação</FieldLabel>
          <Input
            value={office.practice_areas}
            onChange={e => setOffice({ ...office, practice_areas: e.target.value })}
            placeholder="Direito trabalhista, cível, família, previdenciário"
          />
        </div>
        <div className="space-y-1">
          <FieldLabel>Serviços Oferecidos (separados por vírgula)</FieldLabel>
          <Input
            value={agent.services_offered}
            onChange={e => setAgent({ ...agent, services_offered: e.target.value })}
            placeholder="Consulta jurídica, elaboração de contratos, acompanhamento processual"
          />
        </div>
        <div className="space-y-1">
          <FieldLabel>Tabela de Honorários (informativa para o agente)</FieldLabel>
          <Textarea
            value={office.fee_table}
            onChange={e => setOffice({ ...office, fee_table: e.target.value })}
            placeholder="Consulta inicial: R$300&#10;Elaboração de contrato: R$800&#10;Representação em audiência: R$1.500&#10;Ação trabalhista: a partir de R$2.000"
            rows={4}
          />
          <p style={{ fontSize: ".7rem", color: "var(--text-muted)" }}>O agente usará estas informações como referência, mas só divulgará se a instrução personalizada permitir.</p>
        </div>
      </SectionCard>

      {/* Horários */}
      <SectionCard icon={Clock} title="Disponibilidade">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <FieldLabel>Horário de Atendimento</FieldLabel>
            <Input
              value={office.working_hours}
              onChange={e => setOffice({ ...office, working_hours: e.target.value })}
              placeholder="Seg-Sex 9h-18h, Sáb 9h-12h"
            />
          </div>
          <div className="space-y-1">
            <FieldLabel>Duração Padrão da Consulta (min)</FieldLabel>
            <Input
              type="number"
              value={office.meeting_duration}
              onChange={e => setOffice({ ...office, meeting_duration: Number(e.target.value) })}
              min={15} max={480}
            />
          </div>
        </div>
      </SectionCard>

      {/* Botão salvar */}
      <div className="flex items-center gap-3 pb-8">
        <Button
          onClick={handleSave}
          disabled={saving}
          style={{ background: "var(--primary)", color: "#fff", border: "none", fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: ".75rem", textTransform: "uppercase", letterSpacing: ".1em", padding: "0.65rem 1.5rem" }}
        >
          {saving ? "Salvando..." : "Salvar Todas as Configurações"}
        </Button>
        {saved && (
          <span style={{ color: "#16a34a", fontSize: ".8rem", display: "flex", alignItems: "center", gap: 4 }}>
            <CheckCircle2 className="w-4 h-4" /> Salvo com sucesso
          </span>
        )}
      </div>
    </div>
  );
}