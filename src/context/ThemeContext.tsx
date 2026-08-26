import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface AccentColor {
  name: string;
  value: string;
  light: string;
  dark: string;
}

export const accentColors: AccentColor[] = [
  { name: "Amber", value: "#f59e0b", light: "bg-amber-500", dark: "bg-amber-600" },
  { name: "Blue", value: "#3b82f6", light: "bg-blue-500", dark: "bg-blue-600" },
  { name: "Purple", value: "#8b5cf6", light: "bg-purple-500", dark: "bg-purple-600" },
  { name: "Green", value: "#10b981", light: "bg-emerald-500", dark: "bg-emerald-600" },
  { name: "Rose", value: "#f43f5e", light: "bg-rose-500", dark: "bg-rose-600" },
  { name: "Cyan", value: "#06b6d4", light: "bg-cyan-500", dark: "bg-cyan-600" },
  { name: "Orange", value: "#f97316", light: "bg-orange-500", dark: "bg-orange-600" },
  { name: "Violet", value: "#7c3aed", light: "bg-violet-500", dark: "bg-violet-600" },
];

interface ThemeContextType {
  accentColor: AccentColor;
  setAccentColor: (color: AccentColor) => void;
  glassmorphism: boolean;
  setGlassmorphism: (v: boolean) => void;
  animationsEnabled: boolean;
  setAnimationsEnabled: (v: boolean) => void;
  dashboardLayout: "default" | "compact" | "spacious";
  setDashboardLayout: (v: "default" | "compact" | "spacious") => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [accentColor, setAccentColorState] = useState<AccentColor>(() => {
    try {
      const stored = localStorage.getItem("accent_color");
      if (stored) {
        const found = accentColors.find((c) => c.name === stored);
        if (found) return found;
      }
    } catch {}
    return accentColors[0];
  });

  const [glassmorphism, setGlassmorphism] = useState(() => {
    return localStorage.getItem("glassmorphism") !== "false";
  });

  const [animationsEnabled, setAnimationsEnabled] = useState(() => {
    return localStorage.getItem("animations_enabled") !== "false";
  });

  const [dashboardLayout, setDashboardLayout] = useState<"default" | "compact" | "spacious">(() => {
    const stored = localStorage.getItem("dashboard_layout");
    if (stored === "compact" || stored === "spacious") return stored;
    return "default";
  });

  const setAccentColor = useCallback((color: AccentColor) => {
    setAccentColorState(color);
    localStorage.setItem("accent_color", color.name);
    document.documentElement.style.setProperty("--accent-color", color.value);
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty("--accent-color", accentColor.value);
  }, [accentColor]);

  return (
    <ThemeContext.Provider
      value={{
        accentColor,
        setAccentColor,
        glassmorphism,
        setGlassmorphism: (v) => {
          setGlassmorphism(v);
          localStorage.setItem("glassmorphism", v ? "true" : "false");
        },
        animationsEnabled,
        setAnimationsEnabled: (v) => {
          setAnimationsEnabled(v);
          localStorage.setItem("animations_enabled", v ? "true" : "false");
        },
        dashboardLayout,
        setDashboardLayout: (v) => {
          setDashboardLayout(v);
          localStorage.setItem("dashboard_layout", v);
        },
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}