import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Sparkles, 
  Upload, 
  FileText, 
  Loader2, 
  CheckCircle,
  AlertCircle,
  Newspaper,
  Search
} from "lucide-react";
import { toast } from "sonner";

const courts = [
  "TJSP - Tribunal de Justiça de São Paulo",
  "TJRJ - Tribunal de Justiça do Rio de Janeiro",
  "TJMG - Tribunal de Justiça de Minas Gerais",
  "TJRS - Tribunal de Justiça do Rio Grande do Sul",
  "TJPR - Tribunal de Justiça do Paraná",
  "TRF1 - Tribunal Regional Federal da 1ª Região",
  "TRF2 - Tribunal Regional Federal da 2ª Região",
  "TRF3 - Tribunal Regional Federal da 3ª Região",
  "TRF4 - Tribunal Regional Federal da 4ª Região",
  "TRF5 - Tribunal Regional Federal da 5ª Região",
  "TST - Tribunal Superior do Trabalho",
  "STJ - Superior Tribunal de Justiça",
  "STF - Supremo Tribunal Federal",
  "DOU - Diário Oficial da União",
  "Outro"
];

export default function DiaryAnalyzer({ open, onClose, isDark, onSuccess, monitorings = [] }) {
  const [step, setStep] = useState(1);
  const [diaryContent, setDiaryContent] = useState("");
  const [selectedCourt, setSelectedCourt] = useState("");
  const [publicationDate, setPublicationDate] = useState(new Date().toISOString().split('T')[0]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadedFile(file);
    
    // Se for PDF ou imagem, fazer upload e extrair
    if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        
        toast.info("Extraindo texto do arquivo...");
        
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
          setDiaryContent(extracted.output.full_text);
          toast.success("Texto extraído com sucesso!");
        }
      } catch (error) {
        toast.error("Erro ao processar arquivo");
      }
    } else if (file.type === 'text/plain') {
      const text = await file.text();
      setDiaryContent(text);
    }
  };

  const analyzeContent = async () => {
    if (!diaryContent.trim()) {
      toast.error("Cole ou faça upload do conteúdo do diário");
      return;
    }

    setIsAnalyzing(true);

    // Coletar todas as palavras-chave dos monitoramentos ativos
    const allKeywords = [];
    const allClientNames = [];
    const allCaseNumbers = [];
    
    monitorings.filter(m => m.is_active).forEach(m => {
      if (m.keywords) allKeywords.push(...m.keywords);
      if (m.client_names) allClientNames.push(...m.client_names);
      if (m.case_numbers) allCaseNumbers.push(...m.case_numbers);
    });

    const keywordsInstruction = allKeywords.length > 0 
      ? `\n\nPALAVRAS-CHAVE MONITORADAS (PRIORIDADE ALTA):
${allKeywords.map(k => `- "${k}"`).join('\n')}

IMPORTANTE: Identifique TODAS as publicações que contenham essas palavras-chave. Para cada publicação, indique quais palavras-chave foram encontradas no campo "matched_keywords".`
      : '';

    const clientsInstruction = allClientNames.length > 0
      ? `\n\nCLIENTES MONITORADOS:
${allClientNames.map(c => `- "${c}"`).join('\n')}

Verifique se alguma dessas pessoas/empresas aparece nas publicações.`
      : '';

    const casesInstruction = allCaseNumbers.length > 0
      ? `\n\nPROCESSOS MONITORADOS:
${allCaseNumbers.map(c => `- "${c}"`).join('\n')}

Verifique se algum desses números de processo aparece nas publicações.`
      : '';

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um ESPECIALISTA JURÍDICO em análise de Diários Oficiais brasileiros. Sua tarefa é analisar o texto com MÁXIMA PRECISÃO.

REGRAS FUNDAMENTAIS DE ANÁLISE:
1. LEIA O TEXTO COMPLETO palavra por palavra antes de extrair qualquer informação
2. APENAS extraia informações que EXISTEM LITERALMENTE no texto - NÃO INVENTE dados
3. Se um número de processo não estiver no texto, retorne null - NÃO CRIE números fictícios
4. Se nomes de partes não estiverem claros, retorne array vazio - NÃO INVENTE nomes
5. Verifique CADA dado extraído comparando com o texto original
6. Para prazos, APENAS inclua se houver data EXPLÍCITA no texto
7. O campo "original_content" DEVE conter o TRECHO EXATO do diário, copiado literalmente
${keywordsInstruction}${clientsInstruction}${casesInstruction}

CONTEÚDO DO DIÁRIO PARA ANÁLISE:
---
${diaryContent.substring(0, 15000)}
---

INSTRUÇÕES DE EXTRAÇÃO (seja PRECISO):

1. TÍTULO: Resumo curto do assunto principal (máx 100 caracteres) - baseado no conteúdo real
2. CATEGORIA: Classifique com base no tipo REAL da publicação:
   - intimacao: citações, intimações, notificações para comparecer ou se manifestar
   - sentenca: sentenças, decisões terminativas
   - despacho: despachos ordinatórios, de mero expediente
   - edital: editais de leilão, citação por edital, convocações públicas
   - decisao: decisões interlocutórias, liminares
   - acordao: acórdãos de tribunais
   - citacao: citações iniciais
   - outros: quando não se encaixar nas anteriores

3. NÚMERO DO PROCESSO: 
   - Extraia APENAS se aparecer no texto
   - Formato CNJ (0000000-00.0000.0.00.0000) ou formato antigo
   - Se não houver número, retorne null

4. PARTES: 
   - Liste APENAS nomes que aparecem EXPLICITAMENTE como partes
   - Não confunda advogados, juízes ou serventuários com partes
   - Se não identificar partes claramente, retorne array vazio []

5. RESUMO: Descreva objetivamente O QUE a publicação comunica (2-3 frases)

6. ANÁLISE: 
   - O que essa publicação significa juridicamente?
   - Quais providências devem ser tomadas?
   - Há prazos a cumprir?

7. URGÊNCIA:
   - alta: prazo de 5 dias ou menos, citação inicial, intimação para audiência próxima
   - media: prazos de 15 dias, manifestações ordinárias
   - baixa: meras comunicações, publicações informativas

8. PRAZO: 
   - APENAS inclua se uma DATA específica for mencionada
   - Formato: YYYY-MM-DD
   - Se mencionar "15 dias" sem data base, NÃO calcule - deixe null

9. ORIGINAL_CONTENT: Copie o TRECHO EXATO do diário que corresponde a esta publicação

10. MATCHED_KEYWORDS: Liste APENAS palavras-chave que REALMENTE aparecem no texto

Retorne JSON com esta estrutura:
{
  "publications": [
    {
      "title": "string - resumo curto e preciso",
      "category": "intimacao|sentenca|despacho|edital|decisao|acordao|citacao|outros",
      "case_number": "string exato do texto ou null",
      "parties": ["nomes exatos do texto"],
      "summary": "descrição objetiva do conteúdo",
      "analysis": "análise jurídica e providências necessárias",
      "urgency": "alta|media|baixa",
      "deadline": "YYYY-MM-DD ou null",
      "original_content": "trecho literal copiado do diário",
      "matched_keywords": ["palavras encontradas no texto"]
    }
  ],
  "total_found": número_de_publicações_identificadas,
  "overview": "resumo geral do diário analisado",
  "keywords_summary": {"palavra": quantidade}
}

ATENÇÃO: Prefira MENOS publicações com dados CORRETOS do que muitas com dados inventados.`,
        response_json_schema: {
          type: "object",
          properties: {
            publications: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  category: { type: "string" },
                  case_number: { type: "string" },
                  parties: { type: "array", items: { type: "string" } },
                  summary: { type: "string" },
                  analysis: { type: "string" },
                  urgency: { type: "string" },
                  deadline: { type: "string" },
                  original_content: { type: "string" },
                  matched_keywords: { type: "array", items: { type: "string" } }
                }
              }
            },
            total_found: { type: "number" },
            overview: { type: "string" },
            keywords_summary: { type: "object" }
          }
        }
      });

      setAnalysisResults(response);
      setStep(2);
      
    } catch (error) {
      console.error(error);
      toast.error("Erro ao analisar o diário");
    }

    setIsAnalyzing(false);
  };

  const savePublications = async () => {
    if (!analysisResults?.publications) return;

    setIsAnalyzing(true);

    try {
      for (const pub of analysisResults.publications) {
        await base44.entities.DiaryPublication.create({
          title: pub.title,
          content: pub.original_content || pub.summary,
          source: selectedCourt || "Diário Oficial",
          publication_date: publicationDate,
          category: pub.category,
          court: selectedCourt,
          case_number: pub.case_number,
          parties_involved: pub.parties || [],
          ai_summary: pub.summary,
          ai_analysis: pub.analysis,
          urgency: pub.urgency,
          deadline_detected: pub.deadline,
          keywords_matched: pub.matched_keywords || [],
          is_read: false,
          is_starred: pub.matched_keywords?.length > 0 // Auto-favoritar se tiver palavra-chave
        });
      }

      toast.success(`${analysisResults.publications.length} publicações salvas!`);
      onSuccess();
      resetForm();
      
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar publicações");
    }

    setIsAnalyzing(false);
  };

  const resetForm = () => {
    setStep(1);
    setDiaryContent("");
    setSelectedCourt("");
    setAnalysisResults(null);
    setUploadedFile(null);
  };

  return (
    <Dialog open={open} onOpenChange={() => { onClose(); resetForm(); }}>
      <DialogContent className={`max-w-3xl max-h-[90vh] overflow-y-auto ${isDark ? 'bg-neutral-900 border-neutral-800' : ''}`}>
        <DialogHeader>
          <DialogTitle className={`flex items-center gap-2 ${isDark ? 'text-white' : ''}`}>
            <Sparkles className="w-5 h-5 text-purple-500" />
            Analisar Diário Oficial com IA
          </DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`text-sm font-medium mb-2 block ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                  Tribunal/Fonte
                </label>
                <Select value={selectedCourt} onValueChange={setSelectedCourt}>
                  <SelectTrigger className={isDark ? 'bg-neutral-800 border-neutral-700 text-white' : ''}>
                    <SelectValue placeholder="Selecione o tribunal" />
                  </SelectTrigger>
                  <SelectContent>
                    {courts.map(court => (
                      <SelectItem key={court} value={court}>{court}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className={`text-sm font-medium mb-2 block ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                  Data da Publicação
                </label>
                <Input
                  type="date"
                  value={publicationDate}
                  onChange={(e) => setPublicationDate(e.target.value)}
                  className={isDark ? 'bg-neutral-800 border-neutral-700 text-white' : ''}
                />
              </div>
            </div>

            <div>
              <label className={`text-sm font-medium mb-2 block ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                Conteúdo do Diário
              </label>
              
              {/* Upload Area */}
              <div className={`border-2 border-dashed rounded-xl p-6 text-center mb-4 transition-colors ${
                isDark ? 'border-neutral-700 hover:border-neutral-600' : 'border-slate-300 hover:border-slate-400'
              }`}>
                <input
                  type="file"
                  accept=".pdf,.txt,.png,.jpg,.jpeg"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="diary-upload"
                />
                <label htmlFor="diary-upload" className="cursor-pointer">
                  <Upload className={`w-8 h-8 mx-auto mb-2 ${isDark ? 'text-neutral-500' : 'text-slate-400'}`} />
                  <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
                    {uploadedFile ? uploadedFile.name : 'Arraste um PDF, imagem ou TXT ou clique para selecionar'}
                  </p>
                </label>
              </div>

              <div className={`text-center text-sm mb-4 ${isDark ? 'text-neutral-500' : 'text-slate-500'}`}>
                ou cole o texto diretamente
              </div>

              <Textarea
                placeholder="Cole aqui o conteúdo do diário oficial para análise..."
                value={diaryContent}
                onChange={(e) => setDiaryContent(e.target.value)}
                rows={12}
                className={isDark ? 'bg-neutral-800 border-neutral-700 text-white' : ''}
              />
              <p className={`text-xs mt-2 ${isDark ? 'text-neutral-500' : 'text-slate-500'}`}>
                {diaryContent.length.toLocaleString()} caracteres
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={onClose} className={isDark ? 'border-neutral-700' : ''}>
                Cancelar
              </Button>
              <Button 
                onClick={analyzeContent}
                disabled={isAnalyzing || !diaryContent.trim()}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Analisar com IA
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 2 && analysisResults && (
          <div className="space-y-4">
            {/* Overview */}
            <div className={`p-4 rounded-xl ${isDark ? 'bg-neutral-800' : 'bg-slate-100'}`}>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {analysisResults.total_found} publicações encontradas
                </span>
              </div>
              <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
                {analysisResults.overview}
              </p>
            </div>

            {/* Keywords Summary */}
            {analysisResults.keywords_summary && Object.keys(analysisResults.keywords_summary).length > 0 && (
              <div className={`p-4 rounded-xl border ${isDark ? 'bg-purple-500/10 border-purple-500/20' : 'bg-purple-50 border-purple-200'}`}>
                <h4 className={`text-sm font-medium mb-3 flex items-center gap-2 ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
                  <Search className="w-4 h-4" />
                  Palavras-chave Encontradas
                </h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(analysisResults.keywords_summary).map(([keyword, count]) => (
                    <span 
                      key={keyword}
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700'}`}
                    >
                      {keyword}
                      <span className={`text-xs font-bold px-1.5 rounded-full ${isDark ? 'bg-purple-500 text-white' : 'bg-purple-600 text-white'}`}>
                        {count}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Publications Preview */}
            <div className="max-h-96 overflow-y-auto space-y-3">
              {analysisResults.publications?.map((pub, index) => (
                <div 
                  key={index}
                  className={`p-4 rounded-lg border ${isDark ? 'bg-neutral-800/50 border-neutral-700' : 'bg-white border-slate-200'}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                          pub.urgency === 'alta' ? 'bg-red-500/20 text-red-500' :
                          pub.urgency === 'media' ? 'bg-yellow-500/20 text-yellow-600' :
                          'bg-green-500/20 text-green-500'
                        }`}>
                          {pub.urgency === 'alta' ? 'URGENTE' : pub.urgency === 'media' ? 'MÉDIA' : 'BAIXA'}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded ${isDark ? 'bg-neutral-700 text-neutral-300' : 'bg-slate-200 text-slate-600'}`}>
                          {pub.category}
                        </span>
                        {pub.matched_keywords?.length > 0 && (
                          <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-500 font-medium">
                            🎯 {pub.matched_keywords.join(', ')}
                          </span>
                        )}
                      </div>
                      <h4 className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {pub.title}
                      </h4>
                      <p className={`text-sm mt-1 ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
                        {pub.summary}
                      </p>
                      {pub.case_number && (
                        <p className={`text-xs mt-2 ${isDark ? 'text-neutral-500' : 'text-slate-500'}`}>
                          Processo: {pub.case_number}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className={isDark ? 'border-neutral-700' : ''}>
                Voltar
              </Button>
              <Button 
                onClick={savePublications}
                disabled={isAnalyzing}
                className="bg-green-600 hover:bg-green-700"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Salvar {analysisResults.publications?.length} Publicações
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}