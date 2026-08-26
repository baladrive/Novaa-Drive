"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  ArrowUpRight, Command, Wifi, WifiOff, Server, RefreshCw,
  CloudOff, Cloud, Bell, CheckCircle2, Sparkles, Upload, Search
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { fileService, FileItem } from "../services/fileService";
import FileViewer from "../components/FileViewer";

// Dashboard widget components
import CommandPalette from "../components/dashboard/CommandPalette";
import StatsBar       from "../components/dashboard/StatsBar";
import QuickAccess    from "../components/dashboard/QuickAccess";
import MiniWidgets    from "../components/dashboard/MiniWidgets";
import RecentFiles    from "../components/dashboard/RecentFiles";
import StorageGauge   from "../components/dashboard/StorageGauge";
import ActivityTimeline from "../components/dashboard/ActivityTimeline";
import StorageAnalytics from "../components/dashboard/StorageAnalytics";
import SecurityCenter from "../components/dashboard/SecurityCenter";
import DashboardExtras from "../components/dashboard/DashboardExtras";
import AiPanel        from "../components/dashboard/AiPanel";

// ── Status bar items ──────────────────────────────────────────────────────────
function StatusBadge({ icon: Icon, label, ok }: { icon: React.ElementType; label: string; ok: boolean }) {
  return (
    <span className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold
      ${ok
        ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400"
        : "border-red-500/20 bg-red-500/5 text-red-500"}`}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

// ── Greeting helper ───────────────────────────────────────────────────────────
function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5  && hour < 12) return { text: "Good Morning",  emoji: "☀️",  sub: "Start your day — your files are ready.",        bg: "from-orange-400/20 to-amber-300/10",  textColor: "text-amber-950 dark:text-amber-300" };
  if (hour >= 12 && hour < 17) return { text: "Good Afternoon", emoji: "🌤️", sub: "Midday check-in — everything's synced.",         bg: "from-yellow-400/20 to-amber-300/10",  textColor: "text-amber-950 dark:text-amber-300" };
  if (hour >= 17 && hour < 21) return { text: "Good Evening",   emoji: "🌆",  sub: "Winding down? Your drive is always on.",        bg: "from-rose-400/15 to-orange-400/10",   textColor: "text-rose-950 dark:text-rose-300"   };
  return                               { text: "Good Night",     emoji: "🌙",  sub: "Late night session — burning the midnight oil.", bg: "from-indigo-500/15 to-violet-500/10", textColor: "text-indigo-950 dark:text-indigo-300" };
}

// ── Notifications ─────────────────────────────────────────────────────────────
interface Notification { id: string; msg: string; time: string; read: boolean; }

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user, isAiMode } = useAuth();
  const navigate = useNavigate();

  // Data state
  const [stats, setStats] = useState<{ used: number; limit: number; fileCount: number; categoryBreakdown: Record<string, number> }>({
    used: 0, limit: 200 * 1024 * 1024 * 1024, fileCount: 0,
    categoryBreakdown: { photo: 0, video: 0, audio: 0, document: 0, archive: 0, other: 0 }
  });
  const [allFiles,     setAllFiles]     = useState<FileItem[]>([]);
  const [starredFiles, setStarredFiles] = useState<FileItem[]>([]);
  const [sharedFiles,  setSharedFiles]  = useState<FileItem[]>([]);
  const [trashedFiles, setTrashedFiles] = useState<FileItem[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [loading,      setLoading]      = useState(true);

  // UI state
  const [cmdOpen,       setCmdOpen]       = useState(false);
  const [notifOpen,     setNotifOpen]     = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [aiSuggestion, setAiSuggestion] = useState({
    text: "Analyzing your storage...", actionLabel: "Analyze", actionPath: "/"
  });

  // ── Load all dashboard data ──────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [storageStats, files, logs, trashed] = await Promise.all([
        fileService.getStorageStats(user.id),
        fileService.getFiles(user.id, null),
        fileService.getActivityLogs(user.id),
        fileService.getTrashedFiles(user.id),
      ]);

      setStats(storageStats);
      setAllFiles(files);
      setStarredFiles(files.filter(f => f.is_starred));
      setSharedFiles(files.filter(f => !!f.shared_link_token));
      setTrashedFiles(trashed);
      setActivityLogs(logs);

      // Build notifications from real data
      const notifs: Notification[] = [];
      if (trashed.length > 0)
        notifs.push({ id: "trash", msg: `${trashed.length} file${trashed.length > 1 ? "s" : ""} in trash awaiting permanent deletion.`, time: "Now", read: false });
      const recentUploads = files.filter(f => Date.now() - new Date(f.created_at).getTime() < 60 * 60 * 1000);
      if (recentUploads.length > 0)
        notifs.push({ id: "upload", msg: `${recentUploads.length} file${recentUploads.length > 1 ? "s" : ""} uploaded in the last hour.`, time: "1h ago", read: false });
      const has2FA = (() => { try { return JSON.parse(localStorage.getItem(`local_2fa_${user.id}`) || "false"); } catch { return false; } })();
      if (!has2FA)
        notifs.push({ id: "2fa", msg: "2FA not enabled. Enable it in Security Center to protect your account.", time: "Tip", read: true });
      setNotifications(notifs);

      // AI suggestion
      if (storageStats.fileCount === 0) {
        setAiSuggestion({ text: "👋 Upload your first file to activate the AI Auto-Tagging engine.", actionLabel: "Upload Files", actionPath: "/files" });
      } else if (trashed.length > 0) {
        setAiSuggestion({ text: `🗑️ ${trashed.length} trashed items consuming quota. Purge to free space.`, actionLabel: "Clean Trash", actionPath: "/trash" });
      } else if (!has2FA) {
        setAiSuggestion({ text: "🔒 2FA is disabled. Enable it to reach a 100% Security Score.", actionLabel: "Setup 2FA", actionPath: "/profile" });
      } else {
        setAiSuggestion({ text: "✨ All systems optimal. AI classification engine is running on all your files.", actionLabel: "View Analytics", actionPath: "/profile" });
      }
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Global Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") { e.preventDefault(); setCmdOpen(p => !p); }
      if (e.key === "Escape") { setCmdOpen(false); setNotifOpen(false); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const greeting  = getTimeGreeting();
  const timeLabel = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const unread    = notifications.filter(n => !n.read).length;

  return (
    <>
      {/* Command Palette */}
      <CommandPalette isOpen={cmdOpen} onClose={() => setCmdOpen(false)} />

      {/* File Preview */}
      {selectedFile && (
        <FileViewer
          file={selectedFile}
          allFiles={allFiles}
          onClose={() => setSelectedFile(null)}
          onToggleStar={async f => {
            await fileService.toggleStar(user!.id, f.id, !f.is_starred);
            fetchData();
          }}
          onTrash={async f => {
            await fileService.trashFile(user!.id, f.id, true);
            fetchData();
            setSelectedFile(null);
          }}
        />
      )}

      {/* ── Floating Background ────────────────────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-amber-400/5 blur-3xl" />
        <div className="absolute top-1/3 right-0 h-80 w-80 rounded-full bg-violet-400/5 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-blue-400/5 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 space-y-6">

        {/* ── Top Control Bar ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Status badges */}
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge icon={Wifi}   label="Network: Online"  ok={true} />
            <StatusBadge icon={Server} label="Server: Healthy"  ok={true} />
            <StatusBadge icon={Cloud}  label="Sync: Up-to-date" ok={true} />
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {/* Ctrl+K trigger */}
            <button
              onClick={() => setCmdOpen(true)}
              className="flex items-center gap-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 px-3 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all cursor-pointer backdrop-blur-sm"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Search everything</span>
              <kbd className="hidden sm:flex items-center gap-0.5 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 px-1.5 text-[9px] font-mono text-zinc-400">
                <Command className="h-2.5 w-2.5" />K
              </kbd>
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(p => !p)}
                className="relative flex items-center justify-center h-9 w-9 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-all cursor-pointer"
              >
                <Bell className="h-4 w-4" />
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[8px] font-black text-slate-950">
                    {unread}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-3xl border border-zinc-150 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl z-50 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black text-zinc-800 dark:text-white">Notifications</p>
                    <button onClick={() => setNotifOpen(false)} className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white text-xs font-bold">Close</button>
                  </div>
                  {notifications.length === 0 ? (
                    <p className="text-xs text-zinc-400 py-3 text-center">All caught up! 🎉</p>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className={`rounded-2xl p-3 text-xs border ${n.read ? "border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60" : "border-amber-500/20 bg-amber-500/5"}`}>
                        <p className={`font-medium leading-snug ${n.read ? "text-zinc-500" : "text-zinc-800 dark:text-zinc-200"}`}>{n.msg}</p>
                        <p className="text-[9px] text-zinc-400 mt-1 font-bold">{n.time}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Refresh */}
            <button
              onClick={fetchData}
              className="flex items-center justify-center h-9 w-9 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-all cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ── Welcome Hero ─────────────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500/90 to-yellow-400/90 p-8 text-slate-950 shadow-lg dark:from-zinc-900/60 dark:to-zinc-900/20 dark:border dark:border-zinc-800 dark:text-white">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className={`inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r ${greeting.bg} px-3 py-1.5 mb-3 border border-white/20`}>
                <span className="text-base leading-none select-none">{greeting.emoji}</span>
                <span className={`text-xs font-black tracking-wide ${greeting.textColor}`}>{greeting.text}!</span>
                <span className="text-[10px] font-bold text-amber-900/50 dark:text-zinc-500 ml-1 tabular-nums">{timeLabel}</span>
              </div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight leading-snug">
                Welcome to Bala Drive, <span className="font-extrabold text-amber-950 dark:text-amber-500">{user?.email?.split("@")[0]}</span>
              </h1>
              <p className="mt-1.5 text-xs text-amber-900/80 dark:text-zinc-400 font-semibold max-w-xl">{greeting.sub}</p>

              {/* Hero stat pills */}
              <div className="flex flex-wrap gap-3 mt-4">
                <span className="flex items-center gap-1.5 rounded-xl bg-slate-950/10 dark:bg-white/5 px-3 py-1.5 text-[10px] font-black">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                  {loading ? "—" : stats.fileCount} Files Indexed
                </span>
                <span className="flex items-center gap-1.5 rounded-xl bg-slate-950/10 dark:bg-white/5 px-3 py-1.5 text-[10px] font-black">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 inline-block" />
                  AI Engine Active
                </span>
                <span className="flex items-center gap-1.5 rounded-xl bg-slate-950/10 dark:bg-white/5 px-3 py-1.5 text-[10px] font-black">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500 inline-block" />
                  {loading ? "—" : starredFiles.length} Starred
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <RouterLink
                to="/files"
                className="flex items-center justify-center gap-1.5 rounded-2xl bg-slate-950 text-white dark:bg-amber-500 dark:text-slate-950 font-black px-5 py-3 text-xs shadow-md hover:scale-105 active:scale-98 transition-all w-fit cursor-pointer"
              >
                <Upload className="h-4 w-4" /> Upload Files
              </RouterLink>
              <button
                onClick={() => setCmdOpen(true)}
                className="flex items-center justify-center gap-1.5 rounded-2xl border-2 border-slate-950/20 dark:border-white/20 font-black px-5 py-3 text-xs hover:bg-slate-950/10 dark:hover:bg-white/10 transition-all w-fit cursor-pointer"
              >
                <Search className="h-4 w-4" /> Search Files
              </button>
            </div>
          </div>
          <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-white/5 blur-2xl pointer-events-none" />
        </div>

        {/* ── Animated Stats Bar ───────────────────────────────────────────── */}
        <StatsBar
          fileCount={stats.fileCount}
          used={stats.used}
          limit={stats.limit}
          starredCount={starredFiles.length}
          sharedCount={sharedFiles.length}
          loading={loading}
        />

        {/* ── Quick Access ──────────────────────────────────────────────────── */}
        <QuickAccess categoryBreakdown={stats.categoryBreakdown} />

        {/* ── AI Engine Banner ──────────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-3xl border border-zinc-150/50 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 dark:border-zinc-800/50 p-8 md:p-10 shadow-2xl">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl" />
          </div>
          <div className="relative z-10 flex flex-col items-center gap-8 md:flex-row md:items-center md:gap-12">
            <div className="flex-shrink-0 relative flex items-center justify-center w-36 h-36 md:w-40 md:h-40">
              <div className="absolute inset-0 animate-orbit">
                <div className="relative h-full w-full">
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 h-3 w-3 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)]" />
                  <div className="h-full w-full rounded-full border border-amber-500/20" />
                </div>
              </div>
              <div className="absolute inset-4 animate-orbit-reverse">
                <div className="relative h-full w-full">
                  <div className="absolute -bottom-1 right-0 h-2 w-2 rounded-full bg-yellow-300 shadow-[0_0_8px_rgba(253,224,71,0.8)]" />
                  <div className="h-full w-full rounded-full border border-yellow-400/15" />
                </div>
              </div>
              <div className="animate-float relative flex h-16 w-16 md:h-20 md:w-20 items-center justify-center">
                <div className="absolute inset-0 rounded-full animate-glow" />
                <div className="relative flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 shadow-[0_0_40px_rgba(245,158,11,0.5)]">
                  <svg className="h-8 w-8 md:h-10 md:w-10 animate-spin-slow" viewBox="0 0 24 24" fill="none">
                    <path d="M12 0C15.3137 0 18 2.68629 18 6V12H12C8.68629 12 6 9.31371 6 6C6 2.68629 8.68629 0 12 0Z" fill="rgba(30,27,75,0.9)" />
                    <path d="M24 12C24 15.3137 21.3137 18 18 18H12V12C12 8.68629 14.6863 6 18 6C21.3137 6 24 8.68629 24 12Z" fill="rgba(30,27,75,0.7)" />
                    <path d="M12 24C8.68629 24 6 21.3137 6 18V12H12C15.3137 12 18 14.6863 18 18C18 21.3137 15.3137 24 12 24Z" fill="rgba(30,27,75,0.9)" />
                    <path d="M0 12C0 8.68629 2.68629 6 6 6H12V12C12 15.3137 9.31371 18 6 18C2.68629 18 0 15.3137 0 12Z" fill="rgba(30,27,75,0.7)" />
                  </svg>
                  <div className="absolute inset-0 overflow-hidden rounded-full">
                    <div className="animate-scan h-0.5 w-full bg-gradient-to-r from-transparent via-white/50 to-transparent" />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center text-center md:items-start md:text-left gap-4 animate-fade-up">
              <div className="flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1">
                <div className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400">AI Engine Active</span>
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-white leading-tight tracking-tight">
                  Bala Drive{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300">Intelligence</span>
                </h2>
                <p className="mt-2 text-xs md:text-sm text-zinc-400 max-w-md leading-relaxed">
                  Every upload is instantly analyzed, tagged, and organized by the Gemini AI engine — so you can find anything in seconds.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {["Auto-Tagging","Threat Scanner","Smart Search","Vector Index"].map((f, i) => (
                  <span key={f} className={`rounded-lg px-2.5 py-1 text-[9px] font-black uppercase tracking-wider border transition-colors
                    ${i < 3 || isAiMode ? "bg-amber-500/10 border-amber-500/30 text-amber-400" : "bg-zinc-800/60 border-zinc-700/40 text-zinc-500"}`}>
                    {i < 3 || isAiMode ? "✓ " : "○ "}{f}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-5 text-[10px] font-bold text-zinc-500 border-t border-zinc-800/60 pt-3 w-full">
                <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" /><span className="text-zinc-300">{stats.fileCount}</span> files indexed</span>
                <span className="text-zinc-700">|</span>
                <span><span className="text-zinc-300">Gemini 2.0 Flash</span> active model</span>
                <span className="text-zinc-700">|</span>
                <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse inline-block" /><span className="text-zinc-300">99.9%</span> uptime</span>
              </div>
            </div>
          </div>
          <div className="absolute right-5 bottom-3 text-[80px] font-black text-white/3 pointer-events-none font-mono uppercase select-none leading-none">AI</div>
        </div>

        {/* ── Mini Widgets Row ──────────────────────────────────────────────── */}
        <MiniWidgets />

        {/* ── Main Content Grid: Files + Storage + AI ───────────────────────── */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* Left 2/3: File explorer + Activity */}
          <div className="xl:col-span-2 space-y-6">
            <RecentFiles
              recentFiles={allFiles.slice(0, 8)}
              starredFiles={starredFiles}
              sharedFiles={sharedFiles}
              trashedFiles={trashedFiles}
              loading={loading}
              onPreview={setSelectedFile}
            />
            <ActivityTimeline logs={activityLogs} loading={loading} />
            <StorageAnalytics
              stats={stats}
              files={allFiles}
              logs={activityLogs}
              loading={loading}
            />
          </div>

          {/* Right 1/3: Storage + Security + AI */}
          <div className="space-y-6">
            <StorageGauge
              used={stats.used}
              limit={stats.limit}
              categoryBreakdown={stats.categoryBreakdown}
              allFiles={allFiles}
              loading={loading}
            />
            <SecurityCenter
              userId={user?.id || ""}
              userEmail={user?.email}
            />
          </div>
        </div>

        <DashboardExtras
          files={allFiles}
          starredFiles={starredFiles}
          sharedFiles={sharedFiles}
          trashedFiles={trashedFiles}
          activityLogs={activityLogs}
          notifications={notifications}
          aiSuggestion={aiSuggestion}
          onAiAction={() => navigate(aiSuggestion.actionPath)}
          stats={stats}
          loading={loading}
        />

        {/* ── System Status Row ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Cloud Sync",     status: "All synced",  ok: true,  icon: Cloud },
            { label: "Backup Status",  status: "Up to date",  ok: true,  icon: CheckCircle2 },
            { label: "Server Health",  status: "100% uptime", ok: true,  icon: Server },
            { label: "Offline Mode",   status: "Local DB",    ok: false, icon: CloudOff },
          ].map(item => {
            const Icon = item.icon;
            return (
              <div key={item.label}
                className="rounded-3xl border border-zinc-150/70 bg-white/70 dark:border-zinc-900/50 dark:bg-zinc-950/60 backdrop-blur-md p-4 flex items-center gap-3">
                <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl
                  ${item.ok ? "bg-emerald-500/10" : "bg-zinc-500/10"}`}>
                  <Icon className={`h-4 w-4 ${item.ok ? "text-emerald-500" : "text-zinc-500"}`} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-zinc-800 dark:text-zinc-200">{item.label}</p>
                  <p className={`text-[9px] font-bold ${item.ok ? "text-emerald-500" : "text-zinc-500"}`}>{item.status}</p>
                </div>
              </div>
            );
          })}
        </div>

        <AiPanel
          files={allFiles}
          isAiMode={isAiMode}
          aiSuggestion={aiSuggestion}
          onAiAction={() => navigate(aiSuggestion.actionPath)}
        />

      </div>
    </>
  );
}
