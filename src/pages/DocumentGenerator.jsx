import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Save, Sparkles, FileText, CheckCircle, ArrowLeft, Eye } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ReactMarkdown from "react-markdown";

const DOCUMENT_TYPES = [
  { value: "peticao", label: "Petição" },
  { value: "recurso", label: "Recurso" },
  { value: "contestacao", label: "Contestação" },
  { value: "contrato", label: "Contrato" },
  { value: "procuracao", label: "Procuração" },
  { value: "parecer", label: "Parecer" },
  { value: "memorando", label: "Memorando" },
  { value: "outros", label: "Outros" },
];

export default function DocumentGenerator() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  
  // States
  const [step, setStep] = useState(1); // 1: Config, 2: Generate/Edit, 3: Save/Success
  const [docType, setDocType] = useState("peticao");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [savedDocId, setSavedDocId] = useState(null);

  // Data fetching
  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: subscription } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const subs = await base44.entities.Subscription.filter({ user_id: user.id });
      return subs[0] || null;
    },
    enabled: !!user?.id
  });

  // Mutations
  const saveMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.LegalDocument.create(data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setSavedDocId(data.id);
      setStep(3);
      toast.success("Documento salvo com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao salvar documento.");
    }
  });

  const handleGenerate = async () => {
    if (!description.trim()) {
      toast.error("Por favor, descreva o documento que deseja gerar.");
      return;
    }

    // Check limits
    if (subscription?.plan === "free") {
      const used = subscription.daily_actions_used || 0;
      const limit = subscription.daily_actions_limit || 5;
      if (used >= limit) {
        toast.error("Limite diário atingido! Faça upgrade para continuar.");
        return;
      }
    }

    setIsGenerating(true);
    try {
      const prompt = `
      Atue como um advogado especialista.
      Gere um documento jurídico do tipo: ${docType}.
      Título/Assunto: ${title}
      
      Detalhes e Contexto fornecidos pelo usuário:
      ${description}
      
      RETORNE APENAS O CONTEÚDO DO DOCUMENTO EM FORMATO MARKDOWN.
      Seja formal, técnico e completo.
      `;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true
      });

      setGeneratedContent(response);
      
      // Update usage
      if (subscription?.plan === "free") {
        await base44.entities.Subscription.update(subscription.id, {
          daily_actions_used: (subscription.daily_actions_used || 0) + 1
        });
        queryClient.invalidateQueries({ queryKey: ['subscription'] });
      }
      
      setStep(2);
    } catch (error) {
      console.error(error);
      toast.error("Erro na geração. Tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    if (!title.trim()) {
      toast.error("Defina um título para o documento.");
      return;
    }
    
    saveMutation.mutate({
      title: title,
      type: docType,
      content: generatedContent,
      status: "draft", // Saved as draft initially
      notes: "Gerado via IA",
      created_by: user?.email // Ensure created_by is clear (though backend handles it)
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gerador de Documentos</h1>
            <p className="text-gray-500">Crie peças jurídicas com Inteligência Artificial</p>
          </div>
          <Button variant="outline" onClick={() => navigate(createPageUrl('Documents'))}>
            Ver Meus Documentos
          </Button>
        </div>

        {/* Step 1: Configuration */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>1. Configuração do Documento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Documento</Label>
                  <Select value={docType} onValueChange={setDocType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Título do Documento</Label>
                  <Input 
                    placeholder="Ex: Petição Inicial - Ação de Cobrança" 
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descrição Detalhada e Contexto</Label>
                <Textarea 
                  placeholder="Descreva os fatos, as partes envolvidas, os pedidos e a fundamentação desejada..."
                  className="h-40"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>

              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating || !description.trim()}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Gerar Documento
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Review & Save */}
        {step === 2 && (
          <Card className="flex flex-col h-[80vh]">
            <CardHeader className="border-b pb-4">
              <div className="flex items-center justify-between">
                <CardTitle>2. Revisão do Documento</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar / Editar
                  </Button>
                  <Button onClick={handleSave} disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Salvar no Sistema
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden">
              <ScrollArea className="h-full p-6">
                <div className="prose max-w-none">
                  <ReactMarkdown>{generatedContent}</ReactMarkdown>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <Card className="text-center py-12">
            <CardContent className="space-y-6">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Documento Salvo com Sucesso!</h2>
                <p className="text-gray-500 mt-2">O documento já está disponível na sua lista de documentos.</p>
              </div>
              <div className="flex justify-center gap-4">
                <Button variant="outline" onClick={() => {
                  setStep(1);
                  setGeneratedContent("");
                  setTitle("");
                  setDescription("");
                }}>
                  Criar Novo Documento
                </Button>
                <Button onClick={() => navigate(createPageUrl('Documents'))}>
                  <Eye className="w-4 h-4 mr-2" />
                  Ver Meus Documentos
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}