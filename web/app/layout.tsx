import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { CarritoProvider } from '@/components/quote/CarritoContext'

const inter = Inter({ subsets: ['latin'] })

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
      <body className={inter.className}>
        <CarritoProvider>
          <Header />
          <main className="min-h-[calc(100vh-140px)]">{children}</main>
          <Footer />
        </CarritoProvider>
      </body>
    </html>
  )
}
