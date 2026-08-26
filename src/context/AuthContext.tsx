/* eslint-disable react/only-export-components */
"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { ADMIN_EMAIL, ADMIN_PASSWORD_HASH, ADMIN_USERNAME, DEMO_USER, DEMO_USER_ID, DEMO_PASSWORD_HASH, DEMO_USER_EMAIL, DEMO_USER_FULLNAME, DEMO_USER_USERNAME, hashPassword, verifyPassword } from "../config/credentials";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface AuthUser {
  id: string;
  email: string;
  fullName?: string;
  username?: string;
  phone?: string;
  avatarUrl?: string;
}

interface AdminSession {
  id: string;
  email: string;
  username: string;
  role: "admin";
  _ts: number;
}

interface AuthSignupData {
  email: string;
  password: string;
  fullName?: string;
  username?: string;
  phone?: string;
  dob?: string;
  acceptTerms?: boolean;
}

interface AuthProfileUpdate {
  fullName?: string;
  username?: string;
  phone?: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  adminSession: AdminSession | null;
  loading: boolean;
  adminLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInAsGuest: () => Promise<void>;
  signInAsAdmin: (emailOrUsername: string, password: string) => Promise<void>;
  signUp: (input: AuthSignupData) => Promise<void>;
  signOut: () => Promise<void>;
  adminSignOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signInWithProvider: (provider: string) => Promise<void>;
  updateProfile: (profile: AuthProfileUpdate) => Promise<void>;
  isDemoMode: boolean;
  isAiMode: boolean;
  toggleAiMode: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const SESSION_KEY = import.meta.env.VITE_SESSION_KEY as string || "novaa_session";
const ADMIN_SESSION_KEY = "novaa_admin_session";
const USERS_KEY = "novaa_users";
const DEMO_HASH_KEY = "novaa_demo_hash";
const SESSION_TIMEOUT_MS = parseInt(import.meta.env.VITE_SESSION_TIMEOUT_MINUTES || "1440") * 60 * 1000; // 24h default
const MAX_ATTEMPTS = parseInt(import.meta.env.VITE_MAX_LOGIN_ATTEMPTS || "10");
const LOCKOUT_MS = parseInt(import.meta.env.VITE_LOCKOUT_DURATION_MINUTES || "15") * 60 * 1000;

// ─────────────────────────────────────────────────────────────────────────────
// localStorage helpers — never throw
// ─────────────────────────────────────────────────────────────────────────────
function lsGet(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
function lsSet(key: string, value: string): void {
  try { localStorage.setItem(key, value); } catch {}
}
function lsRemove(key: string): void {
  try { localStorage.removeItem(key); } catch {}
}

// ─────────────────────────────────────────────────────────────────────────────
// User store helpers
// ─────────────────────────────────────────────────────────────────────────────
function getUsers(): any[] {
  try {
    const raw = lsGet(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
function saveUsers(users: any[]): void {
  lsSet(USERS_KEY, JSON.stringify(users));
}

// ─────────────────────────────────────────────────────────────────────────────
// Rate limiting — uses sessionStorage so it resets on browser restart
// ─────────────────────────────────────────────────────────────────────────────
function getRateLimit(key: string): { attempts: number; lockedUntil: number } {
  try {
    const raw = sessionStorage.getItem(`rl_${key}`);
    return raw ? JSON.parse(raw) : { attempts: 0, lockedUntil: 0 };
  } catch { return { attempts: 0, lockedUntil: 0 }; }
}
function setRateLimit(key: string, data: { attempts: number; lockedUntil: number }): void {
  try { sessionStorage.setItem(`rl_${key}`, JSON.stringify(data)); } catch {}
}
function clearRateLimit(key: string): void {
  try { sessionStorage.removeItem(`rl_${key}`); } catch {}
}

// ─────────────────────────────────────────────────────────────────────────────
// Seed / repair demo user — runs on every app load
// Ensures the demo user always exists.
// CRITICAL: Never overwrite existing demo user hash (preserves user logins across deployments)
// ─────────────────────────────────────────────────────────────────────────────
async function ensureDemoUser(): Promise<void> {
  const users = getUsers();
  const idx = users.findIndex((u: any) => u.id === DEMO_USER_ID);

  if (idx === -1) {
    // Demo user missing — add with current env hash
    users.push({ ...DEMO_USER });
    saveUsers(users);
    return;
  }

  // Demo user exists in storage — PRESERVE the stored hash
  // This ensures users can log in after Vercel deployments even if env vars change
  // Only repair if no hash exists at all (corrupted account)
  if (!users[idx].passwordHash) {
    users[idx].passwordHash = DEMO_PASSWORD_HASH;
    delete users[idx].password;
    saveUsers(users);
  }
  
  // Ensure demo user has required fields
  if (!users[idx].email) users[idx].email = DEMO_USER_EMAIL;
  if (!users[idx].fullName) users[idx].fullName = DEMO_USER_FULLNAME;
  if (!users[idx].username) users[idx].username = DEMO_USER_USERNAME;
  saveUsers(users);
}

// ─────────────────────────────────────────────────────────────────────────────
// Migrate any legacy plaintext-password users to hashed
// ─────────────────────────────────────────────────────────────────────────────
async function migrateLegacyPasswords(): Promise<void> {
  const users = getUsers();
  let changed = false;
  for (const u of users) {
    if (u.password && !u.passwordHash) {
      u.passwordHash = await hashPassword(u.password);
      delete u.password;
      changed = true;
    }
  }
  if (changed) saveUsers(users);
}

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminLoading, setAdminLoading] = useState(true);
  const [isAiMode, setIsAiMode] = useState<boolean>(() => {
    return lsGet("ai_mode") !== "false";
  });

  const toggleAiMode = () => {
    setIsAiMode((prev) => {
      const next = !prev;
      lsSet("ai_mode", String(next));
      return next;
    });
  };

  // ── Boot: seed demo user, migrate passwords, restore session ─────────────
  useEffect(() => {
    (async () => {
      try {
        await ensureDemoUser();
        await migrateLegacyPasswords();

        const raw = lsGet(SESSION_KEY);
        if (raw) {
          const session = JSON.parse(raw);
          const age = Date.now() - (session._ts || 0);
          if (age < SESSION_TIMEOUT_MS) {
            // Refresh timestamp so active users stay logged in
            session._ts = Date.now();
            lsSet(SESSION_KEY, JSON.stringify(session));
            setUser(session);
          } else {
            // Session expired — clear it but keep the user account
            lsRemove(SESSION_KEY);
          }
        }

        const rawAdmin = lsGet(ADMIN_SESSION_KEY);
        if (rawAdmin) {
          const session = JSON.parse(rawAdmin) as AdminSession;
          const age = Date.now() - (session._ts || 0);
          if (session.role === "admin" && age < SESSION_TIMEOUT_MS) {
            session._ts = Date.now();
            lsSet(ADMIN_SESSION_KEY, JSON.stringify(session));
            setAdminSession(session);
          } else {
            lsRemove(ADMIN_SESSION_KEY);
          }
        }
      } catch (e) {
        console.error("Auth boot failed:", e);
      } finally {
        setLoading(false);
        setAdminLoading(false);
      }
    })();
  }, []);

  // ── Sign In ───────────────────────────────────────────────────────────────
  const signIn = async (emailOrUsername: string, password: string) => {
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 150)); // prevent timing attacks

      const rlKey = emailOrUsername.trim().toLowerCase();
      const rl = getRateLimit(rlKey);

      if (rl.lockedUntil > Date.now()) {
        const mins = Math.ceil((rl.lockedUntil - Date.now()) / 60000);
        throw new Error(`Too many failed attempts. Try again in ${mins} minute${mins !== 1 ? "s" : ""}.`);
      }

      const users = getUsers();
      const match = users.find(
        (u: any) =>
          u.email?.toLowerCase() === rlKey ||
          u.username?.toLowerCase() === rlKey
      );

      let passwordOk = false;
      if (match) {
        if (match.passwordHash) {
          passwordOk = await verifyPassword(password, match.passwordHash);
        } else if (match.password) {
          // Legacy plaintext fallback — migrate immediately on success
          passwordOk = match.password === password;
          if (passwordOk) {
            match.passwordHash = await hashPassword(password);
            delete match.password;
            saveUsers(users);
          }
        }
      }

      if (!match || !passwordOk) {
        const attempts = rl.attempts + 1;
        const lockedUntil = attempts >= MAX_ATTEMPTS ? Date.now() + LOCKOUT_MS : 0;
        setRateLimit(rlKey, { attempts, lockedUntil });
        const remaining = MAX_ATTEMPTS - attempts;
        if (remaining <= 0) {
          throw new Error(`Account locked for ${LOCKOUT_MS / 60000} minutes due to too many failed attempts.`);
        }
        throw new Error(`Invalid email/username or password. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`);
      }

      clearRateLimit(rlKey);

      const session = {
        id: match.id,
        email: match.email,
        fullName: match.fullName || "",
        username: match.username || "",
        phone: match.phone || "",
        _ts: Date.now(),
      };
      lsSet(SESSION_KEY, JSON.stringify(session));
      setUser(session);
    } finally {
      setLoading(false);
    }
  };

