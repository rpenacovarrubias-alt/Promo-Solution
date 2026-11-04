import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { WhatsAppButton } from '@/components/layout/WhatsAppButton'
import { CarritoProvider } from '@/components/quote/CarritoContext'
import { AuthProvider } from '@/components/auth/AuthContext'
import { SITE_URL } from '@/lib/site'

const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] })

const JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#org`,
      name: 'PROMO SOLUTIONS',
      url: SITE_URL,
      logo: `${SITE_URL}/logo.png`,
      sameAs: ['https://www.instagram.com/promosolution_mx/'],
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#web`,
      url: SITE_URL,
      name: 'PROMO SOLUTIONS',
      inLanguage: 'es-MX',
      publisher: { '@id': `${SITE_URL}/#org` },
      potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE_URL}/catalogo?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
  ],
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'PROMO SOLUTIONS — Productos Promocionales y Uniformes',
    template: '%s | PROMO SOLUTIONS',
  },
  description: 'Catálogo de productos promocionales, uniformes y artículos de regalo corporativo. Más de 5,800 productos con precios de mayoreo.',
  keywords: ['productos promocionales', 'uniformes', 'artículos publicitarios', 'México', 'regalo corporativo'],
  openGraph: {
    siteName: 'PROMO SOLUTIONS',
    locale: 'es_MX',
    type: 'website',
    images: [{ url: '/hero.jpg' }],
  },
  twitter: { card: 'summary_large_image' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={plusJakartaSans.className}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
        <AuthProvider>
          <CarritoProvider>
            <Header />
            <main className="min-h-[calc(100vh-140px)]">{children}</main>
            <Footer />
            <WhatsAppButton />
          </CarritoProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
