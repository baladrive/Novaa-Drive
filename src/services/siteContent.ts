import { useEffect, useState } from "react";

export interface SiteSection {
  id: string;
  label: string;
  visible: boolean;
  order: number;
  layout: "full" | "split" | "grid" | "compact";
  fields: Record<string, string>;
}

export interface SiteContent {
  version: number;
  updatedAt: string;
  sections: SiteSection[];
}

const PUBLISHED_KEY = "novaa_site_content_published";
const DRAFT_KEY = "novaa_site_content_draft";
const CHANGE_EVENT = "novaa-site-content-changed";

export const defaultSiteContent: SiteContent = {
  version: 1,
  updatedAt: "",
  sections: [
    { id: "announcement", label: "Announcement", visible: false, order: 0, layout: "full", fields: { message: "Welcome to Novaa Drive", linkText: "Learn more", link: "#" } },
    { id: "header", label: "Header", visible: true, order: 1, layout: "full", fields: { brand: "Novaa Drive", tagline: "Secure. Smart. Seamless.", actionText: "Sign In", actionLink: "/" } },
    { id: "navigation", label: "Navigation", visible: true, order: 2, layout: "compact", fields: { items: "Dashboard, My Files, Photos, Videos, Music, Documents" } },
    { id: "hero", label: "Hero / Banner", visible: true, order: 3, layout: "split", fields: { eyebrow: "Secure. Smart. Seamless.", title: "Welcome to Novaa Drive", description: "Store, manage and access your files securely from anywhere.", primaryText: "Sign In Securely", primaryLink: "/" } },
    { id: "features", label: "Features", visible: true, order: 4, layout: "grid", fields: { title: "Everything you need in one secure drive", description: "Organize, protect, and access your files with confidence." } },
    { id: "storage", label: "Storage / Files", visible: true, order: 5, layout: "grid", fields: { title: "Your files, organized", description: "Keep photos, videos, music, and documents close at hand." } },
    { id: "pricing", label: "Pricing", visible: true, order: 6, layout: "grid", fields: { title: "Plans that grow with you", description: "Choose the storage that fits your workflow." } },
    { id: "user", label: "User Section", visible: true, order: 7, layout: "compact", fields: { loginTitle: "Welcome Back", loginText: "Sign in to continue to Novaa Drive", registerText: "Create a secure account", guestText: "Continue as Guest" } },
    { id: "footer", label: "Footer", visible: true, order: 8, layout: "full", fields: { text: "Novaa Drive • Secure • Smart • Seamless", links: "Privacy, Terms, Support" } },
  ],
};

function cloneContent(content: SiteContent): SiteContent {
  return JSON.parse(JSON.stringify(content)) as SiteContent;
}

function readContent(key: string): SiteContent {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return cloneContent(defaultSiteContent);
    const parsed = JSON.parse(raw) as SiteContent;
    return parsed?.sections ? parsed : cloneContent(defaultSiteContent);
  } catch {
    return cloneContent(defaultSiteContent);
  }
}

function writeContent(key: string, content: SiteContent) {
  localStorage.setItem(key, JSON.stringify({ ...content, updatedAt: new Date().toISOString() }));
}

export function getPublishedSiteContent(): SiteContent {
  return readContent(PUBLISHED_KEY);
}

export function getDraftSiteContent(): SiteContent {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) return readContent(DRAFT_KEY);
    const published = getPublishedSiteContent();
    writeContent(DRAFT_KEY, published);
    return published;
  } catch {
    return cloneContent(defaultSiteContent);
  }
}

export function saveDraftSiteContent(content: SiteContent): SiteContent {
  const next = { ...cloneContent(content), updatedAt: new Date().toISOString() };
  writeContent(DRAFT_KEY, next);
  return next;
}

export function publishSiteContent(content: SiteContent): SiteContent {
  const next = { ...cloneContent(content), updatedAt: new Date().toISOString() };
  writeContent(PUBLISHED_KEY, next);
  writeContent(DRAFT_KEY, next);
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: next }));
  return next;
}

export function resetDraftSiteContent(): SiteContent {
  const published = getPublishedSiteContent();
  writeContent(DRAFT_KEY, published);
  return published;
}

export function useSiteContent(): SiteContent {
  const [content, setContent] = useState<SiteContent>(() => getPublishedSiteContent());

  useEffect(() => {
    const update = (event?: Event) => {
      const detail = event instanceof CustomEvent ? event.detail as SiteContent : undefined;
      setContent(detail?.sections ? detail : getPublishedSiteContent());
    };
    window.addEventListener(CHANGE_EVENT, update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener(CHANGE_EVENT, update);
      window.removeEventListener("storage", update);
    };
  }, []);

  return content;
}

export function getSiteSection(content: SiteContent, id: string): SiteSection | undefined {
  return content.sections.find((section) => section.id === id);
}

export function getOrderedVisibleSections(content: SiteContent): SiteSection[] {
  return content.sections.filter((section) => section.visible).sort((a, b) => a.order - b.order);
}
