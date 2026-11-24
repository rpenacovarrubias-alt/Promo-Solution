import { Router } from 'express'
import prisma from './_db.js'
import { matches, norm } from '../lib/subcategoryRules.js'

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

// Regla de calidad del catálogo: un producto sin precio (basePrice <= 0) o sin
// imagen NO puede estar activo (ni en admin ni en el sitio público, que solo
// muestra isActive && isVisible). Los inactivos siguen listados en el admin
// para poder identificarlos. Idempotente. `?dry=1` solo cuenta, no escribe.
// Misma regla que aplica routes/sync.js al sincronizar con proveedores.
router.post('/apply-quality-rule', async (req, res) => {
  const where = { isActive: true, OR: [{ basePrice: { lte: 0 } }, { images: { none: {} } }] }
  try {
    const rows = await prisma.product.findMany({
      where,
      select: { id: true, name: true, basePrice: true, _count: { select: { images: true } } },
    })
    if (req.query.dry !== '1' && rows.length) {
      await prisma.product.updateMany({ where: { id: { in: rows.map(r => r.id) } }, data: { isActive: false } })
    }
    return res.json({
      dryRun: req.query.dry === '1',
      deactivated: req.query.dry === '1' ? 0 : rows.length,
      matched: rows.length,
      sample: rows.slice(0, 5).map(r => ({ id: r.id, name: r.name, basePrice: r.basePrice, images: r._count.images })),
    })
  } catch (e) {
    console.error('[products apply-quality-rule]', e)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// Clasifica los productos en las subcategorías por las reglas de lib/subcategoryRules.js (nombre +
// descripción). Solo cambia categoryId; no toca precios, imágenes ni estado. Lo que ninguna regla
// reconoce se queda en su categoría. Idempotente. `?dry=1` solo cuenta, no escribe.
// routes/sync.js respeta la subcategoría ya asignada.
router.post('/classify', async (req, res) => {
  const dry = req.query.dry === '1'
  try {
    const subs = await prisma.category.findMany({ where: { parentId: { not: null } }, select: { id: true, name: true } })
    const subByName = new Map(subs.map(c => [norm(c.name), c]))
    const products = await prisma.product.findMany({ select: { id: true, name: true, description: true, categoryId: true } })

    const moves = new Map() // subcategoryId -> { name, ids }
    const unknownSubs = new Set()
    let alreadyThere = 0, stay = 0
    for (const p of products) {
      const hit = matches(p.name, p.description)[0]
      if (!hit || hit.sub === null) { stay++; continue }
      const sub = subByName.get(norm(hit.sub))
      if (!sub) { unknownSubs.add(hit.sub); stay++; continue }
      if (sub.id === p.categoryId) { alreadyThere++; continue }
      if (!moves.has(sub.id)) moves.set(sub.id, { name: sub.name, ids: [] })
      moves.get(sub.id).ids.push(p.id)
    }

    const bySubcategory = {}
    let moved = 0
    for (const [subId, { name, ids }] of moves) {
      bySubcategory[name] = ids.length
      moved += ids.length
      if (!dry) await prisma.product.updateMany({ where: { id: { in: ids } }, data: { categoryId: subId } })
    }
    return res.json({ dryRun: dry, total: products.length, moved, alreadyThere, stay, unknownSubcategories: [...unknownSubs], bySubcategory })
  } catch (e) {
    console.error('[products classify]', e)
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
