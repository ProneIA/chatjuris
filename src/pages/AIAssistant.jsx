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
    <div className="flex items-end gap-2 mb-4">
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#185FA5" }}>
        <Scale className="w-4 h-4 text-white" />
      </div>
      <div className="px-4 py-3 rounded-2xl rounded-bl-sm" style={{ background: "#F0F2F5" }}>
        <div className="flex gap-1 items-center h-5">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="w-2 h-2 rounded-full inline-block"
              style={{
                background: "#185FA5",
                animation: "lex-bounce 1.2s infinite",
                animationDelay: `${i * 0.2}s`,
                opacity: 0.7
              }}
            />
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
      <div className="flex justify-end mb-4">
        <div className="max-w-[80%] flex flex-col items-end gap-1">
          <div
            className="px-4 py-3 rounded-2xl rounded-br-sm text-white text-sm leading-relaxed"
            style={{ background: "#185FA5" }}
          >
            {msg.content}
          </div>
          {time && <span className="text-xs" style={{ color: "#9CA3AF" }}>{time}</span>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2 mb-4">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: "#185FA5" }}
      >
        <Scale className="w-4 h-4 text-white" />
      </div>
      <div className="max-w-[80%] flex flex-col gap-1">
        <div
          className="px-4 py-3 rounded-2xl rounded-bl-sm text-sm leading-relaxed"
          style={{ background: "#F0F2F5", color: "#1F2937" }}
        >
          <ReactMarkdown
            className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
            components={{
              p: ({ children }) => <p className="my-1">{children}</p>,
              ul: ({ children }) => <ul className="my-1 ml-4 list-disc">{children}</ul>,
              ol: ({ children }) => <ol className="my-1 ml-4 list-decimal">{children}</ol>,
              li: ({ children }) => <li className="my-0.5">{children}</li>,
              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
              h1: ({ children }) => <h1 className="text-base font-bold my-2">{children}</h1>,
              h2: ({ children }) => <h2 className="text-sm font-bold my-1.5">{children}</h2>,
              h3: ({ children }) => <h3 className="text-sm font-semibold my-1">{children}</h3>,
            }}
          >
            {msg.content}
          </ReactMarkdown>
        </div>
        {time && <span className="text-xs ml-1" style={{ color: "#9CA3AF" }}>{time}</span>}
      </div>
    </div>
  );
}

export default function AIAssistant({ theme = "light" }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

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
        model: "gpt_5_mini",
      });

      setMessages(prev => [
        ...prev,
        { role: "assistant", content: response, timestamp: new Date().toISOString() }
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: "Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.",
          timestamp: new Date().toISOString()
        }
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
    <div className="flex flex-col h-screen" style={{ background: "#F8F9FA" }}>
      <style>{`
        @keyframes lex-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>

      {/* Header */}
      <header className="flex-shrink-0 border-b px-4 md:px-6 py-4" style={{ background: "#fff", borderColor: "#E5E7EB" }}>
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#185FA5" }}>
            <Scale className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base" style={{ color: "#111827" }}>
                Lex — Especialista em Direito Brasileiro
              </h1>
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "#22C55E" }} title="Online" />
            </div>
            <p className="text-xs" style={{ color: "#6B7280" }}>Todas as áreas · Legislação atualizada</p>
          </div>
        </div>
      </header>

      {/* Pills de área */}
      <div className="flex-shrink-0 px-4 md:px-6 py-3 border-b overflow-x-auto" style={{ background: "#fff", borderColor: "#E5E7EB" }}>
        <div className="max-w-3xl mx-auto flex gap-2 flex-nowrap">
          {AREAS.map(area => (
            <button
              key={area}
              onClick={() => setInput(prev => prev ? `${prev} ${area}` : area)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors hover:border-blue-400 hover:text-blue-700 hover:bg-blue-50"
              style={{ borderColor: "#D1D5DB", color: "#374151", background: "#F9FAFB" }}
            >
              {area}
            </button>
          ))}
        </div>
      </div>

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6">
        <div className="max-w-3xl mx-auto">

          {/* Estado vazio — sugestões */}
          {messages.length === 0 && !isTyping && (
            <div className="flex flex-col items-center gap-6 pt-8 pb-4">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: "#185FA5" }}>
                  <Scale className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-xl font-bold mb-1" style={{ color: "#111827" }}>Olá, sou o Lex</h2>
                <p className="text-sm" style={{ color: "#6B7280" }}>Como posso ajudar com sua dúvida jurídica hoje?</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-2xl">
                {SUGESTOES.map(s => (
                  <button
                    key={s}
                    onClick={() => handleSend(s)}
                    className="flex items-center gap-2 text-left px-4 py-3 rounded-xl border text-sm transition-colors hover:border-blue-400 hover:bg-blue-50"
                    style={{ background: "#fff", borderColor: "#E5E7EB", color: "#374151" }}
                  >
                    <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: "#185FA5" }} />
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Histórico de mensagens */}
          {messages.map((msg, i) => (
            <MessageBubble key={i} msg={msg} />
          ))}

          {/* Indicador de digitando */}
          {isTyping && <TypingIndicator />}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t px-4 md:px-6 py-4" style={{ background: "#fff", borderColor: "#E5E7EB" }}>
        <div className="max-w-3xl mx-auto">
          <div
            className="flex items-end gap-2 rounded-2xl border px-4 py-3 transition-colors focus-within:border-blue-400"
            style={{ borderColor: "#D1D5DB", background: "#F9FAFB" }}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua dúvida jurídica..."
              rows={1}
              disabled={isTyping}
              className="flex-1 resize-none bg-transparent text-sm outline-none leading-relaxed"
              style={{ color: "#111827", maxHeight: "160px", overflowY: "auto" }}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isTyping}
              className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-opacity"
              style={{
                background: !input.trim() || isTyping ? "#9CA3AF" : "#185FA5",
                cursor: !input.trim() || isTyping ? "not-allowed" : "pointer"
              }}
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Rodapé */}
          <p className="text-center text-xs mt-3" style={{ color: "#9CA3AF" }}>
            As respostas têm caráter informativo e educacional. Para seu caso específico, consulte um advogado.
          </p>
        </div>
      </div>
    </div>
  );
}