import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Save, Sparkles, FileText, Trash2, Copy, Download, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

const DOCUMENT_TYPES = [
  { value: "peticao", label: "Petição Inicial" },
  { value: "contestacao", label: "Contestação" },
  { value: "recurso", label: "Recurso" },
  { value: "contrato", label: "Contrato" },
  { value: "procuracao", label: "Procuração" },
  { value: "parecer", label: "Parecer Jurídico" },
  { value: "memorando", label: "Memorando" },
  { value: "notificacao", label: "Notificação Extrajudicial" },
  { value: "outros", label: "Outros" },
];

export default function DocumentGenerator() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("generator");

  // Generator State
  const [docType, setDocType] = useState("peticao");
  const [title, setTitle] = useState("");
  const [context, setContext] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Auth Check
  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Fetch Documents
  const { data: documents = [], isLoading: isLoadingDocs } = useQuery({
    queryKey: ['my-documents', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      // Explicitly fetch documents created by the user to ensure visibility
      return await base44.entities.LegalDocument.filter({ created_by: user.email }, '-created_date');
    },
    enabled: !!user?.email
  });

  // Create/Save Document Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!title.trim() || !generatedContent.trim()) {
        throw new Error("Título e conteúdo são obrigatórios");
      }
      
      return await base44.entities.LegalDocument.create({
        title: title,
        type: docType,
        content: generatedContent,
        status: "draft",
        notes: "Gerado via IA",
        // 'created_by' is set automatically by the backend system
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-documents'] });
      toast.success("Documento salvo com sucesso!");
      setActiveTab("list");
      // Optional: Clear form
      // setGeneratedContent("");
      // setTitle("");
      // setContext("");
    },
    onError: (error) => {
      console.error(error);
      toast.error("Erro ao salvar documento.");
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => await base44.entities.LegalDocument.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-documents'] });
      toast.success("Documento excluído.");
    }
  });

  const handleGenerate = async () => {
    if (!context.trim()) {
      toast.error("Por favor, descreva o caso ou o documento.");
      return;
    }

    setIsGenerating(true);
    try {
      const prompt = `
      Você é um assistente jurídico sênior.
      Tarefa: Redigir um documento do tipo "${docType}".
      Título/Assunto: "${title}".
      Contexto/Detalhes: "${context}".
      
      Diretrizes:
      - Use linguagem jurídica formal (PT-BR).
      - Estruture corretamente (Qualificação, Fatos, Direito, Pedidos, etc.).
      - Use Markdown para formatação.
      - Retorne APENAS o conteúdo do documento.
      `;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        add_context_from_internet: true
      });

      setGeneratedContent(response);
      toast.success("Documento gerado!");
    } catch (error) {
      console.error(error);
      toast.error("Erro na geração. Tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Gerador de Peças Jurídicas</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
            <TabsTrigger value="generator">Novo Documento</TabsTrigger>
            <TabsTrigger value="list">Meus Documentos</TabsTrigger>
          </TabsList>

          {/* GENERATOR TAB */}
          <TabsContent value="generator" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              
              {/* Input Section */}
              <Card className="h-fit">
                <CardHeader>
                  <CardTitle>Configuração</CardTitle>
                  <CardDescription>Defina os parâmetros para a IA gerar sua peça.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tipo de Peça</label>
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
                    <label className="text-sm font-medium">Título do Documento</label>
                    <Input 
                      placeholder="Ex: Ação de Cobrança - Silva vs Souza" 
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Fatos e Contexto</label>
                    <Textarea 
                      placeholder="Descreva os fatos, partes envolvidas, valores e fundamentos jurídicos desejados..."
                      className="min-h-[200px]"
                      value={context}
                      onChange={(e) => setContext(e.target.value)}
                    />
                  </div>

                  <Button 
                    onClick={handleGenerate} 
                    disabled={isGenerating || !context.trim()}
                    className="w-full"
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

              {/* Preview Section */}
              <Card className="flex flex-col h-[800px]">
                <CardHeader className="flex flex-row items-center justify-between py-4 border-b">
                  <CardTitle>Pré-visualização</CardTitle>
                  <div className="flex gap-2">
                    {generatedContent && (
                      <>
                         <Button variant="outline" size="icon" onClick={() => {
                            navigator.clipboard.writeText(generatedContent);
                            toast.success("Copiado!");
                          }}>
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button 
                          onClick={() => saveMutation.mutate()} 
                          disabled={saveMutation.isPending}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                          Salvar
                        </Button>
                      </>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-1 p-0 overflow-hidden bg-white">
                  <ScrollArea className="h-full p-6">
                    {generatedContent ? (
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown>{generatedContent}</ReactMarkdown>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <FileText className="w-16 h-16 mb-4 opacity-20" />
                        <p>O documento gerado aparecerá aqui.</p>
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* LIST TAB */}
          <TabsContent value="list">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Meus Documentos Salvos</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => queryClient.invalidateQueries(['my-documents'])}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Atualizar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingDocs ? (
                  <div className="text-center py-12">Carregando...</div>
                ) : documents.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 border-2 border-dashed rounded-lg">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>Você ainda não tem documentos salvos.</p>
                    <Button variant="link" onClick={() => setActiveTab("generator")}>
                      Criar meu primeiro documento
                    </Button>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {documents.map((doc) => (
                      <Card key={doc.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-base line-clamp-1" title={doc.title}>
                              {doc.title || "Sem título"}
                            </CardTitle>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 text-red-400 hover:text-red-600 -mr-2 -mt-2"
                              onClick={() => {
                                if(confirm("Excluir documento?")) deleteMutation.mutate(doc.id);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <CardDescription className="text-xs">
                            {new Date(doc.created_date).toLocaleDateString()} • {doc.type}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-500 line-clamp-3 mb-4 min-h-[60px]">
                            {doc.content}
                          </p>
                          <div className="flex gap-2">
                            <Button 
                              variant="secondary" 
                              className="w-full text-xs"
                              onClick={() => {
                                setGeneratedContent(doc.content);
                                setTitle(doc.title);
                                setDocType(doc.type || "peticao");
                                setActiveTab("generator");
                              }}
                            >
                              Abrir / Editar
                            </Button>
                            <Button 
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                const blob = new Blob([doc.content], { type: 'text/plain' });
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `${doc.title}.txt`;
                                a.click();
                              }}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}