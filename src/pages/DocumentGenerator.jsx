import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  FileSearch,
  Clock,
  CheckCircle2,
  AlertCircle,
  History,
  Trash2
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { jsPDF } from "jspdf";

// Configuração das Áreas e Documentos
const legalAreas = [
  { 
    id: "civil", 
    name: "Cível", 
    icon: Scale, 
    color: "text-blue-600 bg-blue-50 border-blue-200",
    docs: ["Petição Inicial", "Contestação", "Réplica", "Recurso de Apelação", "Agravo de Instrumento", "Embargos de Declaração", "Contrato de Prestação de Serviços", "Notificação Extrajudicial"] 
  },
  { 
    id: "trabalhista", 
    name: "Trabalhista", 
    icon: Briefcase, 
    color: "text-orange-600 bg-orange-50 border-orange-200",
    docs: ["Reclamação Trabalhista", "Contestação Trabalhista", "Recurso Ordinário", "Acordo Extrajudicial", "Contrato de Trabalho"] 
  },
  { 
    id: "criminal", 
    name: "Criminal", 
    icon: Gavel, 
    color: "text-red-600 bg-red-50 border-red-200",
    docs: ["Habeas Corpus", "Resposta à Acusação", "Pedido de Liberdade Provisória", "Alegações Finais", "Apelação Criminal"] 
  },
  { 
    id: "familia", 
    name: "Família", 
    icon: Heart, 
    color: "text-pink-600 bg-pink-50 border-pink-200",
    docs: ["Ação de Alimentos", "Divórcio Consensual", "Divórcio Litigioso", "Regulamentação de Guarda", "Investigação de Paternidade"] 
  },
  { 
    id: "empresarial", 
    name: "Empresarial", 
    icon: Building2, 
    color: "text-purple-600 bg-purple-50 border-purple-200",
    docs: ["Contrato Social", "Acordo de Sócios", "Alteração Contratual", "Memorando de Entendimento (MoU)"] 
  },
  { 
    id: "consumidor", 
    name: "Consumidor", 
    icon: ShoppingCart, 
    color: "text-green-600 bg-green-50 border-green-200",
    docs: ["Ação Indenizatória", "Reclamação Procon", "Defesa do Fornecedor"] 
  },
];

