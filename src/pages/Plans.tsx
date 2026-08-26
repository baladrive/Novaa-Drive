"use client";
import React, { useState, useEffect } from "react";
import { Check, Star } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { fileService } from "../services/fileService";

interface PlansProps {
  onRefreshStorage: () => void;
}

export default function Plans({ onRefreshStorage }: PlansProps) {
  const { user } = useAuth();
  const [currentLimit, setCurrentLimit] = useState(10 * 1024 * 1024 * 1024); // default 10GB

  useEffect(() => {
    if (user) {
      const localLimit = localStorage.getItem(`local_limit_${user.id}`);
      if (localLimit) {
        setCurrentLimit(Number(localLimit));
      }
    }
  }, [user]);

  const plans = [
    {
      name: "Free Plan",
      price: "$0",
      period: "forever",
      limit: 10 * 1024 * 1024 * 1024, // 10 GB
      features: [
        "10 GB Secure local storage",
        "Multi-format file support",
        "Custom folders hierarchy",
        "Public shared links",
        "Standard upload bandwidth"
      ],
      color: "border-zinc-150 bg-white/70 dark:border-zinc-900/50 dark:bg-zinc-950/60",
      buttonText: "Default Plan"
    },
    {
      name: "Basic Plan",
      price: "$1.99",
      period: "month",
      limit: 100 * 1024 * 1024 * 1024, // 100 GB
      features: [
        "100 GB storage upgrade",
        "Faster sync and upload priority",
        "Detailed activity logs",
        "Enhanced media viewing",
        "Custom folder colors and icons"
      ],
      color: "border-zinc-150 bg-white/70 dark:border-zinc-900/50 dark:bg-zinc-950/60",
      buttonText: "Upgrade to Basic"
    },
    {
      name: "Premium Plan",
      price: "$4.99",
      period: "month",
      limit: 200 * 1024 * 1024 * 1024, // 200 GB
      features: [
        "200 GB maximum storage capacity",
        "AI assistant, auto-tagging & smart search",
        "Secure file vault, version history & recovery",
        "Password-protected links and expiry dates",
        "Animated premium dashboard & custom themes"
      ],
      color: "border-amber-500 ring-2 ring-amber-500/20 bg-amber-500/5 dark:bg-amber-500/10",
      badge: "Most Popular",
      buttonText: "Choose Premium"
    }
  ];

  const premiumFeatureGroups = [
    {
      title: "🚀 AI Features",
      items: [
        "AI Chat Assistant",
        "AI File Summarizer",
        "AI Document Reader",
        "AI Image Recognition",
        "OCR for images and PDFs",
        "AI Auto Tagging",
        "Smart Folder Organization",
        "Duplicate Detection",
        "Similar Image Search",
        "Natural Language Search",
        "Voice Search"
      ]
    },
    {
      title: "📁 File Management",
      items: [
        "Folder Tree View",
        "Folder Color Customization",
        "Custom File Icons",
        "File Version History",
        "Restore Previous Versions",
        "File Lock",
        "Password Protected Files",
        "File Expiration",
        "Secure File Vault",
        "Hidden Files",
        "Archive Manager",
        "Bulk Rename",
        "Bulk Download",
        "Bulk Delete",
        "Bulk Move",
        "Drag and Drop Between Folders"
      ]
    },
    {
      title: "🎥 Media Features",
      items: [
        "Built-in Video Streaming",
        "Music Player with Playlists",
        "Background Audio Playback",
        "PDF Reader",
        "Office Document Viewer",
        "Image Editor",
        "Video Thumbnail Generator",
        "Audio Waveform Preview"
      ]
    },
    {
      title: "🔗 Sharing",
      items: [
        "Public Share Links",
        "Private Share Links",
        "Password Protected Share Links",
        "Link Expiry Date",
        "QR Code Sharing",
        "Email Sharing",
        "Permission Management",
        "Shared Folder Collaboration",
        "Comments on Files"
      ]
    },
    {
      title: "📊 Dashboard",
      items: [
        "Interactive Storage Charts",
        "Live Upload/Download Speed",
        "File Insights",
        "Usage Analytics",
        "Weekly Activity",
        "Storage Prediction",
        "Device Sync Status",
        "Backup Health",
        "Cloud Status",
        "Recent Notifications",
        "Calendar Widget",
        "Notes Widget",
        "To-Do Widget"
      ]
    },
    {
      title: "🎨 Premium UI",
      items: [
        "Animated Dashboard",
        "3D Glass Cards",
        "Animated Gradient Background",
        "Floating Particles",
        "Ripple Effects",
        "Premium Sidebar",
        "Dock Navigation",
        "Smooth Page Transitions",
        "Beautiful Empty States",
        "Loading Skeletons",
        "Custom Themes",
        "Accent Color Picker",
        "Layout Customizer",
        "Dynamic Wallpapers",
        "Animated Icons",
        "Optional Sound Effects"
      ]
    },
    {
      title: "🔒 Security",
      items: [
        "End-to-End Encryption",
        "Biometric Login Support",
        "Face ID / Fingerprint Ready",
        "Two-Factor Authentication",
        "Login Alerts",
        "Device Management",
        "Session History",
        "Security Dashboard",
        "File Activity Logs",
        "Recovery Codes"
      ]
    },
    {
      title: "⚡ Productivity",
      items: [
        "Keyboard Shortcuts",
        "Global Command Palette (Ctrl+K)",
        "Quick File Actions",
        "Recently Opened",
        "Continue Working",
        "Smart Recommendations",
        "Offline Mode",
        "Sync Manager",
        "Auto Backup",
        "Recycle Bin Recovery"
      ]
    },
    {
      title: "🌍 Premium",
      items: [
        "Multi-language Support",
        "Multi-user Accounts",
        "Team Workspace",
        "Admin Dashboard",
        "API Support",
        "Progressive Web App (PWA)",
        "Mobile Friendly",
        "Desktop App Ready",
        "High Performance",
        "Enterprise Grade Architecture"
      ]
    }
  ];

  const handleSelectPlan = async (limitValue: number, planName: string) => {
    if (!user) return;
    try {
      localStorage.setItem(`local_limit_${user.id}`, limitValue.toString());
      setCurrentLimit(limitValue);
      await fileService.addActivityLog(user.id, "upgrade_plan", `Upgraded storage plan to ${planName}`);
      onRefreshStorage();
      alert(`🎉 Storage quota has been successfully set to ${planName.split(" ")[0]}!`);
    } catch {
      alert("Failed to change storage plan");
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 space-y-6">
      
      {/* Title */}
      <div className="border-b border-zinc-150/50 pb-4 dark:border-zinc-900/40 text-center">
        <h1 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white">Upgrade Storage Quota</h1>
        <p className="text-xs text-zinc-555 dark:text-zinc-400 mt-1 max-w-md mx-auto">
          Need more space? Scale your personal browser database limits instantly to match your backup needs.
        </p>
      </div>

      {/* Grid of pricing cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 max-w-5xl mx-auto pt-6">
        {plans.map((plan) => {
          const isCurrent = currentLimit === plan.limit;
          return (
            <div
              key={plan.name}
              className={`relative flex flex-col justify-between rounded-3xl border p-6 backdrop-blur-md shadow-sm transition-all hover:scale-[1.02]
                ${plan.color}`}
            >
              {plan.badge && (
                <span className="absolute -top-3 right-6 rounded-full bg-amber-500 px-3 py-1 text-[9px] font-black uppercase tracking-wider text-slate-950 flex items-center gap-1">
                  <Star className="h-3 w-3 fill-current" />
                  {plan.badge}
                </span>
              )}

              {/* Plan Pricing header */}
              <div>
                <h3 className="text-xs font-black text-zinc-400 uppercase tracking-wider">{plan.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-zinc-900 dark:text-white">{plan.price}</span>
                  <span className="text-xs text-zinc-450 font-bold">/ {plan.period}</span>
                </div>

                <div className="h-px bg-zinc-100 dark:bg-zinc-900 my-5" />

                {/* Features list */}
                <ul className="space-y-3.5 text-xs text-zinc-700 dark:text-zinc-350">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 font-semibold">
                      <Check className="h-4.5 w-4.5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <button
                disabled={isCurrent}
                onClick={() => handleSelectPlan(plan.limit, plan.name)}
                className={`mt-8 w-full rounded-2xl py-3.5 text-xs font-black transition-all shadow-sm cursor-pointer
                  ${isCurrent
                    ? "bg-zinc-100 text-zinc-400 dark:bg-zinc-900 dark:text-zinc-650 cursor-default"
                    : plan.name === "Premium Plan"
                      ? "bg-amber-500 hover:bg-amber-600 text-slate-950 hover:shadow-md"
                      : "bg-zinc-50 border border-zinc-200 text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900/80"}`}
              >
                {isCurrent ? "Current Plan" : plan.buttonText}
              </button>

            </div>
          );
        })}
      </div>

      <div className="rounded-3xl border border-zinc-150/60 bg-white/80 dark:bg-zinc-950/60 dark:border-zinc-800 p-6 shadow-xl max-w-7xl mx-auto">
        <div className="mb-6 text-center">
          <p className="text-xs uppercase tracking-[0.24em] text-amber-500 font-black">Premium Experience</p>
          <h2 className="mt-4 text-xl md:text-3xl font-black text-zinc-950 dark:text-white">Everything your team needs for next-level storage and AI-driven productivity.</h2>
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400 max-w-3xl mx-auto">
            Unlock a world-class experience with AI automation, advanced file management, media tools, sharing controls, premium dashboard analytics, and enterprise-grade security.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {premiumFeatureGroups.map((group) => (
            <div key={group.title} className="rounded-3xl border border-zinc-100 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-950/80 p-5">
              <h3 className="text-sm font-black text-zinc-900 dark:text-white mb-4">{group.title}</h3>
              <ul className="grid gap-3 text-[11px] text-zinc-600 dark:text-zinc-300">
                {group.items.map((item, idx) => (
                  <li key={idx} className="flex gap-2 items-start">
                    <span className="mt-0.5 h-2.5 w-2.5 rounded-full bg-amber-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
