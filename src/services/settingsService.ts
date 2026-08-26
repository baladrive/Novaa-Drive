// ─── Settings Service ─────────────────────────────────────────────────────
// Handles all user settings persistence via localStorage
// All settings are stored per-user with a userId prefix

export interface ProfileSettings {
  displayName: string;
  username: string;
  email: string;
  phone: string;
  bio: string;
  avatarUrl: string;
  profileVisibility: 'public' | 'private' | 'contacts';
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  autoLogoutTimeout: number; // minutes
  loginAlerts: boolean;
  deviceNotifications: boolean;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'private' | 'contacts';
  dataSharing: boolean;
  analyticsEnabled: boolean;
  cookiePreferences: {
    necessary: boolean;
    functional: boolean;
    analytics: boolean;
    marketing: boolean;
  };
}

export interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  securityAlerts: boolean;
  marketingNotifications: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export interface AppearanceSettings {
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  layout: 'default' | 'compact' | 'spacious';
  glassmorphism: boolean;
  animationsEnabled: boolean;
  accentColor: string;
}

export interface LanguageRegionSettings {
  language: string;
  timezone: string;
  dateFormat: string;
  numberFormat: string;
  region: string;
}

export interface StorageSettings {
  uploadQuality: 'original' | 'high' | 'medium' | 'low';
  autoUpload: boolean;
  wifiOnlyUpload: boolean;
  backgroundUploads: boolean;
  downloadQuality: 'original' | 'high' | 'medium' | 'low';
  downloadLocation: string;
  offlineStorage: boolean;
}

export interface BackupSettings {
  automaticBackup: boolean;
  lastBackup: string | null;
  backupInterval: 'daily' | 'weekly' | 'monthly';
}

export interface UploadSettings {
  uploadQuality: 'original' | 'high' | 'medium' | 'low';
  autoUpload: boolean;
  wifiOnly: boolean;
  backgroundUploads: boolean;
}

export interface DownloadSettings {
  downloadQuality: 'original' | 'high' | 'medium' | 'low';
  downloadLocation: string;
  offlineStorage: boolean;
}

export interface ConnectedService {
  id: string;
  name: string;
  type: 'device' | 'browser' | 'account' | 'integration';
  icon: string;
  connectedAt: string;
  lastActive: string;
  status: 'active' | 'inactive';
}

export interface AppSettings {
  version: string;
  releaseNotes: string;
  checkUpdates: boolean;
  diagnosticsEnabled: boolean;
  errorReporting: boolean;
}

// ─── Default Settings ────────────────────────────────────────────────────

const DEFAULT_PROFILE: ProfileSettings = {
  displayName: '',
  username: '',
  email: '',
  phone: '',
  bio: '',
  avatarUrl: '',
  profileVisibility: 'public',
};

const DEFAULT_SECURITY: SecuritySettings = {
  twoFactorEnabled: false,
  autoLogoutTimeout: 60,
  loginAlerts: true,
  deviceNotifications: true,
};

const DEFAULT_PRIVACY: PrivacySettings = {
  profileVisibility: 'public',
  dataSharing: false,
  analyticsEnabled: true,
  cookiePreferences: {
    necessary: true,
    functional: true,
    analytics: false,
    marketing: false,
  },
};

const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  emailNotifications: true,
  pushNotifications: true,
  smsNotifications: false,
  securityAlerts: true,
  marketingNotifications: false,
  soundEnabled: true,
  vibrationEnabled: true,
};

const DEFAULT_APPEARANCE: AppearanceSettings = {
  theme: 'system',
  fontSize: 'medium',
  layout: 'default',
  glassmorphism: true,
  animationsEnabled: true,
  accentColor: 'Amber',
};

const DEFAULT_LANGUAGE_REGION: LanguageRegionSettings = {
  language: 'en',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  dateFormat: 'MM/DD/YYYY',
  numberFormat: 'en-US',
  region: 'US',
};

const DEFAULT_STORAGE: StorageSettings = {
  uploadQuality: 'original',
  autoUpload: true,
  wifiOnlyUpload: false,
  backgroundUploads: true,
  downloadQuality: 'original',
  downloadLocation: 'default',
  offlineStorage: false,
};

const DEFAULT_BACKUP: BackupSettings = {
  automaticBackup: false,
  lastBackup: null,
  backupInterval: 'weekly',
};

const DEFAULT_UPLOAD: UploadSettings = {
  uploadQuality: 'original',
  autoUpload: true,
  wifiOnly: false,
  backgroundUploads: true,
};

const DEFAULT_DOWNLOAD: DownloadSettings = {
  downloadQuality: 'original',
  downloadLocation: 'default',
  offlineStorage: false,
};

