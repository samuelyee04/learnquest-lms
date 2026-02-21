// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['pg', '@prisma/client', '@prisma/adapter-pg'],

  typescript: {
    ignoreBuildErrors: false,  // ← set to true for now
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.cloudinary.com' },
      { protocol: 'https', hostname: '**.youtube.com' },
    ],
  },
}

export default nextConfig