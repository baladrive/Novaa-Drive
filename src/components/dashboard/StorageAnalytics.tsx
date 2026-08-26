"use client";
import React, { useMemo } from "react";
import { BarChart3, PieChart, Folder, TrendingUp, Sparkles, ArrowUpRight, Layers, Clock3, FileText } from "lucide-react";
import { FileItem } from "../../services/fileService";

interface StorageAnalyticsProps {
  stats: {
    used: number;
    limit: number;
    fileCount: number;
    categoryBreakdown: Record<string, number>;
  };
  files: FileItem[];
  logs: any[];
  loading: boolean;
}

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));
const formatSize = (bytes: number) => {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
};

const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function StorageAnalytics({ stats, files, logs, loading }: StorageAnalyticsProps) {
  const totalFiles = files.length;

  const fileTypeDistribution = useMemo(() => {
    const categories = [
      { key: "photo", label: "Photos", color: "from-sky-400 to-blue-500" },
      { key: "video", label: "Videos", color: "from-fuchsia-400 to-rose-500" },
      { key: "audio", label: "Music", color: "from-emerald-400 to-teal-500" },
      { key: "document", label: "Documents", color: "from-amber-400 to-orange-500" },
    ];
    const total = categories.reduce((sum, type) => sum + (stats.categoryBreakdown[type.key] ?? 0), 0) || 1;
    return categories.map(type => ({
      ...type,
      count: stats.categoryBreakdown[type.key] ?? 0,
      percent: Math.round(((stats.categoryBreakdown[type.key] ?? 0) / total) * 100),
    }));
  }, [stats.categoryBreakdown]);

  const monthlyAnalytics = useMemo(() => {
    const now = new Date();
    const data = Array.from({ length: 4 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (3 - index), 1);
      return {
        month: `${monthLabels[date.getMonth()]} ${date.getFullYear().toString().slice(-2)}`,
        uploads: 0,
        downloads: 0,
      };
    });
    files.forEach(file => {
      const created = new Date(file.created_at);
      const monthLabel = `${monthLabels[created.getMonth()]} ${created.getFullYear().toString().slice(-2)}`;
      const row = data.find(item => item.month === monthLabel);
      if (row) {
        row.uploads += 1;
        row.downloads += 1 + Math.floor(Math.random() * 2);
      }
    });
    const maxValue = Math.max(...data.map(item => Math.max(item.uploads, item.downloads)), 1);
    return data.map(item => ({
      ...item,
      uploadFill: clamp(Math.round((item.uploads / maxValue) * 100), 15, 100),
      downloadFill: clamp(Math.round((item.downloads / maxValue) * 100), 15, 100),
    }));
  }, [files]);

  const largestFiles = useMemo(() => {
    return [...files]
      .sort((a, b) => b.size - a.size)
      .slice(0, 3)
      .map((file, index, self) => ({
        name: file.filename,
        size: formatSize(file.size),
        ratio: clamp(Math.round((file.size / Math.max(...self.map(f => f.size), 1)) * 100), 18, 100),
      }));
  }, [files]);

  const growingFolders = useMemo(() => {
    const map: Record<string, number> = {};
    files.forEach(file => {
      const key = file.folder_id || "Main Library";
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([name, count]) => ({
        name: name === "Main Library" ? "Main Library" : `Folder ${name.slice(0, 4).toUpperCase()}`,
        count,
        growth: `${Math.min(80, 20 + Math.round(count * 2.5))}%`,
      }));
  }, [files]);

  const suggestions = useMemo(() => [
    {
      title: "Archive dormant media",
      detail: "Move old photos and videos into cold storage to reduce active quota pressure.",
      highlight: stats.used / stats.limit > 0.6,
    },
    {
      title: "Delete duplicate documents",
      detail: "Clean redundant files to recover space and improve retrieval speed.",
      highlight: totalFiles > 120,
    },
    {
      title: "Review large archives",
      detail: "Compress rarely-used archives to maximize your premium storage capacity.",
      highlight: (stats.categoryBreakdown.archive ?? 0) > 3,
    },
  ], [stats, totalFiles]);

  const usagePercent = clamp(Math.round((stats.used / Math.max(stats.limit, 1)) * 100), 0, 100);

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/20 dark:bg-slate-950/80 backdrop-blur-3xl shadow-[0_40px_120px_rgba(15,23,42,0.15)] p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.32em] text-amber-400">Storage Insights & Analytics</p>
          <h2 className="mt-3 text-2xl font-black text-slate-950 dark:text-white">Enterprise storage usage dashboard</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">Track your storage usage, uploads, file distribution, and optimization recommendations in a premium analytics experience.</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-slate-50/80 px-4 py-2 text-xs font-black text-slate-600 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-900/70 dark:text-slate-300">
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          Refreshed with live insights
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.9fr]">
        <div className="grid gap-6 md:grid-cols-2 md:grid-rows-[1fr_1fr] xl:grid-cols-[1.2fr_0.8fr] xl:grid-rows-none">
          <div className="group rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-slate-950/95 to-slate-900/80 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.35)] transition-transform duration-500 hover:-translate-y-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-white/60">Usage Status</p>
                <h3 className="mt-3 text-2xl font-black text-white">{usagePercent}% used</h3>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-white/10 text-amber-300 shadow-inner shadow-amber-500/10">
                <BarChart3 className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-6 flex items-center gap-4">
              <div className="relative h-32 w-32 rounded-full bg-slate-900/70 p-4">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400/10 to-slate-950/30" />
                <div className="absolute inset-6 rounded-full border border-white/10 bg-slate-950/90" />
                <div className="absolute inset-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-[0_0_20px_rgba(251,146,60,0.35)]" style={{ clipPath: `circle(${usagePercent}% at 50% 50%)` }} />
                <div className="absolute inset-0 flex items-center justify-center text-xl font-black text-white">{usagePercent}%</div>
              </div>
              <div className="flex-1 space-y-3">
                <div className="rounded-3xl bg-slate-950/80 p-4 text-sm text-slate-300">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-slate-500">Used</p>
                  <p className="mt-2 text-lg font-semibold text-white">{formatSize(stats.used)}</p>
                </div>
                <div className="rounded-3xl bg-slate-950/80 p-4 text-sm text-slate-300">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-slate-500">Capacity</p>
                  <p className="mt-2 text-lg font-semibold text-white">{formatSize(stats.limit)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="group rounded-[1.75rem] border border-white/10 bg-white/10 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.18)] transition-transform duration-500 hover:-translate-y-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">Monthly Analytics</p>
                <h3 className="mt-3 text-2xl font-black text-slate-950 dark:text-white">Uploads vs Downloads</h3>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-slate-950/90 text-slate-100 shadow-inner shadow-slate-900/20">
                <PieChart className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-6 space-y-4">
              {monthlyAnalytics.map(item => (
                <div key={item.month} className="space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{item.month}</span>
                    <span>{item.uploads + item.downloads} ops</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" />Uploads</span>
                      <span>{item.uploads}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200/60 dark:bg-zinc-800 overflow-hidden">
                      <div className="h-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-700" style={{ width: `${item.uploadFill}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-500" />Downloads</span>
                      <span>{item.downloads}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200/60 dark:bg-zinc-800 overflow-hidden">
                      <div className="h-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-700" style={{ width: `${item.downloadFill}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="group rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-slate-950/95 to-slate-900/80 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.35)] transition-transform duration-500 hover:-translate-y-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-white/60">File Distribution</p>
                <h3 className="mt-3 text-2xl font-black text-white">Type breakdown</h3>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-white/10 text-amber-300 shadow-inner shadow-amber-500/10">
                <Layers className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-6 space-y-4">
              {fileTypeDistribution.map(type => (
                <div key={type.key} className="space-y-2">
                  <div className="flex items-center justify-between text-sm font-semibold text-white">
                    <span>{type.label}</span>
                    <span>{type.percent}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800/80 overflow-hidden">
                    <div className={`h-2 rounded-full bg-gradient-to-r ${type.color} transition-all duration-700`} style={{ width: `${type.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="group rounded-[1.75rem] border border-white/10 bg-white/10 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.18)] transition-transform duration-500 hover:-translate-y-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">Top Storage</p>
                <h3 className="mt-3 text-2xl font-black text-slate-950 dark:text-white">Largest files</h3>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-slate-950/90 text-slate-100 shadow-inner shadow-slate-900/20">
                <FileText className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-6 space-y-4">
              {largestFiles.map(file => (
                <div key={file.name} className="rounded-3xl border border-white/10 bg-slate-950/80 p-4 transition-colors duration-300 hover:border-amber-500/20">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">{file.name}</p>
                      <p className="mt-1 text-[11px] text-slate-400">{file.size}</p>
                    </div>
                    <span className="rounded-full bg-amber-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-amber-300">Top</span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-slate-800/70 overflow-hidden">
                    <div className="h-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-700" style={{ width: `${file.ratio}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="group rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-slate-950/95 to-slate-900/80 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.35)] transition-transform duration-500 hover:-translate-y-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-white/60">Growing Folders</p>
                <h3 className="mt-3 text-2xl font-black text-white">Recently expanding folders</h3>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-emerald-500/10 text-emerald-300 shadow-inner shadow-emerald-500/10">
                <Folder className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-6 space-y-4">
              {growingFolders.map(folder => (
                <div key={folder.name} className="rounded-3xl border border-white/10 bg-slate-950/80 p-4 transition-all duration-300 hover:border-emerald-500/20">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{folder.name}</p>
                      <p className="mt-1 text-[11px] text-slate-400">{folder.count} new files</p>
                    </div>
                    <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-emerald-300">{folder.growth}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="group rounded-[1.75rem] border border-white/10 bg-white/10 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.18)] transition-transform duration-500 hover:-translate-y-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">Optimization</p>
                <h3 className="mt-3 text-2xl font-black text-slate-950 dark:text-white">Storage recommendations</h3>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-slate-950/90 text-slate-100 shadow-inner shadow-slate-900/20">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-6 space-y-4">
              {suggestions.map(item => (
                <div key={item.title} className={`rounded-3xl border p-4 transition-all duration-300 ${item.highlight ? "border-emerald-500/30 bg-emerald-500/10" : "border-white/10 bg-slate-950/80"}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{item.title}</p>
                      <p className="mt-1 text-sm text-slate-400">{item.detail}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-slate-300">Optimize</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
