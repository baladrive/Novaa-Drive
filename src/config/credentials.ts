// Credentials are loaded exclusively from environment variables.
// Set the following in .env.local (never commit that file):
//   VITE_DEMO_USER_ID
//   VITE_DEMO_USER_EMAIL
//   VITE_DEMO_USER_USERNAME
//   VITE_DEMO_USER_FULLNAME
//   VITE_DEMO_PASSWORD_HASH  — SHA-256 hex of the password

// Fallback demo credentials for Vercel/production deployments
// These are used when environment variables are not set
const FALLBACK_IDS = {
  userId: "usr_NovaaDrive2024",
  email: "demo@novaadrive.com",
  username: "NovaaUser",
  fullName: "Novaa Drive User",
  passwordHash: "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918" // SHA-256 of "Novaa2024!"
};

export const DEMO_USER_ID = (import.meta.env.VITE_DEMO_USER_ID as string) || FALLBACK_IDS.userId;
export const DEMO_USER_EMAIL = (import.meta.env.VITE_DEMO_USER_EMAIL as string) || FALLBACK_IDS.email;
export const DEMO_USER_USERNAME = (import.meta.env.VITE_DEMO_USER_USERNAME as string) || FALLBACK_IDS.username;
export const DEMO_USER_FULLNAME = (import.meta.env.VITE_DEMO_USER_FULLNAME as string) || FALLBACK_IDS.fullName;
export const DEMO_PASSWORD_HASH = (import.meta.env.VITE_DEMO_PASSWORD_HASH as string) || FALLBACK_IDS.passwordHash;

export const ADMIN_EMAIL = ((import.meta.env.VITE_ADMIN_EMAIL as string) || "").trim().toLowerCase();
export const ADMIN_USERNAME = ((import.meta.env.VITE_ADMIN_USERNAME as string) || "").trim().toLowerCase();
export const ADMIN_PASSWORD_HASH = (import.meta.env.VITE_ADMIN_PASSWORD_HASH as string) || "";

export const DEMO_USER = {
  id: DEMO_USER_ID,
  email: DEMO_USER_EMAIL,
  passwordHash: DEMO_PASSWORD_HASH,
  fullName: DEMO_USER_FULLNAME,
  username: DEMO_USER_USERNAME,
  phone: "",
};

/** Hash a plaintext password with SHA-256 using Web Crypto API */
export async function hashPassword(plain: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(plain)
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Verify a plaintext password against a stored SHA-256 hex hash */
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  const computed = await hashPassword(plain);
  const enc = new TextEncoder();
  const key = await crypto.subtle.generateKey(
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const [macA, macB] = await Promise.all([
    crypto.subtle.sign("HMAC", key, enc.encode(computed)),
    crypto.subtle.sign("HMAC", key, enc.encode(hash)),
  ]);
  const a = new Uint8Array(macA);
  const b = new Uint8Array(macB);
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a[i] ^ b[i];
  return mismatch === 0;
}
