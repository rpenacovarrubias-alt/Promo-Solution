import { Router } from 'express'
import prisma from './_db.js'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const services = await prisma.service.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    })
    return res.json(services)
  } catch (e) {
    return res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/', async (req, res) => {
  const { name, type, unitPrice, description } = req.body
  if (!name || !type || unitPrice === undefined) {
    return res.status(400).json({ error: 'name, type and unitPrice are required' })
  }
  try {
    const service = await prisma.service.create({
      data: { name, type, unitPrice: parseFloat(unitPrice), description: description || null },
    })
    return res.status(201).json(service)
  } catch (e) {
    console.error('[services POST]', e)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const service = await prisma.service.findUnique({ where: { id: req.params.id } })
    if (!service) return res.status(404).json({ error: 'Not found' })
    return res.json(service)
  } catch (e) {
    return res.status(500).json({ error: 'Internal server error' })
  }
})

router.put('/:id', async (req, res) => {
  const { name, type, unitPrice, description, isActive } = req.body
  try {
    const service = await prisma.service.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(type !== undefined && { type }),
        ...(unitPrice !== undefined && { unitPrice: parseFloat(unitPrice) }),
        ...(description !== undefined && { description: description || null }),
        ...(isActive !== undefined && { isActive }),
      },
    })
    return res.json(service)
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Not found' })
    return res.status(500).json({ error: 'Internal server error' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    await prisma.service.delete({ where: { id: req.params.id } })
    return res.status(204).end()
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Not found' })
    return res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
