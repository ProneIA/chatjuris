import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { 
  Database, 
  Table as TableIcon, 
  Download, 
  Trash2, 
  Edit, 
  Plus,
  RefreshCw,
  Search,
  Eye,
  BarChart3,
  AlertTriangle,
  Check,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { motion } from "framer-motion";

const ENTITIES = [
  "User",
  "Subscription",
  "CalendarEvent",
  "Team",
  "TeamMember",
  "TeamTask",
  "TeamDocument",
  "TeamMessage",
  "Conversation",
  "Template",
  "Task",
  "Case",
  "Client",
  "LegalDocument",
  "Folder",
  "Jurisprudence",
  "AuditLog"
];

export default function AdminDatabase({ theme = 'light' }) {
  const isDark = theme === 'dark';
  const [user, setUser] = useState(null);
  const [selectedEntity, setSelectedEntity] = useState("User");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewDialog, setViewDialog] = useState({ open: false, record: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, record: null });

  React.useEffect(() => {
    base44.auth.me().then(u => {
      if (u?.role !== 'admin') {
        window.location.href = '/Dashboard';
      }
      setUser(u);
    });
  }, []);

  const { data: records = [], isLoading, refetch } = useQuery({
    queryKey: ['entity-records', selectedEntity],
    queryFn: async () => {
      return await base44.asServiceRole.entities[selectedEntity].list('-created_date', 500);
    },
    enabled: !!user && user.role === 'admin'
  });

  const { data: stats } = useQuery({
    queryKey: ['database-stats'],
    queryFn: async () => {
      const counts = {};
      for (const entity of ENTITIES) {
        try {
          const data = await base44.asServiceRole.entities[entity].list('', 1);
          counts[entity] = data.length;
        } catch {
          counts[entity] = 0;
        }
      }
      return counts;
    },
    enabled: !!user && user.role === 'admin'
  });

  const handleDelete = async (record) => {
    try {
      await base44.asServiceRole.entities[selectedEntity].delete(record.id);
      toast.success(`Registro deletado com sucesso`);
      refetch();
      setDeleteDialog({ open: false, record: null });
    } catch (error) {
      toast.error('Erro ao deletar registro: ' + error.message);
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(records, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedEntity}_${new Date().toISOString()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Dados exportados com sucesso');
  };

  const filteredRecords = records.filter(record => {
    const searchLower = searchTerm.toLowerCase();
    return Object.values(record).some(val => 
      String(val).toLowerCase().includes(searchLower)
    );
  });

  if (!user || user.role !== 'admin') {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`}>
        <div className="text-center">
          <AlertTriangle className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
          <h1 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Acesso Negado
          </h1>
          <p className={isDark ? 'text-neutral-400' : 'text-gray-600'}>
            Apenas administradores podem acessar esta página
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Gerenciamento de Banco de Dados
              </h1>
              <p className={isDark ? 'text-neutral-400' : 'text-gray-600'}>
                Visualize e gerencie todas as entidades do sistema
              </p>
            </div>
          </div>
        </motion.div>

        <Tabs defaultValue="entities" className="space-y-6">
          <TabsList className={isDark ? 'bg-neutral-900' : 'bg-white'}>
            <TabsTrigger value="entities">
              <TableIcon className="w-4 h-4 mr-2" />
              Entidades
            </TabsTrigger>
            <TabsTrigger value="stats">
              <BarChart3 className="w-4 h-4 mr-2" />
              Estatísticas
            </TabsTrigger>
          </TabsList>

          {/* Tab: Entidades */}
          <TabsContent value="entities" className="space-y-4">
            {/* Entity Selector */}
            <Card className={`p-4 ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}`}>
              <div className="flex flex-wrap gap-2">
                {ENTITIES.map(entity => (
                  <Button
                    key={entity}
                    variant={selectedEntity === entity ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedEntity(entity)}
                  >
                    {entity}
                  </Button>
                ))}
              </div>
            </Card>

            {/* Actions Bar */}
            <Card className={`p-4 ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}`}>
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-neutral-500' : 'text-gray-400'}`} />
                  <Input
                    placeholder="Buscar registros..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" onClick={refetch}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Atualizar
                </Button>
                <Button variant="outline" onClick={handleExport} disabled={records.length === 0}>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar JSON
                </Button>
              </div>
              <div className="mt-3 flex items-center gap-4 text-sm">
                <span className={isDark ? 'text-neutral-400' : 'text-gray-600'}>
                  Total: <strong className={isDark ? 'text-white' : 'text-gray-900'}>{records.length}</strong>
                </span>
                <span className={isDark ? 'text-neutral-400' : 'text-gray-600'}>
                  Filtrados: <strong className={isDark ? 'text-white' : 'text-gray-900'}>{filteredRecords.length}</strong>
                </span>
              </div>
            </Card>

            {/* Data Table */}
            <Card className={`${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}`}>
              {isLoading ? (
                <div className="p-12 text-center">
                  <RefreshCw className={`w-8 h-8 mx-auto mb-4 animate-spin ${isDark ? 'text-neutral-600' : 'text-gray-400'}`} />
                  <p className={isDark ? 'text-neutral-400' : 'text-gray-600'}>Carregando dados...</p>
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="p-12 text-center">
                  <TableIcon className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-neutral-700' : 'text-gray-300'}`} />
                  <p className={isDark ? 'text-neutral-400' : 'text-gray-600'}>Nenhum registro encontrado</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className={isDark ? 'border-neutral-800' : ''}>
                        <TableHead className="w-[100px]">ID</TableHead>
                        <TableHead>Dados</TableHead>
                        <TableHead>Criado em</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRecords.map((record) => (
                        <TableRow key={record.id} className={isDark ? 'border-neutral-800' : ''}>
                          <TableCell className="font-mono text-xs">
                            {record.id?.substring(0, 8)}...
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1 max-w-md">
                              {Object.entries(record).slice(0, 3).map(([key, value]) => (
                                key !== 'id' && key !== 'created_date' && (
                                  <Badge key={key} variant="outline" className="text-xs">
                                    {key}: {String(value).substring(0, 20)}
                                  </Badge>
                                )
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {record.created_date ? new Date(record.created_date).toLocaleString('pt-BR') : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setViewDialog({ open: true, record })}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteDialog({ open: true, record })}
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Tab: Estatísticas */}
          <TabsContent value="stats" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {ENTITIES.map(entity => (
                <Card key={entity} className={`p-4 ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-medium ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                      {entity}
                    </span>
                    <TableIcon className="w-4 h-4 text-blue-500" />
                  </div>
                  <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {stats?.[entity] ?? 0}
                  </p>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* View Dialog */}
      <Dialog open={viewDialog.open} onOpenChange={(open) => setViewDialog({ open, record: null })}>
        <DialogContent className={`max-w-2xl max-h-[80vh] overflow-y-auto ${isDark ? 'bg-neutral-900 border-neutral-800' : ''}`}>
          <DialogHeader>
            <DialogTitle>Detalhes do Registro</DialogTitle>
          </DialogHeader>
          {viewDialog.record && (
            <pre className={`p-4 rounded-lg text-xs overflow-x-auto ${isDark ? 'bg-black text-neutral-300' : 'bg-gray-100 text-gray-800'}`}>
              {JSON.stringify(viewDialog.record, null, 2)}
            </pre>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, record: null })}>
        <DialogContent className={isDark ? 'bg-neutral-900 border-neutral-800' : ''}>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja deletar este registro? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, record: null })}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={() => handleDelete(deleteDialog.record)}>
              <Trash2 className="w-4 h-4 mr-2" />
              Deletar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}