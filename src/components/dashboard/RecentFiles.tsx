"use client";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Clock, Star, Share2, Trash2, Pin, FileText, Image, Music,
  Film, Archive, FileQuestion, Eye, ArrowRight, RotateCcw, EyeOff
} from "lucide-react";
import { FileItem } from "../../services/fileService";

interface RecentFilesProps {
  recentFiles: FileItem[];
  starredFiles: FileItem[];
  sharedFiles: FileItem[];
  trashedFiles: FileItem[];
  loading: boolean;
  onPreview: (file: FileItem) => void;
}

type Tab = "recent" | "starred" | "shared" | "deleted";

function formatSize(b: number) {
  if (b === 0) return "0 B";
  const k = 1024, s = ["B","KB","MB","GB"];
  const i = Math.floor(Math.log(b) / Math.log(k));
  return `${parseFloat((b / Math.pow(k, i)).toFixed(1))} ${s[i]}`;
}

function FileIcon({ cat }: { cat: FileItem["file_category"] }) {
  const cls = "h-4 w-4";
  if (cat === "photo")    return <Image    className={`${cls} text-blue-400`} />;
  if (cat === "video")    return <Film     className={`${cls} text-rose-400`} />;
  if (cat === "audio")    return <Music    className={`${cls} text-emerald-400`} />;
  if (cat === "document") return <FileText className={`${cls} text-amber-400`} />;
  if (cat === "archive")  return <Archive  className={`${cls} text-purple-400`} />;
  return <FileQuestion className={`${cls} text-zinc-400`} />;
}

const TABS: { id: Tab; label: string; icon: React.ElementType; color: string }[] = [
  { id: "recent",  label: "Recent",   icon: Clock,  color: "text-amber-500" },
  { id: "starred", label: "Starred",  icon: Star,   color: "text-yellow-500" },
  { id: "shared",  label: "Shared",   icon: Share2, color: "text-purple-500" },
  { id: "deleted", label: "Deleted",  icon: Trash2, color: "text-red-500" },
];

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-3">
      <div className="h-12 w-12 rounded-2xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
        <FileQuestion className="h-6 w-6 text-zinc-400" />
      </div>
      <p className="text-xs text-zinc-400 font-medium text-center max-w-[16rem] leading-relaxed">{message}</p>
    </div>
  );
}

function FileRow({ file, onPreview }: { file: FileItem; onPreview: () => void }) {
  const date = new Date(file.created_at).toLocaleDateString([], { month: "short", day: "numeric" });
  return (
    <div
      onClick={onPreview}
      className="flex items-center gap-3 py-2.5 px-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900/50 cursor-pointer transition-colors group"
    >
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-900">
        <FileIcon cat={file.file_category} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">{file.filename}</p>
        <p className="text-[10px] text-zinc-400 font-medium">{formatSize(file.size)} · {date}</p>
      </div>
      <button
        onClick={e => { e.stopPropagation(); onPreview(); }}
        className="opacity-0 group-hover:opacity-100 flex items-center justify-center h-6 w-6 rounded-lg bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition-all"
      >
        <Eye className="h-3 w-3" />
      </button>
    </div>
  );
}

export default function RecentFiles({
  recentFiles, starredFiles, sharedFiles, trashedFiles, loading, onPreview
}: RecentFilesProps) {
  const [activeTab, setActiveTab] = useState<Tab>("recent");

  const lists: Record<Tab, FileItem[]> = {
    recent:  recentFiles.slice(0, 8),
    starred: starredFiles,
    shared:  sharedFiles,
    deleted: trashedFiles.slice(0, 8),
  };

  const emptyMessages: Record<Tab, string> = {
    recent:  "No files uploaded yet. Upload your first file in My Files.",
    starred: "No starred files. Click the ★ on any file to pin it here.",
    shared:  "No shared files. Use the share button on a file to create a link.",
    deleted: "Trash is empty. Deleted files will appear here.",
  };

  const currentList = lists[activeTab];

  return (
    <div className="rounded-3xl border border-zinc-150/70 bg-white/70 dark:border-zinc-900/50 dark:bg-zinc-950/60 backdrop-blur-md p-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black text-zinc-800 dark:text-white uppercase tracking-wider">File Explorer</h3>
        <Link to="/files" className="flex items-center gap-1 text-[10px] font-bold text-amber-500 hover:underline">
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 rounded-2xl bg-zinc-100/80 dark:bg-zinc-900/60 p-1">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-1.5 text-[10px] font-black transition-all cursor-pointer
                ${isActive
                  ? "bg-white dark:bg-zinc-800 shadow-sm text-zinc-900 dark:text-white"
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}
            >
              <Icon className={`h-3 w-3 ${isActive ? tab.color : ""}`} />
              <span className="hidden sm:inline">{tab.label}</span>
              {currentList.length > 0 && isActive && (
                <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-black ${tab.color} bg-current/10`}>
                  {currentList.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="divide-y divide-zinc-100/60 dark:divide-zinc-800/60">
        {loading ? (
          <div className="space-y-2 py-2">
            {[1,2,3,4].map(n => (
              <div key={n} className="h-10 rounded-xl bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
            ))}
          </div>
        ) : currentList.length === 0 ? (
          <EmptyState message={emptyMessages[activeTab]} />
        ) : (
          currentList.map(file => (
            <FileRow key={file.id} file={file} onPreview={() => onPreview(file)} />
          ))
        )}
      </div>
    </div>
  );
}
