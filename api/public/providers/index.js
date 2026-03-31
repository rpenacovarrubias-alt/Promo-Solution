/**
 * API Pública — Proveedores
 * Promo Solution
 *
 * GET /api/public/providers  → lista de proveedores activos (sin credenciales)
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
    const providers = await prisma.provider.findMany({
      where: { isActive: true },
      select: {
        id:            true,
        name:          true,
        slug:          true,
        logo:          true,
        totalProducts: true,
        lastSync:      true,
      },
      orderBy: { name: 'asc' },
    })

    return res.status(200).json(providers)
  } catch (error) {
    console.error('[api/public/providers]', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  } finally {
    await prisma.$disconnect()
  }
}
