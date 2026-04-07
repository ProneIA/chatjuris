import React, { useState, useEffect, useRef, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { MessageSquare, CheckCircle2, PauseCircle, Search, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function WhatsAppConversations() {
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [session, setSession] = useState(null);
  const [selectedContact, setSelectedContact] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      setUser(u);
      const [msgs, sessions] = await Promise.all([
        base44.entities.WhatsappMessage.filter({ user_id: u.id }, "-sent_at", 500),
        base44.entities.WhatsappSession.filter({ user_id: u.id }),
      ]);
      setMessages(msgs);
      if (sessions.length > 0) setSession(sessions[0]);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "auto" });
    }
  }, [selectedContact]);

  // Agrupar mensagens por contato
  const contacts = React.useMemo(() => {
    const map = {};
    messages.forEach((m) => {
      if (!map[m.contact_phone]) {
        map[m.contact_phone] = { phone: m.contact_phone, name: m.contact_name || null, messages: [] };
      }
      map[m.contact_phone].messages.push(m);
    });
    return Object.values(map)
      .map((c) => {
        const sorted = [...c.messages].sort((a, b) => new Date(b.sent_at) - new Date(a.sent_at));
        return { ...c, lastMessage: sorted[0], messages: [...c.messages].sort((a, b) => new Date(a.sent_at) - new Date(b.sent_at)) };
      })
      .sort((a, b) => new Date(b.lastMessage?.sent_at) - new Date(a.lastMessage?.sent_at));
  }, [messages]);

  const filtered = contacts.filter((c) => {
    const q = search.toLowerCase();
    return c.phone.includes(q) || (c.name && c.name.toLowerCase().includes(q));
  });

  // Stats
  const totalConversations = contacts.length;
  const todayReplies = messages.filter((m) => m.direction === "outbound" && isToday(new Date(m.sent_at))).length;
  const agentActive = session?.status === "connected" && session?.agent_enabled;

  const selectedMessages = selectedContact
    ? (contacts.find((c) => c.phone === selectedContact)?.messages || [])
    : [];

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isToday(d)) return format(d, "HH:mm");
    return format(d, "dd/MM HH:mm");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-700 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 3.5rem)" }}>
      {/* Seção 3 — Cabeçalho */}
      <div style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)", padding: "1rem 1.5rem", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <h1 style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: "1.2rem", textTransform: "uppercase", letterSpacing: "-0.02em", color: "var(--text)", margin: 0 }}>
            Conversas do WhatsApp
          </h1>
          <div style={{ display: "flex", gap: "1.5rem", alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: "1.4rem", color: "var(--primary)", lineHeight: 1 }}>{totalConversations}</div>
              <div style={{ fontSize: ".65rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".08em" }}>Conversas</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: "1.4rem", color: "var(--primary)", lineHeight: 1 }}>{todayReplies}</div>
              <div style={{ fontSize: ".65rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".08em" }}>Respostas hoje</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.35rem 0.75rem", background: agentActive ? "rgba(22,163,74,0.08)" : "var(--surface-2)", border: `1px solid ${agentActive ? "rgba(22,163,74,0.3)" : "var(--border)"}` }}>
              {agentActive
                ? <><CheckCircle2 className="w-3.5 h-3.5" style={{ color: "#16a34a" }} /><span style={{ fontSize: ".7rem", color: "#16a34a", fontFamily: "'Oswald', sans-serif", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em" }}>Agente ativo</span></>
                : <><PauseCircle className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} /><span style={{ fontSize: ".7rem", color: "var(--text-muted)", fontFamily: "'Oswald', sans-serif", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em" }}>Agente pausado</span></>
              }
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Seção 1 — Lista de contatos */}
        <div
          className={selectedContact ? "hidden md:flex" : "flex"}
          style={{
            width: selectedContact ? "320px" : "100%",
            maxWidth: selectedContact ? "320px" : "none",
            borderRight: "1px solid var(--border)",
            background: "var(--surface)",
            flexDirection: "column",
            flexShrink: 0,
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid var(--border)" }}>
            <div style={{ position: "relative" }}>
              <Search className="w-3.5 h-3.5" style={{ position: "absolute", left: "0.6rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar contato..."
                style={{ paddingLeft: "1.8rem", fontSize: ".8rem", height: "2rem" }}
              />
            </div>
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {filtered.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)", fontSize: ".82rem" }}>
                Nenhuma conversa encontrada
              </div>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.phone}
                  onClick={() => setSelectedContact(c.phone)}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.75rem",
                    width: "100%",
                    padding: "0.85rem 1rem",
                    borderBottom: "1px solid var(--border)",
                    borderLeft: selectedContact === c.phone ? "3px solid var(--primary)" : "3px solid transparent",
                    background: selectedContact === c.phone ? "var(--primary-light)" : "transparent",
                    cursor: "pointer",
                    textAlign: "left",
                    border: "none",
                    borderBottom: "1px solid var(--border)",
                    borderLeft: selectedContact === c.phone ? "3px solid var(--primary)" : "3px solid transparent",
                  }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--primary-light)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <MessageSquare className="w-4 h-4" style={{ color: "var(--primary)" }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <span style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 600, fontSize: ".82rem", color: "var(--text)", textTransform: "uppercase" }}>
                        {c.name || c.phone}
                      </span>
                      <span style={{ fontSize: ".65rem", color: "var(--text-muted)", flexShrink: 0, marginLeft: "0.5rem" }}>
                        {formatTime(c.lastMessage?.sent_at)}
                      </span>
                    </div>
                    <p style={{ fontSize: ".75rem", color: "var(--text-muted)", margin: "0.15rem 0 0", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                      {c.lastMessage?.direction === "outbound" ? "✓ " : ""}{c.lastMessage?.content}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Seção 2 — Histórico da conversa */}
        {selectedContact ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--bg)" }}>
            {/* Header da conversa */}
            <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid var(--border)", background: "var(--surface)", display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <button
                onClick={() => setSelectedContact(null)}
                className="md:hidden"
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 0, display: "flex" }}
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--primary-light)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <MessageSquare className="w-3.5 h-3.5" style={{ color: "var(--primary)" }} />
              </div>
              <div>
                <div style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 600, fontSize: ".85rem", color: "var(--text)", textTransform: "uppercase" }}>
                  {contacts.find(c => c.phone === selectedContact)?.name || selectedContact}
                </div>
                <div style={{ fontSize: ".7rem", color: "var(--text-muted)" }}>{selectedContact}</div>
              </div>
            </div>

            {/* Mensagens */}
            <div style={{ flex: 1, overflowY: "auto", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {selectedMessages.map((m) => (
                <div
                  key={m.id}
                  style={{
                    display: "flex",
                    justifyContent: m.direction === "outbound" ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "70%",
                      padding: "0.5rem 0.75rem",
                      background: m.direction === "outbound" ? "#dcf8c6" : "#ffffff",
                      border: "1px solid",
                      borderColor: m.direction === "outbound" ? "#b7e5a0" : "var(--border)",
                      borderRadius: m.direction === "outbound" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
                    }}
                  >
                    <p style={{ fontSize: ".85rem", color: "#111", margin: 0, lineHeight: 1.4, whiteSpace: "pre-wrap" }}>
                      {m.content}
                    </p>
                    <p style={{ fontSize: ".65rem", color: "#888", margin: "0.25rem 0 0", textAlign: "right" }}>
                      {formatTime(m.sent_at)}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          </div>
        ) : (
          <div className="hidden md:flex" style={{ flex: 1, alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "0.75rem", background: "var(--bg)" }}>
            <MessageSquare className="w-10 h-10" style={{ color: "var(--border)" }} />
            <p style={{ color: "var(--text-muted)", fontSize: ".85rem" }}>Selecione uma conversa para visualizar</p>
          </div>
        )}
      </div>
    </div>
  );
}