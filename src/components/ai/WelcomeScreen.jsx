import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles, MessageSquare, Scale, FileText, Search, Zap, Send, Loader2 } from "lucide-react";
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

export default function WelcomeScreen({ onSendMessage, userName, messages = [], isProcessing = false, onOpenHistory }) {
  const [input, setInput] = useState("");
  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input);
    setInput("");
  };

  const handlePromptClick = (prompt) => {
    onSendMessage(prompt);
  };

  const showWelcome = messages.length === 0;

  return (
    <div className="h-full flex flex-col bg-white">
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
                  {timeGreeting}, {userName ? userName.split(' ')[0] : 'Advogado'}! 👋
                </span>
              </h1>
              <p className="text-base sm:text-xl text-slate-600 mb-6 sm:mb-8">
                Seu assistente jurídico com inteligência artificial está pronto para ajudar
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
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="max-w-3xl mx-auto px-4 py-4">
        {showWelcome && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-4 sm:mb-6"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              {suggestedPrompts.map((suggestion, index) => {
                const Icon = suggestion.icon;
                return (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handlePromptClick(suggestion.prompt)}
                    className="flex items-center gap-2 sm:gap-3 bg-white border border-slate-200 rounded-lg sm:rounded-xl p-3 sm:p-4 text-left hover:border-blue-300 hover:shadow-md transition-all duration-200 active:scale-95"
                  >
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-slate-700">{suggestion.text}</span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="relative">
          <div className="flex items-end gap-1.5 sm:gap-2 bg-slate-100 rounded-xl sm:rounded-2xl p-1.5 sm:p-2 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Envie uma mensagem..."
              className="flex-1 bg-transparent border-none outline-none resize-none px-2 py-2 sm:py-3 max-h-32 sm:max-h-48 text-sm sm:text-base text-slate-900 placeholder:text-slate-500"
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
              disabled={!input.trim() || isProcessing}
              size="icon"
              className="shrink-0 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 rounded-lg sm:rounded-xl h-9 w-9 sm:h-10 sm:w-10"
            >
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>

          <p className="text-xs text-slate-500 text-center mt-2 hidden sm:block">
            Pressione Enter para enviar • Shift+Enter para nova linha
          </p>
        </form>

        {onOpenHistory && (
          <div className="mt-3 flex justify-center">
            <Button
              onClick={onOpenHistory}
              variant="ghost"
              size="sm"
              className="text-slate-600 hover:text-slate-900"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Ver Histórico Completo
            </Button>
          </div>
        )}
      </div>

    </div>
  );
}