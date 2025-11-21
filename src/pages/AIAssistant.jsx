import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Sparkles, MessageSquarePlus, History } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

import ChatInterface from "../components/ai/ChatInterface";
import WelcomeScreen from "../components/ai/WelcomeScreen";
import ConversationHistoryDialog from "../components/ai/ConversationHistoryDialog";
import LexiaDocumentAnalyzer from "../components/ai/LexiaDocumentAnalyzer";

const shouldResetDaily = (subscription) => {
  if (!subscription || !subscription.last_reset_date) return true;
  const today = new Date().toISOString().split('T')[0];
  return subscription.last_reset_date !== today;
};

export default function AIAssistant() {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [user, setUser] = useState(null);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [tempMessages, setTempMessages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showLexiaAnalyzer, setShowLexiaAnalyzer] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Salvar conversa ao fechar a página
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (tempMessages.length > 0 && !selectedConversation) {
        await base44.entities.Conversation.create({
          title: tempMessages[0]?.content?.slice(0, 50) || "Nova conversa",
          mode: "assistant",
          messages: tempMessages,
          last_message_at: new Date().toISOString()
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [tempMessages, selectedConversation]);

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      // Filtro explícito por created_by para garantir isolamento por usuário
      return base44.entities.Conversation.filter(
        { created_by: user.email },
        '-last_message_at'
      );
    },
    enabled: !!user?.email
  });

  const { data: subscription } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      // Buscar por user_id (ID) ou por email
      let subs = await base44.entities.Subscription.filter({ user_id: user.id });
      if (subs.length === 0) {
        subs = await base44.entities.Subscription.filter({ user_id: user.email });
      }
      
      if (subs.length === 0) {
        return await base44.entities.Subscription.create({
          user_id: user.id,
          plan: "free",
          status: "active",
          daily_actions_limit: 5,
          daily_actions_used: 0,
          last_reset_date: new Date().toISOString().split('T')[0],
          price: 0
        });
      }
      
      const sub = subs[0];
      if (shouldResetDaily(sub)) {
        return await base44.entities.Subscription.update(sub.id, {
          daily_actions_used: 0,
          last_reset_date: new Date().toISOString().split('T')[0]
        });
      }
      return sub;
    },
    enabled: !!user?.id
  });

  const createConversationMutation = useMutation({
    mutationFn: (data) => base44.entities.Conversation.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      // Não mudar de tela ao criar conversa
    },
  });

  const updateConversationMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Conversation.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  const deleteConversationMutation = useMutation({
    mutationFn: (id) => base44.entities.Conversation.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setSelectedConversation(null);
    },
  });

  const handleNewConversation = async () => {
    // Salvar conversa atual antes de criar nova
    if (tempMessages.length > 0) {
      await createConversationMutation.mutateAsync({
        title: tempMessages[0]?.content?.slice(0, 50) || "Nova conversa",
        mode: "assistant",
        messages: tempMessages,
        last_message_at: new Date().toISOString()
      });
    }

    if (subscription && subscription.plan === "free") {
      const used = subscription.daily_actions_used || 0;
      const limit = subscription.daily_actions_limit || 5;
      if (used >= limit) {
        alert('🚫 Limite diário atingido! Faça upgrade para o Plano Pro.');
        navigate(createPageUrl('Pricing'));
        return;
      }
    }

    setSelectedConversation(null);
    setTempMessages([]);
  };

  const handleSendMessageFromWelcome = async (messageContent) => {
    if (subscription && subscription.plan === "free") {
      const used = subscription.daily_actions_used || 0;
      const limit = subscription.daily_actions_limit || 5;
      if (used >= limit) {
        alert('🚫 Limite diário atingido! Faça upgrade para o Plano Pro.');
        navigate(createPageUrl('Pricing'));
        return;
      }
    }

    const userMessage = {
      role: "user",
      content: messageContent,
      timestamp: new Date().toISOString()
    };

    setTempMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);

    try {
      const systemInstructions = `Você é um assistente jurídico especializado em direito brasileiro.

REGRAS DE COMPORTAMENTO:
- Considere todo o histórico de mensagens como parte da mesma conversa contínua
- Nunca peça para mudar de aba, página, link ou interface
- Dê respostas que façam sentido com base nas mensagens anteriores, mantendo contexto e coerência
- A conversa pode seguir indefinidamente, mensagem após mensagem
- Se precisar retomar algo já falado, faça um resumo breve

FORMATO DAS RESPOSTAS:
- Responda em texto simples usando Markdown (títulos, listas, blocos de código)
- Use parágrafos curtos e listas quando útil
- Não sugira criar novas janelas, abas, telas ou sessões
- Tom natural, claro e objetivo em português do Brasil
- A resposta será exibida diretamente na mesma tela de conversa`;

      const conversationContext = tempMessages
        .map(m => `${m.role === 'user' ? 'Usuário' : 'Assistente'}: ${m.content}`)
        .join('\n\n');

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `${systemInstructions}\n\nHistórico da conversa:\n${conversationContext}\n\nUsuário: ${messageContent}\n\nResponda à última mensagem do usuário de forma profissional e precisa.`,
        add_context_from_internet: false
      });

      const assistantResponse = {
        role: "assistant",
        content: response,
        timestamp: new Date().toISOString()
      };

      setTempMessages(prev => [...prev, assistantResponse]);

      if (subscription && subscription.plan === 'free') {
        await base44.entities.Subscription.update(subscription.id, {
          daily_actions_used: (subscription.daily_actions_used || 0) + 1
        });
        queryClient.invalidateQueries({ queryKey: ['subscription'] });
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao gerar resposta. Tente novamente.");
      setTempMessages(prev => prev.slice(0, -1));
    }

    setIsProcessing(false);
  };

  const handleRenameConversation = (conversationId, newTitle) => {
    updateConversationMutation.mutate({
      id: conversationId,
      data: { title: newTitle }
    });
  };

  const handleDeleteConversation = (conversationId) => {
    deleteConversationMutation.mutate(conversationId);
  };

  return (
    <div className="h-screen flex bg-white overflow-hidden">
      {/* Main Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="border-b border-slate-200 bg-white px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-4 flex-shrink-0">
          <div className="flex-1 flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center shrink-0">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
            </div>
            {selectedConversation ? (
              <div className="min-w-0">
                <h2 className="font-semibold text-slate-900 text-xs sm:text-sm truncate">{selectedConversation.title}</h2>
              </div>
            ) : (
              <h2 className="font-semibold text-slate-900 text-sm sm:text-base">Assistente IA</h2>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Button
              onClick={() => setShowLexiaAnalyzer(true)}
              size="sm"
              variant="outline"
              className="h-8 sm:h-9 px-2 sm:px-3 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-300 hover:from-blue-100 hover:to-purple-100"
            >
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2 text-purple-600" />
              <span className="hidden sm:inline text-purple-700 font-medium">LEXIA Docs</span>
            </Button>

            {conversations.length > 0 && (
              <Button
                onClick={() => setShowHistoryDialog(true)}
                size="sm"
                variant="outline"
                className="h-8 sm:h-9 px-2 sm:px-3"
              >
                <History className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="hidden sm:inline">Histórico ({conversations.length})</span>
                <span className="sm:hidden">({conversations.length})</span>
              </Button>
            )}

            <Button
              onClick={handleNewConversation}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white h-8 sm:h-9 px-2 sm:px-3"
            >
              <MessageSquarePlus className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">Nova Conversa</span>
            </Button>

            {subscription && subscription.plan === 'free' && (
              <Button
                onClick={() => navigate(createPageUrl('Pricing'))}
                size="sm"
                className="hidden md:flex bg-gradient-to-r from-blue-500 to-purple-500 hover:opacity-90 text-white h-8 sm:h-9"
              >
                Upgrade Pro
              </Button>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {showLexiaAnalyzer ? (
              <LexiaDocumentAnalyzer onClose={() => setShowLexiaAnalyzer(false)} />
            ) : selectedConversation ? (
              <ChatInterface
                conversation={selectedConversation}
                onUpdate={() => queryClient.invalidateQueries({ queryKey: ['conversations'] })}
                subscription={subscription}
                userName={user?.full_name}
              />
            ) : (
              <WelcomeScreen 
                onSendMessage={handleSendMessageFromWelcome} 
                userName={user?.full_name}
                messages={tempMessages}
                isProcessing={isProcessing}
                onOpenHistory={() => setShowHistoryDialog(true)}
              />
            )}
          </AnimatePresence>
        </div>
        </div>

        {/* Dialog de Histórico */}
        <ConversationHistoryDialog
        open={showHistoryDialog}
        onClose={() => setShowHistoryDialog(false)}
        conversations={conversations}
        selectedConversation={selectedConversation}
        onSelectConversation={(conv) => {
          setSelectedConversation(conv);
          setShowHistoryDialog(false);
        }}
        onRenameConversation={handleRenameConversation}
        onDeleteConversation={handleDeleteConversation}
        />
        </div>
        );
        }