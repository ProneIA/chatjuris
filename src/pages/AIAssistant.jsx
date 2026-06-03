import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Scale, Send, ChevronRight } from "lucide-react";
import ReactMarkdown from "react-markdown";

const SYSTEM_PROMPT = `Você é Lex, um especialista em Direito Brasileiro com profundo conhecimento em todas as áreas jurídicas. Você utiliza a Estratégia LEXIA para estruturar suas respostas:

L - Localizar: Identificar a área do direito e legislação aplicável
E - Examinar: Analisar o problema juridicamente com rigor
X - Explicar: Apresentar de forma clara e acessível, sem jargões desnecessários
I - Informar precedentes: Citar jurisprudência relevante (STF, STJ, TST, etc.)
A - Aconselhar: Orientar sobre os próximos passos práticos

Regras:
- Sempre indique a legislação aplicável (artigos, leis, códigos)
- Cite jurisprudência atualizada quando relevante
- Use linguagem clara, acessível, mas tecnicamente precisa
- Sempre finalize lembrando que a orientação é informativa e que um advogado deve ser consultado para o caso concreto
- Responda sempre em português brasileiro`;

const AREAS = [
  "Civil", "Penal", "Trabalhista", "Consumidor",
  "Tributário", "Administrativo", "Família", "Constitucional", "Previdenciário"
];

const SUGESTOES = [
  "O que é usucapião?",
  "Direitos do consumidor no e-commerce",
  "Como funciona a rescisão indireta?",
  "Prazo para reclamar defeito em produto",
  "O que é habeas corpus?",
  "Pensão alimentícia: como calcular?",
];

