import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export default async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v))
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [providers, products, clients, quotesThisMonth, recentQuotes] = await Promise.all([
      prisma.provider.count({ where: { isActive: true } }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.client.count(),
      prisma.quote.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.quote.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          status: true,
          total: true,
          createdAt: true,
          client: { select: { name: true, company: true } },
        },
      }),
    ])

    return res.status(200).json({
      stats: { providers, products, clients, quotesThisMonth },
      recentQuotes,
    })
  } catch (error) {
    console.error('[api/dashboard]', error)
    return res.status(500).json({ error: 'Internal server error' })
  } finally {
    await prisma.$disconnect()
  }
}
