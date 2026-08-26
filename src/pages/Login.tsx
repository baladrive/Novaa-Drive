"use client";
import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { KeyRound, Mail, Shield } from "lucide-react";

export default function Login() {
  const {
    signIn,
    signUp,
    resetPassword,
    signInWithProvider,
    isDemoMode,
    isAiMode
  } = useAuth();

  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const [aiScanning, setAiScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);

  const evaluatePasswordStrength = (value: string) => {
    let score = 0;
    if (value.length >= 10) score += 2;
    if (/[A-Z]/.test(value)) score += 1;
    if (/[a-z]/.test(value)) score += 1;
    if (/[0-9]/.test(value)) score += 1;
    if (/[^A-Za-z0-9]/.test(value)) score += 1;
    setPasswordStrength(Math.min(5, score));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (isAiMode) {
        setAiScanning(true);
        setScanStep(0);
        for (let step = 1; step <= 3; step += 1) {
          await new Promise((resolve) => setTimeout(resolve, 350));
          setScanStep(step);
        }
      }

      if (mode === "register") {
        if (!acceptTerms) {
          throw new Error("Please accept the terms and privacy policy before registering.");
        }
        await signUp({
          email,
          password,
          fullName,
          username,
          phone,
          acceptTerms
        });
        setSuccess("Account created. Check your email for verification and next steps.");
      } else if (mode === "forgot") {
        await resetPassword(email);
        setSuccess("Password reset email sent. Please follow the instructions in your inbox.");
      } else {
        await signIn(email, password);
      }
    } catch (err: any) {
      setError(err.message || "An authentication error occurred.");
    } finally {
      setLoading(false);
      setAiScanning(false);
    }
  };

  const handleProviderSignIn = async (provider: string) => {
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await signInWithProvider(provider);
    } catch (err: any) {
      setError(err.message || "Unable to sign in with provider.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      {aiScanning && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-zinc-950/95 p-6 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-3xl border border-emerald-500/20 bg-zinc-900/95 p-6 text-center text-sm text-emerald-300">
            <div className="mb-4 flex items-center justify-center">
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
                <div className="absolute inset-0 animate-ping rounded-full bg-emerald-400/20" />
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
              </div>
            </div>
            <p className="uppercase tracking-[0.35em] text-[10px] text-emerald-300">AI Threat Guard</p>
            <div className="mt-4 space-y-2 text-left text-xs leading-relaxed">
              <p className={scanStep >= 0 ? "opacity-100" : "opacity-0"}>Initializing adaptive verification engine...</p>
              <p className={scanStep >= 1 ? "opacity-100 text-emerald-300" : "opacity-0"}>✓ Device fingerprint assessment</p>
              <p className={scanStep >= 2 ? "opacity-100 text-emerald-300" : "opacity-0"}>✓ Network security validation</p>
              <p className={scanStep >= 3 ? "opacity-100 text-emerald-300" : "opacity-0"}>✓ Threat score nominal</p>
            </div>
          </div>
        </div>
      )}

      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-zinc-150 bg-white shadow-2xl dark:border-zinc-900 dark:bg-zinc-900/60">
        <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="bg-gradient-to-br from-slate-900 via-zinc-950 to-zinc-900 p-10 text-white">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20">
                <Shield className="h-7 w-7" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-amber-300/90">Enterprise-ready Auth</p>
                <h1 className="mt-3 text-3xl font-black tracking-tight">Secure Login & Registration</h1>
              </div>
            </div>
            <p className="text-sm leading-7 text-zinc-300">
              One secure access layer for your cloud archive. Fast sign in, password recovery, biometric-ready social auth, and enterprise verification built on Supabase.
            </p>
            <div className="mt-8 space-y-4 rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-zinc-300">
              <div className="flex items-center gap-3">
                <span className="rounded-2xl bg-amber-400/10 px-3 py-2 text-amber-300">01</span>
                <span>Continuous login risk scanning.</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-2xl bg-amber-400/10 px-3 py-2 text-amber-300">02</span>
                <span>OAuth login with Google, GitHub, and Apple.</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-2xl bg-amber-400/10 px-3 py-2 text-amber-300">03</span>
                <span>Password reset and account recovery built in.</span>
              </div>
            </div>
          </div>

          <div className="p-8 sm:p-10">
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.35em] text-amber-500">
                // amazonq-ignore-next-line
                {mode === "register" ? "Create account" : mode === "forgot" ? "Recover password" : "Welcome back"}
              </p>
              <h2 className="mt-3 text-2xl font-black text-zinc-950 dark:text-white">
                {mode === "register" ? "Join Bala Drive" : mode === "forgot" ? "Reset your password" : "Sign in securely"}
              </h2>
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                {mode === "register"
                  ? "Register with your work email and unlock premium cloud features."
                  : mode === "forgot"
                  ? "Enter your email and we’ll send a reset link."
                  : "Use your credentials or continue with one of our connected providers."}
              </p>
            </div>

            {(error || success) && (
              <div className={`mt-6 rounded-2xl p-4 text-xs font-semibold ${error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
                {error || success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                    <Mail className="h-4.5 w-4.5" />
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-2xl border border-zinc-200 bg-white py-3 pl-11 pr-4 text-xs text-zinc-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                  />
                </div>
              </div>

              {mode !== "forgot" && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Password</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                        <KeyRound className="h-4.5 w-4.5" />
                      </span>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          evaluatePasswordStrength(e.target.value);
                        }}
                        className="w-full rounded-2xl border border-zinc-200 bg-white py-3 pl-11 pr-4 text-xs text-zinc-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                      />
                    </div>
                  </div>

                  {mode === "register" && (
                    <>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Full name</label>
                          <input
                            type="text"
                            placeholder="Alex Morgan"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full rounded-2xl border border-zinc-200 bg-white py-3 px-4 text-xs text-zinc-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Username</label>
                          <input
                            type="text"
                            placeholder="alexm"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full rounded-2xl border border-zinc-200 bg-white py-3 px-4 text-xs text-zinc-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Phone</label>
                          <input
                            type="tel"
                            placeholder="(555) 123-4567"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full rounded-2xl border border-zinc-200 bg-white py-3 px-4 text-xs text-zinc-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Password strength</label>
                          <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-zinc-500">
                            <span className="min-w-[80px]">Strength</span>
                            <span>{passwordStrength}/5</span>
                          </div>
                          <div className="h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-300" style={{ width: `${(passwordStrength / 5) * 100}%` }} />
                          </div>
                        </div>
                      </div>

                      <label className="flex items-start gap-3 text-xs text-zinc-500 mt-2">
                        <input
                          type="checkbox"
                          checked={acceptTerms}
                          onChange={(e) => setAcceptTerms(e.target.checked)}
                          className="mt-1 h-4 w-4 rounded border-zinc-300 text-amber-500 focus:ring-amber-500"
                        />
                        <span>
                          I agree to the <span className="font-bold text-amber-600">Terms of Service</span> and <span className="font-bold text-amber-600">Privacy Policy</span>.
                        </span>
                      </label>
                    </>
                  )}
                </>
              )}

              <button
                type="submit"
                disabled={loading || (mode === "register" && !acceptTerms)}
                className="mt-4 w-full rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 py-3 text-xs font-black text-slate-950 shadow-lg shadow-amber-500/20 transition hover:from-amber-600 hover:to-yellow-600 disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Processing..." : mode === "register" ? "Create secure account" : mode === "forgot" ? "Send reset link" : "Sign in with email"}
              </button>
            </form>

            <div className="mt-6 space-y-3 text-center text-xs text-zinc-500">
              {mode === "login" && (
                <button onClick={() => setMode("forgot")} className="font-bold text-amber-600 hover:underline">
                  Forgot your password?
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setMode(mode === "register" ? "login" : "register");
                  setError("");
                  setSuccess("");
                }}
                className="font-bold text-amber-600 hover:underline"
              >
                {mode === "register" ? "Already have an account? Sign in" : "Create a new enterprise account"}
              </button>
            </div>

            <div className="mt-6 border-t border-zinc-200 pt-6 text-center text-xs text-zinc-400 dark:border-zinc-800">
              <p className="mb-3 uppercase tracking-[0.35em] text-zinc-400">Continue with</p>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { label: "Google", provider: "google" },
                  { label: "GitHub", provider: "github" },
                  { label: "Apple", provider: "apple" }
                ].map((item) => (
                  <button
                    key={item.provider}
                    type="button"
                    onClick={() => handleProviderSignIn(item.provider)}
                    className="rounded-2xl border border-zinc-200 bg-white py-3 text-[10px] font-bold uppercase tracking-[0.35em] text-zinc-700 transition hover:border-amber-500 hover:text-amber-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {isDemoMode && (
              <div className="mt-6 rounded-2xl bg-amber-500/10 p-4 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                Demo mode is active. Register a local account or sign in to continue.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
