import React from "react";
import { X, Check, Loader2, Image as ImageIcon } from "lucide-react";

export interface UploadTask {
  id: string;
  name: string;
  size: number;
  progress: number; // 0 to 100
  status: "compressing" | "uploading" | "completed" | "failed";
  error?: string;
}

interface UploadZoneProps {
  tasks: UploadTask[];
  onClearTask: (taskId: string) => void;
  onClose: () => void;
}

export default function UploadZone({ tasks, onClearTask, onClose }: UploadZoneProps) {
  if (tasks.length === 0) return null;

  const completedCount = tasks.filter(t => t.status === "completed").length;
  const activeCount = tasks.filter(t => t.status === "compressing" || t.status === "uploading").length;

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div className="fixed bottom-5 right-5 z-[90] w-80 overflow-hidden rounded-2xl border border-zinc-150 bg-white shadow-2xl transition-all dark:border-zinc-850 dark:bg-zinc-900">
      
      {/* Header */}
      <div className="flex items-center justify-between bg-zinc-900 px-4 py-3 text-white dark:bg-zinc-950">
        <div className="flex items-center gap-2">
          {activeCount > 0 ? (
            <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
          ) : (
            <Check className="h-4 w-4 text-emerald-500" />
          )}
          <span className="text-xs font-bold">
            {activeCount > 0 
              ? `Uploading ${activeCount} item${activeCount > 1 ? "s" : ""}` 
              : `Uploaded ${completedCount} item${completedCount > 1 ? "s" : ""}`}
          </span>
        </div>
        <button 
          onClick={onClose}
          className="rounded-full p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Task List */}
      <div className="max-h-60 overflow-y-auto divide-y divide-zinc-100 p-2 dark:divide-zinc-800">
        {tasks.map((task) => (
          <div key={task.id} className="flex items-center justify-between gap-3 p-2 text-xs">
            <div className="flex items-center gap-2 overflow-hidden flex-1">
              <div className="rounded-lg bg-zinc-50 p-1.5 dark:bg-zinc-800 flex-shrink-0">
                <ImageIcon className="h-4 w-4 text-zinc-550 dark:text-zinc-400" />
              </div>
              <div className="overflow-hidden flex-1">
                <p className="truncate font-semibold text-zinc-800 dark:text-zinc-200" title={task.name}>
                  {task.name}
                </p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                  {formatSize(task.size)} • {" "}
                  <span className={`font-bold capitalize
                    ${task.status === "completed" ? "text-emerald-600 dark:text-emerald-500" : ""}
                    ${task.status === "compressing" ? "text-amber-500" : ""}
                    ${task.status === "failed" ? "text-red-500" : ""}
                    ${task.status === "uploading" ? "text-blue-500" : ""}
                  `}>
                    {task.status}
                  </span>
                </p>
              </div>
            </div>

            {/* Status Icons or Progress */}
            <div className="flex items-center gap-1">
              {task.status === "completed" && (
                <div className="rounded-full bg-emerald-50 p-1 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400">
                  <Check className="h-3.5 w-3.5" />
                </div>
              )}
              {task.status === "failed" && (
                <div className="rounded-full bg-red-50 p-1 text-red-600 dark:bg-red-950/20 dark:text-red-400" title={task.error}>
                  <X className="h-3.5 w-3.5" />
                </div>
              )}
              {(task.status === "compressing" || task.status === "uploading") && (
                <span className="font-mono text-[10px] font-bold text-zinc-400">
                  {task.progress}%
                </span>
              )}
              <button 
                onClick={() => onClearTask(task.id)}
                className="rounded-full p-1 text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
