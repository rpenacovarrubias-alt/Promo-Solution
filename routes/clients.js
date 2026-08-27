import { Router } from 'express'
import * as XLSX from 'xlsx'
import prisma from './_db.js'

const router = Router()

// GET /api/clients
router.get('/', async (req, res) => {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { quotes: true } } },
    })
    return res.json(clients)
  } catch (e) {
    console.error('[clients GET]', e)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/clients
router.post('/', async (req, res) => {
  const { name, email, phone, company, markupPercent } = req.body
  if (!name || !email) return res.status(400).json({ error: 'name and email are required' })
  try {
    const client = await prisma.client.create({
      data: {
        name, email,
        phone: phone || null,
        company: company || null,
        markupPercent: markupPercent ? parseFloat(markupPercent) : 33,
      },
    })
    return res.status(201).json(client)
  } catch (e) {
    if (e.code === 'P2002') return res.status(409).json({ error: 'Email already exists' })
    console.error('[clients POST]', e)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/clients/excel
router.get('/excel', async (req, res) => {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { quotes: true } } },
    })
    const rows = clients.map((c, i) => ({
      Folio: `CLTE-${String(i + 1).padStart(5, '0')}`,
      Nombre: c.name,
      Empresa: c.company || '',
      Email: c.email,
      Teléfono: c.phone || '',
      '% Desc.': parseFloat(c.markupPercent),
      Estado: c.status,
      Cotizaciones: c._count.quotes,
    }))
    const sheet = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, sheet, 'Clientes')
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', 'attachment; filename="clientes.xlsx"')
    res.send(buffer)
  } catch (e) {
    console.error('[clients Excel]', e)
    return res.status(500).json({ error: 'Error al generar Excel' })
  }
})

// GET /api/clients/:id
router.get('/:id', async (req, res) => {
  try {
    const client = await prisma.client.findUnique({
      where: { id: req.params.id },
      include: {
        quotes: { orderBy: { createdAt: 'desc' }, take: 10 },
        _count: { select: { quotes: true } },
      },
    })
    if (!client) return res.status(404).json({ error: 'Client not found' })
    return res.json(client)
  } catch (e) {
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// PUT /api/clients/:id
router.put('/:id', async (req, res) => {
  const { name, email, phone, company, markupPercent, status } = req.body
  try {
    const client = await prisma.client.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone: phone || null }),
        ...(company !== undefined && { company: company || null }),
        ...(markupPercent !== undefined && { markupPercent: parseFloat(markupPercent) }),
        ...(status !== undefined && { status }),
      },
    })
    return res.json(client)
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Client not found' })
    if (e.code === 'P2002') return res.status(409).json({ error: 'Email already exists' })
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// DELETE /api/clients/:id
router.delete('/:id', async (req, res) => {
  try {
    await prisma.client.delete({ where: { id: req.params.id } })
    return res.status(204).end()
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Client not found' })
    return res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