const DEFAULT_APP: AppSettings = {
  version: '1.0.0',
  releaseNotes: 'Initial release with comprehensive settings management.',
  checkUpdates: true,
  diagnosticsEnabled: true,
  errorReporting: true,
};

// ─── Storage Helpers ─────────────────────────────────────────────────────

function getKey(userId: string, section: string): string {
  return `settings_${userId}_${section}`;
}

function getItem<T>(userId: string, section: string, defaults: T): T {
  try {
    const raw = localStorage.getItem(getKey(userId, section));
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...defaults, ...parsed };
    }
  } catch {}
  return { ...defaults };
}

function setItem<T>(userId: string, section: string, value: T): void {
  try {
    localStorage.setItem(getKey(userId, section), JSON.stringify(value));
  } catch {}
}

// ─── Settings Service ────────────────────────────────────────────────────

export const settingsService = {
  // ─── Profile ──────────────────────────────────────────────────────────
  getProfile(userId: string): ProfileSettings {
    return getItem(userId, 'profile', DEFAULT_PROFILE);
  },

  saveProfile(userId: string, settings: ProfileSettings): void {
    setItem(userId, 'profile', settings);
  },

  updateProfile(userId: string, updates: Partial<ProfileSettings>): ProfileSettings {
    const current = this.getProfile(userId);
    const updated = { ...current, ...updates };
    this.saveProfile(userId, updated);
    return updated;
  },

  // ─── Security ─────────────────────────────────────────────────────────
  getSecurity(userId: string): SecuritySettings {
    return getItem(userId, 'security', DEFAULT_SECURITY);
  },

  saveSecurity(userId: string, settings: SecuritySettings): void {
    setItem(userId, 'security', settings);
  },

  updateSecurity(userId: string, updates: Partial<SecuritySettings>): SecuritySettings {
    const current = this.getSecurity(userId);
    const updated = { ...current, ...updates };
    this.saveSecurity(userId, updated);
    return updated;
  },

  // ─── Privacy ──────────────────────────────────────────────────────────
  getPrivacy(userId: string): PrivacySettings {
    return getItem(userId, 'privacy', DEFAULT_PRIVACY);
  },

  savePrivacy(userId: string, settings: PrivacySettings): void {
    setItem(userId, 'privacy', settings);
  },

  updatePrivacy(userId: string, updates: Partial<PrivacySettings>): PrivacySettings {
    const current = this.getPrivacy(userId);
    const updated = { ...current, ...updates };
    this.savePrivacy(userId, updated);
    return updated;
  },

  // ─── Notifications ────────────────────────────────────────────────────
  getNotifications(userId: string): NotificationSettings {
    return getItem(userId, 'notifications', DEFAULT_NOTIFICATIONS);
  },

  saveNotifications(userId: string, settings: NotificationSettings): void {
    setItem(userId, 'notifications', settings);
  },

  updateNotifications(userId: string, updates: Partial<NotificationSettings>): NotificationSettings {
    const current = this.getNotifications(userId);
    const updated = { ...current, ...updates };
    this.saveNotifications(userId, updated);
    return updated;
  },

  // ─── Appearance ───────────────────────────────────────────────────────
  getAppearance(userId: string): AppearanceSettings {
    return getItem(userId, 'appearance', DEFAULT_APPEARANCE);
  },

  saveAppearance(userId: string, settings: AppearanceSettings): void {
    setItem(userId, 'appearance', settings);
  },

  updateAppearance(userId: string, updates: Partial<AppearanceSettings>): AppearanceSettings {
    const current = this.getAppearance(userId);
    const updated = { ...current, ...updates };
    this.saveAppearance(userId, updated);
    return updated;
  },

  // ─── Language & Region ────────────────────────────────────────────────
  getLanguageRegion(userId: string): LanguageRegionSettings {
    return getItem(userId, 'language_region', DEFAULT_LANGUAGE_REGION);
  },

  saveLanguageRegion(userId: string, settings: LanguageRegionSettings): void {
    setItem(userId, 'language_region', settings);
  },

  updateLanguageRegion(userId: string, updates: Partial<LanguageRegionSettings>): LanguageRegionSettings {
    const current = this.getLanguageRegion(userId);
    const updated = { ...current, ...updates };
    this.saveLanguageRegion(userId, updated);
    return updated;
  },

  // ─── Storage ──────────────────────────────────────────────────────────
  getStorage(userId: string): StorageSettings {
    return getItem(userId, 'storage', DEFAULT_STORAGE);
  },

  saveStorage(userId: string, settings: StorageSettings): void {
    setItem(userId, 'storage', settings);
  },

  updateStorage(userId: string, updates: Partial<StorageSettings>): StorageSettings {
    const current = this.getStorage(userId);
    const updated = { ...current, ...updates };
    this.saveStorage(userId, updated);
    return updated;
  },

  // ─── Upload ───────────────────────────────────────────────────────────
  getUpload(userId: string): UploadSettings {
    return getItem(userId, 'upload', DEFAULT_UPLOAD);
  },

  saveUpload(userId: string, settings: UploadSettings): void {
    setItem(userId, 'upload', settings);
  },

  updateUpload(userId: string, updates: Partial<UploadSettings>): UploadSettings {
    const current = this.getUpload(userId);
    const updated = { ...current, ...updates };
    this.saveUpload(userId, updated);
    return updated;
  },

  // ─── Download ─────────────────────────────────────────────────────────
  getDownload(userId: string): DownloadSettings {
    return getItem(userId, 'download', DEFAULT_DOWNLOAD);
  },

  saveDownload(userId: string, settings: DownloadSettings): void {
    setItem(userId, 'download', settings);
  },

  updateDownload(userId: string, updates: Partial<DownloadSettings>): DownloadSettings {
    const current = this.getDownload(userId);
    const updated = { ...current, ...updates };
    this.saveDownload(userId, updated);
    return updated;
  },

  // ─── Backup ───────────────────────────────────────────────────────────
  getBackup(userId: string): BackupSettings {
    return getItem(userId, 'backup', DEFAULT_BACKUP);
  },

  saveBackup(userId: string, settings: BackupSettings): void {
    setItem(userId, 'backup', settings);
  },

  updateBackup(userId: string, updates: Partial<BackupSettings>): BackupSettings {
    const current = this.getBackup(userId);
    const updated = { ...current, ...updates };
    this.saveBackup(userId, updated);
    return updated;
  },

  // ─── Connected Services ───────────────────────────────────────────────
  getConnectedServices(userId: string): ConnectedService[] {
    try {
      const raw = localStorage.getItem(`connected_services_${userId}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  saveConnectedServices(userId: string, services: ConnectedService[]): void {
    try {
      localStorage.setItem(`connected_services_${userId}`, JSON.stringify(services));
    } catch {}
  },

  addConnectedService(userId: string, service: Omit<ConnectedService, 'id' | 'connectedAt' | 'lastActive'>): ConnectedService {
    const services = this.getConnectedServices(userId);
    const newService: ConnectedService = {
      ...service,
      id: 'svc_' + Math.random().toString(36).substring(2, 15),
      connectedAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
    };
    services.push(newService);
    this.saveConnectedServices(userId, services);
    return newService;
  },

  removeConnectedService(userId: string, serviceId: string): void {
    const services = this.getConnectedServices(userId);
    this.saveConnectedServices(userId, services.filter(s => s.id !== serviceId));
  },

  // ─── App ──────────────────────────────────────────────────────────────
  getApp(userId: string): AppSettings {
    return getItem(userId, 'app', DEFAULT_APP);
  },

  saveApp(userId: string, settings: AppSettings): void {
    setItem(userId, 'app', settings);
  },

  updateApp(userId: string, updates: Partial<AppSettings>): AppSettings {
    const current = this.getApp(userId);
    const updated = { ...current, ...updates };
    this.saveApp(userId, updated);
    return updated;
  },

  // ─── Cache Management ─────────────────────────────────────────────────
  getCacheSize(): number {
    let total = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          if (value) {
            total += key.length + value.length;
          }
        }
      }
    } catch {}
    return total;
  },

  clearCache(): void {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('cache_') || key.startsWith('rl_') || key.startsWith('biometric_'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch {}
  },

  // ─── Export / Download Data ───────────────────────────────────────────
  exportUserData(userId: string): Record<string, any> {
    const data: Record<string, any> = {};
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes(userId) || key.startsWith('settings_') || key.startsWith('novaa_'))) {
          try {
            data[key] = JSON.parse(localStorage.getItem(key) || '');
          } catch {
            data[key] = localStorage.getItem(key);
          }
        }
      }
    } catch {}
    return data;
  },

  downloadUserData(userId: string): void {
    const data = this.exportUserData(userId);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `novaa_drive_export_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  // ─── Delete Account ───────────────────────────────────────────────────
  deleteAccount(userId: string): void {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes(userId) || key.startsWith('settings_') || key.startsWith('novaa_'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch {}
  },

  // ─── Get All Settings ─────────────────────────────────────────────────
  getAllSettings(userId: string): Record<string, any> {
    return {
      profile: this.getProfile(userId),
      security: this.getSecurity(userId),
      privacy: this.getPrivacy(userId),
      notifications: this.getNotifications(userId),
      appearance: this.getAppearance(userId),
      languageRegion: this.getLanguageRegion(userId),
      storage: this.getStorage(userId),
      upload: this.getUpload(userId),
      download: this.getDownload(userId),
      backup: this.getBackup(userId),
      app: this.getApp(userId),
    };
  },
};