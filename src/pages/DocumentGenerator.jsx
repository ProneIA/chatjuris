import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  FileText, Sparkles, Loader2, Save, Download, Copy, 
  CheckCircle2, ArrowRight, ArrowLeft, Eye, RefreshCw,
  Users, Briefcase, FileCheck, Edit3
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

export default function DocumentGenerator({ theme = 'light' }) {
  const isDark = theme === 'dark';
  const [user, setUser] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    doc_type: "",
    title: "",
    template_id: "",
    case_id: "",
    client_id: "",
    custom_instructions: "",
    variables: {}
  });

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: () => base44.entities.Template.list('name'),
  });

  const { data: cases = [] } = useQuery({
    queryKey: ['cases'],
    queryFn: () => base44.entities.Case.list('title'),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('name'),
  });

  const { data: subscription } = useQuery({
    queryKey: ['subscription', user?.id],
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
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success("✅ Documento salvo com sucesso!");
      resetForm();
    },
  });

  const documentTypes = [
    { 
      value: "peticao", 
      label: "Petição Inicial", 
      icon: FileText,
      description: "Documento inicial de um processo judicial",
      color: "blue"
    },
    { 
      value: "recurso", 
      label: "Recurso", 
      icon: FileCheck,
      description: "Recurso contra decisão judicial",
      color: "purple"
    },
    { 
      value: "contestacao", 
      label: "Contestação", 
      icon: Edit3,
      description: "Resposta à petição inicial",
      color: "amber"
    },
    { 
      value: "contrato", 
      label: "Contrato", 
      icon: FileText,
      description: "Documento contratual",
      color: "green"
    },
    { 
      value: "procuracao", 
      label: "Procuração", 
      icon: Users,
      description: "Outorga de poderes",
      color: "indigo"
    },
    { 
      value: "parecer", 
      label: "Parecer Jurídico", 
      icon: Briefcase,
      description: "Opinião técnica sobre questão jurídica",
      color: "pink"
    }
  ];

  const selectedTemplate = templates.find(t => t.id === formData.template_id);
  const selectedCase = cases.find(c => c.id === formData.case_id);
  const selectedClient = clients.find(c => c.id === formData.client_id);

  const steps = [
    { number: 1, title: "Tipo de Documento", icon: FileText },
    { number: 2, title: "Dados Básicos", icon: Edit3 },
    { number: 3, title: "Informações", icon: Users },
    { number: 4, title: "Gerar e Revisar", icon: Sparkles }
  ];

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleVariableChange = (variable, value) => {
    setFormData(prev => ({
      ...prev,
      variables: { ...prev.variables, [variable]: value }
    }));
  };

  const generateDocument = async () => {
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
      let context = `TIPO DE DOCUMENTO: ${formData.doc_type}\n\n`;
      
      if (selectedTemplate) {
        context += `TEMPLATE: ${selectedTemplate.name}\n`;
        context += `${selectedTemplate.content}\n\n`;
      }
      
      if (selectedCase) {
        context += `PROCESSO:\n`;
        context += `- ${selectedCase.title}\n`;
        context += `- Número: ${selectedCase.case_number || 'N/A'}\n`;
        context += `- Área: ${selectedCase.area}\n`;
        context += `- Cliente: ${selectedCase.client_name}\n`;
        if (selectedCase.description) context += `- Descrição: ${selectedCase.description}\n`;
        context += `\n`;
      }
      
      if (selectedClient) {
        context += `CLIENTE:\n`;
        context += `- Nome: ${selectedClient.name}\n`;
        context += `- CPF/CNPJ: ${selectedClient.cpf_cnpj || 'N/A'}\n`;
        context += `- Email: ${selectedClient.email}\n`;
        context += `- Telefone: ${selectedClient.phone}\n`;
        if (selectedClient.address) context += `- Endereço: ${selectedClient.address}\n`;
        context += `\n`;
      }

      if (Object.keys(formData.variables).length > 0) {
        context += `VARIÁVEIS:\n`;
        Object.entries(formData.variables).forEach(([key, value]) => {
          if (value) context += `${key}: ${value}\n`;
        });
        context += `\n`;
      }

      const prompt = `Você é um advogado brasileiro especializado em redação jurídica.

${context}

${formData.custom_instructions ? `INSTRUÇÕES ESPECIAIS:\n${formData.custom_instructions}\n\n` : ''}

GERE UM DOCUMENTO JURÍDICO COMPLETO E PROFISSIONAL seguindo estas diretrizes:
1. Use linguagem técnica e formal
2. Siga a estrutura padrão do tipo de documento
3. Inclua fundamentação legal adequada
4. Preencha todas as variáveis com os dados fornecidos
5. Use formatação markdown clara
6. Certifique-se de que está completo e pronto para uso

Gere o documento agora:`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
      });

      setGeneratedContent(response);
      setCurrentStep(4);

      if (subscription?.plan === "free") {
        await base44.entities.Subscription.update(subscription.id, {
          daily_actions_used: (subscription.daily_actions_used || 0) + 1,
        });
        queryClient.invalidateQueries({ queryKey: ['subscription'] });
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao gerar documento. Tente novamente.");
    }
    setIsGenerating(false);
  };

  const handleSave = async () => {
    await saveMutation.mutateAsync({
      title: formData.title || `Documento - ${new Date().toLocaleDateString("pt-BR")}`,
      type: formData.doc_type,
      content: generatedContent,
      status: "draft",
      case_id: formData.case_id || null,
      client_id: formData.client_id || null,
      notes: formData.custom_instructions || null,
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
    a.download = `${formData.title || "documento"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetForm = () => {
    setFormData({
      doc_type: "",
      title: "",
      template_id: "",
      case_id: "",
      client_id: "",
      custom_instructions: "",
      variables: {}
    });
    setGeneratedContent("");
    setCurrentStep(1);
  };

  const canProceed = () => {
    if (currentStep === 1) return formData.doc_type;
    if (currentStep === 2) return formData.title;
    if (currentStep === 3) return true;
    return false;
  };

  return (
    <div className={`min-h-screen p-4 sm:p-6 md:p-8 ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Gerador de Documentos com IA
          </h1>
          <p className={`${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
            Crie documentos jurídicos profissionais em minutos
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            {steps.map((step, idx) => (
              <React.Fragment key={step.number}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      currentStep >= step.number
                        ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white'
                        : isDark ? 'bg-neutral-800 text-neutral-500' : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    {currentStep > step.number ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : (
                      <step.icon className="w-6 h-6" />
                    )}
                  </div>
                  <p className={`text-xs mt-2 text-center hidden sm:block ${currentStep >= step.number ? (isDark ? 'text-white' : 'text-gray-900') : (isDark ? 'text-neutral-500' : 'text-gray-500')}`}>
                    {step.title}
                  </p>
                </div>
                {idx < steps.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 rounded ${currentStep > step.number ? 'bg-gradient-to-r from-purple-600 to-indigo-600' : isDark ? 'bg-neutral-800' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className={`p-6 ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}`}>
                <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Escolha o tipo de documento
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {documentTypes.map((type) => (
                    <motion.div
                      key={type.value}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleChange('doc_type', type.value)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        formData.doc_type === type.value
                          ? `border-${type.color}-500 bg-${type.color}-50`
                          : isDark ? 'border-neutral-700 hover:border-neutral-600' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-3 bg-${type.color}-100`}>
                        <type.icon className={`w-6 h-6 text-${type.color}-600`} />
                      </div>
                      <h3 className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {type.label}
                      </h3>
                      <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                        {type.description}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className={`p-6 space-y-6 ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}`}>
                <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Informações Básicas
                </h2>

                <div className="space-y-2">
                  <Label>Título do Documento *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    placeholder="Ex: Petição Inicial - Ação de Cobrança"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Template (Opcional)</Label>
                  <Select value={formData.template_id} onValueChange={(v) => handleChange('template_id', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedTemplate && (
                    <div className={`p-3 rounded-lg ${isDark ? 'bg-neutral-800' : 'bg-purple-50'}`}>
                      <p className={`text-sm ${isDark ? 'text-neutral-300' : 'text-purple-900'}`}>
                        {selectedTemplate.description}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className={`p-6 space-y-6 ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}`}>
                <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Dados Adicionais
                </h2>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cliente (Opcional)</Label>
                    <Select value={formData.client_id} onValueChange={(v) => handleChange('client_id', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Processo (Opcional)</Label>
                    <Select value={formData.case_id} onValueChange={(v) => handleChange('case_id', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {cases.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {selectedTemplate?.variables && selectedTemplate.variables.length > 0 && (
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Preencher Variáveis do Template</Label>
                    <div className="grid md:grid-cols-2 gap-3">
                      {selectedTemplate.variables.map((variable) => (
                        <div key={variable} className="space-y-1">
                          <Label className="text-xs">{variable}</Label>
                          <Input
                            value={formData.variables[variable] || ''}
                            onChange={(e) => handleVariableChange(variable, e.target.value)}
                            placeholder={`Preencha ${variable}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Instruções para a IA (Opcional)</Label>
                  <Textarea
                    value={formData.custom_instructions}
                    onChange={(e) => handleChange('custom_instructions', e.target.value)}
                    rows={3}
                    placeholder="Ex: Use linguagem mais formal, inclua jurisprudência recente..."
                  />
                </div>
              </Card>
            </motion.div>
          )}

          {currentStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {!generatedContent ? (
                <Card className={`p-8 text-center ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}`}>
                  <div className="max-w-md mx-auto">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <h2 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Tudo pronto!
                    </h2>
                    <p className={`mb-6 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                      Clique no botão abaixo para gerar seu documento com IA
                    </p>
                    <Button
                      onClick={generateDocument}
                      disabled={isGenerating}
                      size="lg"
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Gerando...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 mr-2" />
                          Gerar Documento
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              ) : (
                <>
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl p-6">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-8 h-8" />
                      <div>
                        <h3 className="text-lg font-semibold">Documento gerado com sucesso!</h3>
                        <p className="text-white/90">Revise o conteúdo e salve quando estiver pronto</p>
                      </div>
                    </div>
                  </div>

                  <Card className={`p-6 ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}`}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Documento Gerado
                      </h3>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => { setGeneratedContent(""); }}>
                          <RefreshCw className="w-4 h-4 mr-1" />
                          Gerar Novo
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleCopy}>
                          <Copy className="w-4 h-4 mr-1" />
                          Copiar
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleDownload}>
                          <Download className="w-4 h-4 mr-1" />
                          Baixar
                        </Button>
                      </div>
                    </div>

                    <div className={`p-4 rounded-lg border max-h-[500px] overflow-y-auto ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-gray-50 border-gray-200'}`}>
                      <div className={`prose max-w-none ${isDark ? 'prose-invert' : ''}`}>
                        <ReactMarkdown>{generatedContent}</ReactMarkdown>
                      </div>
                    </div>

                    <div className="mt-4">
                      <Textarea
                        value={generatedContent}
                        onChange={(e) => setGeneratedContent(e.target.value)}
                        rows={6}
                        placeholder="Edite o conteúdo aqui..."
                      />
                    </div>
                  </Card>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          
          {currentStep < 4 ? (
            <Button
              onClick={() => setCurrentStep(prev => prev + 1)}
              disabled={!canProceed()}
              className="bg-gradient-to-r from-purple-600 to-indigo-600"
            >
              Próximo
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : generatedContent && (
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="bg-gradient-to-r from-green-600 to-emerald-600"
            >
              {saveMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Salvar Documento
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}