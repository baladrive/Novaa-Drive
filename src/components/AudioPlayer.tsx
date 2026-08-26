"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Play, Pause, SkipBack, SkipForward, Volume2, Volume1, VolumeX,
  List, Shuffle, Repeat, Download, MoreHorizontal,
  Clock, Music,
} from "lucide-react";

interface AudioPlayerProps {
  src: string;
  title?: string;
  artist?: string;
  artwork?: string;
  onDownload?: () => void;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function AudioPlayer({ src, title, artist, artwork, onDownload }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [rate, setRate] = useState(1);
  const [showVolume, setShowVolume] = useState(false);
  const [buffered, setBuffered] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setProgress(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration);
    const handleEnded = () => setPlaying(false);
    const handleProgress = () => {
      if (audio.buffered.length > 0) {
        setBuffered(audio.buffered.end(audio.buffered.length - 1));
      }
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("durationchange", handleDurationChange);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("progress", handleProgress);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("durationchange", handleDurationChange);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("progress", handleProgress);
    };
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play();
    }
    setPlaying(!playing);
  }, [playing]);

  const handleSeek = useCallback((e: React.MouseEvent) => {
    const audio = audioRef.current;
    if (!audio || !progressRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audio.currentTime = percent * duration;
    setProgress(percent * duration);
  }, [duration]);

  const handleVolumeChange = useCallback((e: React.MouseEvent) => {
    const audio = audioRef.current;
    if (!audio || !e.currentTarget) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientY - rect.bottom) / -rect.height));
    audio.volume = percent;
    setVolume(percent);
    setMuted(percent === 0);
  }, []);

  const skipForward = () => {
    if (audioRef.current) audioRef.current.currentTime += 10;
  };

  const skipBackward = () => {
    if (audioRef.current) audioRef.current.currentTime -= 10;
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !muted;
      setMuted(!muted);
    }
  };

  const VolumeIcon = volume === 0 || muted ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <div className="flex items-center gap-4 rounded-2xl bg-white/[0.03] p-4 backdrop-blur-xl">
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Artwork */}
      {artwork ? (
        <img src={artwork} alt={title} className="h-16 w-16 rounded-lg object-cover shadow-lg" />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500/20 to-cyan-500/20">
          <Music className="h-8 w-8 text-purple-400" />
        </div>
      )}

      {/* Track Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-white truncate">{title || "Unknown Track"}</p>
        <p className="text-sm text-white/40 truncate">{artist || "Unknown Artist"}</p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={skipBackward}
          className="rounded-lg p-2 text-white/40 hover:bg-white/[0.06] hover:text-white transition-colors"
        >
          <SkipBack className="h-4 w-4" />
        </button>

        <button
          onClick={togglePlay}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 text-white shadow-lg shadow-purple-500/20 transition-transform hover:scale-105"
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>

        <button
          onClick={skipForward}
          className="rounded-lg p-2 text-white/40 hover:bg-white/[0.06] hover:text-white transition-colors"
        >
          <SkipForward className="h-4 w-4" />
        </button>

        {/* Progress Bar */}
        <div
          ref={progressRef}
          onClick={handleSeek}
          className="relative h-1.5 w-32 cursor-pointer rounded-full bg-white/[0.06]"
        >
          <div
            className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500"
            style={{ width: `${(progress / duration) * 100}%`, opacity: 0.5 }}
          />
          <div
            className="h-full rounded-full bg-purple-400"
            style={{ width: `${(progress / duration) * 100}%` }}
          />
          <div
            className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
            style={{ left: `${(progress / duration) * 100}%` }}
          />
        </div>

        {/* Time */}
        <span className="text-xs text-white/30 w-16 text-right">
          {formatTime(progress)} / {formatTime(duration)}
        </span>

        {/* Volume */}
        <div
          className="relative cursor-pointer p-2 text-white/40 hover:text-white transition-colors"
          onMouseEnter={() => setShowVolume(true)}
          onMouseLeave={() => setShowVolume(false)}
        >
          <VolumeIcon className="h-4 w-4" />
          {showVolume && (
            <div
              className="absolute bottom-10 right-0 h-24 w-2.5 cursor-pointer rounded-full bg-white/[0.06]"
              onClick={handleVolumeChange}
            >
              <div
                className="w-full rounded-full bg-gradient-to-t from-purple-500 to-cyan-500"
                style={{ height: `${volume * 100}%` }}
              />
            </div>
          )}
        </div>

        {/* Download */}
        {onDownload && (
          <button
            onClick={onDownload}
            className="rounded-lg p-2 text-white/40 hover:bg-white/[0.06] hover:text-white transition-colors"
          >
            <Download className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
