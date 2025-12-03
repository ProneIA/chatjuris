import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Plus, Settings } from "lucide-react";
import CalendarView from "../components/calendar/CalendarView";
import EventForm from "../components/calendar/EventForm";
import CalendarSettings from "../components/calendar/CalendarSettings";
import AIScheduler from "../components/calendar/AIScheduler";

export default function Calendar({ theme = 'light' }) {
  const isDark = theme === 'dark';
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

  const { data: tasks = [] } = useQuery({
    queryKey: ['calendar-tasks'],
    queryFn: () => base44.entities.Task.filter({ status: { $in: ['pending', 'in_progress'] } }),
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
  // Merge events and tasks for display
  const allCalendarItems = [
    ...events,
    ...tasks.filter(t => t.due_date).map(t => ({
      id: t.id,
      title: t.title,
      start_time: `${t.due_date}T09:00:00`, // Default to 9 AM for tasks without time
      end_time: `${t.due_date}T10:00:00`,
      event_type: 'deadline',
      description: t.description,
      priority: t.priority,
      is_task: true
    }))
  ];

  const todayEvents = allCalendarItems.filter(e => {
    const eventDate = new Date(e.start_time);
    const today = new Date();
    return eventDate.toDateString() === today.toDateString();
  });

  return (
    <div className={`h-full flex flex-col ${isDark ? 'bg-neutral-950' : 'bg-gray-50'}`}>
      <div className={`border-b px-6 py-6 ${isDark ? 'bg-black border-neutral-800' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className={`text-2xl font-light ${isDark ? 'text-white' : 'text-gray-900'}`}>Calendário Inteligente</h1>
            <p className={`mt-1 ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
              Gerencie seus compromissos e prazos com IA
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowSettings(true)}
              className={isDark ? 'border-neutral-800 text-white hover:bg-neutral-800' : 'border-gray-200 text-gray-700 hover:bg-gray-100'}
            >
              <Settings className="w-4 h-4 mr-2" />
              Configurações
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowAIScheduler(true)}
              className="border-neutral-800 text-white hover:bg-neutral-800"
            >
              <CalendarIcon className="w-4 h-4 mr-2" />
              IA Agendar
            </Button>
            <Button
              onClick={() => {
                setSelectedEvent(null);
                setShowEventForm(true);
              }}
              className="bg-white text-black hover:bg-gray-100"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Evento
            </Button>
          </div>
        </div>

        {!hasActiveConnection && (
          <div className="border border-yellow-500/30 bg-yellow-500/10 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-3">
              <CalendarIcon className="w-5 h-5 text-yellow-500" />
              <div className="flex-1">
                <p className="font-medium text-yellow-200">
                  Conecte seu calendário
                </p>
                <p className="text-sm text-yellow-300/70 mt-0.5">
                  Configure Google Calendar ou Outlook para sincronização automática
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(true)}
                className="border-yellow-500/30 text-yellow-200 hover:bg-yellow-500/20"
              >
                Configurar
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-4 gap-4">
          <div className="border border-neutral-800 rounded-lg p-4 bg-neutral-900">
            <p className="text-sm text-neutral-500">Hoje</p>
            <p className="text-2xl font-light text-white mt-1">{todayEvents.length}</p>
          </div>
          <div className="border border-neutral-800 rounded-lg p-4 bg-neutral-900">
            <p className="text-sm text-neutral-500">Esta Semana</p>
            <p className="text-2xl font-light text-white mt-1">
              {events.filter(e => {
                const eventDate = new Date(e.start_time);
                const weekFromNow = new Date();
                weekFromNow.setDate(weekFromNow.getDate() + 7);
                return eventDate <= weekFromNow && eventDate >= new Date();
              }).length}
            </p>
          </div>
          <div className="border border-neutral-800 rounded-lg p-4 bg-neutral-900">
            <p className="text-sm text-neutral-500">Prazos Urgentes</p>
            <p className="text-2xl font-light text-white mt-1">
              {events.filter(e => e.priority === 'urgent' && e.event_type === 'deadline').length}
            </p>
          </div>
          <div className="border border-neutral-800 rounded-lg p-4 bg-neutral-900">
            <p className="text-sm text-neutral-500">Calendários</p>
            <p className="text-2xl font-light text-white mt-1">{connections.length}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <CalendarView
          events={allCalendarItems}
          onEventClick={(event) => {
            if (event.is_task) {
              // Could navigate to task details, for now just show basic info or ignore
              // Or ideally open a Task Details modal. 
              // Since we don't have a task modal ready here, we'll just ignore or treat as read-only event
              return; 
            }
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