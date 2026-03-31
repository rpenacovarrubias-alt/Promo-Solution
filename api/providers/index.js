import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// Nunca devolver apiPassword ni apiKey en respuestas GET
const PUBLIC_SELECT = {
  id: true,
  name: true,
  slug: true,
  authType: true,
  apiUrl: true,
  apiUser: true,
  accountId: true,
  logo: true,
  isActive: true,
  lastSync: true,
  syncStatus: true,
  syncMessage: true,
  totalProducts: true,
  createdAt: true,
  updatedAt: true,
}

export default async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v))
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { id } = req.query

  try {
    // ── Single provider ───────────────────────────────────────────────────────
    if (id) {
      if (req.method === 'GET') {
        const provider = await prisma.provider.findUnique({
          where: { id },
          select: {
            ...PUBLIC_SELECT,
            syncLogs: {
              orderBy: { startedAt: 'desc' },
              take: 10,
              select: {
                id: true,
                status: true,
                message: true,
                productsAdded: true,
                productsUpdated: true,
                productsTotal: true,
                startedAt: true,
                finishedAt: true,
              },
            },
          },
        })
        if (!provider) return res.status(404).json({ error: 'Proveedor no encontrado' })
        return res.status(200).json(provider)
      }

      if (req.method === 'PUT') {
        const {
          name, slug, authType, apiUrl, apiKey, apiUser, apiPassword,
          accountId, logo, isActive,
        } = req.body

        const data = {
          ...(name !== undefined && { name }),
          ...(slug !== undefined && { slug }),
          ...(authType !== undefined && { authType }),
          ...(apiUrl !== undefined && { apiUrl }),
          ...(apiKey !== undefined && { apiKey }),
          ...(apiUser !== undefined && { apiUser }),
          ...(apiPassword !== undefined && { apiPassword }),
          ...(accountId !== undefined && { accountId }),
          ...(logo !== undefined && { logo }),
          ...(isActive !== undefined && { isActive }),
        }

        const provider = await prisma.provider.update({
          where: { id },
          data,
          select: PUBLIC_SELECT,
        })
        return res.status(200).json(provider)
      }

      if (req.method === 'DELETE') {
        await prisma.provider.delete({ where: { id } })
        return res.status(204).end()
      }

      return res.status(405).json({ error: 'Method not allowed' })
    }

    // ── Collection ────────────────────────────────────────────────────────────
    if (req.method === 'GET') {
      const providers = await prisma.provider.findMany({
        select: PUBLIC_SELECT,
        orderBy: { name: 'asc' },
      })
      return res.status(200).json(providers)
    }

    if (req.method === 'POST') {
      const {
        name, slug, authType = 'BEARER', apiUrl, apiKey, apiUser,
        apiPassword, accountId, logo, isActive = true,
      } = req.body

      if (!name || !slug) {
        return res.status(400).json({ error: 'name y slug son requeridos' })
      }

      const provider = await prisma.provider.create({
        data: { name, slug, authType, apiUrl, apiKey, apiUser, apiPassword, accountId, logo, isActive },
        select: PUBLIC_SELECT,
      })
      return res.status(201).json(provider)
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('[api/providers]', error)
    if (error.code === 'P2025') return res.status(404).json({ error: 'No encontrado' })
    if (error.code === 'P2002') return res.status(409).json({ error: 'El slug ya existe' })
    return res.status(500).json({ error: 'Internal server error' })
  } finally {
    await prisma.$disconnect()
  }
}
