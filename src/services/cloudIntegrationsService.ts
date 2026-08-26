/**
 * Cloud Storage Integrations Service
 *
 * Provides integration with Google Drive, OneDrive, Dropbox,
 * AWS S3, and Azure Blob Storage.
 */

export type CloudProvider = "google-drive" | "onedrive" | "dropbox" | "s3" | "azure";

export interface CloudConnection {
  id: string;
  provider: CloudProvider;
  displayName: string;
  email?: string;
  accountId?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
  isConnected: boolean;
  lastSync: string | null;
  storageUsed?: number;
  storageLimit?: number;
}

export interface CloudFile {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  modifiedTime: string;
  isFolder: boolean;
  downloadUrl?: string;
  webViewLink?: string;
  parentId?: string;
}

const CONNECTIONS_KEY = "novaa_cloud_connections";

function getConnections(): CloudConnection[] {
  try {
    const raw = localStorage.getItem(CONNECTIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveConnections(connections: CloudConnection[]): void {
  try {
    localStorage.setItem(CONNECTIONS_KEY, JSON.stringify(connections.slice(0, 20)));
  } catch {}
}

/** OAuth configuration for each provider */
const OAUTH_CONFIG: Record<CloudProvider, { clientId: string; redirectUri: string; scope: string; authUrl: string }> = {
  "google-drive": {
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || "google-drive-client",
    redirectUri: `${window.location.origin}/auth/callback`,
    scope: "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly",
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
  },
  "onedrive": {
    clientId: import.meta.env.VITE_ONEDRIVE_CLIENT_ID || "onedrive-client",
    redirectUri: `${window.location.origin}/auth/callback`,
    scope: "Files.ReadWrite.AppFolder offline_access",
    authUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
  },
  "dropbox": {
    clientId: import.meta.env.VITE_DROPBOX_CLIENT_ID || "dropbox-client",
    redirectUri: `${window.location.origin}/auth/callback`,
    scope: "files.metadata.read files.content.read files.content.write",
    authUrl: "https://www.dropbox.com/oauth2/authorize",
  },
  "s3": {
    clientId: "",
    redirectUri: "",
    scope: "",
    authUrl: "",
  },
  "azure": {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID || "azure-client",
    redirectUri: `${window.location.origin}/auth/callback`,
    scope: "https://storage.azure.com/user_impersonation",
    authUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
  },
};

export const cloudIntegrationsService = {
  /** Get all connected cloud accounts */
  getConnections(): CloudConnection[] {
    return getConnections();
  },

  /** Get connections for a specific provider */
  getConnectionsForProvider(provider: CloudProvider): CloudConnection[] {
    return getConnections().filter((c) => c.provider === provider);
  },

  /** Check if a provider is connected */
  isConnected(provider: CloudProvider): boolean {
    return getConnections().some((c) => c.provider === provider && c.isConnected);
  },

  /** Initiate OAuth flow for a provider */
  async connect(provider: CloudProvider): Promise<void> {
    const config = OAUTH_CONFIG[provider];
    if (!config.authUrl) {
      throw new Error(`${provider} does not support OAuth`);
    }

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: config.scope,
      response_type: "code",
      access_type: "offline",
      prompt: "consent",
    });

    window.location.href = `${config.authUrl}?${params.toString()}`;
  },

  /** Handle OAuth callback */
  async handleCallback(code: string, provider: CloudProvider): Promise<CloudConnection> {
    // In a real implementation, this would exchange the code for tokens
    // via a backend API. Here we simulate it.
    const connection: CloudConnection = {
      id: "conn_" + Math.random().toString(36).substring(2, 15),
      provider,
      displayName: `${provider.replace("-", " ")} Account`,
      isConnected: true,
      lastSync: new Date().toISOString(),
      accessToken: "mock_access_token_" + Math.random().toString(36).substring(2, 15),
      refreshToken: "mock_refresh_token_" + Math.random().toString(36).substring(2, 15),
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    };

    const connections = getConnections();
    connections.push(connection);
    saveConnections(connections);

    return connection;
  },

  /** Disconnect a cloud account */
  disconnect(connectionId: string): void {
    const connections = getConnections().filter((c) => c.id !== connectionId);
    saveConnections(connections);
  },

  /** List files from a cloud provider */
  async listFiles(connectionId: string, path: string = "/"): Promise<CloudFile[]> {
    const connection = getConnections().find((c) => c.id === connectionId);
    if (!connection || !connection.isConnected) {
      throw new Error("Not connected");
    }

    // Simulate API call
    await new Promise((r) => setTimeout(r, 300));

    return [
      {
        id: "1",
        name: "Project Proposal.pdf",
        size: 2048576,
        mimeType: "application/pdf",
        modifiedTime: new Date().toISOString(),
        isFolder: false,
      },
      {
        id: "2",
        name: "Team Photos",
        size: 0,
        mimeType: "application/vnd.google-apps.folder",
        modifiedTime: new Date().toISOString(),
        isFolder: true,
      },
    ];
  },

  /** Download a file from cloud */
  async downloadFile(connectionId: string, fileId: string): Promise<Blob> {
    const connection = getConnections().find((c) => c.id === connectionId);
    if (!connection || !connection.isConnected) {
      throw new Error("Not connected");
    }

    // Simulate download
    await new Promise((r) => setTimeout(r, 500));
    return new Blob(["mock file content"], { type: "application/octet-stream" });
  },

  /** Upload a file to cloud */
  async uploadFile(connectionId: string, file: File, path: string = "/"): Promise<CloudFile> {
    const connection = getConnections().find((c) => c.id === connectionId);
    if (!connection || !connection.isConnected) {
      throw new Error("Not connected");
    }

    // Simulate upload
    await new Promise((r) => setTimeout(r, 800));

    return {
      id: "cloud_" + Math.random().toString(36).substring(2, 15),
      name: file.name,
      size: file.size,
      mimeType: file.type,
      modifiedTime: new Date().toISOString(),
      isFolder: false,
    };
  },

  /** Sync files from cloud to local storage */
  async syncFromCloud(connectionId: string): Promise<{ imported: number; skipped: number }> {
    const files = await this.listFiles(connectionId);
    let imported = 0;
    let skipped = 0;

    for (const file of files.filter((f) => !f.isFolder)) {
      try {
        const blob = await this.downloadFile(connectionId, file.id);
        const localFile = new File([blob], file.name, { type: file.mimeType });

        // Import to local storage
        const { fileService } = await import("./fileService");
        const { useAuth } = await import("../context/AuthContext");
        // In a real app, we'd get the user from context
        // For now, we just simulate
        imported++;
      } catch {
        skipped++;
      }
    }

    // Update last sync
    const connections = getConnections();
    const idx = connections.findIndex((c) => c.id === connectionId);
    if (idx !== -1) {
      connections[idx].lastSync = new Date().toISOString();
      saveConnections(connections);
    }

    return { imported, skipped };
  },

  /** Get storage usage for a connection */
  async getStorageInfo(connectionId: string): Promise<{ used: number; limit: number }> {
    const connection = getConnections().find((c) => c.id === connectionId);
    if (!connection) throw new Error("Connection not found");

    return {
      used: connection.storageUsed || 0,
      limit: connection.storageLimit || 10 * 1024 * 1024 * 1024,
    };
  },
};
