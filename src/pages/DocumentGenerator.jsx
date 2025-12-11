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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FileText,
  Sparkles,
  Loader2,
  Download,
  Copy,
  Save,
  CheckCircle,
  Scale,
  Users,
  Briefcase,
  Heart,
  Building2,
  ShoppingCart,
  Gavel,
  FileSearch,
  Clock,
  ChevronRight,
  FolderOpen,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import LoadingSpinner from "@/components/common/LoadingSpinner";

// Categorias de peças jurídicas por área
const legalAreas = {
  civil: {
    name: "Direito Civil",
    icon: Scale,
    color: "blue",
    documents: [
      { id: "peticao_inicial_civil", name: "Petição Inicial", description: "Ação cível comum" },
      { id: "contestacao_civil", name: "Contestação", description: "Defesa em ação cível" },
      { id: "replica_civil", name: "Réplica", description: "Resposta à contestação" },
      { id: "alegacoes_finais_civil", name: "Alegações Finais", description: "Memoriais" },
      { id: "recurso_apelacao_civil", name: "Apelação", description: "Recurso de apelação" },
      { id: "agravo_instrumento", name: "Agravo de Instrumento", description: "Recurso contra decisão interlocutória" },
      { id: "embargos_declaracao", name: "Embargos de Declaração", description: "Esclarecimento de decisão" },
      { id: "execucao_titulo", name: "Execução de Título", description: "Cumprimento de sentença" },
      { id: "contrato_civil", name: "Contrato", description: "Contratos diversos" },
      { id: "notificacao_extrajudicial", name: "Notificação Extrajudicial", description: "Comunicação formal" },
    ]
  },
  trabalhista: {
    name: "Direito Trabalhista",
    icon: Briefcase,
    color: "orange",
    documents: [
      { id: "reclamacao_trabalhista", name: "Reclamação Trabalhista", description: "Ação trabalhista" },
      { id: "contestacao_trabalhista", name: "Contestação Trabalhista", description: "Defesa do empregador" },
      { id: "recurso_ordinario", name: "Recurso Ordinário", description: "Recurso ao TRT" },
      { id: "recurso_revista", name: "Recurso de Revista", description: "Recurso ao TST" },
      { id: "acordo_trabalhista", name: "Acordo Trabalhista", description: "Termo de acordo" },
      { id: "calculo_trabalhista", name: "Cálculo de Verbas", description: "Memória de cálculo" },
      { id: "impugnacao_calculo", name: "Impugnação de Cálculos", description: "Contestar valores" },
      { id: "mandado_seguranca_trab", name: "Mandado de Segurança", description: "Direito líquido e certo" },
    ]
  },
  criminal: {
    name: "Direito Criminal",
    icon: Gavel,
    color: "red",
    documents: [
      { id: "denuncia_crime", name: "Denúncia/Queixa-Crime", description: "Peça acusatória" },
      { id: "defesa_previa", name: "Defesa Prévia", description: "Resposta à acusação" },
      { id: "alegacoes_finais_crime", name: "Alegações Finais", description: "Memoriais criminais" },
      { id: "habeas_corpus", name: "Habeas Corpus", description: "Liberdade de locomoção" },
      { id: "apelacao_criminal", name: "Apelação Criminal", description: "Recurso criminal" },
      { id: "revisao_criminal", name: "Revisão Criminal", description: "Revisão de sentença" },
      { id: "liberdade_provisoria", name: "Liberdade Provisória", description: "Pedido de soltura" },
      { id: "relaxamento_prisao", name: "Relaxamento de Prisão", description: "Prisão ilegal" },
    ]
  },
  familia: {
    name: "Direito de Família",
    icon: Heart,
    color: "pink",
    documents: [
      { id: "divorcio_consensual", name: "Divórcio Consensual", description: "Separação amigável" },
      { id: "divorcio_litigioso", name: "Divórcio Litigioso", description: "Separação judicial" },
      { id: "guarda_filhos", name: "Guarda de Filhos", description: "Regulamentação de guarda" },
      { id: "alimentos", name: "Ação de Alimentos", description: "Pensão alimentícia" },
      { id: "revisao_alimentos", name: "Revisão de Alimentos", description: "Alterar pensão" },
      { id: "investigacao_paternidade", name: "Investigação de Paternidade", description: "Reconhecimento" },
      { id: "inventario", name: "Inventário", description: "Partilha de bens" },
      { id: "tutela_curatela", name: "Tutela/Curatela", description: "Representação legal" },
    ]
  },
  empresarial: {
    name: "Direito Empresarial",
    icon: Building2,
    color: "purple",
    documents: [
      { id: "contrato_social", name: "Contrato Social", description: "Constituição de empresa" },
      { id: "alteracao_contratual", name: "Alteração Contratual", description: "Modificação societária" },
      { id: "recuperacao_judicial", name: "Recuperação Judicial", description: "Reestruturação" },
      { id: "falencia", name: "Pedido de Falência", description: "Insolvência" },
      { id: "acordo_socios", name: "Acordo de Sócios", description: "Pacto societário" },
      { id: "due_diligence", name: "Due Diligence", description: "Análise empresarial" },
      { id: "fusao_aquisicao", name: "Fusão/Aquisição", description: "M&A" },
    ]
  },
  consumidor: {
    name: "Direito do Consumidor",
    icon: ShoppingCart,
    color: "green",
    documents: [
      { id: "acao_consumidor", name: "Ação Consumerista", description: "Defesa do consumidor" },
      { id: "reclamacao_procon", name: "Reclamação PROCON", description: "Via administrativa" },
      { id: "acao_coletiva", name: "Ação Coletiva", description: "Direitos difusos" },
      { id: "indenizacao_consumo", name: "Indenização", description: "Danos ao consumidor" },
      { id: "defesa_fornecedor", name: "Defesa do Fornecedor", description: "Contestação" },
    ]
  },
  tributario: {
    name: "Direito Tributário",
    icon: FileSearch,
    color: "amber",
    documents: [
      { id: "mandado_seguranca_trib", name: "Mandado de Segurança", description: "Tributo indevido" },
      { id: "acao_anulatoria", name: "Ação Anulatória", description: "Anular débito fiscal" },
      { id: "embargos_execucao_fiscal", name: "Embargos à Execução Fiscal", description: "Defesa tributária" },
      { id: "restituicao_tributos", name: "Restituição de Tributos", description: "Repetição de indébito" },
      { id: "compensacao_tributaria", name: "Compensação Tributária", description: "Créditos fiscais" },
      { id: "parecer_tributario", name: "Parecer Tributário", description: "Consultoria fiscal" },
    ]
  },
  previdenciario: {
    name: "Direito Previdenciário",
    icon: Clock,
    color: "teal",
    documents: [
      { id: "aposentadoria", name: "Aposentadoria", description: "Concessão de benefício" },
      { id: "auxilio_doenca", name: "Auxílio-Doença", description: "Incapacidade temporária" },
      { id: "bpc_loas", name: "BPC/LOAS", description: "Benefício assistencial" },
      { id: "pensao_morte", name: "Pensão por Morte", description: "Dependentes" },
      { id: "revisao_beneficio", name: "Revisão de Benefício", description: "Recálculo" },
      { id: "tempo_contribuicao", name: "Averbação de Tempo", description: "Contagem especial" },
    ]
  },
};

