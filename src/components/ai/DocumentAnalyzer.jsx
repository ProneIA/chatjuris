import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, Loader2, Download, Copy, AlertTriangle, 
  CheckCircle2, GitCompare, Lightbulb, List, 
  FileSignature, Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function DocumentAnalyzer({ uploadedFile, onAnalysisComplete, isDark = false }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisType, setAnalysisType] = useState("identify");
  const [result, setResult] = useState(null);
  const [compareFile, setCompareFile] = useState(null);
  const [uploadingCompare, setUploadingCompare] = useState(false);

  const analysisTypes = [
    {
      id: "identify",
      label: "Identificar Tipo",
      icon: FileSignature,
      description: "Identifica o tipo de documento e sugere ações relevantes"
    },
    {
      id: "summarize",
      label: "Resumir",
      icon: List,
      description: "Resumo em bullet points ou formato curto"
    },
    {
      id: "compare",
      label: "Comparar Versões",
      icon: GitCompare,
      description: "Compare com outra versão do documento"
    },
    {
      id: "clauses",
      label: "Sugerir Cláusulas",
      icon: Lightbulb,
      description: "Sugestões de cláusulas contratuais"
    }
  ];

  const handleCompareFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCompare(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setCompareFile({ url: file_url, name: file.name });
      toast.success("Segunda versão carregada!");
    } catch (error) {
      toast.error("Erro ao fazer upload do arquivo.");
    }
    setUploadingCompare(false);
  };

  const analyzeDocument = async () => {
    if (!uploadedFile) {
      toast.error("Nenhum documento foi enviado");
      return;
    }

    setAnalyzing(true);
    setResult(null);

    try {
      let prompt = "";
      let fileUrls = [uploadedFile.url];
      let schema = null;

      switch (analysisType) {
        case "identify":
          prompt = `Você é um especialista em análise de documentos jurídicos brasileiros.

Analise o documento anexado e retorne um JSON com:

1. tipo_documento: Identifique o tipo (petição inicial, recurso, contestação, contrato, sentença, despacho, procuração, etc.)
2. area_direito: Área do direito (civil, trabalhista, penal, tributário, etc.)
3. partes: Liste as partes envolvidas
4. resumo_curto: Resumo em 2-3 frases
5. acoes_sugeridas: Array de 3-5 ações relevantes que um advogado pode tomar (ex: "Protocolar contestação em 15 dias", "Analisar jurisprudência sobre X")
6. prazos_identificados: Array de prazos mencionados no documento
7. pontos_atencao: Array de 3-5 pontos que merecem atenção especial

Seja preciso e profissional.`;
          
          schema = {
            type: "object",
            properties: {
              tipo_documento: { type: "string" },
              area_direito: { type: "string" },
              partes: { type: "array", items: { type: "string" } },
              resumo_curto: { type: "string" },
              acoes_sugeridas: { type: "array", items: { type: "string" } },
              prazos_identificados: { type: "array", items: { type: "string" } },
              pontos_atencao: { type: "array", items: { type: "string" } }
            }
          };
          break;

        case "summarize":
          prompt = `Você é um especialista em resumir documentos jurídicos brasileiros.

Analise o documento anexado e retorne um JSON com:

1. resumo_bullet_points: Array de 5-10 bullet points com os pontos mais importantes
2. resumo_tres_frases: Resumo ultra-curto em exatamente 3 frases
3. palavras_chave: Array de 5-8 palavras-chave
4. trechos_importantes: Array de 2-3 trechos literais mais relevantes do documento

Seja objetivo e direto.`;
          
          schema = {
            type: "object",
            properties: {
              resumo_bullet_points: { type: "array", items: { type: "string" } },
              resumo_tres_frases: { type: "string" },
              palavras_chave: { type: "array", items: { type: "string" } },
              trechos_importantes: { type: "array", items: { type: "string" } }
            }
          };
          break;

        case "compare":
          if (!compareFile) {
            toast.error("Selecione uma segunda versão para comparar");
            setAnalyzing(false);
            return;
          }
          
          fileUrls = [uploadedFile.url, compareFile.url];
          prompt = `Você é um especialista em comparação de documentos jurídicos.

Analise as duas versões do documento anexadas e retorne um JSON com:

1. resumo_alteracoes: Descrição geral das mudanças entre as versões
2. clausulas_adicionadas: Array de cláusulas ou trechos que foram adicionados na versão mais recente
3. clausulas_removidas: Array de cláusulas ou trechos que foram removidos
4. clausulas_modificadas: Array de objetos com {anterior: string, nova: string, impacto: string}
5. nivel_mudanca: "baixa", "média" ou "alta" - classificação do nível de mudança
6. recomendacoes: Array de 3-5 recomendações sobre as alterações
7. riscos_identificados: Array de riscos jurídicos identificados nas mudanças

Seja detalhado e preciso.`;
          
          schema = {
            type: "object",
            properties: {
              resumo_alteracoes: { type: "string" },
              clausulas_adicionadas: { type: "array", items: { type: "string" } },
              clausulas_removidas: { type: "array", items: { type: "string" } },
              clausulas_modificadas: { 
                type: "array", 
                items: { 
                  type: "object",
                  properties: {
                    anterior: { type: "string" },
                    nova: { type: "string" },
                    impacto: { type: "string" }
                  }
                }
              },
              nivel_mudanca: { type: "string" },
              recomendacoes: { type: "array", items: { type: "string" } },
              riscos_identificados: { type: "array", items: { type: "string" } }
            }
          };
          break;

        case "clauses":
          prompt = `Você é um especialista em contratos e cláusulas contratuais do direito brasileiro.

Analise o documento anexado (que pode ser um contrato, minuta ou documento similar) e retorne um JSON com:

1. tipo_contrato: Identifique o tipo de contrato
2. clausulas_ausentes: Array de cláusulas importantes que estão faltando e deveriam ser incluídas
3. clausulas_sugeridas: Array de objetos com {titulo: string, texto_sugerido: string, justificativa: string} - sugestões de cláusulas completas para adicionar
4. clausulas_melhorar: Array de objetos com {clausula_atual: string, sugestao_melhoria: string}
5. conformidade_legal: Array de pontos sobre conformidade com leis aplicáveis (CDC, CC, etc.)
6. pontos_negociacao: Array de pontos que podem ser negociados entre as partes

Seja profissional e cite artigos legais quando relevante.`;
          
          schema = {
            type: "object",
            properties: {
              tipo_contrato: { type: "string" },
              clausulas_ausentes: { type: "array", items: { type: "string" } },
              clausulas_sugeridas: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    titulo: { type: "string" },
                    texto_sugerido: { type: "string" },
                    justificativa: { type: "string" }
                  }
                }
              },
              clausulas_melhorar: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    clausula_atual: { type: "string" },
                    sugestao_melhoria: { type: "string" }
                  }
                }
              },
              conformidade_legal: { type: "array", items: { type: "string" } },
              pontos_negociacao: { type: "array", items: { type: "string" } }
            }
          };
          break;
      }

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        file_urls: fileUrls,
        response_json_schema: schema
      });

      setResult(response);
      toast.success("Análise concluída!");
      
      if (onAnalysisComplete) {
        onAnalysisComplete(response, analysisType);
      }
    } catch (error) {
      toast.error("Erro ao analisar documento: " + error.message);
    }

    setAnalyzing(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado!");
  };

  const renderResult = () => {
    if (!result) return null;

    switch (analysisType) {
      case "identify":
        return (
          <div className="space-y-4">
            <div className={`p-4 rounded-lg ${isDark ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                <FileSignature className="w-5 h-5 text-blue-600" />
                <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {result.tipo_documento}
                </span>
                <span className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                  • {result.area_direito}
                </span>
              </div>
              <p className={`text-sm ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                {result.resumo_curto}
              </p>
            </div>

            {result.partes && result.partes.length > 0 && (
              <div>
                <h4 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Partes Envolvidas:</h4>
                <ul className="space-y-1">
                  {result.partes.map((parte, i) => (
                    <li key={i} className={`text-sm ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                      • {parte}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.acoes_sugeridas && result.acoes_sugeridas.length > 0 && (
              <div>
                <h4 className={`font-semibold mb-2 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  Ações Sugeridas:
                </h4>
                <ul className="space-y-2">
                  {result.acoes_sugeridas.map((acao, i) => (
                    <li key={i} className={`text-sm p-2 rounded ${isDark ? 'bg-neutral-800' : 'bg-gray-50'}`}>
                      {i + 1}. {acao}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.prazos_identificados && result.prazos_identificados.length > 0 && (
              <div>
                <h4 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Prazos Identificados:</h4>
                <ul className="space-y-1">
                  {result.prazos_identificados.map((prazo, i) => (
                    <li key={i} className={`text-sm ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                      ⏰ {prazo}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.pontos_atencao && result.pontos_atencao.length > 0 && (
              <div>
                <h4 className={`font-semibold mb-2 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                  Pontos de Atenção:
                </h4>
                <ul className="space-y-2">
                  {result.pontos_atencao.map((ponto, i) => (
                    <li key={i} className={`text-sm p-2 rounded ${isDark ? 'bg-orange-900/20 border border-orange-800' : 'bg-orange-50 border border-orange-200'}`}>
                      • {ponto}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );

      case "summarize":
        return (
          <div className="space-y-4">
            <div className={`p-4 rounded-lg ${isDark ? 'bg-purple-900/20 border border-purple-800' : 'bg-purple-50 border border-purple-200'}`}>
              <h4 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Resumo Ultra-Curto (3 Frases):</h4>
              <p className={`text-sm ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                {result.resumo_tres_frases}
              </p>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(result.resumo_tres_frases)}
                className="mt-2"
              >
                <Copy className="w-3 h-3 mr-2" />
                Copiar
              </Button>
            </div>

            <div>
              <h4 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Resumo em Pontos:</h4>
              <ul className="space-y-2">
                {result.resumo_bullet_points?.map((point, i) => (
                  <li key={i} className={`text-sm flex gap-2 ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                    <span className="text-blue-600">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {result.palavras_chave && result.palavras_chave.length > 0 && (
              <div>
                <h4 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Palavras-Chave:</h4>
                <div className="flex flex-wrap gap-2">
                  {result.palavras_chave.map((palavra, i) => (
                    <span key={i} className={`px-2 py-1 rounded text-xs ${isDark ? 'bg-neutral-800 text-neutral-300' : 'bg-gray-100 text-gray-700'}`}>
                      {palavra}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {result.trechos_importantes && result.trechos_importantes.length > 0 && (
              <div>
                <h4 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Trechos Importantes:</h4>
                <div className="space-y-2">
                  {result.trechos_importantes.map((trecho, i) => (
                    <div key={i} className={`p-3 rounded italic border-l-4 border-blue-600 ${isDark ? 'bg-neutral-800' : 'bg-gray-50'}`}>
                      <p className={`text-sm ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>"{trecho}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case "compare":
        return (
          <div className="space-y-4">
            <div className={`p-4 rounded-lg ${isDark ? 'bg-indigo-900/20 border border-indigo-800' : 'bg-indigo-50 border border-indigo-200'}`}>
              <h4 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Resumo das Alterações:</h4>
              <p className={`text-sm ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                {result.resumo_alteracoes}
              </p>
              <div className={`mt-3 inline-flex px-3 py-1 rounded text-xs font-semibold ${
                result.nivel_mudanca === 'alta' 
                  ? 'bg-red-100 text-red-800' 
                  : result.nivel_mudanca === 'média'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-green-100 text-green-800'
              }`}>
                Nível de Mudança: {result.nivel_mudanca?.toUpperCase()}
              </div>
            </div>

            {result.clausulas_adicionadas && result.clausulas_adicionadas.length > 0 && (
              <div>
                <h4 className={`font-semibold mb-2 text-green-600`}>✓ Cláusulas Adicionadas:</h4>
                <ul className="space-y-2">
                  {result.clausulas_adicionadas.map((clausula, i) => (
                    <li key={i} className={`text-sm p-2 rounded ${isDark ? 'bg-green-900/20 border border-green-800' : 'bg-green-50 border border-green-200'}`}>
                      {clausula}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.clausulas_removidas && result.clausulas_removidas.length > 0 && (
              <div>
                <h4 className={`font-semibold mb-2 text-red-600`}>✗ Cláusulas Removidas:</h4>
                <ul className="space-y-2">
                  {result.clausulas_removidas.map((clausula, i) => (
                    <li key={i} className={`text-sm p-2 rounded ${isDark ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'}`}>
                      {clausula}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.clausulas_modificadas && result.clausulas_modificadas.length > 0 && (
              <div>
                <h4 className={`font-semibold mb-2 text-orange-600`}>⟳ Cláusulas Modificadas:</h4>
                <div className="space-y-3">
                  {result.clausulas_modificadas.map((mod, i) => (
                    <div key={i} className={`p-3 rounded ${isDark ? 'bg-orange-900/20 border border-orange-800' : 'bg-orange-50 border border-orange-200'}`}>
                      <div className="grid md:grid-cols-2 gap-3 mb-2">
                        <div>
                          <span className="text-xs font-semibold text-red-600">Anterior:</span>
                          <p className={`text-sm mt-1 ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>{mod.anterior}</p>
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-green-600">Nova:</span>
                          <p className={`text-sm mt-1 ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>{mod.nova}</p>
                        </div>
                      </div>
                      <div className={`text-xs p-2 rounded ${isDark ? 'bg-neutral-800' : 'bg-white'}`}>
                        <strong>Impacto:</strong> {mod.impacto}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.recomendacoes && result.recomendacoes.length > 0 && (
              <div>
                <h4 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Recomendações:</h4>
                <ul className="space-y-2">
                  {result.recomendacoes.map((rec, i) => (
                    <li key={i} className={`text-sm p-2 rounded ${isDark ? 'bg-neutral-800' : 'bg-gray-50'}`}>
                      {i + 1}. {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.riscos_identificados && result.riscos_identificados.length > 0 && (
              <div>
                <h4 className={`font-semibold mb-2 flex items-center gap-2 text-red-600`}>
                  <AlertTriangle className="w-4 h-4" />
                  Riscos Identificados:
                </h4>
                <ul className="space-y-2">
                  {result.riscos_identificados.map((risco, i) => (
                    <li key={i} className={`text-sm p-2 rounded ${isDark ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'}`}>
                      • {risco}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );

      case "clauses":
        return (
          <div className="space-y-4">
            <div className={`p-4 rounded-lg ${isDark ? 'bg-green-900/20 border border-green-800' : 'bg-green-50 border border-green-200'}`}>
              <h4 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Tipo de Contrato:</h4>
              <p className={`text-sm ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                {result.tipo_contrato}
              </p>
            </div>

            {result.clausulas_ausentes && result.clausulas_ausentes.length > 0 && (
              <div>
                <h4 className={`font-semibold mb-2 text-orange-600`}>Cláusulas Importantes Ausentes:</h4>
                <ul className="space-y-1">
                  {result.clausulas_ausentes.map((clausula, i) => (
                    <li key={i} className={`text-sm ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                      • {clausula}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.clausulas_sugeridas && result.clausulas_sugeridas.length > 0 && (
              <div>
                <h4 className={`font-semibold mb-3 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <Lightbulb className="w-4 h-4 text-yellow-600" />
                  Sugestões de Cláusulas Completas:
                </h4>
                <div className="space-y-4">
                  {result.clausulas_sugeridas.map((clausula, i) => (
                    <div key={i} className={`p-4 rounded-lg ${isDark ? 'bg-neutral-800 border border-neutral-700' : 'bg-white border border-gray-200'}`}>
                      <h5 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {clausula.titulo}
                      </h5>
                      <div className={`p-3 rounded mb-2 ${isDark ? 'bg-neutral-900' : 'bg-gray-50'}`}>
                        <p className={`text-sm ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                          {clausula.texto_sugerido}
                        </p>
                      </div>
                      <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                        <strong>Justificativa:</strong> {clausula.justificativa}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(clausula.texto_sugerido)}
                        className="mt-2"
                      >
                        <Copy className="w-3 h-3 mr-2" />
                        Copiar Cláusula
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.clausulas_melhorar && result.clausulas_melhorar.length > 0 && (
              <div>
                <h4 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Cláusulas a Melhorar:</h4>
                <div className="space-y-3">
                  {result.clausulas_melhorar.map((item, i) => (
                    <div key={i} className={`p-3 rounded ${isDark ? 'bg-yellow-900/20 border border-yellow-800' : 'bg-yellow-50 border border-yellow-200'}`}>
                      <p className={`text-sm mb-2 ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                        <strong>Cláusula atual:</strong> {item.clausula_atual}
                      </p>
                      <p className={`text-sm ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                        <strong>Sugestão:</strong> {item.sugestao_melhoria}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.conformidade_legal && result.conformidade_legal.length > 0 && (
              <div>
                <h4 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Conformidade Legal:</h4>
                <ul className="space-y-1">
                  {result.conformidade_legal.map((item, i) => (
                    <li key={i} className={`text-sm ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                      • {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.pontos_negociacao && result.pontos_negociacao.length > 0 && (
              <div>
                <h4 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Pontos para Negociação:</h4>
                <ul className="space-y-2">
                  {result.pontos_negociacao.map((ponto, i) => (
                    <li key={i} className={`text-sm p-2 rounded ${isDark ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
                      💼 {ponto}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}>
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <Sparkles className="w-5 h-5 text-purple-600" />
          Análise Avançada de Documentos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tabs for Analysis Types */}
        <Tabs value={analysisType} onValueChange={setAnalysisType}>
          <TabsList className={`grid grid-cols-2 lg:grid-cols-4 ${isDark ? 'bg-neutral-800' : 'bg-gray-100'}`}>
            {analysisTypes.map((type) => {
              const Icon = type.icon;
              return (
                <TabsTrigger key={type.id} value={type.id} className="text-xs">
                  <Icon className="w-3 h-3 mr-1" />
                  {type.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>

        {/* Description */}
        <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
          {analysisTypes.find(t => t.id === analysisType)?.description}
        </p>

        {/* Compare File Upload */}
        {analysisType === "compare" && (
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Segunda Versão do Documento:
            </label>
            <input
              type="file"
              onChange={handleCompareFileUpload}
              accept=".pdf,.docx,.txt"
              className={`w-full text-sm ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}
            />
            {compareFile && (
              <p className={`text-xs mt-2 ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                ✓ {compareFile.name}
              </p>
            )}
          </div>
        )}

        {/* Analyze Button */}
        <Button
          onClick={analyzeDocument}
          disabled={analyzing || uploadingCompare || (analysisType === "compare" && !compareFile)}
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          {analyzing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analisando...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Iniciar Análise
            </>
          )}
        </Button>

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`p-4 rounded-lg border ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-gray-50 border-gray-200'}`}
            >
              {renderResult()}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}