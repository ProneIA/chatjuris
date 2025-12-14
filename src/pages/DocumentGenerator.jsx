import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FileText,
  Sparkles,
  Loader2,
  Download,
  Copy,
  Save,
  Scale,
  Briefcase,
  Heart,
  Building2,
  ShoppingCart,
  Gavel,
  Clock,
  Trash2
} from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { jsPDF } from "jspdf";

const legalAreas = [
  { id: "civil", name: "Cível", icon: Scale, color: "text-blue-600 bg-blue-50", docs: ["Petição Inicial", "Contestação", "Réplica"] },
  { id: "trabalhista", name: "Trabalhista", icon: Briefcase, color: "text-orange-600 bg-orange-50", docs: ["Reclamação Trabalhista", "Contestação"] },
  { id: "criminal", name: "Criminal", icon: Gavel, color: "text-red-600 bg-red-50", docs: ["Habeas Corpus", "Resposta à Acusação"] },
  { id: "familia", name: "Família", icon: Heart, color: "text-pink-600 bg-pink-50", docs: ["Ação de Alimentos", "Divórcio"] },
  { id: "empresarial", name: "Empresarial", icon: Building2, color: "text-purple-600 bg-purple-50", docs: ["Contrato Social", "Acordo de Sócios"] },
  { id: "consumidor", name: "Consumidor", icon: ShoppingCart, color: "text-green-600 bg-green-50", docs: ["Ação Indenizatória", "Reclamação"] }
];

