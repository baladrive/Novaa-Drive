import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Bell, Trash2, CheckCircle2, Clock, X, AlertTriangle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { productivityService, Reminder } from "../services/productivityService";

const priorities = [
  { value: "low" as const, label: "Low", color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { value: "medium" as const, label: "Medium", color: "text-amber-500", bg: "bg-amber-500/10" },
  { value: "high" as const, label: "High", color: "text-rose-500", bg: "bg-rose-500/10" },
];

const categories = ["General", "Work", "Personal", "Health", "Finance", "Events"];

export default function RemindersPage() {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("12:00");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [category, setCategory] = useState("General");

  useEffect(() => {
    if (user) setReminders(productivityService.getReminders(user.id));
  }, [user]);

  const active = reminders.filter((r) => !r.completed);
  const completed = reminders.filter((r) => r.completed);

  const handleCreate = () => {
    if (!user || !title.trim()) return;
    productivityService.createReminder(user.id, {
      title: title.trim(),
      description,
      dueAt: `${dueDate}T${dueTime}`,
      completed: false,
      priority,
      category,
    });
    setReminders(productivityService.getReminders(user.id));
    setTitle("");
    setDescription("");
    setDueDate("");
    setDueTime("12:00");
    setPriority("medium");
    setCategory("General");
    setShowNew(false);
  };

  const handleComplete = (reminderId: string) => {
    if (!user) return;
    productivityService.completeReminder(user.id, reminderId);
    setReminders(productivityService.getReminders(user.id));
  };

  const handleDelete = (reminderId: string) => {
    if (!user) return;
    productivityService.deleteReminder(user.id, reminderId);
    setReminders(productivityService.getReminders(user.id));
  };

  const isOverdue = (dueAt: string) => {
    return new Date(dueAt) < new Date();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-black text-zinc-900 dark:text-white">Reminders</h1>
          <p className="text-xs text-zinc-500 mt-0.5">{active.length} active · {completed.length} completed</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-1.5 rounded-2xl bg-amber-500 px-4 py-2 text-xs font-black text-slate-950 hover:bg-amber-600 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          New Reminder
        </button>
      </div>

      {/* Active Reminders */}
      <div className="space-y-2">
        <h2 className="text-xs font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Active</h2>
        <AnimatePresence mode="popLayout">
          {active.map((reminder) => {
            const pri = priorities.find((p) => p.value === reminder.priority) || priorities[1];
            const overdue = isOverdue(reminder.dueAt);
            return (
              <motion.div
                key={reminder.id}
                layout
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="group flex items-center gap-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 hover:shadow-md transition-all"
              >
                <button
                  onClick={() => handleComplete(reminder.id)}
                  className="flex-shrink-0 cursor-pointer"
                >
                  <CheckCircle2 className="h-5 w-5 text-zinc-300 hover:text-emerald-500 transition-colors" />
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-zinc-900 dark:text-white">{reminder.title}</p>
                    {overdue && (
                      <span className="flex items-center gap-1 rounded-lg bg-rose-500/10 px-2 py-0.5 text-[8px] font-bold text-rose-500">
                        <AlertTriangle className="h-3 w-3" />
                        Overdue
                      </span>
                    )}
                  </div>
                  {reminder.description && (
                    <p className="text-[10px] text-zinc-500 mt-0.5">{reminder.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`rounded-lg ${pri.bg} ${pri.color} px-2 py-0.5 text-[8px] font-bold`}>
                      {pri.label}
                    </span>
                    <span className="rounded-lg bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[8px] font-bold text-zinc-500">
                      {reminder.category}
                    </span>
                    <span className="flex items-center gap-1 text-[8px] text-zinc-400">
                      <Clock className="h-3 w-3" />
                      {new Date(reminder.dueAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(reminder.id)}
                  className="opacity-0 group-hover:opacity-100 rounded-lg p-1.5 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500 transition-all cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Completed Reminders */}
      {completed.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-black text-zinc-500 uppercase tracking-wider">Completed</h2>
          {completed.map((reminder) => (
            <div key={reminder.id} className="flex items-center gap-4 rounded-2xl border border-zinc-100 dark:border-zinc-800/50 bg-zinc-50 dark:bg-zinc-900/50 p-4 opacity-60">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-zinc-500 line-through">{reminder.title}</p>
              </div>
              <button
                onClick={() => handleDelete(reminder.id)}
                className="rounded-lg p-1.5 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500 transition-all cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {reminders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20">
          <Bell className="h-12 w-12 text-zinc-300 dark:text-zinc-700" />
          <h3 className="mt-4 text-sm font-bold text-zinc-500">No reminders</h3>
          <p className="mt-1 text-xs text-zinc-400">Create a reminder to never miss important tasks</p>
        </div>
      )}

      {/* New Reminder Modal */}
      <AnimatePresence>
        {showNew && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/30 backdrop-blur-sm"
            onClick={() => setShowNew(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-black text-zinc-900 dark:text-white">New Reminder</h2>
                <button onClick={() => setShowNew(false)} className="rounded-full p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">
                  <X className="h-4 w-4 text-zinc-500" />
                </button>
              </div>

              <input
                type="text"
                placeholder="Reminder title"
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

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-[9px] font-bold text-zinc-500 mb-1 block">Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-1.5 text-[10px] text-zinc-700 dark:text-zinc-300 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-zinc-500 mb-1 block">Time</label>
                  <input
                    type="time"
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-1.5 text-[10px] text-zinc-700 dark:text-zinc-300 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-[9px] font-bold text-zinc-500 mb-1 block">Priority</label>
                  <div className="flex gap-1.5">
                    {priorities.map((p) => (
                      <button
                        key={p.value}
                        onClick={() => setPriority(p.value)}
                        className={`flex-1 rounded-xl py-1.5 text-[8px] font-bold transition-all cursor-pointer
                          ${priority === p.value ? `${p.bg} ${p.color} border border-current` : "bg-zinc-100 dark:bg-zinc-900 text-zinc-500"}`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-zinc-500 mb-1 block">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-1.5 text-[10px] font-bold text-zinc-700 dark:text-zinc-300 outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={handleCreate}
                disabled={!title.trim() || !dueDate}
                className="w-full rounded-2xl bg-amber-500 py-2.5 text-xs font-black text-slate-950 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                Create Reminder
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}