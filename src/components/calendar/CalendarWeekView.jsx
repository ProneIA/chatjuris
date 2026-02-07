import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval,
  eachHourOfInterval,
  isSameDay,
  addWeeks,
  subWeeks,
  isToday,
  isSameHour,
  startOfDay
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { DndContext, useDraggable, useDroppable } from "@dnd-kit/core";

const eventTypeColors = {
  meeting: "bg-blue-500 border-blue-600",
  deadline: "bg-red-500 border-red-600",
  research: "bg-purple-500 border-purple-600",
  hearing: "bg-orange-500 border-orange-600",
  consultation: "bg-green-500 border-green-600",
  team_sync: "bg-indigo-500 border-indigo-600",
  personal: "bg-pink-500 border-pink-600",
  task: "bg-amber-500 border-amber-600",
  other: "bg-gray-500 border-gray-600"
};

function DraggableWeekEvent({ event, isDark }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: event.id,
    data: event
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.5 : 1,
  } : undefined;

  const startHour = new Date(event.start_time).getHours();
  const startMinutes = new Date(event.start_time).getMinutes();
  const endHour = new Date(event.end_time).getHours();
  const endMinutes = new Date(event.end_time).getMinutes();
  const durationHours = (endHour + endMinutes/60) - (startHour + startMinutes/60);
  const height = Math.max(durationHours * 60, 40); // min 40px

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, height: `${height}px` }}
      {...listeners}
      {...attributes}
      className={cn(
        "absolute left-0 right-0 mx-1 px-2 py-1 text-xs text-white rounded border-l-4 cursor-move overflow-hidden",
        eventTypeColors[event.event_type],
        event.status === 'completed' && "opacity-50",
        event.status === 'overdue' && "ring-2 ring-red-500"
      )}
    >
      <div className="font-semibold truncate">{event.title}</div>
      <div className="text-[10px] opacity-90">
        {format(new Date(event.start_time), 'HH:mm')} - {format(new Date(event.end_time), 'HH:mm')}
      </div>
    </div>
  );
}

function DroppableTimeSlot({ day, hour, children, onDrop }) {
  const slotId = `${day.toISOString()}-${hour}`;
  const { setNodeRef, isOver } = useDroppable({
    id: slotId,
    data: { day, hour }
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative h-[60px] border-b",
        isOver && "bg-blue-50 dark:bg-blue-900/20"
      )}
    >
      {children}
    </div>
  );
}

export default function CalendarWeekView({ 
  events, 
  selectedDate, 
  onDateSelect, 
  onEventClick,
  onEventDrop,
  isDark 
}) {
  const [currentWeek, setCurrentWeek] = useState(selectedDate);
  
  const weekStart = startOfWeek(currentWeek);
  const weekEnd = endOfWeek(currentWeek);
  const daysOfWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getEventsForDayAndHour = (day, hour) => {
    return events.filter(event => {
      const eventStart = new Date(event.start_time);
      return isSameDay(eventStart, day) && eventStart.getHours() === hour;
    });
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (!over) return;
    
    const [dayStr, hourStr] = over.id.split('-');
    const draggedEvent = events.find(e => e.id === active.id);
    
    if (draggedEvent && dayStr && hourStr) {
      const targetDay = new Date(dayStr);
      const targetHour = parseInt(hourStr);
      
      const eventDuration = new Date(draggedEvent.end_time) - new Date(draggedEvent.start_time);
      const newStart = new Date(targetDay);
      newStart.setHours(targetHour, 0, 0, 0);
      
      const newEnd = new Date(newStart.getTime() + eventDuration);
      
      onEventDrop(draggedEvent.id, newStart, newEnd);
    }
  };

  return (
    <div className={`rounded-xl border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}`}>
      {/* Week Navigation */}
      <div className={`flex items-center justify-between p-4 border-b ${isDark ? 'border-neutral-800' : 'border-gray-200'}`}>
        <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {format(weekStart, "d 'de' MMMM", { locale: ptBR })} - {format(weekEnd, "d 'de' MMMM", { locale: ptBR })}
        </h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              const newWeek = subWeeks(currentWeek, 1);
              setCurrentWeek(newWeek);
              onDateSelect(newWeek);
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
              setCurrentWeek(today);
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
              const newWeek = addWeeks(currentWeek, 1);
              setCurrentWeek(newWeek);
              onDateSelect(newWeek);
            }}
            className={isDark ? 'border-neutral-800 text-white' : ''}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Week Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Day Headers */}
          <div className="grid grid-cols-8 border-b ${isDark ? 'border-neutral-800' : 'border-gray-200'}">
            <div className={`p-3 text-sm font-medium ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
              Horário
            </div>
            {daysOfWeek.map(day => {
              const isDayToday = isToday(day);
              return (
                <div 
                  key={day.toISOString()} 
                  className={cn(
                    "p-3 text-center border-l",
                    isDark ? 'border-neutral-800' : 'border-gray-200',
                    isDayToday && (isDark ? 'bg-blue-900/20' : 'bg-blue-50')
                  )}
                >
                  <div className={`text-xs ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                    {format(day, 'EEE', { locale: ptBR })}
                  </div>
                  <div className={cn(
                    "text-lg font-semibold mt-1",
                    isDayToday ? "text-blue-600" : isDark ? "text-white" : "text-gray-900"
                  )}>
                    {format(day, 'd')}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Time Slots with Drag & Drop */}
          <DndContext onDragEnd={handleDragEnd}>
            <div className="relative">
              {hours.map(hour => (
                <div key={hour} className="grid grid-cols-8">
                  <div className={`p-3 text-xs ${isDark ? 'text-neutral-500 border-neutral-800' : 'text-gray-500 border-gray-200'} border-b text-right`}>
                    {String(hour).padStart(2, '0')}:00
                  </div>
                  {daysOfWeek.map(day => {
                    const dayEvents = getEventsForDayAndHour(day, hour);
                    return (
                      <DroppableTimeSlot key={`${day.toISOString()}-${hour}`} day={day} hour={hour}>
                        <div className={`border-l border-b ${isDark ? 'border-neutral-800' : 'border-gray-200'}`}>
                          {dayEvents.map(event => (
                            <div key={event.id} onClick={() => onEventClick(event)}>
                              <DraggableWeekEvent event={event} isDark={isDark} />
                            </div>
                          ))}
                        </div>
                      </DroppableTimeSlot>
                    );
                  })}
                </div>
              ))}
            </div>
          </DndContext>
        </div>
      </div>
    </div>
  );
}