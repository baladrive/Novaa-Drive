import React from 'react';
import { Shield, Fingerprint, Zap, Globe } from 'lucide-react';

const features = [
  {
    icon: Shield,
    title: 'End-to-End Encryption',
    description: 'Your files are always protected.',
    gradient: 'from-violet-500 to-purple-500',
    glow: 'rgba(124,92,255,0.15)',
  },
  {
    icon: Fingerprint,
    title: 'Biometric & 2FA Ready',
    description: 'Advanced account security.',
    gradient: 'from-cyan-500 to-blue-500',
    glow: 'rgba(76,201,240,0.15)',
  },
  {
    icon: Zap,
    title: 'Lightning Fast Sync',
    description: 'Real-time cloud synchronization.',
    gradient: 'from-emerald-500 to-teal-500',
    glow: 'rgba(0,212,132,0.15)',
  },
  {
    icon: Globe,
    title: 'Access Anywhere',
    description: 'Available on every device.',
    gradient: 'from-blue-500 to-indigo-500',
    glow: 'rgba(0,229,255,0.15)',
  },
];

export default function FeatureCards() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {features.map((feature, index) => {
        const Icon = feature.icon;
        return (
          <div
            key={index}
            className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 backdrop-blur-xl transition-all duration-500 hover:scale-[1.03] hover:border-white/[0.12]"
            style={{
              animation: `fadeInUp 0.6s ease-out ${0.3 + index * 0.1}s both`,
            }}
          >
            {/* Glow border */}
            <div
              className="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              style={{
                background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${feature.glow}, transparent 40%)`,
              }}
            />

            {/* Hover effect overlay */}
            <div
              className="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              style={{
                background: `linear-gradient(135deg, ${feature.glow.replace('0.15', '0.05')}, transparent)`,
              }}
            />

            <div className="relative z-10">
              <div
                className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} shadow-lg`}
              >
                <Icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="mb-1 text-sm font-bold text-white/90">
                {feature.title}
              </h3>
              <p className="text-xs leading-relaxed text-white/50">
                {feature.description}
              </p>
            </div>

            {/* Shimmer bottom border */}
            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          </div>
        );
      })}
    </div>
  );
}