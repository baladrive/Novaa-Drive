"use client";
import React, { useState, useEffect, useCallback, useRef, memo, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowUpRight, Upload, Search, Clock, Star, Share2, Shield,
  FileText, Image, Music, Video, FolderOpen, Zap, Bell,
  Cloud, TrendingUp, Activity, Sparkles, ChevronRight,
  HardDrive, Lock, Users, RefreshCw, MoreHorizontal,
  Pin, Download, UploadCloud, Trash2, Copy, Move, Globe,
  Wifi, WifiOff, Server, CheckCircle2, AlertTriangle,
  Sun, Moon, Calendar, Thermometer, StickyNote,
  Command, X, Filter, FileSearch, Layers,
  FolderTree, Tag, Palette, GripVertical, Eye, EyeOff,
  Clock3, History, ArrowUpDown, ArrowDownUp, Link2,
  Smartphone, Monitor, Fingerprint, KeyRound, Database,
  CloudOff, Battery, Signal, SlidersHorizontal,
  Bookmark, Paperclip, Scissors, ExternalLink, Info, LayoutDashboard, Settings,
  Maximize2, Minimize2, Grid3X3, List, SortAsc, SortDesc
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { fileService, FileItem } from "../services/fileService";
import { productivityService, TodoItem, CalendarEvent, Reminder } from "../services/productivityService";
import NovaaLogo from "../components/auth/NovaaLogo";
import FileViewer from "../components/FileViewer";
import ActivityTimeline from "../components/dashboard/ActivityTimeline";
import NovaaAICard from "../components/auth/NovaaAICard";

// ═══════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════
interface DashboardStats {
  used: number;
  limit: number;
  fileCount: number;
  categoryBreakdown: Record<string, number>;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'info' | 'warning' | 'success' | 'error';
}

interface StickyNote {
  id: string;
  text: string;
  color: string;
  date: string;
}

interface UploadItem {
  id: string;
  name: string;
  progress: number;
  status: 'uploading' | 'done' | 'error';
  size: string;
}

// ═══════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════
function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return { text: "Good Morning", icon: "☀️" };
  if (hour >= 12 && hour < 17) return { text: "Good Afternoon", icon: "🌤️" };
  if (hour >= 17 && hour < 21) return { text: "Good Evening", icon: "🌆" };
  return { text: "Good Night", icon: "🌙" };
}

