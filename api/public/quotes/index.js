/**
 * API Pública — Cotizaciones desde Bot
 * Promo Solution
 *
 * POST /api/public/quotes  → registra una cotización generada por el bot
 *                            (Telegram / WhatsApp / Chat)
 *
 * Headers requeridos:
 *   X-API-Key: <PUBLIC_API_KEY>
 *   Content-Type: application/json
 *
 * Body:
 * {
 *   "customer": {
 *     "name":    "Juan Pérez",           // requerido
 *     "phone":   "4421234567",           // requerido (WhatsApp / Telegram)
 *     "email":   "juan@empresa.com",     // opcional
 *     "company": "Mi Empresa S.A."       // opcional
 *   },
 *   "channel":  "TELEGRAM" | "WHATSAPP" | "CHAT",  // requerido
 *   "items": [                           // requerido — mín. 1 item
 *     {
 *       "productId": "cuid...",          // requerido
 *       "quantity":  50,                 // requerido
 *       "notes":     "Con logo bordado"  // opcional
 *     }
 *   ],
 *   "notes": "Requiere entrega urgente"  // opcional
 * }
 *
 * Response 201:
 * {
 *   "quoteId":   "cuid...",
 *   "folio":     "COT-0042",
 *   "subtotal":  2700.00,
 *   "iva":       432.00,
 *   "total":     3132.00,
 *   "items": [...],
 *   "createdAt": "2026-03-30T..."
 * }
 */

import { PrismaClient } from '@prisma/client'
import { validateApiKey, PUBLIC_CORS } from '../../_lib/auth.js'

const prisma = new PrismaClient()
const IVA_RATE = 0.16

export default async function handler(req, res) {
  Object.entries(PUBLIC_CORS).forEach(([k, v]) => res.setHeader(k, v))
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Método no permitido' })

  const auth = validateApiKey(req)
  if (!auth.ok) return res.status(401).json({ error: auth.error })

  const { customer, channel, items, notes } = req.body ?? {}

  // ── Validaciones básicas ──────────────────────────────────────────────────
  if (!customer?.name || !customer?.phone) {
    return res.status(400).json({ error: 'customer.name y customer.phone son requeridos' })
  }
  if (!channel || !['TELEGRAM', 'WHATSAPP', 'CHAT', 'EMAIL'].includes(channel)) {
    return res.status(400).json({ error: 'channel debe ser TELEGRAM, WHATSAPP, CHAT o EMAIL' })
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Se requiere al menos un item en items[]' })
  }
  for (const item of items) {
    if (!item.productId)          return res.status(400).json({ error: 'Cada item debe tener productId' })
    if (!item.quantity || item.quantity < 1) return res.status(400).json({ error: 'Cada item debe tener quantity >= 1' })
  }

  try {
    // ── 1. Upsert del cliente (por teléfono) ──────────────────────────────
    let client = await prisma.client.findFirst({
      where: { phone: customer.phone },
    })

    if (!client) {
      // Verificar si existe por email
      if (customer.email) {
        client = await prisma.client.findUnique({ where: { email: customer.email } })
      }
    }

    if (!client) {
      // Crear cliente nuevo con email generado si no viene
      const emailFallback = customer.email || `bot_${customer.phone}@promosolution.mx`
      try {
        client = await prisma.client.create({
          data: {
            name:    customer.name.trim(),
            email:   emailFallback,
            phone:   customer.phone,
            company: customer.company?.trim() ?? null,
          },
        })
      } catch (e) {
        // Si el email ya existe (carrera), buscar de nuevo
        if (e.code === 'P2002') {
          client = await prisma.client.findUnique({ where: { email: emailFallback } })
        } else {
          throw e
        }
      }
    }

    // ── 2. Resolver productos y calcular precios ──────────────────────────
    const productIds = [...new Set(items.map(i => i.productId))]
    const products   = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      include: {
        category: { select: { utilityPercent: true } },
      },
    })

    const productMap = Object.fromEntries(products.map(p => [p.id, p]))

    // Verificar que todos los productos existen
    const missing = productIds.filter(id => !productMap[id])
    if (missing.length > 0) {
      return res.status(400).json({
        error: `Productos no encontrados o inactivos: ${missing.join(', ')}`,
      })
    }

    // Construir items con precios aplicando utilidad de categoría
    const resolvedItems = items.map(item => {
      const product       = productMap[item.productId]
      const basePrice     = parseFloat(product.basePrice)
      const utilityPct    = parseFloat(product.category?.utilityPercent ?? 0)
      const finalUnitPrice = parseFloat((basePrice * (1 + utilityPct / 100)).toFixed(2))
      const subtotal      = parseFloat((finalUnitPrice * item.quantity).toFixed(2))

      return {
        productId: item.productId,
        serviceId: null,
        quantity:  item.quantity,
        unitPrice: finalUnitPrice,
        markup:    utilityPct,
        subtotal,
        _notes:    item.notes ?? null,   // nota interna, no se guarda en BD (campo futuro)
      }
    })

    const subtotal = parseFloat(resolvedItems.reduce((sum, i) => sum + i.subtotal, 0).toFixed(2))
    const iva      = parseFloat((subtotal * IVA_RATE).toFixed(2))
    const total    = parseFloat((subtotal + iva).toFixed(2))

    // ── 3. Crear la cotización en la BD ───────────────────────────────────
    const channelEnum = channel === 'CHAT' ? 'EMAIL' : channel   // CHAT no existe en el enum, se mapea a EMAIL
    const notesText   = [
      notes,
      `📱 Origen: ${channel}`,
      customer.company ? `🏢 Empresa: ${customer.company}` : null,
    ].filter(Boolean).join('\n')

    const quote = await prisma.quote.create({
      data: {
        clientId: client.id,
        channels: [channelEnum],
        subtotal,
        iva,
        total,
        status: 'SENT',
        notes: notesText,
        items: {
          create: resolvedItems.map(({ _notes: _, ...item }) => item),
        },
      },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true } },
          },
        },
      },
    })

    // ── 4. Generar número de folio (basado en conteo total de cotizaciones) ─
    const count = await prisma.quote.count()
    const folio = `COT-${String(count).padStart(4, '0')}`

    return res.status(201).json({
      quoteId:   quote.id,
      folio,
      clientId:  client.id,
      subtotal:  quote.subtotal,
      iva:       quote.iva,
      total:     quote.total,
      items: quote.items.map(item => ({
        productId:   item.productId,
        productName: item.product?.name ?? '',
        quantity:    item.quantity,
        unitPrice:   parseFloat(item.unitPrice),
        markup:      parseFloat(item.markup),
        subtotal:    parseFloat(item.subtotal),
      })),
      channel,
      createdAt: quote.createdAt.toISOString(),
    })
  } catch (error) {
    console.error('[api/public/quotes]', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  } finally {
    await prisma.$disconnect()
  }
}
