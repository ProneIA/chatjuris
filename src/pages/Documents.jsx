import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import DocumentList from "../components/documents/DocumentList";
import DocumentDetails from "../components/documents/DocumentDetails";
import DocumentGenerator from "../components/documents/DocumentGenerator";

export default function Documents() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showGenerator, setShowGenerator] = useState(false);
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

  const navigate = useNavigate();
  const stats = {
    total: documents.length,
    draft: documents.filter(d => d.status === 'draft').length,
    review: documents.filter(d => d.status === 'review').length,
    approved: documents.filter(d => d.status === 'approved').length,
  };
  const canAddDocument = subscription?.plan === 'pro' || documents.length < 3;

  return (
    <div className="h-full flex">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white border-b border-slate-200 px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Documentos Jurídicos</h1>
              <p className="text-slate-600 mt-1">Gerencie seus documentos legais</p>
            </div>
            <Button
              onClick={() => {
                if (!canAddDocument) {
                  alert('🚫 Limite atingido! O plano gratuito permite apenas 3 documentos. Faça upgrade para o Plano Pro.');
                  navigate(createPageUrl('Pricing'));
                  return;
                }
                setShowGenerator(true);
              }}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Gerar Documento
              {subscription?.plan === 'free' && (
                <span className="ml-2 text-xs">({documents.length}/3)</span>
              )}
            </Button>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
              <p className="text-sm text-blue-600 font-medium">Total</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">{stats.total}</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4">
              <p className="text-sm text-yellow-600 font-medium">Rascunhos</p>
              <p className="text-2xl font-bold text-yellow-900 mt-1">{stats.draft}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
              <p className="text-sm text-purple-600 font-medium">Em Revisão</p>
              <p className="text-2xl font-bold text-purple-900 mt-1">{stats.review}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
              <p className="text-sm text-green-600 font-medium">Aprovados</p>
              <p className="text-2xl font-bold text-green-900 mt-1">{stats.approved}</p>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar documentos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {showGenerator ? (
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