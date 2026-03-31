import { getProducts } from '@/lib/api'
import { ProductoCard } from '@/components/product/ProductoCard'
import Link from 'next/link'

const CATEGORIAS_HERO = [
  { nombre: 'Bebidas',    emoji: '🫗' },
  { nombre: 'Tecnología', emoji: '💻' },
  { nombre: 'Uniformes',  emoji: '👕' },
  { nombre: 'Ecológicos', emoji: '🌿' },
  { nombre: 'Libretas',   emoji: '📒' },
  { nombre: 'Llaveros',   emoji: '🔑' },
  { nombre: 'Deportes',   emoji: '⚽' },
  { nombre: 'Oficina',    emoji: '🖊️' },
]

export default async function HomePage() {
  const [destacadosRes, recientesRes] = await Promise.all([
    getProducts({ featured: true,  limit: 8 }),
    getProducts({ limit: 8 }),
  ])

  const destacados = destacadosRes.data
  const recientes  = recientesRes.data

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy-700 to-navy-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <div className="max-w-2xl">
            <p className="text-gold-400 font-semibold text-sm tracking-wide uppercase mb-3">
              Más de 5,800 productos
            </p>
            <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-4">
              Tu marca en mano<br/>
              <span className="text-gold-400">de todos</span>
            </h1>
            <p className="text-navy-200 text-lg mb-8">
              Productos promocionales, uniformes y artículos publicitarios.
              Cotización sin compromiso en minutos.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/catalogo" className="btn-gold text-base px-6 py-3">
                Ver catálogo completo
              </Link>
              <Link href="/cotizar"
                className="border border-white/30 hover:bg-white/10 text-white
                           font-medium px-6 py-3 rounded-lg transition-colors text-base">
                Mi cotización
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categorías rápidas */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
          {CATEGORIAS_HERO.map(cat => (
            <Link key={cat.nombre}
              href={`/catalogo?q=${encodeURIComponent(cat.nombre)}`}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-gray-100
                         hover:border-navy-200 hover:bg-navy-50 transition-all text-center group">
              <span className="text-2xl">{cat.emoji}</span>
              <span className="text-xs font-medium text-gray-700 group-hover:text-navy-700">
                {cat.nombre}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Productos destacados */}
      {destacados.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-end justify-between mb-5">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Lo más popular</h2>
              <p className="text-sm text-gray-500 mt-0.5">Los favoritos de nuestros clientes</p>
            </div>
            <Link href="/catalogo?featured=true"
              className="text-sm text-navy-700 font-medium hover:text-navy-800">
              Ver todos →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {destacados.map(p => <ProductoCard key={p.id} producto={p} />)}
          </div>
        </section>
      )}

      {/* Banner CTA */}
      <section className="bg-gold-50 border-y border-gold-100 py-10 my-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-navy-700 mb-2">
            ¿Necesitas una cotización?
          </h2>
          <p className="text-gray-600 mb-5">
            Agrega productos a tu carrito y recibe una cotización detallada al instante.
            También puedes escribirnos por WhatsApp o Telegram.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/catalogo" className="btn-primary">
              Explorar catálogo
            </Link>
            <Link href="/cotizar" className="btn-outline">
              Ver mi cotización
            </Link>
          </div>
        </div>
      </section>

      {/* Recién agregados */}
      {recientes.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-end justify-between mb-5">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Recién agregados</h2>
              <p className="text-sm text-gray-500 mt-0.5">Los últimos productos disponibles</p>
            </div>
            <Link href="/catalogo" className="text-sm text-navy-700 font-medium hover:text-navy-800">
              Ver todos →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {recientes.map(p => <ProductoCard key={p.id} producto={p} />)}
          </div>
        </section>
      )}

      {/* Proveedores */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <p className="text-center text-sm text-gray-400 mb-6">
          Trabajamos con proveedores líderes en México
        </p>
        <div className="flex flex-wrap justify-center items-center gap-6">
          {['4 For Promotional', 'Promo Opción', 'Innovation', 'Doble Vela', 'PROMO SOLUTION'].map(p => (
            <span key={p}
              className="text-sm font-medium text-gray-400 border border-gray-100
                         px-4 py-2 rounded-full">
              {p}
            </span>
          ))}
        </div>
      </section>
    </>
  )
}
