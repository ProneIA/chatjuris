import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { X, Plus } from "lucide-react";
import { format } from "date-fns";

export default function EventFormDialog({ event, cases, clients, onSubmit, onClose, isLoading, isDark }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_type: "meeting",
    start_time: "",
    end_time: "",
    location: "",
    priority: "medium",
    reminder_minutes: 30,
    is_all_day: false,
    actions: [],
    case_id: "",
    client_id: "",
  });

  const [newAction, setNewAction] = useState("");

  useEffect(() => {
    if (event) {
      setFormData({
        ...event,
        start_time: format(new Date(event.start_time), "yyyy-MM-dd'T'HH:mm"),
        end_time: format(new Date(event.end_time), "yyyy-MM-dd'T'HH:mm"),
        actions: event.actions || [],
      });
    }
  }, [event]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      start_time: new Date(formData.start_time).toISOString(),
      end_time: new Date(formData.end_time).toISOString(),
    });
  };

  const addAction = () => {
    if (newAction.trim()) {
      setFormData({
        ...formData,
        actions: [...formData.actions, {
          id: Date.now().toString(),
          title: newAction,
          completed: false
        }]
      });
      setNewAction("");
    }
  };

  const removeAction = (id) => {
    setFormData({
      ...formData,
      actions: formData.actions.filter(a => a.id !== id)
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className={`max-w-2xl max-h-[90vh] overflow-y-auto ${isDark ? 'bg-neutral-900 border-neutral-800 text-white' : ''}`}>
        <DialogHeader>
          <DialogTitle>{event ? 'Editar Evento' : 'Novo Evento'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Título *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Reunião com cliente"
              required
              className={isDark ? 'bg-neutral-800 border-neutral-700' : ''}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tipo de Evento *</Label>
              <Select value={formData.event_type} onValueChange={(value) => setFormData({ ...formData, event_type: value })}>
                <SelectTrigger className={isDark ? 'bg-neutral-800 border-neutral-700' : ''}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meeting">Reunião</SelectItem>
                  <SelectItem value="deadline">Prazo</SelectItem>
                  <SelectItem value="research">Pesquisa</SelectItem>
                  <SelectItem value="hearing">Audiência</SelectItem>
                  <SelectItem value="consultation">Consulta</SelectItem>
                  <SelectItem value="team_sync">Sincronização</SelectItem>
                  <SelectItem value="personal">Pessoal</SelectItem>
                  <SelectItem value="task">Tarefa</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Prioridade</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                <SelectTrigger className={isDark ? 'bg-neutral-800 border-neutral-700' : ''}>
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
              <Label>Data/Hora Início *</Label>
              <Input
                type="datetime-local"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                required
                className={isDark ? 'bg-neutral-800 border-neutral-700' : ''}
              />
            </div>

            <div>
              <Label>Data/Hora Fim *</Label>
              <Input
                type="datetime-local"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                required
                className={isDark ? 'bg-neutral-800 border-neutral-700' : ''}
              />
            </div>
          </div>

          <div>
            <Label>Local</Label>
            <Input
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Ex: Escritório, Online, Fórum"
              className={isDark ? 'bg-neutral-800 border-neutral-700' : ''}
            />
          </div>

          <div>
            <Label>Descrição</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detalhes do evento..."
              rows={3}
              className={isDark ? 'bg-neutral-800 border-neutral-700' : ''}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {cases && cases.length > 0 && (
              <div>
                <Label>Processo (opcional)</Label>
                <Select value={formData.case_id} onValueChange={(value) => setFormData({ ...formData, case_id: value })}>
                  <SelectTrigger className={isDark ? 'bg-neutral-800 border-neutral-700' : ''}>
                    <SelectValue placeholder="Selecionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Nenhum</SelectItem>
                    {cases.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {clients && clients.length > 0 && (
              <div>
                <Label>Cliente (opcional)</Label>
                <Select value={formData.client_id} onValueChange={(value) => setFormData({ ...formData, client_id: value })}>
                  <SelectTrigger className={isDark ? 'bg-neutral-800 border-neutral-700' : ''}>
                    <SelectValue placeholder="Selecionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Nenhum</SelectItem>
                    {clients.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Label>Lembrete (minutos antes)</Label>
            <Input
              type="number"
              value={formData.reminder_minutes}
              onChange={(e) => setFormData({ ...formData, reminder_minutes: parseInt(e.target.value) })}
              className={`w-24 ${isDark ? 'bg-neutral-800 border-neutral-700' : ''}`}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Evento de dia inteiro</Label>
            <Switch
              checked={formData.is_all_day}
              onCheckedChange={(checked) => setFormData({ ...formData, is_all_day: checked })}
            />
          </div>

          {/* Actions/Checklist */}
          <div>
            <Label>Ações/Checklist</Label>
            <div className="flex gap-2 mt-2">
              <Input
                value={newAction}
                onChange={(e) => setNewAction(e.target.value)}
                placeholder="Adicionar ação..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addAction();
                  }
                }}
                className={isDark ? 'bg-neutral-800 border-neutral-700' : ''}
              />
              <Button type="button" onClick={addAction} size="icon">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {formData.actions.length > 0 && (
              <div className="mt-2 space-y-2">
                {formData.actions.map(action => (
                  <div key={action.id} className={`flex items-center justify-between p-2 rounded ${isDark ? 'bg-neutral-800' : 'bg-gray-50'}`}>
                    <span className="text-sm">{action.title}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeAction(action.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Salvando..." : event ? "Atualizar" : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}