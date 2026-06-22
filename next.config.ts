import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // 告诉 Turbopack 项目根目录，避免监视上级目录的文件变化
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
