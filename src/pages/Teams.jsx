import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Plus, Trash2, Loader2, Shield, Search, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Teams() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    base44.auth.me()
      .then(u => {
        if (!u) throw new Error("Não autenticado");
        setUser(u);
      })
      .catch(() => toast.error("Sessão inválida."));
  }, []);

  const { data: myTeams = [], isLoading } = useQuery({
    queryKey: ['my-teams', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const allTeams = await base44.entities.Team.list('-created_date');
      return allTeams.filter(t => 
        t.owner_email === user.email || t.members?.includes(user.email)
      );
    },
    enabled: !!user?.email
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.Team.delete(id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['my-teams'] });
      toast.success("Equipe removida.");
    }
  });

  const filteredTeams = myTeams.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 min-h-screen bg-gray-50">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Equipes</h1>
          <p className="text-gray-500 mt-1">Colabore com seus colegas em workspaces dedicados.</p>
        </div>
        <Button 
          onClick={() => navigate(createPageUrl("NewTeam"))} 
          className="bg-indigo-600 hover:bg-indigo-700 shadow-lg"
        >
          <Plus className="mr-2 w-4 h-4" /> Nova Equipe
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input 
          placeholder="Buscar equipes..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-10"><Loader2 className="animate-spin mx-auto" /></div>
      ) : filteredTeams.length === 0 ? (
        <Card className="border-dashed border-2 bg-white/50">
          <CardContent className="py-10 text-center text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-20" />
            <h3 className="text-xl font-medium">Nenhuma equipe encontrada</h3>
            <p className="mt-2 mb-6">Crie uma equipe para começar a colaborar.</p>
            <Button onClick={() => navigate(createPageUrl("NewTeam"))} variant="outline">
              Criar Equipe
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeams.map(team => (
            <Card key={team.id} className="hover:shadow-lg transition-all cursor-pointer group border-t-4 border-t-indigo-500" onClick={() => navigate(createPageUrl("TeamWorkspace") + "?team=" + team.id)}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span className="truncate group-hover:text-indigo-600 transition-colors">{team.name}</span>
                  {team.owner_email === user.email && (
                    <Shield className="w-4 h-4 text-amber-500" title="Proprietário" />
                  )}
                </CardTitle>
                <CardDescription className="line-clamp-2 min-h-[40px]">
                  {team.description || "Sem descrição definida."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center text-sm text-gray-500 mb-6">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{team.members?.length || 0} membros</span>
                  </div>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {team.owner_email === user.email ? "Você é dono" : "Membro"}
                  </span>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    className="flex-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200" 
                    variant="outline"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" /> Abrir Workspace
                  </Button>
                  
                  {team.owner_email === user.email && (
                    <Button 
                      variant="destructive" 
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        if(confirm("Tem certeza que deseja excluir esta equipe? Todos os dados serão perdidos.")) {
                          deleteMutation.mutate(team.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}