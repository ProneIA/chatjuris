import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Scale, FileText, Send, Loader2, Paperclip, X, Search, MessageSquare } from "lucide-react";
import MessageBubble from "./MessageBubble";
import SuggestedQuestions from "./SuggestedQuestions";
import DocumentAnalyzer from "./DocumentAnalyzer";

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
    <div className="h-full flex flex-col bg-stone-50">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-8">
          {showWelcome ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center py-16 sm:py-24 px-4"
            >
              {/* Classic Icon */}
              <div className="inline-block mb-6">
                <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center">
                  <Scale className="w-8 h-8 text-white" />
                </div>
              </div>

              {/* Welcome Message */}
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-light text-stone-900 mb-3">
                Assistente Jurídico
              </h1>
              <p className="text-stone-500 text-base sm:text-lg max-w-md mx-auto mb-8">
                Tire suas dúvidas, pesquise jurisprudências e obtenha orientações jurídicas precisas.
              </p>


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

              {/* Document Analyzer */}
              {uploadedFile && !isProcessing && (
                <div className="mt-6">
                  <DocumentAnalyzer 
                    uploadedFile={uploadedFile}
                    onAnalysisComplete={(result, type) => {
                      const summary = JSON.stringify(result, null, 2);
                      onSendMessage(`Análise completa (${type}):\n\n${summary.substring(0, 500)}...\n\nBaseado nesta análise, me forneça insights adicionais.`);
                    }}
                  />
                </div>
              )}

              {/* Suggested Questions */}
              {!isProcessing && messages.length > 0 && (
                <div className="mt-6">
                  <SuggestedQuestions 
                    messages={messages}
                    onQuestionClick={(question) => setInput(question)}
                    mode="assistant"
                  />
                </div>
              )}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area - Fixed at bottom, full width */}
      <div className="border-t border-stone-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">

          {uploadedFile && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-3 p-3 bg-stone-100 border border-stone-200 rounded-lg flex items-center gap-3"
            >
              <FileText className="w-5 h-5 text-stone-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-stone-900 truncate">{uploadedFile.name}</p>
                <p className="text-xs text-stone-500">Documento pronto para análise</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onFileUpload(null)}
                className="shrink-0 h-8 w-8 hover:bg-stone-200"
              >
                <X className="w-4 h-4 text-stone-600" />
              </Button>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="relative">
            <div className="flex items-end gap-2 sm:gap-3 bg-stone-100 border border-stone-300 rounded-xl p-2 sm:p-3 focus-within:border-stone-400 focus-within:ring-1 focus-within:ring-stone-400 transition-all">
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
                className="shrink-0 hover:bg-stone-200 h-10 w-10"
                title="Anexar documento"
              >
                {uploadingFile ? (
                  <Loader2 className="w-5 h-5 animate-spin text-stone-500" />
                ) : (
                  <Paperclip className="w-5 h-5 text-stone-500" />
                )}
              </Button>

              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={uploadedFile ? "Adicione instruções para análise..." : "Digite sua pergunta jurídica..."}
                className="flex-1 bg-transparent border-none outline-none resize-none px-2 py-2 max-h-40 text-base text-stone-900 placeholder:text-stone-400"
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
                className="shrink-0 bg-black hover:bg-gray-800 disabled:bg-stone-300 rounded-lg h-10 w-10"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </form>
        </div>
      </div>

    </div>
  );
}