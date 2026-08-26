import React, { useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { UploadCloud } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface LayoutProps {
  children: React.ReactNode;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onFilesDropped: (files: FileList) => void;
  storageRefreshKey: number;
}

export default function Layout({ 
  children, 
  searchQuery, 
  onSearchChange, 
  onFilesDropped,
  storageRefreshKey
}: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // Only set dragging to false if we leave the main window area
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesDropped(e.dataTransfer.files);
    }
  };

  return (
    <div 
      className="flex h-screen w-screen flex-col overflow-hidden bg-zinc-50 dark:bg-zinc-950"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag & Drop Window Overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-amber-500/10 backdrop-blur-md p-8"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="flex flex-col items-center justify-center rounded-3xl border-3 border-dashed border-amber-500 bg-white/95 p-12 text-center shadow-2xl dark:bg-zinc-900/95"
            >
              <div className="rounded-full bg-amber-500/15 p-5 animate-pulse text-amber-600 dark:text-amber-400">
                <UploadCloud className="h-12 w-12" />
              </div>
              <h3 className="mt-5 text-xl font-bold text-zinc-900 dark:text-white">Upload Photos</h3>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 max-w-xs">
                Drop your images here to start compressing and uploading them to your library.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header */}
      <Header
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
      />

      <div className="flex h-full flex-1 pt-16 overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
          storageRefreshKey={storageRefreshKey}
        />

        {/* Central Page Contents */}
        <main className="flex-1 overflow-y-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
