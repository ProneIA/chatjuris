import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Plus, Settings, RefreshCw } from "lucide-react";
import CalendarView from "../components/calendar/CalendarView";
import EventForm from "../components/calendar/EventForm";
import CalendarSettings from "../components/calendar/CalendarSettings";
import AIScheduler from "../components/calendar/AIScheduler";

export default function Calendar() {
  const [showEventForm, setShowEventForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAIScheduler, setShowAIScheduler] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const queryClient = useQueryClient();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['calendar-events'],
    queryFn: () => base44.entities.CalendarEvent.list('-start_time'),
  });

  const { data: connections = [] } = useQuery({
    queryKey: ['calendar-connections'],
    queryFn: () => base44.entities.CalendarConnection.list('-created_date'),
  });

  const { data: cases = [] } = useQuery({
    queryKey: ['cases'],
    queryFn: () => base44.entities.Case.list('-created_date'),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('name'),
  });

  const createEventMutation = useMutation({
    mutationFn: (data) => base44.entities.CalendarEvent.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      setShowEventForm(false);
      setSelectedEvent(null);
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CalendarEvent.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      setShowEventForm(false);
      setSelectedEvent(null);
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: (id) => base44.entities.CalendarEvent.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      setSelectedEvent(null);
    },
  });

  const handleEventSubmit = (data) => {
    if (selectedEvent) {
      updateEventMutation.mutate({ id: selectedEvent.id, data });
    } else {
      createEventMutation.mutate(data);
    }
  };

  const hasActiveConnection = connections.some(c => c.is_active);
  const todayEvents = events.filter(e => {
    const eventDate = new Date(e.start_time);
    const today = new Date();
    return eventDate.toDateString() === today.toDateString();
  });

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200 px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Calendário Inteligente</h1>
            <p className="text-slate-600 mt-1">
              Gerencie seus compromissos e prazos com IA
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowSettings(true)}
            >
              <Settings className="w-4 h-4 mr-2" />
              Configurações
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowAIScheduler(true)}
              className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200"
            >
              <CalendarIcon className="w-4 h-4 mr-2" />
              IA Agendar
            </Button>
            <Button
              onClick={() => {
                setSelectedEvent(null);
                setShowEventForm(true);
              }}
              className="bg-gradient-to-r from-blue-600 to-purple-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Evento
            </Button>
          </div>
        </div>

        {!hasActiveConnection && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <CalendarIcon className="w-5 h-5 text-yellow-600" />
              <div className="flex-1">
                <p className="font-medium text-yellow-900">
                  Conecte seu calendário
                </p>
                <p className="text-sm text-yellow-700 mt-0.5">
                  Configure Google Calendar ou Outlook para sincronização automática
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(true)}
                className="border-yellow-300 hover:bg-yellow-100"
              >
                Configurar
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-4 gap-4 mt-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
            <p className="text-sm text-blue-600 font-medium">Hoje</p>
            <p className="text-2xl font-bold text-blue-900 mt-1">{todayEvents.length}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
            <p className="text-sm text-purple-600 font-medium">Esta Semana</p>
            <p className="text-2xl font-bold text-purple-900 mt-1">
              {events.filter(e => {
                const eventDate = new Date(e.start_time);
                const weekFromNow = new Date();
                weekFromNow.setDate(weekFromNow.getDate() + 7);
                return eventDate <= weekFromNow && eventDate >= new Date();
              }).length}
            </p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
            <p className="text-sm text-green-600 font-medium">Prazos Urgentes</p>
            <p className="text-2xl font-bold text-green-900 mt-1">
              {events.filter(e => e.priority === 'urgent' && e.event_type === 'deadline').length}
            </p>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
            <p className="text-sm text-orange-600 font-medium">Calendários</p>
            <p className="text-2xl font-bold text-orange-900 mt-1">{connections.length}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <CalendarView
          events={events}
          onEventClick={(event) => {
            setSelectedEvent(event);
            setShowEventForm(true);
          }}
          onDateSelect={setSelectedDate}
          selectedDate={selectedDate}
        />
      </div>

      {showEventForm && (
        <EventForm
          event={selectedEvent}
          cases={cases}
          clients={clients}
          onSubmit={handleEventSubmit}
          onDelete={selectedEvent ? () => {
            if (confirm('Deseja excluir este evento?')) {
              deleteEventMutation.mutate(selectedEvent.id);
            }
          } : null}
          onClose={() => {
            setShowEventForm(false);
            setSelectedEvent(null);
          }}
          isLoading={createEventMutation.isPending || updateEventMutation.isPending}
        />
      )}

      {showSettings && (
        <CalendarSettings
          connections={connections}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showAIScheduler && (
        <AIScheduler
          cases={cases}
          clients={clients}
          events={events}
          connections={connections}
          onSchedule={(eventData) => createEventMutation.mutate(eventData)}
          onClose={() => setShowAIScheduler(false)}
        />
      )}
    </div>
  );
}