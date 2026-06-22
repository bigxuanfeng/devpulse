import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { ThemeInit } from "@/components/layout/ThemeInit";

export const metadata: Metadata = {
  title: "DevPulse - 开发者效能面板",
  description: "AI 成本追踪 · 代码活动 · 工作日记 · 项目健康",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-bg-root text-text-primary">
        <ThemeInit />
        <Navbar />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
