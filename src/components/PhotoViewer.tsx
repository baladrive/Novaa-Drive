"use client";
import React, { useState, useEffect, useCallback } from "react";
import { 
  X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, 
  Play, Pause, Info, Download, Trash2, Star, Share2 
} from "lucide-react";
import { Photo } from "../services/photoService";
import { sanitizeLog } from "../utils/sanitize";

interface PhotoViewerProps {
  photo: Photo;
  allPhotos: Photo[];
  onClose: () => void;
  onNavigate: (photo: Photo) => void;
  onToggleFavorite?: (photo: Photo) => void;
  onTrash?: (photo: Photo) => void;
  onShare?: (photo: Photo) => void;
}

export default function PhotoViewer({
  photo,
  allPhotos,
  onClose,
  onNavigate,
  onToggleFavorite,
  onTrash,
  onShare
}: PhotoViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const currentIndex = allPhotos.findIndex(p => p.id === photo.id);

  // Navigate handlers
  const handlePrev = useCallback(() => {
    setZoom(1);
    const prevIdx = (currentIndex - 1 + allPhotos.length) % allPhotos.length;
    onNavigate(allPhotos[prevIdx]);
  }, [currentIndex, allPhotos, onNavigate]);

  const handleNext = useCallback(() => {
    setZoom(1);
    const nextIdx = (currentIndex + 1) % allPhotos.length;
    onNavigate(allPhotos[nextIdx]);
  }, [currentIndex, allPhotos, onNavigate]);

  // Keyboard navigation & zoom
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") handlePrev();
      else if (e.key === "ArrowRight") handleNext();
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePrev, handleNext, onClose]);

  // Slideshow effect
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        handleNext();
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, handleNext]);

  // Zoom handlers
  const zoomIn = () => setZoom(z => Math.min(3, z + 0.25));
  const zoomOut = () => setZoom(z => Math.max(1, z - 0.25));

  // Format File Size
  const formatSize = (bytes?: number) => {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Trigger download helper
  const handleDownload = async () => {
    try {
      const response = await fetch(photo.storage_path);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = photo.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Download failed:", sanitizeLog(err));
      // Fallback
      window.open(photo.storage_path, "_blank");
    }
  };

  const handleShareLink = () => {
    if (onShare) {
      onShare(photo);
    } else {
      const shareUrl = `${window.location.origin}/shared/${photo.id}`;
      navigator.clipboard.writeText(shareUrl)
        .then(() => alert("🔗 Mock sharing link copied to clipboard!"))
        .catch(err => console.error("Could not copy:", sanitizeLog(err)));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex overflow-hidden bg-black text-white">
      
      {/* Main Lightbox Frame */}
      <div className="relative flex flex-1 flex-col items-center justify-center">
        
        {/* Navigation Toolbar */}
        <div className="absolute top-0 left-0 right-0 z-10 flex h-16 items-center justify-between bg-gradient-to-b from-black/80 to-transparent px-4 sm:px-6">
          {/* Left Info title */}
          <div className="truncate pr-4 max-w-[200px] sm:max-w-md">
            <h2 className="truncate text-sm font-bold">{photo.filename}</h2>
            {photo.exif_data?.dateTaken && (
              <p className="text-[10px] text-zinc-400 mt-0.5">{photo.exif_data.dateTaken}</p>
            )}
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-2">
            
            {/* Play/Pause (Slideshow) */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`rounded-full p-2 hover:bg-white/10 transition-colors ${isPlaying ? "text-amber-500" : "text-white"}`}
              title="Slideshow"
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </button>

            {/* Zoom In */}
            <button onClick={zoomIn} className="rounded-full p-2 hover:bg-white/10" title="Zoom In">
              <ZoomIn className="h-5 w-5" />
            </button>

            {/* Zoom Out */}
            <button onClick={zoomOut} className="rounded-full p-2 hover:bg-white/10" title="Zoom Out">
              <ZoomOut className="h-5 w-5" />
            </button>

            {/* Favorite Star */}
            <button
              onClick={() => onToggleFavorite(photo)}
              className={`rounded-full p-2 hover:bg-white/10 transition-colors ${photo.is_favorite ? "text-amber-500" : "text-white"}`}
              title="Favorite"
            >
              <Star className={`h-5 w-5 ${photo.is_favorite ? "fill-amber-500" : ""}`} />
            </button>

            {/* Share */}
            <button onClick={handleShareLink} className="rounded-full p-2 hover:bg-white/10" title="Share link">
              <Share2 className="h-5 w-5" />
            </button>

            {/* Download */}
            <button onClick={handleDownload} className="rounded-full p-2 hover:bg-white/10" title="Download">
              <Download className="h-5 w-5" />
            </button>

            {/* Info Drawer Toggle */}
            <button
              onClick={() => setShowInfo(!showInfo)}
              className={`rounded-full p-2 hover:bg-white/10 transition-colors ${showInfo ? "text-amber-500" : "text-white"}`}
              title="EXIF info"
            >
              <Info className="h-5 w-5" />
            </button>

            {/* Trash */}
            <button
              onClick={() => {
                if (confirm("Move this photo to Trash?")) {
                  onTrash(photo);
                  onClose();
                }
              }}
              className="rounded-full p-2 hover:bg-white/10 text-red-500"
              title="Delete"
            >
              <Trash2 className="h-5 w-5" />
            </button>

            <div className="h-6 w-[1px] bg-zinc-800 mx-1" />

            {/* Close */}
            <button onClick={onClose} className="rounded-full p-2 hover:bg-white/10" title="Close">
              <X className="h-5 w-5" />
            </button>

          </div>
        </div>

        {/* Carousel Image container */}
        <div className="relative flex h-full w-full items-center justify-center p-4">
          <img
            src={photo.storage_path}
            alt={photo.filename}
            className="max-h-[85vh] max-w-[85vw] object-contain transition-transform duration-300 rounded-lg shadow-2xl"
            style={{ transform: `scale(${zoom})` }}
          />

          {/* Left/Right Click Navs */}
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 hover:scale-105 active:scale-95 transition-all"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 hover:scale-105 active:scale-95 transition-all"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>

      </div>

      {/* Info Sidebar (EXIF metadata panel) */}
      {showInfo && (
        <div className="w-80 flex-shrink-0 border-l border-zinc-900 bg-zinc-950 p-6 overflow-y-auto">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-zinc-400">Info Details</h3>
            <button onClick={() => setShowInfo(false)} className="rounded-full p-1 hover:bg-zinc-900 text-zinc-400 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-6 space-y-6 text-xs text-zinc-300">
            <div>
              <p className="font-bold text-zinc-500 uppercase tracking-wider text-[10px]">Filename</p>
              <p className="mt-1 font-semibold text-white break-all">{photo.filename}</p>
            </div>

            <div>
              <p className="font-bold text-zinc-500 uppercase tracking-wider text-[10px]">Uploaded At</p>
              <p className="mt-1 font-semibold text-white">
                {new Date(photo.created_at).toLocaleString()}
              </p>
            </div>

            <div>
              <p className="font-bold text-zinc-500 uppercase tracking-wider text-[10px]">File Size</p>
              <p className="mt-1 font-semibold text-white">{formatSize(photo.size)}</p>
            </div>

            {(photo.width && photo.height) && (
              <div>
                <p className="font-bold text-zinc-500 uppercase tracking-wider text-[10px]">Resolution</p>
                <p className="mt-1 font-semibold text-white">
                  {photo.width} × {photo.height} pixels ({( (photo.width * photo.height) / 1000000 ).toFixed(1)} MP)
                </p>
              </div>
            )}

            {/* EXIF Block */}
            {photo.exif_data?.cameraModel && (
              <div className="border-t border-zinc-900 pt-5 space-y-4">
                <h4 className="font-black text-amber-500 uppercase tracking-wider text-[10px]">Camera EXIF Data</h4>
                <div>
                  <p className="font-bold text-zinc-500 uppercase tracking-wider text-[9px]">Camera</p>
                  <p className="mt-0.5 font-semibold text-white">
                    {photo.exif_data.cameraMake} {photo.exif_data.cameraModel}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-bold text-zinc-500 uppercase tracking-wider text-[9px]">Aperture</p>
                    <p className="mt-0.5 font-semibold text-white">{photo.exif_data.aperture || "—"}</p>
                  </div>
                  <div>
                    <p className="font-bold text-zinc-500 uppercase tracking-wider text-[9px]">Exposure Time</p>
                    <p className="mt-0.5 font-semibold text-white">{photo.exif_data.exposureTime || "—"}</p>
                  </div>
                  <div>
                    <p className="font-bold text-zinc-500 uppercase tracking-wider text-[9px]">ISO</p>
                    <p className="mt-0.5 font-semibold text-white">{photo.exif_data.iso || "—"}</p>
                  </div>
                  <div>
                    <p className="font-bold text-zinc-500 uppercase tracking-wider text-[9px]">Focal Length</p>
                    <p className="mt-0.5 font-semibold text-white">{photo.exif_data.focalLength || "—"}</p>
                  </div>
                </div>

                {photo.exif_data.gpsLatitude && (
                  <div>
                    <p className="font-bold text-zinc-500 uppercase tracking-wider text-[9px]">GPS Geolocation</p>
                    <p className="mt-0.5 font-semibold text-white">
                      {photo.exif_data.gpsLatitude}, {photo.exif_data.gpsLongitude}
                    </p>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${photo.exif_data.gpsLatitude},${photo.exif_data.gpsLongitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-block text-[10px] text-amber-500 hover:underline"
                    >
                      Open in Google Maps
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
