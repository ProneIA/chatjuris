import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import CaseDetails from "@/components/cases/CaseDetails";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";

export default function CaseDetailsPage() {
  const [searchParams] = useSearchParams();
  const caseId = searchParams.get("id");
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadCase() {
      if (!caseId) return;
      try {
        const user = await base44.auth.me();
        if (!user) {
          setIsLoading(false);
          return;
        }
        
        const results = await base44.entities.Case.filter({ id: caseId });
        if (results && results.length > 0) {
          const caseItem = results[0];
          // Validar propriedade
          if (caseItem.created_by !== user.email) {
            console.error("Acesso negado: processo não pertence ao usuário");
            setCaseData(null);
            setIsLoading(false);
            return;
          }
          setCaseData(caseItem);
        }
      } catch (error) {
        console.error("Error loading case:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadCase();
  }, [caseId]);

  if (isLoading) {
    return <div className="p-10 flex justify-center"><Loader2 className="animate-spin" /></div>;
  }

  if (!caseData) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-xl font-bold mb-4">Processo não encontrado ou acesso negado</h2>
        <p className="text-gray-600 mb-4">Você não tem permissão para visualizar este processo.</p>
        <Button onClick={() => navigate(createPageUrl("Cases"))}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Processos
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
       <CaseDetails 
         caseData={caseData} 
         onClose={() => navigate(createPageUrl("Cases"))}
         onEdit={() => {}}
         isPage={true}
       />
    </div>
  );
}