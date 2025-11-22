import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Sparkles, MessageSquare, Loader2, Download, X, Send } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

const LEXIA_SYSTEM_PROMPT = `Você é LEXIA, uma inteligência artificial jurídica avançada, projetada para atuar como assistente de alto nível para estudantes, advogados, professores, servidores públicos e operadores do Direito em geral.

MISSÃO: Seu foco principal é o Direito brasileiro. Explicar conceitos jurídicos com clareza e precisão técnica, ajudar na interpretação de normas, auxiliar na elaboração de peças processuais, sempre com postura ética e responsável.

ESTILO: Profissional, respeitoso, didático e objetivo. Use subtítulos, listas e parágrafos curtos. Português do Brasil. Seja completo mas direto.

BASE NORMATIVA: Priorize Constituição Federal, Leis federais, Códigos (CC, CPC, CP, CPP, CDC, CLT, CTN), Súmulas e jurisprudência dos Tribunais Superiores.

ÉTICA: Você não é advogado do usuário. Não incentive fraude, má-fé ou ilegalidades. Se algo for claramente ilegal, recuse educadamente. Para situações de risco, sugira procurar profissional habilitado.

FORMATO PADRÃO:
1. Enquadramento: O que o usuário quer
2. Base jurídica: Normas e princípios relevantes
3. Análise: Aplicação aos fatos
4. Conclusão: Resumo objetivo
5. Observação de cautela (quando cabível)`;

