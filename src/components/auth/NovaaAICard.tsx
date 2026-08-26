import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles, Shield, Search, Tag, Copy, Scan, Eye, AlertTriangle,
  FileText, Brain, Cpu, Activity, CheckCircle, Zap, Server,
  Cloud, Lock, Database, TrendingUp
} from 'lucide-react';

interface AICardProps {
  fileCount: number;
  loading?: boolean;
}

export default function NovaaAICard({ fileCount, loading }: AICardProps) {
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [counts, setCounts] = useState({
    filesIndexed: 0,
    accuracy: 0,
    storageOptimized: 0,
    threatsBlocked: 0,
    uptime: 0,
  });
  const cardRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  // Mouse parallax
  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        setMousePos({ x, y });
      }
    };
    window.addEventListener('mousemove', handleMouse);
    return () => window.removeEventListener('mousemove', handleMouse);
  }, []);

  // Animated counters
  useEffect(() => {
    const targets = {
      filesIndexed: fileCount || 2847,
      accuracy: 99,
      storageOptimized: 87,
      threatsBlocked: 1432,
      uptime: 99.9,
    };

    const duration = 2500;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setCounts({
        filesIndexed: Math.floor(targets.filesIndexed * eased),
        accuracy: Math.floor(targets.accuracy * eased),
        storageOptimized: Math.floor(targets.storageOptimized * eased),
        threatsBlocked: Math.floor(targets.threatsBlocked * eased),
        uptime: parseFloat((targets.uptime * eased).toFixed(1)),
      });

      if (progress < 1) requestAnimationFrame(animate);
    };

    if (!hasAnimated.current) {
      hasAnimated.current = true;
      requestAnimationFrame(animate);
    }
  }, [fileCount]);

  const features = [
    { label: 'AI Auto Organization', icon: Brain, active: true },
    { label: 'Smart Search', icon: Search, active: true },
    { label: 'AI Auto Tagging', icon: Tag, active: true },
    { label: 'Duplicate Detection', icon: Copy, active: true },
    { label: 'OCR Text Scanner', icon: Scan, active: true },
    { label: 'Face Recognition', icon: Eye, active: true },
    { label: 'Malware Scanner', icon: Shield, active: true },
    { label: 'File Classification', icon: FileText, active: true },
  ];

  const stats = [
    { label: 'Files Indexed', value: counts.filesIndexed.toLocaleString(), icon: Database, color: 'from-purple-400 to-cyan-400' },
    { label: 'AI Status', value: 'Online', icon: Activity, color: 'from-emerald-400 to-teal-400', pulse: true },
    { label: 'Search Accuracy', value: `${counts.accuracy}%`, icon: TrendingUp, color: 'from-cyan-400 to-blue-400' },
    { label: 'Storage Optimized', value: `${counts.storageOptimized}%`, icon: Cpu, color: 'from-blue-400 to-purple-400' },
    { label: 'Threats Blocked', value: counts.threatsBlocked.toLocaleString(), icon: Shield, color: 'from-rose-400 to-red-400' },
    { label: 'Active Model', value: 'Novaa NX-2.0', icon: Brain, color: 'from-violet-400 to-purple-400' },
    { label: 'Cloud Health', value: 'Optimal', icon: Cloud, color: 'from-cyan-400 to-emerald-400' },
    { label: 'System Uptime', value: `${counts.uptime}%`, icon: Server, color: 'from-emerald-400 to-cyan-400' },
  ];

  return (
    <div
      ref={cardRef}
      className="group relative overflow-hidden rounded-3xl border border-white/[0.06] bg-gradient-to-br from-[#0B1020] via-[#0D1225] to-[#0F1529] p-8 md:p-10 backdrop-blur-xl transition-all duration-700 hover:border-purple-500/20 hover:shadow-2xl hover:shadow-purple-500/10"
      style={{
        transform: `perspective(1000px) rotateX(${(mousePos.y - 0.5) * -4}deg) rotateY(${(mousePos.x - 0.5) * 4}deg)`,
        transition: 'transform 0.2s ease-out',
      }}
    >
      {/* Animated Gradient Border */}
      <div className="pointer-events-none absolute -inset-[1px] rounded-3xl opacity-0 transition-opacity duration-700 group-hover:opacity-100">
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-500 via-cyan-500 to-purple-500 animate-gradient-shift" style={{ mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', maskComposite: 'exclude', padding: '1px' }} />
      </div>

      {/* Background Glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-600/10 blur-[120px] animate-pulse-slow" />
        <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-cyan-600/5 blur-[100px] animate-float-slow" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-blue-600/5 blur-[100px] animate-float-slower" />
      </div>

      <div className="relative z-10">
        {/* Top Section: Logo + Status + Title */}
        <div className="flex flex-col items-center gap-6 text-center md:flex-row md:items-start md:text-left md:gap-10">
          {/* AI Core Animation */}
          <div className="relative flex h-40 w-40 flex-shrink-0 items-center justify-center md:h-48 md:w-48">
            {/* Outer orbit ring */}
            <div className="absolute inset-0 animate-orbit-slow">
              <div className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 rounded-full bg-purple-400 shadow-[0_0_15px_rgba(124,92,255,0.8)]" />
              <div className="absolute bottom-0 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(76,201,240,0.6)]" />
              <div className="h-full w-full rounded-full border border-purple-500/20" />
            </div>

            {/* Middle orbit ring */}
            <div className="absolute inset-4 animate-orbit-reverse-slow">
              <div className="absolute right-0 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(0,229,255,0.6)]" />
              <div className="absolute left-0 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-violet-400 shadow-[0_0_12px_rgba(124,92,255,0.7)]" />
              <div className="h-full w-full rounded-full border border-cyan-500/15" />
            </div>

            {/* Inner glow ring */}
            <div className="absolute inset-8 animate-pulse-slow">
              <div className="h-full w-full rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20 blur-sm" />
            </div>

            {/* Core */}
            <div className="relative flex h-16 w-16 items-center justify-center md:h-20 md:w-20">
              <div className="absolute inset-0 animate-pulse-glow rounded-full bg-gradient-to-br from-purple-500 via-cyan-500 to-blue-500 blur-xl opacity-60" />
              <div className="relative flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-purple-500 via-cyan-500 to-blue-500 shadow-[0_0_40px_rgba(124,92,255,0.5)]">
                <Brain className="h-8 w-8 text-white md:h-10 md:w-10 animate-pulse" />
                {/* Scanning line */}
                <div className="absolute inset-0 overflow-hidden rounded-full">
                  <div className="animate-scan-line h-1 w-full bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                </div>
              </div>
            </div>

            {/* Floating particles */}
            <div className="absolute inset-0">
              {[
                { x: '20%', y: '15%', size: 2, color: '#7C5CFF', delay: '0s' },
                { x: '75%', y: '20%', size: 1.5, color: '#4CC9F0', delay: '0.5s' },
                { x: '15%', y: '70%', size: 2.5, color: '#00E5FF', delay: '1s' },
                { x: '80%', y: '75%', size: 1.8, color: '#7C5CFF', delay: '1.5s' },
                { x: '50%', y: '10%', size: 1.2, color: '#4CC9F0', delay: '0.3s' },
                { x: '60%', y: '85%', size: 2, color: '#00E5FF', delay: '0.8s' },
              ].map((p, i) => (
                <div
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    left: p.x, top: p.y,
                    width: p.size, height: p.size,
                    backgroundColor: p.color,
                    boxShadow: `0 0 6px ${p.color}`,
                    animation: `float-particle ${2 + Math.random()}s ease-in-out ${p.delay} infinite`,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Title Content */}
          <div className="flex-1">
            {/* Status Badge */}
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5">
              <div className="relative flex h-2.5 w-2.5 items-center justify-center">
                <div className="absolute inset-0 animate-ping rounded-full bg-emerald-400/40" />
                <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(0,212,132,0.6)]" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300">
                Novaa Drive AI
              </span>
              <span className="text-[9px] font-semibold text-emerald-400/60">ENGINE ACTIVE</span>
            </div>

            <h2 className="text-2xl font-black tracking-tight text-white md:text-3xl">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-cyan-400 to-blue-400">
                Novaa Drive
              </span>{' '}
              <span className="text-white">Intelligence</span>
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/50">
              Every file you upload is instantly analyzed, organized, protected, and optimized by the Novaa AI Engine—
              making your cloud storage faster, smarter, and more secure.
            </p>
          </div>
        </div>

        {/* Feature Chips */}
        <div className="mt-8 flex flex-wrap justify-center gap-2 md:justify-start" style={{ animation: 'fadeInUp 0.6s ease-out 0.3s both' }}>
          {features.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.label}
                className="group/chip inline-flex items-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-[10px] font-semibold text-white/50 backdrop-blur-xl transition-all duration-300 hover:border-purple-500/30 hover:bg-purple-500/10 hover:text-purple-300 hover:scale-[1.05]"
                style={{ animation: `fadeInUp 0.4s ease-out ${0.4 + i * 0.05}s both` }}
              >
                <Icon className="h-3 w-3 text-emerald-400" />
                {feat.label}
              </div>
            );
          })}
        </div>

        {/* Stats Grid */}
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4" style={{ animation: 'fadeInUp 0.6s ease-out 0.5s both' }}>
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="group/stat relative overflow-hidden rounded-2xl border border-white/[0.04] bg-white/[0.02] p-3 backdrop-blur-xl transition-all duration-500 hover:border-white/[0.1] hover:bg-white/[0.04] hover:scale-[1.02]"
                style={{ animation: `fadeInUp 0.4s ease-out ${0.6 + i * 0.05}s both` }}
              >
                <div className="flex items-start justify-between mb-1.5">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br ${stat.color} bg-opacity-20`}>
                    <Icon className="h-3.5 w-3.5 text-white" />
                  </div>
                  {stat.pulse && (
                    <div className="relative flex h-2 w-2 items-center justify-center">
                      <div className="absolute inset-0 animate-ping rounded-full bg-emerald-400/40" />
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    </div>
                  )}
                </div>
                <p className="text-xs font-bold text-white">{stat.value}</p>
                <p className="text-[9px] font-medium text-white/30 mt-0.5">{stat.label}</p>
                <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 transition-opacity duration-500 group-hover/stat:opacity-100" />
              </div>
            );
          })}
        </div>

        {/* Bottom Status Bar */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 border-t border-white/[0.04] pt-4 text-[10px] font-medium text-white/20 md:justify-start">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Neural Engine: Active
          </span>
          <span>•</span>
          <span>Vector Index: {counts.filesIndexed.toLocaleString()} embeddings</span>
          <span>•</span>
          <span>Model: Novaa NX-2.0</span>
          <span>•</span>
          <span>Inference: <span className="text-emerald-400/60">Real-time</span></span>
        </div>
      </div>

      <style>{`
        @keyframes float-particle {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.6; }
          50% { transform: translate(5px, -10px) scale(1.2); opacity: 1; }
        }
        @keyframes orbit-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes orbit-reverse-slow {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.1); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
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
        @keyframes scan-line {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(400%); }
        }
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-orbit-slow { animation: orbit-slow 12s linear infinite; }
        .animate-orbit-reverse-slow { animation: orbit-reverse-slow 15s linear infinite; }
        .animate-pulse-glow { animation: pulse-glow 3s ease-in-out infinite; }
        .animate-pulse-slow { animation: pulse-slow 4s ease-in-out infinite; }
        .animate-float-slow { animation: float-slow 20s ease-in-out infinite; }
        .animate-float-slower { animation: float-slower 25s ease-in-out infinite; }
        .animate-scan-line { animation: scan-line 2s linear infinite; }
        .animate-gradient-shift { background-size: 200% 200%; animation: gradient-shift 4s linear infinite; }
      `}</style>
    </div>
  );
}