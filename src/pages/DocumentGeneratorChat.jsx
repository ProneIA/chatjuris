import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { FileText, Send, Loader2, Copy, Download, Save, Sparkles, MessageSquare, FileDown, Plus } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { ScrollArea } from "@/components/ui/scroll-area";
import { jsPDF } from "jspdf";

const legalAreas = [
  { id: 'civil', name: 'Direito Civil', emoji: '📜' },
  { id: 'penal', name: 'Direito Penal', emoji: '⚖️' },
  { id: 'trabalhista', name: 'Direito Trabalhista', emoji: '👔' },
  { id: 'tributario', name: 'Direito Tributário', emoji: '💰' },
  { id: 'empresarial', name: 'Direito Empresarial', emoji: '🏢' },
  { id: 'consumidor', name: 'Direito do Consumidor', emoji: '🛒' },
  { id: 'familia', name: 'Direito de Família', emoji: '👨‍👩‍👧‍👦' },
  { id: 'previdenciario', name: 'Direito Previdenciário', emoji: '🏥' },
  { id: 'constitucional', name: 'Direito Constitucional', emoji: '🏛️' },
  { id: 'administrativo', name: 'Direito Administrativo', emoji: '🏛️' },
  { id: 'ambiental', name: 'Direito Ambiental', emoji: '🌳' },
  { id: 'eleitoral', name: 'Direito Eleitoral', emoji: '🗳️' },
  { id: 'internacional', name: 'Direito Internacional', emoji: '🌍' },
  { id: 'processual_civil', name: 'Processo Civil', emoji: '📋' },
  { id: 'processual_penal', name: 'Processo Penal', emoji: '⚖️' },
  { id: 'imobiliario', name: 'Direito Imobiliário', emoji: '🏠' },
  { id: 'digital', name: 'Direito Digital', emoji: '💻' },
  { id: 'bancario', name: 'Direito Bancário', emoji: '🏦' },
];

const documentTypes = [
  { id: 'peticao_inicial', name: 'Petição Inicial', emoji: '📄', description: '6 campos' },
  { id: 'contrato', name: 'Contrato', emoji: '📝', description: '7 campos' },
  { id: 'procuracao', name: 'Procuração', emoji: '✍️', description: '5 campos' },
  { id: 'recurso', name: 'Recurso/Apelação', emoji: '🔄', description: '6 campos' },
  { id: 'parecer', name: 'Parecer Jurídico', emoji: '💼', description: '5 campos' },
  { id: 'contestacao', name: 'Contestação', emoji: '🛡️', description: '6 campos' },
];

