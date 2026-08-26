"use client";
import React, { useState, useEffect, useRef } from "react";
import { X, Play, Pause, ZoomIn, ZoomOut, RotateCw, Download, Star, Trash2, FileText, FileCode, PlayCircle } from "lucide-react";
import { FileItem } from "../services/fileService";
import { sanitizeLog } from "../utils/sanitize";

interface FileViewerProps {
  file: FileItem;
  allFiles?: FileItem[];
  onClose: () => void;
  onToggleStar?: (file: FileItem) => void;
  onTrash?: (file: FileItem) => void;
}

export default function FileViewer({ file, allFiles: _allFiles = [], onClose, onToggleStar, onTrash }: FileViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [textContent, setTextContent] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Reset states when file changes
  useEffect(() => {
    setZoom(1);
    setRotation(0);
    setIsPlaying(false);
    setTextContent(null);

    // Fetch text files content inline
    if (file.file_category === "document" && (file.mime_type.startsWith("text/") || file.filename.endsWith(".txt") || file.filename.endsWith(".md"))) {
      fetch(file.storage_path)
        .then((res) => res.text())
        .then((text) => setTextContent(text.slice(0, 10000))) // Cap at 10k chars
        .catch((err) => console.error("Error reading text file:", sanitizeLog(err)));
    }
  }, [file]);

  const handleZoomIn = () => setZoom((z) => Math.min(3, z + 0.25));
  const handleZoomOut = () => setZoom((z) => Math.max(0.5, z - 0.25));
  const handleRotate = () => setRotation((r) => (r + 90) % 360);

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const onAudioTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const onAudioLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleAudioSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      const val = parseFloat(e.target.value);
      audioRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/90 p-4 backdrop-blur-md">
      
      {/* Top Toolbar */}
      <div className="absolute top-0 inset-x-0 flex h-16 items-center justify-between px-6 bg-gradient-to-b from-black/50 to-transparent text-white">
        <div className="overflow-hidden pr-4">
          <h3 className="truncate text-sm font-black">{file.filename}</h3>
          <span className="text-[10px] text-zinc-400 font-bold">{formatSize(file.size)} • {file.mime_type}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* File Operations */}
          {onToggleStar && (
            <button
              onClick={() => onToggleStar(file)}
              className={`rounded-full p-2 hover:bg-white/10 transition-colors cursor-pointer ${file.is_starred ? "text-amber-400" : "text-zinc-350"}`}
              title="Favorite File"
            >
              <Star className="h-5 w-5 fill-current" />
            </button>
          )}

          {onTrash && (
            <button
              onClick={() => {
                onTrash(file);
                onClose();
              }}
              className="rounded-full p-2 text-zinc-350 hover:bg-white/10 hover:text-red-400 transition-colors cursor-pointer"
              title="Move to Trash"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          )}

          <a
            href={file.storage_path}
            download={file.filename}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full p-2 text-zinc-350 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            title="Download Original"
          >
            <Download className="h-5 w-5" />
          </a>

          <div className="h-6 w-px bg-white/10 mx-1" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="rounded-full p-2 text-zinc-350 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main View Area */}
      <div className="flex h-full w-full items-center justify-center pt-16 pb-12 overflow-hidden">
        
        {/* Category Renderings */}
        {file.file_category === "photo" && (
          <div className="relative max-h-full max-w-full overflow-hidden flex items-center justify-center transition-all duration-300">
            <img
              src={file.storage_path}
              alt={file.filename}
              className="max-h-[75vh] max-w-[85vw] object-contain shadow-2xl rounded-lg transition-transform duration-200"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`
              }}
            />
            {/* Image Zoom Toolbar */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-zinc-900/80 px-4 py-2 text-white border border-white/10">
              <button onClick={handleZoomOut} className="rounded-full p-1.5 hover:bg-white/15 cursor-pointer">
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="text-[10px] font-bold w-12 text-center">{Math.round(zoom * 100)}%</span>
              <button onClick={handleZoomIn} className="rounded-full p-1.5 hover:bg-white/15 cursor-pointer">
                <ZoomIn className="h-4 w-4" />
              </button>
              <div className="h-4 w-px bg-white/15 mx-1" />
              <button onClick={handleRotate} className="rounded-full p-1.5 hover:bg-white/15 cursor-pointer">
                <RotateCw className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {file.file_category === "video" && (
          <div className="relative max-h-[70vh] max-w-[80vw] bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/5">
            <video
              ref={videoRef}
              src={file.storage_path}
              controls
              autoPlay
              className="max-h-[70vh] max-w-[80vw] object-contain outline-none"
            />
          </div>
        )}

        {file.file_category === "audio" && (
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-900/70 p-6 backdrop-blur-xl shadow-2xl text-center text-white">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-900 shadow-xl mb-6">
              <PlayCircle className={`h-12 w-12 ${isPlaying ? "animate-pulse" : ""}`} />
            </div>
            <h4 className="font-extrabold text-sm truncate px-4">{file.filename}</h4>
            <p className="text-[10px] text-zinc-400 mt-1 font-semibold">Audio Track • {formatSize(file.size)}</p>

            {/* Audio Engine */}
            <audio
              ref={audioRef}
              src={file.storage_path}
              onTimeUpdate={onAudioTimeUpdate}
              onLoadedMetadata={onAudioLoadedMetadata}
              onEnded={() => setIsPlaying(false)}
            />

            {/* Slider Seek bar */}
            <div className="mt-6 flex items-center gap-3">
              <span className="text-[10px] font-bold text-zinc-400 w-10 text-left">{formatTime(currentTime)}</span>
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={handleAudioSeek}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <span className="text-[10px] font-bold text-zinc-400 w-10 text-right">{formatTime(duration)}</span>
            </div>

            {/* Controls */}
            <div className="mt-6 flex justify-center">
              <button
                onClick={toggleAudio}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500 text-slate-950 shadow-md hover:bg-amber-600 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 fill-current ml-0.5" />}
              </button>
            </div>
          </div>
        )}

        {file.file_category === "document" && textContent !== null && (
          <div className="h-[70vh] w-[80vw] max-w-4xl rounded-2xl border border-white/10 bg-zinc-900/60 p-6 text-white overflow-auto">
            <div className="flex items-center gap-2 mb-4 text-xs font-bold text-amber-500">
              <FileCode className="h-5 w-5" />
              <span>Document Text Viewer</span>
            </div>
            <pre className="font-mono text-xs whitespace-pre-wrap leading-relaxed text-zinc-300">
              {textContent}
            </pre>
          </div>
        )}

        {file.file_category === "document" && file.mime_type === "application/pdf" && (
          <div className="h-[75vh] w-[80vw] max-w-5xl rounded-2xl border border-white/10 overflow-hidden bg-white shadow-2xl">
            <iframe
              src={`${file.storage_path}#toolbar=0`}
              title={file.filename}
              className="h-full w-full border-none"
            />
          </div>
        )}

        {/* Fallback preview unsupported card */}
        {((file.file_category === "document" && file.mime_type !== "application/pdf" && textContent === null) ||
          file.file_category === "archive" ||
          file.file_category === "other") && (
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-zinc-900/80 p-8 backdrop-blur-xl shadow-2xl text-center text-white">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 border border-white/10 mb-5">
              <FileText className="h-8 w-8 text-zinc-400" />
            </div>
            <h4 className="font-extrabold text-sm truncate px-4">{file.filename}</h4>
            <p className="text-[10px] text-zinc-450 mt-1.5 leading-relaxed font-semibold">
              Preview is not available for this file category.<br />You can download the original file to view.
            </p>
            
            <a
              href={file.storage_path}
              download={file.filename}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-6 py-3 text-xs w-full shadow-md active:scale-98 transition-all"
            >
              <Download className="h-4 w-4" />
              Download original file
            </a>
          </div>
        )}

      </div>

    </div>
  );
}
