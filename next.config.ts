import type { NextConfig } from "next";

const config: NextConfig = {
  // Keep unrelated lockfiles elsewhere on the host out of project discovery.
  turbopack: { root: process.cwd() },
  poweredByHeader: false,
};
export default config;
