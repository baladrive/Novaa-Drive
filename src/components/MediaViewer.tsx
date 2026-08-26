"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw,
  Download, Trash2, Star, Share2, Play, Pause, SkipBack,
  SkipForward, Maximize, Minimize, Repeat, Shuffle,
  Volume2, VolumeX, FileText, Film, Music, Grid
} from "lucide-react";
import { FileItem } from "../services/fileService";
import { getFileIconSrc } from "../utils/thumbnailGenerator";

interface MediaViewerProps {
  file: FileItem;
  allFiles?: FileItem[];
  onClose: () => void;
  onToggleStar?: (file: FileItem) => void;
  onTrash?: (file: FileItem) => void;
  onShare?: (file: FileItem) => void;
  onNavigate?: (file: FileItem) => void;
}

type MediaType = 'photo' | 'video' | 'audio' | 'document' | 'archive' | 'other';

export default function MediaViewer({
  file,
  allFiles = [],
  onClose,
  onToggleStar,
  onTrash,
  onShare,
  onNavigate
}: MediaViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isPiP, setIsPiP] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const currentIndex = allFiles.findIndex(f => f.id === file.id);
  const mediaType: MediaType = file.file_category as MediaType;

  // Reset on file change
  useEffect(() => {
    setZoom(1);
    setRotation(0);
    setImgError(false);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [file.id]);

  // ── Navigation ────────────────────────────────────────────────────────

  const goToPrev = useCallback(() => {
    if (allFiles.length === 0) return;
    const prevIdx = (currentIndex - 1 + allFiles.length) % allFiles.length;
    if (onNavigate) {
      onNavigate(allFiles[prevIdx]);
    }
    setZoom(1);
    setRotation(0);
  }, [currentIndex, allFiles, onNavigate]);

  const goToNext = useCallback(() => {
    if (allFiles.length === 0) return;
    const nextIdx = (currentIndex + 1) % allFiles.length;
    if (onNavigate) {
      onNavigate(allFiles[nextIdx]);
    }
    setZoom(1);
    setRotation(0);
  }, [currentIndex, allFiles, onNavigate]);

  // ── Keyboard Navigation ───────────────────────────────────────────────

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          goToPrev();
          break;
        case 'ArrowRight':
          e.preventDefault();
          goToNext();
          break;
        case 'Escape':
          if (isFullscreen) {
            document.exitFullscreen();
          } else {
            onClose();
          }
          break;
        case '+':
        case '=':
          e.preventDefault();
          setZoom(z => Math.min(5, z + 0.25));
          break;
        case '-':
          e.preventDefault();
          setZoom(z => Math.max(0.25, z - 0.25));
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
        case 'r':
        case 'R':
          setRotation(r => (r + 90) % 360);
          break;
        case ' ':
          e.preventDefault();
          if (mediaType === 'video') {
            toggleVideoPlay();
          } else if (mediaType === 'audio') {
            toggleAudioPlay();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPrev, goToNext, onClose, isFullscreen, mediaType]);

  // ── Touch / Swipe Support ─────────────────────────────────────────────

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diffX = e.changedTouches[0].clientX - touchStartX;
    const diffY = e.changedTouches[0].clientY - touchStartY;

    // Only detect horizontal swipes (ignore vertical scrolling)
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
      if (diffX > 0) {
        goToPrev();
      } else {
        goToNext();
      }
    }
  };

  // ── Fullscreen ────────────────────────────────────────────────────────

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFSChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFSChange);
    return () => document.removeEventListener('fullscreenchange', handleFSChange);
  }, []);

  // ── Zoom Controls ─────────────────────────────────────────────────────

  const handleZoomIn = () => setZoom(z => Math.min(5, z + 0.25));
  const handleZoomOut = () => setZoom(z => Math.max(0.25, z - 0.25));
  const handleRotate = () => setRotation(r => (r + 90) % 360);

  // ── Video Controls ────────────────────────────────────────────────────

  const toggleVideoPlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      if (videoRef.current.duration) {
        setDuration(videoRef.current.duration);
      }
    }
  };

  const handleVideoSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  const handleVideoEnded = () => {
    if (isRepeat) {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play();
      }
    } else {
      setIsPlaying(false);
      // Auto-advance to next video if available
      if (isShuffle) {
        const randomIdx = Math.floor(Math.random() * allFiles.length);
        if (onNavigate && allFiles[randomIdx]) {
          onNavigate(allFiles[randomIdx]);
        }
      } else {
        goToNext();
      }
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
    if (videoRef.current) {
      videoRef.current.volume = val;
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
      setVolume(videoRef.current.muted ? 0 : 1);
    }
  };

  const changePlaybackRate = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
    setShowSpeedMenu(false);
  };

  const togglePiP = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPiP(false);
      } else {
        await videoRef.current.requestPictureInPicture();
        setIsPiP(true);
      }
    } catch {
      setIsPiP(false);
    }
  };

  // ── Audio Controls ────────────────────────────────────────────────────

  const toggleAudioPlay = () => {
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      audioRef.current.play();
      setIsPlaying(true);
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleAudioTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (audioRef.current.duration) {
        setDuration(audioRef.current.duration);
      }
    }
  };

  const handleAudioSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  const handleAudioEnded = () => {
    if (isRepeat) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
    } else {
      setIsPlaying(false);
      if (isShuffle) {
        const randomIdx = Math.floor(Math.random() * allFiles.length);
        if (onNavigate && allFiles[randomIdx]) {
          onNavigate(allFiles[randomIdx]);
        }
      } else {
        goToNext();
      }
    }
  };

  // ── Download ──────────────────────────────────────────────────────────

  const handleDownload = async () => {
    try {
      const response = await fetch(file.storage_path);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      window.open(file.storage_path, '_blank');
    }
  };

  // ── Share ─────────────────────────────────────────────────────────────

  const handleShare = () => {
    if (onShare) {
      onShare(file);
    } else {
      const shareUrl = `${window.location.origin}/shared/${file.id}`;
      navigator.clipboard.writeText(shareUrl)
        .then(() => alert('🔗 Share link copied to clipboard!'))
        .catch(() => {
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = shareUrl;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          alert('🔗 Share link copied to clipboard!');
        });
    }
  };

  // ── Format Utilities ──────────────────────────────────────────────────

  const formatTime = (secs: number) => {
    if (isNaN(secs) || !isFinite(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const playbackSpeeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];

  // ── Render: Top Toolbar ──────────────────────────────────────────────

  const TopToolbar = () => (
    <div className="absolute top-0 left-0 right-0 z-20 flex h-16 items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent px-4 sm:px-6">
      <div className="flex items-center gap-3 overflow-hidden">
        <button onClick={goToPrev} className="rounded-full p-1.5 text-white/70 hover:bg-white/10 hover:text-white transition-all cursor-pointer" title="Previous (←)">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button onClick={goToNext} className="rounded-full p-1.5 text-white/70 hover:bg-white/10 hover:text-white transition-all cursor-pointer mr-2" title="Next (→)">
          <ChevronRight className="h-5 w-5" />
        </button>
        <div className="hidden sm:block overflow-hidden">
          <h3 className="truncate text-sm font-bold text-white pr-4">{file.filename}</h3>
          <p className="text-[10px] text-white/50 font-medium">{formatSize(file.size)}</p>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        {/* Zoom controls for images */}
        {mediaType === 'photo' && (
          <>
            <button onClick={handleZoomOut} className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white cursor-pointer" title="Zoom Out (-)">
              <ZoomOut className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <span className="text-[10px] font-bold text-white/60 w-10 text-center hidden sm:block">{Math.round(zoom * 100)}%</span>
            <button onClick={handleZoomIn} className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white cursor-pointer" title="Zoom In (+)">
              <ZoomIn className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <button onClick={handleRotate} className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white cursor-pointer" title="Rotate (R)">
              <RotateCw className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </>
        )}

        {/* Star */}
        {onToggleStar && (
          <button
            onClick={() => onToggleStar(file)}
            className={`rounded-full p-2 transition-colors cursor-pointer ${
              file.is_starred ? 'text-amber-400' : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`}
            title={file.is_starred ? 'Unstar' : 'Star'}
          >
            <Star className={`h-4 w-4 sm:h-5 sm:w-5 ${file.is_starred ? 'fill-amber-400' : ''}`} />
          </button>
        )}

        {/* Share */}
        <button onClick={handleShare} className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white cursor-pointer" title="Share">
          <Share2 className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>

        {/* Download */}
        <button onClick={handleDownload} className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white cursor-pointer" title="Download">
          <Download className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>

        {/* Fullscreen */}
        <button onClick={toggleFullscreen} className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white cursor-pointer" title="Fullscreen (F)">
          {isFullscreen ? <Minimize className="h-4 w-4 sm:h-5 sm:w-5" /> : <Maximize className="h-4 w-4 sm:h-5 sm:w-5" />}
        </button>

        {/* Delete */}
        {onTrash && (
          <button
            onClick={() => { onTrash(file); onClose(); }}
            className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-red-400 cursor-pointer"
            title="Delete"
          >
            <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        )}

        <div className="h-6 w-px bg-white/10 mx-1" />

        {/* Close */}
        <button onClick={onClose} className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white cursor-pointer" title="Close (Esc)">
          <X className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
      </div>
    </div>
  );

  // ── Render: Seek Bar ──────────────────────────────────────────────────

  const SeekBar = ({ type }: { type: 'video' | 'audio' }) => (
    <div className="flex items-center gap-3 w-full px-4">
      <span className="text-[10px] font-bold text-white/60 w-10 text-right">{formatTime(currentTime)}</span>
      <input
        type="range"
        min="0"
        max={duration || 100}
        value={currentTime}
        onChange={type === 'video' ? handleVideoSeek : handleAudioSeek}
        className="flex-1 h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-amber-500"
        style={{
          background: `linear-gradient(to right, #f59e0b ${(currentTime / (duration || 1)) * 100}%, rgba(255,255,255,0.2) ${(currentTime / (duration || 1)) * 100}%)`
        }}
      />
      <span className="text-[10px] font-bold text-white/60 w-10">{formatTime(duration)}</span>
    </div>
  );

  // ── Render: Photo ─────────────────────────────────────────────────────

  const renderPhoto = () => (
    <div className="relative flex items-center justify-center w-full h-full p-4 sm:p-8">
      {imgError ? (
        <div className="flex flex-col items-center gap-4">
          <img src={getFileIconSrc(file.filename, file.mime_type)} alt="Fallback" className="w-20 h-20 opacity-50" />
          <p className="text-sm text-white/50 font-medium">Image preview unavailable</p>
        </div>
      ) : (
        <img
          ref={imgRef}
          src={file.storage_path}
          alt={file.filename}
          onError={() => setImgError(true)}
          className="max-h-[80vh] max-w-[90vw] object-contain rounded-lg shadow-2xl transition-all duration-200 select-none"
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg)`,
            cursor: zoom > 1 ? 'grab' : 'default'
          }}
          draggable={false}
        />
      )}
    </div>
  );

  // ── Render: Video ─────────────────────────────────────────────────────

  const renderVideo = () => (
    <div className="relative flex flex-col items-center justify-center w-full h-full">
      <div className="relative max-h-[70vh] max-w-[90vw] bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10">
        <video
          key={file.id}
          ref={videoRef}
          src={file.storage_path}
          className="max-h-[70vh] max-w-[90vw] object-contain outline-none"
          onTimeUpdate={handleVideoTimeUpdate}
          onLoadedMetadata={() => {
            if (videoRef.current?.duration) {
              setDuration(videoRef.current.duration);
            }
          }}
          onEnded={handleVideoEnded}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onClick={toggleVideoPlay}
          playsInline
          preload="metadata"
          autoPlay
        />

        {/* Video overlay play button */}
        {!isPlaying && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer"
            onClick={toggleVideoPlay}
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/90 shadow-lg shadow-amber-500/30 backdrop-blur-sm hover:scale-110 transition-transform">
              <Play className="ml-1 h-8 w-8 text-white fill-white" />
            </div>
          </div>
        )}
      </div>

      {/* Video Controls Bar */}
      <div className="w-full max-w-[90vw] mt-2 flex flex-col gap-2">
        <SeekBar type="video" />
        
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            {/* Previous */}
            <button onClick={goToPrev} className="rounded-full p-1.5 text-white/70 hover:bg-white/10 hover:text-white cursor-pointer" title="Previous">
              <SkipBack className="h-4 w-4" />
            </button>

            {/* Play/Pause */}
            <button onClick={toggleVideoPlay} className="rounded-full p-2 bg-amber-500 text-black hover:bg-amber-400 transition-colors cursor-pointer" title="Play/Pause (Space)">
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 fill-current ml-0.5" />}
            </button>

            {/* Next */}
            <button onClick={goToNext} className="rounded-full p-1.5 text-white/70 hover:bg-white/10 hover:text-white cursor-pointer" title="Next">
              <SkipForward className="h-4 w-4" />
            </button>

            {/* Volume */}
            <div className="flex items-center gap-1 ml-2">
              <button onClick={toggleMute} className="rounded-full p-1.5 text-white/70 hover:bg-white/10 cursor-pointer">
                {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={handleVolumeChange}
                className="w-20 h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-amber-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Playback Speed */}
            <div className="relative">
              <button
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="rounded-full px-2 py-1 text-[10px] font-bold text-white/70 hover:bg-white/10 cursor-pointer"
                title="Playback Speed"
              >
                {playbackRate}x
              </button>
              {showSpeedMenu && (
                <div className="absolute bottom-full right-0 mb-2 rounded-xl bg-zinc-900 border border-white/10 p-1.5 shadow-xl z-30">
                  {playbackSpeeds.map(speed => (
                    <button
                      key={speed}
                      onClick={() => changePlaybackRate(speed)}
                      className={`block w-full rounded-lg px-3 py-1.5 text-xs font-bold text-left cursor-pointer ${
                        playbackRate === speed ? 'bg-amber-500 text-black' : 'text-white/70 hover:bg-white/10'
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Repeat */}
            <button
              onClick={() => setIsRepeat(!isRepeat)}
              className={`rounded-full p-1.5 cursor-pointer ${isRepeat ? 'text-amber-500' : 'text-white/70 hover:bg-white/10'}`}
              title="Repeat"
            >
              <Repeat className="h-4 w-4" />
            </button>

            {/* Shuffle */}
            <button
              onClick={() => setIsShuffle(!isShuffle)}
              className={`rounded-full p-1.5 cursor-pointer ${isShuffle ? 'text-amber-500' : 'text-white/70 hover:bg-white/10'}`}
              title="Shuffle"
            >
              <Shuffle className="h-4 w-4" />
            </button>

            {/* PiP */}
            {document.pictureInPictureEnabled && (
              <button onClick={togglePiP} className="rounded-full p-1.5 text-white/70 hover:bg-white/10 cursor-pointer" title="Picture in Picture">
                <Film className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // ── Render: Audio ─────────────────────────────────────────────────────

  const renderAudio = () => (
    <div className="flex flex-col items-center justify-center w-full h-full px-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-900/70 p-6 sm:p-8 backdrop-blur-xl shadow-2xl text-center text-white">
        {/* Album Art / Icon */}
        <div className="mx-auto flex h-24 w-24 sm:h-32 sm:w-32 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-900 shadow-xl mb-6">
          <Music className={`h-12 w-12 sm:h-16 sm:w-16 ${isPlaying ? 'animate-pulse' : ''}`} />
        </div>

        <h4 className="font-extrabold text-sm sm:text-base truncate px-4">{file.filename}</h4>
        <p className="text-[10px] text-zinc-400 mt-1 font-semibold">Audio Track • {formatSize(file.size)}</p>

        {/* Hidden Audio Element */}
        <audio
          ref={audioRef}
          src={file.storage_path}
          onTimeUpdate={handleAudioTimeUpdate}
          onLoadedMetadata={() => {
            if (audioRef.current?.duration) {
              setDuration(audioRef.current.duration);
            }
          }}
          onEnded={handleAudioEnded}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          preload="metadata"
        />

        {/* Seek Bar */}
        <div className="mt-6">
          <SeekBar type="audio" />
        </div>

        {/* Main Controls */}
        <div className="mt-6 flex items-center justify-center gap-4">
          {/* Previous */}
          <button onClick={goToPrev} className="rounded-full p-2 text-white/70 hover:bg-white/10 cursor-pointer" title="Previous">
            <SkipBack className="h-5 w-5" />
          </button>

          {/* Shuffle */}
          <button
            onClick={() => setIsShuffle(!isShuffle)}
            className={`rounded-full p-2 cursor-pointer ${isShuffle ? 'text-amber-500' : 'text-white/70 hover:bg-white/10'}`}
            title="Shuffle"
          >
            <Shuffle className="h-4 w-4" />
          </button>

          {/* Play/Pause */}
          <button
            onClick={toggleAudioPlay}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500 text-slate-950 shadow-md hover:bg-amber-400 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 fill-current ml-1" />}
          </button>

          {/* Repeat */}
          <button
            onClick={() => setIsRepeat(!isRepeat)}
            className={`rounded-full p-2 cursor-pointer ${isRepeat ? 'text-amber-500' : 'text-white/70 hover:bg-white/10'}`}
            title="Repeat"
          >
            <Repeat className="h-4 w-4" />
          </button>

          {/* Next */}
          <button onClick={goToNext} className="rounded-full p-2 text-white/70 hover:bg-white/10 cursor-pointer" title="Next">
            <SkipForward className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );

  // ── Render: Document / PDF ────────────────────────────────────────────

  const renderDocument = () => {
    if (file.mime_type === 'application/pdf') {
      return (
        <div className="flex items-center justify-center w-full h-full p-4">
          <div className="h-[80vh] w-[90vw] max-w-5xl rounded-2xl border border-white/10 overflow-hidden bg-white shadow-2xl">
            <iframe
              src={`${file.storage_path}#toolbar=0`}
              title={file.filename}
              className="h-full w-full border-none"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        </div>
      );
    }

    // For text files, try to fetch and display
    if (file.mime_type.startsWith('text/') || file.filename.endsWith('.txt') || file.filename.endsWith('.md') || file.filename.endsWith('.csv')) {
      return <DocumentTextViewer file={file} />;
    }

    // Fallback: show icon and download button
    return (
      <div className="flex flex-col items-center justify-center w-full h-full p-4">
        <div className="max-w-sm rounded-3xl border border-white/10 bg-zinc-900/80 p-8 backdrop-blur-xl shadow-2xl text-center text-white">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-white/5 border border-white/10 mb-5">
            <img src={getFileIconSrc(file.filename, file.mime_type)} alt="File" className="w-10 h-10" />
          </div>
          <h4 className="font-extrabold text-sm truncate px-4">{file.filename}</h4>
          <p className="text-[10px] text-zinc-400 mt-1.5 font-medium">
            {formatSize(file.size)} • {file.mime_type}
          </p>
          <button
            onClick={handleDownload}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-3 text-xs w-full shadow-md active:scale-[0.98] transition-all cursor-pointer"
          >
            <Download className="h-4 w-4" />
            Download original file
          </button>
        </div>
      </div>
    );
  };

  // ── Render: Other (Archive, etc.) ─────────────────────────────────────

  const renderOther = () => (
    <div className="flex flex-col items-center justify-center w-full h-full p-4">
      <div className="max-w-sm rounded-3xl border border-white/10 bg-zinc-900/80 p-8 backdrop-blur-xl shadow-2xl text-center text-white">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-white/5 border border-white/10 mb-5">
          <img src={getFileIconSrc(file.filename, file.mime_type)} alt="File" className="w-10 h-10" />
        </div>
        <h4 className="font-extrabold text-sm truncate px-4">{file.filename}</h4>
        <p className="text-[10px] text-zinc-400 mt-1.5 font-medium">
          {formatSize(file.size)} • {file.mime_type}
        </p>
        <button
          onClick={handleDownload}
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-3 text-xs w-full shadow-md active:scale-[0.98] transition-all cursor-pointer"
        >
          <Download className="h-4 w-4" />
          Download original file
        </button>
      </div>
    </div>
  );

  // ── Main Render ───────────────────────────────────────────────────────

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col bg-black/95 text-white overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <TopToolbar />

      {/* Content area */}
      <div className="flex-1 flex items-center justify-center overflow-hidden">
        {mediaType === 'photo' && renderPhoto()}
        {mediaType === 'video' && renderVideo()}
        {mediaType === 'audio' && renderAudio()}
        {(mediaType === 'document') && renderDocument()}
        {(mediaType === 'archive' || mediaType === 'other') && renderOther()}
      </div>

      {/* File counter at bottom */}
      {allFiles.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
          <div className="flex items-center gap-2 rounded-full bg-black/60 px-4 py-1.5 backdrop-blur-sm border border-white/10">
            <Grid className="h-3 w-3 text-white/50" />
            <span className="text-[10px] font-bold text-white/70">
              {currentIndex + 1} / {allFiles.length}
            </span>
          </div>
        </div>
      )}

      {/* Navigation arrows for non-touch devices */}
      {allFiles.length > 1 && (
        <>
          <button
            onClick={goToPrev}
            className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 z-10 h-12 w-12 items-center justify-center rounded-full bg-black/40 text-white/80 hover:bg-black/60 hover:text-white hover:scale-105 active:scale-95 transition-all cursor-pointer border border-white/10"
            title="Previous (←)"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={goToNext}
            className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 z-10 h-12 w-12 items-center justify-center rounded-full bg-black/40 text-white/80 hover:bg-black/60 hover:text-white hover:scale-105 active:scale-95 transition-all cursor-pointer border border-white/10"
            title="Next (→)"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}
    </div>
  );
}

// ── Document Text Viewer Subcomponent ────────────────────────────────────

function DocumentTextViewer({ file }: { file: FileItem }) {
  const [textContent, setTextContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(file.storage_path)
      .then(res => res.text())
      .then(text => setTextContent(text.slice(0, 50000))) // Cap at 50k chars
      .catch(() => setTextContent('Failed to load document content.'))
      .finally(() => setLoading(false));
  }, [file.id, file.storage_path]);

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center w-full h-full p-4">
      <div className="h-[70vh] w-[90vw] max-w-4xl rounded-2xl border border-white/10 bg-zinc-900/60 p-6 text-white overflow-auto">
        <div className="flex items-center gap-2 mb-4 text-xs font-bold text-amber-500">
          <FileText className="h-5 w-5" />
          <span>Document Preview</span>
        </div>
        <pre className="font-mono text-xs whitespace-pre-wrap leading-relaxed text-zinc-300">
          {textContent}
        </pre>
      </div>
    </div>
  );
}