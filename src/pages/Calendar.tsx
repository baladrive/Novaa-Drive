import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus, X, Clock } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { productivityService, CalendarEvent } from "../services/productivityService";

const eventColors = [
  { name: "Amber", value: "#f59e0b", bg: "bg-amber-500" },
  { name: "Blue", value: "#3b82f6", bg: "bg-blue-500" },
  { name: "Green", value: "#10b981", bg: "bg-emerald-500" },
  { name: "Rose", value: "#f43f5e", bg: "bg-rose-500" },
  { name: "Purple", value: "#8b5cf6", bg: "bg-purple-500" },
  { name: "Cyan", value: "#06b6d4", bg: "bg-cyan-500" },
];

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [time, setTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [eventColor, setEventColor] = useState(eventColors[0]);
  const [allDay, setAllDay] = useState(false);

  useEffect(() => {
    if (user) setEvents(productivityService.getEvents(user.id));
  }, [user]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return events.filter((e) => e.date === dateStr);
  };

  const handleDayClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSelectedDate(dateStr);
    setTitle("");
    setDescription("");
    setTime("09:00");
    setEndTime("10:00");
    setEventColor(eventColors[0]);
    setAllDay(false);
    setShowModal(true);
  };

  const handleCreate = () => {
    if (!user || !title.trim()) return;
    productivityService.createEvent(user.id, {
      title: title.trim(),
      description,
      date: selectedDate,
      time: allDay ? "All day" : time,
      endTime: allDay ? "All day" : endTime,
      color: eventColor.value,
      allDay,
      reminder: 30,
    });
    setEvents(productivityService.getEvents(user.id));
    setShowModal(false);
  };

  const handleDelete = (eventId: string) => {
    if (!user) return;
    productivityService.deleteEvent(user.id, eventId);
    setEvents(productivityService.getEvents(user.id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-black text-zinc-900 dark:text-white">Calendar</h1>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="rounded-xl p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">
            <ChevronLeft className="h-4 w-4 text-zinc-500" />
          </button>
          <h2 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 min-w-[140px] text-center">
            {monthNames[month]} {year}
          </h2>
          <button onClick={nextMonth} className="rounded-xl p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">
            <ChevronRight className="h-4 w-4 text-zinc-500" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {/* Day Headers */}
        <div className="grid grid-cols-7 bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
          {dayNames.map((d) => (
            <div key={d} className="p-3 text-center text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
              {d}
            </div>
          ))}
        </div>

        {/* Day Cells */}
        <div className="grid grid-cols-7">
          {/* Empty cells for days before the 1st */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[100px] border-r border-b border-zinc-100 dark:border-zinc-800/50 p-2" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayEvents = getEventsForDay(day);
            const isToday =
              new Date().getDate() === day &&
              new Date().getMonth() === month &&
              new Date().getFullYear() === year;

            return (
              <div
                key={day}
                onClick={() => handleDayClick(day)}
                className={`min-h-[100px] border-r border-b border-zinc-100 dark:border-zinc-800/50 p-2 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-all group`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full
                      ${isToday ? "bg-amber-500 text-slate-950" : "text-zinc-600 dark:text-zinc-400"}`}
                  >
                    {day}
                  </span>
                  <Plus className="h-3 w-3 text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center gap-1 rounded-md px-1.5 py-0.5"
                      style={{ backgroundColor: event.color + "20" }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: event.color }} />
                      <span className="text-[8px] font-bold truncate" style={{ color: event.color }}>
                        {event.title}
                      </span>
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <p className="text-[8px] text-zinc-400 font-bold px-1">+{dayEvents.length - 3} more</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming Events */}
      <div>
        <h3 className="text-sm font-black text-zinc-900 dark:text-white mb-3">Upcoming Events</h3>
        <div className="space-y-2">
          {events
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(0, 5)
            .map((event) => (
              <div key={event.id} className="flex items-center gap-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-3">
                <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: event.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">{event.title}</p>
                  <p className="text-[9px] text-zinc-500">
                    {new Date(event.date).toLocaleDateString()} · {event.time}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(event.id)}
                  className="rounded-lg p-1.5 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          {events.length === 0 && (
            <p className="text-xs text-zinc-400 text-center py-8">No upcoming events. Click a date to add one.</p>
          )}
        </div>
      </div>

      {/* Add Event Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/30 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-black text-zinc-900 dark:text-white">New Event</h2>
                <button onClick={() => setShowModal(false)} className="rounded-full p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">
                  <X className="h-4 w-4 text-zinc-500" />
                </button>
              </div>

              <p className="text-[10px] text-zinc-500 mb-3 font-medium">
                {new Date(selectedDate).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </p>

              <input
                type="text"
                placeholder="Event title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-4 py-2.5 text-sm font-bold text-zinc-900 dark:text-white outline-none focus:border-amber-500/50 mb-3"
                autoFocus
              />

              <textarea
                placeholder="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-4 py-2 text-[10px] text-zinc-700 dark:text-zinc-300 outline-none focus:border-amber-500/50 resize-none mb-3"
              />

              <div className="flex items-center gap-3 mb-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allDay}
                    onChange={(e) => setAllDay(e.target.checked)}
                    className="rounded border-zinc-300 text-amber-500 focus:ring-amber-500"
                  />
                  <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400">All day</span>
                </label>
              </div>

              {!allDay && (
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-[9px] font-bold text-zinc-500 mb-1 block">Start Time</label>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-zinc-400" />
                      <input
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-1.5 text-[10px] text-zinc-700 dark:text-zinc-300 outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-zinc-500 mb-1 block">End Time</label>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-zinc-400" />
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-1.5 text-[10px] text-zinc-700 dark:text-zinc-300 outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-4">
                <label className="text-[9px] font-bold text-zinc-500 mb-1 block">Color</label>
                <div className="flex gap-2">
                  {eventColors.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => setEventColor(c)}
                      className={`h-7 w-7 rounded-full transition-all cursor-pointer ${c.bg}
                        ${eventColor.name === c.name ? "ring-2 ring-offset-2 ring-amber-500 dark:ring-offset-zinc-950 scale-110" : ""}`}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>

              <button
                onClick={handleCreate}
                disabled={!title.trim()}
                className="w-full rounded-2xl bg-amber-500 py-2.5 text-xs font-black text-slate-950 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                Create Event
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}