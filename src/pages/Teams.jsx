import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Users, Plus, Trash2, Loader2, Edit2, User } from "lucide-react";
import { toast } from "sonner";

export default function Teams({ theme = 'light' }) {
  const isDark = theme === 'dark';
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false);
  const [editingMemberIndex, setEditingMemberIndex] = useState(null);
  const [memberForm, setMemberForm] = useState({
    name: "",
    position: "",
    activities: ""
  });

  useEffect(() => {
    base44.auth.me()
      .then(u => {
        if (!u) throw new Error("Não autenticado");
        setUser(u);
      })
      .catch((err) => {
        console.error("Erro ao carregar sessão:", err);
        toast.error("Sessão inválida. Por favor, faça login novamente.");
      });
  }, []);

  const { data: myTeams = [], isLoading, refetch } = useQuery({
    queryKey: ['my-teams', user?.email],
    queryFn: async () => {
      if (!user?.email) {
        console.log("⏸️ [QUERY] Aguardando usuário...");
        return [];
      }
      
      console.log("🔍 [QUERY] Buscando equipes para:", user.email);
      
      const teams = await base44.entities.Team.list('-created_date');
      
      console.log("📋 [QUERY] Total de equipes:", teams.length);
      console.log("📋 [QUERY] Todas equipes:", teams);
      
      const myTeams = teams.filter(t => t.user_email === user.email);
      
      console.log("📋 [QUERY] Minhas equipes filtradas:", myTeams.length);
      console.log("📋 [QUERY] Meus dados:", myTeams);
      
      return myTeams;
    },
    enabled: !!user?.email,
    refetchOnWindowFocus: true,
    refetchOnMount: true
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      console.log("🚀 [CREATE] Iniciando criação...");
      console.log("👤 [CREATE] Usuário:", user);
      
      if (!user?.email) {
        console.error("❌ [CREATE] Erro: Sem usuário");
        throw new Error("Sem usuário.");
      }
      if (!newTeamName.trim()) {
        console.error("❌ [CREATE] Erro: Nome vazio");
        throw new Error("Nome obrigatório.");
      }

      const payload = {
        name: newTeamName.trim(),
        user_email: user.email,
        members: [],
        is_active: true
      };

      console.log("📦 [CREATE] Payload:", payload);
      
      const result = await base44.entities.Team.create(payload);
      
      console.log("✅ [CREATE] Resultado:", result);
      
      if (!result || !result.id) {
        console.error("❌ [CREATE] Erro: Sem ID retornado", result);
        throw new Error("Falha ao criar equipe");
      }
      
      return result;
    },
    onSuccess: async (data) => {
      console.log("✅ [SUCCESS] Equipe criada:", data);
      console.log("🔄 [SUCCESS] Invalidando cache...");
      
      await queryClient.invalidateQueries({ queryKey: ['my-teams'] });
      
      console.log("🔄 [SUCCESS] Forçando refetch...");
      await refetch();
      
      console.log("✅ [SUCCESS] Atualização completa");
      
      toast.success("✅ Equipe criada com sucesso!");
      setIsCreateOpen(false);
      setNewTeamName("");
    },
    onError: (e) => {
      console.error("❌ [ERROR] Erro na criação:", e);
      console.error("❌ [ERROR] Stack:", e.stack);
      toast.error(e.message || "Erro ao criar equipe");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.Team.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-teams'] });
      toast.success("Equipe removida.");
      setSelectedTeam(null);
    }
  });

  const addOrUpdateMemberMutation = useMutation({
    mutationFn: async ({ teamId, memberData, index }) => {
      const team = myTeams.find(t => t.id === teamId);
      const updatedMembers = [...(team.members || [])];
      
      if (index !== null) {
        updatedMembers[index] = memberData;
      } else {
        updatedMembers.push(memberData);
      }

      return await base44.entities.Team.update(teamId, {
        members: updatedMembers
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-teams'] });
      toast.success(editingMemberIndex !== null ? "Membro atualizado!" : "Membro adicionado!");
      setIsMemberDialogOpen(false);
      setMemberForm({ name: "", position: "", activities: "" });
      setEditingMemberIndex(null);
    }
  });

  const removeMemberMutation = useMutation({
    mutationFn: async ({ teamId, index }) => {
      const team = myTeams.find(t => t.id === teamId);
      const updatedMembers = team.members.filter((_, i) => i !== index);
      return await base44.entities.Team.update(teamId, { members: updatedMembers });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-teams'] });
      toast.success("Membro removido!");
    }
  });

  const handleAddMember = (team) => {
    setSelectedTeam(team);
    setMemberForm({ name: "", position: "", activities: "" });
    setEditingMemberIndex(null);
    setIsMemberDialogOpen(true);
  };

  const handleEditMember = (team, index) => {
    setSelectedTeam(team);
    setMemberForm(team.members[index]);
    setEditingMemberIndex(index);
    setIsMemberDialogOpen(true);
  };

  const handleSaveMember = () => {
    if (!memberForm.name.trim() || !memberForm.position.trim()) {
      toast.error("Nome e cargo são obrigatórios");
      return;
    }

    addOrUpdateMemberMutation.mutate({
      teamId: selectedTeam.id,
      memberData: memberForm,
      index: editingMemberIndex
    });
  };

  if (!user) {
    return (
      <div className="p-8 flex justify-center items-center">
        <Loader2 className="animate-spin mr-2" /> Carregando sessão...
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-8 ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Minhas Equipes
            </h1>
            <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
              {myTeams.length} equipe(s) encontrada(s)
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} className="bg-indigo-600">
            <Plus className="mr-2 w-4 h-4" /> Nova Equipe
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-10">
            <Loader2 className="animate-spin mx-auto" />
          </div>
        ) : myTeams.length === 0 ? (
          <Card className={`border-dashed border-2 ${isDark ? 'bg-neutral-900 border-neutral-700' : 'bg-white'}`}>
            <CardContent className="py-10 text-center">
              <Users className={`w-12 h-12 mx-auto mb-2 opacity-20 ${isDark ? 'text-neutral-600' : 'text-gray-400'}`} />
              <p className={isDark ? 'text-neutral-400' : 'text-gray-500'}>Nenhuma equipe encontrada.</p>
              <p className={`text-xs mt-2 ${isDark ? 'text-neutral-500' : 'text-gray-400'}`}>
                Clique em "Nova Equipe" para criar a primeira.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {myTeams.map(team => (
              <Card key={team.id} className={`${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className={isDark ? 'text-white' : 'text-gray-900'}>
                        {team.name}
                      </CardTitle>
                      <CardDescription className={isDark ? 'text-neutral-400' : 'text-gray-600'}>
                        {team.members?.length || 0} membro(s)
                      </CardDescription>
                    </div>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => {
                        if(confirm("Excluir equipe?")) deleteMutation.mutate(team.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Lista de Membros */}
                  <div className="space-y-2">
                    {team.members?.map((member, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-gray-50 border-gray-200'}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <User className="w-4 h-4 text-indigo-600" />
                              <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {member.name}
                              </span>
                            </div>
                            <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                              {member.position}
                            </p>
                            {member.activities && (
                              <p className={`text-xs mt-1 ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                                {member.activities}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditMember(team, index)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                if(confirm("Remover membro?")) {
                                  removeMemberMutation.mutate({ teamId: team.id, index });
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleAddMember(team)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Membro
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Dialog Criar Equipe */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}>
            <DialogHeader>
              <DialogTitle className={isDark ? 'text-white' : 'text-gray-900'}>
                Criar Equipe
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <label className={`text-sm font-medium ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                Nome da Equipe
              </label>
              <Input 
                value={newTeamName} 
                onChange={e => setNewTeamName(e.target.value)}
                placeholder="Ex: Departamento Jurídico"
                className="mt-1"
              />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
              <Button 
                onClick={() => createMutation.mutate()} 
                disabled={createMutation.isPending || !newTeamName.trim()}
              >
                {createMutation.isPending ? "Criando..." : "Criar Equipe"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Adicionar/Editar Membro */}
        <Dialog open={isMemberDialogOpen} onOpenChange={setIsMemberDialogOpen}>
          <DialogContent className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}>
            <DialogHeader>
              <DialogTitle className={isDark ? 'text-white' : 'text-gray-900'}>
                {editingMemberIndex !== null ? "Editar Membro" : "Adicionar Membro"}
              </DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div>
                <label className={`text-sm font-medium ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                  Nome *
                </label>
                <Input 
                  value={memberForm.name} 
                  onChange={e => setMemberForm({...memberForm, name: e.target.value})}
                  placeholder="Ex: Luiz Davi"
                  className="mt-1"
                />
              </div>
              <div>
                <label className={`text-sm font-medium ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                  Cargo/Função *
                </label>
                <Input 
                  value={memberForm.position} 
                  onChange={e => setMemberForm({...memberForm, position: e.target.value})}
                  placeholder="Ex: Estagiário"
                  className="mt-1"
                />
              </div>
              <div>
                <label className={`text-sm font-medium ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                  Atividades Produzidas
                </label>
                <Textarea 
                  value={memberForm.activities} 
                  onChange={e => setMemberForm({...memberForm, activities: e.target.value})}
                  placeholder="Descreva as atividades e responsabilidades..."
                  rows={4}
                  className="mt-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsMemberDialogOpen(false)}>Cancelar</Button>
              <Button 
                onClick={handleSaveMember} 
                disabled={addOrUpdateMemberMutation.isPending}
              >
                {addOrUpdateMemberMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}