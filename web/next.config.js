/** @type {import('next').NextConfig} */
const nextConfig = {
  // Necesario para el Dockerfile multi-stage (copia .next/standalone)
  output: 'standalone',

  images: {
    remotePatterns: [
      // CDN CloudFront (legado)
      {
        protocol: 'https',
        hostname: 'd23wkusc303ge3.cloudfront.net',
        pathname: '/**',
      },
      // MinIO PromoSolution en EasyPanel (puerto 9004)
      {
        protocol: 'http',
        hostname: '82.180.173.228',
        port: '9004',
        pathname: '/**',
      },
      // Subdominio MinIO en EasyPanel
      {
        protocol: 'https',
        hostname: '*.easypanel.host',
        pathname: '/**',
      },
      // Dominio propio (imágenes subidas por el admin)
      {
        protocol: 'https',
        hostname: 'promosolution.com.mx',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'admin.promosolution.com.mx',
        pathname: '/**',
      },
    ],
  },

  env: {
    NEXT_PUBLIC_SITE_NAME: 'PROMO SOLUTIONS',
    NEXT_PUBLIC_SITE_URL:  process.env.NEXT_PUBLIC_SITE_URL || 'https://promosolution.com.mx',
  },
}

module.exports = nextConfig
