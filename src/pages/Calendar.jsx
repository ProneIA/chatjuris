import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Plus, Settings } from "lucide-react";
import CalendarView from "../components/calendar/CalendarView";
import EventForm from "../components/calendar/EventForm";

import AIScheduler from "../components/calendar/AIScheduler";

export default function Calendar({ theme = 'light' }) {
  const isDark = theme === 'dark';
  const [showEventForm, setShowEventForm] = useState(false);

  const [showAIScheduler, setShowAIScheduler] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const queryClient = useQueryClient();

  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['calendar-events', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.CalendarEvent.filter({ created_by: user.email }, '-start_time');
    },
    enabled: !!user?.email,
  });



  const { data: cases = [] } = useQuery({
    queryKey: ['cases', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.Case.filter({ created_by: user.email }, '-created_date');
    },
    enabled: !!user?.email,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.Client.filter({ created_by: user.email }, 'name');
    },
    enabled: !!user?.email,
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


  const todayEvents = events.filter(e => {
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
              onClick={() => setShowAIScheduler(true)}
              className={isDark ? 'border-neutral-800 text-white hover:bg-neutral-800' : 'border-gray-200 text-gray-700 hover:bg-gray-100'}
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
            <p className="text-sm text-neutral-500">Este Mês</p>
            <p className="text-2xl font-light text-white mt-1">
              {events.filter(e => {
                const eventDate = new Date(e.start_time);
                const now = new Date();
                return eventDate.getMonth() === now.getMonth() && eventDate.getFullYear() === now.getFullYear();
              }).length}
            </p>
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

      {showAIScheduler && (
        <AIScheduler
          cases={cases}
          clients={clients}
          events={events}
          onSchedule={(eventData) => createEventMutation.mutate(eventData)}
          onClose={() => setShowAIScheduler(false)}
        />
      )}
    </div>
  );
}