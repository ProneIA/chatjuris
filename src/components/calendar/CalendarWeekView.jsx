import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval,
  isSameDay,
  addWeeks,
  subWeeks,
  isToday
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

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

function WeekEventCard({ event, isDark, onClick }) {
  const startHour = new Date(event.start_time).getHours();
  const startMinutes = new Date(event.start_time).getMinutes();
  const endHour = new Date(event.end_time).getHours();
  const endMinutes = new Date(event.end_time).getMinutes();
  const durationHours = (endHour + endMinutes/60) - (startHour + startMinutes/60);
  const height = Math.max(durationHours * 60, 40);

  return (
    <button
      onClick={onClick}
      style={{ height: `${height}px` }}
      className={cn(
        "absolute left-0 right-0 mx-1 px-2 py-1 text-xs text-white rounded border-l-4 cursor-pointer hover:opacity-80 transition-opacity overflow-hidden",
        eventTypeColors[event.event_type],
        event.status === 'completed' && "opacity-50",
        event.status === 'overdue' && "ring-2 ring-red-500"
      )}
    >
      <div className="font-semibold truncate">{event.title}</div>
      <div className="text-[10px] opacity-90">
        {format(new Date(event.start_time), 'HH:mm')} - {format(new Date(event.end_time), 'HH:mm')}
      </div>
    </button>
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

          {/* Time Slots */}
          <div className="relative">
            {hours.map(hour => (
              <div key={hour} className="grid grid-cols-8">
                <div className={`p-3 text-xs ${isDark ? 'text-neutral-500 border-neutral-800' : 'text-gray-500 border-gray-200'} border-b text-right`}>
                  {String(hour).padStart(2, '0')}:00
                </div>
                {daysOfWeek.map(day => {
                  const dayEvents = getEventsForDayAndHour(day, hour);
                  return (
                    <div key={`${day.toISOString()}-${hour}`} className="relative h-[60px]">
                      <div className={`h-full border-l border-b ${isDark ? 'border-neutral-800' : 'border-gray-200'}`}>
                        {dayEvents.map(event => (
                          <WeekEventCard 
                            key={event.id} 
                            event={event} 
                            isDark={isDark}
                            onClick={() => onEventClick(event)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}