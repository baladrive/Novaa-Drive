import React, { useState, useRef, useEffect, memo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Menu, Search, Bell, Command, Sun, Moon, User, Settings,
  LogOut, ChevronDown, Sparkles, Cloud
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useDebounce } from "../utils/optimization";

interface HeaderProps {
  onToggleSidebar: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

// Memoized notification item
const NotificationItem = memo(function NotificationItem({ 
  notification 
}: { 
  notification: { id: number; title: string; message: string; time: string; read: boolean } 
}) {
  return (
    <div className={`rounded-xl border p-3 transition-all hover:bg-white/[0.03] ${notification.read ? 'border-white/[0.04]' : 'border-purple-500/20 bg-purple-500/5'}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className={`text-xs font-semibold ${notification.read ? 'text-white/50' : 'text-white'}`}>{notification.title}</p>
          <p className="mt-0.5 text-[10px] text-white/30">{notification.message}</p>
        </div>
        {!notification.read && <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-purple-400 shadow-[0_0_6px_rgba(124,92,255,0.6)]" />}
      </div>
      <p className="mt-1 text-[9px] font-medium text-white/20">{notification.time}</p>
    </div>
  );
});

const notifications = [
  { id: 1, title: "Upload Complete", message: "Your files have been synced.", time: "2m ago", read: false },
  { id: 2, title: "Security Alert", message: "New login from Chrome, Windows.", time: "1h ago", read: false },
  { id: 3, title: "Storage Update", message: "You've used 45% of your storage.", time: "3h ago", read: true },
];

const NovaaHeader = memo(function NovaaHeader({ onToggleSidebar, searchQuery, onSearchChange }: HeaderProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Debounce search to parent
  const debouncedSearch = useDebounce(localSearch, 200);
  
  useEffect(() => {
    if (debouncedSearch !== searchQuery) {
      onSearchChange(debouncedSearch);
    }
  }, [debouncedSearch, onSearchChange, searchQuery]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowUserMenu(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
    };
      document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    if (hour < 21) return "Good Evening";
    return "Good Night";
  })();

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleSearchChangeLocal = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearch(e.target.value);
  }, []);

  const handleNavigateProfile = useCallback(() => {
    navigate('/profile');
    setShowUserMenu(false);
  }, [navigate]);

  const handleSignOut = useCallback(() => {
    signOut();
    setShowUserMenu(false);
  }, [signOut]);

  return (
    <header className="fixed top-0 left-0 right-0 z-20 h-16 border-b border-white/[0.06] bg-[#0B1020]/80 backdrop-blur-xl">
      <div className="flex h-full items-center justify-between px-4 lg:px-6">
        {/* Left: Menu + Brand */}
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSidebar}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03] text-white/50 transition-all hover:bg-white/[0.06] hover:text-white/80"
          >
            <Menu className="h-4 w-4" />
          </button>

          <Link to="/" className="hidden items-center gap-2.5 sm:flex">
            <div className="relative flex h-8 w-8 items-center justify-center">
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 opacity-60 blur-sm" />
              <div className="relative flex h-full w-full items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500">
                <Cloud className="h-4 w-4 text-white" />
              </div>
            </div>
            <span className="text-sm font-black tracking-tight text-white">Novaa</span>
            <span className="text-sm font-black tracking-tight text-purple-400">Drive</span>
          </Link>
        </div>

        {/* Center: Search */}
        <div className="hidden flex-1 max-w-md mx-4 md:block">
          <div className={`relative transition-all duration-150 ${searchFocused ? 'scale-[1.02]' : ''}`}>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              placeholder="Search files, folders, and more..."
              value={localSearch}
              onChange={handleSearchChangeLocal}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className="w-full rounded-xl border border-white/[0.06] bg-white/[0.04] py-2.5 pl-10 pr-10 text-sm text-white outline-none transition-all placeholder:text-white/25 focus:border-purple-500/40 focus:bg-white/[0.06] focus:ring-2 focus:ring-purple-500/15"
            />
            <kbd className="absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-0.5 rounded-lg border border-white/[0.06] bg-white/[0.04] px-1.5 py-0.5 text-[9px] font-mono text-white/25 sm:flex">
              <Command className="h-2.5 w-2.5" />K
            </kbd>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03] text-white/50 transition-all hover:bg-white/[0.06] hover:text-white/80"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 text-[8px] font-bold text-white shadow-lg">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 origin-top-right rounded-2xl border border-white/[0.08] bg-[#0B1020]/95 p-4 shadow-2xl backdrop-blur-xl" style={{ animation: 'fadeIn 0.2s ease-out' }}>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">Notifications</h3>
                  <button onClick={() => setShowNotifications(false)} className="text-[10px] font-semibold text-purple-400 hover:text-purple-300">Mark all read</button>
                </div>
                <div className="space-y-2">
                  {notifications.map((n) => (
                    <NotificationItem key={n.id} notification={n} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="group flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] p-1.5 pl-2 transition-all hover:bg-white/[0.06]"
            >
              <div className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 text-[10px] font-bold text-white shadow-lg">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
                <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0B1020] bg-emerald-400 shadow-[0_0_6px_rgba(0,212,132,0.6)]" />
              </div>
              <div className="hidden text-left md:block">
                <p className="text-xs font-semibold text-white/80 leading-tight">{user?.email?.split('@')[0] || 'User'}</p>
                <p className="text-[9px] font-medium text-white/30 leading-tight">{greeting}</p>
              </div>
              <ChevronDown className="mr-1 h-3.5 w-3.5 text-white/30 transition-transform group-hover:rotate-180" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-2xl border border-white/[0.08] bg-[#0B1020]/95 p-2 shadow-2xl backdrop-blur-xl" style={{ animation: 'fadeIn 0.2s ease-out' }}>
                <div className="mb-2 border-b border-white/[0.06] pb-2">
                  <p className="px-3 text-xs font-semibold text-white">{user?.email?.split('@')[0] || 'User'}</p>
                  <p className="px-3 text-[10px] text-white/30">{user?.email}</p>
                </div>
                <button onClick={handleNavigateProfile} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium text-white/50 transition-all hover:bg-white/[0.06] hover:text-white/80">
                  <Settings className="h-4 w-4" /> Settings
                </button>
                <button onClick={handleSignOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium text-red-400/70 transition-all hover:bg-red-500/10 hover:text-red-400">
                  <LogOut className="h-4 w-4" /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
});

export default NovaaHeader;