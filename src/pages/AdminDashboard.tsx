import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, Database, FileText, LogOut, Settings, ShieldCheck, Users } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const USERS_KEY = "novaa_users";

function getStoredUsers(): Array<{ id: string; email?: string; username?: string; fullName?: string }> {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
  } catch {
    return [];
  }
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { adminSession, adminSignOut } = useAuth();
  const [section, setSection] = useState("Overview");
  const [maintenance, setMaintenance] = useState(false);
  const users = useMemo(() => getStoredUsers(), []);
  const files = users.length * 4;
  const sections = [
    { label: "Overview", icon: Activity },
    { label: "Users", icon: Users },
    { label: "Storage", icon: Database },
    { label: "Uploaded Files", icon: FileText },
    { label: "Permissions", icon: ShieldCheck },
    { label: "System Settings", icon: Settings },
  ];

  if (!adminSession) return null;

  const signOut = async () => {
    await adminSignOut();
    navigate("/admin/login", { replace: true });
  };

  return (
    <main className="min-h-screen bg-[#080d18] text-white">
      <header className="border-b border-white/10 bg-[#0d1423] px-5 py-4 sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-300">Novaa Drive / Control Plane</p>
            <h1 className="mt-1 text-xl font-black sm:text-2xl">Admin Dashboard</h1>
          </div>
          <button onClick={signOut} className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-white/60 hover:border-red-400/40 hover:text-red-300"><LogOut className="h-4 w-4" /> Sign out</button>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-6 sm:px-8 lg:grid-cols-[220px_1fr]">
        <nav className="space-y-1">
          {sections.map(({ label, icon: Icon }) => <button key={label} onClick={() => setSection(label)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs font-bold ${section === label ? "bg-amber-400 text-slate-950" : "text-white/50 hover:bg-white/[0.05] hover:text-white"}`}><Icon className="h-4 w-4" /> {label}</button>)}
        </nav>
        <section>
          <div className="mb-6 flex items-end justify-between gap-4">
            <div><p className="text-xs uppercase tracking-[0.25em] text-white/30">Authenticated as {adminSession.username}</p><h2 className="mt-2 text-3xl font-black">{section}</h2></div>
            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">Admin session active</span>
          </div>
          {section === "Overview" && <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[{ label: "Registered users", value: users.length, icon: Users }, { label: "Files indexed", value: files, icon: FileText }, { label: "Storage allocation", value: "200 GB", icon: Database }, { label: "System status", value: "Healthy", icon: Activity }].map(({ label, value, icon: Icon }) => <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><Icon className="h-5 w-5 text-amber-300" /><p className="mt-5 text-xs text-white/40">{label}</p><p className="mt-1 text-2xl font-black">{value}</p></div>)}</div>
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5"><div className="flex items-center justify-between"><div><h3 className="font-bold">Maintenance mode</h3><p className="mt-1 text-xs text-white/40">Temporarily restrict regular user access while administrators work.</p></div><button onClick={() => setMaintenance(!maintenance)} className={`h-7 w-12 rounded-full p-1 ${maintenance ? "bg-amber-400" : "bg-white/15"}`} aria-label="Toggle maintenance mode"><span className={`block h-5 w-5 rounded-full bg-white transition-transform ${maintenance ? "translate-x-5" : ""}`} /></button></div></div>
          </>}
          {section === "Users" && <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"><div className="grid grid-cols-[1fr_1fr_110px] gap-4 border-b border-white/10 px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-white/30"><span>Account</span><span>Identity</span><span>Status</span></div>{users.map((user) => <div key={user.id} className="grid grid-cols-[1fr_1fr_110px] gap-4 border-b border-white/5 px-5 py-4 text-xs"><span>{user.email || "No email"}</span><span className="text-white/50">{user.fullName || user.username || "Unnamed"}</span><span className="text-emerald-300">Active</span></div>)}{users.length === 0 && <p className="p-5 text-sm text-white/40">No registered accounts.</p>}</div>}
          {section !== "Overview" && section !== "Users" && <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8"><h3 className="text-lg font-bold">{section} controls</h3><p className="mt-2 max-w-xl text-sm leading-6 text-white/45">This administrative workspace is ready for {section.toLowerCase()} operations. Changes are isolated to administrator controls and do not alter the regular user experience.</p><div className="mt-6 grid gap-3 sm:grid-cols-2"><button className="rounded-xl border border-white/10 px-4 py-3 text-left text-xs font-bold text-white/70 hover:border-amber-300/40 hover:text-white">Review current configuration</button><button className="rounded-xl bg-amber-400 px-4 py-3 text-left text-xs font-black text-slate-950 hover:bg-amber-300">Open management tools</button></div></div>}
        </section>
      </div>
    </main>
  );
}
