import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { KeyRound, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { signInAsAdmin, adminLoading } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    try {
      await signInAsAdmin(identifier, password);
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to authenticate administrator.");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#080d18] px-4 py-10 text-white">
      <div className="w-full max-w-md rounded-3xl border border-amber-400/20 bg-[#111827] p-8 shadow-2xl shadow-black/40">
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400 text-slate-950">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-300">Restricted portal</p>
            <h1 className="mt-1 text-2xl font-black">Admin Login</h1>
          </div>
        </div>
        <p className="mb-6 text-sm leading-6 text-white/50">Use your administrator credentials to access Novaa Drive controls.</p>
        {error && <div className="mb-5 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-xs font-semibold text-red-300">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-xs font-semibold uppercase tracking-wider text-white/50">
            Admin username or email
            <span className="relative mt-2 block">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
              <input required autoComplete="username" value={identifier} onChange={(event) => setIdentifier(event.target.value)} className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 pl-10 pr-4 text-sm text-white outline-none focus:border-amber-400/60" />
            </span>
          </label>
          <label className="block text-xs font-semibold uppercase tracking-wider text-white/50">
            Password
            <span className="relative mt-2 block">
              <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
              <input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 pl-10 pr-4 text-sm text-white outline-none focus:border-amber-400/60" />
            </span>
          </label>
          <button disabled={adminLoading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 py-3 text-sm font-black text-slate-950 transition hover:bg-amber-300 disabled:opacity-50">
            <LockKeyhole className="h-4 w-4" />
            {adminLoading ? "Verifying..." : "Enter Admin Dashboard"}
          </button>
        </form>
        <button type="button" onClick={() => navigate("/")} className="mt-6 w-full text-center text-xs font-semibold text-white/40 hover:text-white/70">Back to user login</button>
      </div>
    </main>
  );
}
