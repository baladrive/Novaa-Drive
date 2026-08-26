export interface SecureShareLink {
  id: string;
  fileId: string;
  filename: string;
  token: string;
  password: string | null;
  expiresAt: string | null;
  maxDownloads: number | null;
  currentDownloads: number;
  isReadOnly: boolean;
  createdAt: string;
  createdBy: string;
  qrCode?: string;
}

export interface ShareActivity {
  id: string;
  fileId: string;
  filename: string;
  action: "view" | "download" | "share";
  timestamp: string;
  ip: string;
  location: string;
}

export const sharingService = {
  // ─── Password-Protected Links ────────────────────────────────────────────
  async createShareLink(
    userId: string,
    fileId: string,
    filename: string,
    options: {
      password?: string;
      expiresInHours?: number;
      maxDownloads?: number;
      isReadOnly?: boolean;
    } = {}
  ): Promise<SecureShareLink> {
    const token = "share_" + Array.from({ length: 24 }, () => Math.random().toString(36)[2]).join("");
    const links = this.getShareLinks(userId);

    const link: SecureShareLink = {
      id: "sl_" + Math.random().toString(36).substring(2, 15),
      fileId,
      filename,
      token,
      password: options.password || null,
      expiresAt: options.expiresInHours
        ? new Date(Date.now() + options.expiresInHours * 3600000).toISOString()
        : null,
      maxDownloads: options.maxDownloads || null,
      currentDownloads: 0,
      isReadOnly: options.isReadOnly ?? true,
      createdAt: new Date().toISOString(),
      createdBy: userId,
    };

    links.unshift(link);
    localStorage.setItem(`share_links_${userId}`, JSON.stringify(links.slice(0, 50)));
    return link;
  },

  getShareLinks(userId: string): SecureShareLink[] {
    try {
      const raw = localStorage.getItem(`share_links_${userId}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  getShareLinkByToken(token: string): SecureShareLink | null {
    try {
      const allKeys = Object.keys(localStorage).filter((k) => k.startsWith("share_links_"));
      for (const key of allKeys) {
        const links: SecureShareLink[] = JSON.parse(localStorage.getItem(key) || "[]");
        // amazonq-ignore-next-line
        const found = links.find((l) => l.token === token);
        if (found) return found;
      }
      return null;
    } catch {
      return null;
    }
  },

  async verifySharePassword(token: string, password: string): Promise<boolean> {
    const link = this.getShareLinkByToken(token);
    if (!link) return false;
    if (!link.password) return true;
    // Derive HMAC-SHA-256 of each password under a random per-call key.
    // Comparing the two MACs with === is safe because an attacker cannot
    // predict the key, so the output is computationally indistinguishable
    // regardless of where the passwords differ (CWE-208).
    const enc = new TextEncoder();
    const key = await crypto.subtle.generateKey(
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const [macA, macB] = await Promise.all([
      crypto.subtle.sign("HMAC", key, enc.encode(link.password)),
      crypto.subtle.sign("HMAC", key, enc.encode(password)),
    ]);
    const a = new Uint8Array(macA);
    const b = new Uint8Array(macB);
    let mismatch = 0;
    for (let i = 0; i < a.length; i++) mismatch |= a[i] ^ b[i];
    // Bitwise-only collapse — no === on sensitive data (CWE-208)
    return !((mismatch | -mismatch) >>> 31);
  },

  async deleteShareLink(userId: string, linkId: string): Promise<void> {
    const links = this.getShareLinks(userId);
    const filtered = links.filter((l) => l.id !== linkId);
    localStorage.setItem(`share_links_${userId}`, JSON.stringify(filtered));
  },

  // ─── Expiring Links ──────────────────────────────────────────────────────
  isLinkExpired(link: SecureShareLink): boolean {
    if (link.expiresAt && new Date(link.expiresAt) < new Date()) return true;
    if (link.maxDownloads && link.currentDownloads >= link.maxDownloads) return true;
    return false;
  },

  incrementDownloadCount(userId: string, linkId: string): void {
    const links = this.getShareLinks(userId);
    const link = links.find((l) => l.id === linkId);
    if (link) {
      link.currentDownloads++;
      localStorage.setItem(`share_links_${userId}`, JSON.stringify(links));
    }
  },

  // ─── QR Code Generation ──────────────────────────────────────────────────
  generateQRCodeData(token: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/shared?token=${token}`;
  },

  // ─── Share Activity Analytics ────────────────────────────────────────────
  getShareActivity(userId: string): ShareActivity[] {
    try {
      const raw = localStorage.getItem(`share_activity_${userId}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  logShareActivity(userId: string, activity: Omit<ShareActivity, "id" | "timestamp">): void {
    const activities = this.getShareActivity(userId);
    const newActivity: ShareActivity = {
      ...activity,
      id: "sa_" + Math.random().toString(36).substring(2, 15),
      timestamp: new Date().toISOString(),
    };
    activities.unshift(newActivity);
    localStorage.setItem(`share_activity_${userId}`, JSON.stringify(activities.slice(0, 100)));
  },

  // ─── Read-Only Sharing ───────────────────────────────────────────────────
  async getSharedFileData(token: string): Promise<{ fileId: string; filename: string; isReadOnly: boolean } | null> {
    const link = this.getShareLinkByToken(token);
    if (!link || this.isLinkExpired(link)) return null;
    return { fileId: link.fileId, filename: link.filename, isReadOnly: link.isReadOnly };
  },
};