import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Clock, MapPin, Users } from "lucide-react";
import { format, addDays, subDays, isSameDay, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const eventTypeColors = {
  meeting: "bg-blue-500 border-blue-600 text-blue-50",
  deadline: "bg-red-500 border-red-600 text-red-50",
  research: "bg-purple-500 border-purple-600 text-purple-50",
  hearing: "bg-orange-500 border-orange-600 text-orange-50",
  consultation: "bg-green-500 border-green-600 text-green-50",
  team_sync: "bg-indigo-500 border-indigo-600 text-indigo-50",
  personal: "bg-pink-500 border-pink-600 text-pink-50",
  task: "bg-amber-500 border-amber-600 text-amber-50",
  other: "bg-gray-500 border-gray-600 text-gray-50"
};

const eventTypeLabels = {
  meeting: "Reunião",
  deadline: "Prazo",
  research: "Pesquisa",
  hearing: "Audiência",
  consultation: "Consulta",
  team_sync: "Sincronização",
  personal: "Pessoal",
  task: "Tarefa",
  other: "Outro"
};

export default function CalendarDayView({ 
  events, 
  selectedDate, 
  onDateSelect, 
  onEventClick,
  isDark 
}) {
  const dayEvents = events
    .filter(event => isSameDay(new Date(event.start_time), selectedDate))
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getEventsForHour = (hour) => {
    return dayEvents.filter(event => {
      const eventHour = new Date(event.start_time).getHours();
      return eventHour === hour;
    });
  };

  // Calculate progress
  const totalActions = dayEvents.reduce((acc, event) => {
    return acc + (event.actions?.length || 0);
  }, 0);

  const completedActions = dayEvents.reduce((acc, event) => {
    const actions = event.actions || [];
    return acc + actions.filter(a => a.completed).length;
  }, 0);

  const progress = totalActions > 0 ? (completedActions / totalActions) * 100 : 0;

  return (
    <div className="grid lg:grid-cols-[1fr,400px] gap-6">
      {/* Timeline View */}
      <div className={`rounded-xl border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}`}>
        {/* Day Navigation */}
        <div className={`flex items-center justify-between p-4 border-b ${isDark ? 'border-neutral-800' : 'border-gray-200'}`}>
          <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
          </h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onDateSelect(subDays(selectedDate, 1))}
              className={isDark ? 'border-neutral-800 text-white' : ''}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDateSelect(new Date())}
              className={isDark ? 'border-neutral-800 text-white' : ''}
            >
              Hoje
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onDateSelect(addDays(selectedDate, 1))}
              className={isDark ? 'border-neutral-800 text-white' : ''}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Timeline */}
        <div className="p-4 space-y-1 max-h-[calc(100vh-250px)] overflow-y-auto">
          {hours.map(hour => {
            const hourEvents = getEventsForHour(hour);
            return (
              <div key={hour} className="flex gap-4">
                <div className={`w-16 text-sm ${isDark ? 'text-neutral-500' : 'text-gray-500'} pt-1`}>
                  {String(hour).padStart(2, '0')}:00
                </div>
                <div className="flex-1 space-y-2 pb-4">
                  {hourEvents.length === 0 ? (
                    <div className={`h-8 border-l-2 ${isDark ? 'border-neutral-800' : 'border-gray-200'}`} />
                  ) : (
                    hourEvents.map(event => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => onEventClick(event)}
                        className={cn(
                          "p-4 rounded-lg border-l-4 cursor-pointer transition-all",
                          eventTypeColors[event.event_type],
                          event.status === 'completed' && "opacity-60",
                          event.status === 'overdue' && "ring-2 ring-red-500"
                        )}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold mb-1">{event.title}</h4>
                            <div className="flex items-center gap-3 text-xs opacity-90">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {format(new Date(event.start_time), 'HH:mm')} - {format(new Date(event.end_time), 'HH:mm')}
                              </div>
                              {event.location && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {event.location}
                                </div>
                              )}
                            </div>
                          </div>
                          <Badge variant="outline" className="bg-white/20">
                            {eventTypeLabels[event.event_type]}
                          </Badge>
                        </div>
                        {event.description && (
                          <p className="text-sm opacity-90 line-clamp-2">{event.description}</p>
                        )}
                        {event.actions && event.actions.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-white/20">
                            <div className="text-xs opacity-90">
                              {event.actions.filter(a => a.completed).length}/{event.actions.length} ações concluídas
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Day Summary Sidebar */}
      <div className="space-y-4">
        {/* Progress Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl border p-6 ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}`}
        >
          <h3 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Progresso do Dia
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className={isDark ? 'text-neutral-400' : 'text-gray-600'}>Ações</span>
                <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {completedActions}/{totalActions}
                </span>
              </div>
              <div className={`h-2 rounded-full ${isDark ? 'bg-neutral-800' : 'bg-gray-200'}`}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-500"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className={`p-3 rounded-lg ${isDark ? 'bg-neutral-800' : 'bg-gray-50'}`}>
                <div className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {dayEvents.length}
                </div>
                <div className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                  Eventos
                </div>
              </div>
              <div className={`p-3 rounded-lg ${isDark ? 'bg-neutral-800' : 'bg-gray-50'}`}>
                <div className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {dayEvents.filter(e => e.status === 'completed').length}
                </div>
                <div className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                  Concluídos
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Events List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`rounded-xl border p-6 ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}`}
        >
          <h3 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Todos os Eventos ({dayEvents.length})
          </h3>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {dayEvents.length === 0 ? (
              <div className="text-center py-8">
                <Clock className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-neutral-700' : 'text-gray-300'}`} />
                <p className={isDark ? 'text-neutral-500' : 'text-gray-500'}>
                  Nenhum evento agendado
                </p>
              </div>
            ) : (
              dayEvents.map(event => (
                <motion.button
                  key={event.id}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => onEventClick(event)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg border transition-all",
                    isDark ? 'border-neutral-800 hover:bg-neutral-800' : 'border-gray-200 hover:bg-gray-50'
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      eventTypeColors[event.event_type].split(' ')[0]
                    )} />
                    <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {event.title}
                    </span>
                  </div>
                  <div className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                    {format(new Date(event.start_time), 'HH:mm')} - {format(new Date(event.end_time), 'HH:mm')}
                  </div>
                </motion.button>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}