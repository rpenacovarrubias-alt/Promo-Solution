import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

/**
 * Placeholder sync logic.
 * In production, this would:
 * 1. Fetch the provider's API catalog
 * 2. Upsert products, images, colors, variants into the DB
 * 3. Return the count of synced products
 */
export default async function handler(req, res) {
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v))

  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { providerId } = req.body
  if (!providerId) {
    return res.status(400).json({ error: 'providerId is required' })
  }

  try {
    const provider = await prisma.provider.findUnique({ where: { id: providerId } })
    if (!provider) return res.status(404).json({ error: 'Provider not found' })
    if (!provider.isActive) return res.status(400).json({ error: 'Provider is inactive' })

    // --- Placeholder: simulate API call to provider ---
    // In a real implementation:
    // const catalogResponse = await fetch(provider.apiUrl, {
    //   headers: { Authorization: `Bearer ${provider.apiKey}` }
    // })
    // const catalog = await catalogResponse.json()
    // for (const item of catalog.products) {
    //   await prisma.product.upsert({
    //     where: { providerId_externalId: { providerId: provider.id, externalId: item.id } },
    //     create: { ...mapProduct(item, provider.id) },
    //     update: { ...mapProduct(item, provider.id) },
    //   })
    // }

    // Simulate sync delay
    await new Promise((r) => setTimeout(r, 500))

    // Update provider's updatedAt timestamp
    await prisma.provider.update({
      where: { id: providerId },
      data: { updatedAt: new Date() },
    })

    const productCount = await prisma.product.count({ where: { providerId } })

    return res.status(200).json({
      success: true,
      providerId,
      providerName: provider.name,
      synced: productCount,
      syncedAt: new Date().toISOString(),
      message: 'Sync completed (placeholder — connect real API to fetch products)',
    })
  } catch (error) {
    console.error('[api/sync]', error)
    return res.status(500).json({ error: 'Sync failed' })
  } finally {
    await prisma.$disconnect()
  }
}
