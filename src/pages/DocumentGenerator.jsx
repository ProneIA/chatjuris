import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Trash2,
  Clock
} from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { jsPDF } from "jspdf";

const legalAreas = [
  { id: "civil", name: "Cível", icon: Scale, color: "bg-blue-50 border-blue-200 text-blue-700" },
  { id: "trabalhista", name: "Trabalhista", icon: Briefcase, color: "bg-orange-50 border-orange-200 text-orange-700" },
  { id: "criminal", name: "Criminal", icon: Gavel, color: "bg-red-50 border-red-200 text-red-700" },
  { id: "familia", name: "Família", icon: Heart, color: "bg-pink-50 border-pink-200 text-pink-700" },
  { id: "empresarial", name: "Empresarial", icon: Building2, color: "bg-purple-50 border-purple-200 text-purple-700" },
  { id: "consumidor", name: "Consumidor", icon: ShoppingCart, color: "bg-green-50 border-green-200 text-green-700" },
];

const docTypes = {
  civil: ["Petição Inicial", "Contestação", "Réplica", "Recurso de Apelação"],
  trabalhista: ["Reclamação Trabalhista", "Contestação Trabalhista", "Recurso Ordinário"],
  criminal: ["Habeas Corpus", "Resposta à Acusação", "Alegações Finais"],
  familia: ["Ação de Alimentos", "Divórcio Consensual", "Regulamentação de Guarda"],
  empresarial: ["Contrato Social", "Acordo de Sócios", "Alteração Contratual"],
  consumidor: ["Ação Indenizatória", "Reclamação", "Defesa do Fornecedor"],
};

