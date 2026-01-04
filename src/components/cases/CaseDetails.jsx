import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Edit, Calendar, Scale, User, DollarSign, Building, AlertCircle, Share2, FileText, Plus, Trash2, Eye, CheckSquare, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import CommentSection from "@/components/collaboration/CommentSection";
import ShareDialog from "@/components/collaboration/ShareDialog";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function CaseDetails({ caseData, onClose, onEdit, isPage = false }) {
  const [user, setUser] = useState(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showDocForm, setShowDocForm] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [docForm, setDocForm] = useState({ title: "", content: "" });
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    due_date: "",
    priority: "medium",
    assigned_to: "",
    type: "other"
  });
  const queryClient = useQueryClient();

  React.useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: caseDocuments = [] } = useQuery({
    queryKey: ['case-documents', caseData.id],
    queryFn: async () => {
      const docs = await base44.entities.LegalDocument.filter({ 
        case_id: caseData.id 
      }, '-created_date');
      return docs;
    }
  });

  const { data: caseTasks = [] } = useQuery({
    queryKey: ['case-tasks', caseData.id],
    queryFn: async () => {
      const tasks = await base44.entities.Task.filter({ 
        case_id: caseData.id 
      }, '-created_date');
      return tasks;
    }
  });

  const { data: appUsers = [] } = useQuery({
    queryKey: ['app-users'],
    queryFn: async () => {
      try {
        const users = await base44.entities.User.list('full_name');
        return users;
      } catch {
        return [];
      }
    }
  });

  const createDocMutation = useMutation({
    mutationFn: async (data) => {
      if (!user?.email) throw new Error("Usuário não identificado.");
      if (!data.title.trim()) throw new Error("Título é obrigatório.");

      const doc = await base44.entities.LegalDocument.create({
        title: data.title.trim(),
        content: data.content || "",
        type: "outros",
        status: "draft",
        case_id: caseData.id,
        client_id: caseData.client_id,
        created_by: user.email
      });

      if (!doc || !doc.id) throw new Error("Erro ao salvar documento.");
      return doc;
    },
    onSuccess: async (doc) => {
      await queryClient.invalidateQueries({ queryKey: ['case-documents'] });
      console.log("✅ Documento do processo criado:", doc.id);
      toast.success(`✅ Documento salvo no processo!`);
      setShowDocForm(false);
      setDocForm({ title: "", content: "" });
    },
    onError: (e) => toast.error(`Erro: ${e.message}`)
  });

  const deleteDocMutation = useMutation({
    mutationFn: (id) => base44.entities.LegalDocument.delete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['case-documents'] });
      toast.success("Documento excluído");
      setSelectedDoc(null);
    },
    onError: (e) => toast.error(`Erro: ${e.message}`)
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data) => {
      if (!data.title.trim() || !data.due_date) {
        throw new Error("Título e data de vencimento são obrigatórios");
      }

      const assignedUser = appUsers.find(u => u.email === data.assigned_to);

      return await base44.entities.Task.create({
        title: data.title.trim(),
        description: data.description || "",
        case_id: caseData.id,
        client_id: caseData.client_id,
        due_date: data.due_date,
        priority: data.priority,
        assigned_to: data.assigned_to || user?.email,
        assigned_to_name: assignedUser?.full_name || user?.full_name || "",
        type: data.type,
        status: "pending"
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['case-tasks'] });
      toast.success("Tarefa criada com sucesso!");
      setShowTaskForm(false);
      setTaskForm({
        title: "",
        description: "",
        due_date: "",
        priority: "medium",
        assigned_to: "",
        type: "other"
      });
    },
    onError: (e) => toast.error(`Erro: ${e.message}`)
  });

  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }) => {
      return await base44.entities.Task.update(taskId, { status });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['case-tasks'] });
      toast.success("Status atualizado!");
    },
    onError: (e) => toast.error(`Erro: ${e.message}`)
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id) => base44.entities.Task.delete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['case-tasks'] });
      toast.success("Tarefa excluída");
    },
    onError: (e) => toast.error(`Erro: ${e.message}`)
  });

  function renderContent() {
    return (
      <>
        <div>
          <h3 className="text-xl font-bold text-slate-900 mb-3">{caseData.title}</h3>
          <div className="flex flex-wrap gap-2">
            <Badge variant="default">
              {caseData.status === 'new' && 'Novo'}
              {caseData.status === 'in_progress' && 'Em Andamento'}
              {caseData.status === 'waiting' && 'Aguardando'}
              {caseData.status === 'closed' && 'Fechado'}
            </Badge>
            <Badge variant="outline">
              {caseData.priority === 'urgent' && '🔴 Urgente'}
              {caseData.priority === 'high' && '🟠 Alta'}
              {caseData.priority === 'medium' && '🟡 Média'}
              {caseData.priority === 'low' && '🟢 Baixa'}
            </Badge>
          </div>
        </div>

        {caseData.description && (
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
              Descrição
            </p>
            <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3 whitespace-pre-wrap">
              {caseData.description}
            </p>
          </div>
        )}

        <div className="space-y-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Informações do Processo
          </p>

          {caseData.case_number && (
            <div className="flex items-start gap-3">
              <Scale className="w-5 h-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm text-slate-500">Número do Processo</p>
                <p className="font-medium text-slate-900">{caseData.case_number}</p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3">
            <User className="w-5 h-5 text-slate-400 mt-0.5" />
            <div>
              <p className="text-sm text-slate-500">Cliente</p>
              <p className="font-medium text-slate-900">{caseData.client_name}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Scale className="w-5 h-5 text-slate-400 mt-0.5" />
            <div>
              <p className="text-sm text-slate-500">Área do Direito</p>
              <p className="font-medium text-slate-900 capitalize">{caseData.area}</p>
            </div>
          </div>

          {caseData.court && (
            <div className="flex items-start gap-3">
              <Building className="w-5 h-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm text-slate-500">Vara/Tribunal</p>
                <p className="font-medium text-slate-900">{caseData.court}</p>
              </div>
            </div>
          )}

          {caseData.opposing_party && (
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm text-slate-500">Parte Contrária</p>
                <p className="font-medium text-slate-900">{caseData.opposing_party}</p>
              </div>
            </div>
          )}

          {caseData.value && (
            <div className="flex items-start gap-3">
              <DollarSign className="w-5 h-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm text-slate-500">Valor da Causa</p>
                <p className="font-medium text-slate-900">
                  R$ {caseData.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          )}

          {caseData.start_date && (
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm text-slate-500">Data de Início</p>
                <p className="font-medium text-slate-900">
                  {format(new Date(caseData.start_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>
          )}

          {caseData.deadline && (
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-red-400 mt-0.5" />
              <div>
                <p className="text-sm text-slate-500">Prazo Importante</p>
                <p className="font-medium text-red-700">
                  {format(new Date(caseData.deadline), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>
          )}
        </div>

        {caseData.shared_with?.length > 0 && (
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
              Compartilhado com
            </p>
            <div className="flex flex-wrap gap-2">
              {caseData.shared_with.map((email) => (
                <Badge key={email} variant="secondary" className="text-xs">
                  {email}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Tarefas ({caseTasks.length})
            </p>
            <Button size="sm" variant="outline" onClick={() => setShowTaskForm(true)}>
              <Plus className="w-3 h-3 mr-1" /> Nova
            </Button>
          </div>
          
          {caseTasks.length === 0 ? (
            <p className="text-sm text-slate-400 italic">Nenhuma tarefa vinculada</p>
          ) : (
            <div className="space-y-2">
              {caseTasks.map(task => (
                <div key={task.id} className={`bg-slate-50 rounded p-3 border-l-4 ${
                  task.status === 'completed' ? 'border-green-500' : 
                  task.status === 'in_progress' ? 'border-blue-500' : 
                  'border-gray-300'
                }`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${task.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-xs text-slate-600 mt-1">{task.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Clock className="w-3 h-3" />
                      {format(new Date(task.due_date), "dd/MM/yyyy")}
                      {task.assigned_to_name && (
                        <>
                          <span>•</span>
                          <User className="w-3 h-3" />
                          {task.assigned_to_name}
                        </>
                      )}
                      <span>•</span>
                      <Badge variant="outline" className="text-xs">
                        {task.priority === 'urgent' ? '🔴' : task.priority === 'high' ? '🟠' : task.priority === 'medium' ? '🟡' : '🟢'}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <Select 
                        value={task.status} 
                        onValueChange={(value) => updateTaskStatusMutation.mutate({ taskId: task.id, status: value })}
                      >
                        <SelectTrigger className="h-7 text-xs w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pendente</SelectItem>
                          <SelectItem value="in_progress">Em Andamento</SelectItem>
                          <SelectItem value="completed">Concluída</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-red-500 h-7 px-2" 
                        onClick={() => {
                          if(confirm("Excluir esta tarefa?")) deleteTaskMutation.mutate(task.id);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Documentos ({caseDocuments.length})
            </p>
            <Button size="sm" variant="outline" onClick={() => setShowDocForm(true)}>
              <Plus className="w-3 h-3 mr-1" /> Novo
            </Button>
          </div>
          
          {caseDocuments.length === 0 ? (
            <p className="text-sm text-slate-400 italic">Nenhum documento vinculado</p>
          ) : (
            <div className="space-y-2">
              {caseDocuments.map(doc => (
                <div key={doc.id} className="bg-slate-50 rounded p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 truncate">{doc.title}</p>
                      <p className="text-xs text-slate-500">{format(new Date(doc.created_date), "dd/MM/yyyy")}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setSelectedDoc(doc)}>
                      <Eye className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-500" 
                      onClick={() => {
                        if(confirm("Excluir este documento?")) deleteDocMutation.mutate(doc.id);
                      }}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <CommentSection entityType="case" entityId={caseData.id} />

        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
            Sistema
          </p>
          <div className="text-sm text-slate-600 space-y-1">
            <p>
              Criado em: {format(new Date(caseData.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
            {caseData.created_by && <p>Por: {caseData.created_by}</p>}
          </div>
        </div>
      </>
    );
  }

  function renderDialogs() {
    return (
      <>
        {user && (
          <ShareDialog
            open={showShareDialog}
            onClose={() => setShowShareDialog(false)}
            entity={caseData}
            entityType="case"
            user={user}
          />
        )}

        <Dialog open={showDocForm} onOpenChange={setShowDocForm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Documento do Processo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium">Título</label>
                <Input 
                  value={docForm.title}
                  onChange={e => setDocForm({...docForm, title: e.target.value})}
                  placeholder="Ex: Petição Inicial"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Conteúdo</label>
                <Textarea 
                  value={docForm.content}
                  onChange={e => setDocForm({...docForm, content: e.target.value})}
                  rows={6}
                  placeholder="Conteúdo do documento..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowDocForm(false)}>Cancelar</Button>
              <Button onClick={() => createDocMutation.mutate(docForm)} disabled={createDocMutation.isPending}>
                {createDocMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!selectedDoc} onOpenChange={() => setSelectedDoc(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedDoc?.title}</DialogTitle>
            </DialogHeader>
            <div className="p-4 bg-gray-50 rounded border whitespace-pre-wrap">
              {selectedDoc?.content || "Sem conteúdo"}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showTaskForm} onOpenChange={setShowTaskForm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Tarefa do Processo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium">Título *</label>
                <Input 
                  value={taskForm.title}
                  onChange={e => setTaskForm({...taskForm, title: e.target.value})}
                  placeholder="Ex: Preparar contestação"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Descrição</label>
                <Textarea 
                  value={taskForm.description}
                  onChange={e => setTaskForm({...taskForm, description: e.target.value})}
                  rows={3}
                  placeholder="Detalhes da tarefa..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Data de Vencimento *</label>
                  <Input 
                    type="date"
                    value={taskForm.due_date}
                    onChange={e => setTaskForm({...taskForm, due_date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Prioridade</label>
                  <Select value={taskForm.priority} onValueChange={(v) => setTaskForm({...taskForm, priority: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Tipo</label>
                  <Select value={taskForm.type} onValueChange={(v) => setTaskForm({...taskForm, type: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hearing">Audiência</SelectItem>
                      <SelectItem value="deadline">Prazo</SelectItem>
                      <SelectItem value="meeting">Reunião</SelectItem>
                      <SelectItem value="document">Documento</SelectItem>
                      <SelectItem value="research">Pesquisa</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Atribuir a</label>
                  <Select value={taskForm.assigned_to} onValueChange={(v) => setTaskForm({...taskForm, assigned_to: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Você" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>Você</SelectItem>
                      {appUsers.map(u => (
                        <SelectItem key={u.id} value={u.email}>
                          {u.full_name || u.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowTaskForm(false)}>Cancelar</Button>
              <Button onClick={() => createTaskMutation.mutate(taskForm)} disabled={createTaskMutation.isPending}>
                {createTaskMutation.isPending ? "Criando..." : "Criar Tarefa"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  if (isPage) {
    return (
      <div className="w-full bg-white min-h-screen">
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 z-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900">Detalhes do Processo</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => onEdit(caseData)} className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600">
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
            <Button onClick={() => setShowShareDialog(true)} variant="outline">
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6 max-w-4xl mx-auto">
           {renderContent()}
        </div>
        {renderDialogs()}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      className="w-96 bg-white border-l border-slate-200 overflow-y-auto h-screen sticky top-0"
    >
      <div className="sticky top-0 bg-white border-b border-slate-200 p-6 z-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">Detalhes do Processo</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => onEdit(caseData)} className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600">
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
          <Button onClick={() => setShowShareDialog(true)} variant="outline">
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {renderContent()}
      </div>
      {renderDialogs()}
    </motion.div>
  );
}