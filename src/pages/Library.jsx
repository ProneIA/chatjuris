import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  FolderOpen,
  FileText,
  Search,
  Upload,
  Users,
  Tag,
  LinkIcon,
  Eye,
  Download,
  Copy,
  X,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function Library({ theme = 'light' }) {
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewBy, setViewBy] = useState("client"); // "all", "client", "type"
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedType, setSelectedType] = useState("all");
  const [selectedDocument, setSelectedDocument] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Fetch documents
  const { data: documents = [], isLoading: loadingDocs } = useQuery({
    queryKey: ['legal-documents', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.LegalDocument.filter({ created_by: user.email }, '-created_date');
    },
    enabled: !!user?.email
  });

  // Fetch clients
  const { data: clients = [] } = useQuery({
    queryKey: ['clients', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.Client.filter({ created_by: user.email }, 'name');
    },
    enabled: !!user?.email
  });

  // Fetch cases for reference
  const { data: cases = [] } = useQuery({
    queryKey: ['cases', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.Case.filter({ created_by: user.email });
    },
    enabled: !!user?.email
  });

  // Group documents by client
  const documentsByClient = documents.reduce((acc, doc) => {
    if (doc.client_ids && doc.client_ids.length > 0) {
      doc.client_ids.forEach(clientId => {
        if (!acc[clientId]) acc[clientId] = [];
        acc[clientId].push(doc);
      });
    } else {
      if (!acc['no_client']) acc['no_client'] = [];
      acc['no_client'].push(doc);
    }
    return acc;
  }, {});

  // Group documents by type
  const documentsByType = documents.reduce((acc, doc) => {
    const type = doc.type || 'outros';
    if (!acc[type]) acc[type] = [];
    acc[type].push(doc);
    return acc;
  }, {});

  // Filter documents
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.ocr_content?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedType === "all" || doc.type === selectedType;
    
    const matchesClient = !selectedClient || 
      (doc.client_ids && doc.client_ids.includes(selectedClient)) ||
      (!doc.client_ids && selectedClient === 'no_client');
    
    return matchesSearch && matchesType && matchesClient;
  });

  const docTypes = ["peticao", "recurso", "contestacao", "contrato", "procuracao", "parecer", "memorando", "outros"];

  return (
    <div className={`min-h-screen p-8 ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Biblioteca de Documentos
            </h1>
            <p className={`text-sm mt-1 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
              {documents.length} documentos • {clients.length} clientes
            </p>
          </div>
          <Button onClick={() => navigate(createPageUrl("DocumentsEnhanced"))}>
            <Upload className="w-4 h-4 mr-2" />
            Novo Documento
          </Button>
        </div>

        {/* View Mode Toggle */}
        <div className={`mb-6 p-4 rounded-xl border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}`}>
          <div className="flex gap-2 mb-4">
            <Button
              variant={viewBy === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => { setViewBy("all"); setSelectedClient(null); }}
            >
              <FileText className="w-4 h-4 mr-2" />
              Todos os Documentos
            </Button>
            <Button
              variant={viewBy === "client" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewBy("client")}
            >
              <Users className="w-4 h-4 mr-2" />
              Por Cliente
            </Button>
            <Button
              variant={viewBy === "type" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewBy("type")}
            >
              <Tag className="w-4 h-4 mr-2" />
              Por Tipo
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar documentos (título, conteúdo, OCR)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            {viewBy !== "type" && (
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className={`px-4 py-2 rounded-lg border ${isDark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-white border-gray-200'}`}
              >
                <option value="all">Todos os tipos</option>
                {docTypes.map(type => (
                  <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Main Content */}
        {loadingDocs ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : viewBy === "all" ? (
          <div className="space-y-4">
            {filteredDocuments.length === 0 ? (
              <div className={`text-center py-12 rounded-xl border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}`}>
                <FileText className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-neutral-700' : 'text-gray-300'}`} />
                <p className={isDark ? 'text-neutral-500' : 'text-gray-500'}>Nenhum documento encontrado</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDocuments.map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    document={doc}
                    clients={clients}
                    cases={cases}
                    onClick={() => setSelectedDocument(doc)}
                    theme={theme}
                  />
                ))}
              </div>
            )}
          </div>
        ) : viewBy === "client" ? (
          <div className="space-y-6">
            {clients.map(client => {
              const clientDocs = documentsByClient[client.id] || [];
              const filteredClientDocs = clientDocs.filter(doc => 
                doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                doc.ocr_content?.toLowerCase().includes(searchTerm.toLowerCase())
              );
              if (filteredClientDocs.length === 0) return null;
              
              return (
                <div key={client.id} className={`p-5 rounded-xl border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDark ? 'bg-neutral-800' : 'bg-blue-50'}`}>
                        <Users className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                      </div>
                      <div>
                        <h3 className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>{client.name}</h3>
                        <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                          {filteredClientDocs.length} documento(s)
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setSelectedClient(selectedClient === client.id ? null : client.id)}
                    >
                      {selectedClient === client.id ? 'Ver todos' : 'Filtrar'}
                    </Button>
                  </div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredClientDocs.slice(0, selectedClient === client.id ? 999 : 6).map(doc => (
                      <DocumentCard
                        key={doc.id}
                        document={doc}
                        clients={clients}
                        cases={cases}
                        compact
                       onClick={() => setSelectedDocument(doc)}
                       theme={theme}
                     />
                   ))}
                  </div>
                  {filteredClientDocs.length > 6 && selectedClient !== client.id && (
                    <Button 
                      variant="ghost" 
                      className="w-full mt-3"
                      onClick={() => setSelectedClient(client.id)}
                    >
                      Ver mais {filteredClientDocs.length - 6} documento(s)
                    </Button>
                  )}
                </div>
              );
            })}
            {documentsByClient['no_client'] && documentsByClient['no_client'].length > 0 && (
              <div className={`p-5 rounded-xl border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDark ? 'bg-neutral-800' : 'bg-gray-100'}`}>
                    <FileText className={`w-6 h-6 ${isDark ? 'text-white' : 'text-gray-700'}`} />
                  </div>
                  <div>
                    <h3 className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>Sem Cliente Vinculado</h3>
                    <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                      {documentsByClient['no_client'].length} documento(s)
                    </p>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {documentsByClient['no_client'].slice(0, 6).map(doc => (
                    <DocumentCard
                      key={doc.id}
                      document={doc}
                      clients={clients}
                      cases={cases}
                      compact
                      onClick={() => setSelectedDocument(doc)}
                      theme={theme}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(documentsByType).map(([type, docs]) => {
              const filteredTypeDocs = docs.filter(doc => 
                doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                doc.ocr_content?.toLowerCase().includes(searchTerm.toLowerCase())
              );
              if (filteredTypeDocs.length === 0) return null;
              
              return (
                <div key={type} className={`p-5 rounded-xl border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDark ? 'bg-neutral-800' : 'bg-purple-50'}`}>
                      <Tag className={`w-6 h-6 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                    </div>
                    <div>
                      <h3 className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </h3>
                      <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                        {filteredTypeDocs.length} documento(s)
                      </p>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredTypeDocs.map(doc => (
                      <DocumentCard
                        key={doc.id}
                        document={doc}
                        clients={clients}
                        cases={cases}
                        compact
                        onClick={() => setSelectedDocument(doc)}
                        theme={theme}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Document Viewer Dialog */}
        <Dialog open={!!selectedDocument} onOpenChange={() => setSelectedDocument(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>{selectedDocument?.title}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedDocument(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </DialogTitle>
            </DialogHeader>
            
            {selectedDocument && (
              <div className="space-y-4">
                {/* Document Info */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge>{selectedDocument.type || 'Documento'}</Badge>
                  {selectedDocument.status && (
                    <Badge variant="outline">{selectedDocument.status}</Badge>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {selectedDocument.file_url && (
                    <>
                      <Button
                        variant="default"
                        onClick={() => window.open(selectedDocument.file_url, '_blank')}
                        className="flex-1"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Abrir Arquivo
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = selectedDocument.file_url;
                          link.download = selectedDocument.title || 'documento';
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          toast.success('Download iniciado!');
                        }}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Baixar
                      </Button>
                    </>
                  )}
                  {selectedDocument.content && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedDocument.content);
                        toast.success('Conteúdo copiado!');
                      }}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar Texto
                    </Button>
                  )}
                </div>

                {/* Document Content */}
                {selectedDocument.content && (
                  <div className={`p-4 rounded-lg border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-gray-50 border-gray-200'}`}>
                    <h3 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Conteúdo do Documento
                    </h3>
                    <div className={`prose max-w-none ${isDark ? 'prose-invert' : ''}`}>
                      <pre className="whitespace-pre-wrap text-sm">{selectedDocument.content}</pre>
                    </div>
                  </div>
                )}

                {/* OCR Content */}
                {selectedDocument.ocr_content && (
                  <div className={`p-4 rounded-lg border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-gray-50 border-gray-200'}`}>
                    <h3 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Texto Extraído (OCR)
                    </h3>
                    <div className={`prose max-w-none ${isDark ? 'prose-invert' : ''}`}>
                      <pre className="whitespace-pre-wrap text-sm">{selectedDocument.ocr_content}</pre>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedDocument.notes && (
                  <div className={`p-4 rounded-lg border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-gray-50 border-gray-200'}`}>
                    <h3 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Observações
                    </h3>
                    <p className={`text-sm ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                      {selectedDocument.notes}
                    </p>
                  </div>
                )}

                {/* Metadata */}
                <div className={`p-4 rounded-lg border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-gray-50 border-gray-200'}`}>
                  <h3 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Informações
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className={isDark ? 'text-neutral-500' : 'text-gray-500'}>Criado em:</span>
                      <p className={isDark ? 'text-white' : 'text-gray-900'}>
                        {new Date(selectedDocument.created_date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    {selectedDocument.current_version && (
                      <div>
                        <span className={isDark ? 'text-neutral-500' : 'text-gray-500'}>Versão:</span>
                        <p className={isDark ? 'text-white' : 'text-gray-900'}>
                          {selectedDocument.current_version}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function DocumentCard({ document, clients, cases, onClick, theme, compact = false }) {
  const isDark = theme === 'dark';
  
  const linkedClients = document.client_ids?.map(id => clients.find(c => c.id === id)).filter(Boolean) || [];
  const linkedCases = document.case_ids?.map(id => cases.find(c => c.id === id)).filter(Boolean) || [];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className={`p-${compact ? '3' : '4'} rounded-xl border transition-all cursor-pointer ${
        isDark 
          ? 'bg-neutral-900 border-neutral-800 hover:border-neutral-700' 
          : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-${compact ? '8' : '10'} h-${compact ? '8' : '10'} rounded-lg flex items-center justify-center shrink-0 ${
          isDark ? 'bg-neutral-800' : 'bg-blue-50'
        }`}>
          <FileText className={`w-${compact ? '4' : '5'} h-${compact ? '4' : '5'} ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`font-medium text-${compact ? 'xs' : 'sm'} mb-1 line-clamp-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {document.title}
          </h3>
          <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
            {document.type || 'Documento'}
          </p>
          {!compact && (
            <div className="flex flex-wrap gap-1 mt-2">
              {linkedClients.slice(0, 2).map(client => (
                <Badge key={client.id} variant="outline" className="text-xs">
                  <LinkIcon className="w-3 h-3 mr-1" />
                  {client.name}
                </Badge>
              ))}
              {linkedCases.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {linkedCases.length} processo(s)
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
      {document.ocr_content && !compact && (
        <div className={`mt-3 pt-3 border-t ${isDark ? 'border-neutral-800' : 'border-gray-200'}`}>
          <p className={`text-xs line-clamp-2 ${isDark ? 'text-neutral-600' : 'text-gray-400'}`}>
            {document.ocr_content.substring(0, 100)}...
          </p>
        </div>
      )}
    </motion.div>
  );
}