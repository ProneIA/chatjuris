import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Mail, Phone, Video, MessageSquare, Calendar, Plus, Clock, FileText, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const communicationIcons = {
  email: Mail,
  phone: Phone,
  meeting: Calendar,
  whatsapp: MessageSquare,
  video_call: Video,
  other: FileText
};

const communicationLabels = {
  email: "E-mail",
  phone: "Ligação",
  meeting: "Reunião",
  whatsapp: "WhatsApp",
  video_call: "Videochamada",
  other: "Outro"
};

export default function ClientCommunicationHistory({ clientId, clientName, theme = 'light' }) {
  const isDark = theme === 'dark';
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    type: "email",
    subject: "",
    notes: "",
    communication_date: new Date().toISOString().slice(0, 16),
    duration_minutes: ""
  });

  const { data: communications = [] } = useQuery({
    queryKey: ['client-communications', clientId],
    queryFn: () => base44.entities.ClientCommunication.filter({ client_id: clientId }, '-communication_date'),
    enabled: !!clientId
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ClientCommunication.create({
      ...data,
      client_id: clientId,
      client_name: clientName
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-communications'] });
      toast.success("Comunicação registrada!");
      setShowForm(false);
      setFormData({
        type: "email",
        subject: "",
        notes: "",
        communication_date: new Date().toISOString().slice(0, 16),
        duration_minutes: ""
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ClientCommunication.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-communications'] });
      toast.success("Comunicação excluída!");
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
          Histórico de Comunicações
        </h3>
        <Button onClick={() => setShowForm(true)} size="sm" className="bg-blue-600">
          <Plus className="w-4 h-4 mr-2" />
          Nova
        </Button>
      </div>

      {communications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">Nenhuma comunicação registrada</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {communications.map((comm) => {
            const Icon = communicationIcons[comm.type];
            return (
              <Card key={comm.id} className={isDark ? 'bg-neutral-800 border-neutral-700' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-3 flex-1">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isDark ? 'bg-neutral-700' : 'bg-blue-50'
                      }`}>
                        <Icon className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="text-xs">
                            {communicationLabels[comm.type]}
                          </Badge>
                          <span className={`text-xs ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                            {format(new Date(comm.communication_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                        <h4 className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {comm.subject}
                        </h4>
                        {comm.notes && (
                          <p className={`text-sm ${isDark ? 'text-neutral-300' : 'text-slate-600'}`}>
                            {comm.notes}
                          </p>
                        )}
                        {comm.duration_minutes && (
                          <div className={`flex items-center gap-1 mt-2 text-xs ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                            <Clock className="w-3 h-3" />
                            <span>{comm.duration_minutes} minutos</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate(comm.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
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
            <DialogTitle>Registrar Comunicação</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo *</label>
              <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">E-mail</SelectItem>
                  <SelectItem value="phone">Ligação</SelectItem>
                  <SelectItem value="meeting">Reunião</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="video_call">Videochamada</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Assunto *</label>
              <Input
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Data e Hora *</label>
              <Input
                type="datetime-local"
                value={formData.communication_date}
                onChange={(e) => setFormData({ ...formData, communication_date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Duração (minutos)</label>
              <Input
                type="number"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                placeholder="Ex: 30"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Notas</label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
                placeholder="Descrição detalhada da comunicação..."
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                Registrar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}