export default function DocumentGenerator() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("generator");
  
  const [step, setStep] = useState(1);
  const [selectedArea, setSelectedArea] = useState(null);
  const [selectedDocType, setSelectedDocType] = useState("");
  const [documentTitle, setDocumentTitle] = useState("");
  const [contextData, setContextData] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: documents = [], refetch } = useQuery({
    queryKey: ['legal-documents', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      // Filtra apenas documentos criados pelo usuário logado
      const all = await base44.entities.LegalDocument.filter({ created_by: user.email }, '-created_date');
      return all;
    },
    enabled: !!user?.email
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!documentTitle.trim() || !generatedContent.trim()) {
        throw new Error("Título e conteúdo são obrigatórios");
      }
      
      return await base44.entities.LegalDocument.create({
        title: documentTitle.trim(),
        type: "outros",
        content: generatedContent,
        status: "draft",
        notes: `Área: ${selectedArea?.name || 'Geral'} - Tipo: ${selectedDocType}`
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['legal-documents'] });
      await refetch();
      setActiveTab("history");
      toast.success("✅ Documento salvo com sucesso!");
    },
    onError: (err) => toast.error(`Erro: ${err.message}`)
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.LegalDocument.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legal-documents'] });
      toast.success("Documento excluído");
    }
  });

  const handleGenerate = async () => {
    if (!contextData.trim()) {
      toast.error("Forneça as informações do documento");
      return;
    }

    setIsGenerating(true);
    try {
      const prompt = `Você é um advogado especialista em Direito ${selectedArea?.name}.

Tarefa: Redigir um(a) "${selectedDocType}" completo e profissional.

Informações: ${contextData}

Use linguagem jurídica formal, cite leis relevantes, estruture adequadamente e use formatação Markdown.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true
      });

      setGeneratedContent(response);
      if (!documentTitle) {
        setDocumentTitle(`${selectedDocType} - ${new Date().toLocaleDateString()}`);
      }
    } catch (error) {
      toast.error("Erro ao gerar documento");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const text = generatedContent.replace(/[#*_`]/g, '');
    const lines = doc.splitTextToSize(text, 180);
    doc.text(lines, 15, 20);
    doc.save(`${documentTitle || 'documento'}.pdf`);
    toast.success("PDF baixado!");
  };

  const handleDownloadWord = () => {
    const text = generatedContent.replace(/[#*_`]/g, '');
    const blob = new Blob(['\ufeff', text], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${documentTitle || 'documento'}.doc`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Word baixado!");
  };

  const reset = () => {
    setStep(1);
    setSelectedArea(null);
    setSelectedDocType("");
    setGeneratedContent("");
    setDocumentTitle("");
    setContextData("");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gerador de Peças Jurídicas</h1>
            <p className="text-gray-500">Crie documentos jurídicos com IA</p>
          </div>
          {step > 1 && <Button variant="outline" onClick={reset}>Novo Documento</Button>}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="generator">Gerador IA</TabsTrigger>
            <TabsTrigger value="history">Meus Documentos ({documents.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="generator" className="mt-6">
            <div className="grid lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 space-y-6">
                {step === 1 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>1. Selecione a Área do Direito</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-3">
                      {legalAreas.map((area) => (
                        <button
                          key={area.id}
                          onClick={() => { setSelectedArea(area); setStep(2); }}
                          className={`p-4 rounded-xl border hover:shadow-md transition-all ${area.color}`}
                        >
                          <area.icon className="w-6 h-6 mx-auto mb-2" />
                          <span className="font-medium">{area.name}</span>
                        </button>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {step === 2 && (
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle>2. Tipo de Documento</CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => setStep(1)}>Voltar</Button>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {selectedArea?.docs.map((doc) => (
                        <button
                          key={doc}
                          onClick={() => { setSelectedDocType(doc); setStep(3); }}
                          className="w-full p-3 text-left rounded-lg border hover:bg-gray-50 transition-colors"
                        >
                          {doc}
                        </button>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {step === 3 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-indigo-600" />
                        {generatedContent ? "Refinar Documento" : "Informações do Caso"}
                      </CardTitle>
                      <CardDescription>
                        {generatedContent ? "Peça ajustes ou correções" : `Descreva os detalhes para: ${selectedDocType}`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Textarea
                        value={contextData}
                        onChange={(e) => setContextData(e.target.value)}
                        placeholder="Ex: Cliente João Silva, CPF..., contra Empresa X..."
                        className="min-h-[150px]"
                      />
                      <Button onClick={handleGenerate} disabled={isGenerating} className="w-full h-12 bg-indigo-600">
                        {isGenerating ? (
                          <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Gerando...</>
                        ) : (
                          <><Sparkles className="w-5 h-5 mr-2" />Gerar Documento</>
                        )}
                      </Button>
                      <Button variant="ghost" onClick={() => setStep(2)} className="w-full">
                        Voltar
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="lg:col-span-7">
                {generatedContent ? (
                  <Card className="h-full">
                    <div className="p-4 border-b flex items-center justify-between gap-4">
                      <Input
                        value={documentTitle}
                        onChange={(e) => setDocumentTitle(e.target.value)}
                        placeholder="Título do Documento"
                        className="font-semibold"
                      />
                      <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={() => {
                          navigator.clipboard.writeText(generatedContent);
                          toast.success("Copiado!");
                        }}>
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                          <Download className="w-4 h-4 mr-1" />PDF
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleDownloadWord}>
                          <Download className="w-4 h-4 mr-1" />Word
                        </Button>
                        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="bg-green-600">
                          {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-2" />Salvar</>}
                        </Button>
                      </div>
                    </div>
                    <ScrollArea className="p-6 h-[600px]">
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown>{generatedContent}</ReactMarkdown>
                      </div>
                    </ScrollArea>
                  </Card>
                ) : (
                  <div className="h-full min-h-[400px] flex flex-col items-center justify-center border-2 border-dashed rounded-xl text-center p-8">
                    <FileText className="w-16 h-16 text-gray-300 mb-4" />
                    <h3 className="text-xl font-medium mb-2">Aguardando Geração</h3>
                    <p className="text-gray-500">Preencha os dados ao lado para começar</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Meus Documentos Salvos</CardTitle>
                <CardDescription>Total: {documents.length} documento(s)</CardDescription>
              </CardHeader>
              <CardContent>
                {documents.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>Nenhum documento salvo ainda</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {documents.map((doc) => (
                      <Card key={doc.id} className="hover:shadow-md transition-shadow border-l-4 border-l-indigo-500">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold line-clamp-1">{doc.title}</h3>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-red-400"
                              onClick={() => {
                                if (confirm("Excluir este documento?")) deleteMutation.mutate(doc.id);
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                          <p className="text-xs text-gray-500 mb-4 line-clamp-2">{doc.notes || "Sem descrição"}</p>
                          <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(doc.created_date).toLocaleDateString()}
                            </span>
                          </div>
                          <Button
                            variant="secondary"
                            className="w-full text-xs h-8"
                            onClick={() => {
                              setGeneratedContent(doc.content);
                              setDocumentTitle(doc.title);
                              setStep(3);
                              setSelectedArea(legalAreas[0]);
                              setSelectedDocType("Documento Carregado");
                              setActiveTab("generator");
                            }}
                          >
                            Abrir / Editar
                          </Button>
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