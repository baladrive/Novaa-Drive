import React, { useState, useCallback, memo, useRef, useEffect, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useSearchParams } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import NovaaLayout from "./components/NovaaLayout";
import NovaaDriveAuth from "./pages/NovaaDriveAuth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { GitBranch, ExternalLink } from "lucide-react";

// ── Lazy Loaded Pages ───────────────────────────────────────────────────
const NovaaDashboard = lazy(() => import("./pages/NovaaDashboard"));
const FileManager = lazy(() => import("./pages/FileManager"));
const Photos = lazy(() => import("./pages/Photos"));
const Videos = lazy(() => import("./pages/Videos"));
const Music = lazy(() => import("./pages/Music"));
const Documents = lazy(() => import("./pages/Documents"));
const Favorites = lazy(() => import("./pages/Favorites"));
const Sharing = lazy(() => import("./pages/Sharing"));
const Trash = lazy(() => import("./pages/Trash"));
const Profile = lazy(() => import("./pages/Profile"));
const Plans = lazy(() => import("./pages/Plans"));
const HiddenFiles = lazy(() => import("./pages/HiddenFiles"));
const Notes = lazy(() => import("./pages/Notes"));
const Todos = lazy(() => import("./pages/Todos"));
const CalendarPage = lazy(() => import("./pages/Calendar"));
const RemindersPage = lazy(() => import("./pages/Reminders"));
const Enterprise = lazy(() => import("./pages/Enterprise"));
const Settings = lazy(() => import("./pages/Settings"));
const CloudIntegrations = lazy(() => import("./pages/CloudIntegrations"));

// ── Page Transition Animation ───────────────────────────────────────────
const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

const pageTransition = {
  type: "tween" as const,
  ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
  duration: 0.2,
};

function AnimatedPage({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
      style={{ willChange: "transform, opacity" }}
    >
      {children}
    </motion.div>
  );
}

// ── Skeleton Components ─────────────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6" style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div className="mb-2">
        <div className="h-4 w-32 skeleton rounded-lg mb-2" />
        <div className="h-8 w-64 skeleton rounded-lg mb-1" />
        <div className="h-4 w-48 skeleton rounded-lg" />
      </div>
      <div className="h-28 skeleton rounded-2xl" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="h-36 skeleton rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

function FilesSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6" style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div className="h-8 w-48 skeleton rounded-lg mb-2" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-36 skeleton rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-6" style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div className="h-8 w-48 skeleton rounded-lg mb-2" />
      <div className="h-64 skeleton rounded-2xl" />
    </div>
  );
}

function PhotosListSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-6" style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div className="h-8 w-48 skeleton rounded-lg mb-2" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="aspect-square skeleton rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// ── Lazy Route Component ────────────────────────────────────────────────
interface LazyRouteProps {
  Component: React.LazyExoticComponent<React.ComponentType<any>>;
  Skeleton?: React.ComponentType;
  props?: Record<string, any>;
}

const LazyRoute = memo(function LazyRoute({ Component, Skeleton = PageSkeleton, props = {} }: LazyRouteProps) {
  return (
    <React.Suspense fallback={<Skeleton />}>
      <AnimatedPage>
        <Component {...props} />
      </AnimatedPage>
    </React.Suspense>
  );
});

// ── Preload routes on hover ─────────────────────────────────────────────
function preloadRoute(path: string) {
  const preloadMap: Record<string, () => void> = {
    '/': () => import('./pages/NovaaDashboard'),
    '/files': () => import('./pages/FileManager'),
    '/photos': () => import('./pages/Photos'),
    '/videos': () => import('./pages/Videos'),
    '/music': () => import('./pages/Music'),
    '/documents': () => import('./pages/Documents'),
    '/favorites': () => import('./pages/Favorites'),
    '/sharing': () => import('./pages/Sharing'),
    '/trash': () => import('./pages/Trash'),
    '/profile': () => import('./pages/Profile'),
    '/plans': () => import('./pages/Plans'),
    '/hidden': () => import('./pages/HiddenFiles'),
    '/notes': () => import('./pages/Notes'),
    '/todos': () => import('./pages/Todos'),
    '/calendar': () => import('./pages/Calendar'),
    '/reminders': () => import('./pages/Reminders'),
    '/enterprise': () => import('./pages/Enterprise'),
    '/settings': () => import('./pages/Settings'),
    '/cloud': () => import('./pages/CloudIntegrations'),
  };
  preloadMap[path]?.();
}

