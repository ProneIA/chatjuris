import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function NewCase() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    title: "",
    client_id: "",
    client_name: "",
    area: "civil",
    status: "new",
    priority: "medium",
    description: "",
    court: "",
    opposing_party: "",
    case_number: "",
    value: "",
    start_date: new Date().toISOString().split('T')[0],
    deadline: ""
  });

  // Auth
  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {
      toast.error("Você precisa estar logado.");
      navigate(createPageUrl("Dashboard"));
    });
  }, [navigate]);

  // Fetch Clients for Dropdown
  const { data: clients = [] } = useQuery({
    queryKey: ['clients-list'],
    queryFn: async () => {
      return await base44.entities.Client.list('-created_date');
    }
  });

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: async (data) => {
      if (!user?.email) throw new Error("Usuário não identificado.");
      if (!data.title?.trim()) throw new Error("O título do processo é obrigatório.");
      if (!data.client_id) throw new Error("Selecione um cliente.");

      console.log("🚀 Criando novo processo...");

      const newCase = await base44.entities.Case.create({
        ...data,
        value: data.value ? parseFloat(data.value) : 0,
        created_by: user.email,
        assigned_to: user.email, // Auto-assign to creator
        shared_with: [user.email] // Ensure visibility
      });

      if (!newCase?.id) throw new Error("Erro ao confirmar criação no banco de dados.");
      return newCase;
    },
    onSuccess: (data) => {
      toast.success("✅ Processo criado com sucesso!");
      // Redirect immediately to the new case details
      navigate(createPageUrl("CaseDetails") + "?id=" + data.id);
    },
    onError: (err) => {
      console.error(err);
      toast.error("Erro ao criar processo: " + err.message);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!user) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(createPageUrl("Cases"))}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
          </Button>
          <h1 className="text-2xl font-bold">Novo Processo</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Informações do Processo</CardTitle>
              <CardDescription>Preencha os dados abaixo para cadastrar um novo processo jurídico.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Title & Client */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Título do Processo *</Label>
                  <Input 
                    placeholder="Ex: Ação de Cobrança vs Empresa X" 
                    value={formData.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cliente *</Label>
                  <Select 
                    value={formData.client_id} 
                    onValueChange={(val) => {
                      const client = clients.find(c => c.id === val);
                      setFormData(prev => ({ 
                        ...prev, 
                        client_id: val, 
                        client_name: client?.name || "" 
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                      {clients.length === 0 && (
                        <div className="p-2 text-sm text-gray-500 text-center">
                          Nenhum cliente encontrado. <br/>
                          <Button variant="link" size="sm" onClick={() => navigate(createPageUrl("Clients"))}>Cadastrar Cliente</Button>
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Area & Status */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Área do Direito</Label>
                  <Select value={formData.area} onValueChange={(val) => handleChange("area", val)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
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
                  <Select value={formData.priority} onValueChange={(val) => handleChange("priority", val)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">🟢 Baixa</SelectItem>
                      <SelectItem value="medium">🟡 Média</SelectItem>
                      <SelectItem value="high">🟠 Alta</SelectItem>
                      <SelectItem value="urgent">🔴 Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label>Descrição / Resumo</Label>
                <Textarea 
                  placeholder="Detalhes importantes sobre o caso..." 
                  rows={4}
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                />
              </div>

              {/* Extra Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Número do Processo</Label>
                  <Input 
                    placeholder="0000000-00.0000.0.00.0000" 
                    value={formData.case_number}
                    onChange={(e) => handleChange("case_number", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Vara / Tribunal</Label>
                  <Input 
                    placeholder="Ex: 1ª Vara Cível de SP" 
                    value={formData.court}
                    onChange={(e) => handleChange("court", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Parte Contrária</Label>
                  <Input 
                    placeholder="Nome da parte contrária" 
                    value={formData.opposing_party}
                    onChange={(e) => handleChange("opposing_party", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Valor da Causa (R$)</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    placeholder="0.00" 
                    value={formData.value}
                    onChange={(e) => handleChange("value", e.target.value)}
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data de Início</Label>
                  <Input 
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => handleChange("start_date", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Prazo Fatal (Deadline)</Label>
                  <Input 
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => handleChange("deadline", e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => navigate(createPageUrl("Cases"))}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-green-600 hover:bg-green-700 min-w-[150px]" disabled={createMutation.isPending}>
                  {createMutation.isPending ? <Loader2 className="animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Cadastrar Processo
                </Button>
              </div>

            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}