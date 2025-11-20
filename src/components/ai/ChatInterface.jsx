import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, Paperclip, X, FileText, StopCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import MessageBubble from "./MessageBubble";
import LegalDocumentGeneratorInterface from "./LegalDocumentGeneratorInterface";
import CaseSummarizerDialog from "./CaseSummarizerDialog";
import AdvancedDocumentAnalyzer from "./AdvancedDocumentAnalyzer";
import { usePlanAccess } from "../common/PlanGuard";

export default function ChatInterface({ conversation, onUpdate, subscription, userName }) {
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showCaseSummarizer, setShowCaseSummarizer] = useState(false);
  const [showAdvancedAnalyzer, setShowAdvancedAnalyzer] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const queryClient = useQueryClient();

  const { canUseAI } = usePlanAccess();

  const { data: cases = [] } = useQuery({
    queryKey: ['cases'],
    queryFn: () => base44.entities.Case.list('-created_date'),
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages]);

  // Auto-processar se há apenas 1 mensagem do usuário sem resposta
  useEffect(() => {
    if (!conversation || isGenerating) return;
    
    const messages = conversation.messages || [];
    if (messages.length === 1 && messages[0].role === 'user') {
      // Processar primeira mensagem automaticamente
      const processFirstMessage = async () => {
        setIsGenerating(true);
        
        try {
          const systemInstructions = `Você é um assistente jurídico especializado em direito brasileiro.

          REGRAS DE COMPORTAMENTO:
          - Considere todo o histórico de mensagens como parte da mesma conversa contínua
          - Nunca peça para mudar de aba, página, link ou interface
          - Dê respostas que façam sentido com base nas mensagens anteriores, mantendo contexto e coerência
          - A conversa pode seguir indefinidamente, mensagem após mensagem
          - Se precisar retomar algo já falado, faça um resumo breve

          FORMATO DAS RESPOSTAS:
          - Responda em texto simples usando Markdown (títulos, listas, blocos de código)
          - Use parágrafos curtos e listas quando útil
          - Não sugira criar novas janelas, abas, telas ou sessões
          - Tom natural, claro e objetivo em português do Brasil
          - A resposta será exibida diretamente na mesma tela de conversa`;

          const response = await base44.integrations.Core.InvokeLLM({
            prompt: `${systemInstructions}\n\nUsuário: ${messages[0].content}\n\nResponda à mensagem do usuário de forma profissional e precisa.`,
            add_context_from_internet: false
          });
          
          const assistantResponse = {
            role: "assistant",
            content: response,
            timestamp: new Date().toISOString()
          };

          await updateConversationMutation.mutateAsync({
            id: conversation.id,
            data: {
              messages: [...messages, assistantResponse],
              last_message_at: new Date().toISOString()
            }
          });

          if (subscription && subscription.plan === 'free') {
            await base44.entities.Subscription.update(subscription.id, {
              daily_actions_used: (subscription.daily_actions_used || 0) + 1
            });
            queryClient.invalidateQueries({ queryKey: ['subscription'] });
          }
        } catch (error) {
          console.error("Erro:", error);
        }
        
        setIsGenerating(false);
      };
      
      processFirstMessage();
    }
  }, [conversation?.id]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [input]);

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
      
      if (conversation.mode === "document_analyzer") {
        setShowAdvancedAnalyzer(true);
      }
    } catch (error) {
      alert("Erro ao fazer upload do arquivo.");
    }
    setUploadingFile(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || !conversation) return;

    const aiAccess = canUseAI();
    if (!aiAccess.allowed) {
      alert(`Limite de ${aiAccess.limit} requisições atingido. Faça upgrade!`);
      return;
    }

    const userMessage = {
      role: "user",
      content: input,
      timestamp: new Date().toISOString()
    };

    const updatedMessages = [...(conversation.messages || []), userMessage];
    const currentInput = input;
    
    // Limpar input e atualizar UI imediatamente
    setInput("");
    setIsGenerating(true);
    
    await updateConversationMutation.mutateAsync({
      id: conversation.id,
      data: {
        messages: updatedMessages,
        last_message_at: new Date().toISOString(),
        title: (conversation.messages?.length || 0) === 0 ? currentInput.slice(0, 50) : conversation.title
      }
    });

    try {
      // Construir contexto da conversa para a IA
      const conversationContext = updatedMessages
        .slice(-10) // Últimas 10 mensagens para evitar timeout
        .map(m => `${m.role === 'user' ? 'Usuário' : 'Assistente'}: ${m.content}`)
        .join('\n\n');

      const systemInstructions = `Você é um assistente jurídico especializado em direito brasileiro.

      REGRAS DE COMPORTAMENTO:
      - Considere todo o histórico de mensagens como parte da mesma conversa contínua
      - Nunca peça para mudar de aba, página, link ou interface
      - Dê respostas que façam sentido com base nas mensagens anteriores, mantendo contexto e coerência
      - A conversa pode seguir indefinidamente, mensagem após mensagem
      - Se precisar retomar algo já falado, faça um resumo breve

      FORMATO DAS RESPOSTAS:
      - Responda em texto simples usando Markdown (títulos, listas, blocos de código)
      - Use parágrafos curtos e listas quando útil
      - Não sugira criar novas janelas, abas, telas ou sessões
      - Tom natural, claro e objetivo em português do Brasil
      - A resposta será exibida diretamente na mesma tela de conversa`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `${systemInstructions}\n\nHistórico da conversa:\n${conversationContext}\n\nResponda à última mensagem do usuário de forma profissional e precisa.`,
        add_context_from_internet: false
      });
      
      const assistantResponse = {
        role: "assistant",
        content: response,
        timestamp: new Date().toISOString()
      };

      const finalMessages = [...updatedMessages, assistantResponse];
      
      await updateConversationMutation.mutateAsync({
        id: conversation.id,
        data: {
          messages: finalMessages,
          last_message_at: new Date().toISOString()
        }
      });

      // Decrementar contador de ações (apenas para plano free)
      if (subscription && subscription.plan === 'free') {
        await base44.entities.Subscription.update(subscription.id, {
          daily_actions_used: (subscription.daily_actions_used || 0) + 1
        });
        queryClient.invalidateQueries({ queryKey: ['subscription'] });
      }
      
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao gerar resposta. Tente novamente.");
      
      // Remover mensagem do usuário se falhou
      await updateConversationMutation.mutateAsync({
        id: conversation.id,
        data: {
          messages: conversation.messages,
          last_message_at: new Date().toISOString()
        }
      });
    }

    setIsGenerating(false);
  };

  if (conversation?.mode === "legal_document_generator") {
    return <LegalDocumentGeneratorInterface conversation={conversation} onUpdate={onUpdate} />;
  }

  const messages = conversation?.messages || [];

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Messages Area - ChatGPT Style */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="space-y-6">
            {/* Welcome Header - sempre visível quando não há mensagens */}
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
                  <span className="text-3xl">💬</span>
                </div>
                <h1 className="text-4xl font-bold mb-4">
                  <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Olá{userName ? `, ${userName.split(' ')[0]}` : ''}! 👋
                  </span>
                </h1>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  Como posso ajudar hoje?
                </h3>
                <p className="text-slate-600">
                  Seu assistente jurídico com IA está pronto para ajudar
                </p>
              </motion.div>
            )}

            {/* Messages */}
            <AnimatePresence mode="popLayout">
              {messages.map((message, index) => (
                <MessageBubble key={index} message={message} />
              ))}
            </AnimatePresence>

            {/* Loading indicator */}
            {isGenerating && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-4"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center shrink-0">
                  <span className="text-sm">🤖</span>
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
                    <span className="text-sm text-slate-600">Pensando...</span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area - ChatGPT Style */}
      <div className="border-t border-slate-200 bg-white">
        <div className="max-w-3xl mx-auto px-4 py-4">
          {uploadedFile && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3"
            >
              <FileText className="w-5 h-5 text-blue-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-blue-900 truncate">{uploadedFile.name}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setUploadedFile(null)}
                className="shrink-0 h-8 w-8 hover:bg-blue-100"
              >
                <X className="w-4 h-4 text-blue-600" />
              </Button>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="relative">
            <div className="flex items-end gap-2 bg-slate-100 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
              {conversation?.mode === "document_analyzer" && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg,.txt,.doc,.docx"
                    onChange={handleFileUpload}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingFile}
                    className="shrink-0 hover:bg-slate-200"
                  >
                    {uploadingFile ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Paperclip className="w-5 h-5" />
                    )}
                  </Button>
                </>
              )}

              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Envie uma mensagem..."
                className="flex-1 bg-transparent border-none outline-none resize-none px-2 py-3 max-h-48 text-slate-900 placeholder:text-slate-500"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />

              <Button
                type="submit"
                disabled={!input.trim() || isGenerating}
                size="icon"
                className="shrink-0 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 rounded-xl"
              >
                {isGenerating ? (
                  <StopCircle className="w-5 h-5" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>

            <p className="text-xs text-slate-500 text-center mt-2">
              Pressione Enter para enviar • Shift+Enter para nova linha
            </p>
          </form>
        </div>
      </div>

      {showAdvancedAnalyzer && uploadedFile && (
        <AdvancedDocumentAnalyzer
          primaryFile={uploadedFile}
          onAnalyze={async () => {}}
          onClose={() => {
            setUploadedFile(null);
            setShowAdvancedAnalyzer(false);
          }}
          isAnalyzing={isGenerating}
        />
      )}

      <CaseSummarizerDialog
        open={showCaseSummarizer}
        onClose={() => setShowCaseSummarizer(false)}
        cases={cases}
        onSummarize={async () => {}}
      />
    </div>
  );
}