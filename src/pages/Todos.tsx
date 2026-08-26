import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, CheckCircle2, Circle, Trash2, Calendar, Flag, X, Search } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { productivityService, TodoItem } from "../services/productivityService";

const priorities = [
  { value: "low" as const, label: "Low", color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { value: "medium" as const, label: "Medium", color: "text-amber-500", bg: "bg-amber-500/10" },
  { value: "high" as const, label: "High", color: "text-rose-500", bg: "bg-rose-500/10" },
];

const categories = ["General", "Work", "Personal", "Study", "Health", "Finance"];

export default function Todos() {
  const { user } = useAuth();
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [search, setSearch] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [text, setText] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [category, setCategory] = useState("General");
  const [dueDate, setDueDate] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");

  useEffect(() => {
    if (user) setTodos(productivityService.getTodos(user.id));
  }, [user]);

  const filtered = todos.filter((t) => {
    const matchesSearch = t.text.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === "all" ? true : filter === "active" ? !t.completed : t.completed;
    return matchesSearch && matchesFilter;
  });

  const handleCreate = () => {
    if (!user || !text.trim()) return;
    productivityService.createTodo(user.id, {
      text: text.trim(),
      completed: false,
      priority,
      dueDate: dueDate || null,
      category,
    });
    setTodos(productivityService.getTodos(user.id));
    setText("");
    setPriority("medium");
    setCategory("General");
    setDueDate("");
    setShowNew(false);
  };

  const handleToggle = (todoId: string) => {
    if (!user) return;
    productivityService.toggleTodo(user.id, todoId);
    setTodos(productivityService.getTodos(user.id));
  };

  const handleDelete = (todoId: string) => {
    if (!user) return;
    productivityService.deleteTodo(user.id, todoId);
    setTodos(productivityService.getTodos(user.id));
  };

  const stats = {
    total: todos.length,
    completed: todos.filter((t) => t.completed).length,
    active: todos.filter((t) => !t.completed).length,
    high: todos.filter((t) => t.priority === "high" && !t.completed).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-black text-zinc-900 dark:text-white">To-Do List</h1>
          <p className="text-xs text-zinc-500 mt-0.5">{stats.active} active · {stats.completed} completed</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-1.5 rounded-2xl bg-amber-500 px-4 py-2 text-xs font-black text-slate-950 hover:bg-amber-600 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Add Task
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total", value: stats.total, color: "text-zinc-900 dark:text-white", bg: "bg-zinc-100 dark:bg-zinc-900" },
          { label: "Active", value: stats.active, color: "text-amber-500", bg: "bg-amber-500/10" },
          { label: "Done", value: stats.completed, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: "High Priority", value: stats.high, color: "text-rose-500", bg: "bg-rose-500/10" },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl ${s.bg} p-4 text-center`}>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-[9px] font-bold text-zinc-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-2.5 pl-10 pr-4 text-xs outline-none focus:border-amber-500/50"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "active", "completed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-2xl px-4 py-2 text-[10px] font-bold transition-all cursor-pointer capitalize
                ${filter === f ? "bg-amber-500 text-slate-950" : "bg-zinc-100 dark:bg-zinc-900 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800"}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Todo List */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {filtered.map((todo) => {
            const pri = priorities.find((p) => p.value === todo.priority) || priorities[1];
            return (
              <motion.div
                key={todo.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={`group flex items-center gap-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 transition-all
                  ${todo.completed ? "bg-zinc-50 dark:bg-zinc-900/50 opacity-60" : "bg-white dark:bg-zinc-900 hover:shadow-md"}`}
              >
                <button
                  onClick={() => handleToggle(todo.id)}
                  className="flex-shrink-0 cursor-pointer"
                >
                  {todo.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <Circle className="h-5 w-5 text-zinc-400 hover:text-amber-500 transition-colors" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold ${todo.completed ? "line-through text-zinc-400" : "text-zinc-900 dark:text-white"}`}>
                    {todo.text}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`rounded-lg ${pri.bg} ${pri.color} px-2 py-0.5 text-[9px] font-bold`}>
                      {pri.label}
                    </span>
                    <span className="rounded-lg bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[9px] font-bold text-zinc-500">
                      {todo.category}
                    </span>
                    {todo.dueDate && (
                      <span className="flex items-center gap-1 text-[9px] text-zinc-400">
                        <Calendar className="h-3 w-3" />
                        {new Date(todo.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(todo.id)}
                  className="opacity-0 group-hover:opacity-100 rounded-lg p-1.5 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500 transition-all cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20">
          <CheckCircle2 className="h-12 w-12 text-zinc-300 dark:text-zinc-700" />
          <h3 className="mt-4 text-sm font-bold text-zinc-500">No tasks found</h3>
          <p className="mt-1 text-xs text-zinc-400">
            {search ? "Try a different search" : "Add a new task to get started"}
          </p>
        </div>
      )}

      {/* New Todo Modal */}
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
                <h2 className="text-sm font-black text-zinc-900 dark:text-white">New Task</h2>
                <button onClick={() => setShowNew(false)} className="rounded-full p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">
                  <X className="h-4 w-4 text-zinc-500" />
                </button>
              </div>

              <input
                type="text"
                placeholder="What needs to be done?"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-4 py-2.5 text-sm font-bold text-zinc-900 dark:text-white outline-none focus:border-amber-500/50 mb-3"
                autoFocus
              />

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-[9px] font-bold text-zinc-500 mb-1 block">Priority</label>
                  <div className="flex gap-1.5">
                    {priorities.map((p) => (
                      <button
                        key={p.value}
                        onClick={() => setPriority(p.value)}
                        className={`flex-1 rounded-xl py-1.5 text-[9px] font-bold transition-all cursor-pointer
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

              <div className="mb-4">
                <label className="text-[9px] font-bold text-zinc-500 mb-1 block">Due Date (optional)</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-1.5 text-[10px] text-zinc-700 dark:text-zinc-300 outline-none"
                />
              </div>

              <button
                onClick={handleCreate}
                disabled={!text.trim()}
                className="w-full rounded-2xl bg-amber-500 py-2.5 text-xs font-black text-slate-950 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                Add Task
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}