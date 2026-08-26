"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Music, Play, Pause, SkipForward, SkipBack, Disc } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { fileService, FileItem } from "../services/fileService";
import { sanitizeLog } from "../utils/sanitize";

export default function MusicPage() {
  const { user } = useAuth();
  const [tracks, setTracks] = useState<FileItem[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [loading, setLoading] = useState(true);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchTracks = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const allFiles = await fileService.getFiles(user.id, null);
      const audioFiles = allFiles.filter(f => f.file_category === "audio");
      setTracks(audioFiles);
    } catch (err) {
      console.error("Error loading music room:", sanitizeLog(err));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTracks();
  }, [user, fetchTracks]);

  // Audio Playback Listeners
  const playTrack = (index: number) => {
    setCurrentTrackIndex(index);
    setIsPlaying(true);
    
    // Tiny delay to let browser buffer new source
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.play().catch(e => console.warn(sanitizeLog(e)));
      }
    }, 50);
  };

  const togglePlayback = () => {
    if (!audioRef.current || currentTrackIndex === null) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => console.warn(sanitizeLog(e)));
    }
    setIsPlaying(!isPlaying);
  };

  const handleNextTrack = () => {
    if (tracks.length === 0 || currentTrackIndex === null) return;
    const nextIdx = (currentTrackIndex + 1) % tracks.length;
    playTrack(nextIdx);
  };

  const handlePrevTrack = () => {
    if (tracks.length === 0 || currentTrackIndex === null) return;
    const prevIdx = (currentTrackIndex - 1 + tracks.length) % tracks.length;
    playTrack(prevIdx);
  };

  const onTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const onLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const currentTrack = currentTrackIndex !== null ? tracks[currentTrackIndex] : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 space-y-6">
      
      {/* Title */}
      <div className="border-b border-zinc-150/50 pb-4 dark:border-zinc-900/40">
        <h1 className="text-xl font-black text-zinc-900 dark:text-white">Music & Playlists</h1>
        <p className="text-xs text-zinc-555 dark:text-zinc-400 mt-1">
          Listen to your audio uploads and organize tracks directly in the browser.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-3 border-amber-500 border-t-transparent" />
          <p className="text-xs text-zinc-500 font-bold">Scanning playlists...</p>
        </div>
      ) : tracks.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-20 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl">
          <Music className="h-12 w-12 text-zinc-350 dark:text-zinc-550" />
          <h3 className="mt-4 text-sm font-extrabold text-zinc-850 dark:text-white">No audio tracks found</h3>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 max-w-xs leading-relaxed">
            Upload MP3, WAV, or M4A music files inside My Files folder to populate your local media library.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          
          {/* Track List */}
          <div className="lg:col-span-2 rounded-3xl border border-zinc-150/70 bg-white/70 p-6 backdrop-blur-md dark:border-zinc-900/50 dark:bg-zinc-950/60 space-y-4">
            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-wider mb-2">Track Playlist</h3>
            
            <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
              {tracks.map((track, idx) => {
                const isActive = currentTrackIndex === idx;
                return (
                  <div
                    key={track.id}
                    onClick={() => playTrack(idx)}
                    className={`flex items-center justify-between py-3 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40 rounded-xl px-2.5 -mx-2.5 cursor-pointer transition-colors select-none
                      ${isActive ? "bg-amber-500/5 dark:bg-amber-500/10 text-amber-500" : ""}`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-zinc-50 dark:bg-zinc-900
                        ${isActive ? "text-amber-500" : "text-zinc-450"}`}>
                        <Music className="h-4.5 w-4.5" />
                      </div>
                      <div className="overflow-hidden">
                        <p className={`truncate text-xs font-bold ${isActive ? "text-amber-500" : "text-zinc-800 dark:text-zinc-200"}`}>
                          {track.filename}
                        </p>
                        <span className="text-[9px] text-zinc-400 font-semibold block mt-0.5">{formatSize(track.size)}</span>
                      </div>
                    </div>

                    {isActive && isPlaying && (
                      <div className="flex items-center gap-0.5 pr-2">
                        <span className="h-3 w-0.5 bg-amber-500 animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <span className="h-4 w-0.5 bg-amber-500 animate-bounce" style={{ animationDelay: '0.3s' }} />
                        <span className="h-2.5 w-0.5 bg-amber-500 animate-bounce" style={{ animationDelay: '0.5s' }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Central Vinyl Spinner and Control panel */}
          <div className="rounded-3xl border border-zinc-150/70 bg-white/70 p-6 backdrop-blur-md dark:border-zinc-900/50 dark:bg-zinc-950/60 flex flex-col items-center justify-center text-center">
            
            {/* Spinning disc */}
            <div className="relative mb-6">
              <div className={`flex h-40 w-40 items-center justify-center rounded-full bg-zinc-900 shadow-2xl border-4 border-zinc-800 dark:border-zinc-950
                ${isPlaying ? "animate-spin-slow" : ""}`}>
                <Disc className={`h-12 w-12 text-zinc-600 ${isPlaying ? "animate-pulse" : ""}`} />
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full bg-white dark:bg-zinc-950" />
            </div>

            {currentTrack ? (
              <div className="w-full space-y-4">
                <h4 className="font-extrabold text-sm text-zinc-900 dark:text-white truncate px-4">{currentTrack.filename}</h4>
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Now Playing</p>

                {/* Audio Element */}
                <audio
                  ref={audioRef}
                  src={currentTrack.storage_path}
                  onTimeUpdate={onTimeUpdate}
                  onLoadedMetadata={onLoadedMetadata}
                  onEnded={handleNextTrack}
                />

                {/* Range Seek bar */}
                <div className="flex items-center gap-3 pt-4">
                  <span className="text-[10px] font-bold text-zinc-400 w-10 text-left">{formatTime(currentTime)}</span>
                  <input
                    type="range"
                    min="0"
                    max={duration || 100}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <span className="text-[10px] font-bold text-zinc-400 w-10 text-right">{formatTime(duration)}</span>
                </div>

                {/* Play controls */}
                <div className="flex items-center justify-center gap-6 pt-4">
                  <button onClick={handlePrevTrack} className="rounded-full p-2 text-zinc-450 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 cursor-pointer">
                    <SkipBack className="h-5 w-5" />
                  </button>

                  <button
                    onClick={togglePlayback}
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 fill-current ml-0.5" />}
                  </button>

                  <button onClick={handleNextTrack} className="rounded-full p-2 text-zinc-450 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 cursor-pointer">
                    <SkipForward className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-8 text-zinc-400">
                <Music className="h-10 w-10 mx-auto text-zinc-300 mb-3" />
                <p className="text-xs font-bold">Select a song to start listening</p>
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