// Make preloadRoute globally accessible
if (typeof window !== 'undefined') {
  (window as any).__preloadRoute = preloadRoute;
}

// ── Memoized NovaaLayout to prevent re-renders ──────────────────────────
const MemoizedNovaaLayout = memo(NovaaLayout);

// ── Auth Loading Screen ─────────────────────────────────────────────────
function AuthLoadingScreen() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#0B1020]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative flex h-16 w-16 items-center justify-center">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 opacity-60 blur-xl animate-pulse" />
          <div className="relative flex h-full w-full items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500">
            <svg className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17.5 19a3.5 3.5 0 1 0 0-7h-11a3.5 3.5 0 1 0 0 7h11z" />
              <path d="M12 12V4" />
              <path d="M9 7l3-3 3 3" />
            </svg>
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm font-black tracking-tight text-white">Novaa Drive</p>
          <p className="mt-1 text-[10px] font-medium text-white/30">Loading your secure workspace...</p>
        </div>
        <div className="h-1 w-32 overflow-hidden rounded-full bg-white/[0.06]">
          <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 animate-shimmer" />
        </div>
      </div>
    </div>
  );
}

// ── Animated Routes Component ───────────────────────────────────────────
function AnimatedRoutes({
  searchQuery,
  externalFiles,
  setExternalFiles,
  handleRefreshStorage,
  onSearchChange,
}: {
  searchQuery: string;
  externalFiles: FileList | null;
  setExternalFiles: React.Dispatch<React.SetStateAction<FileList | null>>;
  handleRefreshStorage: () => void;
  onSearchChange: (query: string) => void;
}) {
  const location = useLocation();
  const [storageRefreshKey, setStorageRefreshKey] = useState(0);
  
  return (
    <MemoizedNovaaLayout
      searchQuery={searchQuery}
      onSearchChange={onSearchChange}
      onFilesDropped={(files: FileList) => {
        setExternalFiles(files);
        window.history.pushState(null, "", "/files");
      }}
      storageRefreshKey={storageRefreshKey}
    >
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<LazyRoute Component={NovaaDashboard} Skeleton={DashboardSkeleton} />} />
          <Route 
            path="/files" 
            element={
              <LazyRoute 
                Component={FileManager} 
                Skeleton={FilesSkeleton}
                props={{
                  searchQuery,
                  externalFilesToUpload: externalFiles,
                  onClearExternalFiles: () => setExternalFiles(null),
                }}
              />
            } 
          />
          <Route path="/photos" element={<LazyRoute Component={Photos} Skeleton={PhotosListSkeleton} />} />
          <Route path="/videos" element={<LazyRoute Component={Videos} Skeleton={PageSkeleton} />} />
          <Route path="/music" element={<LazyRoute Component={Music} Skeleton={PageSkeleton} />} />
          <Route path="/documents" element={<LazyRoute Component={Documents} Skeleton={PageSkeleton} />} />
          <Route path="/favorites" element={<LazyRoute Component={Favorites} Skeleton={PageSkeleton} />} />
          <Route path="/sharing" element={<LazyRoute Component={Sharing} Skeleton={PageSkeleton} />} />
          <Route 
            path="/trash" 
            element={<LazyRoute Component={Trash} Skeleton={PageSkeleton} props={{ onRefreshStorage: handleRefreshStorage }} />} 
          />
          <Route 
            path="/plans" 
            element={<LazyRoute Component={Plans} Skeleton={PageSkeleton} props={{ onRefreshStorage: handleRefreshStorage }} />} 
          />
          <Route path="/hidden" element={<LazyRoute Component={HiddenFiles} Skeleton={PageSkeleton} />} />
          <Route 
            path="/profile" 
            element={<LazyRoute Component={Profile} Skeleton={PageSkeleton} props={{ storageRefreshKey }} />} 
          />
          <Route path="/notes" element={<LazyRoute Component={Notes} Skeleton={PageSkeleton} />} />
          <Route path="/todos" element={<LazyRoute Component={Todos} Skeleton={PageSkeleton} />} />
          <Route path="/calendar" element={<LazyRoute Component={CalendarPage} Skeleton={PageSkeleton} />} />
          <Route path="/reminders" element={<LazyRoute Component={RemindersPage} Skeleton={PageSkeleton} />} />
          <Route path="/enterprise" element={<LazyRoute Component={Enterprise} Skeleton={PageSkeleton} />} />
          <Route 
            path="/settings" 
            element={<LazyRoute Component={Settings} Skeleton={PageSkeleton} props={{ storageRefreshKey }} />} 
          />
          <Route path="/cloud" element={<LazyRoute Component={CloudIntegrations} Skeleton={PageSkeleton} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </MemoizedNovaaLayout>
  );
}

