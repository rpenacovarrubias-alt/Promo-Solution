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
    if (req.method === 'GET') {
      const category = await prisma.category.findUnique({ where: { id } })
      if (!category) return res.status(404).json({ error: 'Not found' })
      return res.status(200).json(category)
    }

    if (req.method === 'PUT') {
      const { name, seoDescription, seoKeywords, utilityPercent, discountPercent } = req.body
      const category = await prisma.category.update({
        where: { id },
        data: {
          ...(name !== undefined && { name: name.trim() }),
          ...(seoDescription !== undefined && { seoDescription: seoDescription || null }),
          ...(seoKeywords !== undefined && { seoKeywords: seoKeywords || null }),
          ...(utilityPercent !== undefined && { utilityPercent: parseFloat(utilityPercent) }),
          ...(discountPercent !== undefined && { discountPercent: parseFloat(discountPercent) }),
        },
      })
      return res.status(200).json(category)
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('[api/categories/[id]]', error)
    if (error.code === 'P2025') return res.status(404).json({ error: 'Not found' })
    return res.status(500).json({ error: 'Internal server error' })
  } finally {
    await prisma.$disconnect()
  }
}
