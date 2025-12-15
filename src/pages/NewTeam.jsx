import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Save, Loader2, Users } from "lucide-react";
import { toast } from "sonner";

export default function NewTeam() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: "",
    description: ""
  });

  // Auth
  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {
      toast.error("Você precisa estar logado.");
      navigate(createPageUrl("Dashboard"));
    });
  }, [navigate]);

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: async (data) => {
      if (!user?.email) throw new Error("Usuário não identificado.");
      if (!data.name?.trim()) throw new Error("O nome da equipe é obrigatório.");

      console.log("🚀 Criando nova equipe...");

      const newTeam = await base44.entities.Team.create({
        name: data.name.trim(),
        description: data.description || "",
        owner_email: user.email,
        members: [user.email], // Creator is always a member
        is_active: true
      });

      if (!newTeam?.id) throw new Error("Erro ao confirmar criação no banco de dados.");
      return newTeam;
    },
    onSuccess: (data) => {
      toast.success("✅ Equipe criada com sucesso!");
      // Redirect immediately to the new team workspace
      navigate(createPageUrl("TeamWorkspace") + "?team=" + data.id);
    },
    onError: (err) => {
      console.error(err);
      toast.error("Erro ao criar equipe: " + err.message);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  if (!user) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(createPageUrl("Teams"))}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
          </Button>
          <h1 className="text-2xl font-bold">Nova Equipe</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" /> 
                Dados da Equipe
              </CardTitle>
              <CardDescription>Crie um espaço colaborativo para gerenciar arquivos, tarefas e eventos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="space-y-2">
                <Label>Nome da Equipe *</Label>
                <Input 
                  placeholder="Ex: Departamento Trabalhista" 
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Descrição (Opcional)</Label>
                <Textarea 
                  placeholder="Para que serve esta equipe?" 
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => navigate(createPageUrl("Teams"))}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 min-w-[150px]" disabled={createMutation.isPending}>
                  {createMutation.isPending ? <Loader2 className="animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Criar Equipe
                </Button>
              </div>

            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}