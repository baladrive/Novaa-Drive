"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, X, LayoutDashboard, FolderOpen, Image, Music, Share2,
  Trash2, Settings, EyeOff, Star, Upload, Command, ArrowRight,
  FileText, Film, Archive, FileQuestion, Sparkles, ChevronRight
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { fileService, FileItem } from "../../services/fileService";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

const NAV_COMMANDS = [
  { label: "Dashboard",      path: "/",        icon: LayoutDashboard, group: "Navigate" },
  { label: "My Files",       path: "/files",   icon: FolderOpen,      group: "Navigate" },
  { label: "Photos",         path: "/photos",  icon: Image,           group: "Navigate" },
  { label: "Music",          path: "/music",   icon: Music,           group: "Navigate" },
  { label: "Shared Files",   path: "/sharing", icon: Share2,          group: "Navigate" },
  { label: "Trash Bin",      path: "/trash",   icon: Trash2,          group: "Navigate" },
  { label: "Private Vault",  path: "/hidden",  icon: EyeOff,          group: "Navigate" },
  { label: "Settings & Logs",path: "/profile", icon: Settings,        group: "Navigate" },
];

function FileCategoryIcon({ cat }: { cat: FileItem["file_category"] }) {
  const cls = "h-4 w-4";
  if (cat === "photo")    return <Image    className={`${cls} text-blue-400`} />;
  if (cat === "video")    return <Film     className={`${cls} text-rose-400`} />;
  if (cat === "audio")    return <Music    className={`${cls} text-emerald-400`} />;
  if (cat === "document") return <FileText className={`${cls} text-amber-400`} />;
  if (cat === "archive")  return <Archive  className={`${cls} text-purple-400`} />;
  return <FileQuestion className={`${cls} text-zinc-400`} />;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!user || !isOpen) return;
    fileService.getFiles(user.id, null).then(setFiles).catch(() => {});
  }, [user, isOpen]);

  const filteredNav = NAV_COMMANDS.filter(c =>
    !query || c.label.toLowerCase().includes(query.toLowerCase())
  );

  const filteredFiles = query.length > 1
    ? files.filter(f =>
        f.filename.toLowerCase().includes(query.toLowerCase()) ||
        f.tags.some(t => t.toLowerCase().includes(query.toLowerCase()))
      ).slice(0, 6)
    : [];

  const allResults = [
    ...filteredNav.map(n => ({ type: "nav" as const, ...n, id: n.path })),
    ...filteredFiles.map(f => ({ type: "file" as const, label: f.filename, id: f.id, file: f, group: "Files" })),
  ];

  useEffect(() => setActiveIdx(0), [query]);

  const handleSelect = useCallback((item: typeof allResults[number]) => {
    if (item.type === "nav") navigate(item.path);
    onClose();
  }, [navigate, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, allResults.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
    if (e.key === "Enter" && allResults[activeIdx]) handleSelect(allResults[activeIdx]);
    if (e.key === "Escape") onClose();
  };

  if (!isOpen) return null;

  const groups = Array.from(new Set(allResults.map(r => r.group)));

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center pt-[10vh] px-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm" />

      {/* Palette */}
      <div
        className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-zinc-800/80 bg-zinc-950/95 shadow-2xl backdrop-blur-xl animate-fade-up"
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-zinc-800/60 px-5 py-4">
          <Search className="h-4.5 w-4.5 text-zinc-500 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search files, navigate, run actions..."
            className="flex-1 bg-transparent text-sm text-white placeholder-zinc-600 outline-none font-medium"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-zinc-600 hover:text-zinc-400 transition-colors">
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden sm:flex items-center gap-1 rounded-md border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 text-[10px] text-zinc-500 font-mono">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto py-2">
          {allResults.length === 0 && (
            <div className="flex flex-col items-center py-10 gap-2">
              <Search className="h-8 w-8 text-zinc-700" />
              <p className="text-xs text-zinc-600 font-medium">No results for "{query}"</p>
            </div>
          )}

          {groups.map(group => {
            const items = allResults.filter(r => r.group === group);
            if (!items.length) return null;
            return (
              <div key={group} className="px-2 mb-2">
                <p className="px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.15em] text-zinc-600">{group}</p>
                {items.map((item) => {
                  const globalIdx = allResults.indexOf(item);
                  const isActive = globalIdx === activeIdx;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setActiveIdx(globalIdx)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer
                        ${isActive ? "bg-amber-500/10 text-white" : "text-zinc-400 hover:bg-zinc-900/60"}`}
                    >
                      <span className={`flex-shrink-0 flex h-7 w-7 items-center justify-center rounded-lg
                        ${isActive ? "bg-amber-500/20" : "bg-zinc-900"}`}>
                        {item.type === "nav"
                          ? <item.icon className="h-3.5 w-3.5 text-amber-400" />
                          : <FileCategoryIcon cat={item.file!.file_category} />}
                      </span>
                      <span className="flex-1 text-xs font-semibold truncate">{item.label}</span>
                      {isActive && <ChevronRight className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Footer hints */}
        <div className="border-t border-zinc-800/60 flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-4 text-[10px] text-zinc-600 font-medium">
            <span className="flex items-center gap-1.5"><kbd className="rounded bg-zinc-900 border border-zinc-800 px-1 font-mono">↑↓</kbd> Navigate</span>
            <span className="flex items-center gap-1.5"><kbd className="rounded bg-zinc-900 border border-zinc-800 px-1 font-mono">↵</kbd> Select</span>
          </div>
          <span className="flex items-center gap-1 text-[10px] text-zinc-700">
            <Sparkles className="h-3 w-3 text-amber-600" /> AI-powered search
          </span>
        </div>
      </div>
    </div>
  );
}
