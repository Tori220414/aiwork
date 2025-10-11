import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

interface Task {
  _id: string;
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  dueDate?: string;
  createdAt?: string;
}

interface Event {
  _id: string;
  id: string;
  title: string;
  description?: string;
  event_type: string;
  start_time: string;
  end_time?: string;
  all_day: boolean;
  color?: string;
  location?: string;
}

interface CalendarViewProps {
  tasks: Task[];
  events?: Event[];
  primaryColor?: string;
  onAddEvent?: (date: Date) => void;
  onEventClick?: (event: Event) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({
  tasks,
  events = [],
  primaryColor = '#3b82f6',
  onAddEvent,
  onEventClick
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const firstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getTasksForDate = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    return tasks.filter(task => {
      if (task.dueDate) {
        const taskDate = task.dueDate.split('T')[0];
        return taskDate === dateStr;
      }
      // Fallback to createdAt if no dueDate
      if (task.createdAt) {
        const taskDate = task.createdAt.split('T')[0];
        return taskDate === dateStr;
      }
      return false;
    });
  };

  const getEventsForDate = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    return events.filter(event => {
      const eventDate = event.start_time.split('T')[0];
      return eventDate === dateStr;
    });
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const renderCalendar = () => {
    const days = daysInMonth(currentDate);
    const firstDay = firstDayOfMonth(currentDate);
    const cells = [];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      cells.push(
        <div key={`empty-${i}`} className="bg-gray-50 p-2 min-h-[120px] border border-gray-200" />
      );
    }

    // Days of the month
    for (let day = 1; day <= days; day++) {
      const dayTasks = getTasksForDate(day);
      const dayEvents = getEventsForDate(day);
      const today = isToday(day);
      const totalItems = dayTasks.length + dayEvents.length;

      cells.push(
        <div
          key={day}
          className={`bg-white p-2 min-h-[120px] border border-gray-200 hover:bg-gray-50 transition-colors ${
            today ? 'ring-2 ring-primary-500' : ''
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span
              className={`text-sm font-medium ${
                today
                  ? 'bg-primary-500 text-white px-2 py-1 rounded-full'
                  : 'text-gray-700'
              }`}
            >
              {day}
            </span>
            <div className="flex items-center space-x-2">
              {totalItems > 0 && (
                <span className="text-xs text-gray-500">
                  {totalItems}
                </span>
              )}
              {onAddEvent && (
                <button
                  onClick={() => onAddEvent(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
                  className="p-1 hover:bg-primary-100 rounded transition-colors"
                  title="Add event"
                >
                  <Plus className="w-3 h-3 text-primary-600" />
                </button>
              )}
            </div>
          </div>

          <div className="space-y-1">
            {/* Events */}
            {dayEvents.slice(0, 2).map((event) => (
              <div
                key={event._id || event.id}
                onClick={() => onEventClick && onEventClick(event)}
                className="text-xs p-1.5 rounded truncate cursor-pointer"
                style={{
                  backgroundColor: event.color ? `${event.color}20` : '#3b82f620',
                  borderLeft: `3px solid ${event.color || '#3b82f6'}`
                }}
                title={event.title}
              >
                <div className="flex items-center space-x-1">
                  <span className="truncate font-medium">{event.title}</span>
                </div>
              </div>
            ))}

            {/* Tasks */}
            {dayTasks.slice(0, 2 - Math.min(2, dayEvents.length)).map((task) => (
              <div
                key={task._id || task.id}
                className={`text-xs p-1.5 rounded truncate cursor-pointer ${
                  task.status === 'completed'
                    ? 'bg-green-100 text-green-700'
                    : task.priority === 'urgent'
                    ? 'bg-red-100 text-red-700'
                    : task.priority === 'high'
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-blue-100 text-blue-700'
                }`}
                title={task.title}
              >
                <div className="flex items-center space-x-1">
                  <div
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor:
                        task.status === 'completed'
                          ? '#10b981'
                          : task.priority === 'urgent'
                          ? '#ef4444'
                          : task.priority === 'high'
                          ? '#f97316'
                          : primaryColor,
                    }}
                  />
                  <span className="truncate">{task.title}</span>
                </div>
              </div>
            ))}
            {totalItems > 3 && (
              <div className="text-xs text-gray-500 text-center py-1">
                +{totalItems - 3} more
              </div>
            )}
          </div>
        </div>
      );
    }

    return cells;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Today
          </button>
          <button
            onClick={previousMonth}
            className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextMonth}
            className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Day Names */}
      <div className="grid grid-cols-7 bg-gray-50">
        {dayNames.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-sm font-medium text-gray-700 border border-gray-200"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {renderCalendar()}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center space-x-4 p-4 border-t border-gray-200 text-xs text-gray-600">
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>Completed</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span>Urgent</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded-full bg-orange-500" />
          <span>High Priority</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: primaryColor }} />
          <span>Normal</span>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
