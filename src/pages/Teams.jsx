import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Users, Plus, ExternalLink, Trash2, Shield } from "lucide-react";
import { toast } from "sonner";
import SimpleTeamForm from "@/components/forms/SimpleTeamForm";

// REWRITTEN FROM SCRATCH - SIMPLE & ROBUST
export default function Teams() {
  const [user, setUser] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Fetch Teams
  const { data: teams = [], isLoading } = useQuery({
    queryKey: ['all-teams', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const allTeams = await base44.entities.Team.list('-created_date');
      // Filter visible teams
      return allTeams.filter(t => 
        t.owner_email === user.email || 
        t.members?.includes(user.email)
      );
    },
    enabled: !!user?.email
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Team.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-teams'] });
      toast.success("Equipe removida.");
    }
  });

  const handleTeamCreated = (newTeam) => {
    setIsCreateOpen(false);
    queryClient.invalidateQueries({ queryKey: ['all-teams'] });
    // IMMEDIATE REDIRECT
    navigate(createPageUrl("TeamWorkspace") + "?team=" + newTeam.id);
  };

  if (!user) return <div className="p-10 text-center">Carregando...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-8 h-8 text-indigo-600" />
            Minhas Equipes
          </h1>
          <p className="text-gray-500 mt-1">Colabore com outros advogados e parceiros.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 shadow-md">
          <Plus className="w-4 h-4 mr-2" />
          Nova Equipe
        </Button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="text-center py-20 text-gray-500">Carregando equipes...</div>
      ) : teams.length === 0 ? (
        <Card className="border-dashed border-2 bg-gray-50/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-medium text-gray-700">Nenhuma equipe encontrada</h3>
            <p className="text-gray-500 mb-6">Crie uma equipe para compartilhar casos e arquivos.</p>
            <Button variant="outline" onClick={() => setIsCreateOpen(true)}>
              Criar Agora
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map(team => (
            <Card 
              key={team.id} 
              className="hover:shadow-lg transition-all cursor-pointer border-t-4 border-t-indigo-500 group"
              onClick={() => navigate(createPageUrl("TeamWorkspace") + "?team=" + team.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg truncate">{team.name}</CardTitle>
                  {team.owner_email === user.email && (
                    <Shield className="w-4 h-4 text-amber-500" title="Proprietário" />
                  )}
                </div>
                <CardDescription className="line-clamp-2 h-10">
                  {team.description || "Sem descrição"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                  <span>{team.members?.length || 1} membros</span>
                  {team.owner_email === user.email && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        if(confirm("Excluir esta equipe permanentemente?")) deleteMutation.mutate(team.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                <Button 
                  className="w-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200" 
                  variant="outline"
                  onClick={() => navigate(createPageUrl("TeamWorkspace") + "?team=" + team.id)}
                >
                  <ExternalLink className="w-4 h-4 mr-2" /> Acessar Workspace
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Nova Equipe</DialogTitle>
          </DialogHeader>
          <SimpleTeamForm 
            onSuccess={handleTeamCreated} 
            onCancel={() => setIsCreateOpen(false)} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}