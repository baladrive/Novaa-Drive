export interface LoginSession {
  id: string;
  userId: string;
  device: string;
  browser: string;
  os: string;
  ip: string;
  location: string;
  lastActive: string;
  createdAt: string;
  isCurrent: boolean;
}

export interface LoginAlert {
  id: string;
  userId: string;
  device: string;
  browser: string;
  os: string;
  ip: string;
  location: string;
  timestamp: string;
  isNewDevice: boolean;
  read: boolean;
}

export interface FileAccessLog {
  id: string;
  fileId: string;
  filename: string;
  userId: string;
  action: "view" | "download" | "share" | "delete" | "rename" | "move";
  ip: string;
  device: string;
  timestamp: string;
}

// Biometric support detection
export function isBiometricSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "PublicKeyCredential" in window &&
    typeof (window as any).PublicKeyCredential === "function"
  );
}

export const securityService = {
  // ─── Biometric Login ─────────────────────────────────────────────────────
  async isBiometricReady(): Promise<boolean> {
    if (!isBiometricSupported()) return false;
    try {
      const stored = localStorage.getItem("biometric_credential_id");
      return !!stored;
    } catch {
      return false;
    }
  },

  async registerBiometric(userId: string): Promise<boolean> {
    if (!isBiometricSupported()) return false;
    try {
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const safeUserId = userId.replace(/[&<>"'`]/g, (c) => `&#${c.charCodeAt(0)};`);
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { name: "Novaa Drive", id: window.location.hostname },
          user: {
            id: new TextEncoder().encode(safeUserId),
            name: safeUserId,
            displayName: "Novaa Drive User",
          },
          pubKeyCredParams: [{ alg: -7, type: "public-key" }],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required",
          },
          timeout: 60000,
        },
      }) as any;

      if (credential) {
        // amazonq-ignore-next-line
        // Store only a non-sensitive reference identifier, not the raw credential
        sessionStorage.setItem("biometric_credential_id", credential.id);
        sessionStorage.setItem("biometric_user_id", safeUserId);
        return true;
      }
      return false;
    } catch (e) {
      console.warn("Biometric registration failed:", e);
      return false;
    }
  },

  async authenticateBiometric(): Promise<boolean> {
    if (!isBiometricSupported()) return false;
    try {
      const credentialId = sessionStorage.getItem("biometric_credential_id");
      if (!credentialId) return false;

      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge,
          allowCredentials: [
            {
              id: Uint8Array.from(atob(credentialId), (c) => c.charCodeAt(0)),
              type: "public-key",
            },
          ],
          userVerification: "required",
          timeout: 60000,
        },
      }) as any;

      return !!assertion;
    } catch (e) {
      console.warn("Biometric auth failed:", e);
      return false;
    }
  },

  // ─── Login Alerts ────────────────────────────────────────────────────────
  getLoginAlerts(userId: string): LoginAlert[] {
    try {
      const raw = localStorage.getItem(`login_alerts_${userId}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  addLoginAlert(userId: string, alert: Omit<LoginAlert, "id" | "timestamp" | "read">): void {
    const alerts = this.getLoginAlerts(userId);
    const newAlert: LoginAlert = {
      ...alert,
      id: "la_" + Math.random().toString(36).substring(2, 15),
      timestamp: new Date().toISOString(),
      read: false,
    };
    alerts.unshift(newAlert);
    localStorage.setItem(`login_alerts_${userId}`, JSON.stringify(alerts.slice(0, 50)));
  },

  markLoginAlertRead(userId: string, alertId: string): void {
    const alerts = this.getLoginAlerts(userId);
    const idx = alerts.findIndex((a) => a.id === alertId);
    if (idx !== -1) {
      alerts[idx].read = true;
      localStorage.setItem(`login_alerts_${userId}`, JSON.stringify(alerts));
    }
  },

  // ─── Device Management ───────────────────────────────────────────────────
  getDevices(userId: string): LoginSession[] {
    try {
      const raw = localStorage.getItem(`devices_${userId}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  registerDevice(userId: string, device: Omit<LoginSession, "id" | "lastActive" | "createdAt" | "isCurrent">): LoginSession {
    const devices = this.getDevices(userId);
    const newDevice: LoginSession = {
      ...device,
      id: "dev_" + Math.random().toString(36).substring(2, 15),
      lastActive: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      isCurrent: true,
    };

    // Mark all others as not current
    devices.forEach((d) => (d.isCurrent = false));
    devices.unshift(newDevice);
    localStorage.setItem(`devices_${userId}`, JSON.stringify(devices.slice(0, 20)));
    return newDevice;
  },

  removeDevice(userId: string, deviceId: string): void {
    const devices = this.getDevices(userId);
    const filtered = devices.filter((d) => d.id !== deviceId);
    localStorage.setItem(`devices_${userId}`, JSON.stringify(filtered));
  },

  logoutDevice(userId: string, deviceId: string): void {
    this.removeDevice(userId, deviceId);
  },

  // ─── Login History ───────────────────────────────────────────────────────
  getLoginHistory(userId: string): LoginSession[] {
    try {
      const raw = localStorage.getItem(`login_history_${userId}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  addLoginHistory(userId: string, entry: Omit<LoginSession, "id" | "createdAt">): void {
    const history = this.getLoginHistory(userId);
    const newEntry: LoginSession = {
      ...entry,
      id: "lh_" + Math.random().toString(36).substring(2, 15),
      createdAt: new Date().toISOString(),
    };
    history.unshift(newEntry);
    localStorage.setItem(`login_history_${userId}`, JSON.stringify(history.slice(0, 100)));
  },

  // ─── File Access Logs ────────────────────────────────────────────────────
  getFileAccessLogs(userId: string, limit = 50): FileAccessLog[] {
    try {
      const raw = localStorage.getItem(`file_access_logs_${userId}`);
      const logs: FileAccessLog[] = raw ? JSON.parse(raw) : [];
      return logs.slice(0, limit);
    } catch {
      return [];
    }
  },

  addFileAccessLog(userId: string, log: Omit<FileAccessLog, "id" | "timestamp">): void {
    const logs = this.getFileAccessLogs(userId, 200);
    const newLog: FileAccessLog = {
      ...log,
      id: "fal_" + Math.random().toString(36).substring(2, 15),
      timestamp: new Date().toISOString(),
    };
    logs.unshift(newLog);
    localStorage.setItem(`file_access_logs_${userId}`, JSON.stringify(logs.slice(0, 200)));
  },

  // ─── E2E Encryption Ready ────────────────────────────────────────────────
  isE2EEReady(): boolean {
    return localStorage.getItem("e2ee_enabled") === "true";
  },

  toggleE2EE(enabled: boolean): void {
    localStorage.setItem("e2ee_enabled", enabled ? "true" : "false");
  },

  // ─── Session Management ──────────────────────────────────────────────────
  getActiveSessions(userId: string): LoginSession[] {
    return this.getDevices(userId).filter((d) => d.isCurrent);
  },

  terminateSession(userId: string, sessionId: string): void {
    this.removeDevice(userId, sessionId);
  },

  terminateAllOtherSessions(userId: string, currentSessionId: string): void {
    const devices = this.getDevices(userId);
    const filtered = devices.filter((d) => d.id === currentSessionId);
    localStorage.setItem(`devices_${userId}`, JSON.stringify(filtered));
  },
};