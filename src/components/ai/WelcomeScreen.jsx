import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles, MessageSquare, Scale, FileText, Search, Send, Loader2, Paperclip, X, Upload } from "lucide-react";
import MessageBubble from "./MessageBubble";

const suggestedPrompts = [
  {
    icon: Scale,
    text: "Explicar um conceito jurídico",
    prompt: "Me explique o conceito de prescrição no direito civil brasileiro"
  },
  {
    icon: FileText,
    text: "Redigir uma petição",
    prompt: "Como elaborar uma petição inicial de ação de cobrança?"
  },
  {
    icon: Search,
    text: "Pesquisar jurisprudência",
    prompt: "Busque jurisprudências recentes sobre danos morais no STJ"
  },
  {
    icon: MessageSquare,
    text: "Consulta jurídica geral",
    prompt: "Quais os prazos recursais no processo civil?"
  }
];

export default function WelcomeScreen({ onSendMessage, userName, messages = [], isProcessing = false, onOpenHistory, uploadedFile, onFileUpload }) {
  const [input, setInput] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const greeting = userName ? `Olá, ${userName.split(' ')[0]}!` : 'Olá!';
  const currentHour = new Date().getHours();
  const timeGreeting = currentHour < 12 ? 'Bom dia' : currentHour < 18 ? 'Boa tarde' : 'Boa noite';

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [input]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onFileUpload({ url: file_url, name: file.name, type: file.type });
    } catch (error) {
      alert("Erro ao fazer upload do arquivo.");
    }
    setUploadingFile(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() && !uploadedFile) return;
    
    let messageContent = input;
    if (uploadedFile) {
      messageContent = `[DOCUMENTO ANEXADO: ${uploadedFile.name}]\n\nURL do arquivo: ${uploadedFile.url}\n\n${input || "Por favor, analise este documento jurídico e forneça um resumo detalhado, identificando pontos importantes, riscos e sugestões."}`;
      onFileUpload(null);
    }
    
    onSendMessage(messageContent);
    setInput("");
  };

  const handlePromptClick = (prompt) => {
    onSendMessage(prompt);
  };

  const showWelcome = messages.length === 0;

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6">
          {showWelcome ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center py-6 sm:py-12 px-4"
            >
            {/* Animated Icon */}
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="inline-block mb-4 sm:mb-6"
            >
              <div className="relative">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-2xl">
                  <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </div>
                <div className="absolute -inset-2 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl sm:rounded-3xl blur-2xl opacity-30 animate-pulse" />
              </div>
            </motion.div>

            {/* Welcome Message */}
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  A nova era da advocacia chegou!
                </span>
              </h1>
            </motion.div>
          ) : (
            <div className="space-y-6">
              <AnimatePresence mode="popLayout">
                {messages.map((message, index) => (
                  <MessageBubble key={index} message={message} />
                ))}
              </AnimatePresence>

              {isProcessing && (
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
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        {uploadedFile && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3 p-3 bg-purple-50 border border-purple-200 rounded-lg flex items-center gap-3"
          >
            <FileText className="w-5 h-5 text-purple-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-purple-900 truncate">{uploadedFile.name}</p>
              <p className="text-xs text-purple-600">Documento pronto para análise</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onFileUpload(null)}
              className="shrink-0 h-8 w-8 hover:bg-purple-100"
            >
              <X className="w-4 h-4 text-purple-600" />
            </Button>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="relative">
          <div className="flex items-end gap-2 bg-white rounded-2xl p-3 shadow-lg border border-gray-200 focus-within:ring-2 focus-within:ring-gray-300 focus-within:border-gray-300 transition-all">
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
              disabled={uploadingFile || isProcessing}
              className="shrink-0 hover:bg-gray-100 h-10 w-10 rounded-xl"
              title="Anexar documento para análise (LEXIA)"
            >
              {uploadingFile ? (
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              ) : (
                <Paperclip className="w-5 h-5 text-gray-400" />
              )}
            </Button>

            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={uploadedFile ? "Adicione instruções para análise do documento..." : "Como posso ajudar você hoje?"}
              className="flex-1 bg-transparent border-none outline-none resize-none px-2 py-2 max-h-48 text-base text-gray-900 placeholder:text-gray-400"
              rows={1}
              disabled={isProcessing}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />

            <Button
              type="submit"
              disabled={(!input.trim() && !uploadedFile) || isProcessing}
              size="icon"
              className="shrink-0 bg-black hover:bg-gray-800 disabled:bg-gray-200 rounded-xl h-10 w-10"
            >
              <Send className="w-5 h-5" />
            </Button>
            </div>
            </form>
      </div>

    </div>
  );
}