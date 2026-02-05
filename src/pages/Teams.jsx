import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Users, Plus, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Teams({ theme = 'light' }) {
  const isDark = theme === 'dark';
  const [user, setUser] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: allTeams = [], isLoading } = useQuery({
    queryKey: ['all-teams'],
    queryFn: async () => {
      return await base44.entities.Team.list('-created_date');
    },
    enabled: !!user
  });

  // FILTRO LOCAL - segurança no frontend
  const myTeams = allTeams.filter(t => t.owner_email === user?.email);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user?.email) throw new Error("Usuário não autenticado");
      if (!newTeamName.trim()) throw new Error("Nome obrigatório");

      return await base44.entities.Team.create({
        name: newTeamName.trim(),
        owner_email: user.email
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['all-teams'] });
      toast.success("Equipe criada!");
      setIsCreateOpen(false);
      setNewTeamName("");
      navigate(createPageUrl("TeamDetail") + `?id=${data.id}`);
    },
    onError: (e) => {
      toast.error(e.message || "Erro ao criar equipe");
    }
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-8 ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Minhas Equipes
            </h1>
            <p className={`text-sm mt-1 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
              {myTeams.length} equipe(s)
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} className="bg-indigo-600">
            <Plus className="mr-2 w-4 h-4" /> Nova Equipe
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-20">
            <Loader2 className="animate-spin mx-auto w-8 h-8" />
          </div>
        ) : myTeams.length === 0 ? (
          <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}>
            <CardContent className="py-20 text-center">
              <Users className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-neutral-700' : 'text-gray-300'}`} />
              <p className={`text-lg mb-2 ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                Nenhuma equipe encontrada
              </p>
              <p className={`text-sm ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                Clique em "Nova Equipe" para começar
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myTeams.map(team => (
              <Card 
                key={team.id} 
                className={`cursor-pointer hover:shadow-lg transition-shadow ${
                  isDark ? 'bg-neutral-900 border-neutral-800 hover:border-neutral-700' : 'bg-white hover:border-gray-300'
                }`}
                onClick={() => navigate(createPageUrl("TeamDetail") + `?id=${team.id}`)}
              >
                <CardHeader>
                  <CardTitle className={`flex items-center justify-between ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    <span>{team.name}</span>
                    <ArrowRight className="w-5 h-5 text-indigo-600" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                    Criada em {new Date(team.created_date).toLocaleDateString('pt-BR')}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}>
            <DialogHeader>
              <DialogTitle className={isDark ? 'text-white' : 'text-gray-900'}>
                Criar Nova Equipe
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Input 
                value={newTeamName} 
                onChange={e => setNewTeamName(e.target.value)}
                placeholder="Nome da equipe"
                className="w-full"
                onKeyDown={e => e.key === 'Enter' && createMutation.mutate()}
              />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={() => createMutation.mutate()} 
                disabled={createMutation.isPending || !newTeamName.trim()}
              >
                {createMutation.isPending ? "Criando..." : "Criar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}