import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles, MessageSquare, Scale, FileText, Search, Zap, Send } from "lucide-react";

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

export default function WelcomeScreen({ onSendMessage, userName }) {
  const [input, setInput] = useState("");
  const textareaRef = useRef(null);
  const greeting = userName ? `Olá, ${userName.split(' ')[0]}!` : 'Olá!';
  const currentHour = new Date().getHours();
  const timeGreeting = currentHour < 12 ? 'Bom dia' : currentHour < 18 ? 'Boa tarde' : 'Boa noite';

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [input]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input);
    setInput("");
  };

  const handlePromptClick = (prompt) => {
    onSendMessage(prompt);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="min-h-full flex items-center justify-center p-4 md:p-8">
        <div className="max-w-4xl w-full py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
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
              className="inline-block mb-6"
            >
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center shadow-2xl">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -inset-2 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-3xl blur-2xl opacity-30 animate-pulse" />
              </div>
            </motion.div>

            {/* Welcome Message */}
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                {timeGreeting}, {userName ? userName.split(' ')[0] : 'Advogado'}! 👋
              </span>
            </h1>
            <p className="text-xl text-slate-600 mb-8">
              Seu assistente jurídico com inteligência artificial está pronto para ajudar
            </p>
          </motion.div>

          {/* Chat Input */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <form onSubmit={handleSubmit} className="relative max-w-3xl mx-auto">
              <div className="flex items-end gap-2 bg-white rounded-2xl p-3 border-2 border-slate-200 focus-within:border-blue-500 shadow-lg transition-all">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Envie uma mensagem..."
                  className="flex-1 bg-transparent border-none outline-none resize-none px-2 py-2 max-h-48 text-slate-900 placeholder:text-slate-400"
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
                  disabled={!input.trim()}
                  size="icon"
                  className="shrink-0 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 rounded-xl h-10 w-10"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>

              <p className="text-xs text-slate-500 text-center mt-3">
                Pressione Enter para enviar • Shift+Enter para nova linha
              </p>
            </form>
          </motion.div>

          {/* Suggested Prompts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-6"
          >
            <p className="text-sm text-slate-500 text-center mb-4">
              Ou experimente uma dessas sugestões:
            </p>
            <div className="grid md:grid-cols-2 gap-3">
              {suggestedPrompts.map((suggestion, index) => {
                const Icon = suggestion.icon;
                return (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handlePromptClick(suggestion.prompt)}
                    className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-4 text-left hover:border-blue-300 hover:shadow-md transition-all duration-200"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-slate-700">{suggestion.text}</span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-12 grid md:grid-cols-3 gap-4"
          >
            {[
              { icon: Zap, title: "Respostas Rápidas", desc: "IA treinada em direito brasileiro" },
              { icon: Scale, title: "Análise Jurídica", desc: "Interpretação de leis e casos" },
              { icon: FileText, title: "Redação Legal", desc: "Auxílio em documentos jurídicos" }
            ].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="text-center p-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900 text-sm mb-1">{feature.title}</h3>
                  <p className="text-xs text-slate-600">{feature.desc}</p>
                </div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </div>
  );
}