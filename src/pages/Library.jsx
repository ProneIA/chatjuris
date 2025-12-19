import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Search, Briefcase, FileText, FolderOpen, 
  Calendar, User, Filter, Grid3x3, List 
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import moment from "moment";

export default function Library({ theme = 'light' }) {
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [filterArea, setFilterArea] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: cases = [], isLoading: casesLoading } = useQuery({
    queryKey: ['library-cases', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.Case.filter({ created_by: user.email }, '-created_date');
    },
    enabled: !!user?.email
  });

  const { data: documents = [], isLoading: docsLoading } = useQuery({
    queryKey: ['library-documents', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.LegalDocument.filter({ created_by: user.email }, '-created_date');
    },
    enabled: !!user?.email
  });

  const filteredCases = cases.filter(c => {
    const matchSearch = c.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       c.case_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchArea = filterArea === 'all' || c.area === filterArea;
    const matchStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchSearch && matchArea && matchStatus;
  });

  const filteredDocs = documents.filter(d => 
    d.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.content?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusColors = {
    new: "bg-blue-500",
    in_progress: "bg-yellow-500",
    waiting: "bg-orange-500",
    closed: "bg-green-500",
    archived: "bg-gray-500"
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

  const CaseCard = ({ caseItem }) => (
    <motion.div
      whileHover={{ y: -4 }}
      onClick={() => navigate(createPageUrl("CaseDetails") + "?id=" + caseItem.id)}
    >
      <Card className={`cursor-pointer transition-all h-full ${isDark ? 'bg-neutral-800 border-neutral-700 hover:border-neutral-600' : 'hover:shadow-lg hover:border-blue-300'}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between mb-2">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-blue-500/20' : 'bg-blue-50'}`}>
              <Briefcase className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            <div className={`w-3 h-3 rounded-full ${statusColors[caseItem.status]}`} />
          </div>
          <CardTitle className={`text-lg line-clamp-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {caseItem.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {caseItem.case_number && (
            <p className={`text-sm font-mono ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
              {caseItem.case_number}
            </p>
          )}
          {caseItem.description && (
            <p className={`text-sm line-clamp-2 ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
              {caseItem.description}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{areaLabels[caseItem.area]}</Badge>
            <Badge className={statusColors[caseItem.status] + " text-white"}>
              {statusLabels[caseItem.status]}
            </Badge>
          </div>
          <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-neutral-500' : 'text-slate-500'}`}>
            <Calendar className="w-3 h-3" />
            <span>{moment(caseItem.created_date).format('DD/MM/YYYY')}</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const DocumentCard = ({ doc }) => (
    <motion.div whileHover={{ y: -4 }}>
      <Card className={`cursor-pointer transition-all h-full ${isDark ? 'bg-neutral-800 border-neutral-700 hover:border-neutral-600' : 'hover:shadow-lg hover:border-purple-300'}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between mb-2">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-purple-500/20' : 'bg-purple-50'}`}>
              <FileText className={`w-6 h-6 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
            </div>
          </div>
          <CardTitle className={`text-lg line-clamp-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {doc.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {doc.content && (
            <p className={`text-sm line-clamp-3 ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
              {doc.content}
            </p>
          )}
          {doc.type && (
            <Badge variant="outline">{doc.type}</Badge>
          )}
          <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-neutral-500' : 'text-slate-500'}`}>
            <Calendar className="w-3 h-3" />
            <span>{moment(doc.created_date).format('DD/MM/YYYY')}</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-neutral-950' : 'bg-slate-50'}`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            📚 Biblioteca
          </h1>
          <p className={`${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
            Acesso rápido a todos os seus processos e documentos
          </p>
        </div>

        {/* Search and Filters */}
        <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : ''}>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  placeholder="Buscar por título, número do processo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3x3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : ''}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-blue-500/20' : 'bg-blue-50'}`}>
                  <Briefcase className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {filteredCases.length}
                  </p>
                  <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>Processos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : ''}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-purple-500/20' : 'bg-purple-50'}`}>
                  <FileText className={`w-6 h-6 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {filteredDocs.length}
                  </p>
                  <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>Documentos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : ''}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-green-500/20' : 'bg-green-50'}`}>
                  <User className={`w-6 h-6 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {cases.filter(c => c.status === 'in_progress').length}
                  </p>
                  <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>Ativos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : ''}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-amber-500/20' : 'bg-amber-50'}`}>
                  <FolderOpen className={`w-6 h-6 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {cases.filter(c => c.status === 'closed').length}
                  </p>
                  <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>Encerrados</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="cases" className="space-y-6">
          <TabsList className={isDark ? 'bg-neutral-900' : ''}>
            <TabsTrigger value="cases">
              <Briefcase className="w-4 h-4 mr-2" />
              Processos ({filteredCases.length})
            </TabsTrigger>
            <TabsTrigger value="documents">
              <FileText className="w-4 h-4 mr-2" />
              Documentos ({filteredDocs.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cases" className="space-y-4">
            {filteredCases.length === 0 ? (
              <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : ''}>
                <CardContent className="py-16 text-center">
                  <Briefcase className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className={`${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
                    Nenhum processo encontrado
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
                {filteredCases.map(c => (
                  <CaseCard key={c.id} caseItem={c} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            {filteredDocs.length === 0 ? (
              <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : ''}>
                <CardContent className="py-16 text-center">
                  <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className={`${isDark ? 'text-neutral-400' : 'text-slate-600'}`}>
                    Nenhum documento encontrado
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
                {filteredDocs.map(d => (
                  <DocumentCard key={d.id} doc={d} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}