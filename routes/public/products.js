import { Router } from 'express'
import prisma from '../_db.js'
import { getSessionClient } from './_session.js'

const router = Router()

function calcFinalPrice(basePrice, percent) {
  return parseFloat((parseFloat(basePrice) * (1 + parseFloat(percent ?? 0) / 100)).toFixed(2))
}

// Si quien navega tiene sesión de cliente, el precio se calcula con SU
// markupPercent (el mismo que ya manda al cotizar) — no con el % genérico de
// la categoría. Así ve el mismo precio en el catálogo que en su cotización.
function formatProduct(p, clientMarkup) {
  const percent = clientMarkup ?? p.category?.utilityPercent
  return {
    id: p.id,
    name: p.name,
    description: p.description ?? null,
    basePrice: parseFloat(p.basePrice),
    finalPrice: calcFinalPrice(p.basePrice, percent),
    isActive: p.isActive,
    isFeatured: p.isFeatured,
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
  const { search, categoryId, providerId, page = '1', limit = '20' } = req.query
  const pageNum  = Math.max(1, parseInt(page))
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)))

  const where = {
    isActive: true,
    isVisible: true,
    ...(categoryId && { categoryId }),
    ...(providerId && { providerId }),
    ...(search && {
      OR: [
        { name:        { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ],
    }),
  }

  try {
    const [products, total, sessionClient] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          provider: { select: { id: true, name: true, slug: true } },
          category: { select: { id: true, name: true, utilityPercent: true } },
          images:   { where: { isPrimary: true }, take: 1 },
          colors:   { take: 5 },
          variants: { orderBy: { minQty: 'asc' }, take: 3 },
        },
        orderBy: [{ images: { _count: 'desc' } }, { name: 'asc' }],
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.product.count({ where }),
      getSessionClient(req, { markupPercent: true }),
    ])
    const clientMarkup = sessionClient ? parseFloat(sessionClient.markupPercent) : null

    const totalPages = Math.ceil(total / limitNum)
    return res.json({
      data: products.map((p) => formatProduct(p, clientMarkup)),
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
    const [product, sessionClient] = await Promise.all([
      prisma.product.findUnique({
        where: { id: req.params.id },
        include: {
          provider: { select: { id: true, name: true, slug: true } },
          category: { select: { id: true, name: true, utilityPercent: true } },
          images: true, colors: true, variants: true,
        },
      }),
      getSessionClient(req, { markupPercent: true }),
    ])
    if (!product || !product.isActive || !product.isVisible) return res.status(404).json({ error: 'Producto no encontrado' })
    const clientMarkup = sessionClient ? parseFloat(sessionClient.markupPercent) : null
    return res.json(formatProduct(product, clientMarkup))
  } catch (e) {
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
})

export default router
