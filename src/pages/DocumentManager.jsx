import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  FileText, 
  Upload, 
  Search, 
  Filter,
  FolderOpen,
  Tag,
  Clock,
  Users,
  Download,
  Eye,
  Trash2,
  Plus,
  History,
  Share2,
  MoreVertical,
  Grid,
  List,
  Star,
  StarOff,
  X,
  Check
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const documentTypes = [
  { value: "peticao", label: "Petição", color: "blue" },
  { value: "recurso", label: "Recurso", color: "purple" },
  { value: "contestacao", label: "Contestação", color: "orange" },
  { value: "contrato", label: "Contrato", color: "green" },
  { value: "procuracao", label: "Procuração", color: "pink" },
  { value: "parecer", label: "Parecer", color: "yellow" },
  { value: "memorando", label: "Memorando", color: "red" },
  { value: "outros", label: "Outros", color: "gray" }
];

export default function DocumentManager({ theme = 'light' }) {
  const isDark = theme === 'dark';
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showVersionDialog, setShowVersionDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [uploadData, setUploadData] = useState({
    title: "",
    type: "outros",
    case_id: "",
    client_id: "",
    tags: [],
    notes: ""
  });
  const [tagInput, setTagInput] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: documents = [] } = useQuery({
    queryKey: ['legal-documents'],
    queryFn: () => base44.entities.LegalDocument.list('-created_date'),
  });

  const { data: cases = [] } = useQuery({
    queryKey: ['cases'],
    queryFn: () => base44.entities.Case.list(),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
  });

  const { data: versions = [] } = useQuery({
    queryKey: ['document-versions', selectedDocument?.id],
    queryFn: () => base44.entities.DocumentVersion.filter({ document_id: selectedDocument?.id }, '-version_number'),
    enabled: !!selectedDocument?.id,
  });

  const createDocumentMutation = useMutation({
    mutationFn: (data) => base44.entities.LegalDocument.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legal-documents'] });
      setShowUploadDialog(false);
      resetUploadForm();
    }
  });

  const updateDocumentMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.LegalDocument.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legal-documents'] });
    }
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: (id) => base44.entities.LegalDocument.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legal-documents'] });
      setSelectedDocument(null);
    }
  });

  const createVersionMutation = useMutation({
    mutationFn: (data) => base44.entities.DocumentVersion.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-versions'] });
    }
  });

  const resetUploadForm = () => {
    setUploadData({ title: "", type: "outros", case_id: "", client_id: "", tags: [], notes: "" });
    setSelectedFile(null);
    setTagInput("");
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!uploadData.title) {
        setUploadData({ ...uploadData, title: file.name.replace(/\.[^/.]+$/, "") });
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !uploadData.title) return;
    
    setUploadingFile(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: selectedFile });
      
      await createDocumentMutation.mutateAsync({
        title: uploadData.title,
        type: uploadData.type,
        case_id: uploadData.case_id || undefined,
        client_id: uploadData.client_id || undefined,
        file_url,
        status: "draft",
        notes: uploadData.notes
      });
    } catch (error) {
      console.error("Erro no upload:", error);
      alert("Erro ao fazer upload do documento.");
    }
    setUploadingFile(false);
  };

  const handleNewVersion = async (file) => {
    if (!selectedDocument) return;
    
    setUploadingFile(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const newVersionNumber = (versions[0]?.version_number || 0) + 1;
      
      await createVersionMutation.mutateAsync({
        document_id: selectedDocument.id,
        version_number: newVersionNumber,
        file_url,
        edited_by: user?.email,
        edited_by_name: user?.full_name,
        changes_summary: "Nova versão"
      });

      await updateDocumentMutation.mutateAsync({
        id: selectedDocument.id,
        data: { file_url }
      });
    } catch (error) {
      console.error("Erro:", error);
    }
    setUploadingFile(false);
    setShowVersionDialog(false);
  };

  const addTag = () => {
    if (tagInput.trim() && !uploadData.tags.includes(tagInput.trim())) {
      setUploadData({ ...uploadData, tags: [...uploadData.tags, tagInput.trim()] });
      setTagInput("");
    }
  };

  const removeTag = (tag) => {
    setUploadData({ ...uploadData, tags: uploadData.tags.filter(t => t !== tag) });
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title?.toLowerCase().includes(search.toLowerCase());
    const matchesType = !filterType || doc.type === filterType;
    const matchesStatus = !filterStatus || doc.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getTypeColor = (type) => {
    const docType = documentTypes.find(t => t.value === type);
    return docType?.color || "gray";
  };

  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-black' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Gerenciador de Documentos
            </h1>
            <p className={`text-sm ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
              Upload, organização e controle de versões
            </p>
          </div>
          <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
            <DialogTrigger asChild>
              <Button className={isDark ? 'bg-white text-black hover:bg-gray-100' : ''}>
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Upload de Documento</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                {/* File Drop Zone */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    selectedFile 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx,.txt"
                  />
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-2">
                      <FileText className="w-8 h-8 text-green-600" />
                      <span className="text-green-700 font-medium">{selectedFile.name}</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">Clique para selecionar um arquivo</p>
                      <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX, TXT</p>
                    </>
                  )}
                </div>

                <Input
                  placeholder="Título do documento"
                  value={uploadData.title}
                  onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                />

                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={uploadData.type}
                    onChange={(e) => setUploadData({ ...uploadData, type: e.target.value })}
                    className="border rounded-lg p-2.5"
                  >
                    {documentTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>

                  <select
                    value={uploadData.case_id}
                    onChange={(e) => setUploadData({ ...uploadData, case_id: e.target.value })}
                    className="border rounded-lg p-2.5"
                  >
                    <option value="">Vincular a caso</option>
                    {cases.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>

                {/* Tags */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Tags</label>
                  <div className="flex gap-2 mb-2 flex-wrap">
                    {uploadData.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <X className="w-3 h-3 cursor-pointer" onClick={() => removeTag(tag)} />
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Adicionar tag"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    />
                    <Button type="button" variant="outline" onClick={addTag}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <Textarea
                  placeholder="Notas (opcional)"
                  value={uploadData.notes}
                  onChange={(e) => setUploadData({ ...uploadData, notes: e.target.value })}
                />

                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || !uploadData.title || uploadingFile}
                  className="w-full"
                >
                  {uploadingFile ? "Enviando..." : "Fazer Upload"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : ''}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isDark ? 'bg-neutral-800' : 'bg-blue-100'}`}>
                  <FileText className={`w-5 h-5 ${isDark ? 'text-white' : 'text-blue-600'}`} />
                </div>
                <div>
                  <p className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {documents.length}
                  </p>
                  <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                    Documentos
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : ''}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isDark ? 'bg-neutral-800' : 'bg-green-100'}`}>
                  <Check className={`w-5 h-5 ${isDark ? 'text-white' : 'text-green-600'}`} />
                </div>
                <div>
                  <p className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {documents.filter(d => d.status === 'approved').length}
                  </p>
                  <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                    Aprovados
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : ''}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isDark ? 'bg-neutral-800' : 'bg-yellow-100'}`}>
                  <Clock className={`w-5 h-5 ${isDark ? 'text-white' : 'text-yellow-600'}`} />
                </div>
                <div>
                  <p className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {documents.filter(d => d.status === 'review').length}
                  </p>
                  <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                    Em Revisão
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : ''}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isDark ? 'bg-neutral-800' : 'bg-purple-100'}`}>
                  <History className={`w-5 h-5 ${isDark ? 'text-white' : 'text-purple-600'}`} />
                </div>
                <div>
                  <p className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {versions.length}
                  </p>
                  <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                    Versões
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar documentos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`pl-10 ${isDark ? 'bg-neutral-900 border-neutral-800' : ''}`}
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className={`border rounded-lg px-3 py-2 ${isDark ? 'bg-neutral-900 border-neutral-800 text-white' : ''}`}
          >
            <option value="">Todos os tipos</option>
            {documentTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={`border rounded-lg px-3 py-2 ${isDark ? 'bg-neutral-900 border-neutral-800 text-white' : ''}`}
          >
            <option value="">Todos os status</option>
            <option value="draft">Rascunho</option>
            <option value="review">Em Revisão</option>
            <option value="approved">Aprovado</option>
            <option value="sent">Enviado</option>
          </select>
          <div className="flex border rounded-lg overflow-hidden">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-none"
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-none"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Documents Grid/List */}
        <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
          {filteredDocuments.map(doc => (
            <Card
              key={doc.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                isDark ? 'bg-neutral-900 border-neutral-800 hover:border-neutral-700' : 'hover:border-gray-300'
              }`}
              onClick={() => setSelectedDocument(doc)}
            >
              <CardContent className={viewMode === 'grid' ? 'p-4' : 'p-4 flex items-center gap-4'}>
                <div className={`${viewMode === 'list' ? 'shrink-0' : 'mb-3'}`}>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center bg-${getTypeColor(doc.type)}-100`}>
                    <FileText className={`w-6 h-6 text-${getTypeColor(doc.type)}-600`} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {doc.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      {documentTypes.find(t => t.value === doc.type)?.label}
                    </Badge>
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${
                        doc.status === 'approved' ? 'bg-green-100 text-green-700' :
                        doc.status === 'review' ? 'bg-yellow-100 text-yellow-700' :
                        ''
                      }`}
                    >
                      {doc.status === 'draft' ? 'Rascunho' :
                       doc.status === 'review' ? 'Revisão' :
                       doc.status === 'approved' ? 'Aprovado' :
                       doc.status === 'sent' ? 'Enviado' : doc.status}
                    </Badge>
                  </div>
                  <p className={`text-xs mt-2 ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                    {format(new Date(doc.created_date), "dd/MM/yyyy")}
                  </p>
                </div>
                {viewMode === 'list' && (
                  <div className="flex items-center gap-2">
                    {doc.file_url && (
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                      </a>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredDocuments.length === 0 && (
          <div className={`text-center py-16 ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum documento encontrado</p>
          </div>
        )}

        {/* Document Details Dialog */}
        <Dialog open={!!selectedDocument} onOpenChange={() => setSelectedDocument(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {selectedDocument?.title}
              </DialogTitle>
            </DialogHeader>
            {selectedDocument && (
              <Tabs defaultValue="details">
                <TabsList>
                  <TabsTrigger value="details">Detalhes</TabsTrigger>
                  <TabsTrigger value="versions">Versões ({versions.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Tipo</p>
                      <p className="font-medium">{documentTypes.find(t => t.value === selectedDocument.type)?.label}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <select
                        value={selectedDocument.status}
                        onChange={(e) => {
                          updateDocumentMutation.mutate({
                            id: selectedDocument.id,
                            data: { status: e.target.value }
                          });
                          setSelectedDocument({ ...selectedDocument, status: e.target.value });
                        }}
                        className="border rounded px-2 py-1"
                      >
                        <option value="draft">Rascunho</option>
                        <option value="review">Em Revisão</option>
                        <option value="approved">Aprovado</option>
                        <option value="sent">Enviado</option>
                      </select>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Criado em</p>
                      <p className="font-medium">{format(new Date(selectedDocument.created_date), "dd/MM/yyyy HH:mm")}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Atualizado em</p>
                      <p className="font-medium">{format(new Date(selectedDocument.updated_date), "dd/MM/yyyy HH:mm")}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {selectedDocument.file_url && (
                      <a href={selectedDocument.file_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline">
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </a>
                    )}
                    <Button variant="outline" onClick={() => setShowVersionDialog(true)}>
                      <Upload className="w-4 h-4 mr-2" />
                      Nova Versão
                    </Button>
                    <Button
                      variant="outline"
                      className="text-red-500"
                      onClick={() => {
                        if (confirm("Excluir documento?")) {
                          deleteDocumentMutation.mutate(selectedDocument.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="versions" className="space-y-3">
                  {versions.map(version => (
                    <div key={version.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Versão {version.version_number}</p>
                        <p className="text-sm text-gray-500">
                          {version.edited_by_name || version.edited_by} • {format(new Date(version.created_date), "dd/MM/yyyy HH:mm")}
                        </p>
                      </div>
                      <a href={version.file_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                      </a>
                    </div>
                  ))}
                  {versions.length === 0 && (
                    <p className="text-center py-8 text-gray-500">Nenhuma versão anterior</p>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>

        {/* New Version Dialog */}
        <Dialog open={showVersionDialog} onOpenChange={setShowVersionDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Versão</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div
                onClick={() => document.getElementById('version-file-input')?.click()}
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-gray-400"
              >
                <input
                  id="version-file-input"
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleNewVersion(file);
                  }}
                  accept=".pdf,.doc,.docx,.txt"
                />
                <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">Clique para selecionar a nova versão</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}