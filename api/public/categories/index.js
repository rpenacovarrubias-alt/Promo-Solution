/**
 * API Pública — Categorías
 * Promo Solution
 *
 * GET /api/public/categories  → lista de categorías con conteo de productos
 *
 * Headers requeridos:
 *   X-API-Key: <PUBLIC_API_KEY>
 */

import { PrismaClient } from '@prisma/client'
import { validateApiKey, PUBLIC_CORS } from '../../_lib/auth.js'

const prisma = new PrismaClient()

export default async function handler(req, res) {
  Object.entries(PUBLIC_CORS).forEach(([k, v]) => res.setHeader(k, v))
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET')    return res.status(405).json({ error: 'Método no permitido' })

  const auth = validateApiKey(req)
  if (!auth.ok) return res.status(401).json({ error: auth.error })

  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: { where: { isActive: true } } },
        },
      },
      orderBy: { name: 'asc' },
    })

    return res.status(200).json(
      categories.map(c => ({
        id:           c.id,
        name:         c.name,
        productCount: c._count.products,
      }))
    )
  } catch (error) {
    console.error('[api/public/categories]', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  } finally {
    await prisma.$disconnect()
  }
}
