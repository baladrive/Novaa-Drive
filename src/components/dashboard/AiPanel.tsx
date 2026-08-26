"use client";
import React, { useMemo } from "react";
import { Sparkles, FileText, Image, Music, Film, Archive, FileQuestion, Tag, Lightbulb } from "lucide-react";
import { FileItem } from "../../services/fileService";

interface AiPanelProps {
  files: FileItem[];
  isAiMode: boolean;
  aiSuggestion: { text: string; actionLabel: string; actionPath: string };
  onAiAction: () => void;
}

function FileIcon({ cat }: { cat: FileItem["file_category"] }) {
  const cls = "h-3.5 w-3.5";
  if (cat === "photo")    return <Image    className={`${cls} text-blue-400`} />;
  if (cat === "video")    return <Film     className={`${cls} text-rose-400`} />;
  if (cat === "audio")    return <Music    className={`${cls} text-emerald-400`} />;
  if (cat === "document") return <FileText className={`${cls} text-amber-400`} />;
  if (cat === "archive")  return <Archive  className={`${cls} text-purple-400`} />;
  return <FileQuestion className={`${cls} text-zinc-400`} />;
}

export default function AiPanel({ files, isAiMode, aiSuggestion, onAiAction }: AiPanelProps) {
  // Smart collections: group files by shared non-AI tag
  const collections = useMemo(() => {
    const map: Record<string, FileItem[]> = {};
    files.forEach(f => {
      f.tags.filter(t => t !== "AI Classified").forEach(tag => {
        if (!map[tag]) map[tag] = [];
        map[tag].push(f);
      });
    });
    return Object.entries(map)
      .filter(([, items]) => items.length >= 1)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 5);
  }, [files]);

  // AI recommended: highest tagged files (most tags = highest match)
  const recommended = useMemo(() =>
    [...files]
      .filter(f => f.tags.length > 1)
      .sort((a, b) => b.tags.length - a.tags.length)
      .slice(0, 4),
    [files]
  );

  return (
    <div className="rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-yellow-500/3 dark:border-amber-500/10 dark:from-amber-500/5 dark:to-zinc-950/80 backdrop-blur-md p-6 flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 shadow-md">
          <Sparkles className="h-4 w-4 text-slate-950 animate-pulse" />
        </div>
        <div>
          <h3 className="text-xs font-black text-zinc-800 dark:text-white">AI Assistant</h3>
          <p className="text-[9px] text-zinc-500">Powered by Gemini 2.0 Flash</p>
        </div>
        <span className={`ml-auto rounded-full border px-2 py-0.5 text-[8px] font-black uppercase tracking-wider
          ${isAiMode ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500" : "border-zinc-300 bg-zinc-100 text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900"}`}>
          {isAiMode ? "● Active" : "○ Paused"}
        </span>
      </div>

      {/* Copilot insight card */}
      <div className="rounded-2xl border border-amber-500/15 bg-amber-500/5 p-4 flex items-start gap-3">
        <Lightbulb className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5 animate-pulse" />
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-zinc-700 dark:text-zinc-300 leading-relaxed">{aiSuggestion.text}</p>
          <button
            onClick={onAiAction}
            className="mt-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
          >
            {aiSuggestion.actionLabel}
          </button>
        </div>
      </div>

      {/* AI Recommended files */}
      {recommended.length > 0 && (
        <div className="space-y-2">
          <p className="text-[9px] font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1">
            <Sparkles className="h-2.5 w-2.5 text-amber-500" /> AI Recommended
          </p>
          <div className="grid grid-cols-2 gap-2">
            {recommended.map(file => (
              <div key={file.id}
                className="flex items-center gap-2 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/40 p-2.5 hover:border-amber-500/30 transition-all cursor-pointer">
                <FileIcon cat={file.file_category} />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-zinc-800 dark:text-zinc-200 truncate">{file.filename}</p>
                  <p className="text-[8px] text-zinc-400">{file.tags.length} tags</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Smart Collections */}
      {collections.length > 0 && (
        <div className="space-y-2">
          <p className="text-[9px] font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1">
            <Tag className="h-2.5 w-2.5 text-amber-500" /> Smart Collections
          </p>
          <div className="flex flex-wrap gap-2">
            {collections.map(([tag, items]) => (
              <span key={tag}
                className="flex items-center gap-1.5 rounded-xl border border-amber-500/20 bg-amber-500/5 px-2.5 py-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 cursor-pointer hover:bg-amber-500/10 transition-all">
                #{tag}
                <span className="rounded-full bg-amber-500/20 px-1 text-[8px] font-black">{items.length}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {files.length === 0 && !isAiMode && (
        <div className="text-center py-4">
          <p className="text-xs text-zinc-400 font-medium">Enable AI Mode in Settings to unlock recommendations.</p>
        </div>
      )}
    </div>
  );
}
