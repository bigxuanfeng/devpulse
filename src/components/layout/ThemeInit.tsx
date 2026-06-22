"use client";

import { useInitTheme } from "@/stores/theme";

export function ThemeInit() {
  useInitTheme();
  return null;
}
