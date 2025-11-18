import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Sparkles, MessageSquarePlus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

import ChatInterface from "../components/ai/ChatInterface";
import ModeSelector from "../components/ai/ModeSelector";
import WelcomeScreen from "../components/ai/WelcomeScreen";
import JurisprudenceSearch from "../components/ai/JurisprudenceSearch";
import DocumentSummarizer from "../components/ai/DocumentSummarizer";

const shouldResetDaily = (subscription) => {
  if (!subscription || !subscription.last_reset_date) return true;
  const today = new Date().toISOString().split('T')[0];
  return subscription.last_reset_date !== today;
};

export default function AIAssistant() {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [selectedMode, setSelectedMode] = useState("assistant");
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => base44.entities.Conversation.list('-last_message_at'),
  });

  const { data: subscription } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const subs = await base44.entities.Subscription.filter({ user_id: user.id });
      
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
    onSuccess: (newConversation) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setSelectedConversation(newConversation);
    },
  });

  const handleNewConversation = () => {
    if (subscription && subscription.plan === "free") {
      const used = subscription.daily_actions_used || 0;
      const limit = subscription.daily_actions_limit || 5;
      if (used >= limit) {
        alert('🚫 Limite diário atingido! Faça upgrade para o Plano Pro.');
        navigate(createPageUrl('Pricing'));
        return;
      }
    }

    const modeNames = {
      assistant: "Nova Conversa",
      document_analyzer: "Analisar Documento",
      legal_document_generator: "Gerar Documento Legal",
      jurisprudence: "Pesquisa de Jurisprudência",
      document_summarizer: "Resumo de Documento"
    };

    createConversationMutation.mutate({
      title: modeNames[selectedMode],
      mode: selectedMode,
      messages: [],
      last_message_at: new Date().toISOString()
    });
  };

  const handleModeChange = (mode) => {
    if (subscription && subscription.plan === "free") {
      const restrictedModes = ['legal_document_generator', 'document_analyzer'];
      if (restrictedModes.includes(mode)) {
        alert('🔒 Modo exclusivo do Plano Pro!');
        navigate(createPageUrl('Pricing'));
        return;
      }
    }
    setSelectedMode(mode);
    if (mode === 'jurisprudence' || mode === 'document_summarizer') {
      setSelectedConversation(null);
    }
  };

  const showWelcome = !selectedConversation && !['jurisprudence', 'document_summarizer'].includes(selectedMode);

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      {/* Top Bar */}
      <div className="border-b border-slate-200 bg-white px-4 py-3 flex items-center gap-4 flex-shrink-0">
        <div className="flex-1 flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          {selectedConversation ? (
            <div>
              <h2 className="font-semibold text-slate-900 text-sm">{selectedConversation.title}</h2>
            </div>
          ) : (
            <h2 className="font-semibold text-slate-900">Assistente IA</h2>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!showWelcome && (
            <Button
              onClick={handleNewConversation}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <MessageSquarePlus className="w-4 h-4 mr-2" />
              Nova Conversa
            </Button>
          )}

          {subscription && subscription.plan === 'free' && (
            <Button
              onClick={() => navigate(createPageUrl('Pricing'))}
              size="sm"
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:opacity-90 text-white"
            >
              Upgrade Pro
            </Button>
          )}
        </div>
      </div>

      {/* Mode Selector */}
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 flex-shrink-0">
        <ModeSelector selectedMode={selectedMode} setSelectedMode={handleModeChange} />
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {selectedMode === 'jurisprudence' ? (
            <JurisprudenceSearch subscription={subscription} />
          ) : selectedMode === 'document_summarizer' ? (
            <DocumentSummarizer />
          ) : selectedConversation ? (
            <ChatInterface
              conversation={selectedConversation}
              onUpdate={() => queryClient.invalidateQueries({ queryKey: ['conversations'] })}
              subscription={subscription}
            />
          ) : (
            <WelcomeScreen onNewConversation={handleNewConversation} selectedMode={selectedMode} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}