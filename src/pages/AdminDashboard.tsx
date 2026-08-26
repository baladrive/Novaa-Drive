import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowDown, ArrowUp, Check, Database, Eye, EyeOff, FileText, LogOut, Pencil, RotateCcw, Save, Settings, Sparkles, Users, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getDraftSiteContent, publishSiteContent, resetDraftSiteContent, saveDraftSiteContent, SiteContent, SiteSection } from "../services/siteContent";

const USERS_KEY = "novaa_users";

function getStoredUsers(): Array<{ id: string; email?: string; username?: string; fullName?: string }> {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
  } catch {
    return [];
  }
}

function EditorField({ name, value, onChange }: { name: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block text-xs font-semibold uppercase tracking-wider text-white/40">
      {name.replace(/([A-Z])/g, " $1")}
      <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={name === "description" || name === "message" ? 3 : 2} className="mt-2 w-full resize-y rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm font-normal normal-case tracking-normal text-white outline-none focus:border-amber-300/60" />
    </label>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { adminSession, adminSignOut } = useAuth();
  const [content, setContent] = useState<SiteContent>(() => getDraftSiteContent());
  const [activeId, setActiveId] = useState("hero");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [notice, setNotice] = useState("Draft loaded");
  const users = useMemo(() => getStoredUsers(), []);
  const files = users.length * 4;
  const orderedSections = useMemo(() => [...content.sections].sort((a, b) => a.order - b.order), [content.sections]);

  if (!adminSession) return null;

  const updateSection = (id: string, update: Partial<SiteSection>) => {
    setContent((current) => ({ ...current, sections: current.sections.map((section) => section.id === id ? { ...section, ...update } : section) }));
    setNotice("Unsaved draft changes");
  };

  const updateField = (section: SiteSection, name: string, value: string) => updateSection(section.id, { fields: { ...section.fields, [name]: value } });

  const moveSection = (section: SiteSection, direction: -1 | 1) => {
    const index = orderedSections.findIndex((item) => item.id === section.id);
    const target = orderedSections[index + direction];
    if (!target) return;
    setContent((current) => ({ ...current, sections: current.sections.map((item) => item.id === section.id ? { ...item, order: target.order } : item.id === target.id ? { ...item, order: section.order } : item) }));
    setNotice("Unsaved draft changes");
  };

  const saveDraft = () => { setContent(saveDraftSiteContent(content)); setNotice("Draft saved"); };
  const publish = () => { setContent(publishSiteContent(content)); setNotice("Published and live"); };
  const reset = () => { setContent(resetDraftSiteContent()); setNotice("Draft reset to published version"); };

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
            <h1 className="mt-1 text-xl font-black sm:text-2xl">Admin Dashboard Builder</h1>
          </div>
          <button onClick={signOut} className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-white/60 hover:border-red-400/40 hover:text-red-300"><LogOut className="h-4 w-4" /> Sign out</button>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-5 py-6 sm:px-8">
        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-amber-300/20 bg-amber-300/5 p-5 lg:flex-row lg:items-center lg:justify-between"><div><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-amber-300"><Sparkles className="h-4 w-4" /> Centralized content</p><p className="mt-2 text-sm text-white/50">Edit detected website sections without touching source code. Drafts stay private until published.</p></div><div className="flex flex-wrap gap-2"><button onClick={() => setPreviewOpen(true)} className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-xs font-bold text-white/70 hover:border-white/30"><Eye className="h-4 w-4" /> Preview</button><button onClick={reset} className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-xs font-bold text-white/50 hover:text-white"><RotateCcw className="h-4 w-4" /> Reset</button><button onClick={saveDraft} className="flex items-center gap-2 rounded-xl border border-cyan-300/30 px-4 py-2 text-xs font-bold text-cyan-200 hover:bg-cyan-300/10"><Save className="h-4 w-4" /> Save Draft</button><button onClick={publish} className="flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2 text-xs font-black text-slate-950 hover:bg-amber-300"><Check className="h-4 w-4" /> Publish</button></div></div>
        <div className="mb-5 flex items-center justify-between"><p className="text-xs font-semibold text-white/40">{content.sections.length} sections detected</p><p className="text-xs font-semibold text-emerald-300">{notice}</p></div>
        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <nav className="space-y-1 rounded-2xl border border-white/10 bg-white/[0.03] p-3">{orderedSections.map((section, index) => <button key={section.id} onClick={() => setActiveId(section.id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs font-bold ${activeId === section.id ? "bg-amber-400 text-slate-950" : "text-white/55 hover:bg-white/[0.05] hover:text-white"}`}><span className="w-5 text-center text-[10px] opacity-50">{index + 1}</span><span className="flex-1">{section.label}</span>{section.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5 opacity-50" />}</button>)}</nav>
          <section className="space-y-4">{orderedSections.map((section) => <article key={section.id} className={`rounded-2xl border bg-white/[0.03] p-5 ${activeId === section.id ? "border-amber-300/40" : "border-white/10"}`}>
            <div className="flex flex-wrap items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-300/10 text-amber-300"><Pencil className="h-4 w-4" /></div><div className="flex-1"><h2 className="font-bold">{section.label}</h2><p className="text-[10px] uppercase tracking-wider text-white/30">/{section.id} · {section.layout} layout</p></div><button onClick={() => updateSection(section.id, { visible: !section.visible })} className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold ${section.visible ? "border-emerald-300/20 text-emerald-300" : "border-white/10 text-white/40"}`}>{section.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}{section.visible ? "Visible" : "Hidden"}</button><button onClick={() => moveSection(section, -1)} aria-label={`Move ${section.label} up`} className="rounded-lg border border-white/10 p-2 text-white/50 hover:text-white"><ArrowUp className="h-4 w-4" /></button><button onClick={() => moveSection(section, 1)} aria-label={`Move ${section.label} down`} className="rounded-lg border border-white/10 p-2 text-white/50 hover:text-white"><ArrowDown className="h-4 w-4" /></button></div>
            {activeId === section.id && <div className="mt-5 grid gap-4 md:grid-cols-2">{Object.entries(section.fields).map(([name, value]) => <EditorField key={name} name={name} value={value} onChange={(next) => updateField(section, name, next)} />)}</div>}
          </article>)}</section>
        </div>
        <div className="mt-6 grid gap-3 text-xs text-white/40 sm:grid-cols-4"><div className="rounded-xl border border-white/10 p-4"><Users className="mb-2 h-4 w-4 text-amber-300" />{users.length} registered users</div><div className="rounded-xl border border-white/10 p-4"><FileText className="mb-2 h-4 w-4 text-amber-300" />User sections managed</div><div className="rounded-xl border border-white/10 p-4"><Database className="mb-2 h-4 w-4 text-amber-300" />Storage content managed</div><div className="rounded-xl border border-white/10 p-4"><Settings className="mb-2 h-4 w-4 text-amber-300" />Draft version {content.version}</div></div>
      </div>
      {previewOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setPreviewOpen(false)}><div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#111827] p-6" onClick={(event) => event.stopPropagation()}><div className="mb-5 flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-300">Draft preview</p><h2 className="mt-1 text-2xl font-black">{content.sections.find((section) => section.id === "hero")?.fields.title}</h2></div><button onClick={() => setPreviewOpen(false)} aria-label="Close preview" className="rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white"><X className="h-5 w-5" /></button></div>{orderedSections.filter((section) => section.visible).map((section) => <div key={section.id} className="border-t border-white/10 py-4"><p className="text-[10px] font-bold uppercase tracking-wider text-amber-300">{section.label}</p><p className="mt-2 text-sm font-bold">{section.fields.title || section.fields.message || section.fields.brand || section.fields.text || section.fields.loginText}</p><p className="mt-1 text-xs leading-5 text-white/45">{section.fields.description || section.fields.tagline || section.fields.items || section.fields.links}</p></div>)}</div></div>}
    </main>
  );
}
