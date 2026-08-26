"use client";
import React, { useEffect, useRef, useState } from "react";
import { Files, HardDrive, Star, Share2, TrendingUp, TrendingDown } from "lucide-react";

interface StatsBarProps {
  fileCount: number;
  used: number;
  limit: number;
  starredCount: number;
  sharedCount: number;
  loading: boolean;
}

function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const raf = useRef<number>(0);
  useEffect(() => {
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setValue(Math.floor(eased * target));
      if (progress < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return value;
}

function formatSize(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024, s = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + s[i];
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  ringValue,
  loading,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  color: string;
  ringValue?: number;
  loading: boolean;
}) {
  return (
    <div className={`relative overflow-hidden rounded-3xl border bg-white/70 dark:bg-zinc-950/60 backdrop-blur-md p-5 flex flex-col gap-3 hover:-translate-y-0.5 hover:shadow-xl transition-all duration-300 group
      ${color === "amber" ? "border-amber-500/20 dark:border-amber-500/10" : ""}
      ${color === "blue"  ? "border-blue-500/20  dark:border-blue-500/10"  : ""}
      ${color === "star"  ? "border-yellow-500/20 dark:border-yellow-500/10" : ""}
      ${color === "share" ? "border-purple-500/20 dark:border-purple-500/10" : ""}
      border-zinc-150/70 dark:border-zinc-900/50`}>

      {/* Background glow */}
      <div className={`absolute -top-4 -right-4 h-20 w-20 rounded-full opacity-10 blur-2xl
        ${color === "amber" ? "bg-amber-400" : ""}
        ${color === "blue"  ? "bg-blue-400"  : ""}
        ${color === "star"  ? "bg-yellow-400" : ""}
        ${color === "share" ? "bg-purple-400" : ""}`} />

      <div className="flex items-start justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl
          ${color === "amber" ? "bg-amber-500/10 text-amber-500" : ""}
          ${color === "blue"  ? "bg-blue-500/10  text-blue-500"  : ""}
          ${color === "star"  ? "bg-yellow-500/10 text-yellow-500" : ""}
          ${color === "share" ? "bg-purple-500/10 text-purple-500" : ""}`}>
          <Icon className="h-5 w-5" />
        </div>

        {ringValue !== undefined && (
          <div className="relative h-10 w-10">
            <svg className="h-10 w-10 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor"
                className="text-zinc-100 dark:text-zinc-800" strokeWidth="3" />
              <circle cx="18" cy="18" r="15.9" fill="none"
                stroke={color === "amber" ? "#f59e0b" : "#3b82f6"}
                strokeWidth="3"
                strokeDasharray={`${ringValue} ${100 - ringValue}`}
                strokeLinecap="round"
                style={{ transition: "stroke-dasharray 1s ease" }} />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[8px] font-black text-zinc-600 dark:text-zinc-400">
              {ringValue.toFixed(0)}%
            </span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          <div className="h-6 w-24 rounded-lg bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
          <div className="h-3 w-16 rounded-lg bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
        </div>
      ) : (
        <div>
          <p className="text-2xl font-black text-zinc-900 dark:text-white tabular-nums leading-none">{value}</p>
          {sub && <p className="mt-1 text-[11px] text-zinc-500 font-medium">{sub}</p>}
        </div>
      )}

      <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">{label}</p>
    </div>
  );
}

export default function StatsBar({ fileCount, used, limit, starredCount, sharedCount, loading }: StatsBarProps) {
  const animFiles   = useCountUp(fileCount,   1000);
  const animStarred = useCountUp(starredCount, 900);
  const animShared  = useCountUp(sharedCount,  950);
  const usedPct = Math.min(100, (used / limit) * 100);

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard
        icon={Files}
        label="Total Files"
        value={loading ? "—" : String(animFiles)}
        sub="across all folders"
        color="amber"
        loading={loading}
      />
      <StatCard
        icon={HardDrive}
        label="Storage Used"
        value={loading ? "—" : formatSize(used)}
        sub={`of ${formatSize(limit)} limit`}
        color="blue"
        ringValue={usedPct}
        loading={loading}
      />
      <StatCard
        icon={Star}
        label="Starred Files"
        value={loading ? "—" : String(animStarred)}
        sub="marked as favourite"
        color="star"
        loading={loading}
      />
      <StatCard
        icon={Share2}
        label="Shared Files"
        value={loading ? "—" : String(animShared)}
        sub="with active share links"
        color="share"
        loading={loading}
      />
    </div>
  );
}
