import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

export default function SimpleCaseForm({ onSuccess, onCancel }) {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: "",
    client_id: "",
    client_name: "",
    area: "civil",
    status: "new",
    priority: "medium",
    description: "",
    court: "",
    case_number: "",
    opposing_party: "",
    value: "",
    start_date: new Date().toISOString().split('T')[0],
    deadline: ""
  });

  // Fetch clients for the dropdown
  const { data: clients = [] } = useQuery({
    queryKey: ['clients-list'],
    queryFn: async () => await base44.entities.Client.list()
  });

  const createCase = async () => {
    setLoading(true);
    try {
      const user = await base44.auth.me();
      if (!user) throw new Error("Usuário não autenticado");

      if (!formData.title || !formData.client_id) {
        toast.error("Por favor, preencha o Título e selecione um Cliente.");
        setLoading(false);
        return;
      }

      // Prepare payload
      const payload = {
        ...formData,
        value: formData.value ? parseFloat(formData.value) : 0,
        created_by: user.email,
        assigned_to: user.email,
        shared_with: [user.email]
      };

      const newCase = await base44.entities.Case.create(payload);
      
      if (newCase && newCase.id) {
        toast.success("Processo criado com sucesso!");
        if (onSuccess) onSuccess(newCase);
      } else {
        throw new Error("Erro ao criar processo");
      }
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro ao criar processo: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 py-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Título do Processo *</Label>
          <Input 
            placeholder="Ex: Ação de Cobrança - Silva vs Souza"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
          />
        </div>

        <div className="space-y-2">
          <Label>Cliente *</Label>
          <Select 
            value={formData.client_id} 
            onValueChange={(val) => {
              const client = clients.find(c => c.id === val);
              setFormData({
                ...formData, 
                client_id: val, 
                client_name: client ? client.name : ""
              });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um cliente..." />
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
          <Label>Número do Processo</Label>
          <Input 
            placeholder="0000000-00.0000.0.00.0000"
            value={formData.case_number}
            onChange={(e) => setFormData({...formData, case_number: e.target.value})}
          />
        </div>

        <div className="space-y-2">
          <Label>Área</Label>
          <Select 
            value={formData.area} 
            onValueChange={(val) => setFormData({...formData, area: val})}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="civil">Cível</SelectItem>
              <SelectItem value="criminal">Criminal</SelectItem>
              <SelectItem value="trabalhista">Trabalhista</SelectItem>
              <SelectItem value="tributario">Tributário</SelectItem>
              <SelectItem value="familia">Família</SelectItem>
              <SelectItem value="empresarial">Empresarial</SelectItem>
              <SelectItem value="previdenciario">Previdenciário</SelectItem>
              <SelectItem value="consumidor">Consumidor</SelectItem>
              <SelectItem value="outros">Outros</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Prioridade</Label>
          <Select 
            value={formData.priority} 
            onValueChange={(val) => setFormData({...formData, priority: val})}
          >
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
          <Label>Status Inicial</Label>
          <Select 
            value={formData.status} 
            onValueChange={(val) => setFormData({...formData, status: val})}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">Novo</SelectItem>
              <SelectItem value="in_progress">Em Andamento</SelectItem>
              <SelectItem value="waiting">Aguardando</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Tribunal / Vara</Label>
          <Input 
            placeholder="Ex: 1ª Vara Cível de SP"
            value={formData.court}
            onChange={(e) => setFormData({...formData, court: e.target.value})}
          />
        </div>

        <div className="space-y-2">
          <Label>Parte Contrária</Label>
          <Input 
            placeholder="Nome da outra parte"
            value={formData.opposing_party}
            onChange={(e) => setFormData({...formData, opposing_party: e.target.value})}
          />
        </div>

        <div className="space-y-2">
          <Label>Valor da Causa (R$)</Label>
          <Input 
            type="number"
            placeholder="0.00"
            value={formData.value}
            onChange={(e) => setFormData({...formData, value: e.target.value})}
          />
        </div>

        <div className="space-y-2">
          <Label>Prazo / Deadline</Label>
          <Input 
            type="date"
            value={formData.deadline}
            onChange={(e) => setFormData({...formData, deadline: e.target.value})}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Descrição / Resumo</Label>
        <Textarea 
          placeholder="Descreva os detalhes importantes do caso..."
          className="h-24"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t mt-4">
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button onClick={createCase} disabled={loading} className="bg-green-600 hover:bg-green-700">
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Criar Processo
        </Button>
      </div>
    </div>
  );
}