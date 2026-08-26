"use client";
import React, { useState, useEffect, useRef } from "react";
import { Clock, StickyNote, Keyboard, ChevronDown, ChevronUp, X, Plus } from "lucide-react";

// ── Clock Widget ────────────────────────────────────────────────────────────
function ClockWidget() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const h  = now.getHours();
  const m  = String(now.getMinutes()).padStart(2, "0");
  const s  = String(now.getSeconds()).padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = String(h % 12 || 12).padStart(2, "0");
  const dateStr = now.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="rounded-3xl border border-zinc-150/70 bg-white/70 dark:border-zinc-900/50 dark:bg-zinc-950/60 backdrop-blur-md p-5 flex flex-col gap-2 h-full">
      <div className="flex items-center gap-2 mb-1">
        <Clock className="h-3.5 w-3.5 text-amber-500" />
        <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Live Clock</span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-black text-zinc-900 dark:text-white tabular-nums leading-none tracking-tight">
          {h12}:{m}
        </span>
        <span className="text-lg font-black text-zinc-500 tabular-nums leading-none">:{s}</span>
        <span className="text-xs font-black text-amber-500 leading-none ml-1">{ampm}</span>
      </div>
      <p className="text-[10px] font-semibold text-zinc-500 leading-snug">{dateStr}</p>
    </div>
  );
}

// ── Sticky Notes Widget ─────────────────────────────────────────────────────
function StickyNotesWidget() {
  const [notes, setNotes] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("dash_sticky_notes") || '[""]'); }
    catch { return [""]; }
  });
  const [active, setActive] = useState(0);

  const update = (idx: number, val: string) => {
    const n = [...notes];
    n[idx] = val;
    setNotes(n);
    try { localStorage.setItem("dash_sticky_notes", JSON.stringify(n)); } catch {}
  };

  const addNote = () => { setNotes(p => { const n = [...p, ""]; localStorage.setItem("dash_sticky_notes", JSON.stringify(n)); return n; }); setActive(notes.length); };
  const removeNote = (idx: number) => {
    const n = notes.filter((_, i) => i !== idx);
    const safe = n.length ? n : [""];
    setNotes(safe);
    setActive(Math.max(0, active - 1));
    try { localStorage.setItem("dash_sticky_notes", JSON.stringify(safe)); } catch {}
  };

  return (
    <div className="rounded-3xl border border-yellow-400/20 bg-yellow-50/80 dark:border-yellow-600/10 dark:bg-yellow-950/20 backdrop-blur-md p-5 flex flex-col gap-3 h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StickyNote className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-400" />
          <span className="text-[10px] font-black uppercase tracking-wider text-yellow-700 dark:text-yellow-400">Sticky Notes</span>
        </div>
        <div className="flex items-center gap-1">
          {notes.map((_, i) => (
            <button key={i} onClick={() => setActive(i)}
              className={`h-2 w-2 rounded-full transition-all ${i === active ? "bg-yellow-500 scale-125" : "bg-yellow-300 dark:bg-yellow-800"}`} />
          ))}
          <button onClick={addNote} className="ml-2 text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-200">
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="relative flex-1">
        <textarea
          value={notes[active] || ""}
          onChange={e => update(active, e.target.value)}
          placeholder="Write a note..."
          className="w-full h-24 resize-none bg-transparent text-xs font-medium text-yellow-900 dark:text-yellow-100 placeholder-yellow-400 dark:placeholder-yellow-700 outline-none leading-relaxed"
        />
        {notes.length > 1 && (
          <button onClick={() => removeNote(active)} className="absolute top-0 right-0 text-yellow-400 hover:text-red-500 transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <p className="text-[9px] text-yellow-600/70 dark:text-yellow-700 font-medium">Auto-saved to browser storage</p>
    </div>
  );
}

// ── Keyboard Shortcuts Widget ────────────────────────────────────────────────
const SHORTCUTS = [
  { key: "Ctrl+K",  desc: "Open Command Palette" },
  { key: "Ctrl+U",  desc: "Upload Files" },
  { key: "?",       desc: "Show Shortcuts" },
  { key: "Del",     desc: "Trash selected file" },
  { key: "F2",      desc: "Rename file" },
  { key: "Ctrl+A",  desc: "Select all files" },
  { key: "Esc",     desc: "Close panel / deselect" },
  { key: "Ctrl+S",  desc: "Star / unstar file" },
];

function ShortcutsWidget() {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? SHORTCUTS : SHORTCUTS.slice(0, 4);

  return (
    <div className="rounded-3xl border border-zinc-150/70 bg-white/70 dark:border-zinc-900/50 dark:bg-zinc-950/60 backdrop-blur-md p-5 flex flex-col gap-3 h-full">
      <div className="flex items-center gap-2">
        <Keyboard className="h-3.5 w-3.5 text-violet-500" />
        <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Keyboard Shortcuts</span>
      </div>
      <div className="space-y-1.5">
        {shown.map(s => (
          <div key={s.key} className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-600 dark:text-zinc-400 font-medium">{s.desc}</span>
            <kbd className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 px-1.5 py-0.5 text-[9px] text-zinc-600 dark:text-zinc-400 font-mono">{s.key}</kbd>
          </div>
        ))}
      </div>
      <button onClick={() => setExpanded(p => !p)} className="flex items-center gap-1 text-[10px] text-amber-500 font-bold hover:underline">
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        {expanded ? "Show less" : `+${SHORTCUTS.length - 4} more`}
      </button>
    </div>
  );
}

// ── Composed export ──────────────────────────────────────────────────────────
export default function MiniWidgets() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <ClockWidget />
      <StickyNotesWidget />
      <ShortcutsWidget />
    </div>
  );
}
