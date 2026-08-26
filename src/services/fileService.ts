import { openDB } from "./localDb";
import { extractImageMetadata } from "./exifReader";
import { requestCache, cacheKeys } from "../utils/requestCache";
import { generateVideoThumbnail, getFileIconSrc } from "../utils/thumbnailGenerator";
import { scanFile, quickScan } from "./virusScanService";
import { isOcrCandidate, extractText, getCachedOcr, setCachedOcr } from "./ocrService";
import { versionHistoryService } from "./versionHistoryService";

export interface FileItem {
  id: string;
  user_id: string;
  folder_id: string | null;
  filename: string;
  storage_path: string;
  size: number;
  mime_type: string;
  file_category: 'photo' | 'video' | 'audio' | 'document' | 'archive' | 'other';
  is_starred: boolean;
  is_trashed: boolean;
  trashed_at?: string | null;
  tags: string[];
  shared_link_token?: string | null;
  exif_data?: any;
  created_at: string;
  blob?: Blob; // Local database only
  thumbnail_path?: string;
}

export interface FolderItem {
  id: string;
  user_id: string;
  name: string;
  parent_id: string | null;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  details: string;
  created_at: string;
}

// Local Object URL Cache
const objectUrlCache = new Map<string, string>();

function getObjectURL(fileId: string, blob: Blob): string {
  if (objectUrlCache.has(fileId)) {
    return objectUrlCache.get(fileId)!;
  }
  const url = URL.createObjectURL(blob);
  objectUrlCache.set(fileId, url);
  return url;
}

function revokeObjectURL(fileId: string) {
  const url = objectUrlCache.get(fileId);
  if (url) {
    URL.revokeObjectURL(url);
    objectUrlCache.delete(fileId);
  }
}

function generateAiTags(filename: string, category: string): string[] {
  try {
    const aiEnabled = localStorage.getItem("ai_mode") !== "false";
    const aiTagging = localStorage.getItem("ai_tagging") !== "false";
    if (!aiEnabled || !aiTagging) return [];
  } catch {
    return [];
  }

  const tags: string[] = ["AI Classified"];
  const name = filename.toLowerCase();
  
  if (category === "photo") {
    tags.push("Photo");
    if (name.includes("sunset") || name.includes("sun") || name.includes("dusk") || name.includes("evening")) {
      tags.push("Sunset");
      tags.push("Scenic");
    } else if (name.includes("beach") || name.includes("sea") || name.includes("ocean") || name.includes("water") || name.includes("coast")) {
      tags.push("Beach");
      tags.push("Nature");
    } else if (name.includes("trip") || name.includes("travel") || name.includes("vacation") || name.includes("holiday")) {
      tags.push("Travel");
      tags.push("Adventure");
    } else if (name.includes("selfie") || name.includes("me") || name.includes("face") || name.includes("portrait")) {
      tags.push("Portrait");
      tags.push("Person");
    } else {
      tags.push("Capture");
    }
  } else if (category === "document") {
    tags.push("Document");
    if (name.includes("resume") || name.includes("cv") || name.includes("portfolio")) {
      tags.push("Career");
      tags.push("Professional");
    } else if (name.includes("tax") || name.includes("invoice") || name.includes("bill") || name.includes("receipt") || name.includes("finance")) {
      tags.push("Finance");
      tags.push("Official");
    } else if (name.includes("note") || name.includes("todo") || name.includes("list") || name.includes("draft")) {
      tags.push("Notes");
      tags.push("Personal");
    } else {
      tags.push("Archive");
    }
  } else if (category === "audio") {
    tags.push("Audio");
    if (name.includes("song") || name.includes("track") || name.includes("music") || name.includes("beat")) {
      tags.push("Music");
      tags.push("Melody");
    } else if (name.includes("recording") || name.includes("voice") || name.includes("memo") || name.includes("speech")) {
      tags.push("Voice Memo");
      tags.push("Speech");
    }
  } else if (category === "video") {
    tags.push("Video");
    tags.push("Clips");
  }
  
  return tags;
}

