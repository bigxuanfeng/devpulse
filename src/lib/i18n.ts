"use client";

import zhCN from "@/locales/zh-CN.json";

type LocaleData = typeof zhCN;

export function useTranslation() {
  // Future: load locale based on user preference
  const locale: LocaleData = zhCN;

  function t(key: keyof LocaleData): string {
    return (locale as Record<string, string>)[key] ?? key;
  }

  return { t };
}
