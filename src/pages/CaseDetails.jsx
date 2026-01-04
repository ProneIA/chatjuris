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
        // Since we can't get by ID directly easily in all backends, filtering is safer
        const results = await base44.entities.Case.filter({ id: caseId });
        if (results && results.length > 0) {
          setCaseData(results[0]);
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
        <h2 className="text-xl font-bold mb-4">Processo não encontrado</h2>
        <Button onClick={() => navigate(createPageUrl("Cases"))}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
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