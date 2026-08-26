"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Share2, Image, Film, Music, FileText, Archive, FileQuestion, Copy, XCircle, Download } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { fileService, FileItem } from "../services/fileService";
import { sanitizeLog } from "../utils/sanitize";

export default function Sharing() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  // Public shared file states
  const [sharedFile, setSharedFile] = useState<FileItem | null>(null);
  const [publicLoading, setPublicLoading] = useState(false);
  const [publicError, setPublicError] = useState("");

  // Authenticated list states
  const [mySharedFiles, setMySharedFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. If token is present, query file publicly
  useEffect(() => {
    if (token) {
      setPublicLoading(true);
      setPublicError("");
      fileService.getSharedFile(token)
        .then((file) => {
          setSharedFile(file);
        })
        .catch((err) => {
          console.error("Public share error:", sanitizeLog(err));
          setPublicError("This link is invalid or has been revoked by the owner.");
        })
        .finally(() => {
          setPublicLoading(false);
        });
    }
  }, [token]);

  // 2. Query user's own active links
  const fetchMySharedFiles = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch all files and filter where shared_link_token is not null
      const files = await fileService.getFiles(user.id, null);
      const shared = files.filter(f => f.shared_link_token);
      setMySharedFiles(shared);
    } catch (err) {
      console.error("Error loading shared links list:", sanitizeLog(err));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!token && user) {
      fetchMySharedFiles();
    }
  }, [user, token, fetchMySharedFiles]);

  const handleRevokeLink = async (file: FileItem) => {
    if (!user) return;
    try {
      await fileService.revokeShareLink(user.id, file.id);
      fetchMySharedFiles();
      alert("🔒 Public link revoked successfully!");
    } catch {
      alert("Failed to revoke link");
    }
  };

  const handleCopyLink = (file: FileItem) => {
    const url = `${window.location.origin}/sharing?token=${file.shared_link_token}`;
    navigator.clipboard.writeText(url);
    alert("🔗 Copied link to clipboard!");
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  // ==========================================
  // CASE A: PUBLIC LANDING VIEWER PAGE
  // ==========================================
  if (token) {
    return (
      <div className="flex min-h-screen w-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
        <div className="w-full max-w-md overflow-hidden rounded-3xl border border-zinc-150 bg-white shadow-2xl dark:border-zinc-900 dark:bg-zinc-900/60 p-8 text-center space-y-6">
          
          <div className="flex justify-center">
            <svg
              className="h-12 w-12 animate-spin-slow hover:animate-spin"
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
          </div>

          <h2 className="text-base font-black text-zinc-900 dark:text-white">Shared File Received</h2>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-semibold leading-relaxed">
            You have received a public file shared via Bala Drive. You do not need to log in to download this file.
          </p>

          {publicLoading ? (
            <div className="flex justify-center py-6">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-amber-500 border-t-transparent" />
            </div>
          ) : publicError ? (
            <div className="rounded-2xl bg-red-50 p-4 text-xs text-red-700 dark:bg-red-950/20 dark:text-red-400 border border-red-100 dark:border-red-900/20 flex flex-col items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <p className="font-extrabold">{publicError}</p>
            </div>
          ) : sharedFile ? (
            <div className="space-y-6">
              {/* File Card info */}
              <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900 p-5 flex items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                  {sharedFile.file_category === "photo" && <Image className="h-5 w-5" />}
                  {sharedFile.file_category === "video" && <Film className="h-5 w-5" />}
                  {sharedFile.file_category === "audio" && <Music className="h-5 w-5" />}
                  {sharedFile.file_category === "document" && <FileText className="h-5 w-5" />}
                  {sharedFile.file_category === "archive" && <Archive className="h-5 w-5" />}
                  {sharedFile.file_category === "other" && <FileQuestion className="h-5 w-5" />}
                </div>
                <div className="overflow-hidden text-left">
                  <p className="truncate text-xs font-black text-zinc-800 dark:text-zinc-200">{sharedFile.filename}</p>
                  <span className="text-[10px] text-zinc-400 font-bold block mt-0.5">{formatSize(sharedFile.size)} • {sharedFile.mime_type}</span>
                </div>
              </div>

              {/* Photo preview directly inside public viewer */}
              {sharedFile.file_category === "photo" && (
                <div className="rounded-2xl overflow-hidden border border-zinc-150 dark:border-zinc-900 max-h-48 flex items-center justify-center">
                  <img src={sharedFile.storage_path} alt={sharedFile.filename} className="object-contain max-h-48 w-full" />
                </div>
              )}

              {/* Download original */}
              <a
                href={sharedFile.storage_path}
                download={sharedFile.filename}
                className="flex items-center justify-center gap-2 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-6 py-3.5 text-xs shadow-md transition-transform hover:scale-102 active:scale-98 cursor-pointer w-full"
              >
                <Download className="h-4 w-4" />
                Download Shared File
              </a>
            </div>
          ) : null}

        </div>
      </div>
    );
  }

  // ==========================================
  // CASE B: AUTHENTICATED USER MANAGER VIEW
  // ==========================================
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 space-y-6">
      
      {/* Title */}
      <div className="border-b border-zinc-150/50 pb-4 dark:border-zinc-900/40">
        <h1 className="text-xl font-black text-zinc-900 dark:text-white">Shared Links Catalog</h1>
        <p className="text-xs text-zinc-555 dark:text-zinc-400 mt-1">
          Review, copy, or revoke public URL links you have generated for files.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-3 border-amber-500 border-t-transparent" />
          <p className="text-xs text-zinc-550 font-bold">Loading active links...</p>
        </div>
      ) : mySharedFiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-20 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl">
          <Share2 className="h-12 w-12 text-zinc-350 dark:text-zinc-550" />
          <h3 className="mt-4 text-sm font-extrabold text-zinc-850 dark:text-white">No shared links</h3>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 max-w-xs leading-relaxed">
            Click the options menu on any file in My Files and select "Share Link" to create one.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-150/70 bg-white/70 backdrop-blur-md dark:border-zinc-900/50 dark:bg-zinc-950/60">
          <div className="min-w-full divide-y divide-zinc-150/40 dark:divide-zinc-900/40">
            {mySharedFiles.map((file) => (
              <div
                key={file.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                    {file.file_category === "photo" && <Image className="h-4.5 w-4.5" />}
                    {file.file_category === "video" && <Film className="h-4.5 w-4.5" />}
                    {file.file_category === "audio" && <Music className="h-4.5 w-4.5" />}
                    {file.file_category === "document" && <FileText className="h-4.5 w-4.5" />}
                    {file.file_category === "archive" && <Archive className="h-4.5 w-4.5" />}
                    {file.file_category === "other" && <FileQuestion className="h-4.5 w-4.5" />}
                  </div>
                  <div className="overflow-hidden">
                    <p className="truncate text-xs font-bold text-zinc-800 dark:text-zinc-200">{file.filename}</p>
                    <span className="text-[9px] text-zinc-400 font-semibold block mt-0.5">{formatSize(file.size)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyLink(file)}
                    className="flex items-center gap-1 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold px-3 py-1.5 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-900/60 cursor-pointer"
                  >
                    <Copy className="h-3.5 w-3.5" /> Copy Link
                  </button>
                  <button
                    onClick={() => handleRevokeLink(file)}
                    className="flex items-center gap-1 rounded-xl bg-red-50 hover:bg-red-100 text-red-650 font-bold px-3 py-1.5 text-xs cursor-pointer"
                  >
                    Revoke
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
