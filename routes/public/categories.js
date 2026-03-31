import { Router } from 'express'
import prisma from '../_db.js'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: { _count: { select: { products: { where: { isActive: true } } } } },
      orderBy: { name: 'asc' },
    })
    return res.json(categories.map(c => ({ id: c.id, name: c.name, productCount: c._count.products })))
  } catch (e) {
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
})

export default router
