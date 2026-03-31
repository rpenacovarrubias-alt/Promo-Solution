import { Router } from 'express'
import prisma from './_db.js'

const router = Router()

router.get('/', async (req, res) => {
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
          id: true, status: true, total: true, createdAt: true,
          client: { select: { name: true, company: true } },
        },
      }),
    ])

    return res.json({ stats: { providers, products, clients, quotesThisMonth }, recentQuotes })
  } catch (e) {
    console.error('[dashboard]', e)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
