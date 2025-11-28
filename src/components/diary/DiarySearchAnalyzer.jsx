import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Upload, 
  Sparkles, 
  Loader2, 
  FileText,
  X,
  CheckCircle,
  AlertTriangle,
  Clock,
  Hash,
  ChevronDown,
  ChevronUp,
  Copy,
  Save
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

// Dicionário de sinônimos jurídicos
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

// Padrões de números de processo
const PROCESS_PATTERNS = [
  /\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}/g,
  /\d{4}\.\d{3}\.\d{6}\/\d{4}-\d{2}/g,
  /\d{6,7}\/\d{4}/g,
];

export default function DiarySearchAnalyzer({ isDark, monitorings = [], onSuccess }) {
  const [searchTerms, setSearchTerms] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileContent, setFileContent] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [expandedResult, setExpandedResult] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Expande sinônimos das palavras-chave
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
    
    if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
      try {
        toast.info("Extraindo texto do arquivo...");
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        
        const extracted = await base44.integrations.Core.ExtractDataFromUploadedFile({
          file_url,
          json_schema: {
            type: "object",
            properties: {
              full_text: { type: "string", description: "Todo o texto extraído do documento" }
            }
          }
        });
        
        if (extracted.status === "success" && extracted.output?.full_text) {
          setFileContent(extracted.output.full_text);
          toast.success("Texto extraído!");
        }
      } catch (error) {
        toast.error("Erro ao processar arquivo");
      }
    } else if (file.type === 'text/plain') {
      const text = await file.text();
      setFileContent(text);
    }
  };

  const analyzeWithAI = async () => {
    if (!fileContent.trim()) {
      toast.error("Faça upload de um arquivo primeiro");
      return;
    }

    const terms = searchTerms.split(',').map(t => t.trim()).filter(Boolean);
    if (terms.length === 0) {
      toast.error("Digite pelo menos uma palavra-chave");
      return;
    }

    setIsAnalyzing(true);
    const expandedTerms = expandSynonyms(terms);

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um ESPECIALISTA em análise de Diários Oficiais brasileiros.

TAREFA: Analise o texto e encontre TODAS as publicações que contenham as palavras-chave ou seus sinônimos.

PALAVRAS-CHAVE PARA BUSCAR (incluindo sinônimos):
${expandedTerms.map(t => `- "${t}"`).join('\n')}

TERMOS ORIGINAIS DO USUÁRIO: ${terms.join(', ')}

CONTEÚDO DO DIÁRIO:
---
${fileContent.substring(0, 20000)}
---

INSTRUÇÕES:
1. Identifique CADA publicação que contenha qualquer uma das palavras-chave
2. Para cada publicação encontrada, extraia:
   - Título resumido
   - Número do processo (se houver)
   - Partes envolvidas
   - Palavras-chave encontradas nesta publicação
   - Trecho original (até 500 caracteres)
   - Resumo do conteúdo
   - Urgência (alta/media/baixa)
   - Prazo identificado (se houver)
   - Categoria (intimacao/sentenca/despacho/edital/decisao/acordao/citacao/outros)

3. Agrupe resultados por número de processo quando possível
4. NÃO INVENTE dados - extraia apenas o que está no texto

Retorne JSON:
{
  "total_matches": número,
  "keywords_found": {"palavra": quantidade},
  "results": [
    {
      "title": "string",
      "process_number": "string ou null",
      "parties": ["string"],
      "keywords_matched": ["string"],
      "original_excerpt": "trecho do texto",
      "summary": "resumo",
      "urgency": "alta|media|baixa",
      "deadline": "YYYY-MM-DD ou null",
      "category": "string"
    }
  ]
}`,
        response_json_schema: {
          type: "object",
          properties: {
            total_matches: { type: "number" },
            keywords_found: { type: "object" },
            results: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  process_number: { type: "string" },
                  parties: { type: "array", items: { type: "string" } },
                  keywords_matched: { type: "array", items: { type: "string" } },
                  original_excerpt: { type: "string" },
                  summary: { type: "string" },
                  urgency: { type: "string" },
                  deadline: { type: "string" },
                  category: { type: "string" }
                }
              }
            }
          }
        }
      });

      setResults(response);
      
      if (response.total_matches === 0) {
        toast.info("Nenhuma publicação encontrada com essas palavras-chave");
      } else {
        toast.success(`${response.total_matches} publicação(ões) encontrada(s)!`);
      }
      
    } catch (error) {
      console.error(error);
      toast.error("Erro ao analisar");
    }

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
          is_read: false,
          is_starred: true
        };
        
        // Só adiciona campos opcionais se tiverem valor válido
        if (pub.category && pub.category !== "" && pub.category !== "null") pubData.category = pub.category;
        if (pub.process_number && pub.process_number !== "" && pub.process_number !== "null") pubData.case_number = pub.process_number;
        if (pub.urgency && pub.urgency !== "" && pub.urgency !== "null") pubData.urgency = pub.urgency;
        if (pub.deadline && pub.deadline !== "" && pub.deadline !== "null") pubData.deadline_detected = pub.deadline;
        
        await base44.entities.DiaryPublication.create(pubData);
      }

      // Notificações
      const activeMonitorings = monitorings.filter(m => m.is_active);
      for (const monitoring of activeMonitorings) {
        if (monitoring.notification_push) {
          await base44.entities.Notification.create({
            type: 'deadline',
            title: `📰 ${results.results.length} publicação(ões) salva(s)`,
            message: `Busca por "${searchTerms}" encontrou ${results.results.length} resultado(s).`,
            recipient_email: user.email,
            is_read: false,
            entity_type: 'DiaryMonitoring',
            entity_id: monitoring.id,
            actor_name: 'Monitor de Diários'
          });
        }
      }

      toast.success(`${results.results.length} publicação(ões) salva(s)!`);
      onSuccess?.();
      clearAll();
      
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar");
    }
    
    setIsSaving(false);
  };

  const clearAll = () => {
    setSearchTerms("");
    setUploadedFile(null);
    setFileContent("");
    setResults(null);
    setExpandedResult(null);
  };

  const urgencyConfig = {
    alta: { color: "red", icon: AlertTriangle, label: "Urgente" },
    media: { color: "yellow", icon: Clock, label: "Média" },
    baixa: { color: "green", icon: CheckCircle, label: "Baixa" }
  };

  return (
    <div className={`rounded-xl border ${isDark ? 'bg-neutral-900/50 border-neutral-800' : 'bg-white border-slate-200'}`}>
      {/* Header */}
      <div className="p-4 border-b border-inherit">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className={`w-5 h-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
          <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Pesquisa Inteligente em Diários
          </h3>
        </div>
        <p className={`text-sm ${isDark ? 'text-neutral-500' : 'text-slate-500'}`}>
          Faça upload do diário e digite as palavras-chave para buscar
        </p>
      </div>

      {/* Input Area */}
      <div className="p-4 space-y-4">
        {/* Upload */}
        <div>
          <label className={`text-sm font-medium mb-2 block ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
            1. Upload do Diário Oficial
          </label>
          <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors ${
            uploadedFile 
              ? isDark ? 'border-green-500/50 bg-green-500/10' : 'border-green-500 bg-green-50'
              : isDark ? 'border-neutral-700 hover:border-neutral-600' : 'border-slate-300 hover:border-slate-400'
          }`}>
            <input
              type="file"
              accept=".pdf,.txt,.png,.jpg,.jpeg"
              onChange={handleFileUpload}
              className="hidden"
              id="diary-upload-smart"
            />
            <label htmlFor="diary-upload-smart" className="cursor-pointer">
              {uploadedFile ? (
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className={`text-sm font-medium ${isDark ? 'text-green-400' : 'text-green-700'}`}>
                    {uploadedFile.name}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={(e) => { e.preventDefault(); setUploadedFile(null); setFileContent(""); setResults(null); }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <Upload className={`w-6 h-6 mx-auto mb-1 ${isDark ? 'text-neutral-500' : 'text-slate-400'}`} />
                  <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
                    Clique para selecionar PDF, TXT ou imagem
                  </p>
                </>
              )}
            </label>
          </div>
          {fileContent && (
            <p className={`text-xs mt-1 ${isDark ? 'text-neutral-500' : 'text-slate-500'}`}>
              ✓ {fileContent.length.toLocaleString()} caracteres extraídos
            </p>
          )}
        </div>

        {/* Palavras-chave */}
        <div>
          <label className={`text-sm font-medium mb-2 block ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
            2. Palavras-chave para busca
          </label>
          <div className={`p-3 rounded-lg border ${isDark ? 'bg-neutral-800/50 border-neutral-700' : 'bg-slate-50 border-slate-200'}`}>
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-neutral-500' : 'text-slate-400'}`} />
              <Input
                placeholder="Ex: licitação, contrato, precatório (separados por vírgula)"
                value={searchTerms}
                onChange={(e) => setSearchTerms(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && analyzeWithAI()}
                className={`pl-10 ${isDark ? 'bg-neutral-900 border-neutral-600 text-white' : 'bg-white'}`}
              />
            </div>
            <p className={`text-xs mt-2 ${isDark ? 'text-neutral-500' : 'text-slate-500'}`}>
              💡 Sinônimos jurídicos são incluídos automaticamente na busca
            </p>
          </div>
        </div>

        {/* Botão de Análise */}
        <Button 
          onClick={analyzeWithAI}
          disabled={!fileContent || !searchTerms.trim() || isAnalyzing}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analisando com IA...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Buscar Publicações
            </>
          )}
        </Button>
      </div>

      {/* Resultados */}
      {results && (
        <div className={`border-t ${isDark ? 'border-neutral-800' : 'border-slate-200'}`}>
          {/* Summary */}
          <div className={`p-4 ${isDark ? 'bg-neutral-800/50' : 'bg-slate-50'}`}>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <Badge className="bg-purple-500/20 text-purple-500 border-0">
                  {results.total_matches} resultado(s)
                </Badge>
                {results.keywords_found && Object.entries(results.keywords_found).slice(0, 3).map(([kw, count]) => (
                  <Badge key={kw} variant="outline" className="text-xs">
                    {kw}: {count}
                  </Badge>
                ))}
              </div>
              {results.results?.length > 0 && (
                <Button 
                  onClick={saveResults}
                  disabled={isSaving}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Salvar Todos
                </Button>
              )}
            </div>
          </div>

          {/* Results List */}
          <div className="max-h-[400px] overflow-y-auto">
            {results.results?.map((result, idx) => {
              const urgency = urgencyConfig[result.urgency] || urgencyConfig.media;
              const UrgencyIcon = urgency.icon;
              
              return (
                <div 
                  key={idx}
                  className={`border-b last:border-b-0 ${isDark ? 'border-neutral-800' : 'border-slate-100'}`}
                >
                  <div 
                    className={`p-4 cursor-pointer transition-colors ${
                      expandedResult === idx
                        ? isDark ? 'bg-neutral-800' : 'bg-slate-100'
                        : isDark ? 'hover:bg-neutral-800/50' : 'hover:bg-slate-50'
                    }`}
                    onClick={() => setExpandedResult(expandedResult === idx ? null : idx)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Badge className={`text-xs bg-${urgency.color}-500/20 text-${urgency.color}-500 border-0`}>
                            <UrgencyIcon className="w-3 h-3 mr-1" />
                            {urgency.label}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {result.category}
                          </Badge>
                          {result.process_number && (
                            <Badge variant="outline" className="text-xs font-mono">
                              <Hash className="w-3 h-3 mr-1" />
                              {result.process_number}
                            </Badge>
                          )}
                        </div>
                        <h4 className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {result.title}
                        </h4>
                        <p className={`text-sm mt-1 line-clamp-2 ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
                          {result.summary}
                        </p>
                        {result.keywords_matched?.length > 0 && (
                          <div className="flex gap-1 mt-2 flex-wrap">
                            {result.keywords_matched.map((kw, i) => (
                              <span key={i} className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-500">
                                {kw}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      {expandedResult === idx ? (
                        <ChevronUp className={`w-4 h-4 shrink-0 ${isDark ? 'text-neutral-500' : 'text-slate-400'}`} />
                      ) : (
                        <ChevronDown className={`w-4 h-4 shrink-0 ${isDark ? 'text-neutral-500' : 'text-slate-400'}`} />
                      )}
                    </div>
                  </div>

                  {expandedResult === idx && (
                    <div className={`px-4 pb-4 space-y-3 ${isDark ? 'bg-neutral-800/30' : 'bg-slate-50/50'}`}>
                      {result.original_excerpt && (
                        <div className={`p-3 rounded-lg ${isDark ? 'bg-neutral-700/50' : 'bg-white border border-slate-200'}`}>
                          <p className={`text-xs font-medium mb-1 ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                            Trecho Original:
                          </p>
                          <p className={`text-sm ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                            {result.original_excerpt}
                          </p>
                        </div>
                      )}
                      {result.parties?.length > 0 && (
                        <div className={`text-sm ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
                          <strong>Partes:</strong> {result.parties.join(', ')}
                        </div>
                      )}
                      {result.deadline && (
                        <div className={`text-sm ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
                          <strong>Prazo:</strong> {result.deadline}
                        </div>
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