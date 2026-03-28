import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export default async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v))
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { id } = req.query

  try {
    // ── Single item ────────────────────────────────────────────────
    if (id) {
      if (req.method === 'GET') {
        const product = await prisma.product.findUnique({
          where: { id },
          include: { provider: true, images: true, colors: true, variants: true },
        })
        if (!product) return res.status(404).json({ error: 'Product not found' })
        return res.status(200).json(product)
      }
      return res.status(405).json({ error: 'Method not allowed' })
    }

    // ── Collection ─────────────────────────────────────────────────
    if (req.method === 'GET') {
      const { search, categoryId, providerId, page = '1', limit = '50' } = req.query
      const where = {
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { category: { name: { contains: search, mode: 'insensitive' } } },
          ],
        }),
        ...(categoryId && { categoryId }),
        ...(providerId && { providerId }),
      }
      const products = await prisma.product.findMany({
        where,
        include: {
          provider: { select: { id: true, name: true } },
          category: { select: { id: true, name: true } },
          images: true,
          colors: true,
          variants: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      })
      return res.status(200).json(products)
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('[api/products]', error)
    return res.status(500).json({ error: 'Internal server error' })
  } finally {
    await prisma.$disconnect()
  }
}
