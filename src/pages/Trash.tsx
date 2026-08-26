"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Trash2, RotateCcw, AlertTriangle, Image, Film, Music, FileText, Archive, FileQuestion } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { fileService, FileItem } from "../services/fileService";

interface TrashProps {
  onRefreshStorage: () => void;
}

export default function Trash({ onRefreshStorage }: TrashProps) {
  const { user } = useAuth();
  const [trashedFiles, setTrashedFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrashedFiles = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const list = await fileService.getTrashedFiles(user.id);
      setTrashedFiles(list);
    } catch (err) {
      console.error("Error loading bin files:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTrashedFiles();
  }, [user, fetchTrashedFiles]);

  const handleRestore = async (file: FileItem) => {
    if (!user) return;
    try {
      await fileService.trashFile(user.id, file.id, false);
      fetchTrashedFiles();
      onRefreshStorage();
    } catch {
      alert("Failed to restore file");
    }
  };

  const handlePermanentDelete = async (file: FileItem) => {
    if (!user) return;
    if (confirm(`Are you sure you want to permanently delete "${file.filename}"? This action is irreversible.`)) {
      try {
        await fileService.deleteFilePermanently(user.id, file);
        fetchTrashedFiles();
        onRefreshStorage();
      } catch {
        alert("Failed to delete file permanently");
      }
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 space-y-6">
      
      {/* Title */}
      <div className="border-b border-zinc-150/50 pb-4 dark:border-zinc-900/40">
        <h1 className="text-xl font-black text-zinc-900 dark:text-white">Trash Bin</h1>
        <p className="text-xs text-zinc-555 dark:text-zinc-400 mt-1">
          Items in trash will be permanently deleted when you select permanent remove actions.
        </p>
      </div>

      {/* Warning Alert */}
      {trashedFiles.length > 0 && (
        <div className="flex items-start gap-2.5 rounded-2xl bg-amber-500/10 p-4 border border-amber-500/20 text-xs text-amber-700 dark:bg-amber-950/20 dark:text-amber-400">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
          <p className="leading-relaxed font-semibold">
            Permanently deleting files removes them from cloud backups and decreases your active storage quota usage instantly.
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-3 border-amber-500 border-t-transparent" />
          <p className="text-xs text-zinc-550 font-bold">Scanning trash bin...</p>
        </div>
      ) : trashedFiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-20 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl">
          <Trash2 className="h-12 w-12 text-zinc-350 dark:text-zinc-555" />
          <h3 className="mt-4 text-sm font-extrabold text-zinc-850 dark:text-white">Trash Bin is empty</h3>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 max-w-xs leading-relaxed">
            Files you delete from My Files will appear here before permanent deletion.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-150/70 bg-white/70 backdrop-blur-md dark:border-zinc-900/50 dark:bg-zinc-950/60">
          <div className="min-w-full divide-y divide-zinc-150/40 dark:divide-zinc-900/40">
            {trashedFiles.map((file) => (
              <div
                key={file.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
                    {file.file_category === "photo" && <Image className="h-4.5 w-4.5" />}
                    {file.file_category === "video" && <Film className="h-4.5 w-4.5 text-rose-500" />}
                    {file.file_category === "audio" && <Music className="h-4.5 w-4.5 text-emerald-500" />}
                    {file.file_category === "document" && <FileText className="h-4.5 w-4.5 text-amber-500" />}
                    {file.file_category === "archive" && <Archive className="h-4.5 w-4.5 text-purple-500" />}
                    {file.file_category === "other" && <FileQuestion className="h-4.5 w-4.5" />}
                  </div>
                  <div className="overflow-hidden">
                    <p className="truncate text-xs font-bold text-zinc-800 dark:text-zinc-200">{file.filename}</p>
                    <span className="text-[9px] text-zinc-400 font-semibold block mt-0.5">{formatSize(file.size)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRestore(file)}
                    className="flex items-center gap-1 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold px-3 py-1.5 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-900/60 cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Restore
                  </button>
                  <button
                    onClick={() => handlePermanentDelete(file)}
                    className="flex items-center gap-1 rounded-xl bg-red-55 hover:bg-red-100 text-red-600 font-bold px-3 py-1.5 text-xs cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Permanent Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