  // ── Guest Sign In ─────────────────────────────────────────────────────────
  const signInAsGuest = async () => {
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 120));
      const session = {
        id: "guest_novaa",
        email: "guest@novaadrive.local",
        fullName: "Guest User",
        username: "guest",
        phone: "",
        isGuest: true,
        _ts: Date.now(),
      };
      lsSet(SESSION_KEY, JSON.stringify(session));
      setUser(session);
    } finally {
      setLoading(false);
    }
  };

  // ── Admin Sign In ────────────────────────────────────────────────────────
  const signInAsAdmin = async (emailOrUsername: string, password: string) => {
    setAdminLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 200));
      const rlKey = `admin:${emailOrUsername.trim().toLowerCase()}`;
      const rl = getRateLimit(rlKey);

      if (rl.lockedUntil > Date.now()) {
        const mins = Math.ceil((rl.lockedUntil - Date.now()) / 60000);
        throw new Error(`Too many failed attempts. Try again in ${mins} minute${mins !== 1 ? "s" : ""}.`);
      }

      const identifier = emailOrUsername.trim().toLowerCase();
      const identityMatches = Boolean(ADMIN_PASSWORD_HASH) &&
        (identifier === ADMIN_EMAIL || identifier === ADMIN_USERNAME);
      const passwordOk = identityMatches && await verifyPassword(password, ADMIN_PASSWORD_HASH);

      if (!passwordOk) {
        const attempts = rl.attempts + 1;
        const lockedUntil = attempts >= MAX_ATTEMPTS ? Date.now() + LOCKOUT_MS : 0;
        setRateLimit(rlKey, { attempts, lockedUntil });
        const remaining = MAX_ATTEMPTS - attempts;
        if (remaining <= 0) throw new Error(`Admin access locked for ${LOCKOUT_MS / 60000} minutes.`);
        throw new Error(`Invalid administrator credentials. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`);
      }

      clearRateLimit(rlKey);
      const session: AdminSession = {
        id: "admin_novaa",
        email: ADMIN_EMAIL || identifier,
        username: ADMIN_USERNAME || identifier,
        role: "admin",
        _ts: Date.now(),
      };
      lsSet(ADMIN_SESSION_KEY, JSON.stringify(session));
      setAdminSession(session);
    } finally {
      setAdminLoading(false);
    }
  };

  // ── Sign Up ───────────────────────────────────────────────────────────────
  const signUp = async ({ email, password, fullName, username, phone }: AuthSignupData) => {
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 200));

      const normalizedEmail = email.trim().toLowerCase();
      if (!normalizedEmail.includes("@") || normalizedEmail.length < 5) {
        throw new Error("Invalid email address.");
      }
      if (password.length < 8) throw new Error("Password must be at least 8 characters.");
      if (!/[A-Z]/.test(password)) throw new Error("Password must contain at least one uppercase letter.");
      if (!/[0-9]/.test(password)) throw new Error("Password must contain at least one number.");

      const users = getUsers();
      if (users.some((u: any) => u.email?.toLowerCase() === normalizedEmail)) {
        throw new Error("An account with this email already exists.");
      }

      const passwordHash = await hashPassword(password);
      const newUser = {
        id: "usr_" + Array.from(crypto.getRandomValues(new Uint8Array(8)))
          .map((b) => b.toString(16).padStart(2, "0")).join(""),
        email: normalizedEmail,
        passwordHash,
        fullName: fullName?.trim() || "",
        username: username?.trim() || "",
        phone: phone?.trim() || "",
      };
      users.push(newUser);
      saveUsers(users);

      const session = {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        username: newUser.username,
        phone: newUser.phone,
        _ts: Date.now(),
      };
      lsSet(SESSION_KEY, JSON.stringify(session));
      setUser(session);
    } finally {
      setLoading(false);
    }
  };

  // ── Reset Password ────────────────────────────────────────────────────────
  const resetPassword = async (email: string) => {
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 250));
      // Always return the same message to prevent user enumeration
      const users = getUsers();
      const found = users.some((u: any) => u.email?.toLowerCase() === email.trim().toLowerCase());
      if (!found) {
        throw new Error("If that email is registered, a reset link has been sent.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Social Login (not available in local mode) ────────────────────────────
  const signInWithProvider = async (_provider: string) => {
    throw new Error("Social login is not available in local mode.");
  };

  // ── Update Profile ────────────────────────────────────────────────────────
  const updateProfile = async (profile: AuthProfileUpdate) => {
    setLoading(true);
    try {
      if (!user) throw new Error("No active session.");
      const users = getUsers();
      const updated = users.map((u: any) =>
        u.id === user.id ? { ...u, ...profile } : u
      );
      saveUsers(updated);
      const updatedSession = { ...user, ...profile, _ts: Date.now() };
      lsSet(SESSION_KEY, JSON.stringify(updatedSession));
      setUser(updatedSession);
    } finally {
      setLoading(false);
    }
  };

  // ── Sign Out ──────────────────────────────────────────────────────────────
  const signOut = async () => {
    setLoading(true);
    try {
      lsRemove(SESSION_KEY);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const adminSignOut = async () => {
    setAdminLoading(true);
    try {
      lsRemove(ADMIN_SESSION_KEY);
      setAdminSession(null);
    } finally {
      setAdminLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        adminSession,
        loading,
        adminLoading,
        signIn,
        signInAsGuest,
        signInAsAdmin,
        signUp,
        signOut,
        adminSignOut,
        resetPassword,
        signInWithProvider,
        updateProfile,
        isDemoMode: false,
        isAiMode,
        toggleAiMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
