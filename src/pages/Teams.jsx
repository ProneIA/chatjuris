import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Plus, UserPlus, Trash2, Crown, Search, Mail, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Teams({ theme = 'light' }) {
  const isDark = theme === 'dark';
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewTeamForm, setShowNewTeamForm] = useState(false);
  const [newTeamData, setNewTeamData] = useState({ name: "", description: "" });
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: teams = [] } = useQuery({
    queryKey: ['teams', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.Team.list('-created_date');
    },
    enabled: !!user?.email
  });

  const createTeamMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.Team.create({
        ...data,
        owner_email: user.email,
        members: [user.email],
        is_active: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success("Equipe criada!");
      setShowNewTeamForm(false);
      setNewTeamData({ name: "", description: "" });
    },
    onError: (error) => {
      console.error("Erro ao criar equipe:", error);
      toast.error("Erro ao criar equipe. Tente novamente.");
    }
  });

  const updateTeamMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return await base44.entities.Team.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success("Equipe atualizada!");
    },
    onError: (error) => {
      console.error("Erro ao atualizar equipe:", error);
      toast.error("Erro ao atualizar equipe.");
    }
  });

  const deleteTeamMutation = useMutation({
    mutationFn: (id) => base44.entities.Team.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success("Equipe removida!");
    }
  });

  const handleCreateTeam = () => {
    if (!newTeamData.name?.trim()) {
      toast.error("Nome da equipe é obrigatório");
      return;
    }
    createTeamMutation.mutate(newTeamData);
  };

  const handleAddMember = (team) => {
    if (!newMemberEmail?.trim()) {
      toast.error("Digite um email válido");
      return;
    }
    
    const currentMembers = Array.isArray(team.members) ? team.members : [];
    
    if (currentMembers.includes(newMemberEmail)) {
      toast.error("Usuário já é membro");
      return;
    }

    updateTeamMutation.mutate({
      id: team.id,
      data: {
        members: [...currentMembers, newMemberEmail]
      }
    });
    setNewMemberEmail("");
  };

  const handleRemoveMember = (team, memberEmail) => {
    if (memberEmail === team.owner_email) {
      toast.error("Não é possível remover o proprietário");
      return;
    }
    
    const currentMembers = Array.isArray(team.members) ? team.members : [];
    
    updateTeamMutation.mutate({
      id: team.id,
      data: {
        members: currentMembers.filter(m => m !== memberEmail)
      }
    });
  };

  const filteredTeams = teams.filter(t =>
    (t.owner_email === user?.email || t.members?.includes(user?.email)) &&
    t.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className={`text-3xl font-light ${isDark ? 'text-white' : 'text-gray-900'}`}>Equipes</h1>
            <p className={`mt-1 ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>Gerencie equipes e colaboradores</p>
          </div>
          <Button onClick={() => setShowNewTeamForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Equipe
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className={`border rounded-lg p-6 ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 border rounded-lg flex items-center justify-center ${isDark ? 'border-neutral-800' : 'border-gray-200'}`}>
                <Users className={`w-6 h-6 ${isDark ? 'text-white' : 'text-gray-700'}`} />
              </div>
              <div>
                <p className={`text-2xl font-light ${isDark ? 'text-white' : 'text-gray-900'}`}>{filteredTeams.length}</p>
                <p className={`text-sm ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>Total de Equipes</p>
              </div>
            </div>
          </div>

          <div className={`border rounded-lg p-6 ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 border rounded-lg flex items-center justify-center ${isDark ? 'border-neutral-800' : 'border-gray-200'}`}>
                <Crown className={`w-6 h-6 ${isDark ? 'text-white' : 'text-gray-700'}`} />
              </div>
              <div>
                <p className={`text-2xl font-light ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {filteredTeams.filter(t => t.owner_email === user?.email).length}
                </p>
                <p className={`text-sm ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>Suas Equipes</p>
              </div>
            </div>
          </div>

          <div className={`border rounded-lg p-6 ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 border rounded-lg flex items-center justify-center ${isDark ? 'border-neutral-800' : 'border-gray-200'}`}>
                <UserPlus className={`w-6 h-6 ${isDark ? 'text-white' : 'text-gray-700'}`} />
              </div>
              <div>
                <p className={`text-2xl font-light ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {filteredTeams.reduce((acc, t) => acc + (t.members?.length || 0), 0)}
                </p>
                <p className={`text-sm ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>Total de Membros</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-neutral-500' : 'text-gray-400'}`} />
            <Input
              placeholder="Buscar equipes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-10 ${isDark ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-white border-gray-200'}`}
            />
          </div>
        </div>

        {showNewTeamForm && (
          <div className={`mb-6 border rounded-lg p-6 ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}`}>
            <h3 className={`text-lg font-medium mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Nova Equipe</h3>
            <div className="space-y-4">
              <Input
                placeholder="Nome da equipe"
                value={newTeamData.name}
                onChange={(e) => setNewTeamData({ ...newTeamData, name: e.target.value })}
              />
              <Input
                placeholder="Descrição (opcional)"
                value={newTeamData.description}
                onChange={(e) => setNewTeamData({ ...newTeamData, description: e.target.value })}
              />
              <div className="flex gap-2">
                <Button onClick={handleCreateTeam} disabled={createTeamMutation.isPending}>
                  {createTeamMutation.isPending ? "Criando..." : "Criar Equipe"}
                </Button>
                <Button variant="outline" onClick={() => setShowNewTeamForm(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {filteredTeams.map((team) => (
            <div key={team.id} className={`border rounded-lg p-6 hover:shadow-lg transition-shadow ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{team.name}</h3>
                    {team.owner_email === user?.email && (
                      <span className={`text-xs px-2 py-0.5 rounded border ${isDark ? 'border-neutral-700 text-neutral-400' : 'border-gray-300 text-gray-600'}`}>
                        Proprietário
                      </span>
                    )}
                  </div>
                  {team.description && (
                    <p className={`text-sm mb-3 ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>{team.description}</p>
                  )}
                  <Button
                    onClick={() => navigate(createPageUrl('TeamWorkspace') + `?team=${team.id}`)}
                    variant="outline"
                    size="sm"
                  >
                    Abrir Workspace
                    <ArrowRight className="w-3 h-3 ml-2" />
                  </Button>
                </div>
                {team.owner_email === user?.email && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm("Deseja remover esta equipe?")) {
                        deleteTeamMutation.mutate(team.id);
                      }
                    }}
                    className="text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <div className="space-y-3">
                <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                  Membros ({team.members?.length || 0})
                </p>
                <div className="space-y-2">
                  {team.members?.map((memberEmail) => (
                    <div
                      key={memberEmail}
                      className={`flex items-center justify-between p-2 border rounded-lg ${isDark ? 'border-neutral-800' : 'border-gray-200'}`}
                    >
                      <div className="flex items-center gap-2">
                        <Mail className={`w-4 h-4 ${isDark ? 'text-neutral-600' : 'text-gray-400'}`} />
                        <span className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-700'}`}>{memberEmail}</span>
                        {memberEmail === team.owner_email && (
                          <span className={`text-xs px-1.5 py-0.5 rounded ${isDark ? 'bg-neutral-800 text-neutral-500' : 'bg-gray-100 text-gray-600'}`}>
                            Owner
                          </span>
                        )}
                      </div>
                      {team.owner_email === user?.email && memberEmail !== team.owner_email && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(team, memberEmail)}
                          className="h-6 text-xs text-red-500"
                        >
                          Remover
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                {team.owner_email === user?.email && (
                  <div className="flex gap-2 pt-2">
                    <Input
                      placeholder="email@exemplo.com"
                      value={selectedTeamId === team.id ? newMemberEmail : ""}
                      onChange={(e) => {
                        setSelectedTeamId(team.id);
                        setNewMemberEmail(e.target.value);
                      }}
                      className="text-sm"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleAddMember(team)}
                      disabled={updateTeamMutation.isPending}
                    >
                      <UserPlus className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredTeams.length === 0 && (
          <div className={`border rounded-lg p-12 text-center ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}`}>
            <Users className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-neutral-700' : 'text-gray-300'}`} />
            <p className={`mb-2 ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>Nenhuma equipe encontrada</p>
            <p className={`text-sm ${isDark ? 'text-neutral-600' : 'text-gray-400'}`}>Crie sua primeira equipe para começar</p>
          </div>
        )}
      </div>
    </div>
  );
}