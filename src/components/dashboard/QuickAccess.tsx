"use client";
import React from "react";
import { Link } from "react-router-dom";
import { Image, Music, FileText, Film, Share2, Trash2, EyeOff, FolderOpen, Star, Archive } from "lucide-react";

const TILES = [
  { label: "Photos",        path: "/photos",  icon: Image,    color: "from-blue-500 to-cyan-400",      bg: "bg-blue-500/10",    text: "text-blue-500" },
  { label: "Music",         path: "/music",   icon: Music,    color: "from-emerald-500 to-teal-400",   bg: "bg-emerald-500/10", text: "text-emerald-500" },
  { label: "Documents",     path: "/files",   icon: FileText, color: "from-amber-500 to-yellow-400",   bg: "bg-amber-500/10",   text: "text-amber-500" },
  { label: "Videos",        path: "/files",   icon: Film,     color: "from-rose-500 to-red-400",       bg: "bg-rose-500/10",    text: "text-rose-500" },
  { label: "All Files",     path: "/files",   icon: FolderOpen,color:"from-violet-500 to-purple-400",  bg: "bg-violet-500/10",  text: "text-violet-500" },
  { label: "Shared",        path: "/sharing", icon: Share2,   color: "from-purple-500 to-indigo-400",  bg: "bg-purple-500/10",  text: "text-purple-500" },
  { label: "Private Vault", path: "/hidden",  icon: EyeOff,   color: "from-zinc-600 to-zinc-500",      bg: "bg-zinc-500/10",    text: "text-zinc-500" },
  { label: "Trash Bin",     path: "/trash",   icon: Trash2,   color: "from-red-500 to-rose-400",       bg: "bg-red-500/10",     text: "text-red-500" },
];

interface QuickAccessProps {
  categoryBreakdown: Record<string, number>;
}

function formatSize(bytes: number) {
  if (bytes === 0) return "Empty";
  const k = 1024, s = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + s[i];
}

const CAT_MAP: Record<string, string> = {
  "Photos": "photo", "Music": "audio", "Documents": "document",
  "Videos": "video", "All Files": "", "Shared": "", "Private Vault": "", "Trash Bin": ""
};

export default function QuickAccess({ categoryBreakdown }: QuickAccessProps) {
  return (
    <div className="rounded-3xl border border-zinc-150/70 bg-white/70 dark:border-zinc-900/50 dark:bg-zinc-950/60 backdrop-blur-md p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-xs font-black text-zinc-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <FolderOpen className="h-4 w-4 text-amber-500" />
          Quick Access
        </h3>
        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">8 shortcuts</span>
      </div>

      <div className="grid grid-cols-4 gap-3 sm:grid-cols-4 md:grid-cols-8">
        {TILES.map(tile => {
          const Icon = tile.icon;
          const catKey = CAT_MAP[tile.label];
          const sizeBytes = catKey ? (categoryBreakdown[catKey] || 0) : 0;
          const sub = catKey ? formatSize(sizeBytes) : "";
          return (
            <Link
              key={tile.label}
              to={tile.path}
              className="group flex flex-col items-center gap-2 rounded-2xl p-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 transition-all hover:-translate-y-0.5 cursor-pointer"
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tile.bg} group-hover:scale-110 transition-transform`}>
                <Icon className={`h-5.5 w-5.5 ${tile.text}`} />
              </div>
              <span className="text-[10px] font-black text-zinc-700 dark:text-zinc-300 text-center leading-tight">{tile.label}</span>
              {sub && <span className="text-[8px] text-zinc-400 font-medium">{sub}</span>}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
