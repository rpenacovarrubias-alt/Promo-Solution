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

  try {
    if (req.method === 'GET') {
      const clients = await prisma.client.findMany({
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { quotes: true } } },
      })
      return res.status(200).json(clients)
    }

    if (req.method === 'POST') {
      const { name, email, phone, company, markupPercent } = req.body
      if (!name || !email) {
        return res.status(400).json({ error: 'name and email are required' })
      }
      const client = await prisma.client.create({
        data: {
          name,
          email,
          phone: phone || null,
          company: company || null,
          markupPercent: markupPercent ? parseFloat(markupPercent) : 30,
        },
      })
      return res.status(201).json(client)
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('[api/clients]', error)
    if (error.code === 'P2002') return res.status(409).json({ error: 'Email already exists' })
    return res.status(500).json({ error: 'Internal server error' })
  } finally {
    await prisma.$disconnect()
  }
}
