/** @type {import('next').NextConfig} */
const nextConfig = {
  // Necesario para el Dockerfile multi-stage (copia .next/standalone)
  output: 'standalone',

  images: {
    // Sin esto, Next pasa cada <Image> por el proxy pagado /_next/image de Vercel,
    // que se agota mes a mes y devuelve 402 en produccion (ver commits e101c9f, 008f3fd).
    unoptimized: true,
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
      // Doble Vela (imágenes servidas directo desde su dominio)
      {
        protocol: 'https',
        hostname: 'doblevela.com',
        pathname: '/**',
      },
      // Innovation (bucket S3 del proveedor)
      {
        protocol: 'https',
        hostname: 'multimedias3-cloudsync-synology.s3.us-west-2.amazonaws.com',
        pathname: '/**',
      },
      // Solo para los productos TEST — quitar cuando el catálogo real esté conectado
      {
        protocol: 'https',
        hostname: 'placehold.co',
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
