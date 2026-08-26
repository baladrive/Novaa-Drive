import { fileService, FileItem } from "./fileService";

export interface FolderTemplate {
  id: string;
  name: string;
  icon: string;
  description: string;
  folders: { name: string; color?: string }[];
}

export interface PinnedFolder {
  folderId: string;
  name: string;
  pinnedAt: string;
}

export const folderTemplates: FolderTemplate[] = [
  {
    id: "personal",
    name: "Personal",
    icon: "👤",
    description: "Personal documents, photos, and memories",
    folders: [
      { name: "Photos", color: "#f59e0b" },
      { name: "Documents", color: "#3b82f6" },
      { name: "Memories", color: "#ec4899" },
      { name: "Health", color: "#10b981" },
    ],
  },
  {
    id: "office",
    name: "Office",
    icon: "💼",
    description: "Work-related files and projects",
    folders: [
      { name: "Projects", color: "#6366f1" },
      { name: "Meetings", color: "#8b5cf6" },
      { name: "Reports", color: "#f59e0b" },
      { name: "Invoices", color: "#10b981" },
      { name: "HR Documents", color: "#ec4899" },
    ],
  },
  {
    id: "college",
    name: "College",
    icon: "🎓",
    description: "Academic files and study materials",
    folders: [
      { name: "Lectures", color: "#3b82f6" },
      { name: "Assignments", color: "#f59e0b" },
      { name: "Projects", color: "#8b5cf6" },
      { name: "Research", color: "#10b981" },
      { name: "Results", color: "#ec4899" },
    ],
  },
  {
    id: "media",
    name: "Media",
    icon: "🎬",
    description: "All your media files organized",
    folders: [
      { name: "Videos", color: "#ef4444" },
      { name: "Music", color: "#f59e0b" },
      { name: "Photos", color: "#3b82f6" },
      { name: "Podcasts", color: "#8b5cf6" },
    ],
  },
  {
    id: "projects",
    name: "Projects",
    icon: "📊",
    description: "Project-based file organization",
    folders: [
      { name: "Planning", color: "#6366f1" },
      { name: "Design", color: "#ec4899" },
      { name: "Development", color: "#3b82f6" },
      { name: "Testing", color: "#10b981" },
      { name: "Deployment", color: "#f59e0b" },
    ],
  },
];

