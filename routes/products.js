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
  try {
    const products = await prisma.product.findMany({
      where,
      include: {
        provider: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
        images: true, colors: true, variants: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
    })
    return res.json(products)
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

export default router