function formatSize(bytes: number): string {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function getFileIcon(mime: string) {
  if (mime?.startsWith('image/')) return Image;
  if (mime?.startsWith('video/')) return Video;
  if (mime?.startsWith('audio/')) return Music;
  if (mime?.includes('pdf') || mime?.includes('document') || mime?.includes('sheet')) return FileText;
  return FolderOpen;
}

const gradients = [
  'from-purple-500 to-cyan-500',
  'from-cyan-500 to-blue-500',
  'from-blue-500 to-purple-500',
  'from-purple-500 to-pink-500',
  'from-pink-500 to-cyan-500',
  'from-amber-500 to-orange-500',
  'from-emerald-500 to-teal-500',
  'from-violet-500 to-purple-500',
];

// Cache gradient per file ID to prevent thrashing
const gradientCache = new Map<string, string>();
function getGradientForFile(fileId: string): string {
  let grad = gradientCache.get(fileId);
  if (!grad) {
    grad = gradients[Math.floor(Math.random() * gradients.length)];
    gradientCache.set(fileId, grad);
  }
  return grad;
}

// ═══════════════════════════════════════════════════════════════════════
// VIEWPORT-AWARE LAZY LOADER
// ═══════════════════════════════════════════════════════════════════════
function useIsNearViewport(ref: React.RefObject<HTMLElement | null>, rootMargin = "200px"): boolean {
  const [isNear, setIsNear] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // If IntersectionObserver isn't available, render immediately
    if (typeof IntersectionObserver === 'undefined') {
      setIsNear(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsNear(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, rootMargin]);

  return isNear;
}

// Wrapper that only renders children when near viewport
const LazyWidget = memo(function LazyWidget({
  children,
  className = "",
  style = {},
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isNear = useIsNearViewport(ref);

  return (
    <div ref={ref} className={className} style={style}>
      {isNear ? children : <div className="h-24 rounded-2xl skeleton" />}
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════
// WIDGET COMPONENTS (Memoized)
// ═══════════════════════════════════════════════════════════════════════

// ── Clock Widget ──────────────────────────────────────────────────────
const ClockWidget = memo(function ClockWidget() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const i = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(i);
  }, []);
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
      <p className="text-3xl font-black text-white tabular-nums gpu-layer">{time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
      <p className="text-[10px] font-medium text-white/30 mt-1">{time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
    </div>
  );
});

// ── Weather Widget ────────────────────────────────────────────────────
const WeatherWidget = memo(function WeatherWidget() {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-amber-500/5 to-orange-500/5 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-black text-white">28°C</p>
          <p className="text-[10px] font-medium text-white/40">Sunny</p>
        </div>
        <span className="text-3xl">☀️</span>
      </div>
      <p className="text-[9px] font-medium text-white/20 mt-2">Your Location</p>
    </div>
  );
});

// ── Sticky Notes Widget ───────────────────────────────────────────────
const StickyNotesWidget = memo(function StickyNotesWidget() {
  const [notes] = useState<StickyNote[]>([
    { id: '1', text: 'Review Q3 files', color: 'from-purple-500/20 to-cyan-500/20', date: 'Today' },
    { id: '2', text: 'Team meeting notes', color: 'from-amber-500/20 to-orange-500/20', date: 'Yesterday' },
  ]);
  const [newNote, setNewNote] = useState('');

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <StickyNote className="h-4 w-4 text-amber-400" />
          <h3 className="text-xs font-bold text-white/80">Sticky Notes</h3>
        </div>
      </div>
      <div className="space-y-2">
        {notes.map(note => (
          <div key={note.id} className={`rounded-xl bg-gradient-to-r ${note.color} p-3 border border-white/[0.04]`}>
            <p className="text-xs text-white/70">{note.text}</p>
            <p className="text-[9px] text-white/20 mt-1">{note.date}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <input
          type="text"
          placeholder="Add a note..."
          value={newNote}
          onChange={e => setNewNote(e.target.value)}
          className="flex-1 rounded-lg border border-white/[0.06] bg-white/[0.04] px-3 py-2 text-xs text-white outline-none placeholder:text-white/20 focus:border-purple-500/30"
        />
        <button className="rounded-lg bg-gradient-to-r from-purple-500 to-cyan-500 px-3 py-2 text-xs font-bold text-white shadow-lg">Add</button>
      </div>
    </div>
  );
});

// ── Upload Queue Widget ───────────────────────────────────────────────
const UploadQueueWidget = memo(function UploadQueueWidget() {
  const [uploads] = useState<UploadItem[]>([
    { id: '1', name: 'presentation.pdf', progress: 75, status: 'uploading', size: '12.5 MB' },
    { id: '2', name: 'photo-batch.zip', progress: 100, status: 'done', size: '45.2 MB' },
  ]);

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <UploadCloud className="h-4 w-4 text-cyan-400" />
          <h3 className="text-xs font-bold text-white/80">Upload Queue</h3>
        </div>
        <span className="text-[9px] text-white/30">{uploads.filter(u => u.status === 'uploading').length} active</span>
      </div>
      <div className="space-y-2">
        {uploads.map(item => (
          <div key={item.id} className="rounded-xl border border-white/[0.04] bg-white/[0.03] p-3">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] font-medium text-white/60 truncate flex-1">{item.name}</p>
              <span className="text-[9px] text-white/30 ml-2">{item.size}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className={`h-full rounded-full transition-[width] duration-500 ${item.status === 'done' ? 'bg-emerald-400' : item.status === 'error' ? 'bg-red-400' : 'bg-gradient-to-r from-purple-500 to-cyan-500'}`}
                style={{ width: `${item.progress}%` }}
              />
            </div>
            <p className="text-[9px] text-white/20 mt-1">{item.status === 'done' ? 'Completed' : `${item.progress}%`}</p>
          </div>
        ))}
      </div>
    </div>
  );
});

// ── Quick Access Widget ───────────────────────────────────────────────
const QuickAccessWidget = memo(function QuickAccessWidget({ onNavigate }: { onNavigate: (path: string) => void }) {
  const items = useMemo(() => [
    { icon: Image, label: 'Photos', path: '/photos', color: 'from-blue-500 to-cyan-500' },
    { icon: Video, label: 'Videos', path: '/videos', color: 'from-purple-500 to-pink-500' },
    { icon: Music, label: 'Music', path: '/music', color: 'from-emerald-500 to-teal-500' },
    { icon: FileText, label: 'Docs', path: '/documents', color: 'from-amber-500 to-orange-500' },
    { icon: Star, label: 'Starred', path: '/favorites', color: 'from-yellow-500 to-amber-500' },
    { icon: Download, label: 'Downloads', path: '/files', color: 'from-cyan-500 to-blue-500' },
    { icon: Shield, label: 'Vault', path: '/hidden', color: 'from-violet-500 to-purple-500' },
    { icon: Trash2, label: 'Trash', path: '/trash', color: 'from-red-500 to-rose-500' },
  ], []);

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-400" />
          <h3 className="text-xs font-bold text-white/80">Quick Access</h3>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {items.map(item => {
          const Icon = item.icon;
          return (
            <button key={item.label} onClick={() => onNavigate(item.path)}
              className="group flex flex-col items-center gap-1.5 rounded-xl border border-white/[0.04] bg-white/[0.02] p-3 transition-transform duration-200 hover:bg-white/[0.06] hover:scale-[1.05]"
            >
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${item.color} shadow-lg`}>
                <Icon className="h-4 w-4 text-white" />
              </div>
              <span className="text-[9px] font-medium text-white/40 group-hover:text-white/60">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
});

// ── File Section ──────────────────────────────────────────────────────
interface FileSectionProps {
  title: string;
  icon: React.ElementType;
  iconColor: string;
  files: FileItem[];
  onFileClick: (f: FileItem) => void;
  loading?: boolean;
  emptyMessage?: string;
  emptyIcon?: React.ElementType;
}

const FileSection = memo(function FileSection({ title, icon: Icon, iconColor, files, onFileClick, loading, emptyMessage, emptyIcon: EmptyIcon }: FileSectionProps) {
  const EIcon = EmptyIcon || Upload;
  const displayFiles = useMemo(() => files.slice(0, 5), [files]);

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${iconColor}`} />
          <h3 className="text-xs font-bold text-white/80">{title}</h3>
        </div>
        <span className="text-[9px] text-white/30">{files.length}</span>
      </div>
      <div className="space-y-1.5">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-10 rounded-xl skeleton" />
          ))
        ) : displayFiles.length > 0 ? (
          displayFiles.map(file => (
            <FileRow key={file.id} file={file} onFileClick={onFileClick} />
          ))
        ) : (
          <div className="flex flex-col items-center py-6 text-center">
            <EIcon className="mb-2 h-6 w-6 text-white/10" />
            <p className="text-xs text-white/30">{emptyMessage || 'No items'}</p>
          </div>
        )}
      </div>
    </div>
  );
});

// Extracted file row for independent memoization
const FileRow = memo(function FileRow({ file, onFileClick }: { file: FileItem; onFileClick: (f: FileItem) => void }) {
  const gradient = useMemo(() => getGradientForFile(file.id), [file.id]);
  const FileIcon = useMemo(() => getFileIcon(file.mime_type), [file.mime_type]);

  return (
    <button onClick={() => onFileClick(file)}
      className="group flex w-full items-center gap-3 rounded-xl border border-transparent p-2.5 transition-[background-color,border-color] hover:border-white/[0.06] hover:bg-white/[0.03]"
    >
      <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${gradient} shadow-lg`}>
        <FileIcon className="h-4 w-4 text-white" />
      </div>
      <div className="min-w-0 flex-1 text-left">
        <p className="text-[11px] font-semibold text-white/70 truncate group-hover:text-white/90">{file.filename}</p>
        <p className="text-[9px] text-white/30">{formatSize(file.size)} • {new Date(file.created_at).toLocaleDateString()}</p>
      </div>
      <Star className={`h-3.5 w-3.5 flex-shrink-0 ${file.is_starred ? 'text-amber-400 fill-amber-400' : 'text-white/10 opacity-0 group-hover:opacity-100'}`} />
    </button>
  );
});

// ── Storage Analytics ─────────────────────────────────────────────────
const StorageAnalyticsWidget = memo(function StorageAnalyticsWidget({ stats, files }: { stats: DashboardStats; files: FileItem[] }) {
  const usedGB = useMemo(() => (stats.used / 1024 / 1024 / 1024).toFixed(1), [stats.used]);
  const limitGB = useMemo(() => (stats.limit / 1024 / 1024 / 1024).toFixed(0), [stats.limit]);
  const percent = useMemo(() => Math.min(100, (stats.used / stats.limit) * 100), [stats.used, stats.limit]);

  const categories = useMemo(() => [
    { label: 'Photos', value: files.filter(f => f.mime_type?.startsWith('image/')).length, color: 'from-blue-500 to-cyan-500', pct: 35 },
    { label: 'Videos', value: files.filter(f => f.mime_type?.startsWith('video/')).length, color: 'from-purple-500 to-pink-500', pct: 25 },
    { label: 'Documents', value: files.filter(f => f.mime_type?.includes('pdf') || f.mime_type?.includes('document')).length, color: 'from-amber-500 to-orange-500', pct: 20 },
    { label: 'Music', value: files.filter(f => f.mime_type?.startsWith('audio/')).length, color: 'from-emerald-500 to-teal-500', pct: 10 },
    { label: 'Other', value: files.filter(f => !f.mime_type?.startsWith('image/') && !f.mime_type?.startsWith('video/') && !f.mime_type?.startsWith('audio/') && !f.mime_type?.includes('pdf') && !f.mime_type?.includes('document')).length, color: 'from-zinc-500 to-zinc-600', pct: 10 },
  ], [files]);

  const largestFiles = useMemo(() => [...files].sort((a, b) => b.size - a.size).slice(0, 5), [files]);

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-emerald-400" />
          <h3 className="text-xs font-bold text-white/80">Storage Analytics</h3>
        </div>
      </div>

      {/* Usage */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-medium text-white/50">Storage Used</span>
          <span className="text-[10px] font-semibold text-white/70">{usedGB} GB / {limitGB} GB</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
          <div className="h-full rounded-full bg-gradient-to-r from-purple-500 via-cyan-500 to-blue-500 transition-[width] duration-1000" style={{ width: `${percent}%` }} />
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="space-y-2 mb-4">
        {categories.map(cat => (
          <div key={cat.label}>
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[9px] font-medium text-white/40">{cat.label}</span>
              <span className="text-[9px] text-white/30">{cat.value}</span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <div className={`h-full rounded-full bg-gradient-to-r ${cat.color}`} style={{ width: `${cat.pct}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Largest Files */}
      <div>
        <p className="text-[9px] font-semibold uppercase tracking-wider text-white/30 mb-2">Largest Files</p>
        <div className="space-y-1">
          {largestFiles.map(file => (
            <div key={file.id} className="flex items-center justify-between">
              <span className="text-[9px] text-white/50 truncate flex-1">{file.filename}</span>
              <span className="text-[9px] text-white/30 ml-2">{formatSize(file.size)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

// ── Security Center Widget ────────────────────────────────────────────
const SecurityCenterWidget = memo(function SecurityCenterWidget() {
  const items = useMemo(() => [
    { label: 'Encryption', status: 'Active', ok: true, icon: Lock },
    { label: '2FA', status: 'Not Enabled', ok: false, icon: Fingerprint },
    { label: 'Backup', status: 'Up to Date', ok: true, icon: Database },
    { label: 'Threat Scan', status: 'No Threats', ok: true, icon: Shield },
    { label: 'Active Sessions', status: '2 sessions', ok: true, icon: Monitor },
    { label: 'Cloud Sync', status: 'Synced', ok: true, icon: Cloud },
    { label: 'Network', status: 'Connected', ok: true, icon: Wifi },
    { label: 'Server', status: 'Healthy', ok: true, icon: Server },
  ], []);

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-emerald-400" />
          <h3 className="text-xs font-bold text-white/80">Security Center</h3>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {items.map(item => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="flex items-center gap-2 rounded-xl border border-white/[0.04] bg-white/[0.02] p-2.5">
              <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${item.ok ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
                <Icon className={`h-3.5 w-3.5 ${item.ok ? 'text-emerald-400' : 'text-amber-400'}`} />
              </div>
              <div>
                <p className="text-[9px] font-medium text-white/50">{item.label}</p>
                <p className={`text-[9px] font-semibold ${item.ok ? 'text-emerald-400' : 'text-amber-400'}`}>{item.status}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

// ── AI Assistant Widget ───────────────────────────────────────────────
const AIAssistantWidget = memo(function AIAssistantWidget() {
  const [input, setInput] = useState('');
  const suggestions = useMemo(() => [
    'Find my recent PDF files',
    'Show largest files',
    'Clean up duplicate files',
    'Organize my photos by date',
  ], []);

  return (
    <div className="rounded-2xl border border-purple-500/10 bg-gradient-to-br from-purple-500/5 to-cyan-500/5 p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 shadow-lg">
          <Sparkles className="h-3.5 w-3.5 text-white" />
        </div>
        <h3 className="text-xs font-bold text-white/80">AI Assistant</h3>
      </div>
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          placeholder="Ask AI to find files..."
          value={input}
          onChange={e => setInput(e.target.value)}
          className="flex-1 rounded-lg border border-white/[0.06] bg-white/[0.04] px-3 py-2 text-xs text-white outline-none placeholder:text-white/20 focus:border-purple-500/30"
        />
        <button className="rounded-lg bg-gradient-to-r from-purple-500 to-cyan-500 px-3 py-2 shadow-lg">
          <FileSearch className="h-4 w-4 text-white" />
        </button>
      </div>
      <div className="space-y-1">
        {suggestions.map((s, i) => (
          <button key={i} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[9px] text-white/40 hover:bg-white/[0.04] hover:text-white/60 transition-colors">
            <Sparkles className="h-3 w-3 text-purple-400" />
            {s}
          </button>
        ))}
      </div>
    </div>
  );
});

// ── Notifications Widget ──────────────────────────────────────────────
const NotificationsWidget = memo(function NotificationsWidget() {
  const [notifs] = useState<Notification[]>([
    { id: '1', title: 'Upload Complete', message: 'Files synced successfully', time: '2m ago', read: false, type: 'success' },
    { id: '2', title: 'Security Alert', message: 'New login from Chrome', time: '1h ago', read: false, type: 'warning' },
    { id: '3', title: 'Storage Update', message: '45% storage used', time: '3h ago', read: true, type: 'info' },
    { id: '4', title: 'Backup Complete', message: 'Daily backup finished', time: '5h ago', read: true, type: 'success' },
    { id: '5', title: 'Share Expiring', message: 'Link expires in 2 days', time: '1d ago', read: true, type: 'warning' },
  ]);

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-purple-400" />
          <h3 className="text-xs font-bold text-white/80">Notifications</h3>
        </div>
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 text-[8px] font-bold text-white">{notifs.filter(n => !n.read).length}</span>
      </div>
      <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-none">
        {notifs.map(n => (
          <div key={n.id} className={`flex items-start gap-2.5 rounded-xl border p-2.5 ${n.read ? 'border-white/[0.03]' : 'border-purple-500/15 bg-purple-500/5'}`}>
            <div className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-lg ${n.type === 'success' ? 'bg-emerald-500/10' : n.type === 'warning' ? 'bg-amber-500/10' : 'bg-blue-500/10'}`}>
              {n.type === 'success' ? <CheckCircle2 className="h-3 w-3 text-emerald-400" /> :
               n.type === 'warning' ? <AlertTriangle className="h-3 w-3 text-amber-400" /> :
               <Info className="h-3 w-3 text-blue-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-[10px] font-semibold ${n.read ? 'text-white/50' : 'text-white/80'}`}>{n.title}</p>
              <p className="text-[9px] text-white/30">{n.message}</p>
              <p className="text-[8px] text-white/20 mt-0.5">{n.time}</p>
            </div>
            {!n.read && <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-purple-400 shadow-[0_0_6px_rgba(124,92,255,0.6)]" />}
          </div>
        ))}
      </div>
    </div>
  );
});

// ── Weekly Report Widget ──────────────────────────────────────────────
const WeeklyReportWidget = memo(function WeeklyReportWidget({ files }: { files: FileItem[] }) {
  const days = useMemo(() => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], []);
  const data = useMemo(() => days.map(() => Math.floor(Math.random() * 10) + 1), [days]); // Stable on mount
  const max = useMemo(() => Math.max(...data), [data]);

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-cyan-400" />
          <h3 className="text-xs font-bold text-white/80">Weekly Uploads</h3>
        </div>
        <span className="text-[9px] text-white/30">{files.length} total</span>
      </div>
      <div className="flex items-end gap-1.5 h-20 gpu-layer">
        {data.map((v, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <div
              className="w-full rounded-t-md bg-gradient-to-t from-purple-500/50 to-cyan-500/50 transition-[height,background] duration-500 hover:from-purple-500 hover:to-cyan-500"
              style={{ height: `${(v / max) * 100}%` }}
            />
            <span className="text-[7px] font-medium text-white/20">{days[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

// ── Connected Devices Widget ──────────────────────────────────────────
const ConnectedDevicesWidget = memo(function ConnectedDevicesWidget() {
  const devices = useMemo(() => [
    { name: 'Windows PC', icon: Monitor, status: 'Active', lastSeen: 'Now' },
    { name: 'iPhone 15', icon: Smartphone, status: 'Active', lastSeen: '2m ago' },
    { name: 'MacBook Pro', icon: Monitor, status: 'Idle', lastSeen: '1h ago' },
  ], []);

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Monitor className="h-4 w-4 text-blue-400" />
          <h3 className="text-xs font-bold text-white/80">Connected Devices</h3>
        </div>
      </div>
      <div className="space-y-2">
        {devices.map(d => {
          const Icon = d.icon;
          return (
            <div key={d.name} className="flex items-center gap-3 rounded-xl border border-white/[0.04] bg-white/[0.02] p-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10">
                <Icon className="h-3.5 w-3.5 text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-semibold text-white/70">{d.name}</p>
                <p className="text-[9px] text-white/30">{d.lastSeen}</p>
              </div>
              <span className={`flex items-center gap-1 text-[9px] font-medium ${d.status === 'Active' ? 'text-emerald-400' : 'text-white/30'}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${d.status === 'Active' ? 'bg-emerald-400' : 'bg-white/20'}`} />
                {d.status}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
});

// ── Productivity Widget ────────────────────────────────────────────
const ProductivityWidget = memo(function ProductivityWidget({ userId }: { userId: string }) {
  const [tab, setTab] = useState<'todos' | 'reminders' | 'events'>('todos');
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [newTodo, setNewTodo] = useState('');

  useEffect(() => {
    setTodos(productivityService.getTodos(userId).slice(0, 6));
    setReminders(productivityService.getReminders(userId).filter(r => !r.completed).slice(0, 5));
    const today = new Date().toISOString().split('T')[0];
    setEvents(productivityService.getEvents(userId).filter(e => e.date >= today).slice(0, 5));
  }, [userId]);

  const addTodo = () => {
    if (!newTodo.trim()) return;
    const t = productivityService.createTodo(userId, { text: newTodo.trim(), completed: false, priority: 'medium', dueDate: null, category: 'General' });
    setTodos(prev => [t, ...prev].slice(0, 6));
    setNewTodo('');
  };

  const toggleTodo = (id: string) => {
    productivityService.toggleTodo(userId, id);
    setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const priorityColor = (p: string) => p === 'high' ? 'text-red-400' : p === 'medium' ? 'text-amber-400' : 'text-emerald-400';

  const tabs = [
    { key: 'todos', label: 'Todos', count: todos.filter(t => !t.completed).length },
    { key: 'reminders', label: 'Reminders', count: reminders.length },
    { key: 'events', label: 'Events', count: events.length },
  ] as const;

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 shadow-lg">
          <Zap className="h-3.5 w-3.5 text-white" />
        </div>
        <h3 className="text-xs font-bold text-white/80">Productivity</h3>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-[9px] font-semibold transition-all ${
              tab === t.key ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white shadow' : 'text-white/40 hover:text-white/60'
            }`}>
            {t.label}
            {t.count > 0 && <span className={`rounded-full px-1 text-[8px] font-bold ${ tab === t.key ? 'bg-white/20' : 'bg-white/[0.06]'}`}>{t.count}</span>}
          </button>
        ))}
      </div>

      {/* Todos */}
      {tab === 'todos' && (
        <div className="space-y-1.5">
          <div className="flex gap-2 mb-2">
            <input value={newTodo} onChange={e => setNewTodo(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTodo()}
              placeholder="Add a task..."
              className="flex-1 rounded-lg border border-white/[0.06] bg-white/[0.04] px-3 py-1.5 text-xs text-white outline-none placeholder:text-white/20 focus:border-purple-500/30" />
            <button onClick={addTodo} className="rounded-lg bg-gradient-to-r from-purple-500 to-cyan-500 px-3 py-1.5 text-xs font-bold text-white shadow-lg">+</button>
          </div>
          {todos.length === 0 && <p className="py-4 text-center text-[10px] text-white/20">No tasks yet</p>}
          {todos.map(t => (
            <button key={t.id} onClick={() => toggleTodo(t.id)}
              className="flex w-full items-center gap-2.5 rounded-xl border border-transparent p-2 transition hover:border-white/[0.06] hover:bg-white/[0.03]">
              <span className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border ${
                t.completed ? 'border-emerald-500 bg-emerald-500/20' : 'border-white/20'
              }`}>
                {t.completed && <CheckCircle2 className="h-3 w-3 text-emerald-400" />}
              </span>
              <span className={`flex-1 text-left text-[10px] font-medium ${ t.completed ? 'line-through text-white/20' : 'text-white/60'}`}>{t.text}</span>
              <span className={`text-[8px] font-bold uppercase ${priorityColor(t.priority)}`}>{t.priority}</span>
            </button>
          ))}
        </div>
      )}

      {/* Reminders */}
      {tab === 'reminders' && (
        <div className="space-y-1.5">
          {reminders.length === 0 && <p className="py-4 text-center text-[10px] text-white/20">No pending reminders</p>}
          {reminders.map(r => (
            <div key={r.id} className="flex items-start gap-2.5 rounded-xl border border-white/[0.04] bg-white/[0.02] p-2.5">
              <div className={`mt-0.5 h-2 w-2 flex-shrink-0 rounded-full ${
                r.priority === 'high' ? 'bg-red-400' : r.priority === 'medium' ? 'bg-amber-400' : 'bg-emerald-400'
              }`} />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-white/70 truncate">{r.title}</p>
                {r.dueAt && <p className="text-[8px] text-white/30 mt-0.5">{new Date(r.dueAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>}
              </div>
              <button onClick={() => { productivityService.completeReminder(userId, r.id); setReminders(prev => prev.filter(x => x.id !== r.id)); }}
                className="text-[8px] font-semibold text-emerald-400 hover:text-emerald-300">Done</button>
            </div>
          ))}
        </div>
      )}

      {/* Events */}
      {tab === 'events' && (
        <div className="space-y-1.5">
          {events.length === 0 && <p className="py-4 text-center text-[10px] text-white/20">No upcoming events</p>}
          {events.map(e => (
            <div key={e.id} className="flex items-start gap-2.5 rounded-xl border border-white/[0.04] p-2.5" style={{ borderColor: `${e.color}20`, background: `${e.color}08` }}>
              <div className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full" style={{ background: e.color }} />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-white/70 truncate">{e.title}</p>
                <p className="text-[8px] text-white/30 mt-0.5">{new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}{!e.allDay && ` • ${e.time}`}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

// ── Daily Quote Widget ───────────────────────────────────────────────
const QUOTES = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "Great things are done by a series of small things brought together.", author: "Vincent Van Gogh" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
];

const DailyQuoteWidget = memo(function DailyQuoteWidget() {
  const quote = useMemo(() => QUOTES[new Date().getDay() % QUOTES.length], []);
  return (
    <div className="rounded-2xl border border-purple-500/10 bg-gradient-to-br from-purple-500/5 via-cyan-500/5 to-blue-500/5 p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 shadow-lg">
          <span className="text-sm">💬</span>
        </div>
        <h3 className="text-xs font-bold text-white/80">Daily Quote</h3>
      </div>
      <blockquote className="text-sm font-medium leading-relaxed text-white/70 italic">
        &ldquo;{quote.text}&rdquo;
      </blockquote>
      <p className="mt-2 text-[10px] font-semibold text-purple-400/80">— {quote.author}</p>
    </div>
  );
});

// ── Duplicate Files Widget ────────────────────────────────────────────
const DuplicateFilesWidget = memo(function DuplicateFilesWidget() {
  const duplicates = useMemo(() => [
    { name: 'photo (2).jpg', size: '2.3 MB', original: 'photo.jpg' },
    { name: 'report - Copy.pdf', size: '1.1 MB', original: 'report.pdf' },
  ], []);

  return (
    <div className="rounded-2xl border border-amber-500/10 bg-gradient-to-br from-amber-500/5 to-orange-500/5 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Copy className="h-4 w-4 text-amber-400" />
        <h3 className="text-xs font-bold text-white/80">Duplicate Files</h3>
        <span className="text-[9px] text-amber-400/60 ml-auto">{duplicates.length} found</span>
      </div>
      <div className="space-y-1.5">
        {duplicates.map(d => (
          <div key={d.name} className="flex items-center justify-between rounded-lg bg-white/[0.03] p-2">
            <div>
              <p className="text-[9px] text-white/60">{d.name}</p>
              <p className="text-[8px] text-white/20">Duplicate of {d.original}</p>
            </div>
            <span className="text-[9px] text-white/30">{d.size}</span>
          </div>
        ))}
      </div>
      <button className="mt-2 w-full rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 py-1.5 text-[9px] font-bold text-white shadow-lg">Clean Duplicates</button>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════════
export default function NovaaDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<DashboardStats>({ used: 0, limit: 200 * 1024 * 1024 * 1024, fileCount: 0, categoryBreakdown: {} });
  const [allFiles, setAllFiles] = useState<FileItem[]>([]);
  const [starredFiles, setStarredFiles] = useState<FileItem[]>([]);
  const [sharedFiles, setSharedFiles] = useState<FileItem[]>([]);
  const [trashedFiles, setTrashedFiles] = useState<FileItem[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageLoaded, setPageLoaded] = useState(false);
  const [showCmdPalette, setShowCmdPalette] = useState(false);
  const [cmdSearch, setCmdSearch] = useState('');
  const [darkMode, setDarkMode] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const cmdInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setPageLoaded(true); }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setShowCmdPalette(p => !p); }
      if (e.key === 'Escape') setShowCmdPalette(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (showCmdPalette && cmdInputRef.current) cmdInputRef.current.focus();
  }, [showCmdPalette]);

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
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const greeting = useMemo(() => getTimeGreeting(), []);

  // Memoize all derived data
  const recentFiles = useMemo(() => allFiles.slice(0, 8), [allFiles]);
  const pinnedFiles = useMemo(() => allFiles.filter(f => f.is_starred).slice(0, 5), [allFiles]);
  const recentPhotos = useMemo(() => allFiles.filter(f => f.mime_type?.startsWith('image/')).slice(0, 6), [allFiles]);
  const recentVideos = useMemo(() => allFiles.filter(f => f.mime_type?.startsWith('video/')).slice(0, 4), [allFiles]);
  const recentDocs = useMemo(() => allFiles.filter(f => f.mime_type?.includes('pdf') || f.mime_type?.includes('document')).slice(0, 4), [allFiles]);
  const recentMusic = useMemo(() => allFiles.filter(f => f.mime_type?.startsWith('audio/')).slice(0, 4), [allFiles]);
  const offlineFiles = useMemo(() => allFiles.filter(f => f.blob).slice(0, 4), [allFiles]);

  const handleNavigate = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);

  // Memoize selected file handlers
  const handleFileClick = useCallback((file: FileItem) => {
    setSelectedFile(file);
  }, []);

  const handleCloseFileViewer = useCallback(() => {
    setSelectedFile(null);
  }, []);

  const cmdPaletteItems = useMemo(() => [
    { label: 'Upload Files', icon: Upload, action: () => navigate('/files'), shortcut: 'Ctrl+U' },
    { label: 'Search Files', icon: Search, action: () => setShowCmdPalette(false), shortcut: 'Ctrl+K' },
    { label: 'Go to Dashboard', icon: LayoutDashboard, action: () => navigate('/'), shortcut: 'Ctrl+D' },
    { label: 'Go to Photos', icon: Image, action: () => navigate('/photos'), shortcut: 'Ctrl+P' },
    { label: 'Go to Music', icon: Music, action: () => navigate('/music'), shortcut: 'Ctrl+M' },
    { label: 'Open Settings', icon: Settings, action: () => navigate('/profile'), shortcut: 'Ctrl+,' },
    { label: 'Toggle Dark Mode', icon: Sun, action: () => setDarkMode(!darkMode), shortcut: '' },
  ], [navigate, darkMode]);

  return (
    <div className={`dashboard-smooth transition-opacity duration-500 ${pageLoaded ? 'opacity-100' : 'opacity-0'}`}>
      {/* Command Palette */}
      {showCmdPalette && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-[#0B1020]/80 backdrop-blur-sm" onClick={() => setShowCmdPalette(false)}>
          <div className="w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[#0B1020]/95 p-4 shadow-2xl backdrop-blur-xl" onClick={e => e.stopPropagation()} style={{ animation: 'fadeInUp 0.2s ease-out' }}>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
              <input
                ref={cmdInputRef}
                type="text"
                placeholder="Search commands..."
                value={cmdSearch}
                onChange={e => setCmdSearch(e.target.value)}
                className="w-full rounded-xl border border-white/[0.06] bg-white/[0.04] py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-purple-500/30"
              />
            </div>
            <div className="space-y-1 max-h-64 overflow-y-auto scrollbar-none">
              {cmdPaletteItems
                .filter(item => item.label.toLowerCase().includes(cmdSearch.toLowerCase()))
                .map(item => {
                  const Icon = item.icon;
                  return (
                    <button key={item.label} onClick={() => { item.action(); setShowCmdPalette(false); }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white/90"
                    >
                      <Icon className="h-4 w-4 text-purple-400" />
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.shortcut && <kbd className="rounded-lg border border-white/[0.06] bg-white/[0.04] px-1.5 py-0.5 text-[9px] font-mono text-white/20">{item.shortcut}</kbd>}
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* File Preview */}
      {selectedFile && (
        <FileViewer
          file={selectedFile}
          allFiles={allFiles}
          onClose={handleCloseFileViewer}
          onToggleStar={async f => { await fileService.toggleStar(user!.id, f.id, !f.is_starred); fetchData(); }}
          onTrash={async f => { await fileService.trashFile(user!.id, f.id, true); fetchData(); setSelectedFile(null); }}
        />
      )}

      {/* Welcome Section */}
      <div className="mb-6 gpu-layer">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="hidden sm:block"><NovaaLogo size={64} /></div>
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-base leading-none">{greeting.icon}</span>
                <span className="text-[10px] font-semibold text-purple-400/80 uppercase tracking-wider">{greeting.text}</span>
                <span className="text-[9px] text-white/20">•</span>
                <span className="text-[9px] font-medium text-white/30">{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <h1 className="text-xl font-black tracking-tight text-white sm:text-2xl">
                Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">Novaa Drive</span>
              </h1>
              <p className="text-xs text-white/40 mt-0.5">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} — <span className="text-white/60 font-semibold">{user?.email?.split('@')[0] || 'User'}</span></p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowCmdPalette(true)}
              className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-xs text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white/70">
              <Command className="h-3.5 w-3.5" /> Commands
            </button>
            <button onClick={() => navigate('/files')}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-purple-500/20 transition-transform hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98]">
              <Upload className="h-3.5 w-3.5" /> Upload
            </button>
            <button onClick={fetchData}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03] text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white/70">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* AI Intelligence Card - Full Width */}
      <div className="mb-6">
        <NovaaAICard fileCount={stats.fileCount} loading={loading} />
      </div>

      {/* Widget Grid - Lazy loaded for scroll performance */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {/* Row 1: Clock + Weather + Quick Access + Upload Queue */}
        <LazyWidget><ClockWidget /></LazyWidget>
        <LazyWidget><WeatherWidget /></LazyWidget>
        <div className="sm:col-span-2"><LazyWidget><QuickAccessWidget onNavigate={handleNavigate} /></LazyWidget></div>

        {/* Row 2: Pinned + Recent + Starred + Shared */}
        <LazyWidget><FileSection title="Pinned Files" icon={Pin} iconColor="text-purple-400" files={pinnedFiles} onFileClick={handleFileClick} loading={loading} emptyMessage="Pin files for quick access" emptyIcon={Pin} /></LazyWidget>
        <LazyWidget><FileSection title="Recent Files" icon={Clock} iconColor="text-cyan-400" files={recentFiles} onFileClick={handleFileClick} loading={loading} emptyMessage="No recent files" /></LazyWidget>
        <LazyWidget><FileSection title="Starred Files" icon={Star} iconColor="text-amber-400" files={starredFiles} onFileClick={handleFileClick} loading={loading} emptyMessage="Star your favorite files" emptyIcon={Star} /></LazyWidget>
        <LazyWidget><FileSection title="Shared With Me" icon={Share2} iconColor="text-emerald-400" files={sharedFiles} onFileClick={handleFileClick} loading={loading} emptyMessage="No shared files" emptyIcon={Share2} /></LazyWidget>

        {/* Row 3: Photos + Videos + Music + Documents */}
        <LazyWidget><FileSection title="Recent Photos" icon={Image} iconColor="text-blue-400" files={recentPhotos} onFileClick={handleFileClick} loading={loading} emptyMessage="No photos yet" emptyIcon={Image} /></LazyWidget>
        <LazyWidget><FileSection title="Recent Videos" icon={Video} iconColor="text-pink-400" files={recentVideos} onFileClick={handleFileClick} loading={loading} emptyMessage="No videos yet" emptyIcon={Video} /></LazyWidget>
        <LazyWidget><FileSection title="Music Library" icon={Music} iconColor="text-emerald-400" files={recentMusic} onFileClick={handleFileClick} loading={loading} emptyMessage="No music files" emptyIcon={Music} /></LazyWidget>
        <LazyWidget><FileSection title="Documents" icon={FileText} iconColor="text-amber-400" files={recentDocs} onFileClick={handleFileClick} loading={loading} emptyMessage="No documents" emptyIcon={FileText} /></LazyWidget>

        {/* Row 4: Offline + Upload Queue + Sticky Notes + AI */}
        <LazyWidget><FileSection title="Offline Files" icon={Download} iconColor="text-blue-400" files={offlineFiles} onFileClick={handleFileClick} loading={loading} emptyMessage="No offline files" emptyIcon={Download} /></LazyWidget>
        <LazyWidget><UploadQueueWidget /></LazyWidget>
        <LazyWidget><StickyNotesWidget /></LazyWidget>
        <LazyWidget><AIAssistantWidget /></LazyWidget>

        {/* Row 4b: Productivity (full width on sm, 2 cols on lg) */}
        <div className="sm:col-span-2">
          <LazyWidget><ProductivityWidget userId={user?.id ?? ''} /></LazyWidget>
        </div>

        {/* Row 5: Storage Analytics + Weekly Report + Duplicates + Security */}
        <div className="sm:col-span-2"><LazyWidget><StorageAnalyticsWidget stats={stats} files={allFiles} /></LazyWidget></div>
        <LazyWidget><WeeklyReportWidget files={allFiles} /></LazyWidget>
        <LazyWidget><DailyQuoteWidget /></LazyWidget>
        <LazyWidget><DuplicateFilesWidget /></LazyWidget>

        {/* Row 6: Notifications + Security + Devices */}
        <div className="sm:col-span-2"><LazyWidget><NotificationsWidget /></LazyWidget></div>
        <LazyWidget><SecurityCenterWidget /></LazyWidget>
        <LazyWidget><ConnectedDevicesWidget /></LazyWidget>

        {/* Row 7: Activity Timeline (full width) */}
        <div className="sm:col-span-2 lg:col-span-3 xl:col-span-4">
          <LazyWidget>
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="h-4 w-4 text-purple-400" />
                <h3 className="text-xs font-bold text-white/80">Activity Timeline</h3>
              </div>
              <ActivityTimeline logs={activityLogs} loading={loading} />
            </div>
          </LazyWidget>
        </div>
      </div>
    </div>
  );
}