import React from "react";
import { Link } from "react-router-dom";
import { Folder, Trash2 } from "lucide-react";
import { Album } from "../services/photoService";

interface AlbumCardProps {
  album: Album;
  coverUrl?: string;
  onDelete: (albumId: string) => void;
}

export default function AlbumCard({ album, coverUrl, onDelete }: AlbumCardProps) {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-150 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md dark:border-zinc-900 dark:bg-zinc-900/60">
      
      {/* Cover Image Area */}
      <Link to={`/albums/${album.id}`} className="aspect-video w-full overflow-hidden bg-zinc-50 dark:bg-zinc-950 relative">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={album.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center text-zinc-300 dark:text-zinc-700">
            <Folder className="h-12 w-12" />
            <span className="mt-1 text-[10px] uppercase font-bold tracking-wider text-zinc-450">Empty Album</span>
          </div>
        )}
      </Link>

      {/* Info Details */}
      <div className="flex flex-1 items-center justify-between p-4 bg-white dark:bg-zinc-900/40">
        <div className="overflow-hidden pr-2">
          <Link to={`/albums/${album.id}`} className="block truncate text-sm font-bold text-zinc-800 hover:text-amber-500 dark:text-zinc-200 dark:hover:text-amber-500">
            {album.name}
          </Link>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            {album.photoCount || 0} {album.photoCount === 1 ? "photo" : "photos"}
          </p>
        </div>

        {/* Delete Album Trigger */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm(`Are you sure you want to delete the album "${album.name}"? Photos inside will not be deleted.`)) {
              onDelete(album.id);
            }
          }}
          className="rounded-full p-2 text-zinc-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/20"
          title="Delete Album"
        >
          <Trash2 className="h-4.5 w-4.5" />
        </button>
      </div>

    </div>
  );
}