export default function DocumentGeneratorChat({ theme = 'light' }) {
  const isDark = theme === 'dark';
  const [user, setUser] = useState(null);
  const [selectedLegalArea, setSelectedLegalArea] = useState(null);
  const [selectedDocType, setSelectedDocType] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentDocument, setCurrentDocument] = useState("");
  const [documentTitle, setDocumentTitle] = useState("");
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const { data: subscription } = useQuery({
    queryKey: ["subscription", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const subs = await base44.entities.Subscription.filter({ user_id: user.id });
      return subs[0] || null;
    },
    enabled: !!user?.id,
  });

  const { data: conversations = [] } = useQuery({
    queryKey: ["doc-conversations", user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const convs = await base44.entities.Conversation.filter(
        { 
          created_by: user.email,
          mode: "legal_document_generator"
        },
        '-updated_date',
        5
      );
      return convs;
    },
    enabled: !!user?.email,
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => base44.entities.LegalDocument.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Documento salvo!");
    },
  });

  const saveConversationMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      if (id) {
        return base44.entities.Conversation.update(id, data);
      } else {
        return base44.entities.Conversation.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doc-conversations"] });
    },
  });

  const handleSend = async () => {
    if (!input.trim()) return;

    if (subscription?.plan === "free") {
      const used = subscription.daily_actions_used || 0;
      const limit = subscription.daily_actions_limit || 5;
      if (used >= limit) {
        toast.error("Limite diário atingido! Faça upgrade para o Pro.");
        return;
      }
    }

    const userMessage = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsGenerating(true);

    try {
      const conversationHistory = messages
        .concat(userMessage)
        .map(m => `${m.role === 'user' ? 'Usuário' : 'Assistente'}: ${m.content}`)
        .join('\n\n');

      const areaContext = selectedLegalArea ? `\nÁREA DO DIREITO: ${selectedLegalArea}` : '';
      const docTypeContext = selectedDocType ? `\nTIPO DE DOCUMENTO: ${selectedDocType}` : '';

      const contextInstruction = currentDocument
        ? `DOCUMENTO ATUAL EM EDIÇÃO:\n\n${currentDocument}\n\nATUALIZE ESTE DOCUMENTO com as informações fornecidas pelo usuário. NÃO crie um documento novo, apenas modifique o existente.`
        : 'Gere um novo documento jurídico completo.';

      const prompt = `Você é um advogado brasileiro experiente especializado em redação de peças jurídicas.${areaContext}${docTypeContext}

${contextInstruction}

HISTÓRICO DA CONVERSA:
${conversationHistory}

DIRETRIZES:
1. Use linguagem jurídica formal e técnica
2. Siga estrutura padrão para o tipo de documento
3. Inclua fundamentação legal completa
4. Use formatação clara (Markdown)
5. Se informação estiver faltando, indique com [COMPLETAR]
${currentDocument ? '6. MANTENHA o formato e estrutura do documento atual, apenas atualizando conforme solicitado' : ''}

Responda ao último pedido do usuário ${currentDocument ? 'atualizando o documento' : 'gerando o documento'}.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
      });

      const assistantMessage = { role: "assistant", content: response };
      const updatedMessages = [...messages, userMessage, assistantMessage];
      setMessages(updatedMessages);
      setCurrentDocument(response);
      
      console.log('✅ DEBUG - Documento gerado e setado:', response.substring(0, 100));

      if (!documentTitle) {
        const newTitle = `Documento - ${new Date().toLocaleDateString('pt-BR')}`;
        setDocumentTitle(newTitle);
        console.log('📝 DEBUG - Título setado:', newTitle);
      }

      // Salvar conversa automaticamente
      const conversationData = {
        title: documentTitle || `${selectedDocType || 'Documento'} - ${new Date().toLocaleDateString('pt-BR')}`,
        mode: "legal_document_generator",
        messages: updatedMessages,
        last_message_at: new Date().toISOString(),
        metadata: {
          legal_area: selectedLegalArea,
          doc_type: selectedDocType,
          current_document: response,
          document_title: documentTitle
        }
      };

      if (currentConversationId) {
        await saveConversationMutation.mutateAsync({ id: currentConversationId, data: conversationData });
      } else {
        const newConv = await saveConversationMutation.mutateAsync({ id: null, data: conversationData });
        setCurrentConversationId(newConv.id);
      }

      if (subscription?.plan === "free") {
        await base44.entities.Subscription.update(subscription.id, {
          daily_actions_used: (subscription.daily_actions_used || 0) + 1,
        });
        queryClient.invalidateQueries({ queryKey: ["subscription"] });
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao gerar resposta. Tente novamente.");
    }

    setIsGenerating(false);
  };

  const handleSave = async () => {
    if (!currentDocument) return;

    await saveMutation.mutateAsync({
      title: documentTitle || `Documento - ${new Date().toLocaleDateString("pt-BR")}`,
      type: "outros",
      content: currentDocument,
      status: "draft",
      notes: "Gerado por IA via Chat",
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(currentDocument);
    toast.success("Documento copiado!");
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([currentDocument], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${documentTitle || "documento"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Arquivo TXT baixado!");
  };

  const handleDownloadPdf = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const maxWidth = pageWidth - 2 * margin;
      
      // Remove Markdown formatting for plain text
      const plainText = currentDocument
        .replace(/#{1,6}\s/g, '')
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/\*(.+?)\*/g, '$1')
        .replace(/\[(.+?)\]\(.+?\)/g, '$1');
      
      // Title
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text(documentTitle || 'Documento Jurídico', margin, margin);
      
      // Content
      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      let yPos = margin + 10;
      
      const lines = doc.splitTextToSize(plainText, maxWidth);
      lines.forEach(line => {
        if (yPos > 280) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(line, margin, yPos);
        yPos += 6;
      });
      
      doc.save(`${documentTitle || 'documento'}.pdf`);
      toast.success("PDF baixado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar PDF. Tente novamente.");
    }
  };

  const loadConversation = (conv) => {
    setMessages(conv.messages || []);
    setCurrentDocument(conv.metadata?.current_document || "");
    setDocumentTitle(conv.metadata?.document_title || conv.title);
    setSelectedLegalArea(conv.metadata?.legal_area || null);
    setSelectedDocType(conv.metadata?.doc_type || null);
    setCurrentConversationId(conv.id);
    setShowHistory(false);
    toast.success("Conversa carregada!");
  };

  const startNewConversation = () => {
    setMessages([]);
    setCurrentDocument("");
    setDocumentTitle("");
    setSelectedLegalArea(null);
    setSelectedDocType(null);
    setCurrentConversationId(null);
    setShowHistory(false);
    toast.success("Nova conversa iniciada!");
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`}>
      <div className="max-w-5xl mx-auto p-4 sm:p-6 h-screen flex flex-col">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className={`text-xl sm:text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Gerador de Peças - Chat
                </h1>
                <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                  Converse com a IA para criar e editar documentos jurídicos
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHistory(!showHistory)}
                className={isDark ? 'border-neutral-700 text-white' : ''}
              >
                <FileText className="w-4 h-4 mr-2" />
                Histórico
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={startNewConversation}
                className={isDark ? 'border-neutral-700 text-white' : ''}
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova
              </Button>
            </div>
          </div>
        </div>

        {/* History Sidebar */}
        {showHistory && (
          <div className={`mb-4 p-4 rounded-xl border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Últimas 5 Conversas
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHistory(false)}
              >
                ✕
              </Button>
            </div>
            <div className="space-y-2">
              {conversations.length === 0 ? (
                <p className={`text-sm text-center py-4 ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                  Nenhuma conversa salva ainda
                </p>
              ) : (
                conversations.map(conv => (
                  <button
                    key={conv.id}
                    onClick={() => loadConversation(conv)}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      currentConversationId === conv.id
                        ? isDark ? 'bg-purple-900/30 border border-purple-700' : 'bg-purple-50 border border-purple-200'
                        : isDark ? 'bg-neutral-800 hover:bg-neutral-700' : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium text-sm truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {conv.title}
                        </p>
                        <p className={`text-xs mt-1 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                          {conv.messages?.length || 0} mensagens • {new Date(conv.last_message_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      {currentConversationId === conv.id && (
                        <div className="w-2 h-2 rounded-full bg-purple-500 mt-1" />
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Chat Area */}
        <div className={`flex-1 rounded-xl border overflow-hidden flex flex-col ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}`}>
          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.length === 0 && !selectedLegalArea && (
                <div className="text-center py-8 px-4">
                  <Sparkles className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-neutral-700' : 'text-gray-300'}`} />
                  <p className={`font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Escolha a área do direito
                  </p>
                  <p className={`text-sm mb-6 ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                    Selecione a área jurídica para começar
                  </p>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
                    {legalAreas.map((area) => (
                      <button
                        key={area.id}
                        onClick={() => setSelectedLegalArea(area.name)}
                        className={`p-4 rounded-xl border-2 transition-all hover:scale-105 ${
                          isDark 
                            ? 'border-neutral-700 bg-neutral-800 hover:border-purple-500' 
                            : 'border-gray-200 bg-white hover:border-purple-500'
                        }`}
                      >
                        <div className="text-3xl mb-2">{area.emoji}</div>
                        <div className={`text-xs font-medium ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                          {area.name}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.length === 0 && selectedLegalArea && !selectedDocType && (
                <div className="text-center py-8 px-4">
                  <div className="mb-6">
                    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${isDark ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-700'}`}>
                      <span className="font-medium">{selectedLegalArea}</span>
                      <button onClick={() => setSelectedLegalArea(null)} className="hover:opacity-70">✕</button>
                    </span>
                  </div>
                  
                  <FileText className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-neutral-700' : 'text-gray-300'}`} />
                  <p className={`font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Escolha o tipo de documento
                  </p>
                  <p className={`text-sm mb-6 ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                    Que tipo de documento você precisa criar?
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-w-3xl mx-auto">
                    {documentTypes.map((doc) => (
                      <button
                        key={doc.id}
                        onClick={() => setSelectedDocType(doc.name)}
                        className={`p-4 rounded-xl border-2 transition-all hover:scale-105 text-left ${
                          isDark 
                            ? 'border-neutral-700 bg-neutral-800 hover:border-indigo-500' 
                            : 'border-gray-200 bg-white hover:border-indigo-500'
                        }`}
                      >
                        <div className="text-3xl mb-2">{doc.emoji}</div>
                        <div className={`font-medium mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {doc.name}
                        </div>
                        <div className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                          {doc.description}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.length === 0 && selectedLegalArea && selectedDocType && (
                <div className="text-center py-12">
                  <div className="mb-4 flex items-center justify-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${isDark ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-700'}`}>
                      {selectedLegalArea}
                      <button onClick={() => { setSelectedLegalArea(null); setSelectedDocType(null); }} className="hover:opacity-70">✕</button>
                    </span>
                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${isDark ? 'bg-indigo-900/30 text-indigo-300' : 'bg-indigo-100 text-indigo-700'}`}>
                      {selectedDocType}
                      <button onClick={() => setSelectedDocType(null)} className="hover:opacity-70">✕</button>
                    </span>
                  </div>
                  <Sparkles className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-neutral-700' : 'text-gray-300'}`} />
                  <p className={`font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Pronto para começar!
                  </p>
                  <p className={`text-sm ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                    Descreva o que você precisa. Ex: "Crie uma {selectedDocType.toLowerCase()} sobre [assunto]"
                  </p>
                </div>
              )}

              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      msg.role === 'user'
                        ? isDark ? 'bg-neutral-800 text-white' : 'bg-gray-900 text-white'
                        : isDark ? 'bg-neutral-800 border border-neutral-700' : 'bg-gray-50 border border-gray-200'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                      <div className={`prose prose-sm max-w-none ${isDark ? 'prose-invert' : ''}`}>
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm">{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}

              {isGenerating && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  </div>
                  <div className={`rounded-lg p-3 ${isDark ? 'bg-neutral-800' : 'bg-gray-50'}`}>
                    <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                      Gerando resposta...
                    </p>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className={`border-t p-4 ${isDark ? 'border-neutral-800' : 'border-gray-200'}`}>
            {currentDocument && currentDocument.trim().length > 0 && (
              <div className={`mb-3 p-3 rounded-lg ${isDark ? 'bg-green-900/20 border border-green-700' : 'bg-green-50 border border-green-200'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className={`text-xs font-medium ${isDark ? 'text-green-300' : 'text-green-700'}`}>
                    Documento Pronto - Baixe ou Salve
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Input
                    value={documentTitle}
                    onChange={(e) => setDocumentTitle(e.target.value)}
                    placeholder="Título do documento"
                    className={`flex-1 min-w-[200px] ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white'}`}
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      console.log('🔍 DEBUG - Copiando documento');
                      handleCopy();
                    }}
                    className={isDark ? 'border-neutral-700 hover:bg-neutral-800' : ''}
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copiar
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      console.log('📄 DEBUG - Baixando TXT');
                      handleDownloadTxt();
                    }}
                    className={isDark ? 'border-neutral-700 hover:bg-neutral-800' : ''}
                  >
                    <FileDown className="w-4 h-4 mr-1" />
                    TXT
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      console.log('📕 DEBUG - Baixando PDF');
                      handleDownloadPdf();
                    }}
                    className="bg-red-50 hover:bg-red-100 border-red-200 text-red-700"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    PDF
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => {
                      console.log('💾 DEBUG - Salvando documento');
                      handleSave();
                    }}
                    disabled={saveMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {saveMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-1" />
                        Salvar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={currentDocument ? "Digite o que deseja alterar no documento..." : "Digite o que você precisa. Ex: 'Crie uma petição inicial'"}
                className="min-h-[60px] resize-none"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isGenerating}
                className="bg-gradient-to-r from-purple-600 to-indigo-600"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}