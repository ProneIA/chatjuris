import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  FileText, 
  Plus, 
  Search, 
  Clock, 
  Trash2, 
  Sparkles, 
  Eye,
  Download,
  Filter,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";

const docTypes = [
  "Petição Inicial", 
  "Contestação", 
  "Recurso", 
  "Contrato", 
  "Procuração", 
  "Parecer", 
  "Memorando",
  "Outros"
];

export default function Documents({ theme = 'light' }) {
  const isDark = theme === 'dark';
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  
  const [formData, setFormData] = useState({
    title: "",
    type: "Petição Inicial",
    content: "",
    notes: ""
  });

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: documents = [], isLoading, refetch } = useQuery({
    queryKey: ['documents', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      // Filtra explicitamente pelo usuário criador para garantir visibilidade correta
      // Mesmo que o RLS permita ver outros, o requisito pede "somente o que ele próprio criou"
      const result = await base44.entities.LegalDocument.filter({ created_by: user.email }, '-created_date');
      console.log("📄 Documentos carregados (meus):", result.length);
      return result;
    },
    enabled: !!user?.email
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      // GUARDA DE SEGURANÇA: Impede criação de registro órfão
      if (!user || !user.email) {
        throw new Error("Sessão inválida. Recarregue a página para autenticar novamente.");
      }
      if (!data.title.trim()) throw new Error("Título é obrigatório");
      
      console.log("💾 Iniciando transação segura de documento...");
      
      // Criação com vínculo explícito de usuário
      const doc = await base44.entities.LegalDocument.create({
        title: data.title.trim(),
        type: data.type,
        content: data.content || "",
        notes: data.notes || "",
        status: "draft",
        // Força vínculo explícito mesmo que o backend tenha default
        created_by: user.email 
      });
      
      if (!doc || !doc.id) {
        throw new Error("Falha na confirmação do banco de dados. O ID não foi retornado.");
      }

      console.log(`✅ Persistência confirmada. ID: ${doc.id}, Owner: ${user.email}`);
      return doc;
      console.log("✅ Documento salvo:", doc.id);
      return doc;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['documents'] });
      await refetch();
      toast.success("Documento criado com sucesso!");
      setIsCreateOpen(false);
      setFormData({ title: "", type: "Petição Inicial", content: "", notes: "" });
    },
    onError: (e) => toast.error(`Erro ao salvar: ${e.message}`)
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.LegalDocument.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      refetch();
      setIsViewOpen(false);
      toast.success("Documento excluído");
    }
  });

  const handleDownload = (doc) => {
    const pdf = new jsPDF();
    const text = doc.content?.replace(/[#*_`]/g, '') || "Sem conteúdo";
    const lines = pdf.splitTextToSize(text, 180);
    pdf.text(lines, 15, 20);
    pdf.save(`${doc.title}.pdf`);
    toast.success("Download iniciado");
  };

  const filteredDocs = documents.filter(doc => 
    doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`min-h-screen p-8 ${isDark ? 'bg-neutral-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Meus Documentos</h1>
            <p className="text-gray-500 mt-1">Gerencie seus documentos jurídicos</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => navigate(createPageUrl('DocumentGenerator'))}
              className="gap-2"
            >
              <Sparkles className="w-4 h-4 text-indigo-500" />
              Gerar com IA
            </Button>
            <Button 
              onClick={() => setIsCreateOpen(true)} 
              className="bg-indigo-600 gap-2"
            >
              <Plus className="w-4 h-4" />
              Novo Manual
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 items-center bg-white p-4 rounded-xl border shadow-sm dark:bg-neutral-900 dark:border-neutral-800">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Buscar por título ou tipo..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="ghost" size="icon" onClick={() => refetch()} title="Atualizar lista">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="text-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-500">Carregando documentos...</p>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed rounded-xl">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium">Nenhum documento encontrado</h3>
            <p className="text-gray-500 mt-2 mb-6">Crie um documento manual ou use a IA</p>
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={() => navigate(createPageUrl('DocumentGenerator'))}>
                <Sparkles className="w-4 h-4 mr-2" />
                Usar IA
              </Button>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Manualmente
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocs.map((doc) => (
              <Card key={doc.id} className="hover:shadow-lg transition-all cursor-pointer border-t-4 border-t-indigo-500">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="line-clamp-1 text-lg">{doc.title}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-xs font-medium">
                          {doc.type}
                        </span>
                        <span className="text-xs flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(doc.created_date).toLocaleDateString()}
                        </span>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500 line-clamp-3 min-h-[3rem] mb-4">
                    {doc.content || doc.notes || "Sem conteúdo prévia..."}
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      className="flex-1" 
                      variant="secondary"
                      onClick={() => { setSelectedDoc(doc); setIsViewOpen(true); }}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Visualizar
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => handleDownload(doc)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create Modal */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Novo Documento Manual</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Título *</Label>
                  <Input 
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Ex: Petição Inicial - Caso Silva"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(v) => setFormData({...formData, type: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {docTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Conteúdo do Documento</Label>
                <Textarea 
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  rows={10}
                  placeholder="Digite ou cole o conteúdo do documento aqui..."
                />
              </div>
              <div className="space-y-2">
                <Label>Notas/Observações</Label>
                <Input 
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Anotações internas..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
              <Button onClick={() => createMutation.mutate(formData)} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Salvando..." : "Salvar Documento"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Modal */}
        <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedDoc?.title}</DialogTitle>
              <CardDescription>
                Criado em {selectedDoc && new Date(selectedDoc.created_date).toLocaleString()}
              </CardDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg whitespace-pre-wrap font-mono text-sm border">
                {selectedDoc?.content || "Sem conteúdo"}
              </div>
              {selectedDoc?.notes && (
                <div className="text-sm text-gray-500">
                  <strong>Notas:</strong> {selectedDoc.notes}
                </div>
              )}
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="destructive" onClick={() => {
                if(confirm("Tem certeza que deseja excluir?")) deleteMutation.mutate(selectedDoc.id);
              }}>
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleDownload(selectedDoc)}>
                  <Download className="w-4 h-4 mr-2" />
                  Baixar PDF
                </Button>
                <Button onClick={() => setIsViewOpen(false)}>Fechar</Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}