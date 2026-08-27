// Lógica de creación de cotizaciones — única fuente de verdad para cotizaciones
// autogeneradas (cliente vía sitio público o vía Julio en WhatsApp/Telegram/chat).
// Usada por routes/public/quotes.js (HTTP) y por lib/julio/tools.js (tool-calling de Julio).
// El folio y el % de utilidad usan las mismas reglas que el resto del sistema
// (ver lib/folio.js y Client.markupPercent) para que no haya dos criterios distintos.

import prisma from '../routes/_db.js'
import { folio } from './folio.js'

const IVA_RATE = 0.16

export class QuoteValidationError extends Error {
  constructor(message) {
    super(message)
    this.name = 'QuoteValidationError'
  }
}

export async function createQuote({ customer, channel, items, notes } = {}) {
  if (!customer?.name || !customer?.phone)
    throw new QuoteValidationError('customer.name y customer.phone son requeridos')
  if (!channel || !['TELEGRAM', 'WHATSAPP', 'CHAT', 'EMAIL'].includes(channel))
    throw new QuoteValidationError('channel debe ser TELEGRAM, WHATSAPP, CHAT o EMAIL')
  if (!Array.isArray(items) || items.length === 0)
    throw new QuoteValidationError('Se requiere al menos un item')
  for (const item of items) {
    if (!item.productId) throw new QuoteValidationError('Cada item debe tener productId')
    if (!item.quantity || item.quantity < 1) throw new QuoteValidationError('quantity >= 1 requerido')
  }

  // Upsert cliente por teléfono
  let client = await prisma.client.findFirst({ where: { phone: customer.phone } })
  if (!client && customer.email) client = await prisma.client.findUnique({ where: { email: customer.email } })
  if (!client) {
    const emailFallback = customer.email || `bot_${customer.phone}@promosolution.mx`
    try {
      // markupPercent no se especifica aquí a propósito: toma el default del
      // schema (33%) — el mismo % de aumento de bienvenida para cualquier
      // cliente nuevo, sea cual sea el canal por el que llegó.
      client = await prisma.client.create({
        data: { name: customer.name.trim(), email: emailFallback, phone: customer.phone, company: customer.company?.trim() ?? null },
      })
    } catch (e) {
      if (e.code === 'P2002') client = await prisma.client.findUnique({ where: { email: customer.email || `bot_${customer.phone}@promosolution.mx` } })
      else throw e
    }
  }

  // Resolver productos — el precio siempre sale de basePrice + Client.markupPercent.
  // La categoría del producto (Category.utilityPercent) ya NO participa en el
  // cálculo: el % que manda es el del cliente, personalizado por Admin en
  // Clientes → "% de Desc.".
  const clientMarkup = parseFloat(client.markupPercent)

  const productIds = [...new Set(items.map(i => i.productId))]
  const products   = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
  })
  const productMap = Object.fromEntries(products.map(p => [p.id, p]))
  const missing = productIds.filter(id => !productMap[id])
  if (missing.length > 0) throw new QuoteValidationError(`Productos no encontrados: ${missing.join(', ')}`)

  // Resolver técnicas de impresión (Service) — opcional, un servicio por item.
  // El costo se congela en printUnitCost al momento de cotizar.
  const serviceIds = [...new Set(items.filter(i => i.serviceId).map(i => i.serviceId))]
  const serviceMap = serviceIds.length
    ? Object.fromEntries(
        (await prisma.service.findMany({ where: { id: { in: serviceIds }, isActive: true } }))
          .map(s => [s.id, s]),
      )
    : {}
  const missingServices = serviceIds.filter(id => !serviceMap[id])
  if (missingServices.length > 0) throw new QuoteValidationError(`Técnicas de impresión no encontradas: ${missingServices.join(', ')}`)

  const resolvedItems = items.map(item => {
    const product        = productMap[item.productId]
    const service        = item.serviceId ? serviceMap[item.serviceId] : null
    const basePrice      = parseFloat(product.basePrice)
    const finalUnitPrice = parseFloat((basePrice * (1 + clientMarkup / 100)).toFixed(2))
    const printUnitCost  = service ? parseFloat(parseFloat(service.unitPrice).toFixed(2)) : 0
    const subtotal       = parseFloat(((finalUnitPrice + printUnitCost) * item.quantity).toFixed(2))
    return {
      productId: item.productId,
      serviceId: service?.id ?? null,
      quantity: item.quantity,
      unitPrice: finalUnitPrice,
      markup: clientMarkup,
      printTechnique: service?.name ?? null,
      printUnitCost,
      subtotal,
    }
  })

  const subtotal = parseFloat(resolvedItems.reduce((sum, i) => sum + i.subtotal, 0).toFixed(2))
  const iva      = parseFloat((subtotal * IVA_RATE).toFixed(2))
  const total    = parseFloat((subtotal + iva).toFixed(2))

  const channelEnum = channel === 'CHAT' ? 'EMAIL' : channel
  const notesText   = [notes, `Origen: ${channel}`, customer.company ? `Empresa: ${customer.company}` : null].filter(Boolean).join('\n')

  const quote = await prisma.quote.create({
    data: {
      clientId: client.id,
      channels: [channelEnum],
      subtotal, iva, total,
      status: 'SENT',
      notes: notesText,
      items: { create: resolvedItems },
    },
    include: { items: { include: { product: { select: { id: true, name: true } }, service: { select: { id: true, name: true } } } } },
  })

  return {
    quoteId: quote.id,
    folio: folio(quote.id),
    clientId: client.id,
    subtotal: quote.subtotal,
    iva: quote.iva,
    total: quote.total,
    items: quote.items.map(item => ({
      productId: item.productId,
      productName: item.product?.name ?? '',
      serviceId: item.serviceId,
      printTechnique: item.printTechnique,
      quantity: item.quantity,
      unitPrice: parseFloat(item.unitPrice),
      printUnitCost: parseFloat(item.printUnitCost),
      markup: parseFloat(item.markup),
      subtotal: parseFloat(item.subtotal),
    })),
    channel,
    createdAt: quote.createdAt.toISOString(),
  }
}
