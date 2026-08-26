"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Cloud, Link, Unlink, RefreshCw, Upload, Download,
  Database, CheckCircle, AlertCircle, ExternalLink,
  Settings, BarChart3, Clock,
} from "lucide-react";
import {
  cloudIntegrationsService,
  CloudProvider,
  CloudConnection,
} from "../services/cloudIntegrationsService";

const PROVIDERS: { id: CloudProvider; name: string; icon: string; color: string }[] = [
  { id: "google-drive", name: "Google Drive", icon: "G", color: "from-blue-500 to-cyan-500" },
  { id: "onedrive", name: "OneDrive", icon: "M", color: "from-blue-600 to-indigo-500" },
  { id: "dropbox", name: "Dropbox", icon: "D", color: "from-purple-500 to-blue-500" },
  { id: "s3", name: "AWS S3", icon: "S", color: "from-orange-500 to-yellow-500" },
  { id: "azure", name: "Azure Blob", icon: "A", color: "from-emerald-500 to-teal-500" },
];

export default function CloudIntegrations() {
  const [connections, setConnections] = useState<CloudConnection[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<Record<string, "idle" | "syncing" | "done">>({});

  const loadConnections = useCallback(() => {
    setConnections(cloudIntegrationsService.getConnections());
  }, []);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  const handleConnect = useCallback(async (provider: CloudProvider) => {
    setLoading(provider);
    try {
      await cloudIntegrationsService.connect(provider);
    } catch (e) {
      console.error("Connect failed:", e);
    } finally {
      setLoading(null);
    }
  }, []);

  const handleDisconnect = useCallback((connectionId: string) => {
    if (window.confirm("Disconnect this cloud account?")) {
      cloudIntegrationsService.disconnect(connectionId);
      loadConnections();
    }
  }, [loadConnections]);

  const handleSync = useCallback(async (connectionId: string) => {
    setSyncStatus((prev) => ({ ...prev, [connectionId]: "syncing" }));
    try {
      const result = await cloudIntegrationsService.syncFromCloud(connectionId);
      console.log("Sync result:", result);
      setSyncStatus((prev) => ({ ...prev, [connectionId]: "done" }));
      setTimeout(() => {
        setSyncStatus((prev) => ({ ...prev, [connectionId]: "idle" }));
      }, 2000);
    } catch (e) {
      console.error("Sync failed:", e);
      setSyncStatus((prev) => ({ ...prev, [connectionId]: "idle" }));
    }
  }, []);

  const isConnected = (provider: CloudProvider) =>
    cloudIntegrationsService.isConnected(provider);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Cloud Integrations</h1>
        <p className="text-sm text-white/40">
          Connect your cloud storage accounts to sync files seamlessly
        </p>
      </div>

      {/* Connected Accounts */}
      {connections.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-sm font-semibold text-white/60">Connected Accounts</h2>
          <div className="space-y-3">
            {connections.map((conn) => (
              <ConnectedAccountCard
                key={conn.id}
                connection={conn}
                onDisconnect={handleDisconnect}
                onSync={handleSync}
                syncStatus={syncStatus[conn.id] || "idle"}
              />
            ))}
          </div>
        </div>
      )}

      {/* Available Providers */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-white/60">Available Providers</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PROVIDERS.map((provider) => {
            const connected = isConnected(provider.id);
            return (
              <ProviderCard
                key={provider.id}
                provider={provider}
                connected={connected}
                loading={loading === provider.id}
                onConnect={() => handleConnect(provider.id)}
              />
            );
          })}
        </div>
      </div>

      {/* Sync Info */}
      <div className="mt-8 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
          <Settings className="h-4 w-4" />
          Sync Settings
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-white/60">Auto-sync enabled</span>
            <label className="relative inline-flex h-5 w-9 items-center rounded-full bg-purple-500">
              <input type="checkbox" className="sr-only" defaultChecked />
              <span className="absolute inset-0 rounded-full" />
              <span className="absolute left-1 top-1 h-3 w-3 rounded-full bg-white" />
            </label>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white/60">Sync interval</span>
            <select className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-2 py-1 text-xs text-white">
              <option>5 minutes</option>
              <option>15 minutes</option>
              <option>1 hour</option>
              <option>Manual only</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white/60">Conflict resolution</span>
            <select className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-2 py-1 text-xs text-white">
              <option>Keep newest</option>
              <option>Keep both</option>
              <option>Ask me</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Provider Card ───────────────────────────────────────────────────────────
interface ProviderCardProps {
  provider: { id: CloudProvider; name: string; icon: string; color: string };
  connected: boolean;
  loading: boolean;
  onConnect: () => void;
}

function ProviderCard({ provider, connected, loading, onConnect }: ProviderCardProps) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 transition-all hover:border-white/[0.1]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${provider.color}`}>
            <span className="text-sm font-bold text-white">{provider.icon}</span>
          </div>
          <div>
            <h3 className="font-semibold text-white">{provider.name}</h3>
            <p className="text-xs text-white/40">
              {connected ? "Connected" : "Not connected"}
            </p>
          </div>
        </div>
        {connected ? (
          <CheckCircle className="h-5 w-5 text-green-400" />
        ) : (
          <button
            onClick={onConnect}
            disabled={loading}
            className="rounded-lg bg-gradient-to-r from-purple-500 to-cyan-500 px-3 py-1 text-xs font-medium text-white disabled:opacity-50"
          >
            {loading ? "Connecting..." : "Connect"}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Connected Account Card ──────────────────────────────────────────────────
interface ConnectedAccountCardProps {
  connection: CloudConnection;
  onDisconnect: (id: string) => void;
  onSync: (id: string) => void;
  syncStatus: "idle" | "syncing" | "done";
}

function ConnectedAccountCard({
  connection,
  onDisconnect,
  onSync,
  syncStatus,
}: ConnectedAccountCardProps) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500">
            <Cloud className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">{connection.displayName}</h3>
            <p className="text-xs text-white/40">
              {connection.provider.replace("-", " ")} • Last sync: {connection.lastSync || "Never"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSync(connection.id)}
            disabled={syncStatus === "syncing"}
            className="rounded-lg bg-white/[0.06] px-2 py-1 text-xs text-white/60 hover:bg-white/[0.1] disabled:opacity-50"
          >
            {syncStatus === "syncing" ? (
              <RefreshCw className="h-3 w-3 animate-spin" />
            ) : syncStatus === "done" ? (
              <CheckCircle className="h-3 w-3 text-green-400" />
            ) : (
              <RefreshCw className="h-3 w-3" />
            )}
          </button>
          <button
            onClick={() => onDisconnect(connection.id)}
            className="rounded-lg bg-white/[0.06] px-2 py-1 text-xs text-white/40 hover:text-red-400"
          >
            <Unlink className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
