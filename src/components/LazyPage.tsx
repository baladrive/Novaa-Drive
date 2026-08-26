import React, { lazy, Suspense, ComponentType } from 'react';

// ── Skeleton Loading Components ─────────────────────────────────────────

export function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6 p-6">
      {/* Greeting skeleton */}
      <div className="mb-6">
        <div className="h-4 w-32 skeleton mb-2" />
        <div className="h-8 w-64 skeleton mb-1" />
        <div className="h-4 w-48 skeleton" />
      </div>
      {/* AI Card skeleton */}
      <div className="h-32 skeleton rounded-2xl mb-6" />
      {/* Widget grid skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="h-40 skeleton rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export function FileManagerSkeleton() {
  return (
    <div className="animate-pulse space-y-6 p-6">
      <div className="h-8 w-48 skeleton mb-4" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-40 skeleton rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export function DefaultSkeleton() {
  return (
    <div className="animate-pulse space-y-4 p-6">
      <div className="h-8 w-48 skeleton mb-6" />
      <div className="h-64 skeleton rounded-2xl" />
    </div>
  );
}

export function PhotosSkeleton() {
  return (
    <div className="animate-pulse p-6">
      <div className="h-8 w-48 skeleton mb-4" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="aspect-square skeleton rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// ── Lazy Loaded Pages ───────────────────────────────────────────────────

export const LazyNovaaDashboard = lazy(() => import('../pages/NovaaDashboard'));
export const LazyFileManager = lazy(() => import('../pages/FileManager'));
export const LazyPhotos = lazy(() => import('../pages/Photos'));
export const LazyMusic = lazy(() => import('../pages/Music'));
export const LazySharing = lazy(() => import('../pages/Sharing'));
export const LazyTrash = lazy(() => import('../pages/Trash'));
export const LazyPlans = lazy(() => import('../pages/Plans'));
export const LazyHiddenFiles = lazy(() => import('../pages/HiddenFiles'));
export const LazyProfile = lazy(() => import('../pages/Profile'));
export const LazyNotes = lazy(() => import('../pages/Notes'));
export const LazyTodos = lazy(() => import('../pages/Todos'));
export const LazyCalendarPage = lazy(() => import('../pages/Calendar'));
export const LazyRemindersPage = lazy(() => import('../pages/Reminders'));
export const LazyEnterprise = lazy(() => import('../pages/Enterprise'));
export const LazyAlbumDetail = lazy(() => import('../pages/AlbumDetail'));
export const LazyAlbums = lazy(() => import('../pages/Albums'));
export const LazyDashboard = lazy(() => import('../pages/Dashboard'));
export const LazyFavorites = lazy(() => import('../pages/Favorites'));
export const LazyGallery = lazy(() => import('../pages/Gallery'));
export const LazyLogin = lazy(() => import('../pages/Login'));
export const LazyNovaaDriveAuth = lazy(() => import('../pages/NovaaDriveAuth'));

// ── Suspense Wrapper ────────────────────────────────────────────────────

interface SuspenseWrapperProps {
  children: React.ReactNode;
  skeleton?: React.ComponentType;
}

export function SuspenseWrapper({ children, skeleton: Skeleton = DefaultSkeleton }: SuspenseWrapperProps) {
  return (
    <Suspense fallback={<Skeleton />}>
      {children}
    </Suspense>
  );
}