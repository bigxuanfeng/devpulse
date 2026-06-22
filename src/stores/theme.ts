"use client";

import { create } from "zustand";
import { useEffect } from "react";

type Theme = "dark" | "light";

interface ThemeStore {
  theme: Theme;
  toggle: () => void;
  setTheme: (t: Theme) => void;
}

function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  const stored = localStorage.getItem("devpulse-theme");
  if (stored === "light" || stored === "dark") return stored;
  return "dark";
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

export const useThemeStore = create<ThemeStore>((set) => ({
  theme: "dark",

  toggle: () =>
    set((state) => {
      const next = state.theme === "dark" ? "light" : "dark";
      localStorage.setItem("devpulse-theme", next);
      applyTheme(next);
      return { theme: next };
    }),

  setTheme: (t) => {
    localStorage.setItem("devpulse-theme", t);
    applyTheme(t);
    set({ theme: t });
  },
}));

export function useInitTheme() {
  useEffect(() => {
    const stored = getStoredTheme();
    useThemeStore.getState().setTheme(stored);
  }, []);
}
