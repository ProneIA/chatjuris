import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  startOfWeek,
  endOfWeek,
  isPast,
  isToday
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { DndContext, useDraggable, useDroppable } from "@dnd-kit/core";

const eventTypeColors = {
  meeting: "bg-blue-500",
  deadline: "bg-red-500",
  research: "bg-purple-500",
  hearing: "bg-orange-500",
  consultation: "bg-green-500",
  team_sync: "bg-indigo-500",
  personal: "bg-pink-500",
  task: "bg-amber-500",
  other: "bg-gray-500"
};

function DraggableEvent({ event, isDark }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: event.id,
    data: event
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.5 : 1,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "text-[10px] text-white px-1.5 py-0.5 rounded truncate cursor-move transition-opacity",
        eventTypeColors[event.event_type],
        event.status === 'completed' && "opacity-50 line-through",
        event.status === 'overdue' && "ring-2 ring-red-500"
      )}
    >
      {format(new Date(event.start_time), 'HH:mm')} {event.title}
    </div>
  );
}

function DroppableDay({ day, children, onDrop }) {
  const { setNodeRef, isOver } = useDroppable({
    id: day.toISOString(),
    data: { day }
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-[100px] p-2 rounded-lg border-2 transition-all",
        isOver && "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
      )}
    >
      {children}
    </div>
  );
}

export default function CalendarMonthView({ 
  events, 
  selectedDate, 
  onDateSelect, 
  onEventClick,
  onEventDrop,
  isDark 
}) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const allDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getEventsForDay = (day) => {
    return events.filter(event => 
      isSameDay(new Date(event.start_time), day)
    ).sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;
    
    const draggedEvent = events.find(e => e.id === active.id);
    const targetDay = new Date(over.id);
    
    if (draggedEvent && targetDay) {
      const eventDuration = new Date(draggedEvent.end_time) - new Date(draggedEvent.start_time);
      const newStart = new Date(targetDay);
      newStart.setHours(new Date(draggedEvent.start_time).getHours());
      newStart.setMinutes(new Date(draggedEvent.start_time).getMinutes());
      
      const newEnd = new Date(newStart.getTime() + eventDuration);
      
      onEventDrop(draggedEvent.id, newStart, newEnd);
    }
  };

  return (
    <div className={`rounded-xl border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}`}>
      {/* Month Navigation */}
      <div className="flex items-center justify-between p-4 border-b ${isDark ? 'border-neutral-800' : 'border-gray-200'}">
        <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR })}
        </h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              const newMonth = subMonths(currentMonth, 1);
              setCurrentMonth(newMonth);
              onDateSelect(newMonth);
            }}
            className={isDark ? 'border-neutral-800 text-white' : ''}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const today = new Date();
              setCurrentMonth(today);
              onDateSelect(today);
            }}
            className={isDark ? 'border-neutral-800 text-white' : ''}
          >
            Hoje
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              const newMonth = addMonths(currentMonth, 1);
              setCurrentMonth(newMonth);
              onDateSelect(newMonth);
            }}
            className={isDark ? 'border-neutral-800 text-white' : ''}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-neutral-800 border-b">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
          <div 
            key={day} 
            className={`text-center text-sm font-medium py-3 ${isDark ? 'bg-neutral-900 text-neutral-400' : 'bg-gray-50 text-gray-600'}`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid with Drag & Drop */}
      <DndContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-neutral-800">
          {allDays.map((day, idx) => {
            const dayEvents = getEventsForDay(day);
            const isSelected = isSameDay(day, selectedDate);
            const isDayToday = isToday(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isDayPast = isPast(day) && !isDayToday;

            return (
              <DroppableDay key={idx} day={day}>
                <div
                  className={cn(
                    "relative h-full",
                    isDark ? 'bg-neutral-900' : 'bg-white',
                    !isCurrentMonth && "opacity-40"
                  )}
                >
                  <button
                    onClick={() => onDateSelect(day)}
                    className={cn(
                      "w-full text-left p-2",
                      isSelected && (isDark ? "bg-neutral-800" : "bg-blue-50"),
                      isDayPast && !isSelected && "opacity-60"
                    )}
                  >
                    <div className={cn(
                      "text-sm font-medium mb-1 inline-flex items-center justify-center",
                      isDayToday && "w-7 h-7 bg-blue-600 text-white rounded-full",
                      !isDayToday && (isDark ? "text-white" : "text-gray-900")
                    )}>
                      {format(day, 'd')}
                    </div>
                  </button>

                  <div className="space-y-1 px-2 pb-2">
                    {dayEvents.slice(0, 3).map((event) => (
                      <div key={event.id} onClick={() => onEventClick(event)}>
                        <DraggableEvent event={event} isDark={isDark} />
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className={`text-[10px] ${isDark ? 'text-neutral-500' : 'text-gray-500'} flex items-center gap-1`}>
                        <MoreHorizontal className="w-3 h-3" />
                        +{dayEvents.length - 3} mais
                      </div>
                    )}
                  </div>
                </div>
              </DroppableDay>
            );
          })}
        </div>
      </DndContext>
    </div>
  );
}