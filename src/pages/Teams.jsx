import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Plus, Trash2, Shield, Search, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function Teams({ theme = 'light' }) {
  const isDark = theme === 'dark';
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDesc, setNewTeamDesc] = useState("");
  const [memberEmailToAdd, setMemberEmailToAdd] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: teams = [], refetch } = useQuery({
    queryKey: ['teams', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      // Filtra equipes onde o usuário é dono ou membro
      const all = await base44.entities.Team.list('-created_date');
      // Reforça filtro no cliente se necessário, mas list já deve trazer tudo
      // Para garantir que ele veja o que criou:
      return all.filter(t => t.owner_email === user.email || t.members?.includes(user.email));
    },
    enabled: !!user?.email
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!newTeamName.trim()) throw new Error("Nome é obrigatório");
      
      return await base44.entities.Team.create({
        name: newTeamName.trim(),
        description: newTeamDesc.trim(),
        owner_email: user.email,
        members: [user.email],
        is_active: true
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['teams'] });
      await refetch();
      toast.success("✅ Equipe criada com sucesso!");
      setIsCreateModalOpen(false);
      setNewTeamName("");
      setNewTeamDesc("");
    },
    onError: (err) => toast.error(`Erro: ${err.message}`)
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Team.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success("Equipe excluída");
    }
  });

  const addMemberMutation = useMutation({
    mutationFn: async ({ team, email }) => {
      if (!email.includes("@")) throw new Error("Email inválido");
      const current = team.members || [];
      if (current.includes(email)) throw new Error("Usuário já é membro");

      return await base44.entities.Team.update(team.id, {
        members: [...current, email]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success("Membro adicionado!");
      setMemberEmailToAdd("");
      setSelectedTeamId(null);
    },
    onError: (e) => toast.error(e.message)
  });

  const removeMemberMutation = useMutation({
    mutationFn: async ({ team, email }) => {
      if (email === team.owner_email) throw new Error("Não pode remover o dono");
      
      return await base44.entities.Team.update(team.id, {
        members: team.members.filter(m => m !== email)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success("Membro removido");
    }
  });

  const filteredTeams = teams.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`min-h-screen p-8 ${isDark ? 'bg-neutral-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Equipes & Colaboração</h1>
            <p className="text-gray-500 mt-1">Gerencie seus times</p>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)} className="bg-indigo-600">
            <Plus className="w-4 h-4 mr-2" />
            Criar Nova Equipe
          </Button>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input 
            placeholder="Buscar equipes..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {filteredTeams.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed rounded-xl">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium">Nenhuma equipe encontrada</h3>
            <p className="text-gray-500 mt-2 mb-6">Crie sua primeira equipe</p>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(true)}>
              Criar equipe
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTeams.map((team) => {
              const isOwner = team.owner_email === user?.email;
              
              return (
                <Card key={team.id} className="border-t-4 border-t-indigo-500">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{team.name}</CardTitle>
                        <CardDescription className="line-clamp-1 mt-1">
                          {team.description || "Sem descrição"}
                        </CardDescription>
                      </div>
                      {isOwner && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-gray-400 hover:text-red-500"
                          onClick={() => {
                            if(confirm("Excluir esta equipe?")) deleteMutation.mutate(team.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                        Membros ({team.members?.length || 0})
                      </h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {team.members?.map((member) => (
                          <div key={member} className="flex items-center justify-between bg-gray-50 p-2 rounded-md text-sm">
                            <div className="flex items-center gap-2 truncate">
                              <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold">
                                {member[0].toUpperCase()}
                              </div>
                              <span className="truncate">{member}</span>
                              {member === team.owner_email && (
                                <Shield className="w-3 h-3 text-amber-500" />
                              )}
                            </div>
                            
                            {isOwner && member !== user.email && (
                              <button 
                                onClick={() => removeMemberMutation.mutate({ team, email: member })}
                                className="text-gray-400 hover:text-red-500"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {isOwner && (
                      <div className="pt-2 border-t">
                        {selectedTeamId === team.id ? (
                          <div className="flex gap-2">
                            <Input 
                              placeholder="email@exemplo.com" 
                              className="h-8 text-sm"
                              value={memberEmailToAdd}
                              onChange={(e) => setMemberEmailToAdd(e.target.value)}
                            />
                            <Button 
                              size="sm" 
                              className="h-8"
                              onClick={() => addMemberMutation.mutate({ team, email: memberEmailToAdd })}
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
                            className="w-full h-8 border-dashed"
                            onClick={() => setSelectedTeamId(team.id)}
                          >
                            <UserPlus className="w-3 h-3 mr-2" />
                            Adicionar Membro
                          </Button>
                        )}
                      </div>
                    )}
                    
                    <Button 
                      className="w-full bg-gray-900 text-white"
                      onClick={() => navigate(createPageUrl('TeamWorkspace') + `?team=${team.id}`)}
                    >
                      Acessar Workspace
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Equipe</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome da Equipe</Label>
                <Input 
                  placeholder="Ex: Departamento Civil" 
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Descrição (Opcional)</Label>
                <Textarea 
                  placeholder="Descrição da equipe..." 
                  value={newTeamDesc}
                  onChange={(e) => setNewTeamDesc(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancelar</Button>
              <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Criando..." : "Criar Equipe"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}