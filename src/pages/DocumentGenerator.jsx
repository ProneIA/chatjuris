import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Save, Loader2, ArrowLeft, FileText } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ReactMarkdown from "react-markdown";

// PÁGINA RECONSTRUÍDA DO ZERO - Foco em IA e Persistência
export default function DocumentGenerator() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  
  // Estados do fluxo
  const [prompt, setPrompt] = useState("");
  const [title, setTitle] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // 1. AUTENTICAÇÃO
  useEffect(() => {
    base44.auth.me()
      .then(u => {
        if (!u) throw new Error("Não autenticado");
        setUser(u);
      })
      .catch(() => toast.error("Erro de sessão."));
  }, []);

  // 2. GERAÇÃO COM IA
  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!prompt.trim()) throw new Error("Descreva o documento primeiro.");
      setIsGenerating(true);
      
      try {
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `Aja como advogado sênior. Crie um documento jurídico profissional com base nisto: ${prompt}. Use formatação Markdown.`,
          add_context_from_internet: false
        });
        setGeneratedContent(result);
        if (!title) setTitle(`Documento IA - ${new Date().toLocaleTimeString()}`);
      } finally {
        setIsGenerating(false);
      }
    },
    onError: (e) => toast.error("Erro na IA: " + e.message)
  });

  // 3. SALVAMENTO SEGURO
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user?.email) throw new Error("Sem usuário.");
      if (!title.trim() || !generatedContent) throw new Error("Conteúdo ou título faltando.");

      console.log("💾 Salvando documento gerado...");

      const doc = await base44.entities.LegalDocument.create({
        title: title.trim(),
        content: generatedContent,
        type: "ia_generated",
        status: "draft",
        created_by: user.email // VÍNCULO EXPLÍCITO
      });

      if (!doc || !doc.id) throw new Error("Falha na confirmação do banco.");
      
      return doc;
    },
    onSuccess: (doc) => {
      toast.success(`Documento salvo! ID: ${doc.id}`);
      // Redirecionar para a lista de documentos para confirmar visualização
      navigate(createPageUrl('Documents'));
    },
    onError: (e) => toast.error("Falha ao salvar: " + e.message)
  });

  if (!user) return <div className="p-8 text-center">Carregando...</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(createPageUrl('Documents'))}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Button>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="text-purple-600" /> Gerador de Documentos IA
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LADO ESQUERDO: INPUT */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>1. O que você precisa?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea 
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="Ex: Contrato de aluguel residencial para imóvel em SP, valor R$ 2000, prazo 30 meses..."
                className="h-40"
              />
              <Button 
                onClick={() => generateMutation.mutate()} 
                disabled={isGenerating || !prompt.trim()}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {isGenerating ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2 w-4 h-4" />}
                Gerar Documento
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* LADO DIREITO: PREVIEW E SALVAR */}
        <div className="space-y-4">
          {generatedContent ? (
            <Card className="border-green-500 border-2">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle>2. Resultado</CardTitle>
                <Button 
                  onClick={() => saveMutation.mutate()} 
                  disabled={saveMutation.isPending}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  {saveMutation.isPending ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4 mr-2" />}
                  Salvar Agora
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input 
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Dê um título para salvar..."
                  className="font-bold"
                />
                <div className="h-[400px] overflow-y-auto border rounded p-4 bg-gray-50 prose prose-sm max-w-none">
                  <ReactMarkdown>{generatedContent}</ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="h-full flex items-center justify-center border-2 border-dashed rounded-xl p-8 text-gray-400">
              <div className="text-center">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p>O documento gerado aparecerá aqui.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}