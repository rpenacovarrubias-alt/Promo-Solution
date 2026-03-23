/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'd23wkusc303ge3.cloudfront.net',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'mycavi.com',
        pathname: '/**',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_SITE_NAME: 'PROMO SOLUTIONS',
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://promosolution.com.mx',
    NEXT_PUBLIC_CDN_URL: 'https://d23wkusc303ge3.cloudfront.net/XP45Ewd4',
  },
}

module.exports = nextConfig
