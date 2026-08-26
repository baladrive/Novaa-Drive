export interface StorageHealthScore {
  overall: number;
  categories: {
    organization: number;
    duplicates: number;
    trash: number;
    storage: number;
    security: number;
  };
  recommendations: string[];
}

export interface MonthlyAnalytics {
  month: string;
  uploads: number;
  downloads: number;
  storageUsed: number;
  filesAdded: number;
  filesDeleted: number;
  sharesCreated: number;
}

export interface WeeklyActivity {
  day: string;
  uploads: number;
  downloads: number;
  views: number;
}

export interface UploadDownloadStats {
  totalUploads: number;
  totalDownloads: number;
  totalUploadSize: number;
  totalDownloadSize: number;
  averageFileSize: number;
  mostActiveDay: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: string | null;
  progress: number;
  maxProgress: number;
  category: "storage" | "sharing" | "organization" | "security" | "milestone";
}

export interface ProductivityScore {
  overall: number;
  breakdown: {
    organization: number;
    cleanup: number;
    sharing: number;
    security: number;
    engagement: number;
  };
  level: string;
  nextLevelProgress: number;
}

export const analyticsService = {
  // ─── Storage Health Score ────────────────────────────────────────────────
  calculateHealthScore(stats: {
    used: number;
    limit: number;
    fileCount: number;
    categoryBreakdown: Record<string, number>;
  }, trashedCount: number, hasDuplicates: boolean, has2FA: boolean): StorageHealthScore {
    const usagePercent = (stats.used / stats.limit) * 100;

    // Organization score: how evenly distributed files are across categories
    const catValues = Object.values(stats.categoryBreakdown);
    const total = catValues.reduce((a, b) => a + b, 0);
    const avg = total / Math.max(catValues.length, 1);
    const variance = catValues.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / Math.max(catValues.length, 1);
    const organization = Math.max(0, Math.min(100, 100 - (variance / (avg + 1)) * 0.1));

    // Duplicates score
    const duplicates = hasDuplicates ? 50 : 100;

    // Trash score
    const trash = Math.max(0, 100 - trashedCount * 5);

    // Storage score
    const storage = Math.max(0, 100 - usagePercent);

    // Security score
    const security = has2FA ? 100 : 40;

    const overall = Math.round((organization + duplicates + trash + storage + security) / 5);

    const recommendations: string[] = [];
    if (usagePercent > 80) recommendations.push("Free up storage space by deleting unnecessary files");
    if (trashedCount > 5) recommendations.push(`Empty trash (${trashedCount} items taking up space)`);
    if (hasDuplicates) recommendations.push("Remove duplicate files to reclaim storage");
    if (!has2FA) recommendations.push("Enable two-factor authentication for better security");
    if (organization < 60) recommendations.push("Organize files into folders for better structure");

    return {
      overall,
      categories: { organization: Math.round(organization), duplicates, trash, storage: Math.round(storage), security },
      recommendations,
    };
  },

  // ─── Monthly Analytics ───────────────────────────────────────────────────
  getMonthlyAnalytics(userId: string): MonthlyAnalytics[] {
    try {
      const raw = localStorage.getItem(`monthly_analytics_${userId}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  addMonthlyAnalytics(userId: string, entry: MonthlyAnalytics): void {
    const data = this.getMonthlyAnalytics(userId);
    data.push(entry);
    localStorage.setItem(`monthly_analytics_${userId}`, JSON.stringify(data.slice(-12)));
  },

  // ─── Weekly Activity ─────────────────────────────────────────────────────
  getWeeklyActivity(userId: string): WeeklyActivity[] {
    try {
      const raw = localStorage.getItem(`weekly_activity_${userId}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  logActivity(userId: string, type: "upload" | "download" | "view"): void {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const today = days[new Date().getDay()];
    const activity = this.getWeeklyActivity(userId);

    let dayEntry = activity.find((a) => a.day === today);
    if (!dayEntry) {
      dayEntry = { day: today, uploads: 0, downloads: 0, views: 0 };
      activity.push(dayEntry);
    }

    if (type === "upload") dayEntry.uploads++;
    if (type === "download") dayEntry.downloads++;
    if (type === "view") dayEntry.views++;

    localStorage.setItem(`weekly_activity_${userId}`, JSON.stringify(activity.slice(-7)));
  },

  // ─── Upload/Download Stats ───────────────────────────────────────────────
  getUploadDownloadStats(userId: string): UploadDownloadStats {
    try {
      const raw = localStorage.getItem(`ud_stats_${userId}`);
      return raw
        ? JSON.parse(raw)
        : { totalUploads: 0, totalDownloads: 0, totalUploadSize: 0, totalDownloadSize: 0, averageFileSize: 0, mostActiveDay: "N/A" };
    } catch {
      return { totalUploads: 0, totalDownloads: 0, totalUploadSize: 0, totalDownloadSize: 0, averageFileSize: 0, mostActiveDay: "N/A" };
    }
  },

  updateUploadDownloadStats(userId: string, type: "upload" | "download", size: number): void {
    const stats = this.getUploadDownloadStats(userId);
    if (type === "upload") {
      stats.totalUploads++;
      stats.totalUploadSize += size;
    } else {
      stats.totalDownloads++;
      stats.totalDownloadSize += size;
    }
    stats.averageFileSize = stats.totalUploads > 0 ? Math.round(stats.totalUploadSize / stats.totalUploads) : 0;
    localStorage.setItem(`ud_stats_${userId}`, JSON.stringify(stats));
  },

  // ─── Most Viewed Files ───────────────────────────────────────────────────
  getMostViewedFiles(userId: string): { fileId: string; filename: string; views: number }[] {
    try {
      const raw = localStorage.getItem(`most_viewed_${userId}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  logFileView(userId: string, fileId: string, filename: string): void {
    const views = this.getMostViewedFiles(userId);
    const existing = views.find((v) => v.fileId === fileId);
    if (existing) {
      existing.views++;
    } else {
      views.push({ fileId, filename, views: 1 });
    }
    views.sort((a, b) => b.views - a.views);
    localStorage.setItem(`most_viewed_${userId}`, JSON.stringify(views.slice(0, 20)));
  },

  // ─── Most Shared Files ───────────────────────────────────────────────────
  getMostSharedFiles(userId: string): { fileId: string; filename: string; shares: number }[] {
    try {
      const raw = localStorage.getItem(`most_shared_${userId}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  logFileShare(userId: string, fileId: string, filename: string): void {
    const shares = this.getMostSharedFiles(userId);
    const existing = shares.find((s) => s.fileId === fileId);
    if (existing) {
      existing.shares++;
    } else {
      shares.push({ fileId, filename, shares: 1 });
    }
    shares.sort((a, b) => b.shares - a.shares);
    localStorage.setItem(`most_shared_${userId}`, JSON.stringify(shares.slice(0, 20)));
  },

  // ─── Largest Files ───────────────────────────────────────────────────────
  getLargestFiles(files: { id: string; filename: string; size: number }[]): { id: string; filename: string; size: number }[] {
    return [...files].sort((a, b) => b.size - a.size).slice(0, 20);
  },

  // ─── Recently Modified Files ─────────────────────────────────────────────
  getRecentlyModified(files: { id: string; filename: string; created_at: string }[]): { id: string; filename: string; modifiedAt: string }[] {
    return [...files]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 20)
      .map((f) => ({ id: f.id, filename: f.filename, modifiedAt: f.created_at }));
  },

  // ─── Achievements & Badges ───────────────────────────────────────────────
  getAchievements(userId: string): Achievement[] {
    const allAchievements: Achievement[] = [
      { id: "first_upload", title: "First Upload", description: "Upload your first file", icon: "🚀", unlockedAt: null, progress: 0, maxProgress: 1, category: "milestone" },
      { id: "storage_1gb", title: "Storage Novice", description: "Reach 1GB of storage used", icon: "💾", unlockedAt: null, progress: 0, maxProgress: 1073741824, category: "storage" },
      { id: "storage_10gb", title: "Storage Pro", description: "Reach 10GB of storage used", icon: "💿", unlockedAt: null, progress: 0, maxProgress: 10737418240, category: "storage" },
      { id: "storage_100gb", title: "Storage Master", description: "Reach 100GB of storage used", icon: "🏆", unlockedAt: null, progress: 0, maxProgress: 107374182400, category: "storage" },
      { id: "files_100", title: "File Collector", description: "Upload 100 files", icon: "📁", unlockedAt: null, progress: 0, maxProgress: 100, category: "milestone" },
      { id: "files_1000", title: "File Hoarder", description: "Upload 1000 files", icon: "📦", unlockedAt: null, progress: 0, maxProgress: 1000, category: "milestone" },
      { id: "share_first", title: "Sharing is Caring", description: "Share your first file", icon: "🔗", unlockedAt: null, progress: 0, maxProgress: 1, category: "sharing" },
      { id: "share_10", title: "Social Butterfly", description: "Share 10 files", icon: "🦋", unlockedAt: null, progress: 0, maxProgress: 10, category: "sharing" },
      { id: "organize_folders", title: "Organizer", description: "Create 5 folders", icon: "📂", unlockedAt: null, progress: 0, maxProgress: 5, category: "organization" },
      { id: "security_2fa", title: "Secure Citizen", description: "Enable two-factor authentication", icon: "🔒", unlockedAt: null, progress: 0, maxProgress: 1, category: "security" },
      { id: "cleanup_trash", title: "Clean Sweep", description: "Empty trash 5 times", icon: "🧹", unlockedAt: null, progress: 0, maxProgress: 5, category: "organization" },
      { id: "days_7", title: "Weekly Warrior", description: "Use Bala Drive for 7 consecutive days", icon: "🔥", unlockedAt: null, progress: 0, maxProgress: 7, category: "milestone" },
      { id: "days_30", title: "Dedicated User", description: "Use Bala Drive for 30 days", icon: "⭐", unlockedAt: null, progress: 0, maxProgress: 30, category: "milestone" },
    ];

    try {
      const raw = localStorage.getItem(`achievements_${userId}`);
      const saved: Achievement[] = raw ? JSON.parse(raw) : [];
      // Merge saved progress with defaults
      return allAchievements.map((a) => {
        const savedA = saved.find((s) => s.id === a.id);
        return savedA || a;
      });
    } catch {
      return allAchievements;
    }
  },

  updateAchievement(userId: string, achievementId: string, progress: number): Achievement | null {
    const achievements = this.getAchievements(userId);
    const idx = achievements.findIndex((a) => a.id === achievementId);
    if (idx === -1) return null;

    achievements[idx].progress = Math.min(progress, achievements[idx].maxProgress);
    if (achievements[idx].progress >= achievements[idx].maxProgress && !achievements[idx].unlockedAt) {
      achievements[idx].unlockedAt = new Date().toISOString();
    }

    localStorage.setItem(`achievements_${userId}`, JSON.stringify(achievements));
    return achievements[idx];
  },

  // ─── Productivity Score ──────────────────────────────────────────────────
  calculateProductivityScore(userId: string, stats: {
    fileCount: number;
    used: number;
    limit: number;
  }, trashedCount: number, has2FA: boolean, sharedCount: number): ProductivityScore {
    const organization = Math.min(100, (stats.fileCount / 50) * 20);
    const cleanup = Math.max(0, 100 - trashedCount * 10);
    const sharing = Math.min(100, sharedCount * 20);
    const security = has2FA ? 100 : 30;
    const engagement = Math.min(100, (stats.fileCount / 10) * 5);

    const overall = Math.round((organization + cleanup + sharing + security + engagement) / 5);

    let level = "Beginner";
    let nextLevelProgress = overall;

    if (overall >= 90) { level = "Elite"; nextLevelProgress = 100; }
    else if (overall >= 75) { level = "Advanced"; nextLevelProgress = overall; }
    else if (overall >= 50) { level = "Intermediate"; nextLevelProgress = overall; }
    else if (overall >= 25) { level = "Growing"; nextLevelProgress = overall; }

    return {
      overall,
      breakdown: { organization: Math.round(organization), cleanup, sharing, security, engagement: Math.round(engagement) },
      level,
      nextLevelProgress,
    };
  },
};