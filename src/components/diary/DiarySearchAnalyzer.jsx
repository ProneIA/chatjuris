import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { 
  Search, Upload, Sparkles, Loader2, FileText,
  X, CheckCircle, AlertTriangle, Clock,
  Hash, ChevronDown, ChevronUp, Save
} from "lucide-react";
import { toast } from "sonner";

const SYNONYM_DICTIONARY = {
  'licitação': ['licitações', 'concorrência', 'pregão', 'certame', 'edital', 'tomada de preços', 'convite', 'leilão', 'dispensa', 'inexigibilidade'],
  'contrato': ['contratos', 'acordo', 'ajuste', 'parceria', 'convênio', 'termo', 'aditivo', 'contratação'],
  'processo': ['processos', 'autos', 'procedimento', 'expediente', 'feito'],
  'sentença': ['sentenças', 'sentenciado', 'julgamento', 'julgado', 'condenação', 'absolvição'],
  'decisão': ['decisões', 'decidido', 'determinação', 'deliberação', 'resolução'],
  'despacho': ['despachos', 'despachado', 'ordenado'],
  'acórdão': ['acórdãos', 'acordam', 'câmara', 'turma', 'colegiado'],
  'intimação': ['intimações', 'intimado', 'intimando', 'intimar', 'notificação', 'notificado'],
  'citação': ['citações', 'citado', 'citar', 'citando'],
  'recurso': ['recursos', 'recorrer', 'recorrido', 'recorrente', 'apelação', 'agravo', 'embargos'],
  'prazo': ['prazos', 'termo', 'vencimento', 'dias', 'fatal', 'improrrogável'],
  'pagamento': ['pagamentos', 'pagar', 'pago', 'quitação', 'adimplemento', 'depósito'],
  'precatório': ['precatórios', 'requisição', 'rpv', 'requisitório', 'crédito'],
  'multa': ['multas', 'astreintes', 'penalidade', 'sanção', 'cominação'],
  'tutela': ['tutelas', 'liminar', 'antecipação', 'cautelar', 'urgência', 'provisória'],
  'penhora': ['penhoras', 'penhorado', 'constrição', 'bloqueio', 'arresto'],
  'execução': ['execuções', 'executar', 'executado', 'executivo', 'cumprimento'],
};

const urgencyConfig = {
  alta:  { label: "Urgente", badgeClass: "badge badge-red",    Icon: AlertTriangle },
  media: { label: "Média",   badgeClass: "badge badge-yellow", Icon: Clock         },
  baixa: { label: "Baixa",   badgeClass: "badge badge-green",  Icon: CheckCircle   },
};

