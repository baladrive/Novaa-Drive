"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Upload, Image as ImageIcon, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Photo, photoService } from "../services/photoService";
import { extractImageMetadata } from "../services/exifReader";
import PhotoGrid from "../components/PhotoGrid";
import PhotoViewer from "../components/PhotoViewer";
import AddToAlbumModal from "../components/AddToAlbumModal";
import { UploadTask } from "../components/UploadZone";
import { sanitizeLog } from "../utils/sanitize";

interface GalleryProps {
  searchQuery: string;
  onRefreshStorage: () => void;
  externalFilesToUpload: FileList | null;
  onClearExternalFiles: () => void;
  onAddUploadTask: (task: UploadTask) => void;
  onUpdateUploadTask: (taskId: string, updates: Partial<UploadTask>) => void;
}

export default function Gallery({
  searchQuery,
  onRefreshStorage,
  externalFilesToUpload,
  onClearExternalFiles,
  onAddUploadTask,
  onUpdateUploadTask
}: GalleryProps) {
  const { user, isAiMode } = useAuth();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [bulkSelection, setBulkSelection] = useState<Photo[]>([]);
  const [isAddToAlbumOpen, setIsAddToAlbumOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedAiTag, setSelectedAiTag] = useState<string | null>(null);

  const getPhotoAiTags = (filename: string): string[] => {
    const tags: string[] = ["Photo"];
    const name = filename.toLowerCase();
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
    }
    return tags;
  };

  // Fetch photos
  const fetchPhotosList = useCallback(async () => {
    if (!user) return;
    try {
      const data = await photoService.getPhotos(user.id);
      setPhotos(data);
    } catch (err) {
      console.error("Error fetching photos:", sanitizeLog(err));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPhotosList();
  }, [user, fetchPhotosList]);

  // Handle upload logic
  const handleUploadFiles = useCallback(async (fileList: FileList) => {
    if (!user) return;
    
    // Process files sequentially or in parallel
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const taskId = `task-${Date.now()}-${i}`;
      
      // Initialize task
      const newTask: UploadTask = {
        id: taskId,
        name: file.name,
        size: file.size,
        progress: 0,
        status: "compressing"
      };
      
      onAddUploadTask(newTask);

      try {
        // Step 1: Simulate/Perform compression and parse EXIF
        const metadata = await extractImageMetadata(file);
        
        onUpdateUploadTask(taskId, { progress: 30, status: "uploading" });

        // Step 2: Upload to Storage and DB
        await photoService.uploadPhoto(user.id, file, metadata, (pct) => {
          onUpdateUploadTask(taskId, { progress: Math.min(100, 30 + Math.round(pct * 0.7)) });
        });

        // Step 3: Complete task
        onUpdateUploadTask(taskId, { status: "completed", progress: 100 });
        
        // Refresh items and storage stats
        fetchPhotosList();
        onRefreshStorage();
      } catch (err: any) {
        console.error("Upload failed for file:", sanitizeLog(file.name), sanitizeLog(err));
        onUpdateUploadTask(taskId, { status: "failed", error: err.message || "Failed to upload" });
      }
    }
  }, [user, onAddUploadTask, onUpdateUploadTask, fetchPhotosList, onRefreshStorage]);

  // Watch for drag-and-drop triggers from the parent Layout
  useEffect(() => {
    if (externalFilesToUpload) {
      handleUploadFiles(externalFilesToUpload);
      onClearExternalFiles(); // Clear event queue
    }
  }, [externalFilesToUpload, handleUploadFiles, onClearExternalFiles]);

  // File Input picker
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUploadFiles(e.target.files);
    }
  };

  // Favoriting
  const handleToggleFavorite = async (photo: Photo) => {
    if (!user) return;
    try {
      const newFavState = !photo.is_favorite;
      await photoService.toggleFavorite(user.id, photo.id, newFavState);
      
      // Update local state
      setPhotos(prev => prev.map(p => p.id === photo.id ? { ...p, is_favorite: newFavState } : p));
      if (selectedPhoto?.id === photo.id) {
        setSelectedPhoto(prev => prev ? { ...prev, is_favorite: newFavState } : null);
      }
    } catch (err) {
      console.error("Failed to toggle favorite:", sanitizeLog(err));
    }
  };

  // Trashing
  const handleTrashPhoto = async (photo: Photo) => {
    if (!user) return;
    try {
      await photoService.moveToTrash(user.id, photo.id);
      
      // Update local state
      setPhotos(prev => prev.filter(p => p.id !== photo.id));
      setBulkSelection(prev => prev.filter(p => p.id !== photo.id));
      onRefreshStorage();
    } catch (err) {
      console.error("Failed to trash photo:", sanitizeLog(err));
    }
  };

  // Bulk Actions
  const handleBulkTrash = async (photosToTrash: Photo[]) => {
    if (!user) return;
    try {
      for (const p of photosToTrash) {
        await photoService.moveToTrash(user.id, p.id);
      }
      setPhotos(prev => prev.filter(p => !photosToTrash.some(pt => pt.id === p.id)));
      setBulkSelection([]);
      onRefreshStorage();
    } catch (err) {
      console.error("Bulk trash failed:", sanitizeLog(err));
    }
  };



  // Filter Photos by search query and selected AI tag
  const filteredPhotos = photos.filter(p => {
    const matchesSearch = p.filename.toLowerCase().includes(searchQuery.toLowerCase());
    if (isAiMode && selectedAiTag) {
      const tags = getPhotoAiTags(p.filename);
      return matchesSearch && tags.includes(selectedAiTag);
    }
    return matchesSearch;
  });

  // Calculate unique tags for display
  const allPhotoTags = Array.from(
    new Set(photos.flatMap(p => getPhotoAiTags(p.filename)))
  ).filter(t => t !== "Photo");

  return (
    <div className="space-y-6">
      
      {/* Upper toolbar controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white sm:text-3xl">Photos</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Your secure memory stream</p>
        </div>

        {/* Upload Trigger */}
        <label className="flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-amber-500/10 cursor-pointer w-fit transition-all active:scale-[0.98]">
          <Upload className="h-4.5 w-4.5" />
          Upload Photos
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      </div>

      {/* AI Suggested Tags Bar */}
      {isAiMode && allPhotoTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-amber-500/5 p-3.5 border border-amber-500/10 dark:bg-amber-500/10/20 text-xs">
          <span className="font-mono text-[10px] font-black uppercase text-amber-600 dark:text-amber-500 flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            AI Visual Tags:
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
          {allPhotoTags.map(tag => (
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
      )}

      {/* Main photo roll grid */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
        </div>
      ) : filteredPhotos.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-zinc-100 bg-white py-24 px-4 text-center shadow-sm dark:border-zinc-900 dark:bg-zinc-900/40">
          <div className="rounded-full bg-zinc-50 p-4 dark:bg-zinc-800">
            <ImageIcon className="h-10 w-10 text-zinc-350 dark:text-zinc-500" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-zinc-900 dark:text-white">No photos in your stream</h3>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 max-w-xs">
            {searchQuery 
              ? `We couldn't find any photos matching "${searchQuery}"` 
              : "Drag and drop photos anywhere on this page, or click the Upload button to back up images."}
          </p>
        </div>
      ) : (
        <PhotoGrid
          photos={filteredPhotos}
          selectedPhotos={bulkSelection}
          onSetSelectedPhotos={setBulkSelection}
          onSelectPhoto={setSelectedPhoto}
          onToggleFavorite={handleToggleFavorite}
          onBulkTrash={handleBulkTrash}
          onBulkAddToAlbum={() => setIsAddToAlbumOpen(true)}
        />
      )}

      {/* Lightbox details modal */}
      {selectedPhoto && (
        <PhotoViewer
          photo={selectedPhoto}
          allPhotos={filteredPhotos}
          onClose={() => setSelectedPhoto(null)}
          onNavigate={setSelectedPhoto}
          onToggleFavorite={handleToggleFavorite}
          onTrash={handleTrashPhoto}
        />
      )}

      {/* Add To Album Modal */}
      {isAddToAlbumOpen && (
        <AddToAlbumModal
          photoIds={bulkSelection.map(p => p.id)}
          onClose={() => setIsAddToAlbumOpen(false)}
          onSuccess={() => {
            setIsAddToAlbumOpen(false);
            setBulkSelection([]);
            fetchPhotosList();
          }}
        />
      )}

    </div>
  );
}
