import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Users } from "lucide-react";
import { toast } from "sonner";

export default function SimpleTeamForm({ onSuccess, onCancel }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: ""
  });

  const createTeam = async () => {
    setLoading(true);
    try {
      const user = await base44.auth.me();
      if (!user) throw new Error("Usuário não autenticado");

      if (!formData.name.trim()) {
        toast.error("O nome da equipe é obrigatório.");
        setLoading(false);
        return;
      }

      const newTeam = await base44.entities.Team.create({
        name: formData.name.trim(),
        description: formData.description,
        owner_email: user.email,
        members: [user.email], // Add creator as member automatically
        is_active: true
      });

      if (newTeam && newTeam.id) {
        toast.success("Equipe criada com sucesso!");
        if (onSuccess) onSuccess(newTeam);
      } else {
        throw new Error("Erro ao criar equipe");
      }
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro ao criar equipe: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 py-2">
      <div className="space-y-2">
        <Label>Nome da Equipe *</Label>
        <Input 
          placeholder="Ex: Departamento Jurídico, Sócios, Penal..."
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
        />
      </div>

      <div className="space-y-2">
        <Label>Descrição</Label>
        <Textarea 
          placeholder="Objetivo desta equipe..."
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button onClick={createTeam} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Users className="w-4 h-4 mr-2" />}
          Criar Equipe
        </Button>
      </div>
    </div>
  );
}