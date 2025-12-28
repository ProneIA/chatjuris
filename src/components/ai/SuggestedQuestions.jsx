import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Lightbulb, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function SuggestedQuestions({ messages, onQuestionClick, mode = "assistant", isDark = false }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  const defaultSuggestions = {
    assistant: [
      "Como calcular honorários advocatícios?",
      "Explique a diferença entre recurso ordinário e especial",
      "Quais os prazos para contestação no processo civil?",
      "Como funciona a prescrição tributária?"
    ],
    document_analyzer: [
      "Resuma este contrato identificando cláusulas importantes",
      "Há alguma cláusula abusiva neste documento?",
      "Identifique as obrigações das partes",
      "Verifique prazos e condições suspensivas"
    ],
    legal_document_generator: [
      "Gerar petição inicial de ação de cobrança",
      "Criar contrato de prestação de serviços advocatícios",
      "Elaborar recurso de apelação",
      "Redigir contestação trabalhista"
    ]
  };

  useEffect(() => {
    if (messages && messages.length > 0) {
      generateContextualSuggestions();
    } else {
      setSuggestions(defaultSuggestions[mode] || defaultSuggestions.assistant);
    }
  }, [messages, mode]);

  const generateContextualSuggestions = async () => {
    setLoading(true);
    try {
      const lastMessages = messages.slice(-6).map(m => m.content).join("\n");
      
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Com base nesta conversa jurídica, sugira 4 perguntas curtas e relevantes que o usuário pode fazer em seguida. Responda APENAS com as perguntas separadas por quebra de linha, sem numeração ou formatação adicional:\n\n${lastMessages}`,
      });

      const suggestions = response.split("\n").filter(s => s.trim()).slice(0, 4);
      setSuggestions(suggestions.length > 0 ? suggestions : (defaultSuggestions[mode] || defaultSuggestions.assistant));
    } catch (error) {
      console.error("Erro ao gerar sugestões:", error);
      setSuggestions(defaultSuggestions[mode] || defaultSuggestions.assistant);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-4 rounded-lg ${isDark ? "bg-neutral-900" : "bg-blue-50"}`}>
        <Loader2 className={`w-5 h-5 animate-spin ${isDark ? "text-blue-400" : "text-blue-600"}`} />
        <span className={`ml-2 text-sm ${isDark ? "text-neutral-400" : "text-gray-600"}`}>
          Gerando sugestões...
        </span>
      </div>
    );
  }

  if (suggestions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`p-4 rounded-lg border ${isDark ? "bg-neutral-900 border-neutral-800" : "bg-blue-50 border-blue-200"}`}
    >
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className={`w-4 h-4 ${isDark ? "text-blue-400" : "text-blue-600"}`} />
        <span className={`text-sm font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
          Sugestões baseadas no contexto:
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {suggestions.map((question, idx) => (
          <Button
            key={idx}
            onClick={() => onQuestionClick(question)}
            variant="outline"
            className={`text-left text-sm h-auto py-2 px-3 whitespace-normal justify-start ${
              isDark 
                ? "bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border-neutral-700" 
                : "bg-white hover:bg-blue-100 text-gray-700 border-gray-300"
            }`}
          >
            {question}
          </Button>
        ))}
      </div>
    </motion.div>
  );
}