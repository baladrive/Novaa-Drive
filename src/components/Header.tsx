import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, Search, Sun, Moon, LogOut, User, Settings, Bell, Info, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface HeaderProps {
  onToggleSidebar: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function Header({ onToggleSidebar, searchQuery, onSearchChange }: HeaderProps) {
  const { user, signOut, isAiMode, toggleAiMode } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const stored = localStorage.getItem("theme");
      if (stored) return stored === "dark";
    } catch {}
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return false;
  });

  const [notifications] = useState([
    { id: "n1", text: "Welcome to Bala Drive Cloud Storage!", date: "Just now", read: false },
    { id: "n2", text: "You have 200 GB available local quota.", date: "10 mins ago", read: false },
    { id: "n3", text: "Supabase connection checking is running in the background.", date: "1 hour ago", read: true },
  ]);

  const toggleTheme = () => {
    const isDark = !darkMode;
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const getInitials = (email?: string) => {
    if (!email) return "U";
    return email.slice(0, 2).toUpperCase();
  };

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-zinc-150/70 bg-white/70 px-4 backdrop-blur-md dark:border-zinc-900/50 dark:bg-zinc-950/70 z-10">
      
      {/* Sidebar mobile toggler & Brand */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-full p-2 text-zinc-500 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-900/60 lg:hidden"
          aria-label="Toggle Navigation Sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden items-center gap-2 lg:flex">
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
          <span className="text-sm font-black tracking-tight text-zinc-900 dark:text-white">
            Bala <span className="text-amber-500 font-extrabold">Drive</span>
          </span>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="mx-4 flex max-w-xl flex-1 items-center gap-2 rounded-2xl bg-zinc-50/70 py-2 pl-3.5 pr-4 border border-zinc-100 dark:border-zinc-900/30 transition-colors focus-within:bg-white focus-within:ring-2 focus-within:ring-amber-500/20 dark:bg-zinc-900/40 dark:focus-within:bg-zinc-950">
        <Search className="h-4.5 w-4.5 text-zinc-400" />
        <input
          type="text"
          placeholder="Search by filename or tags..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-transparent text-xs text-zinc-800 outline-none placeholder-zinc-400 dark:text-zinc-200"
        />
      </div>

      {/* Controls & User Profile */}
      <div className="flex items-center gap-2.5">
        
        {/* AI Smart Mode Toggle */}
        <button
          onClick={toggleAiMode}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer border
            ${isAiMode 
              ? "bg-amber-500/10 text-amber-500 border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.15)] dark:bg-amber-500/20" 
              : "bg-zinc-150/40 text-zinc-400 border-zinc-200 dark:bg-zinc-900/60 dark:border-zinc-800"}`}
          title="Toggle AI Smart Mode"
        >
          <Sparkles className={`h-3.5 w-3.5 ${isAiMode ? "text-amber-500 animate-pulse" : "text-zinc-400"}`} />
          <span>{isAiMode ? "AI Smart ON" : "AI Smart OFF"}</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="rounded-full p-2 text-zinc-500 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-900/60 transition-colors cursor-pointer"
          aria-label="Toggle Theme Mode"
        >
          {darkMode ? <Sun className="h-5 w-5 text-amber-500 animate-pulse" /> : <Moon className="h-5 w-5" />}
        </button>

        {/* Notifications Tray */}
        <div className="relative">
          <button
            onClick={() => {
              setIsNotifOpen(!isNotifOpen);
              setIsDropdownOpen(false);
            }}
            className="relative rounded-full p-2 text-zinc-500 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-900/60 transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1.5 flex h-2 w-2 rounded-full bg-amber-500" />
          </button>

          {isNotifOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setIsNotifOpen(false)} />
              <div className="absolute right-0 mt-3.5 w-80 origin-top-right rounded-2xl border border-zinc-150/70 bg-white p-4 shadow-xl dark:border-zinc-900/50 dark:bg-zinc-950 z-45">
                <h4 className="text-xs font-black text-zinc-900 dark:text-white pb-2.5 border-b border-zinc-100 dark:border-zinc-900 mb-2">
                  Notifications
                </h4>
                <div className="space-y-2.5 max-h-60 overflow-y-auto">
                  {notifications.map((notif) => (
                    <div key={notif.id} className="flex items-start gap-2 text-xs">
                      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                        <Info className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-[11px] leading-snug ${notif.read ? "text-zinc-500" : "text-zinc-800 dark:text-zinc-200"}`}>
                          {notif.text}
                        </p>
                        <span className="text-[9px] text-zinc-450 mt-0.5 block">{notif.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Profile Avatar */}
        {user && (
          <div className="relative">
            <button
              onClick={() => {
                setIsDropdownOpen(!isDropdownOpen);
                setIsNotifOpen(false);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 text-xs font-black text-slate-900 shadow-sm border-2 border-white dark:border-zinc-900 hover:scale-105 transition-transform cursor-pointer"
            >
              {getInitials(user.email)}
            </button>

            {/* Profile Dropdown Menu */}
            {isDropdownOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setIsDropdownOpen(false)} />
                <div className="absolute right-0 mt-3.5 w-64 origin-top-right rounded-2xl border border-zinc-150/70 bg-white p-4 shadow-xl dark:border-zinc-900/50 dark:bg-zinc-950 z-40">
                  
                  {/* User details */}
                  <div className="flex items-center gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-900">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 font-bold dark:bg-amber-500/20 dark:text-amber-500">
                      <User className="h-5 w-5" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase">Signed in as</p>
                      <p className="truncate text-xs font-bold text-zinc-800 dark:text-zinc-200">{user.email}</p>
                    </div>
                  </div>

                  {/* Settings & Profile */}
                  <Link
                    to="/profile"
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900/60 transition-colors my-1.5"
                  >
                    <Settings className="h-4 w-4 text-zinc-450" />
                    Settings & Activity Logs
                  </Link>

                  {/* Sign Out */}
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      signOut();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

    </header>
  );
}
