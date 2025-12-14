import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Users, Plus, Trash2, Loader2, Shield } from "lucide-react";
import { toast } from "sonner";

// PÁGINA RECONSTRUÍDA DO ZERO - Foco em Equipes e Propriedade
export default function Teams() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");

  // 1. AUTENTICAÇÃO
  useEffect(() => {
    base44.auth.me()
      .then(u => {
        if (!u) throw new Error("Não autenticado");
        setUser(u);
      })
      .catch(() => toast.error("Sessão inválida."));
  }, []);

  // 2. LISTAGEM ESTRITA (Owner e Membro)
  const { data: myTeams = [], isLoading, refetch } = useQuery({
    queryKey: ['my-teams', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      console.log("🔍 Buscando equipes de:", user.email);
      
      // Busca todas as equipes que o usuário pode ver (dono ou membro)
      const allTeams = await base44.entities.Team.list('-created_date');
      
      // Filtra no cliente para garantir visibilidade correta
      const myVisibleTeams = allTeams.filter(t => 
        t.owner_email === user.email || t.members?.includes(user.email)
      );
      
      console.log("👥 Total encontrado:", allTeams.length, "| Minhas equipes:", myVisibleTeams.length);
      return myVisibleTeams;
    },
    enabled: !!user?.email
  });

  // 3. CRIAÇÃO SEGURA
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user?.email) throw new Error("Sem usuário.");
      if (!newTeamName.trim()) throw new Error("Nome obrigatório.");

      console.log("💾 Criando equipe...");

      const team = await base44.entities.Team.create({
        name: newTeamName.trim(),
        description: "Equipe criada via Reset",
        owner_email: user.email,     // PROPRIETÁRIO
        members: [user.email],       // MEMBRO INICIAL
        is_active: true,
        created_by: user.email       // RLS CHECK
      });

      if (!team || !team.id) throw new Error("Banco não confirmou criação.");
      return team;
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ['my-teams'] });
      await refetch();
      toast.success(`✅ Equipe criada: ${data.name}`);
      setIsCreateOpen(false);
      setNewTeamName("");
    },
    onError: (e) => toast.error(e.message)
  });

  // 4. EXCLUSÃO
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.Team.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-teams'] });
      toast.success("Equipe removida.");
    }
  });

  if (!user) return <div className="p-8 text-center">Carregando...</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Minhas Equipes (Reset)</h1>
          <p className="text-gray-500 text-sm">Gerencie equipes onde você é o proprietário.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="bg-indigo-600">
          <Plus className="mr-2 w-4 h-4" /> Nova Equipe
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-10"><Loader2 className="animate-spin mx-auto" /></div>
      ) : myTeams.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="py-10 text-center text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-20" />
            <p>Você não criou nenhuma equipe ainda.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {myTeams.map(team => (
            <Card key={team.id} className="border-t-4 border-t-indigo-500">
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span className="truncate">{team.name}</span>
                  <Shield className="w-4 h-4 text-amber-500" title="Proprietário" />
                </CardTitle>
                <CardDescription>ID: {team.id}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-500 mb-4">
                  <p>Membros: {team.members?.length || 0}</p>
                  <p>Dono: {team.owner_email}</p>
                </div>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="w-full"
                  onClick={() => {
                    if(confirm("Excluir equipe permanentemente?")) deleteMutation.mutate(team.id);
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Excluir
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Equipe</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">Nome da Equipe</label>
            <Input 
              value={newTeamName} 
              onChange={e => setNewTeamName(e.target.value)}
              placeholder="Ex: Departamento Jurídico"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
            <Button 
              onClick={() => createMutation.mutate()} 
              disabled={createMutation.isPending || !newTeamName.trim()}
            >
              {createMutation.isPending ? "Criando..." : "Criar Equipe"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}