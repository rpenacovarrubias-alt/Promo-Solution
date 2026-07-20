import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Nosotros',
  description:
    'Conoce a Promo Solution: tu aliado en productos promocionales, uniformes y artículos publicitarios para empresas en México.',
}

const VALORES = [
  {
    emoji: '🎯',
    titulo: 'Orientados a resultados',
    descripcion:
      'Cada producto que ofrecemos está pensado para maximizar el impacto de tu marca. Seleccionamos artículos que conectan con tu audiencia.',
  },
  {
    emoji: '🤝',
    titulo: 'Relaciones a largo plazo',
    descripcion:
      'No buscamos ventas únicas. Queremos ser el proveedor de confianza de tu empresa para todas sus necesidades promocionales.',
  },
  {
    emoji: '⚡',
    titulo: 'Respuesta rápida',
    descripcion:
      'Cotizaciones en minutos, no en días. Nuestro agente Julio está disponible 24/7 por WhatsApp y Telegram.',
  },
  {
    emoji: '✅',
    titulo: 'Calidad garantizada',
    descripcion:
      'Trabajamos solo con proveedores certificados. Cada producto pasa por un proceso de validación antes de llegar a tu empresa.',
  },
]

const PROVEEDORES = [
  { nombre: '4Promotional',  descripcion: 'Líder en accesorios tech y electrónica promocional' },
  { nombre: 'Promo Opción',  descripcion: 'Especialistas en artículos de oficina y ejecutivos' },
  { nombre: 'Innovation',    descripcion: 'Productos premium y línea de bebidas de alto impacto' },
  { nombre: 'Doble Vela',    descripcion: 'Textiles, uniformes y ropa promocional personalizada' },
]

const STATS = [
  { valor: '5,800+', label: 'Productos en catálogo' },
  { valor: '4',      label: 'Proveedores certificados' },
  { valor: '24/7',   label: 'Atención con IA' },
  { valor: '100%',   label: 'Personalizable' },
]

export default function NosotrosPage() {
  return (
    <div>

      {/* Hero */}
      <section className="bg-navy-700 text-white py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-gold-400 text-sm font-semibold uppercase tracking-wide mb-3">
              Sobre nosotros
            </p>
            <h1 className="text-4xl font-bold leading-tight mb-4">
              Tu marca en mano<br />
              <span className="text-gold-400">de todos</span>
            </h1>
            <p className="text-navy-200 text-lg leading-relaxed">
              Somos Promo Solution, una empresa mexicana especializada en productos
              promocionales, uniformes y artículos publicitarios. Ayudamos a las empresas
              a fortalecer su identidad de marca a través de productos de calidad.
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-gold-500 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map(stat => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-bold text-navy-900">{stat.valor}</p>
                <p className="text-navy-800 text-sm font-medium mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Misión */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">¿Qué hacemos?</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              En Promo Solution integramos el catálogo de los principales proveedores
              de productos promocionales de México en una sola plataforma. Esto nos permite
              ofrecer más de 5,800 productos con cotizaciones inmediatas y envíos a todo
              el país.
            </p>
            <p className="text-gray-600 leading-relaxed mb-6">
              Desde playeras y termos hasta artículos tecnológicos y de oficina,
              tenemos todo lo que tu empresa necesita para hacer crecer su presencia
              de marca — con o sin decorado personalizado.
            </p>
            <Link href="/catalogo" className="btn-primary inline-flex">
              Explorar catálogo
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {VALORES.map(v => (
              <div key={v.titulo}
                className="bg-gray-50 rounded-xl p-5 hover:shadow-sm transition-shadow">
                <span className="text-3xl">{v.emoji}</span>
                <h3 className="font-semibold text-gray-900 text-sm mt-3 mb-1">{v.titulo}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{v.descripcion}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Proveedores */}
      <section className="bg-gray-50 py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Nuestros proveedores</h2>
            <p className="text-gray-500">
              Trabajamos con los mejores fabricantes y distribuidores de México.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PROVEEDORES.map(p => (
              <div key={p.nombre}
                className="bg-white rounded-xl p-5 border border-gray-100 text-center hover:shadow-sm transition-shadow">
                <div className="w-12 h-12 bg-navy-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-navy-700 font-bold text-lg">
                    {p.nombre.charAt(0)}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 text-sm mb-1">{p.nombre}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{p.descripcion}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Agente Julio */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-navy-700 rounded-2xl p-8 md:p-12 text-white text-center">
          <p className="text-gold-400 text-sm font-semibold uppercase tracking-wide mb-3">
            Tecnología al servicio de tu empresa
          </p>
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Conoce a Julio, nuestro agente de ventas IA
          </h2>
          <p className="text-navy-200 max-w-xl mx-auto mb-8 leading-relaxed">
            Julio es nuestro asistente de ventas disponible 24/7 por WhatsApp y Telegram.
            Puede consultarte el catálogo, calcular precios, revisar disponibilidad y
            preparar tu cotización al instante — como si hablaras con un ejecutivo de ventas.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href="https://wa.me/524421314203?text=Hola%20Julio%2C%20quiero%20ver%20productos%20promocionales"
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600
                         text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Hablar con Julio
            </a>
            <Link href="/cotizar"
              className="inline-flex items-center gap-2 border border-white/30 hover:bg-white/10
                         text-white font-medium px-5 py-2.5 rounded-lg text-sm transition-colors">
              Cotizar en línea
            </Link>
          </div>
        </div>
      </section>

      {/* Contacto CTA */}
      <section className="border-t border-gray-100 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">¿Tienes preguntas?</h2>
          <p className="text-gray-500 mb-5">
            Estamos aquí para ayudarte a encontrar el producto ideal para tu empresa.
          </p>
          <Link href="/contacto" className="btn-primary inline-flex">
            Contáctanos
          </Link>
        </div>
      </section>
    </div>
  )
}
