import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 — нативный модуль, не бандлить его в серверную сборку
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
