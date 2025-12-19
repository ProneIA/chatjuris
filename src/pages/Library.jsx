import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Briefcase, FileText, Search, Filter, FolderOpen, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";

export default function Library({ theme = 'light' }) {
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [caseAreaFilter, setCaseAreaFilter] = useState("all");
  const [caseStatusFilter, setCaseStatusFilter] = useState("all");
  const [docTypeFilter, setDocTypeFilter] = useState("all");

  const { data: cases = [], isLoading: loadingCases } = useQuery({
    queryKey: ['library-cases'],
    queryFn: () => base44.entities.Case.list('-created_date')
  });

  const { data: documents = [], isLoading: loadingDocs } = useQuery({
    queryKey: ['library-documents'],
    queryFn: () => base44.entities.LegalDocument.list('-created_date')
  });

  const filteredCases = cases.filter(c => {
    const matchesSearch = c.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         c.case_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         c.client_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesArea = caseAreaFilter === 'all' || c.area === caseAreaFilter;
    const matchesStatus = caseStatusFilter === 'all' || c.status === caseStatusFilter;
    return matchesSearch && matchesArea && matchesStatus;
  });

  const filteredDocuments = documents.filter(d => {
    const matchesSearch = d.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         d.content?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = docTypeFilter === 'all' || d.type === docTypeFilter;
    return matchesSearch && matchesType;
  });

  const statusColors = {
    new: "bg-blue-100 text-blue-700",
    in_progress: "bg-yellow-100 text-yellow-700",
    waiting: "bg-orange-100 text-orange-700",
    closed: "bg-green-100 text-green-700",
    archived: "bg-gray-100 text-gray-700"
  };

  const statusLabels = {
    new: "Novo",
    in_progress: "Em Andamento",
    waiting: "Aguardando",
    closed: "Encerrado",
    archived: "Arquivado"
  };

  const areaLabels = {
    civil: "Cível",
    criminal: "Criminal",
    trabalhista: "Trabalhista",
    tributario: "Tributário",
    familia: "Família",
    empresarial: "Empresarial",
    consumidor: "Consumidor",
    previdenciario: "Previdenciário",
    outros: "Outros"
  };

  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Biblioteca
          </h1>
          <p className={`${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
            Acesso rápido a todos os processos e documentos
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-neutral-500' : 'text-slate-400'}`} />
            <Input
              placeholder="Buscar por título, número do processo, cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-10 ${isDark ? 'bg-neutral-900 border-neutral-800' : ''}`}
            />
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="cases" className="space-y-6">
          <TabsList className={`${isDark ? 'bg-neutral-900' : 'bg-white'}`}>
            <TabsTrigger value="cases" className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Processos ({filteredCases.length})
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Documentos ({filteredDocuments.length})
            </TabsTrigger>
          </TabsList>

          {/* Cases Tab */}
          <TabsContent value="cases">
            <div className="mb-4 flex gap-3">
              <Select value={caseAreaFilter} onValueChange={setCaseAreaFilter}>
                <SelectTrigger className={`w-48 ${isDark ? 'bg-neutral-900 border-neutral-800' : ''}`}>
                  <SelectValue placeholder="Todas as áreas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as áreas</SelectItem>
                  <SelectItem value="civil">Cível</SelectItem>
                  <SelectItem value="criminal">Criminal</SelectItem>
                  <SelectItem value="trabalhista">Trabalhista</SelectItem>
                  <SelectItem value="tributario">Tributário</SelectItem>
                  <SelectItem value="familia">Família</SelectItem>
                  <SelectItem value="empresarial">Empresarial</SelectItem>
                  <SelectItem value="consumidor">Consumidor</SelectItem>
                  <SelectItem value="previdenciario">Previdenciário</SelectItem>
                </SelectContent>
              </Select>

              <Select value={caseStatusFilter} onValueChange={setCaseStatusFilter}>
                <SelectTrigger className={`w-48 ${isDark ? 'bg-neutral-900 border-neutral-800' : ''}`}>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="new">Novo</SelectItem>
                  <SelectItem value="in_progress">Em Andamento</SelectItem>
                  <SelectItem value="waiting">Aguardando</SelectItem>
                  <SelectItem value="closed">Encerrado</SelectItem>
                  <SelectItem value="archived">Arquivado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loadingCases ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
              </div>
            ) : filteredCases.length === 0 ? (
              <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : ''}>
                <CardContent className="py-12 text-center">
                  <FolderOpen className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-neutral-700' : 'text-slate-300'}`} />
                  <p className={isDark ? 'text-neutral-400' : 'text-slate-500'}>
                    Nenhum processo encontrado
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCases.map((c) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -4 }}
                  >
                    <Card
                      className={`cursor-pointer transition-all hover:shadow-lg ${
                        isDark ? 'bg-neutral-900 border-neutral-800 hover:border-neutral-700' : 'hover:border-blue-300'
                      }`}
                      onClick={() => navigate(createPageUrl("CaseDetails") + "?id=" + c.id)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            isDark ? 'bg-neutral-800' : 'bg-blue-50'
                          }`}>
                            <Briefcase className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                          </div>
                          <Badge className={statusColors[c.status]}>
                            {statusLabels[c.status]}
                          </Badge>
                        </div>

                        <h3 className={`font-semibold text-lg mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {c.title}
                        </h3>

                        {c.client_name && (
                          <p className={`text-sm mb-2 ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
                            Cliente: {c.client_name}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge variant="outline" className="text-xs">
                            {areaLabels[c.area] || c.area}
                          </Badge>
                          {c.case_number && (
                            <Badge variant="outline" className="text-xs">
                              {c.case_number}
                            </Badge>
                          )}
                        </div>

                        <div className={`flex items-center gap-1 text-xs ${isDark ? 'text-neutral-500' : 'text-slate-500'}`}>
                          <Calendar className="w-3 h-3" />
                          <span>
                            {format(new Date(c.created_date), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <div className="mb-4">
              <Select value={docTypeFilter} onValueChange={setDocTypeFilter}>
                <SelectTrigger className={`w-48 ${isDark ? 'bg-neutral-900 border-neutral-800' : ''}`}>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="peticao">Petição</SelectItem>
                  <SelectItem value="recurso">Recurso</SelectItem>
                  <SelectItem value="contestacao">Contestação</SelectItem>
                  <SelectItem value="contrato">Contrato</SelectItem>
                  <SelectItem value="procuracao">Procuração</SelectItem>
                  <SelectItem value="parecer">Parecer</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loadingDocs ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto" />
              </div>
            ) : filteredDocuments.length === 0 ? (
              <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : ''}>
                <CardContent className="py-12 text-center">
                  <FileText className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-neutral-700' : 'text-slate-300'}`} />
                  <p className={isDark ? 'text-neutral-400' : 'text-slate-500'}>
                    Nenhum documento encontrado
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredDocuments.map((doc) => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -4 }}
                  >
                    <Card
                      className={`cursor-pointer transition-all hover:shadow-lg ${
                        isDark ? 'bg-neutral-900 border-neutral-800 hover:border-neutral-700' : 'hover:border-purple-300'
                      }`}
                      onClick={() => navigate(createPageUrl("DocumentsEnhanced") + "?doc=" + doc.id)}
                    >
                      <CardContent className="p-6">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
                          isDark ? 'bg-neutral-800' : 'bg-purple-50'
                        }`}>
                          <FileText className={`w-6 h-6 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                        </div>

                        <h3 className={`font-semibold mb-2 line-clamp-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {doc.title}
                        </h3>

                        {doc.type && (
                          <Badge variant="outline" className="text-xs mb-2">
                            {doc.type}
                          </Badge>
                        )}

                        <div className={`flex items-center gap-1 text-xs ${isDark ? 'text-neutral-500' : 'text-slate-500'}`}>
                          <Calendar className="w-3 h-3" />
                          <span>
                            {format(new Date(doc.created_date), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}