"use client";
import React, { useState, useEffect } from "react";
import { X, FolderPlus, Folder } from "lucide-react";
import { Album, photoService } from "../services/photoService";
import { useAuth } from "../context/AuthContext";
import { sanitizeLog } from "../utils/sanitize";

interface AddToAlbumModalProps {
  photoIds: string[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddToAlbumModal({ photoIds, onClose, onSuccess }: AddToAlbumModalProps) {
  const { user } = useAuth();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [newAlbumName, setNewAlbumName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      photoService.getAlbums(user.id)
        .then(data => setAlbums(data))
        .catch(err => console.error("Error fetching albums:", sanitizeLog(err)));
    }
  }, [user]);

  const handleAddToAlbum = async (albumId: string) => {
    if (!user) return;
    setLoading(true);
    try {
      await photoService.addPhotosToAlbum(user.id, albumId, photoIds);
      onSuccess();
    } catch (err) {
      console.error("Failed to add to album:", sanitizeLog(err));
      alert("Failed to add to album");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAndAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newAlbumName.trim()) return;
    setLoading(true);
    try {
      const album = await photoService.createAlbum(user.id, newAlbumName.trim(), "");
      await photoService.addPhotosToAlbum(user.id, album.id, photoIds);
      onSuccess();
    } catch (err) {
      console.error("Failed to create and add to album:", sanitizeLog(err));
      alert("Failed to create and add to album");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto px-4 py-6">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-zinc-950/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-md transform rounded-3xl bg-white p-6 shadow-2xl transition-all dark:bg-zinc-900 md:p-8">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Add to Album</h2>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Select an album or create a new one for {photoIds.length} photo{photoIds.length > 1 ? "s" : ""}.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="rounded-full p-2 text-zinc-400 hover:bg-zinc-150 hover:text-zinc-650 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Existing Albums List */}
        <div className="mt-4 max-h-48 overflow-y-auto space-y-2 pr-1">
          {albums.length === 0 ? (
            <p className="text-center py-6 text-xs text-zinc-450">No albums created yet.</p>
          ) : (
            albums.map((album) => (
              <button
                key={album.id}
                disabled={loading}
                onClick={() => handleAddToAlbum(album.id)}
                className="flex w-full items-center gap-3 rounded-xl border border-zinc-100 p-3 text-left text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-850 dark:text-zinc-300 dark:hover:bg-zinc-950"
              >
                <Folder className="h-4.5 w-4.5 text-zinc-400" />
                <span className="flex-1 truncate">{album.name}</span>
                <span className="text-[10px] text-zinc-400">({album.photoCount} items)</span>
              </button>
            ))
          )}
        </div>

        {/* Create and Add Form */}
        <form onSubmit={handleCreateAndAdd} className="mt-6 border-t border-zinc-100 pt-5 dark:border-zinc-800">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
            Create new album & add
          </label>
          <div className="flex gap-2">
            <input 
              type="text" 
              required
              placeholder="e.g. Summer Vacation 2026" 
              value={newAlbumName}
              onChange={(e) => setNewAlbumName(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs text-zinc-800 focus:border-amber-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
            />
            <button
              type="submit"
              disabled={loading || !newAlbumName.trim()}
              className="flex items-center gap-1 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-amber-600 disabled:opacity-50"
            >
              <FolderPlus className="h-4 w-4" />
              Create
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