export default function DocumentGenerator() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("generator");
  
  const [selectedArea, setSelectedArea] = useState(null);
  const [selectedDocType, setSelectedDocType] = useState("");
  const [title, setTitle] = useState("");
  const [context, setContext] = useState("");
  const [content, setContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: documents = [], refetch } = useQuery({
    queryKey: ['legal-documents'],
    queryFn: async () => {
      const docs = await base44.entities.LegalDocument.list('-created_date');
      console.log("📄 Documentos carregados:", docs.length);
      return docs;
    },
    enabled: !!user
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!title.trim() || !content.trim()) {
        throw new Error("Título e conteúdo são obrigatórios");
      }
      
      console.log("💾 Salvando documento...");
      const doc = await base44.entities.LegalDocument.create({
        title: title.trim(),
        type: "outros",
        content: content,
        status: "draft",
        notes: `Área: ${selectedArea?.name || 'Geral'} | Tipo: ${selectedDocType || 'N/A'}`
      });
      console.log("✅ Documento salvo:", doc.id);
      return doc;
    },
    onSuccess: async () => {
      await refetch();
      setActiveTab("saved");
      toast.success("✅ Documento salvo com sucesso!");
    },
    onError: (e) => {
      console.error("❌ Erro ao salvar:", e);
      toast.error("Erro ao salvar documento");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.LegalDocument.delete(id),
    onSuccess: () => {
      refetch();
      toast.success("Documento excluído");
    }
  });

  const generate = async () => {
    if (!context.trim()) {
      toast.error("Forneça as informações do documento");
      return;
    }

    setIsGenerating(true);
    try {
      const prompt = `Você é um advogado especialista. Redija um ${selectedDocType} na área de ${selectedArea?.name}.

Informações:
${context}

Retorne um documento jurídico completo, bem estruturado, com linguagem técnica e citações legais pertinentes. Use formatação Markdown.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true
      });

      setContent(result);
      if (!title) {
        setTitle(`${selectedDocType} - ${new Date().toLocaleDateString()}`);
      }
      toast.success("Documento gerado!");
    } catch (e) {
      console.error(e);
      toast.error("Erro ao gerar documento");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    const text = content.replace(/[#*_`]/g, '');
    doc.text(doc.splitTextToSize(text, 180), 15, 20);
    doc.save(`${title || 'documento'}.pdf`);
    toast.success("PDF baixado!");
  };

  const downloadWord = () => {
    const text = content.replace(/[#*_`]/g, '');
    const blob = new Blob(['\ufeff', text], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'documento'}.doc`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Word baixado!");
  };

  const reset = () => {
    setSelectedArea(null);
    setSelectedDocType("");
    setTitle("");
    setContext("");
    setContent("");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gerador de Documentos Jurídicos</h1>
            <p className="text-gray-500">Crie documentos profissionais com IA</p>
          </div>
          {content && (
            <Button variant="outline" onClick={reset}>
              Novo Documento
            </Button>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="generator">Gerador IA</TabsTrigger>
            <TabsTrigger value="saved">Salvos ({documents.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="generator" className="mt-6">
            <div className="grid lg:grid-cols-12 gap-6">
              
              {/* Left Panel */}
              <div className="lg:col-span-5 space-y-4">
                {/* Area Selection */}
                {!selectedArea && (
                  <Card>
                    <CardHeader>
                      <CardTitle>1. Selecione a Área</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-3">
                      {legalAreas.map((area) => (
                        <button
                          key={area.id}
                          onClick={() => setSelectedArea(area)}
                          className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 hover:shadow-md transition ${area.color}`}
                        >
                          <area.icon className="w-6 h-6" />
                          <span className="font-medium">{area.name}</span>
                        </button>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Doc Type */}
                {selectedArea && !selectedDocType && (
                  <Card>
                    <CardHeader className="flex flex-row justify-between items-center">
                      <CardTitle>2. Tipo de Documento</CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedArea(null)}>
                        Voltar
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {docTypes[selectedArea.id].map((type) => (
                        <button
                          key={type}
                          onClick={() => setSelectedDocType(type)}
                          className="w-full p-3 text-left rounded-lg border hover:bg-gray-50"
                        >
                          {type}
                        </button>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Context Input */}
                {selectedDocType && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-indigo-600" />
                        {content ? "Refinar" : "Informações"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Textarea
                        value={context}
                        onChange={(e) => setContext(e.target.value)}
                        placeholder="Descreva as partes, fatos e detalhes do caso..."
                        className="min-h-[150px]"
                      />
                      <Button
                        onClick={generate}
                        disabled={isGenerating}
                        className="w-full h-12 bg-indigo-600 hover:bg-indigo-700"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Gerando...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-5 h-5 mr-2" />
                            {content ? "Atualizar" : "Gerar"}
                          </>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => setSelectedDocType("")}
                        className="w-full"
                      >
                        Voltar
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Right Panel - Preview */}
              <div className="lg:col-span-7">
                {content ? (
                  <Card className="h-full">
                    <div className="p-4 border-b flex items-center gap-4">
                      <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Título do Documento"
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          navigator.clipboard.writeText(content);
                          toast.success("Copiado!");
                        }}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={downloadPDF}>
                        <Download className="w-4 h-4 mr-1" />
                        PDF
                      </Button>
                      <Button variant="outline" size="sm" onClick={downloadWord}>
                        <Download className="w-4 h-4 mr-1" />
                        Word
                      </Button>
                      <Button
                        onClick={() => saveMutation.mutate()}
                        disabled={saveMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {saveMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Salvar
                          </>
                        )}
                      </Button>
                    </div>
                    <ScrollArea className="h-[600px] p-6">
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown>{content}</ReactMarkdown>
                      </div>
                    </ScrollArea>
                  </Card>
                ) : (
                  <div className="h-[500px] flex flex-col items-center justify-center border-2 border-dashed rounded-xl">
                    <FileText className="w-16 h-16 text-gray-300 mb-4" />
                    <p className="text-gray-500">Selecione área e tipo para começar</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="saved" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Documentos Salvos</CardTitle>
              </CardHeader>
              <CardContent>
                {documents.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>Nenhum documento salvo</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-3 gap-4">
                    {documents.map((doc) => (
                      <Card key={doc.id} className="border-l-4 border-l-indigo-500">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold line-clamp-1">{doc.title}</h3>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 -mr-2"
                              onClick={() => {
                                if (confirm("Excluir?")) deleteMutation.mutate(doc.id);
                              }}
                            >
                              <Trash2 className="w-3 h-3 text-red-500" />
                            </Button>
                          </div>
                          <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                            {doc.notes || "Sem notas"}
                          </p>
                          <div className="flex items-center text-xs text-gray-400 mb-3">
                            <Clock className="w-3 h-3 mr-1" />
                            {new Date(doc.created_date).toLocaleDateString()}
                          </div>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="w-full"
                            onClick={() => {
                              setContent(doc.content);
                              setTitle(doc.title);
                              setActiveTab("generator");
                            }}
                          >
                            Abrir
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