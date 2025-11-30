import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save, Loader2 } from "lucide-react";

export default function CaseForm({ caseData, clients = [], onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    case_number: caseData?.case_number || "",
    client_id: caseData?.client_id || "",
    client_name: caseData?.client_name || "",
    title: caseData?.title || "",
    description: caseData?.description || "",
    area: caseData?.area || "civil",
    status: caseData?.status || "new",
    priority: caseData?.priority || "medium",
    court: caseData?.court || "",
    opposing_party: caseData?.opposing_party || "",
    start_date: caseData?.start_date || "",
    deadline: caseData?.deadline || "",
    value: caseData?.value ? String(caseData.value) : ""
  });

  const handleChange = (field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      if (field === 'client_id' && clients.length > 0) {
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
    
    if (!formData.title.trim()) {
      alert("Preencha o título do processo");
      return;
    }
    
    if (!formData.client_id) {
      alert("Selecione um cliente");
      return;
    }
    
    if (!formData.area) {
      alert("Selecione a área do direito");
      return;
    }

    const dataToSubmit = {
      title: formData.title.trim(),
      client_id: formData.client_id,
      client_name: formData.client_name,
      area: formData.area,
      status: formData.status || "new",
      priority: formData.priority || "medium"
    };
    
    if (formData.case_number?.trim()) dataToSubmit.case_number = formData.case_number.trim();
    if (formData.court?.trim()) dataToSubmit.court = formData.court.trim();
    if (formData.opposing_party?.trim()) dataToSubmit.opposing_party = formData.opposing_party.trim();
    if (formData.description?.trim()) dataToSubmit.description = formData.description.trim();
    if (formData.start_date) dataToSubmit.start_date = formData.start_date;
    if (formData.deadline) dataToSubmit.deadline = formData.deadline;
    if (formData.value?.trim() && !isNaN(parseFloat(formData.value))) {
      dataToSubmit.value = parseFloat(formData.value);
    }
    
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
                placeholder="Ex: Ação de Cobrança"
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
              <Select value={formData.client_id} onValueChange={(v) => handleChange('client_id', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.length > 0 ? (
                    clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="_none" disabled>
                      Nenhum cliente cadastrado
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {clients.length === 0 && (
                <p className="text-xs text-amber-600">Cadastre um cliente primeiro</p>
              )}
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
              <Label htmlFor="status">Status</Label>
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
                min="0"
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
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || clients.length === 0} 
              className="bg-gradient-to-r from-blue-600 to-purple-600"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {caseData ? 'Atualizar' : 'Salvar'} Processo
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}