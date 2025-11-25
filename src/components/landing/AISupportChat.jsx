import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { MessageCircle, X, Send, Loader2, Bot, User, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";

const FAQ_RESPONSES = {
  "preço": "Nossos planos: **Gratuito** (5 ações/dia, até 3 clientes) e **Pro** (R$ 49,99/mês, uso ilimitado). O Pro oferece ROI médio de 60x para a maioria dos advogados!",
  "grátis": "Sim! Temos um plano gratuito com 5 ações de IA por dia e até 3 clientes/processos. Perfeito para testar a plataforma!",
  "funciona": "O Juris IA usa inteligência artificial avançada para gerar documentos jurídicos, analisar contratos, pesquisar jurisprudência e muito mais. Você economiza até 80% do tempo em tarefas repetitivas.",
  "documento": "Geramos petições, contratos, pareceres, recursos e mais de 20 tipos de documentos jurídicos. A IA aprende com o contexto e produz textos de alta qualidade.",
  "seguro": "Sim! Seus dados são protegidos com criptografia de ponta e seguimos todas as normas da LGPD. Nunca compartilhamos suas informações.",
  "cancelar": "Você pode cancelar a qualquer momento, sem multa ou burocracia. O acesso continua até o fim do período pago.",
  "suporte": "Oferecemos suporte 24/7 por chat e email. Usuários Pro têm atendimento prioritário.",
  "lexia": "LEXIA é nossa assistente jurídica de IA avançada. Ela analisa documentos, responde perguntas sobre legislação e ajuda na elaboração de peças processuais.",
  "começar": "É simples! Clique em 'Começar Grátis', faça seu cadastro e já pode usar a plataforma. Não precisa de cartão de crédito para o plano gratuito.",
};

export default function AISupportChat({ isOpen, onClose, onOpen }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Olá! 👋 Sou a assistente virtual do Juris IA. Como posso ajudar você hoje?\n\nVocê pode perguntar sobre:\n• Preços e planos\n• Funcionalidades\n• Como começar\n• Segurança dos dados"
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const findBestResponse = (question) => {
    const lowerQuestion = question.toLowerCase();
    
    for (const [keyword, response] of Object.entries(FAQ_RESPONSES)) {
      if (lowerQuestion.includes(keyword)) {
        return response;
      }
    }
    
    return null;
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    // Try FAQ first
    const faqResponse = findBestResponse(userMessage);
    
    if (faqResponse) {
      setTimeout(() => {
        setMessages(prev => [...prev, { role: "assistant", content: faqResponse }]);
        setIsLoading(false);
      }, 500);
      return;
    }

    // Use AI for complex questions
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é a assistente virtual do Juris IA, uma plataforma de inteligência artificial para advogados brasileiros.

SOBRE A PLATAFORMA:
- Juris IA ajuda advogados a gerar documentos, analisar contratos e pesquisar jurisprudência
- Plano Gratuito: 5 ações de IA por dia, até 3 clientes/processos
- Plano Pro: R$ 49,99/mês, uso ilimitado de todos os recursos
- LEXIA é a assistente de análise de documentos
- Dados protegidos com criptografia e LGPD

ESTILO: Seja amigável, profissional e conciso. Use emojis com moderação. Responda em português do Brasil.

PERGUNTA DO USUÁRIO: ${userMessage}

Responda de forma útil e incentive o usuário a experimentar a plataforma se apropriado.`,
        add_context_from_internet: false
      });

      setMessages(prev => [...prev, { role: "assistant", content: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "Desculpe, tive um problema técnico. Por favor, tente novamente ou entre em contato pelo email suporte@juris-ia.com.br" 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={onOpen}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity"
          >
            <MessageCircle className="w-6 h-6 text-white" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-[360px] sm:w-[400px] max-h-[600px] flex flex-col"
          >
            <Card className="flex flex-col h-[500px] shadow-2xl border-0 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold">Assistente Juris IA</p>
                    <p className="text-xs text-white/80">Online agora</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="text-white hover:bg-white/20"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "assistant" && (
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center shrink-0">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                        msg.role === "user"
                          ? "bg-blue-600 text-white rounded-br-md"
                          : "bg-white text-slate-700 shadow-sm rounded-bl-md"
                      }`}
                    >
                      <p className="whitespace-pre-line">{msg.content}</p>
                    </div>
                    {msg.role === "user" && (
                      <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-slate-600" />
                      </div>
                    )}
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-white p-3 rounded-2xl rounded-bl-md shadow-sm">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 bg-white border-t shrink-0">
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Digite sua pergunta..."
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    size="icon"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}