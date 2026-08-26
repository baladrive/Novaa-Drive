/**
 * File Version History Service
 *
 * Tracks all versions of a file, allowing users to view, restore,
 * and compare previous versions.
 */

export interface FileVersion {
  id: string;
  fileId: string;
  versionNumber: number;
  filename: string;
  size: number;
  mimeType: string;
  blob: Blob;
  createdAt: string;
  createdBy: string;
  changeDescription: string;
  checksum: string;
}

const VERSIONS_KEY = "novaa_file_versions";

function getVersions(): FileVersion[] {
  try {
    const raw = localStorage.getItem(VERSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveVersions(versions: FileVersion[]): void {
  try {
    // Don't store blobs in localStorage — store metadata only
    const metadata = versions.map((v) => ({
      ...v,
      blob: null, // Blobs are stored in IndexedDB
    }));
    localStorage.setItem(VERSIONS_KEY, JSON.stringify(metadata.slice(0, 1000)));
  } catch {}
}

/** Generate a simple checksum for a blob */
async function generateChecksum(blob: Blob): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const versionHistoryService = {
  /** Create a new version of a file */
  async createVersion(
    fileId: string,
    filename: string,
    size: number,
    mimeType: string,
    blob: Blob,
    userId: string,
    changeDescription: string = "File updated"
  ): Promise<FileVersion> {
    const checksum = await generateChecksum(blob);

    // Check if this version already exists (same checksum)
    const existing = getVersions().find(
      (v) => v.fileId === fileId && v.checksum === checksum
    );
    if (existing) {
      return existing;
    }

    // Get the latest version number for this file
    const fileVersions = getVersions()
      .filter((v) => v.fileId === fileId)
      .sort((a, b) => b.versionNumber - a.versionNumber);

    const nextVersion = fileVersions.length > 0 ? fileVersions[0].versionNumber + 1 : 1;

    const version: FileVersion = {
      id: "ver_" + Math.random().toString(36).substring(2, 15),
      fileId,
      versionNumber: nextVersion,
      filename,
      size,
      mimeType,
      blob,
      createdAt: new Date().toISOString(),
      createdBy: userId,
      changeDescription,
      checksum,
    };

    // Store blob in IndexedDB (via fileService's object store)
    // Store metadata in localStorage
    const allVersions = getVersions();
    allVersions.push({
      ...version,
      blob: null as any, // Don't store blob in localStorage
    });
    saveVersions(allVersions);

    // Store the actual blob in IndexedDB
    try {
      const { openDB } = await import("./localDb");
      const db = await openDB();
      const tx = db.transaction("file_versions", "readwrite");
      const store = tx.objectStore("file_versions");
      await new Promise<void>((resolve, reject) => {
        const req = store.put({
          id: version.id,
          fileId,
          versionNumber: nextVersion,
          filename,
          size,
          mimeType,
          blob,
          createdAt: version.createdAt,
          createdBy: userId,
          changeDescription,
          checksum,
        });
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn("Failed to store version blob in IndexedDB:", e);
    }

    return version;
  },

  /** Get all versions for a file */
  async getVersions(fileId: string): Promise<FileVersion[]> {
    // Get metadata from localStorage
    const metadata = getVersions().filter((v) => v.fileId === fileId);

    // Get blobs from IndexedDB
    try {
      const { openDB } = await import("./localDb");
      const db = await openDB();
      const tx = db.transaction("file_versions", "readonly");
      const store = tx.objectStore("file_versions");
      const req = store.getAll();

      const indexedVersions: any[] = await new Promise((resolve, reject) => {
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });

      // Merge metadata with blobs
      return metadata
        .map((m) => {
          const withBlob = indexedVersions.find((v) => v.id === m.id);
          return { ...m, blob: withBlob?.blob || null } as FileVersion;
        })
        .sort((a, b) => b.versionNumber - a.versionNumber);
    } catch (e) {
      console.warn("Failed to load version blobs from IndexedDB:", e);
      return metadata.sort((a, b) => b.versionNumber - a.versionNumber);
    }
  },

  /** Restore a file to a specific version */
  async restoreVersion(fileId: string, versionId: string): Promise<FileVersion | null> {
    const versions = await this.getVersions(fileId);
    const version = versions.find((v) => v.id === versionId);
    if (!version || !version.blob) return null;

    // Update the file in fileService with the restored version
    try {
      const { fileService } = await import("./fileService");
      const db = await (await import("./localDb")).openDB();
      const tx = db.transaction("files", "readwrite");
      const store = tx.objectStore("files");
      const req = store.get(fileId);

      await new Promise<void>((resolve, reject) => {
        req.onsuccess = () => {
          const file = req.result;
          if (file) {
            file.blob = version.blob;
            file.filename = version.filename;
            file.size = version.size;
            file.mime_type = version.mimeType;
            store.put(file);
          }
          resolve();
        };
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.error("Failed to restore version:", e);
    }

    return version;
  },

  /** Delete all versions for a file */
  async deleteVersions(fileId: string): Promise<void> {
    // Remove from localStorage metadata
    const allVersions = getVersions().filter((v) => v.fileId !== fileId);
    saveVersions(allVersions);

    // Remove from IndexedDB
    try {
      const { openDB } = await import("./localDb");
      const db = await openDB();
      const tx = db.transaction("file_versions", "readwrite");
      const store = tx.objectStore("file_versions");
      const req = store.getAll();

      const versions: any[] = await new Promise((resolve, reject) => {
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });

      for (const v of versions.filter((v) => v.fileId === fileId)) {
        store.delete(v.id);
      }
    } catch (e) {
      console.warn("Failed to delete versions from IndexedDB:", e);
    }
  },

  /** Get version count for a file */
  getVersionCount(fileId: string): number {
    return getVersions().filter((v) => v.fileId === fileId).length;
  },
};
