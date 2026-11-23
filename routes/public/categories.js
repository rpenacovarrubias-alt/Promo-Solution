import { Router } from 'express'
import prisma from '../_db.js'

const router = Router()

// Lista plana con parentId (el sitio arma el árbol). Una categoría principal cuenta
// sus productos + los de sus subcategorías; una subcategoría sin productos activos
// no se publica (se van llenando conforme se clasifican productos en el admin).
router.get('/', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: { _count: { select: { products: { where: { isActive: true, isVisible: true } } } } },
      orderBy: { name: 'asc' },
    })
    const childTotal = new Map()
    for (const c of categories) {
      if (c.parentId) childTotal.set(c.parentId, (childTotal.get(c.parentId) ?? 0) + c._count.products)
    }
    return res.json(
      categories
        .map(c => ({
          id: c.id,
          name: c.name,
          parentId: c.parentId,
          productCount: c._count.products + (childTotal.get(c.id) ?? 0),
        }))
        .filter(c => !c.parentId || c.productCount > 0),
    )
  } catch (e) {
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
})

export default router
