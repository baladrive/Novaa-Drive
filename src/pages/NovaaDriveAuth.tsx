"use client";
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  KeyRound, Mail, User, Phone, Calendar, Eye, EyeOff,
  Shield, Upload, CheckCircle, XCircle, AlertCircle,
  Github, Monitor, Apple, ArrowRight, Loader2
} from "lucide-react";
import ParticleBackground from "../components/auth/ParticleBackground";
import NovaaLogo from "../components/auth/NovaaLogo";
import FeatureCards from "../components/auth/FeatureCards";
import StatsSection from "../components/auth/StatsSection";

export default function NovaaDriveAuth() {
  const navigate = useNavigate();
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
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Validation states
  const [emailValid, setEmailValid] = useState<boolean | null>(null);
  const [usernameValid, setUsernameValid] = useState<boolean | null>(null);
  const [phoneValid, setPhoneValid] = useState<boolean | null>(null);
  const [passwordsMatch, setPasswordsMatch] = useState<boolean | null>(null);

  // OTP
  const [showOtp, setShowOtp] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  // Animated states
  const [pageLoaded, setPageLoaded] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const mouseGlowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPageLoaded(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      if (mouseGlowRef.current) {
        mouseGlowRef.current.style.setProperty('--mouse-x', `${e.clientX}px`);
        mouseGlowRef.current.style.setProperty('--mouse-y', `${e.clientY}px`);
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const evaluatePasswordStrength = (value: string) => {
    let score = 0;
    if (value.length >= 8) score += 1;
    if (value.length >= 12) score += 1;
    if (/[A-Z]/.test(value)) score += 1;
    if (/[a-z]/.test(value)) score += 0.5;
    if (/[0-9]/.test(value)) score += 1;
    if (/[^A-Za-z0-9]/.test(value)) score += 1;
    setPasswordStrength(Math.min(5, Math.floor(score)));
  };

  const validateEmail = (value: string) => {
    setEmailValid(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value));
  };

  const validateUsername = (value: string) => {
    setUsernameValid(value.length >= 3 && /^[a-zA-Z0-9_]+$/.test(value));
  };

  const validatePhone = (value: string) => {
    setPhoneValid(value.replace(/[\s\-\(\)]/g, '').length >= 10);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (mode === "register") {
        if (!acceptTerms) {
          throw new Error("Please accept the terms and privacy policy before registering.");
        }
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match.");
        }
        // Show OTP first
        setOtpSent(true);
        setShowOtp(true);
        setLoading(false);
        return;
      } else if (mode === "forgot") {
        await resetPassword(email);
        setSuccess("Password reset email sent. Please follow the instructions in your inbox.");
      } else {
        await signIn(email, password);
      }
    } catch (err: any) {
      setError(err.message || "An authentication error occurred.");
    } finally {
      if (!showOtp) setLoading(false);
    }
  };

  const handleOtpVerify = async () => {
    setLoading(true);
    try {
      await signUp({
        email,
        password,
        fullName: `${firstName} ${lastName}`.trim() || fullName || username,
        username,
        phone,
        dob,
        acceptTerms
      });
      setSuccess("Account created successfully! Check your email for verification.");
      setShowOtp(false);
      setMode("login");
    } catch (err: any) {
      setError(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleProviderSignIn = async (provider: string) => {
    setError("");
    setLoading(true);
    try {
      await signInWithProvider(provider);
    } catch (err: any) {
      setError(err.message || "Unable to sign in with provider.");
    } finally {
      setLoading(false);
    }
  };

  const passwordStrengthConfig = [
    { label: 'Very Weak', color: '#ef4444', width: '20%' },
    { label: 'Weak', color: '#f97316', width: '40%' },
    { label: 'Fair', color: '#eab308', width: '60%' },
    { label: 'Strong', color: '#22c55e', width: '80%' },
    { label: 'Very Strong', color: '#00D084', width: '100%' },
  ];

  const strengthIndex = Math.min(Math.floor(passwordStrength), 4);
  const strength = passwordStrengthConfig[strengthIndex] || passwordStrengthConfig[0];

  const inputClass = "w-full rounded-xl border border-white/[0.08] bg-white/[0.04] py-3 px-4 text-sm text-white outline-none transition-all duration-300 placeholder:text-white/25 focus:border-purple-500/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-purple-500/20 hover:border-white/[0.12]";
  const labelClass = "block text-xs font-semibold uppercase tracking-wider text-white/50 mb-1.5";

  return (
    <div className="relative flex min-h-screen w-full overflow-hidden bg-[#0B1020] font-sans">
      {/* Mouse glow follower */}
      <div
        ref={mouseGlowRef}
        className="pointer-events-none fixed inset-0 z-0 opacity-30"
        style={{
          background: `radial-gradient(800px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(124,92,255,0.12), transparent 40%)`,
        }}
      />

      {/* Floating blobs */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] animate-float-slow rounded-full bg-purple-600/10 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-[600px] w-[600px] animate-float-slower rounded-full bg-cyan-600/8 blur-[120px]" />
        <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 animate-pulse-slow rounded-full bg-blue-600/5 blur-[100px]" />
      </div>

      <ParticleBackground />

      {/* Main Container */}
      <div
        className={`relative z-10 flex w-full transition-all duration-1000 ${
          pageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Left Panel - 45% Branding */}
        <div className="hidden min-h-screen w-[45%] flex-col justify-between overflow-y-auto bg-gradient-to-br from-[#0B1020] via-[#0D1225] to-[#0F1529] p-8 lg:flex">
          <div className="space-y-6" style={{ animation: 'fadeInLeft 0.8s ease-out 0.2s both' }}>
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-purple-400/80">
              Welcome to
            </p>
            <div className="flex flex-col items-start">
              <NovaaLogo size={160} />
              <h1 className="mt-4 text-5xl font-black tracking-tight text-white">
                Novaa Drive
              </h1>
              <p className="mt-3 text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-cyan-400 to-blue-400">
                Secure. Smart. Seamless.
              </p>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-white/50">
              Store, manage and access your files securely from anywhere in the world with enterprise-grade cloud storage.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="mt-8" style={{ animation: 'fadeInUp 0.6s ease-out 0.4s both' }}>
            <FeatureCards />
          </div>

          {/* Stats */}
          <div className="mt-6">
            <StatsSection />
          </div>
        </div>

        {/* Right Panel - 55% Login */}
        <div className="flex min-h-screen w-full items-center justify-center p-4 lg:w-[55%] lg:p-8">
          <div
            className="w-full max-w-md space-y-6"
            style={{ animation: 'fadeInRight 0.8s ease-out 0.3s both' }}
          >
            {/* Logo for mobile */}
            <div className="flex flex-col items-center text-center lg:hidden">
              <NovaaLogo size={100} />
              <h2 className="mt-4 text-2xl font-black text-white">Novaa Drive</h2>
              <p className="mt-1 text-sm text-white/40">Secure. Smart. Seamless.</p>
            </div>

            {/* Header */}
            <div className="text-center lg:text-left">
              <h2 className="text-3xl font-black tracking-tight text-white">
                {mode === "register" ? "Create Account" : mode === "forgot" ? "Reset Password" : "Welcome Back"}
              </h2>
              <p className="mt-2 text-sm text-white/40">
                {mode === "register"
                  ? "Sign up to start using Novaa Drive"
                  : mode === "forgot"
                  ? "Enter your email to receive a reset link"
                  : "Sign in to continue to Novaa Drive"}
              </p>
            </div>

            {/* Messages */}
            {(error || success) && (
              <div
                className={`rounded-2xl border p-4 text-sm font-semibold backdrop-blur-xl ${
                  error
                    ? "border-red-500/20 bg-red-500/10 text-red-300"
                    : "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                }`}
                style={{ animation: 'fadeIn 0.3s ease-out' }}
              >
                <div className="flex items-center gap-2">
                  {error ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                  {error || success}
                </div>
              </div>
            )}

            {/* OTP Verification Modal */}
            {showOtp && (
              <div className="rounded-2xl border border-white/[0.08] bg-[var(--auth-bg,#0B1020)] p-6 backdrop-blur-xl">
                <div className="mb-4 text-center">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 shadow-lg">
                    <Shield className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Verify Your Email</h3>
                  <p className="mt-1 text-sm text-white/40">
                    Enter the 6-digit code sent to {email.replace(/^(.)(.*)(@.*)$/, (_, a, b, c) => a + '*'.repeat(Math.min(b.length, 4)) + c)}
                  </p>
                </div>
                <div className="flex justify-center gap-3">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <input
                      key={i}
                      type="text"
                      maxLength={1}
                      className="h-12 w-12 rounded-xl border border-white/[0.08] bg-white/[0.04] text-center text-lg font-bold text-white outline-none transition-all focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20"
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val.match(/[0-9]/)) {
                          const next = document.querySelector<HTMLInputElement>(`input[name=otp-${i + 1}]`);
                          if (next) next.focus();
                        }
                      }}
                      name={`otp-${i}`}
                    />
                  ))}
                </div>
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => setShowOtp(false)}
                    className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.04] py-3 text-sm font-semibold text-white/60 transition hover:bg-white/[0.08]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleOtpVerify}
                    disabled={loading}
                    className="flex-1 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500 py-3 text-sm font-bold text-white shadow-lg shadow-purple-500/20 transition-all hover:shadow-purple-500/40 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : 'Verify'}
                  </button>
                </div>
              </div>
            )}

            {/* Login / Register Form */}
            {!showOtp && (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Registration Fields */}
                {mode === "register" && (
                  <>
                    {/* Profile Picture Upload */}
                    <div className="flex justify-center">
                      <div className="group relative h-20 w-20 cursor-pointer overflow-hidden rounded-full border-2 border-dashed border-white/[0.15] transition-all hover:border-purple-500/50">
                        <div className="flex h-full w-full items-center justify-center bg-white/[0.03] transition-all group-hover:bg-white/[0.06]">
                          <Upload className="h-6 w-6 text-white/30 group-hover:text-white/50" />
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className={labelClass}>First Name</label>
                        <input
                          type="text"
                          placeholder="John"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Last Name</label>
                        <input
                          type="text"
                          placeholder="Doe"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>Username</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-white/30">
                          <User className="h-4 w-4" />
                        </span>
                        <input
                          type="text"
                          placeholder="johndoe"
                          value={username}
                          onChange={(e) => {
                            setUsername(e.target.value);
                            validateUsername(e.target.value);
                          }}
                          className={`${inputClass} pl-10`}
                        />
                        {usernameValid !== null && (
                          <span className="absolute inset-y-0 right-0 flex items-center pr-3">
                            {usernameValid ? (
                              <CheckCircle className="h-4 w-4 text-emerald-400" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-400" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>Email</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-white/30">
                          <Mail className="h-4 w-4" />
                        </span>
                        <input
                          type="email"
                          required
                          placeholder="john@example.com"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            validateEmail(e.target.value);
                          }}
                          className={`${inputClass} pl-10`}
                        />
                        {emailValid !== null && (
                          <span className="absolute inset-y-0 right-0 flex items-center pr-3">
                            {emailValid ? (
                              <CheckCircle className="h-4 w-4 text-emerald-400" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-400" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className={labelClass}>Phone</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-white/30">
                            <Phone className="h-4 w-4" />
                          </span>
                          <input
                            type="tel"
                            placeholder="+1 (555) 123-4567"
                            value={phone}
                            onChange={(e) => {
                              setPhone(e.target.value);
                              validatePhone(e.target.value);
                            }}
                            className={`${inputClass} pl-10`}
                          />
                          {phoneValid !== null && (
                            <span className="absolute inset-y-0 right-0 flex items-center pr-3">
                              {phoneValid ? (
                                <CheckCircle className="h-4 w-4 text-emerald-400" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-400" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>Date of Birth</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-white/30">
                            <Calendar className="h-4 w-4" />
                          </span>
                          <input
                            type="date"
                            value={dob}
                            onChange={(e) => setDob(e.target.value)}
                            className={`${inputClass} pl-10 [color-scheme:dark]`}
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Login Fields */}
                {mode !== "register" && (
                  <div>
                    <label className={labelClass}>Email or Username</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-white/30">
                        <Mail className="h-4 w-4" />
                      </span>
                      <input
                        type="text"
                        required
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`${inputClass} pl-10`}
                      />
                    </div>
                  </div>
                )}

                {/* Password Fields */}
                {mode !== "forgot" && (
                  <>
                    <div>
                      <label className={labelClass}>Password</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-white/30">
                          <KeyRound className="h-4 w-4" />
                        </span>
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            if (mode === "register") {
                              evaluatePasswordStrength(e.target.value);
                            }
                          }}
                          className={`${inputClass} pl-10 pr-10`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 flex items-center pr-3 text-white/30 transition hover:text-white/50"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>

                      {/* Password Strength */}
                      {mode === "register" && password.length > 0 && (
                        <div className="mt-2 space-y-2" style={{ animation: 'fadeIn 0.3s ease-out' }}>
                          <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: strength.width,
                                backgroundColor: strength.color,
                                boxShadow: `0 0 10px ${strength.color}40`
                              }}
                            />
                          </div>
                          <p className="text-[11px] font-medium" style={{ color: strength.color }}>
                            {strength.label}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Confirm Password for Registration */}
                    {mode === "register" && (
                      <div>
                        <label className={labelClass}>Confirm Password</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-white/30">
                            <KeyRound className="h-4 w-4" />
                          </span>
                          <input
                            type={showPassword ? "text" : "password"}
                            required
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => {
                              setConfirmPassword(e.target.value);
                              setPasswordsMatch(e.target.value === password);
                            }}
                            className={`${inputClass} pl-10 pr-10`}
                          />
                          {confirmPassword.length > 0 && (
                            <span className="absolute inset-y-0 right-0 flex items-center pr-3">
                              {passwordsMatch ? (
                                <CheckCircle className="h-4 w-4 text-emerald-400" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-400" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Remember Me & Forgot Password */}
                {mode === "login" && (
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="h-4 w-4 rounded border-white/[0.08] bg-white/[0.04] text-purple-500 focus:ring-purple-500/20"
                      />
                      <span className="text-xs text-white/50">Remember me</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setMode("forgot")}
                      className="text-xs font-semibold text-purple-400 transition hover:text-purple-300"
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}

                {/* Terms for Registration */}
                {mode === "register" && (
                  <label className="flex items-start gap-3 text-xs text-white/50">
                    <input
                      type="checkbox"
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-white/[0.08] bg-white/[0.04] text-purple-500 focus:ring-purple-500/20"
                    />
                    <span>
                      I agree to the{' '}
                      <span className="font-semibold text-purple-400 cursor-pointer hover:text-purple-300">Terms of Service</span>
                      {' '}and{' '}
                      <span className="font-semibold text-purple-400 cursor-pointer hover:text-purple-300">Privacy Policy</span>
                    </span>
                  </label>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || (mode === "register" && !acceptTerms)}
                  className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-purple-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {/* Ripple effect */}
                  <span className="absolute inset-0 bg-gradient-to-r from-purple-600 to-cyan-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    )}
                    {loading
                      ? "Processing..."
                      : mode === "register"
                      ? "Create Secure Account"
                      : mode === "forgot"
                      ? "Send Reset Link"
                      : "Sign In Securely"}
                  </span>
                </button>
              </form>
            )}

            {/* Divider */}
            {!showOtp && mode === "login" && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/[0.06]" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-[var(--auth-bg,#0B1020)] px-4 text-white/30">OR CONTINUE WITH</span>
                  </div>
                </div>

                {/* Social Login Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Google', icon: 'G', provider: 'google', gradient: 'from-red-500/10 to-orange-500/10' },
                    { label: 'GitHub', icon: <Github className="h-4 w-4" />, provider: 'github', gradient: 'from-gray-500/10 to-zinc-500/10' },
                    { label: 'Microsoft', icon: 'M', provider: 'microsoft', gradient: 'from-blue-500/10 to-indigo-500/10' },
                    { label: 'Apple', icon: <Apple className="h-4 w-4" />, provider: 'apple', gradient: 'from-gray-500/10 to-zinc-500/10' },
                  ].map((item) => (
                    <button
                      key={item.provider}
                      type="button"
                      onClick={() => handleProviderSignIn(item.provider)}
                      className="group flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] py-3 text-sm font-semibold text-white/60 backdrop-blur-xl transition-all duration-300 hover:border-white/[0.15] hover:bg-white/[0.06] hover:text-white hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <span className="flex h-5 w-5 items-center justify-center text-sm font-bold">
                        {item.icon}
                      </span>
                      {item.label}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Toggle Mode */}
            {!showOtp && (
              <div className="text-center">
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => navigate("/admin/login")}
                    className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/5 py-3 text-xs font-bold text-amber-300 transition hover:border-amber-400/50 hover:bg-amber-400/10"
                  >
                    <Shield className="h-4 w-4" /> Admin Login
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === "register" ? "login" : "register");
                    setError("");
                    setSuccess("");
                  }}
                  className="group text-sm text-white/40 transition-colors hover:text-white/60"
                >
                  {mode === "register" ? (
                    <>Already have an account? <span className="font-semibold text-purple-400 group-hover:text-purple-300">Sign in</span></>
                  ) : (
                    <>Don't have an account? <span className="font-semibold text-purple-400 group-hover:text-purple-300">Create one</span></>
                  )}
                </button>
              </div>
            )}

            {/* Footer */}
            <div className="text-center">
              <p className="text-xs text-white/25">
                Your data is protected with enterprise-grade security.
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        :root { --auth-bg: #0B1020; }
        @keyframes fadeInLeft {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeInRight {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes float-slow {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        @keyframes float-slower {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-40px, 40px) scale(1.2); }
          66% { transform: translate(30px, -30px) scale(0.8); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        .animate-float-slow { animation: float-slow 20s ease-in-out infinite; }
        .animate-float-slower { animation: float-slower 25s ease-in-out infinite; }
        .animate-pulse-slow { animation: pulse-slow 4s ease-in-out infinite; }
        .animate-pulse-glow { animation: pulse-glow 3s ease-in-out infinite; }
        
        /* Ripple Effect */
        .ripple {
          position: absolute;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.3);
          transform: scale(0);
          animation: ripple-anim 0.6s linear;
          pointer-events: none;
        }
        @keyframes ripple-anim {
          to { transform: scale(4); opacity: 0; }
        }

        /* Custom scrollbar */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(124,92,255,0.3); border-radius: 2px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(124,92,255,0.5); }

        /* Input autofill override */
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-text-fill-color: white;
          -webkit-box-shadow: 0 0 0px 1000px rgba(11, 16, 32, 0.95) inset;
          transition: background-color 5000s ease-in-out 0s;
        }

        /* Date input styling */
        input[type="date"]::-webkit-calendar-picker-indicator {
          filter: invert(1);
          opacity: 0.3;
          cursor: pointer;
        }
        input[type="date"]::-webkit-calendar-picker-indicator:hover {
          opacity: 0.5;
        }

        /* Shimmer loading */
        .shimmer {
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0.03) 0%,
            rgba(255, 255, 255, 0.06) 50%,
            rgba(255, 255, 255, 0.03) 100%
          );
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}