function TypingIndicator() {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginBottom: 16 }}>
      <div style={{
        width: 32, height: 32, borderRadius: "var(--radius-btn)",
        background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <Scale style={{ width: 16, height: 16, color: "#fff" }} />
      </div>
      <div style={{
        padding: "10px 16px", background: "var(--card)",
        border: "1px solid var(--border)", borderRadius: "var(--radius-btn)",
      }}>
        <div style={{ display: "flex", gap: 4, alignItems: "center", height: 20 }}>
          {[0, 1, 2].map(i => (
            <span key={i} style={{
              width: 7, height: 7, borderRadius: "50%", background: "var(--text-secondary)",
              display: "inline-block",
              animation: "lex-bounce 1.2s infinite",
              animationDelay: `${i * 0.2}s`, opacity: 0.6,
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ msg }) {
  const isUser = msg.role === "user";
  const time = msg.timestamp
    ? new Date(msg.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : "";

  if (isUser) {
    return (
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <div style={{ maxWidth: "80%", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
          <div style={{
            padding: "10px 16px", background: "var(--primary)", color: "#fff",
            borderRadius: "var(--radius-btn)", fontSize: 14, lineHeight: 1.6,
          }}>
            {msg.content}
          </div>
          {time && <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{time}</span>}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginBottom: 16 }}>
      <div style={{
        width: 32, height: 32, borderRadius: "var(--radius-btn)",
        background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <Scale style={{ width: 16, height: 16, color: "#fff" }} />
      </div>
      <div style={{ maxWidth: "80%", display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{
          padding: "10px 16px", background: "var(--card)",
          border: "1px solid var(--border)", borderRadius: "var(--radius-btn)",
          fontSize: 14, lineHeight: 1.6, color: "var(--text-primary)",
        }}>
          <ReactMarkdown
            className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
            components={{
              p:      ({ children }) => <p className="my-1">{children}</p>,
              ul:     ({ children }) => <ul className="my-1 ml-4 list-disc">{children}</ul>,
              ol:     ({ children }) => <ol className="my-1 ml-4 list-decimal">{children}</ol>,
              li:     ({ children }) => <li className="my-0.5">{children}</li>,
              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
              h1:     ({ children }) => <h1 className="text-base font-bold my-2">{children}</h1>,
              h2:     ({ children }) => <h2 className="text-sm font-bold my-1.5">{children}</h2>,
              h3:     ({ children }) => <h3 className="text-sm font-semibold my-1">{children}</h3>,
            }}
          >
            {msg.content}
          </ReactMarkdown>
        </div>
        {time && <span style={{ fontSize: 12, color: "var(--text-secondary)", marginLeft: 4 }}>{time}</span>}
      </div>
    </div>
  );
}

export default function AIAssistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef          = useRef(null);
  const textareaRef             = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async (text) => {
    const content = (text || input).trim();
    if (!content || isTyping) return;

    const userMsg = { role: "user", content, timestamp: new Date().toISOString() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsTyping(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      const history = updatedMessages
        .map(m => `${m.role === "user" ? "Usuário" : "Lex"}: ${m.content}`)
        .join("\n\n");

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `${SYSTEM_PROMPT}\n\nHistórico da conversa:\n${history}\n\nResponda à última mensagem do Usuário.`,
        model: "gemini_3_flash",
      });

      setMessages(prev => [
        ...prev,
        { role: "assistant", content: response, timestamp: new Date().toISOString() }
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.", timestamp: new Date().toISOString() }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--bg)", fontFamily: "var(--font-body)" }}>
      <style>{`
        @keyframes lex-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>

      {/* Area pills */}
      <div style={{ flexShrink: 0, padding: "10px 16px", borderBottom: "1px solid var(--border)", background: "var(--card)", overflowX: "auto" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", gap: 8, flexWrap: "nowrap" }}>
          {AREAS.map(area => (
            <button
              key={area}
              onClick={() => setInput(prev => prev ? `${prev} ${area}` : area)}
              style={{
                flexShrink: 0, padding: "5px 12px",
                borderRadius: "var(--radius-btn)", fontSize: 12, fontWeight: 500,
                border: "1px solid var(--border)", color: "var(--text-secondary)",
                background: "var(--bg)", cursor: "pointer", transition: "all 0.15s",
                fontFamily: "var(--font-body)",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--primary)"; e.currentTarget.style.color = "var(--text-primary)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
            >
              {area}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 16px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>

          {/* Empty state */}
          {messages.length === 0 && !isTyping && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, paddingTop: 32, paddingBottom: 16 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{
                  width: 56, height: 56, borderRadius: "var(--radius-btn)",
                  background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 12px",
                }}>
                  <Scale style={{ width: 28, height: 28, color: "#fff" }} />
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 600, color: "var(--text-primary)", margin: "0 0 6px", letterSpacing: "-0.02em" }}>Olá, sou o Lex</h2>
                <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: 0 }}>Como posso ajudar com sua dúvida jurídica hoje?</p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 8, width: "100%", maxWidth: 680 }}>
                {SUGESTOES.map(s => (
                  <button
                    key={s}
                    onClick={() => handleSend(s)}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      textAlign: "left", padding: "12px 16px",
                      borderRadius: "var(--radius-card)", border: "1px solid var(--border)",
                      fontSize: 14, background: "var(--card)", color: "var(--text-primary)",
                      cursor: "pointer", transition: "all 0.15s",
                      boxShadow: "var(--shadow-card)",
                      fontFamily: "var(--font-body)",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--border-strong)"; e.currentTarget.style.boxShadow = "var(--shadow-md)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "var(--shadow-card)"; }}
                  >
                    <ChevronRight style={{ width: 14, height: 14, flexShrink: 0, color: "var(--text-secondary)" }} />
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
          {isTyping && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div style={{ flexShrink: 0, borderTop: "1px solid var(--border)", padding: "16px", background: "var(--card)" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{
            display: "flex", alignItems: "flex-end", gap: 8,
            borderRadius: "var(--radius-btn)", border: "1px solid var(--border)",
            padding: "10px 12px", background: "var(--bg)",
            transition: "border-color 0.15s, box-shadow 0.15s",
          }}
            onFocusCapture={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(37,99,235,.12)"; }}
            onBlurCapture={e  => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; }}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua dúvida jurídica..."
              rows={1}
              disabled={isTyping}
              style={{
                flex: 1, resize: "none", background: "transparent",
                fontSize: 14, outline: "none", lineHeight: 1.6,
                color: "var(--text-primary)", maxHeight: 160, overflowY: "auto",
                fontFamily: "var(--font-body)", border: "none",
              }}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isTyping}
              style={{
                flexShrink: 0, width: 32, height: 32, borderRadius: "var(--radius-btn)",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: !input.trim() || isTyping ? "var(--border)" : "var(--primary)",
                border: "none",
                cursor: !input.trim() || isTyping ? "not-allowed" : "pointer",
                transition: "background 0.15s",
              }}
            >
              <Send style={{ width: 15, height: 15, color: !input.trim() || isTyping ? "var(--text-secondary)" : "#fff" }} />
            </button>
          </div>
          <p style={{ textAlign: "center", fontSize: 12, marginTop: 10, color: "var(--text-secondary)" }}>
            As respostas têm caráter informativo e educacional. Para seu caso específico, consulte um advogado.
          </p>
        </div>
      </div>
    </div>
  );
}