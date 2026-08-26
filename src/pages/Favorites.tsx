"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Heart } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Photo, photoService } from "../services/photoService";
import PhotoGrid from "../components/PhotoGrid";
import PhotoViewer from "../components/PhotoViewer";

export default function Favorites() {
  const { user } = useAuth();
  const [favoritePhotos, setFavoritePhotos] = useState<Photo[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [bulkSelection, setBulkSelection] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = useCallback(async () => {
    if (!user) return;
    try {
      const data = await photoService.getPhotos(user.id);
      const filtered = data.filter(p => p.is_favorite);
      setFavoritePhotos(filtered);
    } catch (err) {
      console.error("Error fetching favorites:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFavorites();
  }, [user, fetchFavorites]);

  const handleToggleFavorite = async (photo: Photo) => {
    if (!user) return;
    try {
      await photoService.toggleFavorite(user.id, photo.id, false); // Toggle off
      setFavoritePhotos(prev => prev.filter(p => p.id !== photo.id));
      if (selectedPhoto?.id === photo.id) {
        setSelectedPhoto(null);
      }
    } catch (err) {
      console.error("Failed to unfavorite:", err);
    }
  };

  const handleTrashPhoto = async (photo: Photo) => {
    if (!user) return;
    try {
      await photoService.moveToTrash(user.id, photo.id);
      setFavoritePhotos(prev => prev.filter(p => p.id !== photo.id));
    } catch (err) {
      console.error("Failed to trash photo:", err);
    }
  };

  const handleBulkTrash = async (photosToTrash: Photo[]) => {
    if (!user) return;
    try {
      for (const p of photosToTrash) {
        await photoService.moveToTrash(user.id, p.id);
      }
      setFavoritePhotos(prev => prev.filter(p => !photosToTrash.some(pt => pt.id === p.id)));
      setBulkSelection([]);
    } catch (err) {
      console.error("Bulk trash failed:", err);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white sm:text-3xl">Favorites</h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Your starred, favorite highlights</p>
      </div>

      {/* Photos Grid */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
        </div>
      ) : favoritePhotos.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-zinc-100 bg-white py-24 px-4 text-center shadow-sm dark:border-zinc-900 dark:bg-zinc-900/40">
          <div className="rounded-full bg-zinc-50 p-4 dark:bg-zinc-800">
            <Heart className="h-10 w-10 text-zinc-350 dark:text-zinc-550" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-zinc-900 dark:text-white">No favorites yet</h3>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 max-w-xs">
            Star your best photos in the gallery to collect them together in this Favorites view.
          </p>
        </div>
      ) : (
        <PhotoGrid
          photos={favoritePhotos}
          selectedPhotos={bulkSelection}
          onSetSelectedPhotos={setBulkSelection}
          onSelectPhoto={setSelectedPhoto}
          onToggleFavorite={handleToggleFavorite}
          onBulkTrash={handleBulkTrash}
        />
      )}

      {/* Lightbox details modal */}
      {selectedPhoto && (
        <PhotoViewer
          photo={selectedPhoto}
          allPhotos={favoritePhotos}
          onClose={() => setSelectedPhoto(null)}
          onNavigate={setSelectedPhoto}
          onToggleFavorite={handleToggleFavorite}
          onTrash={handleTrashPhoto}
        />
      )}

    </div>
  );
}
