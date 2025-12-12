import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Plus,
  Mail,
  Trash2,
  Shield,
  Search,
  UserPlus,
  X,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Teams({ theme = 'light' }) {
  const isDark = theme === 'dark';
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDesc, setNewTeamDesc] = useState("");
  const [addingMemberTo, setAddingMemberTo] = useState(null);
  const [memberEmail, setMemberEmail] = useState("");

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: teams = [], refetch } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const result = await base44.entities.Team.list('-created_date');
      console.log("👥 Equipes carregadas:", result.length);
      return result;
    },
    enabled: !!user
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!newTeamName.trim()) {
        throw new Error("Nome é obrigatório");
      }
      
      const teamData = {
        name: newTeamName.trim(),
        description: newTeamDesc.trim(),
        owner_email: user.email,
        members: [user.email],
        is_active: true
      };
      
      console.log("💾 Criando equipe:", teamData);
      const result = await base44.entities.Team.create(teamData);
      console.log("✅ Equipe criada:", result.id);
      return result;
    },
    onSuccess: async () => {
      await refetch();
      setShowCreateForm(false);
      setNewTeamName("");
      setNewTeamDesc("");
      toast.success("✅ Equipe criada!");
    },
    onError: (e) => {
      console.error("❌ Erro:", e);
      toast.error("Erro ao criar equipe");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Team.delete(id),
    onSuccess: () => {
      refetch();
      toast.success("Equipe excluída");
    }
  });

  const addMemberMutation = useMutation({
    mutationFn: async ({ teamId, email }) => {
      if (!email.includes("@")) {
        throw new Error("Email inválido");
      }
      
      const team = teams.find(t => t.id === teamId);
      const currentMembers = team.members || [];
      
      if (currentMembers.includes(email)) {
        throw new Error("Usuário já é membro");
      }
      
      console.log("➕ Adicionando membro:", email);
      return await base44.entities.Team.update(teamId, {
        members: [...currentMembers, email]
      });
    },
    onSuccess: () => {
      refetch();
      setAddingMemberTo(null);
      setMemberEmail("");
      toast.success("Membro adicionado!");
    },
    onError: (e) => {
      toast.error(e.message || "Erro ao adicionar");
    }
  });

  const removeMemberMutation = useMutation({
    mutationFn: async ({ teamId, email }) => {
      const team = teams.find(t => t.id === teamId);
      if (email === team.owner_email) {
        throw new Error("Não pode remover o dono");
      }
      
      console.log("➖ Removendo membro:", email);
      return await base44.entities.Team.update(teamId, {
        members: team.members.filter(m => m !== email)
      });
    },
    onSuccess: () => {
      refetch();
      toast.success("Membro removido");
    },
    onError: (e) => {
      toast.error(e.message);
    }
  });

  const filteredTeams = teams.filter(t =>
    t.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`}>
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Equipes & Colaboração
            </h1>
            <p className={`${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
              {teams.length} equipe{teams.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button
            onClick={() => setShowCreateForm(true)}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Criar Equipe
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar equipes..."
            className="pl-10"
          />
        </div>

        {/* Create Form Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
              <CardHeader className="flex flex-row justify-between items-center">
                <CardTitle>Criar Nova Equipe</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowCreateForm(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome da Equipe *</Label>
                  <Input
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    placeholder="Ex: Departamento Civil"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea
                    value={newTeamDesc}
                    onChange={(e) => setNewTeamDesc(e.target.value)}
                    placeholder="Descrição opcional..."
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={() => createMutation.mutate()}
                    disabled={createMutation.isPending}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    {createMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    Criar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Teams Grid */}
        {filteredTeams.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed rounded-xl">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nenhuma equipe encontrada</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setShowCreateForm(true)}
            >
              Criar primeira equipe
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTeams.map((team) => {
              const isOwner = team.owner_email === user?.email;
              
              return (
                <Card key={team.id} className="border-t-4 border-t-indigo-500">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{team.name}</CardTitle>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                          {team.description || "Sem descrição"}
                        </p>
                      </div>
                      {isOwner && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-400 hover:text-red-500 -mr-2 -mt-2"
                          onClick={() => {
                            if (confirm("Excluir esta equipe?")) {
                              deleteMutation.mutate(team.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Members */}
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                        Membros ({team.members?.length || 0})
                      </h4>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {team.members?.map((member) => (
                          <div
                            key={member}
                            className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm"
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold shrink-0">
                                {member[0].toUpperCase()}
                              </div>
                              <span className="truncate">{member}</span>
                              {member === team.owner_email && (
                                <Shield className="w-3 h-3 text-amber-500 shrink-0" />
                              )}
                            </div>
                            {isOwner && member !== user.email && (
                              <button
                                onClick={() =>
                                  removeMemberMutation.mutate({ teamId: team.id, email: member })
                                }
                                className="text-gray-400 hover:text-red-500 ml-2"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Add Member */}
                    {isOwner && (
                      <div className="pt-2 border-t">
                        {addingMemberTo === team.id ? (
                          <div className="flex gap-2">
                            <Input
                              placeholder="email@exemplo.com"
                              className="h-8 text-sm"
                              value={memberEmail}
                              onChange={(e) => setMemberEmail(e.target.value)}
                            />
                            <Button
                              size="sm"
                              className="h-8"
                              onClick={() =>
                                addMemberMutation.mutate({
                                  teamId: team.id,
                                  email: memberEmail
                                })
                              }
                              disabled={addMemberMutation.isPending}
                            >
                              {addMemberMutation.isPending ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                "Add"
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2"
                              onClick={() => {
                                setAddingMemberTo(null);
                                setMemberEmail("");
                              }}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full h-8 border-dashed"
                            onClick={() => setAddingMemberTo(team.id)}
                          >
                            <UserPlus className="w-3 h-3 mr-2" />
                            Adicionar Membro
                          </Button>
                        )}
                      </div>
                    )}

                    <Button
                      className="w-full bg-gray-900 hover:bg-black text-white"
                      onClick={() =>
                        navigate(createPageUrl('TeamWorkspace') + `?team=${team.id}`)
                      }
                    >
                      Acessar Workspace
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