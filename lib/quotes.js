// Lógica de creación de cotizaciones — única fuente de verdad.
// Usada por routes/public/quotes.js (HTTP) y por lib/julio/tools.js (tool-calling de Julio).
// Mismo comportamiento que antes del refactor — sin cambios de validación.

import prisma from '../routes/_db.js'

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
      client = await prisma.client.create({
        data: { name: customer.name.trim(), email: emailFallback, phone: customer.phone, company: customer.company?.trim() ?? null },
      })
    } catch (e) {
      if (e.code === 'P2002') client = await prisma.client.findUnique({ where: { email: customer.email || `bot_${customer.phone}@promosolution.mx` } })
      else throw e
    }
  }

  // Resolver productos y calcular precios
  const productIds = [...new Set(items.map(i => i.productId))]
  const products   = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
    include: { category: { select: { utilityPercent: true } } },
  })
  const productMap = Object.fromEntries(products.map(p => [p.id, p]))
  const missing = productIds.filter(id => !productMap[id])
  if (missing.length > 0) throw new QuoteValidationError(`Productos no encontrados: ${missing.join(', ')}`)

  const resolvedItems = items.map(item => {
    const product        = productMap[item.productId]
    const basePrice      = parseFloat(product.basePrice)
    const utilityPct     = parseFloat(product.category?.utilityPercent ?? 0)
    const finalUnitPrice = parseFloat((basePrice * (1 + utilityPct / 100)).toFixed(2))
    const subtotal       = parseFloat((finalUnitPrice * item.quantity).toFixed(2))
    return { productId: item.productId, serviceId: null, quantity: item.quantity, unitPrice: finalUnitPrice, markup: utilityPct, subtotal }
  })

  const subtotal = parseFloat(resolvedItems.reduce((sum, i) => sum + i.subtotal, 0).toFixed(2))
  const iva      = parseFloat((subtotal * IVA_RATE).toFixed(2))
  const total    = parseFloat((subtotal + iva).toFixed(2))

  const channelEnum = channel === 'CHAT' ? 'EMAIL' : channel
  const notesText   = [notes, `📱 Origen: ${channel}`, customer.company ? `🏢 ${customer.company}` : null].filter(Boolean).join('\n')

  const quote = await prisma.quote.create({
    data: {
      clientId: client.id,
      channels: [channelEnum],
      subtotal, iva, total,
      status: 'SENT',
      notes: notesText,
      items: { create: resolvedItems },
    },
    include: { items: { include: { product: { select: { id: true, name: true } } } } },
  })

  const count = await prisma.quote.count()
  const folio = `COT-${String(count).padStart(4, '0')}`

  return {
    quoteId: quote.id,
    folio,
    clientId: client.id,
    subtotal: quote.subtotal,
    iva: quote.iva,
    total: quote.total,
    items: quote.items.map(item => ({
      productId: item.productId,
      productName: item.product?.name ?? '',
      quantity: item.quantity,
      unitPrice: parseFloat(item.unitPrice),
      markup: parseFloat(item.markup),
      subtotal: parseFloat(item.subtotal),
    })),
    channel,
    createdAt: quote.createdAt.toISOString(),
  }
}
