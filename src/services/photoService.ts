import { openDB } from "./localDb";
import { ExifData } from "./exifReader";

export interface Photo {
  id: string;
  user_id: string;
  filename: string;
  storage_path: string;
  thumbnail_path?: string;
  size: number;
  mime_type: string;
  width?: number;
  height?: number;
  is_favorite: boolean;
  is_trashed: boolean;
  trashed_at?: string | null;
  exif_data?: ExifData;
  created_at: string;
  blob?: Blob; // The raw image file stored in IndexedDB
}

export interface Album {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  cover_photo_id?: string | null;
  created_at: string;
  photoCount?: number;
}

// Memory-efficient Object URL Cache to prevent multiple allocations and memory leaks
const objectUrlCache = new Map<string, string>();

function getObjectURL(photoId: string, blob: Blob): string {
  if (objectUrlCache.has(photoId)) {
    return objectUrlCache.get(photoId)!;
  }
  const url = URL.createObjectURL(blob);
  objectUrlCache.set(photoId, url);
  return url;
}

function revokeObjectURL(photoId: string) {
  const url = objectUrlCache.get(photoId);
  if (url) {
    URL.revokeObjectURL(url);
    objectUrlCache.delete(photoId);
  }
}

export const photoService = {
  // 1. Fetch user photos (non-trashed)
  async getPhotos(userId: string): Promise<Photo[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("photos", "readonly");
      const store = transaction.objectStore("photos");
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const allPhotos: Photo[] = request.result || [];
        // Filter and map local object URLs
        const userPhotos = allPhotos
          .filter(p => p.user_id === userId && !p.is_trashed)
          .map(p => {
            const url = p.blob ? getObjectURL(p.id, p.blob) : "";
            return {
              ...p,
              storage_path: url,
              thumbnail_path: url
            };
          });
        
        // Sort chronologically (descending)
        userPhotos.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        resolve(userPhotos);
      };
    });
  },

  // 2. Fetch user trashed photos
  async getTrashedPhotos(userId: string): Promise<Photo[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("photos", "readonly");
      const store = transaction.objectStore("photos");
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const allPhotos: Photo[] = request.result || [];
        const userTrashed = allPhotos
          .filter(p => p.user_id === userId && p.is_trashed)
          .map(p => {
            const url = p.blob ? getObjectURL(p.id, p.blob) : "";
            return {
              ...p,
              storage_path: url,
              thumbnail_path: url
            };
          });

        userTrashed.sort((a, b) => {
          const tA = a.trashed_at ? new Date(a.trashed_at).getTime() : 0;
          const tB = b.trashed_at ? new Date(b.trashed_at).getTime() : 0;
          return tB - tA;
        });
        resolve(userTrashed);
      };
    });
  },

  // 3. Upload photo (stores Blob directly inside IndexedDB)
  async uploadPhoto(
    userId: string,
    file: File,
    metadata: ExifData,
    onProgress?: (progress: number) => void
  ): Promise<Photo> {
    const db = await openDB();
    
    if (onProgress) onProgress(30);

    const photoId = "pho_" + Math.random().toString(36).substring(2, 15);
    
    const newPhoto: Photo = {
      id: photoId,
      user_id: userId,
      filename: file.name,
      storage_path: "", // Dynamically generated on load
      thumbnail_path: "",
      size: file.size,
      mime_type: file.type,
      width: metadata.width,
      height: metadata.height,
      is_favorite: false,
      is_trashed: false,
      exif_data: metadata,
      created_at: new Date().toISOString(),
      blob: file // Save the raw File/Blob object
    };

    if (onProgress) onProgress(70);

    return new Promise((resolve, reject) => {
      const transaction = db.transaction("photos", "readwrite");
      const store = transaction.objectStore("photos");
      const request = store.add(newPhoto);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        if (onProgress) onProgress(100);
        
        // Return object with initialized object URL
        const url = getObjectURL(photoId, file);
        resolve({
          ...newPhoto,
          storage_path: url,
          thumbnail_path: url
        });
      };
    });
  },

  // 4. Toggle Favorite
  async toggleFavorite(userId: string, photoId: string, isFavorite: boolean): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("photos", "readwrite");
      const store = transaction.objectStore("photos");
      const getRequest = store.get(photoId);

      getRequest.onerror = () => reject(getRequest.error);
      getRequest.onsuccess = () => {
        const photo = getRequest.result;
        if (!photo) return reject(new Error("Photo not found"));
        
        photo.is_favorite = isFavorite;
        
        const updateRequest = store.put(photo);
        updateRequest.onerror = () => reject(updateRequest.error);
        updateRequest.onsuccess = () => resolve();
      };
    });
  },

  // 5. Move to Trash (Soft delete)
  async moveToTrash(userId: string, photoId: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("photos", "readwrite");
      const store = transaction.objectStore("photos");
      const getRequest = store.get(photoId);

      getRequest.onerror = () => reject(getRequest.error);
      getRequest.onsuccess = () => {
        const photo = getRequest.result;
        if (!photo) return reject(new Error("Photo not found"));

        photo.is_trashed = true;
        photo.trashed_at = new Date().toISOString();

        const updateRequest = store.put(photo);
        updateRequest.onerror = () => reject(updateRequest.error);
        updateRequest.onsuccess = () => resolve();
      };
    });
  },

  // 6. Restore from Trash
  async restoreFromTrash(userId: string, photoId: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("photos", "readwrite");
      const store = transaction.objectStore("photos");
      const getRequest = store.get(photoId);

      getRequest.onerror = () => reject(getRequest.error);
      getRequest.onsuccess = () => {
        const photo = getRequest.result;
        if (!photo) return reject(new Error("Photo not found"));

        photo.is_trashed = false;
        photo.trashed_at = null;

        const updateRequest = store.put(photo);
        updateRequest.onerror = () => reject(updateRequest.error);
        updateRequest.onsuccess = () => resolve();
      };
    });
  },

  // 7. Delete Permanently (Hard delete)
  async deletePermanently(userId: string, photo: Photo): Promise<void> {
    const db = await openDB();
    
    // Revoke memory URL allocation
    revokeObjectURL(photo.id);

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["photos", "album_photos"], "readwrite");
      
      // 1. Delete from photos
      const photoStore = transaction.objectStore("photos");
      photoStore.delete(photo.id);

      // 2. Delete from album junctions
      const junctionStore = transaction.objectStore("album_photos");
      const request = junctionStore.getAll();
      
      request.onsuccess = () => {
        const allJunctions = request.result || [];
        allJunctions.forEach((j: any) => {
          if (j.photo_id === photo.id) {
            junctionStore.delete(j.id);
          }
        });
      };

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  },

  // 8. Fetch user Albums
  async getAlbums(userId: string): Promise<Album[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["albums", "album_photos"], "readonly");
      
      const albumsStore = transaction.objectStore("albums");
      const junctionStore = transaction.objectStore("album_photos");
      
      const albumsRequest = albumsStore.getAll();
      const junctionsRequest = junctionStore.getAll();

      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => {
        const allAlbums: Album[] = albumsRequest.result || [];
        const allJunctions = junctionsRequest.result || [];

        const userAlbums = allAlbums
          .filter(a => a.user_id === userId)
          .map(a => {
            const count = allJunctions.filter((j: any) => j.album_id === a.id).length;
            return {
              ...a,
              photoCount: count
            };
          });

        resolve(userAlbums);
      };
    });
  },

  // 9. Create Album
  async createAlbum(userId: string, name: string, description: string): Promise<Album> {
    const db = await openDB();
    const newAlbum: Album = {
      id: "alb_" + Math.random().toString(36).substring(2, 15),
      user_id: userId,
      name,
      description,
      cover_photo_id: null,
      created_at: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction("albums", "readwrite");
      const store = transaction.objectStore("albums");
      const request = store.add(newAlbum);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve({ ...newAlbum, photoCount: 0 });
    });
  },

  // 10. Fetch photos inside a specific Album
  async getAlbumPhotos(userId: string, albumId: string): Promise<Photo[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["photos", "album_photos"], "readonly");
      
      const photosStore = transaction.objectStore("photos");
      const junctionStore = transaction.objectStore("album_photos");
      
      const junctionsRequest = junctionStore.getAll();
      const photosRequest = photosStore.getAll();

      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => {
        const junctions = junctionsRequest.result || [];
        const photos: Photo[] = photosRequest.result || [];

        const photoIdsInAlbum = new Set(
          junctions.filter((j: any) => j.album_id === albumId).map((j: any) => j.photo_id)
        );

        const albumPhotos = photos
          .filter(p => p.user_id === userId && photoIdsInAlbum.has(p.id) && !p.is_trashed)
          .map(p => {
            const url = p.blob ? getObjectURL(p.id, p.blob) : "";
            return {
              ...p,
              storage_path: url,
              thumbnail_path: url
            };
          });

        // Sort desc
        albumPhotos.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        resolve(albumPhotos);
      };
    });
  },

  // 11. Add photos to Album
  async addPhotosToAlbum(userId: string, albumId: string, photoIds: string[]): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["albums", "album_photos"], "readwrite");
      
      const albumsStore = transaction.objectStore("albums");
      const junctionStore = transaction.objectStore("album_photos");

      // Add junction records
      photoIds.forEach(pid => {
        const jId = `${albumId}_${pid}`;
        junctionStore.put({ id: jId, album_id: albumId, photo_id: pid });
      });

      // Update cover photo if empty
      const albumRequest = albumsStore.get(albumId);
      albumRequest.onsuccess = () => {
        const album = albumRequest.result;
        if (album && !album.cover_photo_id && photoIds.length > 0) {
          album.cover_photo_id = photoIds[0];
          albumsStore.put(album);
        }
      };

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  },

  // 12. Remove photo from Album
  async removePhotoFromAlbum(userId: string, albumId: string, photoId: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["albums", "album_photos"], "readwrite");
      
      const albumsStore = transaction.objectStore("albums");
      const junctionStore = transaction.objectStore("album_photos");

      // Delete junction
      const jId = `${albumId}_${photoId}`;
      junctionStore.delete(jId);

      // Recalculate cover photo if deleted photo was the cover
      const albumRequest = albumsStore.get(albumId);
      albumRequest.onsuccess = () => {
        const album = albumRequest.result;
        if (album && album.cover_photo_id === photoId) {
          const junctionsRequest = junctionStore.getAll();
          junctionsRequest.onsuccess = () => {
            const list = junctionsRequest.result || [];
            const remaining = list.filter((j: any) => j.album_id === albumId);
            album.cover_photo_id = remaining.length > 0 ? remaining[0].photo_id : null;
            albumsStore.put(album);
          };
        }
      };

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  },

  // 13. Delete Album
  async deleteAlbum(userId: string, albumId: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["albums", "album_photos"], "readwrite");
      
      // Delete album
      const albumsStore = transaction.objectStore("albums");
      albumsStore.delete(albumId);

      // Delete junction entries
      const junctionStore = transaction.objectStore("album_photos");
      const request = junctionStore.getAll();
      request.onsuccess = () => {
        const list = request.result || [];
        list.forEach((j: any) => {
          if (j.album_id === albumId) {
            junctionStore.delete(j.id);
          }
        });
      };

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  },

  // 14. Fetch local storage stats (sum of all stored photo sizes)
  async getStorageStats(userId: string): Promise<{ used: number; limit: number }> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("photos", "readonly");
      const store = transaction.objectStore("photos");
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const photos: Photo[] = request.result || [];
        const userPhotos = photos.filter(p => p.user_id === userId);
        const totalSize = userPhotos.reduce((sum, p) => sum + p.size, 0);
        
        // 200 GB limit
        resolve({
          used: totalSize,
          limit: 200 * 1024 * 1024 * 1024
        });
      };
    });
  },

  // Developer utility to purge all IndexedDB tables for safety/reset
  async clearAllData(): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["photos", "albums", "album_photos"], "readwrite");
      transaction.objectStore("photos").clear();
      transaction.objectStore("albums").clear();
      transaction.objectStore("album_photos").clear();

      // Revoke all urls
      objectUrlCache.forEach((url) => URL.revokeObjectURL(url));
      objectUrlCache.clear();

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }
};