export default function DiarySearchAnalyzer({ monitorings = [], onSuccess }) {
  const [searchTerms,    setSearchTerms]    = useState("");
  const [uploadedFile,   setUploadedFile]   = useState(null);
  const [fileContent,    setFileContent]    = useState("");
  const [isAnalyzing,    setIsAnalyzing]    = useState(false);
  const [results,        setResults]        = useState(null);
  const [expandedResult, setExpandedResult] = useState(null);
  const [isSaving,       setIsSaving]       = useState(false);

  const expandSynonyms = (terms) => {
    const expanded = new Set();
    terms.forEach(term => {
      const lowerTerm = term.toLowerCase().trim();
      expanded.add(lowerTerm);
      for (const [key, synonyms] of Object.entries(SYNONYM_DICTIONARY)) {
        if (key.includes(lowerTerm) || lowerTerm.includes(key)) {
          expanded.add(key);
          synonyms.forEach(s => expanded.add(s));
        }
        if (synonyms.some(s => s.includes(lowerTerm) || lowerTerm.includes(s))) {
          expanded.add(key);
          synonyms.forEach(s => expanded.add(s));
        }
      }
    });
    return Array.from(expanded);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadedFile(file);
    setResults(null);
    setFileContent("");
    if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
      try {
        toast.info("Extraindo texto do arquivo...");
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        const extracted = await base44.integrations.Core.ExtractDataFromUploadedFile({
          file_url,
          json_schema: { type: "object", properties: { full_text: { type: "string" } } }
        });
        if (extracted.status === "success" && extracted.output?.full_text) {
          setFileContent(extracted.output.full_text);
          toast.success(`Texto extraído! ${extracted.output.full_text.length.toLocaleString()} caracteres`);
        } else {
          toast.error("Não foi possível extrair texto do arquivo");
        }
      } catch {
        toast.error("Erro ao processar arquivo");
      }
    } else if (file.type === 'text/plain') {
      const text = await file.text();
      setFileContent(text);
      toast.success(`Arquivo carregado! ${text.length.toLocaleString()} caracteres`);
    } else {
      try {
        const text = await file.text();
        if (text?.trim().length > 0) { setFileContent(text); toast.success(`Arquivo carregado!`); }
        else toast.error("Formato não suportado ou arquivo vazio");
      } catch { toast.error("Formato de arquivo não suportado"); }
    }
  };

  const analyzeWithAI = async () => {
    if (!fileContent?.trim()) { toast.error("Faça upload de um arquivo primeiro"); return; }
    const terms = searchTerms.split(',').map(t => t.trim()).filter(t => t.length > 0);
    if (!terms.length) { toast.error("Digite pelo menos uma palavra-chave"); return; }
    setIsAnalyzing(true);
    const expandedTerms = expandSynonyms(terms);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um ESPECIALISTA em análise de Diários Oficiais brasileiros.\n\nTAREFA: Analise o texto e encontre TODAS as publicações que contenham as palavras-chave ou seus sinônimos.\n\nPALAVRAS-CHAVE:\n${expandedTerms.map(t => `- "${t}"`).join('\n')}\n\nCONTEÚDO DO DIÁRIO:\n---\n${fileContent.substring(0, 20000)}\n---\n\nRetorne JSON com total_matches, keywords_found e results (array com title, process_number, parties, keywords_matched, original_excerpt, summary, urgency, deadline, category).`,
        response_json_schema: {
          type: "object",
          properties: {
            total_matches: { type: "number" },
            keywords_found: { type: "object" },
            results: { type: "array", items: { type: "object", properties: {
              title: { type: "string" }, process_number: { type: "string" },
              parties: { type: "array", items: { type: "string" } },
              keywords_matched: { type: "array", items: { type: "string" } },
              original_excerpt: { type: "string" }, summary: { type: "string" },
              urgency: { type: "string" }, deadline: { type: "string" }, category: { type: "string" }
            }}}
          }
        }
      });
      setResults(response);
      if (response.total_matches === 0) toast.info("Nenhuma publicação encontrada");
      else toast.success(`${response.total_matches} publicação(ões) encontrada(s)!`);
    } catch { toast.error("Erro ao analisar"); }
    setIsAnalyzing(false);
  };

  const saveResults = async () => {
    if (!results?.results?.length) return;
    setIsSaving(true);
    try {
      const user = await base44.auth.me();
      for (const pub of results.results) {
        const pubData = {
          title: pub.title || "Publicação sem título",
          content: pub.original_excerpt || pub.summary || "",
          source: uploadedFile?.name || "Upload",
          publication_date: new Date().toISOString().split('T')[0],
          parties_involved: pub.parties || [],
          ai_summary: pub.summary || "",
          keywords_matched: pub.keywords_matched || [],
          is_read: false, is_starred: true
        };
        if (pub.category && pub.category !== "null") pubData.category = pub.category;
        if (pub.process_number && pub.process_number !== "null") pubData.case_number = pub.process_number;
        if (pub.urgency && pub.urgency !== "null") pubData.urgency = pub.urgency;
        if (pub.deadline && pub.deadline !== "null") pubData.deadline_detected = pub.deadline;
        await base44.entities.DiaryPublication.create(pubData);
      }
      const activeMonitorings = monitorings.filter(m => m.is_active);
      for (const mon of activeMonitorings) {
        if (mon.notification_push) {
          await base44.entities.Notification.create({
            type: 'deadline', title: `📰 ${results.results.length} publicação(ões) salva(s)`,
            message: `Busca por "${searchTerms}" encontrou ${results.results.length} resultado(s).`,
            recipient_email: user.email, is_read: false,
            entity_type: 'DiaryMonitoring', entity_id: mon.id, actor_name: 'Monitor de Diários'
          });
        }
      }
      toast.success(`${results.results.length} publicação(ões) salva(s)!`);
      onSuccess?.();
    } catch { toast.error("Erro ao salvar"); }
    setIsSaving(false);
  };

  const hasFile = fileContent?.trim().length > 0;
  const canAnalyze = hasFile && searchTerms.trim() && !isAnalyzing;

  return (
    <div className="app-card">
      {/* Header */}
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: "var(--r-md)", background: "var(--accent-light)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Sparkles size={16} style={{ color: "var(--accent)" }} />
        </div>
        <div>
          <h3 style={{ fontWeight: 600, fontSize: 14, color: "var(--text-1)", margin: 0 }}>Pesquisa Inteligente em Diários</h3>
          <p style={{ fontSize: 12, color: "var(--text-3)", margin: 0 }}>Faça upload do diário e digite palavras-chave para buscar</p>
        </div>
      </div>

      {/* Inputs */}
      <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Upload */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 6, display: "block", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            1. Upload do Diário Oficial
          </label>
          <div style={{
            border: `2px dashed ${uploadedFile ? "var(--green)" : "var(--border-2)"}`,
            borderRadius: "var(--r-md)", padding: "16px", textAlign: "center",
            background: uploadedFile ? "var(--green-bg)" : "var(--surface)",
            transition: "all var(--dur)",
          }}>
            <input type="file" accept=".pdf,.txt,.png,.jpg,.jpeg" onChange={handleFileUpload} className="hidden" id="diary-upload-smart" />
            <label htmlFor="diary-upload-smart" style={{ cursor: "pointer", display: "block" }}>
              {uploadedFile ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <CheckCircle size={16} style={{ color: "var(--green)" }} />
                  <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-1)" }}>{uploadedFile.name}</span>
                  <button style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "var(--text-3)", minHeight: "unset" }}
                    onClick={e => { e.preventDefault(); setUploadedFile(null); setFileContent(""); setResults(null); }}>
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <>
                  <Upload size={20} style={{ color: "var(--text-3)", margin: "0 auto 6px" }} />
                  <p style={{ fontSize: 13, color: "var(--text-2)", margin: 0 }}>Clique para selecionar PDF, TXT ou imagem</p>
                </>
              )}
            </label>
          </div>
          {fileContent && (
            <p style={{ fontSize: 11, color: "var(--green)", marginTop: 4 }}>
              ✓ {fileContent.length.toLocaleString()} caracteres extraídos
            </p>
          )}
        </div>

        {/* Palavras-chave */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 6, display: "block", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            2. Palavras-chave
          </label>
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-3)", pointerEvents: "none" }} />
            <input
              placeholder="Ex: licitação, contrato, precatório (separados por vírgula)"
              value={searchTerms}
              onChange={e => setSearchTerms(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && analyzeWithAI()}
              style={{ paddingLeft: 36 }}
            />
          </div>
          <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 4 }}>💡 Sinônimos jurídicos são incluídos automaticamente</p>
        </div>

        {/* Botão */}
        <button
          className="btn btn-primary"
          onClick={analyzeWithAI}
          disabled={!canAnalyze}
          style={{ width: "100%", justifyContent: "center", opacity: canAnalyze ? 1 : 0.55, cursor: canAnalyze ? "pointer" : "not-allowed" }}
        >
          {isAnalyzing ? <><Loader2 size={14} className="animate-spin" /> Analisando com IA...</>
            : <><Sparkles size={14} /> Buscar Publicações</>}
        </button>
        {!hasFile && uploadedFile && <p style={{ fontSize: 11, color: "var(--yellow)" }}>⏳ Aguarde a extração do texto...</p>}
        {!hasFile && !uploadedFile && <p style={{ fontSize: 11, color: "var(--text-3)" }}>⬆️ Faça upload de um arquivo para começar</p>}
      </div>

      {/* Resultados */}
      {results && (
        <div style={{ borderTop: "1px solid var(--border)" }}>
          {/* Summary bar */}
          <div style={{ padding: "12px 20px", background: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span className="badge badge-blue">{results.total_matches} resultado(s)</span>
              {results.keywords_found && Object.entries(results.keywords_found).slice(0, 3).map(([kw, count]) => (
                <span key={kw} className="badge badge-neutral">{kw}: {count}</span>
              ))}
            </div>
            {results.results?.length > 0 && (
              <button className="btn btn-secondary" onClick={saveResults} disabled={isSaving} style={{ fontSize: 12 }}>
                {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                Salvar Todos
              </button>
            )}
          </div>

          {/* Results list */}
          <div style={{ maxHeight: 400, overflowY: "auto" }}>
            {results.results?.map((result, idx) => {
              const u = urgencyConfig[result.urgency] || urgencyConfig.media;
              const UIcon = u.Icon;
              const isExpanded = expandedResult === idx;
              return (
                <div key={idx} style={{ borderBottom: "1px solid var(--border)" }}>
                  <div
                    onClick={() => setExpandedResult(isExpanded ? null : idx)}
                    style={{ padding: "14px 20px", cursor: "pointer", background: isExpanded ? "var(--surface)" : "var(--card)", transition: "background var(--dur)", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}
                    onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.background = "var(--surface)"; }}
                    onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.background = "var(--card)"; }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 6 }}>
                        <span className={u.badgeClass} style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                          <UIcon size={11} /> {u.label}
                        </span>
                        <span className="badge badge-neutral">{result.category}</span>
                        {result.process_number && (
                          <span className="badge badge-neutral" style={{ fontFamily: "monospace" }}>
                            <Hash size={10} /> {result.process_number}
                          </span>
                        )}
                      </div>
                      <h4 style={{ fontSize: 13, fontWeight: 500, color: "var(--text-1)", margin: "0 0 4px" }}>{result.title}</h4>
                      <p style={{ fontSize: 12, color: "var(--text-2)", margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {result.summary}
                      </p>
                      {result.keywords_matched?.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                          {result.keywords_matched.map((kw, i) => (
                            <span key={i} className="badge badge-blue" style={{ fontSize: 10 }}>{kw}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    {isExpanded ? <ChevronUp size={14} style={{ color: "var(--text-3)", flexShrink: 0 }} />
                      : <ChevronDown size={14} style={{ color: "var(--text-3)", flexShrink: 0 }} />}
                  </div>

                  {isExpanded && (
                    <div style={{ padding: "0 20px 14px", background: "var(--surface)", display: "flex", flexDirection: "column", gap: 10 }}>
                      {result.original_excerpt && (
                        <div className="app-card" style={{ padding: 12 }}>
                          <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Trecho Original</p>
                          <p style={{ fontSize: 12, color: "var(--text-1)", margin: 0, lineHeight: 1.6 }}>{result.original_excerpt}</p>
                        </div>
                      )}
                      {result.parties?.length > 0 && (
                        <p style={{ fontSize: 12, color: "var(--text-2)", margin: 0 }}>
                          <strong>Partes:</strong> {result.parties.join(', ')}
                        </p>
                      )}
                      {result.deadline && (
                        <p style={{ fontSize: 12, color: "var(--text-2)", margin: 0 }}>
                          <strong>Prazo:</strong> {result.deadline}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}