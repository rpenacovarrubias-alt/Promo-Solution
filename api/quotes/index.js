import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export default async function handler(req, res) {
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v))

  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    if (req.method === 'GET') {
      const { clientId, status } = req.query

      const quotes = await prisma.quote.findMany({
        where: {
          ...(clientId && { clientId }),
          ...(status && { status }),
        },
        include: {
          client: { select: { id: true, name: true, email: true } },
          items: {
            include: {
              product: { select: { id: true, name: true } },
              service: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
      return res.status(200).json(quotes)
    }

    if (req.method === 'POST') {
      const { clientId, channels, subtotal, iva, total, notes, items } = req.body
      if (!clientId || subtotal === undefined || iva === undefined || total === undefined) {
        return res.status(400).json({ error: 'clientId, subtotal, iva, total are required' })
      }

      const quote = await prisma.quote.create({
        data: {
          clientId,
          channels: channels ?? [],
          subtotal: parseFloat(subtotal),
          iva: parseFloat(iva),
          total: parseFloat(total),
          notes: notes || null,
          items: items
            ? {
                create: items.map((item) => ({
                  productId: item.productId || null,
                  serviceId: item.serviceId || null,
                  quantity: item.quantity ?? 1,
                  unitPrice: parseFloat(item.unitPrice),
                  markup: parseFloat(item.markup),
                  subtotal: parseFloat(item.subtotal),
                })),
              }
            : undefined,
        },
        include: {
          client: true,
          items: true,
        },
      })
      return res.status(201).json(quote)
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('[api/quotes]', error)
    return res.status(500).json({ error: 'Internal server error' })
  } finally {
    await prisma.$disconnect()
  }
}
