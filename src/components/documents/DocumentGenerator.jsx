import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Sparkles, Loader2, FileText, Eye, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

export default function DocumentGenerator({ cases, clients, templates, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const [exportFormat, setExportFormat] = useState("pdf");
  const [isExporting, setIsExporting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    type: "peticao",
    template_id: "",
    case_id: "",
    client_id: "",
    custom_instructions: "",
    additional_context: ""
  });

  const selectedTemplate = templates.find(t => t.id === formData.template_id);
  const selectedCase = cases.find(c => c.id === formData.case_id);
  const selectedClient = clients.find(c => c.id === formData.client_id);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateDocument = async () => {
    setIsGenerating(true);
    try {
      // Build context for the AI
      let context = "";
      
      if (selectedTemplate) {
        context += `TEMPLATE BASE:\n${selectedTemplate.content}\n\n`;
        if (selectedTemplate.variables?.length > 0) {
          context += `VARIÁVEIS DO TEMPLATE: ${selectedTemplate.variables.join(", ")}\n\n`;
        }
      }
      
      if (selectedCase) {
        context += `INFORMAÇÕES DO PROCESSO:\n`;
        context += `- Título: ${selectedCase.title}\n`;
        context += `- Número: ${selectedCase.case_number || 'N/A'}\n`;
        context += `- Área: ${selectedCase.area}\n`;
        context += `- Descrição: ${selectedCase.description || 'N/A'}\n`;
        context += `- Parte Contrária: ${selectedCase.opposing_party || 'N/A'}\n`;
        context += `- Vara/Tribunal: ${selectedCase.court || 'N/A'}\n\n`;
      }
      
      if (selectedClient) {
        context += `INFORMAÇÕES DO CLIENTE:\n`;
        context += `- Nome: ${selectedClient.name}\n`;
        context += `- CPF/CNPJ: ${selectedClient.cpf_cnpj || 'N/A'}\n`;
        context += `- Email: ${selectedClient.email}\n`;
        context += `- Telefone: ${selectedClient.phone}\n`;
        context += `- Endereço: ${selectedClient.address || 'N/A'}\n\n`;
      }

      if (formData.additional_context) {
        context += `CONTEXTO ADICIONAL:\n${formData.additional_context}\n\n`;
      }

      const prompt = `Você é um assistente jurídico especializado em redação de documentos legais.

${context}

INSTRUÇÕES:
${formData.custom_instructions || 'Gere um documento jurídico profissional baseado no template e nas informações fornecidas.'}

Tipo de documento: ${formData.type}

Gere o documento completo, profissional e formatado adequadamente. 
${selectedTemplate ? 'Use o template fornecido como base e preencha com as informações do caso e cliente.' : 'Crie um documento profissional do tipo especificado.'}
Inclua todas as seções necessárias para este tipo de documento jurídico.
Use linguagem formal e técnica adequada.
`;

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

  const saveDocument = async () => {
    try {
      await base44.entities.LegalDocument.create({
        title: formData.title,
        type: formData.type,
        case_id: formData.case_id || null,
        client_id: formData.client_id || null,
        template_used: selectedTemplate?.name || null,
        content: generatedContent,
        status: "draft",
        notes: formData.custom_instructions || null
      });

      onSuccess();
    } catch (error) {
      console.error("Erro ao salvar documento:", error);
      alert("Erro ao salvar documento. Tente novamente.");
    }
  };

  const exportDocument = async () => {
    setIsExporting(true);
    try {
      const content = generatedContent.replace(/<[^>]*>/g, '');
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${formData.title}.${exportFormat === 'pdf' ? 'pdf' : 'docx'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erro ao exportar:", error);
      alert("Erro ao exportar documento. Tente novamente.");
    }
    setIsExporting(false);
  };

  return (
    <Card className="max-w-5xl mx-auto border-none shadow-lg">
      <CardHeader className="border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle>Gerador de Documentos com IA</CardTitle>
              <p className="text-sm text-slate-600 mt-1">
                {step === 1 ? 'Passo 1: Configure o documento' : 'Passo 2: Revise e salve'}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {step === 1 ? (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title">Título do Documento *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="Ex: Petição Inicial - Ação de Cobrança"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Tipo de Documento *</Label>
                <Select value={formData.type} onValueChange={(v) => handleChange('type', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="peticao">Petição</SelectItem>
                    <SelectItem value="recurso">Recurso</SelectItem>
                    <SelectItem value="contestacao">Contestação</SelectItem>
                    <SelectItem value="contrato">Contrato</SelectItem>
                    <SelectItem value="procuracao">Procuração</SelectItem>
                    <SelectItem value="parecer">Parecer</SelectItem>
                    <SelectItem value="memorando">Memorando</SelectItem>
                    <SelectItem value="outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="template_id">Template (Opcional)</Label>
                <Select value={formData.template_id} onValueChange={(v) => handleChange('template_id', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Sem template</SelectItem>
                    {templates
                      .filter(t => t.category === formData.type)
                      .map(template => (
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
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-blue-900 mb-1">Template Selecionado</h4>
                    <p className="text-sm text-blue-700 mb-2">{selectedTemplate.description}</p>
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
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="additional_context">Contexto Adicional</Label>
              <Textarea
                id="additional_context"
                value={formData.additional_context}
                onChange={(e) => handleChange('additional_context', e.target.value)}
                rows={3}
                placeholder="Informações adicionais relevantes para o documento..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom_instructions">Instruções Específicas para a IA</Label>
              <Textarea
                id="custom_instructions"
                value={formData.custom_instructions}
                onChange={(e) => handleChange('custom_instructions', e.target.value)}
                rows={4}
                placeholder="Ex: Focar nos aspectos trabalhistas, incluir jurisprudência recente, usar tom mais formal..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                onClick={generateDocument}
                disabled={!formData.title || isGenerating}
                className="bg-gradient-to-r from-blue-600 to-purple-600"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gerando Documento...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Gerar Documento
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-800">
                <Sparkles className="w-5 h-5" />
                <p className="font-medium">Documento gerado com sucesso!</p>
              </div>
              <p className="text-sm text-green-700 mt-1">
                Revise o conteúdo abaixo e faça ajustes se necessário antes de salvar.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Conteúdo do Documento</Label>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <ReactQuill
                  value={generatedContent}
                  onChange={setGeneratedContent}
                  className="h-96"
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
            </div>

            <div className="space-y-4 pt-4 mt-16">
              <div className="space-y-2">
                <Label>Formato de Exportação</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={exportFormat === 'pdf' ? 'default' : 'outline'}
                    onClick={() => setExportFormat('pdf')}
                    className="flex-1"
                  >
                    PDF
                  </Button>
                  <Button
                    type="button"
                    variant={exportFormat === 'word' ? 'default' : 'outline'}
                    onClick={() => setExportFormat('word')}
                    className="flex-1"
                  >
                    Word (DOCX)
                  </Button>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Voltar
                </Button>
                <Button
                  onClick={exportDocument}
                  disabled={isExporting}
                  variant="outline"
                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Exportando...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Baixar {exportFormat === 'pdf' ? 'PDF' : 'DOCX'}
                    </>
                  )}
                </Button>
                <Button
                  onClick={saveDocument}
                  className="bg-gradient-to-r from-green-600 to-emerald-600"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Salvar Documento
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}