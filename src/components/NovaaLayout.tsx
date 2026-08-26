import React, { useState, memo, useCallback } from "react";
import NovaaHeader from "./NovaaHeader";
import NovaaSidebar from "./NovaaSidebar";
import ParticleBackground from "./auth/ParticleBackground";
import { UploadCloud } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface LayoutProps {
  children: React.ReactNode;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onFilesDropped: (files: FileList) => void;
  storageRefreshKey: number;
}

// Memoized drag overlay to prevent re-renders
const DragOverlay = memo(function DragOverlay({ isDragging }: { isDragging: boolean }) {
  return (
    <AnimatePresence>
      {isDragging && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-purple-500/10 backdrop-blur-md p-8"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-purple-500/30 bg-[#0B1020]/95 p-12 text-center shadow-2xl backdrop-blur-xl"
          >
            <div className="rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20 p-5 animate-pulse">
              <UploadCloud className="h-12 w-12 text-purple-400" />
            </div>
            <h3 className="mt-5 text-xl font-bold text-white">Upload to Novaa Drive</h3>
            <p className="mt-2 text-sm text-white/40 max-w-xs">
              Drop your files here to upload them to your secure cloud storage.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

// Memoized background blobs
const BackgroundBlobs = memo(function BackgroundBlobs() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute -left-40 -top-40 h-[500px] w-[500px] animate-float-slow rounded-full bg-purple-600/5 blur-[120px]" />
      <div className="absolute -bottom-40 -right-40 h-[600px] w-[600px] animate-float-slower rounded-full bg-cyan-600/3 blur-[120px]" />
    </div>
  );
});

// Memoized footer
const LayoutFooter = memo(function LayoutFooter() {
  return (
    <div className="border-t border-white/[0.04] px-6 py-4 text-center">
      <p className="text-[10px] font-medium text-white/20 tracking-wider">
        Novaa Drive <span className="mx-2">•</span> Secure <span className="mx-2">•</span> Smart <span className="mx-2">•</span> Seamless
      </p>
    </div>
  );
});

const NovaaLayout = memo(function NovaaLayout({
  children,
  searchQuery,
  onSearchChange,
  onFilesDropped,
  storageRefreshKey
}: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesDropped(e.dataTransfer.files);
    }
  }, [onFilesDropped]);

  const handleToggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  const handleCloseSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  return (
    <div
      className="flex h-screen w-screen flex-col overflow-hidden bg-[#0B1020]"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Particle Background */}
      <ParticleBackground />

      {/* Floating blobs */}
      <BackgroundBlobs />

      {/* Drag & Drop Overlay */}
      <DragOverlay isDragging={isDragging} />

      {/* Header */}
      <NovaaHeader
        onToggleSidebar={handleToggleSidebar}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
      />

      <div className="flex h-full flex-1 pt-16 overflow-hidden">
        {/* Sidebar */}
        <NovaaSidebar
          isOpen={isSidebarOpen}
          onClose={handleCloseSidebar}
          storageRefreshKey={storageRefreshKey}
        />

        {/* Main Content */}
        <main className="relative z-10 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
          <LayoutFooter />
        </main>
      </div>
    </div>
  );
});

export default NovaaLayout;