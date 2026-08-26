import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, Globe, Lock, HeadphonesIcon } from 'lucide-react';

const stats = [
  { icon: CheckCircle, value: 99.9, suffix: '%', label: 'Uptime', gradient: 'from-emerald-400 to-teal-400' },
  { icon: Globe, value: 180, prefix: '+', suffix: '', label: 'Global Access', gradient: 'from-blue-400 to-cyan-400' },
  { icon: Lock, value: 256, suffix: '-bit', label: 'Encryption', gradient: 'from-violet-400 to-purple-400' },
  { icon: HeadphonesIcon, value: 24, prefix: '', suffix: '/7', label: 'Support', gradient: 'from-cyan-400 to-blue-400' },
];

function AnimatedCounter({ target, prefix = '', suffix = '', duration = 2000 }: { target: number; prefix?: string; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const startTime = Date.now();
          const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(target * eased));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return (
    <span ref={ref} className="text-2xl font-black tracking-tight">
      {prefix}{count}{suffix}
    </span>
  );
}

export default function StatsSection() {
  return (
    <div
      className="grid grid-cols-4 gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-xl"
      style={{ animation: 'fadeInUp 0.6s ease-out 0.7s both' }}
    >
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div key={index} className="text-center">
            <div
              className={`mx-auto mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${stat.gradient} shadow-lg`}
            >
              <Icon className="h-4 w-4 text-white" />
            </div>
            <div className="bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent">
              <AnimatedCounter target={stat.value} prefix={stat.prefix || ''} suffix={stat.suffix} />
            </div>
            <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-white/40">
              {stat.label}
            </p>
          </div>
        );
      })}
    </div>
  );
}