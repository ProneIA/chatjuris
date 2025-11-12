import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles, MessageSquare, Image, FileText, Scale, Search, Brain, Lightbulb, Zap } from "lucide-react";

const features = [
  {
    icon: MessageSquare,
    title: "Conversas Inteligentes",
    description: "Tire dúvidas e obtenha análises jurídicas detalhadas",
    gradient: "from-blue-500 to-cyan-500",
    emoji: "💬"
  },
  {
    icon: Search,
    title: "Pesquisa de Jurisprudência",
    description: "Busque decisões do STF, STJ e outros tribunais",
    gradient: "from-emerald-500 to-teal-500",
    emoji: "⚖️"
  },
  {
    icon: Scale,
    title: "Documentos Jurídicos",
    description: "Gere petições, contratos e peças processuais",
    gradient: "from-purple-500 to-pink-500",
    emoji: "📋"
  },
  {
    icon: FileText,
    title: "Análise de Documentos",
    description: "Upload de PDFs com análise jurídica completa",
    gradient: "from-green-500 to-emerald-500",
    emoji: "📄"
  },
  {
    icon: Image,
    title: "Geração de Imagens",
    description: "Crie ilustrações e imagens para seus casos",
    gradient: "from-pink-500 to-rose-500",
    emoji: "🎨"
  }
];

const examples = [
  { 
    icon: Brain, 
    text: "Explicar prescrição tributária",
    gradient: "from-blue-500 to-purple-500"
  },
  { 
    icon: Scale, 
    text: "Gerar petição inicial",
    gradient: "from-purple-500 to-pink-500"
  },
  { 
    icon: Search, 
    text: "Buscar jurisprudência sobre dano moral",
    gradient: "from-emerald-500 to-teal-500"
  }
];

export default function WelcomeScreen({ onNewConversation, selectedMode }) {
  return (
    <div className="h-full flex items-center justify-center p-8 overflow-y-auto">
      <div className="max-w-4xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          {/* Animated Icon */}
          <div className="relative inline-block mb-8">
            <motion.div
              animate={{ 
                rotate: [0, 5, -5, 0],
                scale: [1, 1.05, 1]
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-24 h-24 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center shadow-2xl"
            >
              <Sparkles className="w-12 h-12 text-white" />
            </motion.div>
            
            {/* Floating particles */}
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute -inset-4 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-3xl blur-2xl"
            />
            
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-6 opacity-20"
            >
              <Zap className="absolute top-0 left-0 w-4 h-4 text-yellow-500" />
              <Sparkles className="absolute top-0 right-0 w-4 h-4 text-blue-500" />
              <Sparkles className="absolute bottom-0 left-0 w-4 h-4 text-purple-500" />
              <Zap className="absolute bottom-0 right-0 w-4 h-4 text-pink-500" />
            </motion.div>
          </div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl md:text-6xl font-black mb-4"
          >
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Assistente Jurídico IA
            </span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto"
          >
            Potencialize sua advocacia com inteligência artificial avançada
          </motion.p>

          {/* CTA Button */}
          {selectedMode !== 'jurisprudence' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Button
                onClick={onNewConversation}
                size="lg"
                className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 text-lg px-10 py-7 rounded-2xl group"
              >
                <Sparkles className="w-6 h-6 mr-2 group-hover:rotate-12 transition-transform" />
                Começar Nova Conversa
                <motion.div
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="ml-2"
                >
                  →
                </motion.div>
              </Button>
            </motion.div>
          )}
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="bg-white rounded-2xl p-5 border-2 border-slate-200 shadow-lg hover:shadow-2xl transition-all duration-300 group cursor-pointer"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-12 h-12 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-2xl group-hover:scale-125 transition-transform duration-300">
                    {feature.emoji}
                  </div>
                </div>
                <h3 className="font-bold text-slate-900 mb-2 text-base">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Quick Examples */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center"
        >
          <p className="text-sm font-medium text-slate-600 mb-4">
            ✨ Experimente agora:
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            {examples.map((example, index) => {
              const Icon = example.icon;
              return (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.9 + index * 0.1 }}
                  whileHover={{ scale: 1.08, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => selectedMode !== 'jurisprudence' && onNewConversation()}
                  className={`group flex items-center gap-2 bg-gradient-to-r ${example.gradient} text-white rounded-full px-5 py-3 text-sm font-medium shadow-lg hover:shadow-xl transition-all duration-300`}
                >
                  <Icon className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                  {example.text}
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="mt-12 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 border-2 border-blue-200 rounded-2xl p-6"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shrink-0">
              <Lightbulb className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 mb-2">
                Dica Profissional
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed">
                Use o modo <span className="font-semibold text-purple-600">Jurisprudência</span> para 
                pesquisar decisões do STF e STJ, ou o modo <span className="font-semibold text-blue-600">Assistente</span> para 
                tirar dúvidas jurídicas. A IA se adapta automaticamente ao contexto!
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}