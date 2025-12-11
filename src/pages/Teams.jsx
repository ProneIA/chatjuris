import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Plus, Mail, Trash2, Shield, Search, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function Teams({ theme = 'light' }) {
  const isDark = theme === 'dark';
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  // Estados da UI
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Estado do Formulário de Criação
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDesc, setNewTeamDesc] = useState("");

  // Estado para Adicionar Membro
  const [memberEmailToAdd, setMemberEmailToAdd] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // QUERY: Buscar Equipes
  const { data: teams = [], isLoading } = useQuery({
    queryKey: ['teams-list', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      // Rely on RLS (Row Level Security) to return only teams the user has access to
      // fetching with a filter for safety where possible, or just listing as RLS enforces visibility
      return await base44.entities.Team.list('-created_date');
    },
    enabled: !!user?.email
  });

  // MUTATION: Criar Equipe
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!newTeamName.trim()) throw new Error("Nome é obrigatório");
      
      // Explicit creation ensuring creator is owner and member
      return await base44.entities.Team.create({
        name: newTeamName,
        description: newTeamDesc,
        owner_email: user.email,
        members: [user.email], 
        is_active: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams-list'] });
      toast.success("Equipe criada com sucesso!");
      setIsCreateModalOpen(false);
      setNewTeamName("");
      setNewTeamDesc("");
    },
    onError: () => toast.error("Erro ao criar equipe.")
  });

  // MUTATION: Deletar Equipe
  const deleteMutation = useMutation({
    mutationFn: async (id) => await base44.entities.Team.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams-list'] });
      toast.success("Equipe excluída.");
    }
  });

  // MUTATION: Adicionar Membro
  const addMemberMutation = useMutation({
    mutationFn: async ({ team, email }) => {
      if (!email.includes("@")) throw new Error("Email inválido");
      const currentMembers = team.members || [];
      if (currentMembers.includes(email)) throw new Error("Usuário já é membro");

      return await base44.entities.Team.update(team.id, {
        members: [...currentMembers, email]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams-list'] });
      toast.success("Membro adicionado!");
      setMemberEmailToAdd("");
      setSelectedTeamId(null);
    },
    onError: (e) => toast.error(e.message || "Erro ao adicionar membro")
  });

  // MUTATION: Remover Membro
  const removeMemberMutation = useMutation({
    mutationFn: async ({ team, email }) => {
      if (email === team.owner_email) throw new Error("Não pode remover o dono");
      
      return await base44.entities.Team.update(team.id, {
        members: team.members.filter(m => m !== email)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams-list'] });
      toast.success("Membro removido.");
    }
  });

  // Filtragem local para busca
  const filteredTeams = teams.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`min-h-screen p-8 ${isDark ? 'bg-neutral-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Equipes & Colaboração</h1>
            <p className="text-gray-500 mt-1">Gerencie seus times e compartilhe casos e documentos.</p>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Criar Nova Equipe
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input 
            placeholder="Buscar equipes..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Lista de Equipes */}
        {isLoading ? (
          <div className="text-center py-20">Carregando suas equipes...</div>
        ) : filteredTeams.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-xl bg-white">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900">Nenhuma equipe encontrada</h3>
            <p className="text-gray-500 mt-2 mb-6">Você ainda não faz parte de nenhuma equipe.</p>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(true)}>
              Criar sua primeira equipe
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTeams.map((team) => {
              const isOwner = team.owner_email === user?.email;
              
              return (
                <Card key={team.id} className="hover:shadow-lg transition-shadow border-t-4 border-t-indigo-500">
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
                          className="text-gray-400 hover:text-red-500 -mr-2 -mt-2"
                          onClick={() => {
                            if(confirm("Tem certeza? Isso apagará a equipe para todos.")) deleteMutation.mutate(team.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Lista de Membros */}
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Membros ({team.members?.length || 0})
                      </h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                        {team.members?.map((member) => (
                          <div key={member} className="flex items-center justify-between bg-gray-50 p-2 rounded-md text-sm">
                            <div className="flex items-center gap-2 truncate">
                              <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold">
                                {member[0].toUpperCase()}
                              </div>
                              <span className="truncate max-w-[150px]">{member}</span>
                              {member === team.owner_email && (
                                <Shield className="w-3 h-3 text-amber-500" title="Dono" />
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

                    {/* Adicionar Membro */}
                    {isOwner && (
                      <div className="pt-2 border-t mt-2">
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
                      className="w-full bg-gray-900 text-white hover:bg-black mt-2"
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

        {/* Modal de Criação */}
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
                  placeholder="Ex: Equipe responsável pelos processos cíveis..." 
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