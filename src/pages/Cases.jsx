import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Scale, Calendar, AlertCircle, Briefcase, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import SimpleCaseForm from "@/components/forms/SimpleCaseForm";

// REWRITTEN FROM SCRATCH - SIMPLE & ROBUST
export default function Cases() {
  const [user, setUser] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Fetch Cases
  const { data: cases = [], isLoading } = useQuery({
    queryKey: ['all-cases', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      // Fetch cases created by user OR shared with user
      const myCases = await base44.entities.Case.list('-created_date');
      return myCases.filter(c => 
        c.created_by === user.email || 
        c.assigned_to === user.email || 
        c.shared_with?.includes(user.email)
      );
    },
    enabled: !!user?.email
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Case.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-cases'] });
      toast.success("Processo removido.");
    }
  });

  // Filter
  const filteredCases = cases.filter(c => 
    c.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.case_number?.includes(searchTerm)
  );

  const handleCaseCreated = (newCase) => {
    setIsCreateOpen(false);
    queryClient.invalidateQueries({ queryKey: ['all-cases'] });
    // IMMEDIATE REDIRECT
    navigate(createPageUrl("CaseDetails") + "?id=" + newCase.id);
  };

  if (!user) return <div className="p-10 text-center">Carregando...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Scale className="w-8 h-8 text-indigo-600" />
            Meus Processos
          </h1>
          <p className="text-gray-500 mt-1">Gerencie seus casos jurídicos em um só lugar.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 shadow-md">
          <Plus className="w-4 h-4 mr-2" />
          Novo Processo
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input 
          placeholder="Buscar por título, cliente ou número..." 
          className="pl-10 bg-white shadow-sm border-gray-200"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="text-center py-20 text-gray-500">Carregando processos...</div>
      ) : filteredCases.length === 0 ? (
        <Card className="border-dashed border-2 bg-gray-50/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Briefcase className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-medium text-gray-700">Nenhum processo encontrado</h3>
            <p className="text-gray-500 mb-6">Comece criando seu primeiro caso jurídico.</p>
            <Button variant="outline" onClick={() => setIsCreateOpen(true)}>
              Criar Agora
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCases.map(c => (
            <Card 
              key={c.id} 
              className="hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-indigo-500 group"
              onClick={() => navigate(createPageUrl("CaseDetails") + "?id=" + c.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <Badge variant={c.status === 'closed' ? 'secondary' : 'default'} className="mb-2">
                    {c.status === 'new' ? 'Novo' : c.status === 'in_progress' ? 'Em Andamento' : c.status}
                  </Badge>
                  {c.created_by === user.email && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        if(confirm("Tem certeza que deseja excluir este processo?")) deleteMutation.mutate(c.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                <CardTitle className="text-lg leading-snug line-clamp-2" title={c.title}>
                  {c.title}
                </CardTitle>
                <CardDescription className="font-medium text-gray-600">
                  {c.client_name || "Cliente sem nome"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-500">
                  {c.case_number && (
                    <p className="flex items-center gap-2">
                      <Scale className="w-3 h-3" /> {c.case_number}
                    </p>
                  )}
                  {c.deadline && (
                    <p className="flex items-center gap-2 text-amber-600 font-medium">
                      <Calendar className="w-3 h-3" /> 
                      Prazo: {format(new Date(c.deadline), 'dd/MM/yyyy')}
                    </p>
                  )}
                  {c.priority === 'urgent' && (
                    <p className="flex items-center gap-2 text-red-600 font-bold">
                      <AlertCircle className="w-3 h-3" /> URGENTE
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Processo</DialogTitle>
          </DialogHeader>
          <SimpleCaseForm 
            onSuccess={handleCaseCreated} 
            onCancel={() => setIsCreateOpen(false)} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}