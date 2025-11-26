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
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [newTeamData, setNewTeamData] = useState({ name: "", description: "" });
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  React.useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: teams = [] } = useQuery({
    queryKey: ['teams', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const allTeams = await base44.entities.Team.list('-created_date');
      return allTeams.filter(t => 
        t.owner_email === user.email || t.members?.includes(user.email)
      );
    },
    enabled: !!user?.email
  });

  const createTeamMutation = useMutation({
    mutationFn: (data) => base44.entities.Team.create({
      ...data,
      owner_email: user.email,
      members: [user.email]
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success("Equipe criada com sucesso!");
      setShowNewTeamForm(false);
      setNewTeamData({ name: "", description: "" });
    }
  });

  const updateTeamMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Team.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success("Equipe atualizada!");
    }
  });

  const deleteTeamMutation = useMutation({
    mutationFn: (id) => base44.entities.Team.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success("Equipe removida!");
      setSelectedTeam(null);
    }
  });

  const handleCreateTeam = () => {
    if (!newTeamData.name) {
      toast.error("Nome da equipe é obrigatório");
      return;
    }
    createTeamMutation.mutate(newTeamData);
  };

  const handleAddMember = (team) => {
    if (!newMemberEmail) {
      toast.error("Digite um email");
      return;
    }
    if (team.members?.includes(newMemberEmail)) {
      toast.error("Usuário já é membro da equipe");
      return;
    }
    updateTeamMutation.mutate({
      id: team.id,
      data: {
        ...team,
        members: [...(team.members || []), newMemberEmail]
      }
    });
    setNewMemberEmail("");
  };

  const handleRemoveMember = (team, memberEmail) => {
    if (memberEmail === team.owner_email) {
      toast.error("Não é possível remover o proprietário");
      return;
    }
    updateTeamMutation.mutate({
      id: team.id,
      data: {
        ...team,
        members: team.members.filter(m => m !== memberEmail)
      }
    });
  };

  const filteredTeams = teams.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`}
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className={`text-3xl font-light ${isDark ? 'text-white' : 'text-gray-900'}`}>Equipes</h1>
            <p className={`mt-1 ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>Gerencie equipes e colaboradores</p>
          </div>
          <Button onClick={() => setShowNewTeamForm(true)} className={isDark ? 'bg-white text-black hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'}
            <Plus className="w-4 h-4 mr-2" />
            Nova Equipe
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="border border-neutral-800 rounded-lg p-6 bg-black">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 border border-neutral-800 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-light text-white">{teams.length}</p>
                <p className="text-sm text-neutral-500">Total de Equipes</p>
              </div>
            </div>
          </div>

          <div className="border border-neutral-800 rounded-lg p-6 bg-black">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 border border-neutral-800 rounded-lg flex items-center justify-center">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-light text-white">
                  {teams.filter(t => t.owner_email === user?.email).length}
                </p>
                <p className="text-sm text-neutral-500">Suas Equipes</p>
              </div>
            </div>
          </div>

          <div className="border border-neutral-800 rounded-lg p-6 bg-black">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 border border-neutral-800 rounded-lg flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-light text-white">
                  {teams.reduce((acc, t) => acc + (t.members?.length || 0), 0)}
                </p>
                <p className="text-sm text-neutral-500">Total de Membros</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
            <Input
              placeholder="Buscar equipes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-neutral-900 border-neutral-800 text-white placeholder:text-neutral-600"
            />
          </div>
        </div>

        {showNewTeamForm && (
          <div className="mb-6 border border-neutral-800 rounded-lg p-6 bg-black">
            <h3 className="text-lg font-medium text-white mb-4">Nova Equipe</h3>
            <div className="space-y-4">
              <Input
                placeholder="Nome da equipe"
                value={newTeamData.name}
                onChange={(e) => setNewTeamData({ ...newTeamData, name: e.target.value })}
                className="bg-neutral-900 border-neutral-800 text-white placeholder:text-neutral-600"
              />
              <Input
                placeholder="Descrição (opcional)"
                value={newTeamData.description}
                onChange={(e) => setNewTeamData({ ...newTeamData, description: e.target.value })}
                className="bg-neutral-900 border-neutral-800 text-white placeholder:text-neutral-600"
              />
              <div className="flex gap-2">
                <Button onClick={handleCreateTeam} disabled={createTeamMutation.isPending} className="bg-white text-black hover:bg-gray-100">
                  Criar Equipe
                </Button>
                <Button variant="outline" onClick={() => setShowNewTeamForm(false)} className="border-neutral-800 text-white hover:bg-neutral-800">
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {filteredTeams.map((team) => (
            <div key={team.id} className="border border-neutral-800 rounded-lg p-6 bg-black hover:border-neutral-700 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-medium text-white">{team.name}</h3>
                    {team.owner_email === user?.email && (
                      <span className="text-xs px-2 py-0.5 rounded border border-neutral-700 text-neutral-400">
                        Proprietário
                      </span>
                    )}
                  </div>
                  {team.description && (
                    <p className="text-sm text-neutral-500 mb-3">{team.description}</p>
                  )}
                  <Button
                    onClick={() => navigate(createPageUrl('TeamWorkspace') + `?team=${team.id}`)}
                    variant="outline"
                    size="sm"
                    className="border-neutral-800 text-white hover:bg-neutral-800"
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
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <div className="space-y-3">
                <p className="text-sm text-neutral-400">
                  Membros ({team.members?.length || 0})
                </p>
                <div className="space-y-2">
                  {team.members?.map((memberEmail) => (
                    <div
                      key={memberEmail}
                      className="flex items-center justify-between p-2 border border-neutral-800 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-neutral-600" />
                        <span className="text-sm text-neutral-400">{memberEmail}</span>
                        {memberEmail === team.owner_email && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-500">Owner</span>
                        )}
                      </div>
                      {team.owner_email === user?.email && memberEmail !== team.owner_email && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(team, memberEmail)}
                          className="h-6 text-xs text-red-400 hover:text-red-300"
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
                      value={selectedTeam === team.id ? newMemberEmail : ""}
                      onChange={(e) => {
                        setSelectedTeam(team.id);
                        setNewMemberEmail(e.target.value);
                      }}
                      className="text-sm bg-neutral-900 border-neutral-800 text-white placeholder:text-neutral-600"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleAddMember(team)}
                      disabled={updateTeamMutation.isPending}
                      className="bg-white text-black hover:bg-gray-100"
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
          <div className="border border-neutral-800 rounded-lg p-12 text-center bg-black">
            <Users className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
            <p className="text-neutral-400 mb-2">Nenhuma equipe encontrada</p>
            <p className="text-sm text-neutral-600">Crie sua primeira equipe para começar a colaborar</p>
          </div>
        )}
      </div>
    </div>
  );
}