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

// PÁGINA RECONSTRUÍDA DO ZERO - Foco em persistência e segurança estrita
export default function Documents() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  // Estado local para formulário
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [formData, setFormData] = useState({ title: "", content: "", type: "outros" });

  // 1. AUTENTICAÇÃO OBRIGATÓRIA
  useEffect(() => {
    base44.auth.me()
      .then(u => {
        if (!u) throw new Error("Não autenticado");
        setUser(u);
      })
      .catch(() => {
        // Redirecionar ou mostrar erro bloqueante se não houver user
        toast.error("Sessão inválida. Por favor, recarregue.");
      });
  }, []);

  // 2. LEITURA ESTRITA: Apenas documentos SEM case_id (não vinculados a processos)
  const { data: documents = [], isLoading, refetch } = useQuery({
    queryKey: ['my-documents', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      console.log("🔍 Buscando documentos avulsos de:", user.email);
      
      // Busca TODOS os documentos do usuário
      const allDocs = await base44.entities.LegalDocument.filter({ 
        created_by: user.email 
      }, '-created_date');
      
      // Filtra apenas os que NÃO têm case_id (documentos avulsos, não vinculados a processos)
      const standaloneDocs = allDocs.filter(doc => !doc.case_id);
      
      console.log("📄 Total:", allDocs.length, "| Avulsos (sem processo):", standaloneDocs.length);
      return standaloneDocs;
    },
    enabled: !!user?.email
  });

  // 3. CRIAÇÃO SEGURA
  const createMutation = useMutation({
    mutationFn: async (data) => {
      // Validação de segurança no frontend
      if (!user?.email) throw new Error("Usuário não identificado. Recarregue a página.");
      if (!data.title.trim()) throw new Error("Título é obrigatório.");

      console.log("💾 Tentando salvar documento...", data);

      // Insert com vínculo explícito
      const newDoc = await base44.entities.LegalDocument.create({
        title: data.title.trim(),
        content: data.content || "",
        type: data.type || "outros",
        status: "draft",
        created_by: user.email // VÍNCULO OBRIGATÓRIO
      });

      // Validação do retorno do banco
      if (!newDoc || !newDoc.id) {
        throw new Error("Erro crítico: Banco de dados não confirmou a criação.");
      }

      console.log("✅ Documento persistido com sucesso ID:", newDoc.id);
      return newDoc;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-documents'] });
      toast.success("Documento salvo e confirmado pelo banco.");
      setIsCreateOpen(false);
      setFormData({ title: "", content: "", type: "outros" });
    },
    onError: (err) => {
      console.error("❌ Erro ao salvar:", err);
      toast.error(`Falha ao salvar: ${err.message}`);
    }
  });

  // 4. EXCLUSÃO (Apenas dono)
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      if (!user?.email) throw new Error("Sem permissão.");
      // O RLS do banco já deve bloquear, mas validamos aqui também se possível
      // Delete direto
      await base44.entities.LegalDocument.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-documents'] });
      toast.success("Documento excluído.");
      setIsViewOpen(false);
    },
    onError: (err) => toast.error(`Erro ao excluir: ${err.message}`)
  });

  // Renderização de bloqueio se não houver user carregado (evita UI fantasma)
  if (!user) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /> Carregando sessão...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Documentos Avulsos</h1>
          <p className="text-gray-500 text-sm">Documentos não vinculados a processos. Para ver documentos de um processo, acesse a aba "Processos".</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()} title="Forçar recarregamento">
            <RefreshCw className="w-4 h-4 mr-2" /> Atualizar Lista
          </Button>
          <Button onClick={() => setIsCreateOpen(true)} className="bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4 mr-2" /> Novo Documento
          </Button>
          <Button onClick={() => navigate(createPageUrl('DocumentGenerator'))} variant="secondary">
            Ir para Gerador IA
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-10"><Loader2 className="animate-spin mx-auto" /> Buscando dados...</div>
      ) : documents.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="py-10 text-center text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-20" />
            <p>Nenhum documento avulso encontrado.</p>
            <p className="text-xs">Documentos criados dentro de processos aparecem na aba "Processos".</p>
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
                      if(confirm("Confirmar exclusão definitiva?")) deleteMutation.mutate(doc.id);
                    }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* MODAL DE CRIAÇÃO SIMPLIFICADO */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Documento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Título Obrigatório</label>
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
              onClick={() => createMutation.mutate(formData)} 
              disabled={createMutation.isPending || !formData.title.trim()}
            >
              {createMutation.isPending ? <Loader2 className="animate-spin w-4 h-4" /> : "Salvar no Banco"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DE VISUALIZAÇÃO */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedDoc?.title}</DialogTitle>
            <p className="text-xs text-gray-400">Criado em: {selectedDoc?.created_date}</p>
          </DialogHeader>
          <div className="p-4 bg-gray-50 rounded border whitespace-pre-wrap">
            {selectedDoc?.content}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}