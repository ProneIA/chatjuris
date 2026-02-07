import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

export default function EventForm({ event, cases, clients, onSubmit, onDelete, onClose, isLoading }) {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState(() => {
    if (event) {
      return {
        ...event,
        start_time: event.start_time ? new Date(event.start_time).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
        end_time: event.end_time ? new Date(event.end_time).toISOString().slice(0, 16) : new Date(Date.now() + 3600000).toISOString().slice(0, 16)
      };
    }
    return {
      title: "",
      description: "",
      event_type: "meeting",
      start_time: new Date().toISOString().slice(0, 16),
      end_time: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
      case_id: "",
      client_id: "",
      team_id: "",
      location: "",
      priority: "medium",
      reminder_minutes: 30,
      status: "scheduled",
      calendar_provider: "local"
    };
  });

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

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Limpar campos vazios antes de enviar
    const cleanData = { ...formData };
    
    // Garantir que as datas estejam no formato ISO completo
    if (cleanData.start_time && !cleanData.start_time.includes('Z')) {
      cleanData.start_time = new Date(cleanData.start_time).toISOString();
    }
    if (cleanData.end_time && !cleanData.end_time.includes('Z')) {
      cleanData.end_time = new Date(cleanData.end_time).toISOString();
    }
    
    if (!cleanData.case_id || cleanData.case_id === "") delete cleanData.case_id;
    if (!cleanData.client_id || cleanData.client_id === "") delete cleanData.client_id;
    if (!cleanData.team_id || cleanData.team_id === "") delete cleanData.team_id;
    if (!cleanData.location || cleanData.location === "") delete cleanData.location;
    if (!cleanData.description || cleanData.description === "") delete cleanData.description;
    
    onSubmit(cleanData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader className="border-b border-slate-100">
          <div className="flex items-center justify-between">
            <CardTitle>{event ? 'Editar Evento' : 'Novo Evento'}</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event_type">Tipo de Evento *</Label>
                <Select value={formData.event_type} onValueChange={(v) => handleChange('event_type', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meeting">Reunião</SelectItem>
                    <SelectItem value="deadline">Prazo</SelectItem>
                    <SelectItem value="research">Pesquisa</SelectItem>
                    <SelectItem value="hearing">Audiência</SelectItem>
                    <SelectItem value="consultation">Consulta</SelectItem>
                    <SelectItem value="team_sync">Sincronização</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Prioridade</Label>
                <Select value={formData.priority} onValueChange={(v) => handleChange('priority', v)}>
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

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_time">Início *</Label>
                <Input
                  id="start_time"
                  type="datetime-local"
                  value={formData.start_time}
                  onChange={(e) => handleChange('start_time', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_time">Término *</Label>
                <Input
                  id="end_time"
                  type="datetime-local"
                  value={formData.end_time}
                  onChange={(e) => handleChange('end_time', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="case_id">Processo Relacionado</Label>
                <Select value={formData.case_id} onValueChange={(v) => handleChange('case_id', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um processo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Nenhum</SelectItem>
                    {cases.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="client_id">Cliente Relacionado</Label>
                <Select value={formData.client_id} onValueChange={(v) => handleChange('client_id', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Nenhum</SelectItem>
                    {clients.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {teams.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="team_id">Compartilhar com Equipe</Label>
                <Select value={formData.team_id} onValueChange={(v) => handleChange('team_id', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma equipe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Nenhuma (privado)</SelectItem>
                    {teams.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="location">Local</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                placeholder="Ex: Sala 302, Google Meet, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reminder_minutes">Lembrete (minutos antes)</Label>
              <Select value={String(formData.reminder_minutes)} onValueChange={(v) => handleChange('reminder_minutes', parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Sem lembrete</SelectItem>
                  <SelectItem value="15">15 minutos</SelectItem>
                  <SelectItem value="30">30 minutos</SelectItem>
                  <SelectItem value="60">1 hora</SelectItem>
                  <SelectItem value="1440">1 dia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-between gap-3 pt-4">
              {event && onDelete && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onDelete}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </Button>
              )}
              <div className="flex gap-3 ml-auto">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading} className="bg-gradient-to-r from-blue-600 to-purple-600">
                  <Save className="w-4 h-4 mr-2" />
                  {event ? 'Atualizar' : 'Criar'} Evento
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}