export default function LexiaDocumentAnalyzer({ onClose }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [question, setQuestion] = useState("");
  const [conversation, setConversation] = useState([]);
  const [isAsking, setIsAsking] = useState(false);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
      if (!validTypes.includes(file.type)) {
        toast.error("Formato inválido. Use PDF ou DOCX.");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Arquivo muito grande. Máximo 10MB.");
        return;
      }
      setSelectedFile(file);
      setAnalysis(null);
      setConversation([]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: selectedFile });
      setFileUrl(file_url);
      toast.success("Arquivo carregado com sucesso!");
      
      // Auto-iniciar análise
      await handleAnalyze(file_url);
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      toast.error("Erro ao carregar arquivo. Tente novamente.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAnalyze = async (url = fileUrl) => {
    if (!url) return;

    setIsAnalyzing(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `${LEXIA_SYSTEM_PROMPT}

TAREFA: Analise o documento jurídico anexado e forneça:

1. **Resumo Executivo**: Síntese do documento em 3-5 parágrafos
2. **Tipo de Documento**: Identifique (ex: contrato, petição, sentença, parecer, etc.)
3. **Partes Envolvidas**: Liste as partes mencionadas
4. **Informações Chave**: Extraia datas importantes, valores, prazos, obrigações principais
5. **Fundamentos Jurídicos**: Artigos, leis, súmulas citados
6. **Pontos de Atenção**: Cláusulas críticas, riscos, prazos urgentes
7. **Conclusão**: Avaliação geral do documento

Seja detalhado, técnico e objetivo.`,
        file_urls: [url],
        add_context_from_internet: false
      });

      setAnalysis(response);
      toast.success("Análise concluída!");
    } catch (error) {
      console.error("Erro na análise:", error);
      toast.error("Erro ao analisar documento. Tente novamente.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!question.trim() || !fileUrl) return;

    const userQuestion = question;
    setQuestion("");
    setConversation(prev => [...prev, { role: "user", content: userQuestion }]);
    setIsAsking(true);

    try {
      const contextHistory = conversation
        .map(m => `${m.role === 'user' ? 'Usuário' : 'LEXIA'}: ${m.content}`)
        .join('\n\n');

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `${LEXIA_SYSTEM_PROMPT}

Histórico da conversa:
${contextHistory}

Usuário: ${userQuestion}

TAREFA: Responda à pergunta do usuário sobre o documento anexado. Use o conteúdo do documento como base. Seja preciso, cite partes relevantes do documento quando aplicável, e mantenha o estilo LEXIA.`,
        file_urls: [fileUrl],
        add_context_from_internet: false
      });

      setConversation(prev => [...prev, { role: "assistant", content: response }]);
    } catch (error) {
      console.error("Erro ao responder:", error);
      toast.error("Erro ao processar pergunta. Tente novamente.");
    } finally {
      setIsAsking(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFileUrl(null);
    setAnalysis(null);
    setConversation([]);
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-x-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex items-center justify-between min-w-[768px]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold">LEXIA - Análise de Documentos</h2>
            <p className="text-sm text-white/80">Assistente Jurídica com IA Avançada</p>
          </div>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20">
            <X className="w-5 h-5" />
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4 min-w-[768px]">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload de Documento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selectedFile ? (
              <div>
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileSelect}
                  className="cursor-pointer"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Formatos aceitos: PDF, DOCX (máx. 10MB)
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="font-medium text-slate-900">{selectedFile.name}</p>
                    <p className="text-sm text-slate-600">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!fileUrl && (
                    <Button
                      onClick={handleUpload}
                      disabled={isUploading}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Carregando...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Analisar
                        </>
                      )}
                    </Button>
                  )}
                  {fileUrl && (
                    <Badge variant="default" className="bg-green-600">
                      ✓ Carregado
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleRemoveFile}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Analysis Results */}
        {isAnalyzing && (
          <Card>
            <CardContent className="py-12 text-center">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-slate-600">LEXIA está analisando seu documento...</p>
              <p className="text-sm text-slate-500 mt-2">Isso pode levar alguns segundos</p>
            </CardContent>
          </Card>
        )}

        {analysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Análise Completa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown
                    components={{
                      h1: ({ children }) => <h1 className="text-xl font-bold text-slate-900 mt-6 mb-3">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-lg font-semibold text-slate-800 mt-5 mb-2">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-base font-semibold text-slate-700 mt-4 mb-2">{children}</h3>,
                      p: ({ children }) => <p className="text-slate-700 mb-3 leading-relaxed">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc ml-5 mb-3 space-y-1">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal ml-5 mb-3 space-y-1">{children}</ol>,
                      li: ({ children }) => <li className="text-slate-700">{children}</li>,
                      strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
                    }}
                  >
                    {analysis}
                  </ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Q&A Section */}
        {fileUrl && analysis && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-purple-600" />
                Perguntas sobre o Documento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Conversation History */}
              {conversation.length > 0 && (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {conversation.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg ${
                        msg.role === 'user'
                          ? 'bg-blue-50 ml-8'
                          : 'bg-purple-50 mr-8'
                      }`}
                    >
                      <p className="text-xs font-semibold text-slate-600 mb-1">
                        {msg.role === 'user' ? 'Você' : 'LEXIA'}
                      </p>
                      <div className="text-sm text-slate-700">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Question Input */}
              <div className="flex gap-2">
                <Textarea
                  placeholder="Faça uma pergunta sobre o documento..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAskQuestion();
                    }
                  }}
                  className="flex-1 min-h-[80px]"
                  disabled={isAsking}
                />
                <Button
                  onClick={handleAskQuestion}
                  disabled={!question.trim() || isAsking}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isAsking ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
              
              <p className="text-xs text-slate-500">
                💡 Exemplos: "Quais são as obrigações do contratante?", "Existe algum prazo importante?", "Resuma a cláusula 5"
              </p>
            </CardContent>
          </Card>
        )}

        {/* Welcome State */}
        {!selectedFile && (
          <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Bem-vindo ao LEXIA
              </h3>
              <p className="text-slate-600 max-w-md mx-auto mb-4">
                Faça upload de documentos jurídicos (contratos, petições, sentenças, etc.) para análise inteligente com IA.
              </p>
              <div className="flex flex-wrap gap-2 justify-center text-sm">
                <Badge variant="secondary">📄 Extração de Informações</Badge>
                <Badge variant="secondary">📊 Resumo Executivo</Badge>
                <Badge variant="secondary">💬 Perguntas e Respostas</Badge>
                <Badge variant="secondary">⚖️ Análise Jurídica</Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}