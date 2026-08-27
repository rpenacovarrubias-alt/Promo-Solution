import { Router } from 'express'
import prisma from '../_db.js'

const router = Router()

// GET /api/public/services — catálogo de técnicas de impresión (Service),
// para que el sitio público pueda ofrecerlas al armar una cotización.
router.get('/', async (req, res) => {
  try {
    const services = await prisma.service.findMany({
      where: { isActive: true },
      select: { id: true, name: true, type: true, unitPrice: true, description: true, imageUrl: true },
      orderBy: { name: 'asc' },
    })
    return res.json(services.map((s) => ({ ...s, unitPrice: parseFloat(s.unitPrice) })))
  } catch (e) {
    console.error('[public/services GET]', e)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
})

export default router
