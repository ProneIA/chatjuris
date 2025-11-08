import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, Paperclip, X, Sparkles, Scale } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import MessageBubble from "./MessageBubble";
import LegalDocumentGeneratorInterface from "./LegalDocumentGeneratorInterface";
import CaseSummarizerDialog from "./CaseSummarizerDialog";

export default function ChatInterface({ conversation, onUpdate }) {
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showCaseSummarizer, setShowCaseSummarizer] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: cases = [] } = useQuery({
    queryKey: ['cases'],
    queryFn: () => base44.entities.Case.list('-created_date'),
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation.messages]);

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
      setUploadedFile({ url: file_url, name: file.name });
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
    }
    setUploadingFile(false);
  };

  const handleSummarizeCase = async (caseData) => {
    setShowCaseSummarizer(false);
    setIsGenerating(true);

    try {
      const userMessage = {
        role: "user",
        content: `Analisar e resumir processo: ${caseData.title || caseData.case_number || 'Processo'}`,
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

      const prompt = `Você é um assistente jurídico especializado em análise de processos judiciais brasileiros.

INFORMAÇÕES DO PROCESSO:
${caseData.case_number ? `Número do Processo: ${caseData.case_number}` : ''}
${caseData.title ? `Título: ${caseData.title}` : ''}
${caseData.area ? `Área do Direito: ${caseData.area}` : ''}
${caseData.court ? `Vara/Tribunal: ${caseData.court}` : ''}
${caseData.client_name ? `Cliente: ${caseData.client_name}` : ''}
${caseData.opposing_party ? `Parte Contrária: ${caseData.opposing_party}` : ''}
${caseData.description ? `Descrição:\n${caseData.description}` : ''}
${caseData.value ? `Valor da Causa: R$ ${caseData.value}` : ''}
${caseData.status ? `Status: ${caseData.status}` : ''}
${caseData.priority ? `Prioridade: ${caseData.priority}` : ''}
${caseData.start_date ? `Data de Início: ${caseData.start_date}` : ''}
${caseData.deadline ? `Prazo: ${caseData.deadline}` : ''}

TAREFA:
Analise este processo judicial e forneça um resumo estruturado e profissional contendo:

**📋 RESUMO EXECUTIVO**
- Breve descrição do caso em 2-3 frases

**⚖️ PARTES ENVOLVIDAS**
- Autor/Cliente
- Réu/Parte Contrária
- Representações legais (se mencionado)

**🎯 OBJETO DA AÇÃO**
- Principal pedido ou questão jurídica
- Valor da causa (se aplicável)

**📌 PONTOS-CHAVE**
- Principais argumentos e fundamentos
- Teses jurídicas relevantes
- Questões fáticas importantes

**⚡ ANÁLISE ESTRATÉGICA**
- Pontos fortes do caso
- Pontos de atenção ou riscos
- Recomendações de estratégia processual

**📅 CRONOLOGIA & PRÓXIMOS PASSOS**
- Principais marcos processuais
- Prazos importantes
- Ações recomendadas

**💡 OBSERVAÇÕES FINAIS**
- Outras considerações relevantes
- Sugestões para fortalecimento do caso

Use linguagem técnica jurídica apropriada, mas mantenha clareza e objetividade.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
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
          messages: [...updatedMessages, assistantResponse],
          last_message_at: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error("Erro ao resumir caso:", error);
    }

    setIsGenerating(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() && !uploadedFile) return;

    const userMessage = {
      role: "user",
      content: input,
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

    setInput("");
    setIsGenerating(true);

    try {
      let assistantResponse;

      if (conversation.mode === "image_generator") {
        const { url } = await base44.integrations.Core.GenerateImage({
          prompt: input
        });
        
        assistantResponse = {
          role: "assistant",
          content: "Aqui está a imagem que você pediu:",
          image_url: url,
          timestamp: new Date().toISOString()
        };
      } else if (conversation.mode === "document_analyzer" && uploadedFile) {
        const response = await base44.integrations.Core.InvokeLLM({
          prompt: `Analise este documento e responda: ${input}`,
          file_urls: [uploadedFile.url]
        });
        
        assistantResponse = {
          role: "assistant",
          content: response,
          timestamp: new Date().toISOString()
        };
        setUploadedFile(null);
      } else {
        const response = await base44.integrations.Core.InvokeLLM({
          prompt: input,
          add_context_from_internet: false
        });
        
        assistantResponse = {
          role: "assistant",
          content: response,
          timestamp: new Date().toISOString()
        };
      }

      await updateConversationMutation.mutateAsync({
        id: conversation.id,
        data: {
          messages: [...updatedMessages, assistantResponse],
          last_message_at: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error("Erro ao gerar resposta:", error);
    }

    setIsGenerating(false);
  };

  // Show legal document generator interface for that mode
  if (conversation.mode === "legal_document_generator") {
    return <LegalDocumentGeneratorInterface conversation={conversation} onUpdate={onUpdate} />;
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-transparent to-white/30">
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        <AnimatePresence mode="popLayout">
          {conversation.messages.map((message, index) => (
            <MessageBubble key={index} message={message} />
          ))}
        </AnimatePresence>

        {isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3"
          >
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-slate-200">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span className="text-sm text-slate-600">
                  {conversation.mode === 'assistant' ? 'Analisando e gerando resumo...' : 'Gerando resposta...'}
                </span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-slate-200/50 bg-white/80 backdrop-blur-xl p-4">
        {conversation.mode === 'assistant' && (
          <Button
            onClick={() => setShowCaseSummarizer(true)}
            variant="outline"
            className="w-full mb-3 border-purple-200 hover:bg-purple-50 text-purple-700"
          >
            <Scale className="w-4 h-4 mr-2" />
            Resumir Processo Judicial
          </Button>
        )}

        {uploadedFile && (
          <div className="mb-3 flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
            <Paperclip className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-blue-900 flex-1 truncate">{uploadedFile.name}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setUploadedFile(null)}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.png,.jpg,.jpeg,.txt,.doc,.docx"
            onChange={handleFileUpload}
          />
          
          {conversation.mode === "document_analyzer" && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingFile}
              className="shrink-0"
            >
              {uploadingFile ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Paperclip className="w-4 h-4" />
              )}
            </Button>
          )}

          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              conversation.mode === "image_generator"
                ? "Descreva a imagem que deseja gerar..."
                : conversation.mode === "document_analyzer"
                ? "Faça uma pergunta sobre o documento..."
                : "Digite sua mensagem..."
            }
            className="flex-1 min-h-[60px] max-h-[200px] resize-none rounded-2xl border-slate-200 focus:border-blue-400 focus:ring-blue-400"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />

          <Button
            type="submit"
            disabled={(!input.trim() && !uploadedFile) || isGenerating}
            className="shrink-0 h-[60px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-2xl"
          >
            {isGenerating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </form>

        <p className="text-xs text-slate-400 text-center mt-2">
          Pressione Enter para enviar, Shift+Enter para nova linha
        </p>
      </div>

      <CaseSummarizerDialog
        open={showCaseSummarizer}
        onClose={() => setShowCaseSummarizer(false)}
        cases={cases}
        onSummarize={handleSummarizeCase}
      />
    </div>
  );
}