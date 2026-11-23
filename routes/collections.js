// Recomendaciones (modelo Collection): grupos temáticos de productos de CUALQUIER proveedor.
import { Router } from 'express'
import prisma from './_db.js'

const router = Router()

const SELECT_ADMIN = { _count: { select: { products: true } } }

const optional = (body, key) => (body[key] !== undefined ? { [key]: body[key] || null } : {})

// GET /api/collections
router.get('/', async (req, res) => {
  try {
    const rows = await prisma.collection.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: SELECT_ADMIN,
    })
    return res.json(rows)
  } catch (e) {
    console.error('[collections GET]', e)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/collections
router.post('/', async (req, res) => {
  const { code, name, sortOrder } = req.body
  if (!code || !name) return res.status(400).json({ error: 'code and name are required' })
  try {
    const collection = await prisma.collection.create({
      data: {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        sortOrder: Number.isFinite(Number(sortOrder)) ? Number(sortOrder) : 0,
        ...optional(req.body, 'seoDescription'),
        ...optional(req.body, 'seoKeywords'),
        ...optional(req.body, 'icon'),
        ...optional(req.body, 'matchKeywords'),
        isActive: true,
      },
    })
    return res.status(201).json(collection)
  } catch (e) {
    if (e.code === 'P2002') return res.status(409).json({ error: 'El código ya existe' })
    console.error('[collections POST]', e)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const collection = await prisma.collection.findUnique({ where: { id: req.params.id }, include: SELECT_ADMIN })
    if (!collection) return res.status(404).json({ error: 'Not found' })
    return res.json(collection)
  } catch (e) {
    return res.status(500).json({ error: 'Internal server error' })
  }
})

router.put('/:id', async (req, res) => {
  const { code, name, isActive, sortOrder } = req.body
  try {
    const collection = await prisma.collection.update({
      where: { id: req.params.id },
      data: {
        ...(code !== undefined && { code: code.trim().toUpperCase() }),
        ...(name !== undefined && { name: name.trim() }),
        ...(isActive !== undefined && { isActive }),
        ...(sortOrder !== undefined && { sortOrder: Number(sortOrder) || 0 }),
        ...optional(req.body, 'seoDescription'),
        ...optional(req.body, 'seoKeywords'),
        ...optional(req.body, 'icon'),
        ...optional(req.body, 'matchKeywords'),
      },
    })
    return res.json(collection)
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Not found' })
    if (e.code === 'P2002') return res.status(409).json({ error: 'El código ya existe' })
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

// ── Productos de la recomendación ─────────────────────────────────────────────

// GET /api/collections/:id/products?page=&limit=
router.get('/:id/products', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page ?? '1'))
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit ?? '50')))
  const where = { collectionId: req.params.id }
  try {
    const [rows, total, byProvider] = await Promise.all([
      prisma.productCollection.findMany({
        where,
        orderBy: { addedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          product: {
            select: {
              id: true, name: true, basePrice: true, isActive: true,
              provider: { select: { id: true, name: true } },
              images: { where: { isPrimary: true }, take: 1, select: { url: true } },
            },
          },
        },
      }),
      prisma.productCollection.count({ where }),
      prisma.$queryRaw`
        SELECT pr.name AS provider, COUNT(*)::int AS count
        FROM promo_panel."ProductCollection" pc
        JOIN promo_panel."Product" p ON p.id = pc."productId"
        JOIN promo_panel."Provider" pr ON pr.id = p."providerId"
        WHERE pc."collectionId" = ${req.params.id}
        GROUP BY pr.name ORDER BY count DESC`,
    ])
    return res.json({
      data: rows.map(r => r.product),
      byProvider,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (e) {
    console.error('[collections products GET]', e)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/collections/:id/products  { productIds: [] }
router.post('/:id/products', async (req, res) => {
  const ids = Array.isArray(req.body.productIds) ? req.body.productIds.filter(x => typeof x === 'string') : []
  if (!ids.length) return res.status(400).json({ error: 'productIds is required' })
  try {
    const r = await prisma.productCollection.createMany({
      data: ids.map(productId => ({ collectionId: req.params.id, productId })),
      skipDuplicates: true,
    })
    return res.status(201).json({ added: r.count })
  } catch (e) {
    if (e.code === 'P2003') return res.status(404).json({ error: 'Recomendación o producto no encontrado' })
    console.error('[collections products POST]', e)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// DELETE /api/collections/:id/products/:productId
router.delete('/:id/products/:productId', async (req, res) => {
  try {
    await prisma.productCollection.deleteMany({ where: { collectionId: req.params.id, productId: req.params.productId } })
    return res.status(204).end()
  } catch (e) {
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// ── Autollenado por palabras clave ────────────────────────────────────────────
// Busca por NOMBRE de producto (sin acentos, palabra completa) entre los productos
// activos y visibles de TODOS los proveedores. Máx. `perProvider` por proveedor para
// que ninguno la acapare. Solo agrega; nunca quita lo que ya tiene.
// En las palabras clave, `%` es comodín: "boligrafo%azul".
const regexEscape = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const stripAccents = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '')

export function keywordPatterns(matchKeywords) {
  return (matchKeywords ?? '')
    .split(',')
    .map(k => stripAccents(k.trim().toLowerCase()))
    .filter(k => k.length >= 2)
    .map(k => `\\y${regexEscape(k).replace(/%/g, '.*')}\\y`)
}

// POST /api/collections/:id/autofill  { perProvider?: number, dryRun?: boolean }
router.post('/:id/autofill', async (req, res) => {
  const perProvider = Math.min(1000, Math.max(1, parseInt(req.body?.perProvider ?? '150')))
  try {
    const collection = await prisma.collection.findUnique({ where: { id: req.params.id }, select: { matchKeywords: true } })
    if (!collection) return res.status(404).json({ error: 'Not found' })
    const patterns = keywordPatterns(collection.matchKeywords)
    if (!patterns.length) return res.status(400).json({ error: 'Esta recomendación no tiene palabras clave' })

    const matches = await prisma.$queryRaw`
      SELECT id, provider FROM (
        SELECT p.id, pr.name AS provider,
               ROW_NUMBER() OVER (PARTITION BY p."providerId" ORDER BY p.name) AS rn
        FROM promo_panel."Product" p
        JOIN promo_panel."Provider" pr ON pr.id = p."providerId"
        WHERE p."isActive" = true AND p."isVisible" = true
          AND translate(p.name, 'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunAEIOUUN') ~* ANY(${patterns}::text[])
      ) t WHERE rn <= ${perProvider}`

    const byProvider = {}
    for (const m of matches) byProvider[m.provider] = (byProvider[m.provider] ?? 0) + 1

    let added = 0
    if (!req.body?.dryRun && matches.length) {
      const r = await prisma.productCollection.createMany({
        data: matches.map(m => ({ collectionId: req.params.id, productId: m.id })),
        skipDuplicates: true,
      })
      added = r.count
    }
    return res.json({ matched: matches.length, added, byProvider, dryRun: !!req.body?.dryRun })
  } catch (e) {
    console.error('[collections autofill]', e)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
