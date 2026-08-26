"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Folder, FileText, Image, Music, Film, Archive, FileQuestion, Plus, ChevronRight, MoreVertical, Star, Share2, Copy, Move, Edit3, Trash2, LayoutGrid, List, Sparkles, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { fileService, FileItem, FolderItem } from "../services/fileService";
import MediaViewer from "../components/MediaViewer";
import FolderTreeModal from "../components/FolderTreeModal";
import { getFileIconSrc } from "../utils/thumbnailGenerator";

interface FileManagerProps {
  searchQuery: string;
  externalFilesToUpload: FileList | null;
  onClearExternalFiles: () => void;
}

export default function FileManager({ searchQuery, externalFilesToUpload, onClearExternalFiles }: FileManagerProps) {
  const { user, isAiMode } = useAuth();
  
  // Navigation states
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string | null; name: string }[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);

  // Selection states
  const [selectedFiles, setSelectedFiles] = useState<FileItem[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [selectedAiTag, setSelectedAiTag] = useState<string | null>(null);

  const getActiveModelLabel = () => {
    try {
      const model = localStorage.getItem("ai_search_model");
      if (model === "gemini-1-5-pro") return "Gemini 1.5 Pro";
      if (model === "claude-3-5") return "Claude 3.5 Sonnet";
      if (model === "gpt-4o") return "GPT-4o";
      return "Gemini 2.0 Flash";
    } catch {
      return "Gemini 2.0 Flash";
    }
  };

  // Uploader queue states
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const loadDirectoryContents = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const foldersList = await fileService.getFolders(user.id, currentFolderId);
      const filesList = await fileService.getFiles(user.id, currentFolderId);
      setFolders(foldersList);
      setFiles(filesList);
      setSelectedFiles([]);
      setActiveMenuId(null);
    } catch (err) {
      console.error("Failed to load folder contents:", err);
    } finally {
      setLoading(false);
    }
  }, [user, currentFolderId]);

  // Handle dropped files from App layout
  useEffect(() => {
    if (user && externalFilesToUpload && externalFilesToUpload.length > 0) {
      const uploadFiles = async () => {
        for (let i = 0; i < externalFilesToUpload.length; i++) {
          const file = externalFilesToUpload[i];
          const uploadId = `${file.name}-${Date.now()}`;
          setUploadProgress(prev => ({ ...prev, [uploadId]: 10 }));
          try {
            await fileService.uploadFile(user.id, currentFolderId, file, (progress) => {
              setUploadProgress(prev => ({ ...prev, [uploadId]: progress }));
            });
            setTimeout(() => {
              setUploadProgress(prev => {
                const next = { ...prev };
                delete next[uploadId];
                return next;
              });
            }, 3000);
          } catch (err) {
            console.error(err);
          }
        }
        onClearExternalFiles();
        loadDirectoryContents();
      };
      uploadFiles();
    }
  }, [user, externalFilesToUpload, currentFolderId, onClearExternalFiles, loadDirectoryContents]);

  // Modals & Panels
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedFileForPreview, setSelectedFileForPreview] = useState<FileItem | null>(null);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [moveActionType, setMoveActionType] = useState<"copy" | "move">("move");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // List/Grid View Toggle
  const [isGridView, setIsGridView] = useState(true);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDirectoryContents();
  }, [user, currentFolderId, loadDirectoryContents]);

  // Navigate folder helper
  const handleNavigateToFolder = (folder: FolderItem) => {
    setCurrentFolderId(folder.id);
    setBreadcrumbs((prev) => [...prev, { id: folder.id, name: folder.name }]);
  };

  const handleNavigateBreadcrumb = (crumb: { id: string | null; name: string }, index: number) => {
    setCurrentFolderId(crumb.id);
    setBreadcrumbs((prev) => prev.slice(0, index));
  };

  // Folder actions
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newFolderName.trim()) return;
    try {
      await fileService.createFolder(user.id, newFolderName, currentFolderId);
      setNewFolderName("");
      setIsFolderModalOpen(false);
      loadDirectoryContents();
    } catch {
      alert("Failed to create folder");
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!user) return;
    if (confirm("Are you sure you want to delete this folder and its contents?")) {
      try {
        await fileService.deleteFolder(user.id, folderId);
        loadDirectoryContents();
      } catch {
        alert("Failed to delete folder");
      }
    }
  };

  // File Upload Handling
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedList = e.target.files;
    if (!user || !selectedList || selectedList.length === 0) return;
    
    // Upload files sequentially
    for (let i = 0; i < selectedList.length; i++) {
      const file = selectedList[i];
      const uploadId = `${file.name}-${Date.now()}`;
      setUploadProgress(prev => ({ ...prev, [uploadId]: 10 }));
      
      try {
        await fileService.uploadFile(user.id, currentFolderId, file, (progress) => {
          setUploadProgress(prev => ({ ...prev, [uploadId]: progress }));
        });
        
        // Remove from progress list after delay
        setTimeout(() => {
          setUploadProgress(prev => {
            const next = { ...prev };
            delete next[uploadId];
            return next;
          });
        }, 3000);
      } catch {
        alert(`Failed to upload ${file.name}`);
        setUploadProgress(prev => {
          const next = { ...prev };
          delete next[uploadId];
          return next;
        });
      }
    }
    loadDirectoryContents();
  };

  // Drag-and-Drop listeners
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files;
    if (!user || !dropped || dropped.length === 0) return;

    for (let i = 0; i < dropped.length; i++) {
      const file = dropped[i];
      const uploadId = `${file.name}-${Date.now()}`;
      setUploadProgress(prev => ({ ...prev, [uploadId]: 10 }));

      try {
        await fileService.uploadFile(user.id, currentFolderId, file, (progress) => {
          setUploadProgress(prev => ({ ...prev, [uploadId]: progress }));
        });
        setTimeout(() => {
          setUploadProgress(prev => {
            const next = { ...prev };
            delete next[uploadId];
            return next;
          });
        }, 3000);
      } catch {
        alert(`Failed to upload ${file.name}`);
      }
    }
    loadDirectoryContents();
  };

  // Individual Actions
  const handleToggleStar = async (file: FileItem) => {
    if (!user) return;
    try {
      await fileService.toggleStar(user.id, file.id, !file.is_starred);
      loadDirectoryContents();
    } catch (err) {
      console.error(err);
    }
  };

  const handleTrashFile = async (file: FileItem) => {
    if (!user) return;
    try {
      await fileService.trashFile(user.id, file.id, true);
      loadDirectoryContents();
    } catch (err) {
      console.error(err);
    }
  };

  const handleHideFile = async (file: FileItem) => {
    if (!user) return;
    if (!fileService.hasHiddenPassword(user.id)) {
      alert("You need to set up a Vault PIN first. Go to Private Vault in the sidebar.");
      return;
    }
    await fileService.hideFile(user.id, file.id);
    loadDirectoryContents();
    setActiveMenuId(null);
  };

  const handleRenameFile = async (file: FileItem) => {
    const newName = prompt("Enter new filename:", file.filename);
    if (!user || !newName || !newName.trim() || newName === file.filename) return;
    try {
      await fileService.renameFile(user.id, file.id, newName.trim());
      loadDirectoryContents();
    } catch {
      alert("Failed to rename file");
    }
  };

  const handleShareFile = async (file: FileItem) => {
    if (!user) return;
    try {
      const token = await fileService.generateShareLink(user.id, file.id);
      const url = `${window.location.origin}/sharing?token=${token}`;
      navigator.clipboard.writeText(url);
      alert(`🔗 Public share link copied to clipboard!\n${url}`);
      loadDirectoryContents();
    } catch (err) {
      console.error(err);
    }
  };

  // Multi select check helper
  const handleToggleSelectFile = (file: FileItem) => {
    setSelectedFiles(prev => 
      prev.some(f => f.id === file.id) 
        ? prev.filter(f => f.id !== file.id)
        : [...prev, file]
    );
  };

  const handleSelectAll = () => {
    if (selectedFiles.length === files.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(files);
    }
  };

  // Bulk Operations
  const handleBulkTrash = async () => {
    if (!user || selectedFiles.length === 0) return;
    if (confirm(`Move ${selectedFiles.length} items to trash?`)) {
      try {
        for (const file of selectedFiles) {
          await fileService.trashFile(user.id, file.id, true);
        }
        loadDirectoryContents();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleMoveOrCopyAction = (type: "copy" | "move") => {
    if (selectedFiles.length === 0) return;
    setMoveActionType(type);
    setIsMoveModalOpen(true);
  };

  const handleConfirmMoveOrCopy = async (destFolderId: string | null) => {
    if (!user || selectedFiles.length === 0) return;
    try {
      for (const file of selectedFiles) {
        if (moveActionType === "move") {
          await fileService.moveFile(user.id, file.id, destFolderId);
        } else {
          await fileService.copyFile(user.id, file, destFolderId);
        }
      }
      setIsMoveModalOpen(false);
      loadDirectoryContents();
    } catch {
      alert(`Failed to ${moveActionType} items`);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  // Filter files by search string, selected tag, and exclude hidden files
  const hiddenIds = user ? fileService.getHiddenFileIds(user.id) : [];
  const filteredFiles = files.filter(f => {
    if (hiddenIds.includes(f.id)) return false; // exclude hidden files from normal view
    const matchesSearch = f.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (selectedAiTag) {
      return matchesSearch && f.tags.includes(selectedAiTag);
    }
    return matchesSearch;
  });

  // Get all unique tags of current folder's files
  const folderTags = Array.from(
    new Set(files.flatMap(f => f.tags))
  ).filter(t => t !== "AI Classified");

  return (
    <div 
      className="mx-auto max-w-7xl px-4 py-8 md:px-6 space-y-6"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      
      {/* AI Suggested Tags Bar */}
      {isAiMode && folderTags.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-amber-500/5 p-3.5 border border-amber-500/10 dark:bg-amber-500/10/20 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] font-black uppercase text-amber-600 dark:text-amber-500 flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              AI Categories:
            </span>
            <button
              onClick={() => setSelectedAiTag(null)}
              className={`rounded-lg px-2.5 py-1 text-[10px] font-bold transition-all cursor-pointer
                ${!selectedAiTag 
                  ? "bg-amber-500 text-slate-950 shadow-sm" 
                  : "bg-zinc-150/40 hover:bg-zinc-200 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"}`}
            >
              All
            </button>
            {folderTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedAiTag(tag === selectedAiTag ? null : tag)}
                className={`rounded-lg px-2.5 py-1 text-[10px] font-bold transition-all cursor-pointer
                  ${tag === selectedAiTag 
                    ? "bg-amber-500 text-slate-950 shadow-sm" 
                    : "bg-zinc-150/40 hover:bg-zinc-200 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"}`}
              >
                #{tag}
              </button>
            ))}
          </div>
          
          <div className="text-[9px] font-black text-amber-600/60 dark:text-amber-500/60 uppercase tracking-widest flex items-center gap-1 font-mono">
            Model: {getActiveModelLabel()}
          </div>
        </div>
      )}

      {/* Path Breadcrumbs Bar & View Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-150/50 pb-4 dark:border-zinc-900/40">
        
        {/* Crumb trail */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-sm font-bold text-zinc-500 py-1">
          <button 
            onClick={() => { setCurrentFolderId(null); setBreadcrumbs([]); }}
            className="flex items-center gap-1 hover:text-amber-500 cursor-pointer dark:text-zinc-400"
          >
            Home
          </button>
          
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.id}>
              <ChevronRight className="h-3.5 w-3.5 text-zinc-350" />
              <button
                onClick={() => handleNavigateBreadcrumb(crumb, idx + 1)}
                className={`hover:text-amber-500 cursor-pointer whitespace-nowrap ${idx === breadcrumbs.length - 1 ? "text-zinc-900 dark:text-white font-black" : "dark:text-zinc-400"}`}
              >
                {crumb.name}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Control toolbar */}
        <div className="flex items-center gap-2">
          {/* List/Grid toggles */}
          <button
            onClick={() => setIsGridView(!isGridView)}
            className="rounded-full p-2 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 transition-colors cursor-pointer"
          >
            {isGridView ? <List className="h-4.5 w-4.5" /> : <LayoutGrid className="h-4.5 w-4.5" />}
          </button>

          {/* New folder */}
          <button
            onClick={() => setIsFolderModalOpen(true)}
            className="flex items-center gap-1 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold px-3.5 py-2 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-900/60 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            New Folder
          </button>

          {/* File Input trigger */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-4 py-2 text-xs shadow-sm cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Upload Files
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

      </div>

      {/* Bulk Operations Overlay Action Bar */}
      {selectedFiles.length > 0 && (
        <div className="flex items-center justify-between rounded-2xl bg-amber-500 p-4 text-slate-950 shadow-md">
          <span className="text-xs font-black">{selectedFiles.length} files selected</span>
          <div className="flex items-center gap-1.5">
            <button 
              onClick={() => handleMoveOrCopyAction("copy")}
              className="flex items-center gap-1 rounded-xl bg-slate-950 text-white font-bold px-3 py-1.5 text-xs hover:bg-slate-900 cursor-pointer"
            >
              <Copy className="h-3.5 w-3.5" /> Copy
            </button>
            <button 
              onClick={() => handleMoveOrCopyAction("move")}
              className="flex items-center gap-1 rounded-xl bg-slate-950 text-white font-bold px-3 py-1.5 text-xs hover:bg-slate-900 cursor-pointer"
            >
              <Move className="h-3.5 w-3.5" /> Move
            </button>
            <button 
              onClick={handleBulkTrash}
              className="flex items-center gap-1 rounded-xl bg-red-600 text-white font-bold px-3 py-1.5 text-xs hover:bg-red-700 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </div>
        </div>
      )}

      {/* Floating Uploader Task indicators */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="fixed bottom-6 right-6 z-40 w-80 rounded-2xl bg-zinc-900 p-4 text-white shadow-2xl space-y-3">
          <h4 className="text-xs font-black">Uploading File Queue...</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {Object.entries(uploadProgress).map(([filename, progress]) => (
              <div key={filename} className="text-xs">
                <div className="flex items-center justify-between">
                  <span className="truncate w-48 font-bold">{filename}</span>
                  <span className="font-bold text-[10px]">{progress}%</span>
                </div>
                <div className="mt-1 h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500" style={{ width: `${progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Directories & Folder views */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-3 border-amber-500 border-t-transparent" />
          <p className="text-xs text-zinc-500 font-bold">Retrieving files metadata...</p>
        </div>
      ) : folders.length === 0 && filteredFiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-20 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl">
          <Folder className="h-12 w-12 text-zinc-350 dark:text-zinc-550" />
          <h3 className="mt-4 text-sm font-extrabold text-zinc-800 dark:text-white">This folder is empty</h3>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 max-w-xs leading-relaxed">
            Drag files anywhere on the screen or click the Upload button to back up files.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Folders List Grid */}
          {folders.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-[11px] font-black text-zinc-450 uppercase tracking-wider">Folders</h4>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {folders.map((folder) => (
                  <div
                    key={folder.id}
                    onDoubleClick={() => handleNavigateToFolder(folder)}
                    className="relative group flex items-center justify-between gap-2.5 rounded-2xl border border-zinc-150/70 bg-white/70 p-4 backdrop-blur-md hover:scale-[1.02] hover:shadow-md dark:border-zinc-900/50 dark:bg-zinc-950/60 transition-all select-none cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Folder className="h-5 w-5 text-amber-500 flex-shrink-0" />
                      <span className="truncate text-xs font-bold text-zinc-850 dark:text-zinc-200">{folder.name}</span>
                    </div>
                    {/* Delete folder */}
                    <button
                      onClick={() => handleDeleteFolder(folder.id)}
                      className="opacity-0 group-hover:opacity-100 rounded-full p-1 text-zinc-400 hover:bg-zinc-50 hover:text-red-500 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Files grid view */}
          {filteredFiles.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-black text-zinc-450 uppercase tracking-wider">Files</h4>
                <button
                  onClick={handleSelectAll}
                  className="text-[10px] font-bold text-amber-500 hover:underline"
                >
                  {selectedFiles.length === files.length ? "Deselect all" : "Select all"}
                </button>
              </div>

              {isGridView ? (
                /* Grid view cards */
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {filteredFiles.map((file) => {
                    const isSelected = selectedFiles.some(f => f.id === file.id);
                    return (
                      <div
                        key={file.id}
                        onDoubleClick={() => setSelectedFileForPreview(file)}
                        className={`relative group flex flex-col justify-between rounded-2xl border bg-white/70 p-4.5 backdrop-blur-md hover:shadow-lg dark:bg-zinc-950/60 transition-all cursor-pointer select-none
                          ${isSelected 
                            ? "border-amber-500 ring-2 ring-amber-500/20" 
                            : "border-zinc-150/70 dark:border-zinc-900/50"}`}
                      >
                        {/* Checkbox select */}
                        <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectFile(file)}
                            className="h-4 w-4 rounded border-zinc-300 text-amber-500 focus:ring-amber-500 cursor-pointer"
                          />
                        </div>

                        {/* Top options icon */}
                        <div className="absolute top-3 right-3">
                          <button
                            onClick={() => setActiveMenuId(activeMenuId === file.id ? null : file.id)}
                            className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer"
                          >
                            <MoreVertical className="h-3.5 w-3.5" />
                          </button>

                          {activeMenuId === file.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setActiveMenuId(null)} />
                              <div className="absolute right-0 mt-1 w-44 rounded-xl border border-zinc-150 bg-white p-1.5 shadow-xl dark:border-zinc-900 dark:bg-zinc-950 z-20 text-xs">
                                <button
                                  onClick={() => { handleToggleStar(file); setActiveMenuId(null); }}
                                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 cursor-pointer"
                                >
                                  <Star className="h-4 w-4 text-amber-500" />
                                  {file.is_starred ? "Unstar" : "Star"}
                                </button>
                                <button
                                  onClick={() => { handleRenameFile(file); setActiveMenuId(null); }}
                                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 cursor-pointer"
                                >
                                  <Edit3 className="h-4 w-4 text-blue-500" /> Rename
                                </button>
                                <button
                                  onClick={() => { handleShareFile(file); setActiveMenuId(null); }}
                                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 cursor-pointer"
                                >
                                  <Share2 className="h-4 w-4 text-purple-500" /> Share Link
                                </button>
                                <button
                                  onClick={() => handleHideFile(file)}
                                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-violet-50 hover:text-violet-600 dark:hover:bg-violet-950/20 cursor-pointer"
                                >
                                  <EyeOff className="h-4 w-4 text-violet-500" /> Hide in Vault
                                </button>
                                <button
                                  onClick={() => { handleTrashFile(file); setActiveMenuId(null); }}
                                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/20 cursor-pointer"
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" /> Delete
                                </button>
                              </div>
                            </>
                          )}
                        </div>

                        {/* File Category Icons */}
                        <div className="flex h-24 items-center justify-center rounded-2xl bg-zinc-50 dark:bg-zinc-900/40 mb-4 mt-2">
                          {file.file_category === "photo" && (
                            <img
                              src={file.storage_path}
                              alt={file.filename}
                              className="h-full w-full rounded-2xl object-cover"
                              loading="lazy"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = getFileIconSrc(file.filename, file.mime_type);
                                (e.target as HTMLImageElement).style.objectFit = 'contain';
                                (e.target as HTMLImageElement).style.padding = '1rem';
                              }}
                            />
                          )}
                          {file.file_category === "video" && <Film className="h-8 w-8 text-rose-500" />}
                          {file.file_category === "audio" && <Music className="h-8 w-8 text-emerald-500" />}
                          {file.file_category === "document" && <FileText className="h-8 w-8 text-amber-500" />}
                          {file.file_category === "archive" && <Archive className="h-8 w-8 text-purple-500" />}
                          {file.file_category === "other" && <FileQuestion className="h-8 w-8 text-zinc-400" />}
                        </div>

                        {/* Details */}
                        <div className="overflow-hidden">
                          <p className="truncate text-xs font-black text-zinc-850 dark:text-zinc-200" title={file.filename}>{file.filename}</p>
                          {file.tags && file.tags.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-0.5 max-h-8 overflow-hidden">
                              {file.tags.filter(t => t !== "AI Classified").map(t => (
                                <span key={t} className="rounded bg-amber-500/10 px-1 py-0.5 text-[7px] font-black uppercase text-amber-600 dark:text-amber-500 leading-none">
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}
                          <div className="mt-1 flex items-center justify-between text-[10px] text-zinc-400 font-bold">
                            <span>{formatSize(file.size)}</span>
                            {file.is_starred && <Star className="h-3 w-3 text-amber-500 fill-current" />}
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              ) : (
                /* List view layout table */
                <div className="overflow-hidden rounded-2xl border border-zinc-150/70 bg-white/70 backdrop-blur-md dark:border-zinc-900/50 dark:bg-zinc-950/60">
                  <div className="min-w-full divide-y divide-zinc-150/40 dark:divide-zinc-900/40">
                    {filteredFiles.map((file) => {
                      const isSelected = selectedFiles.some(f => f.id === file.id);
                      return (
                        <div
                          key={file.id}
                          onDoubleClick={() => setSelectedFileForPreview(file)}
                          className={`flex items-center justify-between p-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40 cursor-pointer transition-colors
                            ${isSelected ? "bg-amber-500/5" : ""}`}
                        >
                          <div className="flex items-center gap-3 overflow-hidden pr-4 w-1/2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectFile(file)}
                              className="h-4 w-4 rounded border-zinc-300 text-amber-500 focus:ring-amber-500 cursor-pointer mr-1"
                            />
                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-zinc-50 dark:bg-zinc-900 text-zinc-500">
                              {file.file_category === "photo" && <Image className="h-4 w-4" />}
                              {file.file_category === "video" && <Film className="h-4 w-4 text-rose-500" />}
                              {file.file_category === "audio" && <Music className="h-4 w-4 text-emerald-500" />}
                              {file.file_category === "document" && <FileText className="h-4 w-4 text-amber-500" />}
                              {file.file_category === "archive" && <Archive className="h-4 w-4 text-purple-500" />}
                              {file.file_category === "other" && <FileQuestion className="h-4 w-4" />}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="truncate text-xs font-bold text-zinc-800 dark:text-zinc-200" title={file.filename}>{file.filename}</span>
                              {file.tags && file.tags.length > 0 && (
                                <div className="mt-0.5 flex flex-wrap gap-0.5 max-h-6 overflow-hidden">
                                  {file.tags.filter(t => t !== "AI Classified").map(t => (
                                    <span key={t} className="rounded bg-amber-500/10 px-1 py-0.5 text-[6px] font-black uppercase text-amber-600 dark:text-amber-500 leading-none">
                                      {t}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-6 text-[10px] text-zinc-450 font-bold">
                            <span>{formatSize(file.size)}</span>
                            <span>{new Date(file.created_at).toLocaleDateString()}</span>
                            <button
                              onClick={() => handleToggleStar(file)}
                              className={`p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer ${file.is_starred ? "text-amber-500" : ""}`}
                            >
                              <Star className={`h-4 w-4 ${file.is_starred ? "fill-current" : ""}`} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Create Folder Modal */}
      {isFolderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 p-4 backdrop-blur-sm">
          <form 
            onSubmit={handleCreateFolder} 
            className="w-full max-w-sm overflow-hidden rounded-3xl border border-zinc-150 bg-white shadow-2xl dark:border-zinc-900 dark:bg-zinc-950"
          >
            <div className="p-6">
              <h3 className="text-sm font-black text-zinc-900 dark:text-white">Create New Folder</h3>
              <input
                type="text"
                required
                placeholder="Folder Name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="mt-4 w-full rounded-xl border border-zinc-200 bg-white py-2.5 px-4 text-xs focus:border-amber-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-zinc-150/50 bg-zinc-50/50 p-4 dark:border-zinc-900/40 dark:bg-zinc-900/10">
              <button
                type="button"
                onClick={() => setIsFolderModalOpen(false)}
                className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-55 dark:border-zinc-800 dark:text-zinc-350 dark:hover:bg-zinc-900/50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2 text-xs shadow-md cursor-pointer"
              >
                Create Folder
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Copy / Move Folder Selector Modal */}
      {isMoveModalOpen && (
        <FolderTreeModal
          onClose={() => setIsMoveModalOpen(false)}
          onSelect={handleConfirmMoveOrCopy}
          actionLabel={moveActionType === "copy" ? "Copy here" : "Move here"}
        />
      )}

      {/* Inline File Preview lightbox */}
      {selectedFileForPreview && (
        <MediaViewer
          file={selectedFileForPreview}
          allFiles={files}
          onClose={() => setSelectedFileForPreview(null)}
          onToggleStar={handleToggleStar}
          onTrash={handleTrashFile}
          onNavigate={(file) => setSelectedFileForPreview(file)}
        />
      )}

    </div>
  );
}
