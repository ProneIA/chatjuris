import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FolderOpen, Plus, Search } from "lucide-react";
import CaseCard from "@/components/cases/CaseCard";
import { toast } from "sonner";

export default function Cases({ theme = 'light' }) {
  const isDark = theme === 'dark';
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: cases = [], refetch } = useQuery({
    queryKey: ['cases', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      console.log("🔍 Buscando processos...");
      // Fetching all relevant cases (created by user or shared with user)
      // Note: RLS should handle permissioning, but we can filter client-side too if needed
      // Ideally, the 'Case' entity RLS allows reading if created_by OR shared_with contains user.
      const result = await base44.entities.Case.list('-created_date');
      
      // Client-side filter to be safe if RLS is broad
      return result.filter(c => 
        c.created_by === user.email || 
        c.shared_with?.includes(user.email) || 
        c.assigned_to === user.email
      );
    },
    enabled: !!user?.email
  });

  const filteredCases = cases.filter(c =>
    c.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`min-h-screen p-8 ${isDark ? 'bg-neutral-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Processos</h1>
            <p className="text-gray-500 mt-1">Gerencie seus processos jurídicos e documentos.</p>
          </div>
          <Button 
            onClick={() => navigate(createPageUrl("NewCase"))} 
            className="bg-green-600 hover:bg-green-700 shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Processo
          </Button>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input 
            placeholder="Buscar por título ou cliente..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-6">
          <div className="flex-1">
            {filteredCases.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed rounded-xl bg-white/50">
                <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium">Nenhum processo encontrado</h3>
                <p className="text-gray-500 mt-2 mb-6">Cadastre seu primeiro processo para começar.</p>
                <Button onClick={() => navigate(createPageUrl("NewCase"))}>
                  Cadastrar Processo
                </Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCases.map((caseItem) => (
                  <CaseCard
                    key={caseItem.id}
                    caseData={caseItem}
                    onClick={() => navigate(createPageUrl("CaseDetails") + "?id=" + caseItem.id)}
                    // We disable inline edit here to favor the clean flow, or link to edit page if needed
                    // For now, let's keep it simple: clicking opens details
                    theme={theme}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}