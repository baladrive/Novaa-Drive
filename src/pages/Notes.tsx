import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Pin, Trash2, Edit3, Tag, Palette, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { productivityService, Note } from "../services/productivityService";

const noteColors = [
  { name: "Default", bg: "bg-zinc-50 dark:bg-zinc-900", border: "border-zinc-200 dark:border-zinc-800" },
  { name: "Yellow", bg: "bg-amber-50 dark:bg-amber-900/20", border: "border-amber-200 dark:border-amber-800" },
  { name: "Blue", bg: "bg-blue-50 dark:bg-blue-900/20", border: "border-blue-200 dark:border-blue-800" },
  { name: "Green", bg: "bg-emerald-50 dark:bg-emerald-900/20", border: "border-emerald-200 dark:border-emerald-800" },
  { name: "Rose", bg: "bg-rose-50 dark:bg-rose-900/20", border: "border-rose-200 dark:border-rose-800" },
  { name: "Purple", bg: "bg-purple-50 dark:bg-purple-900/20", border: "border-purple-200 dark:border-purple-800" },
];

export default function Notes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [search, setSearch] = useState("");
  const [showEditor, setShowEditor] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [color, setColor] = useState(noteColors[0]);
  const [tags, setTags] = useState("");

  useEffect(() => {
    if (user) setNotes(productivityService.getNotes(user.id));
  }, [user]);

  const filtered = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase()) ||
      n.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSave = () => {
    if (!user) return;
    const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean);

    if (editingNote) {
      productivityService.updateNote(user.id, editingNote.id, {
        title: title || "Untitled",
        content,
        color: color.name,
        tags: tagList,
      });
    } else {
      productivityService.createNote(user.id, {
        title: title || "Untitled",
        content,
        color: color.name,
        pinned: false,
        tags: tagList,
      });
    }

    setNotes(productivityService.getNotes(user.id));
    setShowEditor(false);
    setEditingNote(null);
    setTitle("");
    setContent("");
    setTags("");
    setColor(noteColors[0]);
  };

  const handleEdit = (note: Note) => {
    setEditingNote(note);
    setTitle(note.title);
    setContent(note.content);
    setTags(note.tags.join(", "));
    const c = noteColors.find((nc) => nc.name === note.color);
    if (c) setColor(c);
    setShowEditor(true);
  };

  const handleDelete = (noteId: string) => {
    if (!user) return;
    productivityService.deleteNote(user.id, noteId);
    setNotes(productivityService.getNotes(user.id));
  };

  const togglePin = (noteId: string) => {
    if (!user) return;
    const note = notes.find((n) => n.id === noteId);
    if (note) {
      productivityService.updateNote(user.id, noteId, { pinned: !note.pinned });
      setNotes(productivityService.getNotes(user.id));
    }
  };

  const sorted = [...filtered].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-black text-zinc-900 dark:text-white">Notes</h1>
          <p className="text-xs text-zinc-500 mt-0.5">{notes.length} notes</p>
        </div>
        <button
          onClick={() => {
            setEditingNote(null);
            setTitle("");
            setContent("");
            setTags("");
            setColor(noteColors[0]);
            setShowEditor(true);
          }}
          className="flex items-center gap-1.5 rounded-2xl bg-amber-500 px-4 py-2 text-xs font-black text-slate-950 hover:bg-amber-600 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          New Note
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <input
          type="text"
          placeholder="Search notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-2.5 pl-10 pr-4 text-xs text-zinc-800 dark:text-zinc-200 outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all"
        />
      </div>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {sorted.map((note) => {
            const nc = noteColors.find((c) => c.name === note.color) || noteColors[0];
            return (
              <motion.div
                key={note.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`group relative rounded-2xl border ${nc.border} ${nc.bg} p-5 cursor-pointer hover:shadow-lg transition-all`}
                onClick={() => handleEdit(note)}
              >
                {note.pinned && (
                  <div className="absolute top-2 right-2">
                    <Pin className="h-3.5 w-3.5 text-amber-500" />
                  </div>
                )}
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white pr-6 truncate">{note.title || "Untitled"}</h3>
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 line-clamp-4 whitespace-pre-wrap">
                  {note.content || "No content"}
                </p>
                {note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {note.tags.map((tag) => (
                      <span key={tag} className="rounded-lg bg-zinc-200/50 dark:bg-zinc-800/50 px-2 py-0.5 text-[9px] font-bold text-zinc-600 dark:text-zinc-400">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); togglePin(note.id); }}
                    className="rounded-lg p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 cursor-pointer"
                  >
                    <Pin className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(note.id); }}
                    className="rounded-lg p-1.5 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="mt-2 text-[9px] text-zinc-400">
                  {new Date(note.updatedAt).toLocaleDateString()}
                </p>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {sorted.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20">
          <Edit3 className="h-12 w-12 text-zinc-300 dark:text-zinc-700" />
          <h3 className="mt-4 text-sm font-bold text-zinc-500 dark:text-zinc-400">No notes yet</h3>
          <p className="mt-1 text-xs text-zinc-400">Click "New Note" to create your first one</p>
        </div>
      )}

      {/* Editor Modal */}
      <AnimatePresence>
        {showEditor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/30 backdrop-blur-sm"
            onClick={() => setShowEditor(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-lg rounded-3xl border ${color.border} ${color.bg} p-6 shadow-2xl`}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-black text-zinc-900 dark:text-white">
                  {editingNote ? "Edit Note" : "New Note"}
                </h2>
                <button
                  onClick={() => setShowEditor(false)}
                  className="rounded-full p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  <X className="h-4 w-4 text-zinc-500" />
                </button>
              </div>

              <input
                type="text"
                placeholder="Note title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm font-bold text-zinc-900 dark:text-white outline-none focus:border-amber-500/50 mb-3"
              />

              <textarea
                placeholder="Write your note..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2.5 text-xs text-zinc-700 dark:text-zinc-300 outline-none focus:border-amber-500/50 resize-none"
              />

              <div className="flex items-center gap-2 mt-3">
                <Tag className="h-3.5 w-3.5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Tags (comma separated)"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 text-[10px] text-zinc-700 dark:text-zinc-300 outline-none focus:border-amber-500/50"
                />
              </div>

              {/* Color Picker */}
              <div className="flex items-center gap-2 mt-3">
                <Palette className="h-3.5 w-3.5 text-zinc-400" />
                <div className="flex gap-1.5">
                  {noteColors.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => setColor(c)}
                      className={`h-6 w-6 rounded-full border-2 transition-all cursor-pointer
                        ${color.name === c.name ? "border-amber-500 scale-110" : "border-transparent"}
                        ${c.name === "Default" ? "bg-zinc-200 dark:bg-zinc-700" : c.bg.split(" ")[0]}`}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>

              <button
                onClick={handleSave}
                className="w-full mt-4 rounded-2xl bg-amber-500 py-2.5 text-xs font-black text-slate-950 hover:bg-amber-600 transition-all cursor-pointer"
              >
                {editingNote ? "Update Note" : "Create Note"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}