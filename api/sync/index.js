import { PrismaClient } from '@prisma/client'
import { sync as syncPromoOption, testConnection as testPromoOption } from '../../lib/adapters/promoOption.js'
import { sync as syncInnovation, testConnection as testInnovation } from '../../lib/adapters/innovation.js'
import { sync as syncFourPromotional, testConnection as testFourPromotional } from '../../lib/adapters/fourPromotional.js'
import { sync as syncDobleVela, testConnection as testDobleVela } from '../../lib/adapters/dobleVela.js'

const prisma = new PrismaClient()

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// Selecciona el adaptador según el slug del proveedor
function getAdapter(slug) {
  switch (slug) {
    case 'promo-option':      return { sync: syncPromoOption,      test: testPromoOption }
    case 'innovation':        return { sync: syncInnovation,        test: testInnovation }
    case '4promotional':      return { sync: syncFourPromotional,   test: testFourPromotional }
    case 'doble-vela':        return { sync: syncDobleVela,         test: testDobleVela }
    default:                  return null
  }
}

// Upsert productos normalizados en la BD
async function upsertProducts(providerId, normalizedProducts, prisma) {
  let added = 0
  let updated = 0

  for (const p of normalizedProducts) {
    const existing = await prisma.product.findUnique({
      where: { providerId_externalId: { providerId, externalId: p.externalId } },
    })

    const data = {
      name: p.name,
      description: p.description,
      basePrice: p.basePrice,
      stock: p.stock,
      isActive: true,
    }

    if (existing) {
      await prisma.product.update({ where: { id: existing.id }, data })
      updated++
    } else {
      const created = await prisma.product.create({
        data: {
          providerId,
          externalId: p.externalId,
          ...data,
        },
      })

      // Imágenes
      if (p.images?.length) {
        await prisma.productImage.createMany({
          data: p.images.map(img => ({ productId: created.id, url: img.url, isPrimary: img.isPrimary })),
        })
      }
      // Colores
      if (p.colors?.length) {
        await prisma.productColor.createMany({
          data: p.colors.map(c => ({ productId: created.id, colorName: c.colorName, hex: c.hex })),
        })
      }
      // Variantes
      if (p.variants?.length) {
        await prisma.productVariant.createMany({
          data: p.variants.map(v => ({ productId: created.id, size: v.size, material: v.material, minQty: v.minQty })),
        })
      }

      added++
    }
  }

  return { added, updated }
}

export default async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v))
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { providerId, action = 'sync' } = req.body
  if (!providerId) return res.status(400).json({ error: 'providerId requerido' })

  try {
    const provider = await prisma.provider.findUnique({ where: { id: providerId } })
    if (!provider) return res.status(404).json({ error: 'Proveedor no encontrado' })
    if (!provider.isActive) return res.status(400).json({ error: 'Proveedor inactivo' })
    if (provider.authType === 'MANUAL') {
      return res.status(400).json({ error: 'Este proveedor usa importación manual. Usa el endpoint de upload.' })
    }

    const adapter = getAdapter(provider.slug)
    if (!adapter) return res.status(400).json({ error: `Sin adaptador para slug: ${provider.slug}` })

    // ── Probar conexión ────────────────────────────────────────────
    if (action === 'test') {
      let result
      switch (provider.slug) {
        case 'promo-option':
          result = await testPromoOption(provider.apiUser, provider.apiPassword)
          break
        case 'innovation':
          result = await testInnovation(provider.apiKey)
          break
        case '4promotional':
          result = await testFourPromotional(provider.apiKey, provider.accountId)
          break
        case 'doble-vela':
          result = await testDobleVela(provider.apiUser, provider.apiPassword, provider.accountId)
          break
        default:
          result = { ok: false, message: 'Sin adaptador' }
      }
      return res.status(200).json(result)
    }

    // ── Sincronización completa ─────────────────────────────────────
    const logEntry = await prisma.syncLog.create({
      data: { providerId, status: 'SYNCING' },
    })

    await prisma.provider.update({
      where: { id: providerId },
      data: { syncStatus: 'SYNCING' },
    })

    try {
      const normalized = await adapter.sync(prisma, provider)
      const { added, updated } = await upsertProducts(providerId, normalized, prisma)
      const total = await prisma.product.count({ where: { providerId } })

      await prisma.syncLog.update({
        where: { id: logEntry.id },
        data: {
          status: 'SUCCESS',
          productsAdded: added,
          productsUpdated: updated,
          productsTotal: total,
          finishedAt: new Date(),
          message: `${added} nuevos, ${updated} actualizados`,
        },
      })

      await prisma.provider.update({
        where: { id: providerId },
        data: {
          syncStatus: 'SUCCESS',
          syncMessage: `${added} nuevos, ${updated} actualizados`,
          lastSync: new Date(),
          totalProducts: total,
        },
      })

      return res.status(200).json({
        success: true,
        productsAdded: added,
        productsUpdated: updated,
        productsTotal: total,
        syncedAt: new Date().toISOString(),
      })
    } catch (syncError) {
      const msg = syncError.message || 'Error desconocido'

      await prisma.syncLog.update({
        where: { id: logEntry.id },
        data: { status: 'ERROR', message: msg, finishedAt: new Date() },
      })

      await prisma.provider.update({
        where: { id: providerId },
        data: { syncStatus: 'ERROR', syncMessage: msg },
      })

      throw syncError
    }
  } catch (error) {
    console.error('[api/sync]', error)
    return res.status(500).json({ error: error.message || 'Sync falló' })
  } finally {
    await prisma.$disconnect()
  }
}
