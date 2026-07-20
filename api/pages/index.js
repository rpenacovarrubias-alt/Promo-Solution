import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

const SEED_PAGES = [
  { slug: 'inicio',   title: 'Inicio',   status: 'PUBLIC',   isSystem: true,  sortOrder: 0 },
  { slug: 'contacto', title: 'Contacto', status: 'PUBLIC',   isSystem: true,  sortOrder: 1 },
  { slug: 'nosotros', title: 'Nosotros', status: 'INACTIVE', isSystem: false, sortOrder: 2 },
]

async function seedPages() {
  for (const page of SEED_PAGES) {
    await prisma.page.upsert({ where: { slug: page.slug }, update: {}, create: page })
  }
}

export default async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v))
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    if (req.method === 'GET') {
      await seedPages()
      const pages = await prisma.page.findMany({ orderBy: { sortOrder: 'asc' } })
      return res.status(200).json(pages)
    }

    if (req.method === 'POST') {
      const { title } = req.body
      if (!title?.trim()) return res.status(400).json({ error: 'El título es requerido' })

      const slug = title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')

      if (!slug) return res.status(400).json({ error: 'Título inválido' })

      const exists = await prisma.page.findUnique({ where: { slug } })
      if (exists) return res.status(409).json({ error: 'Ya existe una página con esa URL' })

      const count = await prisma.page.count()
      const page = await prisma.page.create({
        data: { slug, title: title.trim(), status: 'INACTIVE', isSystem: false, sortOrder: count },
      })
      return res.status(201).json(page)
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('[api/pages]', error)
    return res.status(500).json({ error: 'Internal server error' })
  } finally {
    await prisma.$disconnect()
  }
}
