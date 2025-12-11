import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Plus, Mail, Trash2, Crown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Teams({ theme = 'light' }) {
  const isDark = theme === 'dark';
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");

  // Auth
  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Fetch Teams
  const { data: teams = [], isLoading } = useQuery({
    queryKey: ['teams', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      // Fetch all teams and filter in memory to ensure visibility for both owners and members
      const allTeams = await base44.entities.Team.list('-created_date');
      return allTeams.filter(t => 
        t.owner_email === user.email || 
        (Array.isArray(t.members) && t.members.includes(user.email))
      );
    },
    enabled: !!user?.email
  });

  // Create Team Mutation
  const createTeamMutation = useMutation({
    mutationFn: async (name) => {
      if (!user) throw new Error("User not authenticated");
      return await base44.entities.Team.create({
        name: name,
        description: "Nova equipe",
        owner_email: user.email,
        members: [user.email], // Ensure owner is in members list
        is_active: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      setIsCreateOpen(false);
      setNewTeamName("");
      toast.success("Equipe criada com sucesso!");
    },
    onError: () => toast.error("Erro ao criar equipe.")
  });

  // Add Member Mutation
  const addMemberMutation = useMutation({
    mutationFn: async ({ team, email }) => {
      const currentMembers = Array.isArray(team.members) ? team.members : [];
      if (currentMembers.includes(email)) throw new Error("User already in team");
      
      return await base44.entities.Team.update(team.id, {
        members: [...currentMembers, email]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      setNewMemberEmail("");
      toast.success("Membro adicionado!");
    },
    onError: (err) => toast.error(err.message || "Erro ao adicionar membro.")
  });

  // Delete Team Mutation
  const deleteTeamMutation = useMutation({
    mutationFn: (id) => base44.entities.Team.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success("Equipe excluída.");
    }
  });

  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-neutral-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Gestão de Equipes</h1>
            <p className="text-gray-500">Crie e gerencie seus times de trabalho</p>
          </div>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Criar Nova Equipe
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Equipe</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nome da Equipe</label>
                  <Input 
                    value={newTeamName} 
                    onChange={(e) => setNewTeamName(e.target.value)}
                    placeholder="Ex: Departamento Civil"
                  />
                </div>
                <Button 
                  onClick={() => createTeamMutation.mutate(newTeamName)}
                  disabled={!newTeamName.trim() || createTeamMutation.isPending}
                  className="w-full"
                >
                  {createTeamMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Criar Equipe
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Teams List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : teams.length === 0 ? (
          <Card className="text-center py-12 border-dashed">
            <CardContent>
              <Users className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Nenhuma equipe encontrada</h3>
              <p className="text-gray-500 mb-4">Crie sua primeira equipe para começar a colaborar.</p>
              <Button onClick={() => setIsCreateOpen(true)} variant="outline">
                Criar Equipe Agora
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map(team => (
              <Card key={team.id} className="flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg font-bold">{team.name}</CardTitle>
                  {user?.email === team.owner_email && (
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => {
                        if(confirm("Tem certeza que deseja excluir esta equipe?")) {
                          deleteTeamMutation.mutate(team.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <div className="text-sm text-gray-500">
                    <div className="flex items-center gap-2 mb-2">
                      <Crown className="w-4 h-4 text-yellow-500" />
                      Owner: {team.owner_email}
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      {team.members?.length || 0} Membros
                    </div>
                  </div>

                  <div className="border-t pt-4 mt-2">
                    <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">Membros</h4>
                    <ul className="space-y-2 max-h-32 overflow-y-auto mb-4">
                      {team.members?.map(member => (
                        <li key={member} className="flex items-center text-sm gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          <span className="truncate">{member}</span>
                        </li>
                      ))}
                    </ul>

                    {user?.email === team.owner_email && (
                      <div className="flex gap-2">
                        <Input 
                          placeholder="email@convidado.com" 
                          className="h-8 text-sm"
                          value={newMemberEmail}
                          onChange={(e) => setNewMemberEmail(e.target.value)}
                        />
                        <Button 
                          size="sm" 
                          className="h-8"
                          onClick={() => addMemberMutation.mutate({ team, email: newMemberEmail })}
                          disabled={!newMemberEmail.trim() || addMemberMutation.isPending}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <div className="pt-2">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => navigate(createPageUrl('TeamWorkspace') + `?team=${team.id}`)}
                    >
                      Acessar Workspace
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}