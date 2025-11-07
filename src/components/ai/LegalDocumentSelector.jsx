import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, FileText, Scale, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function LegalDocumentSelector({ templates, cases, clients, onGenerate, onCancel, isGenerating }) {
  const [formData, setFormData] = useState({
    title: "",
    type: "peticao",
    template_id: "",
    case_id: "",
    client_id: "",
    instructions: ""
  });

  const selectedTemplate = templates.find(t => t.id === formData.template_id);
  const selectedCase = cases.find(c => c.id === formData.case_id);
  const selectedClient = clients.find(c => c.id === formData.client_id);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onGenerate(formData);
  };

  return (
    <Card className="max-w-4xl mx-auto border-none shadow-2xl">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <CardTitle className="text-xl">Gerador de Documentos Jurídicos</CardTitle>
            <p className="text-sm text-white/80 mt-1">Configure as informações e gere seu documento</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Alert Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 mb-1">Como funciona</h4>
                <p className="text-sm text-blue-700">
                  Selecione um template, escolha o caso e cliente relacionados, e a IA irá gerar 
                  automaticamente um documento jurídico profissional com todos os dados preenchidos.
                </p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="title">Título do Documento *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="Ex: Petição Inicial - Ação de Cobrança Cliente XYZ"
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
              <Label htmlFor="template_id">Template (Recomendado)</Label>
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
              <Label htmlFor="case_id">Processo Relacionado</Label>
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
              <Label htmlFor="client_id">Cliente</Label>
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

          {/* Template Preview */}
          {selectedTemplate && (
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <h4 className="font-medium text-indigo-900 mb-1">Template: {selectedTemplate.name}</h4>
                  <p className="text-sm text-indigo-700 mb-3">{selectedTemplate.description}</p>
                  {selectedTemplate.variables?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-indigo-600 mb-2">Variáveis que serão preenchidas:</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedTemplate.variables.map((variable, index) => (
                          <Badge key={index} variant="secondary" className="bg-white/80 text-indigo-700">
                            {variable}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Selected Data Preview */}
          {(selectedCase || selectedClient) && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-3">Dados Selecionados:</h4>
              <div className="space-y-2 text-sm">
                {selectedClient && (
                  <div>
                    <span className="font-medium text-green-800">Cliente:</span>
                    <span className="text-green-700 ml-2">{selectedClient.name}</span>
                  </div>
                )}
                {selectedCase && (
                  <div>
                    <span className="font-medium text-green-800">Processo:</span>
                    <span className="text-green-700 ml-2">{selectedCase.title}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="instructions">Instruções Adicionais para a IA</Label>
            <Textarea
              id="instructions"
              value={formData.instructions}
              onChange={(e) => handleChange('instructions', e.target.value)}
              rows={3}
              placeholder="Ex: Focar em argumentação sobre dano moral, incluir jurisprudência do STJ, usar tom mais técnico..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isGenerating}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!formData.title || isGenerating}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isGenerating ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
                  Gerando Documento...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Gerar Documento com IA
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}