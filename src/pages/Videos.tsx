"use client";
import React, { useState, useEffect, useCallback, memo } from "react";
import { Video, Film, Star, Trash2, Search, Play } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { fileService, FileItem } from "../services/fileService";
import MediaViewer from "../components/MediaViewer";
import { getFileIconSrc, getThumbnail } from "../utils/thumbnailGenerator";

// ── Format size utility ─────────────────────────────────────────────────
function formatSize(bytes: number): string {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

// ── Video Card Component ────────────────────────────────────────────────
const VideoCard = memo(function VideoCard({
  file,
  thumbnailSrc,
  onSelect,
  onToggleFavorite,
  onTrash,
}: {
  file: FileItem;
  thumbnailSrc: string;
  onSelect: (f: FileItem) => void;
  onToggleFavorite: (f: FileItem) => void;
  onTrash: (f: FileItem) => void;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <button
      onClick={() => onSelect(file)}
      className="group relative aspect-video w-full overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] transition-all duration-200 hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/10 hover:scale-[1.02] active:scale-[0.98]"
    >
      {/* Thumbnail */}
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-900/40 to-cyan-900/40">
        {!imgError ? (
          <img
            src={thumbnailSrc}
            alt={file.filename}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20">
            <Film className="h-6 w-6 text-purple-400" />
          </div>
        )}
      </div>

      {/* Play button overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/80 shadow-lg shadow-purple-500/30 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
          <Play className="ml-0.5 h-5 w-5 text-white fill-white" />
        </div>
      </div>

      {/* Favorite button */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggleFavorite(file); }}
        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg bg-black/40 opacity-0 transition-all duration-200 group-hover:opacity-100 hover:bg-black/60 backdrop-blur-sm"
      >
        <Star className={`h-3.5 w-3.5 ${file.is_starred ? 'fill-amber-400 text-amber-400' : 'text-white/60'}`} />
      </button>

      {/* File info */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 pt-6">
        <p className="truncate text-[10px] font-semibold text-white/90">{file.filename}</p>
        <p className="text-[8px] text-white/50">{formatSize(file.size)}</p>
      </div>
    </button>
  );
});

// ── Main Videos Page ────────────────────────────────────────────────────
export default function Videos() {
  const { user } = useAuth();
  const [videos, setVideos] = useState<FileItem[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<FileItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});

  const fetchVideos = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const allFiles = await fileService.getFiles(user.id, null);
      const videoFiles = allFiles.filter(
        f => f.file_category === "video" || f.mime_type?.startsWith("video/")
      );
      setVideos(videoFiles);

      // Use stored thumbnail_path from IndexedDB, or generate if missing
      const thumbMap: Record<string, string> = {};
      for (const item of videoFiles) {
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
      console.error("Error loading videos:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchVideos();
  }, [user, fetchVideos]);

  const handleToggleFavorite = useCallback(async (file: FileItem) => {
    if (!user) return;
    try {
      await fileService.toggleStar(user.id, file.id, !file.is_starred);
      fetchVideos();
    } catch (err) {
      console.error(err);
    }
  }, [user, fetchVideos]);

  const handleTrashVideo = useCallback(async (file: FileItem) => {
    if (!user) return;
    try {
      await fileService.trashFile(user.id, file.id, true);
      setVideos(prev => prev.filter(f => f.id !== file.id));
      setSelectedVideo(null);
    } catch (err) {
      console.error(err);
    }
  }, [user]);

  const filteredVideos = searchQuery
    ? videos.filter(v => v.filename.toLowerCase().includes(searchQuery.toLowerCase()))
    : videos;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">Videos</h1>
          <p className="mt-1 text-xs text-white/40">Browse and manage your video collection</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            placeholder="Search videos..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-white/[0.06] bg-white/[0.04] py-2.5 pl-10 pr-4 text-sm text-white outline-none transition-all placeholder:text-white/25 focus:border-purple-500/40 focus:bg-white/[0.06] sm:w-64"
          />
        </div>
      </div>

      {/* Video Grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="aspect-video rounded-xl skeleton" />
          ))}
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-white/[0.06] bg-white/[0.02] py-24 px-4 text-center">
          <div className="rounded-full bg-white/[0.04] p-4">
            <Video className="h-10 w-10 text-white/20" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-white/60">No videos yet</h3>
          <p className="mt-1 text-xs text-white/30 max-w-xs">
            {searchQuery ? "No videos match your search." : "Upload videos to see them here."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filteredVideos.map(video => (
            <VideoCard
              key={video.id}
              file={video}
              thumbnailSrc={thumbnails[video.id] || getFileIconSrc(video.filename, video.mime_type)}
              onSelect={setSelectedVideo}
              onToggleFavorite={handleToggleFavorite}
              onTrash={handleTrashVideo}
            />
          ))}
        </div>
      )}

      {/* Video Viewer */}
      {selectedVideo && (
        <MediaViewer
          file={selectedVideo}
          allFiles={videos}
          onClose={() => setSelectedVideo(null)}
          onToggleStar={async f => { await fileService.toggleStar(user!.id, f.id, !f.is_starred); fetchVideos(); }}
          onTrash={handleTrashVideo}
          onNavigate={(file) => setSelectedVideo(file)}
        />
      )}
    </div>
  );
}
