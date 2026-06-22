"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, Settings, Sun, Moon } from "lucide-react";
import { useThemeStore } from "@/stores/theme";

const NAV_ITEMS = [
  { href: "/", label: "面板", icon: LayoutDashboard },
  { href: "/diary", label: "日记", icon: BookOpen },
  { href: "/settings", label: "设置", icon: Settings },
];

export function Navbar() {
  const pathname = usePathname();
  const { theme, toggle } = useThemeStore();

  return (
    <nav className="h-12 bg-bg-surface border-b border-border-default flex items-center px-6 shrink-0">
      <Link href="/" className="text-base font-semibold text-text-primary mr-8">
        DevPulse
      </Link>

      <div className="flex items-center gap-1 flex-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-sm transition-colors duration-150
                ${
                  isActive
                    ? "text-accent bg-accent-subtle"
                    : "text-text-secondary hover:text-text-primary hover:bg-bg-hover"
                }
              `}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </div>

      <button
        onClick={toggle}
        className="p-1.5 rounded-sm text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors duration-150"
        title={theme === "dark" ? "切换白天模式" : "切换黑夜模式"}
      >
        {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
      </button>
    </nav>
  );
}
