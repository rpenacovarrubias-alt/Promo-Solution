import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export default async function handler(req, res) {
  // Set CORS headers
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v))

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    if (req.method === 'GET') {
      const providers = await prisma.provider.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { products: true } },
        },
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
    return res.status(500).json({ error: 'Internal server error' })
  } finally {
    await prisma.$disconnect()
  }
}
