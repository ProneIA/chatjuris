import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, FileText, X, Sparkles, Download, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";
import { usePlanAccess } from "../common/PlanGuard";

export default function DocumentSummaryInterface({ conversation, onUpdate }) {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [summary, setSummary] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();
  const { canUseAI } = usePlanAccess();

  const updateConversationMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Conversation.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      onUpdate();
    },
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setUploadedFile({ url: file_url, name: file.name, type: file.type });
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      alert("Erro ao fazer upload do arquivo. Tente novamente.");
    }
    setUploadingFile(false);
  };

  const generateSummary = async () => {
    if (!uploadedFile) return;

    const aiAccess = canUseAI();
    if (!aiAccess.allowed) {
      alert(`Você atingiu o limite de ${aiAccess.limit} requisições de IA este mês. Faça upgrade para o plano Pro!`);
      return;
    }

    setIsGenerating(true);

    try {
      const userMessage = {
        role: "user",
        content: `📄 Resumo Detalhado: ${uploadedFile.name}`,
        timestamp: new Date().toISOString()
      };

      const updatedMessages = [...conversation.messages, userMessage];
      
      await updateConversationMutation.mutateAsync({
        id: conversation.id,
        data: {
          messages: updatedMessages,
          last_message_at: new Date().toISOString()
        }
      });

      const prompt = `Você é um assistente jurídico especializado em análise de peças processuais brasileiras.

DOCUMENTO: ${uploadedFile.name}

TAREFA: Faça um resumo COMPLETO e DETALHADO desta peça jurídica, seguindo a seguinte estrutura:

**📋 IDENTIFICAÇÃO DO DOCUMENTO**
- Tipo de peça (petição inicial, contestação, recurso, etc.)
- Partes envolvidas (autor/réu)
- Número do processo (se mencionado)
- Vara/Tribunal

**⚖️ SÍNTESE FACTUAL**
- Resumo detalhado dos fatos narrados
- Cronologia dos acontecimentos principais
- Contexto do litígio

**🎯 PEDIDOS**
- Liste todos os pedidos principais
- Pedidos subsidiários (se houver)
- Valor da causa (se aplicável)

**📚 FUNDAMENTAÇÃO JURÍDICA**
- Principais argumentos jurídicos
- Legislação citada (leis, códigos, artigos)
- Jurisprudência mencionada
- Doutrinas citadas
- Princípios constitucionais invocados

**🔍 TESES DEFENSIVAS/ARGUMENTATIVAS**
- Principais teses sustentadas
- Estratégia jurídica adotada
- Pontos fortes da argumentação

**📎 DOCUMENTOS E PROVAS**
- Provas documentais anexadas
- Testemunhas arroladas (se houver)
- Perícias solicitadas (se houver)

**⚠️ PONTOS DE ATENÇÃO**
- Questões processuais relevantes
- Prazos importantes mencionados
- Recursos cabíveis
- Possíveis contra-argumentos

**💡 ANÁLISE CRÍTICA**
- Avaliação da força dos argumentos
- Pontos vulneráveis
- Sugestões de complementação

**📊 CHANCES DE ÊXITO**
- Análise de probabilidade de sucesso
- Riscos processuais
- Recomendações estratégicas

INSTRUÇÕES:
- Seja EXTREMAMENTE DETALHADO
- Use linguagem técnica jurídica
- Cite trechos específicos quando relevante
- Organize com marcadores e listas
- Destaque informações críticas em **negrito**
- Mantenha objetividade e clareza

Forneça o resumo mais completo possível:`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        file_urls: [uploadedFile.url]
      });

      const assistantResponse = {
        role: "assistant",
        content: response,
        timestamp: new Date().toISOString()
      };

      await updateConversationMutation.mutateAsync({
        id: conversation.id,
        data: {
          messages: [...updatedMessages, assistantResponse],
          last_message_at: new Date().toISOString()
        }
      });

      setSummary(response);

      // Update AI usage
      const user = await base44.auth.me();
      await base44.auth.updateMe({
        ai_requests_count: (user.ai_requests_count || 0) + 1
      });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });

    } catch (error) {
      console.error("Erro ao gerar resumo:", error);
      alert("Erro ao gerar resumo. Tente novamente.");
    }

    setIsGenerating(false);
  };

  const handleReset = () => {
    setUploadedFile(null);
    setSummary(null);
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-transparent to-white/30 dark:to-slate-900/30">
      <div className="flex-1 overflow-y-auto p-6">
        {!uploadedFile ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto text-center py-12"
          >
            <div className="relative inline-block mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-3xl flex items-center justify-center shadow-2xl">
                <BookOpen className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -inset-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-3xl blur-2xl opacity-30 animate-pulse" />
            </div>

            <h2 className="text-3xl font-bold mb-4 text-slate-900 dark:text-white">
              Resumo Detalhado de Peças Jurídicas
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
              Faça upload de uma petição, contestação, recurso ou qualquer peça processual e receba um resumo completo com análise jurídica profunda
            </p>

            <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-2 border-dashed border-orange-300 dark:border-orange-700 rounded-2xl p-12 mb-6">
              <Upload className="w-16 h-16 text-orange-500 mx-auto mb-4" />
              <p className="text-slate-700 dark:text-slate-300 font-medium mb-4">
                Arraste e solte ou clique para fazer upload
              </p>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileUpload}
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingFile}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                size="lg"
              >
                {uploadingFile ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 mr-2" />
                    Selecionar Arquivo
                  </>
                )}
              </Button>
            </div>

            <div className="grid md:grid-cols-3 gap-4 text-left">
              {[
                { icon: "📋", title: "Identificação", desc: "Tipo, partes e tribunal" },
                { icon: "⚖️", title: "Fundamentação", desc: "Leis, jurisprudência e teses" },
                { icon: "💡", title: "Análise Crítica", desc: "Chances de êxito e estratégia" }
              ].map((item, idx) => (
                <div key={idx} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                  <div className="text-3xl mb-2">{item.icon}</div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-1">{item.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        ) : !summary ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto"
          >
            <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-2 border-orange-200 dark:border-orange-800 rounded-2xl p-6 mb-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/50 rounded-lg flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold text-orange-900 dark:text-orange-200 text-lg">{uploadedFile.name}</h3>
                    <Badge className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300">Carregado</Badge>
                  </div>
                  <p className="text-sm text-orange-700 dark:text-orange-400 mb-4">
                    Arquivo pronto para análise. Clique no botão abaixo para gerar o resumo completo.
                  </p>
                  <div className="flex gap-3">
                    <Button
                      onClick={generateSummary}
                      disabled={isGenerating}
                      className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Gerando Resumo...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Gerar Resumo Detalhado
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleReset}
                      disabled={isGenerating}
                      className="border-orange-300 dark:border-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg p-8 mb-6">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">Resumo Completo</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{uploadedFile.name}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="border-slate-300 dark:border-slate-600"
                >
                  <X className="w-4 h-4 mr-2" />
                  Novo Resumo
                </Button>
              </div>

              <div className="prose prose-slate dark:prose-invert max-w-none">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 mt-6">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3 mt-5">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 mt-4">{children}</h3>,
                    p: ({ children }) => <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc list-inside mb-4 space-y-1 text-slate-700 dark:text-slate-300">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside mb-4 space-y-1 text-slate-700 dark:text-slate-300">{children}</ol>,
                    strong: ({ children }) => <strong className="font-bold text-slate-900 dark:text-white">{children}</strong>,
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-orange-500 pl-4 my-4 text-slate-700 dark:text-slate-300 italic">
                        {children}
                      </blockquote>
                    ),
                  }}
                >
                  {summary}
                </ReactMarkdown>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}