import type { NextConfig } from "next";
import removeImports from 'next-remove-imports';

const nextConfig = removeImports()({
  /* config options here */
});

export default nextConfig;
