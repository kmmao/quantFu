import type { NextConfig } from "next";

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',  // 开发环境禁用
})

const nextConfig: NextConfig = {
  /* config options here */
};

export default withPWA(nextConfig);
