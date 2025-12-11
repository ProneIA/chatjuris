import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Users, Plus, Trash2, Mail, Shield, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Teams() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  // UI State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDesc, setNewTeamDesc] = useState("");
  const [memberToAdd, setMemberToAdd] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState(null); // ID of team being edited

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Fetch Teams
  const { data: teams = [], isLoading } = useQuery({
    queryKey: ['my-teams', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      // Fetch all teams - RLS (Row Level Security) should automatically filter 
      // to show only teams where user is owner OR member.
      return await base44.entities.Team.list('-created_date');
    },
    enabled: !!user?.email
  });

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!newTeamName.trim()) throw new Error("Nome da equipe é obrigatório");
      
      return await base44.entities.Team.create({
        name: newTeamName,
        description: newTeamDesc,
        owner_email: user.email,
        members: [user.email], // CRITICAL: Explicitly add creator to members list
        is_active: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-teams'] });
      toast.success("Equipe criada!");
      setIsCreateOpen(false);
      setNewTeamName("");
      setNewTeamDesc("");
    },
    onError: () => toast.error("Erro ao criar equipe.")
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => await base44.entities.Team.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-teams'] });
      toast.success("Equipe excluída.");
    }
  });

  // Add Member Mutation
  const addMemberMutation = useMutation({
    mutationFn: async ({ team, email }) => {
      if (!email || !email.includes("@")) throw new Error("Email inválido");
      const currentMembers = team.members || [];
      if (currentMembers.includes(email)) throw new Error("Usuário já está na equipe");

      return await base44.entities.Team.update(team.id, {
        members: [...currentMembers, email]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-teams'] });
      toast.success("Membro adicionado!");
      setMemberToAdd("");
      setSelectedTeamId(null);
    },
    onError: (e) => toast.error(e.message || "Erro ao adicionar membro")
  });

  // Remove Member Mutation
  const removeMemberMutation = useMutation({
    mutationFn: async ({ team, email }) => {
      const currentMembers = team.members || [];
      return await base44.entities.Team.update(team.id, {
        members: currentMembers.filter(m => m !== email)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-teams'] });
      toast.success("Membro removido.");
    }
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Equipes</h1>
            <p className="text-gray-500">Colabore em processos e documentos.</p>
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
                    placeholder="Ex: Equipe responsável por casos trabalhistas..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Criando..." : "Criar Equipe"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="text-center py-20">Carregando equipes...</div>
        ) : teams.length === 0 ? (
          <Card className="text-center py-16 border-dashed">
            <CardContent>
              <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-medium text-gray-900">Nenhuma equipe encontrada</h3>
              <p className="text-gray-500 mb-6 mt-2">Crie sua primeira equipe para começar.</p>
              <Button onClick={() => setIsCreateOpen(true)}>Criar Equipe</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => {
              const isOwner = user?.email === team.owner_email;
              const memberCount = team.members?.length || 0;

              return (
                <Card key={team.id} className="flex flex-col hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg font-bold text-gray-900">{team.name}</CardTitle>
                        <CardDescription className="line-clamp-1 mt-1">
                          {team.description || "Sem descrição"}
                        </CardDescription>
                      </div>
                      {isOwner && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-gray-400 hover:text-red-500 -mr-2 -mt-2"
                          onClick={() => {
                            if(confirm("Excluir esta equipe permanentemente?")) deleteMutation.mutate(team.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="flex-1 space-y-4">
                    {/* Stats & Role */}
                    <div className="flex items-center gap-3 text-sm text-gray-500 bg-gray-50 p-2 rounded-md">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{memberCount} Membro(s)</span>
                      </div>
                      {isOwner && (
                        <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded font-medium border border-yellow-200">
                          Proprietário
                        </span>
                      )}
                    </div>

                    {/* Members List */}
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-400 uppercase">Membros</p>
                      <ScrollArea className="h-32 pr-2">
                        <div className="space-y-2">
                          {team.members?.map((memberEmail) => (
                            <div key={memberEmail} className="flex items-center justify-between text-sm group">
                              <div className="flex items-center gap-2 truncate">
                                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold shrink-0">
                                  {memberEmail[0].toUpperCase()}
                                </div>
                                <span className="truncate max-w-[140px]" title={memberEmail}>
                                  {memberEmail}
                                </span>
                                {memberEmail === team.owner_email && (
                                  <Shield className="w-3 h-3 text-yellow-500 shrink-0" />
                                )}
                              </div>
                              
                              {isOwner && memberEmail !== user.email && (
                                <button 
                                  onClick={() => removeMemberMutation.mutate({ team, email: memberEmail })}
                                  className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>

                    {/* Add Member Action */}
                    {isOwner && (
                      <div className="pt-2 border-t">
                        {selectedTeamId === team.id ? (
                          <div className="flex gap-2 animate-in fade-in slide-in-from-top-1">
                            <Input 
                              placeholder="email@exemplo.com" 
                              className="h-8 text-sm"
                              value={memberToAdd}
                              onChange={(e) => setMemberToAdd(e.target.value)}
                            />
                            <Button 
                              size="sm" 
                              className="h-8 px-3"
                              onClick={() => addMemberMutation.mutate({ team, email: memberToAdd })}
                              disabled={addMemberMutation.isPending}
                            >
                              Add
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 px-2"
                              onClick={() => setSelectedTeamId(null)}
                            >
                              X
                            </Button>
                          </div>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full h-8 border-dashed text-gray-500 hover:text-gray-800"
                            onClick={() => setSelectedTeamId(team.id)}
                          >
                            <UserPlus className="w-3 h-3 mr-2" />
                            Adicionar Membro
                          </Button>
                        )}
                      </div>
                    )}

                    <Button 
                      className="w-full bg-gray-900 text-white hover:bg-black mt-2"
                      onClick={() => navigate(createPageUrl('TeamWorkspace') + `?team=${team.id}`)}
                    >
                      Abrir Workspace
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}