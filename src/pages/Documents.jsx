import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Sparkles, Clock } from "lucide-react";
import DocumentList from "../components/documents/DocumentList";
import DocumentDetails from "../components/documents/DocumentDetails";
import DocumentGenerator from "../components/documents/DocumentGenerator";
import DocumentHistory from "../components/documents/DocumentHistory";
import PlanLimitGuard from "../components/common/PlanLimitGuard";

export default function Documents() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showGenerator, setShowGenerator] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: () => base44.entities.LegalDocument.list('-created_date'),
  });

  const { data: cases = [] } = useQuery({
    queryKey: ['cases'],
    queryFn: () => base44.entities.Case.list('title'),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('name'),
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: () => base44.entities.Template.list('name'),
  });

  const { data: subscription } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      let subs = await base44.entities.Subscription.filter({ user_id: user.id });
      if (subs.length === 0) {
        subs = await base44.entities.Subscription.filter({ user_id: user.email });
      }
      return subs[0] || null;
    },
    enabled: !!user?.id
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.LegalDocument.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setSelectedDocument(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.LegalDocument.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setSelectedDocument(null);
    },
  });

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = 
      doc.title?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === "all" || doc.type === filterType;
    const matchesStatus = filterStatus === "all" || doc.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const stats = {
    total: documents.length,
    draft: documents.filter(d => d.status === 'draft').length,
    review: documents.filter(d => d.status === 'review').length,
    approved: documents.filter(d => d.status === 'approved').length,
  };

  return (
    <div className="h-full flex bg-neutral-950 min-h-screen">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-black border-b border-gray-800 px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-light text-white">Documentos Jurídicos</h1>
              <p className="text-gray-500 text-sm mt-1">Gerencie seus documentos legais</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowHistory(true)}
                variant="outline"
                className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
              >
                <Clock className="w-4 h-4 mr-2" />
                Histórico
              </Button>
              <Button
                onClick={() => setShowGenerator(true)}
                className="bg-white text-black hover:bg-gray-100"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Gerar Documento com IA
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3 mb-3">
            <div className="border border-gray-800 rounded-lg p-3 hover:border-gray-600 transition-colors">
              <p className="text-xs text-gray-500 font-medium">Total</p>
              <p className="text-xl font-light text-white mt-0.5">{stats.total}</p>
            </div>
            <div className="border border-gray-800 rounded-lg p-3 hover:border-gray-600 transition-colors">
              <p className="text-xs text-gray-500 font-medium">Rascunhos</p>
              <p className="text-xl font-light text-white mt-0.5">{stats.draft}</p>
            </div>
            <div className="border border-gray-800 rounded-lg p-3 hover:border-gray-600 transition-colors">
              <p className="text-xs text-gray-500 font-medium">Em Revisão</p>
              <p className="text-xl font-light text-white mt-0.5">{stats.review}</p>
            </div>
            <div className="border border-gray-800 rounded-lg p-3 hover:border-gray-600 transition-colors">
              <p className="text-xs text-gray-500 font-medium">Aprovados</p>
              <p className="text-xl font-light text-white mt-0.5">{stats.approved}</p>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Buscar documentos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-900 border-gray-800 text-white placeholder:text-gray-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-neutral-950">
          {showHistory ? (
            <DocumentHistory
              documents={documents}
              onSelectDocument={(doc) => {
                setSelectedDocument(doc);
                setShowHistory(false);
              }}
              onClose={() => setShowHistory(false)}
            />
          ) : showGenerator ? (
            <PlanLimitGuard
              subscription={subscription}
              currentCount={documents.length}
              limitCount={3}
              entityName="documentos"
            >
              <DocumentGenerator
                cases={cases}
                clients={clients}
                templates={templates}
                onClose={() => setShowGenerator(false)}
                onSuccess={() => {
                  setShowGenerator(false);
                  queryClient.invalidateQueries({ queryKey: ['documents'] });
                }}
              />
            </PlanLimitGuard>
          ) : (
            <DocumentList
              documents={filteredDocuments}
              isLoading={isLoading}
              onSelectDocument={setSelectedDocument}
              selectedDocument={selectedDocument}
            />
          )}
        </div>
      </div>

      {selectedDocument && !showGenerator && (
        <DocumentDetails
          document={selectedDocument}
          onClose={() => setSelectedDocument(null)}
          onUpdate={(data) => updateMutation.mutate({ id: selectedDocument.id, data })}
          onDelete={() => deleteMutation.mutate(selectedDocument.id)}
        />
      )}
    </div>
  );
}