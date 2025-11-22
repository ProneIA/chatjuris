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
  const [outputFormat, setOutputFormat] = useState("pdf");
  const [isDownloading, setIsDownloading] = useState(false);
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

      const formatInstructions = {
        peticao: `
FORMATO PADRÃO PARA PETIÇÃO:
- Cabeçalho com identificação do juízo
- EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(ÍZA) DE DIREITO DA [VARA]
- Identificação completa das partes (nome, nacionalidade, estado civil, profissão, RG, CPF, endereço)
- Exposição dos fatos em ordem cronológica
- Do direito: fundamentos jurídicos (artigos de lei, jurisprudência)
- Dos pedidos: numerados, claros e precisos
- Valor da causa
- Pedido de citação da parte contrária
- Termos em que pede deferimento
- Data e local
- Assinatura e OAB`,
        recurso: `
FORMATO PADRÃO PARA RECURSO:
- EXCELENTÍSSIMO(A) SENHOR(A) DESEMBARGADOR(A) PRESIDENTE DO TRIBUNAL
- Identificação do processo, partes e decisão recorrida
- Tempestividade e cabimento do recurso
- Síntese da decisão recorrida
- Razões do recurso (com numeração)
- Fundamentação jurídica detalhada
- Do pedido: reforma ou anulação
- Termos em que pede provimento
- Data, assinatura e OAB`,
        contestacao: `
FORMATO PADRÃO PARA CONTESTAÇÃO:
- Identificação do processo e partes
- Preliminares (se houver): exceções processuais
- Mérito: impugnação específica dos fatos alegados
- Impugnação dos pedidos
- Provas: rol de testemunhas, documentos
- Pedido de improcedência total
- Protesto por provas
- Termos em que pede deferimento`,
        contrato: `
FORMATO PADRÃO PARA CONTRATO:
- Título centralizado (CONTRATO DE...)
- Preâmbulo: CONTRATANTE e CONTRATADO com qualificação completa
- CLÁUSULAS numeradas sequencialmente
- Objeto do contrato
- Prazo de vigência
- Valores e formas de pagamento
- Direitos e obrigações das partes
- Rescisão e multas
- Foro de eleição
- Data e assinaturas das testemunhas`,
        procuracao: `
FORMATO PADRÃO PARA PROCURAÇÃO:
- Título: PROCURAÇÃO
- OUTORGANTE (qualificação completa)
- OUTORGADO (qualificação completa com OAB)
- Poderes conferidos: específicos ou cláusula ad judicia
- Validade
- Data e assinatura reconhecida em cartório`,
        parecer: `
FORMATO PADRÃO PARA PARECER JURÍDICO:
- Título: PARECER JURÍDICO
- I. CONSULTA/QUESTÃO
- II. RELATÓRIO DOS FATOS
- III. FUNDAMENTAÇÃO JURÍDICA
- IV. CONCLUSÃO/PARECER
- Data, assinatura e OAB`,
        memorando: `
FORMATO PADRÃO PARA MEMORANDO:
- MEMORANDO Nº [número]
- PARA: destinatário
- DE: remetente
- DATA:
- ASSUNTO:
- Corpo do texto conciso
- Conclusão
- Assinatura`,
        outros: `
FORMATO PROFISSIONAL:
- Estrutura clara com cabeçalho
- Parágrafos numerados
- Linguagem técnica apropriada
- Conclusão objetiva
- Data e assinatura`
      };

      const prompt = `Você é um assistente jurídico especializado em redação de documentos legais brasileiros.

${context}

INSTRUÇÕES ESPECIAIS:
${formData.custom_instructions || 'Gere um documento jurídico profissional baseado no template e nas informações fornecidas.'}

TIPO DE DOCUMENTO: ${formData.type}

${formatInstructions[formData.type] || formatInstructions.outros}

DIRETRIZES GERAIS:
- Use HTML para formatação (tags: h1, h2, h3, p, strong, em, ul, ol, li)
- Linguagem formal, técnica e culta do português jurídico brasileiro
- Citações de leis: Lei nº X.XXX/XXXX, art. X, §X
- Numeração clara de parágrafos e cláusulas
- Espaçamento adequado entre seções
- Alinhamento justificado para parágrafos
${selectedTemplate ? '- Use o template fornecido como base estrutural' : ''}
- Inclua TODAS as seções obrigatórias do tipo de documento
- Seja completo, profissional e tecnicamente impecável
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

  const downloadDocument = async () => {
    setIsDownloading(true);
    try {
      if (outputFormat === 'pdf') {
        // Criar HTML formatado para impressão como PDF
        const htmlContent = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <title>${formData.title}</title>
              <style>
                body {
                  font-family: 'Times New Roman', Times, serif;
                  font-size: 12pt;
                  line-height: 1.6;
                  margin: 2cm;
                  color: #000;
                }
                h1, h2, h3 { color: #000; }
                p { margin: 1em 0; text-align: justify; }
              </style>
            </head>
            <body>
              ${generatedContent}
            </body>
          </html>
        `;
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${formData.title}.html`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        alert('📄 Arquivo HTML baixado! Abra o arquivo e use Ctrl+P (ou Cmd+P) para salvar como PDF.');
      } else {
        // Download como HTML para abrir no Word
        const htmlContent = `
          <!DOCTYPE html>
          <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head>
              <meta charset="UTF-8">
              <title>${formData.title}</title>
              <style>
                body {
                  font-family: 'Times New Roman', Times, serif;
                  font-size: 12pt;
                  line-height: 1.6;
                  margin: 2cm;
                }
                p { margin: 1em 0; text-align: justify; }
              </style>
            </head>
            <body>
              ${generatedContent}
            </body>
          </html>
        `;
        const blob = new Blob([htmlContent], { type: 'application/msword' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${formData.title}.doc`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        alert('📝 Arquivo Word baixado! Abra no Microsoft Word ou Google Docs para editar.');
      }
    } catch (error) {
      console.error("Erro ao baixar:", error);
      alert("Erro ao baixar documento.");
    } finally {
      setIsDownloading(false);
    }
  };

  const saveDocument = async () => {
    try {
      const documentData = {
        title: formData.title,
        type: formData.type,
        content: generatedContent,
        status: "draft"
      };

      // Só adicionar campos se tiverem valores válidos
      if (formData.case_id && formData.case_id !== "") {
        documentData.case_id = formData.case_id;
      }
      
      if (formData.client_id && formData.client_id !== "") {
        documentData.client_id = formData.client_id;
      }
      
      if (selectedTemplate?.name) {
        documentData.template_used = selectedTemplate.name;
      }
      
      if (formData.custom_instructions && formData.custom_instructions.trim() !== "") {
        documentData.notes = formData.custom_instructions;
      }

      await base44.entities.LegalDocument.create(documentData);
      alert("✅ Documento salvo com sucesso!");
      onSuccess();
    } catch (error) {
      console.error("Erro ao salvar documento:", error);
      alert("❌ Erro ao salvar documento. Tente novamente.");
    }
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
              <div className="flex items-center gap-2 text-green-800 mb-3">
                <Sparkles className="w-5 h-5" />
                <p className="font-medium">Documento gerado com sucesso!</p>
              </div>
              <p className="text-sm text-green-700 mb-3">
                Revise o conteúdo abaixo e faça ajustes se necessário.
              </p>
              <div className="flex items-center gap-3">
                <Label className="text-sm text-slate-700">Formato de saída:</Label>
                <Select value={outputFormat} onValueChange={setOutputFormat}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="word">Word (DOCX)</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={downloadDocument}
                  disabled={isDownloading}
                  variant="outline"
                  size="sm"
                  className="ml-auto"
                >
                  {isDownloading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  Baixar {outputFormat.toUpperCase()}
                </Button>
              </div>
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

            <div className="flex justify-end gap-3 pt-4 mt-16">
              <Button variant="outline" onClick={() => setStep(1)}>
                Voltar
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
        )}
      </CardContent>
    </Card>
  );
}