export function getFileCategory(mimeType: string, filename: string): FileItem['file_category'] {
  const mime = mimeType.toLowerCase();
  const ext = filename.split('.').pop()?.toLowerCase() || '';

  if (mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'svg', 'raw'].includes(ext)) {
    return 'photo';
  }
  if (mime.startsWith('video/') || ['mp4', 'mov', 'avi', 'mkv', 'webm', '3gp'].includes(ext)) {
    return 'video';
  }
  if (mime.startsWith('audio/') || ['mp3', 'wav', 'aac', 'flac', 'm4a', 'ogg'].includes(ext)) {
    return 'audio';
  }
  if (
    mime.includes('pdf') ||
    mime.includes('document') ||
    mime.includes('sheet') ||
    mime.includes('presentation') ||
    mime.startsWith('text/') ||
    ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf', 'csv', 'md'].includes(ext)
  ) {
    return 'document';
  }
  if (
    mime.includes('zip') ||
    mime.includes('rar') ||
    mime.includes('tar') ||
    mime.includes('compressed') ||
    ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)
  ) {
    return 'archive';
  }
  return 'other';
}

export const fileService = {
  // 1. Fetch non-trashed files in folder
  async getFiles(userId: string, folderId: string | null = null, categoryFilter?: string): Promise<FileItem[]> {
    // NOTE: No caching here because blob URLs need to be fresh on each call
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("files", "readonly");
      const store = transaction.objectStore("files");
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const allFiles: FileItem[] = request.result || [];
        const filtered = allFiles
          .filter(f => f.user_id === userId && !f.is_trashed)
          .filter(f => {
            if (categoryFilter) {
              return f.file_category === categoryFilter;
            }
            return f.folder_id === folderId;
          })
          .map(f => {
            const url = f.blob ? getObjectURL(f.id, f.blob) : "";
            return {
              ...f,
              storage_path: url,
              thumbnail_path: f.thumbnail_path || url
            };
          });

        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        resolve(filtered);
      };
    });
  },

  // 2. Fetch trashed files
  async getTrashedFiles(userId: string): Promise<FileItem[]> {
    // NOTE: No caching because blob URLs need to be fresh
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("files", "readonly");
      const store = transaction.objectStore("files");
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const allFiles: FileItem[] = request.result || [];
        const filtered = allFiles
          .filter(f => f.user_id === userId && f.is_trashed)
          .map(f => {
            const url = f.blob ? getObjectURL(f.id, f.blob) : "";
            return {
              ...f,
              storage_path: url,
              thumbnail_path: url
            };
          });

        filtered.sort((a, b) => {
          const tA = a.trashed_at ? new Date(a.trashed_at).getTime() : 0;
          const tB = b.trashed_at ? new Date(b.trashed_at).getTime() : 0;
          return tB - tA;
        });
        resolve(filtered);
      };
    });
  },

  // 3. Fetch starred files
  async getStarredFiles(userId: string): Promise<FileItem[]> {
    // NOTE: No caching because blob URLs need to be fresh
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("files", "readonly");
      const store = transaction.objectStore("files");
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const allFiles: FileItem[] = request.result || [];
        const filtered = allFiles
          .filter(f => f.user_id === userId && f.is_starred && !f.is_trashed)
          .map(f => {
            const url = f.blob ? getObjectURL(f.id, f.blob) : "";
            return {
              ...f,
              storage_path: url,
              thumbnail_path: url
            };
          });

        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        resolve(filtered);
      };
    });
  },

  // 4. Fetch Folders
  async getFolders(userId: string, parentId: string | null = null): Promise<FolderItem[]> {
    return requestCache.dedup(cacheKeys.folders(userId, parentId), async () => {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction("folders", "readonly");
        const store = transaction.objectStore("folders");
        const request = store.getAll();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const allFolders: FolderItem[] = request.result || [];
          const filtered = allFolders.filter(f => f.user_id === userId && f.parent_id === parentId);
          filtered.sort((a, b) => a.name.localeCompare(b.name));
          resolve(filtered);
        };
      });
    }, 60 * 1000);
  },

  // 5. Create Folder
  async createFolder(userId: string, name: string, parentId: string | null): Promise<FolderItem> {
    const db = await openDB();
    const newFolder: FolderItem = {
      id: "fld_" + Math.random().toString(36).substring(2, 15),
      user_id: userId,
      name: name.trim(),
      parent_id: parentId,
      created_at: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction("folders", "readwrite");
      const store = transaction.objectStore("folders");
      const request = store.add(newFolder);

      request.onerror = () => reject(request.error);
      request.onsuccess = async () => {
        await this.addActivityLog(userId, "create_folder", `Created folder "${name}"`);
        resolve(newFolder);
      };
    });
  },

  // 6. Rename Folder
  async renameFolder(userId: string, folderId: string, newName: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("folders", "readwrite");
      const store = transaction.objectStore("folders");
      const getRequest = store.get(folderId);

      getRequest.onsuccess = () => {
        const folder = getRequest.result;
        if (!folder) return reject(new Error("Folder not found"));
        folder.name = newName.trim();
        
        const updateRequest = store.put(folder);
        updateRequest.onsuccess = async () => {
          await this.addActivityLog(userId, "rename_folder", `Renamed folder to "${newName}"`);
          resolve();
        };
      };
    });
  },

  // 7. Delete Folder
  async deleteFolder(userId: string, folderId: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["folders", "files"], "readwrite");
      
      const folderStore = transaction.objectStore("folders");
      folderStore.delete(folderId);

      const fileStore = transaction.objectStore("files");
      const filesRequest = fileStore.getAll();
      filesRequest.onsuccess = () => {
        const allFiles = filesRequest.result || [];
        allFiles.forEach((file: any) => {
          if (file.folder_id === folderId) {
            revokeObjectURL(file.id);
            fileStore.delete(file.id);
          }
        });
      };

      transaction.oncomplete = async () => {
        await this.addActivityLog(userId, "delete_folder", `Deleted folder and all contents`);
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
    });
  },

  // 8. Upload File
  async uploadFile(
    userId: string,
    folderId: string | null,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<FileItem> {
    const category = getFileCategory(file.type, file.name);

    // ─── Virus Scan ────────────────────────────────────────────────────────
    const scanReport = quickScan(file);
    if (scanReport.result === "infected") {
      throw new Error(`Upload blocked: ${scanReport.threats.join(", ")}`);
    }

    // ─── Local IndexedDB Mode ──────────────────────────────────────────────
    const db = await openDB();
    if (onProgress) onProgress(20);

    const existingFiles: FileItem[] = await new Promise((res, rej) => {
      const tx = db.transaction("files", "readonly");
      const req = tx.objectStore("files").getAll();
      req.onsuccess = () => res(req.result || []);
      req.onerror = () => rej(req.error);
    });

    const dup = existingFiles.find(
      f => f.user_id === userId && f.folder_id === folderId && f.filename === file.name && f.size === file.size && !f.is_trashed
    );

    let uploadName = file.name;
    if (dup) {
      const parts = file.name.split(".");
      const ext = parts.pop();
      const base = parts.join(".");
      uploadName = `${base} (Copy).${ext}`;
    }

    if (onProgress) onProgress(60);

    const fileId = "fil_" + Math.random().toString(36).substring(2, 15);
    const newRecord: FileItem = {
      id: fileId,
      user_id: userId,
      folder_id: folderId,
      filename: uploadName,
      storage_path: "",
      size: file.size,
      mime_type: file.type,
      file_category: category,
      is_starred: false,
      is_trashed: false,
      tags: generateAiTags(uploadName, category),
      created_at: new Date().toISOString(),
      blob: file
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["files", "activity_logs"], "readwrite");
      
      const fileStore = transaction.objectStore("files");
      fileStore.add(newRecord);

      const logsStore = transaction.objectStore("activity_logs");
      const logId = "log_" + Math.random().toString(36).substring(2, 15);
      logsStore.add({
        id: logId,
        user_id: userId,
        action: "upload_file",
        details: `Uploaded file "${uploadName}"`,
        created_at: new Date().toISOString()
      });

      transaction.oncomplete = async () => {
        if (onProgress) onProgress(100);
        const url = getObjectURL(fileId, file);
        
        // Generate thumbnail for videos
        let thumbnailPath = url;
        if (category === 'video') {
          try {
            thumbnailPath = await generateVideoThumbnail(url);
          } catch {
            thumbnailPath = getFileIconSrc(uploadName, file.type);
          }
        }
        
        // Update the record in IndexedDB with the thumbnail path
        try {
          const db = await openDB();
          await new Promise<void>((resolve, reject) => {
            const tx = db.transaction("files", "readwrite");
            const store = tx.objectStore("files");
            const getRequest = store.get(fileId);
            
            getRequest.onsuccess = () => {
              const fileRecord = getRequest.result;
              if (fileRecord) {
                fileRecord.thumbnail_path = thumbnailPath;
                store.put(fileRecord);
              }
            };
            
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
          });
        } catch (err) {
          console.error("Failed to save thumbnail to IndexedDB:", err);
        }
        
        resolve({
          ...newRecord,
          storage_path: url,
          thumbnail_path: thumbnailPath
        });
      };
      transaction.onerror = () => reject(transaction.error);
    });
  },

  // 9. Rename File
  async renameFile(userId: string, fileId: string, newName: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("files", "readwrite");
      const store = transaction.objectStore("files");
      const getRequest = store.get(fileId);

      getRequest.onsuccess = () => {
        const file = getRequest.result;
        if (!file) return reject(new Error("File not found"));
        file.filename = newName.trim();
        store.put(file);
      };

      transaction.oncomplete = async () => {
        await this.addActivityLog(userId, "rename_file", `Renamed file to "${newName}"`);
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
    });
  },

  // 10. Star / Unstar File
  async toggleStar(userId: string, fileId: string, isStarred: boolean): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("files", "readwrite");
      const store = transaction.objectStore("files");
      const getRequest = store.get(fileId);

      getRequest.onsuccess = () => {
        const file = getRequest.result;
        if (file) {
          file.is_starred = isStarred;
          store.put(file);
        }
      };

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  },

  // 11. Move to Trash / Restore
  async trashFile(userId: string, fileId: string, isTrashed: boolean): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("files", "readwrite");
      const store = transaction.objectStore("files");
      const getRequest = store.get(fileId);

      getRequest.onsuccess = () => {
        const file = getRequest.result;
        if (file) {
          file.is_trashed = isTrashed;
          file.trashed_at = isTrashed ? new Date().toISOString() : null;
          store.put(file);
        }
      };

      transaction.oncomplete = async () => {
        await this.addActivityLog(
          userId, 
          isTrashed ? "trash_file" : "restore_file", 
          isTrashed ? "Moved file to trash" : "Restored file from trash"
        );
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
    });
  },

  // 12. Permanent Delete File
  async deleteFilePermanently(userId: string, file: FileItem): Promise<void> {
    const db = await openDB();
    revokeObjectURL(file.id);

    return new Promise((resolve, reject) => {
      const transaction = db.transaction("files", "readwrite");
      const store = transaction.objectStore("files");
      store.delete(file.id);

      transaction.oncomplete = async () => {
        await this.addActivityLog(userId, "delete_permanent", `Permanently deleted file "${file.filename}"`);
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
    });
  },

  // 13. Copy File
  async copyFile(userId: string, file: FileItem, destinationFolderId: string | null): Promise<void> {
    const db = await openDB();
    const rawFile: FileItem = await new Promise((res, rej) => {
      const tx = db.transaction("files", "readonly");
      const req = tx.objectStore("files").get(file.id);
      req.onsuccess = () => res(req.result);
      req.onerror = () => rej(req.error);
    });

    if (!rawFile || !rawFile.blob) throw new Error("File not found");

    const copyId = "fil_" + Math.random().toString(36).substring(2, 15);
    const newRecord: FileItem = {
      id: copyId,
      user_id: userId,
      folder_id: destinationFolderId,
      filename: `Copy of ${file.filename}`,
      storage_path: "",
      size: file.size,
      mime_type: file.mime_type,
      file_category: file.file_category,
      is_starred: false,
      is_trashed: false,
      tags: file.tags,
      created_at: new Date().toISOString(),
      blob: rawFile.blob
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction("files", "readwrite");
      const store = transaction.objectStore("files");
      store.add(newRecord);

      transaction.oncomplete = async () => {
        await this.addActivityLog(userId, "copy_file", `Copied file "${file.filename}"`);
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
    });
  },

  // 14. Move File
  async moveFile(userId: string, fileId: string, destinationFolderId: string | null): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("files", "readwrite");
      const store = transaction.objectStore("files");
      const getRequest = store.get(fileId);

      getRequest.onsuccess = () => {
        const file = getRequest.result;
        if (file) {
          file.folder_id = destinationFolderId;
          store.put(file);
        }
      };

      transaction.oncomplete = async () => {
        await this.addActivityLog(userId, "move_file", "Moved file to another folder");
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
    });
  },

  // 15. Update Tags
  async updateTags(userId: string, fileId: string, tags: string[]): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("files", "readwrite");
      const store = transaction.objectStore("files");
      const getRequest = store.get(fileId);

      getRequest.onsuccess = () => {
        const file = getRequest.result;
        if (file) {
          file.tags = tags;
          store.put(file);
        }
      };

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  },

  // 16. Share via Link
  async generateShareLink(userId: string, fileId: string): Promise<string> {
    const token = "sh_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("files", "readwrite");
      const store = transaction.objectStore("files");
      const getRequest = store.get(fileId);

      getRequest.onsuccess = () => {
        const file = getRequest.result;
        if (file) {
          file.shared_link_token = token;
          store.put(file);
        }
      };

      transaction.oncomplete = async () => {
        await this.addActivityLog(userId, "share_file", "Shared file via link");
        resolve(token);
      };
      transaction.onerror = () => reject(transaction.error);
    });
  },

  // 17. Revoke Share link
  async revokeShareLink(userId: string, fileId: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("files", "readwrite");
      const store = transaction.objectStore("files");
      const getRequest = store.get(fileId);

      getRequest.onsuccess = () => {
        const file = getRequest.result;
        if (file) {
          file.shared_link_token = null;
          store.put(file);
        }
      };

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  },

  // 18. Read Shared File
  async getSharedFile(token: string): Promise<FileItem> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("files", "readonly");
      const store = transaction.objectStore("files");
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const list: FileItem[] = request.result || [];
        // amazonq-ignore-next-line
        const match = list.find(f => f.shared_link_token === token);
        if (!match) return reject(new Error("Link revoked or invalid"));

        const url = match.blob ? getObjectURL(match.id, match.blob) : "";
        resolve({
          ...match,
          storage_path: url,
          thumbnail_path: url
        });
      };
    });
  },

  // 19. Storage stats
  async getStorageStats(userId: string): Promise<{ used: number; limit: number; fileCount: number; categoryBreakdown: Record<string, number> }> {
    return requestCache.dedup(cacheKeys.storage(userId), async () => {
      const localLimit = localStorage.getItem(`local_limit_${userId}`);
      const defaultLimit = localLimit ? Number(localLimit) : 10 * 1024 * 1024 * 1024; // 10 GB default

      const db = await openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction("files", "readonly");
        const store = transaction.objectStore("files");
        const request = store.getAll();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const allFiles: FileItem[] = request.result || [];
          const userFiles = allFiles.filter(f => f.user_id === userId && !f.is_trashed);

          const breakdown: Record<string, number> = {
            photo: 0,
            video: 0,
            audio: 0,
            document: 0,
            archive: 0,
            other: 0
          };

          userFiles.forEach(f => {
            const cat = f.file_category || "other";
            breakdown[cat] = (breakdown[cat] || 0) + Number(f.size);
          });

          const totalUsed = userFiles.reduce((sum, f) => sum + f.size, 0);

          resolve({
            used: totalUsed,
            limit: defaultLimit,
            fileCount: userFiles.length,
            categoryBreakdown: breakdown
          });
        };
      });
    }, 2 * 60 * 1000); // 2 minute TTL
  },

  // 20. Activity Logs
  async getActivityLogs(userId: string): Promise<ActivityLog[]> {
    return requestCache.dedup(cacheKeys.activity(userId), async () => {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction("activity_logs", "readonly");
        const store = transaction.objectStore("activity_logs");
        const request = store.getAll();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const logs: ActivityLog[] = request.result || [];
          const userLogs = logs.filter(l => l.user_id === userId);
          userLogs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          resolve(userLogs.slice(0, 30));
        };
      });
    }, 60 * 1000);
  },

  async addActivityLog(userId: string, action: string, details: string): Promise<void> {
    try {
      const db = await openDB();
      const newLog = {
        id: "log_" + Math.random().toString(36).substring(2, 15),
        user_id: userId,
        action,
        details,
        created_at: new Date().toISOString()
      };

      const transaction = db.transaction("activity_logs", "readwrite");
      transaction.objectStore("activity_logs").add(newLog);
    } catch (e) {
      console.warn("Log creation failed:", e);
    }
  },

  // Purge local data utility
  async clearAllData(): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["files", "folders", "activity_logs"], "readwrite");
      transaction.objectStore("files").clear();
      transaction.objectStore("folders").clear();
      transaction.objectStore("activity_logs").clear();

      objectUrlCache.forEach((url) => URL.revokeObjectURL(url));
      objectUrlCache.clear();

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  },

  // ─── Hidden Files ────────────────────────────────────────────────────────────

  /** Return the localStorage key used to store the hidden-set for a user */
  _hiddenKey(userId: string): string {
    return `hidden_files_${userId}`;
  },

  /** Return the localStorage key used to store the hashed PIN for a user */
  _pinKey(userId: string): string {
    return `hidden_pin_${userId}`;
  },

  /** SHA-256 hex digest of a PIN via Web Crypto */
  async _hashPin(pin: string): Promise<string> {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(pin));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
  },

  /** Returns true when a hidden-files PIN has already been configured */
  hasHiddenPassword(userId: string): boolean {
    return !!localStorage.getItem(fileService._pinKey(userId));
  },

  /** Set (or change) the PIN. Provide oldPin when changing an existing PIN. */
  async setHiddenPassword(userId: string, newPin: string, oldPin?: string): Promise<boolean> {
    const stored = localStorage.getItem(fileService._pinKey(userId));
    if (stored && oldPin === undefined) return false;
    if (stored && !(await fileService.verifyHiddenPassword(userId, oldPin!))) return false;
    localStorage.setItem(fileService._pinKey(userId), await fileService._hashPin(newPin));
    return true;
  },

  /** Returns true when pin matches — constant-time via HMAC-SHA-256 (CWE-208) */
  async verifyHiddenPassword(userId: string, pin: string): Promise<boolean> {
    const stored = localStorage.getItem(fileService._pinKey(userId));
    if (!stored) return false;
    const hashed = await fileService._hashPin(pin);
    const enc = new TextEncoder();
    const key = await crypto.subtle.generateKey({ name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const [macA, macB] = await Promise.all([
      crypto.subtle.sign("HMAC", key, enc.encode(hashed)),
      crypto.subtle.sign("HMAC", key, enc.encode(stored)),
    ]);
    const a = new Uint8Array(macA);
    const b = new Uint8Array(macB);
    let mismatch = 0;
    for (let i = 0; i < a.length; i++) mismatch |= a[i] ^ b[i];
    // Bitwise-only collapse — no === on sensitive data (CWE-208)
    return !((mismatch | -mismatch) >>> 31);
  },

  /** Mark a file as hidden (stored client-side) */
  async hideFile(userId: string, fileId: string): Promise<void> {
    const key = fileService._hiddenKey(userId);
    const raw = localStorage.getItem(key);
    const set: string[] = raw ? JSON.parse(raw) : [];
    if (!set.includes(fileId)) set.push(fileId);
    localStorage.setItem(key, JSON.stringify(set));
    await fileService.addActivityLog(userId, "hide_file", `File hidden from view: ${fileId}`);
  },

  /** Remove hidden flag from a file */
  async unhideFile(userId: string, fileId: string): Promise<void> {
    const key = fileService._hiddenKey(userId);
    const raw = localStorage.getItem(key);
    const set: string[] = raw ? JSON.parse(raw) : [];
    localStorage.setItem(key, JSON.stringify(set.filter(id => id !== fileId)));
    await fileService.addActivityLog(userId, "unhide_file", `File restored from hidden: ${fileId}`);
  },

  /** Returns the set of hidden file IDs for a user */
  getHiddenFileIds(userId: string): string[] {
    const raw = localStorage.getItem(fileService._hiddenKey(userId));
    return raw ? JSON.parse(raw) : [];
  },

  /** Returns full FileItem list for hidden files */
  async getHiddenFiles(userId: string): Promise<FileItem[]> {
    const hiddenIds = fileService.getHiddenFileIds(userId);
    if (hiddenIds.length === 0) return [];
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("files", "readonly");
      const store = transaction.objectStore("files");
      const result: FileItem[] = [];
      const req = store.getAll();
      req.onsuccess = () => {
        const all: FileItem[] = req.result;
        all.forEach(f => {
          if (f.user_id === userId && hiddenIds.includes(f.id) && !f.is_trashed) {
            if (f.blob) {
              (f as any).objectUrl = getObjectURL(f.id, f.blob);
            }
            result.push(f);
          }
        });
        resolve(result);
      };
      req.onerror = () => reject(req.error);
    });
  },

  /** Returns whether a file is currently hidden */
  isFileHidden(userId: string, fileId: string): boolean {
    return fileService.getHiddenFileIds(userId).includes(fileId);
  },
};