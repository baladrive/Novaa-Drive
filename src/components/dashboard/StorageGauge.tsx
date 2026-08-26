"use client";
import React, { useMemo } from "react";
import { HardDrive, FileText, Image, Music, Film, Archive, FileQuestion, TrendingUp } from "lucide-react";
import { FileItem } from "../../services/fileService";

interface StorageGaugeProps {
  used: number;
  limit: number;
  categoryBreakdown: Record<string, number>;
  allFiles: FileItem[];
  loading: boolean;
}

function formatSize(b: number) {
  if (b === 0) return "0 B";
  const k = 1024, s = ["B","KB","MB","GB","TB"];
  const i = Math.floor(Math.log(b) / Math.log(k));
  return `${parseFloat((b / Math.pow(k, i)).toFixed(1))} ${s[i]}`;
}

const CATEGORIES = [
  { key: "photo",    label: "Photos",    color: "#3b82f6",  icon: Image },
  { key: "video",    label: "Videos",    color: "#f43f5e",  icon: Film },
  { key: "audio",    label: "Audio",     color: "#10b981",  icon: Music },
  { key: "document", label: "Documents", color: "#f59e0b",  icon: FileText },
  { key: "archive",  label: "Archives",  color: "#8b5cf6",  icon: Archive },
  { key: "other",    label: "Other",     color: "#6b7280",  icon: FileQuestion },
];

// SVG donut arc
function Donut({ pct, size = 120 }: { pct: number; size?: number }) {
  const r = 45;
  const circ = 2 * Math.PI * r;
  const filled = (pct / 100) * circ;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="-rotate-90">
      <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor"
        className="text-zinc-100 dark:text-zinc-800" strokeWidth="10" />
      <circle cx="50" cy="50" r={r} fill="none"
        stroke="url(#storageGrad)" strokeWidth="10"
        strokeDasharray={`${filled} ${circ - filled}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 1.2s cubic-bezier(0.22,1,0.36,1)" }} />
      <defs>
        <linearGradient id="storageGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#fbbf24" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function StorageGauge({ used, limit, categoryBreakdown, allFiles, loading }: StorageGaugeProps) {
  const pct = Math.min(100, (used / limit) * 100);
  const free = Math.max(0, limit - used);

  // Top 5 largest files
  const largest = useMemo(() =>
    [...allFiles].sort((a, b) => b.size - a.size).slice(0, 5),
    [allFiles]
  );

  // Duplicate detection: group by filename
  const duplicates = useMemo(() => {
    const seen: Record<string, number> = {};
    allFiles.forEach(f => { seen[f.filename] = (seen[f.filename] || 0) + 1; });
    return Object.entries(seen).filter(([, count]) => count > 1).length;
  }, [allFiles]);

  // Weekly upload count (last 7 days)
  const weekUploads = useMemo(() => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return allFiles.filter(f => new Date(f.created_at).getTime() > cutoff).length;
  }, [allFiles]);

  const skeleton = (w: string, h: string) => (
    <div className={`${h} ${w} rounded-xl bg-zinc-100 dark:bg-zinc-900 animate-pulse`} />
  );

  return (
    <div className="rounded-3xl border border-zinc-150/70 bg-white/70 dark:border-zinc-900/50 dark:bg-zinc-950/60 backdrop-blur-md p-6 flex flex-col gap-6">
      <h3 className="text-xs font-black text-zinc-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
        <HardDrive className="h-4 w-4 text-amber-500" />
        Storage Analytics
      </h3>

      {/* Donut gauge + numbers */}
      <div className="flex items-center gap-6">
        <div className="relative flex-shrink-0">
          {loading ? (
            <div className="h-28 w-28 rounded-full bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
          ) : (
            <>
              <Donut pct={pct} size={112} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-black text-zinc-900 dark:text-white tabular-nums">{pct.toFixed(1)}%</span>
                <span className="text-[9px] text-zinc-500 font-bold">used</span>
              </div>
            </>
          )}
        </div>

        <div className="flex-1 space-y-1.5">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-zinc-500">Used</span>
            <span className="text-zinc-900 dark:text-white tabular-nums">{loading ? "—" : formatSize(used)}</span>
          </div>
          <div className="flex justify-between text-xs font-bold">
            <span className="text-zinc-500">Free</span>
            <span className="text-emerald-500 tabular-nums">{loading ? "—" : formatSize(free)}</span>
          </div>
          <div className="flex justify-between text-xs font-bold">
            <span className="text-zinc-500">Limit</span>
            <span className="text-zinc-400">{formatSize(limit)}</span>
          </div>

          {/* Mini stat pills */}
          <div className="flex flex-wrap gap-2 pt-2">
            <span className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[9px] font-black text-amber-600 dark:text-amber-400">
              📅 {weekUploads} uploads this week
            </span>
            {duplicates > 0 && (
              <span className="rounded-lg bg-red-500/10 border border-red-500/20 px-2 py-0.5 text-[9px] font-black text-red-500">
                ⚠ {duplicates} duplicate name{duplicates > 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Category breakdown bars */}
      <div className="space-y-2">
        <p className="text-[9px] font-black uppercase tracking-wider text-zinc-400">File Type Distribution</p>
        {loading ? (
          <div className="space-y-2">{[1,2,3].map(n => skeleton("w-full", "h-4"))}</div>
        ) : (
          CATEGORIES.map(cat => {
            const bytes = categoryBreakdown[cat.key] || 0;
            const pctCat = used > 0 ? (bytes / used) * 100 : 0;
            const Icon = cat.icon;
            return (
              <div key={cat.key} className="flex items-center gap-2">
                <Icon className="h-3 w-3 flex-shrink-0" style={{ color: cat.color }} />
                <div className="flex-1 h-2 rounded-full bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${pctCat}%`, backgroundColor: cat.color }}
                  />
                </div>
                <span className="text-[9px] font-bold text-zinc-500 w-10 text-right tabular-nums">{formatSize(bytes)}</span>
              </div>
            );
          })
        )}
      </div>

      {/* Largest files */}
      {largest.length > 0 && (
        <div className="space-y-2">
          <p className="text-[9px] font-black uppercase tracking-wider text-zinc-400">Largest Files</p>
          {largest.map((f, idx) => (
            <div key={f.id} className="flex items-center gap-2">
              <span className="text-[9px] font-black text-zinc-400 w-4">{idx + 1}</span>
              <p className="flex-1 text-[10px] font-bold text-zinc-700 dark:text-zinc-300 truncate">{f.filename}</p>
              <span className="text-[9px] text-zinc-400 font-medium tabular-nums">{formatSize(f.size)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
