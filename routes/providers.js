import { Router } from 'express'
import prisma from './_db.js'

const router = Router()

const PUBLIC_SELECT = {
  id: true, name: true, slug: true, authType: true, apiUrl: true,
  apiUser: true, accountId: true, logo: true, isActive: true,
  lastSync: true, syncStatus: true, syncMessage: true,
  totalProducts: true, createdAt: true, updatedAt: true,
}

router.get('/', async (req, res) => {
  try {
    const providers = await prisma.provider.findMany({
      select: PUBLIC_SELECT,
      orderBy: { name: 'asc' },
    })
    return res.json(providers)
  } catch (e) {
    return res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/', async (req, res) => {
  const { name, slug, authType = 'BEARER', apiUrl, apiKey, apiUser, apiPassword, accountId, logo, isActive = true } = req.body
  if (!name || !slug) return res.status(400).json({ error: 'name y slug son requeridos' })
  try {
    const provider = await prisma.provider.create({
      data: { name, slug, authType, apiUrl, apiKey, apiUser, apiPassword, accountId, logo, isActive },
      select: PUBLIC_SELECT,
    })
    return res.status(201).json(provider)
  } catch (e) {
    if (e.code === 'P2002') return res.status(409).json({ error: 'El slug ya existe' })
    console.error('[providers POST]', e)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const provider = await prisma.provider.findUnique({
      where: { id: req.params.id },
      select: {
        ...PUBLIC_SELECT,
        syncLogs: {
          orderBy: { startedAt: 'desc' }, take: 10,
          select: { id: true, status: true, message: true, productsAdded: true, productsUpdated: true, productsTotal: true, startedAt: true, finishedAt: true },
        },
      },
    })
    if (!provider) return res.status(404).json({ error: 'Proveedor no encontrado' })
    return res.json(provider)
  } catch (e) {
    return res.status(500).json({ error: 'Internal server error' })
  }
})

router.put('/:id', async (req, res) => {
  const { name, slug, authType, apiUrl, apiKey, apiUser, apiPassword, accountId, logo, isActive } = req.body
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
  try {
    const provider = await prisma.provider.update({ where: { id: req.params.id }, data, select: PUBLIC_SELECT })
    return res.json(provider)
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'No encontrado' })
    if (e.code === 'P2002') return res.status(409).json({ error: 'El slug ya existe' })
    return res.status(500).json({ error: 'Internal server error' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    await prisma.provider.delete({ where: { id: req.params.id } })
    return res.status(204).end()
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'No encontrado' })
    return res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
