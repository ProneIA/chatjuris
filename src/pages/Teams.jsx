import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import ProGuard from "../components/common/ProGuard";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, UserPlus, Trash2, Crown, Search, Mail, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Teams() {
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
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Equipes</h1>
            <p className="text-slate-600 mt-1">Gerencie equipes e colaboradores</p>
          </div>
          <Button onClick={() => setShowNewTeamForm(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Nova Equipe
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{teams.length}</p>
                  <p className="text-sm text-slate-600">Total de Equipes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Crown className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">
                    {teams.filter(t => t.owner_email === user?.email).length}
                  </p>
                  <p className="text-sm text-slate-600">Suas Equipes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <UserPlus className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">
                    {teams.reduce((acc, t) => acc + (t.members?.length || 0), 0)}
                  </p>
                  <p className="text-sm text-slate-600">Total de Membros</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Buscar equipes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {showNewTeamForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>Nova Equipe</CardTitle>
                <CardDescription>Crie uma nova equipe para colaboração</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Input
                    placeholder="Nome da equipe"
                    value={newTeamData.name}
                    onChange={(e) => setNewTeamData({ ...newTeamData, name: e.target.value })}
                  />
                </div>
                <div>
                  <Input
                    placeholder="Descrição (opcional)"
                    value={newTeamData.description}
                    onChange={(e) => setNewTeamData({ ...newTeamData, description: e.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCreateTeam} disabled={createTeamMutation.isPending}>
                    Criar Equipe
                  </Button>
                  <Button variant="outline" onClick={() => setShowNewTeamForm(false)}>
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {filteredTeams.map((team) => (
            <Card key={team.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {team.name}
                      {team.owner_email === user?.email && (
                        <Badge variant="outline" className="text-xs">
                          <Crown className="w-3 h-3 mr-1" />
                          Proprietário
                        </Badge>
                      )}
                    </CardTitle>
                    {team.description && (
                      <CardDescription className="mt-2">{team.description}</CardDescription>
                    )}
                    <Button
                      onClick={() => navigate(createPageUrl('TeamWorkspace') + `?team=${team.id}`)}
                      variant="outline"
                      size="sm"
                      className="mt-3"
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
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-700 mb-2">
                      Membros ({team.members?.length || 0})
                    </p>
                    <div className="space-y-2">
                      {team.members?.map((memberEmail) => (
                        <div
                          key={memberEmail}
                          className="flex items-center justify-between p-2 bg-slate-50 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-slate-400" />
                            <span className="text-sm text-slate-700">{memberEmail}</span>
                            {memberEmail === team.owner_email && (
                              <Badge variant="secondary" className="text-xs">Owner</Badge>
                            )}
                          </div>
                          {team.owner_email === user?.email && memberEmail !== team.owner_email && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveMember(team, memberEmail)}
                              className="h-6 text-xs text-red-600 hover:text-red-700"
                            >
                              Remover
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {team.owner_email === user?.email && (
                    <div className="flex gap-2">
                      <Input
                        placeholder="email@exemplo.com"
                        value={selectedTeam === team.id ? newMemberEmail : ""}
                        onChange={(e) => {
                          setSelectedTeam(team.id);
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
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTeams.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 mb-2">Nenhuma equipe encontrada</p>
              <p className="text-sm text-slate-500">Crie sua primeira equipe para começar a colaborar</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}