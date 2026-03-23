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
      const client = await prisma.client.findUnique({
        where: { id },
        include: {
          quotes: { orderBy: { createdAt: 'desc' }, take: 10 },
          _count: { select: { quotes: true } },
        },
      })
      if (!client) return res.status(404).json({ error: 'Client not found' })
      return res.status(200).json(client)
    }

    if (req.method === 'PUT') {
      const { name, email, phone, company, markupPercent } = req.body
      const client = await prisma.client.update({
        where: { id },
        data: {
          ...(name !== undefined && { name }),
          ...(email !== undefined && { email }),
          ...(phone !== undefined && { phone: phone || null }),
          ...(company !== undefined && { company: company || null }),
          ...(markupPercent !== undefined && { markupPercent: parseFloat(markupPercent) }),
        },
      })
      return res.status(200).json(client)
    }

    if (req.method === 'DELETE') {
      await prisma.client.delete({ where: { id } })
      return res.status(204).end()
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('[api/clients/[id]]', error)
    if (error.code === 'P2025') return res.status(404).json({ error: 'Client not found' })
    if (error.code === 'P2002') return res.status(409).json({ error: 'Email already exists' })
    return res.status(500).json({ error: 'Internal server error' })
  } finally {
    await prisma.$disconnect()
  }
}
