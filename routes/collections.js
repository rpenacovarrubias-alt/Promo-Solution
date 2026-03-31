import { Router } from 'express'
import prisma from './_db.js'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const collections = await prisma.collection.findMany({ orderBy: { name: 'asc' } })
    return res.json(collections)
  } catch (e) {
    return res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/', async (req, res) => {
  const { code, name, seoDescription, seoKeywords } = req.body
  if (!code || !name) return res.status(400).json({ error: 'code and name are required' })
  try {
    const collection = await prisma.collection.create({
      data: {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        seoDescription: seoDescription || null,
        seoKeywords: seoKeywords || null,
        isActive: true,
      },
    })
    return res.status(201).json(collection)
  } catch (e) {
    if (e.code === 'P2002') return res.status(409).json({ error: 'El código ya existe' })
    return res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const collection = await prisma.collection.findUnique({ where: { id: req.params.id } })
    if (!collection) return res.status(404).json({ error: 'Not found' })
    return res.json(collection)
  } catch (e) {
    return res.status(500).json({ error: 'Internal server error' })
  }
})

router.put('/:id', async (req, res) => {
  const { code, name, seoDescription, seoKeywords, isActive } = req.body
  try {
    const collection = await prisma.collection.update({
      where: { id: req.params.id },
      data: {
        ...(code !== undefined && { code: code.trim().toUpperCase() }),
        ...(name !== undefined && { name: name.trim() }),
        ...(seoDescription !== undefined && { seoDescription: seoDescription || null }),
        ...(seoKeywords !== undefined && { seoKeywords: seoKeywords || null }),
        ...(isActive !== undefined && { isActive }),
      },
    })
    return res.json(collection)
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Not found' })
    return res.status(500).json({ error: 'Internal server error' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    await prisma.collection.delete({ where: { id: req.params.id } })
    return res.status(204).end()
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Not found' })
    return res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
