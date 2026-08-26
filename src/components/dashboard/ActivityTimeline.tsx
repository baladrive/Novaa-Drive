"use client";
import React, { useMemo } from "react";
import { Activity, Upload, Trash2, Share2, EyeOff, Star, RotateCcw, FolderPlus } from "lucide-react";

interface Log {
  id: string;
  action: string;
  details: string;
  created_at: string;
}

interface ActivityTimelineProps {
  logs: Log[];
  loading: boolean;
}

function getActionStyle(action: string): { icon: React.ElementType; color: string; bg: string } {
  const a = action.toLowerCase();
  if (a.includes("upload"))  return { icon: Upload,      color: "text-blue-500",    bg: "bg-blue-500/10" };
  if (a.includes("trash") || a.includes("delete")) 
                             return { icon: Trash2,       color: "text-red-500",     bg: "bg-red-500/10" };
  if (a.includes("share"))   return { icon: Share2,       color: "text-purple-500",  bg: "bg-purple-500/10" };
  if (a.includes("hide"))    return { icon: EyeOff,       color: "text-zinc-500",    bg: "bg-zinc-500/10" };
  if (a.includes("star"))    return { icon: Star,         color: "text-yellow-500",  bg: "bg-yellow-500/10" };
  if (a.includes("restore")) return { icon: RotateCcw,    color: "text-emerald-500", bg: "bg-emerald-500/10" };
  if (a.includes("folder"))  return { icon: FolderPlus,   color: "text-amber-500",   bg: "bg-amber-500/10" };
  return                            { icon: Activity,      color: "text-zinc-400",    bg: "bg-zinc-400/10" };
}

function groupByDay(logs: Log[]) {
  const today    = new Date(); today.setHours(0,0,0,0);
  const yester   = new Date(today); yester.setDate(yester.getDate() - 1);

  const groups: Record<string, Log[]> = {};
  logs.forEach(log => {
    const d = new Date(log.created_at); d.setHours(0,0,0,0);
    let label = d >= today   ? "Today"
              : d >= yester  ? "Yesterday"
              : d.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
    if (!groups[label]) groups[label] = [];
    groups[label].push(log);
  });
  return groups;
}

export default function ActivityTimeline({ logs, loading }: ActivityTimelineProps) {
  const grouped = useMemo(() => groupByDay(logs), [logs]);
  const groupKeys = Object.keys(grouped);

  return (
    <div className="rounded-3xl border border-zinc-150/70 bg-white/70 dark:border-zinc-900/50 dark:bg-zinc-950/60 backdrop-blur-md p-6 flex flex-col gap-4">
      <h3 className="text-xs font-black text-zinc-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
        <Activity className="h-4 w-4 text-amber-500" />
        Activity Timeline
      </h3>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(n => (
            <div key={n} className="flex gap-3 items-start">
              <div className="h-7 w-7 rounded-xl bg-zinc-100 dark:bg-zinc-900 animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-48 rounded bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
                <div className="h-2.5 w-24 rounded bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center py-8 gap-2">
          <Activity className="h-8 w-8 text-zinc-300 dark:text-zinc-700" />
          <p className="text-xs text-zinc-400 font-medium">No activity recorded yet.</p>
        </div>
      ) : (
        <div className="relative space-y-4 max-h-80 overflow-y-auto pr-1">
          {/* Vertical line */}
          <div className="absolute left-3.5 top-0 bottom-0 w-px bg-zinc-100 dark:bg-zinc-800" />

          {groupKeys.map(group => (
            <div key={group}>
              <p className="text-[9px] font-black uppercase tracking-wider text-zinc-400 ml-10 mb-2">{group}</p>
              {grouped[group].map(log => {
                const { icon: Icon, color, bg } = getActionStyle(log.action);
                const time = new Date(log.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                return (
                  <div key={log.id} className="flex items-start gap-3 mb-3 relative">
                    <div className={`relative z-10 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-xl ${bg}`}>
                      <Icon className={`h-3.5 w-3.5 ${color}`} />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 leading-snug break-words">{log.details}</p>
                      <span className="text-[9px] text-zinc-400 font-bold">{time}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