export const smartFileService = {
  // ─── Request Files ───────────────────────────────────────────────────────
  async createFileRequest(
    userId: string,
    folderId: string | null,
    requestName: string,
    options: { maxFiles?: number; expiresInDays?: number } = {}
  ): Promise<string> {
    const token = "req_" + Array.from({ length: 20 }, () => Math.random().toString(36)[2]).join("");
    const request = {
      id: "fr_" + Math.random().toString(36).substring(2, 15),
      userId,
      folderId,
      requestName,
      token,
      maxFiles: options.maxFiles || 10,
      expiresAt: options.expiresInDays
        ? new Date(Date.now() + options.expiresInDays * 86400000).toISOString()
        : null,
      filesUploaded: 0,
      createdAt: new Date().toISOString(),
      isActive: true,
    };

    const requests = this.getFileRequests(userId);
    requests.unshift(request);
    localStorage.setItem(`file_requests_${userId}`, JSON.stringify(requests.slice(0, 20)));
    return token;
  },

  getFileRequests(userId: string): any[] {
    try {
      const raw = localStorage.getItem(`file_requests_${userId}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  getFileRequestByToken(token: string): any | null {
    try {
      const allKeys = Object.keys(localStorage).filter((k) => k.startsWith("file_requests_"));
      for (const key of allKeys) {
        const requests = JSON.parse(localStorage.getItem(key) || "[]");
        // Use constant-time comparison to prevent timing attacks (CWE-208)
        const found = requests.find((r: any) => {
          if (!r.isActive || r.token.length !== token.length) return false;
          let mismatch = 0;
          for (let i = 0; i < token.length; i++) {
            mismatch |= r.token.charCodeAt(i) ^ token.charCodeAt(i);
          }
          return mismatch === 0;
        });
        if (found) return found;
      }
      return null;
    } catch {
      return null;
    }
  },

  // ─── Folder Templates ────────────────────────────────────────────────────
  async applyTemplate(userId: string, template: FolderTemplate, parentFolderId: string | null = null): Promise<void> {
    const existingFolders = await fileService.getFolders(userId, parentFolderId);
    const existingNames = new Set(existingFolders.map((f) => f.name.toLowerCase()));

    for (const folder of template.folders) {
      if (!existingNames.has(folder.name.toLowerCase())) {
        await fileService.createFolder(userId, folder.name, parentFolderId);
        // Store folder color
        if (folder.color) {
          const colors = this.getFolderColors(userId);
          // We'll set color by folder name since we don't have the new folder ID yet
          colors[folder.name] = folder.color;
          localStorage.setItem(`folder_colors_${userId}`, JSON.stringify(colors));
        }
      }
    }
  },

  // ─── Folder Colors ───────────────────────────────────────────────────────
  getFolderColors(userId: string): Record<string, string> {
    try {
      const raw = localStorage.getItem(`folder_colors_${userId}`);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  },

  setFolderColor(userId: string, folderName: string, color: string): void {
    const colors = this.getFolderColors(userId);
    colors[folderName] = color;
    localStorage.setItem(`folder_colors_${userId}`, JSON.stringify(colors));
  },

  // ─── Folder Cover Images ─────────────────────────────────────────────────
  getFolderCover(userId: string, folderName: string): string | null {
    try {
      const raw = localStorage.getItem(`folder_covers_${userId}`);
      const covers = raw ? JSON.parse(raw) : {};
      return covers[folderName] || null;
    } catch {
      return null;
    }
  },

  setFolderCover(userId: string, folderName: string, coverDataUrl: string): void {
    try {
      const raw = localStorage.getItem(`folder_covers_${userId}`);
      const covers = raw ? JSON.parse(raw) : {};
      covers[folderName] = coverDataUrl;
      localStorage.setItem(`folder_covers_${userId}`, JSON.stringify(covers));
    } catch {
      // Silently fail if too large
    }
  },

  // ─── Pin Folders to Dashboard ────────────────────────────────────────────
  getPinnedFolders(userId: string): PinnedFolder[] {
    try {
      const raw = localStorage.getItem(`pinned_folders_${userId}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  pinFolder(userId: string, folderId: string, name: string): void {
    const pinned = this.getPinnedFolders(userId);
    if (!pinned.find((p) => p.folderId === folderId)) {
      pinned.push({ folderId, name, pinnedAt: new Date().toISOString() });
      localStorage.setItem(`pinned_folders_${userId}`, JSON.stringify(pinned));
    }
  },

  unpinFolder(userId: string, folderId: string): void {
    const pinned = this.getPinnedFolders(userId);
    localStorage.setItem(`pinned_folders_${userId}`, JSON.stringify(pinned.filter((p) => p.folderId !== folderId)));
  },

  // ─── Archive Mode ────────────────────────────────────────────────────────
  isArchiveMode(userId: string): boolean {
    return localStorage.getItem(`archive_mode_${userId}`) === "true";
  },

  toggleArchiveMode(userId: string, enabled: boolean): void {
    localStorage.setItem(`archive_mode_${userId}`, enabled ? "true" : "false");
  },

  // ─── One-Click Storage Cleanup ───────────────────────────────────────────
  async getCleanupSuggestions(userId: string): Promise<{
    emptyFolders: { id: string; name: string }[];
    largeFiles: { id: string; filename: string; size: number }[];
    oldTrashedFiles: { id: string; filename: string; trashedAt: string }[];
  }> {
    const allFiles = await fileService.getFiles(userId, null);
    const allFolders = await fileService.getFolders(userId, null);
    const trashedFiles = await fileService.getTrashedFiles(userId);

    // Find empty folders
    const emptyFolders = allFolders.filter((f) => !allFiles.some((file) => file.folder_id === f.id));

    // Find large files (>50MB)
    const largeFiles = allFiles
      .filter((f) => f.size > 50 * 1024 * 1024)
      .map((f) => ({ id: f.id, filename: f.filename, size: f.size }));

    // Find old trashed files (>30 days)
    const thirtyDaysAgo = Date.now() - 30 * 86400000;
    const oldTrashedFiles = trashedFiles
      .filter((f) => f.trashed_at && new Date(f.trashed_at).getTime() < thirtyDaysAgo)
      .map((f) => ({ id: f.id, filename: f.filename, trashedAt: f.trashed_at || "" }));

    return { emptyFolders, largeFiles, oldTrashedFiles };
  },

  // ─── Duplicate File Finder ───────────────────────────────────────────────
  async findDuplicateFiles(userId: string): Promise<{ original: FileItem; duplicates: FileItem[] }[]> {
    const allFiles = await fileService.getFiles(userId, null);
    const grouped = new Map<string, FileItem[]>();

    allFiles.forEach((f) => {
      const key = `${f.filename.toLowerCase()}_${f.size}`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(f);
    });

    const results: { original: FileItem; duplicates: FileItem[] }[] = [];
    grouped.forEach((group) => {
      if (group.length > 1) {
        results.push({ original: group[0], duplicates: group.slice(1) });
      }
    });

    return results;
  },

  // ─── Large File Finder ───────────────────────────────────────────────────
  async findLargeFiles(userId: string, minSizeMB = 50): Promise<FileItem[]> {
    const allFiles = await fileService.getFiles(userId, null);
    return allFiles.filter((f) => f.size > minSizeMB * 1024 * 1024).sort((a, b) => b.size - a.size);
  },

  // ─── Empty Folder Detection ──────────────────────────────────────────────
  async findEmptyFolders(userId: string): Promise<{ id: string; name: string }[]> {
    const allFiles = await fileService.getFiles(userId, null);
    const allFolders = await fileService.getFolders(userId, null);
    return allFolders
      .filter((f) => !allFiles.some((file) => file.folder_id === f.id))
      .map((f) => ({ id: f.id, name: f.name }));
  },
};