// ── Dev Info Bar Component ───────────────────────────────────────────────
function DevInfoBar() {
  const [gitBranch, setGitBranch] = useState<string>("");
  const [gitCommit, setGitCommit] = useState<string>("");

  useEffect(() => {
    // Only show in development mode
    if (import.meta.env.PROD) return;

    fetch("/api/git-info")
      .then(res => res.json())
      .then(data => {
        setGitBranch(data.branch || "");
        setGitCommit(data.commit || "");
      })
      .catch(() => {
        // Fallback: try to get from localStorage or show placeholder
        setGitBranch("main");
        setGitCommit("dev");
      });
  }, []);

  if (import.meta.env.PROD) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-900/90 border-t border-white/10 backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 py-1.5 text-[10px] font-mono">
        <div className="flex items-center gap-3 text-zinc-400">
          <span className="flex items-center gap-1">
            <ExternalLink className="h-3 w-3" />
            <span className="text-amber-400">Localhost:</span> http://localhost:5173
          </span>
          {gitBranch && (
            <span className="flex items-center gap-1">
              <GitBranch className="h-3 w-3" />
              <span className="text-cyan-400">{gitBranch}</span>
              {gitCommit && <span className="text-zinc-500">({gitCommit.slice(0, 7)})</span>}
            </span>
          )}
        </div>
        <div className="text-zinc-500">
          Vercel Ready
        </div>
      </div>
    </div>
  );
}

// ── Core App Content ────────────────────────────────────────────────────
const AppContent = memo(function AppContent() {
  const { user, loading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [externalFiles, setExternalFiles] = useState<FileList | null>(null);
  const [searchParams] = useSearchParams();
  
  // Storage Quotas Refresh Triggers
  const [storageRefreshKey, setStorageRefreshKey] = useState(0);
  const handleRefreshStorage = useCallback(() => setStorageRefreshKey(prev => prev + 1), []);

  const handleFilesDropped = useCallback((files: FileList) => {
    setExternalFiles(files);
    window.history.pushState(null, "", "/files");
  }, []);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  if (loading) {
    return <AuthLoadingScreen />;
  }

  const hasSharedToken = searchParams.has("token");

  if (!user && !hasSharedToken) {
    return <NovaaDriveAuth />;
  }

  return (
    <>
      <AnimatedRoutes
        searchQuery={searchQuery}
        externalFiles={externalFiles}
        setExternalFiles={setExternalFiles}
        handleRefreshStorage={handleRefreshStorage}
        onSearchChange={handleSearchChange}
      />
      <DevInfoBar />
    </>
  );
});

// ── Query Client ────────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});

// ── Root App ────────────────────────────────────────────────────────────
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}