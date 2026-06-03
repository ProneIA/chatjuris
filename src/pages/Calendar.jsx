import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import {
  Calendar as CalendarIcon, Plus, Search, Filter,
  Bell, CheckCircle2, Clock, AlertCircle,
} from "lucide-react";
import { AnimatePresence } from "framer-motion";
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
import { AppPage, PageHeader } from "@/components/ds";

export default function Calendar() {
  const [viewMode, setViewMode]           = useState("month");
  const [selectedDate, setSelectedDate]   = useState(new Date());
  const [showEventForm, setShowEventForm] = useState(false);
  const [showAIScheduler, setShowAIScheduler] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [showFilters, setShowFilters]     = useState(false);
  const [searchQuery, setSearchQuery]     = useState("");
  const [filters, setFilters]             = useState({ types: [], priorities: [], statuses: [] });
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage]     = useState("");
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: events = [], isLoading, error: eventsError } = useQuery({
    queryKey: ["calendar-events", user?.email],
    queryFn: () => base44.entities.CalendarEvent.list("start_time", 5000),
    enabled: !!user?.email,
    refetchOnWindowFocus: false,
    staleTime: 0,
    gcTime: 0,
    retry: 2,
  });

  const { data: cases = [] } = useQuery({
    queryKey: ["cases", user?.email],
    queryFn: () => base44.entities.Case.filter({ created_by: user.email }, "-created_date"),
    enabled: !!user?.email,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients", user?.email],
    queryFn: () => base44.entities.Client.filter({ created_by: user.email }, "name"),
    enabled: !!user?.email,
  });

  // Mutations
  const createEventMutation = useMutation({
    mutationFn: (data) => base44.entities.CalendarEvent.create(data),
    onMutate: async (newEvent) => {
      await queryClient.cancelQueries({ queryKey: ["calendar-events"] });
      const prev = queryClient.getQueryData(["calendar-events", user?.email]);
      const temp = { ...newEvent, id: "temp-" + Date.now(), created_by: user?.email };
      queryClient.setQueryData(["calendar-events", user?.email], (old = []) =>
        [...old, temp].sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
      );
      return { prev };
    },
    onSuccess: (newEvent) => {
      queryClient.setQueryData(["calendar-events", user?.email], (old = []) =>
        [...old.filter(e => !String(e.id).startsWith("temp-")), newEvent]
          .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
      );
      setTimeout(() => queryClient.invalidateQueries({ queryKey: ["calendar-events"] }), 100);
      setShowEventForm(false);
      setSelectedEvent(null);
      setSuccessMessage("Evento criado com sucesso!");
      setShowSuccessToast(true);
    },
    onError: (err, _, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["calendar-events", user?.email], ctx.prev);
      alert("Erro ao criar evento: " + err.message);
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CalendarEvent.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ["calendar-events"] });
      const prev = queryClient.getQueryData(["calendar-events", user?.email]);
      queryClient.setQueryData(["calendar-events", user?.email], (old = []) =>
        old.map(e => e.id === id ? { ...e, ...data } : e)
      );
      return { prev };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      setShowEventDetails(false);
      setSelectedEvent(null);
      setSuccessMessage("Evento atualizado!");
      setShowSuccessToast(true);
    },
    onError: (err, _, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["calendar-events", user?.email], ctx.prev);
      alert("Erro ao atualizar evento: " + err.message);
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: (id) => base44.entities.CalendarEvent.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["calendar-events"] });
      const prev = queryClient.getQueryData(["calendar-events", user?.email]);
      queryClient.setQueryData(["calendar-events", user?.email], (old = []) => old.filter(e => e.id !== id));
      return { prev };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      setShowEventDetails(false);
      setSelectedEvent(null);
      setSuccessMessage("Evento excluído!");
      setShowSuccessToast(true);
    },
    onError: (err, _, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["calendar-events", user?.email], ctx.prev);
      alert("Erro ao excluir evento: " + err.message);
    },
  });

  // Auto mark overdue
  useEffect(() => {
    if (!events.length) return;
    events.forEach(event => {
      if (isPast(new Date(event.end_time)) && event.status === "scheduled") {
        updateEventMutation.mutate({ id: event.id, data: { ...event, status: "overdue" } });
      }
    });
  }, [events]);

  const filteredEvents = events.filter(event => {
    if (searchQuery && !event.title?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filters.types.length > 0 && !filters.types.includes(event.event_type))         return false;
    if (filters.priorities.length > 0 && !filters.priorities.includes(event.priority)) return false;
    if (filters.statuses.length > 0 && !filters.statuses.includes(event.status))       return false;
    return true;
  });

  const todayEvents     = filteredEvents.filter(e => isSameDay(new Date(e.start_time), new Date()));
  const pendingEvents   = filteredEvents.filter(e => e.status === "scheduled" || e.status === "rescheduled");
  const overdueEvents   = filteredEvents.filter(e => e.status === "overdue").length;
  const todayActions    = todayEvents.reduce((acc, e) => acc + (e.actions?.length || 0), 0);
  const completedActions= todayEvents.reduce((acc, e) => acc + (e.actions?.filter(a => a.completed).length || 0), 0);

  const statsCards = [
    { label: "Hoje",      value: todayEvents.length,                  icon: CalendarIcon, color: "var(--accent)",  bg: "var(--accent-light)" },
    { label: "Ações",     value: `${completedActions}/${todayActions}`,icon: CheckCircle2, color: "var(--success)", bg: "var(--success-bg)"  },
    { label: "Pendentes", value: pendingEvents.length,                 icon: Clock,        color: "var(--warning)", bg: "var(--warning-bg)"  },
    { label: "Atrasados", value: overdueEvents,                        icon: AlertCircle,  color: "var(--danger)",  bg: "var(--danger-bg)"   },
  ];

  return (
    <AppPage style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Compact header for calendar */}
      <div style={{ borderBottom: "1px solid var(--border)", padding: "16px 24px", background: "var(--card)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.02em" }}>
              Calendário Inteligente
            </h1>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "2px 0 0" }}>
              {format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* View toggle */}
            <div style={{ display: "flex", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, padding: 4, gap: 2 }}>
              {["day", "week", "month"].map(mode => (
                <button key={mode} onClick={() => setViewMode(mode)}
                  style={{ padding: "6px 12px", fontSize: 12, fontWeight: 500, border: "none", borderRadius: 8, cursor: "pointer", fontFamily: "var(--font-body)", background: viewMode === mode ? "var(--card)" : "transparent", color: viewMode === mode ? "var(--text-primary)" : "var(--text-secondary)", boxShadow: viewMode === mode ? "0 1px 2px rgba(0,0,0,.06)" : "none", transition: "all 0.15s ease" }}
                >
                  {mode === "day" ? "Dia" : mode === "week" ? "Semana" : "Mês"}
                </button>
              ))}
            </div>
            <button className="btn-outline" style={{ padding: "0 12px", height: 36 }} onClick={() => setShowFilters(!showFilters)}>
              <Filter style={{ width: 14, height: 14 }} />
            </button>
            <button className="btn-outline" style={{ padding: "0 12px", height: 36 }} onClick={() => setShowAIScheduler(true)}>
              <CalendarIcon style={{ width: 14, height: 14 }} />
              <span className="hidden md:inline">IA</span>
            </button>
            <button className="btn-primary" style={{ height: 36 }} onClick={() => { setSelectedEvent(null); setShowEventForm(true); }}>
              <Plus style={{ width: 14, height: 14 }} /> Novo
            </button>
          </div>
        </div>

        {/* Search */}
        <div style={{ position: "relative", marginBottom: 12 }}>
          <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "var(--text-muted)" }} />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar eventos..."
            style={{ width: "100%", padding: "9px 12px 9px 36px", border: "1px solid var(--border)", borderRadius: 10, fontSize: 13, fontFamily: "var(--font-body)", color: "var(--text-primary)", outline: "none" }}
          />
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }} className="md:grid-cols-4 grid-cols-2">
          {statsCards.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} style={{ padding: 12, borderRadius: 10, border: "1px solid var(--border)", background: "var(--card)", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon style={{ width: 15, height: 15, color }} />
              </div>
              <div>
                <p style={{ fontSize: 11, color: "var(--text-secondary)", margin: 0 }}>{label}</p>
                <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters panel */}
      <AnimatePresence>
        {showFilters && (
          <CalendarFilters filters={filters} onChange={setFilters} onClose={() => setShowFilters(false)} isDark={false} />
        )}
      </AnimatePresence>

      {/* Calendar view */}
      <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
        {isLoading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 40, height: 40, border: "3px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 12px" }} />
              <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>Carregando eventos...</p>
            </div>
          </div>
        ) : eventsError ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
            <div style={{ padding: 24, borderRadius: 12, border: "1px solid var(--danger-border)", background: "var(--danger-bg)", color: "var(--danger-text)", fontSize: 13 }}>
              Erro ao carregar eventos: {eventsError.message}
            </div>
          </div>
        ) : (
          <>
            {viewMode === "month" && <CalendarMonthView events={filteredEvents} selectedDate={selectedDate} onDateSelect={setSelectedDate} onEventClick={e => { setSelectedEvent(e); setShowEventDetails(true); }} onEventDrop={(id, s, en) => { const ev = events.find(x => x.id === id); ev && updateEventMutation.mutate({ id, data: { ...ev, start_time: s.toISOString(), end_time: en.toISOString() } }); }} isDark={false} />}
            {viewMode === "week" && <CalendarWeekView  events={filteredEvents} selectedDate={selectedDate} onDateSelect={setSelectedDate} onEventClick={e => { setSelectedEvent(e); setShowEventDetails(true); }} onEventDrop={(id, s, en) => { const ev = events.find(x => x.id === id); ev && updateEventMutation.mutate({ id, data: { ...ev, start_time: s.toISOString(), end_time: en.toISOString() } }); }} isDark={false} />}
            {viewMode === "day"   && <CalendarDayView  events={filteredEvents} selectedDate={selectedDate} onDateSelect={setSelectedDate} onEventClick={e => { setSelectedEvent(e); setShowEventDetails(true); }} onEventDrop={(id, s, en) => { const ev = events.find(x => x.id === id); ev && updateEventMutation.mutate({ id, data: { ...ev, start_time: s.toISOString(), end_time: en.toISOString() } }); }} isDark={false} />}
          </>
        )}
      </div>

      {/* Dialogs */}
      {showEventForm && (
        <EventFormDialog
          event={selectedEvent}
          cases={cases}
          clients={clients}
          onSubmit={data => selectedEvent ? updateEventMutation.mutate({ id: selectedEvent.id, data }) : createEventMutation.mutate(data)}
          onClose={() => { setShowEventForm(false); setSelectedEvent(null); }}
          isLoading={createEventMutation.isPending || updateEventMutation.isPending}
          isDark={false}
        />
      )}
      {showEventDetails && selectedEvent && (
        <EventDetailsDialog
          event={selectedEvent}
          onUpdate={(id, data) => updateEventMutation.mutate({ id, data })}
          onDelete={id => { if (confirm("Deseja excluir este evento?")) deleteEventMutation.mutate(id); }}
          onEdit={() => { setShowEventDetails(false); setShowEventForm(true); }}
          onClose={() => { setShowEventDetails(false); setSelectedEvent(null); }}
          isDark={false}
        />
      )}
      {showAIScheduler && (
        <AIScheduler cases={cases} clients={clients} events={events} onSchedule={data => createEventMutation.mutate(data)} onClose={() => setShowAIScheduler(false)} />
      )}
      <SuccessToast message={successMessage} show={showSuccessToast} onClose={() => setShowSuccessToast(false)} />
    </AppPage>
  );
}