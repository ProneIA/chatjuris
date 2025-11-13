import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Sparkles, MessageSquarePlus, Menu, X, Zap, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

import ChatInterface from "../components/ai/ChatInterface";
import ConversationList from "../components/ai/ConversationList";
import ModeSelector from "../components/ai/ModeSelector";
import WelcomeScreen from "../components/ai/WelcomeScreen";
import JurisprudenceSearch from "../components/ai/JurisprudenceSearch";
import UsageLimits from "../components/subscription/UsageLimits";

// Check if need to reset daily counter
const shouldResetDaily = (subscription) => {
  if (!subscription || !subscription.last_reset_date) return true;
  
  const today = new Date().toISOString().split('T')[0];
  return subscription.last_reset_date !== today;
};

export default function AIAssistant() {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [selectedMode, setSelectedMode] = useState("assistant");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => base44.entities.Conversation.list('-last_message_at'),
  });

  const { data: subscription } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const subs = await base44.entities.Subscription.filter({ user_id: user.id });
      
      if (subs.length === 0) {
        // Create default free subscription
        const newSub = await base44.entities.Subscription.create({
          user_id: user.id,
          plan: "free",
          status: "active",
          daily_actions_limit: 5,
          daily_actions_used: 0,
          last_reset_date: new Date().toISOString().split('T')[0],
          price: 0
        });
        return newSub;
      }
      
      const sub = subs[0];
      
      // Check if need to reset daily
      if (shouldResetDaily(sub)) {
        const resetSub = await base44.entities.Subscription.update(sub.id, {
          daily_actions_used: 0,
          last_reset_date: new Date().toISOString().split('T')[0]
        });
        return resetSub;
      }
      
      return sub;
    },
    enabled: !!user?.id
  });

  const updateUsageMutation = useMutation({
    mutationFn: ({ increment = 1 }) => {
      if (!subscription) return Promise.resolve();
      
      // Pro users don't have limits
      if (subscription.plan === "pro") return Promise.resolve();
      
      const currentUsed = subscription.daily_actions_used || 0;
      return base44.entities.Subscription.update(subscription.id, {
        daily_actions_used: currentUsed + increment
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
    }
  });

  const createConversationMutation = useMutation({
    mutationFn: (data) => base44.entities.Conversation.create(data),
    onSuccess: (newConversation) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setSelectedConversation(newConversation);
      // Increment usage
      updateUsageMutation.mutate({ increment: 1 });
    },
  });

  const handleNewConversation = () => {
    // Check limits for free users
    if (subscription && subscription.plan === "free") {
      const used = subscription.daily_actions_used || 0;
      const limit = subscription.daily_actions_limit || 5;
      
      if (used >= limit) {
        alert('🚫 Você atingiu o limite de 5 ações diárias! Volte amanhã ou faça upgrade para o Plano Pro.');
        navigate(createPageUrl('Pricing'));
        return;
      }
    }

    const modeNames = {
      assistant: "Nova Conversa",
      document_analyzer: "Analisar Documento",
      legal_document_generator: "Gerar Documento Legal",
      jurisprudence: "Pesquisa de Jurisprudência"
    };

    createConversationMutation.mutate({
      title: modeNames[selectedMode],
      mode: selectedMode,
      messages: [],
      last_message_at: new Date().toISOString()
    });
  };

  const handleModeChange = (mode) => {
    // Free users can only access assistant and jurisprudence
    if (subscription && subscription.plan === "free") {
      const restrictedModes = ['legal_document_generator', 'document_analyzer'];
      if (restrictedModes.includes(mode)) {
        alert('🔒 Este modo é exclusivo para o Plano Pro! Faça upgrade por apenas R$ 49,99/mês.');
        navigate(createPageUrl('Pricing'));
        return;
      }
    }
    setSelectedMode(mode);
  };

  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth >= 1024);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (selectedMode === 'jurisprudence') {
      setSelectedConversation(null);
    }
  }, [selectedMode]);

  const getModeInfo = () => {
    const modes = {
      assistant: { icon: "💬", name: "Assistente Geral", color: "from-blue-500 to-cyan-500" },
      jurisprudence: { icon: "⚖️", name: "Pesquisa de Jurisprudência", color: "from-emerald-500 to-teal-500" },
      legal_document_generator: { icon: "📜", name: "Gerador de Documentos", color: "from-purple-500 to-pink-500" },
      document_analyzer: { icon: "📄", name: "Analisador de Documentos", color: "from-green-500 to-emerald-500" }
    };
    return modes[selectedMode] || modes.assistant;
  };

  const currentMode = getModeInfo();

  // Check if user has reached daily limit
  const hasReachedLimit = subscription && subscription.plan === "free" && 
    (subscription.daily_actions_used >= subscription.daily_actions_limit);

  return (
    <div className="h-screen flex overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="w-80 bg-white/80 backdrop-blur-xl border-r border-slate-200/50 flex flex-col shadow-2xl lg:relative absolute inset-y-0 left-0 z-40"
          >
            {/* Sidebar Header */}
            <div className="p-6 border-b border-slate-200/50 bg-gradient-to-br from-white to-purple-50/30">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <motion.div 
                    className="relative"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <motion.div 
                      className="absolute -inset-1 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl blur-lg opacity-40"
                      animate={{ 
                        scale: [1, 1.2, 1],
                        opacity: [0.4, 0.6, 0.4]
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  </motion.div>
                  <div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                      IA Jurídica
                    </h1>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-purple-500" />
                      Powered by AI
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden hover:bg-purple-100"
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {selectedMode !== 'jurisprudence' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Button
                    onClick={handleNewConversation}
                    disabled={createConversationMutation.isPending || hasReachedLimit}
                    className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 group disabled:opacity-50"
                  >
                    <MessageSquarePlus className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                    {hasReachedLimit ? '🔒 Limite Diário Atingido' : 'Nova Conversa'}
                  </Button>
                </motion.div>
              )}
            </div>

            {/* Usage Limits */}
            {subscription && (
              <div className="p-6 border-b border-slate-200/50">
                <UsageLimits subscription={subscription} />
              </div>
            )}

            {/* Mode Selector */}
            <div className="p-6 border-b border-slate-200/50 bg-gradient-to-br from-white/50 to-blue-50/50">
              <ModeSelector selectedMode={selectedMode} setSelectedMode={handleModeChange} />
            </div>

            {/* Conversations List */}
            {selectedMode !== 'jurisprudence' && (
              <div className="flex-1 overflow-y-auto bg-gradient-to-b from-transparent to-slate-50/50">
                <ConversationList
                  conversations={conversations}
                  selectedConversation={selectedConversation}
                  setSelectedConversation={setSelectedConversation}
                  isLoading={isLoading}
                />
              </div>
            )}

            {/* Footer Info */}
            <motion.div 
              className="p-4 border-t border-slate-200/50 bg-gradient-to-br from-purple-50/50 to-blue-50/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>Sistema operacional</span>
              </div>
            </motion.div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative">
        {/* Top Bar */}
        <motion.div 
          className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 px-6 py-4 flex items-center gap-4 shadow-sm"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          {!isSidebarOpen && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(true)}
              className="hover:bg-purple-100"
            >
              <Menu className="w-5 h-5" />
            </Button>
          )}
          <div className="flex-1 flex items-center gap-3">
            <motion.div
              className={`w-10 h-10 rounded-xl bg-gradient-to-br ${currentMode.color} flex items-center justify-center shadow-lg`}
              whileHover={{ scale: 1.1, rotate: 5 }}
            >
              <span className="text-xl">{currentMode.icon}</span>
            </motion.div>
            <div>
              {selectedMode === 'jurisprudence' ? (
                <>
                  <h2 className="font-semibold text-slate-900">{currentMode.name}</h2>
                  <p className="text-xs text-slate-500">STF, STJ, TRFs e outros tribunais</p>
                </>
              ) : selectedConversation ? (
                <>
                  <h2 className="font-semibold text-slate-900">{selectedConversation.title}</h2>
                  <p className="text-xs text-slate-500">{currentMode.icon} {currentMode.name}</p>
                </>
              ) : (
                <>
                  <h2 className="font-semibold text-slate-900">Bem-vindo ao {currentMode.name}</h2>
                  <p className="text-xs text-slate-500">Selecione ou crie uma conversa</p>
                </>
              )}
            </div>
          </div>
          
          {subscription && subscription.plan === 'free' && (
            <Button
              onClick={() => navigate(createPageUrl('Pricing'))}
              size="sm"
              className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:opacity-90 text-white"
            >
              <Sparkles className="w-4 h-4 mr-1" />
              Upgrade
            </Button>
          )}
        </motion.div>

        {/* Chat Area */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {selectedMode === 'jurisprudence' ? (
              <motion.div
                key="jurisprudence"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="h-full"
              >
                <JurisprudenceSearch subscription={subscription} updateUsage={updateUsageMutation.mutate} />
              </motion.div>
            ) : selectedConversation ? (
              <motion.div
                key="chat"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="h-full"
              >
                <ChatInterface
                  conversation={selectedConversation}
                  onUpdate={() => queryClient.invalidateQueries({ queryKey: ['conversations'] })}
                  subscription={subscription}
                  updateUsage={updateUsageMutation.mutate}
                />
              </motion.div>
            ) : (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="h-full"
              >
                <WelcomeScreen onNewConversation={handleNewConversation} selectedMode={selectedMode} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}