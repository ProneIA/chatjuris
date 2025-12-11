import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, Sparkles, Trash2, FileText, Download, Copy, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

export default function DocumentGenerator() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  
  // State for Generation
  const [docType, setDocType] = useState("peticao");
  const [title, setTitle] = useState("");
  const [context, setContext] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Auth
  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // QUERY: Fetch My Documents
  // We rely on RLS to filter documents created by the user or shared with them
  const { data: documents = [], isLoading: isLoadingDocs } = useQuery({
    queryKey: ['my-legal-documents'],
    queryFn: async () => {
      // Fetching list - RLS should handle visibility
      return await base44.entities.LegalDocument.list('-created_date');
    },
    enabled: !!user
  });

  // MUTATION: Save Document
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!title) throw new Error("O título é obrigatório");
      if (!generatedContent) throw new Error("Nenhum conteúdo gerado para salvar");

      return await base44.entities.LegalDocument.create({
        title: title,
        type: docType,
        content: generatedContent,
        status: "draft",
        // 'created_by' is automatically set by the backend
        // 'shared_with' defaults to empty
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-legal-documents'] });
      toast.success("Documento salvo com sucesso!");
      // Optional: Clear form or keep it for editing
    },
    onError: (error) => {
      console.error(error);
      toast.error("Erro ao salvar documento. Tente novamente.");
    }
  });

  // MUTATION: Delete Document
  const deleteMutation = useMutation({
    mutationFn: async (id) => await base44.entities.LegalDocument.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-legal-documents'] });
      toast.success("Documento excluído.");
    }
  });

  // Handler: Generate Content
  const handleGenerate = async () => {
    if (!context.trim()) {
      toast.error("Por favor, forneça detalhes do caso.");
      return;
    }

    setIsGenerating(true);
    try {
      const prompt = `
        Atue como um advogado especialista.
        Gere um documento jurídico do tipo: ${docType}.
        Título/Tema: ${title}
        
        Detalhes do caso:
        ${context}
        
        Retorne APENAS o conteúdo do documento em Markdown, formal e completo.
      `;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        add_context_from_internet: true
      });

      setGeneratedContent(response);
      toast.success("Documento gerado! Revise e salve.");
    } catch (error) {
      console.error(error);
      toast.error("Erro na geração IA.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Gerador de Peças Jurídicas</h1>
      </div>

      <Tabs defaultValue="generator">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="generator">Gerador IA</TabsTrigger>
          <TabsTrigger value="documents">Meus Documentos</TabsTrigger>
        </TabsList>

        {/* --- GENERATOR TAB --- */}
        <TabsContent value="generator" className="space-y-6 mt-6">
          <div className="grid lg:grid-cols-2 gap-6">
            
            {/* Left: Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Configuração da Peça</CardTitle>
                <CardDescription>Preencha os dados para a IA redigir o documento.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Tipo de Documento</Label>
                  <Select value={docType} onValueChange={setDocType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="peticao">Petição Inicial</SelectItem>
                      <SelectItem value="contestacao">Contestação</SelectItem>
                      <SelectItem value="recurso">Recurso</SelectItem>
                      <SelectItem value="contrato">Contrato</SelectItem>
                      <SelectItem value="procuracao">Procuração</SelectItem>
                      <SelectItem value="parecer">Parecer Jurídico</SelectItem>
                      <SelectItem value="memorando">Memorando</SelectItem>
                      <SelectItem value="outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Título do Documento</Label>
                  <Input 
                    placeholder="Ex: Ação de Indenização por Danos Morais" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Detalhes do Caso (Fatos, Partes, Pedidos)</Label>
                  <Textarea 
                    placeholder="Descreva o caso detalhadamente..." 
                    className="h-40"
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                  />
                </div>

                <Button 
                  onClick={handleGenerate} 
                  disabled={isGenerating || !context}
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

            {/* Right: Preview & Save */}
            <Card className="flex flex-col h-full min-h-[500px]">
              <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
                <CardTitle>Pré-visualização</CardTitle>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedContent);
                      toast.success("Copiado!");
                    }}
                    disabled={!generatedContent}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button 
                    onClick={() => saveMutation.mutate()} 
                    disabled={!generatedContent || saveMutation.isPending}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Salvar
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-0 overflow-hidden bg-gray-50">
                {generatedContent ? (
                  <div className="h-full overflow-y-auto p-6 prose prose-sm max-w-none">
                    <ReactMarkdown>{generatedContent}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <FileText className="w-12 h-12 mb-2" />
                    <p>O conteúdo gerado aparecerá aqui.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* --- DOCUMENTS LIST TAB --- */}
        <TabsContent value="documents" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Meus Documentos Salvos
                <Button variant="ghost" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ['my-legal-documents'] })}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingDocs ? (
                <div className="py-10 text-center text-gray-500">Carregando documentos...</div>
              ) : documents.length === 0 ? (
                <div className="py-10 text-center text-gray-500">Você ainda não salvou nenhum documento.</div>
              ) : (
                <div className="space-y-4">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg bg-white hover:shadow-sm transition-shadow">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{doc.title}</h3>
                          <p className="text-sm text-gray-500">
                            {new Date(doc.created_date).toLocaleDateString()} • {doc.type}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => {
                            // Load content into generator for editing
                            setGeneratedContent(doc.content);
                            setTitle(doc.title);
                            setDocType(doc.type);
                            toast.info("Documento carregado no editor.");
                            // Switch tab logic could be added here if using controlled Tabs
                          }}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => {
                            if(confirm("Excluir documento permanentemente?")) deleteMutation.mutate(doc.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}