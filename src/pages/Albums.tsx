"use client";
import React, { useState, useEffect, useCallback } from "react";
import { FolderPlus, FolderOpen } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Album, Photo, photoService } from "../services/photoService";
import AlbumCard from "../components/AlbumCard";

export default function Albums() {
  const { user } = useAuth();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState("");
  const [newAlbumDesc, setNewAlbumDesc] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchAlbumsData = useCallback(async () => {
    if (!user) return;
    try {
      const albumData = await photoService.getAlbums(user.id);
      const photoData = await photoService.getPhotos(user.id);
      setAlbums(albumData);
      setPhotos(photoData);
    } catch (err) {
      console.error("Error fetching albums data:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAlbumsData();
  }, [user, fetchAlbumsData]);

  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newAlbumName.trim()) return;

    try {
      await photoService.createAlbum(user.id, newAlbumName.trim(), newAlbumDesc.trim());
      setNewAlbumName("");
      setNewAlbumDesc("");
      setIsCreateOpen(false);
      fetchAlbumsData();
    } catch (err) {
      console.error("Failed to create album:", err);
      alert("Failed to create album");
    }
  };

  const handleDeleteAlbum = async (albumId: string) => {
    if (!user) return;
    try {
      await photoService.deleteAlbum(user.id, albumId);
      fetchAlbumsData();
    } catch (err) {
      console.error("Failed to delete album:", err);
      alert("Failed to delete album");
    }
  };

  // Resolve cover photo URL for each album
  const getAlbumCoverUrl = (album: Album) => {
    if (!album.cover_photo_id) return undefined;
    const cover = photos.find(p => p.id === album.cover_photo_id);
    return cover?.thumbnail_path || cover?.storage_path;
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white sm:text-3xl">Albums</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Organize your stream into visual folders</p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-amber-500/10 transition-all active:scale-[0.98]"
        >
          <FolderPlus className="h-4.5 w-4.5" />
          Create Album
        </button>
      </div>

      {/* Album Creation Dialog */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto px-4 py-6">
          <div className="fixed inset-0 bg-zinc-950/60 backdrop-blur-sm" onClick={() => setIsCreateOpen(false)} />
          <div className="relative w-full max-w-md transform rounded-3xl bg-white p-6 shadow-2xl transition-all dark:bg-zinc-900 md:p-8">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Create New Album</h2>
            <form onSubmit={handleCreateAlbum} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                  Album Name *
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Summer Trip 2026" 
                  value={newAlbumName}
                  onChange={(e) => setNewAlbumName(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs text-zinc-800 focus:border-amber-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                  Description
                </label>
                <textarea 
                  placeholder="Describe your album..." 
                  value={newAlbumDesc}
                  onChange={(e) => setNewAlbumDesc(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs text-zinc-800 focus:border-amber-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-650 hover:bg-zinc-50 dark:border-zinc-850 dark:text-zinc-300 dark:hover:bg-zinc-805"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-amber-600"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grid List */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
        </div>
      ) : albums.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-zinc-100 bg-white py-24 px-4 text-center shadow-sm dark:border-zinc-900 dark:bg-zinc-900/40">
          <div className="rounded-full bg-zinc-50 p-4 dark:bg-zinc-800">
            <FolderOpen className="h-10 w-10 text-zinc-350 dark:text-zinc-550" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-zinc-900 dark:text-white">No albums yet</h3>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 max-w-xs">
            Organize your memories by grouping related photos together. Click Create Album to start.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {albums.map((album) => (
            <AlbumCard
              key={album.id}
              album={album}
              coverUrl={getAlbumCoverUrl(album)}
              onDelete={handleDeleteAlbum}
            />
          ))}
        </div>
      )}

    </div>
  );
}
