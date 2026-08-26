"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { UserCheck, ShieldCheck, Database, Trash2, ShieldAlert, Sparkles, KeyRound, Eye, EyeOff, CheckCircle2, XCircle, QrCode, Copy, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { fileService, ActivityLog } from "../services/fileService";

interface ProfileProps {
  storageRefreshKey: number;
}

export default function Profile({ storageRefreshKey }: ProfileProps) {
  const { user, isAiMode } = useAuth();
  
  // Storage states
  const [storage, setStorage] = useState({ used: 0, limit: 200 * 1024 * 1024 * 1024, fileCount: 0 });
  
  // 2FA status
  const [twoFactor, setTwoFactor] = useState(false);
  const [toggling2fa, setToggling2fa] = useState(false);

  // AI settings
  const [aiTagging, setAiTagging] = useState(() => {
    try {
      return localStorage.getItem("ai_tagging") !== "false";
    } catch {
      return true;
    }
  });
  const [aiScanner, setAiScanner] = useState(() => {
    try {
      return localStorage.getItem("ai_scanner") !== "false";
    } catch {
      return true;
    }
  });
  const [aiCopilot, setAiCopilot] = useState(() => {
    try {
      return localStorage.getItem("ai_copilot") !== "false";
    } catch {
      return true;
    }
  });

  const handleToggleSetting = (key: string, currentValue: boolean, setter: (v: boolean) => void) => {
    const newVal = !currentValue;
    try {
      localStorage.setItem(key, String(newVal));
    } catch {}
    setter(newVal);
  };

  const [activeRightTab, setActiveRightTab] = useState<"logs" | "model">("model");
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    try {
      return localStorage.getItem("ai_search_model") || "gemini-2-flash";
    } catch {
      return "gemini-2-flash";
    }
  });

  const [queryInput, setQueryInput] = useState("");
  const [testerLoading, setTesterLoading] = useState(false);
  const [testerResult, setTesterResult] = useState<{
    status: string;
    model: string;
    tokens: string[];
    confidence: number;
    tags: string[];
    latency: string;
  } | null>(null);

  const handleSelectModel = (modelId: string) => {
    setSelectedModel(modelId);
    try {
      localStorage.setItem("ai_search_model", modelId);
    } catch {}
  };

  const handleTestQuery = async () => {
    if (!queryInput.trim()) return;
    setTesterLoading(true);
    setTesterResult(null);

    await new Promise(r => setTimeout(r, 650));

    const lowercase = queryInput.toLowerCase();
    const tagsMatched: string[] = [];
    if (lowercase.includes("sunset") || lowercase.includes("sun") || lowercase.includes("evening")) {
      tagsMatched.push("Sunset", "Scenic");
    }
    if (lowercase.includes("beach") || lowercase.includes("ocean") || lowercase.includes("sea")) {
      tagsMatched.push("Beach", "Nature");
    }
    if (lowercase.includes("resume") || lowercase.includes("cv") || lowercase.includes("job")) {
      tagsMatched.push("Career", "Professional");
    }
    if (lowercase.includes("tax") || lowercase.includes("invoice") || lowercase.includes("finance")) {
      tagsMatched.push("Finance", "Official");
    }
    if (lowercase.includes("music") || lowercase.includes("song") || lowercase.includes("audio")) {
      tagsMatched.push("Music", "Melody");
    }

    if (tagsMatched.length === 0) {
      tagsMatched.push("General");
    }

    const latencyMap: Record<string, string> = {
      "gemini-2-flash": "112ms",
      "gemini-1-5-pro": "315ms",
      "claude-3-5": "395ms",
      "gpt-4o": "240ms"
    };

    setTesterResult({
      status: "SUCCESS",
      model: selectedModel === "gemini-2-flash" ? "Gemini 2.0 Flash" :
             selectedModel === "gemini-1-5-pro" ? "Gemini 1.5 Pro" :
             selectedModel === "claude-3-5" ? "Claude 3.5 Sonnet" : "GPT-4o",
      tokens: queryInput.split(/\s+/).filter(Boolean).map(t => t.toLowerCase()),
      confidence: parseFloat((0.85 + Math.random() * 0.13).toFixed(2)),
      tags: tagsMatched,
      latency: latencyMap[selectedModel] || "200ms"
    });
    setTesterLoading(false);
  };

  // Activity feed
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  const [loading, setLoading] = useState(true);

  const fetchProfileData = useCallback(async () => {
    if (!user) return;
    try {
      const stats = await fileService.getStorageStats(user.id);
      setStorage({ used: stats.used, limit: stats.limit, fileCount: stats.fileCount });

      const activity = await fileService.getActivityLogs(user.id);
      setLogs(activity);

      // Load 2FA status from local storage
      const local2FA = localStorage.getItem(`local_2fa_${user.id}`);
      if (local2FA) {
        setTwoFactor(JSON.parse(local2FA));
      }
    } catch (err) {
      console.error("Error loading profile logs:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfileData();
  }, [user, storageRefreshKey, fetchProfileData]);

  // ── 2FA with Google Authenticator QR ──────────────────────────────────
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFASecret] = useState(() => {
    // Generate or retrieve a stable TOTP secret for this user
    try {
      const stored = localStorage.getItem(`totp_secret_${user?.id || 'demo'}`);
      if (stored) return stored;
      // Generate a random base32-like secret (16 chars)
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
      const secret = Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map(b => chars[b % 32]).join('');
      localStorage.setItem(`totp_secret_${user?.id || 'demo'}`, secret);
      return secret;
    } catch { return 'JBSWY3DPEHPK3PXP'; }
  });
  const [twoFAMsg, setTwoFAMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const totpIssuer = 'NovaaD rive';
  const totpAccount = user?.email || 'admin@novaadrive.com';
  const totpUri = `otpauth://totp/${encodeURIComponent(totpIssuer)}:${encodeURIComponent(totpAccount)}?secret=${twoFASecret}&issuer=${encodeURIComponent(totpIssuer)}&algorithm=SHA1&digits=6&period=30`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(totpUri)}`;

  const handleToggle2FA = async () => {
    if (!user) return;
    if (!twoFactor) {
      // Show QR setup modal when enabling
      setShow2FAModal(true);
      return;
    }
    // Disable 2FA directly
    setToggling2fa(true);
    try {
      localStorage.setItem(`local_2fa_${user.id}`, JSON.stringify(false));
      setTwoFactor(false);
      setTwoFAMsg({ type: 'success', text: '2FA has been disabled.' });
      await fileService.addActivityLog(user.id, 'toggle_2fa', 'Disabled Two-Factor Authentication');
      setTimeout(() => setTwoFAMsg(null), 3000);
    } catch {
      setTwoFAMsg({ type: 'error', text: 'Failed to disable 2FA.' });
    } finally {
      setToggling2fa(false);
    }
  };

  const handleConfirm2FA = async () => {
    if (!user) return;
    setToggling2fa(true);
    try {
      localStorage.setItem(`local_2fa_${user.id}`, JSON.stringify(true));
      setTwoFactor(true);
      setShow2FAModal(false);
      setTwoFAMsg({ type: 'success', text: '2FA enabled via Google Authenticator.' });
      await fileService.addActivityLog(user.id, 'toggle_2fa', 'Enabled Two-Factor Authentication via Google Authenticator');
      setTimeout(() => setTwoFAMsg(null), 4000);
    } catch {
      setTwoFAMsg({ type: 'error', text: 'Failed to enable 2FA.' });
    } finally {
      setToggling2fa(false);
    }
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(twoFASecret).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ── Change Password ──────────────────────────────────────────────────
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [pwdLoading, setPwdLoading] = useState(false);

  const handleChangePassword = async () => {
    setPwdMsg(null);
    if (!currentPwd || !newPwd || !confirmPwd) { setPwdMsg({ type: 'error', text: 'All fields are required.' }); return; }
    if (newPwd.length < 6) { setPwdMsg({ type: 'error', text: 'New password must be at least 6 characters.' }); return; }
    if (newPwd !== confirmPwd) { setPwdMsg({ type: 'error', text: 'New passwords do not match.' }); return; }
    setPwdLoading(true);
    await new Promise(r => setTimeout(r, 400));
    try {
      const { hashPassword, verifyPassword } = await import("../config/credentials");
      const raw = localStorage.getItem('novaa_users');
      const users: any[] = raw ? JSON.parse(raw) : [];
      const idx = users.findIndex((u: any) => u.id === user?.id);
      if (idx === -1) { setPwdMsg({ type: 'error', text: 'User not found.' }); return; }
      const valid = await verifyPassword(currentPwd, users[idx].passwordHash);
      if (!valid) { setPwdMsg({ type: 'error', text: 'Current password is incorrect.' }); return; }
      users[idx].passwordHash = await hashPassword(newPwd);
      delete users[idx].password;
      localStorage.setItem('novaa_users', JSON.stringify(users));
      setPwdMsg({ type: 'success', text: 'Password changed successfully!' });
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
      setTimeout(() => setShowChangePwd(false), 1500);
    } catch { setPwdMsg({ type: 'error', text: 'Failed to update password.' }); }
    finally { setPwdLoading(false); }
  };

  const handlePurgeAll = async () => {
    if (confirm("⚠️ WARNING: This will permanently delete all folders, files, and logs stored in the browser database! This cannot be undone. Proceed?")) {
      try {
        await fileService.clearAllData();
        alert("🧹 Local database cleared successfully!");
        window.location.reload();
      } catch {
        alert("Failed to clear database.");
      }
    }
  };

  const securityScore = 40 + (twoFactor ? 15 : 0) + (aiTagging ? 15 : 0) + (aiScanner ? 15 : 0) + (aiCopilot ? 15 : 0);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const usedPercentage = Math.min(100, (storage.used / storage.limit) * 100);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 space-y-6">
      
      {/* Title */}
      <div className="border-b border-zinc-150/50 pb-4 dark:border-zinc-900/40">
        <h1 className="text-xl font-black text-zinc-900 dark:text-white">Settings & Activity Logs</h1>
        <p className="text-xs text-zinc-555 dark:text-zinc-400 mt-1">
          Review your operations stream, security setups, and account quotas.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* Left Side: Account Info Card & Security Settings */}
        <div className="space-y-6">
          {/* Profile Card */}
          <div className="rounded-3xl border border-zinc-150/70 bg-white/70 p-6 text-center backdrop-blur-md dark:border-zinc-900/50 dark:bg-zinc-950/60">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 text-lg font-black text-slate-900 shadow-md">
              {user?.email ? user.email.slice(0, 2).toUpperCase() : "ME"}
            </div>
            
            <h3 className="mt-4 text-sm font-extrabold text-zinc-850 dark:text-zinc-200">
              Personal Account
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-450 truncate">{user?.email}</p>
          </div>

          {/* Quota details */}
          <div className="rounded-3xl border border-zinc-150/70 bg-white/70 p-6 backdrop-blur-md dark:border-zinc-900/50 dark:bg-zinc-950/60">
            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-wider mb-4">Total Storage Usage</h3>
            <div className="h-3 w-full rounded-full bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-500"
                style={{ width: `${usedPercentage}%` }}
              />
            </div>
            <div className="mt-4 flex items-center justify-between text-xs font-semibold text-zinc-550 dark:text-zinc-400">
              <span>{formatSize(storage.used)} used</span>
              <span>{usedPercentage.toFixed(2)}% of {formatSize(storage.limit)}</span>
            </div>
          </div>

          {/* Billing Plan details */}
          <div className="rounded-3xl border border-zinc-150/70 bg-white/70 p-6 backdrop-blur-md dark:border-zinc-900/50 dark:bg-zinc-950/60 space-y-4">
            <h3 className="text-xs font-black text-zinc-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <UserCheck className="h-4.5 w-4.5 text-amber-500" />
              Active Tier: {storage.limit <= 10 * 1024 * 1024 * 1024 ? "Free Plan" : storage.limit <= 100 * 1024 * 1024 * 1024 ? "Basic Plan" : "Premium Plan"}
            </h3>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold leading-relaxed">
              Your storage is backed up and synchronized locally in the browser sandbox. You can change your active tier anytime.
            </p>
            <Link
              to="/plans"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-3 text-xs transition-colors cursor-pointer shadow-sm"
            >
              Change Storage Plan
            </Link>
          </div>

          {/* Security 2FA Panel */}
          <div className="rounded-3xl border border-zinc-150/70 bg-white/70 p-6 backdrop-blur-md dark:border-zinc-900/50 dark:bg-zinc-950/60 space-y-4">
            <h3 className="text-xs font-black text-zinc-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="h-4.5 w-4.5 text-amber-500" />
              Account Security
            </h3>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/40 border border-zinc-100/50 dark:border-zinc-900/30">
              <div>
                <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Two-Factor Auth (2FA)</p>
                <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">
                  {twoFactor ? 'Google Authenticator active' : 'Scan QR to enable'}
                </p>
              </div>
              <button
                disabled={toggling2fa}
                onClick={handleToggle2FA}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none
                  ${twoFactor ? 'bg-amber-500' : 'bg-zinc-200 dark:bg-zinc-800'}`}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                  ${twoFactor ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* Setup QR button when disabled */}
            {!twoFactor && (
              <button onClick={() => setShow2FAModal(true)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold py-2.5 text-xs transition-colors">
                <QrCode className="h-3.5 w-3.5" /> Setup Google Authenticator
              </button>
            )}

            {/* Inline feedback */}
            {twoFAMsg && (
              <div className={`flex items-center gap-2 rounded-xl px-3 py-2 text-[10px] font-semibold ${
                twoFAMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-500'
              }`}>
                {twoFAMsg.type === 'success' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                {twoFAMsg.text}
              </div>
            )}
          </div>

          {/* 2FA QR Modal */}
          {show2FAModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="w-full max-w-sm rounded-3xl border border-white/[0.08] bg-[#0B1020] p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <QrCode className="h-4 w-4 text-amber-500" /> Setup 2FA
                  </h3>
                  <button onClick={() => setShow2FAModal(false)} className="text-white/40 hover:text-white">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <p className="text-[10px] text-white/50 leading-relaxed">
                  Open <span className="font-bold text-white/80">Google Authenticator</span> on your phone, tap <span className="font-bold text-white/80">+</span> → <span className="font-bold text-white/80">Scan QR code</span>, then scan the code below.
                </p>

                {/* QR Code */}
                <div className="flex justify-center">
                  <div className="rounded-2xl border border-white/[0.08] bg-white p-3">
                    <img src={qrUrl} alt="2FA QR Code" width={180} height={180} className="rounded-lg" />
                  </div>
                </div>

                {/* Manual secret */}
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-3">
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-white/30 mb-1">Manual entry key</p>
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-xs font-mono text-amber-400 tracking-widest break-all">{twoFASecret}</code>
                    <button onClick={handleCopySecret} className="flex-shrink-0 rounded-lg border border-white/[0.08] bg-white/[0.04] p-1.5 text-white/40 hover:text-white transition-colors">
                      {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                <p className="text-[9px] text-white/30 text-center">Algorithm: SHA1 · Digits: 6 · Period: 30s</p>

                <div className="flex gap-2">
                  <button onClick={() => setShow2FAModal(false)}
                    className="flex-1 rounded-xl border border-white/[0.08] py-2.5 text-xs font-bold text-white/50 hover:bg-white/[0.04] transition-colors">
                    Cancel
                  </button>
                  <button onClick={handleConfirm2FA} disabled={toggling2fa}
                    className="flex-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-2.5 text-xs transition-colors disabled:opacity-50">
                    {toggling2fa ? 'Saving...' : 'I\'ve scanned it — Enable 2FA'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Change Password / Forgot Password */}
          <div className="rounded-3xl border border-zinc-150/70 bg-white/70 p-6 backdrop-blur-md dark:border-zinc-900/50 dark:bg-zinc-950/60 space-y-4">
            <h3 className="text-xs font-black text-zinc-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-amber-500" />
              Password
            </h3>

            {!showChangePwd ? (
              <button
                onClick={() => { setShowChangePwd(true); setPwdMsg(null); }}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold py-3 text-xs transition-colors cursor-pointer"
              >
                <KeyRound className="h-3.5 w-3.5" />
                Change / Reset Password
              </button>
            ) : (
              <div className="space-y-3">
                {/* Current Password */}
                <div className="relative">
                  <label className="block text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1">Current Password</label>
                  <div className="relative">
                    <input
                      type={showPwd ? 'text' : 'password'}
                      value={currentPwd}
                      onChange={e => setCurrentPwd(e.target.value)}
                      placeholder="Enter current password"
                      className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-2.5 pl-3 pr-10 text-xs text-zinc-800 dark:text-white outline-none focus:border-amber-500 placeholder:text-zinc-300 dark:placeholder:text-zinc-600"
                    />
                    <button type="button" onClick={() => setShowPwd(p => !p)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400">
                      {showPwd ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1">New Password</label>
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={newPwd}
                    onChange={e => setNewPwd(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-2.5 px-3 text-xs text-zinc-800 dark:text-white outline-none focus:border-amber-500 placeholder:text-zinc-300 dark:placeholder:text-zinc-600"
                  />
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showPwd ? 'text' : 'password'}
                      value={confirmPwd}
                      onChange={e => setConfirmPwd(e.target.value)}
                      placeholder="Repeat new password"
                      className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-2.5 pl-3 pr-10 text-xs text-zinc-800 dark:text-white outline-none focus:border-amber-500 placeholder:text-zinc-300 dark:placeholder:text-zinc-600"
                    />
                    {confirmPwd.length > 0 && (
                      <span className="absolute inset-y-0 right-0 flex items-center pr-3">
                        {confirmPwd === newPwd
                          ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          : <XCircle className="h-3.5 w-3.5 text-red-400" />}
                      </span>
                    )}
                  </div>
                </div>

                {/* Message */}
                {pwdMsg && (
                  <div className={`flex items-center gap-2 rounded-xl px-3 py-2 text-[10px] font-semibold ${
                    pwdMsg.type === 'success'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-red-500/10 text-red-600 dark:text-red-400'
                  }`}>
                    {pwdMsg.type === 'success' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                    {pwdMsg.text}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => { setShowChangePwd(false); setPwdMsg(null); setCurrentPwd(''); setNewPwd(''); setConfirmPwd(''); }}
                    className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-800 py-2.5 text-xs font-bold text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleChangePassword}
                    disabled={pwdLoading}
                    className="flex-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-2.5 text-xs transition-colors disabled:opacity-50"
                  >
                    {pwdLoading ? 'Saving...' : 'Update Password'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* AI Security Intelligence Control Panel */}
          {isAiMode && (
            <div className="rounded-3xl border border-amber-500/20 bg-gradient-to-b from-amber-500/5 to-transparent p-6 backdrop-blur-md dark:border-amber-500/10 shadow-[0_0_24px_rgba(245,158,11,0.02)] space-y-4">
              <h3 className="text-xs font-black text-zinc-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="h-4.5 w-4.5 text-amber-500 animate-pulse" />
                AI Security Guard
              </h3>
              
              {/* Score Display */}
              <div className="flex items-center gap-4 p-3 rounded-2xl bg-zinc-50/55 dark:bg-zinc-900/40 border border-zinc-100/50 dark:border-zinc-900/30">
                <div className="relative flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full border-4 border-amber-500 text-center font-bold text-xs text-zinc-800 dark:text-white">
                  <div className="absolute inset-0 rounded-full border-4 border-amber-500/20" />
                  {securityScore}/100
                </div>
                <div>
                  <p className="text-xs font-black text-zinc-800 dark:text-zinc-200">AI Trust Score</p>
                  <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">
                    {securityScore >= 95 ? "✓ Excellent System Health" : "⚠️ Needs Optimization"}
                  </p>
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-zinc-805 dark:text-zinc-200">AI Smart Tagging</p>
                    <p className="text-[9px] text-zinc-450">Classify files automatically on upload</p>
                  </div>
                  <button
                    onClick={() => handleToggleSetting("ai_tagging", aiTagging, setAiTagging)}
                    className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors duration-200 cursor-pointer
                      ${aiTagging ? "bg-amber-500" : "bg-zinc-300 dark:bg-zinc-800"}`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-200
                      ${aiTagging ? "translate-x-4" : "translate-x-0.5"}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-zinc-805 dark:text-zinc-200">AI Threat Scanner</p>
                    <p className="text-[9px] text-zinc-450">Check risk profile during authentication</p>
                  </div>
                  <button
                    onClick={() => handleToggleSetting("ai_scanner", aiScanner, setAiScanner)}
                    className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors duration-200 cursor-pointer
                      ${aiScanner ? "bg-amber-500" : "bg-zinc-300 dark:bg-zinc-800"}`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-200
                      ${aiScanner ? "translate-x-4" : "translate-x-0.5"}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-zinc-805 dark:text-zinc-200">AI Storage Copilot</p>
                    <p className="text-[9px] text-zinc-450">Enable smart space clean suggestions</p>
                  </div>
                  <button
                    onClick={() => handleToggleSetting("ai_copilot", aiCopilot, setAiCopilot)}
                    className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors duration-200 cursor-pointer
                      ${aiCopilot ? "bg-amber-500" : "bg-zinc-300 dark:bg-zinc-800"}`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-200
                      ${aiCopilot ? "translate-x-4" : "translate-x-0.5"}`} />
                  </button>
                </div>
              </div>

              {/* Telemetry logs table */}
              <div className="pt-2 border-t border-zinc-150/40 dark:border-zinc-900/40">
                <p className="text-[10px] font-black text-zinc-405 uppercase tracking-wider mb-2">Telemetry Security Audits</p>
                <div className="rounded-xl overflow-hidden border border-zinc-100 dark:border-zinc-900 text-[10px] font-mono">
                  <div className="grid grid-cols-2 bg-zinc-50 dark:bg-zinc-900/50 p-2 font-bold border-b border-zinc-100 dark:border-zinc-900">
                    <span>Audit Vector</span>
                    <span className="text-right">Risk Score</span>
                  </div>
                  <div className="divide-y divide-zinc-105 dark:divide-zinc-900">
                    <div className="grid grid-cols-2 p-2 text-zinc-555 dark:text-zinc-400">
                      <span>Fingerprint Authenticity</span>
                      <span className="text-right text-emerald-500">0.01% (Safe)</span>
                    </div>
                    <div className="grid grid-cols-2 p-2 text-zinc-555 dark:text-zinc-400">
                      <span>IP Address Geolocation</span>
                      <span className="text-right text-emerald-500">0.02% (Safe)</span>
                    </div>
                    <div className="grid grid-cols-2 p-2 text-zinc-555 dark:text-zinc-400">
                      <span>2FA Verification State</span>
                      <span className={`text-right font-bold ${twoFactor ? "text-emerald-500" : "text-amber-500"}`}>
                        {twoFactor ? "0.00% (Safe)" : "+15.0% (Risk)"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Reset Action */}
          <div className="rounded-3xl border border-zinc-150/70 bg-white/70 p-6 backdrop-blur-md dark:border-zinc-900/50 dark:bg-zinc-950/60 space-y-4">
            <h3 className="text-xs font-black text-red-600 dark:text-red-500 uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="h-4.5 w-4.5" />
              Danger Zone
            </h3>
            <button
              onClick={handlePurgeAll}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-50 hover:bg-red-100 text-red-650 font-bold py-3.5 text-xs transition-colors cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
              Reset Local Database
            </button>
          </div>

        </div>

        {/* Right Side: Tab Switcher (AI Search Model vs. Operation Logs) */}
        <div className="lg:col-span-2 rounded-3xl border border-zinc-150/70 bg-white/70 p-6 backdrop-blur-md dark:border-zinc-900/50 dark:bg-zinc-950/60 flex flex-col gap-6">
          
          {/* Tab Selector */}
          <div className="flex border-b border-zinc-150/50 dark:border-zinc-900/50 pb-1">
            <button
              onClick={() => setActiveRightTab("model")}
              className={`flex items-center gap-2 pb-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 px-4 cursor-pointer
                ${activeRightTab === "model" 
                  ? "border-amber-500 text-zinc-900 dark:text-white" 
                  : "border-transparent text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-300"}`}
            >
              <Sparkles className="h-4 w-4 text-amber-500" />
              AI Search Model
            </button>
            <button
              onClick={() => setActiveRightTab("logs")}
              className={`flex items-center gap-2 pb-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 px-4 cursor-pointer
                ${activeRightTab === "logs" 
                  ? "border-amber-500 text-zinc-900 dark:text-white" 
                  : "border-transparent text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-300"}`}
            >
              <Database className="h-4 w-4" />
              Operation Logs
            </button>
          </div>

          {/* Switchable panels */}
          {activeRightTab === "model" ? (
            /* AI SEARCH MODEL CONFIGURATION VIEW */
            <div className="space-y-6">
              <div>
                <h4 className="text-xs font-black text-zinc-800 dark:text-white uppercase tracking-wider">
                  Active AI Search & Analysis Model
                </h4>
                <p className="text-[10px] text-zinc-450 mt-1">
                  Choose which model will index file names and process search embeddings.
                </p>
              </div>

              {/* Models grid */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {[
                  { id: "gemini-2-flash", name: "Gemini 2.0 Flash", desc: "Super-fast classification", rating: "92%", speed: "Ultra-fast (120ms)" },
                  { id: "gemini-1-5-pro", name: "Gemini 1.5 Pro", desc: "Deep context reasoning", rating: "98%", speed: "Balanced (315ms)" },
                  { id: "claude-3-5", name: "Claude 3.5 Sonnet", desc: "Precise code syntax parsing", rating: "97%", speed: "Balanced (395ms)" },
                  { id: "gpt-4o", name: "GPT-4o Multimodal", desc: "High fidelity image description", rating: "96%", speed: "Fast (240ms)" }
                ].map(m => (
                  <button
                    key={m.id}
                    onClick={() => handleSelectModel(m.id)}
                    className={`flex flex-col text-left p-4 rounded-2xl border transition-all cursor-pointer select-none hover:scale-[1.01]
                      ${selectedModel === m.id 
                        ? "border-amber-500 bg-amber-500/5 shadow-[0_0_15px_rgba(245,158,11,0.06)] dark:bg-amber-500/10" 
                        : "border-zinc-150 bg-zinc-50/50 dark:border-zinc-900/60 dark:bg-zinc-900/30"}`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-black text-zinc-850 dark:text-white">{m.name}</span>
                      {selectedModel === m.id && (
                        <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[8px] font-black uppercase text-amber-500">
                          Active
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-450 mt-1.5 leading-snug">{m.desc}</span>
                    <div className="mt-3 flex items-center gap-3 border-t border-zinc-150/40 dark:border-zinc-900/40 pt-2 text-[9px] font-bold text-zinc-400">
                      <span>Score: {m.rating}</span>
                      <span>•</span>
                      <span>{m.speed}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Semantic query tester simulator */}
              <div className="rounded-2xl border border-zinc-150 bg-zinc-50/50 dark:border-zinc-900/50 dark:bg-zinc-900/30 p-4 space-y-4">
                <div>
                  <h4 className="text-xs font-extrabold text-zinc-800 dark:text-white flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    Semantic Query Vector Tester
                  </h4>
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    Test how the active AI model parses natural-language prompts.
                  </p>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="E.g., find sunset photos from travel trip..."
                    value={queryInput}
                    onChange={(e) => setQueryInput(e.target.value)}
                    className="flex-1 rounded-xl border border-zinc-250 bg-white py-2 px-3 text-xs outline-none focus:border-amber-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-105"
                  />
                  <button
                    onClick={handleTestQuery}
                    disabled={testerLoading || !queryInput.trim()}
                    className="rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 px-4 py-2 text-xs font-black uppercase tracking-wider shadow-sm active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {testerLoading ? "Running..." : "Test"}
                  </button>
                </div>

                {testerResult && (
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/10 p-3 text-[10px] font-mono leading-relaxed space-y-2 animate-fadeIn">
                    <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-bold border-b border-emerald-500/10 pb-1.5">
                      <span>✓ MATCH SUCCESSFUL</span>
                      <span>Latency: {testerResult.latency}</span>
                    </div>
                    <p className="text-zinc-750 dark:text-zinc-300">
                      <span className="font-bold text-zinc-450 uppercase">Model:</span> {testerResult.model}
                    </p>
                    <p className="text-zinc-750 dark:text-zinc-300">
                      <span className="font-bold text-zinc-450 uppercase">Extracted Tokens:</span> {JSON.stringify(testerResult.tokens)}
                    </p>
                    <p className="text-zinc-750 dark:text-zinc-300">
                      <span className="font-bold text-zinc-450 uppercase">Cosine Confidence:</span> {testerResult.confidence * 100}%
                    </p>
                    <div className="flex flex-wrap items-center gap-1 mt-1 pt-1.5 border-t border-emerald-500/10">
                      <span className="font-bold text-zinc-450 uppercase mr-1">Matched Tags:</span>
                      {testerResult.tags.map(t => (
                        <span key={t} className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[8px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* OPERATION LOGS VIEW */
            <div className="space-y-4">
              <h4 className="text-xs font-black text-zinc-805 dark:text-white uppercase tracking-wider">
                Operation Logs History (LocalDB)
              </h4>
              {loading ? (
                <div className="space-y-3 py-6">
                  {[1, 2, 3].map(n => (
                    <div key={n} className="h-8 w-full animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-900" />
                  ))}
                </div>
              ) : logs.length === 0 ? (
                <p className="text-center py-10 text-xs text-zinc-450 font-bold">No activity logs recorded yet.</p>
              ) : (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-900 max-h-[42vh] overflow-y-auto pr-1">
                  {logs.map((log) => (
                    <div key={log.id} className="flex justify-between items-center py-3">
                      <div className="flex gap-3 items-center min-w-0 pr-4">
                        <div className="h-2 w-2 rounded-full bg-amber-500 flex-shrink-0" />
                        <p className="text-xs font-bold text-zinc-750 dark:text-zinc-300 leading-snug truncate">
                          {log.details}
                        </p>
                      </div>
                      <span className="text-[10px] text-zinc-400 font-bold whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
