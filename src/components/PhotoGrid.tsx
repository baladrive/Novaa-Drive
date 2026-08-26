"use client";
import React, { useState, useEffect, useRef } from "react";
import { Star, Check, Trash2, FolderPlus, Grid } from "lucide-react";
import { Photo } from "../services/photoService";

interface PhotoGridProps {
  photos: Photo[];
  onSelectPhoto: (photo: Photo) => void;
  onToggleFavorite: (photo: Photo) => void;
  onBulkTrash?: (photos: Photo[]) => void;
  onBulkAddToAlbum?: (photos: Photo[]) => void;
  selectedPhotos: Photo[];
  onSetSelectedPhotos: React.Dispatch<React.SetStateAction<Photo[]>>;
}

export default function PhotoGrid({
  photos,
  onSelectPhoto,
  onToggleFavorite,
  onBulkTrash,
  onBulkAddToAlbum,
  selectedPhotos,
  onSetSelectedPhotos
}: PhotoGridProps) {
  const [visibleCount, setVisibleCount] = useState(12);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Group photos by date
  const groupPhotosByDate = (photosList: Photo[]) => {
    const groups: { [key: string]: Photo[] } = {};
    
    photosList.forEach(photo => {
      const date = new Date(photo.created_at);
      const dateStr = date.toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric"
      });
      
      // Simplify today/yesterday
      const today = new Date().toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" });
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" });

      let groupTitle = dateStr;
      if (dateStr === today) groupTitle = "Today";
      else if (dateStr === yesterdayStr) groupTitle = "Yesterday";

      if (!groups[groupTitle]) {
        groups[groupTitle] = [];
      }
      groups[groupTitle].push(photo);
    });

    return Object.entries(groups).sort((a, b) => {
      // Sort date groups descending
      const dateA = new Date(a[1][0].created_at).getTime();
      const dateB = new Date(b[1][0].created_at).getTime();
      return dateB - dateA;
    });
  };

  // Infinite Scroll IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < photos.length) {
          setVisibleCount(prev => Math.min(photos.length, prev + 8));
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [visibleCount, photos.length]);

  const visiblePhotos = photos.slice(0, visibleCount);
  const groupedPhotos = groupPhotosByDate(visiblePhotos);

  // Selection logic
  const isSelected = (photo: Photo) => selectedPhotos.some(p => p.id === photo.id);

  const toggleSelect = (photo: Photo, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSelected(photo)) {
      onSetSelectedPhotos(prev => prev.filter(p => p.id !== photo.id));
    } else {
      onSetSelectedPhotos(prev => [...prev, photo]);
    }
  };

  const selectAllInGroup = (groupPhotosList: Photo[]) => {
    const allSelected = groupPhotosList.every(p => isSelected(p));
    if (allSelected) {
      // Remove group from selection
      onSetSelectedPhotos(prev => prev.filter(p => !groupPhotosList.some(gp => gp.id === p.id)));
    } else {
      // Add missing photos in group to selection
      onSetSelectedPhotos(prev => {
        const missing = groupPhotosList.filter(p => !prev.some(sp => sp.id === p.id));
        return [...prev, ...missing];
      });
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Selection Action Toolbar */}
      {selectedPhotos.length > 0 && (
        <div className="fixed top-18 left-1/2 z-40 flex -translate-x-1/2 items-center gap-4 rounded-2xl bg-zinc-900 px-6 py-3 text-white shadow-2xl dark:bg-zinc-800 border border-zinc-700/30">
          <span className="text-xs font-bold">{selectedPhotos.length} selected</span>
          <div className="h-4 w-[1px] bg-zinc-700" />
          <div className="flex gap-2">
            {onBulkAddToAlbum && (
              <button
                onClick={() => onBulkAddToAlbum(selectedPhotos)}
                className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold hover:bg-zinc-800 dark:hover:bg-zinc-700 text-amber-500"
              >
                <FolderPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Add to Album</span>
              </button>
            )}
            {onBulkTrash && (
              <button
                onClick={() => {
                  if (confirm(`Move ${selectedPhotos.length} photos to Trash?`)) {
                    onBulkTrash(selectedPhotos);
                  }
                }}
                className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold hover:bg-zinc-850 dark:hover:bg-zinc-700 text-red-500"
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">Move to Trash</span>
              </button>
            )}
            <button
              onClick={() => onSetSelectedPhotos([])}
              className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-bold hover:bg-zinc-800 hover:text-white"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Grid Layouts */}
      {groupedPhotos.map(([dateTitle, datePhotos]) => (
        <div key={dateTitle} className="space-y-3">
          
          {/* Date Headers */}
          <div className="flex items-center justify-between border-b border-zinc-100 pb-2 dark:border-zinc-900">
            <h3 className="text-sm font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
              <Grid className="h-4 w-4 text-zinc-400" />
              {dateTitle}
            </h3>
            <button
              onClick={() => selectAllInGroup(datePhotos)}
              className="text-xs font-bold text-amber-600 hover:text-amber-700 dark:text-amber-500"
            >
              {datePhotos.every(p => isSelected(p)) ? "Deselect All" : "Select All"}
            </button>
          </div>

          {/* Masonry / Auto Grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {datePhotos.map((photo) => {
              const selected = isSelected(photo);
              return (
                <div
                  key={photo.id}
                  onClick={() => onSelectPhoto(photo)}
                  className={`group relative aspect-square overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-900 cursor-zoom-in transition-all duration-200 border-2
                    ${selected 
                      ? "border-amber-500 scale-95 shadow-md shadow-amber-500/10" 
                      : "border-transparent hover:-translate-y-1 hover:shadow-lg"}`}
                >
                  {/* Photo Thumbnail */}
                  <img
                    src={photo.thumbnail_path || photo.storage_path}
                    alt={photo.filename}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />

                  {/* Overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/30 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

                  {/* Selection Checkbox */}
                  <button
                    onClick={(e) => toggleSelect(photo, e)}
                    className={`absolute top-2.5 left-2.5 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-white/60 transition-all duration-200
                      ${selected 
                        ? "bg-amber-500 border-amber-500 scale-100 text-white" 
                        : "bg-black/35 opacity-0 group-hover:opacity-100 text-white hover:scale-110"}`}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>

                  {/* Favorite Toggle Star */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(photo);
                    }}
                    className={`absolute top-2.5 right-2.5 z-10 flex h-6 w-6 items-center justify-center rounded-full transition-all duration-200
                      ${photo.is_favorite 
                        ? "bg-amber-500 text-white scale-100" 
                        : "bg-black/35 opacity-0 group-hover:opacity-100 text-zinc-300 hover:scale-110"}`}
                  >
                    <Star className={`h-3.5 w-3.5 ${photo.is_favorite ? "fill-white" : ""}`} />
                  </button>

                  {/* Metadata display on hover */}
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <p className="truncate text-[10px] font-bold text-white shadow-xs">
                      {photo.filename}
                    </p>
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      ))}

      {/* Load More Trigger */}
      {visibleCount < photos.length && (
        <div ref={loadMoreRef} className="flex justify-center py-6">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
        </div>
      )}

    </div>
  );
}
