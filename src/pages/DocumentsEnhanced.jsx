import React, { useState, useEffect, useRef } from "react";
import PageHeader from "@/components/common/PageHeader";
import StatCard from "@/components/common/StatCard";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  FileText,
  Plus,
  Search,
  Upload,
  FolderOpen,
  Tag,
  Clock,
  Users,
  MoreVertical,
  Download,
  Trash2,
  Edit,
  History,
  Share2,
  Eye,
  Filter,
  Grid,
  List,
  X,
  Check,
  ChevronRight,
  Scan,
  RotateCcw,
  Link as LinkIcon
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useDebounce } from "@/components/common/useDebounce";

const tagColors = {
  blue: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  green: "bg-green-500/20 text-green-400 border-green-500/30",
  red: "bg-red-500/20 text-red-400 border-red-500/30",
  yellow: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  purple: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  pink: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  orange: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  gray: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

export default function DocumentsEnhanced({ theme = 'light' }) {
  const isDark = false;
  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [viewMode, setViewMode] = useState("list");
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showVersionDialog, setShowVersionDialog] = useState(false);
  const [showTagDialog, setShowTagDialog] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [filterTags, setFilterTags] = useState([]);
  const [filterType, setFilterType] = useState("all");
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {}).finally(() => setUserLoading(false));
  }, []);

  const { data: documents = [], isLoading: docsLoading } = useQuery({
    queryKey: ['legal-documents', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.LegalDocument.filter({ created_by: user.email }, '-created_date');
    },
    enabled: !!user?.email,
  });

  const { data: tags = [] } = useQuery({
    queryKey: ['document-tags', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.DocumentTag.filter({ created_by: user.email });
    },
    enabled: !!user?.email,
  });

  const { data: versions = [] } = useQuery({
    queryKey: ['document-versions', selectedDoc?.id],
    queryFn: () => base44.entities.DocumentVersion.filter({ document_id: selectedDoc.id }, '-version_number'),
    enabled: !!selectedDoc,
  });

  const { data: cases = [] } = useQuery({
    queryKey: ['cases', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.Case.filter({ created_by: user.email });
    },
    enabled: !!user?.email,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.Client.filter({ created_by: user.email });
    },
    enabled: !!user?.email,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.Task.filter({ created_by: user.email });
    },
    enabled: !!user?.email,
  });

  // Auto-open document by docId URL param (e.g. from ClientRelatedData)
  useEffect(() => {
    if (!documents.length) return;
    const params = new URLSearchParams(window.location.search);
    const docId = params.get('docId');
    if (docId) {
      const doc = documents.find(d => d.id === docId);
      if (doc) {
        setSelectedDoc(doc);
        setShowDetails(true);
      }
    }
  }, [documents]);

  const handleSelectDoc = (doc) => {
    setSelectedDoc(doc);
    setShowDetails(true);
  };

  const uploadDocMutation = useMutation({
    mutationFn: async (data) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: data.file });
      
      // Extrair texto do documento para busca (OCR simulado)
      let ocrContent = "";
      try {
        const extractResult = await base44.integrations.Core.InvokeLLM({
          prompt: `Extraia o texto completo deste documento para indexação e busca. Retorne apenas o conteúdo textual extraído.`,
          file_urls: [file_url],
          response_json_schema: {
            type: "object",
            properties: {
              extracted_text: { type: "string" }
            }
          }
        });
        ocrContent = extractResult.extracted_text || "";
      } catch (error) {
        console.log("Erro ao extrair conteúdo:", error);
      }

      const doc = await base44.entities.LegalDocument.create({
        title: data.title,
        type: data.type,
        notes: data.notes,
        case_ids: data.case_ids || [],
        task_ids: data.task_ids || [],
        client_ids: data.client_ids || [],
        tags: data.tags || [],
        file_url,
        ocr_content: ocrContent,
        current_version: 1,
        status: 'draft'
      });
      
      // Create first version
      await base44.entities.DocumentVersion.create({
        document_id: doc.id,
        version_number: 1,
        file_url,
        changes_description: "Versão inicial",
        author_name: user?.full_name,
        author_email: user?.email
      });
      return doc;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legal-documents'] });
      setShowUploadDialog(false);
      toast.success("Documento enviado e indexado!");
    },
  });

  const uploadNewVersionMutation = useMutation({
    mutationFn: async ({ documentId, file, description }) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const currentVersions = await base44.entities.DocumentVersion.filter({ document_id: documentId });
      const newVersionNumber = currentVersions.length + 1;
      
      // Extrair conteúdo da nova versão
      let ocrContent = "";
      try {
        const extractResult = await base44.integrations.Core.InvokeLLM({
          prompt: `Extraia o texto completo deste documento para indexação e busca. Retorne apenas o conteúdo textual extraído.`,
          file_urls: [file_url],
          response_json_schema: {
            type: "object",
            properties: {
              extracted_text: { type: "string" }
            }
          }
        });
        ocrContent = extractResult.extracted_text || "";
      } catch (error) {
        console.log("Erro ao extrair conteúdo:", error);
      }
      
      await base44.entities.DocumentVersion.create({
        document_id: documentId,
        version_number: newVersionNumber,
        file_url,
        changes_description: description,
        author_name: user?.full_name,
        author_email: user?.email
      });
      
      await base44.entities.LegalDocument.update(documentId, { 
        file_url,
        ocr_content: ocrContent,
        current_version: newVersionNumber
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legal-documents'] });
      queryClient.invalidateQueries({ queryKey: ['document-versions'] });
      setShowVersionDialog(false);
      toast.success("Nova versão adicionada e indexada!");
    },
  });

  const revertToVersionMutation = useMutation({
    mutationFn: async ({ documentId, versionId, versionNumber, fileUrl }) => {
      await base44.entities.LegalDocument.update(documentId, {
        file_url: fileUrl,
        current_version: versionNumber
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legal-documents'] });
      queryClient.invalidateQueries({ queryKey: ['document-versions'] });
      toast.success("Versão restaurada!");
    },
  });

  const createTagMutation = useMutation({
    mutationFn: (data) => base44.entities.DocumentTag.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-tags'] });
      toast.success("Tag criada!");
    },
  });

  const deleteDocMutation = useMutation({
    mutationFn: (id) => base44.entities.LegalDocument.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legal-documents'] });
      setSelectedDoc(null);
      toast.success("Documento excluído!");
    },
  });

  const filteredDocs = documents.filter(doc => {
    const searchLower = debouncedSearch.toLowerCase();
    const matchesSearch = doc.title?.toLowerCase().includes(searchLower) ||
      doc.content?.toLowerCase().includes(searchLower) ||
      doc.ocr_content?.toLowerCase().includes(searchLower) ||
      doc.notes?.toLowerCase().includes(searchLower);
    const matchesType = filterType === "all" || doc.type === filterType;
    const matchesTags = filterTags.length === 0 || filterTags.some(t => doc.tags?.includes(t));
    return matchesSearch && matchesType && matchesTags;
  });

  const docTypes = ["peticao", "recurso", "contestacao", "contrato", "procuracao", "parecer", "memorando", "outros"];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "var(--font-body)" }}>
      <PageHeader
        title="Documentos"
        sub="Gerencie seus documentos jurídicos"
        actions={
          <>
            <button className="btn-secondary" onClick={() => setShowTagDialog(true)}>
              <Tag size={13} /> Tags
            </button>
            <button className="btn-primary" onClick={() => setShowUploadDialog(true)}>
              <Upload size={13} /> Upload
            </button>
          </>
        }
      />

      {/* KPI Strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", background: "var(--border)", gap: 1, borderBottom: "1px solid var(--border)" }} className="lg:grid-cols-4 grid-cols-2">
        <StatCard title="Total" value={documents.length} sub="documentos" accentColor="ink" loading={userLoading || docsLoading} />
        <StatCard title="Rascunhos" value={documents.filter(d => d.status === 'draft').length} sub="pendentes" accentColor={documents.filter(d=>d.status==='draft').length > 0 ? "warn" : "neutral"} loading={userLoading || docsLoading} />
        <StatCard title="Indexados" value={documents.filter(d => d.ocr_content).length} sub="com OCR" accentColor="ok" loading={userLoading || docsLoading} />
        <StatCard title="Tags" value={tags.length} sub="categorias" accentColor="neutral" loading={userLoading || docsLoading} />
      </div>

      <div style={{ padding: "24px 28px" }}>
        {/* Filters & Search */}
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: "14px 16px", marginBottom: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ position: "relative" }}>
              <Search style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 13, height: 13, color: "var(--text-3)" }} />
              <input
                placeholder="Buscar em títulos, conteúdo e documentos indexados..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: "100%", paddingLeft: 32, border: "1.5px solid var(--border)", borderRadius: "var(--r-md)", fontSize: 13, fontFamily: "var(--font-body)", background: "var(--card)", paddingTop: 8, paddingBottom: 8, paddingRight: 12, outline: "none", color: "var(--text-1)" }}
              />
            </div>
            {filterTags.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {filterTags.map(tagId => {
                  const tag = tags.find(t => t.id === tagId);
                  return tag ? (
                    <Badge key={tagId} className={tagColors[tag.color]} variant="outline">
                      {tag.name}
                      <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setFilterTags(filterTags.filter(t => t !== tagId))} />
                    </Badge>
                  ) : null;
                })}
              </div>
            )}
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                style={{ flex: 1, padding: "8px 10px", border: "1.5px solid var(--border)", borderRadius: "var(--r-md)", fontSize: 13, fontFamily: "var(--font-body)", background: "var(--card)", color: "var(--text-1)", outline: "none" }}
              >
                <option value="all">Todos os tipos</option>
                {docTypes.map(type => (
                  <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                ))}
              </select>
              <div style={{ display: "flex", gap: 4 }}>
                <button onClick={() => setViewMode("grid")} style={{ padding: "7px 10px", border: "1.5px solid var(--border)", borderRadius: "var(--r-sm)", background: viewMode === "grid" ? "var(--accent)" : "var(--card)", color: viewMode === "grid" ? "#fff" : "var(--text-2)", cursor: "pointer", transition: "all 0.15s" }}>
                  <Grid size={13} />
                </button>
                <button onClick={() => setViewMode("list")} style={{ padding: "7px 10px", border: "1.5px solid var(--border)", borderRadius: "var(--r-sm)", background: viewMode === "list" ? "var(--accent)" : "var(--card)", color: viewMode === "list" ? "#fff" : "var(--text-2)", cursor: "pointer", transition: "all 0.15s" }}>
                  <List size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Document List */}
        <div>
          {viewMode === "grid" ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
              {filteredDocs.map((doc) => {
                const statusLabel = { draft: "Rascunho", review: "Revisão", approved: "Aprovado", sent: "Enviado", archived: "Arquivado" }[doc.status] || doc.status;
                return (
                  <div
                    key={doc.id}
                    onClick={() => handleSelectDoc(doc)}
                    className="card"
                    style={{ padding: "16px 18px", cursor: "pointer", borderLeft: selectedDoc?.id === doc.id ? "3px solid var(--accent)" : "3px solid transparent" }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--surface)"}
                    onMouseLeave={e => e.currentTarget.style.background = "var(--card)"}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
                      <FileText style={{ width: 16, height: 16, color: "var(--text-3)", strokeWidth: 1.5 }} />
                      <span className="badge badge-neutral">{statusLabel}</span>
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-1)", margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.title}</p>
                    <p style={{ fontSize: 11, color: "var(--text-3)", margin: 0 }}>{doc.type} · {new Date(doc.created_date).toLocaleDateString("pt-BR")}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", overflow: "hidden" }}>
              {filteredDocs.map((doc, i) => {
                const statusLabel = { draft: "Rascunho", review: "Revisão", approved: "Aprovado", sent: "Enviado", archived: "Arquivado" }[doc.status] || doc.status;
                return (
                  <div
                    key={doc.id}
                    onClick={() => handleSelectDoc(doc)}
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "12px 16px",
                      borderBottom: i < filteredDocs.length - 1 ? "1px solid var(--border)" : "none",
                      cursor: "pointer", transition: "background 0.15s",
                      background: selectedDoc?.id === doc.id ? "var(--accent-light)" : "transparent",
                      borderLeft: selectedDoc?.id === doc.id ? "3px solid var(--accent)" : "3px solid transparent",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--surface)"}
                    onMouseLeave={e => e.currentTarget.style.background = selectedDoc?.id === doc.id ? "var(--accent-light)" : "transparent"}
                  >
                    <FileText style={{ width: 15, height: 15, color: "var(--text-3)", flexShrink: 0, strokeWidth: 1.5 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-1)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.title}</p>
                      <p style={{ fontSize: 11, color: "var(--text-3)", margin: "2px 0 0" }}>{doc.type} · {new Date(doc.created_date).toLocaleDateString("pt-BR")}</p>
                    </div>
                    <span className="badge badge-neutral">{statusLabel}</span>
                    <ChevronRight style={{ width: 13, height: 13, color: "var(--text-3)", flexShrink: 0 }} />
                  </div>
                );
              })}
            </div>
          )}

          {filteredDocs.length === 0 && (
            <div style={{ textAlign: "center", padding: "48px 20px", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--card)" }}>
              <FileText style={{ width: 32, height: 32, color: "var(--text-3)", margin: "0 auto 10px" }} />
              <p style={{ fontSize: 13, color: "var(--text-2)" }}>Nenhum documento encontrado</p>
            </div>
          )}
        </div>

        {/* Document Details Sheet */}
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="max-w-lg sm:max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between pr-8">
                <span className="truncate">{selectedDoc?.title}</span>
              </DialogTitle>
            </DialogHeader>
            {selectedDoc && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={selectedDoc.status === 'approved' ? 'default' : 'secondary'}>
                    {selectedDoc.status === 'draft' && 'Rascunho'}
                    {selectedDoc.status === 'review' && 'Revisão'}
                    {selectedDoc.status === 'approved' && 'Aprovado'}
                    {selectedDoc.status === 'sent' && 'Enviado'}
                    {selectedDoc.status === 'archived' && 'Arquivado'}
                  </Badge>
                  <span className="text-sm text-gray-500">{selectedDoc.type}</span>
                </div>

                <div className="flex gap-2 flex-wrap">
                  {selectedDoc.file_url && (
                    <>
                      <Button size="sm" variant="default" onClick={() => window.open(selectedDoc.file_url, '_blank')}>
                        <Eye className="w-4 h-4 mr-2" /> Visualizar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => window.open(selectedDoc.file_url, '_blank')}>
                        <Download className="w-4 h-4 mr-2" /> Download
                      </Button>
                    </>
                  )}
                  <Button size="sm" variant="outline" onClick={() => setShowVersionDialog(true)}>
                    <Upload className="w-4 h-4 mr-2" /> Nova Versão
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => { deleteDocMutation.mutate(selectedDoc.id); setShowDetails(false); }}>
                    <Trash2 className="w-4 h-4 mr-2" /> Excluir
                  </Button>
                </div>

                <Tabs defaultValue="details">
                  <TabsList className="w-full">
                    <TabsTrigger value="details" className="flex-1">Detalhes</TabsTrigger>
                    <TabsTrigger value="versions" className="flex-1">Versões</TabsTrigger>
                  </TabsList>

                  <TabsContent value="details" className="mt-4 space-y-4">
                    <div>
                      <label className="text-xs text-gray-500">Criado em</label>
                      <p className="font-medium">{new Date(selectedDoc.created_date).toLocaleString('pt-BR')}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Versão Atual</label>
                      <p className="font-medium">v{selectedDoc.current_version || 1}</p>
                    </div>
                    {selectedDoc.case_ids && selectedDoc.case_ids.length > 0 && (
                      <div>
                        <label className="text-xs text-gray-500">Processos Vinculados</label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedDoc.case_ids.map(caseId => {
                            const caseItem = cases.find(c => c.id === caseId);
                            return caseItem ? (
                              <Badge key={caseId} variant="outline" className="text-xs">
                                <LinkIcon className="w-3 h-3 mr-1" />
                                {caseItem.title}
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                    {selectedDoc.task_ids && selectedDoc.task_ids.length > 0 && (
                      <div>
                        <label className="text-xs text-gray-500">Tarefas Vinculadas</label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedDoc.task_ids.map(taskId => {
                            const task = tasks.find(t => t.id === taskId);
                            return task ? (
                              <Badge key={taskId} variant="outline" className="text-xs">
                                <LinkIcon className="w-3 h-3 mr-1" />
                                {task.title}
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                    {selectedDoc.client_ids && selectedDoc.client_ids.length > 0 && (
                      <div>
                        <label className="text-xs text-gray-500">Clientes Vinculados</label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedDoc.client_ids.map(clientId => {
                            const client = clients.find(c => c.id === clientId);
                            return client ? (
                              <Badge key={clientId} variant="outline" className="text-xs">
                                <LinkIcon className="w-3 h-3 mr-1" />
                                {client.name}
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                    {selectedDoc.tags && selectedDoc.tags.length > 0 && (
                      <div>
                        <label className="text-xs text-gray-500">Tags</label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedDoc.tags.map(tagId => {
                            const tag = tags.find(t => t.id === tagId);
                            return tag ? (
                              <Badge key={tagId} className={tagColors[tag.color]}>
                                {tag.name}
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                    {selectedDoc.ocr_content && (
                      <div>
                        <label className="text-xs text-gray-500 flex items-center gap-1">
                          <Scan className="w-3 h-3" />
                          Conteúdo Indexado
                        </label>
                        <p className="text-xs text-gray-600 mt-1 max-h-32 overflow-y-auto">
                          {selectedDoc.ocr_content.substring(0, 500)}...
                        </p>
                      </div>
                    )}
                    {selectedDoc.notes && (
                      <div>
                        <label className="text-xs text-gray-500">Observações</label>
                        <p className="text-sm text-gray-700">{selectedDoc.notes}</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="versions" className="mt-4">
                    <div className="space-y-3">
                      {versions.map((ver) => (
                        <div key={ver.id} className={`p-3 rounded-lg ${ver.version_number === selectedDoc.current_version ? 'bg-blue-50 border border-blue-200' : 'bg-gray-100'}`}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Versão {ver.version_number}</span>
                              {ver.version_number === selectedDoc.current_version && (
                                <Badge variant="default" className="text-xs">Atual</Badge>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" onClick={() => window.open(ver.file_url, '_blank')} title="Visualizar">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => window.open(ver.file_url, '_blank')} title="Download">
                                <Download className="w-4 h-4" />
                              </Button>
                              {ver.version_number !== selectedDoc.current_version && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => {
                                    if (confirm(`Reverter para versão ${ver.version_number}?`)) {
                                      revertToVersionMutation.mutate({
                                        documentId: selectedDoc.id,
                                        versionId: ver.id,
                                        versionNumber: ver.version_number,
                                        fileUrl: ver.file_url
                                      });
                                    }
                                  }}
                                  title="Reverter para esta versão"
                                >
                                  <RotateCcw className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600">{ver.changes_description}</p>
                          <p className="text-xs mt-1 text-gray-400">
                            {ver.author_name} • {new Date(ver.created_date).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      ))}
                      {versions.length === 0 && (
                        <p className="text-center py-4 text-sm text-gray-500">Nenhuma versão encontrada</p>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload de Documento</DialogTitle>
          </DialogHeader>
          <UploadDocumentForm
            cases={cases}
            clients={clients}
            tasks={tasks}
            tags={tags}
            docTypes={docTypes}
            onSubmit={(data) => uploadDocMutation.mutate(data)}
            onCancel={() => setShowUploadDialog(false)}
            isLoading={uploadDocMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* New Version Dialog */}
      <Dialog open={showVersionDialog} onOpenChange={setShowVersionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Versão</DialogTitle>
          </DialogHeader>
          <NewVersionForm
            documentId={selectedDoc?.id}
            onSubmit={(data) => uploadNewVersionMutation.mutate(data)}
            onCancel={() => setShowVersionDialog(false)}
            isLoading={uploadNewVersionMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Tag Manager Dialog */}
      <Dialog open={showTagDialog} onOpenChange={setShowTagDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerenciar Tags</DialogTitle>
          </DialogHeader>
          <TagManager
            tags={tags}
            onCreate={(data) => createTagMutation.mutate(data)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function UploadDocumentForm({ cases, clients, tasks, tags, docTypes, onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState({ 
    title: "", 
    type: "outros", 
    case_ids: [], 
    task_ids: [], 
    client_ids: [], 
    tags: [], 
    notes: "" 
  });
  const [file, setFile] = useState(null);

  const toggleSelection = (array, id) => {
    return array.includes(id) ? array.filter(i => i !== id) : [...array, id];
  };

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      <div>
        <label className="text-sm font-medium">Arquivo *</label>
        <Input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
          className="mt-1"
        />
        <p className="text-xs text-gray-500 mt-1">
          <Scan className="w-3 h-3 inline mr-1" />
          O conteúdo será automaticamente indexado para busca avançada
        </p>
      </div>
      <div>
        <label className="text-sm font-medium">Título *</label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Nome do documento"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Tipo</label>
        <select
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
        >
          {docTypes.map(type => (
            <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
          ))}
        </select>
      </div>
      
      <div>
        <label className="text-sm font-medium flex items-center gap-1">
          <LinkIcon className="w-3 h-3" />
          Processos Vinculados (múltipla seleção)
        </label>
        <div className="mt-2 max-h-32 overflow-y-auto border rounded-lg p-2 space-y-1">
          {cases.map(c => (
            <label key={c.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
              <input
                type="checkbox"
                checked={formData.case_ids.includes(c.id)}
                onChange={() => setFormData({ ...formData, case_ids: toggleSelection(formData.case_ids, c.id) })}
                className="rounded"
              />
              <span className="text-sm">{c.title}</span>
            </label>
          ))}
          {cases.length === 0 && <p className="text-xs text-gray-400 p-2">Nenhum processo disponível</p>}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium flex items-center gap-1">
          <LinkIcon className="w-3 h-3" />
          Tarefas Vinculadas (múltipla seleção)
        </label>
        <div className="mt-2 max-h-32 overflow-y-auto border rounded-lg p-2 space-y-1">
          {tasks.map(t => (
            <label key={t.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
              <input
                type="checkbox"
                checked={formData.task_ids.includes(t.id)}
                onChange={() => setFormData({ ...formData, task_ids: toggleSelection(formData.task_ids, t.id) })}
                className="rounded"
              />
              <span className="text-sm">{t.title}</span>
            </label>
          ))}
          {tasks.length === 0 && <p className="text-xs text-gray-400 p-2">Nenhuma tarefa disponível</p>}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium flex items-center gap-1">
          <LinkIcon className="w-3 h-3" />
          Clientes Vinculados (múltipla seleção)
        </label>
        <div className="mt-2 max-h-32 overflow-y-auto border rounded-lg p-2 space-y-1">
          {clients.map(c => (
            <label key={c.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
              <input
                type="checkbox"
                checked={formData.client_ids.includes(c.id)}
                onChange={() => setFormData({ ...formData, client_ids: toggleSelection(formData.client_ids, c.id) })}
                className="rounded"
              />
              <span className="text-sm">{c.name}</span>
            </label>
          ))}
          {clients.length === 0 && <p className="text-xs text-gray-400 p-2">Nenhum cliente disponível</p>}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Tags</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {tags.map(tag => (
            <Badge
              key={tag.id}
              className={`cursor-pointer ${formData.tags.includes(tag.id) ? tagColors[tag.color] : 'opacity-50'}`}
              onClick={() => setFormData({ ...formData, tags: toggleSelection(formData.tags, tag.id) })}
            >
              {formData.tags.includes(tag.id) && <Check className="w-3 h-3 mr-1" />}
              {tag.name}
            </Badge>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Observações</label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Observações sobre o documento"
          rows={3}
        />
      </div>
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button onClick={() => onSubmit({ ...formData, file })} disabled={!file || !formData.title || isLoading}>
          {isLoading ? "Enviando e indexando..." : "Upload e Indexar"}
        </Button>
      </div>
    </div>
  );
}

function NewVersionForm({ documentId, onSubmit, onCancel, isLoading }) {
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState("");

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">Novo arquivo</label>
        <Input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          accept=".pdf,.doc,.docx,.txt"
          className="mt-1"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Descrição das alterações</label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="O que foi alterado nesta versão?"
        />
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button
          onClick={() => onSubmit({ documentId, file, description })}
          disabled={!file || !description || isLoading}
        >
          {isLoading ? "Enviando..." : "Salvar Versão"}
        </Button>
      </div>
    </div>
  );
}

function TagManager({ tags, onCreate }) {
  const [newTag, setNewTag] = useState({ name: "", color: "blue" });

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Nome da tag"
          value={newTag.name}
          onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
        />
        <select
          value={newTag.color}
          onChange={(e) => setNewTag({ ...newTag, color: e.target.value })}
          className="px-3 py-2 border rounded-lg bg-background"
        >
          {Object.keys(tagColors).map(color => (
            <option key={color} value={color}>{color}</option>
          ))}
        </select>
        <Button onClick={() => { onCreate(newTag); setNewTag({ name: "", color: "blue" }); }} disabled={!newTag.name}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map(tag => (
          <Badge key={tag.id} className={tagColors[tag.color]}>
            {tag.name}
          </Badge>
        ))}
      </div>
    </div>
  );
}