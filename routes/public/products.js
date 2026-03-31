import { Router } from 'express'
import prisma from '../_db.js'

const router = Router()

function calcFinalPrice(basePrice, utilityPercent) {
  return parseFloat((parseFloat(basePrice) * (1 + parseFloat(utilityPercent ?? 0) / 100)).toFixed(2))
}

function formatProduct(p) {
  return {
    id: p.id,
    name: p.name,
    description: p.description ?? null,
    basePrice: parseFloat(p.basePrice),
    finalPrice: calcFinalPrice(p.basePrice, p.category?.utilityPercent),
    isActive: p.isActive,
    isFeatured: p.isFeatured ?? false,
    stock: p.stock ?? null,
    category: p.category ? { id: p.category.id, name: p.category.name } : null,
    provider: p.provider ? { id: p.provider.id, name: p.provider.name, slug: p.provider.slug } : null,
    images: (p.images ?? [])
      .sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0))
      .map(img => ({ url: img.url, isPrimary: img.isPrimary })),
    colors: (p.colors ?? []).map(c => ({ name: c.colorName, hex: c.hex ?? null })),
    variants: (p.variants ?? []).map(v => ({ size: v.size ?? null, material: v.material ?? null, minQty: v.minQty })),
  }
}

// GET /api/public/products
router.get('/', async (req, res) => {
  const { search, categoryId, providerId, featured, page = '1', limit = '20' } = req.query
  const pageNum  = Math.max(1, parseInt(page))
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)))

  const where = {
    isActive: true,
    ...(categoryId && { categoryId }),
    ...(providerId && { providerId }),
    ...(featured === 'true' && { isFeatured: true }),
    ...(search && {
      OR: [
        { name:        { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ],
    }),
  }

  try {
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          provider: { select: { id: true, name: true, slug: true } },
          category: { select: { id: true, name: true, utilityPercent: true } },
          images:   { where: { isPrimary: true }, take: 1 },
          colors:   { take: 5 },
          variants: { orderBy: { minQty: 'asc' }, take: 3 },
        },
        orderBy: [{ isFeatured: 'desc' }, { name: 'asc' }],
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.product.count({ where }),
    ])

    const totalPages = Math.ceil(total / limitNum)
    return res.json({
      data: products.map(formatProduct),
      pagination: { page: pageNum, limit: limitNum, total, totalPages, hasNext: pageNum < totalPages, hasPrev: pageNum > 1 },
    })
  } catch (e) {
    console.error('[public/products GET]', e)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// GET /api/public/products/:id
router.get('/:id', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: {
        provider: { select: { id: true, name: true, slug: true } },
        category: { select: { id: true, name: true, utilityPercent: true } },
        images: true, colors: true, variants: true,
      },
    })
    if (!product || !product.isActive) return res.status(404).json({ error: 'Producto no encontrado' })
    return res.json(formatProduct(product))
  } catch (e) {
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
})

export default router
