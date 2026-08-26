"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Image, Film, Star, Trash2, Play } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { fileService, FileItem } from "../services/fileService";
import MediaViewer from "../components/MediaViewer";
import { getFileIconSrc, getThumbnail } from "../utils/thumbnailGenerator";

export default function Photos() {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<FileItem[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<FileItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});

  const fetchPhotos = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch all user files flat and filter category
      const allFiles = await fileService.getFiles(user.id, null);
      const media = allFiles.filter(f => f.file_category === "photo" || f.file_category === "video");
      setPhotos(media);
      
      // Use stored thumbnail_path from IndexedDB, or generate if missing
      const thumbMap: Record<string, string> = {};
      for (const item of media) {
        if (item.thumbnail_path) {
          // Use the stored thumbnail from IndexedDB
          thumbMap[item.id] = item.thumbnail_path;
        } else {
          // Fallback: try to generate thumbnail
          try {
            const thumb = await getThumbnail(
              item.id,
              item.file_category,
              item.mime_type,
              item.filename,
              item.storage_path
            );
            thumbMap[item.id] = thumb;
          } catch {
            thumbMap[item.id] = getFileIconSrc(item.filename, item.mime_type);
          }
        }
      }
      setThumbnails(thumbMap);
    } catch (err) {
      console.error("Error loading media gallery:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPhotos();
  }, [user, fetchPhotos]);

  const handleToggleFavorite = async (file: FileItem) => {
    if (!user) return;
    try {
      await fileService.toggleStar(user.id, file.id, !file.is_starred);
      fetchPhotos();
    } catch (err) {
      console.error(err);
    }
  };

  const handleTrashPhoto = async (file: FileItem) => {
    if (!user) return;
    try {
      await fileService.trashFile(user.id, file.id, true);
      setPhotos(prev => prev.filter(f => f.id !== file.id));
      setSelectedPhoto(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleImgError = (fileId: string, e: React.SyntheticEvent<HTMLImageElement>) => {
    const file = photos.find(f => f.id === fileId);
    if (file) {
      (e.target as HTMLImageElement).src = getFileIconSrc(file.filename, file.mime_type);
    }
  };

  // Group items by upload date
  const groupPhotosByDate = (list: FileItem[]) => {
    const groups: Record<string, FileItem[]> = {};
    list.forEach(item => {
      const dateStr = new Date(item.created_at).toLocaleDateString([], {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      if (!groups[dateStr]) groups[dateStr] = [];
      groups[dateStr].push(item);
    });
    return Object.entries(groups);
  };

  const grouped = groupPhotosByDate(photos);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 space-y-6">
      
      {/* Title */}
      <div className="border-b border-zinc-150/50 pb-4 dark:border-zinc-900/40">
        <h1 className="text-xl font-black text-zinc-900 dark:text-white">Media Gallery</h1>
        <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-1">
          A chronologically grouped view of your uploaded photos and videos.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-2xl skeleton" />
          ))}
        </div>
      ) : photos.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-20 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl">
          <Image className="h-12 w-12 text-zinc-350 dark:text-zinc-550" />
          <h3 className="mt-4 text-sm font-extrabold text-zinc-850 dark:text-white">No media files found</h3>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 max-w-xs leading-relaxed">
            Upload images (JPG, PNG, WebP) or videos (MP4, MOV) in My Files to display them in this grid.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(([date, items]) => (
            <div key={date} className="space-y-4">
              {/* Date Header */}
              <h3 className="text-xs font-black text-zinc-450 uppercase tracking-wider sticky top-16 bg-zinc-50/80 dark:bg-zinc-950/80 py-2 backdrop-blur z-10">
                {date}
              </h3>
              
              {/* Grid */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {items.map((item) => {
                  const thumbSrc = thumbnails[item.id] || getFileIconSrc(item.filename, item.mime_type);
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedPhoto(item)}
                      className="group relative aspect-square overflow-hidden rounded-2xl border border-zinc-150/70 bg-zinc-100 dark:border-zinc-900/50 dark:bg-zinc-900/40 transition-all cursor-pointer hover:scale-[1.02] shadow-sm hover:shadow-lg"
                    >
                      {/* Media Thumbnail */}
                      {item.file_category === "photo" ? (
                        <img
                          src={thumbSrc}
                          alt={item.filename}
                          className="h-full w-full object-cover rounded-2xl"
                          loading="lazy"
                          onError={(e) => handleImgError(item.id, e)}
                        />
                      ) : (
                        <div className="relative h-full w-full">
                          <img
                            src={thumbSrc}
                            alt={item.filename}
                            className="h-full w-full object-cover rounded-2xl"
                            loading="lazy"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = getFileIconSrc(item.filename, item.mime_type);
                            }}
                          />
                          {/* Play button overlay */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm">
                              <Play className="ml-0.5 h-5 w-5 text-white fill-white" />
                            </div>
                          </div>
                          <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-bold text-white uppercase backdrop-blur-sm">
                            Video
                          </span>
                        </div>
                      )}

                      {/* Overlay Actions */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-between">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleFavorite(item);
                            }}
                            className={`rounded-full p-1.5 bg-black/40 hover:bg-black/60 transition-colors ${item.is_starred ? "text-amber-400" : "text-white"}`}
                          >
                            <Star className="h-3.5 w-3.5 fill-current" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTrashPhoto(item);
                            }}
                            className="rounded-full p-1.5 bg-black/40 hover:bg-black/60 hover:text-red-400 text-white transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        
                        <p className="truncate text-[10px] font-bold text-white">{item.filename}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Media Lightbox */}
      {selectedPhoto && (
        <MediaViewer
          file={selectedPhoto}
          allFiles={photos}
          onClose={() => setSelectedPhoto(null)}
          onToggleStar={handleToggleFavorite}
          onTrash={handleTrashPhoto}
          onNavigate={(file) => setSelectedPhoto(file)}
        />
      )}

    </div>
  );
}
