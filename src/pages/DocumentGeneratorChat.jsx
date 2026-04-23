import { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import ReactMarkdown from "react-markdown";

const SUGESTOES = [
  "Petição inicial no JEC — compra com defeito, loja recusou troca. Cliente: João Silva. Réu: TechMaster Ltda, Teresina/PI. Valor: R$ 2.500,00",
  "Contestação trabalhista — ex-funcionário cobra horas extras indevidas. Empresa nega. Vara do Trabalho de Fortaleza/CE",
  "Contrato de honorários advocatícios — R$ 3.000/mês, 12 meses, cliente Empresa X, advogado Dr. Silva OAB/PI 12345",
  "Recurso de apelação — sentença negou dano moral em acidente de trânsito. Autor foi atingido por trás em semáforo",
  "Habeas corpus — cliente preso preventivamente há 90 dias sem julgamento marcado. Crime: estelionato",
];

const TIPOS_BADGE = {
  "PETIÇÃO": { bg: "#EEF2FF", color: "#4338CA" },
  "CONTESTAÇÃO": { bg: "#FFF7ED", color: "#C2410C" },
  "RECURSO": { bg: "#F0FDF4", color: "#166534" },
  "CONTRATO": { bg: "#FDF4FF", color: "#7E22CE" },
  "HABEAS": { bg: "#FFF1F2", color: "#BE123C" },
};

function detectarTipo(texto) {
  const upper = texto.toUpperCase();
  for (const tipo of Object.keys(TIPOS_BADGE)) {
    if (upper.includes(tipo)) return tipo;
  }
  return null;
}

function TipoBadge({ texto }) {
  const tipo = detectarTipo(texto);
  if (!tipo) return null;
  const s = TIPOS_BADGE[tipo];
  return (
    <span style={{
      background: s.bg, color: s.color,
      fontSize: 10, fontWeight: 700, padding: "2px 8px",
      borderRadius: 4, letterSpacing: "0.06em", textTransform: "uppercase"
    }}>
      {tipo}
    </span>
  );
}

function baixarDocx(docxBase64, nomeArquivo) {
  const bytes = atob(docxBase64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  const blob = new Blob([arr], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeArquivo || "peca_juridica.docx";
  a.click();
  URL.revokeObjectURL(url);
}

function MensagemAssistente({ msg }) {
  const [expandido, setExpandido] = useState(false);
  const linhas = (msg.resposta || msg.content || "").split("\n").filter(Boolean);
  const temMais = linhas.length > 8;
  const conteudo = msg.resposta || msg.content || "";

  return (
    <div style={{ display: "flex", gap: 10, justifyContent: "flex-start", marginBottom: 16 }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
        background: "linear-gradient(135deg, #1E293B 0%, #334155 100%)",
        display: "flex", alignItems: "center", justifyContent: "center", marginTop: 2
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F8FAFC" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>Assistente Jurídico</span>
          <TipoBadge texto={conteudo} />
        </div>
        <div style={{
          background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 12,
          padding: "14px 16px", fontSize: 14, color: "#1E293B",
          fontFamily: "'Lora', Georgia, serif", lineHeight: 1.7,
          whiteSpace: "pre-wrap", wordBreak: "break-word"
        }}>
          {expandido || !temMais ? conteudo : linhas.slice(0, 8).join("\n") + "..."}
          {temMais && !expandido && (
            <div>
              <button onClick={() => setExpandido(true)} style={{
                marginTop: 10, fontSize: 12, color: "#4F46E5",
                background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 600
              }}>
                Ver peça completa ↓
              </button>
            </div>
          )}
        </div>
        {msg.temDocumento && msg.docx && (
          <button onClick={() => baixarDocx(msg.docx, msg.nomeArquivo)} style={{
            marginTop: 8, display: "inline-flex", alignItems: "center", gap: 6,
            padding: "7px 14px", background: "#1E293B", color: "#F8FAFC",
            border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600,
            cursor: "pointer", letterSpacing: "0.03em"
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Baixar {msg.nomeArquivo || "peca_juridica.docx"}
          </button>
        )}
      </div>
    </div>
  );
}

function MensagemUsuario({ texto }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
      <div style={{
        maxWidth: "75%", background: "#1E293B", color: "#F8FAFC",
        borderRadius: 12, padding: "10px 14px",
        fontSize: 14, fontFamily: "'Lora', Georgia, serif", lineHeight: 1.6
      }}>
        {texto}
      </div>
    </div>
  );
}

function MensagemCarregando() {
  return (
    <div style={{ display: "flex", gap: 10, justifyContent: "flex-start", marginBottom: 16 }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8, background: "#1E293B",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F8FAFC" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, justifyContent: "center" }}>
        <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 7, height: 7, borderRadius: "50%", background: "#CBD5E1",
              animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`
            }} />
          ))}
        </div>
        <span style={{ fontSize: 11, color: "#94A3B8" }}>Gerando peça jurídica...</span>
      </div>
    </div>
  );
}

export default function DocumentGeneratorChat({ theme = "light" }) {
  const [mensagens, setMensagens] = useState([]);
  const [input, setInput] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [historico, setHistorico] = useState([]);
  const endRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens, carregando]);

  function ajustarAltura() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }

  async function enviar() {
    const texto = input.trim();
    if (!texto || carregando) return;
    const novasMensagens = [...mensagens, { tipo: "usuario", texto }];
    setMensagens(novasMensagens);
    setInput("");
    setCarregando(true);
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    const novoHistorico = [...historico, { role: "user", content: texto }];

    try {
      const resultado = await base44.functions.invoke('pecaJuridica', {
        mensagem: texto,
        historicoChat: historico,
      });

      const data = resultado.data || resultado;
      const respostaAssistente = {
        tipo: "assistente",
        resposta: data.resposta || "",
        docx: data.docx || null,
        nomeArquivo: data.nomeArquivo || "peca_juridica.docx",
        temDocumento: data.temDocumento || false,
      };

      setMensagens([...novasMensagens, respostaAssistente]);
      setHistorico([...novoHistorico, { role: "assistant", content: data.resposta || "" }]);
    } catch (err) {
      setMensagens([...novasMensagens, {
        tipo: "assistente",
        resposta: "Ocorreu um erro ao gerar a peça. Tente novamente.",
        temDocumento: false,
      }]);
    } finally {
      setCarregando(false);
    }
  }

  function usarSugestao(texto) {
    setInput(texto);
    textareaRef.current?.focus();
  }

  function novaConversa() {
    setMensagens([]);
    setHistorico([]);
    setInput("");
  }

  const vazio = mensagens.length === 0;

  return (
    <>
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
        .chat-textarea { resize: none; overflow: hidden; }
        .chat-textarea:focus { outline: none; }
        .sugestao-btn:hover { background: #F8FAFC !important; border-color: #CBD5E1 !important; }
      `}</style>

      <div style={{
        display: "flex", flexDirection: "column", height: "100vh",
        background: "#F8FAFC", fontFamily: "system-ui, sans-serif"
      }}>
        {/* Header */}
        <div style={{
          background: "#FFFFFF", borderBottom: "1px solid #E2E8F0",
          padding: "14px 24px", display: "flex", alignItems: "center",
          justifyContent: "space-between", flexShrink: 0
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "linear-gradient(135deg, #1E293B 0%, #334155 100%)",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F8FAFC" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#0F172A", lineHeight: 1.2 }}>
                Gerador de Peças Jurídicas
              </div>
              <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 1 }}>
                Claude Sonnet · Direito Brasileiro
              </div>
            </div>
          </div>
          {mensagens.length > 0 && (
            <button onClick={novaConversa} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 14px", background: "transparent",
              border: "1px solid #E2E8F0", borderRadius: 8,
              fontSize: 13, color: "#64748B", cursor: "pointer", fontWeight: 500
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Nova conversa
            </button>
          )}
        </div>

        {/* Messages area */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 24px 8px" }}>
          <div style={{ maxWidth: 800, margin: "0 auto" }}>

            {vazio && (
              <div>
                {/* Welcome */}
                <div style={{ textAlign: "center", marginBottom: 32, paddingTop: 16 }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: 16, margin: "0 auto 16px",
                    background: "linear-gradient(135deg, #1E293B 0%, #475569 100%)",
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F8FAFC" strokeWidth="1.8">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                    </svg>
                  </div>
                  <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0F172A", marginBottom: 8 }}>
                    Descreva o caso
                  </h2>
                  <p style={{ fontSize: 14, color: "#64748B", maxWidth: 440, margin: "0 auto", lineHeight: 1.6 }}>
                    Escreva as informações do caso de forma direta — o assistente identifica o tipo de peça,
                    elabora o documento completo e gera o arquivo .docx para download.
                  </p>
                </div>

                {/* Sugestões */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>
                    Exemplos — clique para usar
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {SUGESTOES.map((s, i) => (
                      <button key={i} className="sugestao-btn" onClick={() => usarSugestao(s)} style={{
                        textAlign: "left", background: "#FFFFFF",
                        border: "1px solid #E2E8F0", borderRadius: 10,
                        padding: "11px 14px", fontSize: 13.5, color: "#334155",
                        cursor: "pointer", fontFamily: "'Lora', Georgia, serif",
                        lineHeight: 1.5, display: "flex", alignItems: "center",
                        justifyContent: "space-between", gap: 8, transition: "all 0.15s"
                      }}>
                        <span>{s}</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2" style={{ flexShrink: 0 }}>
                          <polyline points="9 18 15 12 9 6"/>
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {mensagens.map((msg, i) => (
              <div key={i}>
                {msg.tipo === "usuario"
                  ? <MensagemUsuario texto={msg.texto} />
                  : <MensagemAssistente msg={msg} />
                }
              </div>
            ))}

            {carregando && <MensagemCarregando />}
            <div ref={endRef} />
          </div>
        </div>

        {/* Input */}
        <div style={{
          background: "#FFFFFF", borderTop: "1px solid #E2E8F0",
          padding: "16px 24px", flexShrink: 0
        }}>
          <div style={{ maxWidth: 800, margin: "0 auto" }}>
            <div style={{
              display: "flex", gap: 10, alignItems: "flex-end",
              background: "#F8FAFC", border: "1px solid #E2E8F0",
              borderRadius: 14, padding: "10px 12px"
            }}>
              <textarea
                ref={textareaRef}
                className="chat-textarea"
                value={input}
                onChange={(e) => { setInput(e.target.value); ajustarAltura(); }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(); }
                }}
                placeholder="Descreva o caso livremente — partes, fatos, pedidos, comarca... (Enter para enviar)"
                rows={1}
                style={{
                  flex: 1, background: "transparent", border: "none",
                  fontSize: 14, color: "#0F172A",
                  fontFamily: "'Lora', Georgia, serif",
                  lineHeight: 1.6, maxHeight: 160, overflow: "auto"
                }}
              />
              <button
                onClick={enviar}
                disabled={!input.trim() || carregando}
                style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: input.trim() && !carregando ? "#1E293B" : "#E2E8F0",
                  border: "none", display: "flex", alignItems: "center",
                  justifyContent: "center",
                  cursor: input.trim() && !carregando ? "pointer" : "not-allowed",
                  transition: "background 0.15s"
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                  stroke={input.trim() && !carregando ? "#F8FAFC" : "#94A3B8"} strokeWidth="2.2">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
            <p style={{ fontSize: 11, color: "#94A3B8", textAlign: "center", marginTop: 8 }}>
              Shift + Enter para nova linha · O .docx é gerado automaticamente ao final de cada peça
            </p>
          </div>
        </div>
      </div>
    </>
  );
}