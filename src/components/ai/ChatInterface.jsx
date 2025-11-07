import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, Paperclip, X, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import MessageBubble from "./MessageBubble";

export default function ChatInterface({ conversation, onUpdate }) {
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() && !uploadedFile) return;

    const userMessage = {
      role: "user",
      content: input,
      timestamp: new Date().toISOString()
    };

    const updatedMessages = [...conversation.messages, userMessage];
    
    // Update conversation with user message
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
        // Generate image
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
        // Analyze document
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
        // General assistant
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

      // Update conversation with AI response
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

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-transparent to-white/30">
      {/* Messages Container */}
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
                <span className="text-sm text-slate-600">Gerando resposta...</span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-200/50 bg-white/80 backdrop-blur-xl p-4">
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
    </div>
  );
}