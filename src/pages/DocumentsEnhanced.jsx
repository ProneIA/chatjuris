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
  ChevronRight
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
  const [search, setSearch] = useState("");
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
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: documents = [] } = useQuery({
    queryKey: ['legal-documents'],
    queryFn: () => base44.entities.LegalDocument.list('-created_date'),
  });

  const { data: tags = [] } = useQuery({
    queryKey: ['document-tags'],
    queryFn: () => base44.entities.DocumentTag.list(),
  });

  const { data: versions = [] } = useQuery({
    queryKey: ['document-versions', selectedDoc?.id],
    queryFn: () => base44.entities.DocumentVersion.filter({ document_id: selectedDoc.id }, '-version_number'),
    enabled: !!selectedDoc,
  });

  const { data: cases = [] } = useQuery({
    queryKey: ['cases'],
    queryFn: () => base44.entities.Case.list(),
  });

  const handleSelectDoc = (doc) => {
    setSelectedDoc(doc);
    setShowDetails(true);
  };

  const uploadDocMutation = useMutation({
    mutationFn: async (data) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: data.file });
      const doc = await base44.entities.LegalDocument.create({
        ...data,
        file_url,
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
      toast.success("Documento enviado!");
    },
  });

  const uploadNewVersionMutation = useMutation({
    mutationFn: async ({ documentId, file, description }) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const currentVersions = await base44.entities.DocumentVersion.filter({ document_id: documentId });
      const newVersionNumber = currentVersions.length + 1;
      
      await base44.entities.DocumentVersion.create({
        document_id: documentId,
        version_number: newVersionNumber,
        file_url,
        changes_description: description,
        author_name: user?.full_name,
        author_email: user?.email
      });
      
      await base44.entities.LegalDocument.update(documentId, { file_url });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legal-documents'] });
      queryClient.invalidateQueries({ queryKey: ['document-versions'] });
      setShowVersionDialog(false);
      toast.success("Nova versão adicionada!");
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
    const matchesSearch = doc.title?.toLowerCase().includes(search.toLowerCase()) ||
      doc.content?.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === "all" || doc.type === filterType;
    return matchesSearch && matchesType;
  });

  const docTypes = ["peticao", "recurso", "contestacao", "contrato", "procuracao", "parecer", "memorando", "outros"];

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
            { label: "Aprovados", value: documents.filter(d => d.status === 'approved').length, icon: Check },
            { label: "Tags", value: tags.length, icon: Tag },
          ].map((stat, i) => (
            <div key={i} className={`p-4 rounded-xl border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-neutral-800' : 'bg-gray-100'}`}>
                  <stat.icon className={`w-5 h-5 ${isDark ? 'text-white' : 'text-gray-700'}`} />
                </div>
                <div>
                  <p className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{stat.value}</p>
                  <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters & Search */}
        <div className={`p-4 rounded-xl border mb-6 ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}`}>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar documentos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className={`px-3 py-2 rounded-lg border ${isDark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-white border-gray-200'}`}
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
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("list")}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Document Grid/List */}
          <div className="lg:col-span-2">
            {viewMode === "grid" ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {filteredDocs.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDoc(doc)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedDoc?.id === doc.id
                        ? 'ring-2 ring-blue-500'
                        : ''
                    } ${isDark ? 'bg-neutral-900 border-neutral-800 hover:border-neutral-700' : 'bg-white border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-neutral-800' : 'bg-gray-100'}`}>
                        <FileText className={`w-5 h-5 ${isDark ? 'text-white' : 'text-gray-700'}`} />
                      </div>
                      <Badge variant={doc.status === 'approved' ? 'default' : 'secondary'} className="text-xs">
                        {doc.status === 'draft' && 'Rascunho'}
                        {doc.status === 'review' && 'Revisão'}
                        {doc.status === 'approved' && 'Aprovado'}
                        {doc.status === 'sent' && 'Enviado'}
                        {doc.status === 'archived' && 'Arquivado'}
                      </Badge>
                    </div>
                    <h3 className={`font-medium mb-1 line-clamp-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {doc.title}
                    </h3>
                    <p className={`text-sm mb-3 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                      {doc.type?.charAt(0).toUpperCase() + doc.type?.slice(1)}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-400'}`}>
                        {new Date(doc.created_date).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`rounded-xl border divide-y ${isDark ? 'bg-neutral-900 border-neutral-800 divide-neutral-800' : 'bg-white border-gray-200 divide-gray-200'}`}>
                {filteredDocs.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDoc(doc)}
                    className={`p-4 cursor-pointer transition-colors ${
                      selectedDoc?.id === doc.id
                        ? isDark ? 'bg-neutral-800' : 'bg-gray-100'
                        : isDark ? 'hover:bg-neutral-800/50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <FileText className={`w-5 h-5 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`} />
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{doc.title}</h3>
                        <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>{doc.type}</p>
                      </div>
                      <Badge variant={doc.status === 'approved' ? 'default' : 'secondary'}>{doc.status}</Badge>
                      <span className={`text-sm ${isDark ? 'text-neutral-500' : 'text-gray-400'}`}>
                        {new Date(doc.created_date).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Document Details */}
          <div className={`rounded-xl border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}`}>
            {selectedDoc ? (
              <div className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedDoc.title}</h2>
                    <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>{selectedDoc.type}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {selectedDoc.file_url && (
                        <DropdownMenuItem onClick={() => window.open(selectedDoc.file_url, '_blank')}>
                          <Download className="w-4 h-4 mr-2" /> Download
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => setShowVersionDialog(true)}>
                        <Upload className="w-4 h-4 mr-2" /> Nova Versão
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => deleteDocMutation.mutate(selectedDoc.id)} className="text-red-500">
                        <Trash2 className="w-4 h-4 mr-2" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <Tabs defaultValue="details">
                  <TabsList className="w-full">
                    <TabsTrigger value="details" className="flex-1">Detalhes</TabsTrigger>
                    <TabsTrigger value="versions" className="flex-1">Versões</TabsTrigger>
                  </TabsList>

                  <TabsContent value="details" className="mt-4 space-y-4">
                    <div>
                      <label className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>Status</label>
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedDoc.status}</p>
                    </div>
                    <div>
                      <label className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>Criado em</label>
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {new Date(selectedDoc.created_date).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    {selectedDoc.notes && (
                      <div>
                        <label className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>Observações</label>
                        <p className={`text-sm ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>{selectedDoc.notes}</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="versions" className="mt-4">
                    <div className="space-y-3">
                      {versions.map((ver) => (
                        <div key={ver.id} className={`p-3 rounded-lg ${isDark ? 'bg-neutral-800' : 'bg-gray-100'}`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              Versão {ver.version_number}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(ver.file_url, '_blank')}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                          <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                            {ver.changes_description}
                          </p>
                          <p className={`text-xs mt-1 ${isDark ? 'text-neutral-500' : 'text-gray-400'}`}>
                            {ver.author_name} • {new Date(ver.created_date).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      ))}
                      {versions.length === 0 && (
                        <p className={`text-center py-4 text-sm ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                          Nenhuma versão encontrada
                        </p>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <div className="h-96 flex items-center justify-center">
                <div className="text-center">
                  <FileText className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-neutral-700' : 'text-gray-300'}`} />
                  <p className={`${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>Selecione um documento</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload de Documento</DialogTitle>
          </DialogHeader>
          <UploadDocumentForm
            cases={cases}
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

function UploadDocumentForm({ cases, docTypes, onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState({ title: "", type: "outros", case_id: "", notes: "" });
  const [file, setFile] = useState(null);

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">Arquivo</label>
        <Input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          accept=".pdf,.doc,.docx,.txt"
          className="mt-1"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Título</label>
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
        <label className="text-sm font-medium">Caso relacionado (opcional)</label>
        <select
          value={formData.case_id}
          onChange={(e) => setFormData({ ...formData, case_id: e.target.value })}
          className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
        >
          <option value="">Nenhum</option>
          {cases.map(c => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-sm font-medium">Observações</label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Observações sobre o documento"
        />
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button onClick={() => onSubmit({ ...formData, file })} disabled={!file || !formData.title || isLoading}>
          {isLoading ? "Enviando..." : "Upload"}
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