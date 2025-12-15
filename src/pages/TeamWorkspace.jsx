import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Users, Upload, File, CheckSquare, Calendar, 
  Download, Trash2, UserPlus, Clock, Mail, FolderOpen, Plus 
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import moment from "moment";

export default function TeamWorkspace() {
  const [user, setUser] = useState(null);
  const [searchParams] = useSearchParams();
  const teamId = searchParams.get('team');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileDescription, setFileDescription] = useState("");
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    assigned_to: "",
    due_date: "",
    priority: "medium",
    type: "other"
  });
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    start_time: new Date().toISOString().slice(0, 16),
    end_time: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
    event_type: "team_sync",
    location: ""
  });
  const queryClient = useQueryClient();

  React.useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: teams = [] } = useQuery({
    queryKey: ['teams', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const allTeams = await base44.entities.Team.list();
      return allTeams.filter(t => 
        t.owner_email === user.email || t.members?.includes(user.email)
      );
    },
    enabled: !!user?.email
  });

  const selectedTeam = teams.find(t => t.id === teamId) || teams[0];

  const { data: teamFiles = [] } = useQuery({
    queryKey: ['teamFiles', selectedTeam?.id, user?.email],
    queryFn: async () => {
      if (!selectedTeam?.id || !user?.email) return [];
      return base44.entities.TeamFile.filter(
        { team_id: selectedTeam.id },
        '-created_date'
      );
    },
    enabled: !!selectedTeam?.id && !!user?.email
  });

  const { data: teamTasks = [] } = useQuery({
    queryKey: ['teamTasks', selectedTeam?.id, user?.email],
    queryFn: async () => {
      if (!selectedTeam?.id || !user?.email) return [];
      return base44.entities.Task.filter(
        { team_id: selectedTeam.id },
        '-created_date'
      );
    },
    enabled: !!selectedTeam?.id && !!user?.email
  });

  const { data: teamEvents = [] } = useQuery({
    queryKey: ['teamEvents', selectedTeam?.id, user?.email],
    queryFn: async () => {
      if (!selectedTeam?.id || !user?.email) return [];
      return base44.entities.CalendarEvent.filter(
        { team_id: selectedTeam.id },
        'start_time'
      );
    },
    enabled: !!selectedTeam?.id && !!user?.email
  });

  const uploadFileMutation = useMutation({
    mutationFn: async (file) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      return base44.entities.TeamFile.create({
        team_id: selectedTeam.id,
        name: file.name,
        description: fileDescription,
        file_url,
        file_type: file.type,
        file_size: file.size,
        uploaded_by: user.email,
        uploaded_by_name: user.full_name
      });
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['teamFiles'] });
      
      // Notificar membros da equipe
      for (const memberEmail of selectedTeam.members.filter(m => m !== user.email)) {
        await base44.entities.Notification.create({
          type: "document_shared",
          title: "Novo arquivo na equipe",
          message: `${user.full_name} adicionou um arquivo: ${selectedFile?.name}`,
          recipient_email: memberEmail,
          entity_type: "team",
          entity_id: selectedTeam.id,
          actor_email: user.email,
          actor_name: user.full_name
        });
      }
      
      toast.success("Arquivo enviado com sucesso!");
      setSelectedFile(null);
      setFileDescription("");
    }
  });

  const deleteFileMutation = useMutation({
    mutationFn: (id) => base44.entities.TeamFile.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamFiles'] });
      toast.success("Arquivo removido!");
    }
  });

  const createTaskMutation = useMutation({
    mutationFn: async (taskData) => {
      return base44.entities.Task.create({
        ...taskData,
        team_id: selectedTeam.id
      });
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['teamTasks'] });
      
      // Notificar membro atribuído
      if (newTask.assigned_to && newTask.assigned_to !== user.email) {
        await base44.entities.Notification.create({
          type: "task_assigned",
          title: "Nova tarefa atribuída",
          message: `${user.full_name} atribuiu uma tarefa para você: ${newTask.title}`,
          recipient_email: newTask.assigned_to,
          entity_type: "task",
          entity_id: selectedTeam.id,
          actor_email: user.email,
          actor_name: user.full_name
        });
      }
      
      toast.success("Tarefa criada!");
      setShowTaskForm(false);
      setNewTask({
        title: "",
        description: "",
        assigned_to: "",
        due_date: "",
        priority: "medium",
        type: "other"
      });
    }
  });

  const createEventMutation = useMutation({
    mutationFn: async (eventData) => {
      return base44.entities.CalendarEvent.create({
        ...eventData,
        team_id: selectedTeam.id,
        attendees: selectedTeam.members
      });
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['teamEvents'] });
      
      // Notificar membros da equipe
      for (const memberEmail of selectedTeam.members.filter(m => m !== user.email)) {
        await base44.entities.Notification.create({
          type: "case_shared",
          title: "Novo evento na agenda da equipe",
          message: `${user.full_name} agendou: ${newEvent.title}`,
          recipient_email: memberEmail,
          entity_type: "event",
          entity_id: selectedTeam.id,
          actor_email: user.email,
          actor_name: user.full_name
        });
      }
      
      toast.success("Evento criado!");
      setShowEventForm(false);
      setNewEvent({
        title: "",
        description: "",
        start_time: new Date().toISOString().slice(0, 16),
        end_time: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
        event_type: "team_sync",
        location: ""
      });
    }
  });

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) setSelectedFile(file);
  };

  const handleUpload = () => {
    if (!selectedFile) return;
    uploadFileMutation.mutate(selectedFile);
  };

  if (!selectedTeam) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <Card>
          <CardContent className="text-center py-12">
            <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600 mb-2">Nenhuma equipe encontrada</p>
            <p className="text-sm text-slate-500">Crie uma equipe primeiro</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{selectedTeam.name}</h1>
              <p className="text-slate-600 mt-1">{selectedTeam.description || "Espaço de trabalho da equipe"}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                <Users className="w-3 h-3 mr-1" />
                {selectedTeam.members?.length} membros
              </Badge>
            </div>
          </div>
        </div>

        <Tabs defaultValue="files" className="space-y-6">
          <TabsList>
            <TabsTrigger value="files">
              <File className="w-4 h-4 mr-2" />
              Arquivos ({teamFiles.length})
            </TabsTrigger>
            <TabsTrigger value="tasks">
              <CheckSquare className="w-4 h-4 mr-2" />
              Tarefas ({teamTasks.length})
            </TabsTrigger>
            <TabsTrigger value="calendar">
              <Calendar className="w-4 h-4 mr-2" />
              Agenda ({teamEvents.length})
            </TabsTrigger>
            <TabsTrigger value="members">
              <Users className="w-4 h-4 mr-2" />
              Membros
            </TabsTrigger>
          </TabsList>

          {/* ARQUIVOS */}
          <TabsContent value="files">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Upload de Arquivo</CardTitle>
                <CardDescription>Compartilhe arquivos com sua equipe</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Input
                    type="file"
                    onChange={handleFileSelect}
                    accept="*/*"
                  />
                  {selectedFile && (
                    <p className="text-sm text-slate-600 mt-2">
                      Arquivo: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                    </p>
                  )}
                </div>
                <Input
                  placeholder="Descrição (opcional)"
                  value={fileDescription}
                  onChange={(e) => setFileDescription(e.target.value)}
                />
                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || uploadFileMutation.isPending}
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Enviar Arquivo
                </Button>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teamFiles.map((file) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <File className="w-6 h-6 text-blue-600" />
                        </div>
                        {file.uploaded_by === user?.email && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteFileMutation.mutate(file.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <h3 className="font-semibold text-slate-900 mb-2 truncate">{file.name}</h3>
                      {file.description && (
                        <p className="text-sm text-slate-600 mb-3">{file.description}</p>
                      )}
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                        <span>{(file.file_size / 1024).toFixed(2)} KB</span>
                        <span>{moment(file.created_date).fromNow()}</span>
                      </div>
                      <p className="text-xs text-slate-500 mb-3">
                        Por: {file.uploaded_by_name}
                      </p>
                      <Button asChild size="sm" variant="outline" className="w-full">
                        <a href={file.file_url} target="_blank" rel="noopener noreferrer">
                          <Download className="w-4 h-4 mr-2" />
                          Baixar
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {teamFiles.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <FolderOpen className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600">Nenhum arquivo compartilhado ainda</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* TAREFAS */}
          <TabsContent value="tasks">
            {!showTaskForm ? (
              <Card className="mb-6">
                <CardContent className="pt-6">
                  <Button onClick={() => setShowTaskForm(true)} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Tarefa da Equipe
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Nova Tarefa</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    placeholder="Título da tarefa"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  />
                  <Input
                    placeholder="Descrição"
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  />
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Atribuir a:</label>
                      <select
                        value={newTask.assigned_to}
                        onChange={(e) => setNewTask({ ...newTask, assigned_to: e.target.value })}
                        className="w-full p-2 border border-slate-300 rounded-md"
                      >
                        <option value="">Selecione um membro</option>
                        {selectedTeam.members?.map(email => (
                          <option key={email} value={email}>{email}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Data de vencimento:</label>
                      <Input
                        type="date"
                        value={newTask.due_date}
                        onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Prioridade:</label>
                      <select
                        value={newTask.priority}
                        onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                        className="w-full p-2 border border-slate-300 rounded-md"
                      >
                        <option value="low">Baixa</option>
                        <option value="medium">Média</option>
                        <option value="high">Alta</option>
                        <option value="urgent">Urgente</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Tipo:</label>
                      <select
                        value={newTask.type}
                        onChange={(e) => setNewTask({ ...newTask, type: e.target.value })}
                        className="w-full p-2 border border-slate-300 rounded-md"
                      >
                        <option value="hearing">Audiência</option>
                        <option value="deadline">Prazo</option>
                        <option value="meeting">Reunião</option>
                        <option value="document">Documento</option>
                        <option value="research">Pesquisa</option>
                        <option value="other">Outro</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => createTaskMutation.mutate(newTask)}
                      disabled={!newTask.title || !newTask.due_date || createTaskMutation.isPending}
                      className="flex-1"
                    >
                      Criar Tarefa
                    </Button>
                    <Button variant="outline" onClick={() => setShowTaskForm(false)}>
                      Cancelar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-4">
              {teamTasks.map((task) => (
                <Card key={task.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 mb-2">{task.title}</h3>
                        {task.description && (
                          <p className="text-sm text-slate-600 mb-3">{task.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={task.status === 'completed' ? 'default' : 'secondary'}>
                            {task.status}
                          </Badge>
                          <Badge variant="outline">{task.priority}</Badge>
                          {task.assigned_to && (
                            <Badge variant="secondary" className="text-xs">
                              <Mail className="w-3 h-3 mr-1" />
                              {task.assigned_to}
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            {moment(task.due_date).format('DD/MM/YYYY')}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {teamTasks.length === 0 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <CheckSquare className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600">Nenhuma tarefa da equipe</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* AGENDA */}
          <TabsContent value="calendar">
            {!showEventForm ? (
              <Card className="mb-6">
                <CardContent className="pt-6">
                  <Button onClick={() => setShowEventForm(true)} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Evento da Equipe
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Novo Evento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    placeholder="Título do evento"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  />
                  <Input
                    placeholder="Descrição"
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  />
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Início:</label>
                      <Input
                        type="datetime-local"
                        value={newEvent.start_time}
                        onChange={(e) => setNewEvent({ ...newEvent, start_time: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Término:</label>
                      <Input
                        type="datetime-local"
                        value={newEvent.end_time}
                        onChange={(e) => setNewEvent({ ...newEvent, end_time: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Tipo:</label>
                      <select
                        value={newEvent.event_type}
                        onChange={(e) => setNewEvent({ ...newEvent, event_type: e.target.value })}
                        className="w-full p-2 border border-slate-300 rounded-md"
                      >
                        <option value="meeting">Reunião</option>
                        <option value="deadline">Prazo</option>
                        <option value="research">Pesquisa</option>
                        <option value="hearing">Audiência</option>
                        <option value="consultation">Consulta</option>
                        <option value="team_sync">Sincronização da Equipe</option>
                        <option value="other">Outro</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Local:</label>
                      <Input
                        placeholder="Ex: Sala 302, Google Meet"
                        value={newEvent.location}
                        onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => createEventMutation.mutate(newEvent)}
                      disabled={!newEvent.title || createEventMutation.isPending}
                      className="flex-1"
                    >
                      Criar Evento
                    </Button>
                    <Button variant="outline" onClick={() => setShowEventForm(false)}>
                      Cancelar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-4">
              {teamEvents.map((event) => (
                <Card key={event.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 mb-1">{event.title}</h3>
                        {event.description && (
                          <p className="text-sm text-slate-600 mb-2">{event.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                          <span>
                            {moment(event.start_time).format('DD/MM/YYYY HH:mm')}
                          </span>
                          <span>→</span>
                          <span>
                            {moment(event.end_time).format('HH:mm')}
                          </span>
                          {event.location && (
                            <Badge variant="outline" className="text-xs">
                              📍 {event.location}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {teamEvents.length === 0 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600">Nenhum evento agendado</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* MEMBROS */}
          <TabsContent value="members">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedTeam.members?.map((memberEmail) => (
                <Card key={memberEmail}>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold">
                          {memberEmail[0].toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 truncate">{memberEmail}</p>
                        {memberEmail === selectedTeam.owner_email && (
                          <Badge variant="secondary" className="text-xs mt-1">Proprietário</Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}