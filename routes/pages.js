import { Router } from 'express'
import prisma from './_db.js'

const router = Router()

// Páginas del sistema — se crean automáticamente si no existen
const SEED_PAGES = [
  { slug: 'inicio',    title: 'Inicio',    status: 'PUBLIC',   isSystem: true,  sortOrder: 0 },
  { slug: 'contacto',  title: 'Contacto',  status: 'PUBLIC',   isSystem: true,  sortOrder: 1 },
  { slug: 'nosotros',  title: 'Nosotros',  status: 'INACTIVE', isSystem: false, sortOrder: 2 },
]

async function seedPages() {
  for (const page of SEED_PAGES) {
    await prisma.page.upsert({
      where:  { slug: page.slug },
      update: {},
      create: page,
    })
  }
}

// GET /api/pages — lista todas las páginas
router.get('/', async (req, res) => {
  try {
    await seedPages()
    const pages = await prisma.page.findMany({ orderBy: { sortOrder: 'asc' } })
    return res.json(pages)
  } catch (e) {
    console.error('[pages GET /]', e)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/pages — crear nueva página
router.post('/', async (req, res) => {
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

  if (!slug) return res.status(400).json({ error: 'Título inválido para generar URL' })

  try {
    const exists = await prisma.page.findUnique({ where: { slug } })
    if (exists) return res.status(409).json({ error: 'Ya existe una página con esa URL' })

    const count = await prisma.page.count()
    const page = await prisma.page.create({
      data: { slug, title: title.trim(), status: 'INACTIVE', isSystem: false, sortOrder: count },
    })
    return res.status(201).json(page)
  } catch (e) {
    console.error('[pages POST /]', e)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/pages/:slug — obtener una página
router.get('/:slug', async (req, res) => {
  try {
    const page = await prisma.page.findUnique({ where: { slug: req.params.slug } })
    if (!page) return res.status(404).json({ error: 'Página no encontrada' })
    return res.json(page)
  } catch (e) {
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// PUT /api/pages/:slug — actualizar título y estatus
router.put('/:slug', async (req, res) => {
  const { title, status } = req.body
  const data = {}
  if (title !== undefined) data.title = title
  if (status !== undefined) data.status = status
  try {
    const page = await prisma.page.update({ where: { slug: req.params.slug }, data })
    return res.json(page)
  } catch (e) {
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// PUT /api/pages/:slug/seo — actualizar datos SEO
router.put('/:slug/seo', async (req, res) => {
  const { seoImageUrl, seoKeywords, seoDescription } = req.body
  const data = {}
  if (seoImageUrl    !== undefined) data.seoImageUrl    = seoImageUrl
  if (seoKeywords    !== undefined) data.seoKeywords    = seoKeywords
  if (seoDescription !== undefined) data.seoDescription = seoDescription
  try {
    const page = await prisma.page.update({ where: { slug: req.params.slug }, data })
    return res.json(page)
  } catch (e) {
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// PUT /api/pages/:slug/content — actualizar secciones extra (Slider, Banner)
router.put('/:slug/content', async (req, res) => {
  const { extraContent } = req.body
  try {
    const page = await prisma.page.update({
      where: { slug: req.params.slug },
      data:  { extraContent: JSON.stringify(extraContent) },
    })
    return res.json(page)
  } catch (e) {
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// DELETE /api/pages/:slug — eliminar página (solo no-sistema)
router.delete('/:slug', async (req, res) => {
  try {
    const page = await prisma.page.findUnique({ where: { slug: req.params.slug } })
    if (!page) return res.status(404).json({ error: 'Página no encontrada' })
    if (page.isSystem) return res.status(403).json({ error: 'No se puede eliminar una página del sistema' })
    await prisma.page.delete({ where: { slug: req.params.slug } })
    return res.json({ ok: true })
  } catch (e) {
    return res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
