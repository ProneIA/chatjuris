import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Bell, Plus, Clock, Trash2, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const priorityColors = {
  low: "bg-blue-100 text-blue-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700"
};

const priorityLabels = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  urgent: "Urgente"
};

export default function ClientReminders({ clientId, clientName, theme = 'light' }) {
  const isDark = theme === 'dark';
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    reminder_date: new Date().toISOString().slice(0, 16),
    priority: "medium",
    reminder_type: "follow_up"
  });

  const { data: reminders = [] } = useQuery({
    queryKey: ['client-reminders', clientId],
    queryFn: () => base44.entities.ClientReminder.filter({ client_id: clientId, status: 'pending' }, 'reminder_date'),
    enabled: !!clientId
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ClientReminder.create({
      ...data,
      client_id: clientId,
      client_name: clientName,
      status: 'pending'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-reminders'] });
      toast.success("Lembrete criado!");
      setShowForm(false);
      setFormData({
        title: "",
        description: "",
        reminder_date: new Date().toISOString().slice(0, 16),
        priority: "medium",
        reminder_type: "follow_up"
      });
    }
  });

  const completeMutation = useMutation({
    mutationFn: (id) => base44.entities.ClientReminder.update(id, { status: 'completed' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-reminders'] });
      toast.success("Lembrete concluído!");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ClientReminder.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-reminders'] });
      toast.success("Lembrete excluído!");
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Lembretes
        </h3>
        <Button onClick={() => setShowForm(true)} size="sm" className="bg-purple-600">
          <Plus className="w-4 h-4 mr-2" />
          Novo
        </Button>
      </div>

      {reminders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">Nenhum lembrete pendente</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reminders.map((reminder) => {
            const isOverdue = new Date(reminder.reminder_date) < new Date();
            return (
              <Card key={reminder.id} className={`${isDark ? 'bg-neutral-800 border-neutral-700' : ''} ${isOverdue ? 'border-l-4 border-l-red-500' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={priorityColors[reminder.priority]}>
                          {priorityLabels[reminder.priority]}
                        </Badge>
                        {isOverdue && (
                          <Badge variant="destructive" className="text-xs">
                            Atrasado
                          </Badge>
                        )}
                      </div>
                      <h4 className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {reminder.title}
                      </h4>
                      {reminder.description && (
                        <p className={`text-sm mb-2 ${isDark ? 'text-neutral-300' : 'text-slate-600'}`}>
                          {reminder.description}
                        </p>
                      )}
                      <div className={`flex items-center gap-1 text-xs ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                        <Clock className="w-3 h-3" />
                        <span>
                          {format(new Date(reminder.reminder_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => completeMutation.mutate(reminder.id)}
                        className="text-green-600 hover:text-green-700"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate(reminder.id)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Lembrete</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Título *</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Data e Hora *</label>
              <Input
                type="datetime-local"
                value={formData.reminder_date}
                onChange={(e) => setFormData({ ...formData, reminder_date: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Prioridade</label>
                <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
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

              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo</label>
                <Select value={formData.reminder_type} onValueChange={(v) => setFormData({ ...formData, reminder_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="follow_up">Follow-up</SelectItem>
                    <SelectItem value="payment">Pagamento</SelectItem>
                    <SelectItem value="document">Documento</SelectItem>
                    <SelectItem value="meeting">Reunião</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Descrição</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                Criar Lembrete
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}