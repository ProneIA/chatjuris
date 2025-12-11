import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Users, Plus, Loader2, Trash2, Mail, Shield, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Teams() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDesc, setNewTeamDesc] = useState("");

  // Add Member State
  const [memberEmail, setMemberEmail] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState(null);

  // Auth
  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // QUERY: Fetch My Teams
  // We rely on RLS: read allows owner OR member.
  const { data: teams = [], isLoading } = useQuery({
    queryKey: ['my-teams'],
    queryFn: async () => {
      // Just listing. The backend security rules (RLS) filter what I can see.
      return await base44.entities.Team.list('-created_date');
    },
    enabled: !!user
  });

  // MUTATION: Create Team
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!newTeamName.trim()) throw new Error("Nome da equipe é obrigatório");
      if (!user?.email) throw new Error("Usuário não autenticado");

      return await base44.entities.Team.create({
        name: newTeamName,
        description: newTeamDesc,
        owner_email: user.email,
        members: [user.email], // Essential: Add creator as member immediately
        is_active: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-teams'] });
      setIsCreateOpen(false);
      setNewTeamName("");
      setNewTeamDesc("");
      toast.success("Equipe criada com sucesso!");
    },
    onError: (err) => {
      console.error(err);
      toast.error("Erro ao criar equipe.");
    }
  });

  // MUTATION: Add Member
  const addMemberMutation = useMutation({
    mutationFn: async ({ team, email }) => {
      const currentMembers = team.members || [];
      if (currentMembers.includes(email)) throw new Error("Usuário já está na equipe");

      return await base44.entities.Team.update(team.id, {
        members: [...currentMembers, email]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-teams'] });
      setMemberEmail("");
      setSelectedTeamId(null);
      toast.success("Membro adicionado!");
    },
    onError: (err) => toast.error(err.message || "Erro ao adicionar membro")
  });

  // MUTATION: Delete Team
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Team.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-teams'] });
      toast.success("Equipe excluída.");
    }
  });

  // MUTATION: Remove Member
  const removeMemberMutation = useMutation({
    mutationFn: async ({ team, email }) => {
      return await base44.entities.Team.update(team.id, {
        members: team.members.filter(m => m !== email)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-teams'] });
      toast.success("Membro removido.");
    }
  });

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8 min-h-screen bg-gray-50">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Minhas Equipes</h1>
          <p className="text-gray-500">Gerencie seus times e colaboradores.</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Criar Nova Equipe
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Equipe</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome</label>
                <Input 
                  value={newTeamName} 
                  onChange={(e) => setNewTeamName(e.target.value)} 
                  placeholder="Ex: Departamento Jurídico" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Descrição</label>
                <Textarea 
                  value={newTeamDesc} 
                  onChange={(e) => setNewTeamDesc(e.target.value)} 
                  placeholder="Descrição da equipe..." 
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Criando..." : "Criar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Teams Grid */}
      {isLoading ? (
        <div className="text-center py-20 text-gray-500">Carregando equipes...</div>
      ) : teams.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-xl bg-white">
          <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-medium text-gray-900">Você não possui equipes</h3>
          <p className="text-gray-500 mb-6">Crie uma equipe para começar a colaborar.</p>
          <Button onClick={() => setIsCreateOpen(true)} variant="outline">
            Criar Equipe
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => {
            const isOwner = team.owner_email === user?.email;
            
            return (
              <Card key={team.id} className="flex flex-col border-t-4 border-t-indigo-500 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{team.name}</CardTitle>
                      <CardDescription className="line-clamp-1 mt-1">
                        {team.description || "Sem descrição"}
                      </CardDescription>
                    </div>
                    {isOwner && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-gray-400 hover:text-red-500 -mt-2 -mr-2"
                        onClick={() => {
                          if (confirm("Apagar esta equipe permanentemente?")) deleteMutation.mutate(team.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="flex-1 flex flex-col gap-4">
                  {/* Members List */}
                  <div className="bg-gray-50 rounded-lg p-3 flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-500 uppercase">Membros</span>
                      <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full">{team.members?.length || 0}</span>
                    </div>
                    <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                      {team.members?.map((member) => (
                        <div key={member} className="flex items-center justify-between text-sm group">
                          <div className="flex items-center gap-2 truncate">
                            <div className={`w-2 h-2 rounded-full ${member === team.owner_email ? 'bg-amber-400' : 'bg-green-400'}`} />
                            <span className="truncate max-w-[150px]" title={member}>{member}</span>
                          </div>
                          {isOwner && member !== user.email && (
                            <button 
                              onClick={() => removeMemberMutation.mutate({ team, email: member })}
                              className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    {isOwner && (
                      <div className="flex gap-2">
                        <Input 
                          placeholder="Convidar email..." 
                          className="h-9 text-sm"
                          value={selectedTeamId === team.id ? memberEmail : ""}
                          onChange={(e) => {
                            setSelectedTeamId(team.id);
                            setMemberEmail(e.target.value);
                          }}
                        />
                        <Button 
                          size="sm" 
                          className="h-9 w-9 p-0"
                          onClick={() => addMemberMutation.mutate({ team, email: memberEmail })}
                          disabled={selectedTeamId !== team.id || !memberEmail || addMemberMutation.isPending}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                    
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => navigate(createPageUrl('TeamWorkspace') + `?team=${team.id}`)}
                    >
                      Abrir Workspace
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}