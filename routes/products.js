import { Router } from 'express'
import prisma from './_db.js'

const router = Router()

router.get('/', async (req, res) => {
  const { search, categoryId, providerId, page = '1', limit = '50' } = req.query
  const where = {
    ...(search && {
      OR: [
        { name:        { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category:    { name: { contains: search, mode: 'insensitive' } } },
      ],
    }),
    ...(categoryId && { categoryId }),
    ...(providerId && { providerId }),
  }
  const pageNum = parseInt(page)
  const limitNum = parseInt(limit)
  try {
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          provider: { select: { id: true, name: true } },
          category: { select: { id: true, name: true } },
          images: true, colors: true, variants: true,
        },
        orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.product.count({ where }),
    ])
    const totalPages = Math.ceil(total / limitNum)
    return res.json({
      data: products,
      pagination: { page: pageNum, limit: limitNum, total, totalPages, hasNext: pageNum < totalPages, hasPrev: pageNum > 1 },
    })
  } catch (e) {
    console.error('[products GET]', e)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { provider: true, images: true, colors: true, variants: true },
    })
    if (!product) return res.status(404).json({ error: 'Product not found' })
    return res.json(product)
  } catch (e) {
    return res.status(500).json({ error: 'Internal server error' })
  }
})

router.put('/:id', async (req, res) => {
  const { isVisible, isFeatured } = req.body
  try {
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        ...(isVisible !== undefined && { isVisible }),
        ...(isFeatured !== undefined && { isFeatured }),
      },
    })
    return res.json(product)
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Product not found' })
    return res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
