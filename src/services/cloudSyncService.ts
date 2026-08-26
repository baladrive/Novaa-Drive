export interface SyncEntry {
  id: string;
  type: "upload" | "download" | "delete" | "rename" | "move";
  fileId: string;
  filename: string;
  status: "pending" | "syncing" | "completed" | "failed";
  timestamp: string;
  size: number;
  error?: string;
}

export interface ConnectedDevice {
  id: string;
  name: string;
  type: "desktop" | "mobile" | "tablet" | "web";
  os: string;
  browser: string;
  lastSynced: string;
  isOnline: boolean;
  filesCount: number;
}

export const cloudSyncService = {
  // ─── Offline Mode ────────────────────────────────────────────────────────
  isOfflineMode(): boolean {
    return !navigator.onLine || localStorage.getItem("force_offline") === "true";
  },

  toggleForceOffline(enabled: boolean): void {
    localStorage.setItem("force_offline", enabled ? "true" : "false");
  },

  // ─── Auto Sync ───────────────────────────────────────────────────────────
  isAutoSyncEnabled(): boolean {
    return localStorage.getItem("auto_sync") !== "false";
  },

  toggleAutoSync(enabled: boolean): void {
    localStorage.setItem("auto_sync", enabled ? "true" : "false");
  },

  getSyncQueue(userId: string): SyncEntry[] {
    try {
      const raw = localStorage.getItem(`sync_queue_${userId}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  addToSyncQueue(userId: string, entry: Omit<SyncEntry, "id" | "timestamp" | "status">): void {
    const queue = this.getSyncQueue(userId);
    const newEntry: SyncEntry = {
      ...entry,
      id: "sync_" + Math.random().toString(36).substring(2, 15),
      timestamp: new Date().toISOString(),
      status: "pending",
    };
    queue.push(newEntry);
    localStorage.setItem(`sync_queue_${userId}`, JSON.stringify(queue.slice(-100)));
  },

  updateSyncStatus(userId: string, syncId: string, status: SyncEntry["status"], error?: string): void {
    const queue = this.getSyncQueue(userId);
    const idx = queue.findIndex((s) => s.id === syncId);
    if (idx !== -1) {
      queue[idx].status = status;
      if (error) queue[idx].error = error;
      localStorage.setItem(`sync_queue_${userId}`, JSON.stringify(queue));
    }
  },

  clearSyncQueue(userId: string): void {
    localStorage.setItem(`sync_queue_${userId}`, JSON.stringify([]));
  },

  // ─── Device Backup ───────────────────────────────────────────────────────
  getLastBackup(userId: string): string | null {
    return localStorage.getItem(`last_backup_${userId}`);
  },

  setLastBackup(userId: string): void {
    localStorage.setItem(`last_backup_${userId}`, new Date().toISOString());
  },

  isBackupScheduled(userId: string): boolean {
    return localStorage.getItem(`backup_scheduled_${userId}`) === "true";
  },

  toggleBackupSchedule(userId: string, enabled: boolean): void {
    localStorage.setItem(`backup_scheduled_${userId}`, enabled ? "true" : "false");
  },

  // ─── Sync Status ─────────────────────────────────────────────────────────
  getSyncStatus(userId: string): { pending: number; syncing: number; completed: number; failed: number } {
    const queue = this.getSyncQueue(userId);
    return {
      pending: queue.filter((s) => s.status === "pending").length,
      syncing: queue.filter((s) => s.status === "syncing").length,
      completed: queue.filter((s) => s.status === "completed").length,
      failed: queue.filter((s) => s.status === "failed").length,
    };
  },

  // ─── Connected Devices ───────────────────────────────────────────────────
  getConnectedDevices(userId: string): ConnectedDevice[] {
    try {
      const raw = localStorage.getItem(`connected_devices_${userId}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  registerDevice(userId: string, device: Omit<ConnectedDevice, "id" | "lastSynced" | "isOnline">): ConnectedDevice {
    const devices = this.getConnectedDevices(userId);
    const existing = devices.find((d) => d.name === device.name && d.type === device.type);

    if (existing) {
      existing.lastSynced = new Date().toISOString();
      existing.isOnline = true;
      localStorage.setItem(`connected_devices_${userId}`, JSON.stringify(devices));
      return existing;
    }

    const newDevice: ConnectedDevice = {
      ...device,
      id: "cd_" + Math.random().toString(36).substring(2, 15),
      lastSynced: new Date().toISOString(),
      isOnline: true,
    };
    devices.push(newDevice);
    localStorage.setItem(`connected_devices_${userId}`, JSON.stringify(devices));
    return newDevice;
  },

  updateDeviceSync(userId: string, deviceId: string): void {
    const devices = this.getConnectedDevices(userId);
    const device = devices.find((d) => d.id === deviceId);
    if (device) {
      device.lastSynced = new Date().toISOString();
      localStorage.setItem(`connected_devices_${userId}`, JSON.stringify(devices));
    }
  },

  removeDevice(userId: string, deviceId: string): void {
    const devices = this.getConnectedDevices(userId);
    localStorage.setItem(`connected_devices_${userId}`, JSON.stringify(devices.filter((d) => d.id !== deviceId)));
  },

  // ─── Cross-Device Sync ───────────────────────────────────────────────────
  getLastCrossDeviceSync(userId: string): string | null {
    return localStorage.getItem(`cross_device_sync_${userId}`);
  },

  setCrossDeviceSync(userId: string): void {
    localStorage.setItem(`cross_device_sync_${userId}`, new Date().toISOString());
  },
};