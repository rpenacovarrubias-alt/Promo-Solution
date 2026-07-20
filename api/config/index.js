import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

const DEFAULTS = {
  // Existentes
  ivaPercent: '16',
  defaultMarkup: '30',
  companyName: 'Promo Solution',
  logoUrl: '',
  // Generales
  'notif.email': '',
  'notif.whatsapp': 'false',
  'logos.principal': '',
  'logos.secundario': '',
  'seo.title': 'Promo Solution — Productos Promocionales',
  'seo.description': '',
  'seo.keywords': '',
  'colors.primario': '#7c3aed',
  'colors.secundario': '#a78bfa',
  'colors.boton': '#7c3aed',
  'colors.texto': '#111827',
  'tipografia.fuente': 'Inter',
  'buscador.activo': 'true',
  'carrito.activo': 'true',
  // Productos
  'prod.mostrarStock': 'soloClientes',
  'prod.mostrarPrecios': 'soloClientes',
  'prod.enmascararProveedor': 'true',
  'prod.enmascararPropios': 'false',
  'prod.carrusel.estilo': 'Clasico',
  'prod.carrusel.movil': '1',
  'prod.carrusel.tablet': '2',
  'prod.carrusel.escritorio': '3',
  'prod.carrusel.flechas': 'false',
  'prod.vistaPrevia.estilo': 'Minimalista',
  'prod.vistaDetalle.nota': '*Los precios son de carácter informativo, por lo que están sujetos a cambios sin previo aviso y son más IVA.',
  'prod.coleccionDestacada.activo': 'false',
  // Cotizaciones
  'cot.invitado': 'false',
  'cot.tecnicaImpresion': 'true',
  'cot.pdf.info': '',
  // Cabecera
  'header.menu': '[]',
  'header.msgSuperior.visible': 'true',
  'header.msgSuperior.animacion': 'false',
  'header.msgSuperior.colorFondo': '#000000',
  'header.msgSuperior.colorTexto': '#ffffff',
  'header.msgSuperior.tamanoFuente': '14',
  'header.msgSuperior.altura': '40',
  'header.msgSuperior.texto': 'Tu Marca en mano de todos',
  'header.msgSuperior.espaciado': '50',
  'header.msgSuperior.velocidad': '50',
  'header.apariencia.colorFondo': '#ffffff',
  'header.apariencia.estilo': 'Sencillo',
  // Pie de página
  'footer.menu': '[]',
  'footer.colorFondo': '#000000',
  'footer.colorTexto': '#ffffff',
  'footer.estilo': 'Sencillo',
  'footer.poweredBy': 'true',
  'footer.informacion': '',
  'footer.redesSociales': '[]',
}

export default async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v))
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    if (req.method === 'GET') {
      const rows = await prisma.config.findMany()
      const config = { ...DEFAULTS }
      for (const row of rows) {
        config[row.key] = row.value
      }
      return res.status(200).json(config)
    }

    if (req.method === 'POST') {
      const entries = req.body
      if (!entries || typeof entries !== 'object') {
        return res.status(400).json({ error: 'Invalid body' })
      }
      await Promise.all(
        Object.entries(entries).map(([key, value]) =>
          value !== undefined
            ? prisma.config.upsert({
                where: { key },
                update: { value: String(value) },
                create: { key, value: String(value) },
              })
            : Promise.resolve(),
        ),
      )

      return res.status(200).json({ ok: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('[api/config]', error)
    return res.status(500).json({ error: 'Internal server error' })
  } finally {
    await prisma.$disconnect()
  }
}
