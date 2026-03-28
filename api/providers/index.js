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
        const provider = await prisma.provider.findUnique({
          where: { id },
          include: {
            products: { take: 10, orderBy: { createdAt: 'desc' } },
            _count: { select: { products: true } },
          },
        })
        if (!provider) return res.status(404).json({ error: 'Provider not found' })
        return res.status(200).json(provider)
      }

      if (req.method === 'PUT') {
        const { name, apiUrl, apiKey, logo, isActive } = req.body
        const provider = await prisma.provider.update({
          where: { id },
          data: {
            ...(name !== undefined && { name }),
            ...(apiUrl !== undefined && { apiUrl }),
            ...(apiKey !== undefined && { apiKey }),
            ...(logo !== undefined && { logo: logo || null }),
            ...(isActive !== undefined && { isActive }),
          },
        })
        return res.status(200).json(provider)
      }

      if (req.method === 'DELETE') {
        await prisma.provider.delete({ where: { id } })
        return res.status(204).end()
      }

      return res.status(405).json({ error: 'Method not allowed' })
    }

    // ── Collection ─────────────────────────────────────────────────
    if (req.method === 'GET') {
      const providers = await prisma.provider.findMany({
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { products: true } } },
      })
      return res.status(200).json(providers)
    }

    if (req.method === 'POST') {
      const { name, apiUrl, apiKey, logo } = req.body
      if (!name || !apiUrl || !apiKey) {
        return res.status(400).json({ error: 'name, apiUrl, and apiKey are required' })
      }
      const provider = await prisma.provider.create({
        data: { name, apiUrl, apiKey, logo: logo || null },
      })
      return res.status(201).json(provider)
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('[api/providers]', error)
    if (error.code === 'P2025') return res.status(404).json({ error: 'Provider not found' })
    return res.status(500).json({ error: 'Internal server error' })
  } finally {
    await prisma.$disconnect()
  }
}
