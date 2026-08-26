"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, FolderMinus } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Album, Photo, photoService } from "../services/photoService";
import PhotoGrid from "../components/PhotoGrid";
import PhotoViewer from "../components/PhotoViewer";

export default function AlbumDetail() {
  const { albumId } = useParams<{ albumId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [album, setAlbum] = useState<Album | null>(null);
  const [albumPhotos, setAlbumPhotos] = useState<Photo[]>([]);
  const [allUserPhotos, setAllUserPhotos] = useState<Photo[]>([]);
  
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [isAddPhotosOpen, setIsAddPhotosOpen] = useState(false);
  const [addSelection, setAddSelection] = useState<string[]>([]);
  const [bulkSelection, setBulkSelection] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlbumData = useCallback(async () => {
    if (!user || !albumId) return;
    try {
      const albumsList = await photoService.getAlbums(user.id);
      const matched = albumsList.find(a => a.id === albumId);
      if (!matched) {
        navigate("/albums");
        return;
      }
      setAlbum(matched);

      const photosInAlbum = await photoService.getAlbumPhotos(user.id, albumId);
      setAlbumPhotos(photosInAlbum);

      const allPhotos = await photoService.getPhotos(user.id);
      setAllUserPhotos(allPhotos);
    } catch (err) {
      console.error("Error fetching album contents:", err);
    } finally {
      setLoading(false);
    }
  }, [user, albumId, navigate]);

  useEffect(() => {
    fetchAlbumData();
  }, [user, albumId, fetchAlbumData]);

  // Bulk remove
  const handleBulkRemove = async (photosToRemove: Photo[]) => {
    if (!user || !albumId) return;
    try {
      for (const p of photosToRemove) {
        await photoService.removePhotoFromAlbum(user.id, albumId, p.id);
      }
      setBulkSelection([]);
      fetchAlbumData();
    } catch (err) {
      console.error("Bulk remove failed:", err);
    }
  };

  // Add Photos modal handler
  const handleAddSelectedPhotos = async () => {
    if (!user || !albumId || addSelection.length === 0) return;
    try {
      await photoService.addPhotosToAlbum(user.id, albumId, addSelection);
      setAddSelection([]);
      setIsAddPhotosOpen(false);
      fetchAlbumData();
    } catch (err) {
      console.error("Failed to add photos to album:", err);
    }
  };

  // Toggle favorite inside album
  const handleToggleFavorite = async (photo: Photo) => {
    if (!user) return;
    try {
      const newFavState = !photo.is_favorite;
      await photoService.toggleFavorite(user.id, photo.id, newFavState);
      fetchAlbumData();
      if (selectedPhoto?.id === photo.id) {
        setSelectedPhoto(prev => prev ? { ...prev, is_favorite: newFavState } : null);
      }
    } catch (err) {
      console.error("Failed to favorite:", err);
    }
  };

  // Trash inside album
  const handleTrashPhoto = async (photo: Photo) => {
    if (!user) return;
    try {
      await photoService.moveToTrash(user.id, photo.id);
      fetchAlbumData();
    } catch (err) {
      console.error("Failed to trash photo:", err);
    }
  };

  // Find photos NOT already in this album to list in the selector modal
  const eligiblePhotos = allUserPhotos.filter(
    up => !albumPhotos.some(ap => ap.id === up.id)
  );

  const toggleSelectForAdd = (photoId: string) => {
    if (addSelection.includes(photoId)) {
      setAddSelection(prev => prev.filter(id => id !== photoId));
    } else {
      setAddSelection(prev => [...prev, photoId]);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  if (!album) return null;

  return (
    <div className="space-y-6">
      
      {/* Back button & Album info */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/albums"
            className="rounded-full border border-zinc-150 p-2 text-zinc-650 hover:bg-zinc-100 dark:border-zinc-850 dark:text-zinc-350 dark:hover:bg-zinc-900"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white sm:text-3xl">{album.name}</h1>
            {album.description && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{album.description}</p>
            )}
            <p className="text-[11px] font-bold text-amber-500 uppercase tracking-wider mt-1">
              {albumPhotos.length} item{albumPhotos.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAddPhotosOpen(true)}
          className="flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-amber-500/10 transition-all active:scale-[0.98]"
        >
          <Plus className="h-4.5 w-4.5" />
          Add Photos
        </button>
      </div>

      {/* Grid photos stream */}
      {albumPhotos.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-zinc-100 bg-white py-24 px-4 text-center shadow-sm dark:border-zinc-900 dark:bg-zinc-900/40">
          <div className="rounded-full bg-zinc-50 p-4 dark:bg-zinc-800">
            <FolderMinus className="h-10 w-10 text-zinc-350 dark:text-zinc-550" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-zinc-900 dark:text-white">This album is empty</h3>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 max-w-xs">
            Start adding existing photos to organize this album card. Click Add Photos to select.
          </p>
        </div>
      ) : (
        <PhotoGrid
          photos={albumPhotos}
          selectedPhotos={bulkSelection}
          onSetSelectedPhotos={setBulkSelection}
          onSelectPhoto={setSelectedPhoto}
          onToggleFavorite={handleToggleFavorite}
          onBulkTrash={handleBulkRemove} // Re-bind bulk deletion as "Remove from Album"
        />
      )}

      {/* Selector modal to add existing photos */}
      {isAddPhotosOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto px-4 py-6">
          <div className="fixed inset-0 bg-zinc-950/60 backdrop-blur-sm" onClick={() => setIsAddPhotosOpen(false)} />
          <div className="relative w-full max-w-2xl transform rounded-3xl bg-white p-6 shadow-2xl transition-all dark:bg-zinc-900 md:p-8">
            <div className="flex items-start justify-between border-b border-zinc-105 pb-4 dark:border-zinc-800">
              <div>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Add Existing Photos</h2>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-455">
                  Select items from your stream to append to "{album.name}".
                </p>
              </div>
              <button 
                onClick={() => setIsAddPhotosOpen(false)}
                className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <Plus className="h-5 w-5 rotate-45" />
              </button>
            </div>

            {/* Photos selection grid */}
            <div className="mt-4 grid max-h-96 grid-cols-3 gap-2 overflow-y-auto p-1 sm:grid-cols-4 md:grid-cols-5">
              {eligiblePhotos.length === 0 ? (
                <div className="col-span-full py-16 text-center text-xs text-zinc-400">
                  All photos in your library are already in this album.
                </div>
              ) : (
                eligiblePhotos.map(photo => {
                  const selected = addSelection.includes(photo.id);
                  return (
                    <div
                      key={photo.id}
                      onClick={() => toggleSelectForAdd(photo.id)}
                      className={`relative aspect-square overflow-hidden rounded-xl bg-zinc-50 border-2 cursor-pointer transition-all
                        ${selected ? "border-amber-500 scale-95" : "border-transparent hover:scale-102"}`}
                    >
                      <img
                        src={photo.thumbnail_path || photo.storage_path}
                        alt={photo.filename}
                        className="h-full w-full object-cover"
                      />
                      {selected && (
                        <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                          <div className="rounded-full bg-amber-500 p-1 text-white scale-110">
                            <Plus className="h-4 w-4" />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal actions */}
            <div className="mt-6 flex justify-end gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
              <button
                onClick={() => setIsAddPhotosOpen(false)}
                className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-650 hover:bg-zinc-50 dark:border-zinc-850 dark:text-zinc-300"
              >
                Cancel
              </button>
              <button
                disabled={addSelection.length === 0}
                onClick={handleAddSelectedPhotos}
                className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-amber-600 disabled:opacity-50"
              >
                Add {addSelection.length > 0 ? `(${addSelection.length})` : ""}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Lightbox details modal */}
      {selectedPhoto && (
        <PhotoViewer
          photo={selectedPhoto}
          allPhotos={albumPhotos}
          onClose={() => setSelectedPhoto(null)}
          onNavigate={setSelectedPhoto}
          onToggleFavorite={handleToggleFavorite}
          onTrash={handleTrashPhoto}
        />
      )}

    </div>
  );
}
