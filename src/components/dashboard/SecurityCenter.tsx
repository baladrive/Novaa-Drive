"use client";
import React, { useMemo } from "react";
import { ShieldCheck, ShieldAlert, Lock, Unlock, MonitorSmartphone, Clock, CheckCircle2, XCircle, KeyRound } from "lucide-react";
import { Link } from "react-router-dom";

interface SecurityCenterProps {
  userId: string;
  userEmail?: string;
}

function StatusRow({ label, ok, detail, actionTo }: {
  label: string; ok: boolean; detail?: string; actionTo?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2.5">
        {ok
          ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
          : <XCircle      className="h-3.5 w-3.5 text-red-500    flex-shrink-0" />}
        <div>
          <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{label}</p>
          {detail && <p className="text-[10px] text-zinc-400 font-medium">{detail}</p>}
        </div>
      </div>
      {!ok && actionTo && (
        <Link to={actionTo}
          className="text-[10px] font-black text-amber-500 hover:underline uppercase tracking-wider">
          Fix →
        </Link>
      )}
    </div>
  );
}

export default function SecurityCenter({ userId, userEmail }: SecurityCenterProps) {
  const has2FA = useMemo(() => {
    try { return JSON.parse(localStorage.getItem(`local_2fa_${userId}`) || "false"); }
    catch { return false; }
  }, [userId]);

  const hasVaultPin = useMemo(() => {
    return !!localStorage.getItem(`hidden_pin_${userId}`);
  }, [userId]);

  const sessionTime = useMemo(() => {
    const t = sessionStorage.getItem("session_start") || new Date().toISOString();
    if (!sessionStorage.getItem("session_start")) sessionStorage.setItem("session_start", t);
    return new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }, []);

  const lastLogin = useMemo(() => {
    const key = `last_login_${userId}`;
    const stored = localStorage.getItem(key);
    const now = new Date().toISOString();
    if (!stored) localStorage.setItem(key, now);
    return stored ? new Date(stored).toLocaleString([], { dateStyle: "short", timeStyle: "short" }) : "Just now";
  }, [userId]);

  // Score: 2FA=40pts, VaultPin=30pts, always has email=30pts
  const score = 30 + (has2FA ? 40 : 0) + (hasVaultPin ? 30 : 0);
  const scoreColor = score >= 90 ? "text-emerald-500" : score >= 60 ? "text-amber-500" : "text-red-500";
  const scoreRing  = score >= 90 ? "#10b981"          : score >= 60 ? "#f59e0b"        : "#ef4444";

  return (
    <div className="rounded-3xl border border-zinc-150/70 bg-white/70 dark:border-zinc-900/50 dark:bg-zinc-950/60 backdrop-blur-md p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black text-zinc-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-amber-500" />
          Security Center
        </h3>

        {/* Score ring */}
        <div className="relative h-14 w-14">
          <svg className="h-14 w-14 -rotate-90" viewBox="0 0 48 48">
            <circle cx="24" cy="24" r="18" fill="none" stroke="currentColor"
              className="text-zinc-100 dark:text-zinc-800" strokeWidth="5" />
            <circle cx="24" cy="24" r="18" fill="none"
              stroke={scoreRing} strokeWidth="5"
              strokeDasharray={`${(score / 100) * 113} ${113 - (score / 100) * 113}`}
              strokeLinecap="round"
              style={{ transition: "stroke-dasharray 1s ease" }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-sm font-black ${scoreColor} tabular-nums`}>{score}</span>
            <span className="text-[7px] text-zinc-400 font-bold">/ 100</span>
          </div>
        </div>
      </div>

      {/* Status rows */}
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
        <StatusRow
          label="Two-Factor Authentication"
          ok={has2FA}
          detail={has2FA ? "2FA is active on this account" : "Account not protected by 2FA"}
          actionTo="/profile"
        />
        <StatusRow
          label="Private Vault PIN"
          ok={hasVaultPin}
          detail={hasVaultPin ? "Vault is password protected" : "No PIN set for hidden files"}
          actionTo="/hidden"
        />
        <StatusRow
          label="Account Email"
          ok={true}
          detail={userEmail || "Authenticated"}
        />
        <StatusRow
          label="Active Session"
          ok={true}
          detail={`Session started at ${sessionTime}`}
        />
      </div>

      {/* Login history */}
      <div className="rounded-2xl bg-zinc-50/60 dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800 p-3 space-y-1.5">
        <p className="text-[9px] font-black uppercase tracking-wider text-zinc-400">Recent Sign-in</p>
        <div className="flex items-center gap-2">
          <MonitorSmartphone className="h-4 w-4 text-zinc-400 flex-shrink-0" />
          <div>
            <p className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300">This device</p>
            <p className="text-[9px] text-zinc-400">{lastLogin}</p>
          </div>
          <span className="ml-auto flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[8px] font-black text-emerald-500">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
            Active
          </span>
        </div>
      </div>

      <Link
        to="/profile"
        className="flex items-center justify-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 py-2.5 text-xs font-black text-amber-500 transition-all"
      >
        <KeyRound className="h-3.5 w-3.5" /> Manage Security Settings
      </Link>
    </div>
  );
}
