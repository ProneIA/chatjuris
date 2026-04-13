import React, { useState, useEffect, useRef } from "react";
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
  const isDark = theme === 'dark';
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

  if (userLoading || docsLoading) {
    return (
      <div className={`min-h-screen p-3 sm:p-4 md:p-6 ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <div className={`h-7 w-40 rounded animate-pulse ${isDark ? 'bg-neutral-800' : 'bg-gray-200'}`} />
              <div className={`h-4 w-56 rounded animate-pulse mt-2 ${isDark ? 'bg-neutral-800' : 'bg-gray-200'}`} />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[1,2,3,4].map(i => (
              <div key={i} className={`p-4 rounded-xl border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}`}>
                <div className={`h-10 w-10 rounded-lg animate-pulse mb-2 ${isDark ? 'bg-neutral-800' : 'bg-gray-100'}`} />
                <div className={`h-6 w-12 rounded animate-pulse ${isDark ? 'bg-neutral-800' : 'bg-gray-200'}`} />
              </div>
            ))}
          </div>
          <div className={`rounded-xl border divide-y ${isDark ? 'bg-neutral-900 border-neutral-800 divide-neutral-800' : 'bg-white border-gray-200 divide-gray-100'}`}>
            {[1,2,3,4,5].map(i => (
              <div key={i} className="p-4 flex items-center gap-3">
                <div className={`h-5 w-5 rounded animate-pulse ${isDark ? 'bg-neutral-700' : 'bg-gray-200'}`} />
                <div className="flex-1">
                  <div className={`h-4 w-2/3 rounded animate-pulse mb-1 ${isDark ? 'bg-neutral-700' : 'bg-gray-200'}`} />
                  <div className={`h-3 w-1/3 rounded animate-pulse ${isDark ? 'bg-neutral-800' : 'bg-gray-100'}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-3 sm:p-4 md:p-6 ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6">
          <div>
            <h1 className={`text-xl sm:text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Documentos
            </h1>
            <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
              Gerencie seus documentos jurídicos
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" size="sm" onClick={() => setShowTagDialog(true)} className="flex-1 sm:flex-none">
              <Tag className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Tags</span>
            </Button>
            <Button size="sm" onClick={() => setShowUploadDialog(true)} className="flex-1 sm:flex-none">
              <Upload className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Upload</span>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
          {[
            { label: "Total", value: documents.length, icon: FileText },
            { label: "Rascunhos", value: documents.filter(d => d.status === 'draft').length, icon: Edit },
            { label: "Indexados", value: documents.filter(d => d.ocr_content).length, icon: Scan },
            { label: "Tags", value: tags.length, icon: Tag },
          ].map((stat, i) => (
            <div key={i} className={`p-3 sm:p-4 rounded-lg sm:rounded-xl border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-neutral-800' : 'bg-gray-100'}`}>
                  <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${isDark ? 'text-white' : 'text-gray-700'}`} />
                </div>
                <div>
                  <p className={`text-lg sm:text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{stat.value}</p>
                  <p className={`text-[10px] sm:text-xs ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters & Search */}
        <div className={`p-3 sm:p-4 rounded-lg sm:rounded-xl border mb-4 sm:mb-6 ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}`}>
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar em títulos, conteúdo e documentos indexados..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 text-sm"
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
            <div className="flex gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className={`flex-1 px-3 py-2 text-sm rounded-lg border ${isDark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-white border-gray-200'}`}
              >
                <option value="all">Todos os tipos</option>
                {docTypes.map(type => (
                  <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                ))}
              </select>
              <div className="flex gap-1">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                  className="h-9 w-9"
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("list")}
                  className="h-9 w-9"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Document List - Full Width on Mobile */}
        <div className="space-y-4">
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {filteredDocs.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => handleSelectDoc(doc)}
                  className={`p-3 sm:p-4 rounded-lg sm:rounded-xl border cursor-pointer transition-all active:scale-[0.98] ${
                    selectedDoc?.id === doc.id
                      ? 'ring-2 ring-blue-500'
                      : ''
                  } ${isDark ? 'bg-neutral-900 border-neutral-800 hover:border-neutral-700' : 'bg-white border-gray-200 hover:border-gray-300'}`}
                >
                  <div className="flex items-start justify-between mb-2 sm:mb-3">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-neutral-800' : 'bg-gray-100'}`}>
                      <FileText className={`w-4 h-4 sm:w-5 sm:h-5 ${isDark ? 'text-white' : 'text-gray-700'}`} />
                    </div>
                    <Badge variant={doc.status === 'approved' ? 'default' : 'secondary'} className="text-[10px] sm:text-xs">
                      {doc.status === 'draft' && 'Rascunho'}
                      {doc.status === 'review' && 'Revisão'}
                      {doc.status === 'approved' && 'Aprovado'}
                      {doc.status === 'sent' && 'Enviado'}
                      {doc.status === 'archived' && 'Arquivado'}
                    </Badge>
                  </div>
                  <h3 className={`font-medium text-sm sm:text-base mb-1 line-clamp-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {doc.title}
                  </h3>
                  <p className={`text-xs sm:text-sm mb-2 sm:mb-3 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                    {doc.type?.charAt(0).toUpperCase() + doc.type?.slice(1)}
                  </p>
                  <span className={`text-[10px] sm:text-xs ${isDark ? 'text-neutral-500' : 'text-gray-400'}`}>
                    {new Date(doc.created_date).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className={`rounded-lg sm:rounded-xl border divide-y ${isDark ? 'bg-neutral-900 border-neutral-800 divide-neutral-800' : 'bg-white border-gray-200 divide-gray-200'}`}>
              {filteredDocs.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => handleSelectDoc(doc)}
                  className={`p-3 sm:p-4 cursor-pointer transition-colors active:bg-opacity-80 ${
                    selectedDoc?.id === doc.id
                      ? isDark ? 'bg-neutral-800' : 'bg-gray-100'
                      : isDark ? 'hover:bg-neutral-800/50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <FileText className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`} />
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-medium text-sm sm:text-base truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{doc.title}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className={`text-xs sm:text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>{doc.type}</p>
                        <span className={`text-[10px] sm:text-xs ${isDark ? 'text-neutral-500' : 'text-gray-400'}`}>
                          • {new Date(doc.created_date).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                    <Badge variant={doc.status === 'approved' ? 'default' : 'secondary'} className="text-[10px] sm:text-xs shrink-0">
                      {doc.status === 'draft' && 'Rascunho'}
                      {doc.status === 'review' && 'Revisão'}
                      {doc.status === 'approved' && 'Aprovado'}
                      {doc.status === 'sent' && 'Enviado'}
                      {doc.status === 'archived' && 'Arquivado'}
                    </Badge>
                    <ChevronRight className={`w-4 h-4 shrink-0 ${isDark ? 'text-neutral-500' : 'text-gray-400'}`} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {filteredDocs.length === 0 && (
            <div className={`text-center py-12 rounded-xl border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}`}>
              <FileText className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-neutral-700' : 'text-gray-300'}`} />
              <p className={`${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>Nenhum documento encontrado</p>
            </div>
          )}
        </div>

        {/* Document Details Sheet - Full Screen on Mobile */}
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