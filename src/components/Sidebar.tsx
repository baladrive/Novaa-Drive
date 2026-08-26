import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, FolderOpen, Image, Music, Share2, Trash2, Settings, Cloud, EyeOff, FileText, CheckSquare, Calendar, Bell, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { fileService } from "../services/fileService";
import { sanitizeLog } from "../utils/sanitize";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  storageRefreshKey: number;
}

export default function Sidebar({ isOpen, onClose, storageRefreshKey }: SidebarProps) {
  const location = useLocation();
  const { user } = useAuth();
  const [storage, setStorage] = useState({ used: 0, limit: 200 * 1024 * 1024 * 1024 });

  useEffect(() => {
    if (user) {
      fileService.getStorageStats(user.id)
        .then(stats => setStorage({ used: stats.used, limit: stats.limit }))
        .catch(err => console.error("Error fetching storage stats:", sanitizeLog(err)));
    }
  }, [user, storageRefreshKey]);

  const mainNavItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "My Files", path: "/files", icon: FolderOpen },
    { name: "Photos", path: "/photos", icon: Image },
    { name: "Music Playlists", path: "/music", icon: Music },
    { name: "Shared Files", path: "/sharing", icon: Share2 },
  ];

  const utilityNavItems = [
    { name: "Notes", path: "/notes", icon: FileText },
    { name: "To-Do List", path: "/todos", icon: CheckSquare },
    { name: "Calendar", path: "/calendar", icon: Calendar },
    { name: "Reminders", path: "/reminders", icon: Bell },
  ];

  const systemNavItems = [
    { name: "Trash Bin", path: "/trash", icon: Trash2 },
    { name: "Private Vault", path: "/hidden", icon: EyeOff },
    { name: "Settings & Logs", path: "/profile", icon: Settings },
    { name: "Enterprise", path: "/enterprise", icon: Sparkles },
  ];

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const usedPercentage = Math.min(100, (storage.used / storage.limit) * 100);

  const activeClasses = 
    "flex items-center gap-3.5 rounded-2xl bg-amber-500/10 px-4 py-3 text-xs font-black text-amber-500 transition-all dark:bg-amber-500/20";
  const inactiveClasses = 
    "flex items-center gap-3.5 rounded-2xl px-4 py-3 text-xs font-bold text-zinc-550 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-900/60 transition-all";

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-zinc-950/20 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-zinc-150/70 bg-white/80 backdrop-blur-md dark:border-zinc-900/50 dark:bg-zinc-950/80 transition-transform duration-300 lg:static lg:translate-x-0
          ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center gap-2.5 px-6 border-b border-zinc-150/50 dark:border-zinc-900/40">
          <svg
            className="h-8 w-8 animate-spin-slow hover:animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 0C15.3137 0 18 2.68629 18 6V12H12C8.68629 12 6 9.31371 6 6C6 2.68629 8.68629 0 12 0Z"
              fill="#EA4335"
            />
            <path
              d="M24 12C24 15.3137 21.3137 18 18 18H12V12C12 8.68629 14.6863 6 18 6C21.3137 6 24 8.68629 24 12Z"
              fill="#4285F4"
            />
            <path
              d="M12 24C8.68629 24 6 21.3137 6 18V12H12C15.3137 12 18 14.6863 18 18C18 21.3137 15.3137 24 12 24Z"
              fill="#FBBC05"
            />
            <path
              d="M0 12C0 8.68629 2.68629 6 6 6H12V12C12 15.3137 9.31371 18 6 18C2.68629 18 0 15.3137 0 12Z"
              fill="#34A853"
            />
          </svg>
          <span className="text-base font-black tracking-tight text-zinc-900 dark:text-white">
            Bala <span className="text-amber-500 font-extrabold">Drive</span>
          </span>
        </div>

        {/* Nav list */}
        <nav className="flex-1 space-y-1.5 px-4 py-6 overflow-y-auto">
          {/* Main Navigation */}
          <p className="px-3 pb-1 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-600">Main</p>
          {mainNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={onClose}
                className={isActive ? activeClasses : inactiveClasses}
              >
                <Icon className="h-4.5 w-4.5" />
                {item.name}
              </Link>
            );
          })}

          {/* Productivity */}
          <p className="px-3 pt-4 pb-1 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-600">Productivity</p>
          {utilityNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={onClose}
                className={isActive ? activeClasses : inactiveClasses}
              >
                <Icon className="h-4.5 w-4.5" />
                {item.name}
              </Link>
            );
          })}

          {/* System */}
          <p className="px-3 pt-4 pb-1 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-600">System</p>
          {systemNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={onClose}
                className={isActive ? activeClasses : inactiveClasses}
              >
                <Icon className="h-4.5 w-4.5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Storage Quota Bar */}
        <div className="p-4 border-t border-zinc-150/50 dark:border-zinc-900/40">
          <div className="rounded-3xl bg-zinc-50/50 p-4.5 dark:bg-zinc-900/40 border border-zinc-100/50 dark:border-zinc-900/30">
            <div className="flex items-center justify-between text-[11px] font-bold text-zinc-600 dark:text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Cloud className="h-3.5 w-3.5 text-amber-500" />
                Storage Space
              </span>
              <span>{usedPercentage.toFixed(1)}%</span>
            </div>
            
            {/* Progress bar */}
            <div className="mt-2.5 h-2 w-full rounded-full bg-zinc-200 overflow-hidden dark:bg-zinc-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-500"
                style={{ width: `${usedPercentage}%` }}
              />
            </div>
            
            <p className="mt-2 text-[10px] font-semibold text-zinc-550 dark:text-zinc-450 leading-relaxed">
              {formatSize(storage.used)} of {formatSize(storage.limit)} used
            </p>

            <Link
              to="/plans"
              onClick={onClose}
              className="mt-3.5 block text-center rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-2 text-[10px] uppercase tracking-wider shadow-sm transition-all"
            >
              Upgrade Storage
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
