import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Loader2, X, Sparkles, BookOpen, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ReactMarkdown from "react-markdown";
import { Badge } from "@/components/ui/badge";

export default function DocumentSummarizer() {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [summary, setSummary] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setUploadedFile({ url: file_url, name: file.name, type: file.type });
      setSummary(null);
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      alert("Erro ao fazer upload do arquivo. Tente novamente.");
    }
    setIsUploading(false);
  };

  const handleGenerateSummary = async () => {
    if (!uploadedFile) return;

    setIsAnalyzing(true);
    try {
      const prompt = `Você é um assistente jurídico especializado em análise de documentos legais brasileiros.

DOCUMENTO: ${uploadedFile.name}

TAREFA: Faça um RESUMO DETALHADO E COMPLETO deste documento jurídico, incluindo:

**📋 RESUMO EXECUTIVO**
- Tipo de documento (petição, contrato, sentença, recurso, etc.)
- Breve descrição do objeto em 2-3 frases
- Principais conclusões

**👥 PARTES ENVOLVIDAS**
- Autor(es)/Requerente(s)
- Réu(s)/Requerido(s)
- Representantes legais
- Outros interessados

**⚖️ OBJETO E FUNDAMENTOS**
- Principal pedido ou questão jurídica
- Valor da causa (se mencionado)
- Base legal e fundamentos jurídicos citados
- Artigos, leis e normas mencionados

**📌 FATOS RELEVANTES**
- Cronologia dos fatos principais
- Circunstâncias importantes
- Provas e documentos mencionados

**💡 ARGUMENTOS PRINCIPAIS**
- Teses jurídicas apresentadas
- Argumentos de defesa ou ataque
- Jurisprudência citada
- Doutrina mencionada

**📑 PEDIDOS E REQUERIMENTOS**
- Lista completa de todos os pedidos
- Pedidos principais e subsidiários
- Tutelas de urgência solicitadas

**⚡ PONTOS DE DESTAQUE**
- Aspectos mais importantes do documento
- Questões críticas ou urgentes
- Prazos mencionados
- Valores envolvidos

**🎯 ANÁLISE JURÍDICA**
- Força dos argumentos apresentados
- Possíveis fragilidades
- Precedentes relevantes
- Probabilidade de êxito (se aplicável)

**📅 PRÓXIMOS PASSOS SUGERIDOS**
- Ações recomendadas
- Prazos a observar
- Diligências necessárias

Use linguagem técnica jurídica apropriada, mas mantenha clareza e objetividade. Seja DETALHADO e COMPLETO na análise.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        file_urls: [uploadedFile.url]
      });

      setSummary(response);
    } catch (error) {
      console.error("Erro ao gerar resumo:", error);
      alert("Erro ao gerar resumo. Tente novamente.");
    }
    setIsAnalyzing(false);
  };

  const handleReset = () => {
    setUploadedFile(null);
    setSummary(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-2xl">
              <BookOpen className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Resumo de Documentos Jurídicos
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-lg">
              Faça upload de uma peça jurídica e receba um resumo detalhado com análise completa
            </p>
          </motion.div>

          {/* Upload Area */}
          {!uploadedFile && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-8"
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full border-4 border-dashed border-blue-300 dark:border-blue-700 rounded-3xl p-16 hover:border-blue-500 transition-all duration-300 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 group"
              >
                <div className="text-center">
                  {isUploading ? (
                    <>
                      <Loader2 className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-spin" />
                      <p className="text-xl font-semibold text-slate-700 dark:text-slate-300">Fazendo upload...</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-16 h-16 text-blue-600 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                      <p className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Clique para fazer upload
                      </p>
                      <p className="text-slate-500 dark:text-slate-400">
                        PDF, DOCX ou TXT (máx. 10MB)
                      </p>
                    </>
                  )}
                </div>
              </button>
            </motion.div>
          )}

          {/* Uploaded File Display */}
          {uploadedFile && !summary && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-8 mb-8 border-2 border-green-200 dark:border-green-800 shadow-xl"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center shrink-0">
                    <FileText className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-slate-900 dark:text-slate-100 mb-2">
                      {uploadedFile.name}
                    </h3>
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                      Documento carregado
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleReset}
                  className="hover:bg-red-100 dark:hover:bg-red-900"
                >
                  <X className="w-5 h-5 text-red-600" />
                </Button>
              </div>

              <Button
                onClick={handleGenerateSummary}
                disabled={isAnalyzing}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-6 text-lg font-semibold rounded-xl"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Analisando documento...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Gerar Resumo Detalhado
                  </>
                )}
              </Button>
            </motion.div>
          )}

          {/* Summary Display */}
          {summary && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      Resumo do Documento
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{uploadedFile.name}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="border-blue-300 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Novo Documento
                </Button>
              </div>

              <div className="prose prose-slate dark:prose-invert max-w-none">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => <h1 className="text-3xl font-bold mt-8 mb-4 text-slate-900 dark:text-slate-100">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-2xl font-bold mt-6 mb-3 text-slate-800 dark:text-slate-200">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-xl font-semibold mt-4 mb-2 text-slate-700 dark:text-slate-300">{children}</h3>,
                    p: ({ children }) => <p className="mb-4 leading-relaxed text-slate-700 dark:text-slate-300">{children}</p>,
                    ul: ({ children }) => <ul className="mb-4 ml-6 list-disc text-slate-700 dark:text-slate-300">{children}</ul>,
                    ol: ({ children }) => <ol className="mb-4 ml-6 list-decimal text-slate-700 dark:text-slate-300">{children}</ol>,
                    li: ({ children }) => <li className="mb-2">{children}</li>,
                    strong: ({ children }) => <strong className="font-bold text-slate-900 dark:text-slate-100">{children}</strong>,
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-blue-500 pl-4 my-4 italic text-slate-600 dark:text-slate-400">
                        {children}
                      </blockquote>
                    ),
                  }}
                >
                  {summary}
                </ReactMarkdown>
              </div>
            </motion.div>
          )}

          {/* Info Cards */}
          {!uploadedFile && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid md:grid-cols-3 gap-6"
            >
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-2">Análise Completa</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Resumo detalhado com partes, fundamentos, pedidos e análise jurídica
                </p>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-purple-200 dark:border-purple-800">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-2">IA Especializada</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Inteligência artificial treinada em direito brasileiro
                </p>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-green-200 dark:border-green-800">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center mb-4">
                  <BookOpen className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-2">Base Jurídica</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Identificação de leis, artigos e jurisprudência mencionados
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}