export default function DocumentGenerator() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("generator");
  
  // Estado do Formulário
  const [step, setStep] = useState(1);
  const [selectedArea, setSelectedArea] = useState(null);
  const [selectedDocType, setSelectedDocType] = useState(null);
  const [documentTitle, setDocumentTitle] = useState("");
  const [contextData, setContextData] = useState("");
  
  // Estado da Geração
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const [conversationHistory, setConversationHistory] = useState([]);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Buscar documentos gerados pelo usuário
  const { data: myDocuments = [], refetch: refetchDocs } = useQuery({
    queryKey: ['my-generated-documents', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      // Fetch all documents and filter by current user
      const allDocs = await base44.entities.LegalDocument.list('-created_date');
      return allDocs.filter(doc => doc.created_by === user.email);
    },
    enabled: !!user?.email
  });

  // Mutação para salvar documento
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!documentTitle || !generatedContent) throw new Error("Dados incompletos");
      
      const docData = {
        title: documentTitle.trim(),
        type: "outros",
        content: generatedContent,
        status: "draft",
        notes: `Gerado via IA - Área: ${selectedArea?.name || 'Geral'} - Tipo: ${selectedDocType}`
      };
      
      console.log("=== SALVANDO DOCUMENTO ===");
      console.log("Dados:", docData);
      console.log("Usuário:", user?.email);
      
      const result = await base44.entities.LegalDocument.create(docData);
      
      console.log("=== DOCUMENTO CRIADO ===");
      console.log("Resultado:", result);
      console.log("ID:", result?.id);
      
      return result;
    },
    onSuccess: async (data) => {
      console.log("=== SUCCESS CALLBACK ===");
      console.log("Documento ID:", data?.id);
      
      // Invalidate and wait
      await queryClient.invalidateQueries({ queryKey: ['my-generated-documents'] });
      
      // Force refetch
      const refetched = await refetchDocs();
      console.log("Documentos após refetch:", refetched.data);
      
      // Switch to history tab
      setActiveTab("history");
      
      toast.success("✅ Documento salvo! Veja na aba 'Meus Documentos Salvos'.");
    },
    onError: (err) => {
      console.error("=== ERRO AO SALVAR ===");
      console.error(err);
      toast.error(`❌ Erro: ${err.message || 'Tente novamente'}`);
    }
  });

  // Mutação para excluir documento
  const deleteMutation = useMutation({
    mutationFn: async (id) => await base44.entities.LegalDocument.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-generated-documents'] });
      toast.success("Documento excluído.");
    }
  });

  const handleGenerate = async () => {
    if (!contextData.trim() && !generatedContent) {
      toast.error("Por favor, forneça as informações para o documento.");
      return;
    }

    setIsGenerating(true);

    try {
      const isRefining = !!generatedContent;
      const currentPrompt = contextData;
      
      let systemPrompt = "";
      
      if (isRefining) {
        systemPrompt = `Você é um advogado especialista.
        
DOCUMENTO ATUAL:
${generatedContent}

SOLICITAÇÃO DE ALTERAÇÃO:
${currentPrompt}

TAREFA: Reescreva o documento incorporando as alterações solicitadas. Mantenha a formatação Markdown. Retorne APENAS o documento atualizado.`;
      } else {
        systemPrompt = `Você é um advogado especialista em Direito ${selectedArea?.name || 'Brasileiro'}.
        
TAREFA: Redigir um(a) ${selectedDocType} completo(a) e profissional.

INFORMAÇÕES DO CASO:
${currentPrompt}

DIRETRIZES:
1. Use linguagem jurídica formal e técnica.
2. Estruture com qualificação, fatos, direito, pedidos e fechamento.
3. Cite leis e artigos pertinentes (CF, CC, CPC, CLT, etc).
4. Use formatação Markdown (títulos #, negrito **, listas -).
5. Deixe espaços como [COMPLETAR] para dados faltantes.

Retorne APENAS o conteúdo do documento.`;
      }

      // Adicionar ao histórico local
      const newHistory = [...conversationHistory, { role: 'user', content: currentPrompt }];
      setConversationHistory(newHistory);

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: systemPrompt,
        add_context_from_internet: !isRefining
      });

      setGeneratedContent(response);
      setContextData(""); // Limpa o input
      
      // Se for a primeira vez, sugere um título
      if (!documentTitle) {
        setDocumentTitle(`${selectedDocType} - ${new Date().toLocaleDateString()}`);
      }

    } catch (error) {
      console.error(error);
      toast.error("Erro na geração. Tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  const resetGenerator = () => {
    setStep(1);
    setSelectedArea(null);
    setSelectedDocType(null);
    setGeneratedContent("");
    setDocumentTitle("");
    setContextData("");
    setConversationHistory([]);
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    
    // Convert markdown to plain text (simple version)
    const plainText = generatedContent.replace(/[#*_`]/g, '');
    
    doc.setFontSize(12);
    const lines = doc.splitTextToSize(plainText, 180);
    doc.text(lines, 15, 20);
    
    doc.save(`${documentTitle || 'documento'}.pdf`);
    toast.success("PDF baixado!");
  };

  const handleDownloadWord = () => {
    // Convert markdown to plain text for DOCX
    const plainText = generatedContent.replace(/[#*_`]/g, '');
    
    const blob = new Blob(
      ['\ufeff', plainText], // UTF-8 BOM + content
      { type: 'application/msword;charset=utf-8' }
    );
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${documentTitle || 'documento'}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("Word baixado!");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gerador de Peças Jurídicas</h1>
            <p className="text-gray-500">Crie, edite e salve documentos jurídicos com Inteligência Artificial</p>
          </div>
          {step > 1 && (
            <Button variant="outline" onClick={resetGenerator}>
              Novo Documento
            </Button>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="generator">Gerador IA</TabsTrigger>
            <TabsTrigger value="history">Meus Documentos Salvos ({myDocuments.length})</TabsTrigger>
          </TabsList>

          {/* TAB GERADOR */}
          <TabsContent value="generator" className="mt-6">
            <div className="grid lg:grid-cols-12 gap-6">
              
              {/* Coluna da Esquerda: Configuração e Chat */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Passo 1: Seleção de Área */}
                {step === 1 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>1. Selecione a Área do Direito</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-3">
                      {legalAreas.map((area) => (
                        <button
                          key={area.id}
                          onClick={() => {
                            setSelectedArea(area);
                            setStep(2);
                          }}
                          className={`p-4 rounded-xl border text-left transition-all hover:shadow-md flex flex-col items-center justify-center gap-2 ${area.color}`}
                        >
                          <area.icon className="w-6 h-6" />
                          <span className="font-medium">{area.name}</span>
                        </button>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Passo 2: Tipo de Documento */}
                {step === 2 && (
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle>2. Tipo de Peça ({selectedArea?.name})</CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => setStep(1)}>Voltar</Button>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {selectedArea?.docs.map((doc, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setSelectedDocType(doc);
                            setStep(3);
                          }}
                          className="w-full p-3 text-left rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors flex items-center justify-between group"
                        >
                          <span>{doc}</span>
                          <CheckCircle2 className="w-4 h-4 text-gray-300 group-hover:text-green-500 opacity-0 group-hover:opacity-100 transition-all" />
                        </button>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Passo 3: Input de Dados (Chat) */}
                {step === 3 && (
                  <Card className="h-full border-indigo-100 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-indigo-600" />
                        {generatedContent ? "Refinar Documento" : "Dados do Documento"}
                      </CardTitle>
                      <CardDescription>
                        {generatedContent 
                          ? "Peça ajustes, correções ou adicione novas informações." 
                          : `Descreva os fatos, partes e detalhes para gerar: ${selectedDocType}`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Textarea
                        value={contextData}
                        onChange={(e) => setContextData(e.target.value)}
                        placeholder={generatedContent 
                          ? "Ex: Adicione um tópico sobre danos morais..." 
                          : "Ex: Cliente João Silva, CPF..., contra Empresa X, motivo: cobrança indevida de R$ 500,00..."}
                        className="min-h-[150px] text-base p-4 resize-none focus-visible:ring-indigo-500"
                      />
                      
                      <Button 
                        onClick={handleGenerate} 
                        disabled={isGenerating || !contextData.trim()}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-12 text-lg"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            {generatedContent ? "Atualizando..." : "Gerando..."}
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-5 h-5 mr-2" />
                            {generatedContent ? "Atualizar Documento" : "Gerar Documento"}
                          </>
                        )}
                      </Button>
                      
                      <Button variant="ghost" onClick={() => setStep(2)} className="w-full text-gray-500">
                        Voltar / Trocar Tipo
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Coluna da Direita: Preview e Ações */}
              <div className="lg:col-span-7">
                {generatedContent ? (
                  <Card className="h-full flex flex-col border-indigo-200 shadow-md overflow-hidden">
                    <div className="p-4 border-b bg-gray-50 flex items-center justify-between gap-4">
                      <Input
                        value={documentTitle}
                        onChange={(e) => setDocumentTitle(e.target.value)}
                        placeholder="Título do Documento"
                        className="font-semibold bg-white border-gray-300"
                      />
                      <div className="flex items-center gap-2 shrink-0">
                        <Button variant="outline" size="sm" onClick={() => {
                          navigator.clipboard.writeText(generatedContent);
                          toast.success("Copiado!");
                        }} title="Copiar">
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline"
                          size="sm"
                          onClick={handleDownloadPDF}
                          title="Baixar PDF"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          PDF
                        </Button>
                        <Button 
                          variant="outline"
                          size="sm"
                          onClick={handleDownloadWord}
                          title="Baixar Word"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Word
                        </Button>
                        <Button 
                          onClick={() => saveMutation.mutate()} 
                          disabled={saveMutation.isPending}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                          Salvar
                        </Button>
                      </div>
                    </div>
                    
                    <ScrollArea className="flex-1 bg-white p-6 h-[600px]">
                      <div className="prose prose-sm max-w-none prose-headings:text-gray-800 prose-p:text-gray-700">
                        <ReactMarkdown>{generatedContent}</ReactMarkdown>
                      </div>
                    </ScrollArea>
                  </Card>
                ) : (
                  <div className="h-full min-h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50 text-center p-8">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                      <FileText className="w-10 h-10 text-gray-300" />
                    </div>
                    <h3 className="text-xl font-medium text-gray-900 mb-2">Aguardando Geração</h3>
                    <p className="text-gray-500 max-w-sm">
                      Selecione a área, o tipo de documento e forneça as informações ao lado para começar.
                    </p>
                  </div>
                )}
              </div>

            </div>
          </TabsContent>

          {/* TAB MEUS DOCUMENTOS */}
          <TabsContent value="history" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Meus Documentos Salvos</CardTitle>
                <CardDescription>
                  Histórico de todas as peças jurídicas geradas e salvas por você.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 text-sm text-gray-600">
                  Total: {myDocuments.length} documento{myDocuments.length !== 1 ? 's' : ''} salvo{myDocuments.length !== 1 ? 's' : ''}
                </div>
                {myDocuments.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <History className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>Nenhum documento salvo ainda.</p>
                    <p className="text-xs mt-2">Gere e salve um documento para vê-lo aqui.</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {myDocuments.map((doc) => (
                      <Card key={doc.id} className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-indigo-500">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-gray-800 line-clamp-1">{doc.title}</h3>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 text-red-400 hover:text-red-600 -mr-2 -mt-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                if(confirm("Excluir este documento permanentemente?")) deleteMutation.mutate(doc.id);
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                          <p className="text-xs text-gray-500 mb-4 line-clamp-2">
                            {doc.notes || "Sem descrição"}
                          </p>
                          <div className="flex items-center justify-between text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(doc.created_date).toLocaleDateString()}
                            </span>
                            <Badge variant="outline">{doc.type}</Badge>
                          </div>
                          <Button 
                            variant="secondary" 
                            className="w-full mt-4 text-xs h-8"
                            onClick={() => {
                              setGeneratedContent(doc.content);
                              setDocumentTitle(doc.title);
                              setStep(3); // Vai para o modo edição
                              // Tenta inferir área/tipo das notas ou define genérico
                              setSelectedArea(legalAreas[0]); 
                              setSelectedDocType("Documento Carregado");
                              document.querySelector('[value="generator"]').click(); // Muda a tab
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

function Badge({ children, variant }) {
  return <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] uppercase font-bold">{children}</span>;
}