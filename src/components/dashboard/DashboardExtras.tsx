"use client";
import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  Cloud,
  CloudLightning,
  Folder,
  Layers,
  Lock,
  MapPin,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Upload,
  Wifi,
  Server,
  Activity,
} from "lucide-react";
import { FileItem } from "../../services/fileService";

interface DashboardExtrasProps {
  files: FileItem[];
  starredFiles: FileItem[];
  sharedFiles: FileItem[];
  trashedFiles: FileItem[];
  activityLogs: any[];
  notifications: { id: string; msg: string; time: string; read: boolean }[];
  aiSuggestion: { text: string; actionLabel: string; actionPath: string };
  onAiAction: () => void;
  stats: { used: number; limit: number; fileCount: number; categoryBreakdown: Record<string, number> };
  loading: boolean;
}

function formatSize(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString([], { month: "short", day: "numeric" });
}

function shortText(text: string, max = 32) {
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

export default function DashboardExtras({
  files,
  starredFiles,
  sharedFiles,
  trashedFiles,
  activityLogs,
  notifications,
  aiSuggestion,
  onAiAction,
  stats,
  loading,
}: DashboardExtrasProps) {
  const continueFile = files[0] || null;
  const pinnedFiles = starredFiles.slice(0, 4);
  const aiRecommended = files.filter(file => file.tags.length > 1).slice(0, 4);
  const recentShared = sharedFiles.slice(0, 4);
  const recentlyDeleted = trashedFiles.slice(0, 4);

  const duplicateGroups = useMemo(() => {
    const map: Record<string, FileItem[]> = {};
    files.forEach(file => {
      const key = `${file.filename.toLowerCase()}|${file.size}`;
      if (!map[key]) map[key] = [];
      map[key].push(file);
    });
    return Object.values(map).filter(group => group.length > 1);
  }, [files]);

  const smartCollections = useMemo(() => {
    const map: Record<string, number> = {};
    files.forEach(file => file.tags.forEach(tag => { if (tag && tag !== "AI Classified") map[tag] = (map[tag] || 0) + 1; }));
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([tag, count]) => ({ tag, count }));
  }, [files]);

  const recentDownloads = activityLogs
    .filter(item => item.action.toLowerCase().includes("download"))
    .slice(0, 4)
    .map(item => ({ details: item.details, time: formatDate(item.created_at) }));

  const upcomingLinks = sharedFiles.slice(0, 4).map((file, index) => ({
    name: shortText(file.filename, 28),
    expiresIn: `${2 + index}d`,
    status: index % 2 === 0 ? "Active" : "Expires soon",
  }));

  const calendarEvents = [
    { title: "Team sync review", time: "11:00 AM" },
    { title: "Upload audit", time: "2:30 PM" },
    { title: "Storage cleanup task", time: "4:00 PM" },
  ];

  const deviceStatus = [
    { label: "Device Backup", value: "Healthy", icon: CloudLightning, status: "ok" },
    { label: "Cloud Sync", value: "Active", icon: Cloud, status: "ok" },
    { label: "Network", value: "Online", icon: Wifi, status: "ok" },
    { label: "Server", value: "Stable", icon: Server, status: "ok" },
  ];

  const securitySummary = [
    { label: "2FA", value: "Enabled", icon: ShieldCheck, status: "ok" },
    { label: "Active Sessions", value: "3", icon: Activity, status: "ok" },
    { label: "Login Alerts", value: "On", icon: Bell, status: "ok" },
    { label: "Firewall", value: "Secure", icon: Lock, status: "ok" },
  ];

  const statusPills = [
    { label: "Backup", value: "Up to date", icon: CheckCircle2 },
    { label: "Security", value: "Clear", icon: ShieldCheck },
    { label: "Performance", value: "Optimal", icon: Sparkles },
  ];

  const uploadQueue = [
    { name: "Team_Presentation.pptx", progress: 52 },
    { name: "Client_Photos.zip", progress: 76 },
  ];

  const downloadQueue = [
    { name: "Budget_Report.xlsx", progress: 34 },
    { name: "Product_Video.mp4", progress: 61 },
  ];

  return (
    <div className="space-y-6 py-3">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
        <div className="rounded-3xl border border-zinc-150/70 bg-white/80 dark:bg-zinc-950/70 dark:border-zinc-900/60 p-6 shadow-xl">
          <div className="flex items-start gap-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-amber-500/10 text-amber-500">
              <Folder className="h-6 w-6" />
            </div>
            <div className="space-y-3">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-amber-500">Continue Working</p>
              {continueFile ? (
                <div className="space-y-2">
                  <p className="text-lg font-black text-slate-950 dark:text-white truncate">{continueFile.filename}</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Last opened {formatDate(continueFile.created_at)} · {formatSize(continueFile.size)}</p>
                  <button onClick={() => {}} className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-slate-950 transition hover:bg-amber-600">
                    Resume file
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">No recent files to resume yet. Open a file to continue where you left off.</p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-150/70 bg-white/80 dark:bg-zinc-950/70 dark:border-zinc-900/60 p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">Pinned Files</p>
              <h3 className="mt-3 text-2xl font-black text-slate-950 dark:text-white">Favorites on deck</h3>
            </div>
            <Star className="h-5 w-5 text-yellow-500" />
          </div>
          <div className="mt-6 space-y-3">
            {pinnedFiles.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Star files from anywhere to pin them here.</p>
            ) : pinnedFiles.map(file => (
              <div key={file.id} className="flex items-center justify-between rounded-3xl border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/70">
                <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">{shortText(file.filename, 22)}</span>
                <span className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">{formatSize(file.size)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-150/70 bg-white/80 dark:bg-zinc-950/70 dark:border-zinc-900/60 p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">AI Smarts</p>
              <h3 className="mt-3 text-2xl font-black text-slate-950 dark:text-white">Recommended files</h3>
            </div>
            <Sparkles className="h-5 w-5 text-amber-500" />
          </div>
          <div className="mt-6 space-y-3">
            {aiRecommended.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">AI recommendations will appear after files are analyzed.</p>
            ) : aiRecommended.map(file => (
              <div key={file.id} className="rounded-3xl border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/70">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{shortText(file.filename, 28)}</p>
                <p className="text-[10px] text-zinc-500 mt-1">{file.tags.length} tags • {formatSize(file.size)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-150/70 bg-white/80 dark:bg-zinc-950/70 dark:border-zinc-900/60 p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">Calendar Widget</p>
              <h3 className="mt-3 text-2xl font-black text-slate-950 dark:text-white">Today’s agenda</h3>
            </div>
            <CalendarDays className="h-5 w-5 text-sky-500" />
          </div>
          <div className="mt-6 space-y-3">
            {calendarEvents.map((event, index) => (
              <div key={index} className="rounded-3xl border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/70">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{event.title}</p>
                <p className="text-[10px] text-zinc-500 mt-1">{event.time}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-3xl border border-zinc-150/70 bg-white/80 dark:bg-zinc-950/70 dark:border-zinc-900/60 p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">Quick Access</p>
              <h3 className="mt-3 text-2xl font-black text-slate-950 dark:text-white">Dashboard essentials</h3>
            </div>
            <MapPin className="h-5 w-5 text-sky-500" />
          </div>
          <div className="mt-6 grid gap-3">
            {statusPills.map(item => (
              <div key={item.label} className="flex items-center justify-between rounded-3xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/70">
                <div className="flex items-center gap-3">
                  <item.icon className="h-4 w-4 text-amber-500" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.label}</p>
                    <p className="text-[11px] text-zinc-500">{item.value}</p>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-black tracking-[0.2em] text-amber-500">Live</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-150/70 bg-white/80 dark:bg-zinc-950/70 dark:border-zinc-900/60 p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">Upload / Download</p>
              <h3 className="mt-3 text-2xl font-black text-slate-950 dark:text-white">Transfer queue</h3>
            </div>
            <Upload className="h-5 w-5 text-blue-500" />
          </div>
          <div className="mt-6 space-y-4">
            {uploadQueue.map(task => (
              <div key={task.name} className="space-y-2">
                <div className="flex items-center justify-between text-sm font-semibold text-slate-900 dark:text-white">
                  <span>{shortText(task.name, 20)}</span>
                  <span className="text-[10px] text-zinc-500">{task.progress}%</span>
                </div>
                <div className="h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                  <div className="h-2 rounded-full bg-gradient-to-r from-blue-400 to-sky-500" style={{ width: `${task.progress}%` }} />
                </div>
              </div>
            ))}
            {downloadQueue.map(task => (
              <div key={task.name} className="space-y-2">
                <div className="flex items-center justify-between text-sm font-semibold text-slate-900 dark:text-white">
                  <span>{shortText(task.name, 20)}</span>
                  <span className="text-[10px] text-zinc-500">{task.progress}%</span>
                </div>
                <div className="h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                  <div className="h-2 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500" style={{ width: `${task.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-150/70 bg-white/80 dark:bg-zinc-950/70 dark:border-zinc-900/60 p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">Live Alerts</p>
              <h3 className="mt-3 text-2xl font-black text-slate-950 dark:text-white">Notifications center</h3>
            </div>
            <Bell className="h-5 w-5 text-purple-500" />
          </div>
          <div className="mt-6 space-y-4">
            {notifications.slice(0, 4).map(item => (
              <div key={item.id} className="rounded-3xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/70">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-950 dark:text-white">{item.msg}</p>
                  <span className="text-[9px] text-zinc-500 uppercase">{item.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-3xl border border-zinc-150/70 bg-white/80 dark:bg-zinc-950/70 dark:border-zinc-900/60 p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">File Health</p>
              <h3 className="mt-3 text-2xl font-black text-slate-950 dark:text-white">Cleanup suggestions</h3>
            </div>
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </div>
          <div className="mt-6 space-y-4">
            <div className="rounded-3xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/70">
              <p className="text-sm font-semibold text-slate-950 dark:text-white">{duplicateGroups.length} duplicate file groups found</p>
              <p className="text-[10px] text-zinc-500 mt-1">Review duplicates and consolidate storage.</p>
            </div>
            <div className="rounded-3xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/70">
              <p className="text-sm font-semibold text-slate-950 dark:text-white">{recentlyDeleted.length} recently deleted items</p>
              <p className="text-[10px] text-zinc-500 mt-1">Recover or permanently purge files from trash.</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-150/70 bg-white/80 dark:bg-zinc-950/70 dark:border-zinc-900/60 p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">Shared Links</p>
              <h3 className="mt-3 text-2xl font-black text-slate-950 dark:text-white">Expiring links</h3>
            </div>
            <Link to="/sharing" className="text-[10px] font-black uppercase tracking-[0.24em] text-amber-500 hover:text-amber-600">Manage</Link>
          </div>
          <div className="mt-6 space-y-3">
            {upcomingLinks.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">No shared links with expiration set.</p>
            ) : upcomingLinks.map(link => (
              <div key={link.name} className="flex items-center justify-between rounded-3xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/70">
                <div>
                  <p className="text-sm font-semibold text-slate-950 dark:text-white">{link.name}</p>
                  <p className="text-[10px] text-zinc-500 mt-1">{link.status}</p>
                </div>
                <span className="rounded-full bg-amber-500/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-amber-500">{link.expiresIn}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-150/70 bg-white/80 dark:bg-zinc-950/70 dark:border-zinc-900/60 p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">Device & Security</p>
              <h3 className="mt-3 text-2xl font-black text-slate-950 dark:text-white">Connected systems</h3>
            </div>
            <ShieldCheck className="h-5 w-5 text-emerald-500" />
          </div>
          <div className="mt-6 space-y-3">
            {deviceStatus.map(item => (
              <div key={item.label} className="flex items-center justify-between rounded-3xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/70">
                <div className="flex items-center gap-3">
                  <item.icon className="h-4 w-4 text-slate-700 dark:text-slate-300" />
                  <div>
                    <p className="text-sm font-semibold text-slate-950 dark:text-white">{item.label}</p>
                    <p className="text-[10px] text-zinc-500">{item.value}</p>
                  </div>
                </div>
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-zinc-150/70 bg-white/80 dark:bg-zinc-950/70 dark:border-zinc-900/60 p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">Historic Activity</p>
              <h3 className="mt-3 text-2xl font-black text-slate-950 dark:text-white">Weekly upload report</h3>
            </div>
            <TrendingUp className="h-5 w-5 text-blue-500" />
          </div>
          <div className="mt-6 space-y-3">
            {recentDownloads.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">No recent downloads recorded.</p>
            ) : recentDownloads.map(download => (
              <div key={download.details} className="rounded-3xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/70">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-950 dark:text-white">{shortText(download.details, 28)}</p>
                  <span className="text-[10px] text-zinc-500">{download.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-150/70 bg-white/80 dark:bg-zinc-950/70 dark:border-zinc-900/60 p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">Smart Collections</p>
              <h3 className="mt-3 text-2xl font-black text-slate-950 dark:text-white">Tag-driven insights</h3>
            </div>
            <Layers className="h-5 w-5 text-cyan-500" />
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            {smartCollections.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Smart collections appear once files are tagged.</p>
            ) : smartCollections.map(collection => (
              <span key={collection.tag} className="rounded-2xl border border-zinc-100 bg-slate-50 px-3 py-2 text-[11px] font-black text-slate-700 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-white">
                {collection.tag} · {collection.count}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
