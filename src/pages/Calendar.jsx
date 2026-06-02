import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Search, 
  Filter, 
  Bell,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import CalendarMonthView from "../components/calendar/CalendarMonthView";
import CalendarWeekView from "../components/calendar/CalendarWeekView";
import CalendarDayView from "../components/calendar/CalendarDayView";
import EventFormDialog from "../components/calendar/EventFormDialog";
import EventDetailsDialog from "../components/calendar/EventDetailsDialog";
import CalendarFilters from "../components/calendar/CalendarFilters";
import AIScheduler from "../components/calendar/AIScheduler";
import SuccessToast from "../components/calendar/SuccessToast";
import { isPast, isSameDay, format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Calendar({ theme = 'light' }) {
  const isDark = false;
  const [viewMode, setViewMode] = useState('month'); // month, week, day
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showEventForm, setShowEventForm] = useState(false);
  const [showAIScheduler, setShowAIScheduler] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    types: [],
    priorities: [],
    statuses: [],
  });
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);

  useEffect(() => {
    console.log("🔑 Carregando autenticação do usuário...");
    base44.auth.me()
      .then(u => {
        console.log("✅ Usuário autenticado:", u.email);
        setUser(u);
      })
      .catch((err) => {
        console.error("❌ Erro ao obter usuário:", err);
      });
  }, []);

  // Fetch events
  const { data: events = [], isLoading, error: eventsError, refetch } = useQuery({
    queryKey: ['calendar-events', user?.email],
    queryFn: async () => {
      if (!user?.email) {
        console.log("⚠️ Usuário não autenticado, retornando array vazio");
        return [];
      }
      try {
        console.log("📥 Buscando eventos do usuário:", user.email);
        // Usar list() simples - RLS simplificado cuida do filtro
        const fetchedEvents = await base44.entities.CalendarEvent.list('start_time', 5000);
        console.log(`✅ ${fetchedEvents.length} eventos carregados:`, fetchedEvents);
        return fetchedEvents || [];
      } catch (error) {
        console.error("❌ Erro ao buscar eventos:", error);
        throw error;
      }
    },
    enabled: !!user?.email,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    staleTime: 0,
    gcTime: 0,
    retry: 2,
  });

  // Debug: Log events whenever they change
  useEffect(() => {
    console.log(`📊 Estado atual: ${events.length} eventos`, events);
  }, [events]);

  // Fetch related data
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

  // Mutations
  const createEventMutation = useMutation({
    mutationFn: async (data) => {
      console.log("📝 Criando evento:", data);
      const result = await base44.entities.CalendarEvent.create(data);
      console.log("✅ Evento criado com sucesso:", result);
      return result;
    },
    onMutate: async (newEvent) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['calendar-events'] });
      
      // Snapshot previous value
      const previousEvents = queryClient.getQueryData(['calendar-events', user?.email]);
      
      // Optimistically update cache with temp ID
      const tempEvent = { 
        ...newEvent, 
        id: 'temp-' + Date.now(),
        created_by: user?.email,
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
      };
      
      queryClient.setQueryData(['calendar-events', user?.email], (old = []) => {
        console.log("⚡ Adicionando evento otimisticamente ao cache", tempEvent);
        const updated = [...old, tempEvent].sort(
          (a, b) => new Date(a.start_time) - new Date(b.start_time)
        );
        console.log(`📊 Cache agora tem ${updated.length} eventos`);
        return updated;
      });
      
      return { previousEvents };
    },
    onSuccess: (newEvent) => {
      console.log("🔄 Evento salvo no backend, substituindo temporário:", newEvent);
      
      // Replace temp event with real one from backend
      queryClient.setQueryData(['calendar-events', user?.email], (old = []) => {
        // Remove temp events and add real one
        const filtered = (old || []).filter(e => !e.id?.toString().startsWith('temp-'));
        const updated = [...filtered, newEvent].sort(
          (a, b) => new Date(a.start_time) - new Date(b.start_time)
        );
        console.log(`✅ Cache atualizado: ${old?.length} → ${updated.length} eventos`);
        return updated;
      });
      
      // Force refetch to ensure 100% sync with backend
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
        console.log("🔄 Refetch forçado executado");
      }, 100);
      
      setShowEventForm(false);
      setSelectedEvent(null);
      setSuccessMessage("✅ Evento criado com sucesso!");
      setShowSuccessToast(true);
      
      console.log("✅ Processo completo de criação finalizado");
    },
    onError: (error, newEvent, context) => {
      console.error("❌ Erro ao criar evento:", error);
      
      // Rollback on error
      if (context?.previousEvents) {
        queryClient.setQueryData(['calendar-events', user?.email], context.previousEvents);
      }
      
      alert("Erro ao criar evento: " + error.message);
    }
  });

  const updateEventMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CalendarEvent.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['calendar-events'] });
      const previousEvents = queryClient.getQueryData(['calendar-events', user?.email]);
      
      queryClient.setQueryData(['calendar-events', user?.email], (old = []) => {
        return old.map(e => e.id === id ? { ...e, ...data } : e);
      });
      
      return { previousEvents };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      setShowEventDetails(false);
      setSelectedEvent(null);
      setSuccessMessage("Evento atualizado!");
      setShowSuccessToast(true);
    },
    onError: (error, variables, context) => {
      if (context?.previousEvents) {
        queryClient.setQueryData(['calendar-events', user?.email], context.previousEvents);
      }
      alert("Erro ao atualizar evento: " + error.message);
    }
  });

  const deleteEventMutation = useMutation({
    mutationFn: (id) => base44.entities.CalendarEvent.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['calendar-events'] });
      const previousEvents = queryClient.getQueryData(['calendar-events', user?.email]);
      
      queryClient.setQueryData(['calendar-events', user?.email], (old = []) => {
        return old.filter(e => e.id !== id);
      });
      
      return { previousEvents };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      setShowEventDetails(false);
      setSelectedEvent(null);
      setSuccessMessage("Evento excluído!");
      setShowSuccessToast(true);
    },
    onError: (error, id, context) => {
      if (context?.previousEvents) {
        queryClient.setQueryData(['calendar-events', user?.email], context.previousEvents);
      }
      alert("Erro ao excluir evento: " + error.message);
    }
  });

  // Auto-update overdue events
  useEffect(() => {
    if (!events.length) return;
    
    events.forEach(event => {
      const isOverdue = isPast(new Date(event.end_time)) && event.status === 'scheduled';
      if (isOverdue) {
        updateEventMutation.mutate({ 
          id: event.id, 
          data: { ...event, status: 'overdue' } 
        });
      }
    });
  }, [events]);

  // Filter and search events
  const filteredEvents = events.filter(event => {
    // Search filter
    if (searchQuery && !event.title?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Type filter
    if (filters.types.length > 0 && !filters.types.includes(event.event_type)) {
      return false;
    }
    
    // Priority filter
    if (filters.priorities.length > 0 && !filters.priorities.includes(event.priority)) {
      return false;
    }
    
    // Status filter
    if (filters.statuses.length > 0 && !filters.statuses.includes(event.status)) {
      return false;
    }
    
    return true;
  });

  // Debug filtered events
  useEffect(() => {
    console.log(`🔍 Eventos filtrados: ${filteredEvents.length}/${events.length}`, {
      searchQuery,
      filters,
      filteredCount: filteredEvents.length,
      totalCount: events.length
    });
  }, [filteredEvents, events, searchQuery, filters]);

  // Calculate statistics
  const todayEvents = filteredEvents.filter(e => 
    isSameDay(new Date(e.start_time), new Date())
  );
  
  const pendingEvents = filteredEvents.filter(e => 
    e.status === 'scheduled' || e.status === 'rescheduled'
  );
  
  const completedToday = todayEvents.filter(e => e.status === 'completed').length;
  const overdueEvents = filteredEvents.filter(e => e.status === 'overdue').length;
  
  const todayActions = todayEvents.reduce((acc, event) => {
    const actions = event.actions || [];
    return acc + actions.length;
  }, 0);
  
  const completedActions = todayEvents.reduce((acc, event) => {
    const actions = event.actions || [];
    return acc + actions.filter(a => a.completed).length;
  }, 0);

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setShowEventDetails(true);
  };

  const handleEventUpdate = (id, data) => {
    updateEventMutation.mutate({ id, data });
  };

  const handleEventDrop = (eventId, newStart, newEnd) => {
    const event = events.find(e => e.id === eventId);
    if (event) {
      updateEventMutation.mutate({
        id: eventId,
        data: {
          ...event,
          start_time: newStart.toISOString(),
          end_time: newEnd.toISOString()
        }
      });
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--surface)' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid var(--border)', padding: '16px 24px', background: 'var(--main-bg)' }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)' }}>
                Calendário Inteligente
              </h1>
              <p style={{ fontSize: 13, marginTop: 4, color: 'var(--text-secondary)' }}>
                {format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div style={{ display: 'flex', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--main-bg)' }}>
              {['day', 'week', 'month'].map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  style={{
                    padding: '6px 12px', fontSize: 13, fontWeight: 500, transition: 'all var(--transition)',
                    background: viewMode === mode ? 'var(--ink)' : 'transparent',
                    color: viewMode === mode ? '#fff' : 'var(--text-secondary)',
                    border: 'none', cursor: 'pointer', borderRadius: 'var(--radius-sm)'
                  }}
                >
                  {mode === 'day' ? 'Dia' : mode === 'week' ? 'Semana' : 'Mês'}
                </button>
              ))}
            </div>

            <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="w-4 h-4" />
            </Button>

            <Button variant="outline" size="sm" onClick={() => setShowAIScheduler(true)}>
              <CalendarIcon className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">IA</span>
            </Button>

            <Button
              size="sm"
              className="btn-primary"
              onClick={() => {
                setSelectedEvent(null);
                setShowEventForm(true);
              }}
            >
              <Plus className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Novo</span>
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar eventos..."
              className="pl-10"
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          {[
            { label: 'Hoje', value: todayEvents.length, icon: CalendarIcon, color: 'var(--info)', bg: 'var(--info-bg)' },
            { label: 'Ações', value: `${completedActions}/${todayActions}`, icon: CheckCircle2, color: 'var(--success)', bg: 'var(--success-bg)' },
            { label: 'Pendentes', value: pendingEvents.length, icon: Clock, color: 'var(--warn)', bg: 'var(--warn-bg)' },
            { label: 'Atrasados', value: overdueEvents, icon: AlertCircle, color: 'var(--danger)', bg: 'var(--danger-bg)' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <motion.div
              key={label}
              whileHover={{ scale: 1.02 }}
              style={{ padding: 12, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--main-bg)' }}
            >
              <div className="flex items-center gap-2">
                <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: bg }}>
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{label}</p>
                  <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>{value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <CalendarFilters
            filters={filters}
            onChange={setFilters}
            onClose={() => setShowFilters(false)}
            isDark={isDark}
          />
        )}
      </AnimatePresence>

      {/* Calendar Views */}
      <div className="flex-1 overflow-auto p-4 md:p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div style={{ width: 48, height: 48, border: '4px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
              <p style={{ color: 'var(--text-secondary)' }}>Carregando eventos...</p>
            </div>
          </div>
        ) : eventsError ? (
          <div className="flex items-center justify-center h-full">
            <div style={{ padding: 24, borderRadius: 'var(--radius-md)', border: '1px solid var(--danger-border)', background: 'var(--danger-bg)' }}>
              <p className="text-red-600">Erro ao carregar eventos: {eventsError.message}</p>
            </div>
          </div>
        ) : (
          <>
            {viewMode === 'month' && (
              <CalendarMonthView
                events={filteredEvents}
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
                onEventClick={handleEventClick}
                onEventDrop={handleEventDrop}
                isDark={isDark}
              />
            )}
            
            {viewMode === 'week' && (
              <CalendarWeekView
                events={filteredEvents}
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
                onEventClick={handleEventClick}
                onEventDrop={handleEventDrop}
                isDark={isDark}
              />
            )}
            
            {viewMode === 'day' && (
              <CalendarDayView
                events={filteredEvents}
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
                onEventClick={handleEventClick}
                onEventDrop={handleEventDrop}
                isDark={isDark}
              />
            )}
          </>
        )}
      </div>

      {/* Dialogs */}
      {showEventForm && (
        <EventFormDialog
          event={selectedEvent}
          cases={cases}
          clients={clients}
          onSubmit={(data) => {
            if (selectedEvent) {
              updateEventMutation.mutate({ id: selectedEvent.id, data });
            } else {
              createEventMutation.mutate(data);
            }
          }}
          onClose={() => {
            setShowEventForm(false);
            setSelectedEvent(null);
          }}
          isLoading={createEventMutation.isPending || updateEventMutation.isPending}
          isDark={isDark}
        />
      )}

      {showEventDetails && selectedEvent && (
        <EventDetailsDialog
          event={selectedEvent}
          onUpdate={handleEventUpdate}
          onDelete={(id) => {
            if (confirm('Deseja excluir este evento?')) {
              deleteEventMutation.mutate(id);
            }
          }}
          onEdit={() => {
            setShowEventDetails(false);
            setShowEventForm(true);
          }}
          onClose={() => {
            setShowEventDetails(false);
            setSelectedEvent(null);
          }}
          isDark={isDark}
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

      {/* Success Toast */}
      <SuccessToast
        message={successMessage}
        show={showSuccessToast}
        onClose={() => setShowSuccessToast(false)}
      />
    </div>
  );
}