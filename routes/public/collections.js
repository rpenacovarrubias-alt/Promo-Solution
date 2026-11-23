import { Router } from 'express'
import prisma from '../_db.js'

const router = Router()

const visibleProducts = { product: { isActive: true, isVisible: true } }

const shape = c => ({
  id: c.id,
  code: c.code,
  name: c.name,
  icon: c.icon,
  description: c.seoDescription,
  productCount: c._count.products,
})

const select = {
  id: true, code: true, name: true, icon: true, seoDescription: true,
  _count: { select: { products: { where: visibleProducts } } },
}

// GET /api/public/collections — "Recomendaciones" activas con al menos 1 producto visible
router.get('/', async (req, res) => {
  try {
    const rows = await prisma.collection.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select,
    })
    return res.json(rows.filter(c => c._count.products > 0).map(shape))
  } catch (e) {
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// GET /api/public/collections/:code — los productos se piden a /api/public/products?collectionId=
router.get('/:code', async (req, res) => {
  try {
    const row = await prisma.collection.findFirst({ where: { code: req.params.code.toUpperCase(), isActive: true }, select })
    if (!row) return res.status(404).json({ error: 'Recomendación no encontrada' })
    return res.json(shape(row))
  } catch (e) {
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
})

export default router
