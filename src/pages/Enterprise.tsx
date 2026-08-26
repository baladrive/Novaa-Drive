import React from "react";
import { motion } from "framer-motion";
import {
  Lock, Fingerprint, Shield, Smartphone, History, Globe, FileText,
  FolderOpen, Palette, Pin, Archive, Trash2, Copy, Search, Share2,
  QrCode, Clock, BarChart3, Star, TrendingUp, Award, Play, Music,
  Image, BookOpen, FileSpreadsheet, Crop, Pen, CheckSquare, Calendar,
  Bell, Layout, Cloud, RefreshCw, Monitor, Wifi, Brush, Columns, Zap
} from "lucide-react";
import { Link } from "react-router-dom";

const categories = [
  {
    title: "🔐 Security",
    icon: Shield,
    color: "from-rose-500/20 to-pink-500/10",
    border: "border-rose-500/20",
    features: [
      { name: "Secure Vault", icon: Lock, path: "/hidden", desc: "PIN/Password protected private folders" },
      { name: "Biometric Login", icon: Fingerprint, path: "/profile", desc: "Fingerprint & Face ID ready" },
      { name: "Login Alerts", icon: Bell, path: "/profile", desc: "Alerts for new device logins" },
      { name: "Device Management", icon: Smartphone, path: "/profile", desc: "Active device management" },
      { name: "Login History", icon: History, path: "/profile", desc: "IP, device, location & time tracking" },
      { name: "Session Management", icon: Globe, path: "/profile", desc: "Logout from individual devices" },
      { name: "File Access Logs", icon: FileText, path: "/profile", desc: "Track who accessed your files" },
      { name: "E2E Encryption", icon: Shield, path: "/profile", desc: "End-to-end encryption ready" },
    ],
  },
  {
    title: "📂 Smart File Management",
    icon: FolderOpen,
    color: "from-blue-500/20 to-indigo-500/10",
    border: "border-blue-500/20",
    features: [
      { name: "Request Files", icon: Share2, path: "/files", desc: "Secure upload links for others" },
      { name: "Folder Templates", icon: Layout, path: "/files", desc: "Personal, Office, College & more" },
      { name: "Folder Covers", icon: Image, path: "/files", desc: "Custom folder cover images" },
      { name: "Folder Colors", icon: Palette, path: "/files", desc: "Custom folder color coding" },
      { name: "Pin to Dashboard", icon: Pin, path: "/", desc: "Pin favorite folders" },
      { name: "Archive Mode", icon: Archive, path: "/files", desc: "Archive old files" },
      { name: "Storage Cleanup", icon: Trash2, path: "/trash", desc: "One-click storage cleanup" },
      { name: "Duplicate Finder", icon: Copy, path: "/files", desc: "Find & remove duplicates" },
      { name: "Large File Finder", icon: Search, path: "/files", desc: "Find large files" },
      { name: "Empty Folders", icon: FolderOpen, path: "/files", desc: "Detect empty folders" },
    ],
  },
  {
    title: "📤 Sharing",
    icon: Share2,
    color: "from-emerald-500/20 to-teal-500/10",
    border: "border-emerald-500/20",
    features: [
      { name: "Password Protection", icon: Lock, path: "/sharing", desc: "Password-protected share links" },
      { name: "Expiring Links", icon: Clock, path: "/sharing", desc: "Auto-expiring share links" },
      { name: "QR Code Sharing", icon: QrCode, path: "/sharing", desc: "Share via QR codes" },
      { name: "Read-Only Sharing", icon: FileText, path: "/sharing", desc: "View-only sharing mode" },
      { name: "Download Limits", icon: BarChart3, path: "/sharing", desc: "Limit downloads per link" },
      { name: "Share Analytics", icon: TrendingUp, path: "/sharing", desc: "Track share activity" },
    ],
  },
  {
    title: "🤖 AI Features",
    icon: Star,
    color: "from-amber-500/20 to-yellow-500/10",
    border: "border-amber-500/20",
    features: [
      { name: "Auto-Organize", icon: FolderOpen, path: "/files", desc: "AI organizes files automatically" },
      { name: "Rename Suggestions", icon: Pen, path: "/files", desc: "AI suggests better filenames" },
      { name: "Duplicate Detection", icon: Copy, path: "/files", desc: "AI finds duplicate files" },
      { name: "Document Summary", icon: FileText, path: "/files", desc: "AI summarizes documents" },
      { name: "Image Recognition", icon: Image, path: "/photos", desc: "AI recognizes image content" },
      { name: "Smart Search", icon: Search, path: "/", desc: "AI-powered semantic search" },
      { name: "Storage Optimization", icon: BarChart3, path: "/", desc: "AI storage suggestions" },
    ],
  },
  {
    title: "📊 Dashboard Analytics",
    icon: BarChart3,
    color: "from-violet-500/20 to-purple-500/10",
    border: "border-violet-500/20",
    features: [
      { name: "Health Score", icon: Award, path: "/", desc: "Storage health score" },
      { name: "Monthly Analytics", icon: BarChart3, path: "/", desc: "Monthly usage analytics" },
      { name: "Weekly Activity", icon: TrendingUp, path: "/", desc: "Weekly activity report" },
      { name: "Upload/Download Stats", icon: BarChart3, path: "/", desc: "Transfer statistics" },
      { name: "Most Viewed Files", icon: Star, path: "/", desc: "Most viewed files" },
      { name: "Most Shared Files", icon: Share2, path: "/", desc: "Most shared files" },
      { name: "Largest Files", icon: FileText, path: "/", desc: "Largest files overview" },
      { name: "Recent Modifications", icon: Clock, path: "/", desc: "Recently modified files" },
      { name: "Productivity Score", icon: Award, path: "/", desc: "Personal productivity score" },
      { name: "Achievements", icon: Award, path: "/", desc: "Unlockable badges" },
    ],
  },
  {
    title: "🎥 Media & Preview",
    icon: Play,
    color: "from-sky-500/20 to-cyan-500/10",
    border: "border-sky-500/20",
    features: [
      { name: "Video Streaming", icon: Play, path: "/files", desc: "Built-in video player" },
      { name: "Music Player", icon: Music, path: "/music", desc: "Background music player" },
      { name: "Image Slideshow", icon: Image, path: "/photos", desc: "Full-screen slideshow" },
      { name: "PDF Reader", icon: BookOpen, path: "/files", desc: "Built-in PDF reader" },
      { name: "Office Preview", icon: FileSpreadsheet, path: "/files", desc: "Document preview" },
      { name: "Image Editor", icon: Crop, path: "/photos", desc: "Crop, rotate, compress" },
    ],
  },
  {
    title: "⚡ Productivity",
    icon: CheckSquare,
    color: "from-orange-500/20 to-amber-500/10",
    border: "border-orange-500/20",
    features: [
      { name: "Built-in Notes", icon: FileText, path: "/notes", desc: "Quick notes editor" },
      { name: "To-Do List", icon: CheckSquare, path: "/todos", desc: "Task management" },
      { name: "Calendar", icon: Calendar, path: "/calendar", desc: "Event calendar" },
      { name: "Reminders", icon: Bell, path: "/reminders", desc: "Reminder system" },
      { name: "Workspaces", icon: Layout, path: "/profile", desc: "Favorite workspaces" },
      { name: "Shortcuts", icon: Monitor, path: "/", desc: "Keyboard shortcuts" },
      { name: "Command Palette", icon: Search, path: "/", desc: "Ctrl+K quick access" },
    ],
  },
  {
    title: "🌐 Cloud & Sync",
    icon: Cloud,
    color: "from-cyan-500/20 to-teal-500/10",
    border: "border-cyan-500/20",
    features: [
      { name: "Offline Mode", icon: Wifi, path: "/profile", desc: "Work without internet" },
      { name: "Auto Sync", icon: RefreshCw, path: "/profile", desc: "Automatic file sync" },
      { name: "Device Backup", icon: Monitor, path: "/profile", desc: "Cross-device backup" },
      { name: "Sync Status", icon: BarChart3, path: "/profile", desc: "Real-time sync status" },
      { name: "Connected Devices", icon: Smartphone, path: "/profile", desc: "Manage devices" },
      { name: "Cross-Device Sync", icon: Globe, path: "/profile", desc: "Sync across devices" },
    ],
  },
  {
    title: "🎨 Premium UI/UX",
    icon: Brush,
    color: "from-pink-500/20 to-rose-500/10",
    border: "border-pink-500/20",
    features: [
      { name: "Glassmorphism", icon: Columns, path: "/", desc: "Frosted glass effects" },
      { name: "Animations", icon: Monitor, path: "/", desc: "Smooth transitions" },
      { name: "Custom Themes", icon: Palette, path: "/profile", desc: "Accent color picker" },
      { name: "Layout Options", icon: Layout, path: "/profile", desc: "Dashboard customization" },
    ],
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function Enterprise() {
  const [activeCategory, setActiveCategory] = React.useState<string | null>(null);

  return (
    <div className="space-y-8 pb-16">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-8 md:p-12 border border-zinc-700/50"
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-violet-500/10 blur-3xl" />
        </div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1 mb-4">
            <motion.span
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Zap className="h-2.5 w-2.5 text-amber-400" />
            </motion.span>
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">Enterprise Suite</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
            Novaa Drive{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300">
              Enterprise
            </span>
          </h1>
          <p className="mt-4 text-zinc-400 max-w-2xl text-sm leading-relaxed">
            All premium features at your fingertips. Secure, intelligent, and beautifully designed — 
            Novaa Drive Enterprise delivers a world-class file management experience.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <span className="flex items-center gap-1.5 rounded-xl bg-white/5 border border-white/10 px-3 py-1.5 text-[10px] font-bold text-zinc-300">
              <Shield className="h-3 w-3 text-emerald-400" />
              65+ Enterprise Features
            </span>
            <span className="flex items-center gap-1.5 rounded-xl bg-white/5 border border-white/10 px-3 py-1.5 text-[10px] font-bold text-zinc-300">
              <Lock className="h-3 w-3 text-amber-400" />
              Enterprise-Grade Security
            </span>
            <span className="flex items-center gap-1.5 rounded-xl bg-white/5 border border-white/10 px-3 py-1.5 text-[10px] font-bold text-zinc-300">
              <BarChart3 className="h-3 w-3 text-blue-400" />
              Advanced Analytics
            </span>
          </div>
        </div>
      </motion.div>

      {/* Category Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat.title}
            onClick={() => setActiveCategory(activeCategory === cat.title ? null : cat.title)}
            className={`flex-shrink-0 flex items-center gap-2 rounded-2xl border px-4 py-2 text-xs font-bold transition-all cursor-pointer whitespace-nowrap
              ${activeCategory === cat.title
                ? "bg-amber-500/10 border-amber-500/30 text-amber-500"
                : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700"}`}
          >
            <span className="text-base">{cat.title.split(" ")[0]}</span>
            {cat.title.split(" ").slice(1).join(" ")}
          </button>
        ))}
      </div>

      {/* Feature Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {categories
          .filter((cat) => !activeCategory || cat.title === activeCategory)
          .map((category) => (
            <React.Fragment key={category.title}>
              {/* Category Header */}
              <motion.div
                variants={itemVariants}
                className="col-span-full"
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br ${category.color} border ${category.border}`}>
                    <category.icon className="h-4 w-4 text-zinc-800 dark:text-white" />
                  </div>
                  <h2 className="text-sm font-black text-zinc-900 dark:text-white">{category.title}</h2>
                  <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
                  <span className="text-[10px] font-bold text-zinc-500">{category.features.length} features</span>
                </div>
              </motion.div>

              {/* Features */}
              {category.features.map((feature) => (
                <motion.div
                  key={feature.name}
                  variants={itemVariants}
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="group"
                >
                  <Link
                    to={feature.path}
                    className={`block h-full rounded-2xl border ${category.border} bg-gradient-to-br ${category.color} p-5 transition-all hover:shadow-lg hover:shadow-current/5`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/50 dark:bg-white/5 backdrop-blur-sm border border-white/20">
                        <feature.icon className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-black text-zinc-900 dark:text-white group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors">
                          {feature.name}
                        </h3>
                        <p className="mt-1 text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                          {feature.desc}
                        </p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </React.Fragment>
          ))}
      </motion.div>
    </div>
  );
}