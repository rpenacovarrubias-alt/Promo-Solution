import { Router } from 'express'
import prisma from '../_db.js'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const providers = await prisma.provider.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true, logo: true, totalProducts: true, lastSync: true },
      orderBy: { name: 'asc' },
    })
    return res.json(providers)
  } catch (e) {
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
})

export default router
