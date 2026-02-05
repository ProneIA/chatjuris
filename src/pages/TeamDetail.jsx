import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Users, Plus, Trash2, Loader2, FileText, MessageSquare, Upload, Download, CheckSquare, Calendar } from "lucide-react";
import { toast } from "sonner";
import moment from "moment";

export default function TeamDetail({ theme = 'light' }) {
  const isDark = theme === 'dark';
  const [searchParams] = useSearchParams();
  const teamId = searchParams.get('id');
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  // Estados para membros
  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false);
  const [memberForm, setMemberForm] = useState({ name: "", role: "" });

  // Estados para documentos
  const [isDocDialogOpen, setIsDocDialogOpen] = useState(false);
  const [docTitle, setDocTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [docAssignedTo, setDocAssignedTo] = useState("");

  // Estados para mensagens
  const [newMessage, setNewMessage] = useState("");
  const [messageMember, setMessageMember] = useState("");

  // Estados para tarefas
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    assigned_to_member: "",
    due_date: "",
    priority: "medium"
  });

  useEffect(() => {
    base44.auth.me()
      .then(u => {
        if (!u) throw new Error("Não autenticado");
        setUser(u);
      })
      .catch(() => {
        toast.error("Você precisa estar autenticado");
        navigate(createPageUrl("Teams"));
      });
  }, []);

  const { data: team, isLoading: teamLoading } = useQuery({
    queryKey: ['team', teamId],
    queryFn: async () => {
      if (!user?.email) return null;
      const teams = await base44.entities.Team.filter({ owner_email: user.email });
      return teams.find(t => t.id === teamId);
    },
    enabled: !!teamId && !!user
  });

  // VALIDAÇÃO DE SEGURANÇA NO FRONTEND
  useEffect(() => {
    if (team && user && team.owner_email !== user.email) {
      toast.error("Você não tem acesso a esta equipe");
      navigate(createPageUrl("Teams"));
    }
  }, [team, user]);

  const { data: allMembers = [] } = useQuery({
    queryKey: ['team-members', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.TeamMember.filter({ created_by: user.email }, '-created_date');
    },
    enabled: !!user
  });

  const { data: allDocs = [] } = useQuery({
    queryKey: ['team-docs', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.TeamDocument.filter({ created_by: user.email }, '-created_date');
    },
    enabled: !!user
  });

  const { data: allMessages = [] } = useQuery({
    queryKey: ['team-messages', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.TeamMessage.filter({ created_by: user.email }, '-created_date');
    },
    enabled: !!user
  });

  const { data: allTasks = [] } = useQuery({
    queryKey: ['team-tasks', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.TeamTask.filter({ created_by: user.email }, '-created_date');
    },
    enabled: !!user
  });

  // FILTROS LOCAIS
  const members = allMembers.filter(m => m.team_id === teamId);
  const docs = allDocs.filter(d => d.team_id === teamId);
  const messages = allMessages.filter(m => m.team_id === teamId);
  const tasks = allTasks.filter(t => t.team_id === teamId);

  // MUTATIONS
  const createMemberMutation = useMutation({
    mutationFn: async () => {
      return await base44.entities.TeamMember.create({
        team_id: teamId,
        name: memberForm.name,
        role: memberForm.role
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast.success("Membro adicionado!");
      setIsMemberDialogOpen(false);
      setMemberForm({ name: "", role: "" });
    }
  });

  const deleteMemberMutation = useMutation({
    mutationFn: (id) => base44.entities.TeamMember.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast.success("Membro removido!");
    }
  });

  const createDocMutation = useMutation({
    mutationFn: async () => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: selectedFile });
      return await base44.entities.TeamDocument.create({
        team_id: teamId,
        title: docTitle,
        file_url,
        uploaded_by: user.email,
        assigned_to_member: docAssignedTo
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-docs'] });
      toast.success("Documento enviado!");
      setIsDocDialogOpen(false);
      setDocTitle("");
      setSelectedFile(null);
      setDocAssignedTo("");
    }
  });

  const deleteDocMutation = useMutation({
    mutationFn: (id) => base44.entities.TeamDocument.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-docs'] });
      toast.success("Documento removido!");
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      return await base44.entities.TeamMessage.create({
        team_id: teamId,
        message: newMessage,
        sent_by: user.email,
        sent_by_member: messageMember
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-messages'] });
      setNewMessage("");
      setMessageMember("");
    }
  });

  const createTaskMutation = useMutation({
    mutationFn: async () => {
      // Criar tarefa da equipe
      const teamTask = await base44.entities.TeamTask.create({
        team_id: teamId,
        ...taskForm
      });

      // Criar tarefa no sistema principal
      await base44.entities.Task.create({
        title: taskForm.title,
        description: taskForm.description,
        due_date: taskForm.due_date,
        priority: taskForm.priority,
        status: "pending",
        team_id: teamId,
        assigned_to_name: taskForm.assigned_to_member
      });

      return teamTask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-tasks'] });
      toast.success("Tarefa criada!");
      setIsTaskDialogOpen(false);
      setTaskForm({
        title: "",
        description: "",
        assigned_to_member: "",
        due_date: "",
        priority: "medium"
      });
    }
  });

  const updateTaskStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.TeamTask.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-tasks'] });
      toast.success("Status atualizado!");
    }
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id) => base44.entities.TeamTask.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-tasks'] });
      toast.success("Tarefa removida!");
    }
  });

  if (!user || teamLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">Equipe não encontrada</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {team.name}
          </h1>
          <p className={`text-sm mt-1 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
            Gerenciar equipe
          </p>
        </div>

        <Tabs defaultValue="members" className="space-y-6">
          <TabsList>
            <TabsTrigger value="members">
              <Users className="w-4 h-4 mr-2" />
              Pessoas ({members.length})
            </TabsTrigger>
            <TabsTrigger value="tasks">
              <CheckSquare className="w-4 h-4 mr-2" />
              Tarefas ({tasks.length})
            </TabsTrigger>
            <TabsTrigger value="docs">
              <FileText className="w-4 h-4 mr-2" />
              Documentos ({docs.length})
            </TabsTrigger>
            <TabsTrigger value="messages">
              <MessageSquare className="w-4 h-4 mr-2" />
              Mensagens ({messages.length})
            </TabsTrigger>
          </TabsList>

          {/* ABA TAREFAS */}
          <TabsContent value="tasks">
            <Button onClick={() => setIsTaskDialogOpen(true)} className="mb-4">
              <Plus className="w-4 h-4 mr-2" /> Nova Tarefa
            </Button>

            <div className="space-y-3">
              {tasks.map(task => (
                <Card key={task.id} className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <input
                            type="checkbox"
                            checked={task.status === 'completed'}
                            onChange={(e) => 
                              updateTaskStatusMutation.mutate({
                                id: task.id,
                                status: e.target.checked ? 'completed' : 'pending'
                              })
                            }
                            className="w-4 h-4"
                          />
                          <h3 className={`font-semibold ${task.status === 'completed' ? 'line-through text-neutral-500' : isDark ? 'text-white' : 'text-gray-900'}`}>
                            {task.title}
                          </h3>
                        </div>
                        {task.description && (
                          <p className={`text-sm mb-2 ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-xs">
                          <span className={`px-2 py-1 rounded ${
                            task.priority === 'high' ? 'bg-red-100 text-red-700' :
                            task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
                          </span>
                          {task.assigned_to_member && (
                            <span className={isDark ? 'text-neutral-500' : 'text-gray-500'}>
                              👤 {task.assigned_to_member}
                            </span>
                          )}
                          <span className={isDark ? 'text-neutral-500' : 'text-gray-500'}>
                            📅 {new Date(task.due_date).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm("Remover tarefa?")) {
                            deleteTaskMutation.mutate(task.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {tasks.length === 0 && (
              <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}>
                <CardContent className="py-12 text-center">
                  <CheckSquare className={`w-12 h-12 mx-auto mb-2 ${isDark ? 'text-neutral-700' : 'text-gray-300'}`} />
                  <p className={isDark ? 'text-neutral-400' : 'text-gray-500'}>Nenhuma tarefa criada</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ABA PESSOAS */}
          <TabsContent value="members">
            <Button onClick={() => setIsMemberDialogOpen(true)} className="mb-4">
              <Plus className="w-4 h-4 mr-2" /> Adicionar Pessoa
            </Button>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {members.map(member => (
                <Card key={member.id} className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {member.name}
                        </h3>
                        <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                          {member.role}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm(`Remover ${member.name}?`)) {
                            deleteMemberMutation.mutate(member.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {members.length === 0 && (
              <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}>
                <CardContent className="py-12 text-center">
                  <Users className={`w-12 h-12 mx-auto mb-2 ${isDark ? 'text-neutral-700' : 'text-gray-300'}`} />
                  <p className={isDark ? 'text-neutral-400' : 'text-gray-500'}>Nenhuma pessoa adicionada</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ABA DOCUMENTOS */}
          <TabsContent value="docs">
            <Button onClick={() => setIsDocDialogOpen(true)} className="mb-4">
              <Upload className="w-4 h-4 mr-2" /> Enviar Documento
            </Button>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {docs.map(doc => (
                <Card key={doc.id} className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {doc.title}
                        </h3>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm("Remover documento?")) {
                              deleteDocMutation.mutate(doc.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                      <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-400'}`}>
                        {doc.assigned_to_member && `👤 ${doc.assigned_to_member} • `}
                        {moment(doc.created_date).fromNow()}
                      </p>
                      <Button asChild variant="outline" size="sm" className="w-full">
                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                          <Download className="w-4 h-4 mr-2" /> Baixar
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {docs.length === 0 && (
              <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}>
                <CardContent className="py-12 text-center">
                  <FileText className={`w-12 h-12 mx-auto mb-2 ${isDark ? 'text-neutral-700' : 'text-gray-300'}`} />
                  <p className={isDark ? 'text-neutral-400' : 'text-gray-500'}>Nenhum documento enviado</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ABA MENSAGENS */}
          <TabsContent value="messages">
            <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}>
              <CardContent className="pt-6 space-y-4">
                <div className="max-h-96 overflow-y-auto space-y-3">
                  {messages.map(msg => (
                    <div 
                      key={msg.id} 
                      className={`p-3 rounded-lg ${isDark ? 'bg-neutral-800' : 'bg-gray-50'}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {msg.sent_by}
                        </span>
                        <span className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-400'}`}>
                          {moment(msg.created_date).fromNow()}
                        </span>
                      </div>
                      <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-500'} mb-1`}>
                        {msg.sent_by_member || msg.sent_by}
                      </p>
                      <p className={`text-sm ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                        {msg.message}
                      </p>
                    </div>
                  ))}
                  {messages.length === 0 && (
                    <div className="text-center py-8">
                      <MessageSquare className={`w-12 h-12 mx-auto mb-2 ${isDark ? 'text-neutral-700' : 'text-gray-300'}`} />
                      <p className={isDark ? 'text-neutral-400' : 'text-gray-500'}>Nenhuma mensagem ainda</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <select
                    value={messageMember}
                    onChange={e => setMessageMember(e.target.value)}
                    className={`w-full p-2 border rounded ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-gray-300'}`}
                  >
                    <option value="">Selecione quem está enviando</option>
                    {members.map(m => (
                      <option key={m.id} value={`${m.name} (${m.role})`}>
                        {m.name} - {m.role}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <Textarea
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      placeholder="Digite sua mensagem..."
                      rows={2}
                      className="flex-1"
                    />
                    <Button 
                      onClick={() => sendMessageMutation.mutate()}
                      disabled={!newMessage.trim() || !messageMember || sendMessageMutation.isPending}
                    >
                      Enviar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog Adicionar Pessoa */}
        <Dialog open={isMemberDialogOpen} onOpenChange={setIsMemberDialogOpen}>
          <DialogContent className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}>
            <DialogHeader>
              <DialogTitle className={isDark ? 'text-white' : 'text-gray-900'}>
                Adicionar Pessoa
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Input
                placeholder="Nome"
                value={memberForm.name}
                onChange={e => setMemberForm({ ...memberForm, name: e.target.value })}
              />
              <Input
                placeholder="Cargo/Função"
                value={memberForm.role}
                onChange={e => setMemberForm({ ...memberForm, role: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsMemberDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={() => createMemberMutation.mutate()}
                disabled={!memberForm.name || !memberForm.role || createMemberMutation.isPending}
              >
                Adicionar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Nova Tarefa */}
        <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
          <DialogContent className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}>
            <DialogHeader>
              <DialogTitle className={isDark ? 'text-white' : 'text-gray-900'}>
                Nova Tarefa
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Input
                placeholder="Título da tarefa"
                value={taskForm.title}
                onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
              />
              <Textarea
                placeholder="Descrição"
                value={taskForm.description}
                onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
                rows={3}
              />
              <select
                value={taskForm.assigned_to_member}
                onChange={e => setTaskForm({ ...taskForm, assigned_to_member: e.target.value })}
                className={`w-full p-2 border rounded ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-gray-300'}`}
              >
                <option value="">Atribuir a um membro</option>
                {members.map(m => (
                  <option key={m.id} value={m.name}>
                    {m.name} - {m.role}
                  </option>
                ))}
              </select>
              <Input
                type="date"
                value={taskForm.due_date}
                onChange={e => setTaskForm({ ...taskForm, due_date: e.target.value })}
              />
              <select
                value={taskForm.priority}
                onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}
                className={`w-full p-2 border rounded ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-gray-300'}`}
              >
                <option value="low">Prioridade Baixa</option>
                <option value="medium">Prioridade Média</option>
                <option value="high">Prioridade Alta</option>
              </select>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsTaskDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={() => createTaskMutation.mutate()}
                disabled={!taskForm.title || !taskForm.due_date || createTaskMutation.isPending}
              >
                {createTaskMutation.isPending ? "Criando..." : "Criar Tarefa"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Enviar Documento */}
        <Dialog open={isDocDialogOpen} onOpenChange={setIsDocDialogOpen}>
          <DialogContent className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}>
            <DialogHeader>
              <DialogTitle className={isDark ? 'text-white' : 'text-gray-900'}>
                Enviar Documento
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Input
                placeholder="Título do documento"
                value={docTitle}
                onChange={e => setDocTitle(e.target.value)}
              />
              <select
                value={docAssignedTo}
                onChange={e => setDocAssignedTo(e.target.value)}
                className={`w-full p-2 border rounded ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-gray-300'}`}
              >
                <option value="">Atribuir a um membro (opcional)</option>
                {members.map(m => (
                  <option key={m.id} value={m.name}>
                    {m.name} - {m.role}
                  </option>
                ))}
              </select>
              <Input
                type="file"
                onChange={e => setSelectedFile(e.target.files[0])}
              />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsDocDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={() => createDocMutation.mutate()}
                disabled={!docTitle || !selectedFile || createDocMutation.isPending}
              >
                {createDocMutation.isPending ? "Enviando..." : "Enviar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}