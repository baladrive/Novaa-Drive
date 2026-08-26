"use client";
import React, { useState, useEffect } from "react";
import { X, Folder, Home } from "lucide-react";
import { FolderItem, fileService } from "../services/fileService";
import { useAuth } from "../context/AuthContext";
import { sanitizeLog } from "../utils/sanitize";

interface FolderTreeModalProps {
  onClose: () => void;
  onSelect: (folderId: string | null) => void;
  actionLabel?: string;
}

export default function FolderTreeModal({ onClose, onSelect, actionLabel = "Move here" }: FolderTreeModalProps) {
  const { user } = useAuth();
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      // Query all folders for the user
      fileService.getFolders(user.id, null)
        .then((roots) => {
          setFolders(roots);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error loading folders for move:", sanitizeLog(err));
          setLoading(false);
        });
    }
  }, [user]);

  const handleSubmit = () => {
    onSelect(selectedFolderId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-zinc-150 bg-white shadow-2xl dark:border-zinc-900 dark:bg-zinc-950">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-150/50 p-4 dark:border-zinc-900/40">
          <h3 className="text-sm font-black text-zinc-900 dark:text-white">Select Destination Folder</h3>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Folder List body */}
        <div className="p-5 max-h-72 overflow-y-auto space-y-2.5">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
            </div>
          ) : (
            <>
              {/* Root / Home Folder row */}
              <button
                onClick={() => setSelectedFolderId(null)}
                className={`flex w-full items-center gap-3 rounded-2xl p-3 text-xs font-bold transition-colors cursor-pointer text-left
                  ${selectedFolderId === null 
                    ? "bg-amber-500/10 text-amber-500 border border-amber-500/25 dark:bg-amber-500/20" 
                    : "text-zinc-700 hover:bg-zinc-50 border border-transparent dark:text-zinc-350 dark:hover:bg-zinc-900/50"}`}
              >
                <Home className="h-4.5 w-4.5" />
                <div className="flex-1">
                  <p className="font-extrabold text-[11px] uppercase tracking-wider">Root Directory</p>
                  <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">Top-level cloud files</p>
                </div>
              </button>

              <div className="h-px bg-zinc-100 dark:bg-zinc-900 my-2" />

              {/* Folders iteration */}
              {folders.length === 0 ? (
                <p className="text-center text-[10px] text-zinc-400 py-6 font-semibold">
                  No other folders found. Select Root Directory.
                </p>
              ) : (
                folders.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => setSelectedFolderId(folder.id)}
                    className={`flex w-full items-center gap-3 rounded-2xl p-3 text-xs font-bold transition-colors cursor-pointer text-left
                      ${selectedFolderId === folder.id 
                        ? "bg-amber-500/10 text-amber-500 border border-amber-500/25 dark:bg-amber-500/20" 
                        : "text-zinc-700 hover:bg-zinc-50 border border-transparent dark:text-zinc-350 dark:hover:bg-zinc-900/50"}`}
                  >
                    <Folder className="h-4.5 w-4.5 text-amber-500" />
                    <span>{folder.name}</span>
                  </button>
                ))
              )}
            </>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 border-t border-zinc-150/50 bg-zinc-50/50 p-4 dark:border-zinc-900/40 dark:bg-zinc-900/10">
          <button
            onClick={onClose}
            className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-350 dark:hover:bg-zinc-900/50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2 text-xs shadow-md cursor-pointer"
          >
            {actionLabel}
          </button>
        </div>

      </div>
    </div>
  );
}
