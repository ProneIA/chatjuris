import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Users, Plus, Trash2, Loader2, Shield, Edit2, UserPlus } from "lucide-react";
import { toast } from "sonner";

export default function Teams({ theme = 'light' }) {
  const isDark = theme === 'dark';
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddEntityOpen, setIsAddEntityOpen] = useState(false);
  
  const [newEntity, setNewEntity] = useState({ name: "", role: "", activities: "" });

  useEffect(() => {
    base44.auth.me()
      .then(setUser)
      .catch(() => toast.error("Erro ao carregar sessão"));
  }, []);

  const { data: myTeams = [], isLoading, refetch } = useQuery({
    queryKey: ['my-teams', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.Team.filter({ owner_email: user.email }, '-created_date');
    },
    enabled: !!user?.email
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!newTeamName.trim()) throw new Error("Nome obrigatório");
      
      return await base44.entities.Team.create({
        name: newTeamName.trim(),
        description: "",
        owner_email: user.email,
        entities: [],
        is_active: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-teams'] });
      toast.success("Equipe criada!");
      setIsCreateOpen(false);
      setNewTeamName("");
    },
    onError: (e) => toast.error(e.message)
  });

  const addEntityMutation = useMutation({
    mutationFn: async () => {
      if (!newEntity.name.trim() || !newEntity.role.trim()) {
        throw new Error("Nome e cargo são obrigatórios");
      }

      const updatedEntities = [
        ...(selectedTeam.entities || []),
        {
          ...newEntity,
          added_at: new Date().toISOString()
        }
      ];

      return await base44.entities.Team.update(selectedTeam.id, {
        entities: updatedEntities
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-teams'] });
      toast.success("Entidade adicionada!");
      setIsAddEntityOpen(false);
      setNewEntity({ name: "", role: "", activities: "" });
    },
    onError: (e) => toast.error(e.message)
  });

  const removeEntityMutation = useMutation({
    mutationFn: async (entityIndex) => {
      const updatedEntities = selectedTeam.entities.filter((_, i) => i !== entityIndex);
      return await base44.entities.Team.update(selectedTeam.id, {
        entities: updatedEntities
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-teams'] });
      toast.success("Entidade removida!");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Team.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-teams'] });
      toast.success("Equipe excluída!");
      setIsEditOpen(false);
    }
  });

  if (!user) {
    return (
      <div className="p-8 flex justify-center items-center">
        <Loader2 className="animate-spin mr-2" /> Carregando...
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-8 ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`}>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Minhas Equipes
            </h1>
            <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
              {myTeams.length} equipe(s) • Gerencie seus colaboradores
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} className="bg-indigo-600">
            <Plus className="mr-2 w-4 h-4" /> Nova Equipe
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-10"><Loader2 className="animate-spin mx-auto" /></div>
        ) : myTeams.length === 0 ? (
          <Card className={`border-dashed border-2 ${isDark ? 'bg-neutral-900 border-neutral-700' : 'bg-white'}`}>
            <CardContent className="py-10 text-center">
              <Users className={`w-12 h-12 mx-auto mb-2 ${isDark ? 'text-neutral-700' : 'text-gray-300'}`} />
              <p className={isDark ? 'text-neutral-400' : 'text-gray-500'}>Nenhuma equipe criada.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myTeams.map(team => (
              <Card 
                key={team.id} 
                className={`border-t-4 border-t-indigo-500 hover:shadow-lg transition-shadow ${
                  isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'
                }`}
              >
                <CardHeader>
                  <CardTitle className={`flex justify-between items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    <span className="truncate">{team.name}</span>
                    <Shield className="w-4 h-4 text-amber-500" />
                  </CardTitle>
                  <CardDescription className={isDark ? 'text-neutral-400' : 'text-gray-600'}>
                    {team.entities?.length || 0} entidade(s)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className={`text-sm space-y-1 ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                    {team.entities?.slice(0, 3).map((entity, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                        <span className="truncate">{entity.name} • {entity.role}</span>
                      </div>
                    ))}
                    {team.entities?.length > 3 && (
                      <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                        +{team.entities.length - 3} mais...
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      className="flex-1" 
                      variant="outline"
                      onClick={() => {
                        setSelectedTeam(team);
                        setIsEditOpen(true);
                      }}
                    >
                      <Edit2 className="w-4 h-4 mr-2" /> Gerenciar
                    </Button>
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
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Dialog Criar Equipe */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}>
            <DialogHeader>
              <DialogTitle className={isDark ? 'text-white' : 'text-gray-900'}>Criar Equipe</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <label className={`text-sm font-medium ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                Nome da Equipe
              </label>
              <Input 
                value={newTeamName} 
                onChange={e => setNewTeamName(e.target.value)}
                placeholder="Ex: ESTAGIARIO"
                className="mt-2"
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

        {/* Dialog Gerenciar Equipe */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className={`max-w-2xl ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}`}>
            <DialogHeader>
              <DialogTitle className={isDark ? 'text-white' : 'text-gray-900'}>
                Gerenciar: {selectedTeam?.name}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Entidades ({selectedTeam?.entities?.length || 0})
                </h3>
                <Button 
                  size="sm" 
                  onClick={() => setIsAddEntityOpen(true)}
                  className="bg-indigo-600"
                >
                  <UserPlus className="w-4 h-4 mr-2" /> Adicionar
                </Button>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {selectedTeam?.entities?.map((entity, idx) => (
                  <div 
                    key={idx} 
                    className={`p-4 rounded-lg border ${
                      isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {entity.name}
                        </p>
                        <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                          {entity.role}
                        </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => {
                          if(confirm(`Remover ${entity.name}?`)) {
                            removeEntityMutation.mutate(idx);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                    {entity.activities && (
                      <p className={`text-sm ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                        <strong>Atividades:</strong> {entity.activities}
                      </p>
                    )}
                  </div>
                ))}
                {(!selectedTeam?.entities || selectedTeam.entities.length === 0) && (
                  <p className={`text-center text-sm py-8 ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                    Nenhuma entidade adicionada
                  </p>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog Adicionar Entidade */}
        <Dialog open={isAddEntityOpen} onOpenChange={setIsAddEntityOpen}>
          <DialogContent className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}>
            <DialogHeader>
              <DialogTitle className={isDark ? 'text-white' : 'text-gray-900'}>
                Adicionar Entidade
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div>
                <label className={`text-sm font-medium ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                  Nome *
                </label>
                <Input 
                  value={newEntity.name} 
                  onChange={e => setNewEntity({...newEntity, name: e.target.value})}
                  placeholder="Ex: LUIZ DAVI"
                  className="mt-2"
                />
              </div>

              <div>
                <label className={`text-sm font-medium ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                  Cargo *
                </label>
                <Input 
                  value={newEntity.role} 
                  onChange={e => setNewEntity({...newEntity, role: e.target.value})}
                  placeholder="Ex: ESTAGIÁRIO"
                  className="mt-2"
                />
              </div>

              <div>
                <label className={`text-sm font-medium ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                  Atividades
                </label>
                <Textarea 
                  value={newEntity.activities} 
                  onChange={e => setNewEntity({...newEntity, activities: e.target.value})}
                  placeholder="Descreva as atividades realizadas por esta entidade..."
                  className="mt-2"
                  rows={4}
                />
              </div>
            </div>

            <DialogFooter>
              <Button 
                variant="ghost" 
                onClick={() => {
                  setIsAddEntityOpen(false);
                  setNewEntity({ name: "", role: "", activities: "" });
                }}
              >
                Cancelar
              </Button>
              <Button 
                onClick={() => addEntityMutation.mutate()} 
                disabled={addEntityMutation.isPending || !newEntity.name.trim() || !newEntity.role.trim()}
              >
                {addEntityMutation.isPending ? "Adicionando..." : "Adicionar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}