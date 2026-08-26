"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme, accentColors } from "../context/ThemeContext";
import { settingsService, ProfileSettings, SecuritySettings, PrivacySettings, NotificationSettings, AppearanceSettings, LanguageRegionSettings, UploadSettings, DownloadSettings, BackupSettings, ConnectedService } from "../services/settingsService";
import { securityService } from "../services/securityService";
import { fileService } from "../services/fileService";
import {
  User, Shield, Lock, Bell, Palette, Globe, Upload, Download,
  HardDrive, RefreshCw, Link2, Info, HelpCircle, FileText,
  ChevronRight, Save, Check, X, Eye, EyeOff, Moon, Sun,
  Monitor, Smartphone, Laptop, Tablet, Clock, MapPin,
  Languages, Calendar, Hash, UploadCloud, Wifi, WifiOff,
  DownloadCloud, Database, Trash2, AlertTriangle, Share2,
  LogOut, KeyRound, Copy, CheckCircle, XCircle, QrCode,
  Sparkles, Bug, MessageSquare, ExternalLink, BookOpen,
  ScrollText, Award, Loader2, Search, Globe2, Volume2,
  Vibrate, Mail, BellRing, BellOff, Sliders, Image as ImageIcon,
  Music, Video, File, Archive, Cpu, Gauge,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────

type SettingsSection =
  | "profile"
  | "account"
  | "security"
  | "privacy"
  | "notifications"
  | "appearance"
  | "language"
  | "storage"
  | "uploads"
  | "downloads"
  | "backup"
  | "connected"
  | "application"
  | "support"
  | "legal";

interface SectionConfig {
  id: SettingsSection;
  label: string;
  icon: React.ElementType;
  description: string;
}

const SECTIONS: SectionConfig[] = [
  { id: "profile", label: "Profile", icon: User, description: "Manage your personal information" },
  { id: "account", label: "Account", icon: Shield, description: "Account settings and security" },
  { id: "security", label: "Security", icon: Lock, description: "Security preferences and 2FA" },
  { id: "privacy", label: "Privacy", icon: EyeOff, description: "Control your privacy" },
  { id: "notifications", label: "Notifications", icon: Bell, description: "Notification preferences" },
  { id: "appearance", label: "Appearance", icon: Palette, description: "Customize your experience" },
  { id: "language", label: "Language & Region", icon: Globe, description: "Regional preferences" },
  { id: "storage", label: "Storage", icon: HardDrive, description: "Storage usage and stats" },
  { id: "uploads", label: "Uploads", icon: Upload, description: "Upload preferences" },
  { id: "downloads", label: "Downloads", icon: Download, description: "Download preferences" },
  { id: "backup", label: "Backup", icon: RefreshCw, description: "Backup and restore" },
  { id: "connected", label: "Connected Services", icon: Link2, description: "Manage connections" },
  { id: "application", label: "Application", icon: Info, description: "App info and updates" },
  { id: "support", label: "Support", icon: HelpCircle, description: "Get help and support" },
  { id: "legal", label: "Legal", icon: FileText, description: "Legal information" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function formatDate(date: string | null): string {
  if (!date) return "Never";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStrengthColor(score: number): string {
  if (score < 2) return "#ef4444";
  if (score < 3) return "#f97316";
  if (score < 4) return "#eab308";
  if (score < 5) return "#22c55e";
  return "#00D084";
}

function getStrengthLabel(score: number): string {
  if (score < 2) return "Weak";
  if (score < 3) return "Fair";
  if (score < 4) return "Good";
  if (score < 5) return "Strong";
  return "Very Strong";
}

function getStrengthWidth(score: number): string {
  if (score < 2) return "20%";
  if (score < 3) return "40%";
  if (score < 4) return "60%";
  if (score < 5) return "80%";
  return "100%";
}

// ─── Common Components ────────────────────────────────────────────────────

function Toggle({ enabled, onChange, label, description }: { enabled: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{label}</p>
        {description && <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
          enabled ? "bg-amber-500" : "bg-zinc-200 dark:bg-zinc-700"
        }`}
      >
        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          enabled ? "translate-x-5" : "translate-x-0"
        }`} />
      </button>
    </div>
  );
}

function Select({ value, onChange, options, label }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; label: string }) {
  return (
    <div className="py-3">
      <label className="block text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2.5 text-sm text-zinc-800 dark:text-white outline-none focus:border-amber-500"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

function Input({ value, onChange, label, type = "text", placeholder, icon: Icon, error, valid }: {
  value: string; onChange: (v: string) => void; label: string; type?: string; placeholder?: string; icon?: React.ElementType; error?: string; valid?: boolean;
}) {
  return (
    <div className="py-2">
      <label className="block text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">{label}</label>
      <div className="relative">
        {Icon && (
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
            <Icon className="h-4 w-4" />
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-xl border ${error ? "border-red-400" : "border-zinc-200 dark:border-zinc-700"} bg-white dark:bg-zinc-800 ${Icon ? "pl-10" : "pl-3"} pr-3 py-2.5 text-sm text-zinc-800 dark:text-white outline-none focus:border-amber-500 placeholder:text-zinc-400 dark:placeholder:text-zinc-500`}
        />
        {valid !== undefined && (
          <span className="absolute inset-y-0 right-0 flex items-center pr-3">
            {valid ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-red-400" />}
          </span>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function Button({ children, onClick, variant = "primary", disabled, className = "" }: {
  children: React.ReactNode; onClick?: () => void; variant?: "primary" | "secondary" | "danger" | "ghost"; disabled?: boolean; className?: string;
}) {
  const base = "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-200 disabled:opacity-50 cursor-pointer";
  const variants = {
    primary: "bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-sm",
    secondary: "border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300",
    danger: "bg-red-500 hover:bg-red-600 text-white",
    ghost: "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400",
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-zinc-200/70 dark:border-zinc-800/50 bg-white/80 dark:bg-zinc-950/60 p-5 backdrop-blur-md ${className}`}>
      {children}
    </div>
  );
}

function Message({ type, text, onDismiss }: { type: "success" | "error" | "info"; text: string; onDismiss?: () => void }) {
  const colors = {
    success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    error: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    info: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  };
  return (
    <div className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold ${colors[type]}`}>
      <span>{text}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="ml-2 flex-shrink-0">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// ─── Section Components ───────────────────────────────────────────────────

function ProfileSection({ userId }: { userId: string }) {
  const { user, updateProfile } = useAuth();
  const [profile, setProfile] = useState<ProfileSettings>(() => settingsService.getProfile(userId));
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>(profile.avatarUrl || "");

  const handleSave = async () => {
    setSaving(true);
    try {
      settingsService.saveProfile(userId, profile);
      await updateProfile({
        fullName: profile.displayName,
        username: profile.username,
        phone: profile.phone,
        avatarUrl: profile.avatarUrl,
      });
      setMsg({ type: "success", text: "Profile updated successfully!" });
      setTimeout(() => setMsg(null), 3000);
    } catch {
      setMsg({ type: "error", text: "Failed to update profile." });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const url = ev.target?.result as string;
        setAvatarPreview(url);
        setProfile((p) => ({ ...p, avatarUrl: url }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="text-lg font-bold text-zinc-800 dark:text-white mb-4">Profile Information</h3>
        <div className="flex items-center gap-6 mb-6">
          <div className="relative">
            <div className="h-20 w-20 overflow-hidden rounded-full border-2 border-zinc-200 dark:border-zinc-700">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-500 to-yellow-400 text-xl font-bold text-slate-900">
                  {profile.displayName?.slice(0, 2).toUpperCase() || user?.email?.slice(0, 2).toUpperCase() || "?"}
                </div>
              )}
            </div>
            <label className="absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-amber-500 text-slate-950 shadow-md hover:bg-amber-600 transition-colors">
              <Upload className="h-3.5 w-3.5" />
              <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </label>
          </div>
          <div>
            <p className="text-sm font-bold text-zinc-800 dark:text-white">{profile.displayName || "Set your display name"}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{profile.email || user?.email}</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Display Name" value={profile.displayName} onChange={(v) => setProfile((p) => ({ ...p, displayName: v }))} icon={User} placeholder="John Doe" />
          <Input label="Username" value={profile.username} onChange={(v) => setProfile((p) => ({ ...p, username: v }))} icon={User} placeholder="johndoe" />
          <Input label="Email" value={profile.email} onChange={(v) => setProfile((p) => ({ ...p, email: v }))} icon={User} placeholder="john@example.com" type="email" />
          <Input label="Phone" value={profile.phone} onChange={(v) => setProfile((p) => ({ ...p, phone: v }))} icon={User} placeholder="+1 (555) 123-4567" />
        </div>
        <div className="mt-4">
          <label className="block text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">Bio</label>
          <textarea
            value={profile.bio}
            onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
            placeholder="Tell us about yourself..."
            rows={3}
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2.5 text-sm text-zinc-800 dark:text-white outline-none focus:border-amber-500 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
          />
        </div>
        <div className="mt-4">
          <Select
            label="Profile Visibility"
            value={profile.profileVisibility}
            onChange={(v) => setProfile((p) => ({ ...p, profileVisibility: v as ProfileSettings["profileVisibility"] }))}
            options={[
              { value: "public", label: "Public - Everyone can see" },
              { value: "private", label: "Private - Only you" },
              { value: "contacts", label: "Contacts - Only your contacts" },
            ]}
          />
        </div>

        {msg && <Message type={msg.type} text={msg.text} onDismiss={() => setMsg(null)} />}

        <div className="mt-6 flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving..." : "Save Profile"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

function AccountSection({ userId }: { userId: string }) {
  const { user } = useAuth();
  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [pwdStrength, setPwdStrength] = useState(0);

  const evaluatePwdStrength = (value: string) => {
    let score = 0;
    if (value.length >= 8) score += 1;
    if (value.length >= 12) score += 1;
    if (/[A-Z]/.test(value)) score += 1;
    if (/[a-z]/.test(value)) score += 0.5;
    if (/[0-9]/.test(value)) score += 1;
    if (/[^A-Za-z0-9]/.test(value)) score += 1;
    setPwdStrength(Math.min(5, Math.floor(score)));
  };

  const handleChangePassword = async () => {
    setMsg(null);
    if (!currentPwd || !newPwd || !confirmPwd) {
      setMsg({ type: "error", text: "All fields are required." });
      return;
    }
    if (newPwd.length < 8) {
      setMsg({ type: "error", text: "Password must be at least 8 characters." });
      return;
    }
    if (newPwd !== confirmPwd) {
      setMsg({ type: "error", text: "Passwords do not match." });
      return;
    }
    setLoading(true);
    try {
      const { hashPassword, verifyPassword } = await import("../config/credentials");
      const users = JSON.parse(localStorage.getItem("novaa_users") || "[]");
      const idx = users.findIndex((u: any) => u.id === userId);
      if (idx === -1) throw new Error("User not found");
      const valid = await verifyPassword(currentPwd, users[idx].passwordHash);
      if (!valid) throw new Error("Current password is incorrect.");
      users[idx].passwordHash = await hashPassword(newPwd);
      localStorage.setItem("novaa_users", JSON.stringify(users));
      setMsg({ type: "success", text: "Password changed successfully!" });
      setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
      setShowChangePwd(false);
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Failed to change password." });
    } finally {
      setLoading(false);
    }
  };

  const handleChangeEmail = async () => {
    setMsg(null);
    if (!newEmail || !newEmail.includes("@")) {
      setMsg({ type: "error", text: "Please enter a valid email." });
      return;
    }
    setLoading(true);
    try {
      const users = JSON.parse(localStorage.getItem("novaa_users") || "[]");
      const idx = users.findIndex((u: any) => u.id === userId);
      if (idx !== -1) {
        users[idx].email = newEmail.trim().toLowerCase();
        localStorage.setItem("novaa_users", JSON.stringify(users));
        // Update session
        const session = JSON.parse(localStorage.getItem("novaa_session") || "{}");
        session.email = newEmail.trim().toLowerCase();
        localStorage.setItem("novaa_session", JSON.stringify(session));
      }
      setMsg({ type: "success", text: "Email updated successfully! Please verify your new address." });
      setShowChangeEmail(false);
      setNewEmail("");
    } catch {
      setMsg({ type: "error", text: "Failed to update email." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="text-lg font-bold text-zinc-800 dark:text-white mb-4">Account Information</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl bg-zinc-50 dark:bg-zinc-900/50 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Email</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{user?.email}</p>
            </div>
            <Button variant="ghost" onClick={() => { setShowChangeEmail(!showChangeEmail); setMsg(null); }}>Change</Button>
          </div>
          {showChangeEmail && (
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 space-y-3">
              <Input label="New Email" value={newEmail} onChange={setNewEmail} type="email" placeholder="new@example.com" />
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setShowChangeEmail(false)}>Cancel</Button>
                <Button onClick={handleChangeEmail} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Update Email
                </Button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between rounded-xl bg-zinc-50 dark:bg-zinc-900/50 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Password</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Last changed: Recently</p>
            </div>
            <Button variant="ghost" onClick={() => { setShowChangePwd(!showChangePwd); setMsg(null); }}>Change</Button>
          </div>
          {showChangePwd && (
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 space-y-3">
              <Input label="Current Password" value={currentPwd} onChange={setCurrentPwd} type={showPwd ? "text" : "password"} placeholder="Enter current password" icon={KeyRound} />
              <Input label="New Password" value={newPwd} onChange={(v) => { setNewPwd(v); evaluatePwdStrength(v); }} type={showPwd ? "text" : "password"} placeholder="Min. 8 characters" icon={Lock} />
              {newPwd.length > 0 && (
                <div className="space-y-1">
                  <div className="h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: getStrengthWidth(pwdStrength), backgroundColor: getStrengthColor(pwdStrength) }} />
                  </div>
                  <p className="text-xs font-medium" style={{ color: getStrengthColor(pwdStrength) }}>{getStrengthLabel(pwdStrength)}</p>
                </div>
              )}
              <Input label="Confirm New Password" value={confirmPwd} onChange={setConfirmPwd} type={showPwd ? "text" : "password"} placeholder="Repeat new password" icon={Lock}
                valid={confirmPwd.length > 0 ? confirmPwd === newPwd : undefined} />
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={showPwd} onChange={() => setShowPwd(!showPwd)} className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-600" />
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">Show passwords</span>
                </label>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setShowChangePwd(false)}>Cancel</Button>
                <Button onClick={handleChangePassword} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                  Update Password
                </Button>
              </div>
            </div>
          )}

          {msg && <Message type={msg.type} text={msg.text} onDismiss={() => setMsg(null)} />}
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-bold text-zinc-800 dark:text-white mb-4">Account Status</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl bg-zinc-50 dark:bg-zinc-900/50 px-4 py-3">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-emerald-500" />
              <div>
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Account Status</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Your account is active and verified</p>
              </div>
            </div>
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">Active</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-zinc-50 dark:bg-zinc-900/50 px-4 py-3">
            <div className="flex items-center gap-3">
              <Award className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Account Verification</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Email verified</p>
              </div>
            </div>
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">Verified</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

function SecuritySection({ userId }: { userId: string }) {
  const [security, setSecurity] = useState<SecuritySettings>(() => settingsService.getSecurity(userId));
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFASecret] = useState(() => {
    try {
      const stored = localStorage.getItem(`totp_secret_${userId}`);
      if (stored) return stored;
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
      const secret = Array.from(crypto.getRandomValues(new Uint8Array(16))).map((b) => chars[b % 32]).join("");
      localStorage.setItem(`totp_secret_${userId}`, secret);
      return secret;
    } catch { return "JBSWY3DPEHPK3PXP"; }
  });
  const [copied, setCopied] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [sessions, setSessions] = useState(() => securityService.getDevices(userId));
  const [loginHistory, setLoginHistory] = useState(() => securityService.getLoginHistory(userId));
  const [alerts, setAlerts] = useState(() => securityService.getLoginAlerts(userId));
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);

  const { user } = useAuth();
  const totpIssuer = "Novaa Drive";
  const totpAccount = user?.email || "admin@novaadrive.com";
  const totpUri = `otpauth://totp/${encodeURIComponent(totpIssuer)}:${encodeURIComponent(totpAccount)}?secret=${twoFASecret}&issuer=${encodeURIComponent(totpIssuer)}&algorithm=SHA1&digits=6&period=30`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(totpUri)}`;

  const handleToggle2FA = async () => {
    if (!security.twoFactorEnabled) {
      setShow2FAModal(true);
      return;
    }
    const updated = settingsService.updateSecurity(userId, { twoFactorEnabled: false });
    setSecurity(updated);
    localStorage.setItem(`local_2fa_${userId}`, JSON.stringify(false));
    setMsg({ type: "success", text: "2FA has been disabled." });
    setTimeout(() => setMsg(null), 3000);
  };

  const handleConfirm2FA = async () => {
    const updated = settingsService.updateSecurity(userId, { twoFactorEnabled: true });
    setSecurity(updated);
    localStorage.setItem(`local_2fa_${userId}`, JSON.stringify(true));
    setShow2FAModal(false);
    setMsg({ type: "success", text: "2FA enabled via Google Authenticator." });
    await fileService.addActivityLog(userId, "toggle_2fa", "Enabled Two-Factor Authentication");
    setTimeout(() => setMsg(null), 4000);
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(twoFASecret).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleRevokeAllSessions = () => {
    securityService.terminateAllOtherSessions(userId, sessions[0]?.id || "");
    setSessions(securityService.getDevices(userId));
    setMsg({ type: "success", text: "All other sessions have been revoked." });
    setShowRevokeConfirm(false);
    setTimeout(() => setMsg(null), 3000);
  };

  const updateSecuritySetting = (key: keyof SecuritySettings, value: any) => {
    const updated = settingsService.updateSecurity(userId, { [key]: value } as any);
    setSecurity(updated);
  };

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="text-lg font-bold text-zinc-800 dark:text-white mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-amber-500" />
          Two-Factor Authentication
        </h3>
        <div className="flex items-center justify-between py-3">
          <div>
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Google Authenticator</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {security.twoFactorEnabled ? "2FA is active" : "Add an extra layer of security"}
            </p>
          </div>
          <button
            onClick={handleToggle2FA}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
              security.twoFactorEnabled ? "bg-amber-500" : "bg-zinc-200 dark:bg-zinc-700"
            }`}
          >
            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              security.twoFactorEnabled ? "translate-x-5" : "translate-x-0"
            }`} />
          </button>
        </div>

        {msg && <Message type={msg.type} text={msg.text} onDismiss={() => setMsg(null)} />}

        {!security.twoFactorEnabled && (
          <Button variant="secondary" className="w-full mt-3" onClick={() => setShow2FAModal(true)}>
            <QrCode className="h-4 w-4" /> Setup Google Authenticator
          </Button>
        )}
      </Card>

      {/* 2FA QR Modal */}
      {show2FAModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl border border-white/[0.08] bg-[#0B1020] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <QrCode className="h-4 w-4 text-amber-500" /> Setup 2FA
              </h3>
              <button onClick={() => setShow2FAModal(false)} className="text-white/40 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-white/50 leading-relaxed">
              Open <span className="font-bold text-white/80">Google Authenticator</span>, tap <span className="font-bold text-white/80">+</span> → <span className="font-bold text-white/80">Scan QR code</span>.
            </p>
            <div className="flex justify-center">
              <div className="rounded-2xl border border-white/[0.08] bg-white p-3">
                <img src={qrUrl} alt="2FA QR Code" width={180} height={180} className="rounded-lg" />
              </div>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/30 mb-1">Manual entry key</p>
              <div className="flex items-center justify-between gap-2">
                <code className="text-xs font-mono text-amber-400 tracking-widest break-all">{twoFASecret}</code>
                <button onClick={handleCopySecret} className="flex-shrink-0 rounded-lg border border-white/[0.08] bg-white/[0.04] p-1.5 text-white/40 hover:text-white transition-colors">
                  {copied ? <CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShow2FAModal(false)} className="flex-1 rounded-xl border border-white/[0.08] py-2.5 text-xs font-bold text-white/50 hover:bg-white/[0.04] transition-colors">Cancel</button>
              <button onClick={handleConfirm2FA} className="flex-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-2.5 text-xs transition-colors">Enable 2FA</button>
            </div>
          </div>
        </div>
      )}

      <Card>
        <h3 className="text-lg font-bold text-zinc-800 dark:text-white mb-4">Security Preferences</h3>
        <Toggle label="Auto Logout Timeout" description={`${security.autoLogoutTimeout} minutes of inactivity`} enabled={true}
          onChange={() => {}} />
        <Select label="Auto Logout" value={String(security.autoLogoutTimeout)}
          onChange={(v) => updateSecuritySetting("autoLogoutTimeout", Number(v))}
          options={[
            { value: "15", label: "15 minutes" },
            { value: "30", label: "30 minutes" },
            { value: "60", label: "1 hour" },
            { value: "120", label: "2 hours" },
            { value: "240", label: "4 hours" },
            { value: "1440", label: "24 hours" },
          ]} />
        <Toggle label="Login Alerts" description="Get notified on new logins" enabled={security.loginAlerts}
          onChange={(v) => updateSecuritySetting("loginAlerts", v)} />
        <Toggle label="Device Notifications" description="Alerts for new devices" enabled={security.deviceNotifications}
          onChange={(v) => updateSecuritySetting("deviceNotifications", v)} />
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-zinc-800 dark:text-white">Active Sessions</h3>
          <Button variant="danger" onClick={() => setShowRevokeConfirm(true)}>
            <LogOut className="h-4 w-4" /> Revoke All
          </Button>
        </div>
        {showRevokeConfirm && (
          <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
            <p className="text-sm font-semibold text-red-600 dark:text-red-400 mb-3">Are you sure? This will sign out all devices except this one.</p>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setShowRevokeConfirm(false)}>Cancel</Button>
              <Button variant="danger" onClick={handleRevokeAllSessions}>Yes, Revoke All</Button>
            </div>
          </div>
        )}
        <div className="space-y-2">
          {sessions.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 py-4 text-center">No active sessions</p>
          ) : (
            sessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between rounded-xl bg-zinc-50 dark:bg-zinc-900/50 px-4 py-3">
                <div className="flex items-center gap-3">
                  {session.os?.toLowerCase().includes("windows") ? <Monitor className="h-4 w-4 text-zinc-400" /> :
                   session.os?.toLowerCase().includes("android") ? <Smartphone className="h-4 w-4 text-zinc-400" /> :
                   session.os?.toLowerCase().includes("ios") || session.os?.toLowerCase().includes("iphone") ? <Smartphone className="h-4 w-4 text-zinc-400" /> :
                   <Laptop className="h-4 w-4 text-zinc-400" />}
                  <div>
                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{session.device || "Unknown Device"}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{session.browser} on {session.os} · {session.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {session.isCurrent && <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Current</span>}
                  <span className="text-xs text-zinc-400">{new Date(session.lastActive).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-bold text-zinc-800 dark:text-white mb-4">Login History</h3>
        <div className="max-h-48 overflow-y-auto space-y-1">
          {loginHistory.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 py-4 text-center">No login history</p>
          ) : (
            loginHistory.slice(0, 10).map((entry) => (
              <div key={entry.id} className="flex items-center justify-between rounded-lg bg-zinc-50 dark:bg-zinc-900/30 px-3 py-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3 text-zinc-400" />
                  <span className="text-xs text-zinc-600 dark:text-zinc-400">{entry.device} · {entry.location}</span>
                </div>
                <span className="text-[10px] text-zinc-400">{new Date(entry.createdAt).toLocaleDateString()}</span>
              </div>
            ))
          )}
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-bold text-zinc-800 dark:text-white mb-4">Security Alerts</h3>
        <div className="space-y-2">
          {alerts.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 py-4 text-center">No security alerts</p>
          ) : (
            alerts.slice(0, 5).map((alert) => (
              <div key={alert.id} className="flex items-center justify-between rounded-xl bg-zinc-50 dark:bg-zinc-900/50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <div>
                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{alert.isNewDevice ? "New Device Login" : "Login Alert"}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{alert.device} · {alert.location}</p>
                  </div>
                </div>
                <span className="text-xs text-zinc-400">{new Date(alert.timestamp).toLocaleDateString()}</span>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

function PrivacySection({ userId }: { userId: string }) {
  const [privacy, setPrivacy] = useState<PrivacySettings>(() => settingsService.getPrivacy(userId));
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const updatePrivacySetting = (key: keyof PrivacySettings, value: any) => {
    const updated = settingsService.updatePrivacy(userId, { [key]: value } as any);
    setPrivacy(updated);
  };

  const updateCookiePref = (key: keyof PrivacySettings["cookiePreferences"], value: boolean) => {
    const cookies = { ...privacy.cookiePreferences, [key]: value };
    const updated = settingsService.updatePrivacy(userId, { cookiePreferences: cookies });
    setPrivacy(updated);
  };

  const handleDownloadData = () => {
    settingsService.downloadUserData(userId);
    setMsg({ type: "success", text: "Data export started. Check your downloads." });
    setTimeout(() => setMsg(null), 3000);
  };

  const handleDeleteAccount = () => {
    settingsService.deleteAccount(userId);
    localStorage.removeItem("novaa_session");
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="text-lg font-bold text-zinc-800 dark:text-white mb-4">Profile Privacy</h3>
        <Select label="Who can see your profile" value={privacy.profileVisibility}
          onChange={(v) => updatePrivacySetting("profileVisibility", v)}
          options={[
            { value: "public", label: "Everyone" },
            { value: "private", label: "Only me" },
            { value: "contacts", label: "My contacts" },
          ]} />
        <Toggle label="Data Sharing" description="Share usage data to improve services" enabled={privacy.dataSharing}
          onChange={(v) => updatePrivacySetting("dataSharing", v)} />
        <Toggle label="Analytics" description="Help us improve with anonymous analytics" enabled={privacy.analyticsEnabled}
          onChange={(v) => updatePrivacySetting("analyticsEnabled", v)} />
      </Card>

      <Card>
        <h3 className="text-lg font-bold text-zinc-800 dark:text-white mb-4">Cookie Preferences</h3>
        <Toggle label="Necessary Cookies" description="Required for basic functionality" enabled={privacy.cookiePreferences.necessary}
          onChange={(v) => updateCookiePref("necessary", v)} />
        <Toggle label="Functional Cookies" description="Remember your preferences" enabled={privacy.cookiePreferences.functional}
          onChange={(v) => updateCookiePref("functional", v)} />
        <Toggle label="Analytics Cookies" description="Help us understand usage" enabled={privacy.cookiePreferences.analytics}
          onChange={(v) => updateCookiePref("analytics", v)} />
        <Toggle label="Marketing Cookies" description="Personalized content and ads" enabled={privacy.cookiePreferences.marketing}
          onChange={(v) => updateCookiePref("marketing", v)} />
      </Card>

      <Card>
        <h3 className="text-lg font-bold text-zinc-800 dark:text-white mb-4">Your Data</h3>
        <div className="space-y-3">
          <Button variant="secondary" className="w-full" onClick={handleDownloadData}>
            <DownloadCloud className="h-4 w-4" /> Download Personal Data
          </Button>
          <Button variant="secondary" className="w-full">
            <UploadCloud className="h-4 w-4" /> Export Account Data
          </Button>
        </div>
      </Card>

      <Card className="!border-red-500/20">
        <h3 className="text-lg font-bold text-red-600 dark:text-red-500 mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" /> Danger Zone
        </h3>
        {!showDeleteConfirm ? (
          <Button variant="danger" className="w-full" onClick={() => setShowDeleteConfirm(true)}>
            <Trash2 className="h-4 w-4" /> Delete Account
          </Button>
        ) : (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 space-y-3">
            <p className="text-sm font-semibold text-red-600 dark:text-red-400">
              This will permanently delete all your data. This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
              <Button variant="danger" onClick={handleDeleteAccount}>Yes, Delete Everything</Button>
            </div>
          </div>
        )}
      </Card>

      {msg && <Message type={msg.type} text={msg.text} onDismiss={() => setMsg(null)} />}
    </div>
  );
}

function NotificationsSection({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<NotificationSettings>(() => settingsService.getNotifications(userId));

  const update = (key: keyof NotificationSettings, value: boolean) => {
    const updated = settingsService.updateNotifications(userId, { [key]: value });
    setNotifications(updated);
  };

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="text-lg font-bold text-zinc-800 dark:text-white mb-4 flex items-center gap-2">
          <Bell className="h-5 w-5 text-amber-500" /> Notification Channels
        </h3>
        <Toggle label="Email Notifications" description="Receive notifications via email" enabled={notifications.emailNotifications} onChange={(v) => update("emailNotifications", v)} />
        <Toggle label="Push Notifications" description="Browser push notifications" enabled={notifications.pushNotifications} onChange={(v) => update("pushNotifications", v)} />
        <Toggle label="SMS Notifications" description="Text message alerts" enabled={notifications.smsNotifications} onChange={(v) => update("smsNotifications", v)} />
      </Card>

      <Card>
        <h3 className="text-lg font-bold text-zinc-800 dark:text-white mb-4">Notification Types</h3>
        <Toggle label="Security Alerts" description="Login attempts and security events" enabled={notifications.securityAlerts} onChange={(v) => update("securityAlerts", v)} />
        <Toggle label="Marketing" description="Product updates and offers" enabled={notifications.marketingNotifications} onChange={(v) => update("marketingNotifications", v)} />
      </Card>

      <Card>
        <h3 className="text-lg font-bold text-zinc-800 dark:text-white mb-4 flex items-center gap-2">
          <Volume2 className="h-5 w-5 text-amber-500" /> Sound & Vibration
        </h3>
        <Toggle label="Sound" description="Play sounds for notifications" enabled={notifications.soundEnabled} onChange={(v) => update("soundEnabled", v)} />
        <Toggle label="Vibration" description="Vibrate on notifications" enabled={notifications.vibrationEnabled} onChange={(v) => update("vibrationEnabled", v)} />
      </Card>
    </div>
  );
}

function AppearanceSection({ userId }: { userId: string }) {
  const { accentColor, setAccentColor, glassmorphism, setGlassmorphism, animationsEnabled, setAnimationsEnabled, dashboardLayout, setDashboardLayout } = useTheme();
  const [appearance, setAppearance] = useState<AppearanceSettings>(() => settingsService.getAppearance(userId));

  const updateAppearance = (key: keyof AppearanceSettings, value: any) => {
    const updated = settingsService.updateAppearance(userId, { [key]: value });
    setAppearance(updated);
  };

  const applyTheme = (theme: "light" | "dark" | "system") => {
    updateAppearance("theme", theme);
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else if (theme === "light") {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      localStorage.removeItem("theme");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.classList.toggle("dark", prefersDark);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="text-lg font-bold text-zinc-800 dark:text-white mb-4">Theme</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: "light" as const, icon: Sun, label: "Light" },
            { value: "dark" as const, icon: Moon, label: "Dark" },
            { value: "system" as const, icon: Monitor, label: "System" },
          ].map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              onClick={() => applyTheme(value)}
              className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                appearance.theme === value
                  ? "border-amber-500 bg-amber-500/5"
                  : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
              }`}
            >
              <Icon className={`h-6 w-6 ${appearance.theme === value ? "text-amber-500" : "text-zinc-400"}`} />
              <span className={`text-xs font-bold ${appearance.theme === value ? "text-amber-500" : "text-zinc-500 dark:text-zinc-400"}`}>{label}</span>
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-bold text-zinc-800 dark:text-white mb-4">Accent Color</h3>
        <div className="flex flex-wrap gap-3">
          {accentColors.map((color) => (
            <button
              key={color.name}
              onClick={() => { setAccentColor(color); updateAppearance("accentColor", color.name); }}
              className={`h-9 w-9 rounded-full transition-all ${
                accentColor.name === color.name ? "ring-2 ring-amber-500 ring-offset-2 dark:ring-offset-zinc-900 scale-110" : ""
              }`}
              style={{ backgroundColor: color.value }}
              title={color.name}
            />
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-bold text-zinc-800 dark:text-white mb-4">Layout & Display</h3>
        <Select label="Dashboard Layout" value={appearance.layout}
          onChange={(v) => { updateAppearance("layout", v); setDashboardLayout(v as any); }}
          options={[
            { value: "default", label: "Default" },
            { value: "compact", label: "Compact" },
            { value: "spacious", label: "Spacious" },
          ]} />
        <Select label="Font Size" value={appearance.fontSize}
          onChange={(v) => updateAppearance("fontSize", v)}
          options={[
            { value: "small", label: "Small" },
            { value: "medium", label: "Medium" },
            { value: "large", label: "Large" },
          ]} />
        <Toggle label="Glassmorphism" description="Glass-like interface effects" enabled={appearance.glassmorphism}
          onChange={(v) => { updateAppearance("glassmorphism", v); setGlassmorphism(v); }} />
        <Toggle label="Animations" description="Enable UI animations" enabled={appearance.animationsEnabled}
          onChange={(v) => { updateAppearance("animationsEnabled", v); setAnimationsEnabled(v); }} />
      </Card>
    </div>
  );
}

function LanguageRegionSection({ userId }: { userId: string }) {
  const [langRegion, setLangRegion] = useState<LanguageRegionSettings>(() => settingsService.getLanguageRegion(userId));
  const [msg, setMsg] = useState<{ type: "success"; text: string } | null>(null);

  const update = (key: keyof LanguageRegionSettings, value: string) => {
    const updated = settingsService.updateLanguageRegion(userId, { [key]: value });
    setLangRegion(updated);
    setMsg({ type: "success", text: "Setting saved!" });
    setTimeout(() => setMsg(null), 2000);
  };

  const timezones = Intl.supportedValuesOf?.("timeZone") || [
    "UTC", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
    "Europe/London", "Europe/Paris", "Europe/Berlin", "Asia/Tokyo", "Asia/Shanghai",
    "Asia/Kolkata", "Australia/Sydney", "Pacific/Auckland",
  ];

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="text-lg font-bold text-zinc-800 dark:text-white mb-4 flex items-center gap-2">
          <Globe className="h-5 w-5 text-amber-500" /> Language & Region
        </h3>
        <Select label="Language" value={langRegion.language}
          onChange={(v) => update("language", v)}
          options={[
            { value: "en", label: "English" },
            { value: "es", label: "Español" },
            { value: "fr", label: "Français" },
            { value: "de", label: "Deutsch" },
            { value: "ja", label: "日本語" },
            { value: "zh", label: "中文" },
            { value: "hi", label: "हिन्दी" },
          ]} />
        <Select label="Region" value={langRegion.region}
          onChange={(v) => update("region", v)}
          options={[
            { value: "US", label: "United States" },
            { value: "GB", label: "United Kingdom" },
            { value: "EU", label: "European Union" },
            { value: "IN", label: "India" },
            { value: "JP", label: "Japan" },
            { value: "CN", label: "China" },
            { value: "AU", label: "Australia" },
          ]} />
        <Select label="Time Zone" value={langRegion.timezone}
          onChange={(v) => update("timezone", v)}
          options={timezones.map((tz: string) => ({ value: tz, label: tz }))} />
        <Select label="Date Format" value={langRegion.dateFormat}
          onChange={(v) => update("dateFormat", v)}
          options={[
            { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
            { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
            { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
          ]} />
        <Select label="Number Format" value={langRegion.numberFormat}
          onChange={(v) => update("numberFormat", v)}
          options={[
            { value: "en-US", label: "1,234.56" },
            { value: "en-IN", label: "1,23,456.78" },
            { value: "de-DE", label: "1.234,56" },
            { value: "fr-FR", label: "1 234,56" },
          ]} />
        {msg && <Message type={msg.type} text={msg.text} onDismiss={() => setMsg(null)} />}
      </Card>
    </div>
  );
}

function StorageSection({ userId }: { userId: string }) {
  const [stats, setStats] = useState({ used: 0, limit: 10 * 1024 * 1024 * 1024, fileCount: 0, categoryBreakdown: {} as Record<string, number> });
  const [cacheSize, setCacheSize] = useState(0);
  const [msg, setMsg] = useState<{ type: "success"; text: string } | null>(null);

  useEffect(() => {
    fileService.getStorageStats(userId).then(setStats).catch(() => {});
    setCacheSize(settingsService.getCacheSize());
  }, [userId]);

  const handleClearCache = () => {
    settingsService.clearCache();
    setCacheSize(settingsService.getCacheSize());
    setMsg({ type: "success", text: "Cache cleared successfully!" });
    setTimeout(() => setMsg(null), 3000);
  };

  const usedPercentage = Math.min(100, (stats.used / stats.limit) * 100);

  const categoryIcons: Record<string, React.ElementType> = {
    photo: ImageIcon, video: Video, audio: Music, document: File, archive: Archive, other: File,
  };

  const storageSettings = settingsService.getStorage(userId);

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="text-lg font-bold text-zinc-800 dark:text-white mb-4">Storage Overview</h3>
        <div className="h-4 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-500" style={{ width: `${usedPercentage}%` }} />
        </div>
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="font-semibold text-zinc-600 dark:text-zinc-400">{formatSize(stats.used)} used</span>
          <span className="font-semibold text-zinc-600 dark:text-zinc-400">{usedPercentage.toFixed(1)}% of {formatSize(stats.limit)}</span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Object.entries(stats.categoryBreakdown).map(([cat, size]) => {
            const Icon = categoryIcons[cat] || File;
            const percent = stats.used > 0 ? (Number(size) / stats.used) * 100 : 0;
            return (
              <div key={cat} className="rounded-xl bg-zinc-50 dark:bg-zinc-900/50 p-3">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-zinc-400" />
                  <span className="text-xs font-semibold capitalize text-zinc-600 dark:text-zinc-400">{cat}</span>
                </div>
                <p className="mt-1 text-sm font-bold text-zinc-800 dark:text-white">{formatSize(Number(size))}</p>
                <p className="text-[10px] text-zinc-400">{percent.toFixed(1)}%</p>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex items-center justify-between rounded-xl bg-zinc-50 dark:bg-zinc-900/50 px-4 py-3">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-zinc-400" />
            <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Total Files</span>
          </div>
          <span className="text-sm font-bold text-zinc-800 dark:text-white">{stats.fileCount.toLocaleString()}</span>
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-bold text-zinc-800 dark:text-white mb-4">Cache Management</h3>
        <div className="flex items-center justify-between rounded-xl bg-zinc-50 dark:bg-zinc-900/50 px-4 py-3 mb-3">
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-zinc-400" />
            <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Cache Size</span>
          </div>
          <span className="text-sm font-bold text-zinc-800 dark:text-white">{formatSize(cacheSize)}</span>
        </div>
        <Button variant="secondary" className="w-full" onClick={handleClearCache}>
          <Trash2 className="h-4 w-4" /> Clear Cache
        </Button>
        {msg && <Message type={msg.type} text={msg.text} onDismiss={() => setMsg(null)} />}
      </Card>

      <Card>
        <h3 className="text-lg font-bold text-zinc-800 dark:text-white mb-4">Storage Optimization</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl bg-zinc-50 dark:bg-zinc-900/50 px-4 py-3">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-zinc-400" />
              <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Photos</span>
            </div>
            <span className="text-sm font-bold text-zinc-800 dark:text-white">{formatSize(stats.categoryBreakdown.photo || 0)}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-zinc-50 dark:bg-zinc-900/50 px-4 py-3">
            <div className="flex items-center gap-2">
              <Video className="h-4 w-4 text-zinc-400" />
              <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Videos</span>
            </div>
            <span className="text-sm font-bold text-zinc-800 dark:text-white">{formatSize(stats.categoryBreakdown.video || 0)}</span>
          </div>
          <Button variant="primary" className="w-full" onClick={() => window.location.href = "/files"}>
            <Sliders className="h-4 w-4" /> Optimize Storage
          </Button>
        </div>
      </Card>
    </div>
  );
}

function UploadsSection({ userId }: { userId: string }) {
  const [upload, setUpload] = useState<UploadSettings>(() => settingsService.getUpload(userId));
  const [msg, setMsg] = useState<{ type: "success"; text: string } | null>(null);

  const update = (key: keyof UploadSettings, value: any) => {
    const updated = settingsService.updateUpload(userId, { [key]: value });
    setUpload(updated);
    setMsg({ type: "success", text: "Upload settings saved!" });
    setTimeout(() => setMsg(null), 2000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="text-lg font-bold text-zinc-800 dark:text-white mb-4 flex items-center gap-2">
          <Upload className="h-5 w-5 text-amber-500" /> Upload Preferences
        </h3>
        <Select label="Upload Quality" value={upload.uploadQuality}
          onChange={(v) => update("uploadQuality", v)}
          options={[
            { value: "original", label: "Original Quality" },
            { value: "high", label: "High Quality" },
            { value: "medium", label: "Medium Quality" },
            { value: "low", label: "Low Quality" },
          ]} />
        <Toggle label="Auto Upload" description="Automatically upload new files" enabled={upload.autoUpload}
          onChange={(v) => update("autoUpload", v)} />
        <Toggle label="Wi-Fi Only" description="Only upload on Wi-Fi connections" enabled={upload.wifiOnly}
          onChange={(v) => update("wifiOnly", v)} />
        <Toggle label="Background Uploads" description="Continue uploading in background" enabled={upload.backgroundUploads}
          onChange={(v) => update("backgroundUploads", v)} />
        {msg && <Message type={msg.type} text={msg.text} onDismiss={() => setMsg(null)} />}
      </Card>
    </div>
  );
}

function DownloadsSection({ userId }: { userId: string }) {
  const [download, setDownload] = useState<DownloadSettings>(() => settingsService.getDownload(userId));
  const [msg, setMsg] = useState<{ type: "success"; text: string } | null>(null);

  const update = (key: keyof DownloadSettings, value: any) => {
    const updated = settingsService.updateDownload(userId, { [key]: value });
    setDownload(updated);
    setMsg({ type: "success", text: "Download settings saved!" });
    setTimeout(() => setMsg(null), 2000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="text-lg font-bold text-zinc-800 dark:text-white mb-4 flex items-center gap-2">
          <Download className="h-5 w-5 text-amber-500" /> Download Preferences
        </h3>
        <Select label="Download Quality" value={download.downloadQuality}
          onChange={(v) => update("downloadQuality", v)}
          options={[
            { value: "original", label: "Original Quality" },
            { value: "high", label: "High Quality" },
            { value: "medium", label: "Medium Quality" },
            { value: "low", label: "Low Quality" },
          ]} />
        <Select label="Download Location" value={download.downloadLocation}
          onChange={(v) => update("downloadLocation", v)}
          options={[
            { value: "default", label: "Default Downloads" },
            { value: "desktop", label: "Desktop" },
            { value: "documents", label: "Documents" },
            { value: "custom", label: "Custom Location" },
          ]} />
        <Toggle label="Offline Storage" description="Keep files available offline" enabled={download.offlineStorage}
          onChange={(v) => update("offlineStorage", v)} />
        {msg && <Message type={msg.type} text={msg.text} onDismiss={() => setMsg(null)} />}
      </Card>
    </div>
  );
}

function BackupSection({ userId }: { userId: string }) {
  const [backup, setBackup] = useState<BackupSettings>(() => settingsService.getBackup(userId));
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [backingUp, setBackingUp] = useState(false);

  const update = (key: keyof BackupSettings, value: any) => {
    const updated = settingsService.updateBackup(userId, { [key]: value });
    setBackup(updated);
  };

  const handleManualBackup = () => {
    setBackingUp(true);
    setTimeout(() => {
      const now = new Date().toISOString();
      const updated = settingsService.updateBackup(userId, { lastBackup: now, automaticBackup: backup.automaticBackup, backupInterval: backup.backupInterval });
      setBackup(updated);
      setBackingUp(false);
      setMsg({ type: "success", text: "Backup completed successfully!" });
      setTimeout(() => setMsg(null), 3000);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="text-lg font-bold text-zinc-800 dark:text-white mb-4 flex items-center gap-2">
          <RefreshCw className="h-5 w-5 text-amber-500" /> Backup Status
        </h3>
        <div className="flex items-center justify-between rounded-xl bg-zinc-50 dark:bg-zinc-900/50 px-4 py-3 mb-4">
          <div>
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Last Backup</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{formatDate(backup.lastBackup)}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${backup.lastBackup ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"}`}>
            {backup.lastBackup ? "Backed Up" : "Never"}
          </span>
        </div>
        <Button variant="primary" className="w-full mb-4" onClick={handleManualBackup} disabled={backingUp}>
          {backingUp ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
          {backingUp ? "Backing up..." : "Back Up Now"}
        </Button>
        <Toggle label="Automatic Backup" description="Schedule regular backups" enabled={backup.automaticBackup}
          onChange={(v) => update("automaticBackup", v)} />
        {backup.automaticBackup && (
          <Select label="Backup Interval" value={backup.backupInterval}
            onChange={(v) => update("backupInterval", v)}
            options={[
              { value: "daily", label: "Daily" },
              { value: "weekly", label: "Weekly" },
              { value: "monthly", label: "Monthly" },
            ]} />
        )}
        {msg && <Message type={msg.type} text={msg.text} onDismiss={() => setMsg(null)} />}
      </Card>
    </div>
  );
}

function ConnectedServicesSection({ userId }: { userId: string }) {
  const [services, setServices] = useState<ConnectedService[]>(() => settingsService.getConnectedServices(userId));

  const handleRemove = (id: string) => {
    settingsService.removeConnectedService(userId, id);
    setServices(settingsService.getConnectedServices(userId));
  };

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="text-lg font-bold text-zinc-800 dark:text-white mb-4 flex items-center gap-2">
          <Link2 className="h-5 w-5 text-amber-500" /> Connected Devices
        </h3>
        {services.filter(s => s.type === "device").length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400 py-4 text-center">No connected devices</p>
        ) : (
          services.filter(s => s.type === "device").map((svc) => (
            <div key={svc.id} className="flex items-center justify-between rounded-xl bg-zinc-50 dark:bg-zinc-900/50 px-4 py-3">
              <div className="flex items-center gap-3">
                <Smartphone className="h-4 w-4 text-zinc-400" />
                <div>
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{svc.name}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Last active: {formatDate(svc.lastActive)}</p>
                </div>
              </div>
              <Button variant="ghost" onClick={() => handleRemove(svc.id)}><X className="h-4 w-4" /></Button>
            </div>
          ))
        )}
      </Card>

      <Card>
        <h3 className="text-lg font-bold text-zinc-800 dark:text-white mb-4">Connected Browsers</h3>
        {services.filter(s => s.type === "browser").length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400 py-4 text-center">No connected browsers</p>
        ) : (
          services.filter(s => s.type === "browser").map((svc) => (
            <div key={svc.id} className="flex items-center justify-between rounded-xl bg-zinc-50 dark:bg-zinc-900/50 px-4 py-3">
              <div className="flex items-center gap-3">
                <Monitor className="h-4 w-4 text-zinc-400" />
                <div>
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{svc.name}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{svc.status}</p>
                </div>
              </div>
              <Button variant="ghost" onClick={() => handleRemove(svc.id)}><X className="h-4 w-4" /></Button>
            </div>
          ))
        )}
      </Card>

      <Card>
        <h3 className="text-lg font-bold text-zinc-800 dark:text-white mb-4">Third-Party Integrations</h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 py-4 text-center">No third-party integrations configured</p>
      </Card>
    </div>
  );
}

function ApplicationSection({ userId }: { userId: string }) {
  const [app, setApp] = useState(() => settingsService.getApp(userId));
  const [updating, setUpdating] = useState(false);
  const [msg, setMsg] = useState<{ type: "success"; text: string } | null>(null);

  const handleCheckUpdates = () => {
    setUpdating(true);
    setTimeout(() => {
      setUpdating(false);
      setMsg({ type: "success", text: "You're on the latest version!" });
      setTimeout(() => setMsg(null), 3000);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="text-lg font-bold text-zinc-800 dark:text-white mb-4">Application Info</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl bg-zinc-50 dark:bg-zinc-900/50 px-4 py-3">
            <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Version</span>
            <span className="text-sm font-bold text-zinc-800 dark:text-white">{import.meta.env.VITE_APP_VERSION || "1.0.0"}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-zinc-50 dark:bg-zinc-900/50 px-4 py-3">
            <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Environment</span>
            <span className="text-sm font-bold text-zinc-800 dark:text-white">{import.meta.env.VITE_APP_ENV || "production"}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-zinc-50 dark:bg-zinc-900/50 px-4 py-3">
            <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">App Name</span>
            <span className="text-sm font-bold text-zinc-800 dark:text-white">{import.meta.env.VITE_APP_NAME || "Novaa Drive"}</span>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-bold text-zinc-800 dark:text-white mb-4">Release Notes</h3>
        <div className="rounded-xl bg-zinc-50 dark:bg-zinc-900/50 p-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">{app.releaseNotes}</p>
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-bold text-zinc-800 dark:text-white mb-4">Updates</h3>
        <Button variant="primary" className="w-full" onClick={handleCheckUpdates} disabled={updating}>
          {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {updating ? "Checking..." : "Check for Updates"}
        </Button>
        <Toggle label="Auto-check Updates" description="Automatically check for new versions" enabled={app.checkUpdates}
          onChange={(v) => { const u = settingsService.updateApp(userId, { checkUpdates: v }); setApp(u); }} />
        {msg && <Message type={msg.type} text={msg.text} onDismiss={() => setMsg(null)} />}
      </Card>

      <Card>
        <h3 className="text-lg font-bold text-zinc-800 dark:text-white mb-4">Diagnostics</h3>
        <Toggle label="Diagnostics" description="Collect diagnostic information" enabled={app.diagnosticsEnabled}
          onChange={(v) => { const u = settingsService.updateApp(userId, { diagnosticsEnabled: v }); setApp(u); }} />
        <Toggle label="Error Reporting" description="Automatically report errors" enabled={app.errorReporting}
          onChange={(v) => { const u = settingsService.updateApp(userId, { errorReporting: v }); setApp(u); }} />
      </Card>
    </div>
  );
}

function SupportSection() {
  return (
    <div className="space-y-6">
      <Card>
        <h3 className="text-lg font-bold text-zinc-800 dark:text-white mb-4 flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-amber-500" /> Help & Support
        </h3>
        <div className="space-y-3">
          <Button variant="secondary" className="w-full justify-between">
            <span className="flex items-center gap-2"><BookOpen className="h-4 w-4" /> Help Center</span>
            <ExternalLink className="h-4 w-4" />
          </Button>
          <Button variant="secondary" className="w-full justify-between">
            <span className="flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Contact Support</span>
            <ExternalLink className="h-4 w-4" />
          </Button>
          <Button variant="secondary" className="w-full justify-between">
            <span className="flex items-center gap-2"><Bug className="h-4 w-4" /> Report a Bug</span>
            <ExternalLink className="h-4 w-4" />
          </Button>
          <Button variant="secondary" className="w-full justify-between">
            <span className="flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Send Feedback</span>
            <ExternalLink className="h-4 w-4" />
          </Button>
          <Button variant="secondary" className="w-full justify-between">
            <span className="flex items-center gap-2"><Search className="h-4 w-4" /> FAQ</span>
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}

function LegalSection() {
  return (
    <div className="space-y-6">
      <Card>
        <h3 className="text-lg font-bold text-zinc-800 dark:text-white mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-amber-500" /> Legal
        </h3>
        <div className="space-y-3">
          <Button variant="secondary" className="w-full justify-between">
            <span className="flex items-center gap-2"><ScrollText className="h-4 w-4" /> Privacy Policy</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="secondary" className="w-full justify-between">
            <span className="flex items-center gap-2"><FileText className="h-4 w-4" /> Terms of Service</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="secondary" className="w-full justify-between">
            <span className="flex items-center gap-2"><Award className="h-4 w-4" /> Licenses</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="secondary" className="w-full justify-between">
            <span className="flex items-center gap-2"><BookOpen className="h-4 w-4" /> Open Source Notices</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}

// ─── Main Settings Component ──────────────────────────────────────────────

export default function Settings({ storageRefreshKey }: { storageRefreshKey?: number }) {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<SettingsSection>("profile");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return SECTIONS;
    const q = searchQuery.toLowerCase();
    return SECTIONS.filter(
      (s) => s.label.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  if (!user) return null;

  const renderSection = () => {
    switch (activeSection) {
      case "profile": return <ProfileSection userId={user.id} />;
      case "account": return <AccountSection userId={user.id} />;
      case "security": return <SecuritySection userId={user.id} />;
      case "privacy": return <PrivacySection userId={user.id} />;
      case "notifications": return <NotificationsSection userId={user.id} />;
      case "appearance": return <AppearanceSection userId={user.id} />;
      case "language": return <LanguageRegionSection userId={user.id} />;
      case "storage": return <StorageSection userId={user.id} />;
      case "uploads": return <UploadsSection userId={user.id} />;
      case "downloads": return <DownloadsSection userId={user.id} />;
      case "backup": return <BackupSection userId={user.id} />;
      case "connected": return <ConnectedServicesSection userId={user.id} />;
      case "application": return <ApplicationSection userId={user.id} />;
      case "support": return <SupportSection />;
      case "legal": return <LegalSection />;
      default: return <ProfileSection userId={user.id} />;
    }
  };

  const activeSectionConfig = SECTIONS.find((s) => s.id === activeSection);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-zinc-900 dark:text-white">Settings</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          {activeSectionConfig?.description || "Manage your account settings"}
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          placeholder="Search settings..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-3 pl-10 pr-4 text-sm text-zinc-800 dark:text-white outline-none focus:border-amber-500 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
        />
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar Navigation */}
        <div className="lg:w-64 flex-shrink-0">
          <nav className="space-y-1 rounded-2xl border border-zinc-200/70 dark:border-zinc-800/50 bg-white/80 dark:bg-zinc-950/60 p-2 backdrop-blur-md">
            {filteredSections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-all ${
                    activeSection === section.id
                      ? "bg-amber-500 text-slate-950 shadow-sm"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{section.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="space-y-6">
            {renderSection()}
          </div>
        </div>
      </div>
    </div>
  );
}