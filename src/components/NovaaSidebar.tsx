import React, { useState, useEffect, memo, useCallback, useMemo } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  LayoutDashboard, FolderOpen, Image, Music, Share2, Trash2, Settings,
  Cloud, EyeOff, FileText, CheckSquare, Calendar, Bell, Sparkles,
  Video, Star, Shield, X
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { fileService } from "../services/fileService";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  storageRefreshKey: number;
}

const navSections = [
  {
    label: "Main",
    items: [
      { name: "Dashboard", path: "/", icon: LayoutDashboard },
      { name: "My Files", path: "/files", icon: FolderOpen },
      { name: "Photos", path: "/photos", icon: Image },
      { name: "Videos", path: "/videos", icon: Video },
      { name: "Music", path: "/music", icon: Music },
      { name: "Documents", path: "/documents", icon: FileText },
    ],
  },
  {
    label: "Collections",
    items: [
      { name: "Favorites", path: "/favorites", icon: Star },
      { name: "Shared", path: "/sharing", icon: Share2 },
      { name: "Secure Vault", path: "/hidden", icon: Shield },
    ],
  },
  {
    label: "Workspace",
    items: [
      { name: "Notes", path: "/notes", icon: FileText },
      { name: "To-Do List", path: "/todos", icon: CheckSquare },
      { name: "Calendar", path: "/calendar", icon: Calendar },
      { name: "Reminders", path: "/reminders", icon: Bell },
    ],
  },
  {
    label: "System",
    items: [
      { name: "Trash", path: "/trash", icon: Trash2 },
      { name: "Settings", path: "/settings", icon: Settings },
      { name: "Enterprise", path: "/enterprise", icon: Sparkles },
      { name: "Cloud", path: "/cloud", icon: Cloud },
    ],
  },
];

// Memoized nav item
const NavItem = memo(function NavItem({ 
  item, 
  isActive, 
  onClose 
}: { 
  item: { name: string; path: string; icon: React.ElementType }; 
  isActive: boolean; 
  onClose: () => void;
}) {
  const Icon = item.icon;
  const navigate = useNavigate();

  const handleClick = useCallback(() => {
    onClose();
    navigate(item.path);
  }, [navigate, item.path, onClose]);

  const handleMouseEnter = useCallback(() => {
    // Preload route on hover
    if (typeof window !== 'undefined' && (window as any).__preloadRoute) {
      (window as any).__preloadRoute(item.path);
    }
  }, [item.path]);

  return (
    <button
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-200 ${
        isActive
          ? "bg-gradient-to-r from-purple-500/15 to-cyan-500/10 text-white shadow-sm border border-purple-500/10"
          : "text-white/40 hover:bg-white/[0.04] hover:text-white/70"
      }`}
    >
      <div className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-200 ${
        isActive
          ? "bg-gradient-to-br from-purple-500 to-cyan-500 shadow-lg shadow-purple-500/20"
          : "bg-white/[0.04] group-hover:bg-white/[0.08]"
      }`}>
        <Icon className={`h-3.5 w-3.5 ${isActive ? "text-white" : "text-white/40 group-hover:text-white/60"}`} />
      </div>
      {item.name}
      {isActive && (
        <div className="ml-auto h-1.5 w-1.5 rounded-full bg-purple-400 shadow-[0_0_6px_rgba(124,92,255,0.6)]" />
      )}
    </button>
  );
});

// Memoized nav section
// ── Helper to check if a path is active ─────────────────────────────────
function isPathActive(currentPath: string, itemPath: string): boolean {
  if (itemPath === '/') return currentPath === '/';
  return currentPath.startsWith(itemPath);
}

const NavSection = memo(function NavSection({ 
  section, 
  currentPath, 
  onClose 
}: { 
  section: typeof navSections[0]; 
  currentPath: string; 
  onClose: () => void;
}) {
  return (
    <div>
      <p className="px-3 pb-1.5 text-[9px] font-bold uppercase tracking-[0.25em] text-white/20">
        {section.label}
      </p>
      <div className="space-y-0.5">
        {section.items.map((item) => (
          <NavItem
            key={item.name}
            item={item}
            isActive={isPathActive(currentPath, item.path)}
            onClose={onClose}
          />
        ))}
      </div>
    </div>
  );
});

// Memoized storage quota
const StorageQuota = memo(function StorageQuota({ 
  storage, 
  formatSize, 
  usedPercentage, 
  onClose 
}: { 
  storage: { used: number; limit: number }; 
  formatSize: (bytes: number) => string; 
  usedPercentage: number; 
  onClose: () => void;
}) {
  return (
    <div className="border-t border-white/[0.06] p-4">
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 backdrop-blur-xl">
        <div className="flex items-center justify-between text-[11px] font-semibold text-white/50">
          <span className="flex items-center gap-1.5">
            <Cloud className="h-3.5 w-3.5 text-purple-400" />
            Storage
          </span>
          <span>{usedPercentage.toFixed(1)}%</span>
        </div>
        <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 transition-all duration-500"
            style={{ width: `${usedPercentage}%` }}
          />
        </div>
        <p className="mt-2 text-[10px] font-medium text-white/30">
          {formatSize(storage.used)} of {formatSize(storage.limit)}
        </p>
        <Link
          to="/plans"
          onClick={onClose}
          className="mt-3 block w-full rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500 py-2 text-center text-[10px] font-bold text-white uppercase tracking-wider shadow-lg shadow-purple-500/20 transition-all hover:shadow-purple-500/40"
        >
          Upgrade Storage
        </Link>
      </div>
    </div>
  );
});

const NovaaSidebar = memo(function NovaaSidebar({ isOpen, onClose, storageRefreshKey }: SidebarProps) {
  const location = useLocation();
  const { user } = useAuth();
  const [storage, setStorage] = useState({ used: 0, limit: 200 * 1024 * 1024 * 1024 });

  useEffect(() => {
    if (user) {
      fileService.getStorageStats(user.id)
        .then(stats => setStorage({ used: stats.used, limit: stats.limit }))
        .catch(() => {});
    }
  }, [user, storageRefreshKey]);

  const formatSize = useCallback((bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }, []);

  const usedPercentage = useMemo(() => 
    Math.min(100, (storage.used / storage.limit) * 100),
  [storage.used, storage.limit]);

  const currentPath = location.pathname;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-20 bg-[#0B1020]/60 backdrop-blur-sm lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-72 flex-col border-r border-white/[0.06] bg-[#0B1020]/95 backdrop-blur-xl transition-all duration-300 lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-white/[0.06] px-5">
          <Link to="/" className="flex items-center gap-3" onClick={onClose}>
            <div className="relative flex h-9 w-9 items-center justify-center">
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 opacity-80 blur-sm" />
              <div className="relative flex h-full w-full items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500">
                <Cloud className="h-5 w-5 text-white" />
              </div>
            </div>
            <div>
              <span className="text-sm font-black tracking-tight text-white">Novaa</span>
              <span className="text-sm font-black tracking-tight text-purple-400"> Drive</span>
            </div>
          </Link>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-white/30 hover:bg-white/[0.06] hover:text-white/60 transition-all lg:hidden">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-none">
          {navSections.map((section) => (
            <NavSection
              key={section.label}
              section={section}
              currentPath={currentPath}
              onClose={onClose}
            />
          ))}
        </nav>

        {/* Storage Quota */}
        <StorageQuota
          storage={storage}
          formatSize={formatSize}
          usedPercentage={usedPercentage}
          onClose={onClose}
        />
      </aside>
    </>
  );
});

export default NovaaSidebar;