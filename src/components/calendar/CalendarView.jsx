import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Clock, MapPin } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const eventTypeColors = {
  meeting: "bg-blue-500",
  deadline: "bg-red-500",
  research: "bg-purple-500",
  hearing: "bg-orange-500",
  consultation: "bg-green-500",
  team_sync: "bg-indigo-500",
  other: "bg-gray-500"
};

const eventTypeLabels = {
  meeting: "Reunião",
  deadline: "Prazo",
  research: "Pesquisa",
  hearing: "Audiência",
  consultation: "Consulta",
  team_sync: "Sincronização",
  other: "Outro"
};

export default function CalendarView({ events, onEventClick, onDateSelect, selectedDate }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getEventsForDay = (day) => {
    return events.filter(event => 
      isSameDay(new Date(event.start_time), day)
    ).sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
  };

  const selectedDayEvents = getEventsForDay(selectedDate);

  return (
    <div className="grid lg:grid-cols-[2fr,1fr] gap-6">
      {/* Calendar Grid */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">
            {format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR })}
          </h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(new Date())}
            >
              Hoje
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-slate-600 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-2">
          {daysInMonth.map((day, idx) => {
            const dayEvents = getEventsForDay(day);
            const isSelected = isSameDay(day, selectedDate);
            const isToday = isSameDay(day, new Date());

            return (
              <motion.button
                key={idx}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onDateSelect(day)}
                className={cn(
                  "min-h-[80px] p-2 rounded-lg border-2 transition-all text-left",
                  isSelected && "border-blue-500 bg-blue-50",
                  !isSelected && "border-slate-200 hover:border-slate-300",
                  !isSameMonth(day, currentMonth) && "opacity-40"
                )}
              >
                <div className={cn(
                  "text-sm font-medium mb-1",
                  isToday && "w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center",
                  !isToday && "text-slate-900"
                )}>
                  {format(day, 'd')}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 2).map((event, i) => (
                    <div
                      key={i}
                      className={cn(
                        "text-[10px] text-white px-1 py-0.5 rounded truncate",
                        eventTypeColors[event.event_type]
                      )}
                    >
                      {format(new Date(event.start_time), 'HH:mm')} {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-[10px] text-slate-500">
                      +{dayEvents.length - 2} mais
                    </div>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      </Card>

      {/* Events List for Selected Day */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">
          {format(selectedDate, "d 'de' MMMM", { locale: ptBR })}
        </h3>

        {selectedDayEvents.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500">Nenhum evento agendado</p>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedDayEvents.map((event) => (
              <motion.div
                key={event.id}
                whileHover={{ scale: 1.02 }}
                onClick={() => onEventClick(event)}
                className="bg-white border-2 border-slate-200 rounded-lg p-3 cursor-pointer hover:border-blue-300 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-1 h-full rounded-full shrink-0",
                    eventTypeColors[event.event_type]
                  )} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-slate-900 truncate">
                        {event.title}
                      </h4>
                      <Badge variant="outline" className="text-[10px]">
                        {eventTypeLabels[event.event_type]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Clock className="w-3 h-3" />
                      {format(new Date(event.start_time), 'HH:mm')} - {format(new Date(event.end_time), 'HH:mm')}
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                        <MapPin className="w-3 h-3" />
                        {event.location}
                      </div>
                    )}
                    {event.description && (
                      <p className="text-xs text-slate-600 mt-2 line-clamp-2">
                        {event.description}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}