import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, FileText, Loader2, RefreshCw, Eye } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Documents() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [formData, setFormData] = useState({ title: "", content: "", type: "outros" });

  useEffect(() => {
    console.log("🔐 [DOCS] Iniciando autenticação...");
    base44.auth.me()
      .then(u => {
        if (!u) {
          console.error("❌ [DOCS] Usuário não autenticado!");
          throw new Error("Não autenticado");
        }
        console.log("✅ [DOCS] Usuário autenticado:", u.email, "ID:", u.id);
        setUser(u);
      })
      .catch((err) => {
        console.error("❌ [DOCS] Erro ao carregar sessão:", err);
        toast.error("Sessão inválida. Por favor, faça login novamente.");
      });
  }, []);

  const { data: documents = [], isLoading, refetch } = useQuery({
    queryKey: ['my-documents', user?.email],
    queryFn: async () => {
      if (!user?.email) {
        console.log("⏳ [DOCS] Aguardando autenticação do usuário...");
        return [];
      }
      console.log("🔍 [DOCS] Buscando documentos de:", user.email);
      
      const allDocs = await base44.entities.LegalDocument.filter({ 
        created_by: user.email 
      }, '-created_date');
      
      const generalDocs = allDocs.filter(doc => !doc.case_id);
      
      console.log("📄 [DOCS] Total de documentos:", allDocs.length, "| Gerais:", generalDocs.length);
      console.log("📄 [DOCS] Documentos encontrados:", generalDocs);
      return generalDocs;
    },
    enabled: !!user?.email
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      console.log("💾 [DOCS] Iniciando criação de documento...");
      console.log("💾 [DOCS] Dados do formulário:", data);
      console.log("💾 [DOCS] Usuário atual:", user);

      if (!user?.email) {
        console.error("❌ [DOCS] ERRO: Usuário não identificado!");
        throw new Error("Usuário não identificado. Recarregue a página.");
      }
      
      if (!data.title.trim()) {
        console.error("❌ [DOCS] ERRO: Título vazio!");
        throw new Error("Título é obrigatório.");
      }

      const payload = {
        title: data.title.trim(),
        content: data.content || "",
        type: data.type || "outros",
        status: "draft",
        created_by: user.email
      };

      console.log("💾 [DOCS] Payload enviado ao banco:", payload);

      const newDoc = await base44.entities.LegalDocument.create(payload);

      console.log("💾 [DOCS] Resposta do banco:", newDoc);

      if (!newDoc || !newDoc.id) {
        console.error("❌ [DOCS] ERRO CRÍTICO: Banco não retornou ID!", newDoc);
        throw new Error("Erro ao salvar: banco não confirmou criação.");
      }

      console.log("✅ [DOCS] Documento criado com sucesso! ID:", newDoc.id);
      return newDoc;
    },
    onSuccess: async (newDoc) => {
      console.log("✅ [DOCS] onSuccess chamado. Documento:", newDoc);
      console.log("🔄 [DOCS] Invalidando queries...");
      await queryClient.invalidateQueries({ queryKey: ['my-documents'] });
      console.log("🔄 [DOCS] Refetch forçado...");
      await refetch();
      console.log("✅ [DOCS] Atualização concluída!");
      
      toast.success("✅ Documento salvo com sucesso!");
      setIsCreateOpen(false);
      setFormData({ title: "", content: "", type: "outros" });
    },
    onError: (err) => {
      console.error("❌ [DOCS] Erro na criação:", err);
      console.error("❌ [DOCS] Stack:", err.stack);
      toast.error(`Falha ao salvar: ${err.message}`);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      console.log("🗑️ [DOCS] Excluindo documento ID:", id);
      await base44.entities.LegalDocument.delete(id);
    },
    onSuccess: async () => {
      console.log("✅ [DOCS] Documento excluído, atualizando lista...");
      await queryClient.invalidateQueries({ queryKey: ['my-documents'] });
      await refetch();
      toast.success("Documento excluído.");
      setIsViewOpen(false);
      setSelectedDoc(null);
    },
    onError: (err) => {
      console.error("❌ [DOCS] Erro ao excluir:", err);
      toast.error(`Erro ao excluir: ${err.message}`);
    }
  });

  if (!user) {
    return (
      <div className="p-8 flex justify-center items-center">
        <Loader2 className="animate-spin mr-2" /> Carregando sessão...
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Documentos Gerais</h1>
          <p className="text-gray-500 text-sm">Documentos não vinculados a processos • {documents.length} encontrado(s)</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => {
            console.log("🔄 [DOCS] Botão Atualizar clicado");
            refetch();
          }}>
            <RefreshCw className="w-4 h-4 mr-2" /> Atualizar
          </Button>
          <Button onClick={() => setIsCreateOpen(true)} className="bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4 mr-2" /> Novo Documento
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-10"><Loader2 className="animate-spin mx-auto" /> Buscando...</div>
      ) : documents.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="py-10 text-center text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-20" />
            <p>Nenhum documento encontrado.</p>
            <p className="text-xs mt-2">Clique em "Novo Documento" para criar o primeiro.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map(doc => (
            <Card key={doc.id} className="hover:border-green-500 transition-colors">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg truncate">{doc.title}</CardTitle>
                <p className="text-xs text-gray-400">ID: {doc.id}</p>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-500 mb-4 line-clamp-3">
                  {doc.content ? doc.content.substring(0, 100) + "..." : "Sem conteúdo"}
                </p>
                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="ghost" onClick={() => { setSelectedDoc(doc); setIsViewOpen(true); }}>
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700" 
                    onClick={() => {
                      if(confirm("Confirmar exclusão?")) deleteMutation.mutate(doc.id);
                    }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Documento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Título *</label>
              <Input 
                value={formData.title} 
                onChange={e => setFormData({...formData, title: e.target.value})}
                placeholder="Ex: Contrato de Prestação de Serviços"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Conteúdo</label>
              <Textarea 
                value={formData.content} 
                onChange={e => setFormData({...formData, content: e.target.value})}
                placeholder="Conteúdo do documento..."
                className="h-32"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
            <Button 
              onClick={() => {
                console.log("🚀 [DOCS] Botão Salvar clicado!");
                console.log("📋 [DOCS] Dados atuais do formulário:", formData);
                createMutation.mutate(formData);
              }} 
              disabled={createMutation.isPending || !formData.title.trim()}
            >
              {createMutation.isPending ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
              {createMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedDoc?.title}</DialogTitle>
            <p className="text-xs text-gray-400">ID: {selectedDoc?.id}</p>
          </DialogHeader>
          <div className="p-4 bg-gray-50 rounded border whitespace-pre-wrap">
            {selectedDoc?.content || "Sem conteúdo"}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}