import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles, MessageSquare, Image, FileText, Scale, Zap, Brain, Lightbulb } from "lucide-react";

const features = [
  {
    icon: MessageSquare,
    title: "Conversas Inteligentes",
    description: "Pergunte qualquer coisa e obtenha respostas detalhadas"
  },
  {
    icon: Scale,
    title: "Documentos Jurídicos",
    description: "Gere petições, contratos e outros documentos legais"
  },
  {
    icon: Image,
    title: "Geração de Imagens",
    description: "Crie imagens incríveis com descrições em texto"
  },
  {
    icon: FileText,
    title: "Análise de Documentos",
    description: "Faça upload e extraia informações de documentos"
  }
];

const examples = [
  { icon: Brain, text: "Me explique física quântica" },
  { icon: Scale, text: "Gere uma petição inicial" },
  { icon: Lightbulb, text: "Dê ideias para um projeto" }
];

export default function WelcomeScreen({ onNewConversation, selectedMode }) {
  return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="max-w-3xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="relative inline-block mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center shadow-2xl">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -inset-2 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-3xl blur-2xl opacity-30 animate-pulse" />
          </div>

          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Assistente Jurídico IA
          </h1>
          <p className="text-xl text-slate-600 mb-8">
            Seu assistente pessoal com inteligência artificial para advocacia
          </p>

          <Button
            onClick={onNewConversation}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 text-lg px-8 py-6 rounded-2xl"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Começar Nova Conversa
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid md:grid-cols-2 gap-6 mb-12"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05, y: -5 }}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-600">{feature.description}</p>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center"
        >
          <p className="text-sm text-slate-500 mb-4">Ou experimente algo como:</p>
          <div className="flex flex-wrap gap-3 justify-center">
            {examples.map((example, index) => {
              const Icon = example.icon;
              return (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onNewConversation()}
                  className="flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 py-2 text-sm text-slate-700 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <Icon className="w-4 h-4" />
                  {example.text}
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}