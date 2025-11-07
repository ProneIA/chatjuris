import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function TemplateForm({ template, onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState(template || {
    name: "",
    category: "peticao",
    area: "geral",
    content: "",
    variables: [],
    description: "",
    is_favorite: false
  });

  const [variableInput, setVariableInput] = useState("");

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addVariable = () => {
    if (variableInput.trim()) {
      const variable = variableInput.trim().startsWith("{{") 
        ? variableInput.trim() 
        : `{{${variableInput.trim()}}}`;
      
      if (!formData.variables.includes(variable)) {
        setFormData(prev => ({
          ...prev,
          variables: [...prev.variables, variable]
        }));
      }
      setVariableInput("");
    }
  };

  const removeVariable = (variable) => {
    setFormData(prev => ({
      ...prev,
      variables: prev.variables.filter(v => v !== variable)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card className="max-w-4xl mx-auto border-none shadow-lg">
      <CardHeader className="border-b border-slate-100">
        <div className="flex items-center justify-between">
          <CardTitle>{template ? 'Editar Template' : 'Novo Template'}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="w-5 h-5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">Nome do Template *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Ex: Petição Inicial - Ação de Cobrança"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria *</Label>
              <Select value={formData.category} onValueChange={(v) => handleChange('category', v)}>
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
              <Label htmlFor="area">Área do Direito</Label>
              <Select value={formData.area} onValueChange={(v) => handleChange('area', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="geral">Geral</SelectItem>
                  <SelectItem value="civil">Civil</SelectItem>
                  <SelectItem value="criminal">Criminal</SelectItem>
                  <SelectItem value="trabalhista">Trabalhista</SelectItem>
                  <SelectItem value="tributario">Tributário</SelectItem>
                  <SelectItem value="familia">Família</SelectItem>
                  <SelectItem value="empresarial">Empresarial</SelectItem>
                  <SelectItem value="consumidor">Consumidor</SelectItem>
                  <SelectItem value="previdenciario">Previdenciário</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={2}
              placeholder="Breve descrição do template..."
            />
          </div>

          <div className="space-y-2">
            <Label>Variáveis do Template</Label>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <p className="text-sm text-blue-700">
                  Variáveis são substituídas pelos dados reais ao gerar documentos. 
                  Ex: {`{{nome_cliente}}, {{numero_processo}}, {{data}}`}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Input
                value={variableInput}
                onChange={(e) => setVariableInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addVariable())}
                placeholder="Ex: nome_cliente"
              />
              <Button type="button" onClick={addVariable} variant="outline">
                Adicionar
              </Button>
            </div>
            {formData.variables.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {formData.variables.map((variable, index) => (
                  <Badge key={index} variant="secondary" className="text-sm">
                    {variable}
                    <button
                      type="button"
                      onClick={() => removeVariable(variable)}
                      className="ml-2 hover:text-red-600"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Conteúdo do Template *</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => handleChange('content', e.target.value)}
              rows={12}
              placeholder="Digite o conteúdo do template. Use variáveis como {{nome_cliente}} que serão substituídas..."
              required
              className="font-mono text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_favorite"
              checked={formData.is_favorite}
              onChange={(e) => handleChange('is_favorite', e.target.checked)}
              className="w-4 h-4"
            />
            <Label htmlFor="is_favorite" className="cursor-pointer">
              Marcar como favorito
            </Label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-gradient-to-r from-blue-600 to-purple-600">
              <Save className="w-4 h-4 mr-2" />
              {template ? 'Atualizar' : 'Criar'} Template
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}