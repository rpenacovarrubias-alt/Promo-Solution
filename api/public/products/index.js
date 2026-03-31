/**
 * API Pública — Productos
 * Promo Solution
 *
 * GET  /api/public/products          → catálogo paginado con filtros
 * GET  /api/public/products/:id      → detalle completo de un producto
 *
 * Headers requeridos:
 *   X-API-Key: <PUBLIC_API_KEY>
 *
 * Query params (GET collection):
 *   search     — búsqueda en nombre y descripción
 *   categoryId — filtrar por categoría
 *   providerId — filtrar por proveedor
 *   page       — página (default: 1)
 *   limit      — resultados por página (default: 20, máx: 100)
 */

import { PrismaClient } from '@prisma/client'
import { validateApiKey, PUBLIC_CORS } from '../../_lib/auth.js'

const prisma = new PrismaClient()

// Aplica el % de utilidad de la categoría al precio base
function calcFinalPrice(basePrice, utilityPercent) {
  const base = parseFloat(basePrice)
  const pct  = parseFloat(utilityPercent ?? 0)
  return parseFloat((base * (1 + pct / 100)).toFixed(2))
}

function formatProduct(p) {
  return {
    id:          p.id,
    name:        p.name,
    description: p.description ?? null,
    basePrice:   parseFloat(p.basePrice),
    finalPrice:  calcFinalPrice(p.basePrice, p.category?.utilityPercent),
    isActive:    p.isActive,
    stock:       p.stock ?? null,
    category: p.category
      ? { id: p.category.id, name: p.category.name }
      : null,
    provider: p.provider
      ? { id: p.provider.id, name: p.provider.name, slug: p.provider.slug }
      : null,
    images: (p.images ?? [])
      .sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0))
      .map(img => ({ url: img.url, isPrimary: img.isPrimary })),
    colors: (p.colors ?? []).map(c => ({ name: c.colorName, hex: c.hex ?? null })),
    variants: (p.variants ?? []).map(v => ({
      size:     v.size ?? null,
      material: v.material ?? null,
      minQty:   v.minQty,
    })),
  }
}

export default async function handler(req, res) {
  Object.entries(PUBLIC_CORS).forEach(([k, v]) => res.setHeader(k, v))
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET')    return res.status(405).json({ error: 'Método no permitido' })

  const auth = validateApiKey(req)
  if (!auth.ok) return res.status(401).json({ error: auth.error })

  const { id } = req.query

  try {
    // ── Detalle de un producto ────────────────────────────────────────────
    if (id) {
      const product = await prisma.product.findUnique({
        where: { id },
        include: {
          provider: { select: { id: true, name: true, slug: true } },
          category: { select: { id: true, name: true, utilityPercent: true } },
          images:   true,
          colors:   true,
          variants: true,
        },
      })

      if (!product || !product.isActive) {
        return res.status(404).json({ error: 'Producto no encontrado' })
      }

      return res.status(200).json(formatProduct(product))
    }

    // ── Catálogo paginado ─────────────────────────────────────────────────
    const {
      search,
      categoryId,
      providerId,
      page  = '1',
      limit = '20',
    } = req.query

    const pageNum  = Math.max(1, parseInt(page))
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)))
    const skip     = (pageNum - 1) * limitNum

    const where = {
      isActive: true,
      ...(categoryId && { categoryId }),
      ...(providerId && { providerId }),
      ...(search && {
        OR: [
          { name:        { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          provider: { select: { id: true, name: true, slug: true } },
          category: { select: { id: true, name: true, utilityPercent: true } },
          images:   { where: { isPrimary: true }, take: 1 },
          colors:   { take: 5 },
          variants: { take: 3 },
        },
        orderBy: { name: 'asc' },
        skip,
        take: limitNum,
      }),
      prisma.product.count({ where }),
    ])

    const totalPages = Math.ceil(total / limitNum)

    return res.status(200).json({
      data: products.map(formatProduct),
      pagination: {
        page:       pageNum,
        limit:      limitNum,
        total,
        totalPages,
        hasNext:    pageNum < totalPages,
        hasPrev:    pageNum > 1,
      },
    })
  } catch (error) {
    console.error('[api/public/products]', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  } finally {
    await prisma.$disconnect()
  }
}
