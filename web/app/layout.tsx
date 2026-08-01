import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { WhatsAppButton } from '@/components/layout/WhatsAppButton'
import { CarritoProvider } from '@/components/quote/CarritoContext'
import { AuthProvider } from '@/components/auth/AuthContext'

const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] })

export const metadata: Metadata = {
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
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={plusJakartaSans.className}>
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
