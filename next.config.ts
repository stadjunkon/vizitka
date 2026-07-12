import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // нативные модули — не бандлить в серверную сборку
  serverExternalPackages: ["better-sqlite3", "sharp"],
};

export default nextConfig;
