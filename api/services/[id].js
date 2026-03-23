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
      const service = await prisma.service.findUnique({ where: { id } })
      if (!service) return res.status(404).json({ error: 'Service not found' })
      return res.status(200).json(service)
    }

    if (req.method === 'PUT') {
      const { name, type, unitPrice, description, isActive } = req.body
      const service = await prisma.service.update({
        where: { id },
        data: {
          ...(name !== undefined && { name }),
          ...(type !== undefined && { type }),
          ...(unitPrice !== undefined && { unitPrice: parseFloat(unitPrice) }),
          ...(description !== undefined && { description: description || null }),
          ...(isActive !== undefined && { isActive }),
        },
      })
      return res.status(200).json(service)
    }

    if (req.method === 'DELETE') {
      await prisma.service.delete({ where: { id } })
      return res.status(204).end()
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('[api/services/[id]]', error)
    if (error.code === 'P2025') return res.status(404).json({ error: 'Service not found' })
    return res.status(500).json({ error: 'Internal server error' })
  } finally {
    await prisma.$disconnect()
  }
}
