"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  EyeOff, Lock, Unlock, Eye, EyeClosed, ShieldCheck, KeyRound,
  Trash2, RotateCcw, FileText, Image, Music, Film, Archive, FileQuestion,
  AlertTriangle, CheckCircle2, X, Sparkles
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { fileService, FileItem } from "../services/fileService";
import FileViewer from "../components/FileViewer";

type Screen = "locked" | "setup" | "unlocked" | "changePin";

function FileIcon({ mime, category }: { mime: string; category: FileItem["file_category"] }) {
  const cls = "h-8 w-8";
  if (category === "photo")    return <Image   className={`${cls} text-blue-400`} />;
  if (category === "video")    return <Film    className={`${cls} text-rose-400`} />;
  if (category === "audio")    return <Music   className={`${cls} text-emerald-400`} />;
  if (category === "document") return <FileText className={`${cls} text-amber-400`} />;
  if (category === "archive")  return <Archive  className={`${cls} text-purple-400`} />;
  return <FileQuestion className={`${cls} text-zinc-400`} />;
}

export default function HiddenFiles() {
  const { user } = useAuth();

  const [screen, setScreen]           = useState<Screen>("locked");
  const [pin, setPin]                 = useState("");
  const [pinConfirm, setPinConfirm]   = useState("");
  const [oldPin, setOldPin]           = useState("");
  const [showPin, setShowPin]         = useState(false);
  const [pinError, setPinError]       = useState("");
  const [pinSuccess, setPinSuccess]   = useState("");

  const [files, setFiles]             = useState<FileItem[]>([]);
  const [loading, setLoading]         = useState(false);
  const [preview, setPreview]         = useState<FileItem | null>(null);

  // Determine initial screen
  useEffect(() => {
    if (!user) return;
    const hasPin = fileService.hasHiddenPassword(user.id);
    setScreen(hasPin ? "locked" : "setup");
  }, [user]);

  // Load hidden files once unlocked
  const loadFiles = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const list = await fileService.getHiddenFiles(user.id);
      setFiles(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (screen === "unlocked") loadFiles();
  }, [screen, loadFiles]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSetupPin = () => {
    if (!user) return;
    setPinError("");
    if (pin.length < 4) { setPinError("PIN must be at least 4 characters."); return; }
    if (pin !== pinConfirm) { setPinError("PINs do not match."); return; }
    fileService.setHiddenPassword(user.id, pin);
    setPinSuccess("PIN set successfully! Your vault is ready.");
    setTimeout(() => { setPinSuccess(""); setScreen("locked"); setPin(""); setPinConfirm(""); }, 1500);
  };

  const handleUnlock = () => {
    if (!user) return;
    setPinError("");
    if (!fileService.verifyHiddenPassword(user.id, pin)) {
      setPinError("Incorrect PIN. Try again.");
      setPin("");
      return;
    }
    setPin("");
    setScreen("unlocked");
  };

  const handleLock = () => {
    setScreen("locked");
    setFiles([]);
    setPin("");
  };

  const handleChangePin = () => {
    if (!user) return;
    setPinError("");
    if (pin.length < 4) { setPinError("New PIN must be at least 4 characters."); return; }
    if (pin !== pinConfirm) { setPinError("PINs do not match."); return; }
    const ok = fileService.setHiddenPassword(user.id, pin, oldPin);
    if (!ok) { setPinError("Current PIN is incorrect."); return; }
    setPinSuccess("PIN changed successfully!");
    setTimeout(() => { setPinSuccess(""); setOldPin(""); setPin(""); setPinConfirm(""); setScreen("unlocked"); }, 1500);
  };

  const handleUnhide = async (file: FileItem) => {
    if (!user) return;
    await fileService.unhideFile(user.id, file.id);
    loadFiles();
  };

  // ── Render helpers ────────────────────────────────────────────────────────

  const PinInput = ({ value, onChange, placeholder = "Enter PIN", autoFocus = false }: {
    value: string; onChange: (v: string) => void; placeholder?: string; autoFocus?: boolean;
  }) => (
    <div className="relative">
      <input
        type={showPin ? "text" : "password"}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => e.key === "Enter" && (screen === "locked" ? handleUnlock() : undefined)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        maxLength={20}
        className="w-full rounded-2xl border border-zinc-700/60 bg-zinc-900/80 px-4 py-3 pr-12 text-sm font-mono text-white placeholder-zinc-600 outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 transition-all"
      />
      <button
        type="button"
        onClick={() => setShowPin(p => !p)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );

  // ── LOCKED SCREEN ─────────────────────────────────────────────────────────
  if (screen === "locked") return (
    <div className="flex min-h-[70vh] items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Vault icon */}
        <div className="flex flex-col items-center gap-5 mb-8">
          <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/50 shadow-2xl">
            <Lock className="h-10 w-10 text-amber-400" />
            <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-amber-500 border-2 border-zinc-950 animate-pulse" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-black text-white tracking-tight">Private Vault</h1>
            <p className="mt-1 text-xs text-zinc-500 font-medium">Enter your PIN to access hidden files</p>
          </div>
        </div>

        {/* PIN field */}
        <div className="space-y-3">
          <PinInput value={pin} onChange={setPin} placeholder="Enter your vault PIN" autoFocus />

          {pinError && (
            <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-2">
              <AlertTriangle className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />
              <p className="text-xs text-red-400 font-medium">{pinError}</p>
            </div>
          )}

          <button
            onClick={handleUnlock}
            className="w-full rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 py-3 text-sm font-black text-slate-950 shadow-lg hover:shadow-amber-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <span className="flex items-center justify-center gap-2">
              <Unlock className="h-4 w-4" />
              Unlock Vault
            </span>
          </button>
        </div>

        <p className="mt-6 text-center text-[10px] text-zinc-700 font-medium">
          PIN is stored locally on this device only.
        </p>
      </div>
    </div>
  );

  // ── SETUP SCREEN ──────────────────────────────────────────────────────────
  if (screen === "setup") return (
    <div className="flex min-h-[70vh] items-center justify-center p-4">
      <div className="w-full max-w-sm">

        <div className="flex flex-col items-center gap-5 mb-8">
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-500/20 to-yellow-500/10 border border-amber-500/30 shadow-2xl">
            <KeyRound className="h-10 w-10 text-amber-400" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-black text-white tracking-tight">Set Up Your Vault</h1>
            <p className="mt-1 text-xs text-zinc-500 font-medium">Create a PIN to protect your hidden files</p>
          </div>
        </div>

        <div className="space-y-3">
          <PinInput value={pin} onChange={setPin} placeholder="Create a PIN (min 4 chars)" autoFocus />
          <PinInput value={pinConfirm} onChange={setPinConfirm} placeholder="Confirm your PIN" />

          {pinError && (
            <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-2">
              <AlertTriangle className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />
              <p className="text-xs text-red-400 font-medium">{pinError}</p>
            </div>
          )}
          {pinSuccess && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
              <p className="text-xs text-emerald-400 font-medium">{pinSuccess}</p>
            </div>
          )}

          <button
            onClick={handleSetupPin}
            className="w-full rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 py-3 text-sm font-black text-slate-950 shadow-lg hover:shadow-amber-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <span className="flex items-center justify-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Create Vault PIN
            </span>
          </button>
        </div>

        <div className="mt-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/50 p-4">
          <p className="text-[10px] text-zinc-500 leading-relaxed font-medium">
            <span className="text-amber-500">⚠️ Remember your PIN.</span> It cannot be recovered — it is stored as a hash on this device only. If forgotten, you will need to reset the vault.
          </p>
        </div>
      </div>
    </div>
  );

  // ── CHANGE PIN SCREEN ─────────────────────────────────────────────────────
  if (screen === "changePin") return (
    <div className="flex min-h-[70vh] items-center justify-center p-4">
      <div className="w-full max-w-sm">

        <div className="flex flex-col items-center gap-5 mb-8">
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-500/20 to-indigo-500/10 border border-violet-500/30 shadow-2xl">
            <KeyRound className="h-10 w-10 text-violet-400" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-black text-white tracking-tight">Change Vault PIN</h1>
            <p className="mt-1 text-xs text-zinc-500 font-medium">Enter your current PIN then choose a new one</p>
          </div>
        </div>

        <div className="space-y-3">
          <PinInput value={oldPin} onChange={setOldPin} placeholder="Current PIN" autoFocus />
          <PinInput value={pin} onChange={setPin} placeholder="New PIN (min 4 chars)" />
          <PinInput value={pinConfirm} onChange={setPinConfirm} placeholder="Confirm new PIN" />

          {pinError && (
            <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-2">
              <AlertTriangle className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />
              <p className="text-xs text-red-400 font-medium">{pinError}</p>
            </div>
          )}
          {pinSuccess && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
              <p className="text-xs text-emerald-400 font-medium">{pinSuccess}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => { setScreen("unlocked"); setOldPin(""); setPin(""); setPinConfirm(""); setPinError(""); }}
              className="flex-1 rounded-2xl border border-zinc-700/50 bg-zinc-900/60 py-3 text-xs font-black text-zinc-400 hover:text-white hover:border-zinc-600 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleChangePin}
              className="flex-1 rounded-2xl bg-gradient-to-r from-violet-500 to-indigo-500 py-3 text-sm font-black text-white shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Update PIN
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ── UNLOCKED SCREEN ───────────────────────────────────────────────────────
  const formatSize = (b: number) => {
    if (b === 0) return "0 B";
    const k = 1024, s = ["B","KB","MB","GB"];
    const i = Math.floor(Math.log(b) / Math.log(k));
    return `${parseFloat((b / Math.pow(k, i)).toFixed(1))} ${s[i]}`;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 space-y-6">

      {/* File preview overlay */}
      {preview && (
        <FileViewer
          file={preview}
          allFiles={files}
          onClose={() => setPreview(null)}
        />
      )}

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/50">
            <EyeOff className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2">
              Private Vault
              <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block" />
                Unlocked
              </span>
            </h1>
            <p className="text-xs text-zinc-500 font-medium mt-0.5">{files.length} hidden file{files.length !== 1 ? "s" : ""}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setScreen("changePin")}
            className="flex items-center gap-1.5 rounded-2xl border border-zinc-700/50 bg-zinc-900/40 dark:bg-zinc-900/60 px-3 py-2 text-xs font-black text-zinc-400 hover:text-white hover:border-zinc-600 transition-all cursor-pointer"
          >
            <KeyRound className="h-3.5 w-3.5" />
            Change PIN
          </button>
          <button
            onClick={handleLock}
            className="flex items-center gap-1.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-xs font-black text-amber-500 hover:bg-amber-500/20 transition-all cursor-pointer"
          >
            <Lock className="h-3.5 w-3.5" />
            Lock Vault
          </button>
        </div>
      </div>

      {/* Info banner */}
      <div className="rounded-3xl border border-zinc-200/50 dark:border-zinc-800/50 bg-gradient-to-r from-zinc-100/60 to-zinc-50/60 dark:from-zinc-900/60 dark:to-zinc-950/60 p-4 flex items-start gap-3">
        <Sparkles className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
          Hidden files are <span className="font-black text-zinc-900 dark:text-white">invisible</span> in your regular file manager and photos view. To hide a file, open <strong>My Files</strong>, right-click a file and choose <em>"Hide in Vault"</em>. Files remain in local storage — only their visibility is toggled.
        </p>
      </div>

      {/* File grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[1,2,3,4,5,6].map(n => (
            <div key={n} className="aspect-square rounded-3xl bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
          ))}
        </div>
      ) : files.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-6">
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50">
            <EyeOff className="h-10 w-10 text-zinc-400" />
          </div>
          <div className="text-center">
            <h3 className="text-base font-black text-zinc-900 dark:text-white">Vault is Empty</h3>
            <p className="mt-1.5 text-xs text-zinc-500 max-w-xs leading-relaxed">
              No hidden files yet. Go to <strong>My Files</strong>, open the context menu on any file, and choose <em>"Hide in Vault"</em>.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {files.map(file => {
            const thumbUrl = (file as any).objectUrl as string | undefined;
            const isImage = file.file_category === "photo";
            return (
              <div
                key={file.id}
                className="group relative overflow-hidden rounded-3xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/80 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
              >
                {/* Thumbnail or icon */}
                <div
                  className="aspect-square flex items-center justify-center cursor-pointer bg-zinc-50 dark:bg-zinc-900/50 overflow-hidden"
                  onClick={() => setPreview(file)}
                >
                  {isImage && thumbUrl ? (
                    <img src={thumbUrl} alt={file.filename} className="h-full w-full object-cover" />
                  ) : (
                    <FileIcon mime={file.mime_type} category={file.file_category} />
                  )}

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-zinc-950/0 group-hover:bg-zinc-950/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Eye className="h-6 w-6 text-white drop-shadow" />
                  </div>
                </div>

                {/* Meta */}
                <div className="p-3 border-t border-zinc-100/80 dark:border-zinc-800/60">
                  <p className="text-[10px] font-bold text-zinc-900 dark:text-white truncate leading-snug">{file.filename}</p>
                  <p className="text-[9px] text-zinc-400 mt-0.5 font-medium">{formatSize(file.size)}</p>
                </div>

                {/* Unhide button — shown on hover */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    title="Restore to My Files"
                    onClick={e => { e.stopPropagation(); handleUnhide(file); }}
                    className="flex items-center gap-1 rounded-xl bg-zinc-950/80 backdrop-blur px-2 py-1 text-[9px] font-black text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all border border-zinc-700/50 cursor-pointer"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Unhide
                  </button>
                </div>

                {/* Hidden badge */}
                <div className="absolute top-2 left-2">
                  <span className="flex items-center gap-0.5 rounded-lg bg-zinc-950/70 backdrop-blur px-1.5 py-0.5 text-[8px] font-black text-amber-400">
                    <EyeOff className="h-2.5 w-2.5" />
                    Hidden
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
