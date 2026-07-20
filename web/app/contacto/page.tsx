import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Contacto',
  description:
    'Contáctanos para cotizaciones, pedidos especiales o cualquier duda. Estamos en WhatsApp, Telegram y por correo electrónico.',
}

const CANALES = [
  {
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    ),
    label: 'WhatsApp',
    value: '+52 442 131 4203',
    href: 'https://wa.me/524421314203?text=Hola%2C%20me%20interesa%20cotizar%20productos%20promocionales',
    color: 'bg-green-50 text-green-700 border-green-200',
    iconColor: 'text-green-600',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.16 14.05l-2.95-.924c-.64-.203-.657-.64.136-.952l11.527-4.448c.532-.194.998.13.821.495z" />
      </svg>
    ),
    label: 'Telegram',
    value: '@PromosolutionJulio',
    href: 'https://t.me/PromosolutionJulio',
    color: 'bg-sky-50 text-sky-700 border-sky-200',
    iconColor: 'text-sky-500',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    label: 'Correo electrónico',
    value: 'ventas@promosolution.com.mx',
    href: 'mailto:ventas@promosolution.com.mx',
    color: 'bg-navy-50 text-navy-700 border-navy-200',
    iconColor: 'text-navy-600',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
    label: 'Facebook',
    value: 'Promo Solution MX',
    href: 'https://www.facebook.com/profile.php?id=61585560026704',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    iconColor: 'text-blue-600',
  },
]

const PREGUNTAS = [
  {
    pregunta: '¿Cuál es el pedido mínimo?',
    respuesta:
      'El pedido mínimo varía por producto. Algunos artículos se pueden ordenar desde 1 pieza, mientras que otros tienen mínimos de 12, 25 o 50 piezas. Cada ficha de producto indica el mínimo correspondiente.',
  },
  {
    pregunta: '¿Incluye personalización (logo, serigrafía, bordado)?',
    respuesta:
      'El precio del catálogo es por el artículo en blanco. La decoración (serigrafía, grabado, sublimación, bordado, etc.) se cotiza por separado según la técnica y cantidad. Consúltanos para incluirlo en tu cotización.',
  },
  {
    pregunta: '¿Cuánto tiempo tarda un pedido personalizado?',
    respuesta:
      'El tiempo de producción y entrega depende del tipo de artículo y técnica de decorado. Los tiempos típicos van de 5 a 15 días hábiles. Para pedidos urgentes, consúltanos directamente.',
  },
  {
    pregunta: '¿Hacen envíos a toda la República?',
    respuesta:
      'Sí, realizamos envíos a todo México. El costo y tiempo de envío se cotiza según el destino y volumen del pedido. En pedidos mayores el envío puede ser sin costo.',
  },
  {
    pregunta: '¿Puedo solicitar muestras?',
    respuesta:
      'Sí, puedes solicitar muestras de los productos de tu interés. El costo de muestras se abona al pedido final. Contáctanos para coordinar el envío de muestras.',
  },
]

export default function ContactoPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">¿Cómo podemos ayudarte?</h1>
        <p className="text-gray-500 max-w-xl mx-auto">
          Nuestro equipo está listo para asesorarte en la selección de productos y preparar
          tu cotización sin compromiso.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-16">

        {/* Canales de contacto */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-5">Escríbenos directo</h2>
          <div className="space-y-3">
            {CANALES.map(canal => (
              <a
                key={canal.label}
                href={canal.href}
                target={canal.href.startsWith('http') ? '_blank' : undefined}
                rel={canal.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all
                             hover:shadow-sm hover:-translate-y-0.5 duration-150 ${canal.color}`}
              >
                <span className={canal.iconColor}>{canal.icon}</span>
                <div>
                  <p className="font-medium text-sm">{canal.label}</p>
                  <p className="text-sm opacity-80">{canal.value}</p>
                </div>
                <svg className="w-4 h-4 ml-auto opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            ))}
          </div>

          {/* CTA cotización */}
          <div className="mt-6 p-5 bg-navy-700 rounded-xl text-white">
            <p className="font-semibold mb-1">¿Ya sabes qué necesitas?</p>
            <p className="text-navy-200 text-sm mb-4">
              Agrega los productos a tu carrito y envía tu cotización en minutos.
            </p>
            <Link
              href="/catalogo"
              className="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-600
                         text-navy-900 font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Ir al catálogo
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Formulario de contacto */}
        <ContactForm />
      </div>

      {/* Preguntas frecuentes */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">Preguntas frecuentes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PREGUNTAS.map((item) => (
            <div key={item.pregunta} className="bg-gray-50 rounded-xl p-5">
              <h3 className="font-medium text-gray-900 text-sm mb-2">{item.pregunta}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{item.respuesta}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Formulario (client component embebido) ────────────────────────────────────
// Como la página es Server Component, movemos el form a su propio archivo.
// Aquí lo inlinamos como componente sin estado externo.

function ContactForm() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-5">Envíanos un mensaje</h2>
      {/* Formulario en client component separado */}
      <ContactFormClient />
    </div>
  )
}

// ── Importamos el client component ───────────────────────────────────────────
import { ContactFormClient } from './ContactFormClient'
