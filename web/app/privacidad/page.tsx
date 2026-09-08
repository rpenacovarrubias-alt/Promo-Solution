import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Aviso de Privacidad',
  description: 'Aviso de Privacidad de Promo Solution — tratamiento de datos personales conforme a la LFPDPPP.',
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold text-navy-700 mb-3">{title}</h2>
      <div className="space-y-3 text-sm text-gray-600 leading-relaxed">{children}</div>
    </section>
  )
}

export default function PrivacidadPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Aviso de Privacidad</h1>
      <p className="text-sm text-gray-400 mb-10">Última actualización: 8 de septiembre de 2026</p>

      <Section title="1. Responsable del tratamiento de datos">
        <p>
          <strong>Promo Solution</strong> (RFC PECJ680416PZ6), con domicilio en Av. de las Colonias 8,
          Edif. C Depto. 306, Col. Las Colonias, Ciudad López Mateos, Estado de México, C.P. 52953,
          México, es responsable del tratamiento de tus datos personales conforme a la Ley Federal de
          Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) y su Reglamento.
        </p>
        <p>
          Contacto: <a href="mailto:hola@promosolution.com.mx" className="text-navy-700 hover:underline">hola@promosolution.com.mx</a>
          {' '}· <a href="tel:+525537905754" className="text-navy-700 hover:underline">+52 55 3790 5754</a>
        </p>
      </Section>

      <Section title="2. Datos personales que recabamos">
        <p>Dependiendo de cómo interactúes con nosotros, podemos recabar:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Cuenta y catálogo:</strong> nombre, correo, teléfono, empresa y contraseña (almacenada cifrada) al crear una cuenta en el sitio.</li>
          <li><strong>Cotizaciones:</strong> nombre, teléfono, correo y empresa, más los productos que solicitas cotizar.</li>
          <li><strong>Formulario de contacto:</strong> nombre, correo, teléfono y el contenido de tu mensaje.</li>
          <li><strong>Conversaciones con Julio</strong> (nuestro asistente de ventas, disponible por Telegram, WhatsApp, Messenger e Instagram): tu identificador de la plataforma (número, usuario o ID de chat) y el historial de la conversación, para poder darle seguimiento a tu cotización.</li>
        </ul>
        <p>No recabamos datos financieros (no procesamos pagos ni tarjetas a través del sitio) ni datos personales sensibles.</p>
      </Section>

      <Section title="3. Finalidades del tratamiento">
        <p><strong>Finalidades primarias</strong> (necesarias para darte el servicio que solicitas):</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Generar y darte seguimiento a cotizaciones de productos promocionales.</li>
          <li>Crear y administrar tu cuenta de cliente, incluyendo precios personalizados.</li>
          <li>Responder tus mensajes de contacto o los que envíes a Julio por cualquier canal.</li>
          <li>Facturación y cumplimiento de obligaciones fiscales cuando aplique.</li>
        </ul>
        <p>No usamos tus datos con fines de mercadotecnia, publicidad o prospección salvo que tú lo solicites expresamente (por ejemplo, al pedir una cotización).</p>
      </Section>

      <Section title="4. Transferencias y encargados del tratamiento">
        <p>
          Para poder operar el sitio y a Julio, compartimos los datos estrictamente necesarios con los
          siguientes terceros, que actúan como encargados bajo nuestras instrucciones:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Anthropic</strong> (proveedor del modelo de IA que utiliza Julio) — procesa el texto de tu conversación para generar la respuesta.</li>
          <li><strong>Meta Platforms</strong> (Messenger, Instagram) y <strong>Telegram</strong> — como plataformas de mensajería a través de las cuales Julio se comunica contigo.</li>
          <li>Nuestro proveedor de hosting y correo electrónico, para el envío de cotizaciones y notificaciones.</li>
        </ul>
        <p>No vendemos ni rentamos tus datos personales a terceros.</p>
      </Section>

      <Section title="5. Cookies">
        <p>
          Usamos una sola cookie técnica (<code className="text-xs bg-gray-100 px-1 py-0.5 rounded">ps_session</code>)
          para mantener tu sesión iniciada cuando creas una cuenta. Es de tipo <em>httpOnly</em> — no la
          usamos para rastreo publicitario ni la compartimos con terceros.
        </p>
      </Section>

      <Section title="6. Derechos ARCO">
        <p>
          Tienes derecho a Acceder, Rectificar, Cancelar u Oponerte (derechos ARCO) al tratamiento de
          tus datos personales, así como a revocar tu consentimiento en cualquier momento. Para
          ejercerlos, escríbenos a{' '}
          <a href="mailto:hola@promosolution.com.mx" className="text-navy-700 hover:underline">hola@promosolution.com.mx</a>
          {' '}indicando tu nombre completo, el dato que quieres ejercer y una identificación que nos
          permita confirmar tu identidad. Te responderemos en un plazo máximo de 20 días hábiles,
          conforme lo establece la LFPDPPP.
        </p>
      </Section>

      <Section title="7. Menores de edad">
        <p>Nuestros servicios están dirigidos a personas mayores de edad y empresas. No recabamos deliberadamente datos de menores de edad.</p>
      </Section>

      <Section title="8. Cambios a este aviso">
        <p>
          Podemos actualizar este aviso de privacidad para reflejar cambios en nuestras prácticas o en
          la legislación aplicable. Publicaremos cualquier cambio en esta misma página, indicando la
          fecha de la última actualización.
        </p>
      </Section>
    </div>
  )
}
