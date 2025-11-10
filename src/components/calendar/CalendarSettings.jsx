import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { X, Calendar, Check, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

export default function CalendarSettings({ connections, onClose }) {
  const [email, setEmail] = useState("");
  const [provider, setProvider] = useState("google");
  const queryClient = useQueryClient();

  const createConnectionMutation = useMutation({
    mutationFn: (data) => base44.entities.CalendarConnection.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-connections'] });
      setEmail("");
    },
  });

  const updateConnectionMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CalendarConnection.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-connections'] });
    },
  });

  const deleteConnectionMutation = useMutation({
    mutationFn: (id) => base44.entities.CalendarConnection.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-connections'] });
    },
  });

  const handleConnect = () => {
    if (!email) return;
    
    createConnectionMutation.mutate({
      provider,
      email,
      is_active: true,
      is_default: connections.length === 0,
      last_sync: new Date().toISOString(),
      settings: {
        auto_schedule: true,
        work_hours_start: "09:00",
        work_hours_end: "18:00",
        work_days: [1, 2, 3, 4, 5],
        default_meeting_duration: 60,
        research_block_duration: 120
      }
    });
  };

  const handleToggleActive = (connection) => {
    updateConnectionMutation.mutate({
      id: connection.id,
      data: { ...connection, is_active: !connection.is_active }
    });
  };

  const handleSetDefault = (connection) => {
    // First, remove default from all connections
    connections.forEach(conn => {
      if (conn.is_default && conn.id !== connection.id) {
        updateConnectionMutation.mutate({
          id: conn.id,
          data: { ...conn, is_default: false }
        });
      }
    });

    // Then set the new default
    updateConnectionMutation.mutate({
      id: connection.id,
      data: { ...connection, is_default: true }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader className="border-b border-slate-100">
          <div className="flex items-center justify-between">
            <CardTitle>Configurações de Calendário</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Add New Connection */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-4">Conectar Calendário</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex gap-2">
                <Button
                  variant={provider === "google" ? "default" : "outline"}
                  onClick={() => setProvider("google")}
                  className="flex-1"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Google Calendar
                </Button>
                <Button
                  variant={provider === "outlook" ? "default" : "outline"}
                  onClick={() => setProvider("outlook")}
                  className="flex-1"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Outlook
                </Button>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="seu-email@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Button
                  onClick={handleConnect}
                  disabled={!email || createConnectionMutation.isPending}
                >
                  Conectar
                </Button>
              </div>
            </div>
            
            <div className="mt-4 bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900 font-medium mb-2">
                💡 Como funciona a integração?
              </p>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• A IA analisará seus processos e prazos automaticamente</li>
                <li>• Sugestões de agendamento serão criadas com base em prioridades</li>
                <li>• Eventos sincronizarão com seu calendário externo</li>
                <li>• Lembretes serão enviados antes de prazos importantes</li>
              </ul>
            </div>
          </div>

          {/* Connected Calendars */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-4">Calendários Conectados</h3>
            {connections.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-lg">
                <Calendar className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500">Nenhum calendário conectado</p>
                <p className="text-xs text-slate-400 mt-1">
                  Conecte Google Calendar ou Outlook acima
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {connections.map((connection) => (
                  <motion.div
                    key={connection.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border-2 border-slate-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-slate-900">
                              {connection.provider === 'google' ? 'Google Calendar' : 'Outlook Calendar'}
                            </h4>
                            {connection.is_default && (
                              <Badge variant="default" className="text-xs">Padrão</Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-600">{connection.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={connection.is_active}
                            onCheckedChange={() => handleToggleActive(connection)}
                          />
                          <span className="text-xs text-slate-600">
                            {connection.is_active ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs text-slate-600 mb-3">
                      <div>
                        <span className="font-medium">Horário de Trabalho:</span>
                        <p>{connection.settings?.work_hours_start || '09:00'} - {connection.settings?.work_hours_end || '18:00'}</p>
                      </div>
                      <div>
                        <span className="font-medium">Duração Reunião:</span>
                        <p>{connection.settings?.default_meeting_duration || 60} minutos</p>
                      </div>
                      <div>
                        <span className="font-medium">Bloco Pesquisa:</span>
                        <p>{connection.settings?.research_block_duration || 120} minutos</p>
                      </div>
                      <div>
                        <span className="font-medium">Última Sinc:</span>
                        <p>{connection.last_sync ? new Date(connection.last_sync).toLocaleDateString('pt-BR') : 'Nunca'}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {!connection.is_default && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSetDefault(connection)}
                        >
                          <Check className="w-3 h-3 mr-1" />
                          Tornar Padrão
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (confirm('Desconectar este calendário?')) {
                            deleteConnectionMutation.mutate(connection.id);
                          }
                        }}
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        Desconectar
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}