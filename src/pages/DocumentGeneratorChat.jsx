import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { FileText, Send, Loader2, Copy, Download, Save, Sparkles, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function DocumentGeneratorChat({ theme = 'light' }) {
  const isDark = theme === 'dark';
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentDocument, setCurrentDocument] = useState("");
  const [documentTitle, setDocumentTitle] = useState("");
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

  const saveMutation = useMutation({
    mutationFn: async (data) => base44.entities.LegalDocument.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Documento salvo!");
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

      const contextInstruction = currentDocument
        ? `DOCUMENTO ATUAL EM EDIÇÃO:\n\n${currentDocument}\n\nATUALIZE ESTE DOCUMENTO com as informações fornecidas pelo usuário. NÃO crie um documento novo, apenas modifique o existente.`
        : 'Gere um novo documento jurídico completo.';

      const prompt = `Você é um advogado brasileiro experiente especializado em redação de peças jurídicas.

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
      setMessages(prev => [...prev, assistantMessage]);
      setCurrentDocument(response);

      if (!documentTitle) {
        setDocumentTitle(`Documento - ${new Date().toLocaleDateString('pt-BR')}`);
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

  const handleDownload = () => {
    const blob = new Blob([currentDocument], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${documentTitle || "documento"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Download iniciado!");
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`}>
      <div className="max-w-5xl mx-auto p-4 sm:p-6 h-screen flex flex-col">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-2">
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
        </div>

        {/* Chat Area */}
        <div className={`flex-1 rounded-xl border overflow-hidden flex flex-col ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}`}>
          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-12">
                  <Sparkles className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-neutral-700' : 'text-gray-300'}`} />
                  <p className={`font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Comece uma conversa
                  </p>
                  <p className={`text-sm ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                    Digite o que você precisa. Ex: "Crie uma petição inicial de ação de cobrança"
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
            {currentDocument && (
              <div className="mb-3 flex items-center gap-2 flex-wrap">
                <Input
                  value={documentTitle}
                  onChange={(e) => setDocumentTitle(e.target.value)}
                  placeholder="Título do documento"
                  className="flex-1 min-w-[200px]"
                />
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  <Copy className="w-4 h-4 mr-1" />
                  Copiar
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-1" />
                  Baixar
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saveMutation.isPending}>
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