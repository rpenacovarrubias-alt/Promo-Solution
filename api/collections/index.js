import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export default async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v))
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { id } = req.query

  try {
    // ── Single item ────────────────────────────────────────────────
    if (id) {
      if (req.method === 'GET') {
        const collection = await prisma.collection.findUnique({ where: { id } })
        if (!collection) return res.status(404).json({ error: 'Not found' })
        return res.status(200).json(collection)
      }

      if (req.method === 'PUT') {
        const { code, name, seoDescription, seoKeywords, isActive } = req.body
        const collection = await prisma.collection.update({
          where: { id },
          data: {
            ...(code !== undefined && { code: code.trim().toUpperCase() }),
            ...(name !== undefined && { name: name.trim() }),
            ...(seoDescription !== undefined && { seoDescription: seoDescription || null }),
            ...(seoKeywords !== undefined && { seoKeywords: seoKeywords || null }),
            ...(isActive !== undefined && { isActive }),
          },
        })
        return res.status(200).json(collection)
      }

      if (req.method === 'DELETE') {
        await prisma.collection.delete({ where: { id } })
        return res.status(204).end()
      }

      return res.status(405).json({ error: 'Method not allowed' })
    }

    // ── Collection ─────────────────────────────────────────────────
    if (req.method === 'GET') {
      const collections = await prisma.collection.findMany({ orderBy: { name: 'asc' } })
      return res.status(200).json(collections)
    }

    if (req.method === 'POST') {
      const { code, name, seoDescription, seoKeywords } = req.body
      if (!code || !name) return res.status(400).json({ error: 'code and name are required' })
      const collection = await prisma.collection.create({
        data: {
          code: code.trim().toUpperCase(),
          name: name.trim(),
          seoDescription: seoDescription || null,
          seoKeywords: seoKeywords || null,
          isActive: true,
        },
      })
      return res.status(201).json(collection)
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('[api/collections]', error)
    if (error.code === 'P2025') return res.status(404).json({ error: 'Not found' })
    if (error.code === 'P2002') return res.status(409).json({ error: 'El código ya existe' })
    return res.status(500).json({ error: 'Internal server error' })
  } finally {
    await prisma.$disconnect()
  }
}
