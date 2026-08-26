"use client";
import React, { useState, useEffect, useCallback, memo } from "react";
import { FileText, Star, Trash2, Search, File, FileSpreadsheet, Presentation } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { fileService, FileItem } from "../services/fileService";
import FileViewer from "../components/FileViewer";

// ── Format size utility ─────────────────────────────────────────────────
function formatSize(bytes: number): string {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

// ── Get document icon ───────────────────────────────────────────────────
function getDocIcon(mime: string) {
  if (mime?.includes("spreadsheet") || mime?.includes("sheet") || mime?.includes("excel") || mime?.includes("csv")) return FileSpreadsheet;
  if (mime?.includes("presentation") || mime?.includes("slide") || mime?.includes("powerpoint")) return Presentation;
  return FileText;
}

// ── Document Card Component ─────────────────────────────────────────────
const DocumentCard = memo(function DocumentCard({
  file,
  onSelect,
  onToggleFavorite,
  onTrash,
}: {
  file: FileItem;
  onSelect: (f: FileItem) => void;
  onToggleFavorite: (f: FileItem) => void;
  onTrash: (f: FileItem) => void;
}) {
  const DocIcon = getDocIcon(file.mime_type);
  return (
    <button
      onClick={() => onSelect(file)}
      className="group relative flex flex-col items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 transition-all duration-200 hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/10 hover:scale-[1.02] active:scale-[0.98]"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
        <DocIcon className="h-7 w-7 text-amber-400" />
      </div>
      <div className="w-full text-center">
        <p className="truncate text-[11px] font-semibold text-white/80">{file.filename}</p>
        <p className="text-[9px] text-white/40 mt-0.5">{formatSize(file.size)}</p>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onToggleFavorite(file); }}
        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.04] opacity-0 transition-all duration-200 group-hover:opacity-100 hover:bg-white/[0.08]"
      >
        <Star className={`h-3.5 w-3.5 ${file.is_starred ? 'fill-amber-400 text-amber-400' : 'text-white/40'}`} />
      </button>
    </button>
  );
});

// ── Main Documents Page ─────────────────────────────────────────────────
export default function Documents() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<FileItem[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<FileItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchDocuments = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const allFiles = await fileService.getFiles(user.id, null);
      const docFiles = allFiles.filter(
        f => f.file_category === "document" || 
             f.mime_type?.includes("pdf") || 
             f.mime_type?.includes("document") || 
             f.mime_type?.includes("sheet") || 
             f.mime_type?.includes("spreadsheet") || 
             f.mime_type?.includes("presentation") || 
             f.mime_type?.includes("text") ||
             f.mime_type?.includes("csv")
      );
      setDocuments(docFiles);
    } catch (err) {
      console.error("Error loading documents:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDocuments();
  }, [user, fetchDocuments]);

  const handleToggleFavorite = useCallback(async (file: FileItem) => {
    if (!user) return;
    try {
      await fileService.toggleStar(user.id, file.id, !file.is_starred);
      fetchDocuments();
    } catch (err) {
      console.error(err);
    }
  }, [user, fetchDocuments]);

  const handleTrashDoc = useCallback(async (file: FileItem) => {
    if (!user) return;
    try {
      await fileService.trashFile(user.id, file.id, true);
      setDocuments(prev => prev.filter(f => f.id !== file.id));
      setSelectedDoc(null);
    } catch (err) {
      console.error(err);
    }
  }, [user]);

  const filteredDocs = searchQuery
    ? documents.filter(d => d.filename.toLowerCase().includes(searchQuery.toLowerCase()))
    : documents;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">Documents</h1>
          <p className="mt-1 text-xs text-white/40">Browse and manage your documents</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-white/[0.06] bg-white/[0.04] py-2.5 pl-10 pr-4 text-sm text-white outline-none transition-all placeholder:text-white/25 focus:border-amber-500/40 focus:bg-white/[0.06] sm:w-64"
          />
        </div>
      </div>

      {/* Document Grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-36 rounded-xl skeleton" />
          ))}
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-white/[0.06] bg-white/[0.02] py-24 px-4 text-center">
          <div className="rounded-full bg-white/[0.04] p-4">
            <FileText className="h-10 w-10 text-white/20" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-white/60">No documents yet</h3>
          <p className="mt-1 text-xs text-white/30 max-w-xs">
            {searchQuery ? "No documents match your search." : "Upload documents to see them here."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filteredDocs.map(doc => (
            <DocumentCard
              key={doc.id}
              file={doc}
              onSelect={setSelectedDoc}
              onToggleFavorite={handleToggleFavorite}
              onTrash={handleTrashDoc}
            />
          ))}
        </div>
      )}

      {/* Document Viewer */}
      {selectedDoc && (
        <FileViewer
          file={selectedDoc}
          allFiles={documents}
          onClose={() => setSelectedDoc(null)}
          onToggleStar={async f => { await fileService.toggleStar(user!.id, f.id, !f.is_starred); fetchDocuments(); }}
          onTrash={handleTrashDoc}
        />
      )}
    </div>
  );
}