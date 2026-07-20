import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export default async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v))
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { slug, action } = req.query
  // action puede ser 'seo' o 'content' (viene de /api/pages/[slug]/seo y /api/pages/[slug]/content)

  try {
    if (req.method === 'GET') {
      const page = await prisma.page.findUnique({ where: { slug } })
      if (!page) return res.status(404).json({ error: 'Página no encontrada' })
      return res.status(200).json(page)
    }

    if (req.method === 'PUT') {
      let data = {}

      if (action === 'seo') {
        const { seoImageUrl, seoKeywords, seoDescription } = req.body
        if (seoImageUrl    !== undefined) data.seoImageUrl    = seoImageUrl
        if (seoKeywords    !== undefined) data.seoKeywords    = seoKeywords
        if (seoDescription !== undefined) data.seoDescription = seoDescription
      } else if (action === 'content') {
        data.extraContent = JSON.stringify(req.body.extraContent)
      } else {
        const { title, status } = req.body
        if (title  !== undefined) data.title  = title
        if (status !== undefined) data.status = status
      }

      const page = await prisma.page.update({ where: { slug }, data })
      return res.status(200).json(page)
    }

    if (req.method === 'DELETE') {
      const page = await prisma.page.findUnique({ where: { slug } })
      if (!page) return res.status(404).json({ error: 'Página no encontrada' })
      if (page.isSystem) return res.status(403).json({ error: 'No se puede eliminar una página del sistema' })
      await prisma.page.delete({ where: { slug } })
      return res.status(200).json({ ok: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('[api/pages/[slug]]', error)
    return res.status(500).json({ error: 'Internal server error' })
  } finally {
    await prisma.$disconnect()
  }
}
