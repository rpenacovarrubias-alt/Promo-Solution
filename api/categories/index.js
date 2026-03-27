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

  try {
    if (req.method === 'GET') {
      const categories = await prisma.category.findMany({
        include: { _count: { select: { products: true } } },
        orderBy: { name: 'asc' },
      })
      return res.status(200).json(categories)
    }

    if (req.method === 'POST') {
      const { name, seoDescription, seoKeywords, utilityPercent, discountPercent } = req.body
      if (!name) return res.status(400).json({ error: 'name is required' })
      const category = await prisma.category.create({
        data: {
          name: name.trim(),
          seoDescription: seoDescription || null,
          seoKeywords: seoKeywords || null,
          utilityPercent: parseFloat(utilityPercent ?? 0),
          discountPercent: parseFloat(discountPercent ?? 0),
        },
      })
      return res.status(201).json(category)
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('[api/categories]', error)
    return res.status(500).json({ error: 'Internal server error' })
  } finally {
    await prisma.$disconnect()
  }
}
