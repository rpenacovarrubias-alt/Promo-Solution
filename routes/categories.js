import { Router } from 'express'
import prisma from './_db.js'

const router = Router()

// GET /api/categories
router.get('/', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { name: 'asc' },
    })
    return res.json(categories)
  } catch (e) {
    console.error('[categories GET]', e)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/categories
router.post('/', async (req, res) => {
  const { name, seoDescription, seoKeywords, utilityPercent, discountPercent } = req.body
  if (!name) return res.status(400).json({ error: 'name is required' })
  try {
    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        seoDescription: seoDescription || null,
        seoKeywords: seoKeywords || null,
        utilityPercent: parseFloat(utilityPercent ?? 0),
        discountPercent: parseFloat(discountPercent ?? 0),
      },
    })
    return res.status(201).json(category)
  } catch (e) {
    if (e.code === 'P2002') return res.status(409).json({ error: 'La categoría ya existe' })
    console.error('[categories POST]', e)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/categories/:id
router.get('/:id', async (req, res) => {
  try {
    const category = await prisma.category.findUnique({ where: { id: req.params.id } })
    if (!category) return res.status(404).json({ error: 'Not found' })
    return res.json(category)
  } catch (e) {
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// PUT /api/categories/:id
router.put('/:id', async (req, res) => {
  const { name, seoDescription, seoKeywords, utilityPercent, discountPercent } = req.body
  try {
    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(seoDescription !== undefined && { seoDescription: seoDescription || null }),
        ...(seoKeywords !== undefined && { seoKeywords: seoKeywords || null }),
        ...(utilityPercent !== undefined && { utilityPercent: parseFloat(utilityPercent) }),
        ...(discountPercent !== undefined && { discountPercent: parseFloat(discountPercent) }),
      },
    })
    return res.json(category)
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Not found' })
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// DELETE /api/categories/:id
router.delete('/:id', async (req, res) => {
  try {
    await prisma.category.delete({ where: { id: req.params.id } })
    return res.status(204).end()
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Not found' })
    return res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
