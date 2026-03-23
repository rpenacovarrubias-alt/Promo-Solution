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

  const { id } = req.query

  try {
    if (req.method === 'GET') {
      const quote = await prisma.quote.findUnique({
        where: { id },
        include: {
          client: true,
          items: {
            include: {
              product: true,
              service: true,
            },
          },
        },
      })
      if (!quote) return res.status(404).json({ error: 'Quote not found' })
      return res.status(200).json(quote)
    }

    if (req.method === 'PUT') {
      const { status, channels, notes, subtotal, iva, total } = req.body
      const quote = await prisma.quote.update({
        where: { id },
        data: {
          ...(status !== undefined && { status }),
          ...(channels !== undefined && { channels }),
          ...(notes !== undefined && { notes }),
          ...(subtotal !== undefined && { subtotal: parseFloat(subtotal) }),
          ...(iva !== undefined && { iva: parseFloat(iva) }),
          ...(total !== undefined && { total: parseFloat(total) }),
        },
        include: { client: true },
      })
      return res.status(200).json(quote)
    }

    if (req.method === 'DELETE') {
      await prisma.quote.delete({ where: { id } })
      return res.status(204).end()
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('[api/quotes/[id]]', error)
    if (error.code === 'P2025') return res.status(404).json({ error: 'Quote not found' })
    return res.status(500).json({ error: 'Internal server error' })
  } finally {
    await prisma.$disconnect()
  }
}
