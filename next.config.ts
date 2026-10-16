import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 静的書き出し。Supabase へはブラウザから直接アクセスするのでサーバーは不要
  output: "export",
  images: { unoptimized: true },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
