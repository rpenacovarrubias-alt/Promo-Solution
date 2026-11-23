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

// Una subcategoría cuelga de una categoría principal (árbol de 2 niveles).
// Devuelve un mensaje de error, o null si el parentId es válido.
async function checkParent(parentId, selfId) {
  if (!parentId) return null
  if (parentId === selfId) return 'Una categoría no puede ser su propio padre'
  const parent = await prisma.category.findUnique({ where: { id: parentId }, select: { parentId: true } })
  if (!parent) return 'La categoría padre no existe'
  if (parent.parentId) return 'Solo se permiten 2 niveles: el padre debe ser una categoría principal'
  if (selfId && (await prisma.category.count({ where: { parentId: selfId } }))) {
    return 'Esta categoría tiene subcategorías; no puede volverse subcategoría'
  }
  return null
}

// POST /api/categories
router.post('/', async (req, res) => {
  const { name, seoDescription, seoKeywords, utilityPercent, discountPercent, parentId } = req.body
  if (!name) return res.status(400).json({ error: 'name is required' })
  try {
    const parentError = await checkParent(parentId || null, null)
    if (parentError) return res.status(400).json({ error: parentError })
    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        parentId: parentId || null,
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
  const { name, seoDescription, seoKeywords, utilityPercent, discountPercent, parentId } = req.body
  try {
    if (parentId !== undefined) {
      const parentError = await checkParent(parentId || null, req.params.id)
      if (parentError) return res.status(400).json({ error: parentError })
    }
    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(parentId !== undefined && { parentId: parentId || null }),
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
