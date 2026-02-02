import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Sparkles, MessageSquarePlus, History } from "lucide-react";
import SophisticatedLoader from "@/components/common/SophisticatedLoader";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

import ChatInterface from "../components/ai/ChatInterface";
import WelcomeScreen from "../components/ai/WelcomeScreen";
import ConversationHistoryDialog from "../components/ai/ConversationHistoryDialog";

const shouldResetDaily = (subscription) => {
  if (!subscription || !subscription.last_reset_date) return true;
  const today = new Date().toISOString().split('T')[0];
  return subscription.last_reset_date !== today;
};

export default function AIAssistant({ theme = 'light' }) {
  const isDark = theme === 'dark';
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [user, setUser] = useState(null);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [tempMessages, setTempMessages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

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
      let subs = await base44.entities.Subscription.filter({ user_id: user.id });
      if (subs.length === 0) {
        subs = await base44.entities.Subscription.filter({ user_id: user.email });
      }
      
      if (subs.length === 0) {
        return null;
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
    if (tempMessages.length > 0) {
      await createConversationMutation.mutateAsync({
        title: tempMessages[0]?.content?.slice(0, 50) || "Nova conversa",
        mode: "assistant",
        messages: tempMessages,
        last_message_at: new Date().toISOString()
      });
    }

    setSelectedConversation(null);
    setTempMessages([]);
  };

  const handleSendMessageFromWelcome = async (messageContent) => {
    const userMessage = {
      role: "user",
      content: messageContent,
      timestamp: new Date().toISOString()
    };

    setTempMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);

    try {
      const allMessages = [...tempMessages, userMessage];
      
      const hasDocument = messageContent.includes('[DOCUMENTO ANEXADO:');
      const fileUrl = hasDocument ? messageContent.match(/URL do arquivo: (.*?)\n/)?.[1] : null;

      const systemInstructions = hasDocument 
        ? `Você é LEXIA, um especialista em análise de documentos jurídicos brasileiros.
MISSÃO: Analisar documentos legais de forma completa e profissional.
FORMATO: Use Markdown com títulos, listas e destaques para organizar a análise.
INCLUA: Resumo executivo, pontos importantes, riscos identificados, cláusulas relevantes e sugestões de melhoria.
Responda sempre em português brasileiro.`
        : `Você é JURIS, um assistente jurídico inteligente e especializado em direito brasileiro.
Você ajuda advogados com análise de casos, pesquisa de jurisprudência, redação de petições e orientações sobre prazos.
Seja preciso, profissional e cite fontes quando relevante. Responda sempre em português brasileiro.`;

      const conversationContext = allMessages
        .map(m => `${m.role === 'user' ? 'Usuário' : 'Assistente'}: ${m.content}`)
        .join('\n\n');

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `${systemInstructions}\n\nHistórico da conversa:\n${conversationContext}\n\nResponda à última mensagem do usuário de forma profissional e precisa.`,
        add_context_from_internet: false,
        file_urls: fileUrl ? [fileUrl] : undefined
      });

      const assistantResponse = {
        role: "assistant",
        content: response,
        timestamp: new Date().toISOString()
      };

      setTempMessages(prev => [...prev, assistantResponse]);
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
    <div className="h-screen flex overflow-hidden bg-white">
      {/* Main Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="border-b px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3 flex-shrink-0 border-gray-200 bg-white">
          <div className="flex-1 flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-black">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h2 className="font-semibold text-base sm:text-lg text-black">
              {selectedConversation ? selectedConversation.title : 'Assistente Jurídico'}
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {conversations.length > 0 && (
              <Button
                onClick={() => setShowHistoryDialog(true)}
                size="sm"
                variant="outline"
                className="h-9 px-3 border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                <History className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Histórico</span>
              </Button>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-hidden bg-white">
          <AnimatePresence mode="wait">
            {selectedConversation ? (
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
                uploadedFile={uploadedFile}
                onFileUpload={setUploadedFile}
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