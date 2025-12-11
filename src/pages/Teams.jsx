import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const [memberEmails, setMemberEmails] = useState({});
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: teams = [] } = useQuery({
    queryKey: ['teams', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.Team.list('-created_date');
    },
    enabled: !!user?.email
  });

  const createTeamMutation = useMutation({
    mutationFn: async (data) => {
      return base44.entities.Team.create({
        name: data.name,
        description: data.description,
        owner_email: user.email,
        members: [user.email],
        is_active: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success("✅ Equipe criada com sucesso!");
      setShowNewTeamForm(false);
      setNewTeamData({ name: "", description: "" });
    },
    onError: (error) => {
      toast.error("Erro ao criar equipe: " + error.message);
    }
  });

  const updateTeamMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Team.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success("✅ Equipe atualizada!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar equipe: " + error.message);
    }
  });

  const deleteTeamMutation = useMutation({
    mutationFn: (id) => base44.entities.Team.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success("✅ Equipe removida!");
    },
    onError: (error) => {
      toast.error("Erro ao remover equipe: " + error.message);
    }
  });

  const handleCreateTeam = () => {
    if (!newTeamData.name.trim()) {
      toast.error("⚠️ Nome da equipe é obrigatório");
      return;
    }
    createTeamMutation.mutate(newTeamData);
  };

  const handleAddMember = (team, teamId) => {
    const email = memberEmails[teamId];
    if (!email || !email.trim()) {
      toast.error("⚠️ Digite um email válido");
      return;
    }
    if (team.members?.includes(email)) {
      toast.error("⚠️ Este usuário já é membro da equipe");
      return;
    }

    updateTeamMutation.mutate({
      id: team.id,
      data: {
        name: team.name,
        description: team.description,
        owner_email: team.owner_email,
        members: [...(team.members || []), email],
        is_active: team.is_active
      }
    });
    setMemberEmails({ ...memberEmails, [teamId]: "" });
  };

  const handleRemoveMember = (team, memberEmail) => {
    if (memberEmail === team.owner_email) {
      toast.error("⚠️ Não é possível remover o proprietário");
      return;
    }

    updateTeamMutation.mutate({
      id: team.id,
      data: {
        name: team.name,
        description: team.description,
        owner_email: team.owner_email,
        members: team.members.filter(m => m !== memberEmail),
        is_active: team.is_active
      }
    });
  };

  const filteredTeams = teams.filter(t =>
    t.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const myTeams = teams.filter(t => t.owner_email === user?.email);
  const totalMembers = teams.reduce((acc, t) => acc + (t.members?.length || 0), 0);

  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className={`text-3xl font-light ${isDark ? 'text-white' : 'text-gray-900'}`}>Equipes</h1>
            <p className={`mt-1 ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
              Gerencie equipes e colaboradores
            </p>
          </div>
          <Button 
            onClick={() => setShowNewTeamForm(true)} 
            className="bg-gradient-to-r from-blue-600 to-purple-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Equipe
          </Button>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : ''}>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4" />
                Total de Equipes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-light">{teams.length}</p>
            </CardContent>
          </Card>

          <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : ''}>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Crown className="w-4 h-4" />
                Suas Equipes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-light">{myTeams.length}</p>
            </CardContent>
          </Card>

          <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : ''}>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Total de Membros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-light">{totalMembers}</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
            <Input
              placeholder="Buscar equipes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-10 ${isDark ? 'bg-neutral-900 border-neutral-800 text-white' : ''}`}
            />
          </div>
        </div>

        {/* New Team Form */}
        {showNewTeamForm && (
          <Card className={`mb-6 ${isDark ? 'bg-neutral-900 border-neutral-800' : ''}`}>
            <CardHeader>
              <CardTitle>Nova Equipe</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input
                  placeholder="Nome da equipe"
                  value={newTeamData.name}
                  onChange={(e) => setNewTeamData({ ...newTeamData, name: e.target.value })}
                  className={isDark ? 'bg-neutral-800 border-neutral-700' : ''}
                />
                <Input
                  placeholder="Descrição (opcional)"
                  value={newTeamData.description}
                  onChange={(e) => setNewTeamData({ ...newTeamData, description: e.target.value })}
                  className={isDark ? 'bg-neutral-800 border-neutral-700' : ''}
                />
                <div className="flex gap-2">
                  <Button 
                    onClick={handleCreateTeam} 
                    disabled={createTeamMutation.isPending}
                    className="bg-gradient-to-r from-blue-600 to-purple-600"
                  >
                    {createTeamMutation.isPending ? 'Criando...' : 'Criar Equipe'}
                  </Button>
                  <Button variant="outline" onClick={() => setShowNewTeamForm(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Teams Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {filteredTeams.map((team) => (
            <Card key={team.id} className={isDark ? 'bg-neutral-900 border-neutral-800' : ''}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {team.name}
                      {team.owner_email === user?.email && (
                        <span className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-700">
                          Proprietário
                        </span>
                      )}
                    </CardTitle>
                    {team.description && (
                      <p className={`text-sm mt-1 ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                        {team.description}
                      </p>
                    )}
                  </div>
                  {team.owner_email === user?.email && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm("Deseja remover esta equipe?")) {
                          deleteTeamMutation.mutate(team.id);
                        }
                      }}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => navigate(createPageUrl('TeamWorkspace') + `?team=${team.id}`)}
                  variant="outline"
                  size="sm"
                  className="mb-4"
                >
                  Abrir Workspace
                  <ArrowRight className="w-3 h-3 ml-2" />
                </Button>

                <div className="space-y-3">
                  <p className="text-sm font-medium">
                    Membros ({team.members?.length || 0})
                  </p>
                  <div className="space-y-2">
                    {team.members?.map((memberEmail) => (
                      <div
                        key={memberEmail}
                        className={`flex items-center justify-between p-2 rounded ${
                          isDark ? 'bg-neutral-800' : 'bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{memberEmail}</span>
                          {memberEmail === team.owner_email && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">
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
                        value={memberEmails[team.id] || ""}
                        onChange={(e) => setMemberEmails({ ...memberEmails, [team.id]: e.target.value })}
                        className={`text-sm ${isDark ? 'bg-neutral-800 border-neutral-700' : ''}`}
                      />
                      <Button
                        size="sm"
                        onClick={() => handleAddMember(team, team.id)}
                        disabled={updateTeamMutation.isPending}
                        className="bg-gradient-to-r from-blue-600 to-purple-600"
                      >
                        <UserPlus className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTeams.length === 0 && (
          <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : ''}>
            <CardContent className="py-12 text-center">
              <Users className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-neutral-700' : 'text-gray-300'}`} />
              <p className={isDark ? 'text-neutral-400' : 'text-gray-500'}>
                Nenhuma equipe encontrada
              </p>
              <p className={`text-sm mt-1 ${isDark ? 'text-neutral-600' : 'text-gray-400'}`}>
                Crie sua primeira equipe para começar a colaborar
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}