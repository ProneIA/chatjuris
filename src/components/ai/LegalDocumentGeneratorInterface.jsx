import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, Save, Eye, FileText, RefreshCw, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { jsPDF } from "jspdf";
import { toast } from "sonner";

export default function LegalDocumentGeneratorInterface({ conversation, onUpdate }) {
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: "",
    template_id: "",
    case_id: "",
    client_id: "",
    custom_instructions: "",
    variable_values: {}
  });

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

  const selectedTemplate = templates.find(t => t.id === formData.template_id);
  const selectedCase = cases.find(c => c.id === formData.case_id);
  const selectedClient = clients.find(c => c.id === formData.client_id);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleVariableChange = (variable, value) => {
    setFormData(prev => ({
      ...prev,
      variable_values: {
        ...prev.variable_values,
        [variable]: value
      }
    }));
  };

  const getPreviewContent = () => {
    if (!selectedTemplate) return "";
    let content = selectedTemplate.content;
    
    // Replace variables with values
    Object.entries(formData.variable_values).forEach(([key, value]) => {
      const regex = new RegExp(key.replace(/[{}]/g, '\\$&'), 'g');
      content = content.replace(regex, value || `[${key}]`);
    });

    // Auto-fill from case data
    if (selectedCase) {
      content = content.replace(/\{\{numero_processo\}\}/g, selectedCase.case_number || '[número do processo]');
      content = content.replace(/\{\{nome_cliente\}\}/g, selectedCase.client_name || '[nome do cliente]');
      content = content.replace(/\{\{vara\}\}/g, selectedCase.court || '[vara]');
    }

    // Auto-fill from client data
    if (selectedClient) {
      content = content.replace(/\{\{nome_cliente\}\}/g, selectedClient.name);
      content = content.replace(/\{\{cpf\}\}/g, selectedClient.cpf_cnpj || '[CPF]');
      content = content.replace(/\{\{endereco\}\}/g, selectedClient.address || '[endereço]');
      content = content.replace(/\{\{email\}\}/g, selectedClient.email);
      content = content.replace(/\{\{telefone\}\}/g, selectedClient.phone);
    }

    return content;
  };

  const generateDocument = async () => {
    setIsGenerating(true);
    try {
      let context = "";
      
      if (selectedTemplate) {
        context += `TEMPLATE SELECIONADO:\n${selectedTemplate.name}\n${selectedTemplate.description || ''}\n\n`;
        context += `CONTEÚDO DO TEMPLATE:\n${selectedTemplate.content}\n\n`;
      }
      
      if (selectedCase) {
        context += `INFORMAÇÕES DO PROCESSO:\n`;
        context += `- Título: ${selectedCase.title}\n`;
        context += `- Número: ${selectedCase.case_number || 'N/A'}\n`;
        context += `- Área: ${selectedCase.area}\n`;
        context += `- Descrição: ${selectedCase.description || 'N/A'}\n`;
        context += `- Cliente: ${selectedCase.client_name}\n`;
        context += `- Parte Contrária: ${selectedCase.opposing_party || 'N/A'}\n`;
        context += `- Vara/Tribunal: ${selectedCase.court || 'N/A'}\n`;
        if (selectedCase.value) context += `- Valor da Causa: R$ ${selectedCase.value}\n`;
        context += `\n`;
      }
      
      if (selectedClient) {
        context += `DADOS DO CLIENTE:\n`;
        context += `- Nome: ${selectedClient.name}\n`;
        context += `- CPF/CNPJ: ${selectedClient.cpf_cnpj || 'N/A'}\n`;
        context += `- Email: ${selectedClient.email}\n`;
        context += `- Telefone: ${selectedClient.phone}\n`;
        context += `- Endereço: ${selectedClient.address || 'N/A'}\n`;
        context += `\n`;
      }

      // Include variable values
      if (Object.keys(formData.variable_values).length > 0) {
        context += `VARIÁVEIS PREENCHIDAS:\n`;
        Object.entries(formData.variable_values).forEach(([key, value]) => {
          if (value) context += `${key}: ${value}\n`;
        });
        context += `\n`;
      }

      const prompt = `Você é um assistente jurídico especializado em redação de documentos legais brasileiros.

${context}

INSTRUÇÕES:
${formData.custom_instructions || 'Gere um documento jurídico profissional baseado no template fornecido, preenchendo todas as variáveis com as informações disponíveis.'}

IMPORTANTE:
- Use o template como base estrutural
- Preencha todas as variáveis marcadas com {{}} usando os dados fornecidos
- Mantenha linguagem jurídica formal e técnica
- Inclua todas as seções necessárias
- Certifique-se de que o documento esteja completo e pronto para uso
- Use os dados reais do caso e cliente fornecidos
- Para variáveis não preenchidas, use informações coerentes baseadas no contexto

Gere o documento completo agora:`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        add_context_from_internet: false
      });

      setGeneratedContent(response);
      setStep(2);
    } catch (error) {
      console.error("Erro ao gerar documento:", error);
      alert("Erro ao gerar documento. Tente novamente.");
    }
    setIsGenerating(false);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;
    
    // Remove HTML tags for PDF
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = generatedContent;
    const textContent = tempDiv.textContent || tempDiv.innerText || "";
    
    // Título
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text(formData.title || 'Documento', margin, margin);
    
    // Conteúdo
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    let yPos = margin + 10;
    
    const lines = doc.splitTextToSize(textContent, maxWidth);
    lines.forEach(line => {
      if (yPos > 280) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(line, margin, yPos);
      yPos += 6;
    });
    
    doc.save(`${formData.title || 'documento'}.pdf`);
    toast.success('PDF gerado com sucesso!');
  };

  const exportToWord = () => {
    // Remove HTML tags for Word
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = generatedContent;
    const textContent = tempDiv.textContent || tempDiv.innerText || "";
    
    let content = `${formData.title || 'Documento'}\n\n`;
    content += textContent;
    
    const blob = new Blob([content], { type: 'application/msword' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${formData.title || 'documento'}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    toast.success('Documento Word exportado!');
  };

  const saveDocument = async () => {
    try {
      await base44.entities.LegalDocument.create({
        title: formData.title,
        type: selectedTemplate?.category || "outros",
        case_id: formData.case_id || null,
        client_id: formData.client_id || null,
        template_used: selectedTemplate?.name || null,
        content: generatedContent,
        status: "draft",
        notes: formData.custom_instructions || null
      });

      toast.success("✅ Documento salvo com sucesso!");
      
      // Reset form
      setStep(1);
      setFormData({
        title: "",
        template_id: "",
        case_id: "",
        client_id: "",
        custom_instructions: "",
        variable_values: {}
      });
      setGeneratedContent("");
    } catch (error) {
      console.error("Erro ao salvar documento:", error);
      toast.error("Erro ao salvar documento. Tente novamente.");
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-50 to-white p-6 overflow-y-auto">
      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-4xl mx-auto w-full space-y-6"
          >
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 mb-4">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Gerador de Documentos Jurídicos</h2>
              <p className="text-slate-600">Preencha os dados e a IA gerará o documento para você</p>
            </div>

            <Card className="p-6 space-y-6 border-2 border-slate-200 shadow-lg">
              <div className="space-y-2">
                <Label htmlFor="title">Título do Documento *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="Ex: Petição Inicial - Ação de Cobrança contra João Silva"
                  className="text-base"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="template_id">Template *</Label>
                  <Select value={formData.template_id} onValueChange={(v) => handleChange('template_id', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map(template => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="case_id">Processo (Opcional)</Label>
                  <Select value={formData.case_id} onValueChange={(v) => handleChange('case_id', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um processo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>Nenhum</SelectItem>
                      {cases.map(caseItem => (
                        <SelectItem key={caseItem.id} value={caseItem.id}>
                          {caseItem.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client_id">Cliente (Opcional)</Label>
                  <Select value={formData.client_id} onValueChange={(v) => handleChange('client_id', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>Nenhum</SelectItem>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedTemplate && (
                <>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <FileText className="w-5 h-5 text-purple-600 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-medium text-purple-900 mb-1">{selectedTemplate.name}</h4>
                        <p className="text-sm text-purple-700">{selectedTemplate.description}</p>
                      </div>
                    </div>
                    {selectedTemplate.variables?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedTemplate.variables.map((variable, index) => (
                          <Badge key={index} variant="outline" className="bg-white">
                            {variable}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {selectedTemplate.variables?.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-semibold">Preencher Variáveis</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowPreview(!showPreview)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          {showPreview ? 'Ocultar' : 'Ver'} Preview
                        </Button>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg">
                        {selectedTemplate.variables.map((variable) => (
                          <div key={variable} className="space-y-1">
                            <Label htmlFor={variable} className="text-xs">
                              {variable}
                            </Label>
                            <Input
                              id={variable}
                              value={formData.variable_values[variable] || ''}
                              onChange={(e) => handleVariableChange(variable, e.target.value)}
                              placeholder={`Preencha ${variable}`}
                              className="bg-white"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {showPreview && (
                    <div className="space-y-2">
                      <Label>Preview com Variáveis Preenchidas</Label>
                      <div className="bg-white border border-slate-300 rounded-lg p-4 max-h-96 overflow-y-auto">
                        <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans">
                          {getPreviewContent()}
                        </pre>
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="custom_instructions">Instruções Adicionais para a IA</Label>
                <Textarea
                  id="custom_instructions"
                  value={formData.custom_instructions}
                  onChange={(e) => handleChange('custom_instructions', e.target.value)}
                  rows={3}
                  placeholder="Ex: Enfatize os aspectos trabalhistas, inclua jurisprudência recente, use tom mais técnico..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  onClick={generateDocument}
                  disabled={!formData.title || !formData.template_id || isGenerating}
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Gerando Documento...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Gerar Documento com IA
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="step2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-5xl mx-auto w-full space-y-6"
          >
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Documento Gerado com Sucesso!</h3>
                  <p className="text-white/90">Revise o conteúdo e faça ajustes antes de salvar</p>
                </div>
              </div>
            </div>

            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold">Conteúdo do Documento</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setStep(1);
                    setGeneratedContent("");
                  }}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Gerar Novamente
                </Button>
              </div>
              
              <div className="border-2 border-slate-200 rounded-lg overflow-hidden">
                <ReactQuill
                  value={generatedContent}
                  onChange={setGeneratedContent}
                  className="h-[500px]"
                  modules={{
                    toolbar: [
                      [{ 'header': [1, 2, 3, false] }],
                      ['bold', 'italic', 'underline'],
                      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                      [{ 'align': [] }],
                      ['clean']
                    ],
                  }}
                />
              </div>

              <div className="flex justify-between gap-3 pt-4 mt-20 flex-wrap">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  size="lg"
                >
                  Voltar
                </Button>
                <div className="flex gap-3 flex-wrap">
                  <Button
                    variant="outline"
                    onClick={exportToPDF}
                    size="lg"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Exportar PDF
                  </Button>
                  <Button
                    variant="outline"
                    onClick={exportToWord}
                    size="lg"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Exportar Word
                  </Button>
                  <Button
                    onClick={saveDocument}
                    size="lg"
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    <Save className="w-5 h-5 mr-2" />
                    Salvar Documento
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}