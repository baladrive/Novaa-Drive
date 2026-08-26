const DB_NAME = "NovaDriveDB";
const DB_VERSION = 2;

export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error("IndexedDB open error:", request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (_event: any) => {
      const db = request.result;
      
      // Store all files metadata & raw Blob payloads
      if (!db.objectStoreNames.contains("files")) {
        const filesStore = db.createObjectStore("files", { keyPath: "id" });
        filesStore.createIndex("userId", "user_id", { unique: false });
        filesStore.createIndex("folderId", "folder_id", { unique: false });
        filesStore.createIndex("category", "file_category", { unique: false });
        filesStore.createIndex("isStarred", "is_starred", { unique: false });
        filesStore.createIndex("isTrashed", "is_trashed", { unique: false });
        filesStore.createIndex("shareToken", "shared_link_token", { unique: false });
      }
      
      // Store custom folder directory structures
      if (!db.objectStoreNames.contains("folders")) {
        const foldersStore = db.createObjectStore("folders", { keyPath: "id" });
        foldersStore.createIndex("userId", "user_id", { unique: false });
        foldersStore.createIndex("parentId", "parent_id", { unique: false });
      }
      
      // Store audit activity logs
      if (!db.objectStoreNames.contains("activity_logs")) {
        const logsStore = db.createObjectStore("activity_logs", { keyPath: "id" });
        logsStore.createIndex("userId", "user_id", { unique: false });
      }

      // Store photos
      if (!db.objectStoreNames.contains("photos")) {
        const photosStore = db.createObjectStore("photos", { keyPath: "id" });
        photosStore.createIndex("userId", "user_id", { unique: false });
        photosStore.createIndex("isStarred", "is_starred", { unique: false });
        photosStore.createIndex("isTrashed", "is_trashed", { unique: false });
      }

      // Store albums
      if (!db.objectStoreNames.contains("albums")) {
        const albumsStore = db.createObjectStore("albums", { keyPath: "id" });
        albumsStore.createIndex("userId", "user_id", { unique: false });
      }

      // Store album_photos junctions
      if (!db.objectStoreNames.contains("album_photos")) {
        const junctionStore = db.createObjectStore("album_photos", { keyPath: "id" });
        junctionStore.createIndex("albumId", "album_id", { unique: false });
        junctionStore.createIndex("photoId", "photo_id", { unique: false });
      }

      // Store file versions (for version history)
      if (!db.objectStoreNames.contains("file_versions")) {
        const versionsStore = db.createObjectStore("file_versions", { keyPath: "id" });
        versionsStore.createIndex("fileId", "file_id", { unique: false });
        versionsStore.createIndex("versionNumber", "version_number", { unique: false });
      }
    };
  });
}
