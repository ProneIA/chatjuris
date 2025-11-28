import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save } from "lucide-react";

export default function CaseForm({ caseData, clients, onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState(caseData || {
    case_number: "",
    client_id: "",
    client_name: "",
    title: "",
    description: "",
    area: "civil",
    status: "new",
    priority: "medium",
    court: "",
    opposing_party: "",
    start_date: new Date().toISOString().split('T')[0],
    deadline: "",
    value: ""
  });

  const handleChange = (field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Se mudar o cliente, atualiza o nome também
      if (field === 'client_id') {
        const client = clients.find(c => c.id === value);
        if (client) {
          newData.client_name = client.name;
        }
      }
      
      return newData;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.client_id || !formData.area) {
      alert("⚠️ Preencha os campos obrigatórios (Título, Cliente e Área)");
      return;
    }
    
    const dataToSubmit = { ...formData };
    
    // Converter valor para número
    if (dataToSubmit.value && dataToSubmit.value !== "") {
      dataToSubmit.value = parseFloat(dataToSubmit.value);
    } else {
      delete dataToSubmit.value;
    }
    
    // Limpar campos vazios
    if (!dataToSubmit.case_number || dataToSubmit.case_number === "") delete dataToSubmit.case_number;
    if (!dataToSubmit.court || dataToSubmit.court === "") delete dataToSubmit.court;
    if (!dataToSubmit.opposing_party || dataToSubmit.opposing_party === "") delete dataToSubmit.opposing_party;
    if (!dataToSubmit.deadline || dataToSubmit.deadline === "") delete dataToSubmit.deadline;
    if (!dataToSubmit.description || dataToSubmit.description === "") delete dataToSubmit.description;
    
    onSubmit(dataToSubmit);
  };

  return (
    <Card className="max-w-3xl mx-auto border-none shadow-lg">
      <CardHeader className="border-b border-slate-100">
        <div className="flex items-center justify-between">
          <CardTitle>{caseData ? 'Editar Processo' : 'Novo Processo'}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="w-5 h-5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="title">Título do Processo *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="case_number">Número do Processo</Label>
              <Input
                id="case_number"
                value={formData.case_number}
                onChange={(e) => handleChange('case_number', e.target.value)}
                placeholder="0000000-00.0000.0.00.0000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client_id">Cliente *</Label>
              <Select value={formData.client_id} onValueChange={(v) => handleChange('client_id', v)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="area">Área do Direito *</Label>
              <Select value={formData.area} onValueChange={(v) => handleChange('area', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="civil">Civil</SelectItem>
                  <SelectItem value="criminal">Criminal</SelectItem>
                  <SelectItem value="trabalhista">Trabalhista</SelectItem>
                  <SelectItem value="tributario">Tributário</SelectItem>
                  <SelectItem value="familia">Família</SelectItem>
                  <SelectItem value="empresarial">Empresarial</SelectItem>
                  <SelectItem value="consumidor">Consumidor</SelectItem>
                  <SelectItem value="previdenciario">Previdenciário</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select value={formData.status} onValueChange={(v) => handleChange('status', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">Novo</SelectItem>
                  <SelectItem value="in_progress">Em Andamento</SelectItem>
                  <SelectItem value="waiting">Aguardando</SelectItem>
                  <SelectItem value="closed">Encerrado</SelectItem>
                  <SelectItem value="archived">Arquivado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Prioridade</Label>
              <Select value={formData.priority} onValueChange={(v) => handleChange('priority', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="court">Vara/Tribunal</Label>
              <Input
                id="court"
                value={formData.court}
                onChange={(e) => handleChange('court', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="opposing_party">Parte Contrária</Label>
              <Input
                id="opposing_party"
                value={formData.opposing_party}
                onChange={(e) => handleChange('opposing_party', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_date">Data de Início</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => handleChange('start_date', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline">Prazo Importante</Label>
              <Input
                id="deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) => handleChange('deadline', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="value">Valor da Causa (R$)</Label>
              <Input
                id="value"
                type="number"
                step="0.01"
                value={formData.value}
                onChange={(e) => handleChange('value', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-gradient-to-r from-blue-600 to-purple-600">
              <Save className="w-4 h-4 mr-2" />
              {caseData ? 'Atualizar' : 'Criar'} Processo
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}