const colorClasses = {
  blue: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  orange: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  red: "bg-red-500/10 text-red-500 border-red-500/20",
  pink: "bg-pink-500/10 text-pink-500 border-pink-500/20",
  purple: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  green: "bg-green-500/10 text-green-500 border-green-500/20",
  amber: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  teal: "bg-teal-500/10 text-teal-500 border-teal-500/20",
};

export default function DocumentGenerator() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [selectedArea, setSelectedArea] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedCase, setSelectedCase] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [documentTitle, setDocumentTitle] = useState("");
  const [conversationHistory, setConversationHistory] = useState([]);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list("-created_date"),
  });

  const { data: cases = [] } = useQuery({
    queryKey: ["cases"],
    queryFn: () => base44.entities.Case.list("-created_date"),
  });

  const { data: subscription } = useQuery({
    queryKey: ["subscription", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const subs = await base44.entities.Subscription.filter({ user_id: user.id });
      return subs[0] || null;
    },
    enabled: !!user?.id,
  });

  const filteredCases = selectedClient
    ? cases.filter((c) => c.client_id === selectedClient)
    : cases;

  const selectedClientData = clients.find((c) => c.id === selectedClient);
  const selectedCaseData = cases.find((c) => c.id === selectedCase);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      return base44.entities.LegalDocument.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Documento salvo com sucesso!");
    },
  });

  const handleGenerate = async () => {
    if (!selectedDocument) {
      toast.error("Selecione um tipo de documento");
      return;
    }

    if (!additionalInfo.trim()) {
      toast.error("Digite as informações ou alterações desejadas");
      return;
    }

    // Verificar limite de uso
    if (subscription?.plan === "free") {
      const used = subscription.daily_actions_used || 0;
      const limit = subscription.daily_actions_limit || 5;
      if (used >= limit) {
        toast.error("Limite diário atingido! Faça upgrade para o Pro.");
        return;
      }
    }

    setIsGenerating(true);

    try {
      const isUpdating = generatedContent !== "";
      
      const userMessage = {
        role: 'user',
        content: additionalInfo
      };

      const updatedHistory = [...conversationHistory, userMessage];

      let prompt;
      
      if (isUpdating) {
        // Modo de atualização - refinar documento existente
        prompt = `Você é um advogado brasileiro especializado. 

DOCUMENTO ATUAL:
${generatedContent}

O usuário solicitou as seguintes modificações ou adições:
${additionalInfo}

TAREFA: ATUALIZE o documento existente incorporando as novas informações ou modificações solicitadas.

IMPORTANTE:
- NÃO crie um documento novo do zero
- Mantenha a estrutura e formatação jurídica existente
- Integre as mudanças de forma natural e coerente
- Se for adicionar informações, insira no local apropriado
- Se for modificar, substitua apenas o necessário
- Retorne o documento COMPLETO atualizado`;
      } else {
        // Modo de geração inicial
        let context = `
TIPO DE DOCUMENTO: ${selectedDocument.name}
DESCRIÇÃO: ${selectedDocument.description}
ÁREA DO DIREITO: ${selectedArea?.name}
`;

        if (selectedClientData) {
          context += `
DADOS DO CLIENTE:
- Nome: ${selectedClientData.name}
- CPF/CNPJ: ${selectedClientData.cpf_cnpj || "Não informado"}
- Email: ${selectedClientData.email || "Não informado"}
- Telefone: ${selectedClientData.phone}
- Endereço: ${selectedClientData.address || "Não informado"}
- Tipo: ${selectedClientData.type === "individual" ? "Pessoa Física" : "Pessoa Jurídica"}
`;
        }

        if (selectedCaseData) {
          context += `
DADOS DO PROCESSO:
- Número: ${selectedCaseData.case_number || "Não informado"}
- Título: ${selectedCaseData.title}
- Descrição: ${selectedCaseData.description || "Não informado"}
- Área: ${selectedCaseData.area}
- Status: ${selectedCaseData.status}
- Vara/Tribunal: ${selectedCaseData.court || "Não informado"}
- Parte Contrária: ${selectedCaseData.opposing_party || "Não informado"}
- Valor da Causa: ${selectedCaseData.value ? `R$ ${selectedCaseData.value.toLocaleString("pt-BR")}` : "Não informado"}
- Data de Início: ${selectedCaseData.start_date || "Não informado"}
- Prazo: ${selectedCaseData.deadline || "Não informado"}
`;
        }

        prompt = `Você é um advogado brasileiro altamente experiente e especializado em ${selectedArea?.name}.

${context}

INFORMAÇÕES E SOLICITAÇÃO DO USUÁRIO:
${additionalInfo}

TAREFA: Gere uma peça jurídica completa do tipo "${selectedDocument.name}" com base nas informações fornecidas.

DIRETRIZES:
1. Use linguagem jurídica formal e técnica apropriada
2. Siga a estrutura padrão para este tipo de documento
3. Inclua todos os elementos obrigatórios (qualificação das partes, fundamentação legal, pedidos, etc.)
4. Cite legislação, jurisprudência e doutrina relevantes quando aplicável
5. Use formatação clara com títulos, subtítulos e numeração
6. Inclua data e local para assinatura
7. Se alguma informação estiver faltando, indique com [COMPLETAR]

IMPORTANTE: Gere o documento completo, pronto para uso, em formato profissional.`;
      }

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: !isUpdating,
      });

      const assistantMessage = {
        role: 'assistant',
        content: response
      };

      setConversationHistory([...updatedHistory, assistantMessage]);
      setGeneratedContent(response);
      
      if (!isUpdating) {
        setDocumentTitle(`${selectedDocument.name} - ${selectedClientData?.name || "Novo"}`);
      }

      // Limpar campo de input
      setAdditionalInfo("");

      // Atualizar contador de uso
      if (subscription?.plan === "free") {
        await base44.entities.Subscription.update(subscription.id, {
          daily_actions_used: (subscription.daily_actions_used || 0) + 1,
        });
        queryClient.invalidateQueries({ queryKey: ["subscription"] });
      }

      toast.success(isUpdating ? "Documento atualizado!" : "Documento gerado com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao processar documento. Tente novamente.");
    }

    setIsGenerating(false);
  };

  const handleReset = () => {
    setGeneratedContent("");
    setConversationHistory([]);
    setAdditionalInfo("");
    setDocumentTitle("");
  };

  const handleSave = async () => {
    if (!generatedContent) return;

    await saveMutation.mutateAsync({
      title: documentTitle || `${selectedDocument?.name} - ${new Date().toLocaleDateString("pt-BR")}`,
      type: "outros",
      content: generatedContent,
      case_id: selectedCase || undefined,
      client_id: selectedClient || undefined,
      status: "draft",
      notes: `Gerado por IA - ${selectedArea?.name} - ${selectedDocument?.name}`,
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
    toast.success("Documento copiado!");
  };

  const handleDownload = () => {
    const blob = new Blob([generatedContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${documentTitle || "documento"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Download iniciado!");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                Gerador de Peças Jurídicas
              </h1>
              <p className="text-sm sm:text-base text-gray-500">
                Crie documentos jurídicos completos com IA
              </p>
            </div>
          </div>

          {subscription?.plan === "free" && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="text-amber-800">
                Plano Gratuito: {subscription.daily_actions_limit - (subscription.daily_actions_used || 0)} gerações restantes hoje
              </span>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Painel de Configuração */}
          <div className="space-y-6">
            {/* Seleção de Área */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Scale className="w-5 h-5" />
                  1. Escolha a Área do Direito
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.entries(legalAreas).map(([key, area]) => {
                    const Icon = area.icon;
                    const isSelected = selectedArea?.name === area.name;
                    return (
                      <button
                        key={key}
                        onClick={() => {
                          setSelectedArea(area);
                          setSelectedDocument(null);
                        }}
                        className={`p-3 rounded-lg border-2 transition-all text-center ${
                          isSelected
                            ? `${colorClasses[area.color]} border-current`
                            : "border-gray-200 hover:border-gray-300 bg-white"
                        }`}
                      >
                        <Icon className={`w-5 h-5 mx-auto mb-1 ${isSelected ? "" : "text-gray-400"}`} />
                        <span className={`text-xs font-medium ${isSelected ? "" : "text-gray-600"}`}>
                          {area.name.replace("Direito ", "")}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Seleção de Documento */}
            <AnimatePresence>
              {selectedArea && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        2. Tipo de Documento
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-48 sm:h-56">
                        <div className="space-y-2 pr-4">
                          {selectedArea.documents.map((doc) => (
                            <button
                              key={doc.id}
                              onClick={() => setSelectedDocument(doc)}
                              className={`w-full p-3 rounded-lg border text-left transition-all ${
                                selectedDocument?.id === doc.id
                                  ? "border-purple-500 bg-purple-50"
                                  : "border-gray-200 hover:border-gray-300 bg-white"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className={`font-medium text-sm ${
                                    selectedDocument?.id === doc.id ? "text-purple-700" : "text-gray-900"
                                  }`}>
                                    {doc.name}
                                  </p>
                                  <p className="text-xs text-gray-500">{doc.description}</p>
                                </div>
                                {selectedDocument?.id === doc.id && (
                                  <CheckCircle className="w-5 h-5 text-purple-500" />
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Dados do Sistema */}
            <AnimatePresence>
              {selectedDocument && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        3. Vincular Dados (Opcional)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-sm">Cliente</Label>
                        <Select value={selectedClient} onValueChange={setSelectedClient}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Selecione um cliente" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={null}>Nenhum</SelectItem>
                            {clients.map((client) => (
                              <SelectItem key={client.id} value={client.id}>
                                {client.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm">Processo</Label>
                        <Select value={selectedCase} onValueChange={setSelectedCase}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Selecione um processo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={null}>Nenhum</SelectItem>
                            {filteredCases.map((caseItem) => (
                              <SelectItem key={caseItem.id} value={caseItem.id}>
                                {caseItem.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm">
                          {generatedContent ? "Adicionar ou Modificar Informações" : "Informações do Documento"}
                        </Label>
                        <Textarea
                          value={additionalInfo}
                          onChange={(e) => setAdditionalInfo(e.target.value)}
                          placeholder={generatedContent 
                            ? "Digite aqui para adicionar informações ou solicitar modificações no documento..."
                            : "Descreva detalhes específicos, argumentos, fatos relevantes para o documento..."}
                          className="mt-1 min-h-[120px]"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Botões de Ação */}
            {selectedDocument && (
              <div className="space-y-2">
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || !additionalInfo.trim()}
                  className="w-full py-6 text-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {generatedContent ? "Atualizando..." : "Gerando..."}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      {generatedContent ? "Atualizar Documento" : "Gerar com IA"}
                    </>
                  )}
                </Button>
                {generatedContent && (
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    className="w-full"
                  >
                    Nova Peça
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Painel de Resultado */}
          <div>
            <Card className="h-full">
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Documento Gerado</CardTitle>
                  {generatedContent && (
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={handleCopy}>
                        <Copy className="w-4 h-4 mr-1" />
                        <span className="hidden sm:inline">Copiar</span>
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleDownload}>
                        <Download className="w-4 h-4 mr-1" />
                        <span className="hidden sm:inline">Baixar</span>
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={saveMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {saveMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-1" />
                            <span className="hidden sm:inline">Salvar</span>
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
                {generatedContent && (
                  <Input
                    value={documentTitle}
                    onChange={(e) => setDocumentTitle(e.target.value)}
                    placeholder="Título do documento"
                    className="mt-2"
                  />
                )}
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px] sm:h-[600px]">
                  {isGenerating ? (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                      <LoadingSpinner size="large" text="Gerando documento..." />
                    </div>
                  ) : generatedContent ? (
                    <div className="p-4 sm:p-6 prose prose-sm max-w-none">
                      <ReactMarkdown>{generatedContent}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                      <FileText className="w-16 h-16 text-gray-300 mb-4" />
                      <p className="text-gray-500 font-medium">Nenhum documento gerado</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Selecione uma área e tipo de documento para começar
                      </p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}