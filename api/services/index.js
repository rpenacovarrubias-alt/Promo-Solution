import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

const VALID_TYPES = ['ESTAMPADO', 'BORDADO', 'GRABADO', 'SUBLIMACION', 'OTRO']

export default async function handler(req, res) {
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v))

  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    if (req.method === 'GET') {
      const services = await prisma.service.findMany({
        orderBy: { createdAt: 'desc' },
      })
      return res.status(200).json(services)
    }

    if (req.method === 'POST') {
      const { name, type, unitPrice, description } = req.body
      if (!name || !type || unitPrice === undefined) {
        return res.status(400).json({ error: 'name, type, and unitPrice are required' })
      }
      if (!VALID_TYPES.includes(type)) {
        return res.status(400).json({ error: `type must be one of: ${VALID_TYPES.join(', ')}` })
      }
      const service = await prisma.service.create({
        data: {
          name,
          type,
          unitPrice: parseFloat(unitPrice),
          description: description || null,
        },
      })
      return res.status(201).json(service)
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('[api/services]', error)
    return res.status(500).json({ error: 'Internal server error' })
  } finally {
    await prisma.$disconnect()
  }
}
